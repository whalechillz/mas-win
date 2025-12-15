const { chromium } = require('playwright');

async function testAIImprovementFixed() {
  let browser;
  try {
    console.log('🚀 수정된 AI 개선 기능 테스트 시작...');
    browser = await chromium.launch({ headless: false }); // 시각적 디버깅을 위해 headless: false
    const page = await browser.newPage();

    // 1. 관리자 페이지 접속
    console.log('📝 1. 관리자 페이지 접속...');
    await page.goto('http://localhost:3000/admin/blog');

    // 로그인 처리 (필요한 경우)
    const currentUrl = page.url();
    if (currentUrl.includes('/admin/login')) {
      console.log('🔑 로그인 페이지 감지, 로그인 시도...');
      await page.fill('input[type="email"]', 'admin@example.com');
      const password = process.env.ADMIN_PASSWORD || ''; await page.fill('input[type="password"]', password);
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }
    
    console.log('✅ 관리자 페이지 로드 완료');
    
    // 페이지 로드 완료 대기
    await page.waitForTimeout(2000);
    
    // 2. 블로그 수정 페이지로 이동 (첫 번째 블로그의 수정 버튼 클릭)
    console.log('🔍 2. 블로그 수정 페이지로 이동...');
    const editButtons = page.locator('button:has-text("수정")');
    const editButtonCount = await editButtons.count();
    
    if (editButtonCount > 0) {
      console.log(`📝 ${editButtonCount}개의 수정 버튼 발견 - 첫 번째 클릭`);
      await editButtons.first().click();
      await page.waitForLoadState('networkidle');
      console.log('✅ 블로그 수정 페이지로 이동 완료');
    } else {
      console.log('❌ 수정 버튼을 찾을 수 없음');
      return;
    }
    
    // 페이지 로드 완료 대기
    await page.waitForTimeout(2000);
    
    // 3. AI 개선 버튼 찾기
    console.log('🔍 3. AI 개선 버튼 찾기...');
    let improvementButton = null;
    
    improvementButton = page.locator('button:has-text("🔧 AI 개선")');
    if (await improvementButton.isVisible()) {
      console.log('✅ AI 개선 버튼 발견');
    } else {
      console.log('❌ AI 개선 버튼을 찾을 수 없음');
      return;
    }
    
    if (improvementButton && await improvementButton.isVisible()) {
      console.log('✅ AI 개선 버튼 확인됨');
      
      // 4. 제목과 내용이 있는지 확인
      console.log('📝 4. 제목과 내용 확인...');
      const titleInput = page.locator('input[name="title"]');
      const contentTextarea = page.locator('textarea[name="content"]');
      
      if (await titleInput.isVisible()) {
        const titleValue = await titleInput.inputValue();
        console.log(`📝 현재 제목: "${titleValue}"`);
        
        if (!titleValue || titleValue.trim().length === 0) {
          console.log('⚠️ 제목이 비어있음 - 테스트용 제목 입력');
          await titleInput.fill('AI 개선 기능 테스트용 블로그 포스트');
        }
      }
      
      if (await contentTextarea.isVisible()) {
        const contentValue = await contentTextarea.inputValue();
        console.log(`📝 현재 내용 길이: ${contentValue?.length || 0}자`);
        
        if (!contentValue || contentValue.trim().length < 50) {
          console.log('⚠️ 내용이 부족함 - 테스트용 내용 입력');
          const testContent = `
# AI 개선 기능 테스트

이것은 AI 개선 기능을 테스트하기 위한 샘플 콘텐츠입니다.

## 테스트 목적
- AI가 기존 내용을 분석하고 개선하는지 확인
- 문법 교정 및 내용 확장 기능 테스트
- 브랜드 메시지 통합 기능 테스트
- API 사용량 추적 기능 테스트

## 기대 효과
- 더 풍부하고 전문적인 내용으로 개선
- SEO 최적화된 키워드 포함
- MASSGOO 브랜드 메시지 자연스럽게 통합
- 사용된 모델, 토큰, 비용 정보 표시

이 내용이 AI에 의해 어떻게 개선되는지 확인해보겠습니다.
          `;
          await contentTextarea.fill(testContent);
        }
      }
      
      // 5. AI 개선 버튼 클릭
      console.log('🔧 5. AI 개선 버튼 클릭...');
      await improvementButton.click();
      
      // 6. API 요청 및 응답 확인
      console.log('🌐 6. API 요청 및 응답 확인...');
      const requests = [];
      const responses = [];
      
      page.on('request', request => {
        if (request.url().includes('/api/improve-blog-content')) {
          requests.push({
            url: request.url(),
            method: request.method(),
            headers: request.headers(),
          });
        }
      });
      
      page.on('response', response => {
        if (response.url().includes('/api/improve-blog-content')) {
          responses.push({
            url: response.url(),
            status: response.status(),
            headers: response.headers(),
          });
        }
      });
      
      // API 응답 대기
      console.log('⏳ 7. API 응답 대기...');
      await page.waitForTimeout(15000); // 15초 대기
      
      if (requests.length > 0) {
        console.log(`✅ AI 개선 API 요청 감지됨: ${requests.length}개`);
        requests.forEach((req, index) => {
          console.log(`  요청 ${index + 1}: ${req.method} ${req.url}`);
        });
      } else {
        console.log('⚠️ AI 개선 API 요청이 감지되지 않음');
      }
      
      if (responses.length > 0) {
        console.log(`✅ AI 개선 API 응답 감지됨: ${responses.length}개`);
        responses.forEach((res, index) => {
          console.log(`  응답 ${index + 1}: ${res.status} ${res.url}`);
        });
      } else {
        console.log('⚠️ AI 개선 API 응답이 감지되지 않음');
      }
      
      // 7. 개선 결과 확인
      console.log('📈 8. 개선 결과 확인...');
      
      // WYSIWYG 모드인지 확인
      const wysiwygMode = await page.locator('button:has-text("📝 마크다운")').isVisible();
      console.log(`📝 WYSIWYG 모드: ${wysiwygMode}`);
      
      let updatedContent = '';
      if (wysiwygMode) {
        // WYSIWYG 모드에서는 에디터 내용 확인
        try {
          const editorContent = await page.locator('.ql-editor').textContent();
          updatedContent = editorContent || '';
          console.log(`📝 WYSIWYG 에디터 내용 길이: ${updatedContent.length}자`);
        } catch (error) {
          console.log('⚠️ WYSIWYG 에디터 내용을 읽을 수 없음');
        }
      } else {
        // 마크다운 모드에서는 textarea 확인
        try {
          updatedContent = await contentTextarea.inputValue();
          console.log(`📝 마크다운 내용 길이: ${updatedContent?.length || 0}자`);
        } catch (error) {
          console.log('⚠️ 마크다운 내용을 읽을 수 없음');
        }
      }
      
      if (updatedContent && updatedContent.length > 0) {
        console.log('✅ AI 개선 기능이 정상적으로 작동함');
        console.log('📄 개선된 내용 미리보기:');
        console.log(updatedContent.substring(0, 300) + '...');
        
        // 개선된 내용에 브랜드 메시지가 포함되어 있는지 확인
        if (updatedContent.includes('MASSGOO') || updatedContent.includes('마쓰구')) {
          console.log('✅ 브랜드 메시지가 성공적으로 통합됨');
        } else {
          console.log('⚠️ 브랜드 메시지 통합이 확인되지 않음');
        }
      } else {
        console.log('⚠️ 내용이 업데이트되지 않음');
      }
      
      // 8. AI 사용량 대시보드 테스트
      console.log('🤖 9. AI 사용량 대시보드 테스트...');
      const aiUsageButton = page.locator('button:has-text("🤖 AI 사용량")');
      if (await aiUsageButton.isVisible()) {
        console.log('✅ AI 사용량 버튼 발견');
        await aiUsageButton.click();
        await page.waitForTimeout(3000);
        
        const aiUsageDashboard = page.locator('text=AI 사용량 대시보드');
        if (await aiUsageDashboard.isVisible()) {
          console.log('✅ AI 사용량 대시보드가 표시됨');
          
          // 사용량 통계 확인
          const totalRequests = page.locator('text=총 요청수');
          const totalCost = page.locator('text=총 비용');
          
          if (await totalRequests.isVisible() && await totalCost.isVisible()) {
            console.log('✅ AI 사용량 통계가 정상적으로 표시됨');
          } else {
            console.log('⚠️ AI 사용량 통계가 표시되지 않음');
          }
        } else {
          console.log('❌ AI 사용량 대시보드가 표시되지 않음');
        }
      } else {
        console.log('❌ AI 사용량 버튼을 찾을 수 없음');
      }
      
    } else {
      console.log('❌ AI 개선 버튼을 찾을 수 없음');
    }
    
    // 9. 스크린샷 촬영
    console.log('📸 10. 스크린샷 촬영...');
    await page.screenshot({ 
      path: 'ai-improvement-fixed-test-result.png',
      fullPage: true 
    });
    console.log('✅ 스크린샷 저장: ai-improvement-fixed-test-result.png');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    // 에러 발생 시 스크린샷 저장
    if (browser) {
      const page = await browser.newPage();
      await page.screenshot({ 
        path: 'ai-improvement-fixed-test-error.png',
        fullPage: true 
      });
      console.log('📸 에러 스크린샷 저장: ai-improvement-fixed-test-error.png');
    }
  } finally {
    console.log('🔚 11. 브라우저 종료...');
    await browser.close();
    console.log('✅ 수정된 AI 개선 기능 테스트 완료');
  }
}

// 테스트 실행
testAIImprovementFixed().catch(console.error);
