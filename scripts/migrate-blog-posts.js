require('dotenv').config({ path: '.env.local' });
const fs = require('fs').promises;
const path = require('path');

// 임시로 mock 데이터를 사용하여 마이그레이션 시뮬레이션
async function migrateBlogPosts() {
  try {
    console.log('🚀 블로그 게시물 마이그레이션 시작...');
    
    // 기존 SEO 최적화된 데이터 로드
    const optimizedPostsPath = path.join(__dirname, '../mas9golf/blog-posts-seo-optimized.json');
    const optimizedPostsData = JSON.parse(await fs.readFile(optimizedPostsPath, 'utf-8'));

    console.log(`📊 ${optimizedPostsData.length}개의 최적화된 블로그 게시물 데이터 로드 완료.`);

    // 마이그레이션된 데이터를 저장할 배열
    const migratedPosts = [];

    for (const post of optimizedPostsData) {
      // 실제 내용은 백업에서 가져와야 하지만, 현재는 임시 내용 사용
      const contentPlaceholder = `
        <h2>${post.title.replace(/"/g, '')}</h2>
        <p>${post.optimized.meta}</p>
        
        <h3>🎯 주요 특징</h3>
        <ul>
          <li>고반발 드라이버 기술 적용</li>
          <li>비거리 향상 효과</li>
          <li>전문 피팅 서비스</li>
          <li>맞춤 제작 가능</li>
        </ul>
        
        <h3>📞 문의 및 예약</h3>
        <p>자세한 내용은 마쓰구골프로 문의해주세요.</p>
      `;

      const excerptPlaceholder = post.optimized.meta.length > 150 
        ? post.optimized.meta.substring(0, 150) + '...' 
        : post.optimized.meta;

      // 카테고리 분류 로직
      let category = '일반';
      if (post.title.includes('시니어') || post.title.includes('60대') || post.title.includes('50대')) {
        category = '시니어 드라이버';
      } else if (post.title.includes('후기') || post.title.includes('라운딩')) {
        category = '고객 후기';
      } else if (post.title.includes('이벤트') || post.title.includes('혜택') || post.title.includes('증정')) {
        category = '이벤트';
      } else if (post.title.includes('피팅') || post.title.includes('맞춤')) {
        category = '골프 피팅';
      } else if (post.title.includes('고반발') || post.title.includes('드라이버')) {
        category = '고반발 드라이버';
      }

      const migratedPost = {
        id: post.index,
        title: post.title.replace(/"/g, ''),
        slug: post.optimized.url.replace('/post/', ''),
        content: contentPlaceholder,
        excerpt: excerptPlaceholder,
        featured_image: `/images/blog/post-${post.index}.jpg`, // 임시 이미지 경로
        meta_title: post.optimized.title,
        meta_description: post.optimized.meta,
        keywords: post.optimized.keywords.split(', ').map(k => k.trim()),
        category: category,
        tags: post.optimized.keywords.split(', ').map(k => k.trim()),
        author: '마쓰구골프',
        published_at: new Date(Date.now() - (post.index * 24 * 60 * 60 * 1000)).toISOString(), // 임시 날짜
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'published'
      };

      migratedPosts.push(migratedPost);
      
      if (post.index <= 5) {
        console.log(`✅ 게시물 ${post.index} 마이그레이션 완료: ${migratedPost.title}`);
      }
    }

    // 마이그레이션된 데이터를 JSON 파일로 저장
    const outputPath = path.join(__dirname, '../data/migrated-blog-posts.json');
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(migratedPosts, null, 2));

    console.log(`\n🎉 모든 블로그 게시물 마이그레이션 완료!`);
    console.log(`📁 마이그레이션된 데이터 저장: ${outputPath}`);
    console.log(`📊 총 ${migratedPosts.length}개 게시물 처리됨`);

    // API 파일에 마이그레이션된 데이터 적용
    await updateApiWithMigratedData(migratedPosts);

    return migratedPosts;

  } catch (error) {
    console.error('❌ 블로그 게시물 마이그레이션 중 오류 발생:', error.message);
    throw error;
  }
}

async function updateApiWithMigratedData(migratedPosts) {
  try {
    console.log('\n🔄 API 파일 업데이트 중...');
    
    // API 파일 경로
    const postsApiPath = path.join(__dirname, '../pages/api/blog/posts.js');
    const slugApiPath = path.join(__dirname, '../pages/api/blog/[slug].js');
    
    // 마이그레이션된 데이터를 API 파일에 적용
    const apiData = `const migratedPosts = ${JSON.stringify(migratedPosts, null, 2)};`;
    
    // posts.js 업데이트
    let postsApiContent = await fs.readFile(postsApiPath, 'utf-8');
    postsApiContent = postsApiContent.replace(
      /const mockPosts = \[[\s\S]*?\];/,
      apiData
    );
    postsApiContent = postsApiContent.replace(/mockPosts/g, 'migratedPosts');
    await fs.writeFile(postsApiPath, postsApiContent);
    
    // [slug].js 업데이트
    let slugApiContent = await fs.readFile(slugApiPath, 'utf-8');
    slugApiContent = slugApiContent.replace(
      /const mockPosts = \[[\s\S]*?\];/,
      apiData
    );
    slugApiContent = slugApiContent.replace(/mockPosts/g, 'migratedPosts');
    await fs.writeFile(slugApiPath, slugApiContent);
    
    console.log('✅ API 파일 업데이트 완료!');
    
  } catch (error) {
    console.error('❌ API 파일 업데이트 중 오류:', error.message);
  }
}

// 마이그레이션 실행
if (require.main === module) {
  migrateBlogPosts()
    .then(() => {
      console.log('\n🚀 블로그 시스템 활성화 완료!');
      console.log('📝 다음 단계:');
      console.log('   1. http://localhost:3000/blog 접속하여 블로그 목록 확인');
      console.log('   2. 개별 게시물 페이지 테스트');
      console.log('   3. Supabase 연결 후 실제 데이터베이스 연동');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 마이그레이션 실패:', error);
      process.exit(1);
    });
}

module.exports = { migrateBlogPosts };