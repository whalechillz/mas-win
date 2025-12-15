/**
 * MASSGOO X MUZIIK 콜라보 설문 조사 메시지 자동 생성 스크립트
 * - 3개의 예약 메시지 생성 (15:00, 15:01, 15:02)
 * - 이미지: composed-1-black-beryl-1764776071615.png
 * - 수신자: 스탭진 2명
 */

require('dotenv').config({ path: '.env.local' });
const { chromium } = require('playwright');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.PRODUCTION_URL || 'https://win.masgolf.co.kr';
const ADMIN_LOGIN = process.env.ADMIN_EMAIL || process.env.ADMIN_LOGIN || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

// 메시지 내용 (옵션 2: 간결 버전)
const MESSAGE_CONTENT = `[MASSGOO X MUZIIK] 콜라보 기념 설문 조사

설문 참여 시 특별 선물 증정! 🎁

• 스타일리시한 버킷햇
• 여권 파우치
• 골프모자
• 티셔츠

참여하기: [링크]

마쓰구골프`;

// 이미지 파일명
const IMAGE_FILENAME = 'composed-1-black-beryl-1764776071615.png';

// 예약 시간 목록 (오늘 날짜 기준)
const SCHEDULE_TIMES = [
  { hour: 15, minute: 0 }, // 15:00
  { hour: 15, minute: 1 }, // 15:01
  { hour: 15, minute: 2 }, // 15:02
];

async function login(page) {
  console.log('🔐 로그인 중...');
  
  await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1000);
  
  // 로그인 페이지인지 확인
  if (page.url().includes('/admin/login')) {
    try {
      // 여러 선택자 시도 (로그인 페이지 구조에 맞게)
      await page.waitForSelector('input#login, input[name="login"]', { timeout: 15000 });
      
      // 로그인 정보 입력 (id 우선)
      const loginInput = page.locator('input#login').or(
        page.locator('input[name="login"]')
      ).first();
      const passwordInput = page.locator('input#password').or(
        page.locator('input[name="password"]')
      ).first();
      
      await loginInput.fill(ADMIN_LOGIN);
      await passwordInput.fill(ADMIN_PASSWORD);
      
      // 로그인 버튼 클릭
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      
      // 로그인 완료 대기
      await page.waitForURL(/\/admin/, { timeout: 20000 }).catch(async () => {
        // URL이 변경되지 않았으면 수동으로 확인
        const currentUrl = page.url();
        if (!currentUrl.includes('/admin/login')) {
          console.log('✅ 로그인 완료 (URL 확인)\n');
        } else {
          throw new Error('로그인 실패: 여전히 로그인 페이지에 있습니다.');
        }
      });
      console.log('✅ 로그인 완료\n');
    } catch (error) {
      console.error('❌ 로그인 실패:', error.message);
      throw error;
    }
  } else {
    console.log('✅ 이미 로그인되어 있습니다.\n');
  }
}

