// 블로그 글별 이미지 정렬 + 메타데이터 동기화 + 중복 제거 통합 API
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 블로그 사용 확인
const checkBlogUsage = async (imageUrl) => {
  try {
    const { data: blogPosts } = await supabase
      .from('blog_posts')
      .select('id, title, slug, featured_image, content')
      .or(`featured_image.ilike.%${imageUrl}%,content.ilike.%${imageUrl}%`);
    
    if (!blogPosts || blogPosts.length === 0) {
      return { isUsed: false, posts: [], count: 0 };
    }
    
    const posts = blogPosts
      .filter(post => {
        const isFeatured = post.featured_image && post.featured_image.includes(imageUrl);
        const isInContent = post.content && post.content.includes(imageUrl);
        return isFeatured || isInContent;
      })
      .map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        isFeatured: post.featured_image && post.featured_image.includes(imageUrl),
        isInContent: post.content && post.content.includes(imageUrl)
      }));
    
    return {
      isUsed: posts.length > 0,
      posts,
      count: posts.length
    };
  } catch (error) {
    console.error('❌ 블로그 사용 확인 오류:', error);
    return { isUsed: false, posts: [], count: 0 };
  }
};

// 블로그 글별 통합 처리 (정렬 + 동기화 + 중복 제거)
const syncBlogPostWithDedupe = async (blogPostId, options = {}) => {
  const { 
    organizeImages = true, 
    syncMetadata = true, 
    removeDuplicates = true,
    keepBlogConnected = true 
  } = options;
  
  try {
    // 1. 블로그 글 조회
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('id, title, slug, content, featured_image, created_at')
      .eq('id', blogPostId)
      .single();
    
    if (postError || !post) {
      throw new Error(`블로그 글을 찾을 수 없습니다: ${blogPostId}`);
    }
    
    // ✅ 계획된 구조: originals/blog/YYYY-MM/
    // 블로그 글의 작성일 기준으로 폴더 생성
    const postDate = post.created_at ? new Date(post.created_at) : new Date();
    const year = postDate.getFullYear();
    const month = String(postDate.getMonth() + 1).padStart(2, '0');
    const dateFolder = `${year}-${month}`;
    const postFolderName = `originals/blog/${dateFolder}`;
    const images = [];
    
    // 2. 블로그 글의 이미지 찾기
    if (post.featured_image) {
      images.push({ url: post.featured_image, type: 'featured' });
    }
    
    if (post.content) {
      // HTML 이미지 태그
      const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
      const matches = post.content.matchAll(imgRegex);
      for (const match of matches) {
        const imageUrl = match[1];
        if (imageUrl && !images.find(img => img.url === imageUrl)) {
          images.push({ url: imageUrl, type: 'content' });
        }
      }
      
      // 마크다운 이미지
      const markdownImgRegex = /!\[.*?\]\(([^)]+)\)/gi;
      const markdownMatches = post.content.matchAll(markdownImgRegex);
      for (const match of markdownMatches) {
        const imageUrl = match[1];
        if (imageUrl && !images.find(img => img.url === imageUrl)) {
          images.push({ url: imageUrl, type: 'content' });
        }
      }
    }
    
    console.log(`📊 블로그 글 "${post.title}" 이미지: ${images.length}개`);
    
    // 3. Storage에서 이미지 찾기 및 중복 감지
    const storageImages = [];
    const duplicateGroups = [];
    const fileNameMap = new Map();
    
    for (const img of images) {
      try {
        const urlParts = img.url.split('/');
        const fileName = urlParts[urlParts.length - 1].split('?')[0];
        
        // Storage에서 이미지 찾기 (재귀적으로 모든 폴더에서)
        const found = await findImageInStorage(fileName);
        
        if (found) {
          // 중복 감지 (같은 파일명)
          if (fileNameMap.has(fileName)) {
            const existingImage = fileNameMap.get(fileName);
            const blogUsage = await checkBlogUsage(img.url);
            const existingBlogUsage = await checkBlogUsage(existingImage.url);
            
            // 블로그 연결 우선순위로 정렬
            const imagesToCompare = [
              { ...existingImage, blog_usage: existingBlogUsage },
              { ...found, blog_usage: blogUsage, url: img.url, type: img.type }
            ].sort((a, b) => {
              if (a.blog_usage.isUsed && !b.blog_usage.isUsed) return -1;
              if (!a.blog_usage.isUsed && b.blog_usage.isUsed) return 1;
              return 0;
            });
            
            duplicateGroups.push({
              fileName,
              images: imagesToCompare,
              blogPostId: post.id,
              blogPostTitle: post.title
            });
          } else {
            fileNameMap.set(fileName, found);
            storageImages.push({
              ...found,
              ...img,
              blogPostId: post.id,
              blogPostSlug: post.slug,
              blogPostTitle: post.title,
              targetFolder: postFolderName
            });
          }
        }
      } catch (error) {
        console.error(`❌ 이미지 처리 오류 (${img.url}):`, error);
      }
    }
    
    const results = {
      blogPost: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        folderName: postFolderName
      },
      images: storageImages,
      duplicates: duplicateGroups,
      summary: {
        totalImages: images.length,
        foundInStorage: storageImages.length,
        duplicateGroups: duplicateGroups.length
      }
    };
    
    // 4. 이미지 정렬 (선택적)
    if (organizeImages && storageImages.length > 0) {
      console.log(`📁 이미지 정렬 시작: ${storageImages.length}개`);
      // organize-images-by-blog API 호출 또는 직접 이동 로직
      // 여기서는 결과만 반환 (실제 이동은 클라이언트에서)
    }
    
    // 5. 메타데이터 동기화 (선택적)
    if (syncMetadata && storageImages.length > 0) {
      console.log(`🔄 메타데이터 동기화 시작: ${storageImages.length}개`);
      // sync-metadata-by-blog API 호출 또는 직접 처리
      // 여기서는 결과만 반환 (실제 동기화는 클라이언트에서)
    }
    
    // 6. 중복 제거 (선택적)
    if (removeDuplicates && duplicateGroups.length > 0) {
      console.log(`🗑️ 중복 이미지 제거 후보: ${duplicateGroups.length}개 그룹`);
      // 블로그 연결되지 않은 중복 이미지 제거 후보
      const removeCandidates = duplicateGroups
        .map(group => {
          const toRemove = group.images
            .filter(img => !img.blog_usage.isUsed)
            .slice(1); // 첫 번째는 유지, 나머지 제거 후보
          
          return {
            ...group,
            removeCandidates: toRemove
          };
        })
        .filter(group => group.removeCandidates.length > 0);
      
      results.duplicates = removeCandidates;
      results.summary.removeCandidates = removeCandidates.length;
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ 블로그 글 통합 처리 오류:', error);
    throw error;
  }
};

