// 고객 이미지 태그 수정 스크립트
// folder_path에서 고객 정보를 추출하여 tags에 customer-{id} 추가

const { createClient } = require('@supabase/supabase-js');
const { translateKoreanToEnglish } = require('../lib/korean-to-english-translator.js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  console.error('   NEXT_PUBLIC_SUPABASE_URL와 SUPABASE_SERVICE_ROLE_KEY를 확인하세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 한글 이름을 영문으로 변환하여 folder_name 형식 생성
function generateFolderNameFromKorean(koreanName, phone, customerId) {
  const nameEn = translateKoreanToEnglish(koreanName);
  if (!nameEn) return null;
  
  const cleanNameEn = nameEn.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  
  if (phone) {
    const phoneLast4 = phone.replace(/-/g, '').slice(-4);
    if (phoneLast4.length === 4 && /^\d{4}$/.test(phoneLast4)) {
      return `${cleanNameEn}-${phoneLast4}`;
    }
  }
  
  if (customerId) {
    return `${cleanNameEn}-${String(customerId).padStart(4, '0')}`;
  }
  
  return null;
}

async function fixCustomerImageTags() {
  console.log('🔍 고객 이미지 태그 수정 시작...\n');
  console.log('='.repeat(60));

  try {
    // 1. 모든 고객 이미지 조회 (folder_path에 customers가 포함된 것)
    console.log('📋 고객 이미지 조회 중...');
    const { data: allImages, error: imagesError } = await supabase
      .from('image_metadata')
      .select('id, image_url, tags, folder_path, customer_name_en, customer_initials, english_filename')
      .or('folder_path.ilike.%customers/%,source.eq.customer')
      .order('created_at', { ascending: false });

    if (imagesError) {
      throw imagesError;
    }

    if (!allImages || allImages.length === 0) {
      console.log('❌ 고객 이미지를 찾을 수 없습니다.');
      return;
    }

    console.log(`✅ 총 ${allImages.length}개의 고객 이미지 발견\n`);

    // 2. 모든 고객 정보 조회 (folder_name으로 매칭)
    console.log('📋 고객 정보 조회 중...');
    const { data: allCustomers, error: customersError } = await supabase
      .from('customers')
      .select('id, name, folder_name, name_en, initials');

    if (customersError) {
      throw customersError;
    }

    // 고객 매핑 생성 (여러 방법으로)
    const customerMapByFolder = new Map();
    const customerMapByNameEn = new Map();
    const customerMapByInitials = new Map();
    
    allCustomers?.forEach(c => {
      if (c.folder_name) {
        customerMapByFolder.set(c.folder_name, c.id);
      }
      if (c.name_en) {
        // name_en을 folder_name 형식으로 변환 (소문자, 공백을 하이픈으로)
        const normalizedNameEn = c.name_en.toLowerCase().replace(/\s+/g, '-');
        customerMapByNameEn.set(normalizedNameEn, c.id);
      }
      if (c.initials) {
        customerMapByInitials.set(c.initials.toLowerCase(), c.id);
      }
    });

    console.log(`✅ ${allCustomers?.length || 0}명의 고객 정보 로드`);
    console.log(`   - folder_name 매핑: ${customerMapByFolder.size}개`);
    console.log(`   - name_en 매핑: ${customerMapByNameEn.size}개`);
    console.log(`   - initials 매핑: ${customerMapByInitials.size}개\n`);

    // 3. 각 이미지의 태그 확인 및 업데이트
    let updatedCount = 0;
    let alreadyHasTagCount = 0;
    let noCustomerFoundCount = 0;
    const noCustomerFoundImages = [];

    for (const image of allImages) {
      let customerId = null;
      let matchMethod = '';

      // 방법 1: folder_path에서 folder_name 추출
      // 예: originals/customers/jang-jinsu-8189/2024-08-30/...
      const folderMatch = image.folder_path?.match(/customers\/([^\/]+)/);
      const folderName = folderMatch ? folderMatch[1] : null;

      if (folderName) {
        customerId = customerMapByFolder.get(folderName);
        if (customerId) {
          matchMethod = 'folder_name';
        }
      }

      // 방법 2: customer_name_en으로 찾기
      if (!customerId && image.customer_name_en) {
        const normalizedNameEn = image.customer_name_en.toLowerCase().replace(/\s+/g, '-');
        customerId = customerMapByNameEn.get(normalizedNameEn);
        if (customerId) {
          matchMethod = 'name_en';
        }
      }

      // 방법 3: customer_initials로 찾기
      if (!customerId && image.customer_initials) {
        customerId = customerMapByInitials.get(image.customer_initials.toLowerCase());
        if (customerId) {
          matchMethod = 'initials';
        }
      }

      // 방법 4: english_filename에서 고객 이름 추출 시도
      if (!customerId && image.english_filename) {
        // 예: jangjinsu_s1_hero_0.jpg -> jangjinsu
        const nameMatch = image.english_filename.match(/^([a-z]+)_/);
        if (nameMatch) {
          const nameFromFile = nameMatch[1];
          // folder_name이나 name_en과 부분 매칭 시도
          for (const [key, id] of customerMapByFolder.entries()) {
            if (key.includes(nameFromFile) || nameFromFile.includes(key.split('-')[0])) {
              customerId = id;
              matchMethod = 'filename_partial';
              break;
            }
          }
        }
      }

      // 방법 5: folder_path에서 한글 이름 추출 후 영문 변환하여 매칭
      if (!customerId && image.folder_path) {
        // 예: originals/customers/2023.06.05.이수원/... 또는 customers/이수원/...
        const koreanNameMatch = image.folder_path.match(/customers\/[^\/]*?([가-힣]+)/);
        if (koreanNameMatch) {
          const koreanName = koreanNameMatch[1];
          // 모든 고객과 비교하여 한글 이름이 일치하는지 확인
          for (const customer of allCustomers || []) {
            if (customer.name === koreanName || customer.name.includes(koreanName) || koreanName.includes(customer.name)) {
              // 고객의 folder_name 생성
              const expectedFolderName = generateFolderNameFromKorean(customer.name, customer.phone, customer.id);
              if (expectedFolderName && image.folder_path.includes(expectedFolderName)) {
                customerId = customer.id;
                matchMethod = 'korean_name_in_path';
                break;
              }
              // 또는 직접 이름으로 매칭
              if (customer.name === koreanName) {
                customerId = customer.id;
                matchMethod = 'korean_name_direct';
                break;
              }
            }
          }
        }
      }

      if (!customerId) {
        noCustomerFoundCount++;
        noCustomerFoundImages.push({
          id: image.id,
          folder_path: image.folder_path,
          customer_name_en: image.customer_name_en,
          customer_initials: image.customer_initials,
          english_filename: image.english_filename
        });
        continue;
      }

      const expectedTag = `customer-${customerId}`;
      
      // 태그 확인
      const hasTag = image.tags && Array.isArray(image.tags) && image.tags.includes(expectedTag);
      
      if (!hasTag) {
        const updatedTags = [...(image.tags || []), expectedTag];
        
        console.log(`📝 이미지 ${image.id} (${matchMethod}): customer-${customerId} 태그 추가 중...`);
        const { error: updateError } = await supabase
          .from('image_metadata')
          .update({
            tags: updatedTags,
            updated_at: new Date().toISOString()
          })
          .eq('id', image.id);
        
        if (updateError) {
          console.error(`   ❌ 업데이트 실패: ${updateError.message}`);
        } else {
          updatedCount++;
          console.log(`   ✅ 태그 추가 완료`);
        }
      } else {
        alreadyHasTagCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ 완료!');
    console.log(`   업데이트된 이미지: ${updatedCount}개`);
    console.log(`   이미 태그가 있던 이미지: ${alreadyHasTagCount}개`);
    console.log(`   고객을 찾을 수 없는 이미지: ${noCustomerFoundCount}개`);
    
    if (noCustomerFoundImages.length > 0 && noCustomerFoundImages.length <= 20) {
      console.log('\n⚠️ 고객을 찾을 수 없는 이미지 목록:');
      noCustomerFoundImages.forEach(img => {
        console.log(`   - ID: ${img.id}, folder: ${img.folder_path || 'N/A'}, name_en: ${img.customer_name_en || 'N/A'}, initials: ${img.customer_initials || 'N/A'}`);
      });
    } else if (noCustomerFoundImages.length > 20) {
      console.log(`\n⚠️ 고객을 찾을 수 없는 이미지가 ${noCustomerFoundImages.length}개 있습니다.`);
      console.log('   처음 10개만 표시:');
      noCustomerFoundImages.slice(0, 10).forEach(img => {
        console.log(`   - ID: ${img.id}, folder: ${img.folder_path || 'N/A'}`);
      });
    }
    
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

fixCustomerImageTags();
