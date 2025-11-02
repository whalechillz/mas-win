// 모든 블로그 이미지 분석 및 분류 API
// Phase 2: 블로그 이미지 분석 및 분류
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 환경 변수로 버킷명 관리 (기본값: blog-images, 향후 masgolf-images로 변경 예정)
const IMAGE_BUCKET = process.env.IMAGE_BUCKET || 'blog-images';

// 이미지 URL에서 파일 경로 추출
const extractPathFromUrl = (url) => {
  if (!url) return null;
  
  // Supabase Storage URL 패턴: https://...supabase.co/storage/v1/object/public/blog-images/path/to/file.jpg
  const match = url.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)$/);
  if (match) {
    const bucket = match[1];
    const path = match[2];
    
    // 버킷명이 일치하는지 확인
    if (bucket === IMAGE_BUCKET || bucket === 'blog-images') {
      return path;
    }
  }
  
  // 상대 경로인 경우
  if (url.startsWith('/') && !url.startsWith('//')) {
    return url.substring(1); // 첫 번째 '/' 제거
  }
  
  return null;
};

// Storage에서 파일 찾기 (경로 기반, 빠른 검색)
const findFileInStorage = async (imagePath) => {
  try {
    if (!imagePath) return null;
    
    // 파일 경로에서 파일명 추출
    const fileName = imagePath.split('/').pop();
    
    // 먼저 정확한 경로로 확인
    const { data: urlData } = supabase.storage
      .from(IMAGE_BUCKET)
      .getPublicUrl(imagePath);
    
    // HEAD 요청으로 파일 존재 확인
    const headResponse = await fetch(urlData.publicUrl, { method: 'HEAD' });
    if (headResponse.ok) {
      return {
        path: imagePath,
        fileName,
        exists: true,
        url: urlData.publicUrl
      };
    }
    
    // 정확한 경로가 없으면 파일명으로 검색 (제한적으로)
    // 최상위 폴더에서만 검색 (시간 절약)
    const { data: files, error } = await supabase.storage
      .from(IMAGE_BUCKET)
      .list('', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'desc' }
      });
    
    if (error) {
      console.error(`❌ Storage 조회 오류:`, error);
      return null;
    }
    
    // 파일명으로 검색
    const found = files?.find(file => 
      file.name === fileName || 
      file.name.toLowerCase() === fileName.toLowerCase()
    );
    
    if (found) {
      const { data: foundUrlData } = supabase.storage
        .from(IMAGE_BUCKET)
        .getPublicUrl(found.name);
      
      return {
        path: found.name,
        fileName: found.name,
        exists: true,
        url: foundUrlData.publicUrl
      };
    }
    
    return {
      path: imagePath,
      fileName,
      exists: false
    };
  } catch (error) {
    console.error(`❌ 파일 찾기 오류 (${imagePath}):`, error);
    return {
      path: imagePath,
      fileName: imagePath.split('/').pop(),
      exists: false,
      error: error.message
    };
  }
};

