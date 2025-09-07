const fs = require('fs').promises;
const path = require('path');

// 마이그레이션된 게시물의 내용을 수정하는 스크립트
async function fixMigratedPostsContent() {
  try {
    console.log('🔧 마이그레이션된 게시물 내용 수정 시작...');
    
    const dataPath = path.join(__dirname, '../data/migrated-blog-posts.json');
    const posts = JSON.parse(await fs.readFile(dataPath, 'utf8'));
    
    console.log(`📋 총 게시물 수: ${posts.length}개`);
    
    // 마이그레이션된 게시물들 (ID 20, 21) 수정
    const migratedPosts = posts.filter(post => post.migration_source === 'wix-automated');
    console.log(`🔄 수정할 마이그레이션된 게시물: ${migratedPosts.length}개`);
    
    for (const post of migratedPosts) {
      console.log(`\n📝 게시물 수정 중: ${post.title.substring(0, 50)}...`);
      
      // 게시물 내용을 실제 HTML로 수정
      if (post.id === 20) {
        post.content = `
        <div class="blog-post-content">
          <h2>새해 특별 혜택! 프리미엄 골프 드라이버와 액세서리 단 30분께만 증정!</h2>
          
          <div class="featured-image">
            <img src="${post.featured_image}" alt="${post.title}" style="width: 100%; max-width: 600px; height: auto; border-radius: 8px; margin: 20px 0;">
          </div>
          
          <p><strong>마쓰구골프 고반발 드라이버로 비거리를 늘려보세요!</strong></p>
          
          <p>체력 부담 없이 더 멀리 보내는 고반발 드라이버! 비거리 최대 30m 증가, 겨울 한정 특별 혜택으로 만나보세요. 지금 마쓰구 골프에서 확인하세요!</p>
          
          <h3>🎯 주요 특징</h3>
          <ul>
            <li>고반발 드라이버 기술 적용</li>
            <li>비거리 향상 효과 (최대 30m)</li>
            <li>전문 피팅 서비스</li>
            <li>맞춤 제작 가능</li>
            <li>겨울 한정 특별 혜택</li>
          </ul>
          
          <h3>📞 문의 및 예약</h3>
          <p>자세한 내용은 마쓰구골프로 문의해주세요.</p>
          <p><strong>전화: 080-028-8888</strong></p>
          
          <div class="gallery">
            <h3>제품 이미지</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0;">
              ${post.images.slice(0, 6).map(img => `
                <img src="${img.localPath}" alt="${img.alt}" style="width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              `).join('')}
            </div>
          </div>
        </div>
        `;
        
        post.excerpt = "체력 부담 없이 더 멀리 보내는 고반발 드라이버! 비거리 최대 30m 증가, 겨울 한정 특별 혜택으로 만나보세요. 지금 마쓰구 골프에서 확인하세요!";
        
      } else if (post.id === 21) {
        post.content = `
        <div class="blog-post-content">
          <h2>MASGOLF – 초고반발 드라이버 피팅 전문 브랜드 | 비거리 최대 +25m 증가</h2>
          
          <div class="featured-image">
            <img src="${post.featured_image}" alt="${post.title}" style="width: 100%; max-width: 600px; height: auto; border-radius: 8px; margin: 20px 0;">
          </div>
          
          <p><strong>MASGOLF(마스골프)는 초고반발 드라이버 피팅 전문 브랜드입니다.</strong></p>
          
          <p>JFE·DAIDO 티타늄, NGS 샤프트 적용, 전국 맞춤 피팅 서비스로 비거리 최대 +25m 증가 효과를 경험해보세요! 전문 피팅과 맞춤 제작으로 골프 실력을 향상시키세요.</p>
          
          <h3>🎯 주요 특징</h3>
          <ul>
            <li>JFE·DAIDO 티타늄 소재</li>
            <li>NGS 샤프트 적용</li>
            <li>비거리 최대 +25m 증가</li>
            <li>전국 맞춤 피팅 서비스</li>
            <li>전문 피팅과 맞춤 제작</li>
          </ul>
          
          <h3>🔧 피팅 과정</h3>
          <ol>
            <li>스윙 분석 및 측정</li>
            <li>맞춤형 드라이버 설계</li>
            <li>프로토타입 제작</li>
            <li>테스트 및 조정</li>
            <li>최종 제품 완성</li>
          </ol>
          
          <h3>📞 문의 및 예약</h3>
          <p>자세한 내용은 마쓰구골프로 문의해주세요.</p>
          <p><strong>전화: 080-028-8888</strong></p>
          
          <div class="gallery">
            <h3>제품 이미지</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0;">
              ${post.images.slice(0, 6).map(img => `
                <img src="${img.localPath}" alt="${img.alt}" style="width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              `).join('')}
            </div>
          </div>
        </div>
        `;
        
        post.excerpt = "MASGOLF(마스골프)는 초고반발 드라이버 피팅 전문 브랜드입니다. JFE·DAIDO 티타늄, NGS 샤프트 적용, 전국 맞춤 피팅 서비스로 비거리 최대 +25m 증가 효과를 경험해보세요!";
      }
      
      // 메타 설명도 업데이트
      post.meta_description = post.excerpt;
      
      // 업데이트 시간 갱신
      post.updated_at = new Date().toISOString();
      
      console.log(`  ✅ 게시물 내용 수정 완료`);
    }
    
    // 수정된 데이터 저장
    await fs.writeFile(dataPath, JSON.stringify(posts, null, 2), 'utf8');
    
    // API 파일들 업데이트
    await updateApiFiles(posts);
    
    console.log('\n🎉 마이그레이션된 게시물 내용 수정 완료!');
    console.log(`📊 수정된 게시물: ${migratedPosts.length}개`);
    
  } catch (error) {
    console.error('❌ 게시물 내용 수정 중 오류 발생:', error);
  }
}

async function updateApiFiles(posts) {
  try {
    console.log('🔄 API 파일들 업데이트 중...');
    
    // API 파일들 경로
    const apiPostsPath = path.join(__dirname, '../pages/api/blog/posts.js');
    const apiSlugPath = path.join(__dirname, '../pages/api/blog/[slug].js');
    
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
    
    await fs.writeFile(apiPostsPath, postsApiContent, 'utf8');
    console.log('  ✅ posts.js 업데이트 완료');
    
    // [slug].js 업데이트
    const slugApiContent = `// Individual blog post API endpoint
export default function handler(req, res) {
  const { slug } = req.query;
  
  // Import the posts data
  const posts = ${JSON.stringify(posts, null, 2)};
  
  const post = posts.find(p => p.slug === slug);
  
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
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
    
    await fs.writeFile(apiSlugPath, slugApiContent, 'utf8');
    console.log('  ✅ [slug].js 업데이트 완료');
    
  } catch (error) {
    console.error('❌ API 파일 업데이트 실패:', error.message);
  }
}

// 스크립트 실행
if (require.main === module) {
  fixMigratedPostsContent()
    .then(() => {
      console.log('\n🚀 마이그레이션된 게시물 내용 수정 작업 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = { fixMigratedPostsContent };
