// 블로그 이미지 검증 API
// 블로그 글의 이미지가 정상적으로 마이그레이션되었는지 검증
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 환경 변수로 버킷명 관리
const IMAGE_BUCKET = process.env.IMAGE_BUCKET || 'blog-images';

// 이미지 URL에서 파일 경로 추출
const extractPathFromUrl = (url) => {
  if (!url) return null;
  
  // Supabase Storage URL 패턴
  const match = url.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)$/);
  if (match) {
    const bucket = match[1];
    const path = match[2];
    
    if (bucket === IMAGE_BUCKET || bucket === 'blog-images') {
      return path;
    }
  }
  
  // 상대 경로인 경우
  if (url.startsWith('/') && !url.startsWith('//')) {
    return url.substring(1);
  }
  
  return null;
};

// Storage에서 파일 존재 확인
const checkStorageExists = async (imagePath) => {
  try {
    if (!imagePath) return { exists: false, error: '경로 없음' };
    
    const { data: urlData } = supabase.storage
      .from(IMAGE_BUCKET)
      .getPublicUrl(imagePath);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    try {
      const headResponse = await fetch(urlData.publicUrl, { 
        method: 'HEAD',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      return {
        exists: headResponse.ok,
        publicUrl: urlData.publicUrl,
        accessible: headResponse.ok
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        return { exists: false, error: '타임아웃' };
      }
      return { exists: false, error: fetchError.message };
    }
  } catch (error) {
    return { exists: false, error: error.message };
  }
};

// Public URL 접근성 확인
const checkPublicUrlAccessible = async (url) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      return {
        accessible: response.ok,
        status: response.status,
        contentType: response.headers.get('content-type')
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      return {
        accessible: false,
        error: fetchError.name === 'AbortError' ? '타임아웃' : fetchError.message
      };
    }
  } catch (error) {
    return { accessible: false, error: error.message };
  }
};

// 메타데이터 존재 확인
const checkMetadataExists = async (imagePath) => {
  try {
    if (!imagePath) return { exists: false };
    
    // image_metadata 테이블에서 검색
    const { data, error } = await supabase
        .from('image_assets')
      .select('id, image_url, alt_text, title, keywords')
      .or(`image_url.ilike.%${imagePath}%,folder_path.ilike.%${imagePath}%`)
      .limit(1);
    
    if (error) {
      console.error('메타데이터 조회 오류:', error);
      return { exists: false, error: error.message };
    }
    
    if (data && data.length > 0) {
      const metadata = data[0];
      return {
        exists: true,
        hasAltText: !!metadata.alt_text,
        hasTitle: !!metadata.title,
        hasKeywords: !!metadata.keywords && metadata.keywords.length > 0,
        metadata: {
          id: metadata.id,
          altText: metadata.alt_text,
          title: metadata.title,
          keywords: metadata.keywords
        }
      };
    }
    
    return { exists: false };
  } catch (error) {
    return { exists: false, error: error.message };
  }
};

// 블로그 본문에서 이미지 URL 추출
const extractImagesFromContent = (content) => {
  const images = [];
  const imageUrlSet = new Set();
  
  if (!content) return images;
  
  // HTML 이미지 태그
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  const htmlMatches = content.matchAll(imgRegex);
  
  for (const match of htmlMatches) {
    const url = match[1].trim();
    if (url && !imageUrlSet.has(url)) {
      images.push({
        url,
        type: 'html',
        parsed: true
      });
      imageUrlSet.add(url);
    }
  }
  
  // 마크다운 이미지
  const markdownImgRegex = /!\[.*?\]\(([^)]+)\)/gi;
  const markdownMatches = content.matchAll(markdownImgRegex);
  
  for (const match of markdownMatches) {
    const url = match[1].trim();
    if (url && !imageUrlSet.has(url)) {
      images.push({
        url,
        type: 'markdown',
        parsed: true
      });
      imageUrlSet.add(url);
    }
  }
  
  return images;
};

