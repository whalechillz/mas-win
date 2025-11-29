/**
 * 알리고 템플릿 스크래핑 스크립트
 * 
 * 사용법:
 * node scripts/scrape-aligo-templates.js
 * 
 * 결과: backup/aligo-templates-scraped-{timestamp}.json
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ALIGO_LOGIN = {
  url: 'https://smartsms.aligo.in/login.html',
  id: 'mas9golf',
  password: 'mas99000'
};

// 사용자 입력을 받기 위한 readline 인터페이스
let rl = null;

function initReadline() {
  if (!rl) {
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }
  return rl;
}

function askQuestion(question) {
  return new Promise((resolve) => {
    try {
      const rlInstance = initReadline();
      rlInstance.question(question, (answer) => {
        resolve(answer);
      });
    } catch (error) {
      // readline이 닫혔거나 사용할 수 없는 경우 자동으로 계속 진행
      console.log('  ⚠️  사용자 입력을 받을 수 없습니다. 자동으로 계속 진행합니다.');
      resolve(''); // Enter로 처리
    }
  });
}

async function waitForUserConfirmation(message, autoContinue = true) {
  console.log(`\n⚠️  ${message}`);
  
  if (autoContinue && !process.stdin.isTTY) {
    // 비대화형 모드에서는 자동으로 계속 진행
    console.log('  ⏩ 비대화형 모드: 자동으로 계속 진행합니다. (3초 대기)');
    await new Promise(resolve => setTimeout(resolve, 3000));
    return true;
  }
  
  console.log('브라우저를 확인하고 다음 중 선택하세요:');
  console.log('  1. 계속 진행 (Enter)');
  console.log('  2. 중단 (q 입력 후 Enter)');
  
  try {
    const answer = await askQuestion('선택: ');
    if (answer.toLowerCase() === 'q') {
      throw new Error('사용자가 중단을 선택했습니다.');
    }
    return true;
  } catch (error) {
    if (error.message.includes('중단')) {
      throw error;
    }
    // readline 오류 시 자동으로 계속 진행
    console.log('  ⏩ 자동으로 계속 진행합니다.');
    return true;
  }
}

// 브라우저 인스턴스를 전역으로 유지
let browser = null;
let context = null;
let page = null;

async function getOrCreateBrowser() {
  // 기존 브라우저가 있고 연결되어 있으면 재사용
  if (browser && browser.isConnected()) {
    console.log('♻️  기존 브라우저 재사용...');
    const pages = context.pages();
    if (pages.length > 0) {
      page = pages[0];
      const currentUrl = page.url();
      console.log(`  ✅ 기존 페이지 재사용: ${currentUrl}`);
      return { browser, context, page };
    } else {
      page = await context.newPage();
      return { browser, context, page };
    }
  }
  
  // 기존 브라우저가 없으면 CDP로 연결 시도 (여러 포트 시도)
  const cdpPorts = [9222, 9223, 9224, 9225];
  for (const port of cdpPorts) {
    try {
      console.log(`🔗 기존 브라우저에 연결 시도 (포트 ${port})...`);
      browser = await chromium.connectOverCDP(`http://localhost:${port}`);
      const contexts = browser.contexts();
      if (contexts.length > 0) {
        context = contexts[0];
        const pages = context.pages();
        if (pages.length > 0) {
          page = pages[0];
          console.log(`  ✅ 기존 브라우저 연결 성공: ${page.url()}`);
          return { browser, context, page };
        }
      }
    } catch (error) {
      // 다음 포트 시도
      continue;
    }
  }
  
  // CDP 연결 실패 - 사용자가 이미 열어둔 브라우저를 찾을 수 없음
  console.error('  ❌ 기존 브라우저를 찾을 수 없습니다.');
  console.error('  💡 브라우저를 CDP 모드로 실행하거나, 기존 브라우저를 재사용할 수 없습니다.');
  console.error('  💡 브라우저를 열어두고 템플릿 페이지로 이동한 후 다시 시도해주세요.');
  throw new Error('기존 브라우저를 찾을 수 없습니다. 브라우저를 열어두고 템플릿 페이지로 이동한 후 다시 시도해주세요.');
}

async function scrapeAligoTemplates() {
  console.log('🚀 알리고 템플릿 스크래핑 시작...\n');
  
  const browserInfo = await getOrCreateBrowser();
  browser = browserInfo.browser;
  context = browserInfo.context;
  page = browserInfo.page;

  try {
    // 1. 현재 페이지 상태 확인
    const currentUrl = page.url();
    console.log(`📍 현재 URL: ${currentUrl}`);
    
    // 현재 페이지 내용 확인
    await page.waitForTimeout(1000);
    const bodyText = await page.textContent('body').catch(() => '');
    const hasTemplates = /[A-Z]{1,2}_\d+/.test(bodyText);
    const isTemplatePage = bodyText.includes('템플릿관리') || bodyText.includes('템플릿코드') || currentUrl.includes('kakaotemplate');
    const isLoggedIn = bodyText.includes('마스골프') || bodyText.includes('마쓰구골프') || bodyText.includes('잔여포인트') || !currentUrl.includes('login');
    
    // 템플릿 페이지에 이미 있는 경우 바로 스크래핑 시작
    if (isTemplatePage && hasTemplates) {
      console.log('  ✅ 템플릿 페이지에서 시작합니다. 바로 스크래핑을 진행합니다.');
      await page.screenshot({ path: 'backup/aligo-template-page.png', fullPage: true });
      console.log('  💾 스크린샷 저장: backup/aligo-template-page.png');
      // 템플릿 목록 추출로 바로 이동 (로그인 과정 건너뛰기)
      // 템플릿 추출 섹션으로 바로 이동 - 템플릿 페이지 이동 로직 건너뛰기
    } else if (isLoggedIn && !isTemplatePage) {
      console.log('  ✅ 로그인된 상태입니다.');
      console.log('  ⚠️  템플릿 페이지가 아닙니다. 템플릿 페이지로 이동합니다.');
      // 템플릿 페이지로 이동 시도
    } else if (currentUrl.includes('login.html')) {
      console.log('  ⚠️  로그인 페이지입니다.');
      console.log('  💡 사용자가 이미 로그인했다고 하셨으므로, 현재 페이지 상태를 확인합니다.');
      await page.waitForTimeout(2000);
      
      const afterWaitUrl = page.url();
      const afterBodyText = await page.textContent('body').catch(() => '');
      if (afterWaitUrl !== currentUrl && !afterWaitUrl.includes('login')) {
        console.log('  ✅ 로그인 완료로 보입니다.');
      } else if (afterBodyText.includes('마스골프') || afterBodyText.includes('마쓰구골프') || afterBodyText.includes('잔여포인트')) {
        console.log('  ✅ 이미 로그인된 상태입니다.');
      } else {
        console.log('  ⚠️  로그인 페이지에 있습니다. 사용자가 로그인을 완료할 때까지 대기합니다.');
        await waitForUserConfirmation('로그인을 완료한 후 계속하시겠습니까?', true);
        await page.waitForTimeout(2000);
      }
    } else {
      console.log('  ✅ 로그인된 상태로 보입니다.');
      await page.screenshot({ path: 'backup/aligo-current-state.png' });
      console.log('  💾 현재 상태 스크린샷 저장: backup/aligo-current-state.png');
    }
    
    // 템플릿 페이지에 이미 있으면 로그인 과정 건너뛰고 바로 템플릿 추출로 이동
    if (!(isTemplatePage && hasTemplates)) {
      // 2. 로그인 필드 찾기 및 입력 (로그인 페이지에 있고, 아직 로그인되지 않은 경우만)
      const currentPageUrl = page.url();
      const pageBodyText = await page.textContent('body').catch(() => '');
      const isLoggedInCheck = pageBodyText.includes('마스골프') || pageBodyText.includes('마쓰구골프') || pageBodyText.includes('잔여포인트') || !currentPageUrl.includes('login');
      
      if (currentPageUrl.includes('login') && !isLoggedInCheck) {
        console.log('\n🔐 로그인 필드 찾는 중...');
      
        // 페이지의 모든 input 요소 확인
        const allInputs = await page.$$('input');
        console.log(`  📋 발견된 input 요소: ${allInputs.length}개`);
        
        for (let i = 0; i < allInputs.length; i++) {
          const input = allInputs[i];
          const type = await input.getAttribute('type').catch(() => '');
          const name = await input.getAttribute('name').catch(() => '');
          const id = await input.getAttribute('id').catch(() => '');
          const placeholder = await input.getAttribute('placeholder').catch(() => '');
          console.log(`    [${i + 1}] type="${type}", name="${name}", id="${id}", placeholder="${placeholder}"`);
        }
        
        // 다양한 선택자로 시도
        const idSelectors = [
          'input[name="user_id"]',
          'input[name="id"]',
          'input[type="text"]:not([type="hidden"])',
          '#user_id',
          '#id',
          'input[placeholder*="ID"]',
          'input[placeholder*="아이디"]'
        ];
        
        const pwSelectors = [
          'input[name="user_pw"]',
          'input[name="password"]',
          'input[type="password"]',
          '#user_pw',
          '#password'
        ];

        let idFilled = false;
        for (const selector of idSelectors) {
          try {
            const element = await page.$(selector);
            if (element) {
              await element.fill(ALIGO_LOGIN.id);
              idFilled = true;
              console.log(`  ✅ ID 입력 필드 찾음: ${selector}`);
              break;
            }
          } catch (e) {
            console.log(`  ⚠️  ${selector} 시도 실패: ${e.message}`);
          }
        }
        if (!idFilled) {
          await page.screenshot({ path: 'backup/aligo-error-id-field.png' });
          console.error('❌ ID 입력 필드를 찾을 수 없습니다.');
          console.log('  💾 스크린샷 저장: backup/aligo-error-id-field.png');
          await waitForUserConfirmation('ID 입력 필드를 찾을 수 없습니다. 수동으로 입력하시겠습니까?');
          await askQuestion('수동으로 ID를 입력한 후 Enter를 눌러주세요...');
        }

        let pwFilled = false;
        for (const selector of pwSelectors) {
          try {
            const element = await page.$(selector);
            if (element) {
              await element.fill(ALIGO_LOGIN.password);
              pwFilled = true;
              console.log(`  ✅ 비밀번호 입력 필드 찾음: ${selector}`);
              break;
            }
          } catch (e) {
            console.log(`  ⚠️  ${selector} 시도 실패: ${e.message}`);
          }
        }
        if (!pwFilled) {
          await page.screenshot({ path: 'backup/aligo-error-pw-field.png' });
          console.error('❌ 비밀번호 입력 필드를 찾을 수 없습니다.');
          console.log('  💾 스크린샷 저장: backup/aligo-error-pw-field.png');
          await waitForUserConfirmation('비밀번호 입력 필드를 찾을 수 없습니다. 수동으로 입력하시겠습니까?');
          await askQuestion('수동으로 비밀번호를 입력한 후 Enter를 눌러주세요...');
        }

        // 로그인 버튼 클릭
        console.log('\n🔘 로그인 버튼 찾는 중...');
        const allButtons = await page.$$('button, input[type="submit"], a[href*="login"]');
        console.log(`  📋 발견된 버튼 요소: ${allButtons.length}개`);
        
        const loginSelectors = [
          'button[type="submit"]',
          'input[type="submit"]',
          'button:has-text("로그인")',
          'a:has-text("로그인")',
          '.login-btn',
          '#loginBtn',
          'button'
        ];

        let loginClicked = false;
        for (const selector of loginSelectors) {
          try {
            const element = await page.$(selector);
            if (element) {
              await element.click();
              loginClicked = true;
              console.log(`  ✅ 로그인 버튼 클릭: ${selector}`);
              break;
            }
          } catch (e) {
            console.log(`  ⚠️  ${selector} 시도 실패: ${e.message}`);
          }
        }
        if (!loginClicked) {
          console.log('  ⚠️  로그인 버튼을 찾을 수 없습니다. Enter 키로 시도합니다.');
          await page.keyboard.press('Enter');
          console.log('  ✅ Enter 키로 로그인 시도');
        }

        console.log('\n⏳ 로그인 처리 대기 중... (3초)');
        await page.waitForTimeout(3000);
        
        // 로그인 성공 확인
        const afterLoginUrl = page.url();
        console.log(`  📍 현재 URL: ${afterLoginUrl}`);
        
        if (afterLoginUrl.includes('login') || afterLoginUrl === ALIGO_LOGIN.url) {
          await page.screenshot({ path: 'backup/aligo-after-login.png' });
          console.log('  💾 스크린샷 저장: backup/aligo-after-login.png');
          await waitForUserConfirmation('로그인이 완료되었는지 확인해주세요. (로그인 실패 시 수동으로 로그인 후 계속)');
        } else {
          console.log('  ✅ 로그인 성공으로 보입니다.');
        }
      } else {
        console.log('  ⏩ 이미 로그인된 상태이므로 로그인 과정을 건너뜁니다.');
      }
    } else {
      console.log('  ⏩ 템플릿 페이지에서 시작하므로 로그인 과정을 건너뜁니다.');
    }

    // 3. 템플릿 관리 페이지로 이동 (템플릿 페이지가 아닌 경우만)
    // 템플릿 페이지에 이미 있으면 이동 로직 건너뛰기
    if (isTemplatePage && hasTemplates) {
      console.log('\n✅ 이미 템플릿 페이지에 있습니다. 템플릿 목록 추출로 바로 진행합니다.');
      // 템플릿 추출 섹션으로 바로 이동
    } else {
      // 현재 페이지 상태 재확인 (페이지가 로드되는 동안 변경되었을 수 있음)
      await page.waitForTimeout(2000);
      const currentPageUrl = page.url();
      const currentPageText = await page.textContent('body').catch(() => '');
      const alreadyOnTemplatePage = /[A-Z]{1,2}_\d+/.test(currentPageText) && 
                                    (currentPageText.includes('템플릿관리') || currentPageText.includes('템플릿코드') || currentPageUrl.includes('kakaotemplate'));
      
      if (alreadyOnTemplatePage) {
        console.log('\n✅ 템플릿 페이지 확인됨. 템플릿 목록 추출로 바로 진행합니다.');
        // 템플릿 추출 섹션으로 바로 이동
      } else {
      console.log('\n📋 템플릿 관리 페이지로 이동 중...');
      console.log('  💡 직접 URL 접근은 오류가 발생하므로 메뉴 클릭 방식 사용');
      
      let templatePageFound = false;
      
      // 방법: 메뉴 클릭으로 이동 (직접 URL은 오류 발생 가능)
      console.log('  방법: 메뉴 클릭으로 이동 시도...');
      try {
      // 메인 페이지로 이동
      console.log('    📄 메인 페이지로 이동 중...');
      await page.goto('https://smartsms.aligo.in/main.html', { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);
      console.log('    ✅ 메인 페이지 로드 완료');
      
      // 카카오톡 메뉴 클릭
      console.log('    🔘 "카카오톡" 메뉴 클릭 중...');
      await page.waitForTimeout(1000);
      
      // 여러 방법으로 카카오톡 메뉴 찾기
      let kakaoMenu = await page.$('a:has-text("카카오톡")').catch(() => null);
      if (!kakaoMenu) {
        kakaoMenu = await page.$('a[href*="kakaotalk"], a[href*="kakao"]').catch(() => null);
      }
      if (!kakaoMenu) {
        // 네비게이션 바에서 찾기
        const navLinks = await page.$$('nav a, .nav a, .menu a, a[href*="kakao"]');
        for (const link of navLinks) {
          const text = await link.textContent().catch(() => '');
          if (text && text.includes('카카오톡')) {
            kakaoMenu = link;
            break;
          }
        }
      }
      
      if (kakaoMenu) {
        await kakaoMenu.click();
        await page.waitForTimeout(3000);
        console.log('    ✅ 카카오톡 메뉴 클릭 완료');
      } else {
        console.log('    ⚠️  카카오톡 메뉴를 찾을 수 없습니다. 수동으로 클릭해주세요.');
        await waitForUserConfirmation('브라우저에서 "카카오톡" 메뉴를 클릭한 후 계속하시겠습니까?', true);
      }
      
      // 템플릿관리 탭 클릭
      console.log('    🔘 "템플릿관리" 탭 클릭 중...');
      await page.waitForTimeout(2000);
      
      let templateTab = null;
      
      // 방법 1: 텍스트로 찾기
      try {
        templateTab = await page.locator('text=템플릿관리').first().catch(() => null);
        if (templateTab) {
          const isVisible = await templateTab.isVisible().catch(() => false);
          if (!isVisible) templateTab = null;
        }
      } catch (e) {}
      
      // 방법 2: href로 찾기
      if (!templateTab) {
        const links = await page.$$('a[href*="template"], a[href*="kakaotemplate"]');
        for (const link of links) {
          const text = await link.textContent().catch(() => '');
          if (text && text.includes('템플릿관리')) {
            templateTab = link;
            break;
          }
        }
      }
      
      // 방법 3: 모든 링크에서 찾기
      if (!templateTab) {
        const allLinks = await page.$$('a');
        for (const link of allLinks) {
          const text = await link.textContent().catch(() => '');
          if (text && text.trim() === '템플릿관리') {
            templateTab = link;
            break;
          }
        }
      }
      
      if (templateTab) {
        await templateTab.click();
        await page.waitForTimeout(3000);
        console.log('    ✅ 템플릿관리 탭 클릭 완료');
      } else {
        console.log('    ⚠️  템플릿관리 탭을 찾을 수 없습니다.');
        console.log('    💡 브라우저에서 수동으로 "템플릿관리" 탭을 클릭해주세요.');
        await waitForUserConfirmation('브라우저에서 "템플릿관리" 탭을 클릭한 후 계속하시겠습니까?', true);
        await page.waitForTimeout(2000);
      }
      
      // 카카오채널 ID 선택 (마쓰구골프)
      console.log('    🔘 카카오채널 ID 선택 중...');
      await page.waitForTimeout(2000);
      
      // 여러 방법으로 드롭다운 찾기
      let channelDropdown = await page.$('select[name*="channel"]').catch(() => null);
      if (!channelDropdown) {
        channelDropdown = await page.$('select[id*="channel"]').catch(() => null);
      }
      if (!channelDropdown) {
        // 테이블 헤더의 드롭다운 찾기
        channelDropdown = await page.$('table thead select, table th select').catch(() => null);
      }
      if (!channelDropdown) {
        // 첫 번째 select 요소 찾기
        const selects = await page.$$('select');
        if (selects.length > 0) {
          channelDropdown = selects[0];
        }
      }
      
      if (channelDropdown) {
        // 마쓰구골프 옵션 찾기
        const options = await channelDropdown.$$('option').catch(() => []);
        let selected = false;
        for (const option of options) {
          const text = await option.textContent().catch(() => '');
          if (text && (text.includes('마쓰구골프') || text.includes('마스골프'))) {
            const value = await option.getAttribute('value').catch(() => '');
            await channelDropdown.selectOption(value || { label: text });
            await page.waitForTimeout(2000);
            console.log(`    ✅ 카카오채널 ID 선택 완료: ${text}`);
            selected = true;
            break;
          }
        }
        if (!selected) {
          console.log('    ⚠️  마쓰구골프 옵션을 찾을 수 없습니다.');
        }
      } else {
        console.log('    ⚠️  카카오채널 ID 드롭다운을 찾을 수 없습니다.');
      }
      
      // 최종 확인
      await page.waitForTimeout(2000);
      const pageText = await page.textContent('body').catch(() => '');
      const hasTemplateCodes = /[A-Z]{1,2}_\d+/.test(pageText);
      const hasTemplateTitle = pageText.includes('템플릿관리') || pageText.includes('템플릿코드');
      const hasMasgolf = pageText.includes('마쓰구골프') || pageText.includes('마스골프');
      
      if (hasTemplateCodes && hasTemplateTitle) {
        console.log('    ✅ 템플릿 페이지 확인 완료');
        if (hasMasgolf) {
          console.log('    ✅ 마쓰구골프 템플릿 확인됨');
        }
        templatePageFound = true;
      } else {
        console.log('    ⚠️  템플릿 페이지 확인 실패');
      }
    } catch (e) {
      console.log(`    ⚠️  메뉴 클릭 이동 실패: ${e.message}`);
      console.log(`    💡 브라우저에서 수동으로 템플릿 페이지로 이동해주세요.`);
    }

    if (!templatePageFound) {
      await page.screenshot({ path: 'backup/aligo-template-page-not-found.png', fullPage: true });
      console.log('  💾 스크린샷 저장: backup/aligo-template-page-not-found.png');
      console.log('  ⚠️  템플릿 페이지를 자동으로 찾을 수 없습니다.');
      console.log('  💡 브라우저에서 수동으로 다음 경로로 이동해주세요:');
      console.log('     카카오톡 → 템플릿관리 → 카카오채널 ID 선택 (마쓰구골프)');
      await waitForUserConfirmation('템플릿 페이지로 이동한 후 계속하시겠습니까?', true);
      } else {
        console.log('  ✅ 템플릿 관리 페이지 이동 완료');
      }
      }
    }

    // 4. 카카오채널 ID 선택 확인 및 재선택 (필요시)
    console.log('\n🔍 카카오채널 ID 확인 중...');
    const channelCheckText = await page.textContent('body').catch(() => '');
    
    // 마쓰구골프 템플릿이 보이는지 확인
    if (!channelCheckText.includes('마쓰구골프') && !channelCheckText.includes('마스골프')) {
      console.log('  ⚠️  마쓰구골프 템플릿이 보이지 않습니다. 카카오채널 ID 재선택 시도...');
      
      // 카카오채널 ID 드롭다운 찾기 및 선택
      const channelSelectors = [
        'select[name*="channel"]',
        'select[id*="channel"]',
        'table thead select',
        'table th select',
        'select option:has-text("마쓰구골프")',
        'select option:has-text("마스골프")'
      ];
      
      for (const selector of channelSelectors) {
        try {
          const dropdown = await page.$(selector).catch(() => null);
          if (dropdown) {
            // 마쓰구골프 또는 마스골프 옵션 선택
            const options = await dropdown.$$('option').catch(() => []);
            for (const option of options) {
              const text = await option.textContent().catch(() => '');
              if (text.includes('마쓰구골프') || text.includes('마스골프')) {
                const value = await option.getAttribute('value').catch(() => '');
                await dropdown.selectOption(value || text);
                await page.waitForTimeout(2000);
                console.log(`    ✅ 카카오채널 ID 선택 완료: ${text}`);
                break;
              }
            }
            break;
          }
        } catch (e) {
          // 다음 선택자 시도
        }
      }
    } else {
      console.log('  ✅ 마쓰구골프 템플릿 확인됨');
    }

    // 5. 현재 페이지 상태 확인 및 템플릿 목록 가져오기
    console.log('\n📊 현재 페이지에서 템플릿 목록 수집 중...');
    const pageUrl = page.url();
    console.log(`  📍 현재 URL: ${pageUrl}`);
    
    // 현재 페이지가 템플릿 페이지인지 확인
    const finalBodyText = await page.textContent('body').catch(() => '');
    const isErrorPage = finalBodyText.includes('페이지를 표시할 수 없습니다') || finalBodyText.includes('사이트 장애');
    const isFinalTemplatePage = finalBodyText.includes('템플릿관리') || finalBodyText.includes('템플릿코드') || /[A-Z]{1,2}_\d+/.test(finalBodyText);
    
    if (isErrorPage) {
      console.log('  ⚠️  에러 페이지가 로드되었습니다. 템플릿 페이지로 다시 이동합니다.');
      // 사용자가 제공한 정확한 URL로 이동
      await page.goto('https://smartsms.aligo.in/shop/kakaotemplate.html?seq=2421&range=&kword=', { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);
      console.log('  ✅ 템플릿 페이지로 재이동 완료');
    } else if (!isFinalTemplatePage) {
      console.log('  ⚠️  현재 페이지가 템플릿 페이지가 아닙니다.');
      console.log('  💡 브라우저에서 수동으로 템플릿 페이지로 이동한 후 Enter를 눌러주세요.');
      await waitForUserConfirmation('템플릿 목록 페이지로 이동한 후 계속하시겠습니까?', true);
    } else {
      console.log('  ✅ 템플릿 페이지 확인됨');
    }
    
    await page.waitForTimeout(2000);
    
    // 페이지 스크린샷 저장
    await page.screenshot({ path: 'backup/aligo-template-page.png', fullPage: true });
    console.log('  💾 스크린샷 저장: backup/aligo-template-page.png');
    
    // 페이지 HTML 저장 (디버깅용)
    const html = await page.content();
    fs.writeFileSync('backup/aligo-template-page.html', html, 'utf8');
    console.log('  💾 페이지 HTML 저장: backup/aligo-template-page.html');

    await waitForUserConfirmation('템플릿 목록 페이지가 정상적으로 로드되었는지 확인해주세요.', true);

    // 템플릿 정보 추출 시도
    const templates = [];

    // 다양한 방법으로 템플릿 목록 찾기
    console.log('\n🔍 템플릿 목록 찾는 중...');
    
    // 방법 1: 테이블에서 추출 (알리고 템플릿 목록 테이블)
    try {
      // 알리고 템플릿 테이블 선택자 (더 구체적으로)
      const templateTable = await page.$('table.board_list, table[class*="board"], table[class*="list"]');
      const tables = templateTable ? [templateTable] : await page.$$('table');
      
      console.log(`  📋 발견된 테이블: ${tables.length}개`);
      
      for (let tableIdx = 0; tableIdx < tables.length; tableIdx++) {
        const table = tables[tableIdx];
        // 헤더 행 제외하고 데이터 행만 가져오기
        const tableRows = await table.$$('tbody tr:not(:first-child), tbody tr');
        console.log(`    테이블 ${tableIdx + 1}: ${tableRows.length}개 행`);
        
        for (let i = 0; i < tableRows.length; i++) {
          try {
            const row = tableRows[i];
            const rowText = await row.textContent();
            
            // 템플릿 코드 패턴 찾기 (TY_1512, TW_8855, TI_9794, TV_5950 등)
            const codeMatch = rowText.match(/([A-Z]{1,2}_\d+)/);
            
            // 헤더 행 스킵 (템플릿코드, 템플릿명 등이 포함된 행)
            if (rowText.includes('템플릿코드') && rowText.includes('템플릿명')) {
              console.log(`    [${i + 1}] 헤더 행 스킵`);
              continue;
            }
            
            if (codeMatch || (rowText.length > 10 && !rowText.includes('전체검색'))) {
              const cells = await row.$$('td');
              const cellTexts = [];
              
              for (const cell of cells) {
                const text = await cell.textContent();
                cellTexts.push(text.trim());
              }
              
              // 셀 구조: [체크박스, 카카오채널ID, 템플릿코드, 템플릿명, 대체문자, 상태]
              const templateCode = codeMatch ? codeMatch[1] : (cellTexts[2] || cellTexts[1] || '');
              const templateName = cellTexts[3] || cellTexts[2] || cellTexts[1] || '';
              const altSms = cellTexts[4] || cellTexts[3] || '';
              const status = cellTexts[5] || cellTexts[4] || cellTexts.find(t => t.includes('승인') || t.includes('검수')) || '';
              
              console.log(`    [${i + 1}] ${templateCode} - ${templateName.substring(0, 50)}`);
              
              const templateInfo = {
                code: templateCode,
                name: templateName,
                altSms: altSms,
                status: status,
                rawText: rowText,
                cells: cellTexts,
                tableIndex: tableIdx,
                rowIndex: i
              };
              
              if (templateInfo.code && templateInfo.code.match(/[A-Z]{1,2}_\d+/)) {
                templates.push(templateInfo);
                console.log(`      ✅ 템플릿 발견: ${templateInfo.code} - ${templateInfo.name}`);
              }
            }
          } catch (error) {
            console.error(`      ❌ 행 ${i + 1} 처리 실패:`, error.message);
          }
        }
      }
    } catch (error) {
      console.error('  ❌ 테이블 추출 실패:', error.message);
    }
    
    // 방법 2: 리스트에서 추출
    try {
      const listItems = await page.$$('.template-item, [class*="template"], [id*="template"]');
      console.log(`  📋 발견된 리스트 아이템: ${listItems.length}개`);
      
      for (let i = 0; i < listItems.length; i++) {
        const item = listItems[i];
        const itemText = await item.textContent();
        const codeMatch = itemText.match(/([A-Z]{1,2}_\d+)/);
        
        if (codeMatch) {
          const templateInfo = {
            code: codeMatch[1],
            name: itemText.split('\n')[0]?.trim() || '',
            rawText: itemText
          };
          templates.push(templateInfo);
          console.log(`    ✅ 템플릿 발견: ${templateInfo.code} - ${templateInfo.name}`);
        }
      }
    } catch (error) {
      console.error('  ❌ 리스트 추출 실패:', error.message);
    }
    
    console.log(`\n📊 총 ${templates.length}개 템플릿 발견`);
    
    if (templates.length === 0) {
      await waitForUserConfirmation('템플릿을 자동으로 찾을 수 없습니다. 페이지 구조를 확인하고 수동으로 템플릿을 찾아주세요.');
    }

    // 5. 각 템플릿 상세 정보 가져오기
    console.log(`\n📝 템플릿 상세 정보 수집 중... (${templates.length}개)`);
    
    if (templates.length === 0) {
      await waitForUserConfirmation('템플릿 목록이 비어있습니다. 수동으로 템플릿을 확인한 후 계속하시겠습니까?', true);
    }
    
    for (let i = 0; i < templates.length; i++) {
      try {
        const template = templates[i];
        console.log(`\n[${i + 1}/${templates.length}] ${template.name || template.code || '템플릿'} 처리 중...`);

        // 템플릿 상세 페이지로 이동 시도
        let detailLink = null;
        
        // 테이블 행에서 링크 찾기
        if (template.tableIndex !== undefined && template.rowIndex !== undefined) {
          const tables = await page.$$('table');
          if (tables[template.tableIndex]) {
            const rows = await tables[template.tableIndex].$$('tbody tr, tr');
            if (rows[template.rowIndex]) {
              detailLink = await rows[template.rowIndex].$('a, button');
            }
          }
        }
        
        // 템플릿 코드나 이름으로 링크 찾기
        if (!detailLink && template.code) {
          detailLink = await page.$(`a:has-text("${template.code}"), a[href*="${template.code}"]`).catch(() => null);
        }
        
        if (detailLink) {
          console.log('  🔗 상세 페이지로 이동 중...');
          await detailLink.click();
          await page.waitForTimeout(3000);

          // 상세 정보 추출
          const detailInfo = {
            ...template,
            content: '',
            status: '',
            variables: [],
            buttons: []
          };

          // 내용 추출 시도
          const contentSelectors = [
            'textarea',
            '.content',
            '.template-content',
            '[class*="content"]',
            '[id*="content"]',
            '.message',
            '[class*="message"]'
          ];
          
          for (const selector of contentSelectors) {
            try {
              const element = await page.$(selector);
              if (element) {
                const content = await element.evaluate(el => el.value || el.textContent || el.innerText);
                if (content && content.length > 10) {
                  detailInfo.content = content.trim();
                  console.log(`  ✅ 내용 추출 성공 (${selector}): ${detailInfo.content.substring(0, 100)}...`);
                  break;
                }
              }
            } catch (e) {}
          }

          // 변수 추출 (#{변수명} 패턴)
          const pageContent = detailInfo.content || await page.content();
          const variableMatches = pageContent.match(/#\{[^}]+\}/g);
          if (variableMatches) {
            detailInfo.variables = [...new Set(variableMatches)];
            console.log(`  ✅ 변수 발견: ${detailInfo.variables.join(', ')}`);
          }

          // 버튼 정보 추출
          const buttonElements = await page.$$('[class*="button"], [id*="button"], button, a[href]');
          for (const btn of buttonElements) {
            try {
              const btnText = await btn.textContent();
              const btnHref = await btn.getAttribute('href').catch(() => '');
              if (btnText && (btnText.includes('안내') || btnText.includes('링크') || btnText.includes('버튼') || btnHref)) {
                detailInfo.buttons.push({
                  name: btnText.trim(),
                  href: btnHref
                });
              }
            } catch (e) {}
          }
          
          if (detailInfo.buttons.length > 0) {
            console.log(`  ✅ 버튼 발견: ${detailInfo.buttons.length}개`);
          }

          templates[i] = detailInfo;
          console.log(`  ✅ 상세 정보 수집 완료`);

          // 뒤로 가기
          await page.goBack();
          await page.waitForTimeout(2000);
        } else {
          console.log('  ⚠️  상세 페이지 링크를 찾을 수 없습니다.');
          await waitForUserConfirmation(`템플릿 "${template.name || template.code}"의 상세 페이지 링크를 찾을 수 없습니다. 수동으로 확인하시겠습니까?`);
        }
      } catch (error) {
        console.error(`  ❌ 상세 정보 수집 실패:`, error.message);
        await waitForUserConfirmation(`템플릿 ${i + 1} 처리 중 오류가 발생했습니다. 계속 진행하시겠습니까?`);
      }
    }

    // 6. 결과 저장
    const timestamp = Date.now();
    const outputPath = path.join(__dirname, '..', 'backup', `aligo-templates-scraped-${timestamp}.json`);
    
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify({
      scrapedAt: new Date().toISOString(),
      totalCount: templates.length,
      templates: templates
    }, null, 2), 'utf8');

    console.log(`\n✅ 스크래핑 완료!`);
    console.log(`📄 결과 저장: ${outputPath}`);
    console.log(`📊 총 ${templates.length}개 템플릿 수집\n`);

    return templates;

  } catch (error) {
    console.error('\n❌ 스크래핑 실패:', error.message);
    console.error('   스택:', error.stack);
    
    // 에러 발생 시에도 스크린샷 저장
    try {
      await page.screenshot({ path: 'backup/aligo-error.png', fullPage: true });
      console.log('  💾 에러 스크린샷 저장: backup/aligo-error.png');
    } catch (e) {}
    
    await waitForUserConfirmation('에러가 발생했습니다. 스크린샷을 확인하고 계속 진행하시겠습니까?');
    
    // 사용자가 계속하기를 선택하면 에러를 다시 throw하지 않음
    console.log('  ⚠️  에러를 무시하고 계속 진행합니다.');
  } finally {
    // 브라우저는 유지 (재사용을 위해 닫지 않음)
    console.log('\n💡 브라우저 세션을 유지합니다. (재사용 가능)');
    console.log('   브라우저를 닫으려면 Ctrl+C를 누르거나 스크립트를 종료하세요.');
    if (rl) {
      try {
        rl.close();
      } catch (e) {}
    }
  }
}

// 브라우저 종료 함수
async function closeBrowser() {
  if (browser) {
    console.log('\n🔒 브라우저 종료 중...');
    await browser.close();
    browser = null;
    context = null;
    page = null;
  }
}

// 실행
if (require.main === module) {
  // 종료 시그널 처리
  process.on('SIGINT', async () => {
    console.log('\n\n⚠️  종료 신호 수신...');
    await closeBrowser();
    if (rl) {
      try {
        rl.close();
      } catch (e) {}
    }
    process.exit(0);
  });

  scrapeAligoTemplates()
    .then((templates) => {
      console.log('\n✅ 작업 완료!');
      if (templates && templates.length > 0) {
        console.log(`📊 총 ${templates.length}개 템플릿 수집 완료`);
      }
      console.log('\n💡 브라우저는 유지됩니다. 다시 실행하면 로그인 상태를 재사용합니다.');
      console.log('   브라우저를 닫으려면 Ctrl+C를 누르세요.');
      if (rl) {
        try {
          rl.close();
        } catch (e) {}
      }
      // 브라우저를 닫지 않고 프로세스 유지
      // process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ 작업 실패:', error.message);
      if (rl) {
        try {
          rl.close();
        } catch (e) {}
      }
      // 에러 발생 시에도 브라우저 유지
      // process.exit(1);
    });
}

module.exports = { scrapeAligoTemplates };

