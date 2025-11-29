import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
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
    
    return { hashMd5, hashSha256, size: buffer.length };
  } catch (error) {
    console.error(`❌ 이미지 다운로드 오류:`, error.message);
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
    const supabaseMatch = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
    if (supabaseMatch) {
      return decodeURIComponent(supabaseMatch[1]);
    }
    return null;
  } catch (error) {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { blogPostIds } = req.body;
    
    console.log('📊 블로그 중복 이미지 분석 시작...', blogPostIds ? `(특정 글: ${blogPostIds.join(', ')})` : '(전체)');
    
    // 1. 블로그 글 조회
    let allBlogPosts = [];
    
    if (blogPostIds && blogPostIds.length > 0) {
      const { data: posts, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, content, featured_image, published_at, created_at')
        .in('id', blogPostIds)
        .order('published_at', { ascending: true, nullsFirst: false });
      
      if (error) {
        throw new Error(`블로그 글 조회 오류: ${error.message}`);
      }
      
      allBlogPosts = posts || [];
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
          throw new Error(`블로그 글 조회 오류: ${error.message}`);
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
    }
    
    if (allBlogPosts.length === 0) {
      return res.status(200).json({
        summary: {
          totalBlogPosts: 0,
          totalUniqueImageUrls: 0,
          hashCalculationSuccess: 0,
          hashCalculationFailed: 0,
          duplicateGroupsCount: 0,
          totalDuplicateImages: 0,
          deletionCandidatesCount: 0,
          totalImagesToRemove: 0,
          estimatedSpaceToSave: 0
        },
        duplicateGroups: [],
        deletionCandidates: []
      });
    }
    
    // 2. 이미지 URL 추출
    const allImageUrls = new Map();
    
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
    
    // 3. Hash 계산 (배치 처리)
    const imageArray = Array.from(allImageUrls.entries());
    const hashMap = new Map();
    let successCount = 0;
    let failCount = 0;
    
    const batchSize = 10;
    for (let i = 0; i < imageArray.length; i += batchSize) {
      const batch = imageArray.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(async ([url, info]) => {
          const hashResult = await downloadImageAndCalculateHash(url);
          
          if (!hashResult) {
            failCount++;
            return null;
          }
          
          successCount++;
          const path = extractPathFromUrl(url);
          const fileName = path ? path.split('/').pop() : url.split('/').pop()?.split('?')[0] || 'unknown';
          
          const imageData = {
            url,
            ...info,
            path: path || null,
            fileName,
            hashMd5: hashResult.hashMd5,
            hashSha256: hashResult.hashSha256,
            size: hashResult.size
          };
          
          // hash_md5 기반 그룹화
          if (!hashMap.has(hashResult.hashMd5)) {
            hashMap.set(hashResult.hashMd5, []);
          }
          hashMap.get(hashResult.hashMd5).push(imageData);
          
          return imageData;
        })
      );
    }
    
    // 4. 중복 그룹 찾기
    const duplicateGroups = [];
    hashMap.forEach((group, hash) => {
      if (group.length > 1) {
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
    
    // 5. 삭제 후보 분석
    const deletionCandidates = [];
    
    for (const group of duplicateGroups) {
      const imagesWithUsage = group.images.map(img => ({
        ...img,
        usageCount: img.blogPostIds.length,
        isUsed: img.blogPostIds.length > 0
      }));
      
      const usedImages = imagesWithUsage.filter(img => img.isUsed);
      const unusedImages = imagesWithUsage.filter(img => !img.isUsed);
      
      let imagesToKeep = [];
      let imagesToRemove = [];
      
      if (usedImages.length > 0) {
        const mostUsed = usedImages.sort((a, b) => b.usageCount - a.usageCount)[0];
        imagesToKeep = [mostUsed];
        imagesToRemove = [...usedImages.filter(img => img.url !== mostUsed.url), ...unusedImages];
      } else {
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
          blogPostTitles: img.blogPostTitles,
          size: img.size
        })),
        imagesToRemove: imagesToRemove.map(img => ({
          url: img.url,
          path: img.path,
          fileName: img.fileName,
          usageCount: img.usageCount,
          blogPostIds: img.blogPostIds,
          blogPostTitles: img.blogPostTitles,
          size: img.size,
          reason: img.isUsed ? '다른 이미지가 더 많이 사용됨' : '미사용'
        }))
      });
    }
    
    const totalImagesToRemove = deletionCandidates.reduce((sum, group) => sum + group.removeCount, 0);
    const totalSpaceToSave = deletionCandidates.reduce((sum, group) => {
      return sum + group.imagesToRemove.reduce((groupSum, img) => {
        return groupSum + (img.size || 200000);
      }, 0);
    }, 0);
    
    return res.status(200).json({
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
      deletionCandidates
    });
    
  } catch (error) {
    console.error('❌ 블로그 중복 이미지 분석 오류:', error);
    return res.status(500).json({ 
      error: '블로그 중복 이미지 분석 실패',
      details: error.message 
    });
  }
}

