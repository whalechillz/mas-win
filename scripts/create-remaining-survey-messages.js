/**
 * 나머지 고객들에 대한 설문 조사 메시지 생성
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LOCAL_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// A/B/C 테스트 메시지 템플릿
const MESSAGES = {
  A: `[MASSGOO X MUZIIK] 콜라보 기념 설문 조사

싸와디캅! 따뜻한 겨울, 태국 필드에서도 빛나는 선물

태국 필드에서 가장 가벼운 스윙을 준비하세요

선호하는 샤프트 설문 참여 시 특별 선물 증정!
• 스타일리시한 버킷햇
• 콜라보 골프모자

참여하기:
https://www.masgolf.co.kr/survey`,
  B: `[MASSGOO X MUZIIK] 콜라보 기념 설문 조사

신짜오! 햇살 가득한 베트남 겨울 필드

힘 빼고 휘둘러도, 거리는 충분합니다

선호하는 샤프트 설문 참여 시 특별 선물 증정!
• 스타일리시한 버킷햇
• 콜라보 골프모자

참여하기:
https://www.masgolf.co.kr/survey`,
  C: `[MASSGOO X MUZIIK] 콜라보 기념 설문 조사

곤니찌와! 부드럽게 휘두르고, 끝까지 살아나는 비거리

일본 필드에서 가장 안정적인 스윙을 준비하세요

선호하는 샤프트 설문 참여 시 특별 선물 증정!
• 스타일리시한 버킷햇
• 콜라보 골프모자

참여하기:
https://www.masgolf.co.kr/survey`
};

// 전화번호 포맷팅
function formatPhoneNumber(phone) {
  const cleaned = phone.replace(/[-\s]/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('010')) {
    return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 7)}-${cleaned.substring(7)}`;
  }
  return cleaned;
}

// 고객 조회 (구매 여부별, 이미 생성된 메시지 제외)
async function getRemainingCustomers(purchased) {
  console.log(`\n📋 나머지 ${purchased ? '구매자' : '비구매자'} 조회 중...`);
  
  // 이미 생성된 메시지의 수신자 번호 가져오기
  const { data: existingMessages } = await supabase
    .from('channel_sms')
    .select('recipient_numbers')
    .in('id', [227, 228, 229, 230, 231, 232]);
  
  const existingPhones = new Set();
  if (existingMessages) {
    existingMessages.forEach(msg => {
      if (msg.recipient_numbers) {
        msg.recipient_numbers.forEach(phone => {
          const cleaned = phone.replace(/[-\s]/g, '');
          existingPhones.add(cleaned);
        });
      }
    });
  }
  
  console.log(`   이미 처리된 번호: ${existingPhones.size}개`);
  
  let query = supabase
    .from('customers')
    .select('phone')
    .not('phone', 'is', null)
    .eq('opt_out', false);

  if (purchased) {
    query = query.not('last_purchase_date', 'is', null);
  } else {
    query = query.is('last_purchase_date', null);
  }

  const { data, error } = await query;

  if (error) {
    console.error(`❌ ${purchased ? '구매자' : '비구매자'} 조회 실패:`, error.message);
    return [];
  }

  const phones = data
    .map(c => c.phone)
    .filter(p => p && p.length >= 10)
    .map(p => p.replace(/[-\s]/g, ''))
    .filter(p => p.startsWith('010') && p.length === 11)
    .filter(p => !existingPhones.has(p)); // 이미 처리된 번호 제외

  console.log(`✅ 나머지 ${purchased ? '구매자' : '비구매자'} ${phones.length}명 발견`);
  return phones;
}

// 수신자 분할 (A->B->C 100명씩 롤링)
function splitRecipientsForABCTest(recipients) {
  const batchSize = 100;
  const versions = ['A', 'B', 'C'];
  const groups = {
    A: [],
    B: [],
    C: []
  };

  recipients.forEach((phone, index) => {
    const batchIndex = Math.floor(index / batchSize);
    const versionIndex = batchIndex % 3; // 0=A, 1=B, 2=C
    const version = versions[versionIndex];
    groups[version].push(phone);
  });

  return groups;
}

// 메시지 생성
async function createMessage(messageText, recipients, customerType, version, imageId) {
  const formattedRecipients = recipients.map(formatPhoneNumber);
  const versionName = version === 'A' ? '태국' : version === 'B' ? '베트남' : '일본';
  const note = `A/B/C 테스트 - ${customerType === 'purchaser' ? '구매자' : '비구매자'} - ${version}(${versionName}) 버전 (${formattedRecipients.length}명) - 추가`;

  try {
    const response = await fetch(`${LOCAL_URL}/api/admin/sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: messageText,
        type: 'MMS',
        status: 'draft',
        recipientNumbers: formattedRecipients,
        imageUrl: imageId,
        note: note
      })
    });

    const result = await response.json();

    if (result.success) {
      const messageId = result.smsContent?.id || result.smsId;
      console.log(`   ✅ 메시지 생성 완료: ID=${messageId}`);
      return messageId;
    } else {
      console.error(`   ❌ 메시지 생성 실패:`, result.message);
      return null;
    }
  } catch (error) {
    console.error(`   ❌ API 호출 실패:`, error.message);
    return null;
  }
}

// 메인 함수
async function main() {
  console.log('='.repeat(100));
  console.log('📊 나머지 고객 설문 조사 메시지 생성');
  console.log('='.repeat(100));
  console.log('');

  // Solapi imageId 가져오기 (이미 생성된 메시지에서)
  const { data: existingMessage } = await supabase
    .from('channel_sms')
    .select('image_url')
    .eq('id', 227)
    .single();
  
  const imageId = existingMessage?.image_url;
  if (!imageId || !imageId.startsWith('ST01FZ')) {
    console.error('❌ Solapi imageId를 찾을 수 없습니다.');
    process.exit(1);
  }
  
  console.log(`✅ Solapi imageId 확인: ${imageId.substring(0, 30)}...\n`);

  // 1. 나머지 비구매자 조회 및 분할
  console.log('='.repeat(100));
  console.log('1단계: 나머지 비구매자 메시지 생성');
  console.log('='.repeat(100));
  
  const remainingNonPurchasers = await getRemainingCustomers(false);
  if (remainingNonPurchasers.length === 0) {
    console.log('⚠️ 나머지 비구매자가 없습니다.\n');
  } else {
    const nonPurchaserGroups = splitRecipientsForABCTest(remainingNonPurchasers);
    
    console.log(`\n📊 나머지 비구매자 A/B/C 분할 결과:`);
    console.log(`   A 버전 (태국): ${nonPurchaserGroups.A.length}명`);
    console.log(`   B 버전 (베트남): ${nonPurchaserGroups.B.length}명`);
    console.log(`   C 버전 (일본): ${nonPurchaserGroups.C.length}명`);
    console.log(`   총: ${remainingNonPurchasers.length}명\n`);

    const versions = [
      { key: 'A', name: '태국' },
      { key: 'B', name: '베트남' },
      { key: 'C', name: '일본' }
    ];

    for (const version of versions) {
      if (nonPurchaserGroups[version.key].length > 0) {
        console.log(`📝 나머지 비구매자 ${version.key} 버전 (${version.name}) 메시지 생성 중...`);
        await createMessage(
          MESSAGES[version.key],
          nonPurchaserGroups[version.key],
          'nonPurchaser',
          version.key,
          imageId
        );
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  // 2. 나머지 구매자 조회 및 분할
  console.log('\n' + '='.repeat(100));
  console.log('2단계: 나머지 구매자 메시지 생성');
  console.log('='.repeat(100));
  
  const remainingPurchasers = await getRemainingCustomers(true);
  if (remainingPurchasers.length === 0) {
    console.log('⚠️ 나머지 구매자가 없습니다.\n');
  } else {
    const purchaserGroups = splitRecipientsForABCTest(remainingPurchasers);
    
    console.log(`\n📊 나머지 구매자 A/B/C 분할 결과:`);
    console.log(`   A 버전 (태국): ${purchaserGroups.A.length}명`);
    console.log(`   B 버전 (베트남): ${purchaserGroups.B.length}명`);
    console.log(`   C 버전 (일본): ${purchaserGroups.C.length}명`);
    console.log(`   총: ${remainingPurchasers.length}명\n`);

    const versions = [
      { key: 'A', name: '태국' },
      { key: 'B', name: '베트남' },
      { key: 'C', name: '일본' }
    ];

    for (const version of versions) {
      if (purchaserGroups[version.key].length > 0) {
        console.log(`📝 나머지 구매자 ${version.key} 버전 (${version.name}) 메시지 생성 중...`);
        await createMessage(
          MESSAGES[version.key],
          purchaserGroups[version.key],
          'purchaser',
          version.key,
          imageId
        );
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  console.log('\n' + '='.repeat(100));
  console.log('✅ 완료!');
  console.log('='.repeat(100));
  console.log('\n💡 SMS 관리 페이지에서 생성된 메시지를 확인하세요.');
  console.log('   /admin/sms-list\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });


