/**
 * 설문 조사 A/B/C 테스트 메시지 생성 스크립트
 * 
 * 구매자/비구매자를 각각 A(태국) -> B(베트남) -> C(일본) 버전으로
 * 100명씩 롤링하여 메시지 생성
 * 
 * 사용법:
 * node scripts/create-survey-abc-test-messages.js
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

// A/B/C 테스트 메시지 템플릿 (구매자/비구매자 구분 없음)
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

// 고객 조회 (구매 여부별)
async function getCustomers(purchased) {
  console.log(`\n📋 ${purchased ? '구매자' : '비구매자'} 조회 중...`);
  
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
    .filter(p => p.startsWith('010') && p.length === 11);

  console.log(`✅ ${purchased ? '구매자' : '비구매자'} ${phones.length}명 발견`);
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

// 이미지 경로 확인
async function findImagePath() {
  const imageName = 'bucket-hat-muziik-8.webp';
  
  // 여러 가능한 경로 확인
  const possiblePaths = [
    'main/products/goods/good-reviews',
    'originals',
    'public/main/products/goods/good-reviews'
  ];

  // Storage에서 확인
  for (const basePath of possiblePaths) {
    try {
      const { data, error } = await supabase.storage
        .from('blog-images')
        .list(basePath, {
          search: imageName
        });

      if (!error && data && data.length > 0) {
        const fullPath = `${basePath}/${imageName}`;
        const { data: urlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(fullPath);
        
        if (urlData?.publicUrl) {
          console.log(`✅ 이미지 발견: ${fullPath}`);
          return urlData.publicUrl;
        }
      }
    } catch (e) {
      continue;
    }
  }

  // public 폴더에서 확인
  try {
    const publicUrl = `${LOCAL_URL}/main/products/goods/good-reviews/${imageName}`;
    const testResponse = await fetch(publicUrl, { method: 'HEAD' });
    if (testResponse.ok) {
      console.log(`✅ 이미지 발견 (public): ${publicUrl}`);
      return publicUrl;
    }
  } catch (e) {
    // 무시
  }

  console.warn(`⚠️ 이미지 파일을 찾을 수 없습니다: ${imageName}`);
  console.log('   메시지는 이미지 없이 생성되며, 나중에 수동으로 추가할 수 있습니다.');
  return null;
}

// 메시지 생성
async function createMessage(messageText, recipients, customerType, version, imageUrl) {
  const formattedRecipients = recipients.map(formatPhoneNumber);
  const versionName = version === 'A' ? '태국' : version === 'B' ? '베트남' : '일본';
  const note = `A/B/C 테스트 - ${customerType === 'purchaser' ? '구매자' : '비구매자'} - ${version}(${versionName}) 버전 (${formattedRecipients.length}명)`;

  try {
    const response = await fetch(`${LOCAL_URL}/api/admin/sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: messageText,
        type: 'MMS',
        status: 'draft',
        recipientNumbers: formattedRecipients,
        imageUrl: imageUrl,
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
  console.log('📊 설문 조사 A/B/C 테스트 메시지 생성 스크립트');
  console.log('='.repeat(100));
  console.log('');

  // 이미지 경로 확인
  console.log('🖼️ 이미지 경로 확인 중...');
  const imageUrl = await findImagePath();
  if (imageUrl) {
    console.log(`✅ 이미지 URL: ${imageUrl.substring(0, 80)}...\n`);
  } else {
    console.log('⚠️ 이미지 없이 진행합니다.\n');
  }

  // 1. 비구매자 조회 및 분할
  console.log('='.repeat(100));
  console.log('1단계: 비구매자 A/B/C 테스트 메시지 생성');
  console.log('='.repeat(100));
  
  const nonPurchasers = await getCustomers(false);
  if (nonPurchasers.length === 0) {
    console.log('⚠️ 비구매자가 없습니다. 건너뜁니다.\n');
  } else {
    const nonPurchaserGroups = splitRecipientsForABCTest(nonPurchasers);
    
    console.log(`\n📊 비구매자 A/B/C 분할 결과:`);
    console.log(`   A 버전 (태국): ${nonPurchaserGroups.A.length}명`);
    console.log(`   B 버전 (베트남): ${nonPurchaserGroups.B.length}명`);
    console.log(`   C 버전 (일본): ${nonPurchaserGroups.C.length}명`);
    console.log(`   총: ${nonPurchasers.length}명\n`);

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
          imageUrl
        );
        await new Promise(resolve => setTimeout(resolve, 500)); // API 부하 방지
      }
    }
  }

  // 2. 구매자 조회 및 분할
  console.log('\n' + '='.repeat(100));
  console.log('2단계: 구매자 A/B/C 테스트 메시지 생성');
  console.log('='.repeat(100));
  
  const purchasers = await getCustomers(true);
  if (purchasers.length === 0) {
    console.log('⚠️ 구매자가 없습니다. 건너뜁니다.\n');
  } else {
    const purchaserGroups = splitRecipientsForABCTest(purchasers);
    
    console.log(`\n📊 구매자 A/B/C 분할 결과:`);
    console.log(`   A 버전 (태국): ${purchaserGroups.A.length}명`);
    console.log(`   B 버전 (베트남): ${purchaserGroups.B.length}명`);
    console.log(`   C 버전 (일본): ${purchaserGroups.C.length}명`);
    console.log(`   총: ${purchasers.length}명\n`);

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
          imageUrl
        );
        await new Promise(resolve => setTimeout(resolve, 500)); // API 부하 방지
      }
    }
  }

  console.log('\n' + '='.repeat(100));
  console.log('✅ 완료!');
  console.log('='.repeat(100));
  console.log('\n💡 SMS 관리 페이지에서 생성된 메시지를 확인하세요.');
  console.log('   /admin/sms-list\n');
  console.log('📋 생성된 메시지 요약:');
  console.log('   - 비구매자: A(태국), B(베트남), C(일본) 버전');
  console.log('   - 구매자: A(태국), B(베트남), C(일본) 버전');
  console.log('   - 각 버전은 100명씩 롤링으로 분할됨\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });


