/**
 * 전체 고객 대상 설문 조사 A/B/C 테스트 메시지 생성
 * 페이지네이션을 사용하여 모든 고객을 가져옴
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

// 페이지네이션을 사용하여 모든 고객 조회
async function getAllCustomers(purchased) {
  console.log(`\n📋 ${purchased ? '구매자' : '비구매자'} 전체 조회 중...`);
  
  const allPhones = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    let query = supabase
      .from('customers')
      .select('phone', { count: 'exact' })
      .not('phone', 'is', null)
      .eq('opt_out', false)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (purchased) {
      query = query.not('last_purchase_date', 'is', null);
    } else {
      query = query.is('last_purchase_date', null);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error(`❌ ${purchased ? '구매자' : '비구매자'} 조회 실패:`, error.message);
      break;
    }

    if (data && data.length > 0) {
      const phones = data
        .map(c => c.phone)
        .filter(p => p && p.length >= 10)
        .map(p => p.replace(/[-\s]/g, ''))
        .filter(p => p.startsWith('010') && p.length === 11);
      
      allPhones.push(...phones);
      console.log(`   페이지 ${page + 1}: ${phones.length}명 (누적: ${allPhones.length}명)`);
    }

    // 다음 페이지 확인
    const totalCount = count || 0;
    if (data.length < pageSize || allPhones.length >= totalCount) {
      hasMore = false;
    } else {
      page++;
    }
  }

  console.log(`✅ ${purchased ? '구매자' : '비구매자'} 총 ${allPhones.length}명 발견`);
  return allPhones;
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

// 이미지 경로 확인 (Solapi imageId)
async function getSolapiImageId() {
  // 이미 생성된 메시지에서 imageId 가져오기
  const { data: existingMessages } = await supabase
    .from('channel_sms')
    .select('image_url')
    .in('id', [227, 228, 229, 230, 231, 232])
    .not('image_url', 'is', null)
    .limit(1);

  if (existingMessages && existingMessages.length > 0) {
    const imageId = existingMessages[0].image_url;
    if (imageId && imageId.startsWith('ST01FZ')) {
      return imageId;
    }
  }

  console.error('❌ Solapi imageId를 찾을 수 없습니다.');
  return null;
}

// 메시지 생성
async function createMessage(messageText, recipients, customerType, version, imageId, batchNumber = '') {
  const formattedRecipients = recipients.map(formatPhoneNumber);
  const versionName = version === 'A' ? '태국' : version === 'B' ? '베트남' : '일본';
  const batchSuffix = batchNumber ? ` - ${batchNumber}차` : '';
  const note = `A/B/C 테스트 - ${customerType === 'purchaser' ? '구매자' : '비구매자'} - ${version}(${versionName}) 버전 (${formattedRecipients.length}명)${batchSuffix}`;

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
  console.log('📊 전체 고객 설문 조사 A/B/C 테스트 메시지 생성');
  console.log('='.repeat(100));
  console.log('');

  // Solapi imageId 확인 (하드코딩된 값 사용)
  const imageId = 'ST01FZ251215022939395w6sR1vmZC52';
  console.log(`✅ Solapi imageId 확인: ${imageId.substring(0, 30)}...\n`);

  // 이미 생성된 메시지의 수신자 번호 가져오기
  const { data: existingMessages } = await supabase
    .from('channel_sms')
    .select('recipient_numbers')
    .like('note', '%A/B/C 테스트%');

  const existingPhones = new Set();
  if (existingMessages) {
    existingMessages.forEach(msg => {
      if (msg.recipient_numbers && Array.isArray(msg.recipient_numbers)) {
        msg.recipient_numbers.forEach(phone => {
          const cleaned = phone.replace(/[-\s]/g, '');
          if (cleaned.startsWith('010') && cleaned.length === 11) {
            existingPhones.add(cleaned);
          }
        });
      }
    });
  }
  console.log(`📋 이미 생성된 메시지 수신자: ${existingPhones.size}명\n`);

  // 1. 비구매자 전체 조회
  console.log('='.repeat(100));
  console.log('1단계: 비구매자 메시지 생성');
  console.log('='.repeat(100));
  
  const allNonPurchasers = await getAllCustomers(false);
  const remainingNonPurchasers = allNonPurchasers.filter(p => !existingPhones.has(p));
  
  if (remainingNonPurchasers.length === 0) {
    console.log('⚠️ 나머지 비구매자가 없습니다.\n');
  } else {
    console.log(`📊 나머지 비구매자: ${remainingNonPurchasers.length}명\n`);
    const nonPurchaserGroups = splitRecipientsForABCTest(remainingNonPurchasers);
    
    console.log(`📊 비구매자 A/B/C 분할 결과:`);
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
        console.log(`📝 비구매자 ${version.key} 버전 (${version.name}) 메시지 생성 중...`);
        await createMessage(
          MESSAGES[version.key],
          nonPurchaserGroups[version.key],
          'nonPurchaser',
          version.key,
          imageId,
          '추가'
        );
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  // 2. 구매자 전체 조회
  console.log('\n' + '='.repeat(100));
  console.log('2단계: 구매자 메시지 생성');
  console.log('='.repeat(100));
  
  const allPurchasers = await getAllCustomers(true);
  const remainingPurchasers = allPurchasers.filter(p => !existingPhones.has(p));
  
  if (remainingPurchasers.length === 0) {
    console.log('⚠️ 나머지 구매자가 없습니다.\n');
  } else {
    console.log(`📊 나머지 구매자: ${remainingPurchasers.length}명\n`);
    const purchaserGroups = splitRecipientsForABCTest(remainingPurchasers);
    
    console.log(`📊 구매자 A/B/C 분할 결과:`);
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
        console.log(`📝 구매자 ${version.key} 버전 (${version.name}) 메시지 생성 중...`);
        await createMessage(
          MESSAGES[version.key],
          purchaserGroups[version.key],
          'purchaser',
          version.key,
          imageId,
          '추가'
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

