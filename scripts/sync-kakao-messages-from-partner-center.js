/**
 * 카카오 파트너센터 메시지 일괄 동기화 스크립트
 * 
 * 카카오 비즈니스 파트너센터에서 메시지 목록을 가져와서
 * channel_kakao 테이블에 일괄 동기화합니다.
 * 
 * 사용법:
 *   node scripts/sync-kakao-messages-from-partner-center.js
 * 
 * 환경 변수:
 *   KAKAO_EMAIL: 카카오 계정 이메일 (기본값: taksoo.kim@gmail.com)
 *   KAKAO_PASSWORD: 카카오 계정 비밀번호
 *   BASE_URL: API 서버 URL (기본값: http://localhost:3000)
 */

require('dotenv').config({ path: '.env.local' });
const { chromium } = require('playwright');

const KAKAO_EMAIL = process.env.KAKAO_EMAIL || 'taksoo.kim@gmail.com';
const KAKAO_PASSWORD = process.env.KAKAO_PASSWORD || '';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

async function syncKakaoMessages() {
  console.log('🚀 카카오 파트너센터 메시지 일괄 동기화 시작...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    channel: 'chrome-beta'
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();

  try {
    // 1. 카카오 파트너센터 로그인
    console.log('1️⃣ 카카오 파트너센터 로그인 중...');
    await page.goto('https://accounts.kakao.com/login?continue=https%3A%2F%2Fbusiness.kakao.com', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.waitForTimeout(3000);

    // 이메일 입력 필드 찾기 (다양한 선택자 시도)
    console.log('   이메일 입력 필드 찾는 중...');
    let emailInput = null;
    const emailSelectors = [
      'input[name="email"]',
      'input[type="email"]',
      'input[id*="email"]',
      'input[id*="loginId"]',
      'input[placeholder*="이메일"]',
      'input[placeholder*="카카오계정"]',
      'input.login--input'
    ];

    for (const selector of emailSelectors) {
      try {
        const element = page.locator(selector).first();
        const isVisible = await element.isVisible({ timeout: 2000 }).catch(() => false);
        if (isVisible) {
          emailInput = element;
          console.log(`   ✅ 이메일 필드 발견: ${selector}`);
          break;
        }
      } catch (e) {
        // 다음 선택자 시도
      }
    }

    if (!emailInput) {
      // 스크린샷 저장
      await page.screenshot({ path: 'kakao-login-page.png', fullPage: true });
      console.log('   ⚠️ 이메일 입력 필드를 찾을 수 없습니다. 스크린샷 저장: kakao-login-page.png');
      console.log('   💡 브라우저에서 수동으로 로그인을 완료해주세요.');
      console.log('   💡 로그인 후 메시지 목록 페이지로 이동하면 자동으로 진행됩니다.');
      
      // 수동 로그인 대기
      console.log('   ⏳ 수동 로그인 대기 중... (최대 5분)');
      const maxWaitTime = 5 * 60 * 1000;
      const checkInterval = 2 * 1000;
      let waitedTime = 0;

      while (waitedTime < maxWaitTime) {
        const currentUrl = page.url();
        if (currentUrl.includes('business.kakao.com') && !currentUrl.includes('login')) {
          console.log('   ✅ 로그인 완료!\n');
          break;
        }
        await page.waitForTimeout(checkInterval);
        waitedTime += checkInterval;
        if (waitedTime % 10000 === 0) {
          console.log(`   대기 중... (${Math.floor(waitedTime / 1000)}초 경과)`);
        }
      }
    } else {
      // 자동 로그인 시도
      await emailInput.fill(KAKAO_EMAIL);
      await page.waitForTimeout(500);

      // 비밀번호 입력
      const passwordSelectors = [
        'input[name="password"]',
        'input[type="password"]',
        'input[id*="password"]',
        'input[placeholder*="비밀번호"]'
      ];

      let passwordInput = null;
      for (const selector of passwordSelectors) {
        try {
          const element = page.locator(selector).first();
          const isVisible = await element.isVisible({ timeout: 2000 }).catch(() => false);
          if (isVisible) {
            passwordInput = element;
            break;
          }
        } catch (e) {
          // 다음 선택자 시도
        }
      }

      if (passwordInput) {
        await passwordInput.fill(KAKAO_PASSWORD);
        await page.waitForTimeout(500);

        // 로그인 버튼 클릭
        const loginButtonSelectors = [
          'button[type="submit"]',
          'button:has-text("로그인")',
          'button.login--button',
          'a.login--button'
        ];

        for (const selector of loginButtonSelectors) {
          try {
            const button = page.locator(selector).first();
            const isVisible = await button.isVisible({ timeout: 2000 }).catch(() => false);
            if (isVisible) {
              await button.click();
              await page.waitForTimeout(3000);
              break;
            }
          } catch (e) {
            // 다음 선택자 시도
          }
        }
      }
    }

    // 2단계 인증 대기
    console.log('   💡 2단계 인증 대기 중... (최대 5분)');
    console.log('      브라우저에서 수동으로 2단계 인증을 완료해주세요.');
    
    const maxWaitTime = 5 * 60 * 1000;
    const checkInterval = 2 * 1000;
    let waitedTime = 0;

    while (waitedTime < maxWaitTime) {
      const currentUrl = page.url();
      if (currentUrl.includes('business.kakao.com') && !currentUrl.includes('login')) {
        console.log('   ✅ 로그인 완료!\n');
        break;
      }
      await page.waitForTimeout(checkInterval);
      waitedTime += checkInterval;
      if (waitedTime % 10000 === 0) {
        console.log(`   대기 중... (${Math.floor(waitedTime / 1000)}초 경과)`);
      }
    }

    // 2. 메시지 목록 페이지로 이동
    console.log('2️⃣ 메시지 목록 페이지로 이동...');
    await page.goto('https://business.kakao.com/_vSVuV/messages?t_src=business_partnercenter&t_ch=Inb&t_obj=내메시지_클릭', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await page.waitForTimeout(3000);
    console.log('   ✅ 페이지 로드 완료\n');

    // 3. 메시지 목록 추출
    console.log('3️⃣ 메시지 목록 추출 중...');
    const messages = [];

    // 페이지네이션 처리
    let currentPage = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      console.log(`   📄 ${currentPage}페이지 처리 중...`);

      // 테이블에서 메시지 정보 추출
      await page.waitForSelector('table tbody tr', { timeout: 10000 }).catch(() => {
        console.log('   ⚠️ 테이블을 찾을 수 없습니다. 페이지 구조를 확인합니다.');
      });
      await page.waitForTimeout(1000); // 테이블 로딩 대기

      const rows = await page.locator('table tbody tr').all();
      console.log(`   발견된 행: ${rows.length}개`);

      // 병렬 처리로 속도 개선
      const rowPromises = rows.map(async (row, i) => {
        try {
          // 메시지 ID 추출 (다양한 방법 시도)
          let messageId = null;
          
          // 방법 1: 링크에서 추출
          const links = await row.locator('a').all();
          for (const link of links) {
            const href = await link.getAttribute('href').catch(() => null);
            if (href) {
              // 다양한 패턴 시도
              const patterns = [
                /messages\/(\d+)/,
                /messageId[=:](\d+)/,
                /id[=:](\d+)/,
                /\/(\d+)(?:\?|$)/,
                /(\d{6,})/ // 6자리 이상 숫자
              ];
              
              for (const pattern of patterns) {
                const match = href.match(pattern);
                if (match && match[1]) {
                  messageId = match[1];
                  break;
                }
              }
              
              if (messageId) break;
            }
          }
          
          // 방법 2: 행의 데이터 속성에서 추출
          if (!messageId) {
            const rowElement = await row.elementHandle();
            if (rowElement) {
              const dataId = await rowElement.getAttribute('data-id').catch(() => null);
              const dataMessageId = await rowElement.getAttribute('data-message-id').catch(() => null);
              messageId = dataId || dataMessageId;
            }
          }
          
          // 방법 3: 두 번째 셀에서 "ID:숫자" 패턴 추출
          if (!messageId) {
            const secondCell = await row.locator('td').nth(1).textContent().catch(() => '');
            const idMatch = secondCell.match(/ID[:\s]*(\d+)/i);
            if (idMatch && idMatch[1]) {
              messageId = idMatch[1];
            }
          }
          
          // 방법 4: 첫 번째 셀에서 숫자 추출
          if (!messageId) {
            const firstCell = await row.locator('td').first().textContent().catch(() => '');
            const numberMatch = firstCell.match(/(\d{6,})/);
            if (numberMatch) {
              messageId = numberMatch[1];
            }
          }

          if (!messageId) {
            // 빈 행 체크 (메시지가 없습니다)
            const rowText = await row.textContent().catch(() => '');
            if (rowText.includes('메시지가 없습니다')) {
              return null; // 빈 행은 스킵
            }
            console.log(`   ⚠️ 행 ${i}: 메시지 ID를 찾을 수 없습니다.`);
            return null; // 메시지 ID가 없으면 스킵
          }

          // 모든 셀을 한 번에 가져오기
          const cells = await row.locator('td').all();
          const cellTexts = await Promise.all(
            cells.map(cell => cell.textContent().catch(() => ''))
          );

          // 메시지 유형 추출
          const messageTypeText = cellTexts[1] || '';
          const messageType = messageTypeText.includes('알림톡') ? 'ALIMTALK' : 'FRIENDTALK';
          
          // 내용 추출
          const content = (cellTexts[2] || '').trim();
          
          // 발송수 추출
          const sentCountText = cellTexts[4] || '0';
          const sentCount = parseInt(sentCountText.replace(/[^0-9]/g, '')) || 0;
          
          // 상태 추출
          const statusText = cellTexts[6] || '';
          let status = 'draft';
          if (statusText.includes('발송완료') || statusText.includes('발송중')) {
            status = 'sent';
          } else if (statusText.includes('임시저장')) {
            status = 'draft';
          } else if (statusText.includes('예약')) {
            status = 'scheduled';
          }

          return {
            kakaoMessageId: messageId,
            messageType,
            content: content.substring(0, 500), // 최대 500자
            status,
            sentCount,
            sentDateText: cellTexts[3] || '',
            dateText: cellTexts[0] || ''
          };
        } catch (error) {
          console.error(`   ⚠️ 행 ${i} 처리 중 오류:`, error.message);
          return null;
        }
      });

      const rowResults = await Promise.all(rowPromises);
      const validMessages = rowResults.filter(msg => msg !== null);
      messages.push(...validMessages);

      console.log(`   ✅ ${currentPage}페이지 완료: ${rows.length}개 메시지 발견\n`);

      // 다음 페이지 확인
      const nextButton = page.locator('a:has-text(">")').or(
        page.locator('button:has-text("다음")')
      ).or(
        page.locator('a.paging_next').or(page.locator('a[aria-label*="다음"]'))
      ).first();
      
      const isNextDisabled = await nextButton.getAttribute('disabled').catch(() => null);
      const nextButtonVisible = await nextButton.isVisible().catch(() => false);
      const nextButtonClass = await nextButton.getAttribute('class').catch(() => '');
      
      // 다음 페이지가 비활성화되어 있거나, disabled 클래스가 있으면 중단
      if (!nextButtonVisible || isNextDisabled !== null || nextButtonClass.includes('disabled') || currentPage >= 20) {
        console.log(`   📄 마지막 페이지 도달 (${currentPage}페이지)`);
        hasNextPage = false;
      } else {
        // 다음 페이지 클릭
        console.log(`   ➡️ ${currentPage + 1}페이지로 이동 중...`);
        await nextButton.click();
        await page.waitForTimeout(3000); // 페이지 로딩 대기
        currentPage++;
      }
    }

    console.log(`\n📊 총 ${messages.length}개의 메시지 발견\n`);

    if (messages.length === 0) {
      console.log('⚠️ 동기화할 메시지가 없습니다.');
      await browser.close();
      return;
    }

    // 4. 각 메시지를 API로 동기화 (배치 처리로 속도 개선)
    console.log('4️⃣ 메시지 동기화 중...\n');
    console.log(`   총 ${messages.length}개 메시지를 ${Math.ceil(messages.length / 10)}개 배치로 처리합니다.\n`);
    let successCount = 0;
    let failCount = 0;

    // 배치 크기 설정 (한 번에 처리할 메시지 수)
    const batchSize = 10;
    const totalBatches = Math.ceil(messages.length / batchSize);
    
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      const currentBatch = Math.floor(i / batchSize) + 1;
      console.log(`[배치 ${currentBatch}/${totalBatches}] ${i + 1}-${Math.min(i + batchSize, messages.length)}/${messages.length} 동기화 중...`);

      // 배치 병렬 처리
      const batchPromises = batch.map(async (msg, batchIndex) => {
        try {
          const response = await fetch(`${BASE_URL}/api/kakao/manual-sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              kakaoMessageId: msg.kakaoMessageId,
              title: null, // 기본 텍스트형은 제목 없음
              content: msg.content || '카카오 파트너센터에서 등록된 메시지',
              messageType: msg.messageType,
              status: msg.status,
              sentCount: msg.sentCount,
              successCount: msg.sentCount, // 정확한 값은 상세 페이지에서 확인 필요
              failCount: 0
            })
          });

          const data = await response.json();

          if (data.success) {
            return { success: true, messageId: msg.kakaoMessageId };
          } else {
            return { success: false, messageId: msg.kakaoMessageId, error: data.message };
          }
        } catch (error) {
          return { success: false, messageId: msg.kakaoMessageId, error: error.message };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(result => {
        if (result.success) {
          successCount++;
          process.stdout.write(`   ✅ ${result.messageId} `);
        } else {
          failCount++;
          process.stdout.write(`   ❌ ${result.messageId} `);
        }
      });
      console.log(''); // 줄바꿈

      // 진행률 표시
      const progress = Math.round(((i + batchSize) / messages.length) * 100);
      console.log(`   📊 진행률: ${Math.min(progress, 100)}% (성공: ${successCount}, 실패: ${failCount})\n`);

      // 배치 간 딜레이 (API 부하 방지)
      if (i + batchSize < messages.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📋 동기화 완료');
    console.log('='.repeat(80));
    console.log(`✅ 성공: ${successCount}개`);
    console.log(`❌ 실패: ${failCount}개`);
    console.log(`📊 총계: ${messages.length}개`);
    console.log('='.repeat(80) + '\n');

    // 5초 후 브라우저 닫기
    console.log('⏳ 5초 후 브라우저를 자동으로 닫습니다...\n');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('\n❌ 스크립트 실행 중 오류:', error.message);
    console.error('스택:', error.stack);
  } finally {
    await browser.close();
  }
}

// 실행
syncKakaoMessages()
  .then(() => {
    console.log('\n✅ 스크립트 완료\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 스크립트 실패:', error);
    process.exit(1);
  });

