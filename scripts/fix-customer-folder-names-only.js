/**
 * customers/ 하부 폴더명을 영문-전화번호뒷자리4개 형태로 변경
 * customer-XXXX-XXXX 형식만 처리
 */

const { createClient } = require('@supabase/supabase-js');
const { translateKoreanToEnglish } = require('../lib/korean-to-english-translator');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = 'blog-images';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * 고객 이니셜 생성
 */
function getCustomerInitials(name) {
  if (!name) return 'unknown';
  if (/[가-힣]/.test(name)) {
    // 한글 이름의 각 글자에서 초성 추출
    const koreanInitials = name.split('').map(char => {
      if (/[가-힣]/.test(char)) {
        const code = char.charCodeAt(0) - 0xAC00;
        if (code >= 0 && code < 11172) {
          const initialIndex = Math.floor(code / 588);
          const initialChars = ['g', 'n', 'd', 'r', 'm', 'b', 's', '', 'j', 'ch', 'k', 't', 'p', 'h'];
          if (initialIndex >= 0 && initialIndex < initialChars.length && initialChars[initialIndex]) {
            return initialChars[initialIndex];
          }
        }
      }
      return '';
    }).filter(c => c !== '').join('');
    
    if (koreanInitials && koreanInitials.length > 0) {
      return koreanInitials;
    }
    
    // 초성 추출 실패 시 영문 변환 후 이니셜 추출
    const nameEn = translateKoreanToEnglish(name);
    if (nameEn && nameEn.trim() !== '') {
      const parts = nameEn.split(/[\s-]+/);
      const initials = parts.map(part => part.charAt(0)).join('').toLowerCase();
      if (initials && initials.length > 0 && /^[a-z]+$/.test(initials)) {
        return initials;
      }
    }
  }
  const parts = name.split(/[\s-]+/);
  const initials = parts.map(part => part.charAt(0)).join('').toLowerCase();
  return /^[a-z]+$/.test(initials) ? initials : 'unknown';
}

/**
 * customers/ 하부 폴더명을 영문-전화번호뒷자리4개 형태로 변경
 */
async function fixCustomerFolderNames() {
  console.log('='.repeat(60));
  console.log('customers 폴더명 수정 스크립트');
  console.log('='.repeat(60));
  console.log('\n🔄 customers 폴더명 수정 시작...\n');
  
  // image_metadata에서 customer-XXXX-XXXX 형식 폴더 찾기
  const { data: images, error: imageError } = await supabase
    .from('image_metadata')
    .select('folder_path')
    .like('folder_path', 'originals/customers/customer-%');
  
  if (imageError) {
    console.error('❌ 이미지 메타데이터 조회 실패:', imageError);
    return;
  }
  
  const customerFolders = new Set();
  if (images) {
    images.forEach(img => {
      const folderMatch = img.folder_path.match(/customers\/(customer-\d+-\d+)/);
      if (folderMatch) {
        customerFolders.add(folderMatch[1]);
      }
    });
  }
  
  console.log(`📋 customer-XXXX-XXXX 형식 폴더: ${customerFolders.size}개\n`);
  
  if (customerFolders.size === 0) {
    console.log('✅ 변경할 폴더가 없습니다.');
    return;
  }
  
  let updateCount = 0;
  let skipCount = 0;
  
  for (const folderName of customerFolders) {
    // 폴더명에서 고객 ID 추출
    const customerIdMatch = folderName.match(/customer-(\d+)/);
    if (!customerIdMatch) {
      skipCount++;
      continue;
    }
    
    const customerId = parseInt(customerIdMatch[1]);
    
    // 고객 정보 조회
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, name, phone, folder_name')
      .eq('id', customerId)
      .single();
    
    if (customerError || !customer) {
      console.warn(`   ⚠️  고객을 찾을 수 없음: ${folderName} (ID: ${customerId})`);
      skipCount++;
      continue;
    }
    
    const nameEn = translateKoreanToEnglish(customer.name);
    
    if (!nameEn || nameEn.trim() === '' || /[가-힣]/.test(nameEn)) {
      console.warn(`   ⚠️  영문 변환 실패: ${customer.name}`);
      skipCount++;
      continue;
    }
    
    // 한글 제거 및 정리
    let cleanNameEn = nameEn.replace(/[가-힣]/g, '').replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    
    if (!cleanNameEn || cleanNameEn.trim() === '') {
      console.warn(`   ⚠️  영문 이름이 비어있음: ${customer.name}`);
      skipCount++;
      continue;
    }
    
    // 전화번호가 있으면: {영문이름}-{전화번호마지막4자리}
    let correctFolderName;
    if (customer.phone && customer.phone.trim() !== '') {
      const phoneLast4 = customer.phone.replace(/-/g, '').slice(-4);
      if (phoneLast4.length === 4 && /^\d{4}$/.test(phoneLast4)) {
        correctFolderName = `${cleanNameEn}-${phoneLast4}`;
      } else {
        // 전화번호 형식이 올바르지 않으면 고객 ID 사용
        correctFolderName = `${cleanNameEn}-${String(customer.id).padStart(4, '0')}`;
      }
    } else {
      // 전화번호가 없으면: {영문이름}-{고객ID}
      correctFolderName = `${cleanNameEn}-${String(customer.id).padStart(4, '0')}`;
    }
    
    // 이미 올바른 형식이면 스킵
    if (customer.folder_name === correctFolderName) {
      skipCount++;
      continue;
    }
    
    console.log(`[${customer.id}] ${customer.name}`);
    console.log(`   기존 폴더: ${folderName}`);
    console.log(`   변경: ${correctFolderName}`);
    
    // customers 테이블 업데이트
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        folder_name: correctFolderName,
        name_en: nameEn,
        initials: getCustomerInitials(customer.name)
      })
      .eq('id', customer.id);
    
    if (updateError) {
      console.error(`   ❌ 업데이트 실패: ${updateError.message}`);
      continue;
    }
    
    // image_metadata 테이블의 folder_path 업데이트
    const { data: imagesToUpdate, error: imageUpdateError } = await supabase
      .from('image_metadata')
      .select('id, folder_path, image_url')
      .like('folder_path', `%${folderName}%`);
    
    if (!imageUpdateError && imagesToUpdate && imagesToUpdate.length > 0) {
      for (const image of imagesToUpdate) {
        const newFolderPath = image.folder_path.replace(
          `customers/${folderName}`,
          `customers/${correctFolderName}`
        );
        const newImageUrl = image.image_url.replace(
          `customers/${folderName}`,
          `customers/${correctFolderName}`
        );
        
        await supabase
          .from('image_metadata')
          .update({
            folder_path: newFolderPath,
            image_url: newImageUrl
          })
          .eq('id', image.id);
      }
      
      console.log(`   ✅ 이미지 메타데이터 ${imagesToUpdate.length}개 업데이트`);
    }
    
    updateCount++;
    console.log('');
  }
  
  console.log(`\n📊 완료: 업데이트 ${updateCount}개, 스킵 ${skipCount}개`);
}

if (require.main === module) {
  fixCustomerFolderNames().catch(console.error);
}

module.exports = { fixCustomerFolderNames };
