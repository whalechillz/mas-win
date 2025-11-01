// 중복 이미지 찾기 및 블로그 연결 확인 API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 이미지 해시 계산 (파일명 기준 - 폴더 경로 무시)
const calculateImageHash = (filename) => {
  // 파일명만 추출 (폴더 경로 제외)
  const fileName = filename.split('/').pop() || filename;
  
  // 타임스탬프 제거하여 중복 감지
  // 예: golf-driver-male-massgoo-395.png.png -> golf-driver-male-massgoo
  const withoutExt = fileName.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');
  
  // 숫자 패턴 제거 (타임스탬프, 인덱스 등)
  const basePattern = withoutExt
    .replace(/-\d{13,}$/, '')  // 타임스탬프 제거 (13자리 이상)
    .replace(/-\d+$/, '')      // 끝 숫자 제거
    .replace(/(\.(png|jpg|jpeg|gif|webp))+$/i, '');  // 중복 확장자 제거
  
  return basePattern;
};

// 블로그 사용 확인
const checkBlogUsage = async (imageUrl) => {
  try {
    const { data: blogPosts, error } = await supabase
      .from('blog_posts')
      .select('id, title, slug, featured_image, content')
      .or(`featured_image.ilike.%${imageUrl}%,content.ilike.%${imageUrl}%`);
    
    if (error || !blogPosts || blogPosts.length === 0) {
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
    return { isUsed: false, posts: [], count: 0, error: error.message };
  }
};

// 중복 이미지 찾기 (파일명 기준)
const findDuplicateImages = (images) => {
  const hashMap = new Map();
  const duplicates = [];
  
  // 이미지들을 해시별로 그룹화
  images.forEach(image => {
    const hash = calculateImageHash(image.name);
    
    if (hashMap.has(hash)) {
      const existingGroup = hashMap.get(hash);
      existingGroup.push(image);
    } else {
      hashMap.set(hash, [image]);
    }
  });
  
  // 중복이 있는 그룹만 반환
  hashMap.forEach((group, hash) => {
    if (group.length > 1) {
      duplicates.push({
        hash,
        count: group.length,
        images: group
      });
    }
  });
  
  return duplicates.sort((a, b) => b.count - a.count);
};

export default async function handler(req, res) {
  console.log('🔍 중복 이미지 찾기 및 블로그 연결 확인 API 요청:', req.method, req.url);
  
  try {
    if (req.method === 'GET') {
      const { includeBlogUsage = false } = req.query;
      
      // ✅ 모든 이미지 조회 (배치 조회)
      const allFiles = [];
      let offset = 0;
      const batchSize = 1000;
      
      // 재귀적으로 모든 폴더의 이미지 조회
      const getAllImagesRecursively = async (folderPath = '') => {
        while (true) {
          const { data: files, error } = await supabase.storage
            .from('blog-images')
            .list(folderPath, {
              limit: batchSize,
              offset: offset,
              sortBy: { column: 'created_at', order: 'desc' }
            });

          if (error) {
            console.error(`❌ 폴더 조회 에러 (${folderPath}, offset: ${offset}):`, error);
            break;
          }

          if (!files || files.length === 0) {
            break;
          }

          for (const file of files) {
            if (!file.id) {
              // 폴더인 경우 재귀적으로 조회
              const subFolderPath = folderPath ? `${folderPath}/${file.name}` : file.name;
              await getAllImagesRecursively(subFolderPath);
            } else {
              // 이미지 파일인 경우
              const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
              const isImage = imageExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
              
              if (isImage) {
                const fullPath = folderPath ? `${folderPath}/${file.name}` : file.name;
                const { data: urlData } = supabase.storage
                  .from('blog-images')
                  .getPublicUrl(fullPath);
                
                allFiles.push({
                  ...file,
                  folderPath: folderPath,
                  fullPath: fullPath,
                  url: urlData.publicUrl
                });
              }
            }
          }
          
          offset += batchSize;
          
          if (files.length < batchSize) {
            break;
          }
        }
      };
      
      await getAllImagesRecursively('');
      console.log(`📊 총 이미지 조회: ${allFiles.length}개`);

      // 이미지 URL 생성 및 해시 계산
      const imagesWithUrl = allFiles.map(file => ({
        id: file.id,
        name: file.name,
        size: file.metadata?.size || 0,
        created_at: file.created_at,
        updated_at: file.updated_at,
        url: file.url,
        folder_path: file.folderPath || '',
        full_path: file.fullPath || file.name,
        hash: calculateImageHash(file.name)
      }));

      // 중복 이미지 찾기
      const duplicates = findDuplicateImages(imagesWithUrl);
      
      console.log('✅ 중복 이미지 분석 완료:', duplicates.length, '개 그룹');
      
      // ✅ 블로그 사용 확인 (선택적)
      let duplicatesWithBlogUsage = duplicates;
      if (includeBlogUsage === 'true' || includeBlogUsage === true) {
        console.log('📊 블로그 사용 확인 중...');
        
        // 각 중복 그룹에서 블로그 연결 확인
        duplicatesWithBlogUsage = await Promise.all(
          duplicates.map(async (group) => {
            const imagesWithBlog = await Promise.all(
              group.images.map(async (image) => {
                const blogUsage = await checkBlogUsage(image.url);
                return {
                  ...image,
                  blog_usage: blogUsage
                };
              })
            );
            
            // ✅ 블로그에 연결된 이미지 우선 정렬
            const sortedImages = imagesWithBlog.sort((a, b) => {
              if (a.blog_usage.isUsed && !b.blog_usage.isUsed) return -1;
              if (!a.blog_usage.isUsed && b.blog_usage.isUsed) return 1;
              return 0;
            });
            
            return {
              ...group,
              images: sortedImages,
              has_blog_connection: sortedImages.some(img => img.blog_usage.isUsed),
              blog_connected_count: sortedImages.filter(img => img.blog_usage.isUsed).length
            };
          })
        );
        
        console.log('✅ 블로그 사용 확인 완료');
      }
      
      return res.status(200).json({ 
        duplicates: duplicatesWithBlogUsage,
        totalImages: imagesWithUrl.length,
        duplicateGroups: duplicates.length,
        duplicateCount: duplicates.reduce((sum, group) => sum + group.count, 0),
        // ✅ 블로그 연결 통계
        blog_connected_duplicates: includeBlogUsage 
          ? duplicatesWithBlogUsage.filter(g => g.has_blog_connection).length 
          : null
      });
      
    } else {
      return res.status(405).json({
        error: '지원하지 않는 HTTP 메서드입니다.'
      });
    }
    
  } catch (error) {
    console.error('❌ 중복 이미지 API 오류:', error);
    return res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      details: error.message
    });
  }
}

