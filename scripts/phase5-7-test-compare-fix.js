/**
 * Phase 5-7: 이미지 비교 기능 테스트 및 수정 검증
 * 
 * 문제:
 * 1. 비교 시 전혀 다른 이미지가 비교가 안 되는 문제
 * 2. 사용 위치가 1회 사용인데 하단에는 "+3개 더"로 표시되는 불일치
 */

const { chromium } = require('playwright');
const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });

const ADMIN_LOGIN = process.env.ADMIN_LOGIN || '010-6669-9000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '66699000';

async function testImageCompare() {
  console.log('🚀 이미지 비교 기능 테스트 시작...\n');

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. 로그인
    console.log('1️⃣ 로그인 중...');
    await page.goto('http://localhost:3000/admin/gallery', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // 로그인 페이지로 리다이렉트되었는지 확인
    if (page.url().includes('/admin/login')) {
      console.log('   로그인 페이지로 리다이렉트됨, 로그인 진행...');
      
      // 로그인 입력 필드 찾기
      const loginInput = await page.waitForSelector('input[name="login"], input#login', { timeout: 10000 });
      const passwordInput = await page.waitForSelector('input[name="password"], input#password', { timeout: 10000 });
      
      await loginInput.fill(ADMIN_LOGIN);
      await passwordInput.fill(ADMIN_PASSWORD);
      
      // 로그인 버튼 클릭
      const loginButton = await page.waitForSelector('button[type="submit"]', { timeout: 5000 });
      await loginButton.click();
      
      // 로그인 후 리다이렉트 대기
      await page.waitForTimeout(2000);
      
      // /admin 또는 /admin/gallery로 이동
      if (!page.url().includes('/admin/gallery')) {
        await page.goto('http://localhost:3000/admin/gallery', {
          waitUntil: 'domcontentloaded',
          timeout: 30000
        });
      }
      console.log('   ✅ 로그인 완료');
    } else {
      console.log('   이미 로그인되어 있음');
    }

    await page.waitForTimeout(3000);

    // 2. 이미지 로드 대기
    console.log('\n2️⃣ 이미지 로드 대기...');
    await page.waitForSelector('img[src*="supabase"], img[src*="storage"]', { timeout: 10000 });
    await page.waitForTimeout(2000);
    console.log('   ✅ 이미지 로드 완료');

    // 3. 이미지 카드 찾기
    console.log('\n3️⃣ 이미지 카드 찾기...');
    const imageCards = await page.$$('div.group:has(img), div[class*="card"]:has(img)');
    console.log(`   발견된 이미지 카드: ${imageCards.length}개`);

    if (imageCards.length < 2) {
      console.log('   ⚠️ 비교할 이미지가 2개 미만입니다. 스크롤하여 더 많은 이미지 로드...');
      
      // 스크롤하여 더 많은 이미지 로드
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1000);
      }
      
      const moreCards = await page.$$('div.group:has(img), div[class*="card"]:has(img)');
      console.log(`   스크롤 후 이미지 카드: ${moreCards.length}개`);
    }

    // 4. 사용 위치 정보 확인
    console.log('\n4️⃣ 사용 위치 정보 확인...');
    const usageInfo = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div.group:has(img), div[class*="card"]:has(img)'));
      return cards.slice(0, 5).map((card, idx) => {
        const usageCountText = card.textContent.match(/(\d+)회 사용/);
        const usageCount = usageCountText ? parseInt(usageCountText[1]) : 0;
        
        const usedInSection = card.querySelector('div:has-text("사용 위치:")');
        const usedInItems = usedInSection ? usedInSection.querySelectorAll('div:has(span)') : [];
        const usedInCount = usedInItems.length;
        
        const moreText = card.textContent.match(/\+(\d+)개 더/);
        const moreCount = moreText ? parseInt(moreText[1]) : 0;
        
        return {
          index: idx,
          usageCount,
          usedInCount,
          moreCount,
          totalUsedIn: usedInCount + moreCount,
          mismatch: usageCount !== (usedInCount + moreCount) && usageCount > 0
        };
      });
    });

    console.log('   사용 위치 정보:');
    usageInfo.forEach((info, idx) => {
      console.log(`   이미지 ${idx + 1}:`);
      console.log(`     - 사용 횟수: ${info.usageCount}회`);
      console.log(`     - 표시된 위치: ${info.usedInCount}개`);
      console.log(`     - 더 보기: +${info.moreCount}개`);
      console.log(`     - 총 위치: ${info.totalUsedIn}개`);
      if (info.mismatch) {
        console.log(`     ⚠️ 불일치: 사용 횟수(${info.usageCount})와 위치 수(${info.totalUsedIn})가 다릅니다!`);
      }
    });

    // 5. 비교 기능 테스트
    console.log('\n5️⃣ 비교 기능 테스트...');
    
    // 비교용 체크박스 찾기
    const compareCheckboxes = await page.$$('input[type="checkbox"].compare-checkbox, input[type="checkbox"][title*="비교"]');
    console.log(`   발견된 비교 체크박스: ${compareCheckboxes.length}개`);

    if (compareCheckboxes.length < 2) {
      console.log('   ⚠️ 비교 체크박스를 찾을 수 없습니다. 이미지 카드에 마우스 호버 필요할 수 있습니다.');
      
      // 이미지 카드에 호버하여 체크박스 표시
      const firstCard = imageCards[0];
      if (firstCard) {
        await firstCard.hover();
        await page.waitForTimeout(500);
      }
    }

    // 첫 번째 이미지 선택
    const firstCheckbox = await page.$('input[type="checkbox"].compare-checkbox, input[type="checkbox"][title*="비교"]');
    if (firstCheckbox) {
      await firstCheckbox.click();
      await page.waitForTimeout(500);
      console.log('   ✅ 첫 번째 이미지 선택');
    } else {
      console.log('   ⚠️ 첫 번째 체크박스를 찾을 수 없습니다.');
    }

    // 두 번째 이미지 선택
    const secondCard = imageCards[1];
    if (secondCard) {
      await secondCard.hover();
      await page.waitForTimeout(500);
      
      const secondCheckbox = await page.$('input[type="checkbox"].compare-checkbox:not(:checked), input[type="checkbox"][title*="비교"]:not(:checked)');
      if (secondCheckbox) {
        await secondCheckbox.click();
        await page.waitForTimeout(500);
        console.log('   ✅ 두 번째 이미지 선택');
      } else {
        console.log('   ⚠️ 두 번째 체크박스를 찾을 수 없습니다.');
      }
    }

    // 비교 버튼 찾기 및 클릭
    const compareButton = await page.$('button:has-text("비교"), button[title*="비교"]');
    if (compareButton) {
      const buttonText = await compareButton.textContent();
      console.log(`   비교 버튼 발견: "${buttonText}"`);
      
      await compareButton.click();
      await page.waitForTimeout(2000);
      console.log('   ✅ 비교 버튼 클릭');
    } else {
      console.log('   ⚠️ 비교 버튼을 찾을 수 없습니다.');
    }

    // 6. 비교 모달 확인
    console.log('\n6️⃣ 비교 모달 확인...');
    const compareModal = await page.$('div:has-text("이미지 비교 결과"), h2:has-text("이미지 비교 결과")');
    
    if (compareModal) {
      console.log('   ✅ 비교 모달 표시됨');
      
      // 모달 내용 확인
      const modalContent = await page.evaluate(() => {
        const modal = document.querySelector('div:has-text("이미지 비교 결과")');
        if (!modal) return null;
        
        return {
          title: modal.querySelector('h2')?.textContent || '',
          similarityScore: modal.textContent.match(/유사도[:\s]*(\d+)%/)?.[1] || '',
          hasImages: modal.querySelectorAll('img').length,
          hasUsageComparison: modal.textContent.includes('사용 위치 비교'),
          errorMessage: modal.textContent.includes('오류') || modal.textContent.includes('실패')
        };
      });
      
      console.log('   모달 내용:');
      console.log(`     - 제목: ${modalContent?.title || 'N/A'}`);
      console.log(`     - 유사도 점수: ${modalContent?.similarityScore || 'N/A'}%`);
      console.log(`     - 이미지 수: ${modalContent?.hasImages || 0}개`);
      console.log(`     - 사용 위치 비교: ${modalContent?.hasUsageComparison ? '있음' : '없음'}`);
      console.log(`     - 오류 메시지: ${modalContent?.errorMessage ? '있음' : '없음'}`);
      
      if (modalContent?.errorMessage) {
        console.log('   ⚠️ 비교 모달에 오류가 있습니다!');
      }
    } else {
      console.log('   ⚠️ 비교 모달이 표시되지 않았습니다.');
      
      // 오류 메시지 확인
      const errorAlert = await page.$('div:has-text("오류"), div:has-text("실패")');
      if (errorAlert) {
        const errorText = await errorAlert.textContent();
        console.log(`   오류 메시지: ${errorText}`);
      }
    }

    console.log('\n✅ 테스트 완료!');
    console.log('\n📊 결과 요약:');
    console.log(`   - 이미지 카드: ${imageCards.length}개`);
    console.log(`   - 사용 위치 불일치: ${usageInfo.filter(i => i.mismatch).length}개`);
    console.log(`   - 비교 기능: ${compareModal ? '작동함' : '작동 안 함'}`);

    // 브라우저를 열어둠 (수동 확인용)
    console.log('\n⏸️ 브라우저를 10초간 열어둡니다...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

// 실행
testImageCompare().catch(console.error);







