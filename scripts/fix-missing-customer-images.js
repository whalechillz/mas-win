/**
 * image_metadata에는 있지만 image_assets에는 없는 고객 이미지 찾아서 마이그레이션
 * 
 * 안중철 같은 경우를 처리
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = 'blog-images';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 재귀적으로 Storage 폴더의 모든 이미지 파일 찾기
async function getAllFilesInStorageFolder(folderPath) {
  const allFiles = [];
  
  async function scanFolder(path) {
    try {
      const { data: items, error } = await supabase.storage
        .from(bucketName)
        .list(path, {
          limit: 1000,
          sortBy: { column: 'name', order: 'asc' }
        });
      
      if (error) {
        if (error.message.includes('not found') || error.statusCode === '404') {
          return;
        }
        return;
      }
      
      if (!items || items.length === 0) return;
      
      for (const item of items) {
        const isFolder = item.id === null && item.metadata === null;
        
        if (isFolder) {
          const folderPath = `${path}/${item.name}`;
          await scanFolder(folderPath);
        } else {
          const itemPath = `${path}/${item.name}`;
          const ext = item.name.toLowerCase().split('.').pop();
          const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'];
          const videoExtensions = ['mp4', 'mov', 'avi', 'webm', 'mkv', 'flv', 'm4v'];
          
          if (imageExtensions.includes(ext) || videoExtensions.includes(ext)) {
            allFiles.push({
              name: item.name,
              path: itemPath,
              size: item.metadata?.size || 0,
              updated_at: item.updated_at,
              created_at: item.created_at,
              isVideo: videoExtensions.includes(ext),
              extension: ext
            });
          }
        }
      }
    } catch (error) {
      // 무시
    }
  }
  
  await scanFolder(folderPath);
  return allFiles;
}

// image_assets에 이미지 등록 또는 업데이트
async function ensureImageAsset(file, customerId, visitDate) {
  const filePath = file.path;
  
  // Public URL 생성
  const { data: { publicUrl } } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);
  
  const customerTag = `customer-${customerId}`;
  const visitTag = visitDate ? `visit-${visitDate}` : null;
  
  // cdn_url로 이미 존재하는지 확인
  const { data: existingByUrl } = await supabase
    .from('image_assets')
    .select('id, cdn_url, ai_tags, file_path')
    .eq('cdn_url', publicUrl)
    .maybeSingle();
  
  // file_path로도 확인
  const { data: existingByPath } = await supabase
    .from('image_assets')
    .select('id, cdn_url, ai_tags, file_path')
    .eq('file_path', filePath)
    .maybeSingle();
  
  const existing = existingByUrl || existingByPath;
  
  // ai_tags 업데이트
  const tags = existing?.ai_tags || [];
  const newTags = Array.isArray(tags) ? [...tags] : [];
  
  if (!newTags.includes(customerTag)) {
    newTags.push(customerTag);
  }
  if (visitTag && !newTags.includes(visitTag)) {
    newTags.push(visitTag);
  }
  
  const uniqueTags = [...new Set(newTags)];
  const needsUpdate = existing && (
    !existing.cdn_url || 
    existing.cdn_url !== publicUrl ||
    JSON.stringify(uniqueTags.sort()) !== JSON.stringify((Array.isArray(tags) ? tags : []).sort()) ||
    existing.file_path !== filePath
  );
  
  if (existing) {
    if (needsUpdate) {
      const { error: updateError } = await supabase
        .from('image_assets')
        .update({ 
          ai_tags: uniqueTags,
          cdn_url: publicUrl,
          file_path: filePath,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
      
      if (updateError) {
        return { success: false, error: updateError.message };
      }
      
      return { success: true, action: 'updated', id: existing.id };
    }
    
    return { success: true, action: 'no_change', id: existing.id };
  } else {
    // 새로 등록 (upsert 사용)
    const fileName = file.name;
    const ext = file.extension;
    const isVideo = file.isVideo;
    
    const newAsset = {
      file_path: filePath,
      cdn_url: publicUrl,
      filename: fileName,
      ai_tags: uniqueTags,
      format: ext,
      mime_type: isVideo 
        ? `video/${ext === 'mov' ? 'quicktime' : ext}`
        : `image/${ext === 'jpg' ? 'jpeg' : ext === 'heic' || ext === 'heif' ? 'heic' : ext}`,
      upload_source: 'storage-folder-restore',
      status: 'active',
      file_size: file.size,
      created_at: file.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: upserted, error: upsertError } = await supabase
      .from('image_assets')
      .upsert(newAsset, {
        onConflict: 'cdn_url',
        ignoreDuplicates: false
      })
      .select('id')
      .single();
    
    if (upsertError) {
      return { success: false, error: upsertError.message };
    }
    
    return { success: true, action: 'inserted', id: upserted?.id };
  }
}

// file_path에서 날짜 추출
function extractDateFromPath(filePath) {
  const match = filePath.match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

async function fixMissingCustomerImages() {
  console.log('🚀 누락된 고객 이미지 마이그레이션 시작...\n');
  console.log('='.repeat(80));
  
  // 1. folder_name이 있는 모든 고객 조회
  console.log('\n1️⃣ folder_name이 있는 고객 조회...');
  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('id, name, phone, folder_name')
    .not('folder_name', 'is', null)
    .limit(10000);
  
  if (customersError) {
    console.error('❌ 고객 조회 오류:', customersError);
    return;
  }
  
  console.log(`✅ ${customers?.length || 0}명의 고객 로드\n`);
  
  // 2. 각 고객의 Storage 폴더 확인 및 이미지 마이그레이션
  console.log('2️⃣ 각 고객의 Storage 폴더 확인 및 이미지 마이그레이션...\n');
  
  const stats = {
    total: customers?.length || 0,
    processed: 0,
    imagesFound: 0,
    imagesInserted: 0,
    imagesUpdated: 0,
    imagesNoChange: 0,
    errors: 0
  };
  
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  for (let i = 0; i < (customers?.length || 0); i++) {
    const customer = customers[i];
    const folderName = customer.folder_name;
    const folderPath = `originals/customers/${folderName}`;
    
    if (i > 0 && i % 10 === 0) {
      console.log(`   ⏸️  잠시 대기 중... (${i}/${customers.length})`);
      await delay(2000);
    }
    
    // Storage 폴더의 모든 이미지 파일 찾기
    const imageFiles = await getAllFilesInStorageFolder(folderPath);
    
    if (imageFiles.length === 0) {
      continue; // 이미지 없으면 건너뛰기
    }
    
    stats.processed++;
    stats.imagesFound += imageFiles.length;
    
    console.log(`[${i + 1}/${customers.length}] 📁 ${customer.name} (${folderName}) - 이미지 ${imageFiles.length}개`);
    
    // 각 이미지 처리
    let inserted = 0;
    let updated = 0;
    let noChange = 0;
    let errors = 0;
    
    const batchSize = 10;
    for (let j = 0; j < imageFiles.length; j += batchSize) {
      const batch = imageFiles.slice(j, j + batchSize);
      
      for (const imageFile of batch) {
        const visitDate = extractDateFromPath(imageFile.path);
        
        const result = await ensureImageAsset(imageFile, customer.id, visitDate);
        
        if (result.success) {
          if (result.action === 'inserted') {
            inserted++;
          } else if (result.action === 'updated') {
            updated++;
          } else {
            noChange++;
          }
        } else {
          errors++;
          console.warn(`   ⚠️  처리 실패 (${imageFile.name}):`, result.error);
        }
      }
      
      if (j + batchSize < imageFiles.length) {
        await delay(500);
      }
    }
    
    stats.imagesInserted += inserted;
    stats.imagesUpdated += updated;
    stats.imagesNoChange += noChange;
    stats.errors += errors;
    
    if (inserted > 0 || updated > 0) {
      console.log(`   ✅ 등록: ${inserted}개, 업데이트: ${updated}개, 변경없음: ${noChange}개`);
    }
    if (errors > 0) {
      console.log(`   ⚠️  오류: ${errors}개`);
    }
  }
  
  // 3. 최종 통계
  console.log('\n' + '='.repeat(80));
  console.log('📊 최종 통계:');
  console.log('='.repeat(80));
  console.log(`   총 고객: ${stats.total}명`);
  console.log(`   처리된 고객: ${stats.processed}명`);
  console.log(`   📸 발견된 이미지: ${stats.imagesFound}개`);
  console.log(`   ➕ 새로 등록: ${stats.imagesInserted}개`);
  console.log(`   🔄 업데이트: ${stats.imagesUpdated}개`);
  console.log(`   ✅ 변경없음: ${stats.imagesNoChange}개`);
  console.log(`   ❌ 오류: ${stats.errors}개`);
  console.log('='.repeat(80));
  
  // 4. 검증
  console.log('\n4️⃣ 검증: 이미지 있는 고객 수 확인...');
  const { data: customersWithImages, error: verifyError } = await supabase
    .from('image_assets')
    .select('ai_tags')
    .not('ai_tags', 'is', null)
    .ilike('file_path', 'originals/customers/%');
  
  if (!verifyError && customersWithImages) {
    const customerIds = new Set();
    customersWithImages.forEach(img => {
      const tags = img.ai_tags || [];
      if (Array.isArray(tags)) {
        tags.forEach(tag => {
          if (typeof tag === 'string' && tag.startsWith('customer-')) {
            const customerId = parseInt(tag.replace('customer-', ''), 10);
            if (!isNaN(customerId)) {
              customerIds.add(customerId);
            }
          }
        });
      }
    });
    
    console.log(`✅ 이미지 있는 고객: ${customerIds.size}명\n`);
  }
  
  console.log('✅ 작업 완료!');
}

fixMissingCustomerImages().catch(console.error);
