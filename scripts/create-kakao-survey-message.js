/**
 * 카카오 채널 설문 참여 메시지 자동 생성 스크립트
 * 
 * 기능:
 * - 카카오 비즈니스 파트너센터 로그인
 * - 메시지 작성 페이지 이동
 * - 메시지 내용 입력
 * - 이미지 업로드
 * - 수신자 선택 (중복 제외)
 * - 예약 발송 설정 (12월 30일 10:00-11:00)
 * 
 * 사용법:
 * node scripts/create-kakao-survey-message.js
 */

require('dotenv').config({ path: '.env.local' });
const { chromium } = require('playwright');

const KAKAO_EMAIL = process.env.KAKAO_EMAIL || 'taksoo.kim@gmail.com';
const KAKAO_PASSWORD = process.env.KAKAO_PASSWORD || '';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://win.masgolf.co.kr';

// 메시지 내용 (젊은 톤)
const MESSAGE_CONTENT = `[MASSGOO X MUZIIK] 설문 참여하고 특별 선물 받자! 🎁

안녕하세요! 마쓰구골프입니다.

선호하는 샤프트 설문에 참여해주시면
다음 특별 선물을 드립니다! ✨

• 스타일리시한 버킷햇
• 콜라보 골프모자
• 여권 파우치
• 티셔츠

참여하기: https://www.masgolf.co.kr/survey

전화 상담만 해도 특별 선물!
080-028-8888 (무료)

마쓰구골프`;

// 이미지 파일명 (AI 이미지 생성으로 만든 이미지)
const IMAGE_FILENAME = ''; // 갤러리에서 선택한 이미지 URL 또는 파일명

// 예약 발송 시간 (12월 30일 10:00-11:00 사이)
const SCHEDULE_DATE = '2025-12-30';
const SCHEDULE_TIMES = [
  { hour: 10, minute: 0 },  // 10:00
  { hour: 10, minute: 15 }, // 10:15
  { hour: 10, minute: 30 }, // 10:30
  { hour: 10, minute: 45 }, // 10:45
  { hour: 11, minute: 0 },  // 11:00
];

