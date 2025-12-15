/**
 * 블로그 이미지 빠른 마이그레이션 스크립트
 * 이미지만 먼저 originals/blog/YYYY-MM/{blog-id}/로 이동
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

// 단일 글 이미지 빠른 마이그레이션
async function migrateBlogImagesFast(blogPostId) {
  const results = {
    blogPostId,
    success: false,
    title: '',
    publishedAt: '',
    folderName: '',
    totalExtractedImages: 0,
    totalImages: 0,
    movedCount: 0,
    skippedCount: 0,
    errorCount: 0,
    errors: []
  };

  try {
    // 1. 현재 상태 확인
    const statusResponse = await fetch(`${API_BASE_URL}/api/admin/organize-images-by-blog?blogPostId=${blogPostId}`);
    if (!statusResponse.ok) {
      throw new Error('상태 확인 실패');
    }
    const statusData = await statusResponse.json();
    const result = statusData.results?.[0];
    
    if (!result) {
      throw new Error('블로그 글을 찾을 수 없습니다.');
    }
    
    results.title = result.blogPost.title;
    results.publishedAt = result.blogPost.published_at || result.blogPost.created_at;
    results.folderName = result.blogPost.folderName;
    results.totalExtractedImages = result.totalExtractedImages || 0;
    results.totalImages = result.totalImages || 0;
    
    // 2. 이미지만 이동
    if (results.totalExtractedImages > 0) {
      const organizeResponse = await fetch(`${API_BASE_URL}/api/admin/organize-images-by-blog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogPostId, moveImages: true })
      });
      
      if (!organizeResponse.ok) {
        const errorData = await organizeResponse.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || '이미지 이동 실패');
      }
      
      const organizeData = await organizeResponse.json();
      results.movedCount = organizeData.summary?.moved || 0;
      results.skippedCount = organizeData.summary?.skipped || 0;
      results.errorCount = organizeData.summary?.errors || 0;
      
      if (results.movedCount > 0) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    results.success = true;
  } catch (error) {
    results.errors.push(error.message);
  }
  
  return results;
}

// 배치 마이그레이션 실행
async function runBatchMigration(startIndex, count) {
  const posts = await getBlogPostsByPublishDate();
  console.log(`\n📊 총 ${posts.length}개 글 발견\n`);
  
  const targetPosts = posts.slice(startIndex, startIndex + count);
  console.log(`\n📋 처리할 글 목록 (${targetPosts.length}개):\n`);
  targetPosts.forEach((post, idx) => {
    console.log(`  ${startIndex + idx + 1}. [ID ${post.id}] ${post.title}`);
  });
  
  console.log(`\n🚀 이미지 빠른 마이그레이션 시작...\n`);
  console.log('='.repeat(80));
  
  const results = [];
  
  for (let i = 0; i < targetPosts.length; i++) {
    const post = targetPosts[i];
    const postNumber = startIndex + i + 1;
    
    console.log(`\n[${postNumber}/${targetPosts.length}] 블로그 글 #${post.id} 처리 중...`);
    console.log(`제목: ${post.title}`);
    
    const result = await migrateBlogImagesFast(post.id);
    results.push(result);
    
    console.log(`결과: ${result.success ? '✅ 성공' : '❌ 실패'}`);
    console.log(`  이미지: ${result.totalImages}/${result.totalExtractedImages}개 (이동: ${result.movedCount}, 스킵: ${result.skippedCount})`);
    if (result.errors.length > 0) {
      console.log(`  오류: ${result.errors.join(', ')}`);
    }
    
    if (i < targetPosts.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // 보고서 생성
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const reportFile = path.join(BACKUP_DIR, `blog-images-fast-migration-${timestamp}.json`);
  const report = {
    batchInfo: { startIndex, count, timestamp },
    results,
    summary: {
      total: results.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      totalImages: results.reduce((sum, r) => sum + r.totalImages, 0),
      totalMoved: results.reduce((sum, r) => sum + r.movedCount, 0),
      totalSkipped: results.reduce((sum, r) => sum + r.skippedCount, 0)
    }
  };
  
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  
  // 요약 출력
  console.log('\n' + '='.repeat(80));
  console.log('📊 마이그레이션 요약');
  console.log('='.repeat(80));
  console.log(`총 처리: ${results.length}개`);
  console.log(`성공: ${results.filter(r => r.success).length}개`);
  console.log(`실패: ${results.filter(r => !r.success).length}개`);
  console.log(`총 이미지: ${results.reduce((sum, r) => sum + r.totalImages, 0)}개`);
  console.log(`이동: ${results.reduce((sum, r) => sum + r.movedCount, 0)}개`);
  console.log(`스킵: ${results.reduce((sum, r) => sum + r.skippedCount, 0)}개`);
  console.log(`\n📁 보고서: ${reportFile}`);
  console.log('='.repeat(80));
}

// 메인 실행
async function main() {
  const startIndex = parseInt(process.argv[2]) || 20; // 기본값: 20부터 시작 (이미 0-19 처리됨)
  const count = parseInt(process.argv[3]) || 10;
  const batchSize = count;
  
  console.log(`📍 API Base URL: ${API_BASE_URL}`);
  if (API_BASE_URL.includes('localhost')) {
    console.log('💡 로컬 서버를 사용합니다.\n');
  }
  
  try {
    // 전체 글 목록 조회
    const posts = await getBlogPostsByPublishDate();
    const totalPosts = posts.length;
    const remainingPosts = totalPosts - startIndex;
    
    console.log(`\n📊 전체 현황:`);
    console.log(`  총 글 수: ${totalPosts}개`);
    console.log(`  시작 인덱스: ${startIndex}`);
    console.log(`  남은 글 수: ${remainingPosts}개`);
    console.log(`  배치 크기: ${batchSize}개\n`);
    
    if (remainingPosts <= 0) {
      console.log('✅ 모든 글의 이미지 마이그레이션이 완료되었습니다!');
      process.exit(0);
    }
    
    // 10개씩 반복 처리
    let currentIndex = startIndex;
    let batchNumber = Math.floor(startIndex / batchSize) + 1;
    
    while (currentIndex < totalPosts) {
      const remaining = totalPosts - currentIndex;
      const currentBatchSize = Math.min(batchSize, remaining);
      
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🔄 배치 #${batchNumber} 시작 (${currentIndex + 1}번째부터 ${currentBatchSize}개)`);
      console.log(`${'='.repeat(80)}\n`);
      
      await runBatchMigration(currentIndex, currentBatchSize);
      
      currentIndex += currentBatchSize;
      batchNumber++;
      
      // 다음 배치 전 대기 (1초)
      if (currentIndex < totalPosts) {
        console.log(`\n⏳ 다음 배치 준비 중... (1초 대기)\n`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`\n${'='.repeat(80)}`);
    console.log('🎉 모든 블로그 이미지 마이그레이션 완료!');
    console.log(`${'='.repeat(80)}\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 실행 실패:', error.message);
    process.exit(1);
  }
}

main();
