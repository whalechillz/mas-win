/**
 * Phase 8: 블로그 본문 이미지 URL 업데이트 API
 * 
 * 블로그 본문에서 `/campaigns/YYYY-MM/...` 경로로 참조하는 이미지를
 * Supabase Storage URL로 업데이트
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'blog-images';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Storage 공개 URL 생성
function getStoragePublicUrl(storagePath) {
  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(storagePath);
  return data.publicUrl;
}

// 이미지 경로를 Storage URL로 변환
async function convertImagePathToStorageUrl(imagePath, month) {
  // `/campaigns/YYYY-MM/...` 형식의 경로 처리
  const campaignPathRegex = /\/campaigns\/(\d{4}-\d{2})\/(.+)/;
  const match = imagePath.match(campaignPathRegex);
  
  if (!match) {
    return null; // 퍼널 이미지 경로가 아님
  }
  
  const pathMonth = match[1];
  const fileName = match[2];
  
  // 요청한 월과 경로의 월이 일치하는지 확인
  if (pathMonth !== month) {
    return null;
  }
  
  // Storage에서 이미지 찾기 (파일명으로 검색)
  const storageFolder = `originals/campaigns/${month}`;
  
  try {
    const { data: files, error } = await supabase.storage
      .from(bucketName)
      .list(storageFolder, {
        limit: 1000,
        search: fileName,
      });
    
    if (error || !files || files.length === 0) {
      console.warn(`⚠️ Storage에서 이미지를 찾을 수 없음: ${fileName}`);
      return null;
    }
    
    // 파일명이 정확히 일치하는 파일 찾기
    const exactMatch = files.find((file) => {
      // UUID-파일명 형식에서 파일명 부분만 추출
      const storageFileName = file.name;
      const storageNameWithoutExt = storageFileName.replace(/\.[^/.]+$/, '');
      const originalNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
      
      // UUID-파일명 형식이거나 정확히 일치하는 경우
      return storageFileName === fileName || 
             storageNameWithoutExt.endsWith(`-${originalNameWithoutExt}`) ||
             storageNameWithoutExt.includes(originalNameWithoutExt);
    });
    
    if (exactMatch) {
      const storagePath = `${storageFolder}/${exactMatch.name}`;
      return getStoragePublicUrl(storagePath);
    }
    
    // 정확히 일치하지 않으면 첫 번째 결과 사용
    const storagePath = `${storageFolder}/${files[0].name}`;
    return getStoragePublicUrl(storagePath);
  } catch (error) {
    console.error(`❌ 이미지 경로 변환 오류 (${imagePath}):`, error);
    return null;
  }
}

// 블로그 본문의 이미지 URL 업데이트
async function updateBlogContent(content, month) {
  if (!content) return { content, updateCount: 0 };
  
  let updatedContent = content;
  let updateCount = 0;
  
  // 1. 마크다운 이미지 문법: ![alt](url)
  const markdownImgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const markdownMatches = [];
  let match;
  while ((match = markdownImgRegex.exec(content)) !== null) {
    if (match[2].includes('/campaigns/')) {
      markdownMatches.push({
        fullMatch: match[0],
        alt: match[1],
        url: match[2],
      });
    }
  }
  
  for (const mdMatch of markdownMatches) {
    const storageUrl = await convertImagePathToStorageUrl(mdMatch.url, month);
    if (storageUrl) {
      updatedContent = updatedContent.replace(
        mdMatch.fullMatch,
        `![${mdMatch.alt}](${storageUrl})`
      );
      updateCount++;
    }
  }
  
  // 2. HTML img 태그: <img src="...">
  const imgTagRegex = /<img([^>]+)src=["']([^"']+)["']([^>]*)>/gi;
  const imgMatches = [];
  while ((match = imgTagRegex.exec(content)) !== null) {
    if (match[2].includes('/campaigns/')) {
      imgMatches.push({
        fullMatch: match[0],
        before: match[1],
        src: match[2],
        after: match[3],
      });
    }
  }
  
  for (const imgMatch of imgMatches) {
    const storageUrl = await convertImagePathToStorageUrl(imgMatch.src, month);
    if (storageUrl) {
      updatedContent = updatedContent.replace(
        imgMatch.fullMatch,
        `<img${imgMatch.before}src="${storageUrl}"${imgMatch.after}>`
      );
      updateCount++;
    }
  }
  
  return { content: updatedContent, updateCount };
}

// 블로그 글 업데이트
async function updateBlogPost(blogPostId, month) {
  try {
    // 블로그 글 조회
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('id, title, content, featured_image')
      .eq('id', blogPostId)
      .single();
    
    if (postError || !post) {
      throw new Error(`블로그 글을 찾을 수 없습니다: ${blogPostId}`);
    }
    
    const updates = {};
    let totalUpdates = 0;
    
    // 1. content 업데이트
    if (post.content) {
      const { content: updatedContent, updateCount } = await updateBlogContent(post.content, month);
      if (updateCount > 0) {
        updates.content = updatedContent;
        totalUpdates += updateCount;
      }
    }
    
    // 2. featured_image 업데이트
    if (post.featured_image && post.featured_image.includes('/campaigns/')) {
      const storageUrl = await convertImagePathToStorageUrl(post.featured_image, month);
      if (storageUrl) {
        updates.featured_image = storageUrl;
        totalUpdates++;
      }
    }
    
    // 업데이트가 있으면 저장
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update(updates)
        .eq('id', blogPostId);
      
      if (updateError) {
        throw updateError;
      }
    }
    
    return {
      success: true,
      blogPostId,
      title: post.title,
      updateCount: totalUpdates,
      updates: Object.keys(updates),
    };
  } catch (error) {
    console.error(`❌ 블로그 글 업데이트 오류 (${blogPostId}):`, error);
    return {
      success: false,
      blogPostId,
      error: error.message,
    };
  }
}

// 메인 핸들러
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { month, blogPostId } = req.body;
    
    if (!month) {
      return res.status(400).json({ error: 'month 파라미터가 필요합니다.' });
    }

    // 특정 블로그 글만 업데이트하는 경우
    if (blogPostId) {
      const result = await updateBlogPost(blogPostId, month);
      
      return res.status(200).json({
        success: true,
        message: '블로그 글 업데이트 완료',
        month,
        result,
      });
    }
    
    // 해당 월의 퍼널 이미지를 참조하는 모든 블로그 글 찾기
    const { data: posts, error: postsError } = await supabase
      .from('blog_posts')
      .select('id, title, content, featured_image')
      .not('content', 'is', null)
      .or(`content.ilike.%/campaigns/${month}/%,featured_image.ilike.%/campaigns/${month}/%`);
    
    if (postsError) {
      throw postsError;
    }
    
    if (!posts || posts.length === 0) {
      return res.status(200).json({
        success: true,
        message: '업데이트할 블로그 글이 없습니다.',
        month,
        summary: {
          totalPosts: 0,
          totalUpdates: 0,
        },
        results: [],
      });
    }
    
    // 각 블로그 글 업데이트
    const results = [];
    
    for (const post of posts) {
      const result = await updateBlogPost(post.id, month);
      results.push(result);
    }
    
    const totalUpdates = results.reduce((sum, r) => sum + (r.updateCount || 0), 0);
    const successCount = results.filter((r) => r.success).length;
    
    return res.status(200).json({
      success: true,
      message: '블로그 본문 URL 업데이트 완료',
      month,
      summary: {
        totalPosts: posts.length,
        successCount,
        totalUpdates,
      },
      results,
    });
  } catch (error) {
    console.error('❌ 블로그 본문 URL 업데이트 오류:', error);
    return res.status(500).json({
      error: '블로그 본문 URL 업데이트 중 오류가 발생했습니다.',
      message: error.message,
    });
  }
}








