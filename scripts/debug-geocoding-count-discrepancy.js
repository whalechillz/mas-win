const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugGeocodingCountDiscrepancy() {
  console.log('='.repeat(80));
  console.log('🔍 지오코딩 카운트 불일치 디버깅');
  console.log('='.repeat(80));
  console.log('');

  // 1. 지오코딩 성공한 고객 수 (직접 조회)
  const { data: successCacheData } = await supabase
    .from('customer_address_cache')
    .select('customer_id, address, geocoding_status')
    .eq('geocoding_status', 'success');

  const uniqueSuccessCustomers = new Set(successCacheData?.map(c => c.customer_id).filter(Boolean) || []);
  console.log(`1. 지오코딩 성공한 고객 수 (직접 조회): ${uniqueSuccessCustomers.size}명`);
  console.log(`   (캐시 레코드 수: ${successCacheData?.length || 0}건)\n`);

  // 2. LEFT JOIN으로 조회 (effective_address 매칭)
  const { data: allCustomers } = await supabase
    .from('customers')
    .select('id, phone, address')
    .limit(100); // 샘플로 100명만

  const { data: allSurveys } = await supabase
    .from('surveys')
    .select('phone, address');

  const surveyMap = new Map();
  allSurveys?.forEach(s => {
    if (s.phone) {
      const phone = s.phone.replace(/[^0-9]/g, '');
      if (phone) {
        surveyMap.set(phone, s.address);
      }
    }
  });

  let matchedCount = 0;
  let unmatchedCount = 0;

  for (const customer of allCustomers || []) {
    if (!customer.id) continue;

    const phone = customer.phone?.replace(/[^0-9]/g, '') || '';
    const surveyAddress = surveyMap.get(phone);
    const effectiveAddress = (surveyAddress && 
      surveyAddress !== '' && 
      !surveyAddress.startsWith('[') && 
      surveyAddress !== 'N/A') 
      ? surveyAddress 
      : customer.address;

    // customer_address_cache에서 effective_address와 일치하는 레코드 찾기
    const { data: cacheData } = await supabase
      .from('customer_address_cache')
      .select('*')
      .eq('customer_id', customer.id)
      .eq('geocoding_status', 'success');

    if (cacheData && cacheData.length > 0) {
      const matched = cacheData.some(cache => {
        // address가 정확히 일치하는지 확인
        return cache.address === effectiveAddress;
      });

      if (matched) {
        matchedCount++;
      } else {
        unmatchedCount++;
        if (unmatchedCount <= 5) {
          console.log(`   불일치 예시: 고객 ID ${customer.id}, effective_address: ${effectiveAddress}`);
          console.log(`     캐시 주소들: ${cacheData.map(c => c.address).join(', ')}`);
        }
      }
    }
  }

  console.log(`2. 샘플 100명 중 매칭 결과:`);
  console.log(`   - 매칭됨: ${matchedCount}명`);
  console.log(`   - 불일치: ${unmatchedCount}명\n`);

  // 3. 문제 원인 분석
  console.log('3. 문제 원인 분석:');
  console.log('   LEFT JOIN에서 cache.address와 effective_address가 정확히 일치해야 하는데,');
  console.log('   주소 정규화나 공백 차이로 인해 일부가 매칭되지 않을 수 있습니다.\n');

  console.log('='.repeat(80));
  console.log('✅ 디버깅 완료');
  console.log('='.repeat(80));
}

debugGeocodingCountDiscrepancy().catch(console.error);
