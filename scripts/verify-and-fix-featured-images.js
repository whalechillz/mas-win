/**
 * 블로그 대표 이미지 검증 및 복구 스크립트
 * 깨진 대표 이미지를 찾아서 해당 글의 폴더에서 이미지를 찾아 복구
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

// 대표 이미지 검증 및 복구
async function verifyAndFixFeaturedImage(blogPostId, post) {
  const results = {
    blogPostId,
    title: post.title,
    success: false,
    hasFeaturedImage: false,
    featuredImageUrl: post.featured_image || '',
    isBroken: false,
    fixed: false,
    newFeaturedImage: '',
    errors: []
  };

  try {
    // 1. 대표 이미지가 있는지 확인
    if (!post.featured_image || post.featured_image.trim() === '') {
      results.hasFeaturedImage = false;
      results.success = true;
      return results;
    }

    results.hasFeaturedImage = true;
    results.featuredImageUrl = post.featured_image;

    // 2. 대표 이미지 접근 가능 여부 확인
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(post.featured_image, {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        results.isBroken = true;
        console.log(`  ⚠️ 대표 이미지 깨짐: ${post.featured_image.substring(0, 80)}...`);
      } else {
        results.success = true;
        return results; // 정상이면 종료
      }
    } catch (fetchError) {
      results.isBroken = true;
      console.log(`  ⚠️ 대표 이미지 접근 불가: ${fetchError.message}`);
    }

    // 3. 깨진 경우 해당 글의 폴더에서 이미지 찾기
    if (results.isBroken) {
      const publishDate = post.published_at ? new Date(post.published_at) : (post.created_at ? new Date(post.created_at) : new Date());
      const year = publishDate.getFullYear();
      const month = String(publishDate.getMonth() + 1).padStart(2, '0');
      const dateFolder = `${year}-${month}`;
      const postFolder = `originals/blog/${dateFolder}/${blogPostId}`;

      console.log(`  🔍 폴더에서 이미지 검색: ${postFolder}`);

      // 해당 폴더의 이미지 목록 조회
      const imagesResponse = await fetch(`${API_BASE_URL}/api/admin/all-images?prefix=${encodeURIComponent(postFolder)}&limit=100`);
      
      if (imagesResponse.ok) {
        const imagesData = await imagesResponse.json();
        const images = imagesData.images || [];

        if (images.length > 0) {
          // 첫 번째 이미지를 대표 이미지로 설정
          const newFeaturedImage = images[0].url;
          results.newFeaturedImage = newFeaturedImage;
          
          console.log(`  ✅ 대표 이미지 복구 가능: ${newFeaturedImage.substring(0, 80)}...`);
          
          // 4. 블로그 글 업데이트
          const updateResponse = await fetch(`${API_BASE_URL}/api/admin/blog/${blogPostId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              featured_image: newFeaturedImage
            })
          });

          if (updateResponse.ok) {
            results.fixed = true;
            results.success = true;
            console.log(`  ✅ 대표 이미지 복구 완료!`);
          } else {
            const errorData = await updateResponse.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.details || '대표 이미지 업데이트 실패');
          }
        } else {
          console.log(`  ⚠️ 폴더에 이미지 없음`);
          results.success = true; // 이미지가 없어도 성공으로 처리
        }
      } else {
        throw new Error('이미지 목록 조회 실패');
      }
    }

  } catch (error) {
    results.errors.push(error.message);
  }

  return results;
}

// 배치 검증 및 복구 실행
async function runBatchVerification(startIndex, count) {
  const posts = await getBlogPostsByPublishDate();
  console.log(`\n📊 총 ${posts.length}개 글 발견\n`);
  
  const targetPosts = posts.slice(startIndex, startIndex + count);
  console.log(`\n📋 검증할 글 목록 (${targetPosts.length}개):\n`);
  targetPosts.forEach((post, idx) => {
    console.log(`  ${startIndex + idx + 1}. [ID ${post.id}] ${post.title}`);
  });
  
  console.log(`\n🔍 대표 이미지 검증 및 복구 시작...\n`);
  console.log('='.repeat(80));
  
  const results = [];
  
  for (let i = 0; i < targetPosts.length; i++) {
    const post = targetPosts[i];
    const postNumber = startIndex + i + 1;
    
    console.log(`\n[${postNumber}/${targetPosts.length}] 블로그 글 #${post.id} 검증 중...`);
    console.log(`제목: ${post.title}`);
    
    const result = await verifyAndFixFeaturedImage(post.id, post);
    results.push(result);
    
    if (!result.hasFeaturedImage) {
      console.log(`결과: ℹ️ 대표 이미지 없음`);
    } else if (result.isBroken && result.fixed) {
      console.log(`결과: ✅ 복구 완료`);
    } else if (result.isBroken && !result.fixed) {
      console.log(`결과: ⚠️ 깨짐 (복구 불가)`);
    } else {
      console.log(`결과: ✅ 정상`);
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
  const reportFile = path.join(BACKUP_DIR, `blog-featured-images-verification-${timestamp}.json`);
  const report = {
    batchInfo: { startIndex, count, timestamp },
    results,
    summary: {
      total: results.length,
      hasFeaturedImage: results.filter(r => r.hasFeaturedImage).length,
      broken: results.filter(r => r.isBroken).length,
      fixed: results.filter(r => r.fixed).length,
      noFeaturedImage: results.filter(r => !r.hasFeaturedImage).length
    }
  };
  
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  
  // 요약 출력
  console.log('\n' + '='.repeat(80));
  console.log('📊 검증 및 복구 요약');
  console.log('='.repeat(80));
  console.log(`총 처리: ${results.length}개`);
  console.log(`대표 이미지 있음: ${results.filter(r => r.hasFeaturedImage).length}개`);
  console.log(`대표 이미지 없음: ${results.filter(r => !r.hasFeaturedImage).length}개`);
  console.log(`깨진 이미지: ${results.filter(r => r.isBroken).length}개`);
  console.log(`복구 완료: ${results.filter(r => r.fixed).length}개`);
  console.log(`\n📁 보고서: ${reportFile}`);
  console.log('='.repeat(80));
  
  return report;
}

// 메인 실행
async function main() {
  const startIndex = parseInt(process.argv[2]) || 0;
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
      console.log('✅ 모든 글의 대표 이미지 검증이 완료되었습니다!');
      process.exit(0);
    }
    
    // 10개씩 반복 처리
    let currentIndex = startIndex;
    let batchNumber = Math.floor(startIndex / batchSize) + 1;
    let totalFixed = 0;
    
    while (currentIndex < totalPosts) {
      const remaining = totalPosts - currentIndex;
      const currentBatchSize = Math.min(batchSize, remaining);
      
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🔄 배치 #${batchNumber} 시작 (${currentIndex + 1}번째부터 ${currentBatchSize}개)`);
      console.log(`${'='.repeat(80)}\n`);
      
      const report = await runBatchVerification(currentIndex, currentBatchSize);
      totalFixed += report.summary.fixed;
      
      currentIndex += currentBatchSize;
      batchNumber++;
      
      // 다음 배치 전 대기 (1초)
      if (currentIndex < totalPosts) {
        console.log(`\n⏳ 다음 배치 준비 중... (1초 대기)\n`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`\n${'='.repeat(80)}`);
    console.log('🎉 모든 블로그 대표 이미지 검증 및 복구 완료!');
    console.log(`총 복구된 대표 이미지: ${totalFixed}개`);
    console.log(`${'='.repeat(80)}\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 실행 실패:', error.message);
    process.exit(1);
  }
}

main();

