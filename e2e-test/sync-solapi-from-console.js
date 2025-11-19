const { createClient } = require('@supabase/supabase-js');
const { chromium } = require('playwright');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const SOLAPI_URL = 'https://console.solapi.com';
const SOLAPI_USERNAME = process.env.SOLAPI_USERNAME || '';
const SOLAPI_PASSWORD = process.env.SOLAPI_PASSWORD || '';

// Playwright로 Solapi 콘솔에서 그룹 정보 추출
async function getGroupInfoFromConsole(groupId) {
  if (!SOLAPI_USERNAME || !SOLAPI_PASSWORD) {
    console.error('❌ Solapi 로그인 정보가 없습니다.');
    return null;
  }

  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  try {
    console.log('\n🔐 Solapi 로그인 중...');
    await page.goto(`${SOLAPI_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);

    // 로그인 필드 찾기 (더 정확한 셀렉터 사용)
    const emailInputSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[name="username"]',
      'input[placeholder*="아이디"]',
      'input[placeholder*="이메일"]',
      'input[placeholder*="전화번호"]',
      'input[placeholder*="ID"]',
      'input[placeholder*="Email"]',
    ];
    
    let emailInput = null;
    for (const selector of emailInputSelectors) {
      const input = await page.locator(selector).first();
      if (await input.isVisible({ timeout: 2000 })) {
        emailInput = input;
        console.log(`✅ 로그인 ID 필드 발견: ${selector}`);
        break;
      }
    }
    
    const passwordInput = await page.locator('input[type="password"]').first();
    const loginButton = await page.locator('button[type="submit"], button:has-text("로그인"), button:has-text("Login")').first();

    if (emailInput && await emailInput.isVisible({ timeout: 5000 })) {
      // 기존 값이 있으면 지우고 입력
      await emailInput.clear();
      if (SOLAPI_USERNAME) {
        await emailInput.fill(SOLAPI_USERNAME);
        await passwordInput.fill(SOLAPI_PASSWORD);
        await page.waitForTimeout(1000);
        await loginButton.click();
        await page.waitForTimeout(5000);
        console.log('✅ Solapi 자동 로그인 시도 완료');
      } else {
        console.log('⚠️ 로그인 정보가 없습니다. 수동 로그인이 필요합니다.');
      }
    } else {
      console.log('⚠️ 로그인 필드를 찾을 수 없습니다. 수동 로그인이 필요합니다.');
    }

    // 로그인 완료 확인 (최대 60초 대기)
    console.log('\n⏳ 로그인 완료를 기다리는 중... (최대 60초)');
    console.log('   로그인이 필요하면 브라우저에서 직접 로그인해주세요.');
    
    let loginSuccess = false;
    const maxWaitTime = 60000; // 60초
    const checkInterval = 2000; // 2초마다 확인
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const currentUrl = page.url();
      // 로그인 페이지가 아니면 로그인 성공으로 간주
      if (!currentUrl.includes('/login') && !currentUrl.includes('/oauth2/login')) {
        loginSuccess = true;
        console.log('\n✅ 로그인 완료 확인됨');
        break;
      }
      await page.waitForTimeout(checkInterval);
      process.stdout.write('.'); // 진행 표시
    }
    
    if (!loginSuccess) {
      console.log('\n❌ 로그인 시간 초과 (60초)');
      console.log('   브라우저에서 수동으로 로그인한 후 스크립트를 다시 실행해주세요.');
      await browser.close();
      process.exit(1);
    }
    
    console.log('✅ Solapi 로그인 완료');

    // 메시지 로그 페이지로 이동 (그룹 ID로 직접 검색)
    const searchUrl = `${SOLAPI_URL}/message-log?criteria=groupId&value=${groupId}&cond=eq`;
    console.log(`🔍 그룹 ID로 검색 URL로 이동: ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);

    // 검색 결과 테이블에서 행 찾기 (여러 셀렉터 시도)
    await page.waitForTimeout(5000);
    
    // 페이지가 완전히 로드될 때까지 대기
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {
      console.warn('⚠️ networkidle 대기 시간 초과, 계속 진행...');
    });
    await page.waitForTimeout(5000); // 추가 대기

    // 페이지 전체 텍스트에서 그룹 ID 검색 (먼저 확인)
    const pageText = await page.textContent('body');
    if (!pageText || !pageText.includes(groupId)) {
      console.warn('⚠️ 페이지에서 그룹 ID를 찾을 수 없습니다. 스크린샷 저장...');
      await page.screenshot({ path: '/tmp/solapi-search-page.png', fullPage: true });
      console.log('   스크린샷 저장: /tmp/solapi-search-page.png');
      console.log('   페이지 일부 내용:', pageText?.substring(0, 1000));
      
      // 그래도 계속 진행 (테이블이 있을 수 있음)
    }

    // 다양한 테이블 셀렉터 시도
    let tableRows = await page.locator('table tbody tr').all();
    if (tableRows.length === 0) {
      tableRows = await page.locator('[role="table"] tbody tr').all();
    }
    if (tableRows.length === 0) {
      tableRows = await page.locator('tbody tr').all();
    }
    if (tableRows.length === 0) {
      tableRows = await page.locator('tr').all();
    }
    
    console.log(`📊 발견된 테이블 행 수: ${tableRows.length}개`);

    let targetRow = null;
    
    // 1. 그룹 ID로 정확히 찾기
    for (const row of tableRows) {
      const rowText = await row.textContent();
      if (rowText && rowText.includes(groupId)) {
        targetRow = row;
        console.log('✅ 그룹 ID를 가진 행 발견');
        break;
      }
    }
    
    // 2. 그룹 ID를 못 찾았으면 "200건" 또는 "발송요청완료" 텍스트로 찾기
    if (!targetRow) {
      console.log('🔍 그룹 ID로 찾지 못함. "200건" 또는 "발송요청완료" 텍스트로 검색...');
      for (const row of tableRows) {
        const rowText = await row.textContent();
        if (rowText && (rowText.includes('200건') || rowText.includes('발송요청완료'))) {
          // "총 200건 발송요청완료" 형식 확인
          if (rowText.match(/총\s*200건.*발송요청완료/) || rowText.match(/200건.*발송요청완료/)) {
            targetRow = row;
            console.log('✅ 200건 발송요청완료 행 발견');
            break;
          }
        }
      }
    }
    
    // 3. 그래도 못 찾았으면 첫 번째 행 시도
    if (!targetRow && tableRows.length > 0) {
      console.log('⚠️ 그룹 ID나 200건 행을 찾지 못했지만 첫 번째 행을 시도합니다.');
      targetRow = tableRows[0];
    }

    if (!targetRow) {
      console.error('❌ 검색 결과에서 그룹을 찾을 수 없습니다.');
      await browser.close();
      return null;
    }

    // 행 클릭하여 모달 열기
    console.log('🖱️ 행 클릭 중...');
    await targetRow.click();
    await page.waitForTimeout(5000); // 모달 열림 대기 시간 증가

    // 모달이 열렸는지 확인 (여러 패턴 시도)
    let modalTitle = await page.locator('[role="dialog"]').first();
    if (!(await modalTitle.isVisible({ timeout: 5000 }))) {
      // 대체 셀렉터 시도
      modalTitle = await page.locator('.modal, [class*="Modal"], [class*="modal"]').first();
    }
    
    if (!(await modalTitle.isVisible({ timeout: 5000 }))) {
      console.error('❌ 모달이 열리지 않았습니다. 스크린샷 저장...');
      await page.screenshot({ path: '/tmp/solapi-modal-failed.png', fullPage: true });
      console.log('   스크린샷 저장: /tmp/solapi-modal-failed.png');
      
      // 행을 다시 클릭해보기
      console.log('🔄 행을 다시 클릭 시도...');
      await targetRow.click({ force: true });
      await page.waitForTimeout(5000);
      
      modalTitle = await page.locator('[role="dialog"]').first();
      if (!(await modalTitle.isVisible({ timeout: 5000 }))) {
        await browser.close();
        return null;
      }
    }

    console.log('✅ 모달이 열렸습니다.');

    // "자세한 그룹 정보 펼치기" 버튼 찾기 및 클릭
    console.log('🔍 "자세한 그룹 정보 펼치기" 버튼 찾는 중...');
    const expandButtons = [
      'button:has-text("자세한 그룹 정보 펼치기")',
      'button:has-text("자세한 그룹 정보")',
      '*:has-text("자세한 그룹 정보 펼치기")',
      '*:has-text("펼치기")',
      '[role="button"]:has-text("자세한 그룹 정보")',
    ];
    
    let expandButton = null;
    for (const selector of expandButtons) {
      try {
        const btn = await page.locator('[role="dialog"]').locator(selector).first();
        if (await btn.isVisible({ timeout: 3000 })) {
          expandButton = btn;
          console.log(`✅ "자세한 그룹 정보 펼치기" 버튼 발견: ${selector}`);
          break;
        }
      } catch (e) {
        // 계속 시도
      }
    }
    
    if (expandButton) {
      await expandButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ "자세한 그룹 정보" 섹션 펼침');
    } else {
      console.warn('⚠️ "자세한 그룹 정보 펼치기" 버튼을 찾을 수 없습니다. 이미 펼쳐져 있을 수 있습니다.');
    }

    // 모달 내부 스크롤 가능한 영역 찾기
    const modalContent = await page.locator('[role="dialog"]').first();
    
    // 모달 하단까지 스크롤 (그룹 ID가 하단에 있음)
    console.log('📜 모달 하단으로 스크롤 중...');
    await modalContent.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await page.waitForTimeout(2000);
    
    // 다시 상단으로 스크롤 (전체 내용 확인)
    await modalContent.evaluate((el) => {
      el.scrollTop = 0;
    });
    await page.waitForTimeout(1000);
    
    // 천천히 하단까지 스크롤 (정보 추출을 위해)
    const scrollStep = 500;
    const scrollHeight = await modalContent.evaluate((el) => el.scrollHeight);
    let currentScroll = 0;
    
    while (currentScroll < scrollHeight) {
      await modalContent.evaluate((el, pos) => {
        el.scrollTop = pos;
      }, currentScroll);
      await page.waitForTimeout(500);
      currentScroll += scrollStep;
    }
    
    // 최종적으로 하단에 위치
    await modalContent.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await page.waitForTimeout(2000);

    // 그룹 정보 추출
    const groupInfo = {
      groupId: groupId,
      status: '',
      successCount: 0,
      failCount: 0,
      sendingCount: 0,
      totalCount: 0,
      dateSent: '',
      messageText: '',
      messageType: 'MMS',
      recipientNumbers: [],
      imageUrl: null
    };

    // 모달 전체 텍스트 가져오기 (스크롤 후)
    const modalText = await page.locator('[role="dialog"]').textContent();
    console.log('📋 모달 내용 전체 길이:', modalText?.length || 0);
    console.log('📋 모달 내용 상단:', modalText?.substring(0, 500));
    console.log('📋 모달 내용 하단:', modalText?.substring(Math.max(0, (modalText?.length || 0) - 500)));

    // 모달 하단에서 그룹 ID 확인 및 추출
    if (modalText && modalText.includes(groupId)) {
      console.log('✅ 모달에서 그룹 ID 확인됨');
    } else {
      // 그룹 ID가 텍스트에 없으면 하단에서 직접 찾기
      console.log('🔍 모달 텍스트에서 그룹 ID를 찾지 못함. 하단 요소에서 직접 검색...');
      
      // 하단의 모든 텍스트 요소 확인
      const bottomElements = await page.locator('[role="dialog"]').locator('*').all();
      for (const el of bottomElements.slice(-50)) { // 하단 50개 요소만 확인
        const text = await el.textContent();
        if (text && text.includes('G4V')) {
          console.log(`📋 그룹 ID 패턴 발견: ${text.substring(0, 100)}`);
          // 그룹 ID 추출
          const idMatch = text.match(/G4V[\w]+/);
          if (idMatch) {
            console.log(`✅ 그룹 ID 추출: ${idMatch[0]}`);
            groupInfo.groupId = idMatch[0];
          }
        }
      }
    }
    
    // 모달 하단에서 그룹 ID 섹션 찾기
    console.log('🔍 그룹 ID 섹션 찾는 중...');
    const groupIdSelectors = [
      '*:has-text("그룹아이디")',
      '*:has-text("그룹 아이디")',
      '*:has-text("Group ID")',
      'text=/그룹.*[아이디|ID]/i',
      'text=/Group.*ID/i',
    ];
    
    let groupIdFound = false;
    for (const selector of groupIdSelectors) {
      try {
        const groupIdSection = await page.locator('[role="dialog"]').locator(selector).first();
        if (await groupIdSection.isVisible({ timeout: 2000 })) {
          const groupIdText = await groupIdSection.textContent();
          console.log(`📋 그룹 ID 섹션 발견 (${selector}): ${groupIdText?.substring(0, 200)}`);
          
          // 그룹 ID 추출
          if (groupIdText && groupIdText.match(/G4V[\w]+/)) {
            const idMatch = groupIdText.match(/G4V[\w]+/);
            if (idMatch) {
              console.log(`✅ 그룹 ID 추출: ${idMatch[0]}`);
              if (idMatch[0] === groupId) {
                console.log(`✅ 그룹 ID 확인됨: ${idMatch[0]}`);
                groupIdFound = true;
              } else {
                console.warn(`⚠️ 그룹 ID 불일치: 찾은 ID=${idMatch[0]}, 원하는 ID=${groupId}`);
              }
            }
          }
          break;
        }
      } catch (e) {
        // 계속 시도
      }
    }
    
    // 그룹 ID를 못 찾았으면 하단 텍스트에서 직접 검색
    if (!groupIdFound) {
      console.log('🔍 그룹 ID 섹션을 찾지 못함. 하단 텍스트에서 직접 검색...');
      const bottomText = modalText?.substring(Math.max(0, (modalText?.length || 0) - 1000));
      if (bottomText && bottomText.match(/G4V[\w]+/)) {
        const idMatch = bottomText.match(/G4V[\w]+/);
        if (idMatch && idMatch[0] === groupId) {
          console.log(`✅ 하단 텍스트에서 그룹 ID 확인: ${idMatch[0]}`);
          groupIdFound = true;
        }
      }
    }

    // 상태 정보 추출 (현황 섹션에서)
    try {
      // "실패 0 / 성공 195 / 발송중 5" 형식 찾기 (여러 패턴 시도)
      const statusPatterns = [
        /실패\s*(\d+)\s*\/\s*성공\s*(\d+)\s*\/\s*발송중\s*(\d+)/,
        /실패\s*(\d+)\s*성공\s*(\d+)\s*발송중\s*(\d+)/,
        /실패.*?(\d+).*?성공.*?(\d+).*?발송중.*?(\d+)/,
      ];
      
      let statusMatch = null;
      for (const pattern of statusPatterns) {
        statusMatch = modalText?.match(pattern);
        if (statusMatch) break;
      }
      
      if (statusMatch) {
        groupInfo.failCount = parseInt(statusMatch[1]);
        groupInfo.successCount = parseInt(statusMatch[2]);
        groupInfo.sendingCount = parseInt(statusMatch[3]);
        groupInfo.totalCount = groupInfo.successCount + groupInfo.failCount + groupInfo.sendingCount;
        console.log(`✅ 상태 정보 추출: 성공 ${groupInfo.successCount}, 실패 ${groupInfo.failCount}, 발송중 ${groupInfo.sendingCount}`);
      } else {
        // 대체 패턴 시도
        const successMatch = modalText?.match(/성공[:\s]*(\d+)/);
        const failMatch = modalText?.match(/실패[:\s]*(\d+)/);
        const sendingMatch = modalText?.match(/발송중[:\s]*(\d+)/);
        
        if (successMatch) groupInfo.successCount = parseInt(successMatch[1]);
        if (failMatch) groupInfo.failCount = parseInt(failMatch[1]);
        if (sendingMatch) groupInfo.sendingCount = parseInt(sendingMatch[1]);
        
        groupInfo.totalCount = groupInfo.successCount + groupInfo.failCount + groupInfo.sendingCount;
      }

      // 총 건수 추출 ("총 200건" 형식)
      const totalMatch = modalText?.match(/총\s*(\d+)건/);
      if (totalMatch) {
        groupInfo.totalCount = parseInt(totalMatch[1]);
        console.log(`✅ 총 건수 추출: ${groupInfo.totalCount}건`);
      }
      
      // 발송일 추출 (그룹생성시각 또는 발송요청시각)
      const datePatterns = [
        /(\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2})/,
        /(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/,
        /그룹생성시각[:\s]*(\d{4}[\/\-]\d{2}[\/\-]\d{2}\s+\d{2}:\d{2}:\d{2})/,
        /발송요청시각[:\s]*(\d{4}[\/\-]\d{2}[\/\-]\d{2}\s+\d{2}:\d{2}:\d{2})/,
      ];
      
      for (const pattern of datePatterns) {
        const dateMatch = modalText?.match(pattern);
        if (dateMatch) {
          groupInfo.dateSent = dateMatch[1];
          console.log(`✅ 발송일 추출: ${groupInfo.dateSent}`);
          break;
        }
      }
    } catch (e) {
      console.warn('⚠️ 상태 정보 추출 실패:', e.message);
    }

    // 메시지 목록 탭으로 이동
    const messageListTab = await page.locator('button:has-text("메시지 목록"), button:has-text("Message List"), [role="tab"]:has-text("메시지 목록"), [role="tab"]:has-text("Message")').first();
    if (await messageListTab.isVisible({ timeout: 5000 })) {
      await messageListTab.click();
      await page.waitForTimeout(3000);
      console.log('✅ 메시지 목록 탭으로 이동');
    } else {
      console.warn('⚠️ 메시지 목록 탭을 찾을 수 없습니다. 현재 탭에서 정보 추출 시도...');
    }

    // 페이지당 표시 개수를 200개로 설정
    console.log('🔍 페이지당 표시 개수 설정 중...');
    
    // 모달 내부의 모든 select, input, button 요소 찾기
    const modal = page.locator('[role="dialog"]').first();
    
    // 방법 1: select 요소 찾기
    let pageSizeControl = null;
    const selects = await modal.locator('select').all();
    for (const select of selects) {
      if (await select.isVisible({ timeout: 2000 }).catch(() => false)) {
        const options = await select.locator('option').all();
        for (const option of options) {
          const optionText = await option.textContent();
          if (optionText && (optionText.includes('200') || optionText.trim() === '200')) {
            pageSizeControl = select;
            console.log('✅ 페이지 크기 select 발견');
            break;
          }
        }
        if (pageSizeControl) break;
      }
    }
    
    // 방법 2: "50 ▼" 같은 형태의 버튼/드롭다운 찾기
    if (!pageSizeControl) {
      const dropdowns = await modal.locator('button, div[role="button"], [class*="Select"], [class*="select"]').all();
      for (const dropdown of dropdowns) {
        const text = await dropdown.textContent();
        if (text && (text.includes('50') || text.includes('10') || text.includes('100')) && text.includes('▼')) {
          console.log('✅ 페이지 크기 드롭다운 발견:', text);
          await dropdown.click();
          await page.waitForTimeout(1000);
          
          // 200 옵션 찾기
          const option200 = await modal.locator('*:has-text("200"), li:has-text("200"), div:has-text("200")').first();
          if (await option200.isVisible({ timeout: 2000 }).catch(() => false)) {
            await option200.click();
            console.log('✅ 페이지당 표시 개수를 200개로 설정');
            await page.waitForTimeout(3000);
            pageSizeControl = dropdown; // 표시용
            break;
          }
        }
      }
    }
    
    // 방법 3: select에 직접 200 설정
    if (pageSizeControl) {
      const tagName = await pageSizeControl.evaluate(el => el.tagName.toLowerCase());
      if (tagName === 'select') {
        try {
          await pageSizeControl.selectOption({ value: '200' });
          console.log('✅ 페이지당 표시 개수를 200개로 설정 (selectOption)');
          await page.waitForTimeout(3000);
        } catch (e) {
          // value로 안 되면 text로 시도
          try {
            await pageSizeControl.selectOption({ label: '200' });
            console.log('✅ 페이지당 표시 개수를 200개로 설정 (label)');
            await page.waitForTimeout(3000);
          } catch (e2) {
            console.warn('⚠️ selectOption 실패:', e2.message);
          }
        }
      }
    } else {
      console.warn('⚠️ 페이지당 표시 개수 컨트롤을 찾을 수 없습니다. 페이지네이션으로 모든 데이터 추출 시도...');
    }

    // 메시지 내용 및 수신자 번호 추출
    await page.waitForTimeout(2000);
    
    // 여러 테이블 셀렉터 시도
    let modalTable = await page.locator('[role="dialog"] table').first();
    if (!(await modalTable.isVisible({ timeout: 2000 }))) {
      modalTable = await page.locator('.modal table').first();
    }
    if (!(await modalTable.isVisible({ timeout: 2000 }))) {
      modalTable = await page.locator('[role="dialog"] [role="table"]').first();
    }
    
    if (await modalTable.isVisible({ timeout: 3000 })) {
      // 페이지네이션으로 모든 데이터 추출
      let allRecipients = [];
      let currentPage = 1;
      let hasNextPage = true;
      let extractedMessageText = false;
      
      while (hasNextPage) {
        await page.waitForTimeout(2000); // 테이블 로딩 대기
        
        // 테이블 다시 찾기 (페이지 변경 후)
        modalTable = await page.locator('[role="dialog"] table').first();
        if (!(await modalTable.isVisible({ timeout: 2000 }))) {
          modalTable = await page.locator('.modal table').first();
        }
        if (!(await modalTable.isVisible({ timeout: 2000 }))) {
          modalTable = await page.locator('[role="dialog"] [role="table"]').first();
        }
        
        const rows = await modalTable.locator('tr').all();
        console.log(`📊 페이지 ${currentPage} 테이블 행 수: ${rows.length}개`);
        
        // 헤더 행 제외하고 데이터 행만 처리
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const cells = await row.locator('td').all();
          
          if (cells.length >= 4) {
            // 수신자 번호는 4번째 열(수신번호)에 있음
            const recipientCell = cells[3]; // 0-based index, 4번째 열 = index 3
            const recipientText = await recipientCell.textContent();
            
            if (recipientText) {
              // 전화번호 패턴 매칭 (010-1234-5678 또는 01012345678)
              const phoneMatches = recipientText.match(/(010|011|016|017|018|019)[-\s]?\d{3,4}[-\s]?\d{4}/g);
              if (phoneMatches) {
                phoneMatches.forEach(phone => {
                  const normalized = phone.replace(/[-\s]/g, '');
                  if (normalized.length >= 10 && normalized.length <= 11) {
                    const formatted = normalized.length === 11 
                      ? `${normalized.slice(0, 3)}-${normalized.slice(3, 7)}-${normalized.slice(7)}`
                      : normalized;
                    if (!allRecipients.includes(formatted)) {
                      allRecipients.push(formatted);
                    }
                  }
                });
              }
            }
            
            // 메시지 내용은 마지막 열(내용)에 있음 (첫 페이지에서만)
            if (!extractedMessageText && cells.length >= 7) {
              const contentCell = cells[6]; // 내용 열
              const contentText = await contentCell.textContent();
              if (contentText && contentText.length > 20) {
                const trimmed = contentText.trim();
                if (trimmed.length > 10) {
                  groupInfo.messageText = trimmed.substring(0, 500); // 최대 500자
                  extractedMessageText = true;
                }
              }
            }
          }
        }
        
        console.log(`   페이지 ${currentPage} 추출 완료: 현재 총 ${allRecipients.length}명`);
        
        // 다음 페이지 확인
        const modal = page.locator('[role="dialog"]').first();
        
        // "전체 (1/200)" 같은 텍스트에서 페이지 정보 확인
        let currentPageNum = currentPage;
        let totalPages = 1;
        
        // 여러 방법으로 페이지네이션 텍스트 찾기
        const paginationSelectors = [
          '*:has-text("전체")',
          '*:has-text("/")',
          '[class*="pagination"]',
          '[class*="Pagination"]',
        ];
        
        for (const selector of paginationSelectors) {
          const elements = await modal.locator(selector).all();
          for (const el of elements) {
            const text = await el.textContent();
            if (text && text.match(/\d+\/\d+/)) {
              const match = text.match(/(\d+)\/(\d+)/);
              if (match) {
                currentPageNum = parseInt(match[1]);
                totalPages = parseInt(match[2]);
                console.log(`   페이지 정보 발견: ${currentPageNum}/${totalPages} (텍스트: ${text.substring(0, 50)})`);
                break;
              }
            }
          }
          if (totalPages > 1) break;
        }
        
        // 모달 전체 텍스트에서도 찾기
        if (totalPages === 1) {
          const modalText = await modal.textContent();
          const match = modalText?.match(/전체\s*\((\d+)\/(\d+)\)/);
          if (match) {
            currentPageNum = parseInt(match[1]);
            totalPages = parseInt(match[2]);
            console.log(`   페이지 정보 발견 (전체 텍스트): ${currentPageNum}/${totalPages}`);
          }
        }
        
        // 다음 페이지 버튼 찾기 (여러 셀렉터 시도)
        const nextButtonSelectors = [
          '.navigate_next',
          '[class*="navigate_next"]',
          'button:has([class*="navigate_next"])',
          'button[aria-label*="next"]',
          'button[aria-label*="Next"]',
          'button:has-text("다음")',
          'button:has-text(">")',
        ];
        
        let nextButton = null;
        for (const selector of nextButtonSelectors) {
          const btn = await modal.locator(selector).first();
          if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
            nextButton = btn;
            console.log(`   다음 버튼 발견: ${selector}`);
            break;
          }
        }
        
        if (currentPageNum < totalPages && totalPages > 1) {
          if (nextButton) {
            const isDisabled = await nextButton.isDisabled().catch(() => false);
            if (!isDisabled) {
              console.log(`📄 다음 페이지로 이동 (${currentPageNum}/${totalPages})`);
              await nextButton.scrollIntoViewIfNeeded();
              await page.waitForTimeout(500);
              await nextButton.click();
              await page.waitForTimeout(3000);
              currentPage++;
            } else {
              console.log('   다음 버튼이 비활성화되어 있습니다.');
              hasNextPage = false;
            }
          } else {
            console.log('   다음 버튼을 찾을 수 없습니다.');
            hasNextPage = false;
          }
        } else {
          console.log(`   마지막 페이지입니다 (${currentPageNum}/${totalPages})`);
          hasNextPage = false;
        }
        
        // 최대 10페이지까지만 (안전장치)
        if (currentPage > 10) {
          console.warn('⚠️ 최대 페이지 수(10)에 도달했습니다.');
          hasNextPage = false;
        }
      }
      
      groupInfo.recipientNumbers = allRecipients;
      console.log(`✅ 수신자 번호 추출 완료: 총 ${groupInfo.recipientNumbers.length}명`);
    } else {
      console.warn('⚠️ 테이블을 찾을 수 없습니다. 모달 전체 텍스트에서 추출 시도...');
      
      // 모달 전체 텍스트에서 전화번호 추출
      const allPhones = modalText?.match(/(010|011|016|017|018|019)[-\s]?\d{3,4}[-\s]?\d{4}/g);
      if (allPhones) {
        allPhones.forEach(phone => {
          const normalized = phone.replace(/[-\s]/g, '');
          if (normalized.length >= 10 && normalized.length <= 11) {
            const formatted = normalized.length === 11 
              ? `${normalized.slice(0, 3)}-${normalized.slice(3, 7)}-${normalized.slice(7)}`
              : normalized;
            if (!groupInfo.recipientNumbers.includes(formatted)) {
              groupInfo.recipientNumbers.push(formatted);
            }
          }
        });
        console.log(`✅ 모달 텍스트에서 수신자 번호 추출: ${groupInfo.recipientNumbers.length}명`);
      }
    }

    console.log('\n✅ 그룹 정보 추출 완료');
    console.log(`   그룹 ID: ${groupInfo.groupId}`);
    console.log(`   총 발송: ${groupInfo.totalCount}건`);
    console.log(`   성공: ${groupInfo.successCount}건, 실패: ${groupInfo.failCount}건, 발송중: ${groupInfo.sendingCount}건`);
    console.log(`   수신자 수: ${groupInfo.recipientNumbers.length}명`);
    console.log(`   메시지 내용: ${groupInfo.messageText?.substring(0, 50) || '없음'}...\n`);
    
    // 모달을 닫지 않고 잠시 대기 (확인용)
    await page.waitForTimeout(2000);
    
    await browser.close();
    return groupInfo;

  } catch (error) {
    console.error('❌ Solapi 콘솔에서 정보 추출 오류:', error);
    await browser.close();
    return null;
  }
}

