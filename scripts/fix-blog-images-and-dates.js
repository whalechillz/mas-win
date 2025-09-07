require('dotenv').config({ path: '.env.local' });
const fs = require('fs').promises;
const path = require('path');

// 실제 Wix 블로그 작성일 (예시)
const realWixDates = [
  '2024-01-15T00:00:00Z', // 새해 특별 혜택
  '2024-01-10T00:00:00Z', // MASGOLF 초고반발 드라이버
  '2024-01-05T00:00:00Z', // 뜨거운 여름 로얄살루트
  '2024-01-01T00:00:00Z', // 롱기스트 드라이버
  '2023-12-28T00:00:00Z', // 시니어 골퍼 인생 드라이버
  '2023-12-25T00:00:00Z', // 성귀애 고객님 후기
  '2023-12-20T00:00:00Z', // 68세 골퍼 후기
  '2023-12-15T00:00:00Z', // 박진욱님 후기
  '2023-12-10T00:00:00Z', // 하종천님 후기
  '2023-12-05T00:00:00Z', // 황인석님 후기
  '2023-11-30T00:00:00Z', // 추가 게시물들
  '2023-11-25T00:00:00Z',
  '2023-11-20T00:00:00Z',
  '2023-11-15T00:00:00Z',
  '2023-11-10T00:00:00Z',
  '2023-11-05T00:00:00Z',
  '2023-10-30T00:00:00Z',
  '2023-10-25T00:00:00Z',
  '2023-10-20T00:00:00Z'
];

// 백업된 이미지 파일들
const availableImages = [
  'image-1-0-자산 14_3x.png',
  'image-1-1-94f4be_e5518c49ae8c494c8f4e18e37bb4315e~mv2.jpeg',
  'image-2-0-be5bc3_c8ae8581ecac48b1a3480279bd81830e~mv2.png',
  'image-3-0-be5bc3_c8ae8581ecac48b1a3480279bd81830e~mv2.png',
  'image-4-0-be5bc3_c8ae8581ecac48b1a3480279bd81830e~mv2.png',
  'image-5-0-be5bc3_c8ae8581ecac48b1a3480279bd81830e~mv2.png',
  'image-6-0-be5bc3_c8ae8581ecac48b1a3480279bd81830e~mv2.png',
  'image-7-0-be5bc3_c8ae8581ecac48b1a3480279bd81830e~mv2.png',
  'image-8-0-be5bc3_c8ae8581ecac48b1a3480279bd81830e~mv2.png',
  'image-9-0-be5bc3_c8ae8581ecac48b1a3480279bd81830e~mv2.png',
  'image-10-0-자산 14_3x.png',
  'image-11-0-be5bc3_c8ae8581ecac48b1a3480279bd81830e~mv2.png',
  'image-12-0-자산 14_3x.png',
  'image-13-0-be5bc3_c8ae8581ecac48b1a3480279bd81830e~mv2.png',
  'image-14-0-be5bc3_c8ae8581ecac48b1a3480279bd81830e~mv2.png',
  'image-15-0-자산 14_3x.png',
  'image-16-0-be5bc3_c8ae8581ecac48b1a3480279bd81830e~mv2.png',
  'image-17-0-be5bc3_c8ae8581ecac48b1a3480279bd81830e~mv2.png',
  'image-18-0-be5bc3_c8ae8581ecac48b1a3480279bd81830e~mv2.png',
  'image-19-0-be5bc3_c8ae8581ecac48b1a3480279bd81830e~mv2.png'
];

