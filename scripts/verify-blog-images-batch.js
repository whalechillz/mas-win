/**
 * 블로그 이미지 검증 스크립트 (10개씩 배치)
 * 모든 이미지가 정상적으로 표시되는지 확인
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const BACKUP_DIR = path.join(process.cwd(), 'backup');

// 발행일 순서로 블로그 글 목록 조회
async function getBlogPostsByPublishDate() {
  const response = await fetch(`${API_BASE_URL}/api/admin/blog?sortBy=published_at&sortOrder=asc`);
  if (!response.ok) {
    throw new Error('블로그 글 목록 조회 실패');
  }
  const data = await response.json();
  return data.posts || [];
}

// 단일 글 이미지 검증
async function verifyBlogImages(blogPostId) {
  const results = {
    blogPostId,
    success: false,
    title: '',
    totalImages: 0,
    existsInStorage: 0,
    accessible: 0,
    hasMetadata: 0,
    allValid: false,
    issues: [],
    errors: []
  };

  try {
    const verifyResponse = await fetch(`${API_BASE_URL}/api/admin/verify-blog-images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blogPostId })
    });
    
    if (!verifyResponse.ok) {
      const errorData = await verifyResponse.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.details || '검증 실패');
    }
    
    const verifyData = await verifyResponse.json();
    
    // API 응답 형식에 따라 처리
    const verifyResult = verifyData.results?.[0] || verifyData;
    
    if (!verifyResult || !verifyResult.totalImages) {
      // 이미지가 없는 경우도 정상 처리
      results.title = verifyResult?.title || '';
      results.totalImages = verifyResult?.totalImages || 0;
      results.existsInStorage = verifyResult?.verifiedImages || 0;
      results.accessible = verifyResult?.verifiedImages || 0;
      results.hasMetadata = 0;
      results.allValid = verifyResult?.totalImages === 0 || verifyResult?.brokenImages === 0;
      results.issues = verifyResult?.brokenImages > 0 ? [`깨진 이미지: ${verifyResult.brokenImages}개`] : [];
      results.success = true;
      return results;
    }
    
    results.title = verifyResult.title || '';
    results.totalImages = verifyResult.totalImages || 0;
    results.existsInStorage = verifyResult.verifiedImages || 0;
    results.accessible = verifyResult.verifiedImages || 0;
    results.hasMetadata = verifyResult.report?.missingMetadata ? (verifyResult.totalImages - verifyResult.report.missingMetadata) : 0;
    results.allValid = verifyResult.brokenImages === 0 && verifyResult.report?.missingStorage === 0;
    results.issues = [];
    if (verifyResult.brokenImages > 0) {
      results.issues.push(`깨진 이미지: ${verifyResult.brokenImages}개`);
    }
    if (verifyResult.report?.missingStorage > 0) {
      results.issues.push(`Storage 누락: ${verifyResult.report.missingStorage}개`);
    }
    if (verifyResult.report?.missingMetadata > 0) {
      results.issues.push(`메타데이터 누락: ${verifyResult.report.missingMetadata}개`);
    }
    results.success = true;
  } catch (error) {
    results.errors.push(error.message);
  }
  
  return results;
}

// 배치 검증 실행
async function runBatchVerification(startIndex, count) {
  const posts = await getBlogPostsByPublishDate();
  console.log(`\n📊 총 ${posts.length}개 글 발견\n`);
  
  const targetPosts = posts.slice(startIndex, startIndex + count);
  console.log(`\n📋 검증할 글 목록 (${targetPosts.length}개):\n`);
  targetPosts.forEach((post, idx) => {
    console.log(`  ${startIndex + idx + 1}. [ID ${post.id}] ${post.title}`);
  });
  
  console.log(`\n🔍 이미지 검증 시작...\n`);
  console.log('='.repeat(80));
  
  const results = [];
  
  for (let i = 0; i < targetPosts.length; i++) {
    const post = targetPosts[i];
    const postNumber = startIndex + i + 1;
    
    console.log(`\n[${postNumber}/${targetPosts.length}] 블로그 글 #${post.id} 검증 중...`);
    console.log(`제목: ${post.title}`);
    
    const result = await verifyBlogImages(post.id);
    results.push(result);
    
    console.log(`결과: ${result.success ? (result.allValid ? '✅ 완벽' : '⚠️ 문제 있음') : '❌ 실패'}`);
    console.log(`  총 이미지: ${result.totalImages}개`);
    console.log(`  Storage 존재: ${result.existsInStorage}개`);
    console.log(`  Public URL 접근 가능: ${result.accessible}개`);
    console.log(`  메타데이터 존재: ${result.hasMetadata}개`);
    if (result.issues.length > 0) {
      console.log(`  ⚠️ 문제: ${result.issues.length}개`);
      result.issues.slice(0, 3).forEach(issue => {
        console.log(`     - ${issue}`);
      });
      if (result.issues.length > 3) {
        console.log(`     ... 외 ${result.issues.length - 3}개`);
      }
    }
    if (result.errors.length > 0) {
      console.log(`  ❌ 오류: ${result.errors.join(', ')}`);
    }
    
    if (i < targetPosts.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // 보고서 생성
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const reportFile = path.join(BACKUP_DIR, `blog-images-verification-${timestamp}.json`);
  const report = {
    batchInfo: { startIndex, count, timestamp },
    results,
    summary: {
      total: results.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      allValid: results.filter(r => r.allValid).length,
      hasIssues: results.filter(r => r.issues.length > 0).length,
      totalImages: results.reduce((sum, r) => sum + r.totalImages, 0),
      totalExistsInStorage: results.reduce((sum, r) => sum + r.existsInStorage, 0),
      totalAccessible: results.reduce((sum, r) => sum + r.accessible, 0),
      totalHasMetadata: results.reduce((sum, r) => sum + r.hasMetadata, 0)
    }
  };
  
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  
  // 요약 출력
  console.log('\n' + '='.repeat(80));
  console.log('📊 검증 요약');
  console.log('='.repeat(80));
  console.log(`총 처리: ${results.length}개`);
  console.log(`성공: ${results.filter(r => r.success).length}개`);
  console.log(`실패: ${results.filter(r => !r.success).length}개`);
  console.log(`완벽 (문제 없음): ${results.filter(r => r.allValid).length}개`);
  console.log(`문제 있음: ${results.filter(r => r.issues.length > 0).length}개`);
  console.log(`총 이미지: ${results.reduce((sum, r) => sum + r.totalImages, 0)}개`);
  console.log(`Storage 존재: ${results.reduce((sum, r) => sum + r.existsInStorage, 0)}개`);
  console.log(`Public URL 접근 가능: ${results.reduce((sum, r) => sum + r.accessible, 0)}개`);
  console.log(`메타데이터 존재: ${results.reduce((sum, r) => sum + r.hasMetadata, 0)}개`);
  console.log(`\n📁 보고서: ${reportFile}`);
  console.log('='.repeat(80));
  
  return report;
}

// 메인 실행
async function main() {
  const startIndex = parseInt(process.argv[2]) || 0;
  const count = parseInt(process.argv[3]) || 10;
  
  console.log(`📍 API Base URL: ${API_BASE_URL}`);
  if (API_BASE_URL.includes('localhost')) {
    console.log('💡 로컬 서버를 사용합니다.\n');
  }
  
  try {
    await runBatchVerification(startIndex, count);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 실행 실패:', error.message);
    process.exit(1);
  }
}

main();

