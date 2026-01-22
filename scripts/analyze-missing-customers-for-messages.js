/**
 * 메시지 발송 대상에서 제외된 고객 분석 스크립트
 * 
 * 목적:
 * 1. 전체 고객 중 메시지 발송 대상에 포함되지 않은 고객 확인
 * 2. 제외된 이유별 분류
 * 3. 각 분류별 포함 방안 제시
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function analyzeMissingCustomers() {
  console.log('🔍 메시지 발송 대상에서 제외된 고객 분석\n');
  console.log('='.repeat(60));

  try {
    // 1. 전체 발송 가능 고객 (opt_out=false, phone 있음)
    console.log('📊 1단계: 전체 발송 가능 고객 조회');
    const { data: allSendable, error: allError } = await supabase
      .from('customers')
      .select('id, name, phone, address, opt_out')
      .eq('opt_out', false)
      .not('phone', 'is', null);

    if (allError) {
      console.error('❌ 전체 발송 가능 고객 조회 실패:', allError.message);
      process.exit(1);
    }

    const allSendableIds = new Set((allSendable || []).map(c => c.id));
    console.log(`✅ 전체 발송 가능 고객: ${allSendableIds.size}명\n`);

    // 2. 메시지 발송 대상 고객 ID 수집
    console.log('📊 2단계: 메시지 발송 대상 고객 ID 수집');
    
    // 메시지 1, 2 대상 (거리 정보 있음)
    const { data: withDistance, error: distanceError } = await supabase
      .from('customer_address_cache')
      .select('customer_id, geocoding_status, distance_km')
      .eq('geocoding_status', 'success')
      .not('distance_km', 'is', null);

    if (distanceError) {
      console.error('❌ 거리 정보 조회 실패:', distanceError.message);
      process.exit(1);
    }

    const messageTargetIds = new Set((withDistance || []).map(c => c.customer_id));
    
    // 메시지 3 대상 (주소 없음) = 전체 발송 가능 중 거리 정보 없는 고객
    // 이미 messageTargetIds에 포함되지 않은 고객은 메시지 3 대상
    
    console.log(`✅ 거리 정보 있는 고객: ${messageTargetIds.size}명\n`);

    // 3. 제외된 고객 찾기
    console.log('📊 3단계: 제외된 고객 분류');
    
    const excludedIds = Array.from(allSendableIds).filter(id => !messageTargetIds.has(id));
    console.log(`✅ 제외된 고객: ${excludedIds.length}명\n`);

    // 4. 제외된 고객 상세 분석
    console.log('📊 4단계: 제외된 고객 상세 분석');
    
    // customer_address_cache에서 제외된 고객 정보 조회
    const { data: excludedCache, error: cacheError } = await supabase
      .from('customer_address_cache')
      .select('customer_id, geocoding_status, distance_km, address')
      .in('customer_id', excludedIds);

    const excludedCacheMap = new Map();
    (excludedCache || []).forEach(cache => {
      if (!excludedCacheMap.has(cache.customer_id)) {
        excludedCacheMap.set(cache.customer_id, cache);
      }
    });

    // 분류
    const categories = {
      geocodingFailed: [],      // geocoding_status != 'success'
      distanceNull: [],          // distance_km IS NULL
      notInCache: [],            // customer_address_cache에 없음
      hasAddress: [],            // 주소는 있지만 거리 정보 없음
      noAddress: []              // 주소도 없음
    };

    for (const customerId of excludedIds) {
      const customer = allSendable.find(c => c.id === customerId);
      const cache = excludedCacheMap.get(customerId);

      if (!cache) {
        // customer_address_cache에 없음
        if (customer.address && customer.address.trim() !== '') {
          categories.hasAddress.push(customerId);
        } else {
          categories.noAddress.push(customerId);
        }
        categories.notInCache.push(customerId);
      } else {
        // cache에 있지만 조건 불만족
        if (cache.geocoding_status !== 'success') {
          categories.geocodingFailed.push(customerId);
        }
        if (cache.distance_km === null || cache.distance_km === undefined) {
          categories.distanceNull.push(customerId);
        }
      }
    }

    console.log(`\n📋 제외된 고객 분류 결과:`);
    console.log(`   지오코딩 실패: ${categories.geocodingFailed.length}명`);
    console.log(`   거리 정보 NULL: ${categories.distanceNull.length}명`);
    console.log(`   캐시에 없음 (주소 있음): ${categories.hasAddress.length}명`);
    console.log(`   캐시에 없음 (주소 없음): ${categories.noAddress.length}명`);
    console.log(`   총 제외: ${excludedIds.length}명\n`);

    // 5. 포함 방안 제시
    console.log('='.repeat(60));
    console.log('💡 포함 방안');
    console.log('='.repeat(60));
    console.log(`\n1. 지오코딩 실패 고객 (${categories.geocodingFailed.length}명):`);
    console.log('   → 메시지 3 (주소 없음)에 포함');
    console.log('   → 또는 지오코딩 재시도 후 메시지 1, 2에 포함\n');

    console.log(`2. 거리 정보 NULL 고객 (${categories.distanceNull.length}명):`);
    console.log('   → 메시지 3 (주소 없음)에 포함');
    console.log('   → 또는 거리 계산 후 메시지 1, 2에 포함\n');

    console.log(`3. 캐시에 없음 - 주소 있음 (${categories.hasAddress.length}명):`);
    console.log('   → 지오코딩 및 거리 계산 후 메시지 1, 2에 포함');
    console.log('   → 또는 임시로 메시지 3에 포함\n');

    console.log(`4. 캐시에 없음 - 주소 없음 (${categories.noAddress.length}명):`);
    console.log('   → 메시지 3 (주소 없음)에 포함\n');

    // 6. 수정 계획
    console.log('='.repeat(60));
    console.log('📝 수정 계획');
    console.log('='.repeat(60));
    console.log(`\n옵션 1: 빠른 해결 (권장)`);
    console.log(`   - 모든 제외된 고객을 메시지 3에 포함`);
    console.log(`   - 추가 고객: ${excludedIds.length}명`);
    console.log(`   - 메시지 3 총 고객: ${624 + excludedIds.length}명`);
    console.log(`   - 청크 수: ${Math.ceil((624 + excludedIds.length) / 200)}개\n`);

    console.log(`옵션 2: 정확한 분류`);
    console.log(`   - 지오코딩 재시도 후 거리 정보 있는 고객은 메시지 1, 2에 포함`);
    console.log(`   - 나머지는 메시지 3에 포함`);
    console.log(`   - 시간이 더 걸리지만 더 정확한 분류 가능\n`);

    // 7. 제외된 고객 ID 목록 저장 (옵션)
    console.log('💾 제외된 고객 ID 목록:');
    console.log(`   총 ${excludedIds.length}개 ID`);
    if (excludedIds.length > 0) {
      console.log(`   예시 (처음 10개): ${excludedIds.slice(0, 10).join(', ')}`);
    }
    console.log('');

  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  }
}

analyzeMissingCustomers()
  .then(() => {
    console.log('✅ 분석 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });
