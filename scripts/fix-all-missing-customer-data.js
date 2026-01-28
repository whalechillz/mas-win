/**
 * 누락된 고객 데이터 모두 입력하고 수정 스크립트
 * 
 * 작업 내용:
 * 1. Storage의 originals/customers 폴더 스캔
 * 2. customers 테이블과 비교하여 누락된 고객 확인
 * 3. 누락된 이미지들을 image_assets에 등록
 * 4. ai_tags에 customer-{id} 태그 추가
 * 5. cdn_url 생성/업데이트
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
 * Storage에서 고객 폴더 목록 조회
 */
async function getCustomerFolders() {
  console.log('1️⃣ Storage에서 고객 폴더 목록 조회...');
  
  const { data: folders, error } = await supabase.storage
    .from(bucketName)
    .list('originals/customers', {
      limit: 10000,
      sortBy: { column: 'name', order: 'asc' }
    });
  
  if (error) {
    console.error('❌ 폴더 목록 조회 오류:', error);
    return [];
  }
  
  // 폴더만 필터링 (파일 제외)
  const customerFolders = folders?.filter(f => !f.name.endsWith('.')) || [];
  console.log(`✅ ${customerFolders.length}개의 고객 폴더 발견\n`);
  
  return customerFolders;
}

/**
 * 특정 고객 폴더의 모든 이미지 파일 조회 (재귀적)
 */
async function getCustomerImages(folderName) {
  const folderPath = `originals/customers/${folderName}`;
  const allFiles = [];
  
  // 재귀적으로 모든 하위 폴더 스캔
  async function scanFolder(path) {
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
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'];
        const videoExtensions = ['mp4', 'mov', 'avi', 'webm', 'mkv'];
        
        if (imageExtensions.includes(ext) || videoExtensions.includes(ext)) {
          allFiles.push({
            name: item.name,
            path: itemPath,
            size: item.metadata?.size || 0,
            updated_at: item.updated_at,
            isVideo: videoExtensions.includes(ext)
          });
        }
      }
    }
  }
  
  await scanFolder(folderPath);
  return allFiles;
}

/**
 * image_assets에 이미지 등록 (없는 경우만)
 */
async function ensureImageAsset(filePath, folderName, customerId) {
  // file_path로 이미 존재하는지 확인
  const { data: existing, error: checkError } = await supabase
    .from('image_assets')
    .select('id, cdn_url, ai_tags')
    .eq('file_path', filePath)
    .maybeSingle();
  
  if (checkError && checkError.code !== 'PGRST116') {
    console.warn(`⚠️ 조회 오류 (${filePath}):`, checkError.message);
    return null;
  }
  
  // Public URL 생성
  const { data: { publicUrl } } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);
  
  if (existing) {
    // 이미 존재하는 경우: ai_tags만 업데이트
    const tags = existing.ai_tags || [];
    const customerTag = `customer-${customerId}`;
    
    if (!Array.isArray(tags) || !tags.includes(customerTag)) {
      const newTags = Array.isArray(tags) ? [...tags, customerTag] : [customerTag];
      const uniqueTags = [...new Set(newTags)];
      
      const { error: updateError } = await supabase
        .from('image_assets')
        .update({ 
          ai_tags: uniqueTags,
          cdn_url: existing.cdn_url || publicUrl // cdn_url이 없으면 추가
        })
        .eq('id', existing.id);
      
      if (updateError) {
        console.warn(`⚠️ 태그 업데이트 실패 (${existing.id}):`, updateError.message);
      }
    }
    
    return existing.id;
  } else {
    // 새로 등록
    const fileName = filePath.split('/').pop();
    const ext = fileName.toLowerCase().split('.').pop();
    const isVideo = ['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(ext);
    
    const newAsset = {
      file_path: filePath,
      cdn_url: publicUrl,
      filename: fileName,
      original_filename: fileName,
      ai_tags: [`customer-${customerId}`],
      format: ext,
      mime_type: isVideo ? `video/${ext}` : `image/${ext === 'jpg' ? 'jpeg' : ext}`,
      upload_source: 'customer-migration',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: inserted, error: insertError } = await supabase
      .from('image_assets')
      .insert(newAsset)
      .select('id')
      .single();
    
    if (insertError) {
      console.warn(`⚠️ 등록 실패 (${filePath}):`, insertError.message);
      return null;
    }
    
    return inserted.id;
  }
}

/**
 * 메인 마이그레이션 함수
 */
async function fixAllMissingCustomerData() {
  console.log('🚀 누락된 고객 데이터 모두 입력하고 수정 시작...\n');
  console.log('='.repeat(80));
  
  // 1. customers 테이블에서 folder_name -> customer_id 매핑 생성
  console.log('\n1️⃣ customers 테이블에서 folder_name 매핑 생성...');
  const { data: allCustomers, error: customersError } = await supabase
    .from('customers')
    .select('id, name, folder_name');
  
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
  
  // 2. Storage에서 고객 폴더 목록 조회
  const customerFolders = await getCustomerFolders();
  
  if (customerFolders.length === 0) {
    console.log('⚠️ 고객 폴더가 없습니다.');
    return;
  }
  
  // 3. 각 고객 폴더의 이미지 처리
  console.log('3️⃣ 각 고객 폴더의 이미지 처리 시작...\n');
  
  const stats = {
    total: customerFolders.length,
    processed: 0,
    skipped: 0,
    imagesFound: 0,
    imagesRegistered: 0,
    imagesUpdated: 0,
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
      // 고객 폴더의 모든 이미지 조회
      const images = await getCustomerImages(folderName);
      
      if (images.length === 0) {
        console.log(`   ⏭️  이미지 없음`);
        stats.skipped++;
        continue;
      }
      
      stats.imagesFound += images.length;
      console.log(`   📸 이미지 ${images.length}개 발견`);
      
      // 각 이미지 처리
      let registered = 0;
      let updated = 0;
      
      for (const image of images) {
        const existing = await ensureImageAsset(image.path, folderName, customerId);
        
        if (existing) {
          // 기존 레코드 확인하여 업데이트 여부 판단
          const { data: asset } = await supabase
            .from('image_assets')
            .select('ai_tags, cdn_url')
            .eq('id', existing)
            .single();
          
          if (asset) {
            const tags = asset.ai_tags || [];
            const customerTag = `customer-${customerId}`;
            
            if (!Array.isArray(tags) || !tags.includes(customerTag) || !asset.cdn_url) {
              updated++;
            }
          }
          
          registered++;
        }
      }
      
      stats.imagesRegistered += registered;
      stats.imagesUpdated += updated;
      stats.processed++;
      
      if (registered > 0 || updated > 0) {
        console.log(`   ✅ 등록: ${registered}개, 업데이트: ${updated}개`);
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
  console.log(`   등록/업데이트된 이미지: ${stats.imagesRegistered}개`);
  console.log(`   업데이트된 이미지: ${stats.imagesUpdated}개`);
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

fixAllMissingCustomerData().catch(console.error);
