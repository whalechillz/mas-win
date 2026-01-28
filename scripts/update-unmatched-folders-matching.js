/**
 * 매칭되지 않은 폴더의 발견된 고객 정보를 바탕으로 매칭 업데이트
 * 
 * 발견된 매칭:
 * 1. joseongdae-7010 → 조성대 (ID: 2112) - 이미 folder_name이 있음
 * 2. kimchangi-3802 → 김찬기 (ID: 1702) - 이미 folder_name이 있음
 * 3. minhosik-5549 → 민호식 (ID: 2041) - 이미 folder_name이 있음
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

async function updateUnmatchedFoldersMatching() {
  console.log('🔧 매칭되지 않은 폴더 매칭 업데이트 시작...\n');
  console.log('='.repeat(80));
  
  // 발견된 매칭 정보
  const foundMatches = [
    {
      folderName: 'joseongdae-7010',
      customerId: 2112,
      customerName: '조성대',
      reason: 'image_assets에서 customer_id 추출',
      alreadyMatched: true // 이미 folder_name이 있음
    },
    {
      folderName: 'kimchangi-3802',
      customerId: 1702,
      customerName: '김찬기',
      reason: 'image_assets에서 customer_id 추출',
      alreadyMatched: true // 이미 folder_name이 있음
    },
    {
      folderName: 'minhosik-5549',
      customerId: 2041,
      customerName: '민호식',
      reason: 'image_assets에서 customer_id 추출 + 전화번호 매칭',
      alreadyMatched: true // 이미 folder_name이 있음
    }
  ];
  
  console.log('\n✅ 발견된 매칭 (이미 folder_name이 있는 고객):\n');
  
  for (const match of foundMatches) {
    console.log(`📁 ${match.folderName}`);
    console.log(`   → ${match.customerName} (ID: ${match.customerId})`);
    console.log(`   이유: ${match.reason}`);
    console.log(`   상태: ✅ 이미 folder_name이 설정되어 있음`);
    console.log('');
  }
  
  // customers 테이블에서 확인
  console.log('1️⃣ customers 테이블에서 확인...\n');
  
  const customerIds = foundMatches.map(m => m.customerId);
  const { data: customers, error } = await supabase
    .from('customers')
    .select('id, name, phone, folder_name')
    .in('id', customerIds);
  
  if (error) {
    console.error('❌ 고객 조회 오류:', error);
    return;
  }
  
  console.log('✅ 고객 정보 확인:\n');
  customers?.forEach(c => {
    const match = foundMatches.find(m => m.customerId === c.id);
    console.log(`[${c.id}] ${c.name}`);
    console.log(`   전화: ${c.phone || '없음'}`);
    console.log(`   folder_name: ${c.folder_name || '없음'}`);
    if (match) {
      console.log(`   매칭 폴더: ${match.folderName}`);
      if (c.folder_name === match.folderName) {
        console.log(`   ✅ folder_name 일치!`);
      } else if (c.folder_name) {
        console.log(`   ⚠️  folder_name 불일치 (현재: ${c.folder_name}, 예상: ${match.folderName})`);
      } else {
        console.log(`   ⚠️  folder_name 없음 (업데이트 필요)`);
      }
    }
    console.log('');
  });
  
  // image_assets에서 각 폴더의 이미지 확인
  console.log('2️⃣ image_assets에서 각 폴더의 이미지 확인...\n');
  
  for (const match of foundMatches) {
    const folderPath = `originals/customers/${match.folderName}`;
    
    const { data: images, error: imagesError } = await supabase
      .from('image_assets')
      .select('id, file_path, ai_tags')
      .ilike('file_path', `${folderPath}%`)
      .limit(100);
    
    if (!imagesError && images) {
      console.log(`📁 ${match.folderName}: ${images.length}개 이미지`);
      
      // ai_tags에서 customer_id 확인
      const customerIdsInTags = new Set();
      images.forEach(img => {
        const tags = img.ai_tags || [];
        if (Array.isArray(tags)) {
          tags.forEach(tag => {
            if (typeof tag === 'string' && tag.startsWith('customer-')) {
              const id = parseInt(tag.replace('customer-', ''), 10);
              if (!isNaN(id)) {
                customerIdsInTags.add(id);
              }
            }
          });
        }
      });
      
      if (customerIdsInTags.size > 0) {
        console.log(`   customer_id in ai_tags: ${Array.from(customerIdsInTags).join(', ')}`);
        if (customerIdsInTags.has(match.customerId)) {
          console.log(`   ✅ ${match.customerName} (ID: ${match.customerId}) 태그 존재`);
        } else {
          console.log(`   ⚠️  ${match.customerName} (ID: ${match.customerId}) 태그 없음 (업데이트 필요)`);
        }
      }
      console.log('');
    }
  }
  
  // 최종 요약
  console.log('='.repeat(80));
  console.log('📊 최종 요약:');
  console.log('='.repeat(80));
  console.log(`   발견된 매칭: ${foundMatches.length}개`);
  console.log(`   이미 folder_name 있는 고객: ${foundMatches.filter(m => m.alreadyMatched).length}개`);
  console.log('='.repeat(80));
  
  console.log('\n✅ 작업 완료!');
  console.log('\n💡 다음 단계:');
  console.log('   1. 이미 folder_name이 있는 고객들은 이미 매칭되어 있음');
  console.log('   2. 나머지 13개 폴더는 다른 방법으로 검색 필요');
  console.log('   3. image_assets에 이미지가 있지만 customer_id 태그가 없는 경우 업데이트 필요');
}

updateUnmatchedFoldersMatching().catch(console.error);
