require('dotenv').config({ path: '.env.local' });
const fs = require('fs').promises;
const path = require('path');

// 영어 파일명만 사용하는 이미지 목록
const englishImageFiles = [
  'image-1-0-be5bc3_c8ae8581ecac48b1a3480279bd81830e~mv2.png',
  'image-1-1-94f4be_e5518c49ae8c494c8f4e18e37bb4315e~mv2.jpeg',
  'image-2-0-be5bc3_c8ae8581ecac48b1a3480279bd81830e~mv2.png',
  'image-3-0-be5bc3_c8ae8581ecac48b1a3480279bd81830e~mv2.png',
  'image-4-0-be5bc3_c8ae8581ecac48b1a3480279bd81830e~mv2.png',
  'image-5-0-be5bc3_c8ae8581ecac48b1a3480279bd81830e~mv2.png',
  'image-6-0-be5bc3_c8ae8581ecac48b1a3480279bd81830e~mv2.png',
  'image-7-0-be5bc3_c8ae8581ecac48b1a3480279bd81830e~mv2.png',
  'image-8-0-be5bc3_c8ae8581ecac48b1a3480279bd81830e~mv2.png',
  'image-9-0-be5bc3_c8ae8581ecac48b1a3480279bd81830e~mv2.png',
  'image-10-0-be5bc3_c8ae8581ecac48b1a3480279bd81830e~mv2.png',
  'image-11-0-be5bc3_c8ae8581ecac48b1a3480279bd81830e~mv2.png',
  'image-12-0-be5bc3_c8ae8581ecac48b1a3480279bd81830e~mv2.png',
  'image-13-0-be5bc3_c8ae8581ecac48b1a3480279bd81830e~mv2.png',
  'image-14-0-be5bc3_c8ae8581ecac48b1a3480279bd81830e~mv2.png',
  'image-15-0-be5bc3_c8ae8581ecac48b1a3480279bd81830e~mv2.png',
  'image-16-0-be5bc3_c8ae8581ecac48b1a3480279bd81830e~mv2.png',
  'image-17-0-be5bc3_c8ae8581ecac48b1a3480279bd81830e~mv2.png',
  'image-18-0-be5bc3_c8ae8581ecac48b1a3480279bd81830e~mv2.png',
  'image-19-0-be5bc3_c8ae8581ecac48b1a3480279bd81830e~mv2.png'
];

async function fixImagePaths() {
  try {
    console.log('🔧 이미지 경로 수정 시작 (영어 파일명만 사용)...');
    
    // 마이그레이션된 데이터 로드
    const migratedDataPath = path.join(__dirname, '../data/migrated-blog-posts.json');
    const migratedPosts = JSON.parse(await fs.readFile(migratedDataPath, 'utf-8'));

    console.log(`📊 ${migratedPosts.length}개 게시물의 이미지 경로 수정 중...`);

    // 각 게시물의 이미지 경로를 영어 파일명으로 변경
    const fixedPosts = migratedPosts.map((post, index) => {
      // 영어 파일명 사용
      const imageFileName = englishImageFiles[index] || englishImageFiles[0];
      post.featured_image = `/mas9golf/blog/images/${imageFileName}`;
      
      console.log(`✅ 게시물 ${post.id} 이미지 경로 수정: ${imageFileName}`);
      
      return post;
    });

    // 수정된 데이터 저장
    await fs.writeFile(migratedDataPath, JSON.stringify(fixedPosts, null, 2));
    console.log(`\n📁 수정된 데이터 저장: ${migratedDataPath}`);

    // API 파일들 업데이트
    await updateApiFiles(fixedPosts);
    
    // 이미지 접근 테스트
    await testImageAccess();

    console.log('\n🎉 이미지 경로 수정 완료!');
    console.log('📝 다음 단계:');
    console.log('   1. 브라우저에서 http://localhost:3000/blog 새로고침');
    console.log('   2. 이미지가 정상적으로 표시되는지 확인');

    return fixedPosts;

  } catch (error) {
    console.error('❌ 이미지 경로 수정 중 오류 발생:', error.message);
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

async function testImageAccess() {
  try {
    console.log('\n🔍 이미지 접근 테스트 중...');
    
    const testImagePath = '/mas9golf/blog/images/image-1-0-be5bc3_c8ae8581ecac48b1a3480279bd81830e~mv2.png';
    const testUrl = `http://localhost:3000${testImagePath}`;
    
    console.log(`테스트 URL: ${testUrl}`);
    
    // 실제 파일 존재 확인
    const actualFilePath = path.join(__dirname, '../mas9golf/blog/images/image-1-0-be5bc3_c8ae8581ecac48b1a3480279bd81830e~mv2.png');
    const fileExists = await fs.access(actualFilePath).then(() => true).catch(() => false);
    
    if (fileExists) {
      console.log('✅ 이미지 파일이 실제로 존재합니다.');
    } else {
      console.log('❌ 이미지 파일이 존재하지 않습니다.');
    }
    
  } catch (error) {
    console.error('❌ 이미지 접근 테스트 중 오류:', error.message);
  }
}

// 스크립트 실행
if (require.main === module) {
  fixImagePaths()
    .then(() => {
      console.log('\n🚀 이미지 경로 수정 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 수정 실패:', error);
      process.exit(1);
    });
}

module.exports = { fixImagePaths };
