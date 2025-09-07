const fs = require('fs').promises;
const path = require('path');

// 퍼널 페이지에서 고급 브랜드 블로그 생성
async function createPremiumBlogFromFunnel() {
  try {
    console.log('🎯 퍼널 페이지에서 고급 브랜드 블로그 생성 시작...');
    
    // 퍼널 HTML 파일 읽기
    const funnelHtmlPath = path.join(__dirname, '../public/versions/funnel-2025-07-live.html');
    const funnelHtml = await fs.readFile(funnelHtmlPath, 'utf8');
    
    console.log(`📄 퍼널 HTML 파일 읽기 완료: ${funnelHtml.length}자`);
    
    // 퍼널에서 이미지 경로들 추출
    const imageMatches = funnelHtml.match(/src="([^"]*\.(jpg|jpeg|png|gif|webp|svg))"/gi) || [];
    const backgroundImageMatches = funnelHtml.match(/background-image:\s*url\(['"]?([^'"]*\.(jpg|jpeg|png|gif|webp|svg))['"]?\)/gi) || [];
    
    console.log(`🖼️ 발견된 이미지: ${imageMatches.length}개`);
    console.log(`🎨 발견된 배경 이미지: ${backgroundImageMatches.length}개`);
    
    // 고급 브랜드 블로그 콘텐츠 생성
    const premiumBlogContent = `
        <div class="premium-blog-content">
          <!-- 히어로 섹션 -->
          <div class="hero-section">
            <div class="hero-background">
              <div class="hero-overlay"></div>
            </div>
            <div class="hero-content">
              <div class="hero-badge">
                <span class="badge-text">7월 한정 썸머 스페셜</span>
                <span class="badge-gift">최대 21년 로얄살루트 700ml</span>
              </div>
              <h1 class="hero-title">
                <span class="title-line-1">뜨거운 여름,</span>
                <span class="title-line-2 gold-gradient">완벽한 스윙</span>
              </h1>
              <p class="hero-subtitle">품격 있는 퍼포먼스를 위한 준비</p>
              <div class="hero-cta">
                <button class="cta-button">
                  <i class="fas fa-flag"></i>
                  나만의 맞춤 클럽 찾기
                </button>
              </div>
            </div>
          </div>
          
          <!-- 프리미엄 특징 섹션 -->
          <div class="premium-features-section">
            <div class="section-header">
              <div class="section-icon premium-icon">
                <i class="fas fa-trophy"></i>
              </div>
              <h2 class="section-title">프리미엄 특징</h2>
            </div>
            <div class="features-grid">
              <div class="feature-card premium-card">
                <div class="feature-icon">
                  <i class="fas fa-bolt"></i>
                </div>
                <h3 class="feature-title">고반발 드라이버 기술</h3>
                <p class="feature-description">최신 고반발 기술로 평균 25m 비거리 증가를 경험하세요.</p>
              </div>
              <div class="feature-card premium-card">
                <div class="feature-icon">
                  <i class="fas fa-cog"></i>
                </div>
                <h3 class="feature-title">맞춤 제작 서비스</h3>
                <p class="feature-description">50-60대 골퍼를 위한 전문적인 맞춤 설계와 제작 서비스.</p>
              </div>
              <div class="feature-card premium-card">
                <div class="feature-icon">
                  <i class="fas fa-gift"></i>
                </div>
                <h3 class="feature-title">로얄살루트 증정</h3>
                <p class="feature-description">최대 21년 로얄살루트 700ml 증정으로 더욱 특별한 경험을 선사합니다.</p>
              </div>
            </div>
          </div>
          
          <!-- 전문 상담 섹션 -->
          <div class="consultation-section">
            <div class="section-header">
              <div class="section-icon premium-icon">
                <i class="fas fa-phone"></i>
              </div>
              <h2 class="section-title">전문 상담 및 예약</h2>
            </div>
            <div class="consultation-content">
              <div class="consultation-card">
                <div class="phone-display">
                  <div class="phone-icon">
                    <i class="fas fa-phone-alt"></i>
                  </div>
                  <div class="phone-info">
                    <p class="phone-number">080-028-8888</p>
                    <p class="consultation-text">무료 전문 상담</p>
                    <p class="urgency-text">선착순 한정</p>
                  </div>
                </div>
                <div class="consultation-buttons">
                  <button class="consultation-btn primary">
                    <i class="fas fa-calendar-alt"></i>
                    상담 예약하기
                  </button>
                  <button class="consultation-btn secondary">
                    <i class="fas fa-comments"></i>
                    카카오톡 상담
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 제품 갤러리 섹션 -->
          <div class="gallery-section">
            <div class="section-header">
              <div class="section-icon premium-icon">
                <i class="fas fa-images"></i>
              </div>
              <h2 class="section-title">제품 갤러리</h2>
            </div>
            <div class="gallery-grid">
              <div class="gallery-item premium-gallery-item">
                <div class="gallery-image">
                  <img src="/mas9golf/blog/images/post-1-hot-summer-perfect-swing-royal-salute-gift-event-featured.png" alt="MAS 드라이버 메인 이미지" class="gallery-img">
                  <div class="gallery-overlay">
                    <i class="fas fa-search-plus"></i>
                  </div>
                </div>
                <div class="gallery-caption">
                  <h4>MAS 고반발 드라이버</h4>
                  <p>최신 기술이 적용된 프리미엄 드라이버</p>
                </div>
              </div>
              <div class="gallery-item premium-gallery-item">
                <div class="gallery-image">
                  <img src="/mas9golf/blog/images/post-1-hot-summer-perfect-swing-royal-salute-gift-event-gallery-1.png" alt="드라이버 디테일 이미지" class="gallery-img">
                  <div class="gallery-overlay">
                    <i class="fas fa-search-plus"></i>
                  </div>
                </div>
                <div class="gallery-caption">
                  <h4>정밀한 디자인</h4>
                  <p>세심하게 설계된 클럽 헤드 디자인</p>
                </div>
              </div>
              <div class="gallery-item premium-gallery-item">
                <div class="gallery-image">
                  <img src="/mas9golf/blog/images/post-1-hot-summer-perfect-swing-royal-salute-gift-event-gallery-2.png" alt="로얄살루트 증정품" class="gallery-img">
                  <div class="gallery-overlay">
                    <i class="fas fa-search-plus"></i>
                  </div>
                </div>
                <div class="gallery-caption">
                  <h4>로얄살루트 증정</h4>
                  <p>최대 21년 로얄살루트 700ml 증정</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <style>
          /* 프리미엄 블로그 스타일 */
          .premium-blog-content {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.7;
            color: #1a1a1a;
            max-width: 1200px;
            margin: 0 auto;
            padding: 0;
          }
          
          /* 히어로 섹션 */
          .hero-section {
            position: relative;
            min-height: 80vh;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }
          
          .hero-background {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('/mas9golf/blog/images/post-1-hot-summer-perfect-swing-royal-salute-gift-event-featured.png') center/cover;
            opacity: 0.3;
          }
          
          .hero-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.8) 100%);
          }
          
          .hero-content {
            position: relative;
            z-index: 2;
            text-align: center;
            color: white;
            padding: 2rem;
          }
          
          .hero-badge {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            padding: 1rem 2rem;
            border-radius: 50px;
            margin-bottom: 2rem;
            display: inline-block;
            box-shadow: 0 10px 30px rgba(220, 38, 38, 0.3);
          }
          
          .badge-text {
            display: block;
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
          }
          
          .badge-gift {
            display: block;
            font-size: 0.9rem;
            opacity: 0.9;
          }
          
          .hero-title {
            font-size: 4rem;
            font-weight: 900;
            margin: 2rem 0;
            line-height: 1.1;
          }
          
          .title-line-1 {
            display: block;
            color: white;
          }
          
          .title-line-2 {
            display: block;
            background: linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            filter: drop-shadow(0 0 20px rgba(255,215,0,0.5));
          }
          
          .hero-subtitle {
            font-size: 1.5rem;
            margin-bottom: 3rem;
            opacity: 0.9;
            font-weight: 300;
          }
          
          .cta-button {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            color: white;
            border: none;
            padding: 1.5rem 3rem;
            font-size: 1.2rem;
            font-weight: 600;
            border-radius: 50px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 10px 30px rgba(220, 38, 38, 0.3);
            display: inline-flex;
            align-items: center;
            gap: 1rem;
          }
          
          .cta-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 15px 40px rgba(220, 38, 38, 0.4);
          }
          
          /* 프리미엄 특징 섹션 */
          .premium-features-section {
            padding: 6rem 2rem;
            background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
          }
          
          .section-header {
            display: flex;
            align-items: center;
            gap: 1.5rem;
            margin-bottom: 4rem;
            justify-content: center;
          }
          
          .premium-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 2rem;
            box-shadow: 0 10px 30px rgba(220, 38, 38, 0.3);
          }
          
          .section-title {
            font-size: 3rem;
            font-weight: 800;
            color: #1a1a1a;
            margin: 0;
          }
          
          .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 3rem;
            max-width: 1000px;
            margin: 0 auto;
          }
          
          .premium-card {
            background: white;
            padding: 3rem 2rem;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.1);
            text-align: center;
            transition: all 0.3s ease;
            border: 1px solid rgba(0,0,0,0.05);
          }
          
          .premium-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 30px 80px rgba(0,0,0,0.15);
          }
          
          .feature-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 2rem;
            color: #dc2626;
            font-size: 2rem;
          }
          
          .feature-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 1rem;
          }
          
          .feature-description {
            font-size: 1.1rem;
            color: #6b7280;
            line-height: 1.6;
          }
          
          /* 상담 섹션 */
          .consultation-section {
            padding: 6rem 2rem;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            color: white;
          }
          
          .consultation-content {
            max-width: 800px;
            margin: 0 auto;
          }
          
          .consultation-card {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(20px);
            border-radius: 30px;
            padding: 3rem;
            border: 1px solid rgba(255,255,255,0.2);
          }
          
          .phone-display {
            display: flex;
            align-items: center;
            gap: 2rem;
            margin-bottom: 3rem;
            justify-content: center;
          }
          
          .phone-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
          }
          
          .phone-number {
            font-size: 2.5rem;
            font-weight: 800;
            margin: 0;
            color: white;
          }
          
          .consultation-text {
            font-size: 1.2rem;
            margin: 0.5rem 0;
            opacity: 0.9;
          }
          
          .urgency-text {
            font-size: 1rem;
            color: #fbbf24;
            margin: 0;
            font-weight: 600;
          }
          
          .consultation-buttons {
            display: flex;
            gap: 1.5rem;
            justify-content: center;
            flex-wrap: wrap;
          }
          
          .consultation-btn {
            padding: 1.2rem 2.5rem;
            border: none;
            border-radius: 50px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 0.8rem;
          }
          
          .consultation-btn.primary {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            color: white;
            box-shadow: 0 10px 30px rgba(220, 38, 38, 0.3);
          }
          
          .consultation-btn.secondary {
            background: rgba(255,255,255,0.1);
            color: white;
            border: 2px solid rgba(255,255,255,0.3);
          }
          
          .consultation-btn:hover {
            transform: translateY(-3px);
          }
          
          .consultation-btn.primary:hover {
            box-shadow: 0 15px 40px rgba(220, 38, 38, 0.4);
          }
          
          /* 갤러리 섹션 */
          .gallery-section {
            padding: 6rem 2rem;
            background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
          }
          
          .gallery-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 3rem;
            max-width: 1000px;
            margin: 0 auto;
          }
          
          .premium-gallery-item {
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
          }
          
          .premium-gallery-item:hover {
            transform: translateY(-10px);
            box-shadow: 0 30px 80px rgba(0,0,0,0.15);
          }
          
          .gallery-image {
            position: relative;
            overflow: hidden;
            height: 250px;
          }
          
          .gallery-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
          }
          
          .gallery-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s ease;
            color: white;
            font-size: 2rem;
          }
          
          .premium-gallery-item:hover .gallery-overlay {
            opacity: 1;
          }
          
          .premium-gallery-item:hover .gallery-img {
            transform: scale(1.1);
          }
          
          .gallery-caption {
            padding: 2rem;
          }
          
          .gallery-caption h4 {
            font-size: 1.3rem;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 0.5rem;
          }
          
          .gallery-caption p {
            color: #6b7280;
            line-height: 1.6;
          }
          
          /* 반응형 디자인 */
          @media (max-width: 768px) {
            .hero-title {
              font-size: 2.5rem;
            }
            
            .section-title {
              font-size: 2rem;
            }
            
            .features-grid {
              grid-template-columns: 1fr;
              gap: 2rem;
            }
            
            .gallery-grid {
              grid-template-columns: 1fr;
              gap: 2rem;
            }
            
            .phone-display {
              flex-direction: column;
              text-align: center;
            }
            
            .consultation-buttons {
              flex-direction: column;
              align-items: center;
            }
            
            .consultation-btn {
              width: 100%;
              max-width: 300px;
            }
          }
        </style>
    `;
    
    // 게시물 데이터 업데이트
    const postFilePath = path.join(__dirname, '../mas9golf/migrated-posts/post-1-hot-summer-perfect-swing-royal-salute-gift-event.json');
    const postData = JSON.parse(await fs.readFile(postFilePath, 'utf8'));
    
    console.log(`📄 현재 제목: ${postData.title}`);
    
    // 프리미엄 콘텐츠로 업데이트
    postData.content = premiumBlogContent;
    postData.updated_at = new Date().toISOString();
    
    // 메타 정보도 업데이트
    postData.excerpt = "7월 한정 썸머 스페셜! 최대 21년 로얄살루트 증정. MAS 드라이버로 평균 25m 비거리 증가. 50-60대 골퍼 맞춤 설계.";
    postData.meta_description = "뜨거운 여름, 완벽한 스윙을 위한 프리미엄 골프 드라이버. 고반발 기술로 비거리 25m 증가, 로얄살루트 증정 혜택.";
    postData.keywords = ["마스골프", "MASGOLF", "골프드라이버", "비거리증가", "로얄살루트", "여름골프", "골프클럽", "고반발드라이버"];
    
    console.log(`📝 프리미엄 콘텐츠 길이: ${postData.content.length}자`);
    
    // 파일 저장
    await fs.writeFile(postFilePath, JSON.stringify(postData, null, 2), 'utf8');
    
    console.log('✅ 프리미엄 블로그 콘텐츠 생성 완료');
    
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
    
    console.log('\n🎉 프리미엄 브랜드 블로그 생성 완료!');
    console.log('📊 업그레이드된 특징:');
    console.log(`  🎨 퍼널 스타일의 히어로 섹션`);
    console.log(`  💎 프리미엄 카드 디자인`);
    console.log(`  🌟 골드 그라데이션 텍스트`);
    console.log(`  📱 완벽한 반응형 디자인`);
    console.log(`  🎯 고급스러운 CTA 버튼들`);
    console.log(`  🖼️ 인터랙티브 갤러리`);
    
    return postData;
    
  } catch (error) {
    console.error('❌ 프리미엄 블로그 생성 중 오류 발생:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  createPremiumBlogFromFunnel()
    .then((postData) => {
      console.log('\n🚀 프리미엄 브랜드 블로그 생성 작업 완료!');
      console.log(`📄 생성된 게시물: ${postData.title}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = { createPremiumBlogFromFunnel };