// 블로그 글 검증
const verifyBlogPost = async (blogPostId, options = {}) => {
  const {
    checkStorage = true,
    checkPublicUrl = true,
    checkMetadata = true,
    checkContentParsing = true
  } = options;
  
  try {
    // 1. 블로그 글 조회
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('id, title, slug, content, featured_image, published_at')
      .eq('id', blogPostId)
      .single();
    
    if (postError || !post) {
      throw new Error(`블로그 글을 찾을 수 없습니다: ${blogPostId}`);
    }
    
    // 2. 이미지 URL 추출
    const images = [];
    const imageUrlSet = new Set();
    
    // featured_image
    if (post.featured_image) {
      images.push({
        url: post.featured_image,
        type: 'featured',
        source: 'featured_image'
      });
      imageUrlSet.add(post.featured_image);
    }
    
    // content에서 이미지 추출
    if (checkContentParsing && post.content) {
      const contentImages = extractImagesFromContent(post.content);
      for (const img of contentImages) {
        if (!imageUrlSet.has(img.url)) {
          images.push({
            ...img,
            source: 'content'
          });
          imageUrlSet.add(img.url);
        }
      }
    }
    
    // 3. 각 이미지 검증
    const verificationResults = [];
    let okCount = 0;
    let brokenCount = 0;
    let missingStorageCount = 0;
    let missingMetadataCount = 0;
    
    for (const img of images) {
      const imagePath = extractPathFromUrl(img.url);
      const isExternalUrl = !imagePath && !img.url.includes('supabase.co');
      
      const result = {
        url: img.url,
        type: img.type,
        source: img.source,
        isExternalUrl,
        path: imagePath,
        status: 'unknown'
      };
      
      // Storage 존재 확인
      if (checkStorage && imagePath && !isExternalUrl) {
        const storageCheck = await checkStorageExists(imagePath);
        result.storageExists = storageCheck.exists;
        result.storageUrl = storageCheck.publicUrl;
        result.storageError = storageCheck.error;
        
        if (!storageCheck.exists) {
          missingStorageCount++;
          result.status = 'broken';
          brokenCount++;
        }
      } else if (isExternalUrl) {
        result.storageExists = null; // 외부 URL은 확인 불가
        result.status = 'external';
      }
      
      // Public URL 접근성 확인
      if (checkPublicUrl && img.url && !isExternalUrl) {
        const urlCheck = await checkPublicUrlAccessible(img.url);
        result.publicUrlAccessible = urlCheck.accessible;
        result.publicUrlStatus = urlCheck.status;
        result.publicUrlError = urlCheck.error;
        
        if (!urlCheck.accessible && result.status === 'unknown') {
          result.status = 'broken';
          brokenCount++;
        }
      }
      
      // 메타데이터 존재 확인
      if (checkMetadata && imagePath && !isExternalUrl) {
        const metadataCheck = await checkMetadataExists(imagePath);
        result.metadataExists = metadataCheck.exists;
        result.hasAltText = metadataCheck.hasAltText;
        result.hasTitle = metadataCheck.hasTitle;
        result.hasKeywords = metadataCheck.hasKeywords;
        result.metadata = metadataCheck.metadata;
        
        if (!metadataCheck.exists) {
          missingMetadataCount++;
        }
      }
      
      // 최종 상태 결정
      if (result.status === 'unknown') {
        if (result.storageExists && result.publicUrlAccessible !== false) {
          result.status = 'ok';
          okCount++;
        } else if (result.isExternalUrl) {
          result.status = 'external';
        } else {
          result.status = 'broken';
          brokenCount++;
        }
      }
      
      verificationResults.push(result);
    }
    
    // 4. 리포트 생성
    const report = {
      total: images.length,
      ok: okCount,
      broken: brokenCount,
      external: images.filter(img => !extractPathFromUrl(img.url) && !img.url.includes('supabase.co')).length,
      missingStorage: missingStorageCount,
      missingMetadata: missingMetadataCount
    };
    
    return {
      blogPostId: post.id,
      title: post.title,
      slug: post.slug,
      totalImages: images.length,
      verifiedImages: okCount,
      brokenImages: brokenCount,
      results: verificationResults,
      report
    };
    
  } catch (error) {
    console.error(`❌ 블로그 글 검증 오류 (${blogPostId}):`, error);
    throw error;
  }
};

// 여러 블로그 글 검증
const verifyMultipleBlogPosts = async (blogPostIds, options = {}) => {
  const results = [];
  const summary = {
    total: blogPostIds.length,
    verified: 0,
    failed: 0,
    totalImages: 0,
    totalOk: 0,
    totalBroken: 0,
    totalExternal: 0,
    totalMissingStorage: 0,
    totalMissingMetadata: 0
  };
  
  for (const blogPostId of blogPostIds) {
    try {
      const result = await verifyBlogPost(blogPostId, options);
      results.push(result);
      summary.verified++;
      summary.totalImages += result.totalImages;
      summary.totalOk += result.report.ok;
      summary.totalBroken += result.report.broken;
      summary.totalExternal += result.report.external;
      summary.totalMissingStorage += result.report.missingStorage;
      summary.totalMissingMetadata += result.report.missingMetadata;
    } catch (error) {
      results.push({
        blogPostId,
        error: error.message,
        status: 'failed'
      });
      summary.failed++;
    }
  }
  
  return {
    results,
    summary
  };
};

export default async function handler(req, res) {
  console.log('🔍 블로그 이미지 검증 API 요청:', req.method, req.url);
  
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const {
      blogPostId = null,
      blogPostIds = null,
      checkStorage = true,
      checkPublicUrl = true,
      checkMetadata = true,
      checkContentParsing = true
    } = req.body;
    
    const options = {
      checkStorage,
      checkPublicUrl,
      checkMetadata,
      checkContentParsing
    };
    
    if (blogPostIds && Array.isArray(blogPostIds)) {
      // 여러 블로그 글 검증
      console.log(`📊 여러 블로그 글 검증 시작: ${blogPostIds.length}개`);
      const result = await verifyMultipleBlogPosts(blogPostIds, options);
      return res.status(200).json({
        success: true,
        ...result
      });
    } else if (blogPostId) {
      // 단일 블로그 글 검증
      console.log(`📊 블로그 글 검증 시작: ${blogPostId}`);
      const result = await verifyBlogPost(blogPostId, options);
      return res.status(200).json({
        success: true,
        ...result
      });
    } else {
      return res.status(400).json({
        error: 'blogPostId 또는 blogPostIds가 필요합니다'
      });
    }
    
  } catch (error) {
    console.error('❌ 블로그 이미지 검증 API 오류:', error);
    return res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      details: error.message || '알 수 없는 오류가 발생했습니다.'
    });
  }
}