// 블로그 글에서 이미지 URL 추출
const extractImagesFromBlogPost = (post) => {
  const images = [];
  const imageUrlSet = new Set(); // 중복 방지
  
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
    const htmlMatches = post.content.matchAll(imgRegex);
    
    for (const match of htmlMatches) {
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
    const markdownMatches = post.content.matchAll(markdownImgRegex);
    
    for (const match of markdownMatches) {
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
};

// 중복 이미지 그룹화 (파일명 기준)
const groupDuplicateImages = (images) => {
  const filenameMap = new Map();
  const duplicateGroups = [];
  
  images.forEach(img => {
    const fileName = img.fileName || img.path?.split('/').pop() || img.url?.split('/').pop() || 'unknown';
    
    if (!filenameMap.has(fileName)) {
      filenameMap.set(fileName, []);
    }
    
    filenameMap.get(fileName).push(img);
  });
  
  // 중복이 있는 그룹만 반환
  filenameMap.forEach((group, filename) => {
    if (group.length > 1) {
      // 블로그 연결 여부 확인
      const hasBlogConnection = group.some(img => img.blogPostIds && img.blogPostIds.length > 0);
      
      // 보존할 이미지 결정 (블로그에 연결된 것 중 하나)
      const imagesToKeep = group.filter(img => 
        img.blogPostIds && img.blogPostIds.length > 0
      );
      
      const imagesToRemove = group.filter(img => 
        !img.blogPostIds || img.blogPostIds.length === 0
      );
      
      duplicateGroups.push({
        filename,
        count: group.length,
        hasBlogConnection,
        keepCount: imagesToKeep.length,
        removeCount: imagesToRemove.length,
        images: group.map((img, index) => {
          // 보존 여부 결정
          const shouldKeep = imagesToKeep.length > 0 
            ? imagesToKeep.some(keepImg => keepImg.url === img.url)
            : index === 0; // 첫 번째 이미지 보존
          
          return {
            path: img.path,
            fileName: img.fileName,
            url: img.url,
            blogPostIds: img.blogPostIds || [],
            blogPostTitles: img.blogPostTitles || [],
            keep: shouldKeep,
            storageExists: img.storageExists !== false
          };
        })
      });
    }
  });
  
  return duplicateGroups.sort((a, b) => b.count - a.count);
};

export default async function handler(req, res) {
  console.log('🔍 모든 블로그 이미지 분석 API 요청:', req.method, req.url);
  
  // ✅ 타임아웃 방지: Vercel 제한(10초) 고려
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('요청 시간 초과 (9초 제한)')), 9000);
  });
  
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { dryRun = true } = req.body;
    
    console.log('📊 모든 블로그 이미지 분석 시작...');
    
    // ✅ 타임아웃과 함께 실행
    const analysisResult = await Promise.race([
      analyzeAllBlogImages(dryRun),
      timeoutPromise
    ]);
    
    return res.status(200).json({
      success: true,
      dryRun,
      ...analysisResult
    });
    
  } catch (error) {
    console.error('❌ 모든 블로그 이미지 분석 API 오류:', error);
    
    // ✅ 타임아웃 오류 구분
    if (error.message && (error.message.includes('시간 초과') || error.message.includes('timeout') || error.message.includes('초과'))) {
      return res.status(504).json({
        error: '요청 시간 초과',
        details: '이미지 분석이 너무 오래 걸려 시간 초과되었습니다. 잠시 후 다시 시도해주세요.',
        suggestion: '더 작은 배치로 처리하거나, 특정 블로그 글만 분석하세요.'
      });
    }
    
    return res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      details: error.message || '알 수 없는 오류가 발생했습니다.'
    });
  }
}

