/**
 * 카카오 비즈니스 파트너센터에서 API 키 찾기 스크립트
 * 
 * 사용법:
 * node scripts/find-kakao-api-keys.js
 * 
 * 환경 변수:
 * - KAKAO_EMAIL: 카카오 계정 이메일 (예: taksoo.kim@gmail.com)
 * - KAKAO_PASSWORD: 카카오 계정 비밀번호
 */

require('dotenv').config({ path: '.env.local' });
const { chromium } = require('playwright');

const KAKAO_BUSINESS_URL = 'https://business.kakao.com';
const KAKAO_EMAIL = process.env.KAKAO_EMAIL || 'taksoo.kim@gmail.com';
const KAKAO_PASSWORD = process.env.KAKAO_PASSWORD || '';

async function findKakaoApiKeys() {
  console.log('🔍 카카오 비즈니스 파트너센터 API 키 찾기 시작...\n');
  
  const browser = await chromium.launch({ 
    headless: false, // 브라우저 창 표시
    channel: 'chrome-beta' // 크롬 베타 사용
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();

  try {
    // 1. 카카오 비즈니스 파트너센터 로그인
    console.log('1️⃣ 카카오 비즈니스 파트너센터 로그인 중...');
    await page.goto(`${KAKAO_BUSINESS_URL}/login`, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    await page.waitForTimeout(2000);

    // 로그인 페이지 확인
    if (page.url().includes('/login')) {
      console.log('   이메일 입력 중...');
      
      // 이메일 입력 필드 찾기
      const emailInput = page.locator('input[type="email"]').or(
        page.locator('input[name="email"]')
      ).or(
        page.locator('input[id*="email"]')
      ).or(
        page.locator('input[placeholder*="이메일"]')
      ).first();
      
      await emailInput.waitFor({ timeout: 10000 });
      await emailInput.fill(KAKAO_EMAIL);
      await page.waitForTimeout(500);

      console.log('   비밀번호 입력 중...');
      const passwordInput = page.locator('input[type="password"]').or(
        page.locator('input[name="password"]')
      ).or(
        page.locator('input[id*="password"]')
      ).first();
      
      await passwordInput.fill(KAKAO_PASSWORD);
      await page.waitForTimeout(500);

      console.log('   로그인 버튼 클릭 중...');
      await page.click('button[type="submit"]').or(
        page.click('button:has-text("로그인")')
      );
      
      await page.waitForTimeout(3000);
      
      // 2단계 인증 대기
      console.log('   💡 2단계 인증 대기 중... (최대 5분)');
      console.log('      브라우저에서 수동으로 2단계 인증을 완료해주세요.');
      console.log('      (카카오톡 또는 네이버 메일: johnnyutah@naver.com / mas99000)');
      
      const maxWaitTime = 5 * 60 * 1000; // 5분
      const checkInterval = 10 * 1000; // 10초마다 확인
      let waitedTime = 0;

      while (waitedTime < maxWaitTime) {
        const currentUrl = page.url();
        if (!currentUrl.includes('/login') && currentUrl.includes('business.kakao.com')) {
          console.log('   ✅ 로그인 완료!\n');
          break;
        }
        await page.waitForTimeout(checkInterval);
        waitedTime += checkInterval;
        console.log(`   대기 중... (${Math.floor(waitedTime / 1000)}초 경과)`);
      }
    } else {
      console.log('   ✅ 이미 로그인되어 있습니다.\n');
    }

    // 2. 설정 페이지로 이동
    console.log('2️⃣ 설정 페이지로 이동 중...');
    
    // 여러 경로 시도
    const settingsPaths = [
      '/settings',
      '/settings/api',
      '/settings/api-management',
      '/admin/settings',
      '/admin/api',
      '/_vSVuV/settings',
      '/_vSVuV/settings/api'
    ];

    let settingsFound = false;
    for (const path of settingsPaths) {
      try {
        await page.goto(`${KAKAO_BUSINESS_URL}${path}`, {
          waitUntil: 'domcontentloaded',
          timeout: 10000
        });
        await page.waitForTimeout(2000);
        
        // 설정 페이지 확인
        const pageText = await page.textContent('body');
        if (pageText && (pageText.includes('API') || pageText.includes('설정') || pageText.includes('관리'))) {
          console.log(`   ✅ 설정 페이지 발견: ${path}\n`);
          settingsFound = true;
          break;
        }
      } catch (e) {
        // 다음 경로 시도
        continue;
      }
    }

    if (!settingsFound) {
      // 메뉴에서 설정 찾기
      console.log('   메뉴에서 설정 찾는 중...');
      
      // 상단 메뉴에서 "설정" 또는 "관리" 찾기
      const menuItems = await page.locator('a, button').filter({
        hasText: /설정|관리|API|Settings|Admin/i
      }).all();
      
      for (const item of menuItems) {
        const text = await item.textContent();
        if (text && (text.includes('설정') || text.includes('API') || text.includes('관리'))) {
          console.log(`   "설정" 메뉴 클릭: ${text}`);
          await item.click();
          await page.waitForTimeout(3000);
          break;
        }
      }
    }

    // 3. API 키 찾기
    console.log('3️⃣ API 키 찾는 중...\n');
    
    // 페이지 스크린샷 저장
    await page.screenshot({ path: 'kakao-settings-page.png', fullPage: true });
    console.log('   📸 페이지 스크린샷 저장: kakao-settings-page.png\n');

    // 페이지 내용 분석
    const pageContent = await page.textContent('body');
    const pageHTML = await page.content();

    // API 키 관련 텍스트 찾기
    const apiKeyPatterns = [
      /Admin\s*Key/i,
      /REST\s*API\s*Key/i,
      /앱\s*키/i,
      /서버\s*키/i,
      /API\s*키/i,
      /플러스친구\s*ID/i,
      /채널\s*ID/i,
      /Plus\s*Friend\s*ID/i,
      /Channel\s*ID/i
    ];

    console.log('   📋 페이지에서 찾은 API 관련 키워드:');
    for (const pattern of apiKeyPatterns) {
      const matches = pageContent.match(new RegExp(pattern.source, 'gi'));
      if (matches) {
        console.log(`      - ${matches[0]}`);
      }
    }

    // 입력 필드나 표시된 키 값 찾기
    const inputFields = await page.locator('input[type="text"], input[type="password"], code, pre, span').all();
    const foundKeys = [];

    for (const field of inputFields.slice(0, 50)) { // 처음 50개만 확인
      try {
        const value = await field.inputValue().catch(() => null) || 
                     await field.textContent().catch(() => null);
        
        if (value && value.length > 10 && value.length < 200) {
          // API 키처럼 보이는 값 (길이와 패턴 체크)
          if (/^[a-zA-Z0-9_-]+$/.test(value.trim())) {
            const fieldId = await field.getAttribute('id').catch(() => '');
            const fieldName = await field.getAttribute('name').catch(() => '');
            const fieldLabel = await field.getAttribute('aria-label').catch(() => '');
            
            if (fieldId.includes('api') || fieldId.includes('key') || 
                fieldName.includes('api') || fieldName.includes('key') ||
                fieldLabel.includes('api') || fieldLabel.includes('key')) {
              foundKeys.push({
                value: value.trim(),
                id: fieldId,
                name: fieldName,
                label: fieldLabel
              });
            }
          }
        }
      } catch (e) {
        // 무시
      }
    }

    if (foundKeys.length > 0) {
      console.log('\n   ✅ 발견된 API 키 후보:');
      foundKeys.forEach((key, index) => {
        console.log(`      ${index + 1}. ${key.value.substring(0, 20)}... (${key.id || key.name || 'unknown'})`);
      });
    }

    // 4. 개발자 콘솔로 이동 시도
    console.log('\n4️⃣ 카카오 개발자 콘솔로 이동 시도...');
    await page.goto('https://developers.kakao.com/console/app', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await page.waitForTimeout(3000);

    // 앱 목록 확인
    const appLinks = await page.locator('a[href*="/app/"]').all();
    if (appLinks.length > 0) {
      console.log(`   ✅ 앱 ${appLinks.length}개 발견`);
      console.log('   첫 번째 앱 클릭 중...');
      await appLinks[0].click();
      await page.waitForTimeout(3000);

      // 앱 키 탭 찾기
      const keyTabs = await page.locator('a, button').filter({
        hasText: /앱\s*키|REST\s*API|API\s*키|App\s*Key/i
      }).all();

      if (keyTabs.length > 0) {
        console.log('   ✅ 앱 키 탭 발견, 클릭 중...');
        await keyTabs[0].click();
        await page.waitForTimeout(2000);
        
        await page.screenshot({ path: 'kakao-developer-console-keys.png', fullPage: true });
        console.log('   📸 앱 키 페이지 스크린샷 저장: kakao-developer-console-keys.png\n');
      }
    }

    // 5. 최종 결과 출력
    console.log('\n' + '='.repeat(80));
    console.log('📋 API 키 찾기 결과');
    console.log('='.repeat(80));
    console.log('\n✅ 스크린샷 파일 확인:');
    console.log('   - kakao-settings-page.png (비즈니스 파트너센터 설정 페이지)');
    console.log('   - kakao-developer-console-keys.png (개발자 콘솔 앱 키 페이지)');
    console.log('\n💡 다음 단계:');
    console.log('   1. 스크린샷에서 API 키 확인');
    console.log('   2. .env.local 파일에 추가:');
    console.log('      KAKAO_ADMIN_KEY=발견한_Admin_Key');
    console.log('      KAKAO_PLUS_FRIEND_ID=발견한_플러스친구_ID');
    console.log('\n📌 참고:');
    console.log('   - Admin Key: 카카오 개발자 콘솔 → 내 애플리케이션 → 앱 키 → REST API 키');
    console.log('   - 플러스친구 ID: 카카오 비즈니스 파트너센터 → 채널 관리 → 채널 ID');
    console.log('='.repeat(80) + '\n');

    // 브라우저를 열어둠 (수동 확인 가능)
    console.log('💡 브라우저를 열어두었습니다. 수동으로 확인하실 수 있습니다.');
    console.log('   Enter 키를 누르면 브라우저를 닫습니다...\n');
    
    // 사용자 입력 대기 (Node.js에서는 readline 사용)
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    await new Promise((resolve) => {
      rl.question('브라우저를 닫으시겠습니까? (y/n): ', (answer) => {
        rl.close();
        resolve();
      });
    });

  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
    console.error('스택:', error.stack);
    
    // 오류 발생 시에도 스크린샷 저장
    try {
      await page.screenshot({ path: 'kakao-error-page.png', fullPage: true });
      console.log('\n📸 오류 페이지 스크린샷 저장: kakao-error-page.png');
    } catch (e) {
      // 무시
    }
  } finally {
    await browser.close();
  }
}

// 실행
findKakaoApiKeys()
  .then(() => {
    console.log('\n✅ 스크립트 완료\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 스크립트 실패:', error);
    process.exit(1);
  });

