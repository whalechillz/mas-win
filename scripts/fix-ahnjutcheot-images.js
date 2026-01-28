/**
 * 안중철 고객의 이미지 마이그레이션
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

async function fixAhnjutcheotImages() {
  console.log('🚀 안중철 고객 이미지 마이그레이션 시작...\n');
  
  // 안중철 고객 조회
  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('id, name, phone, folder_name')
    .ilike('name', '%안중철%')
    .limit(5);
  
  if (customersError) {
    console.error('❌ 고객 조회 오류:', customersError);
    return;
  }
  
  if (!customers || customers.length === 0) {
    console.error('❌ 안중철 고객을 찾을 수 없습니다');
    return;
  }
  
  const customer = customers[0];
  console.log(`✅ 고객 찾음: ${customer.name} (ID: ${customer.id}, 폴더: ${customer.folder_name})\n`);
  
  const folderPath = `originals/customers/${customer.folder_name}`;
  
  // Storage 폴더의 모든 이미지 파일 찾기
  console.log(`📁 Storage 폴더 스캔: ${folderPath}...`);
  const imageFiles = await getAllFilesInStorageFolder(folderPath);
  
  if (imageFiles.length === 0) {
    console.log('⚠️  이미지 파일을 찾을 수 없습니다');
    return;
  }
  
  console.log(`✅ 이미지 ${imageFiles.length}개 발견\n`);
  
  // 각 이미지 처리
  let inserted = 0;
  let updated = 0;
  let noChange = 0;
  let errors = 0;
  
  for (const imageFile of imageFiles) {
    console.log(`   처리 중: ${imageFile.name}`);
    const visitDate = extractDateFromPath(imageFile.path);
    
    const result = await ensureImageAsset(imageFile, customer.id, visitDate);
    
    if (result.success) {
      if (result.action === 'inserted') {
        inserted++;
        console.log(`   ✅ 등록됨`);
      } else if (result.action === 'updated') {
        updated++;
        console.log(`   🔄 업데이트됨`);
      } else {
        noChange++;
        console.log(`   ✓ 변경없음`);
      }
    } else {
      errors++;
      console.warn(`   ⚠️  처리 실패:`, result.error);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 최종 통계:');
  console.log('='.repeat(80));
  console.log(`   📸 발견된 이미지: ${imageFiles.length}개`);
  console.log(`   ➕ 새로 등록: ${inserted}개`);
  console.log(`   🔄 업데이트: ${updated}개`);
  console.log(`   ✅ 변경없음: ${noChange}개`);
  console.log(`   ❌ 오류: ${errors}개`);
  console.log('='.repeat(80));
  
  // 검증
  console.log('\n🔍 검증: image_assets에 등록된 이미지 확인...');
  const { data: images, error: verifyError } = await supabase
    .from('image_assets')
    .select('id, file_path, ai_tags')
    .or(`ai_tags.cs.{customer-${customer.id}}`);
  
  if (!verifyError && images) {
    console.log(`✅ image_assets에 등록된 이미지: ${images.length}개`);
    images.forEach(img => {
      console.log(`   - ${img.file_path}`);
    });
  }
  
  console.log('\n✅ 작업 완료!');
}

fixAhnjutcheotImages().catch(console.error);
