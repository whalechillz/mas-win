/**
 * 마이그레이션 상태 상세 확인 스크립트
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkMigrationStatus() {
  console.log('='.repeat(60));
  console.log('마이그레이션 상태 상세 확인');
  console.log('='.repeat(60));
  
  // 1. 2022년, 2023년 마이그레이션된 고객 목록
  console.log('\n📋 2022년 마이그레이션 현황:');
  const { data: images2022 } = await supabase
    .from('image_metadata')
    .select('folder_path, date_folder, customer_initials, english_filename, customer_name_en')
    .like('folder_path', 'originals/customers/%')
    .like('date_folder', '2022%');
  
  const customers2022 = new Map();
  if (images2022) {
    images2022.forEach(img => {
      const folderMatch = img.folder_path.match(/customers\/([^\/]+)/);
      if (folderMatch && !folderMatch[1].includes('unmatched')) {
        const folderName = folderMatch[1];
        if (!customers2022.has(folderName)) {
          customers2022.set(folderName, {
            folderName,
            imageCount: 0,
            hasUnknown: false,
            initials: img.customer_initials,
            nameEn: img.customer_name_en
          });
        }
        const customer = customers2022.get(folderName);
        customer.imageCount++;
        if (img.english_filename && img.english_filename.startsWith('unknown_')) {
          customer.hasUnknown = true;
        }
      }
    });
  }
  
  console.log(`총 ${customers2022.size}명의 고객 폴더`);
  customers2022.forEach((customer, folderName) => {
    const unknownMark = customer.hasUnknown ? ' ⚠️ unknown 파일명 있음' : '';
    console.log(`  - ${folderName} (${customer.imageCount}개 이미지)${unknownMark}`);
  });
  
  console.log('\n📋 2023년 마이그레이션 현황:');
  const { data: images2023 } = await supabase
    .from('image_metadata')
    .select('folder_path, date_folder, customer_initials, english_filename, customer_name_en')
    .like('folder_path', 'originals/customers/%')
    .like('date_folder', '2023%');
  
  const customers2023 = new Map();
  const unknownCustomers = [];
  
  if (images2023) {
    images2023.forEach(img => {
      const folderMatch = img.folder_path.match(/customers\/([^\/]+)/);
      if (folderMatch && !folderMatch[1].includes('unmatched')) {
        const folderName = folderMatch[1];
        if (!customers2023.has(folderName)) {
          customers2023.set(folderName, {
            folderName,
            imageCount: 0,
            hasUnknown: false,
            initials: img.customer_initials,
            nameEn: img.customer_name_en,
            unknownFiles: []
          });
        }
        const customer = customers2023.get(folderName);
        customer.imageCount++;
        if (img.english_filename && img.english_filename.startsWith('unknown_')) {
          customer.hasUnknown = true;
          customer.unknownFiles.push(img.english_filename);
        }
      }
    });
  }
  
  console.log(`총 ${customers2023.size}명의 고객 폴더`);
  customers2023.forEach((customer, folderName) => {
    const unknownMark = customer.hasUnknown ? ' ⚠️' : '';
    console.log(`  - ${folderName} (${customer.imageCount}개 이미지)${unknownMark}`);
    if (customer.hasUnknown) {
      unknownCustomers.push({
        folderName,
        unknownFiles: customer.unknownFiles
      });
    }
  });
  
  // 2. unknown 파일명을 가진 고객 목록
  if (unknownCustomers.length > 0) {
    console.log('\n⚠️ unknown 파일명을 가진 고객:');
    unknownCustomers.forEach(customer => {
      console.log(`  - ${customer.folderName}:`);
      customer.unknownFiles.forEach(file => {
        console.log(`    • ${file}`);
      });
    });
  }
  
  // 3. 폴더명 형식 확인
  console.log('\n📁 폴더명 형식 분석:');
  const allFolders = [...customers2022.keys(), ...customers2023.keys()];
  const customerIdFormat = allFolders.filter(f => f.startsWith('customer-')).length;
  const namePhoneFormat = allFolders.filter(f => /^[a-z]+-\d{4}$/.test(f)).length;
  const otherFormat = allFolders.length - customerIdFormat - namePhoneFormat;
  
  console.log(`  - customer-XXXX-XXXX 형식: ${customerIdFormat}개`);
  console.log(`  - 영문-전화번호 형식: ${namePhoneFormat}개`);
  console.log(`  - 기타 형식: ${otherFormat}개`);
  
  if (customerIdFormat > 0) {
    console.log('\n⚠️ customer-XXXX-XXXX 형식 폴더 목록:');
    allFolders.filter(f => f.startsWith('customer-')).forEach(f => {
      console.log(`  - ${f}`);
    });
  }
  
  // 4. 요약
  console.log('\n📊 요약:');
  console.log(`  - 2022년: ${customers2022.size}명`);
  console.log(`  - 2023년: ${customers2023.size}명`);
  console.log(`  - unknown 파일명 고객: ${unknownCustomers.length}명`);
  console.log(`  - 폴더명 통일 필요: ${customerIdFormat}개`);
}

if (require.main === module) {
  checkMigrationStatus().catch(console.error);
}

module.exports = { checkMigrationStatus };
