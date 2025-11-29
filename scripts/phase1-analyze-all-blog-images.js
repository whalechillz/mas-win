/**
 * Phase 1: 블로그 이미지 전체 분석 스크립트
 * 
 * 목적: 모든 블로그 글의 이미지 현황 파악
 * - 중복 이미지 그룹 식별
 * - 외부 URL 및 깨진 링크 확인
 * - 갤러리 루트 폴더의 블로그 이미지 현황 파악
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const fs = require('fs');
const path = require('path');

async function analyzeAllBlogImages() {
  console.log('📊 Phase 1: 블로그 이미지 전체 분석 시작\n');
  console.log('='.repeat(60));
  
  try {
    console.log('📝 API 호출: POST /api/admin/analyze-all-blog-images');
    console.log('📝 요청 데이터: { dryRun: true }');
    console.log('⏳ 분석 중... (시간이 소요될 수 있습니다)\n');
    
    const response = await fetch(`${BASE_URL}/api/admin/analyze-all-blog-images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dryRun: true })
    });
    
    console.log(`📡 응답 상태: ${response.status} ${response.statusText}\n`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ 오류 응답:', errorData);
      
      if (response.status === 504) {
        console.error('\n⚠️ 타임아웃 발생!');
        console.error('💡 해결 방법:');
        console.error('   1. 관리자 UI에서 "블로그 이미지 분석" 버튼 클릭');
        console.error('   2. 또는 더 작은 배치로 처리');
        console.error('   3. 또는 특정 블로그 글만 분석');
      }
      
      throw new Error(errorData.error || errorData.details || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('✅ 분석 완료!\n');
    console.log('='.repeat(60));
    
    // 요약 정보 표시
    if (data.summary) {
      console.log('\n📊 분석 결과 요약\n');
      console.log(`총 블로그 글: ${data.summary.totalBlogPosts || 0}개`);
      console.log(`고유 이미지 URL: ${data.summary.uniqueImageUrls || 0}개`);
      console.log(`처리된 이미지: ${data.summary.processedImages || 0}개`);
      console.log(`Storage에서 찾음: ${data.summary.foundInStorage || 0}개`);
      console.log(`Storage에서 못 찾음: ${data.summary.notFoundInStorage || 0}개`);
      console.log(`외부 URL: ${data.summary.externalUrls || 0}개`);
      console.log(`경로 추출 실패: ${data.summary.pathExtractionFailed || 0}개`);
      console.log(`중복 이미지 그룹: ${data.summary.duplicateGroupsCount || 0}개`);
      console.log(`총 중복 이미지: ${data.summary.totalDuplicateImages || 0}개`);
      console.log(`연결되지 않은 이미지: ${data.summary.unconnectedImages || 0}개`);
    }
    
    // 중복 그룹 상세 정보
    if (data.duplicateGroups && data.duplicateGroups.length > 0) {
      console.log('\n🔄 중복 이미지 그룹 (상위 10개)\n');
      data.duplicateGroups.slice(0, 10).forEach((group, index) => {
        console.log(`${index + 1}. ${group.filename}`);
        console.log(`   - 중복 개수: ${group.count}개`);
        console.log(`   - 블로그 연결: ${group.hasBlogConnection ? '✅ 있음' : '❌ 없음'}`);
        if (group.images && group.images.length > 0) {
          group.images.slice(0, 3).forEach(img => {
            console.log(`   - ${img.path || img.url}`);
            console.log(`     사용: ${img.blogPostIds?.length || 0}개 글`);
          });
          if (group.images.length > 3) {
            console.log(`   - ... 외 ${group.images.length - 3}개`);
          }
        }
        console.log('');
      });
      
      if (data.duplicateGroups.length > 10) {
        console.log(`... 외 ${data.duplicateGroups.length - 10}개 그룹\n`);
      }
    }
    
    // 결과 저장
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupDir = path.join(process.cwd(), 'backup');
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const analysisFile = path.join(backupDir, `blog-image-analysis-${timestamp}.json`);
    const duplicateFile = path.join(backupDir, `blog-duplicate-groups-${timestamp}.json`);
    
    // 전체 분석 결과 저장
    fs.writeFileSync(analysisFile, JSON.stringify(data, null, 2), 'utf8');
    console.log(`\n💾 분석 결과 저장: ${analysisFile}`);
    
    // 중복 그룹만 별도 저장
    if (data.duplicateGroups && data.duplicateGroups.length > 0) {
      fs.writeFileSync(duplicateFile, JSON.stringify(data.duplicateGroups, null, 2), 'utf8');
      console.log(`💾 중복 그룹 저장: ${duplicateFile}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Phase 1 완료!');
    console.log('\n다음 단계: Phase 2 (발행일 순서로 글별 정리)');
    console.log('   - 강석 글부터 시작');
    console.log('   - 하루 5-10개 글씩 처리 권장');
    console.log('\n');
    
    return data;
    
  } catch (error) {
    console.error('\n❌ 분석 실패:', error.message);
    console.error('\n💡 대안 방법:');
    console.error('   1. 관리자 UI에서 실행: /admin/gallery → "블로그 이미지 분석" 버튼');
    console.error('   2. 서버가 실행 중인지 확인: npm run dev');
    console.error('   3. BASE_URL 환경 변수 확인');
    process.exit(1);
  }
}

// 실행
if (require.main === module) {
  analyzeAllBlogImages()
    .then(() => {
      console.log('✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { analyzeAllBlogImages };

