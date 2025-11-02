// 블로그 이미지 분석 API 테스트 스크립트
// 옵션 1: API 직접 테스트

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testAnalyzeBlogImages() {
  console.log('📊 블로그 이미지 분석 API 테스트 시작...\n');
  
  try {
    console.log('📝 API 호출: POST /api/admin/analyze-all-blog-images');
    console.log('📝 요청 데이터: { dryRun: true }');
    
    const response = await fetch(`${BASE_URL}/api/admin/analyze-all-blog-images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dryRun: true })
    });
    
    console.log(`\n📡 응답 상태: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ 오류 응답:', errorData);
      throw new Error(errorData.error || errorData.details || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('\n✅ 분석 완료!\n');
    
    // 요약 정보 표시
    if (data.summary) {
      const summary = data.summary;
      console.log('📊 분석 결과 요약:');
      console.log('─'.repeat(50));
      console.log(`총 블로그 글: ${summary.totalBlogPosts || 0}개`);
      console.log(`고유 이미지 URL: ${summary.totalUniqueImageUrls || 0}개`);
      console.log(`Storage에서 찾음: ${summary.totalImagesFoundInStorage || 0}개`);
      console.log(`Storage에서 못 찾음: ${summary.totalImagesNotFoundInStorage || 0}개`);
      console.log(`중복 이미지 그룹: ${summary.duplicateGroupsCount || 0}개`);
      console.log(`처리된 이미지: ${summary.totalImagesProcessed || 0}개`);
      console.log(`총 중복 이미지: ${summary.totalDuplicateImages || 0}개`);
      console.log(`연결되지 않은 이미지: ${summary.unlinkedImagesCount || 0}개`);
      console.log(`Storage에 있지만 연결 안 된 이미지: ${summary.unlinkedStorageImagesCount || 0}개`);
      if (summary.totalExternalUrls > 0) {
        console.log(`🌐 외부 URL (다른 도메인): ${summary.totalExternalUrls}개`);
      }
      if (summary.totalExtractionFailed > 0) {
        console.log(`⚠️ 경로 추출 실패: ${summary.totalExtractionFailed}개`);
      }
      console.log('─'.repeat(50));
    }
    
    // 중복 이미지 그룹 상위 5개 표시
    if (data.duplicateGroups && data.duplicateGroups.length > 0) {
      console.log('\n🔄 중복 이미지 그룹 (상위 5개):');
      data.duplicateGroups.slice(0, 5).forEach((group, index) => {
        console.log(`\n${index + 1}. ${group.filename}`);
        console.log(`   개수: ${group.count}개`);
        console.log(`   블로그 연결 여부: ${group.hasBlogConnection ? '✅' : '❌'}`);
        console.log(`   보존: ${group.keepCount}개, 제거: ${group.removeCount}개`);
      });
    }
    
    // 연결되지 않은 이미지 상위 5개 표시
    if (data.unlinkedImages && data.unlinkedImages.length > 0) {
      console.log('\n🔗 연결되지 않은 이미지 (상위 5개):');
      data.unlinkedImages.slice(0, 5).forEach((img, index) => {
        console.log(`\n${index + 1}. ${img.fileName || img.url}`);
        console.log(`   경로: ${img.path || 'N/A'}`);
        console.log(`   Storage 존재: ${img.storageExists ? '✅' : '❌'}`);
      });
    }
    
    // Storage에서 못 찾은 이미지 상세 목록 표시
    if (data.notFoundInStorage && data.notFoundInStorage.length > 0) {
      console.log('\n❌ Storage에서 못 찾은 이미지:');
      console.log(`총 ${data.notFoundInStorage.length}개 (상위 10개 표시)`);
      data.notFoundInStorage.slice(0, 10).forEach((img, index) => {
        console.log(`\n${index + 1}. ${img.fileName || img.url}`);
        console.log(`   URL: ${img.url}`);
        console.log(`   경로: ${img.path || 'N/A'}`);
        console.log(`   블로그 글: ${img.blogPostTitles?.join(', ') || 'N/A'}`);
        console.log(`   블로그 ID: ${img.blogPostIds?.join(', ') || 'N/A'}`);
      });
    }
    
    // 더 많은 데이터가 있는지 확인
    if (data.hasMore) {
      console.log('\n⚠️ 더 많은 데이터가 있습니다:');
      if (data.hasMore.duplicateGroups) {
        console.log('  - 중복 이미지 그룹: 50개 이상');
      }
      if (data.hasMore.unlinkedImages) {
        console.log('  - 연결되지 않은 이미지: 50개 이상');
      }
      if (data.hasMore.unlinkedStorageImages) {
        console.log('  - Storage 연결 안 된 이미지: 50개 이상');
      }
    }
    
    console.log('\n✅ 테스트 완료!');
    
    return data;
    
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error.message);
    console.error('상세 오류:', error);
    process.exit(1);
  }
}

// Node.js 환경에서 실행
if (typeof require !== 'undefined' && require.main === module) {
  // fetch polyfill (Node.js < 18)
  if (typeof fetch === 'undefined') {
    const { default: fetch } = require('node-fetch');
    global.fetch = fetch;
  }
  
  testAnalyzeBlogImages()
    .then(() => {
      console.log('\n✅ 모든 테스트 통과');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ 테스트 실패:', error);
      process.exit(1);
    });
}

module.exports = { testAnalyzeBlogImages };

