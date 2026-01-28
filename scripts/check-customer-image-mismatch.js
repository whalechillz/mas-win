/**
 * 고객 이미지 불일치 확인 스크립트
 * 
 * 문제: 이미지가 없는 고객이 이미지가 있는 것으로 표시됨
 * 원인: file_path는 있지만 cdn_url이 NULL인 경우 URL이 생성되어 깨진 이미지로 표시됨
 * 
 * 이 스크립트는:
 * 1. image_assets에서 file_path는 있지만 cdn_url이 NULL인 레코드 확인
 * 2. 실제 Storage에 파일이 존재하는지 확인
 * 3. 불일치 데이터 리포트 생성
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

async function checkCustomerImageMismatch() {
  console.log('🔍 고객 이미지 불일치 확인 시작...\n');
  
  // 1. image_assets에서 customers 폴더의 이미지 조회
  console.log('1️⃣ image_assets에서 customers 폴더 이미지 조회...');
  const { data: customerImages, error: imagesError } = await supabase
    .from('image_assets')
    .select('id, cdn_url, file_path, created_at')
    .ilike('file_path', 'originals/customers/%')
    .limit(10000);
  
  if (imagesError) {
    console.error('❌ 이미지 조회 오류:', imagesError);
    return;
  }
  
  console.log(`✅ ${customerImages?.length || 0}개의 고객 이미지 발견\n`);
  
  if (!customerImages || customerImages.length === 0) {
    console.log('⚠️ 고객 이미지가 없습니다.');
    return;
  }
  
  // 2. cdn_url이 NULL이지만 file_path가 있는 레코드 확인
  console.log('2️⃣ cdn_url이 NULL이지만 file_path가 있는 레코드 확인...');
  const missingCdnUrl = customerImages.filter(img => 
    !img.cdn_url && img.file_path
  );
  
  console.log(`⚠️ cdn_url이 NULL인 레코드: ${missingCdnUrl.length}개\n`);
  
  if (missingCdnUrl.length > 0) {
    console.log('   📋 샘플 레코드 (최대 10개):');
    missingCdnUrl.slice(0, 10).forEach((img, idx) => {
      console.log(`      [${idx + 1}] ID: ${img.id}`);
      console.log(`          file_path: ${img.file_path?.substring(0, 100)}...`);
      console.log(`          cdn_url: ${img.cdn_url || 'NULL'}`);
      console.log(`          created_at: ${img.created_at}`);
    });
    console.log('');
  }
  
  // 3. cdn_url이 있지만 file_path가 없는 레코드 확인
  console.log('3️⃣ cdn_url이 있지만 file_path가 없는 레코드 확인...');
  const missingFilePath = customerImages.filter(img => 
    img.cdn_url && !img.file_path
  );
  
  console.log(`⚠️ file_path가 NULL인 레코드: ${missingFilePath.length}개\n`);
  
  // 4. file_path에서 고객 폴더명 추출 및 통계
  console.log('4️⃣ 고객별 이미지 통계...');
  const customerStats = new Map();
  
  customerImages.forEach(img => {
    const filePath = img.file_path || '';
    const match = filePath.match(/originals\/customers\/([^\/]+)\//);
    if (match) {
      const folderName = match[1];
      if (!customerStats.has(folderName)) {
        customerStats.set(folderName, {
          total: 0,
          withCdnUrl: 0,
          withoutCdnUrl: 0
        });
      }
      const stats = customerStats.get(folderName);
      stats.total++;
      if (img.cdn_url) {
        stats.withCdnUrl++;
      } else {
        stats.withoutCdnUrl++;
      }
    }
  });
  
  console.log(`✅ ${customerStats.size}명의 고객 이미지 통계:\n`);
  
  // cdn_url이 없는 이미지가 많은 고객 순으로 정렬
  const sortedStats = Array.from(customerStats.entries())
    .sort((a, b) => b[1].withoutCdnUrl - a[1].withoutCdnUrl)
    .slice(0, 20);
  
  console.log('   📊 cdn_url이 없는 이미지가 많은 고객 (상위 20명):');
  sortedStats.forEach(([folderName, stats], idx) => {
    if (stats.withoutCdnUrl > 0) {
      console.log(`      [${idx + 1}] ${folderName}:`);
      console.log(`          전체: ${stats.total}개, cdn_url 있음: ${stats.withCdnUrl}개, cdn_url 없음: ${stats.withoutCdnUrl}개`);
    }
  });
  console.log('');
  
  // 5. 실제 Storage 파일 존재 여부 확인 (샘플)
  console.log('5️⃣ Storage 파일 존재 여부 확인 (샘플 10개)...');
  const samplesToCheck = missingCdnUrl.slice(0, 10);
  
  for (const img of samplesToCheck) {
    if (!img.file_path) continue;
    
    try {
      // Storage에서 파일 존재 여부 확인
      const { data: files, error: listError } = await supabase.storage
        .from('blog-images')
        .list(img.file_path.substring(0, img.file_path.lastIndexOf('/')), {
          limit: 1000,
          search: img.file_path.split('/').pop()
        });
      
      const fileName = img.file_path.split('/').pop();
      const fileExists = files?.some(f => f.name === fileName);
      
      console.log(`   ${fileExists ? '✅' : '❌'} ${img.file_path.substring(0, 80)}...`);
      console.log(`      Storage에 파일 ${fileExists ? '존재' : '없음'}`);
      if (listError) {
        console.log(`      오류: ${listError.message}`);
      }
    } catch (error) {
      console.log(`   ❌ ${img.file_path.substring(0, 80)}...`);
      console.log(`      확인 실패: ${error.message}`);
    }
  }
  console.log('');
  
  // 6. 요약
  console.log('📊 요약:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   전체 고객 이미지: ${customerImages.length}개`);
  console.log(`   cdn_url 있음: ${customerImages.filter(img => img.cdn_url).length}개`);
  console.log(`   cdn_url 없음: ${missingCdnUrl.length}개`);
  console.log(`   file_path 없음: ${missingFilePath.length}개`);
  console.log(`   고객 수: ${customerStats.size}명`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // 7. 권장 조치
  console.log('💡 권장 조치:');
  console.log('   1. cdn_url이 NULL인 레코드는 썸네일을 제공하지 않도록 수정 (완료)');
  console.log('   2. file_path로부터 URL을 생성하지 않도록 수정 (완료)');
  console.log('   3. 필요시 cdn_url이 NULL인 레코드의 file_path로부터 실제 파일 확인 후 cdn_url 업데이트');
  console.log('');
  
  console.log('✅ 확인 완료');
}

checkCustomerImageMismatch().catch(console.error);
