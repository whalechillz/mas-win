const { chromium } = require('playwright');

(async () => {
  console.log('🔍 secret-force-common 갤러리 선택 기능 테스트 (Chromium)\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  
  const page = await context.newPage();
  
  // 네트워크 요청 모니터링
  const networkLogs = [];
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      networkLogs.push({
        method: request.method(),
        url: request.url(),
        timestamp: new Date().toISOString(),
      });
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      const log = networkLogs.find(l => l.url === response.url() && !l.status);
      if (log) {
        log.status = response.status();
        log.statusText = response.statusText();
      }
    }
  });
  
  // 콘솔 메시지 수집
  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('갤러리') || text.includes('secret-force-common') || text.includes('FolderImagePicker') || text.includes('에러') || text.includes('error')) {
      consoleMessages.push({
        type: msg.type(),
        text: text,
        timestamp: new Date().toISOString(),
      });
    }
  });
  
  try {
    console.log('📋 1단계: 로그인');
    await page.goto('http://localhost:3000/admin/login', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.fill('input[name="login"]', '010-6669-9000');
    await page.fill('input[name="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 10000 });
    console.log('   ✅ 로그인 성공\n');
    
    // 로그인 후 쿠키 확인
    const cookies = await context.cookies();
    const sessionCookies = cookies.filter(c => c.name.includes('session-token'));
    console.log(`📋 세션 쿠키: ${sessionCookies.length}개`);
    if (sessionCookies.length > 0) {
      console.log(`   ✅ 세션 쿠키 설정됨: ${sessionCookies[0].name}\n`);
    } else {
      console.log(`   ⚠️ 세션 쿠키 없음\n`);
    }
    
    console.log('📋 2단계: 제품 합성 관리 페이지 접속');
    await page.goto('http://localhost:3000/admin/product-composition', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    console.log(`   ✅ 현재 URL: ${page.url()}\n`);
    
    await page.waitForTimeout(2000);
    
    console.log('📋 3단계: 제품 수정 모달 열기');
    // 제품 목록에서 첫 번째 제품의 "수정" 버튼 찾기
    const editButtons = await page.locator('button:has-text("수정")').all();
    if (editButtons.length === 0) {
      console.log('   ⚠️ 수정 버튼을 찾을 수 없습니다. 제품이 없을 수 있습니다.');
      console.log('   💡 제품 추가 버튼을 클릭합니다.\n');
      await page.click('button:has-text("추가")');
    } else {
      console.log(`   ✅ 수정 버튼 ${editButtons.length}개 발견`);
      await editButtons[0].click();
      console.log('   ✅ 제품 수정 모달 열림\n');
    }
    
    await page.waitForTimeout(1000);
    
    console.log('📋 4단계: 제품 정보 확인 및 입력');
    // 모달이 열렸는지 확인
    await page.waitForTimeout(1000);
    
    // category select 찾기 (첫 번째 select가 category)
    const categorySelect = page.locator('select').first();
    const categoryCount = await categorySelect.count();
    
    if (categoryCount > 0) {
      const currentCategory = await categorySelect.inputValue();
      console.log(`   📝 현재 카테고리: ${currentCategory || '(비어있음)'}`);
      
      // category가 없으면 driver로 설정
      if (!currentCategory) {
        await categorySelect.selectOption('driver');
        console.log('   ✅ category 선택: driver');
        await page.waitForTimeout(300);
      }
    }
    
    // Slug 필드 찾기 (label이 "Slug *"인 input)
    const slugLabel = page.locator('label:has-text("Slug")');
    const slugLabelCount = await slugLabel.count();
    
    if (slugLabelCount > 0) {
      // label의 for 속성으로 input 찾기
      const labelFor = await slugLabel.first().getAttribute('for');
      let slugInput;
      
      if (labelFor) {
        slugInput = page.locator(`#${labelFor}`);
      } else {
        // label 다음에 오는 input 찾기
        slugInput = slugLabel.first().locator('..').locator('input');
      }
      
      const slugInputCount = await slugInput.count();
      if (slugInputCount > 0) {
        await slugInput.first().fill('secret-force-common');
        console.log('   ✅ slug 입력: secret-force-common');
      } else {
        // 다른 방법: placeholder에 "제품명 입력 시 자동 생성됩니다"가 있는 input 찾기
        const slugInputByPlaceholder = page.locator('input[placeholder*="자동 생성"]');
        const placeholderCount = await slugInputByPlaceholder.count();
        if (placeholderCount > 0) {
          await slugInputByPlaceholder.first().fill('secret-force-common');
          console.log('   ✅ slug 입력 (placeholder로 찾음): secret-force-common');
        } else {
          console.log('   ⚠️ slug 입력 필드를 찾을 수 없습니다.');
        }
      }
    } else {
      console.log('   ⚠️ Slug label을 찾을 수 없습니다.');
    }
    
    // React 상태 업데이트 대기
    await page.waitForTimeout(1000);
    
    // slug와 category 값 확인
    const slugValue = await page.locator('input[placeholder*="자동 생성"]').first().inputValue().catch(() => '');
    const categoryValue = await categorySelect.inputValue();
    console.log(`   📝 최종 확인 - slug: ${slugValue}, category: ${categoryValue}`);
    
    console.log('\n📋 5단계: "갤러리에서 선택" 버튼 찾기');
    const galleryButton = page.locator('button:has-text("갤러리에서 선택"), button:has-text("🖼️ 갤러리에서 선택")');
    const galleryButtonCount = await galleryButton.count();
    
    if (galleryButtonCount === 0) {
      console.log('   ❌ "갤러리에서 선택" 버튼을 찾을 수 없습니다.');
      console.log('   📸 현재 페이지 스크린샷 저장...');
      await page.screenshot({ path: 'test-gallery-picker-error.png', fullPage: true });
      console.log('   ✅ 스크린샷 저장됨: test-gallery-picker-error.png\n');
    } else {
      console.log(`   ✅ "갤러리에서 선택" 버튼 ${galleryButtonCount}개 발견`);
      
      // alert 감지 설정
      let alertMessage = null;
      page.on('dialog', async dialog => {
        alertMessage = dialog.message();
        console.log(`   ⚠️ Alert 감지: ${alertMessage}`);
        await dialog.accept();
      });
      
      // 첫 번째 버튼 클릭
      await galleryButton.first().click();
      console.log('   ✅ "갤러리에서 선택" 버튼 클릭');
      
      if (alertMessage) {
        console.log(`   ❌ Alert 발생: ${alertMessage}`);
        console.log('   💡 slug나 category가 제대로 설정되지 않았을 수 있습니다.');
      }
      
      await page.waitForTimeout(3000);
      
      console.log('\n📋 6단계: 갤러리 모달 확인');
      
      // 여러 방법으로 모달 찾기
      const modalSelectors = [
        'text=갤러리에서 이미지 선택',
        'text=폴더에서 이미지 선택',
        'div:has-text("갤러리에서 이미지 선택")',
        'div:has-text("폴더에서 이미지 선택")',
        '[class*="fixed"][class*="inset-0"]', // 모달 오버레이
        'div[class*="z-50"]', // 높은 z-index 요소
      ];
      
      let modalFound = false;
      for (const selector of modalSelectors) {
        const element = page.locator(selector);
        const count = await element.count();
        if (count > 0) {
          console.log(`   ✅ 모달 발견 (선택자: ${selector}): ${count}개`);
          modalFound = true;
          break;
        }
      }
      
      if (modalFound) {
        console.log('   ✅ 갤러리 모달이 열렸습니다.');
        
        // 모달 내부의 폴더 경로 확인
        const folderPath = page.locator('text=secret-force-common, text=originals/products/secret-force-common');
        const folderPathCount = await folderPath.count();
        
        if (folderPathCount > 0) {
          console.log('   ✅ secret-force-common 폴더 경로가 표시됩니다.');
        } else {
          console.log('   ⚠️ secret-force-common 폴더 경로가 표시되지 않습니다.');
          // 실제 표시된 폴더 경로 확인
          const allText = await page.locator('div').allTextContents();
          const folderPathText = allText.find(text => text.includes('originals/products'));
          if (folderPathText) {
            console.log(`   📝 실제 폴더 경로: ${folderPathText.substring(0, 100)}`);
          }
        }
        
        // 이미지가 로드되었는지 확인
        await page.waitForTimeout(3000);
        const images = await page.locator('img').count();
        console.log(`   📸 모달 내 이미지 개수: ${images}개`);
        
        if (images > 0) {
          console.log('   ✅ 이미지가 로드되었습니다.');
        } else {
          console.log('   ⚠️ 이미지가 로드되지 않았습니다.');
        }
        
        // 네트워크 요청 확인
        const allImagesRequests = networkLogs.filter(log => 
          log.url.includes('/api/admin/all-images') || 
          log.url.includes('/api/admin/folders-list') ||
          log.url.includes('/api/admin/folder-images')
        );
        
        console.log(`\n   📊 관련 API 요청: ${allImagesRequests.length}개`);
        allImagesRequests.forEach(req => {
          console.log(`      - ${req.method} ${req.url.substring(0, 80)}... : ${req.status || 'pending'}`);
        });
        
        // secret-force-common 관련 요청 확인
        const secretForceCommonRequests = networkLogs.filter(log => 
          log.url.includes('secret-force-common')
        );
        
        if (secretForceCommonRequests.length > 0) {
          console.log(`\n   ✅ secret-force-common 관련 요청: ${secretForceCommonRequests.length}개`);
          secretForceCommonRequests.forEach(req => {
            console.log(`      - ${req.method} ${req.url.substring(0, 100)}... : ${req.status || 'pending'}`);
          });
        } else {
          console.log(`\n   ⚠️ secret-force-common 관련 요청이 없습니다.`);
        }
        
      } else {
        console.log('   ❌ 갤러리 모달이 열리지 않았습니다.');
        console.log('   📸 현재 페이지 스크린샷 저장...');
        await page.screenshot({ path: 'test-gallery-picker-modal-not-opened.png', fullPage: true });
        console.log('   ✅ 스크린샷 저장됨: test-gallery-picker-modal-not-opened.png');
        
        // 콘솔 에러 확인
        const errors = consoleMessages.filter(msg => msg.type === 'error');
        if (errors.length > 0) {
          console.log('\n   📋 콘솔 에러:');
          errors.forEach(err => {
            console.log(`      ❌ ${err.text.substring(0, 150)}`);
          });
        }
      }
    }
    
    // 콘솔 메시지 확인
    if (consoleMessages.length > 0) {
      console.log('\n📋 콘솔 메시지 (갤러리/secret-force-common 관련):');
      consoleMessages.forEach(msg => {
        const icon = msg.type === 'error' ? '❌' : msg.type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`   ${icon} [${msg.type}] ${msg.text.substring(0, 100)}`);
      });
    }
    
    // 최종 네트워크 요청 요약
    console.log('\n📊 전체 네트워크 요청 요약:');
    const errorRequests = networkLogs.filter(log => log.status >= 400);
    if (errorRequests.length > 0) {
      console.log(`   ❌ 에러 요청: ${errorRequests.length}개`);
      errorRequests.forEach(req => {
        console.log(`      - ${req.status} ${req.method} ${req.url.substring(0, 80)}...`);
      });
    } else {
      console.log('   ✅ 에러 요청 없음');
    }
    
    const successRequests = networkLogs.filter(log => log.status >= 200 && log.status < 300);
    console.log(`   ✅ 성공 요청: ${successRequests.length}개`);
    
    // 5초 대기 (사용자가 수동으로 확인할 수 있도록)
    console.log('\n⏳ 5초 대기 중... (브라우저를 확인하세요)');
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('\n❌ 테스트 중 에러 발생:', error.message);
    console.error(error.stack);
    
    // 에러 발생 시 스크린샷 저장
    try {
      await page.screenshot({ path: 'test-gallery-picker-error-final.png', fullPage: true });
      console.log('📸 에러 스크린샷 저장됨: test-gallery-picker-error-final.png');
    } catch (screenshotError) {
      console.error('스크린샷 저장 실패:', screenshotError.message);
    }
  } finally {
    console.log('\n📋 브라우저 종료 (5초 후)');
    await page.waitForTimeout(5000);
    await browser.close();
  }
})();
