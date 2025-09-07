const fs = require('fs').promises;
const path = require('path');

// 첫 번째 게시물 콘텐츠 정리 스크립트
async function cleanFirstPostContent() {
  try {
    console.log('🧹 첫 번째 게시물 콘텐츠 정리 시작...');
    
    const postFilePath = path.join(__dirname, '../mas9golf/migrated-posts/post-1-hot-summer-perfect-swing-royal-salute-gift-event.json');
    const postData = JSON.parse(await fs.readFile(postFilePath, 'utf8'));
    
    console.log(`📄 원본 콘텐츠 길이: ${postData.content.length}자`);
    
    // 깔끔한 HTML 콘텐츠 생성
    const cleanContent = `
        <div class="blog-post-content">
          <h2>뜨거운 여름, 완벽한 스윙 로얄살루트 증정 행사</h2>
          
          <div class="featured-image">
            <img src="/mas9golf/blog/images/post-1-hot-summer-perfect-swing-royal-salute-gift-event-featured.jpg" alt="뜨거운 여름, 완벽한 스윙 로얄살루트 증정 행사" style="width: 100%; max-width: 600px; height: auto; border-radius: 8px; margin: 20px 0;">
          </div>
          
          <p><strong>마쓰구골프에서 뜨거운 여름, 완벽한 스윙을 위한 특별한 혜택을 제공합니다!</strong></p>
          
          <p>로얄살루트 증정 행사와 함께 고반발 드라이버의 놀라운 성능을 경험해보세요. 전문 피팅과 맞춤 제작으로 골프 실력을 향상시키세요.</p>
          
          <h3>🎯 주요 특징</h3>
          <ul>
            <li>고반발 드라이버 기술 적용</li>
            <li>비거리 향상 효과</li>
            <li>전문 피팅 서비스</li>
            <li>맞춤 제작 가능</li>
            <li>로얄살루트 증정 혜택</li>
          </ul>
          
          <h3>📞 문의 및 예약</h3>
          <p>자세한 내용은 마쓰구골프로 문의해주세요.</p>
          <p><strong>전화: 080-028-8888</strong></p>
          
          <div class="gallery">
            <h3>제품 이미지</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0;">
              <img src="/mas9golf/blog/images/post-1-hot-summer-perfect-swing-royal-salute-gift-event-gallery-1.jpg" alt="제품 이미지 1" style="width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <img src="/mas9golf/blog/images/post-1-hot-summer-perfect-swing-royal-salute-gift-event-gallery-2.jpg" alt="제품 이미지 2" style="width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <img src="/mas9golf/blog/images/post-1-hot-summer-perfect-swing-royal-salute-gift-event-gallery-3.jpg" alt="제품 이미지 3" style="width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <img src="/mas9golf/blog/images/post-1-hot-summer-perfect-swing-royal-salute-gift-event-gallery-4.jpg" alt="제품 이미지 4" style="width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            </div>
          </div>
        </div>
    `;
    
    // 데이터 업데이트
    postData.content = cleanContent;
    postData.excerpt = "마쓰구골프에서 뜨거운 여름, 완벽한 스윙을 위한 특별한 혜택을 제공합니다! 로얄살루트 증정 행사와 함께 고반발 드라이버의 놀라운 성능을 경험해보세요.";
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
    
    console.log('\n🎉 첫 번째 게시물 콘텐츠 정리 완료!');
    console.log('📊 정리 결과:');
    console.log(`  📄 콘텐츠 길이: ${postData.content.length}자 (기존 대비 대폭 단축)`);
    console.log(`  🖼️ 이미지: 5개 (featured + gallery)`);
    console.log(`  🔗 URL: /blog/${postData.slug}`);
    
  } catch (error) {
    console.error('❌ 콘텐츠 정리 중 오류 발생:', error);
  }
}

// 스크립트 실행
if (require.main === module) {
  cleanFirstPostContent()
    .then(() => {
      console.log('\n🚀 콘텐츠 정리 작업 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = { cleanFirstPostContent };
