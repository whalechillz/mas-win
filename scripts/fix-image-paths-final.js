const fs = require('fs').promises;
const path = require('path');

// 마이그레이션된 게시물의 이미지 경로를 수정하는 스크립트
async function fixImagePathsFinal() {
  try {
    console.log('🔧 마이그레이션된 게시물 이미지 경로 수정 시작...');
    
    const dataPath = path.join(__dirname, '../data/migrated-blog-posts.json');
    const posts = JSON.parse(await fs.readFile(dataPath, 'utf8'));
    
    console.log(`📋 총 게시물 수: ${posts.length}개`);
    
    // 마이그레이션된 게시물들 (ID 20, 21) 수정
    const migratedPosts = posts.filter(post => post.migration_source === 'wix-automated');
    console.log(`🔄 수정할 마이그레이션된 게시물: ${migratedPosts.length}개`);
    
    for (const post of migratedPosts) {
      console.log(`\n📝 게시물 이미지 경로 수정 중: ${post.title.substring(0, 50)}...`);
      
      // featured_image 경로 수정
      if (post.featured_image && post.featured_image.startsWith('/images/')) {
        const imageName = post.featured_image.replace('/images/', '');
        post.featured_image = `/mas9golf/blog/images/${imageName}`;
        console.log(`  ✅ featured_image 경로 수정: ${post.featured_image}`);
      }
      
      // images 배열의 경로 수정
      if (post.images && Array.isArray(post.images)) {
        post.images.forEach((img, index) => {
          if (img.localPath && img.localPath.startsWith('/images/')) {
            const imageName = img.localPath.replace('/images/', '');
            img.localPath = `/mas9golf/blog/images/${imageName}`;
            console.log(`  ✅ images[${index}] 경로 수정: ${img.localPath}`);
          }
        });
      }
      
      // content 내의 이미지 경로 수정
      if (post.content && post.content.includes('/images/')) {
        post.content = post.content.replace(/\/images\//g, '/mas9golf/blog/images/');
        console.log(`  ✅ content 내 이미지 경로 수정 완료`);
      }
      
      // 업데이트 시간 갱신
      post.updated_at = new Date().toISOString();
    }
    
    // 수정된 데이터 저장
    await fs.writeFile(dataPath, JSON.stringify(posts, null, 2), 'utf8');
    
    // API 파일들 업데이트
    await updateApiFiles(posts);
    
    console.log('\n🎉 마이그레이션된 게시물 이미지 경로 수정 완료!');
    console.log(`📊 수정된 게시물: ${migratedPosts.length}개`);
    
  } catch (error) {
    console.error('❌ 이미지 경로 수정 중 오류 발생:', error);
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
  fixImagePathsFinal()
    .then(() => {
      console.log('\n🚀 마이그레이션된 게시물 이미지 경로 수정 작업 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = { fixImagePathsFinal };
