const fs = require('fs').promises;
const path = require('path');

// 마이그레이션된 게시물 디렉토리
const migratedDir = path.join(__dirname, '../mas9golf/migrated-posts');
const dataDir = path.join(__dirname, '../data');
const publicDir = path.join(__dirname, '../public');

async function integrateMigratedPosts() {
  try {
    console.log('🔄 마이그레이션된 게시물 통합 시작...');
    
    // 기존 블로그 데이터 읽기
    const existingDataPath = path.join(dataDir, 'migrated-blog-posts.json');
    let existingPosts = [];
    
    try {
      const existingData = await fs.readFile(existingDataPath, 'utf8');
      existingPosts = JSON.parse(existingData);
      console.log(`📋 기존 게시물 수: ${existingPosts.length}개`);
    } catch (error) {
      console.log('📋 기존 데이터가 없습니다. 새로 생성합니다.');
    }
    
    // 마이그레이션된 게시물 파일들 읽기
    const files = await fs.readdir(migratedDir);
    const postFiles = files.filter(file => file.endsWith('.json') && file.startsWith('post-'));
    
    console.log(`📝 마이그레이션된 게시물 파일 수: ${postFiles.length}개`);
    
    const newPosts = [];
    
    for (const file of postFiles) {
      try {
        const filePath = path.join(migratedDir, file);
        const postData = await fs.readFile(filePath, 'utf8');
        const post = JSON.parse(postData);
        
        // 게시물 데이터 정리 및 최적화
        const optimizedPost = {
          id: existingPosts.length + newPosts.length + 1,
          title: post.title.replace(/"/g, ''), // 따옴표 제거
          slug: post.slug,
          content: post.content || '게시물 내용을 불러오는 중입니다...',
          excerpt: post.excerpt || post.content?.substring(0, 200) + '...' || '게시물 요약을 불러오는 중입니다...',
          featured_image: post.featured_image,
          meta_title: post.meta_title || `${post.title} | MASGOLF High-Rebound Driver`,
          meta_description: post.meta_description || post.content?.substring(0, 160) + '...' || 'MASGOLF 고반발 드라이버 전문 브랜드',
          keywords: post.keywords || ['고반발 드라이버', '골프 드라이버', 'MASGOLF'],
          category: post.category || 'golf-driver',
          tags: post.tags || ['고반발드라이버', '골프드라이버', 'MASGOLF'],
          author: post.author || '마쓰구골프',
          published_at: post.published_at || new Date().toISOString(),
          created_at: post.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'published',
          images: post.images || [],
          original_url: post.original_url || '',
          migration_source: 'wix-automated'
        };
        
        newPosts.push(optimizedPost);
        console.log(`  ✅ ${post.title.substring(0, 50)}... 통합 완료`);
        
      } catch (error) {
        console.error(`  ❌ ${file} 처리 중 오류:`, error.message);
      }
    }
    
    // 기존 게시물과 새 게시물 병합
    const allPosts = [...existingPosts, ...newPosts];
    
    // 통합된 데이터 저장
    await fs.writeFile(existingDataPath, JSON.stringify(allPosts, null, 2), 'utf8');
    
    // 이미지 파일들을 public 디렉토리로 복사
    const imagesDir = path.join(migratedDir, 'images');
    const publicImagesDir = path.join(publicDir, 'mas9golf', 'blog', 'images');
    
    try {
      await fs.mkdir(publicImagesDir, { recursive: true });
      
      const imageFiles = await fs.readdir(imagesDir);
      for (const imageFile of imageFiles) {
        const srcPath = path.join(imagesDir, imageFile);
        const destPath = path.join(publicImagesDir, imageFile);
        
        try {
          await fs.copyFile(srcPath, destPath);
          console.log(`  🖼️ 이미지 복사: ${imageFile}`);
        } catch (error) {
          console.error(`  ❌ 이미지 복사 실패: ${imageFile}`, error.message);
        }
      }
    } catch (error) {
      console.error('❌ 이미지 디렉토리 생성 실패:', error.message);
    }
    
    // API 파일들 업데이트
    await updateApiFiles(allPosts);
    
    console.log('\n🎉 마이그레이션된 게시물 통합 완료!');
    console.log(`📊 총 게시물 수: ${allPosts.length}개`);
    console.log(`🆕 새로 추가된 게시물: ${newPosts.length}개`);
    console.log(`📁 데이터 저장 위치: ${existingDataPath}`);
    console.log(`🖼️ 이미지 저장 위치: ${publicImagesDir}`);
    
  } catch (error) {
    console.error('❌ 통합 중 오류 발생:', error);
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
  integrateMigratedPosts()
    .then(() => {
      console.log('\n🚀 마이그레이션된 게시물 통합 작업 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = { integrateMigratedPosts };
