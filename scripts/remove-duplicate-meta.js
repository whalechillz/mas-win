const fs = require('fs').promises;
const path = require('path');

// 중복된 메타 정보 제거
async function removeDuplicateMeta() {
  try {
    console.log('🔍 중복된 메타 정보 제거 시작...');
    
    // 게시물 데이터 업데이트
    const postFilePath = path.join(__dirname, '../mas9golf/migrated-posts/post-1-hot-summer-perfect-swing-royal-salute-gift-event.json');
    const postData = JSON.parse(await fs.readFile(postFilePath, 'utf8'));
    
    console.log(`📄 현재 제목: ${postData.title}`);
    
    // 중복된 메타 정보가 포함된 콘텐츠에서 제거
    // post-meta 클래스를 가진 div 요소와 그 내용을 정규식으로 제거
    postData.content = postData.content.replace(
      /<div class="post-meta">[\s\S]*?<\/div>/g,
      ''
    );
    postData.updated_at = new Date().toISOString();
    
    console.log(`📝 메타 정보 제거 후 콘텐츠 길이: ${postData.content.length}자`);
    
    // 파일 저장
    await fs.writeFile(postFilePath, JSON.stringify(postData, null, 2), 'utf8');
    
    console.log('✅ 중복된 메타 정보 제거 완료');
    
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
    
    console.log('\n🎉 중복된 메타 정보 제거 완료!');
    console.log('📊 개선된 특징:');
    console.log(`  🗑️ 중복된 메타 정보 제거`);
    console.log(`  📝 깔끔한 콘텐츠 구조`);
    console.log(`  🎨 절제된 디자인 유지`);
    
  } catch (error) {
    console.error('❌ 중복 메타 정보 제거 중 오류 발생:', error);
  }
}

// 스크립트 실행
if (require.main === module) {
  removeDuplicateMeta()
    .then(() => {
      console.log('\n🚀 중복된 메타 정보 제거 작업 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = { removeDuplicateMeta };
