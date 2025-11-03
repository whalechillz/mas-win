// 블로그 다운로드 기능 완전 테스트 스크립트 (최신 내용 및 메타데이터 확인)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 블로그 다운로드 완전 테스트 시작...');

    // 1. 로그인
    console.log('1️⃣ 로그인 중...');
    await page.goto('https://win.masgolf.co.kr/admin/login');
    await page.waitForTimeout(2000);
    
    const loginInput = page.locator('input#login, input[name="login"], input[placeholder*="전화번호"], input[placeholder*="아이디"]').first();
    await loginInput.waitFor({ timeout: 10000 });
    await loginInput.fill('010-6669-9000');
    console.log('✅ 전화번호 입력 완료');
    await page.waitForTimeout(500);
    
    const passwordInput = page.locator('input#password, input[name="password"], input[type="password"]').first();
    await passwordInput.waitFor({ timeout: 10000 });
    await passwordInput.fill('66699000');
    console.log('✅ 비밀번호 입력 완료');
    await page.waitForTimeout(500);
    
    const loginButton = page.locator('button[type="submit"], form button, button:has-text("로그인")').first();
    await loginButton.waitFor({ timeout: 10000 });
    await loginButton.click();
    console.log('✅ 로그인 버튼 클릭 완료');
    await page.waitForTimeout(3000);

    // 2. 블로그 관리 페이지 이동
    console.log('2️⃣ 블로그 관리 페이지로 이동...');
    await page.goto('https://win.masgolf.co.kr/admin/blog');
    await page.waitForTimeout(5000);

    // 3. 블로그 글 선택 (ID 477 - 드라이버 선택의 전환점)
    console.log('3️⃣ 블로그 글 선택...');
    const firstPost = page.locator('[data-post-id="477"], .blog-post-card, .post-item').first();
    if (await firstPost.count() === 0) {
      console.log('⚠️ 블로그 글을 찾을 수 없음, 첫 번째 다운로드 버튼 사용');
    }

    // 4. 다운로드 기능 테스트
    console.log('4️⃣ 다운로드 기능 테스트...');
    const downloadButton = page.locator('button:has-text("다운로드")').first();
    
    if (await downloadButton.count() > 0) {
      console.log('✅ 다운로드 버튼 발견');
      
      // 다운로드 시작 (다운로드 이벤트 감지)
      const downloadPromise = page.waitForEvent('download', { timeout: 60000 });
      await downloadButton.click();
      console.log('✅ 다운로드 버튼 클릭');
      
      try {
        const download = await downloadPromise;
        console.log('✅ 다운로드 시작됨:', download.suggestedFilename());
        
        // 다운로드 파일 저장
        const downloadsPath = path.join(process.env.HOME || process.env.USERPROFILE, 'Downloads');
        const filePath = path.join(downloadsPath, download.suggestedFilename());
        await download.saveAs(filePath);
        console.log('✅ 다운로드 파일 저장:', filePath);
        
        // ZIP 파일 내용 확인
        await page.waitForTimeout(2000);
        console.log('5️⃣ ZIP 파일 내용 확인...');
        
        const zipData = fs.readFileSync(filePath);
        const zip = await JSZip.loadAsync(zipData);
        
        // 파일 목록 확인
        const fileNames = Object.keys(zip.files);
        console.log('✅ ZIP 파일 내부 파일 목록:');
        fileNames.forEach(fileName => {
          console.log(`   - ${fileName}`);
        });
        
        // HTML 파일 찾기
        const htmlFile = fileNames.find(name => name.endsWith('.html'));
        if (htmlFile) {
          console.log('✅ HTML 파일 발견:', htmlFile);
          
          // HTML 내용 확인
          const htmlContent = await zip.files[htmlFile].async('string');
          
          // 메타데이터 확인
          const checks = {
            title: htmlContent.includes('드라이버') || htmlContent.includes('마쓰구'),
            excerpt: htmlContent.includes('요약') || htmlContent.includes('excerpt'),
            slug: htmlContent.includes('슬러그') || htmlContent.includes('masgolf.co.kr/blog/'),
            category: htmlContent.includes('카테고리'),
            metadata: htmlContent.includes('메타') || htmlContent.includes('meta'),
            images: htmlContent.includes('images/image_'),
            content: htmlContent.length > 5000, // 본문이 충분히 긴지 확인
            naverUrl: !htmlContent.includes('blog.naver.com') && !htmlContent.includes('postfiles.naver.net')
          };
          
          console.log('\n6️⃣ 다운로드 내용 검증:');
          console.log(`   ✅ 제목 포함: ${checks.title ? '✅' : '❌'}`);
          console.log(`   ✅ 요약 포함: ${checks.excerpt ? '✅' : '❌'}`);
          console.log(`   ✅ 슬러그 포함: ${checks.slug ? '✅' : '❌'}`);
          console.log(`   ✅ 카테고리 포함: ${checks.category ? '✅' : '❌'}`);
          console.log(`   ✅ 메타데이터 포함: ${checks.metadata ? '✅' : '❌'}`);
          console.log(`   ✅ 이미지 경로 로컬화: ${checks.images ? '✅' : '❌'}`);
          console.log(`   ✅ 본문 내용 충분: ${checks.content ? '✅' : '❌'}`);
          console.log(`   ✅ 네이버 URL 없음 (최신 내용): ${checks.naverUrl ? '✅' : '❌'}`);
          
          // 이미지 폴더 확인
          const imageFiles = fileNames.filter(name => name.startsWith('images/') && !name.endsWith('/'));
          console.log(`\n7️⃣ 이미지 파일 확인:`);
          console.log(`   ✅ 이미지 개수: ${imageFiles.length}개`);
          imageFiles.forEach(imgFile => {
            console.log(`   - ${imgFile}`);
          });
          
          // 최종 결과
          const allPassed = Object.values(checks).every(v => v) && imageFiles.length > 0;
          console.log(`\n${allPassed ? '✅' : '⚠️'} 최종 결과: ${allPassed ? '모든 검증 통과' : '일부 검증 실패'}`);
          
        } else {
          console.log('❌ HTML 파일을 찾을 수 없음');
        }
        
      } catch (error) {
        if (error.message.includes('timeout')) {
          console.log('⚠️ 다운로드 시간 초과 (60초)');
        } else {
          console.error('❌ 다운로드 오류:', error.message);
        }
      }
    } else {
      console.log('❌ 다운로드 버튼을 찾을 수 없음');
    }

    console.log('\n✅ 모든 테스트 완료!');
    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('❌ 테스트 중 오류:', error);
    await page.screenshot({ path: 'test-blog-download-complete-error.png' });
  } finally {
    await browser.close();
  }
})();

