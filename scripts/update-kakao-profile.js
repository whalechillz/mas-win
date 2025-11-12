/**
 * 카카오톡 프로필 업데이트 자동화 스크립트
 * 
 * 사용법:
 * node scripts/update-kakao-profile.js [account] [date]
 * 
 * 예시:
 * node scripts/update-kakao-profile.js account1 2025-11-12
 * 
 * 기능:
 * - 카카오톡 PC 버전에 로그인
 * - 프로필 배경 이미지 업데이트
 * - 프로필 이미지 업데이트
 * - 상태 메시지 업데이트
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 설정
const KAKAO_TALK_PC_URL = 'https://talk.kakao.com/';
const KAKAO_LOGIN_URL = 'https://accounts.kakao.com/login?continue=https://talk.kakao.com/';

// 계정 정보 (환경 변수 또는 설정 파일에서 로드)
const ACCOUNTS = {
  account1: {
    phone: process.env.KAKAO_ACCOUNT1_PHONE || '01066699000',
    password: process.env.KAKAO_ACCOUNT1_PASSWORD || '',
    brandName: 'MASSGOO' // 첫 번째 필드 (7/20) - 브랜드 표기 (고정)
  },
  account2: {
    phone: process.env.KAKAO_ACCOUNT2_PHONE || '01057040013',
    password: process.env.KAKAO_ACCOUNT2_PASSWORD || '',
    brandName: 'MASSGOO' // 첫 번째 필드 (7/20) - 브랜드 표기 (고정)
  }
};

// 캘린더 파일 경로
const CALENDAR_DIR = path.join(__dirname, '../docs/content-calendar');

// 로그 함수
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// 캘린더에서 프로필 데이터 로드
function loadProfileData(account, date) {
  const monthStr = date.substring(0, 7);
  const calendarFile = path.join(CALENDAR_DIR, `${monthStr}.json`);
  
  if (!fs.existsSync(calendarFile)) {
    log(`❌ 캘린더 파일을 찾을 수 없습니다: ${calendarFile}`);
    return null;
  }
  
  try {
    const calendar = JSON.parse(fs.readFileSync(calendarFile, 'utf-8'));
    const accountData = calendar.profileContent?.[account];
    
    if (!accountData) {
      log(`❌ 계정 데이터를 찾을 수 없습니다: ${account}`);
      return null;
    }
    
    const schedule = accountData.dailySchedule?.find(s => s.date === date);
    
    if (!schedule) {
      log(`❌ 날짜 데이터를 찾을 수 없습니다: ${date}`);
      return null;
    }
    
    return {
      account: accountData.account,
      background: {
        imageUrl: schedule.background?.imageUrl,
        prompt: schedule.background?.prompt
      },
      profile: {
        imageUrl: schedule.profile?.imageUrl,
        prompt: schedule.profile?.prompt
      },
      message: schedule.message
    };
  } catch (error) {
    log(`❌ 캘린더 파일 파싱 오류: ${error.message}`);
    return null;
  }
}

// 이미지 다운로드 (로컬 파일로)
async function downloadImage(imageUrl, filePath) {
  return new Promise((resolve, reject) => {
    try {
      const https = require('https');
      const http = require('http');
      const url = require('url');
      
      const parsedUrl = new url.URL(imageUrl);
      const client = parsedUrl.protocol === 'https:' ? https : http;
      
      const file = fs.createWriteStream(filePath);
      
      client.get(imageUrl, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`이미지 다운로드 실패: ${response.statusCode}`));
          return;
        }
        
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          log(`✅ 이미지 다운로드 완료: ${filePath}`);
          resolve(filePath);
        });
      }).on('error', (err) => {
        fs.unlink(filePath, () => {}); // 파일 삭제
        log(`❌ 이미지 다운로드 오류: ${err.message}`);
        reject(err);
      });
    } catch (error) {
      log(`❌ 이미지 다운로드 오류: ${error.message}`);
      reject(error);
    }
  });
}

// Self-Adaptive Automation: 다중 선택자로 요소 찾기
async function adaptiveFindAndClick(page, selectors, options = {}) {
  const { timeout = 5000, maxRetries = 3 } = options;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    for (const selector of selectors) {
      try {
        const element = await page.waitForSelector(selector, { timeout });
        if (await element.isVisible()) {
          await element.click();
          log(`✅ 요소 클릭 성공: ${selector}`);
          return true;
        }
      } catch (error) {
        // 다음 선택자 시도
        continue;
      }
    }
    
    if (attempt < maxRetries - 1) {
      log(`🔄 재시도 ${attempt + 1}/${maxRetries}...`);
      await page.waitForTimeout(2000);
    }
  }
  
  return false;
}

// 카카오톡 로그인
async function loginKakao(page, accountInfo) {
  log(`🔑 카카오톡 로그인 시도: ${accountInfo.phone}`);
  
  try {
    await page.goto(KAKAO_LOGIN_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // 로그인 폼 찾기 (Self-Adaptive)
    const emailSelectors = [
      'input[name="email"]',
      'input[type="email"]',
      'input[id*="email"]',
      'input[placeholder*="이메일"]',
      'input[placeholder*="전화번호"]',
      'input[type="text"]'
    ];
    
    const passwordSelectors = [
      'input[name="password"]',
      'input[type="password"]',
      'input[id*="password"]'
    ];
    
    // 이메일/전화번호 입력
    let emailInput = null;
    for (const selector of emailSelectors) {
      try {
        emailInput = await page.waitForSelector(selector, { timeout: 3000 });
        if (emailInput) break;
      } catch (e) {
        continue;
      }
    }
    
    if (!emailInput) {
      throw new Error('이메일/전화번호 입력 필드를 찾을 수 없습니다');
    }
    
    await emailInput.fill(accountInfo.phone);
    await page.waitForTimeout(1000);
    
    // 비밀번호 입력
    const passwordInput = await page.waitForSelector(passwordSelectors[0], { timeout: 3000 });
    await passwordInput.fill(accountInfo.password);
    await page.waitForTimeout(1000);
    
    // 로그인 버튼 클릭
    const loginButtonSelectors = [
      'button[type="submit"]',
      'button:has-text("로그인")',
      'input[type="submit"]',
      '.btn_login'
    ];
    
    const loginSuccess = await adaptiveFindAndClick(page, loginButtonSelectors);
    if (!loginSuccess) {
      throw new Error('로그인 버튼을 찾을 수 없습니다');
    }
    
    // 로그인 완료 대기
    await page.waitForTimeout(5000);
    
    // 로그인 성공 확인 (카카오톡 메인 페이지로 이동했는지)
    const currentUrl = page.url();
    if (currentUrl.includes('talk.kakao.com') || currentUrl.includes('accounts.kakao.com')) {
      log('✅ 카카오톡 로그인 완료');
      return true;
    } else {
      log('⚠️ 로그인 상태 확인 필요');
      return true; // 일단 진행
    }
    
  } catch (error) {
    log(`❌ 카카오톡 로그인 오류: ${error.message}`);
    throw error;
  }
}

// 프로필 편집 페이지로 이동
async function navigateToProfileEdit(page) {
  log('📝 프로필 편집 페이지로 이동...');
  
  try {
    // 프로필 버튼 찾기 (Self-Adaptive)
    const profileButtonSelectors = [
      'button:has-text("프로필")',
      'a[href*="profile"]',
      '[data-testid="profile"]',
      '.profile-button',
      'button[aria-label*="프로필"]'
    ];
    
    const found = await adaptiveFindAndClick(page, profileButtonSelectors);
    if (!found) {
      // 직접 URL로 이동 시도
      await page.goto('https://talk.kakao.com/profile', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
    }
    
    // 프로필 편집 버튼 찾기
    const editButtonSelectors = [
      'button:has-text("편집")',
      'button:has-text("프로필 편집")',
      'button:has-text("변경")',
      '[data-testid="edit-profile"]',
      '.edit-profile-button'
    ];
    
    await adaptiveFindAndClick(page, editButtonSelectors);
    await page.waitForTimeout(2000);
    
    log('✅ 프로필 편집 페이지 진입');
    return true;
    
  } catch (error) {
    log(`⚠️ 프로필 편집 페이지 이동 오류: ${error.message}`);
    log('💡 수동으로 프로필 편집 페이지로 이동해주세요.');
    return false;
  }
}

// 배경 이미지 업로드
async function uploadBackgroundImage(page, imageUrl) {
  log('🖼️ 배경 이미지 업로드...');
  
  try {
    // 이미지 다운로드
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const imagePath = path.join(tempDir, `background-${Date.now()}.png`);
    await downloadImage(imageUrl, imagePath);
    
    // 파일 업로드 버튼 찾기
    const uploadSelectors = [
      'input[type="file"]',
      'input[accept*="image"]',
      'button:has-text("사진")',
      'button:has-text("이미지")',
      'button:has-text("업로드")',
      '[data-testid="upload-background"]'
    ];
    
    // 파일 input 찾기
    const fileInput = await page.locator('input[type="file"]').first();
    if (await fileInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await fileInput.setInputFiles(imagePath);
      await page.waitForTimeout(3000);
      log('✅ 배경 이미지 업로드 완료');
      return true;
    } else {
      // 버튼 클릭 후 파일 선택
      const uploadButton = await adaptiveFindAndClick(page, uploadSelectors);
      if (uploadButton) {
        await page.waitForTimeout(1000);
        const fileInputAfter = await page.locator('input[type="file"]').first();
        if (await fileInputAfter.isVisible({ timeout: 3000 }).catch(() => false)) {
          await fileInputAfter.setInputFiles(imagePath);
          await page.waitForTimeout(3000);
          log('✅ 배경 이미지 업로드 완료');
          return true;
        }
      }
    }
    
    log('⚠️ 배경 이미지 업로드 버튼을 찾을 수 없습니다');
    return false;
    
  } catch (error) {
    log(`❌ 배경 이미지 업로드 오류: ${error.message}`);
    return false;
  }
}

// 프로필 이미지 업로드
async function uploadProfileImage(page, imageUrl) {
  log('👤 프로필 이미지 업로드...');
  
  try {
    // 이미지 다운로드
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const imagePath = path.join(tempDir, `profile-${Date.now()}.png`);
    await downloadImage(imageUrl, imagePath);
    
    // 프로필 이미지 영역 클릭
    const profileImageSelectors = [
      '.profile-image',
      '.profile-picture',
      'img[alt*="프로필"]',
      'button:has-text("프로필 사진")',
      '[data-testid="profile-image"]'
    ];
    
    await adaptiveFindAndClick(page, profileImageSelectors);
    await page.waitForTimeout(1000);
    
    // 파일 업로드
    const fileInput = await page.locator('input[type="file"]').first();
    if (await fileInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await fileInput.setInputFiles(imagePath);
      await page.waitForTimeout(3000);
      log('✅ 프로필 이미지 업로드 완료');
      return true;
    }
    
    log('⚠️ 프로필 이미지 업로드 버튼을 찾을 수 없습니다');
    return false;
    
  } catch (error) {
    log(`❌ 프로필 이미지 업로드 오류: ${error.message}`);
    return false;
  }
}

// 브랜드 표기 설정 (고정 - 첫 번째 필드)
async function updateBrandName(page, brandName) {
  log(`📝 브랜드 표기 설정: ${brandName}`);
  
  try {
    // 첫 번째 필드 (브랜드 표기, 7/20)
    const brandNameSelectors = [
      'input[placeholder*="이름"]',
      'input[placeholder*="닉네임"]',
      'input[type="text"]:first-of-type',
      'input[maxlength="20"]',
      'input:first-of-type'
    ];
    
    for (const selector of brandNameSelectors) {
      try {
        const inputs = await page.locator(selector).all();
        if (inputs.length > 0) {
          const firstInput = inputs[0];
          if (await firstInput.isVisible({ timeout: 2000 }).catch(() => false)) {
            await firstInput.fill('');
            await firstInput.fill(brandName);
            await page.waitForTimeout(500);
            log(`✅ 브랜드 표기 설정 완료: ${brandName}`);
            return true;
          }
        }
      } catch (e) {
        continue;
      }
    }
    
    log('⚠️ 브랜드 표기 필드를 찾을 수 없습니다');
    return false;
    
  } catch (error) {
    log(`❌ 브랜드 표기 설정 오류: ${error.message}`);
    return false;
  }
}

// 상태 메시지 입력 (매일 변경 - 두 번째 필드)
async function updateStatusMessage(page, message) {
  log(`💬 상태 메시지 업데이트: ${message}`);
  
  try {
    // 두 번째 필드 (상태 메시지, 13/60)
    const messageSelectors = [
      'input[type="text"]:nth-of-type(2)', // 두 번째 입력 필드
      'input[maxlength="60"]',
      'input[placeholder*="상태"]',
      'textarea[placeholder*="상태"]',
      'input[name*="status"]',
      'textarea[name*="status"]'
    ];
    
    for (const selector of messageSelectors) {
      try {
        const inputs = await page.locator(selector).all();
        if (inputs.length > 0) {
          // 두 번째 입력 필드 찾기
          const secondInput = inputs.length > 1 ? inputs[1] : inputs[0];
          if (await secondInput.isVisible({ timeout: 2000 }).catch(() => false)) {
            await secondInput.fill('');
            await secondInput.fill(message);
            await page.waitForTimeout(500);
            log(`✅ 상태 메시지 입력 완료: ${message}`);
            return true;
          }
        }
      } catch (e) {
        continue;
      }
    }
    
    log('⚠️ 상태 메시지 입력 필드를 찾을 수 없습니다');
    return false;
    
  } catch (error) {
    log(`❌ 상태 메시지 업데이트 오류: ${error.message}`);
    return false;
  }
}

// 저장 버튼 클릭
async function saveProfile(page) {
  log('💾 프로필 저장...');
  
  try {
    const saveSelectors = [
      'button:has-text("저장")',
      'button:has-text("완료")',
      'button:has-text("확인")',
      'button[type="submit"]',
      '[data-testid="save-profile"]'
    ];
    
    const saved = await adaptiveFindAndClick(page, saveSelectors);
    if (saved) {
      await page.waitForTimeout(3000);
      log('✅ 프로필 저장 완료');
      return true;
    }
    
    log('⚠️ 저장 버튼을 찾을 수 없습니다');
    return false;
    
  } catch (error) {
    log(`❌ 프로필 저장 오류: ${error.message}`);
    return false;
  }
}

// 메인 함수
async function main() {
  const args = process.argv.slice(2);
  const account = args[0] || 'account1';
  const date = args[1] || new Date().toISOString().split('T')[0];
  
  log('🚀 카카오톡 프로필 업데이트 시작\n');
  log(`📅 날짜: ${date}`);
  log(`👤 계정: ${account}\n`);
  
  // 프로필 데이터 로드
  const profileData = loadProfileData(account, date);
  if (!profileData) {
    log('❌ 프로필 데이터를 로드할 수 없습니다.');
    return;
  }
  
  if (!profileData.background.imageUrl || !profileData.profile.imageUrl) {
    log('❌ 이미지 URL이 없습니다. 먼저 이미지를 생성해주세요.');
    return;
  }
  
  const accountInfo = ACCOUNTS[account];
  if (!accountInfo || !accountInfo.password) {
    log('❌ 계정 정보 또는 비밀번호가 설정되지 않았습니다.');
    log('💡 환경 변수 설정: KAKAO_ACCOUNT1_PASSWORD, KAKAO_ACCOUNT2_PASSWORD');
    return;
  }
  
  const browser = await chromium.launch({ 
    headless: false, // 카카오톡은 headless 모드에서 작동하지 않을 수 있음
    slowMo: 1000 // 디버깅을 위해 천천히 실행
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  
  const page = await context.newPage();
  
  try {
    // 1. 로그인
    await loginKakao(page, accountInfo);
    
    // 2. 프로필 편집 페이지로 이동
    const navigated = await navigateToProfileEdit(page);
    if (!navigated) {
      log('⚠️ 프로필 편집 페이지로 이동하지 못했습니다. 수동으로 진행해주세요.');
      log('💡 브라우저가 열려있으니 수동으로 프로필을 업데이트해주세요.');
      await page.waitForTimeout(60000); // 1분 대기
      return;
    }
    
    // 3. 배경 이미지 업로드
    await uploadBackgroundImage(page, profileData.background.imageUrl);
    
    // 4. 프로필 이미지 업로드
    await uploadProfileImage(page, profileData.profile.imageUrl);
    
    // 5. 브랜드 표기 설정 (고정 - 첫 번째 필드)
    await updateBrandName(page, accountInfo.brandName);
    
    // 6. 상태 메시지 입력 (매일 변경 - 두 번째 필드)
    await updateStatusMessage(page, profileData.message);
    
    // 7. 저장
    await saveProfile(page);
    
    log('\n✅ 카카오톡 프로필 업데이트 완료!');
    log('💡 브라우저를 확인하여 수동으로 저장이 완료되었는지 확인해주세요.');
    
    // 확인을 위해 잠시 대기
    await page.waitForTimeout(5000);
    
  } catch (error) {
    log(`\n❌ 프로필 업데이트 실패: ${error.message}`);
    log('💡 브라우저가 열려있으니 수동으로 프로필을 업데이트해주세요.');
    await page.waitForTimeout(60000); // 1분 대기
  } finally {
    // 브라우저는 수동 확인을 위해 닫지 않음
    // await browser.close();
    log('\n💡 브라우저를 수동으로 닫아주세요.');
  }
}

// 실행
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, loadProfileData };

