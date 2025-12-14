/**
 * 블로그 이미지 마이그레이션 검증 스크립트
 * 
 * 사용법:
 * node scripts/verify-blog-image-migration.js [blogPostId]
 * 
 * 예시:
 * - 전체 블로그 글 검증: node scripts/verify-blog-image-migration.js
 * - 특정 글 검증: node scripts/verify-blog-image-migration.js 121
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE_URL = process.env.API_BASE_URL || 'https://www.masgolf.co.kr';
const BACKUP_DIR = path.join(__dirname, '../backup');

// 백업 디렉토리 생성
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// 블로그 글 검증
async function verifyBlogPost(blogPostId) {
  try {
    console.log(`\n🔍 블로그 글 검증 중: ${blogPostId}`);
    
    const response = await fetch(`${API_BASE_URL}/api/admin/verify-blog-images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        blogPostId,
        checkStorage: true,
        checkPublicUrl: true,
        checkMetadata: true,
        checkContentParsing: true
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API 오류 (${response.status}): ${errorText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || '검증 실패');
    }
    
    return result;
  } catch (error) {
    console.error(`❌ 블로그 글 검증 오류 (${blogPostId}):`, error.message);
    return {
      blogPostId,
      error: error.message,
      status: 'failed'
    };
  }
}

// 전체 블로그 글 목록 조회
async function getAllBlogPosts() {
  try {
    console.log('📝 전체 블로그 글 목록 조회 중...');
    
    // Supabase 직접 조회 또는 API 사용
    // 여기서는 간단히 API를 통해 조회한다고 가정
    // 실제로는 Supabase 클라이언트를 사용하거나 API를 만들어야 함
    
    const response = await fetch(`${API_BASE_URL}/api/blog/posts?page=1&limit=1000`);
    
    if (!response.ok) {
      throw new Error(`블로그 글 목록 조회 실패: ${response.status}`);
    }
    
    const data = await response.json();
    return data.posts || [];
  } catch (error) {
    console.error('❌ 블로그 글 목록 조회 오류:', error.message);
    return [];
  }
}

// 검증 결과 리포트 생성
function generateReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    total: results.length,
    verified: results.filter(r => r.status !== 'failed').length,
    failed: results.filter(r => r.status === 'failed').length,
    summary: {
      totalImages: 0,
      okImages: 0,
      brokenImages: 0,
      externalImages: 0,
      missingStorage: 0,
      missingMetadata: 0
    },
    results: results.map(r => ({
      blogPostId: r.blogPostId,
      title: r.title,
      slug: r.slug,
      totalImages: r.totalImages || 0,
      verifiedImages: r.verifiedImages || 0,
      brokenImages: r.brokenImages || 0,
      report: r.report || {},
      status: r.status || 'unknown'
    }))
  };
  
  // 요약 통계 계산
  results.forEach(r => {
    if (r.report) {
      report.summary.totalImages += r.report.total || 0;
      report.summary.okImages += r.report.ok || 0;
      report.summary.brokenImages += r.report.broken || 0;
      report.summary.externalImages += r.report.external || 0;
      report.summary.missingStorage += r.report.missingStorage || 0;
      report.summary.missingMetadata += r.report.missingMetadata || 0;
    }
  });
  
  return report;
}

// 메인 함수
async function main() {
  const blogPostId = process.argv[2] ? parseInt(process.argv[2]) : null;
  
  console.log('🚀 블로그 이미지 마이그레이션 검증 시작...\n');
  
  let results = [];
  
  if (blogPostId) {
    // 특정 블로그 글만 검증
    console.log(`📊 특정 블로그 글 검증: ${blogPostId}`);
    const result = await verifyBlogPost(blogPostId);
    results = [result];
  } else {
    // 전체 블로그 글 검증
    console.log('📊 전체 블로그 글 검증');
    const posts = await getAllBlogPosts();
    
    if (posts.length === 0) {
      console.log('⚠️ 블로그 글이 없습니다.');
      return;
    }
    
    console.log(`📝 총 ${posts.length}개 블로그 글 검증 시작...\n`);
    
    // 배치 처리 (한 번에 10개씩)
    const batchSize = 10;
    for (let i = 0; i < posts.length; i += batchSize) {
      const batch = posts.slice(i, i + batchSize);
      console.log(`\n📦 배치 ${Math.floor(i / batchSize) + 1}: ${batch.length}개 처리 중...`);
      
      const batchResults = await Promise.all(
        batch.map(post => verifyBlogPost(post.id))
      );
      
      results.push(...batchResults);
      
      // 배치 간 대기 (API 부하 방지)
      if (i + batchSize < posts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  // 리포트 생성
  const report = generateReport(results);
  
  // 결과 출력
  console.log('\n' + '='.repeat(60));
  console.log('📊 검증 결과 요약');
  console.log('='.repeat(60));
  console.log(`총 블로그 글: ${report.total}개`);
  console.log(`검증 성공: ${report.verified}개`);
  console.log(`검증 실패: ${report.failed}개`);
  console.log(`\n이미지 통계:`);
  console.log(`  총 이미지: ${report.summary.totalImages}개`);
  console.log(`  정상 이미지: ${report.summary.okImages}개`);
  console.log(`  깨진 이미지: ${report.summary.brokenImages}개`);
  console.log(`  외부 URL: ${report.summary.externalImages}개`);
  console.log(`  Storage 없음: ${report.summary.missingStorage}개`);
  console.log(`  메타데이터 없음: ${report.summary.missingMetadata}개`);
  
  // 깨진 이미지가 있는 글 목록
  const brokenPosts = results.filter(r => r.brokenImages > 0);
  if (brokenPosts.length > 0) {
    console.log(`\n⚠️ 깨진 이미지가 있는 글 (${brokenPosts.length}개):`);
    brokenPosts.forEach(post => {
      console.log(`  - [${post.blogPostId}] ${post.title}: ${post.brokenImages}개 깨진 이미지`);
    });
  }
  
  // 리포트 저장
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(BACKUP_DIR, `blog-image-verification-${timestamp}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n✅ 리포트 저장: ${reportPath}`);
  
  console.log('\n✅ 검증 완료!');
}

main().catch(console.error);