// 모든 블로그 이미지 분석 메인 함수
const analyzeAllBlogImages = async (dryRun = true) => {
  try {
    // 1. 모든 블로그 글 조회 (배치 조회)
    console.log('📝 1단계: 모든 블로그 글 조회 중...');
    
    let offset = 0;
    const batchSize = 100;
    const allBlogPosts = [];
    
    while (true) {
      const { data: posts, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, content, featured_image, created_at')
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
    
    console.log(`✅ 블로그 글 조회 완료: ${allBlogPosts.length}개`);
    
    // 2. 모든 블로그 글에서 이미지 URL 추출
    console.log('📸 2단계: 이미지 URL 추출 중...');
    
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
            sources: []
          });
        }
        
        const imageInfo = allImageUrls.get(img.url);
        if (!imageInfo.blogPostIds.includes(img.blogPostId)) {
          imageInfo.blogPostIds.push(img.blogPostId);
          imageInfo.blogPostTitles.push(img.blogPostTitle);
          imageInfo.types.push(img.type);
          imageInfo.sources.push(img.source);
        }
      }
    }
    
    console.log(`✅ 고유 이미지 URL 추출 완료: ${allImageUrls.size}개`);
    
    // 3. Storage에서 실제 파일 찾기
    console.log('🔍 3단계: Storage에서 실제 파일 찾기 중...');
    
    const imageArray = Array.from(allImageUrls.values());
    const imageResults = [];
    let foundCount = 0;
    let notFoundCount = 0;
    
    // 배치로 처리 (타임아웃 방지)
    const batchLimit = 50; // 한 번에 최대 50개씩 처리
    for (let i = 0; i < imageArray.length; i += batchLimit) {
      const batch = imageArray.slice(i, i + batchLimit);
      
      const batchResults = await Promise.all(
        batch.map(async (img) => {
          const path = extractPathFromUrl(img.url);
          const fileInfo = await findFileInStorage(path);
          
          return {
            ...img,
            path: fileInfo?.path || path,
            fileName: fileInfo?.fileName || path?.split('/').pop() || 'unknown',
            url: img.url,
            storageExists: fileInfo?.exists || false,
            storageUrl: fileInfo?.url
          };
        })
      );
      
      imageResults.push(...batchResults);
      
      foundCount += batchResults.filter(r => r.storageExists).length;
      notFoundCount += batchResults.filter(r => !r.storageExists).length;
      
      console.log(`📦 배치 ${Math.floor(i / batchLimit) + 1}: ${batchResults.length}개 처리 (찾음: ${foundCount}, 없음: ${notFoundCount})`);
      
      // 진행 상황이 느리면 일부만 처리하고 반환
      if (i + batchLimit < imageArray.length && (i + batchLimit) > 100) {
        console.log(`⚠️ 처리량 제한: 100개까지만 처리하고 중단`);
        break;
      }
    }
    
    console.log(`✅ Storage 파일 찾기 완료: 찾음 ${foundCount}개, 없음 ${notFoundCount}개`);
    
    // 4. 중복 이미지 그룹화
    console.log('🔄 4단계: 중복 이미지 감지 중...');
    
    const duplicateGroups = groupDuplicateImages(imageResults);
    
    console.log(`✅ 중복 이미지 그룹 생성 완료: ${duplicateGroups.length}개 그룹`);
    
    // 5. 블로그에 연결되지 않은 이미지 찾기
    const unlinkedImages = imageResults.filter(img => 
      (!img.blogPostIds || img.blogPostIds.length === 0) && img.storageExists
    );
    
    // 6. Storage에 있지만 블로그에 연결되지 않은 이미지
    const unlinkedStorageImages = imageResults.filter(img => 
      img.storageExists && (!img.blogPostIds || img.blogPostIds.length === 0)
    );
    
    // 결과 요약
    const summary = {
      totalBlogPosts: allBlogPosts.length,
      totalUniqueImageUrls: allImageUrls.size,
      totalImagesFoundInStorage: foundCount,
      totalImagesNotFoundInStorage: notFoundCount,
      duplicateGroupsCount: duplicateGroups.length,
      totalDuplicateImages: duplicateGroups.reduce((sum, group) => sum + group.count, 0),
      unlinkedImagesCount: unlinkedImages.length,
      unlinkedStorageImagesCount: unlinkedStorageImages.length
    };
    
    console.log('📊 분석 결과 요약:', summary);
    
    return {
      summary,
      duplicateGroups: duplicateGroups.slice(0, 50), // 처음 50개 그룹만 반환
      unlinkedImages: unlinkedImages.slice(0, 50), // 처음 50개만 반환
      unlinkedStorageImages: unlinkedStorageImages.slice(0, 50), // 처음 50개만 반환
      hasMore: {
        duplicateGroups: duplicateGroups.length > 50,
        unlinkedImages: unlinkedImages.length > 50,
        unlinkedStorageImages: unlinkedStorageImages.length > 50
      },
      message: dryRun 
        ? '분석 완료 (드라이런 모드 - 실제 변경 없음)'
        : '분석 완료'
    };
    
  } catch (error) {
    console.error('❌ 블로그 이미지 분석 오류:', error);
    throw error;
  }
};

