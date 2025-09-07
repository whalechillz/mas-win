const fs = require('fs').promises;
const path = require('path');

// 새로운 이미지로 API 파일들을 업데이트하는 스크립트
async function updateApiWithNewImages() {
  try {
    console.log('🔄 새로운 이미지로 API 파일들 업데이트 시작...');
    
    const dataPath = path.join(__dirname, '../data/migrated-blog-posts.json');
    const posts = JSON.parse(await fs.readFile(dataPath, 'utf8'));
    
    console.log(`📋 총 게시물 수: ${posts.length}개`);
    
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
    
    // 새로운 이미지 파일들을 public 디렉토리로 복사
    const sourceDir = path.join(__dirname, '../mas9golf/migrated-posts/images');
    const targetDir = path.join(__dirname, '../public/mas9golf/blog/images');
    
    try {
      const files = await fs.readdir(sourceDir);
      const newImageFiles = files.filter(file => 
        file.includes('featured') || file.includes('gallery')
      );
      
      console.log(`📸 새로운 이미지 파일 수: ${newImageFiles.length}개`);
      
      for (const file of newImageFiles) {
        const srcPath = path.join(sourceDir, file);
        const destPath = path.join(targetDir, file);
        
        try {
          await fs.copyFile(srcPath, destPath);
          console.log(`  ✅ 이미지 복사: ${file}`);
        } catch (error) {
          console.log(`  ❌ 이미지 복사 실패: ${file} - ${error.message}`);
        }
      }
      
    } catch (error) {
      console.error('❌ 이미지 복사 중 오류:', error.message);
    }
    
    console.log('\n🎉 API 파일들 업데이트 완료!');
    
  } catch (error) {
    console.error('❌ API 업데이트 중 오류 발생:', error);
  }
}

// 스크립트 실행
if (require.main === module) {
  updateApiWithNewImages()
    .then(() => {
      console.log('\n🚀 API 파일들 업데이트 작업 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = { updateApiWithNewImages };
