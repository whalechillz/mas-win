// 블로그 글별로 이미지 폴더 정렬 API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 블로그 글별로 이미지 찾기 및 폴더 정렬
const organizeImagesByBlog = async (blogPostId = null) => {
  try {
    let blogPosts;
    
    // 특정 블로그 글만 처리할지, 전체 블로그 글을 처리할지 결정
    if (blogPostId) {
      const { data: post, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, content, featured_image')
        .eq('id', blogPostId)
        .single();
      
      if (error || !post) {
        throw new Error(`블로그 글을 찾을 수 없습니다: ${blogPostId}`);
      }
      
      blogPosts = [post];
    } else {
      // 전체 블로그 글 조회 (배치 조회)
      let offset = 0;
      const batchSize = 100;
      blogPosts = [];
      
      while (true) {
        const { data: posts, error } = await supabase
          .from('blog_posts')
          .select('id, title, slug, content, featured_image')
          .range(offset, offset + batchSize - 1);
        
        if (error) {
          console.error('❌ 블로그 글 조회 오류:', error);
          break;
        }
        
        if (!posts || posts.length === 0) {
          break;
        }
        
        blogPosts = blogPosts.concat(posts);
        offset += batchSize;
        
        if (posts.length < batchSize) {
          break;
        }
      }
    }
    
    console.log(`📊 처리할 블로그 글: ${blogPosts.length}개`);
    
    const results = [];
    
    // 각 블로그 글에 대해 이미지 찾기 및 폴더 정렬
    for (const post of blogPosts) {
      const postFolderName = `blog-${post.slug || post.id}`;
      const images = [];
      
      // 1. featured_image 확인
      if (post.featured_image) {
        images.push({
          url: post.featured_image,
          type: 'featured',
          source: 'featured_image'
        });
      }
      
      // 2. content에서 이미지 URL 추출
      if (post.content) {
        // HTML 태그에서 이미지 URL 추출
        const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
        const matches = post.content.matchAll(imgRegex);
        
        for (const match of matches) {
          const imageUrl = match[1];
          if (imageUrl && !images.find(img => img.url === imageUrl)) {
            images.push({
              url: imageUrl,
              type: 'content',
              source: 'content_html'
            });
          }
        }
        
        // 마크다운 이미지 URL 추출
        const markdownImgRegex = /!\[.*?\]\(([^)]+)\)/gi;
        const markdownMatches = post.content.matchAll(markdownImgRegex);
        
        for (const match of markdownMatches) {
          const imageUrl = match[1];
          if (imageUrl && !images.find(img => img.url === imageUrl)) {
            images.push({
              url: imageUrl,
              type: 'content',
              source: 'content_markdown'
            });
          }
        }
      }
      
      // 3. Storage에서 해당 이미지 찾기
      const storageImages = [];
      
      for (const img of images) {
        try {
          // URL에서 파일명 추출
          const urlParts = img.url.split('/');
          const fileName = urlParts[urlParts.length - 1].split('?')[0];
          
          // Storage에서 이미지 찾기 (재귀적으로 모든 폴더에서)
          const found = await findImageInStorage(fileName);
          
          if (found) {
            storageImages.push({
              ...found,
              ...img,
              blogPostId: post.id,
              blogPostSlug: post.slug,
              blogPostTitle: post.title,
              targetFolder: postFolderName
            });
          } else {
            console.log(`⚠️ 이미지를 찾을 수 없습니다: ${fileName}`);
          }
        } catch (error) {
          console.error(`❌ 이미지 처리 오류 (${img.url}):`, error);
        }
      }
      
      results.push({
        blogPost: {
          id: post.id,
          title: post.title,
          slug: post.slug,
          folderName: postFolderName
        },
        images: storageImages,
        totalImages: storageImages.length
      });
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ 블로그 글별 이미지 정렬 오류:', error);
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
            // 폴더인 경우 재귀적으로 조회
            const subFolderPath = folderPath ? `${folderPath}/${file.name}` : file.name;
            await searchRecursively(subFolderPath);
            if (foundImage) return; // 이미 찾았으면 종료
          } else {
            // 파일인 경우 파일명 비교 (대소문자 무시, 확장자 포함)
            const fileLower = file.name.toLowerCase();
            const searchLower = fileName.toLowerCase();
            
            // 정확한 파일명 또는 확장자 제외 비교
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
              return; // 찾았으면 종료
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

// 이미지를 폴더로 이동
const moveImageToFolder = async (imagePath, targetFolder) => {
  try {
    // 현재 경로에서 파일명 추출
    const pathParts = imagePath.split('/');
    const fileName = pathParts[pathParts.length - 1];
    
    // 목표 폴더 경로 생성
    const targetPath = `${targetFolder}/${fileName}`;
    
    // 같은 위치면 이동 불필요
    if (imagePath === targetPath) {
      return { moved: false, message: '이미 해당 폴더에 있습니다.' };
    }
    
    // Storage에서 이미지 이동
    const { data, error } = await supabase.storage
      .from('blog-images')
      .move(imagePath, targetPath);
    
    if (error) {
      // 이미 대상 폴더에 파일이 있을 수 있음 (중복)
      if (error.message.includes('duplicate') || error.message.includes('already exists')) {
        return { moved: false, message: '대상 폴더에 이미 같은 파일이 있습니다.' };
      }
      throw error;
    }
    
    return { moved: true, newPath: targetPath };
    
  } catch (error) {
    console.error('❌ 이미지 이동 오류:', error);
    throw error;
  }
};

export default async function handler(req, res) {
  console.log('📁 블로그 글별 이미지 폴더 정렬 API 요청:', req.method, req.url);
  
  try {
    if (req.method === 'GET') {
      // 블로그 글별 이미지 정렬 정보 조회 (이동 없음)
      const { blogPostId } = req.query;
      
      console.log('📊 블로그 글별 이미지 정렬 정보 조회 중...');
      const results = await organizeImagesByBlog(blogPostId || null);
      
      return res.status(200).json({
        success: true,
        results,
        totalBlogPosts: results.length,
        totalImages: results.reduce((sum, r) => sum + r.totalImages, 0)
      });
      
    } else if (req.method === 'POST') {
      // 블로그 글별 이미지 폴더로 실제 이동
      const { blogPostId, moveImages = false } = req.body;
      
      console.log('📁 블로그 글별 이미지 폴더 정렬 시작...');
      const results = await organizeImagesByBlog(blogPostId || null);
      
      if (moveImages) {
        // 실제로 이미지 이동
        let movedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        
        // ✅ 중복 이미지 추적 (블로그 글별)
        const duplicateGroups = [];
        const fileNameMap = new Map();
        
        for (const result of results) {
          const targetFolder = result.blogPost.folderName;
          
          // ✅ 같은 파일명을 가진 이미지 찾기 (중복 감지)
          for (const image of result.images) {
            const fileName = image.name || image.currentPath?.split('/').pop();
            if (fileName) {
              if (fileNameMap.has(fileName)) {
                // 중복 발견
                const existingImage = fileNameMap.get(fileName);
                duplicateGroups.push({
                  fileName,
                  blogPost: result.blogPost,
                  duplicates: [existingImage, image]
                });
              } else {
                fileNameMap.set(fileName, image);
              }
            }
          }
          
          for (const image of result.images) {
            try {
              const moveResult = await moveImageToFolder(image.currentPath, targetFolder);
              
              if (moveResult.moved) {
                movedCount++;
                image.newPath = moveResult.newPath;
              } else {
                skippedCount++;
                image.skipReason = moveResult.message;
              }
            } catch (error) {
              errorCount++;
              image.error = error.message;
              console.error(`❌ 이미지 이동 실패 (${image.currentPath}):`, error);
            }
          }
        }
        
        return res.status(200).json({
          success: true,
          results,
          summary: {
            totalBlogPosts: results.length,
            totalImages: results.reduce((sum, r) => sum + r.totalImages, 0),
            moved: movedCount,
            skipped: skippedCount,
            errors: errorCount,
            // ✅ 중복 이미지 정보 반환
            duplicates: duplicateGroups.length > 0 ? {
              groups: duplicateGroups.length,
              totalDuplicates: duplicateGroups.reduce((sum, g) => sum + g.duplicates.length, 0),
              images: duplicateGroups
            } : null
          }
        });
      } else {
        // 이동 없이 정보만 반환
        return res.status(200).json({
          success: true,
          results,
          totalBlogPosts: results.length,
          totalImages: results.reduce((sum, r) => sum + r.totalImages, 0),
          message: 'moveImages=true로 요청하면 실제로 이동합니다.'
        });
      }
      
    } else {
      return res.status(405).json({
        error: '지원하지 않는 HTTP 메서드입니다.'
      });
    }
    
  } catch (error) {
    console.error('❌ 블로그 글별 이미지 정렬 API 오류:', error);
    return res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      details: error.message
    });
  }
}