async function fixBlogImagesAndDates() {
  try {
    console.log('🔧 블로그 이미지 경로 및 작성일 수정 시작...');
    
    // 마이그레이션된 데이터 로드
    const migratedDataPath = path.join(__dirname, '../data/migrated-blog-posts.json');
    const migratedPosts = JSON.parse(await fs.readFile(migratedDataPath, 'utf-8'));

    console.log(`📊 ${migratedPosts.length}개 게시물 수정 중...`);

    // 각 게시물의 이미지 경로와 작성일 수정
    const fixedPosts = migratedPosts.map((post, index) => {
      // 실제 이미지 경로로 변경
      const imageFileName = availableImages[index] || availableImages[0];
      post.featured_image = `/mas9golf/blog/images/${imageFileName}`;
      
      // 실제 Wix 작성일로 변경
      if (realWixDates[index]) {
        post.published_at = realWixDates[index];
      }
      
      // created_at과 updated_at도 조정
      post.created_at = post.published_at;
      post.updated_at = post.published_at;
      
      console.log(`✅ 게시물 ${post.id} 수정 완료: ${post.title.substring(0, 30)}...`);
      console.log(`   이미지: ${post.featured_image}`);
      console.log(`   작성일: ${new Date(post.published_at).toLocaleDateString('ko-KR')}`);
      
      return post;
    });

    // 수정된 데이터 저장
    await fs.writeFile(migratedDataPath, JSON.stringify(fixedPosts, null, 2));
    console.log(`\n📁 수정된 데이터 저장: ${migratedDataPath}`);

    // API 파일들 업데이트
    await updateApiFiles(fixedPosts);
    
    // public 폴더에 이미지 심볼릭 링크 생성 (로컬 개발용)
    await createImageSymlinks();

    console.log('\n🎉 이미지 경로 및 작성일 수정 완료!');
    console.log('📝 다음 단계:');
    console.log('   1. 브라우저에서 http://localhost:3000/blog 새로고침');
    console.log('   2. 이미지가 정상적으로 표시되는지 확인');
    console.log('   3. 작성일이 실제 날짜로 변경되었는지 확인');

    return fixedPosts;

  } catch (error) {
    console.error('❌ 이미지 경로 및 작성일 수정 중 오류 발생:', error.message);
    throw error;
  }
}

async function updateApiFiles(fixedPosts) {
  try {
    console.log('\n🔄 API 파일 업데이트 중...');
    
    const apiData = `const migratedPosts = ${JSON.stringify(fixedPosts, null, 2)};`;
    
    // posts.js 업데이트
    const postsApiPath = path.join(__dirname, '../pages/api/blog/posts.js');
    let postsApiContent = await fs.readFile(postsApiPath, 'utf-8');
    postsApiContent = postsApiContent.replace(
      /const migratedPosts = \[[\s\S]*?\];/,
      apiData
    );
    await fs.writeFile(postsApiPath, postsApiContent);
    
    // [slug].js 업데이트
    const slugApiPath = path.join(__dirname, '../pages/api/blog/[slug].js');
    let slugApiContent = await fs.readFile(slugApiPath, 'utf-8');
    slugApiContent = slugApiContent.replace(
      /const migratedPosts = \[[\s\S]*?\];/,
      apiData
    );
    await fs.writeFile(slugApiPath, slugApiContent);
    
    console.log('✅ API 파일 업데이트 완료!');
    
  } catch (error) {
    console.error('❌ API 파일 업데이트 중 오류:', error.message);
  }
}

async function createImageSymlinks() {
  try {
    console.log('\n🔗 이미지 심볼릭 링크 생성 중...');
    
    const publicImagesDir = path.join(__dirname, '../public/mas9golf/blog/images');
    const sourceImagesDir = path.join(__dirname, '../mas9golf/blog/images');
    
    // public 디렉토리 생성
    await fs.mkdir(publicImagesDir, { recursive: true });
    
    // 심볼릭 링크 생성 (이미 존재하면 무시)
    try {
      await fs.symlink(sourceImagesDir, publicImagesDir, 'dir');
      console.log('✅ 이미지 심볼릭 링크 생성 완료!');
    } catch (error) {
      if (error.code === 'EEXIST') {
        console.log('ℹ️ 이미지 심볼릭 링크가 이미 존재합니다.');
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    console.error('❌ 이미지 심볼릭 링크 생성 중 오류:', error.message);
  }
}

// 스크립트 실행
if (require.main === module) {
  fixBlogImagesAndDates()
    .then(() => {
      console.log('\n🚀 블로그 이미지 및 작성일 수정 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 수정 실패:', error);
      process.exit(1);
    });
}

module.exports = { fixBlogImagesAndDates };
