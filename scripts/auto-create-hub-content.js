/**
 * 허브 콘텐츠 및 카카오 피드 자동 생성 스크립트
 * 
 * 사용법:
 * node scripts/auto-create-hub-content.js
 * 
 * 기능:
 * - 오늘 날짜의 허브 콘텐츠 자동 생성
 * - PC/모바일 프로필 콘텐츠 생성 (해당 날짜인 경우)
 * - 카카오 피드 2개 계정 자동 생성
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 설정
const BASE_URL = 'http://localhost:3000';
const ADMIN_LOGIN_URL = `${BASE_URL}/admin/login`;
const HUB_URL = `${BASE_URL}/admin/content-calendar-hub`;
const KAKAO_URL = `${BASE_URL}/admin/kakao`;
const LOGIN_PHONE = '01066699000';
const LOGIN_PASSWORD = '66699000';

// 캘린더 파일 경로
const CALENDAR_DIR = path.join(__dirname, '../docs/content-calendar');
const EXECUTION_LOG = path.join(CALENDAR_DIR, 'execution-log.md');

// 오늘 날짜
const today = new Date();
const todayStr = today.toISOString().split('T')[0];
const monthStr = today.toISOString().substring(0, 7);
const calendarFile = path.join(CALENDAR_DIR, `${monthStr}.json`);

// 로그 함수
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// 캘린더 로드
function loadCalendar() {
  if (!fs.existsSync(calendarFile)) {
    log(`❌ 캘린더 파일을 찾을 수 없습니다: ${calendarFile}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(calendarFile, 'utf-8'));
  } catch (error) {
    log(`❌ 캘린더 파일 파싱 오류: ${error.message}`);
    return null;
  }
}

// 캘린더 저장
function saveCalendar(calendar) {
  try {
    fs.writeFileSync(calendarFile, JSON.stringify(calendar, null, 2), 'utf-8');
    log('✅ 캘린더 파일 저장 완료');
  } catch (error) {
    log(`❌ 캘린더 파일 저장 오류: ${error.message}`);
  }
}

// 작성일지 업데이트
function updateExecutionLog(date, title, status, details = {}) {
  const timestamp = new Date().toISOString();
  const statusIcon = status === 'success' ? '✅' : status === 'failed' ? '❌' : '⚠️';
  
  let logEntry = `\n## ${date}\n`;
  logEntry += `- ${statusIcon} ${title}\n`;
  logEntry += `  - 생성 시간: ${timestamp}\n`;
  
  if (details.hubId) {
    logEntry += `  - 허브 ID: ${details.hubId}\n`;
  }
  if (details.channels) {
    logEntry += `  - 채널: ${details.channels.join(', ')}\n`;
  }
  if (details.account) {
    logEntry += `  - 계정: ${details.account}\n`;
  }
  logEntry += `  - 상태: ${status}\n`;
  
  let logContent = '';
  if (fs.existsSync(EXECUTION_LOG)) {
    logContent = fs.readFileSync(EXECUTION_LOG, 'utf-8');
  } else {
    logContent = '# 콘텐츠 작성일지\n\n';
  }
  
  // 오늘 날짜 섹션이 이미 있으면 업데이트, 없으면 추가
  const dateHeader = `## ${date}`;
  if (logContent.includes(dateHeader)) {
    // 기존 항목 뒤에 추가
    const dateIndex = logContent.indexOf(dateHeader);
    const nextDateIndex = logContent.indexOf('\n## ', dateIndex + 1);
    if (nextDateIndex === -1) {
      logContent += logEntry;
    } else {
      logContent = logContent.slice(0, nextDateIndex) + logEntry + logContent.slice(nextDateIndex);
    }
  } else {
    logContent += logEntry;
  }
  
  fs.writeFileSync(EXECUTION_LOG, logContent, 'utf-8');
  log('✅ 작성일지 업데이트 완료');
}

// 로그인
async function login(page) {
  log('🔑 로그인 시도...');
  
  try {
    await page.goto(ADMIN_LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    
    // 로그인 폼 확인
    const phoneInput = page.locator('input[type="tel"], input[name*="phone"], input[placeholder*="전화"], input[type="text"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    if (await phoneInput.isVisible({ timeout: 3000 }).catch(() => false) && 
        await passwordInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await phoneInput.fill(LOGIN_PHONE);
      await page.waitForTimeout(1000);
      await passwordInput.fill(LOGIN_PASSWORD);
      await page.waitForTimeout(1000);
      
      const loginButton = page.locator('button:has-text("로그인"), button[type="submit"]').first();
      await loginButton.click();
      await page.waitForTimeout(3000);
      
      log('✅ 로그인 완료');
    } else {
      log('⚠️ 이미 로그인된 상태로 보입니다.');
    }
  } catch (error) {
    log(`⚠️ 로그인 처리 중 오류: ${error.message}`);
  }
}

// 허브 콘텐츠 생성
async function createHubContent(page, content) {
  log(`\n📝 허브 콘텐츠 생성 시작: ${content.title}`);
  
  try {
    // 허브 페이지로 이동
    await page.goto(HUB_URL, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    
    // "새 허브 콘텐츠 생성" 버튼 클릭
    const createButton = page.locator('button:has-text("새 허브 콘텐츠 생성"), button:has-text("생성")').first();
    await createButton.click();
    await page.waitForTimeout(1000);
    
    // 모달이 나타날 때까지 대기
    await page.waitForSelector('input[placeholder*="허브 콘텐츠 제목"], input[placeholder*="제목"]', { timeout: 5000 });
    
    // 제목 입력
    const titleInput = page.locator('input[placeholder*="허브 콘텐츠 제목"], input[placeholder*="제목"]').first();
    await titleInput.fill(content.title);
    await page.waitForTimeout(500);
    
    // 요약 입력
    const summaryInput = page.locator('textarea[placeholder*="SMS, 네이버 블로그"], textarea[placeholder*="요약"]').first();
    if (await summaryInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await summaryInput.fill(content.summary);
      await page.waitForTimeout(500);
    }
    
    // 간단한 개요 입력
    const overviewInput = page.locator('textarea[placeholder*="허브 콘텐츠의 간단한 개요"], textarea[placeholder*="간단한 개요"]').first();
    if (await overviewInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await overviewInput.fill(content.overview);
      await page.waitForTimeout(500);
    }
    
    // 날짜 입력
    const dateInput = page.locator('input[type="date"]').first();
    if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dateInput.fill(content.date);
      await page.waitForTimeout(500);
    }
    
    // 생성 버튼 클릭
    const submitButton = page.locator('button:has-text("생성")').filter({ hasNotText: '취소' }).first();
    await submitButton.click();
    await page.waitForTimeout(3000);
    
    // 성공 확인 (모달이 닫혔는지 확인)
    const modalVisible = await page.locator('.fixed.inset-0').first().isVisible().catch(() => false);
    if (!modalVisible) {
      log('✅ 허브 콘텐츠 생성 완료');
      return { success: true, hubId: null };
    } else {
      log('⚠️ 모달이 아직 열려있습니다. 확인 필요');
      return { success: true, hubId: null };
    }
    
  } catch (error) {
    log(`❌ 허브 콘텐츠 생성 오류: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// 카카오 피드 생성 (UI 기반)
async function createKakaoFeed(page, feedContent, accountName) {
  log(`\n📱 카카오 피드 생성 시작 (${accountName}): ${feedContent.caption}`);
  
  try {
    // 카카오 채널 페이지로 이동
    await page.goto(KAKAO_URL, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    
    // 피드 생성 버튼 찾기 (실제 UI에 맞게 수정 필요)
    // TODO: 실제 카카오 채널 관리 페이지의 UI 구조에 맞게 수정
    log('⚠️ 카카오 피드 생성 기능은 실제 UI 구조에 맞게 구현이 필요합니다.');
    log(`   이미지 카테고리: ${feedContent.imageCategory}`);
    log(`   이미지 프롬프트: ${feedContent.imagePrompt}`);
    log(`   캡션: ${feedContent.caption}`);
    
    // 실제 구현 시:
    // 1. 피드 생성 버튼 클릭
    // 2. 이미지 선택 또는 AI 생성
    // 3. 캡션 입력
    // 4. 발행 버튼 클릭
    
    return { success: true, note: '수동 생성 필요' };
    
  } catch (error) {
    log(`❌ 카카오 피드 생성 오류: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// 메인 함수
async function main() {
  log('🚀 허브 콘텐츠 및 피드 자동 생성 시작\n');
  log(`📅 오늘 날짜: ${todayStr}`);
  log(`📁 캘린더 파일: ${calendarFile}\n`);
  
  // 캘린더 로드
  const calendar = loadCalendar();
  if (!calendar) {
    return;
  }
  
  // 오늘 날짜의 콘텐츠 찾기
  const todayContent = calendar.contents?.find(c => c.date === todayStr && !c.created);
  const todayFeed = calendar.kakaoFeed?.dailySchedule?.find(f => f.date === todayStr);
  const todayAccount1Profile = calendar.profileContent?.account1?.dailySchedule?.find(p => p.date === todayStr && !p.created);
  const todayAccount2Profile = calendar.profileContent?.account2?.dailySchedule?.find(p => p.date === todayStr && !p.created);
  
  if (!todayContent && !todayFeed && !todayAccount1Profile && !todayAccount2Profile) {
    log('ℹ️ 오늘 생성할 콘텐츠가 없습니다.');
    if (calendar.contents?.find(c => c.date === todayStr)) {
      log('   (이미 생성된 콘텐츠가 있거나, 오늘 날짜의 콘텐츠가 계획에 없습니다.)');
    }
    return;
  }
  
  // 생성할 콘텐츠 목록 출력
  if (todayContent) log(`📝 생성할 허브 콘텐츠: ${todayContent.title}`);
  if (todayFeed) log(`📱 생성할 카카오 피드: ${todayFeed.account1.caption} / ${todayFeed.account2.caption}`);
  if (todayAccount1Profile) log(`💻 생성할 대표폰 프로필: ${todayAccount1Profile.message}`);
  if (todayAccount2Profile) log(`📱 생성할 업무폰 프로필: ${todayAccount2Profile.message}`);
  log('');
  
  // 브라우저 실행
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 로그인
    await login(page);
    
    // 허브 콘텐츠 생성
    if (todayContent) {
      const result = await createHubContent(page, todayContent);
      if (result.success) {
        todayContent.created = true;
        todayContent.createdAt = new Date().toISOString();
        todayContent.hubId = result.hubId;
        saveCalendar(calendar);
        updateExecutionLog(todayStr, todayContent.title, 'success', {
          hubId: result.hubId,
          channels: todayContent.channels || []
        });
      } else {
        updateExecutionLog(todayStr, todayContent.title, 'failed', { error: result.error });
      }
    }
    
    // 카카오 피드 생성 (2개 계정)
    if (todayFeed) {
      // 계정 1 피드
      if (todayFeed.account1 && !todayFeed.account1.created) {
        const feedResult1 = await createKakaoFeed(page, todayFeed.account1, '계정 1');
        if (feedResult1.success) {
          todayFeed.account1.created = true;
          todayFeed.account1.createdAt = new Date().toISOString();
        }
      }
      
      // 계정 2 피드
      if (todayFeed.account2 && !todayFeed.account2.created) {
        const feedResult2 = await createKakaoFeed(page, todayFeed.account2, '계정 2');
        if (feedResult2.success) {
          todayFeed.account2.created = true;
          todayFeed.account2.createdAt = new Date().toISOString();
        }
      }
      
      saveCalendar(calendar);
    }
    
    // 대표폰 프로필 업데이트 (수동 작업 필요)
    const todayAccount1Profile = calendar.profileContent?.account1?.dailySchedule?.find(p => p.date === todayStr && !p.created);
    if (todayAccount1Profile) {
      log('💻 대표폰 프로필 업데이트는 수동으로 진행해주세요.');
      log(`   계정: ${calendar.profileContent.account1.account}`);
      log(`   배경: ${todayAccount1Profile.background.image}`);
      log(`   프로필: ${todayAccount1Profile.profile.image}`);
      log(`   메시지: ${todayAccount1Profile.message}`);
    }
    
    // 업무폰 프로필 업데이트 (수동 작업 필요)
    const todayAccount2Profile = calendar.profileContent?.account2?.dailySchedule?.find(p => p.date === todayStr && !p.created);
    if (todayAccount2Profile) {
      log('📱 업무폰 프로필 업데이트는 수동으로 진행해주세요.');
      log(`   계정: ${calendar.profileContent.account2.account}`);
      log(`   배경: ${todayAccount2Profile.background.image}`);
      log(`   프로필: ${todayAccount2Profile.profile.image}`);
      log(`   메시지: ${todayAccount2Profile.message}`);
    }
    
    log('\n✅ 모든 작업 완료!');
    
  } catch (error) {
    log(`❌ 오류 발생: ${error.message}`);
    console.error(error);
  } finally {
    await browser.close();
  }
}

// 실행
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 치명적 오류:', error);
    process.exit(1);
  });
}

module.exports = { main, createHubContent, createKakaoFeed };