// Storage에서 이미지 찾기 (재귀적으로 모든 폴더에서)
const findImageInStorage = async (fileName) => {
  try {
    let foundImage = null;
    let offset = 0;
    const batchSize = 1000;
    
    const searchRecursively = async (folderPath = '') => {
      let folderOffset = 0;
      
      while (true && !foundImage) {
        const { data: files, error } = await supabase.storage
          .from('blog-images')
          .list(folderPath, {
            limit: batchSize,
            offset: folderOffset,
            sortBy: { column: 'created_at', order: 'desc' }
          });
        
        if (error) {
          console.error(`❌ 폴더 조회 에러 (${folderPath}):`, error);
          break;
        }
        
        if (!files || files.length === 0) {
          break;
        }
        
        for (const file of files) {
          if (!file.id) {
            const subFolderPath = folderPath ? `${folderPath}/${file.name}` : file.name;
            await searchRecursively(subFolderPath);
            if (foundImage) return;
          } else {
            const fileLower = file.name.toLowerCase();
            const searchLower = fileName.toLowerCase();
            
            if (fileLower === searchLower || fileLower.includes(searchLower)) {
              const fullPath = folderPath ? `${folderPath}/${file.name}` : file.name;
              const { data: urlData } = supabase.storage
                .from('blog-images')
                .getPublicUrl(fullPath);
              
              foundImage = {
                id: file.id,
                name: file.name,
                currentPath: fullPath,
                folderPath: folderPath,
                url: urlData.publicUrl,
                size: file.metadata?.size || 0,
                created_at: file.created_at
              };
              return;
            }
          }
        }
        
        folderOffset += batchSize;
        
        if (files.length < batchSize) {
          break;
        }
      }
    };
    
    await searchRecursively('');
    return foundImage;
    
  } catch (error) {
    console.error('❌ Storage 이미지 찾기 오류:', error);
    return null;
  }
};

export default async function handler(req, res) {
  console.log('🔄 블로그 글별 통합 처리 API 요청:', req.method, req.url);
  
  try {
    if (req.method === 'POST') {
      const { blogPostId, organizeImages = true, syncMetadata = true, removeDuplicates = true, keepBlogConnected = true } = req.body;
      
      if (!blogPostId) {
        return res.status(400).json({
          error: 'blogPostId가 필요합니다.'
        });
      }
      
      console.log(`📊 블로그 글 통합 처리 시작: ${blogPostId}`);
      
      const result = await syncBlogPostWithDedupe(blogPostId, {
        organizeImages,
        syncMetadata,
        removeDuplicates,
        keepBlogConnected
      });
      
      return res.status(200).json({
        success: true,
        ...result
      });
      
    } else {
      return res.status(405).json({
        error: '지원하지 않는 HTTP 메서드입니다.'
      });
    }
    
  } catch (error) {
    console.error('❌ 블로그 글별 통합 처리 API 오류:', error);
    return res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      details: error.message
    });
  }
}

