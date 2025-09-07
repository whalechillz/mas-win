const fs = require('fs').promises;
const path = require('path');

// 7월 퍼널 스타일의 고급스러운 아이콘으로 블로그 콘텐츠 업데이트
async function updateBlogWithPremiumIcons() {
  try {
    console.log('🎨 7월 퍼널 스타일 아이콘으로 블로그 콘텐츠 업데이트 시작...');
    
    // 게시물 데이터 업데이트
    const postFilePath = path.join(__dirname, '../mas9golf/migrated-posts/post-1-hot-summer-perfect-swing-royal-salute-gift-event.json');
    const postData = JSON.parse(await fs.readFile(postFilePath, 'utf8'));
    
    console.log(`📄 현재 제목: ${postData.title}`);
    
    // 7월 퍼널 스타일의 고급스러운 콘텐츠 생성
    const premiumContent = `
        <div class="blog-post-content">
          <div class="post-meta">
            <span class="author">고반발드라이버</span>
            <span class="date">7월 9일</span>
            <span class="read-time">0분 분량</span>
          </div>
          
          <div class="main-banner">
            <img src="/mas9golf/blog/images/post-1-hot-summer-perfect-swing-royal-salute-gift-event-featured.png" alt="뜨거운 여름, 완벽한 스윙 로얄살루트 증정 행사" class="featured-image">
          </div>
          
          <div class="content-section premium-section">
            <div class="section-header">
              <div class="section-icon">
                <div class="w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h2 class="section-title">🎯 주요 특징</h2>
            </div>
            <div class="section-content">
              <ul class="feature-list premium-list">
                <li class="premium-feature-item">
                  <div class="feature-icon">
                    <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span>고반발 드라이버 기술 적용</span>
                </li>
                <li class="premium-feature-item">
                  <div class="feature-icon">
                    <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <span>비거리 향상 효과</span>
                </li>
                <li class="premium-feature-item">
                  <div class="feature-icon">
                    <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span>전문 피팅 서비스</span>
                </li>
                <li class="premium-feature-item">
                  <div class="feature-icon">
                    <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                  </div>
                  <span>맞춤 제작 가능</span>
                </li>
                <li class="premium-feature-item">
                  <div class="feature-icon">
                    <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <span>로얄살루트 증정 혜택</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div class="content-section premium-section">
            <div class="section-header">
              <div class="section-icon">
                <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
              </div>
              <h2 class="section-title">📞 문의 및 예약</h2>
            </div>
            <div class="section-content">
              <div class="contact-info">
                <p class="contact-description">자세한 내용은 마쓰구골프로 문의해주세요.</p>
                <div class="phone-section">
                  <div class="phone-icon">
                    <svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <p class="phone-number"><strong>전화: 080-028-8888</strong></p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="gallery-section premium-section">
            <div class="section-header">
              <div class="section-icon">
                <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <h2 class="section-title">제품 이미지</h2>
            </div>
            <div class="section-content">
              <div class="image-gallery premium-gallery">
                <div class="gallery-item">
                  <img src="/mas9golf/blog/images/post-1-hot-summer-perfect-swing-royal-salute-gift-event-gallery-1.png" alt="제품 이미지 1" class="gallery-image">
                  <div class="gallery-overlay">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
                <div class="gallery-item">
                  <img src="/mas9golf/blog/images/post-1-hot-summer-perfect-swing-royal-salute-gift-event-gallery-2.png" alt="제품 이미지 2" class="gallery-image">
                  <div class="gallery-overlay">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
              </div>
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
          
          .post-meta {
            text-align: center;
            margin-bottom: 2rem;
            color: #666;
            font-size: 0.9rem;
          }
          
          .post-meta span {
            margin: 0 10px;
          }
          
          .featured-image {
            width: 100%;
            max-width: 800px;
            height: auto;
            border-radius: 12px;
            margin: 20px 0;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            display: block;
          }
          
          .premium-section {
            margin: 3rem 0;
            background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
            border-radius: 20px;
            padding: 2rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.05);
            border: 1px solid rgba(0,0,0,0.05);
          }
          
          .section-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 2rem;
          }
          
          .section-icon {
            flex-shrink: 0;
          }
          
          .section-title {
            font-size: 2rem;
            font-weight: 800;
            color: #1e293b;
            margin: 0;
            background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          
          .premium-list {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          
          .premium-feature-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem 0;
            border-bottom: 1px solid rgba(0,0,0,0.05);
            transition: all 0.3s ease;
          }
          
          .premium-feature-item:last-child {
            border-bottom: none;
          }
          
          .premium-feature-item:hover {
            background: rgba(255,255,255,0.5);
            border-radius: 12px;
            padding-left: 1rem;
            padding-right: 1rem;
            transform: translateX(5px);
          }
          
          .feature-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
          }
          
          .contact-info {
            text-align: center;
          }
          
          .contact-description {
            font-size: 1.1rem;
            color: #64748b;
            margin-bottom: 1.5rem;
          }
          
          .phone-section {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            padding: 1.5rem 2rem;
            border-radius: 16px;
            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.15);
          }
          
          .phone-icon {
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          }
          
          .phone-number {
            font-size: 1.5rem;
            color: #1e40af;
            font-weight: 700;
            margin: 0;
          }
          
          .premium-gallery {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin: 2rem 0;
          }
          
          .gallery-item {
            position: relative;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
          }
          
          .gallery-item:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
          }
          
          .gallery-image {
            width: 100%;
            height: auto;
            display: block;
            transition: transform 0.3s ease;
          }
          
          .gallery-item:hover .gallery-image {
            transform: scale(1.05);
          }
          
          .gallery-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: all 0.3s ease;
          }
          
          .gallery-item:hover .gallery-overlay {
            opacity: 1;
          }
          
          @media (max-width: 768px) {
            .blog-post-content {
              padding: 15px;
            }
            
            .premium-section {
              padding: 1.5rem;
              margin: 2rem 0;
            }
            
            .section-header {
              flex-direction: column;
              text-align: center;
              gap: 0.5rem;
            }
            
            .section-title {
              font-size: 1.5rem;
            }
            
            .premium-gallery {
              grid-template-columns: 1fr;
              gap: 1rem;
            }
            
            .phone-section {
              flex-direction: column;
              gap: 0.5rem;
              padding: 1rem;
            }
            
            .phone-number {
              font-size: 1.2rem;
            }
          }
        </style>
    `;
    
    // 데이터 업데이트
    postData.content = premiumContent;
    postData.updated_at = new Date().toISOString();
    
    console.log(`📝 프리미엄 콘텐츠 길이: ${postData.content.length}자`);
    
    // 파일 저장
    await fs.writeFile(postFilePath, JSON.stringify(postData, null, 2), 'utf8');
    
    console.log('✅ 7월 퍼널 스타일 아이콘으로 콘텐츠 업데이트 완료');
    
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
    
    console.log('\n🎉 7월 퍼널 스타일 아이콘 적용 완료!');
    console.log('📊 적용된 특징:');
    console.log(`  🎨 그라데이션 아이콘 배경`);
    console.log(`  ✨ 고급스러운 섹션 디자인`);
    console.log(`  🔥 7월 퍼널과 동일한 스타일`);
    console.log(`  📱 완벽한 모바일 최적화`);
    
  } catch (error) {
    console.error('❌ 프리미엄 아이콘 적용 중 오류 발생:', error);
  }
}

// 스크립트 실행
if (require.main === module) {
  updateBlogWithPremiumIcons()
    .then(() => {
      console.log('\n🚀 7월 퍼널 스타일 아이콘 적용 작업 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = { updateBlogWithPremiumIcons };
