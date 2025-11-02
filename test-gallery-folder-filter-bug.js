const { chromium } = require('playwright');
require('dotenv').config({ path: '.env.local' });

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // 각 동작 사이 1초 딜레이로 문제 확인
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 콘솔 로그 캡처 (중요!)
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    // 폴더 필터링 관련 로그만 출력
    if (text.includes('폴더') || text.includes('필터') || text.includes('불일치') || text.includes('이미지 수') || type === 'error') {
      console.log(`[${type.toUpperCase()}] ${text}`);
    }
  });
  
  // 네트워크 요청 캡처
  page.on('response', async response => {
    if (response.url().includes('/api/admin/all-images')) {
      const url = new URL(response.url());
      const prefix = url.searchParams.get('prefix');
      const includeChildren = url.searchParams.get('includeChildren');
      console.log(`[API 호출] prefix="${prefix}", includeChildren=${includeChildren}`);
      
      try {
        const data = await response.json();
        console.log(`[API 응답] 이미지 ${data.images?.length || 0}개, 총 ${data.total || 0}개`);
        
        // 첫 번째 이미지의 folder_path 확인
        if (data.images && data.images.length > 0) {
          const firstImage = data.images[0];
          console.log(`[첫 이미지] folder_path="${firstImage.folder_path}"`);
        }
      } catch (e) {
        // JSON 파싱 실패 무시
      }
    }
  });
  
  try {
    console.log('🔐 로그인...');
    await page.goto('https://www.masgolf.co.kr/admin/login');
    await page.waitForTimeout(2000);
    
    // 로그인 정보
    const phoneNumber = '01066699000'; // 010-6669-9000에서 하이픈 제거
    const password = '66699000';
    
    console.log(`   전화번호: ${phoneNumber}`);
    console.log(`   패스워드: ${password}`);
    
    // 전화번호 입력 필드 찾기 (여러 선택자 시도)
    let phoneInput = page.locator('input[type="tel"]').first();
    if (await phoneInput.count() === 0) {
      phoneInput = page.locator('input[name="phone"]').first();
    }
    if (await phoneInput.count() === 0) {
      phoneInput = page.locator('input[placeholder*="전화번호"], input[placeholder*="010"]').first();
    }
    if (await phoneInput.count() === 0) {
      phoneInput = page.locator('input').first(); // 첫 번째 input 필드
    }
    
    if (await phoneInput.count() > 0) {
      await phoneInput.clear();
      await phoneInput.fill(phoneNumber);
      console.log('   ✓ 전화번호 입력 완료');
      await page.waitForTimeout(1000);
    } else {
      console.log('   ❌ 전화번호 입력 필드를 찾을 수 없습니다');
    }
    
    // 패스워드 입력 필드 찾기
    let passwordInput = page.locator('input[type="password"]').first();
    if (await passwordInput.count() === 0) {
      passwordInput = page.locator('input[name="password"]').first();
    }
    if (await passwordInput.count() === 0) {
      passwordInput = page.locator('input[placeholder*="패스워드"], input[placeholder*="비밀번호"]').first();
    }
    
    if (await passwordInput.count() > 0) {
      await passwordInput.clear();
      await passwordInput.fill(password);
      console.log('   ✓ 패스워드 입력 완료');
      await page.waitForTimeout(1000);
    } else {
      console.log('   ⚠️ 패스워드 입력 필드를 찾을 수 없습니다 (패스워드 없는 로그인일 수 있음)');
    }
    
    // 로그인 버튼 클릭
    let loginButton = page.locator('button:has-text("로그인")').first();
    if (await loginButton.count() === 0) {
      loginButton = page.locator('button[type="submit"]').first();
    }
    if (await loginButton.count() === 0) {
      loginButton = page.locator('button').first(); // 첫 번째 버튼
    }
    
    if (await loginButton.count() > 0) {
      await loginButton.click();
      console.log('   ✓ 로그인 버튼 클릭');
      await page.waitForTimeout(3000);
    } else {
      console.log('   ❌ 로그인 버튼을 찾을 수 없습니다');
    }
    
    console.log('\n📁 갤러리 관리 페이지로 이동...');
    await page.goto('https://www.masgolf.co.kr/admin/gallery');
    await page.waitForTimeout(5000); // 초기 로드 대기
    
    console.log('\n📋 테스트 시작: originals/blog/2025-09 폴더 선택\n');
    
    // 1. 현재 상태 확인
    console.log('1️⃣ 현재 상태 확인');
    
    // 이미지 개수 확인
    const imageCountText = await page.locator('text=/\\d+개 표시/').first().textContent().catch(() => null);
    console.log(`   현재 이미지: ${imageCountText || '없음'}`);
    
    // 2. 하위 폴더 포함 체크 확인
    console.log('\n2️⃣ 하위 폴더 포함 체크 확인');
    const includeChildrenCheckbox = page.locator('input[type="checkbox"]').filter({ 
      has: page.locator('xpath=../span[contains(text(), "하위 폴더 포함")]') 
    }).first();
    
    let isChecked = false;
    if (await includeChildrenCheckbox.count() > 0) {
      isChecked = await includeChildrenCheckbox.isChecked();
      console.log(`   하위 폴더 포함: ${isChecked ? '체크됨 ✓' : '체크 안 됨'}`);
    }
    
    // 3. originals/blog/2025-09 폴더 선택
    console.log('\n3️⃣ originals/blog/2025-09 폴더 선택');
    
    // 폴더 선택 드롭다운 찾기
    const folderSelect = page.locator('label:has-text("폴더") + select, label:has-text("폴더") ~ select').first();
    
    if (await folderSelect.count() > 0) {
      const targetFolder = 'originals/blog/2025-09';
      console.log(`   폴더 선택: ${targetFolder}`);
      
      // 선택 전 이미지 개수 확인
      const beforeCount = await page.locator('text=/\\d+개 표시/').first().textContent().catch(() => null);
      console.log(`   선택 전: ${beforeCount || '없음'}`);
      
      // 폴더 선택
      await folderSelect.selectOption(targetFolder);
      console.log('   ⏳ 이미지 로드 대기 중...');
      await page.waitForTimeout(5000); // API 호출 및 필터링 대기
      
      // 선택 후 이미지 개수 확인 (여러 번 확인)
      for (let i = 0; i < 5; i++) {
        await page.waitForTimeout(1000);
        const afterCount = await page.locator('text=/\\d+개 표시/').first().textContent().catch(() => null);
        const imageCards = await page.locator('[class*="image"], img').count();
        console.log(`   [${i+1}초 후] 표시: ${afterCount || '없음'}, 카드: ${imageCards}개`);
      }
      
      // 4. 하위 폴더 포함 체크/해제 테스트
      console.log('\n4️⃣ 하위 폴더 포함 체크/해제 테스트');
      
      if (await includeChildrenCheckbox.count() > 0) {
        // 현재 상태 확인
        const currentChecked = await includeChildrenCheckbox.isChecked();
        console.log(`   현재 상태: ${currentChecked ? '체크됨' : '체크 안 됨'}`);
        
        // 체크/해제 반복 테스트
        for (let test = 0; test < 2; test++) {
          console.log(`\n   [테스트 ${test + 1}] 체크 상태 변경`);
          
          const beforeChecked = await includeChildrenCheckbox.isChecked();
          const beforeCount = await page.locator('text=/\\d+개 표시/').first().textContent().catch(() => null);
          console.log(`   변경 전: 체크=${beforeChecked}, 이미지=${beforeCount || '없음'}`);
          
          // 체크 상태 변경
          if (beforeChecked) {
            await includeChildrenCheckbox.uncheck();
          } else {
            await includeChildrenCheckbox.check();
          }
          
          console.log('   ⏳ 변경 후 대기...');
          await page.waitForTimeout(5000);
          
          // 변경 후 상태 확인
          const afterChecked = await includeChildrenCheckbox.isChecked();
          const afterCount = await page.locator('text=/\\d+개 표시/').first().textContent().catch(() => null);
          const imageCards = await page.locator('[class*="image"], img').count();
          console.log(`   변경 후: 체크=${afterChecked}, 이미지=${afterCount || '없음'}, 카드=${imageCards}개`);
          
          // 문제 발생 시 상세 로그
          if (afterCount && afterCount.includes('0개')) {
            console.log('   ❌ 문제 발견! 이미지가 0개로 표시됨');
            
            // 콘솔에서 폴더 불일치 로그 확인
            const consoleMessages = await page.evaluate(() => {
              const logs = [];
              // 최근 콘솔 로그 수집 (실제로는 브라우저 콘솔 확인 필요)
              return logs;
            });
          }
        }
      }
    } else {
      console.log('❌ 폴더 선택 드롭다운을 찾을 수 없습니다');
    }
    
    console.log('\n✅ 테스트 완료');
    console.log('\n⚠️ 브라우저를 닫지 말고 콘솔 로그를 확인하세요');
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ 테스트 오류:', error);
  } finally {
    // 브라우저를 자동으로 닫지 않음 (확인용)
    // await browser.close();
    console.log('\n📝 브라우저를 수동으로 닫아주세요');
  }
})();

