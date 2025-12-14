// 블로그 이미지 마이그레이션 실행 스크립트
// Phase 1: 전체 분석 → Phase 2: 글별 마이그레이션

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const API_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.masgolf.co.kr';
const BACKUP_DIR = path.join(process.cwd(), 'backup');

// 백업 디렉토리 생성
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Phase 1: 전체 분석
async function phase1AnalyzeAllBlogImages() {
  console.log('\n📊 Phase 1: 블로그 이미지 전체 분석 시작...\n');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/analyze-all-blog-images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dryRun: true })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.details || '분석 실패');
    }
    
    const data = await response.json();
    
    // 결과 저장
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const analysisFile = path.join(BACKUP_DIR, `blog-image-analysis-${timestamp}.json`);
    fs.writeFileSync(analysisFile, JSON.stringify(data, null, 2));
    
    console.log('✅ 분석 완료!');
    console.log(`📁 결과 저장: ${analysisFile}\n`);
    
    // 요약 출력
    const summary = data.summary || {};
    console.log('📊 분석 결과 요약:');
    console.log(`  - 총 블로그 글 수: ${summary.totalPosts || 0}`);
    console.log(`  - 총 이미지 URL 수 (고유): ${summary.uniqueImageUrls || 0}`);
    console.log(`  - Storage에서 찾은 이미지: ${summary.foundInStorage || 0}`);
    console.log(`  - Storage에서 못 찾은 이미지: ${summary.notFoundInStorage || 0}`);
    console.log(`  - 외부 URL 이미지: ${summary.externalUrls || 0}`);
    console.log(`  - 중복 이미지 그룹 수: ${summary.duplicateGroups || 0}`);
    console.log(`  - 연결되지 않은 이미지: ${summary.unlinkedImages || 0}\n`);
    
    return data;
  } catch (error) {
    console.error('❌ Phase 1 분석 실패:', error.message);
    throw error;
  }
}

// Phase 2: 특정 블로그 글 마이그레이션
async function phase2MigrateBlogPost(blogPostId, options = {}) {
  const { organizeImages = true, syncMetadata = true, removeDuplicates = false } = options;
  
  console.log(`\n🔄 Phase 2: 블로그 글 #${blogPostId} 마이그레이션 시작...\n`);
  
  try {
    // 1. 이미지 정렬
    if (organizeImages) {
      console.log('📁 이미지 폴더 정렬 중...');
      const organizeResponse = await fetch(`${API_BASE_URL}/api/admin/organize-images-by-blog?blogPostId=${blogPostId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!organizeResponse.ok) {
        const errorData = await organizeResponse.json();
        throw new Error(errorData.error || '이미지 정렬 실패');
      }
      
      const organizeData = await organizeResponse.json();
      console.log(`✅ 이미지 정렬 완료: ${organizeData.moved || 0}개 이동\n`);
      
      // 이미지 이동 후 대기 (Storage 동기화 대기)
      if (organizeData.moved > 0) {
        console.log('⏳ Storage 동기화 대기 중... (10초)');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
    
    // 2. 메타데이터 동기화
    if (syncMetadata) {
      console.log('📝 메타데이터 동기화 중...');
      const syncResponse = await fetch(`${API_BASE_URL}/api/admin/sync-blog-with-dedupe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blogPostId,
          organizeImages: false, // 이미 정렬했으므로 false
          syncMetadata: true,
          removeDuplicates
        })
      });
      
      if (!syncResponse.ok) {
        const errorData = await syncResponse.json();
        throw new Error(errorData.error || '메타데이터 동기화 실패');
      }
      
      const syncData = await syncResponse.json();
      console.log(`✅ 메타데이터 동기화 완료: ${syncData.metadataCreated || 0}개 생성\n`);
    }
    
    // 3. 검증
    console.log('🔍 마이그레이션 검증 중...');
    const verifyResponse = await fetch(`${API_BASE_URL}/api/admin/verify-blog-images?blogPostId=${blogPostId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!verifyResponse.ok) {
      const errorData = await verifyResponse.json();
      throw new Error(errorData.error || '검증 실패');
    }
    
    const verifyData = await verifyResponse.json();
    console.log('✅ 검증 완료!\n');
    
    // 검증 결과 출력
    if (verifyData.results && verifyData.results.length > 0) {
      const result = verifyData.results[0];
      console.log(`📊 검증 결과 (블로그 #${blogPostId}):`);
      console.log(`  - 총 이미지: ${result.totalImages || 0}`);
      console.log(`  - Storage 존재: ${result.existsInStorage || 0}`);
      console.log(`  - Public URL 접근 가능: ${result.accessible || 0}`);
      console.log(`  - 메타데이터 존재: ${result.hasMetadata || 0}`);
      console.log(`  - 문제 없음: ${result.allValid ? '✅' : '❌'}\n`);
      
      if (!result.allValid && result.issues && result.issues.length > 0) {
        console.log('⚠️  발견된 문제:');
        result.issues.forEach(issue => {
          console.log(`  - ${issue}`);
        });
        console.log('');
      }
    }
    
    return verifyData;
  } catch (error) {
    console.error(`❌ 블로그 글 #${blogPostId} 마이그레이션 실패:`, error.message);
    throw error;
  }
}

