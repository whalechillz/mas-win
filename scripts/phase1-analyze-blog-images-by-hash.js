/**
 * Phase 1 개선: 블로그 이미지 Hash 기반 중복 분석 스크립트
 * 
 * 목적: 블로그 글의 content에서 이미지 URL을 추출하고 hash_md5로 중복 감지
 * - 파일명이 달라도 같은 이미지 감지 가능
 * - 삭제 전 보고서 생성
 */

require('dotenv').config({ path: require('path').join(process.cwd(), '.env.local') });
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 이미지 다운로드 및 해시 계산
async function downloadImageAndCalculateHash(imageUrl) {
  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const hashMd5 = crypto.createHash('md5').update(buffer).digest('hex');
    const hashSha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    
    return { hashMd5, hashSha256, size: buffer.length, buffer };
  } catch (error) {
    console.error(`❌ 이미지 다운로드 오류 (${imageUrl.substring(0, 80)}...):`, error.message);
    return null;
  }
}

// 블로그 글에서 이미지 URL 추출
function extractImagesFromBlogPost(post) {
  const images = [];
  const imageUrlSet = new Set();
  
  // 1. featured_image 확인
  if (post.featured_image && post.featured_image.trim()) {
    const url = post.featured_image.trim();
    if (!imageUrlSet.has(url)) {
      images.push({
        url,
        type: 'featured',
        source: 'featured_image',
        blogPostId: post.id,
        blogPostTitle: post.title
      });
      imageUrlSet.add(url);
    }
  }
  
  // 2. content에서 이미지 URL 추출
  if (post.content) {
    // HTML 이미지 태그: <img src="url">
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    let match;
    while ((match = imgRegex.exec(post.content)) !== null) {
      const url = match[1].trim();
      if (url && !imageUrlSet.has(url)) {
        images.push({
          url,
          type: 'content',
          source: 'content_html',
          blogPostId: post.id,
          blogPostTitle: post.title
        });
        imageUrlSet.add(url);
      }
    }
    
    // 마크다운 이미지: ![alt](url)
    const markdownImgRegex = /!\[.*?\]\(([^)]+)\)/gi;
    while ((match = markdownImgRegex.exec(post.content)) !== null) {
      const url = match[1].trim();
      if (url && !imageUrlSet.has(url)) {
        images.push({
          url,
          type: 'content',
          source: 'content_markdown',
          blogPostId: post.id,
          blogPostTitle: post.title
        });
        imageUrlSet.add(url);
      }
    }
  }
  
  return images;
}

