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
        .select('id, title, slug, content, featured_image, created_at')
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
          .select('id, title, slug, content, featured_image, created_at')
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
      // ✅ 계획된 구조: originals/blog/YYYY-MM/
      // 블로그 글의 작성일 기준으로 폴더 생성
      const postDate = post.created_at ? new Date(post.created_at) : new Date();
      const year = postDate.getFullYear();
      const month = String(postDate.getMonth() + 1).padStart(2, '0');
      const dateFolder = `${year}-${month}`;
      const postFolderName = `originals/blog/${dateFolder}`;
      const images = [];
      const imageUrlSet = new Set(); // ✅ 중복 체크용 Set (더 빠른 검색)
      
      // 1. featured_image 확인 (대표이미지)
      if (post.featured_image) {
        images.push({
          url: post.featured_image,
          type: 'featured',
          source: 'featured_image'
        });
        imageUrlSet.add(post.featured_image);
        console.log(`📸 대표이미지 추가: ${post.featured_image}`);
      }
      
      // 2. content에서 이미지 URL 추출 (대표이미지가 본문에 중복 포함될 수 있음)
      if (post.content) {
        // HTML 태그에서 이미지 URL 추출
        const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
        const matches = post.content.matchAll(imgRegex);
        
        for (const match of matches) {
          const imageUrl = match[1];
          // ✅ 중복 체크: 대표이미지가 본문에 있어도 한 번만 처리
          if (imageUrl && !imageUrlSet.has(imageUrl)) {
            images.push({
              url: imageUrl,
              type: 'content',
              source: 'content_html'
            });
            imageUrlSet.add(imageUrl);
          } else if (imageUrl && imageUrlSet.has(imageUrl)) {
            console.log(`⏭️ 중복 이미지 스킵 (본문): ${imageUrl}`);
          }
        }
        
        // 마크다운 이미지 URL 추출
        const markdownImgRegex = /!\[.*?\]\(([^)]+)\)/gi;
        const markdownMatches = post.content.matchAll(markdownImgRegex);
        
        for (const match of markdownMatches) {
          const imageUrl = match[1];
          // ✅ 중복 체크: 대표이미지가 본문에 있어도 한 번만 처리
          if (imageUrl && !imageUrlSet.has(imageUrl)) {
            images.push({
              url: imageUrl,
              type: 'content',
              source: 'content_markdown'
            });
            imageUrlSet.add(imageUrl);
          } else if (imageUrl && imageUrlSet.has(imageUrl)) {
            console.log(`⏭️ 중복 이미지 스킵 (마크다운): ${imageUrl}`);
          }
        }
      }
      
      console.log(`📊 추출된 이미지 (중복 제거 후): ${images.length}개 (대표이미지 포함)`);
      
      // 3. Storage에서 해당 이미지 찾기 (최적화: 타임아웃 방지)
      const storageImages = [];
      const maxSearchTime = 7000; // ✅ 각 블로그 글당 최대 7초 (전체 API 타임아웃 8초 고려)
      const startTime = Date.now();
      
      // ✅ 개선: 모든 이미지 처리 (타임아웃 발생 시 일부만 처리)
      // 이미지가 많을 경우 타임아웃 방지를 위해 시간 체크
      const imagesToProcess = images; // ✅ 모든 이미지 처리 (타임아웃 시 일부만 처리)
      
      console.log(`📊 블로그 글 "${post.title}" 이미지 처리 시작: ${images.length}개`);
      
      for (let i = 0; i < imagesToProcess.length; i++) {
        const img = imagesToProcess[i];
        // 타임아웃 체크
        if ((Date.now() - startTime) >= maxSearchTime) {
          console.warn(`⚠️ 이미지 검색 타임아웃: ${i + 1}/${imagesToProcess.length}개 처리 완료 (${storageImages.length}개 찾음)`);
          console.warn(`   남은 ${imagesToProcess.length - i - 1}개 이미지는 타임아웃으로 인해 처리하지 못했습니다.`);
          break;
        }
        
        try {
          // URL에서 파일 경로 추출
          // 예: https://...supabase.co/storage/v1/object/public/blog-images/path/to/file.jpg
          // → path/to/file.jpg 또는 file.jpg
          let imagePath = null;
          let fileName = null;
          
          if (img.url.includes('/storage/v1/object/public/blog-images/')) {
            // Supabase Storage URL인 경우 경로 직접 추출
            const urlMatch = img.url.match(/\/blog-images\/(.+)$/);
            if (urlMatch) {
              imagePath = urlMatch[1].split('?')[0]; // 쿼리 파라미터 제거
              fileName = imagePath.split('/').pop(); // 마지막 파일명만
            }
          }
          
          // URL에서 파일명만 추출 (fallback)
          if (!fileName) {
            const urlParts = img.url.split('/');
            fileName = urlParts[urlParts.length - 1].split('?')[0];
          }
          
          // ✅ 개선: URL에서 직접 경로 추출한 경우, 파일명으로 검색
          // 경로가 있으면 경로로 직접 접근 시도
          let found = null;
          
          if (imagePath) {
            // ✅ 개선: URL에서 직접 경로 추출했으면 getPublicUrl로 파일 존재 확인
            try {
              // 경로로 직접 접근 시도
              const { data: urlData } = supabase.storage
                .from('blog-images')
                .getPublicUrl(imagePath);
              
              // ✅ 최적화: HEAD 요청에 타임아웃 추가 (1초)
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 1000);
              
              try {
                const response = await fetch(urlData.publicUrl, { 
                  method: 'HEAD',
                  signal: controller.signal
                });
                clearTimeout(timeoutId);
                
                if (response.ok) {
                  // ✅ 최적화: 파일 정보 조회 제거 (너무 느림)
                  // HEAD 요청으로 파일 존재 확인만 하고 즉시 반환
                  const pathParts = imagePath.split('/');
                  const pathFileName = pathParts[pathParts.length - 1];
                  const folderPath = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : '';
                  
                  found = {
                    id: pathFileName,
                    name: pathFileName,
                    currentPath: imagePath,
                    folderPath: folderPath,
                    url: urlData.publicUrl,
                    size: parseInt(response.headers.get('content-length') || '0'),
                    created_at: new Date().toISOString()
                  };
                }
              } catch (fetchError) {
                clearTimeout(timeoutId);
                // 타임아웃이면 다음 단계로
                if (fetchError.name !== 'AbortError') {
                  console.warn(`⚠️ HEAD 요청 실패 (${imagePath}):`, fetchError.message);
                }
              }
            } catch (error) {
              console.warn(`⚠️ URL 직접 확인 실패 (${imagePath}):`, error.message);
            }
          }
          
          // 경로로 찾지 못했으면 파일명으로 검색
          if (!found) {
            // ✅ 개선: 검색 시간 증가 (3초로 확대)
            const foundResult = await Promise.race([
              findImageInStorage(fileName, 3000), // ✅ 각 이미지당 최대 3초
              new Promise((_, reject) => setTimeout(() => reject(new Error('이미지 검색 타임아웃')), 3000))
            ]).catch(err => {
              console.warn(`⚠️ 이미지 검색 타임아웃 (${fileName}):`, err.message);
              return null;
            });
            
            found = foundResult;
          }
          
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
      
      // 처리 결과 로그
      console.log(`📊 이미지 처리 완료: ${storageImages.length}/${images.length}개 찾음`);
      if (storageImages.length < images.length) {
        console.warn(`⚠️ 일부 이미지를 찾지 못했습니다: ${images.length - storageImages.length}개 누락`);
        const foundUrls = storageImages.map(img => img.url);
        const missingUrls = images.filter(img => !foundUrls.includes(img.url));
        missingUrls.forEach(missing => {
          console.warn(`   - 누락: ${missing.url}`);
        });
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

// Storage에서 이미지 찾기 (최적화: 타임아웃 방지)
const findImageInStorage = async (fileName, maxSearchTime = 1000) => {
  try {
    let foundImage = null;
    const startTime = Date.now();
    const batchSize = 1000;
    
    // ✅ 최적화: 먼저 루트 폴더에서 검색 (대부분의 이미지가 루트에 있음)
    // ✅ 최적화: 파일명으로 직접 검색 (인덱스 사용)
    try {
      // ✅ 파일명과 정확히 일치하는 것부터 검색
      const exactFileName = fileName.toLowerCase();
      
      // 루트 폴더에서 파일명으로 검색 (최대 1000개로 확대)
      let rootOffset = 0;
      const searchLimit = 1000; // ✅ 검색 제한 확대 (이미지 찾기 성공률 향상)
      
      while (!foundImage && rootOffset < searchLimit && (Date.now() - startTime) < maxSearchTime) {
        const { data: files, error } = await supabase.storage
          .from('blog-images')
          .list('', {
            limit: Math.min(batchSize, searchLimit - rootOffset),
            offset: rootOffset,
            sortBy: { column: 'name', order: 'asc' }
          });
        
        if (error) {
          console.error(`❌ 루트 폴더 조회 에러:`, error);
          break;
        }
        
        if (!files || files.length === 0) {
          break;
        }
        
        // 파일만 검색 (폴더 제외)
        for (const file of files) {
          if (file.id) {
            const fileLower = file.name.toLowerCase();
            
            // ✅ 정확한 파일명 매칭 우선 (확장자 제외 포함)
            const fileNameWithoutExt = exactFileName.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');
            const fileWithoutExt = fileLower.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');
            
            if (fileLower === exactFileName || fileWithoutExt === fileNameWithoutExt || fileLower.includes(exactFileName)) {
              const { data: urlData } = supabase.storage
                .from('blog-images')
                .getPublicUrl(file.name);
              
              foundImage = {
                id: file.id,
                name: file.name,
                currentPath: file.name,
                folderPath: '',
                url: urlData.publicUrl,
                size: file.metadata?.size || 0,
                created_at: file.created_at
              };
              return foundImage; // 찾았으면 즉시 반환
            }
          }
        }
        
        rootOffset += files.length;
        
        if (files.length < batchSize) {
          break;
        }
        
        // 타임아웃 체크
        if ((Date.now() - startTime) >= maxSearchTime) {
          console.warn(`⚠️ 이미지 검색 타임아웃 (${maxSearchTime}ms): ${rootOffset}개 검색 완료`);
          break;
        }
      }
    } catch (error) {
      console.error('❌ 루트 폴더 검색 오류:', error);
    }
    
    // ✅ 찾지 못했고 시간이 남아있으면 하위 폴더 검색 (제한적으로)
    if (!foundImage && (Date.now() - startTime) < maxSearchTime / 2) {
      try {
        const { data: rootFolders } = await supabase.storage
          .from('blog-images')
          .list('', {
            limit: 100, // 최대 100개 폴더만 검색
            sortBy: { column: 'created_at', order: 'desc' }
          });
        
        if (rootFolders) {
          // 폴더만 필터링
          const folders = rootFolders.filter(f => !f.id);
          
          // 주요 폴더만 검색 (최신 순으로 10개)
          for (const folder of folders.slice(0, 10)) {
            if (foundImage || (Date.now() - startTime) >= maxSearchTime) break;
            
            try {
              const { data: folderFiles } = await supabase.storage
                .from('blog-images')
                .list(folder.name, {
                  limit: 500, // 폴더당 최대 500개 파일
                  sortBy: { column: 'name', order: 'asc' }
                });
              
              if (folderFiles) {
                for (const file of folderFiles) {
                  if (file.id) {
                    const fileLower = file.name.toLowerCase();
                    const searchLower = fileName.toLowerCase();
                    
                    if (fileLower === searchLower || fileLower.includes(searchLower)) {
                      const fullPath = `${folder.name}/${file.name}`;
                      const { data: urlData } = supabase.storage
                        .from('blog-images')
                        .getPublicUrl(fullPath);
                      
                      foundImage = {
                        id: file.id,
                        name: file.name,
                        currentPath: fullPath,
                        folderPath: folder.name,
                        url: urlData.publicUrl,
                        size: file.metadata?.size || 0,
                        created_at: file.created_at
                      };
                      return foundImage;
                    }
                  }
                }
              }
            } catch (error) {
              console.error(`❌ 폴더 검색 오류 (${folder.name}):`, error);
              continue;
            }
          }
        }
      } catch (error) {
        console.error('❌ 하위 폴더 검색 오류:', error);
      }
    }
    
    return foundImage;
    
  } catch (error) {
    console.error('❌ Storage 이미지 찾기 오류:', error);
    return null;
  }
};

// ✅ 폴더가 존재하는지 확인하고 없으면 생성
const ensureFolderExists = async (folderPath) => {
  try {
    // 폴더 경로를 슬래시로 분리 (예: "originals/blog/2025-09")
    const pathParts = folderPath.split('/').filter(Boolean);
    
    // 각 단계의 폴더 경로를 순차적으로 확인하고 생성
    let currentPath = '';
    for (const part of pathParts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      
      // 현재 경로에 폴더가 있는지 확인
      const { data: files, error: listError } = await supabase.storage
        .from('blog-images')
        .list(currentPath.includes('/') ? currentPath.split('/').slice(0, -1).join('/') : '', {
          limit: 1000
        });
      
      // 상위 폴더 목록에서 현재 폴더가 있는지 확인
      const parentPath = currentPath.includes('/') ? currentPath.split('/').slice(0, -1).join('/') : '';
      const folderName = currentPath.split('/').pop();
      
      const folderExists = files?.some(file => !file.id && file.name === folderName);
      
      if (!folderExists) {
        // 폴더가 없으면 빈 파일을 업로드하여 폴더 생성 (Supabase Storage 트릭)
        // 실제로는 폴더를 만들 수 없으므로, 폴더 내 임시 파일을 업로드하여 폴더 생성
        // 또는 파일 이동 시 자동으로 폴더가 생성됨
        
        // 대신 파일을 이동할 때 자동으로 폴더가 생성되므로 여기서는 확인만 수행
        console.log(`📁 폴더 확인: ${currentPath} (이동 시 자동 생성됨)`);
      }
    }
    
    return true;
  } catch (error) {
    console.warn(`⚠️ 폴더 확인 오류 (${folderPath}):`, error.message);
    // 폴더 생성 실패해도 계속 진행 (파일 이동 시 자동 생성될 수 있음)
    return true;
  }
};

// 이미지를 폴더로 이동
const moveImageToFolder = async (imagePath, targetFolder) => {
  try {
    // ✅ 폴더 존재 확인 및 생성
    await ensureFolderExists(targetFolder);
    
    // 현재 경로에서 파일명 추출
    const pathParts = imagePath.split('/');
    const fileName = pathParts[pathParts.length - 1];
    
    // 목표 폴더 경로 생성
    const targetPath = `${targetFolder}/${fileName}`;
    
    // 같은 위치면 이동 불필요
    if (imagePath === targetPath) {
      return { moved: false, message: '이미 해당 폴더에 있습니다.' };
    }
    
    // Storage에서 이미지 이동 (폴더가 없으면 자동 생성됨)
    const { data, error } = await supabase.storage
      .from('blog-images')
      .move(imagePath, targetPath);
    
    if (error) {
      // 이미 대상 폴더에 파일이 있을 수 있음 (중복)
      if (error.message.includes('duplicate') || error.message.includes('already exists')) {
        return { moved: false, message: '대상 폴더에 이미 같은 파일이 있습니다.' };
      }
      
      // ✅ 폴더가 없어서 실패할 수 있으므로 에러 메시지 개선
      if (error.message.includes('not found') || error.message.includes('does not exist')) {
        throw new Error(`대상 폴더가 존재하지 않거나 생성할 수 없습니다: ${targetFolder}`);
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
  
  // ✅ 타임아웃 방지: Vercel 제한(10초) 고려하여 빠른 응답 보장
  // ✅ GET 요청은 더 짧게 설정 (이미지 검색만 수행, 이동 없음)
  const timeoutPromise = new Promise((_, reject) => {
    const timeout = req.method === 'GET' ? 6000 : 8000; // GET은 6초, POST는 8초
    setTimeout(() => reject(new Error(`요청 시간 초과 (${timeout/1000}초 제한)`)), timeout);
  });
  
  try {
    if (req.method === 'GET') {
      // 블로그 글별 이미지 정렬 정보 조회 (이동 없음)
      const { blogPostId } = req.query;
      
      console.log('📊 블로그 글별 이미지 정렬 정보 조회 중...');
      
      // ✅ 타임아웃과 함께 실행
      const results = await Promise.race([
        organizeImagesByBlog(blogPostId || null),
        timeoutPromise
      ]);
      
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
      
      // ✅ 타임아웃과 함께 실행
      const results = await Promise.race([
        organizeImagesByBlog(blogPostId || null),
        timeoutPromise
      ]);
      
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
    
    // ✅ 타임아웃 오류 구분
    if (error.message && (error.message.includes('시간 초과') || error.message.includes('timeout') || error.message.includes('초과'))) {
      return res.status(504).json({
        error: '요청 시간 초과',
        details: '이미지 검색이 너무 오래 걸려 시간 초과되었습니다. 잠시 후 다시 시도해주세요.',
        suggestion: '특정 블로그 글만 처리하거나, 더 적은 이미지가 있는 글부터 시작하세요.'
      });
    }
    
    return res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      details: error.message || '알 수 없는 오류가 발생했습니다.'
    });
  }
}

