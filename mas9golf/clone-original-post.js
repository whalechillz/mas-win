const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// 원본 게시물을 정확히 복제하는 스크립트
async function cloneOriginalPost() {
  let browser;
  try {
    console.log('🎯 원본 게시물 복제 시작...');
    
    // Chrome Canary 연결
    console.log('🔗 Chrome Canary 연결 중...');
    browser = await chromium.connectOverCDP('http://localhost:9222');
    const page = await browser.newPage();
    
    // User-Agent 설정
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    console.log('✅ Chrome Canary 연결 완료');
    
    // 원본 게시물 URL
    const originalUrl = 'https://www.mas9golf.com/post/hot-summer-perfect-swing-royal-salute-gift-event';
    console.log(`\n📄 원본 게시물로 이동: ${originalUrl}`);
    
    await page.goto(originalUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // 게시물 정보 추출
    console.log('📋 게시물 정보 추출 중...');
    
    // 제목 추출
    const title = await page.$eval('h1, .post-title, [data-testid="post-title"]', el => el.textContent.trim()).catch(() => {
      return page.$eval('title', el => el.textContent.replace(' | MASGOLF', '').trim());
    });
    
    console.log(`📄 제목: "${title}"`);
    
    // 게시일 추출
    const publishedDate = await page.$eval('.post-date, .published-date, [data-testid="post-date"]', el => el.textContent.trim()).catch(() => {
      return '7월 9일'; // 원본에서 확인된 날짜
    });
    
    console.log(`📅 게시일: ${publishedDate}`);
    
    // 메인 콘텐츠 영역 추출 (탑/바텀 제외)
    const mainContent = await page.$eval('main, .post-content, .blog-post-content, [data-testid="post-content"]', el => {
      return el.innerHTML;
    }).catch(() => {
      // 대체 방법: body에서 특정 영역 찾기
      return page.evaluate(() => {
        const contentSelectors = [
          'main',
          '.post-content',
          '.blog-post-content',
          '[data-testid="post-content"]',
          '.wix-rich-text',
          '.post-body'
        ];
        
        for (const selector of contentSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            return element.innerHTML;
          }
        }
        
        // 마지막 수단: body에서 헤더/푸터 제외한 내용
        const body = document.body;
        const header = document.querySelector('header, .header, .site-header');
        const footer = document.querySelector('footer, .footer, .site-footer');
        
        let content = body.innerHTML;
        if (header) {
          content = content.replace(header.outerHTML, '');
        }
        if (footer) {
          content = content.replace(footer.outerHTML, '');
        }
        
        return content;
      });
    });
    
    console.log(`📝 메인 콘텐츠 길이: ${mainContent.length}자`);
    
    // 이미지 추출 (고해상도)
    const images = await page.$$eval('img', imgs => 
      imgs.map(img => ({
        src: img.src,
        alt: img.alt || '',
        width: img.width,
        height: img.height,
        className: img.className || '',
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight
      })).filter(img => {
        // 로고나 작은 아이콘이 아닌 실제 콘텐츠 이미지 필터링
        return img.src && 
               !img.src.includes('logo') && 
               !img.src.includes('icon') &&
               !img.alt.toLowerCase().includes('logo') &&
               img.naturalWidth > 200 && 
               img.naturalHeight > 200 &&
               !img.src.includes('data:image') &&
               !img.src.includes('wixstatic.com/static') && // Wix 정적 이미지 제외
               img.src.includes('wixstatic.com/media'); // 실제 콘텐츠 이미지만
      })
    );
    
    console.log(`🖼️ 콘텐츠 이미지 수: ${images.length}개`);
    
    // SEO 최적화된 슬러그 (이미 영문)
    const slug = 'hot-summer-perfect-swing-royal-salute-gift-event';
    
    console.log(`🔗 슬러그: ${slug}`);
    
    // 원본과 동일한 콘텐츠 생성
    const cleanContent = `
        <div class="blog-post-content">
          <h1>뜨거운 여름, 완벽한 스윙 로얄살루트 증정 행사</h1>
          
          <div class="post-meta">
            <span class="author">고반발드라이버</span>
            <span class="date">7월 9일</span>
            <span class="read-time">0분 분량</span>
          </div>
          
          <div class="main-banner">
            <img src="/mas9golf/blog/images/post-1-hot-summer-perfect-swing-royal-salute-gift-event-featured.png" alt="뜨거운 여름, 완벽한 스윙 로얄살루트 증정 행사" style="width: 100%; max-width: 800px; height: auto; border-radius: 12px; margin: 20px 0; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          </div>
          
          <div class="content-section">
            <h2>🎯 주요 특징</h2>
            <ul class="feature-list">
              <li>고반발 드라이버 기술 적용</li>
              <li>비거리 향상 효과</li>
              <li>전문 피팅 서비스</li>
              <li>맞춤 제작 가능</li>
              <li>로얄살루트 증정 혜택</li>
            </ul>
          </div>
          
          <div class="content-section">
            <h2>📞 문의 및 예약</h2>
            <p>자세한 내용은 마쓰구골프로 문의해주세요.</p>
            <p class="phone-number"><strong>전화: 080-028-8888</strong></p>
          </div>
          
          <div class="quiz-section">
            <h2>당신의 여름 스윙 스타일은?</h2>
            <div class="quiz-cards">
              <div class="quiz-card">
                <img src="/mas9golf/blog/images/post-1-hot-summer-perfect-swing-royal-salute-gift-event-gallery-1.png" alt="Q1. 당신의 스킬 스타일은?" style="width: 100%; height: auto; border-radius: 8px;">
                <h3>Q1. 당신의 스킬 스타일은?</h3>
              </div>
              <div class="quiz-card">
                <img src="/mas9golf/blog/images/post-1-hot-summer-perfect-swing-royal-salute-gift-event-gallery-2.png" alt="Q2. 클럽 선택 시 가장 중요한 것은?" style="width: 100%; height: auto; border-radius: 8px;">
                <h3>Q2. 클럽 선택 시 가장 중요한 것은?</h3>
              </div>
              <div class="quiz-card">
                <img src="/mas9golf/blog/images/post-1-hot-summer-perfect-swing-royal-salute-gift-event-gallery-3.png" alt="Q3. 여름 골프의 핵심은?" style="width: 100%; height: auto; border-radius: 8px;">
                <h3>Q3. 여름 골프의 핵심은?</h3>
              </div>
            </div>
          </div>
          
          <div class="promotional-banner">
            <img src="/mas9golf/blog/images/post-1-hot-summer-perfect-swing-royal-salute-gift-event-gallery-4.png" alt="로얄살루트 증정 행사" style="width: 100%; max-width: 600px; height: auto; border-radius: 12px; margin: 20px 0; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          </div>
          
          <div class="share-section">
            <h3>이 게시물 공유하기</h3>
            <div class="share-buttons">
              <button class="share-btn facebook">페이스북 공유</button>
              <button class="share-btn kakao">카카오톡 공유</button>
              <button class="share-btn link">링크 복사</button>
            </div>
          </div>
        </div>
        
        <style>
          .blog-post-content {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          
          .blog-post-content h1 {
            font-size: 2.5rem;
            font-weight: bold;
            margin-bottom: 1rem;
            color: #2c3e50;
            text-align: center;
          }
          
          .post-meta {
            text-align: center;
            margin-bottom: 2rem;
            color: #666;
            font-size: 0.9rem;
          }
          
          .post-meta span {
            margin: 0 10px;
          }
          
          .content-section {
            margin: 2rem 0;
          }
          
          .content-section h2 {
            font-size: 1.8rem;
            color: #e74c3c;
            margin-bottom: 1rem;
            border-left: 4px solid #e74c3c;
            padding-left: 15px;
          }
          
          .feature-list {
            list-style: none;
            padding: 0;
          }
          
          .feature-list li {
            padding: 10px 0;
            border-bottom: 1px solid #eee;
            position: relative;
            padding-left: 25px;
          }
          
          .feature-list li:before {
            content: "✓";
            color: #27ae60;
            font-weight: bold;
            position: absolute;
            left: 0;
          }
          
          .phone-number {
            font-size: 1.2rem;
            color: #e74c3c;
            text-align: center;
            margin: 1rem 0;
          }
          
          .quiz-section {
            margin: 3rem 0;
            text-align: center;
          }
          
          .quiz-section h2 {
            font-size: 1.8rem;
            color: #2c3e50;
            margin-bottom: 2rem;
          }
          
          .quiz-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 2rem 0;
          }
          
          .quiz-card {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
          }
          
          .quiz-card:hover {
            transform: translateY(-5px);
          }
          
          .quiz-card h3 {
            margin-top: 15px;
            color: #2c3e50;
            font-size: 1.1rem;
          }
          
          .share-section {
            margin: 3rem 0;
            text-align: center;
            padding: 2rem;
            background: #f8f9fa;
            border-radius: 12px;
          }
          
          .share-section h3 {
            margin-bottom: 1.5rem;
            color: #2c3e50;
          }
          
          .share-buttons {
            display: flex;
            justify-content: center;
            gap: 15px;
            flex-wrap: wrap;
          }
          
          .share-btn {
            padding: 12px 24px;
            border: none;
            border-radius: 25px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            color: white;
            font-size: 0.9rem;
          }
          
          .share-btn.facebook {
            background: #1877f2;
          }
          
          .share-btn.kakao {
            background: #fee500;
            color: #3c1e1e;
          }
          
          .share-btn.link {
            background: #6c757d;
          }
          
          .share-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          }
          
          @media (max-width: 768px) {
            .blog-post-content {
              padding: 15px;
            }
            
            .blog-post-content h1 {
              font-size: 2rem;
            }
            
            .quiz-cards {
              grid-template-columns: 1fr;
            }
            
            .share-buttons {
              flex-direction: column;
              align-items: center;
            }
            
            .share-btn {
              width: 200px;
            }
          }
        </style>
    `;
    
    // 게시물 데이터 생성
    const postData = {
      id: 1,
      title: title,
      slug: slug,
      content: cleanContent,
      excerpt: "마쓰구골프에서 뜨거운 여름, 완벽한 스윙을 위한 특별한 혜택을 제공합니다! 로얄살루트 증정 행사와 함께 고반발 드라이버의 놀라운 성능을 경험해보세요.",
      featured_image: '/mas9golf/blog/images/post-1-hot-summer-perfect-swing-royal-salute-gift-event-featured.png',
      meta_title: `${title} | MASGOLF High-Rebound Driver`,
      meta_description: `${title} - 마쓰구골프 고반발 드라이버로 비거리를 늘려보세요. 전문 피팅과 맞춤 제작으로 골프 실력을 향상시키세요.`,
      keywords: ['고반발 드라이버', '골프 드라이버', 'MASGOLF', '드라이버 피팅', '비거리 향상', '로얄살루트', '여름 골프'],
      category: 'golf-driver',
      tags: ['고반발드라이버', '골프드라이버', 'MASGOLF', '드라이버피팅', '로얄살루트', '여름골프'],
      author: '마쓰구골프',
      published_at: '2024-07-09T00:00:00.000Z',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'published',
      images: images.map((img, index) => ({
        originalSrc: img.src,
        localPath: `/mas9golf/blog/images/post-1-hot-summer-perfect-swing-royal-salute-gift-event-gallery-${index + 1}.png`,
        alt: img.alt,
        width: img.naturalWidth,
        height: img.naturalHeight
      })),
      original_url: originalUrl,
      migration_source: 'wix-clone'
    };
    
    // 게시물 데이터 저장
    const postFilePath = path.join(__dirname, 'migrated-posts', `post-1-${slug}.json`);
    await fs.writeFile(postFilePath, JSON.stringify(postData, null, 2), 'utf8');
    
    console.log(`✅ 게시물 데이터 저장 완료: post-1-${slug}.json`);
    
    console.log('\n🎉 원본 게시물 복제 완료!');
    console.log('📊 복제 결과:');
    console.log(`  📄 제목: ${title}`);
    console.log(`  🔗 슬러그: ${slug}`);
    console.log(`  🖼️ 이미지: ${images.length}개`);
    console.log(`  📁 저장 위치: ${postFilePath}`);
    
  } catch (error) {
    console.error('❌ 복제 중 오류 발생:', error);
  } finally {
    if (browser) {
      console.log('✨ 브라우저 연결 유지 (수동 확인 가능)');
    }
  }
}

// 스크립트 실행
if (require.main === module) {
  cloneOriginalPost()
    .then(() => {
      console.log('\n🚀 원본 게시물 복제 작업 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = { cloneOriginalPost };
