/**
 * 이미지가 누락된 고객 확인 스크립트
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCustomersWithMissingImages() {
  console.log('🔍 이미지가 누락된 고객 확인...\n');

  try {
    // 모든 고객 조회
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, name, folder_name')
      .order('id', { ascending: true });

    if (customersError) {
      console.error('❌ 고객 조회 실패:', customersError);
      return;
    }

    console.log(`✅ 총 ${customers.length}명의 고객 발견\n`);

    const customersWithIssues = [];
    let checkedCount = 0;

    for (const customer of customers) {
      if (!customer.folder_name) {
        continue;
      }

      checkedCount++;
      if (checkedCount % 10 === 0) {
        console.log(`진행 중... ${checkedCount}/${customers.length}`);
      }

      const customerTag = `customer-${customer.id}`;
      const exactFolderPath = `originals/customers/${customer.folder_name}`;

      // 해당 고객의 이미지 조회
      const { data: images, error: imagesError } = await supabase
        .from('image_assets')
        .select('id, filename, file_path, cdn_url, ai_tags')
        .ilike('file_path', `${exactFolderPath}/%`)
        .limit(100);

      if (imagesError || !images || images.length === 0) {
        continue;
      }

      // 문제가 있는 이미지 확인
      const imagesWithIssues = images.filter(img => {
        // 1. file_path에 파일명이 없는 경우
        if (img.file_path) {
          const pathParts = img.file_path.split('/');
          const lastPart = pathParts[pathParts.length - 1];
          const isDateFolder = /^\d{4}-\d{2}-\d{2}$/.test(lastPart);
          if (isDateFolder || !lastPart.includes('.')) {
            return true;
          }
        }

        // 2. ai_tags에 customer 태그가 없는 경우
        const tags = Array.isArray(img.ai_tags) ? img.ai_tags : [];
        if (!tags.includes(customerTag) && img.file_path?.startsWith(exactFolderPath)) {
          return true;
        }

        return false;
      });

      if (imagesWithIssues.length > 0) {
        customersWithIssues.push({
          customer,
          totalImages: images.length,
          imagesWithIssues: imagesWithIssues.length,
          issues: imagesWithIssues.map(img => ({
            id: img.id,
            filename: img.filename,
            file_path: img.file_path,
            hasCustomerTag: Array.isArray(img.ai_tags) && img.ai_tags.includes(customerTag),
            filePathHasFilename: img.file_path && !img.file_path.match(/\/\d{4}-\d{2}-\d{2}$/) && img.file_path.includes('.')
          }))
        });
      }
    }

    console.log(`\n✅ 확인 완료: ${checkedCount}명의 고객 확인\n`);
    console.log(`⚠️ 문제가 있는 고객: ${customersWithIssues.length}명\n`);

    // 상위 20명만 상세 출력
    customersWithIssues.slice(0, 20).forEach((item, index) => {
      console.log(`${index + 1}. ${item.customer.name} (ID: ${item.customer.id})`);
      console.log(`   총 이미지: ${item.totalImages}개, 문제 이미지: ${item.imagesWithIssues}개`);
      console.log(`   폴더: ${item.customer.folder_name}\n`);
    });

    if (customersWithIssues.length > 20) {
      console.log(`... 외 ${customersWithIssues.length - 20}명\n`);
    }

    // 통계
    const totalIssues = customersWithIssues.reduce((sum, item) => sum + item.imagesWithIssues, 0);
    console.log(`📊 통계:`);
    console.log(`   문제 고객 수: ${customersWithIssues.length}명`);
    console.log(`   총 문제 이미지 수: ${totalIssues}개`);
    console.log(`   평균 문제 이미지 수: ${(totalIssues / customersWithIssues.length).toFixed(1)}개/고객\n`);

    return customersWithIssues;

  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

checkCustomersWithMissingImages().catch(console.error);
