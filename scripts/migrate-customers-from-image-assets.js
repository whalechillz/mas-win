/**
 * image_assets 테이블의 기존 이미지를 기반으로 고객 마이그레이션
 * 
 * 방법:
 * 1. image_assets에서 originals/customers 폴더의 모든 이미지 조회
 * 2. file_path에서 폴더명 추출
 * 3. 폴더명에서 전화번호 마지막 4자리 추출
 * 4. customers 테이블에서 전화번호로 매칭
 * 5. ai_tags에 customer-{id} 태그 추가
 * 6. customers 테이블의 folder_name 업데이트
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

// file_path에서 폴더명 추출
function extractFolderName(filePath) {
  const match = filePath.match(/originals\/customers\/([^\/]+)/);
  return match ? match[1] : null;
}

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
  
  // 전화번호 마지막 4자리가 일치하는 고객 찾기
  const matches = (customers || []).filter(c => {
    if (!c.phone) return false;
    const phoneDigits = c.phone.replace(/-/g, '').replace(/\s/g, '');
    return phoneDigits.slice(-4) === phoneLast4;
  });
  
  // 정확히 1명만 매칭되는 경우만 반환
  if (matches.length === 1) {
    return matches[0];
  } else if (matches.length > 1) {
    // 가장 최근 고객 반환 (ID가 큰 것)
    return matches.sort((a, b) => b.id - a.id)[0];
  }
  
  return null;
}

async function migrateCustomersFromImageAssets() {
  console.log('🚀 image_assets 테이블 기반 고객 마이그레이션 시작...\n');
  console.log('='.repeat(80));
  
  // 1. image_assets에서 originals/customers 폴더의 모든 이미지 조회
  console.log('\n1️⃣ image_assets에서 고객 이미지 조회...');
  
  let allImages = [];
  let offset = 0;
  const batchSize = 1000;
  
  while (true) {
    const { data: images, error } = await supabase
      .from('image_assets')
      .select('id, file_path, ai_tags, cdn_url')
      .ilike('file_path', 'originals/customers/%')
      .range(offset, offset + batchSize - 1);
    
    if (error) {
      console.error('❌ 이미지 조회 오류:', error);
      break;
    }
    
    if (!images || images.length === 0) {
      break;
    }
    
    allImages = allImages.concat(images);
    offset += batchSize;
    
    if (images.length < batchSize) {
      break;
    }
  }
  
  console.log(`✅ ${allImages.length}개의 고객 이미지 발견\n`);
  
  // 2. 폴더별로 그룹화
  console.log('2️⃣ 폴더별로 이미지 그룹화...');
  
  const folderImageMap = new Map();
  
  for (const image of allImages) {
    const folderName = extractFolderName(image.file_path);
    if (!folderName) continue;
    
    if (!folderImageMap.has(folderName)) {
      folderImageMap.set(folderName, []);
    }
    folderImageMap.get(folderName).push(image);
  }
  
  console.log(`✅ ${folderImageMap.size}개의 고객 폴더 발견\n`);
  
  // 3. 각 폴더를 전화번호로 매칭하고 마이그레이션
  console.log('3️⃣ 전화번호로 고객 매칭 및 마이그레이션 시작...\n');
  
  const stats = {
    total: folderImageMap.size,
    matched: 0,
    unmatched: 0,
    folderNameUpdated: 0,
    imagesUpdated: 0,
    imagesNoChange: 0,
    errors: 0
  };
  
  const folderCustomerMap = new Map();
  
  for (const [folderName, images] of folderImageMap.entries()) {
    const phoneLast4 = extractPhoneLast4(folderName);
    
    console.log(`📁 ${folderName} (${images.length}개 이미지)`);
    
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
    
    // folder_name 업데이트 (없거나 다른 경우)
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
    
    folderCustomerMap.set(folderName, customer);
    stats.matched++;
    
    // 각 이미지의 ai_tags 업데이트
    const customerTag = `customer-${customer.id}`;
    let updated = 0;
    let noChange = 0;
    let errors = 0;
    
    for (const image of images) {
      const tags = image.ai_tags || [];
      const newTags = Array.isArray(tags) ? [...tags] : [];
      
      if (!newTags.includes(customerTag)) {
        newTags.push(customerTag);
        const uniqueTags = [...new Set(newTags)];
        
        const { error: updateError } = await supabase
          .from('image_assets')
          .update({ 
            ai_tags: uniqueTags,
            updated_at: new Date().toISOString()
          })
          .eq('id', image.id);
        
        if (updateError) {
          console.warn(`   ⚠️  이미지 업데이트 실패 (${image.id}):`, updateError.message);
          errors++;
        } else {
          updated++;
        }
      } else {
        noChange++;
      }
    }
    
    stats.imagesUpdated += updated;
    stats.imagesNoChange += noChange;
    stats.errors += errors;
    
    if (updated > 0) {
      console.log(`   ✅ ai_tags 업데이트: ${updated}개, 변경없음: ${noChange}개`);
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
  console.log(`   🔄 ai_tags 업데이트: ${stats.imagesUpdated}개`);
  console.log(`   ✅ 변경없음: ${stats.imagesNoChange}개`);
  console.log(`   ❌ 오류: ${stats.errors}개`);
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

migrateCustomersFromImageAssets().catch(console.error);
