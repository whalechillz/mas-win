const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGeocodingSuccessCount() {
  console.log('='.repeat(80));
  console.log('📊 지오코딩 성공 고객 수 확인');
  console.log('='.repeat(80));
  console.log('');

  // 1. 전체 고객 수
  const { count: totalCustomers } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true });

  console.log(`1. 전체 고객 수: ${totalCustomers || 0}명\n`);

  // 2. 지오코딩 성공한 고객 수 (customer_address_cache에서)
  const { data: successCacheData, count: successCount } = await supabase
    .from('customer_address_cache')
    .select('customer_id', { count: 'exact' })
    .eq('geocoding_status', 'success');

  const uniqueSuccessCustomers = new Set(successCacheData?.map(c => c.customer_id).filter(Boolean) || []);

  console.log(`2. 지오코딩 성공한 고객 수 (고유 customer_id 기준): ${uniqueSuccessCustomers.size}명`);
  console.log(`   (캐시 레코드 수: ${successCount || 0}건)\n`);

  // 3. 상태별 분류
  const { data: allCacheData } = await supabase
    .from('customer_address_cache')
    .select('customer_id, geocoding_status');

  const statusCounts = {
    success: new Set(),
    failed: new Set(),
    unconfirmed: new Set(),
    missing: new Set(),
  };

  allCacheData?.forEach(cache => {
    if (cache.customer_id) {
      if (cache.geocoding_status === 'success') {
        statusCounts.success.add(cache.customer_id);
      } else if (cache.geocoding_status === 'failed') {
        statusCounts.failed.add(cache.customer_id);
      } else {
        statusCounts.unconfirmed.add(cache.customer_id);
      }
    }
  });

  // cache가 없는 고객
  const { data: allCustomers } = await supabase
    .from('customers')
    .select('id');

  const customersWithCache = new Set(allCacheData?.map(c => c.customer_id).filter(Boolean) || []);
  allCustomers?.forEach(c => {
    if (c.id && !customersWithCache.has(c.id)) {
      statusCounts.missing.add(c.id);
    }
  });

  console.log('3. 상태별 고객 수:');
  console.log(`   - 성공: ${statusCounts.success.size}명`);
  console.log(`   - 실패: ${statusCounts.failed.size}명`);
  console.log(`   - 미확인: ${statusCounts.unconfirmed.size}명`);
  console.log(`   - 위치 정보 없음: ${statusCounts.missing.size}명`);
  console.log(`   - 합계: ${statusCounts.success.size + statusCounts.failed.size + statusCounts.unconfirmed.size + statusCounts.missing.size}명\n`);

  // 4. API 응답 확인
  console.log('4. API 응답 확인:');
  console.log('   - hasAddress=all, status=all: 전체 고객');
  console.log('   - hasAddress=with, status=all: 지오코딩 성공한 고객 (928명?)');
  console.log('   - hasAddress=all, status=success: 지오코딩 성공한 고객 (313명?)');
  console.log('   - hasAddress=with, status=success: 지오코딩 성공한 고객 (313명?)\n');

  console.log('='.repeat(80));
  console.log('✅ 확인 완료');
  console.log('='.repeat(80));
}

checkGeocodingSuccessCount().catch(console.error);
