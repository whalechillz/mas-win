const { chromium } = require('playwright');
require('dotenv').config({ path: '.env.local' });

const LOCAL_URL = process.env.LOCAL_URL || 'http://localhost:3000';
const SOLAPI_URL = 'https://console.solapi.com';
const SOLAPI_USERNAME = process.env.SOLAPI_USERNAME || process.env.SOLAPI_USER || '';
const SOLAPI_PASSWORD = process.env.SOLAPI_PASSWORD || process.env.SOLAPI_PASS || '';
const MESSAGE_ID = process.argv[2];
const USE_SOLAPI = SOLAPI_USERNAME && SOLAPI_PASSWORD;

if (!MESSAGE_ID) {
  console.error('❌ 사용법: node playwright-check-solapi-and-save-remaining.js <messageId>');
  console.error('   예시: node playwright-check-solapi-and-save-remaining.js 81');
  process.exit(1);
}

if (!USE_SOLAPI) {
  console.log('⚠️  Solapi 로그인 정보가 없습니다. message_logs 테이블만 사용합니다.');
  console.log('   (더 정확한 결과를 위해 환경 변수 설정 권장: SOLAPI_USERNAME, SOLAPI_PASSWORD)');
}

async function checkSolapiAndSaveRemaining() {
  console.log('🚀 미발송 수신자 확인 및 저장 시작...\n');
  console.log(`📋 메시지 ID: ${MESSAGE_ID}`);
  if (USE_SOLAPI) {
    console.log(`🌐 Solapi URL: ${SOLAPI_URL}`);
    console.log(`👤 Solapi 계정: ${SOLAPI_USERNAME}\n`);
  } else {
    console.log(`📊 message_logs 테이블 사용 (Solapi 로그인 없음)\n`);
  }

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    // 1. 로컬 서버에서 메시지 정보 조회
    console.log('📋 1. 로컬 서버에서 메시지 정보 조회 중...');
    const messageResponse = await page.goto(`${LOCAL_URL}/api/channels/sms/check-sending-status?messageId=${MESSAGE_ID}`, {
      waitUntil: 'networkidle'
    });
    
    const messageData = await messageResponse.json();
    
    if (!messageData.success) {
      throw new Error(messageData.message || '메시지 조회 실패');
    }

    const { result } = messageData;
    console.log('✅ 메시지 정보 조회 완료:');
    console.log(`   - 수신자 수: ${result.dbData.recipientCount}명`);
    console.log(`   - 발송 시도 건수: ${result.dbData.sentCount}건`);
    console.log(`   - Solapi 그룹 ID: ${result.dbData.solapiGroupId || '없음'}`);

    // 2. message_logs 테이블에서 발송된 번호 확인 (우선 사용)
    console.log('\n📋 2. message_logs 테이블에서 발송된 번호 확인 중...');
    const logsCheckResponse = await page.goto(`${LOCAL_URL}/api/channels/sms/check-sending-status?messageId=${MESSAGE_ID}&checkLogs=true`, {
      waitUntil: 'networkidle'
    });
    const logsCheckData = await logsCheckResponse.json();
    
    if (!logsCheckData.success) {
      throw new Error('발송 로그 확인 실패');
    }

    console.log('✅ message_logs 확인 완료:');
    console.log(`   - 발송 완료 (logs): ${logsCheckData.analysis.sentPhonesFromLogs || 0}명`);
    console.log(`   - 미발송: ${logsCheckData.analysis.remainingCount || 0}명`);

    // 3. 전체 수신자 목록 미리 조회 (Solapi 추출 후 비교용)
    console.log('\n📋 3-1. 전체 수신자 목록 미리 조회 중...');
    const fullMessageResponse = await page.goto(`${LOCAL_URL}/api/channels/sms/${MESSAGE_ID}`, {
      waitUntil: 'networkidle'
    });
    
    const fullMessageData = await fullMessageResponse.json();
    
    if (!fullMessageData.success) {
      throw new Error('전체 메시지 정보 조회 실패');
    }

    const allRecipients = fullMessageData.post.formData.recipientNumbers || [];
    console.log(`✅ 전체 수신자 수: ${allRecipients.length}명`);

    // 3-2. Solapi 로그인 (선택적, message_logs가 없거나 부족한 경우만)
    let sentNumbers = new Set();
    if (USE_SOLAPI && logsCheckData.analysis.sentPhonesFromLogs === 0 && result.dbData.solapiGroupId) {
      console.log('\n🔐 3. Solapi 로그인 중 (message_logs가 없어서 Solapi 확인)...');
      try {
        await page.goto(`${SOLAPI_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(3000);
      } catch (error) {
        console.log('⚠️  Solapi 로그인 페이지 로딩 실패, message_logs만 사용합니다.');
        console.log(`   오류: ${error.message}`);
      }

      // 로그인 필드 찾기
      const emailInput = await page.locator('input[type="email"], input[name="email"], input[name="username"], input[type="text"]').first();
      const passwordInput = await page.locator('input[type="password"]').first();
      const loginButton = await page.locator('button[type="submit"], button:has-text("로그인"), button:has-text("Login")').first();

      if (await emailInput.isVisible({ timeout: 5000 })) {
        await emailInput.fill(SOLAPI_USERNAME);
        await passwordInput.fill(SOLAPI_PASSWORD);
        await page.waitForTimeout(1000);
        await loginButton.click();
        await page.waitForTimeout(5000);
        console.log('✅ Solapi 로그인 완료');

        // 메시지 로그 페이지로 이동
        try {
          await page.goto(`${SOLAPI_URL}/message-log`, { waitUntil: 'domcontentloaded', timeout: 60000 });
          await page.waitForTimeout(5000); // 페이지 로딩 대기
        } catch (error) {
          console.log(`   ⚠️  페이지 로딩 타임아웃, 계속 진행: ${error.message}`);
        }

        // 그룹 ID로 검색
        const groupId = result.dbData.solapiGroupId;
        console.log(`   🔍 그룹 ID로 검색: ${groupId}`);
        
        // 검색 입력 필드 찾기
        const searchInput = await page.locator('input[type="search"], input[placeholder*="검색"], input[placeholder*="Search"], input[type="text"]').first();
        if (await searchInput.isVisible({ timeout: 10000 })) {
          await searchInput.fill(groupId);
          await page.waitForTimeout(1000);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(5000); // 검색 결과 로딩 대기
          console.log(`   ✅ 그룹 ID 검색 완료`);
        } else {
          console.log('   ⚠️  검색 입력 필드를 찾을 수 없습니다.');
        }

        // 발송된 번호 추출 (메시지 목록 테이블에서)
        console.log('   📋 메시지 목록 테이블에서 수신번호 추출 중...');
        
        // 모달이 자동으로 열렸는지 확인
        let modalOpened = false;
        const modalTitle = await page.locator('text=메시지 그룹 자세히, text=Message Group Details, [role="dialog"]').first();
        if (await modalTitle.isVisible({ timeout: 5000 })) {
          console.log('   ✅ 모달이 자동으로 열렸습니다.');
          modalOpened = true;
        } else {
          console.log('   ⚠️  모달이 자동으로 열리지 않았습니다. 그룹 행을 클릭합니다.');
          
          // 검색 결과에서 해당 그룹 ID가 포함된 행 찾기
          const groupRow = await page.locator(`text=${groupId}`).first();
          if (await groupRow.isVisible({ timeout: 5000 })) {
            await groupRow.click();
            await page.waitForTimeout(3000);
            console.log('   ✅ 그룹 행 클릭 완료');
            
            // 모달이 열렸는지 다시 확인
            if (await modalTitle.isVisible({ timeout: 5000 })) {
              modalOpened = true;
              console.log('   ✅ 모달이 열렸습니다.');
            }
          } else {
            console.log('   ⚠️  그룹 행을 찾을 수 없습니다.');
          }
        }
        
        // 모달이 열려있으면 메시지 목록 탭으로 이동
        if (modalOpened) {
          // 메시지 목록 탭으로 이동
          const messageListTab = await page.locator('button:has-text("메시지 목록"), button:has-text("Message List"), [role="tab"]:has-text("메시지 목록"), [role="tab"]:has-text("Message List")').first();
          if (await messageListTab.isVisible({ timeout: 5000 })) {
            await messageListTab.click();
            await page.waitForTimeout(3000); // 테이블 로딩 대기
            console.log('   ✅ 메시지 목록 탭으로 이동');
          } else {
            console.log('   ⚠️  메시지 목록 탭을 찾을 수 없습니다.');
          }
        }
        
        // 테이블에서 수신번호 컬럼 찾기 (여러 방법 시도)
        let extractedCount = 0;
        
        // 방법 1: 모달 내부의 테이블에서 수신번호 추출
        const modalTable = await page.locator('[role="dialog"] table, .modal table, [class*="modal"] table').first();
        if (await modalTable.isVisible({ timeout: 3000 })) {
          console.log('   ✅ 모달 내부 테이블 발견');
          
          // 수신번호 컬럼 찾기 (4번째 컬럼 또는 "수신번호" 헤더가 있는 컬럼)
          const recipientCells = await modalTable.locator('td:nth-child(4), td:has-text("010"), td:has-text("011"), td:has-text("016"), td:has-text("017"), td:has-text("018"), td:has-text("019")').all();
          console.log(`   📊 발견된 수신번호 셀 수: ${recipientCells.length}개`);
          
          for (const cell of recipientCells) {
            const cellText = await cell.textContent();
            if (cellText) {
              // 전화번호 패턴 찾기 (010, 011, 016, 017, 018, 019로 시작)
              const phoneMatches = cellText.match(/(010|011|016|017|018|019)[-\s]?\d{3,4}[-\s]?\d{4}/g);
              if (phoneMatches) {
                phoneMatches.forEach(phone => {
                  const normalized = phone.replace(/[-\s]/g, '');
                  if (normalized.length >= 10 && normalized.length <= 11) {
                    sentNumbers.add(normalized);
                    extractedCount++;
                  }
                });
              }
            }
          }
        }
        
        // 방법 2: 테이블 행 전체에서 추출 (방법 1이 실패한 경우)
        if (extractedCount === 0) {
          console.log('   ⚠️  방법 1 실패, 테이블 행 전체에서 추출 시도...');
          const tableRows = await page.locator('[role="dialog"] tbody tr, .modal tbody tr, table tbody tr, [role="row"]').all();
          console.log(`   📊 발견된 테이블 행 수: ${tableRows.length}개`);
          
          for (const row of tableRows) {
            const rowText = await row.textContent();
            if (rowText) {
              // 전화번호 패턴 찾기
              const phoneMatches = rowText.match(/(010|011|016|017|018|019)[-\s]?\d{3,4}[-\s]?\d{4}/g);
              if (phoneMatches) {
                phoneMatches.forEach(phone => {
                  const normalized = phone.replace(/[-\s]/g, '');
                  if (normalized.length >= 10 && normalized.length <= 11) {
                    sentNumbers.add(normalized);
                    extractedCount++;
                  }
                });
              }
            }
          }
        }
        
        // 방법 3: 페이지 전체에서 전화번호 추출 (최후의 수단, 모달이 열려있을 때만)
        if (extractedCount === 0 && modalOpened) {
          console.log('   ⚠️  방법 2 실패, 모달 내부에서 추출 시도...');
          const modalContent = await page.locator('[role="dialog"], .modal, [class*="modal"]').first();
          if (await modalContent.isVisible({ timeout: 3000 })) {
            const modalText = await modalContent.textContent();
            if (modalText) {
              const phoneMatches = modalText.match(/(010|011|016|017|018|019)[-\s]?\d{3,4}[-\s]?\d{4}/g);
              if (phoneMatches) {
                phoneMatches.forEach(phone => {
                  const normalized = phone.replace(/[-\s]/g, '');
                  if (normalized.length >= 10 && normalized.length <= 11) {
                    sentNumbers.add(normalized);
                    extractedCount++;
                  }
                });
              }
            }
          }
        }
        
        console.log(`✅ Solapi에서 발송된 번호 추출: ${sentNumbers.size}개 (${extractedCount}개 항목에서 추출)`);
        
        // 추출된 번호가 원본 수신자와 일치하는지 확인 (디버깅용)
        if (sentNumbers.size > 0 && allRecipients && allRecipients.length > 0) {
          const allRecipientsNormalized = allRecipients.map(num => num.replace(/[-\s]/g, ''));
          const matchedCount = allRecipientsNormalized.filter(num => sentNumbers.has(num)).length;
          console.log(`   📊 원본 수신자 ${allRecipients.length}명 중 ${matchedCount}명이 추출된 번호와 일치합니다.`);
          
          if (matchedCount === 0 && sentNumbers.size > allRecipients.length) {
            console.log('   ⚠️  다른 그룹의 번호가 포함되었을 수 있습니다. 그룹 ID를 확인하세요.');
          }
        }
        
        // 페이지네이션 확인 (다음 페이지가 있으면 계속 추출)
        const nextPageButton = await page.locator('button:has-text(">"), button[aria-label*="다음"], [aria-label*="next"], button[aria-label*="Next"]').first();
        if (await nextPageButton.isVisible({ timeout: 2000 }) && !await nextPageButton.isDisabled()) {
          console.log('   ⚠️  다음 페이지가 있습니다. 현재는 첫 페이지만 추출합니다.');
        }
      } else {
        // 이미 로그인되어 있는지 확인
        const currentUrl = page.url();
        if (!currentUrl.includes('/login')) {
          console.log('✅ 이미 로그인되어 있음');
          
          // 메시지 로그 페이지로 이동
          await page.goto(`${SOLAPI_URL}/message-log`, { waitUntil: 'networkidle' });
          await page.waitForTimeout(3000);

          // 그룹 ID로 검색
          const groupId = result.dbData.solapiGroupId;
          const searchInput = await page.locator('input[type="search"], input[placeholder*="검색"], input[placeholder*="Search"]').first();
          if (await searchInput.isVisible({ timeout: 5000 })) {
            await searchInput.fill(groupId);
            await page.waitForTimeout(1000);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(3000);
            console.log(`✅ 그룹 ID로 검색: ${groupId}`);
          }

          // 발송된 번호 추출 (선택적)
          const tableRows = await page.locator('tbody tr, table tr').all();
          for (const row of tableRows) {
            const rowText = await row.textContent();
            const phoneMatches = rowText.match(/010[-\s]?\d{4}[-\s]?\d{4}/g);
            if (phoneMatches) {
              phoneMatches.forEach(phone => {
                const normalized = phone.replace(/[-\s]/g, '');
                if (normalized.length === 11) {
                  sentNumbers.add(normalized);
                }
              });
            }
          }
          console.log(`✅ Solapi에서 발송된 번호 추출: ${sentNumbers.size}개`);
        } else {
          console.log('⚠️  로그인 필드를 찾을 수 없습니다. Solapi 확인을 건너뜁니다.');
        }
      }
    } else {
      console.log('✅ message_logs 테이블 사용 (Solapi 로그인 불필요)');
    }

    // 4. 미발송 수신자 필터링 (message_logs 우선 사용)
    console.log('\n🔍 5. 미발송 수신자 필터링 중...');
    let remainingRecipients = [];
    
    // message_logs가 있고 remainingRecipients가 있으면 사용
    if (logsCheckData.success && logsCheckData.analysis.remainingRecipients && logsCheckData.analysis.remainingRecipients.length > 0) {
      // message_logs 기반으로 미발송 수신자 사용 (가장 정확)
      remainingRecipients = logsCheckData.analysis.remainingRecipients;
      console.log(`✅ message_logs 기반 미발송 수신자: ${logsCheckData.analysis.remainingCount}명`);
      console.log(`   - 전체 수신자: ${logsCheckData.analysis.totalRecipients}명`);
      console.log(`   - 발송 완료 (logs): ${logsCheckData.analysis.sentPhonesFromLogs}명`);
      console.log(`   - 미발송: ${logsCheckData.analysis.remainingCount}명`);
    } else if (logsCheckData.analysis.sentPhonesFromLogs > 0 && logsCheckData.analysis.totalRecipients > 0) {
      // message_logs에 발송 기록이 있지만 remainingRecipients가 없는 경우 (모두 발송됨)
      console.log(`✅ message_logs 확인: 모든 수신자에게 발송 완료`);
      console.log(`   - 전체 수신자: ${logsCheckData.analysis.totalRecipients}명`);
      console.log(`   - 발송 완료 (logs): ${logsCheckData.analysis.sentPhonesFromLogs}명`);
      remainingRecipients = [];
    } else if (sentNumbers.size > 0) {
      // Solapi에서 추출한 번호 기반으로 필터링
      console.log('⚠️  message_logs 확인 실패, Solapi 데이터 사용');
      const allRecipientsNormalized = allRecipients.map(num => num.replace(/[-\s]/g, ''));
      remainingRecipients = allRecipientsNormalized.filter(num => !sentNumbers.has(num));
      remainingRecipients = remainingRecipients.map(num => {
        if (num.length === 11) {
          return `${num.slice(0, 3)}-${num.slice(3, 7)}-${num.slice(7)}`;
        }
        return num;
      });
      
      console.log(`✅ 미발송 수신자 수: ${remainingRecipients.length}명`);
      console.log(`   - 전체 수신자: ${allRecipients.length}명`);
      console.log(`   - 발송 완료 (Solapi): ${sentNumbers.size}명`);
      console.log(`   - 미발송: ${remainingRecipients.length}명`);
    } else {
      // 둘 다 없으면 전체 수신자 사용 (경고)
      console.log('⚠️  발송된 번호를 확인할 수 없습니다. 전체 수신자를 사용합니다.');
      console.log('   (재발송 시 중복 발송 방지 로직이 자동으로 적용됩니다)');
      remainingRecipients = allRecipients;
    }

    if (remainingRecipients.length === 0) {
      console.log('\n✅ 모든 수신자에게 발송이 완료되었습니다!');
      await browser.close();
      return;
    }

    // 5. 미발송 수신자만 새로운 메시지로 저장
    console.log('\n💾 6. 미발송 수신자만 새로운 메시지로 저장 중...');
    
    // 원본 메시지 정보 가져오기
    const originalMessage = {
      messageType: fullMessageData.post.formData.messageType || 'MMS',
      messageText: fullMessageData.post.formData.content || fullMessageData.post.formData.messageText || '',
      imageUrl: fullMessageData.post.formData.imageUrl || '',
      shortLink: fullMessageData.post.formData.shortLink || ''
    };

    // fetch API를 사용하여 저장
    const saveResponse = await page.evaluate(async ({ url, data }) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      return await response.json();
    }, {
      url: `${LOCAL_URL}/api/channels/sms/save`,
      data: {
        messageType: originalMessage.messageType,
        messageText: originalMessage.messageText,
        imageUrl: originalMessage.imageUrl,
        shortLink: originalMessage.shortLink,
        recipientNumbers: remainingRecipients, // 이미 하이픈 형식으로 변환됨
        status: 'draft'
      }
    });

    const saveData = saveResponse;
    
    if (!saveData.success) {
      throw new Error(saveData.message || '메시지 저장 실패');
    }

    console.log('✅ 미발송 수신자만 저장 완료!');
    console.log(`   - 새 메시지 ID: ${saveData.channelPostId}`);
    console.log(`   - 수신자 수: ${remainingRecipients.length}명`);
    console.log(`\n💡 다음 단계:`);
    console.log(`   1. SMS 편집 페이지에서 새 메시지 열기: /admin/sms?id=${saveData.channelPostId}`);
    console.log(`   2. 내용 확인 후 발송`);

    // 6. 스크린샷 저장
    console.log('\n📸 7. 스크린샷 저장 중...');
    await page.screenshot({
      path: 'playwright-solapi-check-result.png',
      fullPage: true
    });
    console.log('✅ 스크린샷 저장: playwright-solapi-check-result.png');

    console.log('\n' + '='.repeat(60));
    console.log('✅ 작업 완료!');
    console.log('='.repeat(60));
    console.log(`📋 원본 메시지 ID: ${MESSAGE_ID}`);
    console.log(`📋 새 메시지 ID: ${saveData.channelPostId}`);
    console.log(`📊 발송 완료: ${logsCheckData.analysis?.sentPhonesFromLogs || sentNumbers.size}명`);
    console.log(`📊 미발송: ${remainingRecipients.length}명`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
    await page.screenshot({
      path: 'playwright-solapi-check-error.png',
      fullPage: true
    });
    console.error('   스크린샷 저장: playwright-solapi-check-error.png');
    throw error;
  } finally {
    await browser.close();
  }
}

checkSolapiAndSaveRemaining().catch(error => {
  console.error('❌ 스크립트 실행 실패:', error);
  process.exit(1);
});