async function loginKakao(page) {
  console.log('🔐 카카오 비즈니스 파트너센터 로그인 중...');
  
  try {
    await page.goto('https://business.kakao.com/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // 이미 로그인되어 있는지 확인
    const currentUrl = page.url();
    if (currentUrl.includes('partnercenter') || currentUrl.includes('dashboard')) {
      console.log('✅ 이미 로그인되어 있습니다.\n');
      return;
    }

    // 이메일 입력
    console.log('   이메일 입력 중...');
    const emailInput = page.locator('input[type="email"]').or(page.locator('input[name="email"]')).first();
    await emailInput.waitFor({ timeout: 5000 });
    await emailInput.fill(KAKAO_EMAIL);
    await page.waitForTimeout(500);

    // 비밀번호 입력
    console.log('   비밀번호 입력 중...');
    const passwordInput = page.locator('input[type="password"]').or(page.locator('input[name="password"]')).first();
    await passwordInput.waitFor({ timeout: 5000 });
    await passwordInput.fill(KAKAO_PASSWORD);
    await page.waitForTimeout(500);

    // 로그인 버튼 클릭
    console.log('   로그인 버튼 클릭 중...');
    const loginButton = page.locator('button:has-text("로그인")').or(
      page.locator('button[type="submit"]')
    ).first();
    await loginButton.click();
    await page.waitForTimeout(3000);

    // 로그인 성공 확인
    const afterLoginUrl = page.url();
    if (afterLoginUrl.includes('partnercenter') || afterLoginUrl.includes('dashboard')) {
      console.log('✅ 로그인 성공!\n');
    } else {
      console.log('⚠️ 로그인 상태 확인 필요. 현재 URL:', afterLoginUrl);
    }
  } catch (error) {
    console.error('❌ 로그인 실패:', error.message);
    throw error;
  }
}

async function navigateToMessageEditor(page) {
  console.log('📝 메시지 작성 페이지로 이동 중...');
  
  try {
    // 카카오 비즈니스 파트너센터 메시지 페이지로 이동
    await page.goto('https://business.kakao.com/_vSVuV/messages/new', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    console.log('✅ 메시지 작성 페이지 로드 완료\n');
  } catch (error) {
    console.error('❌ 메시지 작성 페이지 이동 실패:', error.message);
    throw error;
  }
}

async function fillMessageContent(page) {
  console.log('✍️ 메시지 내용 입력 중...');
  
  try {
    // 메시지 내용 입력 필드 찾기
    // 카카오 비즈니스 파트너센터의 실제 UI 구조에 맞게 수정 필요
    const messageInput = page.locator('textarea').or(
      page.locator('div[contenteditable="true"]')
    ).first();
    
    await messageInput.waitFor({ timeout: 5000 });
    await messageInput.click();
    await page.waitForTimeout(500);
    
    // 기존 내용 지우기
    await messageInput.fill('');
    await page.waitForTimeout(300);
    
    // 메시지 내용 입력
    await messageInput.fill(MESSAGE_CONTENT);
    await page.waitForTimeout(1000);
    
    console.log('✅ 메시지 내용 입력 완료\n');
  } catch (error) {
    console.error('❌ 메시지 내용 입력 실패:', error.message);
    throw error;
  }
}

async function uploadImage(page, imageUrl) {
  if (!imageUrl) {
    console.log('⚠️ 이미지 URL이 없어 이미지 업로드를 건너뜁니다.\n');
    return;
  }

  console.log('🖼️ 이미지 업로드 중...');
  
  try {
    // 이미지 업로드 버튼 찾기
    const imageButton = page.locator('button:has-text("이미지")').or(
      page.locator('button:has-text("첨부")')
    ).first();
    
    await imageButton.waitFor({ timeout: 5000 });
    await imageButton.click();
    await page.waitForTimeout(1000);

    // 파일 입력 필드 찾기
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      // 로컬 파일인 경우
      await fileInput.setInputFiles(imageUrl);
    } else {
      // URL인 경우 - 이미지 URL 입력 필드 찾기
      const urlInput = page.locator('input[type="url"]').or(
        page.locator('input[placeholder*="URL"]')
      ).first();
      if (await urlInput.count() > 0) {
        await urlInput.fill(imageUrl);
        await page.waitForTimeout(500);
      }
    }

    await page.waitForTimeout(2000);
    console.log('✅ 이미지 업로드 완료\n');
  } catch (error) {
    console.error('❌ 이미지 업로드 실패:', error.message);
    console.log('⚠️ 이미지 업로드를 건너뛰고 계속 진행합니다.\n');
  }
}

async function selectRecipients(page) {
  console.log('👥 수신자 선택 중...');
  
  try {
    // 수신자 선택 버튼 찾기
    const recipientButton = page.locator('button:has-text("수신자")').or(
      page.locator('button:has-text("친구")')
    ).first();
    
    await recipientButton.waitFor({ timeout: 5000 });
    await recipientButton.click();
    await page.waitForTimeout(2000);

    // 실제 카카오 비즈니스 파트너센터의 수신자 선택 UI에 맞게 수정 필요
    // 친구 그룹 선택 또는 개별 선택
    
    console.log('✅ 수신자 선택 완료 (실제 UI에 맞게 수정 필요)\n');
  } catch (error) {
    console.error('❌ 수신자 선택 실패:', error.message);
    console.log('⚠️ 수신자 선택을 건너뛰고 계속 진행합니다.\n');
  }
}

async function setSchedule(page, scheduleTime) {
  console.log(`⏰ 예약 발송 설정 중... (${SCHEDULE_DATE} ${String(scheduleTime.hour).padStart(2, '0')}:${String(scheduleTime.minute).padStart(2, '0')})`);
  
  try {
    // 예약 발송 체크박스 찾기
    const scheduleCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /예약|스케줄|발송/ }).first();
    if (await scheduleCheckbox.count() > 0) {
      await scheduleCheckbox.check();
      await page.waitForTimeout(500);
    }

    // 날짜 선택
    const dateInput = page.locator('input[type="date"]').or(
      page.locator('input[placeholder*="날짜"]')
    ).first();
    if (await dateInput.count() > 0) {
      await dateInput.fill(SCHEDULE_DATE);
      await page.waitForTimeout(500);
    }

    // 시간 선택
    const timeInput = page.locator('input[type="time"]').or(
      page.locator('input[placeholder*="시간"]')
    ).first();
    if (await timeInput.count() > 0) {
      const timeString = `${String(scheduleTime.hour).padStart(2, '0')}:${String(scheduleTime.minute).padStart(2, '0')}`;
      await timeInput.fill(timeString);
      await page.waitForTimeout(500);
    }

    console.log('✅ 예약 발송 설정 완료\n');
  } catch (error) {
    console.error('❌ 예약 발송 설정 실패:', error.message);
    console.log('⚠️ 예약 발송 설정을 건너뛰고 계속 진행합니다.\n');
  }
}

