/**
 * 블로그 글의 이미지 메타데이터 생성 (강제 재생성 포함)
 * 사용법: node scripts/generate-blog-image-metadata.js <blogPostId> [force]
 */

require('dotenv').config({ path: require('path').join(process.cwd(), '.env.local') });

async function generateBlogImageMetadata(blogPostId, force = false) {
  console.log(`🏷️ 블로그 글(ID: ${blogPostId}) 이미지 메타데이터 생성 시작...\n`);
  if (force) {
    console.log('⚠️ 강제 재생성 모드: 기존 메타데이터가 있어도 재생성합니다.\n');
  }
  console.log('='.repeat(80));
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    // sync-metadata-by-blog API 호출
    const response = await fetch(`${baseUrl}/api/admin/sync-metadata-by-blog`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        blogPostId: blogPostId,
        forceReanalyze: force // 강제 재생성 옵션
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ 메타데이터 생성 실패:', data.error || data.message);
      return;
    }
    
    console.log('='.repeat(80));
    console.log('✅ 이미지 메타데이터 생성 완료');
    console.log('='.repeat(80));
    console.log(`처리된 이미지: ${data.summary?.processed || 0}개`);
    console.log(`골프 이미지: ${data.summary?.golfCount || 0}개`);
    console.log(`일반 이미지: ${data.summary?.generalCount || 0}개`);
    console.log(`스킵된 이미지: ${data.summary?.skipped || 0}개`);
    console.log(`오류: ${data.summary?.errors || 0}개`);
    console.log('='.repeat(80));
    
    // 결과 상세 출력
    if (data.results && data.results.length > 0) {
      console.log('\n📋 처리 결과 상세:');
      data.results.forEach((result, idx) => {
        console.log(`\n${idx + 1}. ${result.url.substring(result.url.length - 60)}`);
        console.log(`   상태: ${result.status}`);
        if (result.reason) {
          console.log(`   이유: ${result.reason}`);
        }
        if (result.metadata) {
          console.log(`   ALT: ${result.metadata.alt_text || '(없음)'}`);
          console.log(`   Title: ${result.metadata.title || '(없음)'}`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.log('\n💡 서버가 실행 중인지 확인하세요: npm run dev');
  }
}

// 스크립트 실행
if (require.main === module) {
  const blogPostId = process.argv[2] ? parseInt(process.argv[2]) : null;
  const force = process.argv[3] === 'force' || process.argv[3] === 'true';
  
  if (!blogPostId) {
    console.error('❌ 사용법: node scripts/generate-blog-image-metadata.js <blogPostId> [force]');
    console.error('   force: 기존 메타데이터가 있어도 강제로 재생성');
    process.exit(1);
  }
  
  generateBlogImageMetadata(blogPostId, force)
    .then(() => {
      console.log('\n✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 오류 발생:', error);
      process.exit(1);
    });
}

module.exports = { generateBlogImageMetadata };
