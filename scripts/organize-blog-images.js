/**
 * 블로그 글의 이미지를 갤러리 폴더로 이동
 * 사용법: node scripts/organize-blog-images.js <blogPostId>
 */

require('dotenv').config({ path: require('path').join(process.cwd(), '.env.local') });

async function organizeBlogImages(blogPostId) {
  console.log(`🔧 블로그 글(ID: ${blogPostId}) 이미지 갤러리 이동 시작...\n`);
  console.log('='.repeat(80));
  
  try {
    // 1. 이미지 정렬 정보 조회
    const checkResponse = await fetch(`http://localhost:3000/api/admin/organize-images-by-blog?blogPostId=${blogPostId}`);
    const checkData = await checkResponse.json();
    
    if (!checkData.success) {
      console.error('❌ 이미지 정렬 정보 조회 실패:', checkData.error);
      return;
    }
    
    console.log(`📊 발견된 이미지: ${checkData.results[0]?.images?.length || 0}개\n`);
    
    // 2. 이미지 이동 실행
    const moveResponse = await fetch(`http://localhost:3000/api/admin/organize-images-by-blog`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        blogPostId: blogPostId,
        moveImages: true
      })
    });
    
    const moveData = await moveResponse.json();
    
    if (!moveData.success) {
      console.error('❌ 이미지 이동 실패:', moveData.error);
      return;
    }
    
    console.log('='.repeat(80));
    console.log('✅ 이미지 갤러리 이동 완료');
    console.log('='.repeat(80));
    console.log(`이동된 이미지: ${moveData.movedCount || 0}개`);
    console.log(`건너뛴 이미지: ${moveData.skippedCount || 0}개`);
    console.log(`오류: ${moveData.errorCount || 0}개`);
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.log('\n💡 서버가 실행 중인지 확인하세요: npm run dev');
  }
}

// 스크립트 실행
if (require.main === module) {
  const blogPostId = process.argv[2] ? parseInt(process.argv[2]) : null;
  
  if (!blogPostId) {
    console.error('❌ 사용법: node scripts/organize-blog-images.js <blogPostId>');
    process.exit(1);
  }
  
  organizeBlogImages(blogPostId)
    .then(() => {
      console.log('\n✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 오류 발생:', error);
      process.exit(1);
    });
}

module.exports = { organizeBlogImages };

