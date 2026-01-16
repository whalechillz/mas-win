const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 콘솔 로그 수집
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('원본 참조 링크') || text.includes('used_in') || text.includes('usage_count')) {
      logs.push(`[${msg.type()}] ${text}`);
    }
  });
  
  try {
    console.log('🌐 갤러리 페이지 로딩...');
    await page.goto('http://localhost:3000/admin/gallery', { waitUntil: 'networkidle', timeout: 30000 });
    
    // 로그인 필요시 대기
    await page.waitForTimeout(3000);
    
    console.log('🔍 페이지 제목 확인:', await page.title());
    
    // API에서 이미지 데이터 먼저 확인
    console.log('\n🔍 API에서 이미지 데이터 확인...');
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/admin/all-images?limit=20&page=1&forceRefresh=true');
        const data = await response.json();
        const imageWithUsage = data.images && data.images.find((img) => img.usage_count > 0);
        if (imageWithUsage) {
          return {
            name: imageWithUsage.name,
            usage_count: imageWithUsage.usage_count,
            used_in: imageWithUsage.used_in,
            used_in_length: imageWithUsage.used_in ? imageWithUsage.used_in.length : 0,
            url: imageWithUsage.url
          };
        }
        return null;
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('📋 API 응답 (사용 중인 이미지):', JSON.stringify(apiResponse, null, 2));
    
    if (!apiResponse || apiResponse.error) {
      console.log('⚠️ API에서 이미지를 가져올 수 없습니다. (로그인 필요할 수 있음)');
      console.log('📋 브라우저에서 직접 확인하세요. 개발자 콘솔에 로그가 출력됩니다.');
      console.log('⏳ 10초 대기 후 브라우저를 확인하세요...');
      await page.waitForTimeout(10000);
      return;
    }
    
    console.log('\n🔍 "원본 참조"가 있는 이미지 찾기...');
    
    // 페이지에서 이미지 찾기
    await page.waitForTimeout(2000);
    
    // 이미지 그리드가 로드될 때까지 대기
    await page.waitForSelector('img', { timeout: 10000 }).catch(() => {
      console.log('⚠️ 이미지 요소를 찾을 수 없습니다.');
    });
    
    // "원본 참조" 텍스트가 있는 요소 찾기
    const imageWithUsage = await page.evaluate(() => {
      // 모든 텍스트 노드에서 "원본 참조" 찾기
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null
      );
      
      let node;
      while (node = walker.nextNode()) {
        if (node.textContent && node.textContent.includes('원본 참조')) {
          // 부모 요소 찾기
          let parent = node.parentElement;
          while (parent && !parent.querySelector('img')) {
            parent = parent.parentElement;
          }
          
          if (parent) {
            const img = parent.querySelector('img');
            return {
              found: true,
              text: node.textContent.trim(),
              imgSrc: img ? img.src : null,
              parentText: parent.textContent ? parent.textContent.substring(0, 200) : null
            };
          }
        }
      }
      return { found: false };
    });
    
    console.log('📸 이미지 찾기 결과:', JSON.stringify(imageWithUsage, null, 2));
    
    if (imageWithUsage.found) {
      // 이미지 클릭 - "원본 참조" 텍스트 근처의 이미지 클릭
      console.log('🖱️ 이미지 클릭...');
      
      // API에서 찾은 이미지 이름으로 클릭 시도
      if (apiResponse && apiResponse.name) {
        const imageClicked = await page.evaluate((imageName) => {
          const images = Array.from(document.querySelectorAll('img'));
          for (const img of images) {
            const parent = img.closest('div');
            if (parent && parent.textContent && parent.textContent.includes(imageName)) {
              img.click();
              return true;
            }
          }
          return false;
        }, apiResponse.name);
        
        if (!imageClicked) {
          // "원본 참조" 텍스트 근처 클릭
          await page.evaluate(() => {
            const walker = document.createTreeWalker(
              document.body,
              NodeFilter.SHOW_TEXT,
              null
            );
            
            let node;
            while (node = walker.nextNode()) {
              if (node.textContent && node.textContent.includes('원본 참조')) {
                let parent = node.parentElement;
                while (parent && !parent.querySelector('img')) {
                  parent = parent.parentElement;
                }
                if (parent) {
                  const img = parent.querySelector('img');
                  if (img) {
                    img.click();
                    return;
                  }
                }
              }
            }
          });
        }
      }
      
      await page.waitForTimeout(2000);
      
      // 모달이 열렸는지 확인
      const modalOpen = await page.evaluate(() => {
        const modal = document.querySelector('[class*="modal"]') || 
                     document.querySelector('[class*="fixed"]') ||
                     document.querySelector('h2:has-text("이미지 상세 정보")');
        return !!modal;
      });
      
      console.log('📋 모달 열림:', modalOpen);
      
      if (modalOpen) {
        // 모달 내용 확인
        const modalContent = await page.evaluate(() => {
          const modal = document.querySelector('h2');
          if (!modal) return null;
          
          const container = modal.closest('div[class*="fixed"]') || modal.parentElement;
          if (!container) return null;
          
          return {
            title: modal.textContent,
            hasOriginalRef: container.textContent?.includes('원본 참조'),
            hasLink: container.querySelector('a[href*="kakao-content"]') !== null,
            allLinks: Array.from(container.querySelectorAll('a')).map(a => ({
              href: a.getAttribute('href'),
              text: a.textContent
            })),
            usedInInfo: container.textContent?.match(/원본 참조[^]*?회/)?.[0]
          };
        });
        
        console.log('📋 모달 내용:', JSON.stringify(modalContent, null, 2));
        
        // 콘솔 로그 확인
        console.log('\n📋 콘솔 로그:');
        logs.forEach(log => console.log(log));
        
        // 스크린샷
        await page.screenshot({ path: 'test-image-detail-links.png', fullPage: true });
        console.log('📸 스크린샷 저장: test-image-detail-links.png');
      }
    }
    
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'test-image-detail-links-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