// DB에 동기화 (기존 메시지가 있으면 업데이트, 없으면 생성)
async function syncToDB(groupInfo, existing = null) {
  if (!groupInfo) {
    return null;
  }

  console.log('\n💾 DB에 저장 중...');
  console.log(`   그룹 ID: ${groupInfo.groupId}`);
  console.log(`   총 발송: ${groupInfo.totalCount}건`);
  console.log(`   성공: ${groupInfo.successCount}건`);
  console.log(`   실패: ${groupInfo.failCount}건`);
  console.log(`   수신자 수: ${groupInfo.recipientNumbers.length}명\n`);

  const sentAt = groupInfo.dateSent 
    ? new Date(groupInfo.dateSent.replace(/\//g, '-')).toISOString()
    : new Date().toISOString();

  const updateData = {
    message_text: groupInfo.messageText || 'Solapi에서 동기화된 메시지',
    message_type: groupInfo.messageType,
    status: 'sent',
    solapi_group_id: groupInfo.groupId,
    sent_at: sentAt,
    sent_count: groupInfo.totalCount,
    success_count: groupInfo.successCount,
    fail_count: groupInfo.failCount,
    recipient_numbers: groupInfo.recipientNumbers,
    image_url: groupInfo.imageUrl,
    updated_at: new Date().toISOString()
  };

  let result;
  if (existing) {
    // 기존 메시지 업데이트
    console.log('🔄 기존 메시지 업데이트 중...');
    const { data: updatedMessage, error } = await supabase
      .from('channel_sms')
      .update(updateData)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('❌ DB 업데이트 실패:', error);
      return null;
    }

    console.log('✅ DB 업데이트 성공!');
    result = updatedMessage;
  } else {
    // 새 메시지 생성
    console.log('➕ 새 메시지 생성 중...');
    const { data: newMessage, error } = await supabase
      .from('channel_sms')
      .insert({
        ...updateData,
        created_at: sentAt
      })
      .select()
      .single();

    if (error) {
      console.error('❌ DB 저장 실패:', error);
      return null;
    }

    console.log('✅ DB 저장 성공!');
    result = newMessage;
  }

  return result;
}

// 메인 함수
async function main() {
  const GROUP_ID = process.argv[2] || 'G4V202511181317011LMZKTZGSYH56HC';
  
  console.log('🚀 Solapi 메시지를 DB에 동기화 시작...\n');
  console.log(`📋 그룹 ID: ${GROUP_ID}\n`);

  // 먼저 DB에 이미 있는지 확인
  const { data: existing } = await supabase
    .from('channel_sms')
    .select('*')
    .eq('solapi_group_id', GROUP_ID)
    .single();

  if (existing) {
    console.log('⚠️ 이미 DB에 존재하는 메시지입니다:');
    console.log(`   메시지 ID: ${existing.id}`);
    console.log(`   상태: ${existing.status}`);
    console.log(`   수신자 수: ${existing.recipient_numbers?.length || 0}명`);
    console.log(`   발송 건수: ${existing.sent_count || 0}건`);
    console.log('   -> Solapi에서 최신 정보로 업데이트합니다.\n');
  }

  // Solapi 콘솔에서 정보 추출
  const groupInfo = await getGroupInfoFromConsole(GROUP_ID);
  
  if (!groupInfo) {
    console.error('\n❌ Solapi에서 그룹 정보를 가져올 수 없습니다.');
    process.exit(1);
  }

  // DB에 동기화 (기존 메시지가 있으면 업데이트, 없으면 생성)
  const result = await syncToDB(groupInfo, existing);
  
  if (result) {
    console.log(`\n✅ 동기화 완료!`);
    console.log(`   메시지 ID: ${result.id}`);
    console.log(`   수신자 수: ${result.recipient_numbers?.length || 0}명`);
    console.log(`   발송 건수: ${result.sent_count || 0}건`);
    console.log(`   SMS 편집 페이지: http://localhost:3000/admin/sms?id=${result.id}`);
  } else {
    console.error('\n❌ 동기화 실패');
    process.exit(1);
  }
}

main();

