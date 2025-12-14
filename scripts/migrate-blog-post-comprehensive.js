/**
 * 블로그 글 종합 마이그레이션 스크립트
 * 강석 글 최적화 패턴을 기반으로 최고 수준의 마이그레이션 수행
 * 
 * 사용법: node scripts/migrate-blog-post-comprehensive.js <blogPostId>
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// 단계별 마이그레이션 실행
async function migrateBlogPostComprehensive(blogPostId) {
  console.log(`\n🚀 블로그 글 #${blogPostId} 종합 마이그레이션 시작...\n`);
  console.log('='.repeat(80));
  
  try {
    // 1단계: 현재 상태 확인
    console.log('\n📊 1단계: 현재 상태 확인\n');
    const statusResponse = await fetch(`${API_BASE_URL}/api/admin/organize-images-by-blog?blogPostId=${blogPostId}`);
    if (!statusResponse.ok) {
      throw new Error('상태 확인 실패');
    }
    const statusData = await statusResponse.json();
    const result = statusData.results?.[0];
    
    if (!result) {
      throw new Error('블로그 글을 찾을 수 없습니다.');
    }
    
    console.log(`📝 글 제목: ${result.blogPost.title}`);
    console.log(`📅 발행일: ${result.blogPost.published_at || result.blogPost.created_at}`);
    console.log(`📁 목표 폴더: ${result.blogPost.folderName}`);
    console.log(`📸 추출된 이미지: ${result.totalExtractedImages || 0}개`);
    console.log(`📦 Storage에서 찾은 이미지: ${result.totalImages || 0}개\n`);
    
    // 2단계: 이미지 폴더 정렬
    console.log('📁 2단계: 이미지 폴더 정렬\n');
    const organizeResponse = await fetch(`${API_BASE_URL}/api/admin/organize-images-by-blog`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        blogPostId: blogPostId, 
        moveImages: true 
      })
    });
    
    if (!organizeResponse.ok) {
      const errorData = await organizeResponse.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.details || '이미지 정렬 실패');
    }
    
    const organizeData = await organizeResponse.json();
    const movedCount = organizeData.summary?.moved || 0;
    const skippedCount = organizeData.summary?.skipped || 0;
    const errorCount = organizeData.summary?.errors || 0;
    
    console.log(`✅ 이미지 정렬 완료:`);
    console.log(`   이동: ${movedCount}개`);
    console.log(`   스킵: ${skippedCount}개`);
    if (errorCount > 0) {
      console.log(`   오류: ${errorCount}개`);
    }
    console.log('');
    
    // Storage 동기화 대기
    if (movedCount > 0) {
      console.log('⏳ Storage 동기화 대기 중... (10초)');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
    
    // 3단계: 메타데이터 동기화
    console.log('📝 3단계: 메타데이터 동기화\n');
    const syncResponse = await fetch(`${API_BASE_URL}/api/admin/sync-blog-with-dedupe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blogPostId,
        organizeImages: false, // 이미 정렬했으므로 false
        syncMetadata: true,
        removeDuplicates: false // 신중하게 처리
      })
    });
    
    if (!syncResponse.ok) {
      const errorData = await syncResponse.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.details || '메타데이터 동기화 실패');
    }
    
    const syncData = await syncResponse.json();
    const metadataCreated = syncData.metadataCreated || syncData.summary?.metadataCreated || 0;
    const metadataUpdated = syncData.metadataUpdated || syncData.summary?.metadataUpdated || 0;
    
    console.log(`✅ 메타데이터 동기화 완료:`);
    if (metadataCreated > 0) {
      console.log(`   생성: ${metadataCreated}개`);
    }
    if (metadataUpdated > 0) {
      console.log(`   업데이트: ${metadataUpdated}개`);
    }
    console.log('');
    
    // 4단계: 최종 검증
    console.log('🔍 4단계: 최종 검증\n');
    const verifyResponse = await fetch(`${API_BASE_URL}/api/admin/verify-blog-images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blogPostId: blogPostId,
        checkStorage: true,
        checkPublicUrl: true,
        checkMetadata: true,
        checkContentParsing: true
      })
    });
    
    if (!verifyResponse.ok) {
      const errorData = await verifyResponse.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.details || '검증 실패');
    }
    
    const verifyData = await verifyResponse.json();
    const verifyResult = verifyData.results?.[0];
    
    if (verifyResult) {
      console.log(`📊 검증 결과:`);
      console.log(`   총 이미지: ${verifyResult.totalImages || 0}개`);
      console.log(`   Storage 존재: ${verifyResult.existsInStorage || 0}개`);
      console.log(`   Public URL 접근 가능: ${verifyResult.accessible || 0}개`);
      console.log(`   메타데이터 존재: ${verifyResult.hasMetadata || 0}개`);
      console.log(`   문제 없음: ${verifyResult.allValid ? '✅' : '❌'}`);
      
      if (!verifyResult.allValid && verifyResult.issues && verifyResult.issues.length > 0) {
        console.log(`\n⚠️  발견된 문제 (${verifyResult.issues.length}개):`);
        verifyResult.issues.slice(0, 5).forEach(issue => {
          console.log(`   - ${issue}`);
        });
        if (verifyResult.issues.length > 5) {
          console.log(`   ... 외 ${verifyResult.issues.length - 5}개`);
        }
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ 종합 마이그레이션 완료!');
    console.log('='.repeat(80));
    
    return {
      success: true,
      movedCount,
      skippedCount,
      errorCount,
      metadataCreated,
      metadataUpdated,
      verifyResult
    };
    
  } catch (error) {
    console.error('\n❌ 마이그레이션 실패:', error.message);
    if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
      console.error('💡 서버가 실행 중인지 확인하세요: npm run dev');
    }
    throw error;
  }
}

// 메인 실행
async function main() {
  const blogPostId = process.argv[2];
  
  if (!blogPostId) {
    console.error('❌ 사용법: node scripts/migrate-blog-post-comprehensive.js <blogPostId>');
    console.log('\n예시:');
    console.log('  node scripts/migrate-blog-post-comprehensive.js 123  # 강석 글');
    console.log('  node scripts/migrate-blog-post-comprehensive.js 122  # 다음 글');
    process.exit(1);
  }
  
  console.log(`📍 API Base URL: ${API_BASE_URL}`);
  if (API_BASE_URL.includes('localhost')) {
    console.log('💡 로컬 서버를 사용합니다.\n');
  }
  
  try {
    await migrateBlogPostComprehensive(parseInt(blogPostId));
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 실행 실패:', error.message);
    process.exit(1);
  }
}

main();

