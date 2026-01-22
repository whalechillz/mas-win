const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCustomersWithDistance() {
  console.log('='.repeat(80));
  console.log('📊 거리 있는 고객 수 확인');
  console.log('='.repeat(80));
  console.log('');

  // 1. 전체 고객 수
  const { count: totalCustomers } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true });

  console.log(`1. 전체 고객 수: ${totalCustomers || 0}명\n`);

  // 2. 지오코딩 성공한 고객 수 (거리 정보 있음) - "거리 있는 고객"
  const { data: successWithDistanceData, count: successWithDistanceCount } = await supabase
    .from('customer_address_cache')
    .select('customer_id', { count: 'exact' })
    .eq('geocoding_status', 'success')
    .not('distance_km', 'is', null);

  const uniqueWithDistance = new Set(successWithDistanceData?.map(c => c.customer_id).filter(Boolean) || []);

  console.log(`2. 거리 있는 고객 수 (지오코딩 성공 + 거리 정보 있음):`);
  console.log(`   - 고유 customer_id 기준: ${uniqueWithDistance.size}명`);
  console.log(`   - 캐시 레코드 수: ${successWithDistanceCount || 0}건\n`);

  // 3. 지오코딩 성공했지만 거리 정보가 없는 고객
  const { data: successWithoutDistanceData } = await supabase
    .from('customer_address_cache')
    .select('customer_id')
    .eq('geocoding_status', 'success')
    .is('distance_km', null);

  const uniqueSuccessWithoutDistance = new Set(successWithoutDistanceData?.map(c => c.customer_id).filter(Boolean) || []);

  console.log(`3. 지오코딩 성공했지만 거리 정보가 없는 고객: ${uniqueSuccessWithoutDistance.size}명\n`);

  // 4. 지오코딩 성공한 고객 수 (거리 정보 여부 무관) - "성공" 필터
  const { data: allSuccessData } = await supabase
    .from('customer_address_cache')
    .select('customer_id')
    .eq('geocoding_status', 'success');

  const uniqueAllSuccess = new Set(allSuccessData?.map(c => c.customer_id).filter(Boolean) || []);

  console.log(`4. 지오코딩 성공한 고객 수 (거리 정보 여부 무관): ${uniqueAllSuccess.size}명\n`);

  // 5. 지오코딩 실패한 고객
  const { data: failedData } = await supabase
    .from('customer_address_cache')
    .select('customer_id')
    .eq('geocoding_status', 'failed');

  const uniqueFailed = new Set(failedData?.map(c => c.customer_id).filter(Boolean) || []);

  console.log(`5. 지오코딩 실패한 고객: ${uniqueFailed.size}명\n`);

  // 6. 지오코딩이 안 된 고객 (cache가 없는 고객)
  const { data: allCacheData } = await supabase
    .from('customer_address_cache')
    .select('customer_id');

  const customersWithCache = new Set(allCacheData?.map(c => c.customer_id).filter(Boolean) || []);
  const customersWithoutCache = (totalCustomers || 0) - customersWithCache.size;

  console.log(`6. 지오코딩이 안 된 고객 (cache 없음): ${customersWithoutCache}명\n`);

  // 7. 상태별 요약
  console.log('7. 상태별 요약:');
  console.log(`   - 거리 있는 고객 (with_distance): ${uniqueWithDistance.size}명`);
  console.log(`   - 지오코딩 성공 (거리 없음): ${uniqueSuccessWithoutDistance.size}명`);
  console.log(`   - 지오코딩 성공 (전체, success 필터): ${uniqueAllSuccess.size}명`);
  console.log(`   - 지오코딩 실패: ${uniqueFailed.size}명`);
  console.log(`   - 지오코딩 안 됨: ${customersWithoutCache}명`);
  console.log(`   - 합계: ${uniqueWithDistance.size + uniqueSuccessWithoutDistance.size + uniqueFailed.size + customersWithoutCache}명\n`);

  // 8. 거리 범위별 분포
  console.log('8. 거리 범위별 분포 (거리 있는 고객 기준):');
  const { data: distanceData } = await supabase
    .from('customer_address_cache')
    .select('distance_km')
    .eq('geocoding_status', 'success')
    .not('distance_km', 'is', null);

  if (distanceData && distanceData.length > 0) {
    const distances = distanceData.map(d => d.distance_km).filter(d => d !== null && d !== undefined);
    const ranges = {
      '0-10km': distances.filter(d => d >= 0 && d < 10).length,
      '10-50km': distances.filter(d => d >= 10 && d < 50).length,
      '50-100km': distances.filter(d => d >= 50 && d < 100).length,
      '100km 이상': distances.filter(d => d >= 100).length,
    };
    
    console.log(`   - 0-10km: ${ranges['0-10km']}명`);
    console.log(`   - 10-50km: ${ranges['10-50km']}명`);
    console.log(`   - 50-100km: ${ranges['50-100km']}명`);
    console.log(`   - 100km 이상: ${ranges['100km 이상']}명`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ 확인 완료');
  console.log('='.repeat(80));
  console.log(`\n📌 결론:`);
  console.log(`   - 거리 있는 고객 (with_distance): ${uniqueWithDistance.size}명`);
  console.log(`   - 지오코딩 성공한 고객 (success, 거리 여부 무관): ${uniqueAllSuccess.size}명`);
  console.log(`   - 차이: ${uniqueAllSuccess.size - uniqueWithDistance.size}명 (지오코딩 성공했지만 거리 정보 없음)\n`);
}

checkCustomersWithDistance().catch(console.error);