async function createMessage(page, scheduleTime, messageIndex) {
  console.log(`\n📝 메시지 ${messageIndex + 1} 생성 중... (${scheduleTime.hour}:${String(scheduleTime.minute).padStart(2, '0')} 예약)`);
  
  try {
    // 1. SMS 에디터 페이지로 이동
    console.log('   1️⃣ SMS 에디터 페이지로 이동...');
    await page.goto(`${BASE_URL}/admin/sms`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    console.log('   ✅ 페이지 로드 완료');
    
    // 2. MMS 타입 선택
    console.log('   2️⃣ MMS 타입 선택...');
    try {
      // MMS 버튼 찾기 (여러 선택자 시도)
      const mmsButton = page.locator('button:has-text("MMS")').or(
        page.locator('button[class*="MMS"]')
      ).first();
      
      await mmsButton.waitFor({ timeout: 5000 });
      await mmsButton.click();
      await page.waitForTimeout(500);
      console.log('   ✅ MMS 타입 선택 완료');
    } catch (error) {
      console.log('   ⚠️ MMS 버튼을 찾을 수 없습니다. 기본값으로 진행...');
    }
    
    // 3. 메시지 내용 입력
    console.log('   3️⃣ 메시지 내용 입력...');
    try {
      // 텍스트 영역 찾기
      const textarea = page.locator('textarea').or(
        page.locator('div[contenteditable="true"]')
      ).first();
      
      await textarea.waitFor({ timeout: 5000 });
      await textarea.click();
      await page.waitForTimeout(300);
      
      // 기존 내용 지우기
      await textarea.fill('');
      await page.waitForTimeout(300);
      
      // 메시지 내용 입력
      await textarea.fill(MESSAGE_CONTENT);
      await page.waitForTimeout(500);
      console.log('   ✅ 메시지 내용 입력 완료');
    } catch (error) {
      console.error('   ❌ 메시지 내용 입력 실패:', error.message);
      throw error;
    }
    
    // 4. 이미지 선택
    console.log('   4️⃣ 이미지 선택...');
    try {
      // "갤러리에서 선택" 버튼 찾기
      const galleryButton = page.locator('button:has-text("갤러리에서 선택")').first();
      await galleryButton.waitFor({ timeout: 5000 });
      await galleryButton.click();
      await page.waitForTimeout(3000);
      console.log('   ✅ 갤러리 모달 열림');
      
      // 갤러리 모달에서 이미지 검색
      const searchInput = page.locator('input[placeholder*="파일명"], input[placeholder*="검색"], input[placeholder*="키워드"]').first();
      if (await searchInput.isVisible({ timeout: 5000 })) {
        await searchInput.fill(IMAGE_FILENAME);
        await page.waitForTimeout(2000);
        console.log('   ✅ 이미지 검색 완료');
      }
      
      // 이미지 썸네일 클릭 (검색 결과 중 첫 번째)
      await page.waitForTimeout(2000); // 이미지 로드 대기
      const imageThumbnail = page.locator('img[src*="supabase"], img[src*="storage"]').first();
      if (await imageThumbnail.isVisible({ timeout: 5000 })) {
        // 이미지 썸네일 클릭
        await imageThumbnail.click({ force: true });
        await page.waitForTimeout(1000);
        console.log('   ✅ 이미지 썸네일 클릭 완료');
        
        // "선택" 버튼 클릭 (이미지 썸네일 위에 있는 버튼)
        const selectButton = page.locator('button:has-text("선택"):not(:has-text("갤러리"))').first();
        if (await selectButton.isVisible({ timeout: 3000 })) {
          await selectButton.click({ force: true });
          await page.waitForTimeout(2000);
          console.log('   ✅ 이미지 선택 완료');
        } else {
          // 모달 닫기 버튼 클릭 (×)
          const closeButton = page.locator('button:has-text("×")').or(
            page.locator('button[class*="close"]')
          ).first();
          if (await closeButton.isVisible({ timeout: 2000 })) {
            await closeButton.click({ force: true });
            await page.waitForTimeout(1000);
            console.log('   ⚠️ 모달 닫기 (이미지가 자동 선택되었을 수 있음)');
          }
        }
      } else {
        // 이미지를 찾을 수 없으면 모달 닫기
        const closeButton = page.locator('button:has-text("×")').or(
          page.locator('button[class*="close"]')
        ).first();
        if (await closeButton.isVisible({ timeout: 2000 })) {
          await closeButton.click({ force: true });
          await page.waitForTimeout(1000);
        }
        console.log('   ⚠️ 이미지를 찾을 수 없습니다. 모달을 닫고 계속 진행합니다.');
      }
    } catch (error) {
      console.error('   ⚠️ 이미지 선택 실패 (계속 진행):', error.message);
      // 모달이 열려있으면 닫기
      try {
        const closeButton = page.locator('button:has-text("×")').first();
        if (await closeButton.isVisible({ timeout: 2000 })) {
          await closeButton.click({ force: true });
          await page.waitForTimeout(1000);
        }
      } catch (e) {
        // ESC 키로 모달 닫기 시도
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
    }
    
    // 5. 스탭진 추가
    console.log('   5️⃣ 스탭진 추가...');
    try {
      // 모달이 열려있으면 먼저 닫기
      const modal = page.locator('div[class*="fixed"][class*="inset-0"]').first();
      if (await modal.isVisible({ timeout: 2000 })) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
      
      const staffButton = page.locator('button:has-text("스탭진 추가")').first();
      await staffButton.waitFor({ timeout: 10000 });
      await staffButton.click({ force: true });
      await page.waitForTimeout(1500);
      console.log('   ✅ 스탭진 추가 완료');
    } catch (error) {
      console.error('   ⚠️ 스탭진 추가 실패 (계속 진행):', error.message);
    }
    
    // 6. 예약 시간 설정
    console.log('   6️⃣ 예약 시간 설정...');
    try {
      // 모달이 열려있으면 먼저 닫기
      const modal = page.locator('div[class*="fixed"][class*="inset-0"]').first();
      if (await modal.isVisible({ timeout: 2000 })) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
      
      // 예약 활성화 체크박스 먼저 체크
      const scheduleCheckbox = page.locator('label:has-text("예약 사용")').locator('input[type="checkbox"]').first();
      if (await scheduleCheckbox.isVisible({ timeout: 5000 })) {
        const isChecked = await scheduleCheckbox.isChecked();
        if (!isChecked) {
          await scheduleCheckbox.check();
          await page.waitForTimeout(500);
          console.log('   ✅ 예약 활성화 체크 완료');
        }
      }
      
      // 오늘 날짜 가져오기
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const hour = String(scheduleTime.hour).padStart(2, '0');
      const minute = String(scheduleTime.minute).padStart(2, '0');
      
      const datetimeValue = `${year}-${month}-${day}T${hour}:${minute}`;
      
      // 예약 시간 입력 필드 찾기
      const scheduleInput = page.locator('input[type="datetime-local"]').first();
      await scheduleInput.waitFor({ timeout: 10000 });
      
      // 기존 값 지우고 새 값 입력
      await scheduleInput.fill('');
      await scheduleInput.fill(datetimeValue);
      await page.waitForTimeout(500);
      
      console.log(`   ✅ 예약 시간 설정 완료: ${datetimeValue}`);
    } catch (error) {
      console.error('   ⚠️ 예약 시간 설정 실패 (계속 진행):', error.message);
    }
    
    // 7. 저장
    console.log('   7️⃣ 저장...');
    try {
      // 모달이 열려있으면 먼저 닫기
      const modal = page.locator('div[class*="fixed"][class*="inset-0"]').first();
      if (await modal.isVisible({ timeout: 2000 })) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
      
      // 저장 버튼 찾기 (여러 선택자 시도)
      const saveButton = page.locator('button:has-text("저장"):not(:has-text("예약"))').first();
      await saveButton.waitFor({ timeout: 10000 });
      
      // 스크롤하여 버튼이 보이도록
      await saveButton.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      
      // force 옵션으로 클릭 (다른 요소에 가려져 있어도)
      await saveButton.click({ force: true });
      await page.waitForTimeout(3000);
      console.log('   ✅ 저장 완료');
    } catch (error) {
      console.error('   ❌ 저장 실패:', error.message);
      throw error;
    }
    
    console.log(`✅ 메시지 ${messageIndex + 1} 생성 완료!\n`);
    
    // 다음 메시지를 위해 잠시 대기
    if (messageIndex < SCHEDULE_TIMES.length - 1) {
      await page.waitForTimeout(2000);
    }
    
  } catch (error) {
    console.error(`❌ 메시지 ${messageIndex + 1} 생성 실패:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 MASSGOO X MUZIIK 콜라보 설문 조사 메시지 자동 생성 시작\n');
  console.log('='.repeat(60));
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`👤 Admin Login: ${ADMIN_LOGIN}`);
  console.log(`📅 예약 시간: ${SCHEDULE_TIMES.map(t => `${t.hour}:${String(t.minute).padStart(2, '0')}`).join(', ')}`);
  console.log(`🖼️  이미지: ${IMAGE_FILENAME}`);
  console.log('='.repeat(60));
  console.log();
  
  const browser = await chromium.launch({ 
    headless: false, // 브라우저 창 표시
    slowMo: 500 // 동작을 천천히 (디버깅용)
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 로그인
    await login(page);
    
    // 3개의 메시지 생성
    for (let i = 0; i < SCHEDULE_TIMES.length; i++) {
      await createMessage(page, SCHEDULE_TIMES[i], i);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ 모든 메시지 생성 완료!');
    console.log('='.repeat(60));
    console.log('\n📋 생성된 메시지:');
    SCHEDULE_TIMES.forEach((time, index) => {
      console.log(`   ${index + 1}. 예약 시간: ${time.hour}:${String(time.minute).padStart(2, '0')}`);
    });
    console.log('\n💡 SMS 리스트 페이지에서 확인하세요: /admin/sms-list\n');
    
    // 브라우저를 5초간 열어두어 확인 가능하게
    console.log('⏳ 5초 후 브라우저를 닫습니다...\n');
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('\n❌ 오류 발생:', error);
    console.log('\n⏳ 10초 후 브라우저를 닫습니다... (오류 확인용)\n');
    await page.waitForTimeout(10000);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);


 * - 3개의 예약 메시지 생성 (15:00, 15:01, 15:02)
 * - 이미지: composed-1-black-beryl-1764776071615.png
 * - 수신자: 스탭진 2명
 */

require('dotenv').config({ path: '.env.local' });
const { chromium } = require('playwright');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.PRODUCTION_URL || 'https://win.masgolf.co.kr';
const ADMIN_LOGIN = process.env.ADMIN_EMAIL || process.env.ADMIN_LOGIN || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

// 메시지 내용 (옵션 2: 간결 버전)
const MESSAGE_CONTENT = `[MASSGOO X MUZIIK] 콜라보 기념 설문 조사

설문 참여 시 특별 선물 증정! 🎁

• 스타일리시한 버킷햇
• 여권 파우치
• 골프모자
• 티셔츠

참여하기: [링크]

마쓰구골프`;

// 이미지 파일명
const IMAGE_FILENAME = 'composed-1-black-beryl-1764776071615.png';

// 예약 시간 목록 (오늘 날짜 기준)
const SCHEDULE_TIMES = [
  { hour: 15, minute: 0 }, // 15:00
  { hour: 15, minute: 1 }, // 15:01
  { hour: 15, minute: 2 }, // 15:02
];

async function login(page) {
  console.log('🔐 로그인 중...');
  
  await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1000);
  
  // 로그인 페이지인지 확인
  if (page.url().includes('/admin/login')) {
    try {
      // 여러 선택자 시도 (로그인 페이지 구조에 맞게)
      await page.waitForSelector('input#login, input[name="login"]', { timeout: 15000 });
      
      // 로그인 정보 입력 (id 우선)
      const loginInput = page.locator('input#login').or(
        page.locator('input[name="login"]')
      ).first();
      const passwordInput = page.locator('input#password').or(
        page.locator('input[name="password"]')
      ).first();
      
      await loginInput.fill(ADMIN_LOGIN);
      await passwordInput.fill(ADMIN_PASSWORD);
      
      // 로그인 버튼 클릭
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      
      // 로그인 완료 대기
      await page.waitForURL(/\/admin/, { timeout: 20000 }).catch(async () => {
        // URL이 변경되지 않았으면 수동으로 확인
        const currentUrl = page.url();
        if (!currentUrl.includes('/admin/login')) {
          console.log('✅ 로그인 완료 (URL 확인)\n');
        } else {
          throw new Error('로그인 실패: 여전히 로그인 페이지에 있습니다.');
        }
      });
      console.log('✅ 로그인 완료\n');
    } catch (error) {
      console.error('❌ 로그인 실패:', error.message);
      throw error;
    }
  } else {
    console.log('✅ 이미 로그인되어 있습니다.\n');
  }
}

async function createMessage(page, scheduleTime, messageIndex) {
  console.log(`\n📝 메시지 ${messageIndex + 1} 생성 중... (${scheduleTime.hour}:${String(scheduleTime.minute).padStart(2, '0')} 예약)`);
  
  try {
    // 1. SMS 에디터 페이지로 이동
    console.log('   1️⃣ SMS 에디터 페이지로 이동...');
    await page.goto(`${BASE_URL}/admin/sms`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    console.log('   ✅ 페이지 로드 완료');
    
    // 2. MMS 타입 선택
    console.log('   2️⃣ MMS 타입 선택...');
    try {
      // MMS 버튼 찾기 (여러 선택자 시도)
      const mmsButton = page.locator('button:has-text("MMS")').or(
        page.locator('button[class*="MMS"]')
      ).first();
      
      await mmsButton.waitFor({ timeout: 5000 });
      await mmsButton.click();
      await page.waitForTimeout(500);
      console.log('   ✅ MMS 타입 선택 완료');
    } catch (error) {
      console.log('   ⚠️ MMS 버튼을 찾을 수 없습니다. 기본값으로 진행...');
    }
    
    // 3. 메시지 내용 입력
    console.log('   3️⃣ 메시지 내용 입력...');
    try {
      // 텍스트 영역 찾기
      const textarea = page.locator('textarea').or(
        page.locator('div[contenteditable="true"]')
      ).first();
      
      await textarea.waitFor({ timeout: 5000 });
      await textarea.click();
      await page.waitForTimeout(300);
      
      // 기존 내용 지우기
      await textarea.fill('');
      await page.waitForTimeout(300);
      
      // 메시지 내용 입력
      await textarea.fill(MESSAGE_CONTENT);
      await page.waitForTimeout(500);
      console.log('   ✅ 메시지 내용 입력 완료');
    } catch (error) {
      console.error('   ❌ 메시지 내용 입력 실패:', error.message);
      throw error;
    }
    
    // 4. 이미지 선택
    console.log('   4️⃣ 이미지 선택...');
    try {
      // "갤러리에서 선택" 버튼 찾기
      const galleryButton = page.locator('button:has-text("갤러리에서 선택")').first();
      await galleryButton.waitFor({ timeout: 5000 });
      await galleryButton.click();
      await page.waitForTimeout(3000);
      console.log('   ✅ 갤러리 모달 열림');
      
      // 갤러리 모달에서 이미지 검색
      const searchInput = page.locator('input[placeholder*="파일명"], input[placeholder*="검색"], input[placeholder*="키워드"]').first();
      if (await searchInput.isVisible({ timeout: 5000 })) {
        await searchInput.fill(IMAGE_FILENAME);
        await page.waitForTimeout(2000);
        console.log('   ✅ 이미지 검색 완료');
      }
      
      // 이미지 썸네일 클릭 (검색 결과 중 첫 번째)
      await page.waitForTimeout(2000); // 이미지 로드 대기
      const imageThumbnail = page.locator('img[src*="supabase"], img[src*="storage"]').first();
      if (await imageThumbnail.isVisible({ timeout: 5000 })) {
        // 이미지 썸네일 클릭
        await imageThumbnail.click({ force: true });
        await page.waitForTimeout(1000);
        console.log('   ✅ 이미지 썸네일 클릭 완료');
        
        // "선택" 버튼 클릭 (이미지 썸네일 위에 있는 버튼)
        const selectButton = page.locator('button:has-text("선택"):not(:has-text("갤러리"))').first();
        if (await selectButton.isVisible({ timeout: 3000 })) {
          await selectButton.click({ force: true });
          await page.waitForTimeout(2000);
          console.log('   ✅ 이미지 선택 완료');
        } else {
          // 모달 닫기 버튼 클릭 (×)
          const closeButton = page.locator('button:has-text("×")').or(
            page.locator('button[class*="close"]')
          ).first();
          if (await closeButton.isVisible({ timeout: 2000 })) {
            await closeButton.click({ force: true });
            await page.waitForTimeout(1000);
            console.log('   ⚠️ 모달 닫기 (이미지가 자동 선택되었을 수 있음)');
          }
        }
      } else {
        // 이미지를 찾을 수 없으면 모달 닫기
        const closeButton = page.locator('button:has-text("×")').or(
          page.locator('button[class*="close"]')
        ).first();
        if (await closeButton.isVisible({ timeout: 2000 })) {
          await closeButton.click({ force: true });
          await page.waitForTimeout(1000);
        }
        console.log('   ⚠️ 이미지를 찾을 수 없습니다. 모달을 닫고 계속 진행합니다.');
      }
    } catch (error) {
      console.error('   ⚠️ 이미지 선택 실패 (계속 진행):', error.message);
      // 모달이 열려있으면 닫기
      try {
        const closeButton = page.locator('button:has-text("×")').first();
        if (await closeButton.isVisible({ timeout: 2000 })) {
          await closeButton.click({ force: true });
          await page.waitForTimeout(1000);
        }
      } catch (e) {
        // ESC 키로 모달 닫기 시도
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
    }
    
    // 5. 스탭진 추가
    console.log('   5️⃣ 스탭진 추가...');
    try {
      // 모달이 열려있으면 먼저 닫기
      const modal = page.locator('div[class*="fixed"][class*="inset-0"]').first();
      if (await modal.isVisible({ timeout: 2000 })) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
      
      const staffButton = page.locator('button:has-text("스탭진 추가")').first();
      await staffButton.waitFor({ timeout: 10000 });
      await staffButton.click({ force: true });
      await page.waitForTimeout(1500);
      console.log('   ✅ 스탭진 추가 완료');
    } catch (error) {
      console.error('   ⚠️ 스탭진 추가 실패 (계속 진행):', error.message);
    }
    
    // 6. 예약 시간 설정
    console.log('   6️⃣ 예약 시간 설정...');
    try {
      // 모달이 열려있으면 먼저 닫기
      const modal = page.locator('div[class*="fixed"][class*="inset-0"]').first();
      if (await modal.isVisible({ timeout: 2000 })) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
      
      // 예약 활성화 체크박스 먼저 체크
      const scheduleCheckbox = page.locator('label:has-text("예약 사용")').locator('input[type="checkbox"]').first();
      if (await scheduleCheckbox.isVisible({ timeout: 5000 })) {
        const isChecked = await scheduleCheckbox.isChecked();
        if (!isChecked) {
          await scheduleCheckbox.check();
          await page.waitForTimeout(500);
          console.log('   ✅ 예약 활성화 체크 완료');
        }
      }
      
      // 오늘 날짜 가져오기
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const hour = String(scheduleTime.hour).padStart(2, '0');
      const minute = String(scheduleTime.minute).padStart(2, '0');
      
      const datetimeValue = `${year}-${month}-${day}T${hour}:${minute}`;
      
      // 예약 시간 입력 필드 찾기
      const scheduleInput = page.locator('input[type="datetime-local"]').first();
      await scheduleInput.waitFor({ timeout: 10000 });
      
      // 기존 값 지우고 새 값 입력
      await scheduleInput.fill('');
      await scheduleInput.fill(datetimeValue);
      await page.waitForTimeout(500);
      
      console.log(`   ✅ 예약 시간 설정 완료: ${datetimeValue}`);
    } catch (error) {
      console.error('   ⚠️ 예약 시간 설정 실패 (계속 진행):', error.message);
    }
    
    // 7. 저장
    console.log('   7️⃣ 저장...');
    try {
      // 모달이 열려있으면 먼저 닫기
      const modal = page.locator('div[class*="fixed"][class*="inset-0"]').first();
      if (await modal.isVisible({ timeout: 2000 })) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
      
      // 저장 버튼 찾기 (여러 선택자 시도)
      const saveButton = page.locator('button:has-text("저장"):not(:has-text("예약"))').first();
      await saveButton.waitFor({ timeout: 10000 });
      
      // 스크롤하여 버튼이 보이도록
      await saveButton.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      
      // force 옵션으로 클릭 (다른 요소에 가려져 있어도)
      await saveButton.click({ force: true });
      await page.waitForTimeout(3000);
      console.log('   ✅ 저장 완료');
    } catch (error) {
      console.error('   ❌ 저장 실패:', error.message);
      throw error;
    }
    
    console.log(`✅ 메시지 ${messageIndex + 1} 생성 완료!\n`);
    
    // 다음 메시지를 위해 잠시 대기
    if (messageIndex < SCHEDULE_TIMES.length - 1) {
      await page.waitForTimeout(2000);
    }
    
  } catch (error) {
    console.error(`❌ 메시지 ${messageIndex + 1} 생성 실패:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 MASSGOO X MUZIIK 콜라보 설문 조사 메시지 자동 생성 시작\n');
  console.log('='.repeat(60));
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`👤 Admin Login: ${ADMIN_LOGIN}`);
  console.log(`📅 예약 시간: ${SCHEDULE_TIMES.map(t => `${t.hour}:${String(t.minute).padStart(2, '0')}`).join(', ')}`);
  console.log(`🖼️  이미지: ${IMAGE_FILENAME}`);
  console.log('='.repeat(60));
  console.log();
  
  const browser = await chromium.launch({ 
    headless: false, // 브라우저 창 표시
    slowMo: 500 // 동작을 천천히 (디버깅용)
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 로그인
    await login(page);
    
    // 3개의 메시지 생성
    for (let i = 0; i < SCHEDULE_TIMES.length; i++) {
      await createMessage(page, SCHEDULE_TIMES[i], i);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ 모든 메시지 생성 완료!');
    console.log('='.repeat(60));
    console.log('\n📋 생성된 메시지:');
    SCHEDULE_TIMES.forEach((time, index) => {
      console.log(`   ${index + 1}. 예약 시간: ${time.hour}:${String(time.minute).padStart(2, '0')}`);
    });
    console.log('\n💡 SMS 리스트 페이지에서 확인하세요: /admin/sms-list\n');
    
    // 브라우저를 5초간 열어두어 확인 가능하게
    console.log('⏳ 5초 후 브라우저를 닫습니다...\n');
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('\n❌ 오류 발생:', error);
    console.log('\n⏳ 10초 후 브라우저를 닫습니다... (오류 확인용)\n');
    await page.waitForTimeout(10000);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);


 * - 3개의 예약 메시지 생성 (15:00, 15:01, 15:02)
 * - 이미지: composed-1-black-beryl-1764776071615.png
 * - 수신자: 스탭진 2명
 */

require('dotenv').config({ path: '.env.local' });
const { chromium } = require('playwright');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.PRODUCTION_URL || 'https://win.masgolf.co.kr';
const ADMIN_LOGIN = process.env.ADMIN_EMAIL || process.env.ADMIN_LOGIN || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

// 메시지 내용 (옵션 2: 간결 버전)
const MESSAGE_CONTENT = `[MASSGOO X MUZIIK] 콜라보 기념 설문 조사

설문 참여 시 특별 선물 증정! 🎁

• 스타일리시한 버킷햇
• 여권 파우치
• 골프모자
• 티셔츠

참여하기: [링크]

마쓰구골프`;

// 이미지 파일명
const IMAGE_FILENAME = 'composed-1-black-beryl-1764776071615.png';

// 예약 시간 목록 (오늘 날짜 기준)
const SCHEDULE_TIMES = [
  { hour: 15, minute: 0 }, // 15:00
  { hour: 15, minute: 1 }, // 15:01
  { hour: 15, minute: 2 }, // 15:02
];

async function login(page) {
  console.log('🔐 로그인 중...');
  
  await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1000);
  
  // 로그인 페이지인지 확인
  if (page.url().includes('/admin/login')) {
    try {
      // 여러 선택자 시도 (로그인 페이지 구조에 맞게)
      await page.waitForSelector('input#login, input[name="login"]', { timeout: 15000 });
      
      // 로그인 정보 입력 (id 우선)
      const loginInput = page.locator('input#login').or(
        page.locator('input[name="login"]')
      ).first();
      const passwordInput = page.locator('input#password').or(
        page.locator('input[name="password"]')
      ).first();
      
      await loginInput.fill(ADMIN_LOGIN);
      await passwordInput.fill(ADMIN_PASSWORD);
      
      // 로그인 버튼 클릭
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      
      // 로그인 완료 대기
      await page.waitForURL(/\/admin/, { timeout: 20000 }).catch(async () => {
        // URL이 변경되지 않았으면 수동으로 확인
        const currentUrl = page.url();
        if (!currentUrl.includes('/admin/login')) {
          console.log('✅ 로그인 완료 (URL 확인)\n');
        } else {
          throw new Error('로그인 실패: 여전히 로그인 페이지에 있습니다.');
        }
      });
      console.log('✅ 로그인 완료\n');
    } catch (error) {
      console.error('❌ 로그인 실패:', error.message);
      throw error;
    }
  } else {
    console.log('✅ 이미 로그인되어 있습니다.\n');
  }
}

async function createMessage(page, scheduleTime, messageIndex) {
  console.log(`\n📝 메시지 ${messageIndex + 1} 생성 중... (${scheduleTime.hour}:${String(scheduleTime.minute).padStart(2, '0')} 예약)`);
  
  try {
    // 1. SMS 에디터 페이지로 이동
    console.log('   1️⃣ SMS 에디터 페이지로 이동...');
    await page.goto(`${BASE_URL}/admin/sms`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    console.log('   ✅ 페이지 로드 완료');
    
    // 2. MMS 타입 선택
    console.log('   2️⃣ MMS 타입 선택...');
    try {
      // MMS 버튼 찾기 (여러 선택자 시도)
      const mmsButton = page.locator('button:has-text("MMS")').or(
        page.locator('button[class*="MMS"]')
      ).first();
      
      await mmsButton.waitFor({ timeout: 5000 });
      await mmsButton.click();
      await page.waitForTimeout(500);
      console.log('   ✅ MMS 타입 선택 완료');
    } catch (error) {
      console.log('   ⚠️ MMS 버튼을 찾을 수 없습니다. 기본값으로 진행...');
    }
    
    // 3. 메시지 내용 입력
    console.log('   3️⃣ 메시지 내용 입력...');
    try {
      // 텍스트 영역 찾기
      const textarea = page.locator('textarea').or(
        page.locator('div[contenteditable="true"]')
      ).first();
      
      await textarea.waitFor({ timeout: 5000 });
      await textarea.click();
      await page.waitForTimeout(300);
      
      // 기존 내용 지우기
      await textarea.fill('');
      await page.waitForTimeout(300);
      
      // 메시지 내용 입력
      await textarea.fill(MESSAGE_CONTENT);
      await page.waitForTimeout(500);
      console.log('   ✅ 메시지 내용 입력 완료');
    } catch (error) {
      console.error('   ❌ 메시지 내용 입력 실패:', error.message);
      throw error;
    }
    
    // 4. 이미지 선택
    console.log('   4️⃣ 이미지 선택...');
    try {
      // "갤러리에서 선택" 버튼 찾기
      const galleryButton = page.locator('button:has-text("갤러리에서 선택")').first();
      await galleryButton.waitFor({ timeout: 5000 });
      await galleryButton.click();
      await page.waitForTimeout(3000);
      console.log('   ✅ 갤러리 모달 열림');
      
      // 갤러리 모달에서 이미지 검색
      const searchInput = page.locator('input[placeholder*="파일명"], input[placeholder*="검색"], input[placeholder*="키워드"]').first();
      if (await searchInput.isVisible({ timeout: 5000 })) {
        await searchInput.fill(IMAGE_FILENAME);
        await page.waitForTimeout(2000);
        console.log('   ✅ 이미지 검색 완료');
      }
      
      // 이미지 썸네일 클릭 (검색 결과 중 첫 번째)
      await page.waitForTimeout(2000); // 이미지 로드 대기
      const imageThumbnail = page.locator('img[src*="supabase"], img[src*="storage"]').first();
      if (await imageThumbnail.isVisible({ timeout: 5000 })) {
        // 이미지 썸네일 클릭
        await imageThumbnail.click({ force: true });
        await page.waitForTimeout(1000);
        console.log('   ✅ 이미지 썸네일 클릭 완료');
        
        // "선택" 버튼 클릭 (이미지 썸네일 위에 있는 버튼)
        const selectButton = page.locator('button:has-text("선택"):not(:has-text("갤러리"))').first();
        if (await selectButton.isVisible({ timeout: 3000 })) {
          await selectButton.click({ force: true });
          await page.waitForTimeout(2000);
          console.log('   ✅ 이미지 선택 완료');
        } else {
          // 모달 닫기 버튼 클릭 (×)
          const closeButton = page.locator('button:has-text("×")').or(
            page.locator('button[class*="close"]')
          ).first();
          if (await closeButton.isVisible({ timeout: 2000 })) {
            await closeButton.click({ force: true });
            await page.waitForTimeout(1000);
            console.log('   ⚠️ 모달 닫기 (이미지가 자동 선택되었을 수 있음)');
          }
        }
      } else {
        // 이미지를 찾을 수 없으면 모달 닫기
        const closeButton = page.locator('button:has-text("×")').or(
          page.locator('button[class*="close"]')
        ).first();
        if (await closeButton.isVisible({ timeout: 2000 })) {
          await closeButton.click({ force: true });
          await page.waitForTimeout(1000);
        }
        console.log('   ⚠️ 이미지를 찾을 수 없습니다. 모달을 닫고 계속 진행합니다.');
      }
    } catch (error) {
      console.error('   ⚠️ 이미지 선택 실패 (계속 진행):', error.message);
      // 모달이 열려있으면 닫기
      try {
        const closeButton = page.locator('button:has-text("×")').first();
        if (await closeButton.isVisible({ timeout: 2000 })) {
          await closeButton.click({ force: true });
          await page.waitForTimeout(1000);
        }
      } catch (e) {
        // ESC 키로 모달 닫기 시도
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
    }
    
    // 5. 스탭진 추가
    console.log('   5️⃣ 스탭진 추가...');
    try {
      // 모달이 열려있으면 먼저 닫기
      const modal = page.locator('div[class*="fixed"][class*="inset-0"]').first();
      if (await modal.isVisible({ timeout: 2000 })) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
      
      const staffButton = page.locator('button:has-text("스탭진 추가")').first();
      await staffButton.waitFor({ timeout: 10000 });
      await staffButton.click({ force: true });
      await page.waitForTimeout(1500);
      console.log('   ✅ 스탭진 추가 완료');
    } catch (error) {
      console.error('   ⚠️ 스탭진 추가 실패 (계속 진행):', error.message);
    }
    
    // 6. 예약 시간 설정
    console.log('   6️⃣ 예약 시간 설정...');
    try {
      // 모달이 열려있으면 먼저 닫기
      const modal = page.locator('div[class*="fixed"][class*="inset-0"]').first();
      if (await modal.isVisible({ timeout: 2000 })) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
      
      // 예약 활성화 체크박스 먼저 체크
      const scheduleCheckbox = page.locator('label:has-text("예약 사용")').locator('input[type="checkbox"]').first();
      if (await scheduleCheckbox.isVisible({ timeout: 5000 })) {
        const isChecked = await scheduleCheckbox.isChecked();
        if (!isChecked) {
          await scheduleCheckbox.check();
          await page.waitForTimeout(500);
          console.log('   ✅ 예약 활성화 체크 완료');
        }
      }
      
      // 오늘 날짜 가져오기
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const hour = String(scheduleTime.hour).padStart(2, '0');
      const minute = String(scheduleTime.minute).padStart(2, '0');
      
      const datetimeValue = `${year}-${month}-${day}T${hour}:${minute}`;
      
      // 예약 시간 입력 필드 찾기
      const scheduleInput = page.locator('input[type="datetime-local"]').first();
      await scheduleInput.waitFor({ timeout: 10000 });
      
      // 기존 값 지우고 새 값 입력
      await scheduleInput.fill('');
      await scheduleInput.fill(datetimeValue);
      await page.waitForTimeout(500);
      
      console.log(`   ✅ 예약 시간 설정 완료: ${datetimeValue}`);
    } catch (error) {
      console.error('   ⚠️ 예약 시간 설정 실패 (계속 진행):', error.message);
    }
    
    // 7. 저장
    console.log('   7️⃣ 저장...');
    try {
      // 모달이 열려있으면 먼저 닫기
      const modal = page.locator('div[class*="fixed"][class*="inset-0"]').first();
      if (await modal.isVisible({ timeout: 2000 })) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
      
      // 저장 버튼 찾기 (여러 선택자 시도)
      const saveButton = page.locator('button:has-text("저장"):not(:has-text("예약"))').first();
      await saveButton.waitFor({ timeout: 10000 });
      
      // 스크롤하여 버튼이 보이도록
      await saveButton.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      
      // force 옵션으로 클릭 (다른 요소에 가려져 있어도)
      await saveButton.click({ force: true });
      await page.waitForTimeout(3000);
      console.log('   ✅ 저장 완료');
    } catch (error) {
      console.error('   ❌ 저장 실패:', error.message);
      throw error;
    }
    
    console.log(`✅ 메시지 ${messageIndex + 1} 생성 완료!\n`);
    
    // 다음 메시지를 위해 잠시 대기
    if (messageIndex < SCHEDULE_TIMES.length - 1) {
      await page.waitForTimeout(2000);
    }
    
  } catch (error) {
    console.error(`❌ 메시지 ${messageIndex + 1} 생성 실패:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 MASSGOO X MUZIIK 콜라보 설문 조사 메시지 자동 생성 시작\n');
  console.log('='.repeat(60));
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`👤 Admin Login: ${ADMIN_LOGIN}`);
  console.log(`📅 예약 시간: ${SCHEDULE_TIMES.map(t => `${t.hour}:${String(t.minute).padStart(2, '0')}`).join(', ')}`);
  console.log(`🖼️  이미지: ${IMAGE_FILENAME}`);
  console.log('='.repeat(60));
  console.log();
  
  const browser = await chromium.launch({ 
    headless: false, // 브라우저 창 표시
    slowMo: 500 // 동작을 천천히 (디버깅용)
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 로그인
    await login(page);
    
    // 3개의 메시지 생성
    for (let i = 0; i < SCHEDULE_TIMES.length; i++) {
      await createMessage(page, SCHEDULE_TIMES[i], i);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ 모든 메시지 생성 완료!');
    console.log('='.repeat(60));
    console.log('\n📋 생성된 메시지:');
    SCHEDULE_TIMES.forEach((time, index) => {
      console.log(`   ${index + 1}. 예약 시간: ${time.hour}:${String(time.minute).padStart(2, '0')}`);
    });
    console.log('\n💡 SMS 리스트 페이지에서 확인하세요: /admin/sms-list\n');
    
    // 브라우저를 5초간 열어두어 확인 가능하게
    console.log('⏳ 5초 후 브라우저를 닫습니다...\n');
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('\n❌ 오류 발생:', error);
    console.log('\n⏳ 10초 후 브라우저를 닫습니다... (오류 확인용)\n');
    await page.waitForTimeout(10000);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);


 * - 3개의 예약 메시지 생성 (15:00, 15:01, 15:02)
 * - 이미지: composed-1-black-beryl-1764776071615.png
 * - 수신자: 스탭진 2명
 */

require('dotenv').config({ path: '.env.local' });
const { chromium } = require('playwright');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.PRODUCTION_URL || 'https://win.masgolf.co.kr';
const ADMIN_LOGIN = process.env.ADMIN_EMAIL || process.env.ADMIN_LOGIN || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

// 메시지 내용 (옵션 2: 간결 버전)
const MESSAGE_CONTENT = `[MASSGOO X MUZIIK] 콜라보 기념 설문 조사

설문 참여 시 특별 선물 증정! 🎁

• 스타일리시한 버킷햇
• 여권 파우치
• 골프모자
• 티셔츠

참여하기: [링크]

마쓰구골프`;

// 이미지 파일명
const IMAGE_FILENAME = 'composed-1-black-beryl-1764776071615.png';

// 예약 시간 목록 (오늘 날짜 기준)
const SCHEDULE_TIMES = [
  { hour: 15, minute: 0 }, // 15:00
  { hour: 15, minute: 1 }, // 15:01
  { hour: 15, minute: 2 }, // 15:02
];

async function login(page) {
  console.log('🔐 로그인 중...');
  
  await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1000);
  
  // 로그인 페이지인지 확인
  if (page.url().includes('/admin/login')) {
    try {
      // 여러 선택자 시도 (로그인 페이지 구조에 맞게)
      await page.waitForSelector('input#login, input[name="login"]', { timeout: 15000 });
      
      // 로그인 정보 입력 (id 우선)
      const loginInput = page.locator('input#login').or(
        page.locator('input[name="login"]')
      ).first();
      const passwordInput = page.locator('input#password').or(
        page.locator('input[name="password"]')
      ).first();
      
      await loginInput.fill(ADMIN_LOGIN);
      await passwordInput.fill(ADMIN_PASSWORD);
      
      // 로그인 버튼 클릭
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      
      // 로그인 완료 대기
      await page.waitForURL(/\/admin/, { timeout: 20000 }).catch(async () => {
        // URL이 변경되지 않았으면 수동으로 확인
        const currentUrl = page.url();
        if (!currentUrl.includes('/admin/login')) {
          console.log('✅ 로그인 완료 (URL 확인)\n');
        } else {
          throw new Error('로그인 실패: 여전히 로그인 페이지에 있습니다.');
        }
      });
      console.log('✅ 로그인 완료\n');
    } catch (error) {
      console.error('❌ 로그인 실패:', error.message);
      throw error;
    }
  } else {
    console.log('✅ 이미 로그인되어 있습니다.\n');
  }
}

async function createMessage(page, scheduleTime, messageIndex) {
  console.log(`\n📝 메시지 ${messageIndex + 1} 생성 중... (${scheduleTime.hour}:${String(scheduleTime.minute).padStart(2, '0')} 예약)`);
  
  try {
    // 1. SMS 에디터 페이지로 이동
    console.log('   1️⃣ SMS 에디터 페이지로 이동...');
    await page.goto(`${BASE_URL}/admin/sms`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    console.log('   ✅ 페이지 로드 완료');
    
    // 2. MMS 타입 선택
    console.log('   2️⃣ MMS 타입 선택...');
    try {
      // MMS 버튼 찾기 (여러 선택자 시도)
      const mmsButton = page.locator('button:has-text("MMS")').or(
        page.locator('button[class*="MMS"]')
      ).first();
      
      await mmsButton.waitFor({ timeout: 5000 });
      await mmsButton.click();
      await page.waitForTimeout(500);
      console.log('   ✅ MMS 타입 선택 완료');
    } catch (error) {
      console.log('   ⚠️ MMS 버튼을 찾을 수 없습니다. 기본값으로 진행...');
    }
    
    // 3. 메시지 내용 입력
    console.log('   3️⃣ 메시지 내용 입력...');
    try {
      // 텍스트 영역 찾기
      const textarea = page.locator('textarea').or(
        page.locator('div[contenteditable="true"]')
      ).first();
      
      await textarea.waitFor({ timeout: 5000 });
      await textarea.click();
      await page.waitForTimeout(300);
      
      // 기존 내용 지우기
      await textarea.fill('');
      await page.waitForTimeout(300);
      
      // 메시지 내용 입력
      await textarea.fill(MESSAGE_CONTENT);
      await page.waitForTimeout(500);
      console.log('   ✅ 메시지 내용 입력 완료');
    } catch (error) {
      console.error('   ❌ 메시지 내용 입력 실패:', error.message);
      throw error;
    }
    
    // 4. 이미지 선택
    console.log('   4️⃣ 이미지 선택...');
    try {
      // "갤러리에서 선택" 버튼 찾기
      const galleryButton = page.locator('button:has-text("갤러리에서 선택")').first();
      await galleryButton.waitFor({ timeout: 5000 });
      await galleryButton.click();
      await page.waitForTimeout(3000);
      console.log('   ✅ 갤러리 모달 열림');
      
      // 갤러리 모달에서 이미지 검색
      const searchInput = page.locator('input[placeholder*="파일명"], input[placeholder*="검색"], input[placeholder*="키워드"]').first();
      if (await searchInput.isVisible({ timeout: 5000 })) {
        await searchInput.fill(IMAGE_FILENAME);
        await page.waitForTimeout(2000);
        console.log('   ✅ 이미지 검색 완료');
      }
      
      // 이미지 썸네일 클릭 (검색 결과 중 첫 번째)
      await page.waitForTimeout(2000); // 이미지 로드 대기
      const imageThumbnail = page.locator('img[src*="supabase"], img[src*="storage"]').first();
      if (await imageThumbnail.isVisible({ timeout: 5000 })) {
        // 이미지 썸네일 클릭
        await imageThumbnail.click({ force: true });
        await page.waitForTimeout(1000);
        console.log('   ✅ 이미지 썸네일 클릭 완료');
        
        // "선택" 버튼 클릭 (이미지 썸네일 위에 있는 버튼)
        const selectButton = page.locator('button:has-text("선택"):not(:has-text("갤러리"))').first();
        if (await selectButton.isVisible({ timeout: 3000 })) {
          await selectButton.click({ force: true });
          await page.waitForTimeout(2000);
          console.log('   ✅ 이미지 선택 완료');
        } else {
          // 모달 닫기 버튼 클릭 (×)
          const closeButton = page.locator('button:has-text("×")').or(
            page.locator('button[class*="close"]')
          ).first();
          if (await closeButton.isVisible({ timeout: 2000 })) {
            await closeButton.click({ force: true });
            await page.waitForTimeout(1000);
            console.log('   ⚠️ 모달 닫기 (이미지가 자동 선택되었을 수 있음)');
          }
        }
      } else {
        // 이미지를 찾을 수 없으면 모달 닫기
        const closeButton = page.locator('button:has-text("×")').or(
          page.locator('button[class*="close"]')
        ).first();
        if (await closeButton.isVisible({ timeout: 2000 })) {
          await closeButton.click({ force: true });
          await page.waitForTimeout(1000);
        }
        console.log('   ⚠️ 이미지를 찾을 수 없습니다. 모달을 닫고 계속 진행합니다.');
      }
    } catch (error) {
      console.error('   ⚠️ 이미지 선택 실패 (계속 진행):', error.message);
      // 모달이 열려있으면 닫기
      try {
        const closeButton = page.locator('button:has-text("×")').first();
        if (await closeButton.isVisible({ timeout: 2000 })) {
          await closeButton.click({ force: true });
          await page.waitForTimeout(1000);
        }
      } catch (e) {
        // ESC 키로 모달 닫기 시도
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
    }
    
    // 5. 스탭진 추가
    console.log('   5️⃣ 스탭진 추가...');
    try {
      // 모달이 열려있으면 먼저 닫기
      const modal = page.locator('div[class*="fixed"][class*="inset-0"]').first();
      if (await modal.isVisible({ timeout: 2000 })) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
      
      const staffButton = page.locator('button:has-text("스탭진 추가")').first();
      await staffButton.waitFor({ timeout: 10000 });
      await staffButton.click({ force: true });
      await page.waitForTimeout(1500);
      console.log('   ✅ 스탭진 추가 완료');
    } catch (error) {
      console.error('   ⚠️ 스탭진 추가 실패 (계속 진행):', error.message);
    }
    
    // 6. 예약 시간 설정
    console.log('   6️⃣ 예약 시간 설정...');
    try {
      // 모달이 열려있으면 먼저 닫기
      const modal = page.locator('div[class*="fixed"][class*="inset-0"]').first();
      if (await modal.isVisible({ timeout: 2000 })) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
      
      // 예약 활성화 체크박스 먼저 체크
      const scheduleCheckbox = page.locator('label:has-text("예약 사용")').locator('input[type="checkbox"]').first();
      if (await scheduleCheckbox.isVisible({ timeout: 5000 })) {
        const isChecked = await scheduleCheckbox.isChecked();
        if (!isChecked) {
          await scheduleCheckbox.check();
          await page.waitForTimeout(500);
          console.log('   ✅ 예약 활성화 체크 완료');
        }
      }
      
      // 오늘 날짜 가져오기
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const hour = String(scheduleTime.hour).padStart(2, '0');
      const minute = String(scheduleTime.minute).padStart(2, '0');
      
      const datetimeValue = `${year}-${month}-${day}T${hour}:${minute}`;
      
      // 예약 시간 입력 필드 찾기
      const scheduleInput = page.locator('input[type="datetime-local"]').first();
      await scheduleInput.waitFor({ timeout: 10000 });
      
      // 기존 값 지우고 새 값 입력
      await scheduleInput.fill('');
      await scheduleInput.fill(datetimeValue);
      await page.waitForTimeout(500);
      
      console.log(`   ✅ 예약 시간 설정 완료: ${datetimeValue}`);
    } catch (error) {
      console.error('   ⚠️ 예약 시간 설정 실패 (계속 진행):', error.message);
    }
    
    // 7. 저장
    console.log('   7️⃣ 저장...');
    try {
      // 모달이 열려있으면 먼저 닫기
      const modal = page.locator('div[class*="fixed"][class*="inset-0"]').first();
      if (await modal.isVisible({ timeout: 2000 })) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
      
      // 저장 버튼 찾기 (여러 선택자 시도)
      const saveButton = page.locator('button:has-text("저장"):not(:has-text("예약"))').first();
      await saveButton.waitFor({ timeout: 10000 });
      
      // 스크롤하여 버튼이 보이도록
      await saveButton.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      
      // force 옵션으로 클릭 (다른 요소에 가려져 있어도)
      await saveButton.click({ force: true });
      await page.waitForTimeout(3000);
      console.log('   ✅ 저장 완료');
    } catch (error) {
      console.error('   ❌ 저장 실패:', error.message);
      throw error;
    }
    
    console.log(`✅ 메시지 ${messageIndex + 1} 생성 완료!\n`);
    
    // 다음 메시지를 위해 잠시 대기
    if (messageIndex < SCHEDULE_TIMES.length - 1) {
      await page.waitForTimeout(2000);
    }
    
  } catch (error) {
    console.error(`❌ 메시지 ${messageIndex + 1} 생성 실패:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 MASSGOO X MUZIIK 콜라보 설문 조사 메시지 자동 생성 시작\n');
  console.log('='.repeat(60));
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`👤 Admin Login: ${ADMIN_LOGIN}`);
  console.log(`📅 예약 시간: ${SCHEDULE_TIMES.map(t => `${t.hour}:${String(t.minute).padStart(2, '0')}`).join(', ')}`);
  console.log(`🖼️  이미지: ${IMAGE_FILENAME}`);
  console.log('='.repeat(60));
  console.log();
  
  const browser = await chromium.launch({ 
    headless: false, // 브라우저 창 표시
    slowMo: 500 // 동작을 천천히 (디버깅용)
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 로그인
    await login(page);
    
    // 3개의 메시지 생성
    for (let i = 0; i < SCHEDULE_TIMES.length; i++) {
      await createMessage(page, SCHEDULE_TIMES[i], i);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ 모든 메시지 생성 완료!');
    console.log('='.repeat(60));
    console.log('\n📋 생성된 메시지:');
    SCHEDULE_TIMES.forEach((time, index) => {
      console.log(`   ${index + 1}. 예약 시간: ${time.hour}:${String(time.minute).padStart(2, '0')}`);
    });
    console.log('\n💡 SMS 리스트 페이지에서 확인하세요: /admin/sms-list\n');
    
    // 브라우저를 5초간 열어두어 확인 가능하게
    console.log('⏳ 5초 후 브라우저를 닫습니다...\n');
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('\n❌ 오류 발생:', error);
    console.log('\n⏳ 10초 후 브라우저를 닫습니다... (오류 확인용)\n');
    await page.waitForTimeout(10000);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);


 * - 3개의 예약 메시지 생성 (15:00, 15:01, 15:02)
 * - 이미지: composed-1-black-beryl-1764776071615.png
 * - 수신자: 스탭진 2명
 */

require('dotenv').config({ path: '.env.local' });
const { chromium } = require('playwright');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.PRODUCTION_URL || 'https://win.masgolf.co.kr';
const ADMIN_LOGIN = process.env.ADMIN_EMAIL || process.env.ADMIN_LOGIN || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

// 메시지 내용 (옵션 2: 간결 버전)
const MESSAGE_CONTENT = `[MASSGOO X MUZIIK] 콜라보 기념 설문 조사

설문 참여 시 특별 선물 증정! 🎁

• 스타일리시한 버킷햇
• 여권 파우치
• 골프모자
• 티셔츠

참여하기: [링크]

마쓰구골프`;

// 이미지 파일명
const IMAGE_FILENAME = 'composed-1-black-beryl-1764776071615.png';

// 예약 시간 목록 (오늘 날짜 기준)
const SCHEDULE_TIMES = [
  { hour: 15, minute: 0 }, // 15:00
  { hour: 15, minute: 1 }, // 15:01
  { hour: 15, minute: 2 }, // 15:02
];

async function login(page) {
  console.log('🔐 로그인 중...');
  
  await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1000);
  
  // 로그인 페이지인지 확인
  if (page.url().includes('/admin/login')) {
    try {
      // 여러 선택자 시도 (로그인 페이지 구조에 맞게)
      await page.waitForSelector('input#login, input[name="login"]', { timeout: 15000 });
      
      // 로그인 정보 입력 (id 우선)
      const loginInput = page.locator('input#login').or(
        page.locator('input[name="login"]')
      ).first();
      const passwordInput = page.locator('input#password').or(
        page.locator('input[name="password"]')
      ).first();
      
      await loginInput.fill(ADMIN_LOGIN);
      await passwordInput.fill(ADMIN_PASSWORD);
      
      // 로그인 버튼 클릭
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      
      // 로그인 완료 대기
      await page.waitForURL(/\/admin/, { timeout: 20000 }).catch(async () => {
        // URL이 변경되지 않았으면 수동으로 확인
        const currentUrl = page.url();
        if (!currentUrl.includes('/admin/login')) {
          console.log('✅ 로그인 완료 (URL 확인)\n');
        } else {
          throw new Error('로그인 실패: 여전히 로그인 페이지에 있습니다.');
        }
      });
      console.log('✅ 로그인 완료\n');
    } catch (error) {
      console.error('❌ 로그인 실패:', error.message);
      throw error;
    }
  } else {
    console.log('✅ 이미 로그인되어 있습니다.\n');
  }
}

async function createMessage(page, scheduleTime, messageIndex) {
  console.log(`\n📝 메시지 ${messageIndex + 1} 생성 중... (${scheduleTime.hour}:${String(scheduleTime.minute).padStart(2, '0')} 예약)`);
  
  try {
    // 1. SMS 에디터 페이지로 이동
    console.log('   1️⃣ SMS 에디터 페이지로 이동...');
    await page.goto(`${BASE_URL}/admin/sms`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    console.log('   ✅ 페이지 로드 완료');
    
    // 2. MMS 타입 선택
    console.log('   2️⃣ MMS 타입 선택...');
    try {
      // MMS 버튼 찾기 (여러 선택자 시도)
      const mmsButton = page.locator('button:has-text("MMS")').or(
        page.locator('button[class*="MMS"]')
      ).first();
      
      await mmsButton.waitFor({ timeout: 5000 });
      await mmsButton.click();
      await page.waitForTimeout(500);
      console.log('   ✅ MMS 타입 선택 완료');
    } catch (error) {
      console.log('   ⚠️ MMS 버튼을 찾을 수 없습니다. 기본값으로 진행...');
    }
    
    // 3. 메시지 내용 입력
    console.log('   3️⃣ 메시지 내용 입력...');
    try {
      // 텍스트 영역 찾기
      const textarea = page.locator('textarea').or(
        page.locator('div[contenteditable="true"]')
      ).first();
      
      await textarea.waitFor({ timeout: 5000 });
      await textarea.click();
      await page.waitForTimeout(300);
      
      // 기존 내용 지우기
      await textarea.fill('');
      await page.waitForTimeout(300);
      
      // 메시지 내용 입력
      await textarea.fill(MESSAGE_CONTENT);
      await page.waitForTimeout(500);
      console.log('   ✅ 메시지 내용 입력 완료');
    } catch (error) {
      console.error('   ❌ 메시지 내용 입력 실패:', error.message);
      throw error;
    }
    
    // 4. 이미지 선택
    console.log('   4️⃣ 이미지 선택...');
    try {
      // "갤러리에서 선택" 버튼 찾기
      const galleryButton = page.locator('button:has-text("갤러리에서 선택")').first();
      await galleryButton.waitFor({ timeout: 5000 });
      await galleryButton.click();
      await page.waitForTimeout(3000);
      console.log('   ✅ 갤러리 모달 열림');
      
      // 갤러리 모달에서 이미지 검색
      const searchInput = page.locator('input[placeholder*="파일명"], input[placeholder*="검색"], input[placeholder*="키워드"]').first();
      if (await searchInput.isVisible({ timeout: 5000 })) {
        await searchInput.fill(IMAGE_FILENAME);
        await page.waitForTimeout(2000);
        console.log('   ✅ 이미지 검색 완료');
      }
      
      // 이미지 썸네일 클릭 (검색 결과 중 첫 번째)
      await page.waitForTimeout(2000); // 이미지 로드 대기
      const imageThumbnail = page.locator('img[src*="supabase"], img[src*="storage"]').first();
      if (await imageThumbnail.isVisible({ timeout: 5000 })) {
        // 이미지 썸네일 클릭
        await imageThumbnail.click({ force: true });
        await page.waitForTimeout(1000);
        console.log('   ✅ 이미지 썸네일 클릭 완료');
        
        // "선택" 버튼 클릭 (이미지 썸네일 위에 있는 버튼)
        const selectButton = page.locator('button:has-text("선택"):not(:has-text("갤러리"))').first();
        if (await selectButton.isVisible({ timeout: 3000 })) {
          await selectButton.click({ force: true });
          await page.waitForTimeout(2000);
          console.log('   ✅ 이미지 선택 완료');
        } else {
          // 모달 닫기 버튼 클릭 (×)
          const closeButton = page.locator('button:has-text("×")').or(
            page.locator('button[class*="close"]')
          ).first();
          if (await closeButton.isVisible({ timeout: 2000 })) {
            await closeButton.click({ force: true });
            await page.waitForTimeout(1000);
            console.log('   ⚠️ 모달 닫기 (이미지가 자동 선택되었을 수 있음)');
          }
        }
      } else {
        // 이미지를 찾을 수 없으면 모달 닫기
        const closeButton = page.locator('button:has-text("×")').or(
          page.locator('button[class*="close"]')
        ).first();
        if (await closeButton.isVisible({ timeout: 2000 })) {
          await closeButton.click({ force: true });
          await page.waitForTimeout(1000);
        }
        console.log('   ⚠️ 이미지를 찾을 수 없습니다. 모달을 닫고 계속 진행합니다.');
      }
    } catch (error) {
      console.error('   ⚠️ 이미지 선택 실패 (계속 진행):', error.message);
      // 모달이 열려있으면 닫기
      try {
        const closeButton = page.locator('button:has-text("×")').first();
        if (await closeButton.isVisible({ timeout: 2000 })) {
          await closeButton.click({ force: true });
          await page.waitForTimeout(1000);
        }
      } catch (e) {
        // ESC 키로 모달 닫기 시도
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
    }
    
    // 5. 스탭진 추가
    console.log('   5️⃣ 스탭진 추가...');
    try {
      // 모달이 열려있으면 먼저 닫기
      const modal = page.locator('div[class*="fixed"][class*="inset-0"]').first();
      if (await modal.isVisible({ timeout: 2000 })) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
      
      const staffButton = page.locator('button:has-text("스탭진 추가")').first();
      await staffButton.waitFor({ timeout: 10000 });
      await staffButton.click({ force: true });
      await page.waitForTimeout(1500);
      console.log('   ✅ 스탭진 추가 완료');
    } catch (error) {
      console.error('   ⚠️ 스탭진 추가 실패 (계속 진행):', error.message);
    }
    
    // 6. 예약 시간 설정
    console.log('   6️⃣ 예약 시간 설정...');
    try {
      // 모달이 열려있으면 먼저 닫기
      const modal = page.locator('div[class*="fixed"][class*="inset-0"]').first();
      if (await modal.isVisible({ timeout: 2000 })) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
      
      // 예약 활성화 체크박스 먼저 체크
      const scheduleCheckbox = page.locator('label:has-text("예약 사용")').locator('input[type="checkbox"]').first();
      if (await scheduleCheckbox.isVisible({ timeout: 5000 })) {
        const isChecked = await scheduleCheckbox.isChecked();
        if (!isChecked) {
          await scheduleCheckbox.check();
          await page.waitForTimeout(500);
          console.log('   ✅ 예약 활성화 체크 완료');
        }
      }
      
      // 오늘 날짜 가져오기
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const hour = String(scheduleTime.hour).padStart(2, '0');
      const minute = String(scheduleTime.minute).padStart(2, '0');
      
      const datetimeValue = `${year}-${month}-${day}T${hour}:${minute}`;
      
      // 예약 시간 입력 필드 찾기
      const scheduleInput = page.locator('input[type="datetime-local"]').first();
      await scheduleInput.waitFor({ timeout: 10000 });
      
      // 기존 값 지우고 새 값 입력
      await scheduleInput.fill('');
      await scheduleInput.fill(datetimeValue);
      await page.waitForTimeout(500);
      
      console.log(`   ✅ 예약 시간 설정 완료: ${datetimeValue}`);
    } catch (error) {
      console.error('   ⚠️ 예약 시간 설정 실패 (계속 진행):', error.message);
    }
    
    // 7. 저장
    console.log('   7️⃣ 저장...');
    try {
      // 모달이 열려있으면 먼저 닫기
      const modal = page.locator('div[class*="fixed"][class*="inset-0"]').first();
      if (await modal.isVisible({ timeout: 2000 })) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
      
      // 저장 버튼 찾기 (여러 선택자 시도)
      const saveButton = page.locator('button:has-text("저장"):not(:has-text("예약"))').first();
      await saveButton.waitFor({ timeout: 10000 });
      
      // 스크롤하여 버튼이 보이도록
      await saveButton.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      
      // force 옵션으로 클릭 (다른 요소에 가려져 있어도)
      await saveButton.click({ force: true });
      await page.waitForTimeout(3000);
      console.log('   ✅ 저장 완료');
    } catch (error) {
      console.error('   ❌ 저장 실패:', error.message);
      throw error;
    }
    
    console.log(`✅ 메시지 ${messageIndex + 1} 생성 완료!\n`);
    
    // 다음 메시지를 위해 잠시 대기
    if (messageIndex < SCHEDULE_TIMES.length - 1) {
      await page.waitForTimeout(2000);
    }
    
  } catch (error) {
    console.error(`❌ 메시지 ${messageIndex + 1} 생성 실패:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 MASSGOO X MUZIIK 콜라보 설문 조사 메시지 자동 생성 시작\n');
  console.log('='.repeat(60));
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`👤 Admin Login: ${ADMIN_LOGIN}`);
  console.log(`📅 예약 시간: ${SCHEDULE_TIMES.map(t => `${t.hour}:${String(t.minute).padStart(2, '0')}`).join(', ')}`);
  console.log(`🖼️  이미지: ${IMAGE_FILENAME}`);
  console.log('='.repeat(60));
  console.log();
  
  const browser = await chromium.launch({ 
    headless: false, // 브라우저 창 표시
    slowMo: 500 // 동작을 천천히 (디버깅용)
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 로그인
    await login(page);
    
    // 3개의 메시지 생성
    for (let i = 0; i < SCHEDULE_TIMES.length; i++) {
      await createMessage(page, SCHEDULE_TIMES[i], i);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ 모든 메시지 생성 완료!');
    console.log('='.repeat(60));
    console.log('\n📋 생성된 메시지:');
    SCHEDULE_TIMES.forEach((time, index) => {
      console.log(`   ${index + 1}. 예약 시간: ${time.hour}:${String(time.minute).padStart(2, '0')}`);
    });
    console.log('\n💡 SMS 리스트 페이지에서 확인하세요: /admin/sms-list\n');
    
    // 브라우저를 5초간 열어두어 확인 가능하게
    console.log('⏳ 5초 후 브라우저를 닫습니다...\n');
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('\n❌ 오류 발생:', error);
    console.log('\n⏳ 10초 후 브라우저를 닫습니다... (오류 확인용)\n');
    await page.waitForTimeout(10000);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);

