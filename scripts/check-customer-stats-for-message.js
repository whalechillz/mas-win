/**
 * 메시지 발송을 위한 고객 통계 확인 스크립트
 * 구매자/비구매자, 거리 계산 현황 확인
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 매장 위치 (수원본점)
const STORE_LAT = 37.2808;
const STORE_LNG = 127.0498;

async function checkCustomerStats() {
  console.log('='.repeat(80));
  console.log('📊 메시지 발송을 위한 고객 통계 확인');
  console.log('='.repeat(80));
  console.log('');

  const today = new Date().toISOString().split('T')[0];
  console.log(`📅 확인 일자: ${today}\n`);

  // 1. 전체 고객 수 (수신거부 제외)
  const { count: totalCustomers } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('opt_out', false)
    .not('phone', 'is', null);

  // 2. 구매자 수
  const { count: purchasers } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .not('last_purchase_date', 'is', null)
    .eq('opt_out', false)
    .not('phone', 'is', null);

  // 3. 비구매자 수
  const { count: nonPurchasers } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .is('last_purchase_date', null)
    .eq('opt_out', false)
    .not('phone', 'is', null);

  console.log('📋 고객 통계:');
  console.log(`   전체: ${totalCustomers || 0}명`);
  console.log(`   구매자: ${purchasers || 0}명`);
  console.log(`   비구매자: ${nonPurchasers || 0}명`);
  console.log('');

  // 4. 구매자 거리 계산 현황
  const { data: purchaserCustomers } = await supabase
    .from('customers')
    .select('id, phone, address')
    .not('last_purchase_date', 'is', null)
    .eq('opt_out', false)
    .not('phone', 'is', null);

  let purchaserWithAddress = 0;
  let purchaserWithoutAddress = 0;
  let purchaserNearDistance = 0; // 50km 이내
  let purchaserFarDistance = 0; // 50km 이상
  let purchaserNoDistance = 0; // 거리 계산 안됨

  if (purchaserCustomers) {
    for (const customer of purchaserCustomers) {
      if (customer.address && customer.address.trim() !== '') {
        purchaserWithAddress++;
        
        // customer_address_cache에서 거리 확인
        const { data: cache } = await supabase
          .from('customer_address_cache')
          .select('distance_km, geocoding_status')
          .eq('customer_id', customer.id)
          .eq('geocoding_status', 'success')
          .not('distance_km', 'is', null)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (cache && cache.distance_km !== null) {
          if (cache.distance_km < 50) {
            purchaserNearDistance++;
          } else {
            purchaserFarDistance++;
          }
        } else {
          purchaserNoDistance++;
        }
      } else {
        purchaserWithoutAddress++;
        purchaserNoDistance++;
      }
    }
  }

  console.log('📊 구매자 거리 계산 현황:');
  console.log(`   주소 있음: ${purchaserWithAddress}명`);
  console.log(`   주소 없음: ${purchaserWithoutAddress}명`);
  console.log(`   근거리 (50km 이내): ${purchaserNearDistance}명`);
  console.log(`   원거리 (50km 이상): ${purchaserFarDistance}명`);
  console.log(`   거리 계산 안됨: ${purchaserNoDistance}명`);
  console.log('');

  // 5. 비구매자 거리 계산 현황
  const { data: nonPurchaserCustomers } = await supabase
    .from('customers')
    .select('id, phone, address')
    .is('last_purchase_date', null)
    .eq('opt_out', false)
    .not('phone', 'is', null);

  let nonPurchaserWithAddress = 0;
  let nonPurchaserWithoutAddress = 0;
  let nonPurchaserNearDistance = 0; // 50km 이내
  let nonPurchaserFarDistance = 0; // 50km 이상
  let nonPurchaserNoDistance = 0; // 거리 계산 안됨

  if (nonPurchaserCustomers) {
    for (const customer of nonPurchaserCustomers) {
      if (customer.address && customer.address.trim() !== '') {
        nonPurchaserWithAddress++;
        
        // customer_address_cache에서 거리 확인
        const { data: cache } = await supabase
          .from('customer_address_cache')
          .select('distance_km, geocoding_status')
          .eq('customer_id', customer.id)
          .eq('geocoding_status', 'success')
          .not('distance_km', 'is', null)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (cache && cache.distance_km !== null) {
          if (cache.distance_km < 50) {
            nonPurchaserNearDistance++;
          } else {
            nonPurchaserFarDistance++;
          }
        } else {
          nonPurchaserNoDistance++;
        }
      } else {
        nonPurchaserWithoutAddress++;
        nonPurchaserNoDistance++;
      }
    }
  }

  console.log('📊 비구매자 거리 계산 현황:');
  console.log(`   주소 있음: ${nonPurchaserWithAddress}명`);
  console.log(`   주소 없음: ${nonPurchaserWithoutAddress}명`);
  console.log(`   근거리 (50km 이내): ${nonPurchaserNearDistance}명`);
  console.log(`   원거리 (50km 이상): ${nonPurchaserFarDistance}명`);
  console.log(`   거리 계산 안됨: ${nonPurchaserNoDistance}명`);
  console.log('');

  // 6. 200명 단위 분할 계획
  console.log('='.repeat(80));
  console.log('📦 200명 단위 메시지 분할 계획');
  console.log('='.repeat(80));
  console.log('');

  const CHUNK_SIZE = 200;

  // 구매자 분할
  console.log('🛒 구매자 분할 계획:');
  console.log(`   총 ${purchasers || 0}명`);
  
  const purchaserChunks = [];
  let purchaserRemaining = purchasers || 0;
  let purchaserChunkIndex = 1;

  // 근거리 구매자
  if (purchaserNearDistance > 0) {
    const nearChunks = Math.ceil(purchaserNearDistance / CHUNK_SIZE);
    for (let i = 0; i < nearChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, purchaserNearDistance);
      purchaserChunks.push({
        index: purchaserChunkIndex++,
        type: '구매자-근거리',
        count: end - start,
        range: `${start + 1}-${end}`,
        message: '구매자 버전 - 근거리 (50km 이내)'
      });
    }
  }

  // 원거리 구매자
  if (purchaserFarDistance > 0) {
    const farChunks = Math.ceil(purchaserFarDistance / CHUNK_SIZE);
    for (let i = 0; i < farChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, purchaserFarDistance);
      purchaserChunks.push({
        index: purchaserChunkIndex++,
        type: '구매자-원거리',
        count: end - start,
        range: `${start + 1}-${end}`,
        message: '구매자 버전 - 원거리 (50km 이상)'
      });
    }
  }

  // 거리 계산 안된 구매자
  if (purchaserNoDistance > 0) {
    const noDistanceChunks = Math.ceil(purchaserNoDistance / CHUNK_SIZE);
    for (let i = 0; i < noDistanceChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, purchaserNoDistance);
      purchaserChunks.push({
        index: purchaserChunkIndex++,
        type: '구매자-거리없음',
        count: end - start,
        range: `${start + 1}-${end}`,
        message: '구매자 버전 - 거리 정보 없음'
      });
    }
  }

  purchaserChunks.forEach(chunk => {
    console.log(`   청크 ${chunk.index}: ${chunk.type} ${chunk.count}명 (${chunk.range})`);
    console.log(`      → ${chunk.message}`);
  });
  console.log(`   총 ${purchaserChunks.length}개 청크\n`);

  // 비구매자 분할
  console.log('👤 비구매자 분할 계획:');
  console.log(`   총 ${nonPurchasers || 0}명`);
  
  const nonPurchaserChunks = [];
  let nonPurchaserChunkIndex = 1;

  // 근거리 비구매자
  if (nonPurchaserNearDistance > 0) {
    const nearChunks = Math.ceil(nonPurchaserNearDistance / CHUNK_SIZE);
    for (let i = 0; i < nearChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, nonPurchaserNearDistance);
      nonPurchaserChunks.push({
        index: nonPurchaserChunkIndex++,
        type: '비구매자-근거리',
        count: end - start,
        range: `${start + 1}-${end}`,
        message: '비구매자 버전 - 근거리 (50km 이내)'
      });
    }
  }

  // 원거리 비구매자
  if (nonPurchaserFarDistance > 0) {
    const farChunks = Math.ceil(nonPurchaserFarDistance / CHUNK_SIZE);
    for (let i = 0; i < farChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, nonPurchaserFarDistance);
      nonPurchaserChunks.push({
        index: nonPurchaserChunkIndex++,
        type: '비구매자-원거리',
        count: end - start,
        range: `${start + 1}-${end}`,
        message: '비구매자 버전 - 원거리 (50km 이상)'
      });
    }
  }

  // 거리 계산 안된 비구매자
  if (nonPurchaserNoDistance > 0) {
    const noDistanceChunks = Math.ceil(nonPurchaserNoDistance / CHUNK_SIZE);
    for (let i = 0; i < noDistanceChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, nonPurchaserNoDistance);
      nonPurchaserChunks.push({
        index: nonPurchaserChunkIndex++,
        type: '비구매자-거리없음',
        count: end - start,
        range: `${start + 1}-${end}`,
        message: '비구매자 버전 - 거리 정보 없음'
      });
    }
  }

  nonPurchaserChunks.forEach(chunk => {
    console.log(`   청크 ${chunk.index}: ${chunk.type} ${chunk.count}명 (${chunk.range})`);
    console.log(`      → ${chunk.message}`);
  });
  console.log(`   총 ${nonPurchaserChunks.length}개 청크\n`);

  // 전체 요약
  console.log('='.repeat(80));
  console.log('📋 전체 요약');
  console.log('='.repeat(80));
  console.log('');
  console.log(`총 고객 수: ${totalCustomers || 0}명`);
  console.log(`구매자: ${purchasers || 0}명 (${purchaserChunks.length}개 청크)`);
  console.log(`비구매자: ${nonPurchasers || 0}명 (${nonPurchaserChunks.length}개 청크)`);
  console.log(`총 청크 수: ${purchaserChunks.length + nonPurchaserChunks.length}개`);
  console.log('');

  return {
    totalCustomers: totalCustomers || 0,
    purchasers: purchasers || 0,
    nonPurchasers: nonPurchasers || 0,
    purchaserStats: {
      withAddress: purchaserWithAddress,
      withoutAddress: purchaserWithoutAddress,
      nearDistance: purchaserNearDistance,
      farDistance: purchaserFarDistance,
      noDistance: purchaserNoDistance
    },
    nonPurchaserStats: {
      withAddress: nonPurchaserWithAddress,
      withoutAddress: nonPurchaserWithoutAddress,
      nearDistance: nonPurchaserNearDistance,
      farDistance: nonPurchaserFarDistance,
      noDistance: nonPurchaserNoDistance
    },
    purchaserChunks,
    nonPurchaserChunks
  };
}

checkCustomerStats()
  .then(result => {
    console.log('✅ 통계 확인 완료');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  });
