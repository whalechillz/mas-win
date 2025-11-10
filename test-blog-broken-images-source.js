const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 블로그 본문 이미지 깨짐 원인 확인 시작...\n');

    // 1. 로그인
    console.log('1️⃣ 로그인 중...');
    await page.goto('http://localhost:3000/admin/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="login"]', '010-6669-9000');
    await page.fill('input[name="password"]', '66699000');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/**', { timeout: 10000 });
    console.log('✅ 로그인 완료\n');

    // 2. API를 통해 블로그 게시물 목록 가져오기
    console.log('2️⃣ API를 통해 블로그 게시물 목록 가져오기...');
    const postsResponse = await page.goto('http://localhost:3000/api/admin/blog');
    const postsData = await postsResponse.json();
    
    if (!postsData || !postsData.posts || postsData.posts.length === 0) {
      console.error('❌ 게시물을 찾을 수 없습니다');
      return;
    }
    
    // ID 309 게시물 찾기
    const targetPost = postsData.posts.find(p => p.id === 309) || postsData.posts[0];
    if (!targetPost) {
      console.error('❌ ID 309 게시물을 찾을 수 없습니다');
      return;
    }
    console.log(`✅ 게시물 찾음: ${targetPost.title} (ID: ${targetPost.id})\n`);

    // 3. 블로그 관리 페이지로 이동
    console.log('3️⃣ 블로그 관리 페이지로 이동...');
    await page.goto('http://localhost:3000/admin/blog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log('✅ 블로그 관리 페이지 로드 완료\n');

    // 4. 수정 버튼 찾기 및 클릭
    console.log('4️⃣ 수정 버튼 찾기 및 클릭...');
    
    // 여러 방법으로 수정 버튼 찾기 시도
    let editButton = null;
    const buttonSelectors = [
      `button:has-text("수정")`,
      `button[onclick*="edit"]`,
      `a:has-text("수정")`,
      `button:has-text("Edit")`
    ];
    
    for (const selector of buttonSelectors) {
      try {
        const buttons = page.locator(selector);
        const count = await buttons.count();
        if (count > 0) {
          // 게시물 ID와 일치하는 버튼 찾기
          for (let i = 0; i < count; i++) {
            const btn = buttons.nth(i);
            const btnText = await btn.textContent();
            if (btnText && btnText.includes('수정')) {
              editButton = btn;
              break;
            }
          }
          if (editButton) break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!editButton) {
      // 게시물 ID로 직접 찾기
      const postId = targetPost.id;
      // URL에 직접 접근
      await page.goto(`http://localhost:3000/admin/blog?edit=${postId}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      console.log('✅ URL로 직접 접근 완료\n');
    } else {
      await editButton.waitFor({ state: 'visible', timeout: 10000 });
      await editButton.click();
    }
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // 폼 로드 대기
    console.log('✅ 수정 모드 진입 완료\n');

    // 5. API를 통해 게시물 원본 데이터 확인
    console.log('5️⃣ API를 통해 게시물 원본 데이터 확인...');
    const postResponse = await page.goto(`http://localhost:3000/api/admin/blog/${targetPost.id}`);
    const postData = await postResponse.json();
    
    if (postData && postData.post) {
      const post = postData.post;
      console.log(`📝 게시물 제목: ${post.title}`);
      console.log(`📝 게시물 ID: ${post.id}`);
      console.log(`📝 본문 길이: ${post.content?.length || 0}자\n`);
      
      // 본문에서 이미지 URL 추출
      const content = post.content || '';
      
      // HTML img 태그에서 이미지 URL 추출
      const htmlImgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
      const htmlMatches = [...content.matchAll(htmlImgRegex)];
      console.log(`📸 HTML img 태그에서 발견된 이미지: ${htmlMatches.length}개`);
      htmlMatches.forEach((match, i) => {
        console.log(`  ${i + 1}. ${match[1]}`);
      });
      console.log('');
      
      // 마크다운 이미지 문법에서 이미지 URL 추출
      const markdownImgRegex = /!\[([^\]]*)\]\(([^)]+)\)/gi;
      const markdownMatches = [...content.matchAll(markdownImgRegex)];
      console.log(`📸 마크다운 이미지 문법에서 발견된 이미지: ${markdownMatches.length}개`);
      markdownMatches.forEach((match, i) => {
        console.log(`  ${i + 1}. ${match[2]} (alt: ${match[1] || '없음'})`);
      });
      console.log('');
      
      // 잘린 URL 확인
      const brokenUrlRegex = /\/or[^"')]*["')]/gi;
      const brokenMatches = [...content.matchAll(brokenUrlRegex)];
      if (brokenMatches.length > 0) {
        console.log(`⚠️ 잘린 이미지 URL 발견: ${brokenMatches.length}개`);
        brokenMatches.forEach((match, i) => {
          console.log(`  ${i + 1}. ${match[0]}`);
        });
        console.log('');
      }
      
      // 본문 내용 일부 출력
      console.log('📝 본문 내용 (처음 1000자):');
      console.log(content.substring(0, 1000));
      console.log('...\n');
    }
    
    // 6. TipTap 에디터에서 본문 내용 확인
    console.log('6️⃣ TipTap 에디터에서 본문 내용 확인...');
    await page.waitForTimeout(2000); // 에디터 초기화 대기
    
    // 에디터 내용 가져오기
    const editorContent = await page.evaluate(() => {
      // TipTap 에디터의 ProseMirror 요소 찾기
      const editor = document.querySelector('.ProseMirror, [contenteditable="true"]');
      if (!editor) return null;
      
      return {
        html: editor.innerHTML,
        text: editor.textContent,
        images: Array.from(editor.querySelectorAll('img')).map(img => ({
          src: img.src,
          alt: img.alt,
          outerHTML: img.outerHTML,
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight
        }))
      };
    });

    if (!editorContent) {
      console.error('❌ 에디터를 찾을 수 없습니다');
      await page.screenshot({ path: 'test-blog-editor-not-found.png' });
    } else {
      console.log('📝 에디터 내용:');
      console.log(`  - 텍스트 길이: ${editorContent.text?.length || 0}자`);
      console.log(`  - 이미지 개수: ${editorContent.images?.length || 0}개\n`);

      // 이미지 URL 분석
      if (editorContent.images && editorContent.images.length > 0) {
        console.log('📸 에디터의 이미지:');
        editorContent.images.forEach((img, i) => {
          console.log(`\n--- 이미지 ${i + 1} ---`);
          console.log(`  URL: ${img.src}`);
          console.log(`  Alt: ${img.alt || '(없음)'}`);
          console.log(`  로드 완료: ${img.complete}`);
          console.log(`  크기: ${img.naturalWidth}x${img.naturalHeight}`);
          if (img.naturalWidth === 0 || img.naturalHeight === 0) {
            console.log('  ⚠️ 이미지가 로드되지 않음!');
          }
          console.log(`  HTML: ${img.outerHTML.substring(0, 150)}...`);
          
          // URL에서 파일 경로 추출
          const urlMatch = img.src.match(/\/blog-images\/(.+)$/);
          if (urlMatch) {
            const imagePath = urlMatch[1].split('?')[0];
            console.log(`  경로: ${imagePath}`);
          }
        });
        console.log('');
      }
    }

    // 7. 실제 블로그 상세 페이지에서 렌더링된 HTML 확인
    console.log('7️⃣ 실제 블로그 상세 페이지에서 렌더링된 HTML 확인...');
    
    const postSlug = targetPost.slug || targetPost.id;
    console.log(`📝 게시물 slug: ${postSlug}`);
    
    // 새 탭에서 블로그 상세 페이지 열기
    const blogPage = await context.newPage();
    await blogPage.goto(`http://localhost:3000/blog/${postSlug}`);
    await blogPage.waitForLoadState('networkidle');
    await blogPage.waitForTimeout(3000);
    
    // 렌더링된 본문 내용 확인
    const renderedContent = await blogPage.evaluate(() => {
      const article = document.querySelector('article');
      if (!article) return null;
      
      const prose = article.querySelector('.prose');
      if (!prose) return null;
      
      return {
        html: prose.innerHTML,
        images: Array.from(prose.querySelectorAll('img')).map(img => ({
          src: img.src,
          alt: img.alt,
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          outerHTML: img.outerHTML,
          onerror: img.onerror ? '있음' : '없음'
        })),
        brokenImages: Array.from(prose.querySelectorAll('p')).filter(p => 
          p.textContent.includes('이미지 링크가 손상') || 
          p.textContent.includes('이미지를 불러올 수 없') ||
          p.textContent.includes('손상되었습니다')
        ).map(p => ({
          text: p.textContent,
          html: p.outerHTML
        })),
        placeholderImages: Array.from(prose.querySelectorAll('div, p')).filter(el => 
          el.textContent.includes('이미지') && 
          (el.textContent.includes('맞춤형') || el.textContent.includes('스윙') || el.textContent.includes('할인'))
        ).map(el => ({
          text: el.textContent,
          html: el.outerHTML
        }))
      };
    });

    if (renderedContent) {
      console.log('📝 렌더링된 본문:');
      console.log(`  - 이미지 개수: ${renderedContent.images?.length || 0}개`);
      console.log(`  - 깨진 이미지 메시지: ${renderedContent.brokenImages?.length || 0}개`);
      console.log(`  - 플레이스홀더 텍스트: ${renderedContent.placeholderImages?.length || 0}개\n`);
      
      if (renderedContent.images && renderedContent.images.length > 0) {
        console.log('📸 렌더링된 이미지:');
        renderedContent.images.forEach((img, i) => {
          console.log(`\n--- 이미지 ${i + 1} ---`);
          console.log(`  URL: ${img.src}`);
          console.log(`  Alt: ${img.alt || '(없음)'}`);
          console.log(`  로드 완료: ${img.complete}`);
          console.log(`  크기: ${img.naturalWidth}x${img.naturalHeight}`);
          console.log(`  onError 핸들러: ${img.onerror}`);
          if (img.naturalWidth === 0 || img.naturalHeight === 0) {
            console.log('  ⚠️ 이미지가 로드되지 않음!');
          }
          console.log(`  HTML: ${img.outerHTML.substring(0, 200)}...`);
        });
        console.log('');
      }
      
      if (renderedContent.brokenImages && renderedContent.brokenImages.length > 0) {
        console.log('\n⚠️ 깨진 이미지 메시지:');
        renderedContent.brokenImages.forEach((msg, i) => {
          console.log(`\n--- 메시지 ${i + 1} ---`);
          console.log(`  텍스트: ${msg.text}`);
          console.log(`  HTML: ${msg.html}`);
        });
        console.log('');
      }
      
      if (renderedContent.placeholderImages && renderedContent.placeholderImages.length > 0) {
        console.log('\n📝 플레이스홀더 텍스트:');
        renderedContent.placeholderImages.forEach((placeholder, i) => {
          console.log(`\n--- 플레이스홀더 ${i + 1} ---`);
          console.log(`  텍스트: ${placeholder.text}`);
          console.log(`  HTML: ${placeholder.html.substring(0, 200)}...`);
        });
        console.log('');
      }
    }
    
    await blogPage.close();

    // 9. 스크린샷 저장
    await page.screenshot({ path: 'test-blog-edit-page.png', fullPage: true });
    console.log('\n📸 스크린샷 저장: test-blog-edit-page.png');

    console.log('\n✅ 분석 완료!');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'test-blog-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();

