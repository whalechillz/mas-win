// 중복 이미지 제거 (블로그 연결 확인 포함)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

// 중복 이미지 그룹에서 안전하게 제거할 이미지 선택
const selectImagesToRemove = async (duplicateGroup, keepBlogConnected = true) => {
  const images = duplicateGroup.images || [];
  if (images.length <= 1) return []; // 중복이 아니면 제거 불필요
  
  // 블로그 연결 확인
  const imagesWithBlog = await Promise.all(
    images.map(async (img) => {
      const blogUsage = await checkBlogUsage(img.url);
      return {
        ...img,
        blog_usage: blogUsage,
        has_blog_connection: blogUsage.isUsed
      };
    })
  );
  
  // 블로그 연결 여부에 따라 정렬
  const sortedImages = imagesWithBlog.sort((a, b) => {
    // 블로그 연결된 이미지를 우선 유지
    if (a.has_blog_connection && !b.has_blog_connection) return -1;
    if (!a.has_blog_connection && b.has_blog_connection) return 1;
    
    // 같은 연결 상태면 최신 이미지 우선
    const aDate = new Date(a.created_at || 0);
    const bDate = new Date(b.created_at || 0);
    return bDate - aDate;
  });
  
  // 제거할 이미지 선택
  const imagesToRemove = [];
  
  if (keepBlogConnected) {
    // 블로그 연결된 이미지는 제거하지 않음
    const blogConnected = sortedImages.filter(img => img.has_blog_connection);
    const notBlogConnected = sortedImages.filter(img => !img.has_blog_connection);
    
    // 블로그 연결되지 않은 이미지만 제거
    if (blogConnected.length > 0) {
      // 블로그 연결된 이미지가 있으면, 그것들만 남기고 나머지 제거
      imagesToRemove.push(...notBlogConnected);
    } else {
      // 블로그 연결된 이미지가 없으면, 가장 최신 것만 남기고 나머지 제거
      imagesToRemove.push(...sortedImages.slice(1));
    }
  } else {
    // 블로그 연결 여부 무시하고 가장 최신 것만 남기고 나머지 제거
    imagesToRemove.push(...sortedImages.slice(1));
  }
  
  return imagesToRemove.map(img => ({
    ...img,
    reason: img.has_blog_connection ? 'blog_connected' : 'duplicate'
  }));
};

export default async function handler(req, res) {
  console.log('🗑️ 중복 이미지 제거 API 요청 (블로그 연결 확인):', req.method, req.url);
  
  try {
    if (req.method === 'POST') {
      const { duplicateGroups, keepBlogConnected = true, dryRun = false } = req.body;
      
      if (!duplicateGroups || !Array.isArray(duplicateGroups)) {
        return res.status(400).json({
          error: 'duplicateGroups 배열이 필요합니다.'
        });
      }
      
      console.log(`📊 중복 이미지 그룹: ${duplicateGroups.length}개`);
      
      const results = [];
      let totalRemoved = 0;
      let totalSkipped = 0;
      let totalErrors = 0;
      
      for (const group of duplicateGroups) {
        try {
          // 제거할 이미지 선택
          const imagesToRemove = await selectImagesToRemove(group, keepBlogConnected);
          
          if (imagesToRemove.length === 0) {
            console.log(`⏭️ 그룹 "${group.hash}" 제거할 이미지 없음 (모두 블로그 연결됨)`);
            totalSkipped++;
            results.push({
              hash: group.hash,
              status: 'skipped',
              reason: 'all_blog_connected',
              totalImages: group.images?.length || 0
            });
            continue;
          }
          
          // dryRun 모드면 실제 삭제하지 않음
          if (dryRun) {
            console.log(`🔍 [DRY RUN] 그룹 "${group.hash}" 제거 예정: ${imagesToRemove.length}개`);
            results.push({
              hash: group.hash,
              status: 'dry_run',
              imagesToRemove: imagesToRemove.map(img => ({
                name: img.name,
                url: img.url,
                has_blog_connection: img.has_blog_connection,
                reason: img.reason
              })),
              totalImages: group.images?.length || 0
            });
            totalRemoved += imagesToRemove.length;
            continue;
          }
          
          // 실제로 이미지 삭제
          const imagePaths = imagesToRemove.map(img => img.currentPath || img.full_path || img.name);
          const { error: deleteError } = await supabase.storage
            .from('blog-images')
            .remove(imagePaths);
          
          if (deleteError) {
            console.error(`❌ 이미지 삭제 실패 (그룹 "${group.hash}"):`, deleteError);
            totalErrors++;
            results.push({
              hash: group.hash,
              status: 'error',
              error: deleteError.message,
              totalImages: group.images?.length || 0
            });
          } else {
            console.log(`✅ 그룹 "${group.hash}" 이미지 삭제 완료: ${imagesToRemove.length}개`);
            totalRemoved += imagesToRemove.length;
            results.push({
              hash: group.hash,
              status: 'success',
              removed: imagesToRemove.length,
              imagesRemoved: imagesToRemove.map(img => ({
                name: img.name,
                url: img.url,
                has_blog_connection: img.has_blog_connection,
                reason: img.reason
              })),
              totalImages: group.images?.length || 0
            });
          }
          
        } catch (error) {
          console.error(`❌ 그룹 처리 오류:`, error);
          totalErrors++;
          results.push({
            hash: group.hash,
            status: 'error',
            error: error.message,
            totalImages: group.images?.length || 0
          });
        }
        
        // 그룹 간 간격
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      return res.status(200).json({
        success: true,
        results,
        summary: {
          totalGroups: duplicateGroups.length,
          removed: totalRemoved,
          skipped: totalSkipped,
          errors: totalErrors
        },
        dryRun
      });
      
    } else if (req.method === 'GET') {
      // 중복 이미지 찾기 + 블로그 연결 확인 + 제거 후보 표시
      const { includeBlogUsage = true } = req.query;
      
      // find-duplicates-with-blog.js를 호출하여 중복 이미지 찾기
      const findDuplicatesUrl = `/api/admin/find-duplicates-with-blog?includeBlogUsage=${includeBlogUsage}`;
      
      // 여기서는 직접 구현하지 않고 클라이언트에서 두 API를 호출하도록 안내
      return res.status(200).json({
        message: '중복 이미지 찾기는 /api/admin/find-duplicates-with-blog를 사용하세요.',
        usage: {
          step1: 'GET /api/admin/find-duplicates-with-blog?includeBlogUsage=true - 중복 이미지 찾기',
          step2: 'POST /api/admin/remove-duplicates-with-blog - 중복 이미지 제거',
          parameters: {
            duplicateGroups: '중복 이미지 그룹 배열',
            keepBlogConnected: 'true면 블로그 연결된 이미지는 제거하지 않음',
            dryRun: 'true면 실제 삭제하지 않고 제거 후보만 표시'
          }
        }
      });
      
    } else {
      return res.status(405).json({
        error: '지원하지 않는 HTTP 메서드입니다.'
      });
    }
    
  } catch (error) {
    console.error('❌ 중복 이미지 제거 API 오류:', error);
    return res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      details: error.message
    });
  }
}

