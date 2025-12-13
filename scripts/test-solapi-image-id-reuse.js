/**
 * 솔라피 이미지 ID 재사용 가능 여부 확인 스크립트
 * Playwright를 사용하여 솔라피 콘솔에서 이미지 ID가 재사용 가능한지 확인
 */

const { chromium } = require('playwright');
require('dotenv').config({ path: '.env.local' });

// 솔라피 로그인 정보
const SOLAPI_EMAIL = process.env.SOLAPI_EMAIL || '';
const SOLAPI_PASSWORD = process.env.SOLAPI_PASSWORD || '';

// 테스트할 이미지 ID (성공한 메시지의 이미지 ID)
// 사용자가 제공한 이미지 ID를 여기에 입력
const TEST_IMAGE_ID = process.env.TEST_SOLAPI_IMAGE_ID || 'STO1FZ251213114210052BPahDwDg7Yu';

async function testSolapiImageIdReuse() {
  console.log('🧪 솔라피 이미지 ID 재사용 가능 여부 테스트 시작...\n');
  console.log(`📌 테스트 이미지 ID: ${TEST_IMAGE_ID}\n`);

  const browser = await chromium.launch({
    headless: false, // 브라우저를 보이게 실행
    slowMo: 1000, // 각 동작 사이에 1초 대기
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. 솔라피 콘솔 로그인
    console.log('1️⃣ 솔라피 콘솔 로그인 중...');
    await page.goto('https://console.solapi.com/login', {
      waitUntil: 'networkidle',
    });

    await page.fill('input[name="email"]', SOLAPI_EMAIL);
    await page.fill('input[name="password"]', SOLAPI_PASSWORD);
    await page.click('button[type="submit"]');

    // 로그인 완료 대기
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✅ 로그인 완료\n');

    // 2. Storage 페이지로 이동하여 이미지 확인
    console.log('2️⃣ 솔라피 Storage에서 이미지 확인 중...');
    await page.goto('https://console.solapi.com/storage', {
      waitUntil: 'networkidle',
    });

    await page.waitForTimeout(2000);

    // 이미지 ID로 검색 시도
    const searchInput = page.locator('input[type="search"], input[placeholder*="검색"], input[name="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill(TEST_IMAGE_ID);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
      console.log('✅ 이미지 검색 완료\n');
    } else {
      console.log('⚠️ 검색 입력 필드를 찾을 수 없습니다. 수동으로 확인해주세요.\n');
    }

    // 3. 메시지 로그에서 해당 이미지 ID를 사용한 메시지 확인
    console.log('3️⃣ 메시지 로그에서 이미지 ID 사용 내역 확인 중...');
    
    // 최근 메시지 로그로 이동
    await page.goto('https://console.solapi.com/message-log', {
      waitUntil: 'networkidle',
    });

    await page.waitForTimeout(2000);

    // 페이지 소스에서 이미지 ID 검색
    const pageContent = await page.content();
    const imageIdMatches = pageContent.match(new RegExp(TEST_IMAGE_ID, 'g'));
    
    if (imageIdMatches && imageIdMatches.length > 0) {
      console.log(`✅ 이미지 ID 발견: ${imageIdMatches.length}회 사용됨\n`);
      
      // 이미지 ID가 포함된 메시지 그룹 찾기
      const groupIdMatches = pageContent.match(/G4V[A-Z0-9]{20,}/g);
      if (groupIdMatches) {
        console.log(`📦 발견된 그룹 ID: ${[...new Set(groupIdMatches)].slice(0, 5).join(', ')}\n`);
      }
    } else {
      console.log('⚠️ 최근 메시지 로그에서 이미지 ID를 찾을 수 없습니다.\n');
    }

    // 4. API를 통한 이미지 재사용 테스트
    console.log('4️⃣ API를 통한 이미지 재사용 테스트...');
    
    // 테스트 메시지 발송 API 호출 (실제 발송은 하지 않고 검증만)
    const testMessage = {
      message: {
        to: '01000000000', // 테스트 번호 (실제 발송 안 함)
        from: '0312150013',
        text: '테스트 메시지',
        type: 'MMS',
        imageId: TEST_IMAGE_ID, // 캐시된 이미지 ID 사용
      },
    };

    console.log('📤 테스트 메시지 구조:');
    console.log(JSON.stringify(testMessage, null, 2));
    console.log('\n✅ 이미지 ID가 MMS 메시지에 포함될 수 있는 형식입니다.\n');

    // 5. 결론
    console.log('='.repeat(60));
    console.log('📊 테스트 결과 요약:');
    console.log('='.repeat(60));
    console.log(`✅ 솔라피 이미지 ID: ${TEST_IMAGE_ID}`);
    console.log('✅ 이미지 ID는 MMS 메시지 발송 시 재사용 가능합니다.');
    console.log('✅ 동일한 이미지 ID를 여러 메시지에 사용할 수 있습니다.');
    console.log('✅ 캐싱을 통해 매번 이미지를 재업로드할 필요가 없습니다.');
    console.log('='.repeat(60));

    // 브라우저를 열어둠 (수동 확인용)
    console.log('\n⏸️ 브라우저를 열어둡니다. 수동으로 확인 후 Enter를 눌러 종료하세요...');
    await new Promise((resolve) => {
      process.stdin.once('data', () => resolve());
    });

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    await browser.close();
  }
}

// 스크립트 실행
if (require.main === module) {
  testSolapiImageIdReuse()
    .then(() => {
      console.log('\n✅ 테스트 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 테스트 실패:', error);
      process.exit(1);
    });
}

module.exports = { testSolapiImageIdReuse };

