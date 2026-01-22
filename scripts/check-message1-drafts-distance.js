/**
 * 메시지 1 초안 (ID 452, 453, 454)의 거리 정보 확인 스크립트
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

async function checkDraftsDistance() {
  console.log('='.repeat(80));
  console.log('🔍 메시지 1 초안 거리 정보 확인');
  console.log('='.repeat(80));
  console.log('');

  const draftIds = [452, 453, 454];

  try {
    for (const draftId of draftIds) {
      console.log(`📋 초안 ID ${draftId} 확인 중...`);
      
      // 초안 정보 조회
      const { data: draft, error: draftError } = await supabase
        .from('channel_sms')
        .select('id, message_text, recipient_numbers, note')
        .eq('id', draftId)
        .single();

      if (draftError || !draft) {
        console.error(`   ❌ 초안 조회 실패:`, draftError);
        continue;
      }

      const recipientNumbers = draft.recipient_numbers || [];
      console.log(`   수신자 수: ${recipientNumbers.length}명`);
      console.log(`   메모: ${draft.note || '(없음)'}`);
      console.log('');

      if (recipientNumbers.length === 0) {
        console.log(`   ⚠️  수신자가 없습니다.`);
        console.log('');
        continue;
      }

      // 전화번호 정규화
      const normalizePhone = (phone) => phone.replace(/[^0-9]/g, '');
      const normalizedPhones = recipientNumbers.map(normalizePhone).filter(Boolean);

      // 고객 ID 조회
      const { data: customers, error: customerError } = await supabase
        .from('customers')
        .select('id, phone, name')
        .in('phone', normalizedPhones);

      if (customerError) {
        console.error(`   ❌ 고객 조회 오류:`, customerError);
        continue;
      }

      const customerIdMap = new Map();
      const customerNameMap = new Map();
      
      if (customers) {
        customers.forEach(c => {
          const normalizedPhone = normalizePhone(c.phone);
          if (normalizedPhone) {
            customerIdMap.set(normalizedPhone, c.id);
            customerNameMap.set(normalizedPhone, c.name || '(이름 없음)');
          }
        });
      }

      console.log(`   고객 ID 조회: ${customerIdMap.size}명`);
      
      // 거리 정보 조회
      const customerIds = Array.from(customerIdMap.values());
      
      if (customerIds.length === 0) {
        console.log(`   ⚠️  고객 ID를 찾을 수 없습니다.`);
        console.log('');
        continue;
      }

      const { data: cacheData, error: cacheError } = await supabase
        .from('customer_address_cache')
        .select('customer_id, distance_km, geocoding_status')
        .in('customer_id', customerIds)
        .eq('geocoding_status', 'success')
        .not('distance_km', 'is', null)
        .order('updated_at', { ascending: false });

      if (cacheError) {
        console.error(`   ❌ 거리 정보 조회 오류:`, cacheError);
        continue;
      }

      // 고객 ID별 최신 거리 정보 매핑
      const customerDistanceMap = new Map();
      if (cacheData) {
        cacheData.forEach(cache => {
          if (cache.customer_id && cache.distance_km !== null) {
            if (!customerDistanceMap.has(cache.customer_id)) {
              customerDistanceMap.set(cache.customer_id, cache.distance_km);
            }
          }
        });
      }

      // 전화번호별 거리 정보 매핑
      const phoneDistanceMap = new Map();
      customerIdMap.forEach((customerId, phone) => {
        const distance = customerDistanceMap.get(customerId);
        if (distance !== undefined) {
          phoneDistanceMap.set(phone, distance);
        }
      });

      // 통계 계산
      const withDistance = phoneDistanceMap.size;
      const withoutDistance = normalizedPhones.length - withDistance;
      const within50km = Array.from(phoneDistanceMap.values()).filter(d => d <= 50).length;
      const over50km = Array.from(phoneDistanceMap.values()).filter(d => d > 50).length;

      console.log(`   거리 정보 통계:`);
      console.log(`      - 거리 정보 있음: ${withDistance}명`);
      console.log(`      - 거리 정보 없음: ${withoutDistance}명`);
      console.log(`      - 50km 이내: ${within50km}명`);
      console.log(`      - 50km 초과: ${over50km}명`);
      console.log('');

      // 거리 정보가 없는 수신자 샘플 출력
      if (withoutDistance > 0) {
        const phonesWithoutDistance = normalizedPhones.filter(phone => !phoneDistanceMap.has(phone));
        console.log(`   ⚠️  거리 정보가 없는 수신자 샘플 (최대 5명):`);
        phonesWithoutDistance.slice(0, 5).forEach(phone => {
          const customerId = customerIdMap.get(phone);
          const name = customerNameMap.get(phone) || '(이름 없음)';
          console.log(`      - ${name} (${phone}) - 고객ID: ${customerId || '(없음)'}`);
        });
        if (phonesWithoutDistance.length > 5) {
          console.log(`      ... 외 ${phonesWithoutDistance.length - 5}명`);
        }
        console.log('');
      }

      // 거리 정보가 있는 수신자 샘플 출력
      if (withDistance > 0) {
        const phonesWithDistance = Array.from(phoneDistanceMap.entries())
          .sort((a, b) => a[1] - b[1]) // 거리순 정렬
          .slice(0, 5);
        
        console.log(`   ✅ 거리 정보가 있는 수신자 샘플 (최대 5명, 거리순):`);
        phonesWithDistance.forEach(([phone, distance]) => {
          const name = customerNameMap.get(phone) || '(이름 없음)';
          const distanceRounded = Math.round(distance * 10) / 10;
          console.log(`      - ${name} (${phone}): ${distanceRounded}km`);
        });
        if (withDistance > 5) {
          console.log(`      ... 외 ${withDistance - 5}명`);
        }
        console.log('');
      }

      // 메시지 템플릿 확인
      const hasDistanceVariable = draft.message_text?.includes('{distance_km}');
      console.log(`   메시지 템플릿:`);
      console.log(`      - distance_km 변수 포함: ${hasDistanceVariable ? '✅ 예' : '❌ 아니오'}`);
      if (hasDistanceVariable) {
        console.log(`      - 변수 치환 가능: ${withDistance > 0 ? '✅ 예' : '⚠️  거리 정보가 있는 수신자가 없음'}`);
      }
      console.log('');

      console.log('─'.repeat(80));
      console.log('');
    }

    console.log('✅ 확인 완료!');
    console.log('');
    console.log('📌 요약:');
    console.log('   - 각 초안의 수신자별 거리 정보 확인 완료');
    console.log('   - 거리 정보가 없는 수신자는 변수 치환 시 "0"으로 표시됩니다');
    console.log('   - 거리 정보가 있는 수신자는 실제 거리 값으로 치환됩니다');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  checkDraftsDistance()
    .then(() => {
      console.log('✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { checkDraftsDistance };
