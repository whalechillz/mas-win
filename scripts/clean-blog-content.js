const fs = require('fs').promises;
const path = require('path');

// 블로그 콘텐츠를 깔끔하게 정리하는 스크립트
async function cleanBlogContent() {
  try {
    console.log('🧹 블로그 콘텐츠 정리 시작...');
    
    // 깔끔하고 간단한 콘텐츠 생성
    const cleanContent = `
        <div class="blog-post-content">
          <h1>뜨거운 여름, 완벽한 스윙 로얄살루트 증정 행사</h1>
          
          <div class="post-meta">
            <span class="author">고반발드라이버</span>
            <span class="date">7월 9일</span>
            <span class="read-time">0분 분량</span>
          </div>
          
          <div class="main-banner">
            <img src="/mas9golf/blog/images/post-1-hot-summer-perfect-swing-royal-salute-gift-event-featured.png" alt="뜨거운 여름, 완벽한 스윙 로얄살루트 증정 행사" class="featured-image">
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
          
          <div class="gallery-section">
            <h2>제품 이미지</h2>
            <div class="image-gallery">
              <img src="/mas9golf/blog/images/post-1-hot-summer-perfect-swing-royal-salute-gift-event-gallery-1.png" alt="제품 이미지 1" class="gallery-image">
              <img src="/mas9golf/blog/images/post-1-hot-summer-perfect-swing-royal-salute-gift-event-gallery-2.png" alt="제품 이미지 2" class="gallery-image">
            </div>
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
          
          .featured-image {
            width: 100%;
            max-width: 800px;
            height: auto;
            border-radius: 12px;
            margin: 20px 0;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            display: block;
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
          
          .gallery-section {
            margin: 3rem 0;
            text-align: center;
          }
          
          .gallery-section h2 {
            font-size: 1.8rem;
            color: #2c3e50;
            margin-bottom: 2rem;
          }
          
          .image-gallery {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 2rem 0;
          }
          
          .gallery-image {
            width: 100%;
            height: auto;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
          }
          
          .gallery-image:hover {
            transform: scale(1.02);
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
            
            .image-gallery {
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
    
    // 게시물 데이터 업데이트
    const postFilePath = path.join(__dirname, '../mas9golf/migrated-posts/post-1-hot-summer-perfect-swing-royal-salute-gift-event.json');
    const postData = JSON.parse(await fs.readFile(postFilePath, 'utf8'));
    
    postData.content = cleanContent;
    postData.updated_at = new Date().toISOString();
    
    console.log(`📝 정리된 콘텐츠 길이: ${postData.content.length}자`);
    
    // 파일 저장
    await fs.writeFile(postFilePath, JSON.stringify(postData, null, 2), 'utf8');
    
    console.log('✅ 게시물 콘텐츠 정리 완료');
    
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
    
    console.log('\n🎉 블로그 콘텐츠 정리 완료!');
    console.log('📊 정리 결과:');
    console.log(`  🗑️ 중복 레이아웃 제거: 퀴즈 섹션 삭제`);
    console.log(`  🖼️ 이미지 최적화: 2개 갤러리 이미지만 유지`);
    console.log(`  📱 반응형 디자인: PC/모바일 최적화`);
    console.log(`  🎨 깔끔한 디자인: 불필요한 요소 제거`);
    
  } catch (error) {
    console.error('❌ 콘텐츠 정리 중 오류 발생:', error);
  }
}

// 스크립트 실행
if (require.main === module) {
  cleanBlogContent()
    .then(() => {
      console.log('\n🚀 블로그 콘텐츠 정리 작업 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = { cleanBlogContent };
