const fs = require('fs').promises;
const path = require('path');

// 절제된 범용 블로그 템플릿으로 변환
async function convertToUniversalBlog() {
  try {
    console.log('🎨 절제된 범용 블로그 템플릿으로 변환 시작...');
    
    // 게시물 데이터 업데이트
    const postFilePath = path.join(__dirname, '../mas9golf/migrated-posts/post-1-hot-summer-perfect-swing-royal-salute-gift-event.json');
    const postData = JSON.parse(await fs.readFile(postFilePath, 'utf8'));
    
    console.log(`📄 현재 제목: ${postData.title}`);
    
    // 절제되고 범용적인 콘텐츠 생성
    const universalContent = `
        <div class="blog-post-content">
          <div class="post-meta">
            <span class="author">고반발드라이버</span>
            <span class="date">7월 9일</span>
            <span class="read-time">0분 분량</span>
          </div>
          
          <div class="main-banner">
            <img src="/mas9golf/blog/images/post-1-hot-summer-perfect-swing-royal-salute-gift-event-featured.png" alt="뜨거운 여름, 완벽한 스윙 로얄살루트 증정 행사" class="featured-image">
          </div>
          
          <div class="content-section">
            <h2 class="section-title">주요 특징</h2>
            <div class="section-content">
              <ul class="feature-list">
                <li class="feature-item">
                  <span class="feature-text">고반발 드라이버 기술 적용</span>
                </li>
                <li class="feature-item">
                  <span class="feature-text">비거리 향상 효과</span>
                </li>
                <li class="feature-item">
                  <span class="feature-text">전문 피팅 서비스</span>
                </li>
                <li class="feature-item">
                  <span class="feature-text">맞춤 제작 가능</span>
                </li>
                <li class="feature-item">
                  <span class="feature-text">로얄살루트 증정 혜택</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div class="content-section">
            <h2 class="section-title">문의 및 예약</h2>
            <div class="section-content">
              <div class="contact-info">
                <p class="contact-description">자세한 내용은 마쓰구골프로 문의해주세요.</p>
                <div class="phone-section">
                  <p class="phone-number"><strong>전화: 080-028-8888</strong></p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="gallery-section">
            <h2 class="section-title">제품 이미지</h2>
            <div class="section-content">
              <div class="image-gallery">
                <div class="gallery-item">
                  <img src="/mas9golf/blog/images/post-1-hot-summer-perfect-swing-royal-salute-gift-event-gallery-1.png" alt="제품 이미지 1" class="gallery-image">
                </div>
                <div class="gallery-item">
                  <img src="/mas9golf/blog/images/post-1-hot-summer-perfect-swing-royal-salute-gift-event-gallery-2.png" alt="제품 이미지 2" class="gallery-image">
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <style>
          .blog-post-content {
            max-width: 800px;
            margin: 0 auto;
            padding: 24px;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.7;
            color: #1a1a1a;
            font-size: 18px;
          }
          
          .post-meta {
            text-align: center;
            margin-bottom: 3rem;
            color: #666;
            font-size: 16px;
            font-weight: 500;
          }
          
          .post-meta span {
            margin: 0 12px;
          }
          
          .featured-image {
            width: 100%;
            max-width: 800px;
            height: auto;
            border-radius: 8px;
            margin: 32px 0;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            display: block;
          }
          
          .content-section {
            margin: 4rem 0;
            padding: 0;
          }
          
          .section-title {
            font-size: 28px;
            font-weight: 700;
            color: #1a1a1a;
            margin: 0 0 2rem 0;
            line-height: 1.3;
            letter-spacing: -0.02em;
          }
          
          .section-content {
            margin: 0;
          }
          
          .feature-list {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          
          .feature-item {
            padding: 16px 0;
            border-bottom: 1px solid #f0f0f0;
            position: relative;
            padding-left: 24px;
          }
          
          .feature-item:last-child {
            border-bottom: none;
          }
          
          .feature-item:before {
            content: "•";
            color: #2563eb;
            font-weight: bold;
            position: absolute;
            left: 0;
            font-size: 20px;
          }
          
          .feature-text {
            font-size: 18px;
            line-height: 1.6;
            color: #374151;
          }
          
          .contact-info {
            text-align: center;
            background: #f8fafc;
            padding: 2rem;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
          }
          
          .contact-description {
            font-size: 18px;
            color: #64748b;
            margin-bottom: 1.5rem;
            line-height: 1.6;
          }
          
          .phone-section {
            background: #ffffff;
            padding: 1.5rem 2rem;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.04);
          }
          
          .phone-number {
            font-size: 20px;
            color: #1e40af;
            font-weight: 600;
            margin: 0;
            line-height: 1.4;
          }
          
          .gallery-section {
            margin: 4rem 0;
          }
          
          .image-gallery {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin: 2rem 0;
          }
          
          .gallery-item {
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }
          
          .gallery-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          }
          
          .gallery-image {
            width: 100%;
            height: auto;
            display: block;
          }
          
          /* 모바일 최적화 */
          @media (max-width: 768px) {
            .blog-post-content {
              padding: 20px;
              font-size: 16px;
            }
            
            .post-meta {
              font-size: 14px;
              margin-bottom: 2rem;
            }
            
            .section-title {
              font-size: 24px;
              margin-bottom: 1.5rem;
            }
            
            .feature-text {
              font-size: 16px;
            }
            
            .contact-description {
              font-size: 16px;
            }
            
            .phone-number {
              font-size: 18px;
            }
            
            .image-gallery {
              grid-template-columns: 1fr;
              gap: 1.5rem;
            }
            
            .contact-info {
              padding: 1.5rem;
            }
            
            .phone-section {
              padding: 1rem 1.5rem;
            }
          }
          
          /* 태블릿 최적화 */
          @media (min-width: 769px) and (max-width: 1024px) {
            .blog-post-content {
              padding: 32px;
            }
            
            .image-gallery {
              grid-template-columns: repeat(2, 1fr);
            }
          }
          
          /* 대형 화면 최적화 */
          @media (min-width: 1025px) {
            .blog-post-content {
              padding: 40px;
            }
            
            .section-title {
              font-size: 32px;
            }
            
            .feature-text {
              font-size: 19px;
            }
            
            .contact-description {
              font-size: 19px;
            }
            
            .phone-number {
              font-size: 22px;
            }
          }
        </style>
    `;
    
    // 데이터 업데이트
    postData.content = universalContent;
    postData.updated_at = new Date().toISOString();
    
    console.log(`📝 범용 블로그 콘텐츠 길이: ${postData.content.length}자`);
    
    // 파일 저장
    await fs.writeFile(postFilePath, JSON.stringify(postData, null, 2), 'utf8');
    
    console.log('✅ 절제된 범용 블로그 템플릿으로 변환 완료');
    
    // API 파일들 업데이트
    console.log('🔄 API 파일들 업데이트 중...');
    
    const posts = [postData];
    
    // posts.js 업데이트
    const postsApiContent = `// Blog posts API endpoint
export default function handler(req, res) {
  const { page = 1, limit = 10 } = req.query;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  
  // Import the posts data
  const posts = ${JSON.stringify(posts, null, 2)};
  
  const paginatedPosts = posts.slice(startIndex, endIndex);
  
  res.status(200).json({
    posts: paginatedPosts,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(posts.length / limit),
      totalPosts: posts.length,
      hasNext: endIndex < posts.length,
      hasPrev: startIndex > 0
    }
  });
}`;
    
    await fs.writeFile(path.join(__dirname, '../pages/api/blog/posts.js'), postsApiContent, 'utf8');
    console.log('  ✅ posts.js 업데이트 완료');
    
    // [slug].js 업데이트
    const slugApiContent = `// Individual blog post API endpoint
export default function handler(req, res) {
  const { slug } = req.query;
  
  // Import the posts data
  const posts = ${JSON.stringify(posts, null, 2)};
  
  const post = posts.find(p => p.slug === slug);
  
  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }
  
  // Find related posts (same category, excluding current post)
  const relatedPosts = posts
    .filter(p => p.category === post.category && p.id !== post.id)
    .slice(0, 3);
  
  res.status(200).json({
    post,
    relatedPosts
  });
}`;
    
    await fs.writeFile(path.join(__dirname, '../pages/api/blog/[slug].js'), slugApiContent, 'utf8');
    console.log('  ✅ [slug].js 업데이트 완료');
    
    console.log('\n🎉 절제된 범용 블로그 템플릿 변환 완료!');
    console.log('📊 개선된 특징:');
    console.log(`  📝 폰트: Inter + 시스템 폰트 (가독성 향상)`);
    console.log(`  📏 폰트 크기: 18px (기본) → 19px (대형 화면)`);
    console.log(`  🎨 절제된 디자인: 그라데이션 제거, 단순화`);
    console.log(`  📱 완벽한 반응형: 모바일/태블릿/데스크톱`);
    console.log(`  🔤 범용적 느낌: 상업적 요소 최소화`);
    
  } catch (error) {
    console.error('❌ 범용 블로그 템플릿 변환 중 오류 발생:', error);
  }
}

// 스크립트 실행
if (require.main === module) {
  convertToUniversalBlog()
    .then(() => {
      console.log('\n🚀 절제된 범용 블로그 템플릿 변환 작업 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = { convertToUniversalBlog };
