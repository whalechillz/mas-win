/**
 * 매칭되지 않은 16개 폴더를 파일명과 기존 마이그레이션 데이터로 재검색
 * 
 * 방법:
 * 1. 폴더명에서 이름과 전화번호 추출
 * 2. customers 테이블에서 이름/전화번호로 검색
 * 3. image_assets 테이블에서 file_path로 검색
 * 4. 기존 마이그레이션 스크립트 결과 확인
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

// 한글 이름을 영문으로 변환
function translateKoreanToEnglish(name) {
  const { translateKoreanToEnglish } = require('../lib/korean-to-english-translator');
  return translateKoreanToEnglish(name);
}

// 폴더명에서 이름과 전화번호 추출
function extractInfoFromFolderName(folderName) {
  // 형식: {영문이름}-{전화번호마지막4자리}
  const parts = folderName.split('-');
  
  if (parts.length >= 2) {
    const lastPart = parts[parts.length - 1];
    if (/^\d{4}$/.test(lastPart)) {
      // 마지막 부분이 숫자 4자리
      const namePart = parts.slice(0, -1).join('-');
      return {
        nameEn: namePart,
        phoneLast4: lastPart
      };
    }
  }
  
  return {
    nameEn: folderName,
    phoneLast4: null
  };
}

// 전화번호 마지막 4자리로 고객 찾기
async function findCustomerByPhoneLast4(phoneLast4) {
  if (!phoneLast4) return [];
  
  const { data: customers, error } = await supabase
    .from('customers')
    .select('id, name, phone, folder_name')
    .limit(1000);
  
  if (error) return [];
  
  // 전화번호 마지막 4자리가 일치하는 고객 찾기
  return (customers || []).filter(c => {
    if (!c.phone) return false;
    const phoneDigits = c.phone.replace(/-/g, '').replace(/\s/g, '');
    return phoneDigits.slice(-4) === phoneLast4;
  });
}

// 이름으로 고객 찾기 (부분 일치)
async function findCustomerByName(nameEn) {
  const { data: customers, error } = await supabase
    .from('customers')
    .select('id, name, phone, folder_name')
    .limit(1000);
  
  if (error) return [];
  
  const normalizedFolderName = nameEn.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // 각 고객의 이름을 영문으로 변환하여 비교
  const matches = [];
  
  for (const customer of customers || []) {
    if (!customer.name) continue;
    
    const customerNameEn = translateKoreanToEnglish(customer.name);
    const normalizedCustomerName = customerNameEn.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // 부분 일치 확인
    if (normalizedFolderName.includes(normalizedCustomerName) || 
        normalizedCustomerName.includes(normalizedFolderName)) {
      matches.push(customer);
    }
  }
  
  return matches;
}

// image_assets에서 file_path로 검색
async function findImagesByFolderName(folderName) {
  const folderPath = `originals/customers/${folderName}`;
  
  const { data: images, error } = await supabase
    .from('image_assets')
    .select('id, file_path, ai_tags, cdn_url')
    .ilike('file_path', `${folderPath}%`)
    .limit(100);
  
  if (error) {
    console.warn(`⚠️ 이미지 검색 오류 (${folderName}):`, error.message);
    return [];
  }
  
  return images || [];
}

// ai_tags에서 customer-{id} 추출
function extractCustomerIdsFromTags(images) {
  const customerIds = new Set();
  
  for (const image of images) {
    const tags = image.ai_tags || [];
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
  }
  
  return Array.from(customerIds);
}

async function findUnmatchedFolders() {
  console.log('🔍 매칭되지 않은 16개 폴더 재검색 시작...\n');
  console.log('='.repeat(80));
  
  // 매칭되지 않은 폴더 목록
  const unmatchedFolders = [
    'chobyeotseom-2002',
    'choibeolgyu-6508',
    'hangwiyot-7115',
    'jeonghaeseon-0712',
    'jeonyugeun-9269',
    'joseongdae-7010',
    'kangseotdot-5787',
    'kimchangi-3802',
    'kimjongchull-6654',
    'kimsunbok-2469',
    'kimwonputun-4416',
    'leejudot-2716',
    'leenamgu-8768',
    'minhosik-5549',
    'mooneungyeot-6710',
    'mukhyeonsat-6791'
  ];
  
  console.log(`\n1️⃣ 총 ${unmatchedFolders.length}개 폴더 검색 시작...\n`);
  
  const results = [];
  
  for (let i = 0; i < unmatchedFolders.length; i++) {
    const folderName = unmatchedFolders[i];
    console.log(`[${i + 1}/${unmatchedFolders.length}] 📁 ${folderName}`);
    
    const info = extractInfoFromFolderName(folderName);
    console.log(`   추출된 정보: 이름=${info.nameEn}, 전화번호마지막4자리=${info.phoneLast4 || '없음'}`);
    
    const result = {
      folderName,
      extractedInfo: info,
      matches: {
        byPhone: [],
        byName: [],
        byImageAssets: [],
        customerIdsFromImages: []
      }
    };
    
    // 1. 전화번호 마지막 4자리로 검색
    if (info.phoneLast4) {
      console.log(`   🔍 전화번호 마지막 4자리로 검색: ${info.phoneLast4}`);
      const phoneMatches = await findCustomerByPhoneLast4(info.phoneLast4);
      result.matches.byPhone = phoneMatches;
      
      if (phoneMatches.length > 0) {
        console.log(`   ✅ 전화번호로 찾은 고객: ${phoneMatches.length}명`);
        phoneMatches.forEach(c => {
          console.log(`      - ${c.name} (ID: ${c.id}, 전화: ${c.phone}, folder_name: ${c.folder_name || '없음'})`);
        });
      } else {
        console.log(`   ⚠️  전화번호로 찾은 고객 없음`);
      }
    }
    
    // 2. 이름으로 검색
    console.log(`   🔍 이름으로 검색: ${info.nameEn}`);
    const nameMatches = await findCustomerByName(info.nameEn);
    result.matches.byName = nameMatches;
    
    if (nameMatches.length > 0) {
      console.log(`   ✅ 이름으로 찾은 고객: ${nameMatches.length}명`);
      nameMatches.slice(0, 5).forEach(c => {
        console.log(`      - ${c.name} (ID: ${c.id}, 전화: ${c.phone || '없음'}, folder_name: ${c.folder_name || '없음'})`);
      });
      if (nameMatches.length > 5) {
        console.log(`      ... 외 ${nameMatches.length - 5}명`);
      }
    } else {
      console.log(`   ⚠️  이름으로 찾은 고객 없음`);
    }
    
    // 3. image_assets에서 file_path로 검색
    console.log(`   🔍 image_assets에서 file_path로 검색`);
    const images = await findImagesByFolderName(folderName);
    result.matches.byImageAssets = images;
    
    if (images.length > 0) {
      console.log(`   ✅ image_assets에서 찾은 이미지: ${images.length}개`);
      
      // ai_tags에서 customer-{id} 추출
      const customerIds = extractCustomerIdsFromTags(images);
      result.matches.customerIdsFromImages = customerIds;
      
      if (customerIds.length > 0) {
        console.log(`   ✅ 이미지에서 추출한 customer_id: ${customerIds.join(', ')}`);
        
        // customer_id로 고객 정보 조회
        const { data: customers, error } = await supabase
          .from('customers')
          .select('id, name, phone, folder_name')
          .in('id', customerIds);
        
        if (!error && customers && customers.length > 0) {
          console.log(`   ✅ customer_id로 찾은 고객:`);
          customers.forEach(c => {
            console.log(`      - ${c.name} (ID: ${c.id}, 전화: ${c.phone || '없음'}, folder_name: ${c.folder_name || '없음'})`);
          });
          result.matches.byImageAssets = customers;
        }
      }
    } else {
      console.log(`   ⚠️  image_assets에서 찾은 이미지 없음`);
    }
    
    results.push(result);
    console.log('');
  }
  
  // 결과 요약
  console.log('='.repeat(80));
  console.log('📊 검색 결과 요약:');
  console.log('='.repeat(80));
  
  const foundByPhone = results.filter(r => r.matches.byPhone.length > 0).length;
  const foundByName = results.filter(r => r.matches.byName.length > 0).length;
  const foundByImages = results.filter(r => r.matches.customerIdsFromImages.length > 0).length;
  
  console.log(`   총 폴더: ${results.length}개`);
  console.log(`   ✅ 전화번호로 찾은 폴더: ${foundByPhone}개`);
  console.log(`   ✅ 이름으로 찾은 폴더: ${foundByName}개`);
  console.log(`   ✅ 이미지에서 customer_id 추출한 폴더: ${foundByImages}개`);
  console.log('='.repeat(80));
  
  // 상세 결과 출력
  console.log('\n📋 상세 결과:\n');
  
  results.forEach((r, idx) => {
    const hasMatches = r.matches.byPhone.length > 0 || 
                      r.matches.byName.length > 0 || 
                      r.matches.customerIdsFromImages.length > 0;
    
    if (hasMatches) {
      console.log(`\n[${idx + 1}] ${r.folderName}:`);
      
      if (r.matches.byPhone.length > 0) {
        console.log(`   📞 전화번호 매칭:`);
        r.matches.byPhone.forEach(c => {
          console.log(`      → ${c.name} (ID: ${c.id}, 전화: ${c.phone})`);
          if (!c.folder_name) {
            console.log(`         ⚠️  folder_name 업데이트 필요: UPDATE customers SET folder_name = '${r.folderName}' WHERE id = ${c.id};`);
          }
        });
      }
      
      if (r.matches.byName.length > 0) {
        console.log(`   👤 이름 매칭 (상위 3명):`);
        r.matches.byName.slice(0, 3).forEach(c => {
          console.log(`      → ${c.name} (ID: ${c.id}, 전화: ${c.phone || '없음'})`);
        });
      }
      
      if (r.matches.customerIdsFromImages.length > 0) {
        console.log(`   🖼️  이미지에서 추출한 customer_id: ${r.matches.customerIdsFromImages.join(', ')}`);
      }
    }
  });
  
  // JSON 파일로 결과 저장
  const fs = require('fs');
  fs.writeFileSync(
    'scripts/unmatched-folders-detailed-search-result.json',
    JSON.stringify({
      totalFolders: results.length,
      foundByPhone,
      foundByName,
      foundByImages,
      results,
      timestamp: new Date().toISOString()
    }, null, 2),
    'utf-8'
  );
  
  console.log('\n✅ 결과가 scripts/unmatched-folders-detailed-search-result.json에 저장되었습니다.');
  console.log('\n✅ 작업 완료!');
}

findUnmatchedFolders().catch(console.error);