// 발행일 순서로 블로그 글 목록 조회
async function getBlogPostsByPublishDate() {
  console.log('\n📋 발행일 순서로 블로그 글 목록 조회 중...\n');
  
  try {
    // Supabase 직접 조회는 스크립트에서 어려우므로, API를 통해 조회하거나
    // 여기서는 예시로 API 호출만 표시
    // 실제로는 Supabase 클라이언트를 사용해야 함
    
    console.log('⚠️  블로그 글 목록 조회는 Supabase 직접 조회가 필요합니다.');
    console.log('   관리자 UI에서 발행일 순서로 확인하거나,');
    console.log('   Supabase 대시보드에서 다음 쿼리를 실행하세요:\n');
    console.log('   SELECT id, title, slug, published_at, created_at');
    console.log('   FROM blog_posts');
    console.log('   WHERE status = \'published\'');
    console.log('   ORDER BY published_at ASC, created_at ASC;\n');
    
    return [];
  } catch (error) {
    console.error('❌ 블로그 글 목록 조회 실패:', error.message);
    throw error;
  }
}

// 메인 실행 함수
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  console.log('🚀 블로그 이미지 마이그레이션 스크립트\n');
  console.log(`📍 API Base URL: ${API_BASE_URL}\n`);
  
  try {
    if (command === 'analyze' || !command) {
      // Phase 1: 전체 분석
      await phase1AnalyzeAllBlogImages();
      
    } else if (command === 'migrate') {
      // Phase 2: 특정 블로그 글 마이그레이션
      const blogPostId = args[1];
      if (!blogPostId) {
        console.error('❌ 블로그 글 ID를 입력하세요.');
        console.log('   사용법: node scripts/run-blog-image-migration.js migrate <blog-post-id>');
        process.exit(1);
      }
      
      const organizeImages = args.includes('--no-organize') ? false : true;
      const syncMetadata = args.includes('--no-metadata') ? false : true;
      const removeDuplicates = args.includes('--remove-duplicates') ? true : false;
      
      await phase2MigrateBlogPost(parseInt(blogPostId), {
        organizeImages,
        syncMetadata,
        removeDuplicates
      });
      
    } else if (command === 'verify') {
      // 검증만 실행
      const blogPostId = args[1];
      if (!blogPostId) {
        console.error('❌ 블로그 글 ID를 입력하세요.');
        console.log('   사용법: node scripts/run-blog-image-migration.js verify <blog-post-id>');
        process.exit(1);
      }
      
      const verifyResponse = await fetch(`${API_BASE_URL}/api/admin/verify-blog-images?blogPostId=${blogPostId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.error || '검증 실패');
      }
      
      const verifyData = await verifyResponse.json();
      console.log(JSON.stringify(verifyData, null, 2));
      
    } else {
      console.log('사용법:');
      console.log('  node scripts/run-blog-image-migration.js analyze              # Phase 1: 전체 분석');
      console.log('  node scripts/run-blog-image-migration.js migrate <id>         # Phase 2: 특정 글 마이그레이션');
      console.log('  node scripts/run-blog-image-migration.js verify <id>           # 검증만 실행');
      console.log('');
      console.log('옵션:');
      console.log('  --no-organize          이미지 정렬 건너뛰기');
      console.log('  --no-metadata          메타데이터 동기화 건너뛰기');
      console.log('  --remove-duplicates    중복 이미지 제거');
    }
  } catch (error) {
    console.error('\n❌ 실행 실패:', error.message);
    process.exit(1);
  }
}

main();

