/**
 * Storage의 실제 폴더를 기준으로 고객 이미지 원복
 * 
 * 방법:
 * 1. Storage의 originals/customers 폴더의 모든 하위 폴더 스캔
 * 2. 각 폴더의 모든 이미지 파일 찾기
 * 3. 폴더명에서 전화번호 마지막 4자리 추출
 * 4. customers 테이블에서 전화번호로 매칭
 * 5. image_assets에 등록 (없으면) 또는 업데이트 (있으면)
 * 6. ai_tags에 customer-{id} 태그 추가
 * 7. customers 테이블의 folder_name 업데이트
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

// 폴더명에서 전화번호 마지막 4자리 추출
function extractPhoneLast4(folderName) {
  const parts = folderName.split('-');
  if (parts.length >= 2) {
    const lastPart = parts[parts.length - 1];
    if (/^\d{4}$/.test(lastPart)) {
      return lastPart;
    }
  }
  return null;
}

// 전화번호 마지막 4자리로 고객 찾기
async function findCustomerByPhoneLast4(phoneLast4) {
  if (!phoneLast4) return null;
  
  const { data: customers, error } = await supabase
    .from('customers')
    .select('id, name, phone, folder_name')
    .limit(10000);
  
  if (error) {
    console.warn(`⚠️ 고객 조회 오류:`, error.message);
    return null;
  }
  
  const matches = (customers || []).filter(c => {
    if (!c.phone) return false;
    const phoneDigits = c.phone.replace(/-/g, '').replace(/\s/g, '');
    return phoneDigits.slice(-4) === phoneLast4;
  });
  
  if (matches.length === 1) {
    return matches[0];
  } else if (matches.length > 1) {
    // 가장 최근 고객 반환 (ID가 큰 것)
    return matches.sort((a, b) => b.id - a.id)[0];
  }
  
  return null;
}

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
        // 폴더가 없거나 접근 불가능한 경우 무시
        if (error.message.includes('not found') || error.statusCode === '404') {
          return;
        }
        console.warn(`⚠️ 폴더 스캔 오류 (${path}):`, error.message);
        return;
      }
      
      if (!items || items.length === 0) return;
      
      for (const item of items) {
        // Storage API는 폴더인지 파일인지 구분하는 방법이 다를 수 있음
        // item.id가 없거나 metadata가 있으면 파일로 간주
        const isFolder = !item.id && !item.metadata;
        
        if (isFolder || item.name.endsWith('/')) {
          // 폴더인 경우 재귀적으로 스캔
          const itemPath = item.name.endsWith('/') 
            ? `${path}/${item.name.slice(0, -1)}`
            : `${path}/${item.name}`;
          await scanFolder(itemPath);
        } else {
          // 파일인 경우
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
      console.warn(`⚠️ 스캔 오류 (${path}):`, error.message);
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
  
  // cdn_url로 이미 존재하는지 확인 (UNIQUE 제약조건)
  const { data: existingByUrl, error: checkErrorByUrl } = await supabase
    .from('image_assets')
    .select('id, cdn_url, ai_tags, file_path')
    .eq('cdn_url', publicUrl)
    .maybeSingle();
  
  // file_path로도 확인
  const { data: existingByPath, error: checkErrorByPath } = await supabase
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
    // 업데이트
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
      cdn_url: publicUrl, // UNIQUE 제약조건
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
    
    // upsert 사용 (cdn_url 기준)
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
    
    return { success: true, action: upserted ? 'inserted' : 'updated', id: upserted?.id };
  }
}

// file_path에서 날짜 추출 (YYYY-MM-DD 형식)
function extractDateFromPath(filePath) {
  const match = filePath.match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

async function restoreCustomerImagesFromStorageFolders() {
  console.log('🚀 Storage 실제 폴더 기준 고객 이미지 원복 시작...\n');
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
  
  // 2. customers 테이블 로드
  console.log('2️⃣ customers 테이블 로드...');
  const { data: allCustomers, error: customersError } = await supabase
    .from('customers')
    .select('id, name, phone, folder_name')
    .limit(10000);
  
  if (customersError) {
    console.error('❌ 고객 조회 오류:', customersError);
    return;
  }
  
  console.log(`✅ ${allCustomers?.length || 0}명의 고객 로드\n`);
  
  // 3. 각 폴더 처리
  console.log('3️⃣ 각 폴더의 이미지 원복 시작...\n');
  
  const stats = {
    total: customerFolders.length,
    matched: 0,
    unmatched: 0,
    folderNameUpdated: 0,
    imagesFound: 0,
    imagesInserted: 0,
    imagesUpdated: 0,
    imagesNoChange: 0,
    errors: 0
  };
  
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  for (let i = 0; i < customerFolders.length; i++) {
    const folder = customerFolders[i];
    const folderName = folder.name;
    const folderPath = `originals/customers/${folderName}`;
    
    // 너무 많은 요청 방지를 위한 딜레이
    if (i > 0 && i % 10 === 0) {
      console.log(`   ⏸️  잠시 대기 중... (${i}/${customerFolders.length})`);
      await delay(2000);
    }
    
    console.log(`[${i + 1}/${customerFolders.length}] 📁 ${folderName}`);
    
    // 전화번호 마지막 4자리 추출
    const phoneLast4 = extractPhoneLast4(folderName);
    
    if (!phoneLast4) {
      console.log(`   ⚠️  전화번호 마지막 4자리를 추출할 수 없음\n`);
      stats.unmatched++;
      continue;
    }
    
    console.log(`   전화번호 마지막 4자리: ${phoneLast4}`);
    
    // 고객 찾기
    const customer = await findCustomerByPhoneLast4(phoneLast4);
    
    if (!customer) {
      console.log(`   ⚠️  매칭되는 고객 없음\n`);
      stats.unmatched++;
      continue;
    }
    
    console.log(`   ✅ 매칭된 고객: ${customer.name} (ID: ${customer.id}, 전화: ${customer.phone})`);
    
    // folder_name 업데이트
    if (customer.folder_name !== folderName) {
      const { error: updateError } = await supabase
        .from('customers')
        .update({ folder_name: folderName })
        .eq('id', customer.id);
      
      if (updateError) {
        console.warn(`   ⚠️  folder_name 업데이트 실패:`, updateError.message);
      } else {
        console.log(`   ✅ folder_name 업데이트: ${customer.folder_name || '없음'} → ${folderName}`);
        stats.folderNameUpdated++;
      }
    }
    
    stats.matched++;
    
    // 폴더의 모든 이미지 파일 찾기
    const imageFiles = await getAllFilesInStorageFolder(folderPath);
    
    if (imageFiles.length === 0) {
      console.log(`   ⏭️  이미지 없음\n`);
      continue;
    }
    
    stats.imagesFound += imageFiles.length;
    console.log(`   📸 이미지 ${imageFiles.length}개 발견`);
    
    // 각 이미지 처리
    let inserted = 0;
    let updated = 0;
    let noChange = 0;
    let errors = 0;
    
    const batchSize = 10;
    for (let j = 0; j < imageFiles.length; j += batchSize) {
      const batch = imageFiles.slice(j, j + batchSize);
      
      for (const imageFile of batch) {
        // file_path에서 날짜 추출
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
      
      // 배치마다 짧은 딜레이
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
    
    console.log('');
  }
  
  // 4. 최종 통계
  console.log('\n' + '='.repeat(80));
  console.log('📊 최종 통계:');
  console.log('='.repeat(80));
  console.log(`   총 고객 폴더: ${stats.total}개`);
  console.log(`   ✅ 매칭 성공: ${stats.matched}개`);
  console.log(`   ⚠️  매칭 실패: ${stats.unmatched}개`);
  console.log(`   📝 folder_name 업데이트: ${stats.folderNameUpdated}개`);
  console.log(`   📸 발견된 이미지: ${stats.imagesFound}개`);
  console.log(`   ➕ 새로 등록: ${stats.imagesInserted}개`);
  console.log(`   🔄 업데이트: ${stats.imagesUpdated}개`);
  console.log(`   ✅ 변경없음: ${stats.imagesNoChange}개`);
  console.log(`   ❌ 오류: ${stats.errors}개`);
  console.log('='.repeat(80));
  
  // 5. 검증
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

restoreCustomerImagesFromStorageFolders().catch(console.error);
