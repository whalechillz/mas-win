/**
 * 고객 썸네일 섞임 문제 디버깅 스크립트
 * 
 * 문제: 이미지가 없는 고객이 다른 고객의 이미지로 표시됨
 * 원인 확인: 썸네일 조회 로직에서 고객별 필터링이 정확한지 확인
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugCustomerThumbnailMixing() {
  console.log('🔍 고객 썸네일 섞임 문제 디버깅 시작...\n');
  
  // 1. 고객 정보 조회 (샘플 10명)
  console.log('1️⃣ 고객 정보 조회 (샘플 10명)...');
  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('id, name, folder_name')
    .limit(10);
  
  if (customersError) {
    console.error('❌ 고객 조회 오류:', customersError);
    return;
  }
  
  console.log(`✅ ${customers.length}명의 고객 발견\n`);
  
  // 2. 각 고객의 썸네일 조회 로직 테스트
  console.log('2️⃣ 각 고객의 썸네일 조회 로직 테스트...\n');
  
  for (const customer of customers) {
    const customerId = customer.id;
    const folderName = customer.folder_name;
    
    console.log(`📋 고객: ${customer.name} (ID: ${customerId}, 폴더: ${folderName || '없음'})`);
    
    // 썸네일 조회 쿼리 (customers/index.ts와 동일한 로직)
    let query = supabase
      .from('image_assets')
      .select('id, cdn_url, file_path, created_at');
    
    if (folderName) {
      query = query.ilike('file_path', `originals/customers/${folderName}/%`);
    } else {
      query = query.ilike('file_path', 'originals/customers/%');
    }
    
    // 동영상 제외
    query = query.not('file_path', 'ilike', '%.mp4%')
      .not('file_path', 'ilike', '%.mov%')
      .not('file_path', 'ilike', '%.avi%')
      .not('file_path', 'ilike', '%.webm%')
      .not('file_path', 'ilike', '%.mkv%');
    
    query = query.not('cdn_url', 'ilike', '%.mp4%')
      .not('cdn_url', 'ilike', '%.mov%')
      .not('cdn_url', 'ilike', '%.avi%')
      .not('cdn_url', 'ilike', '%.webm%')
      .not('cdn_url', 'ilike', '%.mkv%');
    
    const { data: latestImages, error: queryError } = await query
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (queryError) {
      console.log(`   ❌ 쿼리 오류: ${queryError.message}`);
      continue;
    }
    
    if (!latestImages || latestImages.length === 0) {
      console.log(`   ⚠️ 이미지 없음`);
    } else {
      // 이미지 필터링
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif', '.bmp'];
      const imageOnly = latestImages.filter(img => {
        const url = img.cdn_url || '';
        const lowerUrl = url.toLowerCase();
        return imageExtensions.some(ext => lowerUrl.includes(ext));
      });
      
      if (imageOnly.length > 0) {
        const thumbnail = imageOnly[0];
        console.log(`   ✅ 썸네일 발견: ${thumbnail.cdn_url?.substring(0, 100)}...`);
        console.log(`      file_path: ${thumbnail.file_path?.substring(0, 80)}...`);
        
        // file_path에서 고객 폴더명 확인
        if (thumbnail.file_path) {
          const match = thumbnail.file_path.match(/originals\/customers\/([^\/]+)\//);
          if (match) {
            const pathFolderName = match[1];
            if (pathFolderName !== folderName && folderName) {
              console.log(`   ⚠️ 경고: file_path의 폴더명(${pathFolderName})이 고객 폴더명(${folderName})과 다름!`);
            }
          }
        }
      } else {
        console.log(`   ⚠️ 이미지 없음 (동영상만 있음)`);
      }
    }
    console.log('');
  }
  
  // 3. folder_name이 없는 고객 확인
  console.log('3️⃣ folder_name이 없는 고객 확인...');
  const { data: customersWithoutFolder, error: folderError } = await supabase
    .from('customers')
    .select('id, name, folder_name')
    .is('folder_name', null)
    .limit(10);
  
  if (!folderError && customersWithoutFolder && customersWithoutFolder.length > 0) {
    console.log(`⚠️ folder_name이 없는 고객: ${customersWithoutFolder.length}명`);
    customersWithoutFolder.forEach(c => {
      console.log(`   - ${c.name} (ID: ${c.id})`);
    });
    console.log('');
    
    // folder_name이 없는 고객의 썸네일 조회 테스트
    console.log('   📋 folder_name이 없는 고객의 썸네일 조회 테스트...');
    for (const customer of customersWithoutFolder.slice(0, 3)) {
      const { data: allCustomerImages } = await supabase
        .from('image_assets')
        .select('id, cdn_url, file_path')
        .ilike('file_path', 'originals/customers/%')
        .limit(100);
      
      console.log(`      ${customer.name}: 전체 customers 폴더에서 ${allCustomerImages?.length || 0}개 이미지 발견`);
      console.log(`         ⚠️ folder_name이 없으면 모든 고객 이미지가 조회될 수 있음`);
    }
    console.log('');
  } else {
    console.log(`✅ folder_name이 없는 고객 없음\n`);
  }
  
  // 4. file_path 필터링 정확도 확인
  console.log('4️⃣ file_path 필터링 정확도 확인...');
  const { data: allCustomerImages } = await supabase
    .from('image_assets')
    .select('id, cdn_url, file_path')
    .ilike('file_path', 'originals/customers/%')
    .limit(1000);
  
  if (allCustomerImages) {
    // file_path에서 고객 폴더명 추출
    const folderNameMap = new Map();
    allCustomerImages.forEach(img => {
      const match = img.file_path?.match(/originals\/customers\/([^\/]+)\//);
      if (match) {
        const folderName = match[1];
        if (!folderNameMap.has(folderName)) {
          folderNameMap.set(folderName, []);
        }
        folderNameMap.get(folderName).push(img);
      }
    });
    
    console.log(`✅ ${folderNameMap.size}개의 고객 폴더에서 이미지 발견`);
    
    // 각 폴더의 이미지 개수 확인
    const folderStats = Array.from(folderNameMap.entries())
      .map(([folderName, images]) => ({
        folderName,
        count: images.length,
        withCdnUrl: images.filter(img => img.cdn_url).length
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    console.log('   📊 이미지가 많은 고객 폴더 (상위 10개):');
    folderStats.forEach((stat, idx) => {
      console.log(`      [${idx + 1}] ${stat.folderName}: ${stat.count}개 (cdn_url: ${stat.withCdnUrl}개)`);
    });
    console.log('');
  }
  
  // 5. 실제 문제 시나리오 재현
  console.log('5️⃣ 실제 문제 시나리오 재현...');
  console.log('   시나리오: folder_name이 "kimseotsu-4223"인 고객의 썸네일 조회');
  
  const testFolderName = 'kimseotsu-4223';
  const { data: testImages } = await supabase
    .from('image_assets')
    .select('id, cdn_url, file_path')
    .ilike('file_path', `originals/customers/${testFolderName}/%`)
    .not('file_path', 'ilike', '%.mp4%')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (testImages && testImages.length > 0) {
    console.log(`   ✅ ${testImages.length}개 이미지 발견`);
    testImages.slice(0, 3).forEach((img, idx) => {
      console.log(`      [${idx + 1}] ${img.file_path?.substring(0, 100)}...`);
      console.log(`          cdn_url: ${img.cdn_url ? '있음' : 'NULL'}`);
    });
  } else {
    console.log(`   ⚠️ 이미지 없음`);
  }
  console.log('');
  
  console.log('✅ 디버깅 완료');
}

debugCustomerThumbnailMixing().catch(console.error);