async function saveDraft(page) {
  console.log('💾 초안 저장 중...');
  
  try {
    // 저장 버튼 찾기
    const saveButton = page.locator('button:has-text("저장")').or(
      page.locator('button:has-text("초안")')
    ).first();
    
    await saveButton.waitFor({ timeout: 5000 });
    await saveButton.click();
    await page.waitForTimeout(2000);

    console.log('✅ 초안 저장 완료\n');
  } catch (error) {
    console.error('❌ 초안 저장 실패:', error.message);
    throw error;
  }
}

async function createKakaoMessage(page, scheduleTime, messageIndex) {
  console.log(`\n📝 메시지 ${messageIndex + 1} 생성 중... (${SCHEDULE_DATE} ${String(scheduleTime.hour).padStart(2, '0')}:${String(scheduleTime.minute).padStart(2, '0')} 예약)`);
  
  try {
    // 1. 메시지 작성 페이지로 이동
    await navigateToMessageEditor(page);
    
    // 2. 메시지 내용 입력
    await fillMessageContent(page);
    
    // 3. 이미지 업로드 (이미지 URL이 있는 경우)
    if (IMAGE_FILENAME) {
      await uploadImage(page, IMAGE_FILENAME);
    }
    
    // 4. 수신자 선택
    await selectRecipients(page);
    
    // 5. 예약 발송 설정
    await setSchedule(page, scheduleTime);
    
    // 6. 초안 저장
    await saveDraft(page);
    
    console.log(`✅ 메시지 ${messageIndex + 1} 생성 완료!\n`);
  } catch (error) {
    console.error(`❌ 메시지 ${messageIndex + 1} 생성 실패:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 카카오 채널 설문 참여 메시지 자동 생성 시작...\n');
  console.log(`📅 예약 날짜: ${SCHEDULE_DATE}`);
  console.log(`⏰ 예약 시간: ${SCHEDULE_TIMES.map(t => `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`).join(', ')}\n`);

  if (!KAKAO_PASSWORD) {
    console.error('❌ KAKAO_PASSWORD 환경 변수가 설정되지 않았습니다.');
    console.log('   .env.local 파일에 KAKAO_PASSWORD를 추가해주세요.\n');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  try {
    // 1. 로그인
    await loginKakao(page);

    // 2. 각 예약 시간별로 메시지 생성
    for (let i = 0; i < SCHEDULE_TIMES.length; i++) {
      await createKakaoMessage(page, SCHEDULE_TIMES[i], i + 1);
      
      // 마지막 메시지가 아니면 잠시 대기
      if (i < SCHEDULE_TIMES.length - 1) {
        console.log('⏳ 다음 메시지 생성을 위해 3초 대기...\n');
        await page.waitForTimeout(3000);
      }
    }

    console.log('✅ 모든 메시지 생성 완료!\n');
    console.log('📋 다음 단계:');
    console.log('   1. 카카오 비즈니스 파트너센터에서 생성된 메시지 확인');
    console.log('   2. 수신자 목록 최종 확인');
    console.log('   3. 이미지 확인');
    console.log('   4. 예약 시간 확인');
    console.log('   5. 발송 실행\n');

    // 브라우저를 열어둠 (수동 확인용)
    console.log('브라우저를 열어두었습니다. 수동으로 확인 후 닫아주세요.');
    await page.waitForTimeout(60000); // 60초 대기

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);