// URL에서 경로 추출
function extractPathFromUrl(url) {
  try {
    // Supabase Storage URL 패턴
    const supabaseMatch = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
    if (supabaseMatch) {
      return decodeURIComponent(supabaseMatch[1]);
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function analyzeBlogImagesByHash(blogPostIds = null) {
  console.log('📊 Phase 1 개선: 블로그 이미지 Hash 기반 중복 분석 시작\n');
  console.log('='.repeat(60));
  
  try {
    // 1. 블로그 글 조회
    console.log('\n📝 1단계: 블로그 글 조회 중...');
    
    let allBlogPosts = [];
    
    if (blogPostIds && blogPostIds.length > 0) {
      // 특정 글만 조회
      const { data: posts, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, content, featured_image, published_at, created_at')
        .in('id', blogPostIds)
        .order('published_at', { ascending: true, nullsFirst: false });
      
      if (error) {
        throw new Error(`블로그 글 조회 오류: ${error.message}`);
      }
      
      allBlogPosts = posts || [];
      console.log(`✅ 특정 블로그 글 조회 완료: ${allBlogPosts.length}개`);
      console.log(`   처리 대상: ${allBlogPosts.map(p => `${p.id}(${p.title.substring(0, 30)}...)`).join(', ')}`);
    } else {
      // 모든 글 조회 (발행일 순서)
      let offset = 0;
      const batchSize = 100;
      
      while (true) {
        const { data: posts, error } = await supabase
          .from('blog_posts')
          .select('id, title, slug, content, featured_image, published_at, created_at')
          .order('published_at', { ascending: true, nullsFirst: false })
          .range(offset, offset + batchSize - 1);
        
        if (error) {
          console.error('❌ 블로그 글 조회 오류:', error);
          break;
        }
        
        if (!posts || posts.length === 0) {
          break;
        }
        
        allBlogPosts.push(...posts);
        offset += batchSize;
        
        if (posts.length < batchSize) {
          break;
        }
      }
      
      console.log(`✅ 모든 블로그 글 조회 완료: ${allBlogPosts.length}개`);
    }
    
    if (allBlogPosts.length === 0) {
      console.log('⚠️ 처리할 블로그 글이 없습니다.');
      return null;
    }
    
    console.log(`   첫 번째 글: ${allBlogPosts[0]?.title || '없음'} (ID: ${allBlogPosts[0]?.id || '없음'})`);
    
    // 2. 모든 블로그 글에서 이미지 URL 추출
    console.log('\n📸 2단계: 이미지 URL 추출 중...');
    
    const allImageUrls = new Map(); // URL -> 이미지 정보
    
    for (const post of allBlogPosts) {
      const images = extractImagesFromBlogPost(post);
      
      for (const img of images) {
        if (!allImageUrls.has(img.url)) {
          allImageUrls.set(img.url, {
            url: img.url,
            blogPostIds: [],
            blogPostTitles: [],
            types: [],
            sources: [],
            paths: []
          });
        }
        
        const imageInfo = allImageUrls.get(img.url);
        if (!imageInfo.blogPostIds.includes(img.blogPostId)) {
          imageInfo.blogPostIds.push(img.blogPostId);
          imageInfo.blogPostTitles.push(img.blogPostTitle);
          imageInfo.types.push(img.type);
          imageInfo.sources.push(img.source);
          
          const path = extractPathFromUrl(img.url);
          if (path && !imageInfo.paths.includes(path)) {
            imageInfo.paths.push(path);
          }
        }
      }
    }
    
    console.log(`✅ 고유 이미지 URL 추출 완료: ${allImageUrls.size}개`);
    
    // 3. 각 이미지 다운로드 및 hash 계산
    console.log('\n🔍 3단계: 이미지 다운로드 및 Hash 계산 중...');
    console.log('   ⚠️ 시간이 오래 걸릴 수 있습니다...\n');
    
    const imageArray = Array.from(allImageUrls.entries());
    const hashMap = new Map(); // hash_md5 -> 이미지 그룹
    const processedImages = [];
    let successCount = 0;
    let failCount = 0;
    
    // 배치 처리 (한 번에 10개씩)
    const batchSize = 10;
    for (let i = 0; i < imageArray.length; i += batchSize) {
      const batch = imageArray.slice(i, i + batchSize);
      
      console.log(`   처리 중: ${i + 1}/${imageArray.length} (${Math.round((i + 1) / imageArray.length * 100)}%)`);
      
      const batchResults = await Promise.all(
        batch.map(async ([url, info]) => {
          const hashResult = await downloadImageAndCalculateHash(url);
          
          if (!hashResult) {
            failCount++;
            return {
              url,
              ...info,
              hashMd5: null,
              hashSha256: null,
              size: null,
              status: 'failed'
            };
          }
          
          successCount++;
          const path = extractPathFromUrl(url);
          const fileName = path ? path.split('/').pop() : url.split('/').pop()?.split('?')[0] || 'unknown';
          
          return {
            url,
            ...info,
            path: path || null,
            fileName,
            hashMd5: hashResult.hashMd5,
            hashSha256: hashResult.hashSha256,
            size: hashResult.size,
            status: 'success'
          };
        })
      );
      
      processedImages.push(...batchResults);
      
      // hash_md5 기반 그룹화
      for (const img of batchResults) {
        if (img.hashMd5) {
          if (!hashMap.has(img.hashMd5)) {
            hashMap.set(img.hashMd5, []);
          }
          hashMap.get(img.hashMd5).push(img);
        }
      }
      
      // 진행 상황 표시
      if ((i + batchSize) % 50 === 0 || i + batchSize >= imageArray.length) {
        console.log(`   ✅ 완료: ${Math.min(i + batchSize, imageArray.length)}/${imageArray.length}`);
      }
    }
    
    console.log(`\n✅ Hash 계산 완료: 성공 ${successCount}개, 실패 ${failCount}개`);
    
    // 4. 중복 그룹 찾기
    console.log('\n🔄 4단계: 중복 이미지 그룹 찾기...');
    
    const duplicateGroups = [];
    hashMap.forEach((group, hash) => {
      if (group.length > 1) {
        // 각 이미지의 사용 현황 정리
        const allBlogPostIds = new Set();
        const allBlogPostTitles = new Set();
        
        group.forEach(img => {
          img.blogPostIds.forEach(id => allBlogPostIds.add(id));
          img.blogPostTitles.forEach(title => allBlogPostTitles.add(title));
        });
        
        duplicateGroups.push({
          hash_md5: hash,
          count: group.length,
          blogPostCount: allBlogPostIds.size,
          blogPostIds: Array.from(allBlogPostIds),
          blogPostTitles: Array.from(allBlogPostTitles),
          images: group.map(img => ({
            url: img.url,
            path: img.path,
            fileName: img.fileName,
            blogPostIds: img.blogPostIds,
            blogPostTitles: img.blogPostTitles,
            size: img.size,
            types: img.types,
            sources: img.sources
          }))
        });
      }
    });
    
    console.log(`✅ 중복 그룹 발견: ${duplicateGroups.length}개`);
    
    // 5. 삭제 후보 분석
    console.log('\n🗑️ 5단계: 삭제 후보 분석...');
    
    const deletionCandidates = [];
    
    for (const group of duplicateGroups) {
      // 각 이미지별 사용 현황 확인
      const imagesWithUsage = group.images.map(img => ({
        ...img,
        usageCount: img.blogPostIds.length,
        isUsed: img.blogPostIds.length > 0
      }));
      
      // 사용 중인 이미지와 미사용 이미지 분리
      const usedImages = imagesWithUsage.filter(img => img.isUsed);
      const unusedImages = imagesWithUsage.filter(img => !img.isUsed);
      
      // 삭제 후보 결정 로직
      let imagesToKeep = [];
      let imagesToRemove = [];
      
      if (usedImages.length > 0) {
        // 사용 중인 이미지가 있으면, 그 중 하나만 보존 (가장 많이 사용된 것)
        const mostUsed = usedImages.sort((a, b) => b.usageCount - a.usageCount)[0];
        imagesToKeep = [mostUsed];
        imagesToRemove = [...usedImages.filter(img => img.url !== mostUsed.url), ...unusedImages];
      } else {
        // 모두 미사용이면, 하나만 보존 (가장 최신 것 또는 첫 번째)
        imagesToKeep = [imagesWithUsage[0]];
        imagesToRemove = imagesWithUsage.slice(1);
      }
      
      deletionCandidates.push({
        hash_md5: group.hash_md5,
        totalCount: group.count,
        keepCount: imagesToKeep.length,
        removeCount: imagesToRemove.length,
        blogPostCount: group.blogPostCount,
        blogPostIds: group.blogPostIds,
        blogPostTitles: group.blogPostTitles,
        imagesToKeep: imagesToKeep.map(img => ({
          url: img.url,
          path: img.path,
          fileName: img.fileName,
          usageCount: img.usageCount,
          blogPostIds: img.blogPostIds,
          blogPostTitles: img.blogPostTitles
        })),
        imagesToRemove: imagesToRemove.map(img => ({
          url: img.url,
          path: img.path,
          fileName: img.fileName,
          usageCount: img.usageCount,
          blogPostIds: img.blogPostIds,
          blogPostTitles: img.blogPostTitles,
          reason: img.isUsed ? '다른 이미지가 더 많이 사용됨' : '미사용'
        }))
      });
    }
    
    console.log(`✅ 삭제 후보 분석 완료: ${deletionCandidates.length}개 그룹`);
    
    // 6. 결과 요약
    const totalImagesToRemove = deletionCandidates.reduce((sum, group) => sum + group.removeCount, 0);
    const totalSpaceToSave = deletionCandidates.reduce((sum, group) => {
      return sum + group.imagesToRemove.reduce((groupSum, img) => {
        return groupSum + (img.size || 200000); // 평균 200KB 가정
      }, 0);
    }, 0);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 분석 결과 요약\n');
    console.log(`총 블로그 글: ${allBlogPosts.length}개`);
    console.log(`고유 이미지 URL: ${allImageUrls.size}개`);
    console.log(`Hash 계산 성공: ${successCount}개`);
    console.log(`Hash 계산 실패: ${failCount}개`);
    console.log(`중복 이미지 그룹: ${duplicateGroups.length}개`);
    console.log(`삭제 후보 이미지: ${totalImagesToRemove}개`);
    console.log(`예상 절약 공간: ${(totalSpaceToSave / 1024 / 1024).toFixed(2)} MB`);
    
    // 7. 결과 저장
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupDir = path.join(process.cwd(), 'backup');
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const result = {
      summary: {
        totalBlogPosts: allBlogPosts.length,
        blogPostIds: blogPostIds || allBlogPosts.map(p => p.id),
        totalUniqueImageUrls: allImageUrls.size,
        hashCalculationSuccess: successCount,
        hashCalculationFailed: failCount,
        duplicateGroupsCount: duplicateGroups.length,
        totalDuplicateImages: duplicateGroups.reduce((sum, g) => sum + g.count, 0),
        deletionCandidatesCount: deletionCandidates.length,
        totalImagesToRemove: totalImagesToRemove,
        estimatedSpaceToSave: totalSpaceToSave
      },
      duplicateGroups,
      deletionCandidates,
      processedImages: processedImages.slice(0, 100) // 처음 100개만 저장 (전체는 너무 큼)
    };
    
    const analysisFile = path.join(backupDir, `blog-image-hash-analysis-${timestamp}.json`);
    const deletionReportFile = path.join(backupDir, `blog-image-deletion-report-${timestamp}.json`);
    
    // 전체 분석 결과 저장
    fs.writeFileSync(analysisFile, JSON.stringify(result, null, 2), 'utf8');
    console.log(`\n💾 분석 결과 저장: ${analysisFile}`);
    
    // 삭제 후보 보고서 저장
    fs.writeFileSync(deletionReportFile, JSON.stringify({
      generatedAt: new Date().toISOString(),
      summary: result.summary,
      deletionCandidates: deletionCandidates
    }, null, 2), 'utf8');
    console.log(`💾 삭제 후보 보고서 저장: ${deletionReportFile}`);
    
    // 8. 삭제 후보 상세 출력 (상위 10개)
    console.log('\n' + '='.repeat(60));
    console.log('🗑️ 삭제 후보 상세 (상위 10개)\n');
    
    deletionCandidates.slice(0, 10).forEach((group, index) => {
      console.log(`${index + 1}. Hash: ${group.hash_md5.substring(0, 16)}...`);
      console.log(`   - 총 중복: ${group.totalCount}개`);
      console.log(`   - 보존: ${group.keepCount}개, 삭제: ${group.removeCount}개`);
      console.log(`   - 사용 글 수: ${group.blogPostCount}개`);
      console.log(`   - 사용 글: ${group.blogPostTitles.slice(0, 3).join(', ')}${group.blogPostTitles.length > 3 ? '...' : ''}`);
      console.log(`   - 보존할 이미지:`);
      group.imagesToKeep.forEach(img => {
        console.log(`     ✅ ${img.fileName || img.path || 'unknown'}`);
        console.log(`        URL: ${img.url.substring(0, 80)}...`);
        console.log(`        사용: ${img.usageCount}개 글`);
      });
      console.log(`   - 삭제할 이미지:`);
      group.imagesToRemove.forEach(img => {
        console.log(`     🗑️ ${img.fileName || img.path || 'unknown'}`);
        console.log(`        URL: ${img.url.substring(0, 80)}...`);
        console.log(`        이유: ${img.reason}`);
      });
      console.log('');
    });
    
    if (deletionCandidates.length > 10) {
      console.log(`... 외 ${deletionCandidates.length - 10}개 그룹\n`);
    }
    
    console.log('='.repeat(60));
    console.log('✅ Phase 1 개선 완료!');
    console.log('\n다음 단계:');
    console.log('   1. 삭제 후보 보고서 검토: ' + deletionReportFile);
    console.log('   2. 삭제 승인 후 Phase 3 실행');
    console.log('\n');
    
    return result;
    
  } catch (error) {
    console.error('\n❌ 분석 실패:', error);
    throw error;
  }
}

// 실행
if (require.main === module) {
  const blogPostIds = process.argv.slice(2).map(id => parseInt(id)).filter(id => !isNaN(id));
  
  analyzeBlogImagesByHash(blogPostIds.length > 0 ? blogPostIds : null)
    .then(() => {
      console.log('✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { analyzeBlogImagesByHash };

