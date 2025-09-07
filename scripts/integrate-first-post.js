const fs = require('fs').promises;
const path = require('path');

// 첫 번째 게시물을 블로그 시스템에 통합하는 스크립트
async function integrateFirstPost() {
  try {
    console.log('🔄 첫 번째 게시물 통합 시작...');
    
    // 마이그레이션된 게시물 파일 찾기
    const migratedDir = path.join(__dirname, '../mas9golf/migrated-posts');
    const files = await fs.readdir(migratedDir);
    const postFile = files.find(file => file.startsWith('post-1-') && file.endsWith('.json'));
    
    if (!postFile) {
      console.error('❌ 마이그레이션된 게시물 파일을 찾을 수 없습니다.');
      return;
    }
    
    const postFilePath = path.join(migratedDir, postFile);
    const postData = JSON.parse(await fs.readFile(postFilePath, 'utf8'));
    
    console.log(`📄 게시물 로드: ${postData.title}`);
    console.log(`🔗 슬러그: ${postData.slug}`);
    
    // 게시물 데이터를 배열로 변환
    const posts = [postData];
    
    // API 파일들 업데이트
    console.log('📝 API 파일들 업데이트 중...');
    
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
    
    // 이미지 파일들을 public 디렉토리로 복사
    console.log('📸 이미지 파일 복사 중...');
    const sourceImagesDir = path.join(migratedDir, 'images');
    const targetImagesDir = path.join(__dirname, '../public/mas9golf/blog/images');
    
    try {
      const imageFiles = await fs.readdir(sourceImagesDir);
      const postImages = imageFiles.filter(file => file.includes(postData.slug));
      
      console.log(`  📊 복사할 이미지 수: ${postImages.length}개`);
      
      for (const imageFile of postImages) {
        const srcPath = path.join(sourceImagesDir, imageFile);
        const destPath = path.join(targetImagesDir, imageFile);
        
        try {
          await fs.copyFile(srcPath, destPath);
          console.log(`  ✅ 이미지 복사: ${imageFile}`);
        } catch (error) {
          console.log(`  ❌ 이미지 복사 실패: ${imageFile} - ${error.message}`);
        }
      }
      
    } catch (error) {
      console.error('❌ 이미지 복사 중 오류:', error.message);
    }
    
    console.log('\n🎉 첫 번째 게시물 통합 완료!');
    console.log('📊 통합 결과:');
    console.log(`  📄 게시물: ${postData.title}`);
    console.log(`  🔗 URL: /blog/${postData.slug}`);
    console.log(`  🖼️ 이미지: ${postData.images.length + 1}개 (featured + gallery)`);
    console.log(`  📁 API 파일: 업데이트 완료`);
    
  } catch (error) {
    console.error('❌ 통합 중 오류 발생:', error);
  }
}

// 스크립트 실행
if (require.main === module) {
  integrateFirstPost()
    .then(() => {
      console.log('\n🚀 첫 번째 게시물 통합 작업 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = { integrateFirstPost };
