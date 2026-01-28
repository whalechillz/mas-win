/**
 * Storage의 모든 고객 이미지를 image_assets에 마이그레이션
 * 
 * 목표: Storage의 97개 고객 폴더의 모든 이미지를 image_assets 테이블에 등록
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

/**
 * 재귀적으로 폴더의 모든 이미지 파일 조회
 */
async function getAllFilesInFolder(folderPath) {
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
        console.warn(`⚠️ 폴더 스캔 오류 (${path}):`, error.message);
        return;
      }
      
      if (!items) return;
      
      for (const item of items) {
        const itemPath = `${path}/${item.name}`;
        
        if (item.name.endsWith('/')) {
          // 폴더인 경우 재귀적으로 스캔
          await scanFolder(itemPath);
        } else {
          // 파일인 경우
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
      console.warn(`⚠️ 스캔 오류 (${path}):`, error.message);
    }
  }
  
  await scanFolder(folderPath);
  return allFiles;
}

/**
 * image_assets에 이미지 등록 또는 업데이트
 */
async function ensureImageAsset(file, customerId) {
  const filePath = file.path;
  
  // file_path로 이미 존재하는지 확인
  const { data: existing, error: checkError } = await supabase
    .from('image_assets')
    .select('id, cdn_url, ai_tags')
    .eq('file_path', filePath)
    .maybeSingle();
  
  if (checkError && checkError.code !== 'PGRST116') {
    console.warn(`⚠️ 조회 오류 (${filePath}):`, checkError.message);
    return { success: false, error: checkError.message };
  }
  
  // Public URL 생성
  const { data: { publicUrl } } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);
  
  const customerTag = `customer-${customerId}`;
  
  if (existing) {
    // 이미 존재하는 경우: ai_tags와 cdn_url 업데이트
    const tags = existing.ai_tags || [];
    const newTags = Array.isArray(tags) ? [...tags] : [];
    
    if (!newTags.includes(customerTag)) {
      newTags.push(customerTag);
    }
    
    const uniqueTags = [...new Set(newTags)];
    const needsUpdate = 
      !existing.cdn_url || 
      JSON.stringify(uniqueTags.sort()) !== JSON.stringify((tags || []).sort());
    
    if (needsUpdate) {
      const { error: updateError } = await supabase
        .from('image_assets')
        .update({ 
          ai_tags: uniqueTags,
          cdn_url: existing.cdn_url || publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
      
      if (updateError) {
        console.warn(`⚠️ 업데이트 실패 (${existing.id}):`, updateError.message);
        return { success: false, error: updateError.message };
      }
      
      return { success: true, action: 'updated', id: existing.id };
    }
    
    return { success: true, action: 'no_change', id: existing.id };
  } else {
    // 새로 등록
    const fileName = file.name;
    const ext = file.extension;
    const isVideo = file.isVideo;
    
    const mimeType = isVideo 
      ? `video/${ext === 'mov' ? 'quicktime' : ext}`
      : `image/${ext === 'jpg' ? 'jpeg' : ext === 'heic' || ext === 'heif' ? 'heic' : ext}`;
    
    const newAsset = {
      file_path: filePath,
      cdn_url: publicUrl,
      filename: fileName,
      original_filename: fileName,
      english_filename: fileName,
      ai_tags: [customerTag],
      format: ext,
      mime_type: mimeType,
      upload_source: 'customer-migration',
      status: 'active',
      file_size: file.size,
      created_at: file.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: inserted, error: insertError } = await supabase
      .from('image_assets')
      .insert(newAsset)
      .select('id')
      .single();
    
    if (insertError) {
      console.warn(`⚠️ 등록 실패 (${filePath}):`, insertError.message);
      return { success: false, error: insertError.message };
    }
    
    return { success: true, action: 'inserted', id: inserted.id };
  }
}

/**
 * 메인 마이그레이션 함수
 */
async function migrateAllCustomerImages() {
  console.log('🚀 Storage의 모든 고객 이미지 마이그레이션 시작...\n');
  console.log('='.repeat(80));
  
  // 1. Storage에서 고객 폴더 목록 조회
  console.log('\n1️⃣ Storage에서 고객 폴더 목록 조회...');
  const { data: folders, error: foldersError } = await supabase.storage
    .from(bucketName)
    .list('originals/customers', {
      limit: 10000,
      sortBy: { column: 'name', order: 'asc' }
    });
  
  if (foldersError) {
    console.error('❌ 폴더 목록 조회 오류:', foldersError);
    return;
  }
  
  const customerFolders = folders?.filter(f => 
    !f.name.endsWith('.') && 
    f.name !== '.keep.png' &&
    !f.name.startsWith('.')
  ) || [];
  
  console.log(`✅ ${customerFolders.length}개의 고객 폴더 발견\n`);
  
  // 2. customers 테이블에서 folder_name 매핑
  console.log('2️⃣ customers 테이블에서 folder_name 매핑 생성...');
  const { data: allCustomers, error: customersError } = await supabase
    .from('customers')
    .select('id, name, folder_name')
    .not('folder_name', 'is', null)
    .limit(10000);
  
  if (customersError) {
    console.error('❌ 고객 조회 오류:', customersError);
    return;
  }
  
  const folderNameToCustomerId = new Map();
  const customerIdToName = new Map();
  allCustomers?.forEach(c => {
    if (c.folder_name) {
      folderNameToCustomerId.set(c.folder_name, c.id);
      customerIdToName.set(c.id, c.name);
    }
  });
  
  console.log(`✅ ${folderNameToCustomerId.size}명의 고객 folder_name 로드\n`);
  
  // 3. 각 폴더의 이미지 마이그레이션
  console.log('3️⃣ 각 폴더의 이미지 마이그레이션 시작...\n');
  
  const stats = {
    total: customerFolders.length,
    processed: 0,
    skipped: 0,
    imagesFound: 0,
    imagesInserted: 0,
    imagesUpdated: 0,
    imagesNoChange: 0,
    errors: 0
  };
  
  for (let i = 0; i < customerFolders.length; i++) {
    const folder = customerFolders[i];
    const folderName = folder.name;
    const customerId = folderNameToCustomerId.get(folderName);
    
    if (!customerId) {
      console.log(`[${i + 1}/${customerFolders.length}] ⏭️  스킵: ${folderName} (고객 ID 없음)`);
      stats.skipped++;
      continue;
    }
    
    const customerName = customerIdToName.get(customerId);
    console.log(`[${i + 1}/${customerFolders.length}] 처리 중: ${customerName} (${folderName})`);
    
    try {
      // 폴더의 모든 이미지 조회
      const folderPath = `originals/customers/${folderName}`;
      const images = await getAllFilesInFolder(folderPath);
      
      if (images.length === 0) {
        console.log(`   ⏭️  이미지 없음`);
        stats.skipped++;
        continue;
      }
      
      stats.imagesFound += images.length;
      console.log(`   📸 이미지 ${images.length}개 발견`);
      
      // 각 이미지 처리
      let inserted = 0;
      let updated = 0;
      let noChange = 0;
      let errors = 0;
      
      for (const image of images) {
        const result = await ensureImageAsset(image, customerId);
        
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
        }
      }
      
      stats.imagesInserted += inserted;
      stats.imagesUpdated += updated;
      stats.imagesNoChange += noChange;
      stats.errors += errors;
      stats.processed++;
      
      if (inserted > 0 || updated > 0) {
        console.log(`   ✅ 등록: ${inserted}개, 업데이트: ${updated}개, 변경없음: ${noChange}개`);
      }
      if (errors > 0) {
        console.log(`   ⚠️  오류: ${errors}개`);
      }
      
    } catch (error) {
      console.error(`   ❌ 오류:`, error.message);
      stats.errors++;
    }
    
    // 진행 상황 출력 (10개마다)
    if ((i + 1) % 10 === 0) {
      console.log(`\n   📊 진행 상황: ${i + 1}/${customerFolders.length} 처리 완료\n`);
    }
  }
  
  // 4. 최종 통계
  console.log('\n' + '='.repeat(80));
  console.log('📊 최종 통계:');
  console.log('='.repeat(80));
  console.log(`   총 고객 폴더: ${stats.total}개`);
  console.log(`   처리 완료: ${stats.processed}개`);
  console.log(`   스킵: ${stats.skipped}개`);
  console.log(`   오류: ${stats.errors}개`);
  console.log(`   발견된 이미지: ${stats.imagesFound}개`);
  console.log(`   새로 등록: ${stats.imagesInserted}개`);
  console.log(`   업데이트: ${stats.imagesUpdated}개`);
  console.log(`   변경없음: ${stats.imagesNoChange}개`);
  console.log('='.repeat(80));
  
  // 5. 검증: 이미지 있는 고객 수 확인
  console.log('\n5️⃣ 검증: 이미지 있는 고객 수 확인...');
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

migrateAllCustomerImages().catch(console.error);
