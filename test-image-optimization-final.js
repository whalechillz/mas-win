// 최종 이미지 최적화 테스트
const { chromium } = require('playwright');

async function testImageOptimizationFinal() {
  console.log('🚀 최종 이미지 최적화 테스트 시작...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. 관리자 페이지로 이동
    console.log('📱 관리자 페이지로 이동...');
    await page.goto('http://localhost:3000/admin/blog');
    await page.waitForTimeout(3000);
    
    // 2. 네이버 블로그 스크래퍼 버튼 클릭
    console.log('🔵 네이버 블로그 스크래퍼 버튼 클릭...');
    const naverButton = await page.locator('button:has-text("🔵 네이버 블로그 스크래퍼")');
    await naverButton.click();
    await page.waitForTimeout(2000);
    
    // 3. URL 입력 필드 찾기 및 테스트 URL 입력
    console.log('📝 테스트 URL 입력...');
    const testUrl = 'https://blog.naver.com/massgoogolf/223958579134';
    
    // URL 입력 필드 찾기 (여러 가능한 선택자 시도)
    const urlInputSelectors = [
      'input[placeholder*="URL"]',
      'input[placeholder*="url"]',
      'input[placeholder*="네이버"]',
      'input[type="text"]',
      'input[type="url"]'
    ];
    
    let urlInput = null;
    for (const selector of urlInputSelectors) {
      try {
        urlInput = await page.locator(selector).first();
        await urlInput.waitFor({ timeout: 2000 });
        break;
      } catch (e) {
        continue;
      }
    }
    
    if (urlInput) {
      await urlInput.fill(testUrl);
      console.log('✅ URL 입력 완료');
    } else {
      console.log('❌ URL 입력 필드를 찾을 수 없습니다');
      return;
    }
    
    // 4. 스크래핑 시작 버튼 클릭
    console.log('🔄 스크래핑 시작...');
    const scrapeButtonSelectors = [
      'button:has-text("스크래핑 시작")',
      'button:has-text("시작")',
      'button:has-text("스크래핑")',
      'button[type="submit"]'
    ];
    
    let scrapeButton = null;
    for (const selector of scrapeButtonSelectors) {
      try {
        scrapeButton = await page.locator(selector).first();
        await scrapeButton.waitFor({ timeout: 2000 });
        break;
      } catch (e) {
        continue;
      }
    }
    
    if (scrapeButton) {
      await scrapeButton.click();
      console.log('✅ 스크래핑 시작 버튼 클릭');
    } else {
      console.log('❌ 스크래핑 버튼을 찾을 수 없습니다');
      return;
    }
    
    // 5. 스크래핑 완료 대기
    console.log('⏳ 스크래핑 완료 대기...');
    await page.waitForTimeout(15000); // 15초 대기
    
    // 6. 게시물 생성 버튼 찾기 및 클릭
    console.log('📝 게시물 생성...');
    const createButtonSelectors = [
      'button:has-text("게시물 생성")',
      'button:has-text("생성")',
      'button:has-text("저장")'
    ];
    
    let createButton = null;
    for (const selector of createButtonSelectors) {
      try {
        createButton = await page.locator(selector).first();
        await createButton.waitFor({ timeout: 2000 });
        break;
      } catch (e) {
        continue;
      }
    }
    
    if (createButton) {
      await createButton.click();
      console.log('✅ 게시물 생성 버튼 클릭');
    } else {
      console.log('❌ 게시물 생성 버튼을 찾을 수 없습니다');
      return;
    }
    
    // 7. 게시물 생성 완료 대기
    console.log('⏳ 게시물 생성 완료 대기...');
    await page.waitForTimeout(10000);
    
    // 8. 생성된 게시물 보기 버튼 클릭
    console.log('👁️ 생성된 게시물 보기...');
    const viewButtonSelectors = [
      'button:has-text("보기")',
      'button:has-text("View")',
      'a:has-text("보기")'
    ];
    
    let viewButton = null;
    for (const selector of viewButtonSelectors) {
      try {
        viewButton = await page.locator(selector).first();
        await viewButton.waitFor({ timeout: 2000 });
        break;
      } catch (e) {
        continue;
      }
    }
    
    if (viewButton) {
      await viewButton.click();
      console.log('✅ 게시물 보기 버튼 클릭');
    }
    
    // 9. 이미지 갤러리 섹션 대기
    console.log('🖼️ 이미지 갤러리 섹션 대기...');
    await page.waitForTimeout(5000);
    
    // 10. "모든 이미지를 Supabase에 저장" 버튼 찾기 및 클릭
    console.log('💾 모든 이미지를 Supabase에 저장...');
    const saveAllButtonSelectors = [
      'button:has-text("모든 이미지를 Supabase에 저장")',
      'button:has-text("Supabase에 저장")',
      'button:has-text("저장")'
    ];
    
    let saveAllButton = null;
    for (const selector of saveAllButtonSelectors) {
      try {
        saveAllButton = await page.locator(selector).first();
        await saveAllButton.waitFor({ timeout: 2000 });
        break;
      } catch (e) {
        continue;
      }
    }
    
    if (saveAllButton) {
      await saveAllButton.click();
      console.log('✅ Supabase 저장 버튼 클릭');
      
      // 11. 저장 완료 대기
      console.log('⏳ 이미지 저장 완료 대기...');
      await page.waitForTimeout(30000); // 30초 대기 (이미지 처리 시간)
      
      console.log('🎉 이미지 최적화 테스트 완료!');
      console.log('📋 확인 사항:');
      console.log('   - 다양한 크기 이미지 생성 (썸네일, 중간크기, WebP)');
      console.log('   - Supabase Storage에 자동 저장');
      console.log('   - 데이터베이스에 최적화된 URL 저장');
      console.log('   - AI 이미지 분석 (Google Vision)');
      
    } else {
      console.log('❌ Supabase 저장 버튼을 찾을 수 없습니다');
    }
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    await browser.close();
  }
}

// 테스트 실행
testImageOptimizationFinal().catch(console.error);
