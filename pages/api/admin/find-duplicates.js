// 중복 이미지 찾기 API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 이미지 해시 계산 (개선된 버전 - 더 정확한 중복 감지)
const calculateImageHash = (filename) => {
  // 1. 파일명에서 실제 이미지 이름 부분만 추출
  // blog-upload-1758725641002-waterproof-p.jpg -> waterproof-p
  const blogUploadMatch = filename.match(/blog-upload-\d+-(.+?)\./);
  if (blogUploadMatch) {
    return blogUploadMatch[1];
  }
  
  // 2. august-funnel-1757852476987-hero-image-1-face.webp -> hero-image-1-face
  const funnelMatch = filename.match(/august-funnel-\d+-(.+?)\./);
  if (funnelMatch) {
    return funnelMatch[1];
  }
  
  // 3. complete-migration-1757776491130-9.webp -> 9
  const migrationMatch = filename.match(/complete-migration-\d+-(.+?)\./);
  if (migrationMatch) {
    return migrationMatch[1];
  }
  
  // 4. 기타 패턴들
  const otherMatch = filename.match(/([a-zA-Z0-9-_]+)\.(jpg|jpeg|png|gif|webp)$/i);
  if (otherMatch) {
    return otherMatch[1];
  }
  
  return filename;
};

// 전체 사이트에서 이미지 사용 현황을 확인하는 함수
const checkImageUsageAcrossSite = async (imageUrl) => {
  try {
    // 새로운 사용 현황 추적 API 호출
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/image-usage-tracker?imageUrl=${encodeURIComponent(imageUrl)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.usage || { blogPosts: [], funnelPages: [], staticPages: [], totalUsage: 0 };
    
  } catch (error) {
    console.error('이미지 사용 현황 추적 오류:', error);
    
    // 폴백: 기존 방식으로 블로그 게시물만 확인
    try {
      const { data: posts, error } = await supabase
        .from('blog_posts')
        .select('id, title, content, featured_image')
        .or(`content.ilike.%${imageUrl}%,featured_image.eq.${imageUrl}`);
      
      if (error) {
        console.error('이미지 사용 확인 오류:', error);
        return { blogPosts: [], funnelPages: [], staticPages: [], totalUsage: 0 };
      }
      
      return {
        blogPosts: posts || [],
        funnelPages: [],
        staticPages: [],
        totalUsage: (posts || []).length
      };
    } catch (fallbackError) {
      console.error('폴백 이미지 사용 확인 에러:', fallbackError);
      return { blogPosts: [], funnelPages: [], staticPages: [], totalUsage: 0 };
    }
  }
};

// 중복 이미지 찾기 (개선된 버전)
const findDuplicateImages = async (images) => {
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
  
  // 중복이 있는 그룹만 처리하고 사용 정보 확인
  for (const [hash, group] of hashMap) {
    if (group.length > 1) {
      // 각 이미지의 사용 정보 확인 (전체 사이트 범위)
      const imagesWithUsage = await Promise.all(
        group.map(async (image) => {
          const usageData = await checkImageUsageAcrossSite(image.url);
          
          // 모든 사용 현황을 하나의 배열로 통합
          const allUsage = [
            ...usageData.blogPosts.map(post => ({
              id: post.id,
              title: post.title,
              type: 'blog_post',
              url: `/blog/${post.slug}`,
              isFeatured: post.isFeatured,
              isInContent: post.isInContent,
              created_at: post.created_at
            })),
            ...usageData.funnelPages.map(page => ({
              id: page.id,
              title: page.title,
              type: 'funnel_page',
              url: `/funnel/${page.slug}`,
              isFeatured: page.isFeatured,
              isInContent: page.isInContent,
              created_at: page.created_at
            })),
            ...usageData.staticPages.map(page => ({
              id: page.id,
              title: page.title,
              type: 'static_page',
              url: `/${page.slug}`,
              isFeatured: page.isFeatured,
              isInContent: page.isInContent,
              created_at: page.created_at
            }))
          ];
          
          return {
            ...image,
            usage: allUsage,
            usageSummary: {
              totalUsage: usageData.totalUsage,
              blogPosts: usageData.blogPosts.length,
              funnelPages: usageData.funnelPages.length,
              staticPages: usageData.staticPages.length,
              isUsed: usageData.totalUsage > 0,
              isSafeToDelete: usageData.totalUsage === 0
            }
          };
        })
      );
      
      duplicates.push({
        hash,
        count: group.length,
        images: imagesWithUsage
      });
    }
  }
  
  return duplicates.sort((a, b) => b.count - a.count);
};

export default async function handler(req, res) {
  console.log('🔍 중복 이미지 찾기 API 요청:', req.method, req.url);
  
  try {
    if (req.method === 'GET') {
      // 모든 이미지 조회
      const { data: files, error } = await supabase.storage
        .from('blog-images')
        .list('', {
          limit: 1000,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error('❌ 이미지 조회 에러:', error);
        return res.status(500).json({
          error: '이미지 목록을 불러올 수 없습니다.',
          details: error.message
        });
      }

      // 이미지 URL 생성
      const imagesWithUrl = files.map(file => {
        const { data: urlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(file.name);
        
        return {
          id: file.id,
          name: file.name,
          size: file.metadata?.size || 0,
          created_at: file.created_at,
          updated_at: file.updated_at,
          url: urlData.publicUrl,
          hash: calculateImageHash(file.name)
        };
      });

      // 중복 이미지 찾기 (비동기 처리)
      const duplicates = await findDuplicateImages(imagesWithUrl);
      
      console.log('✅ 중복 이미지 분석 완료:', duplicates.length, '개 그룹');
      
      return res.status(200).json({ 
        duplicates,
        totalImages: imagesWithUrl.length,
        duplicateGroups: duplicates.length,
        duplicateCount: duplicates.reduce((sum, group) => sum + group.count, 0)
      });
      
    } else if (req.method === 'DELETE') {
      // 중복 이미지 삭제
      const { imageNames } = req.body;
      
      if (!imageNames || !Array.isArray(imageNames)) {
        return res.status(400).json({
          error: '삭제할 이미지 이름 배열이 필요합니다.'
        });
      }

      console.log('🗑️ 중복 이미지 삭제 중...', imageNames.length, '개');
      
      const { error } = await supabase.storage
        .from('blog-images')
        .remove(imageNames);

      if (error) {
        console.error('❌ 이미지 삭제 에러:', error);
        return res.status(500).json({
          error: '이미지 삭제에 실패했습니다.',
          details: error.message
        });
      }

      console.log('✅ 중복 이미지 삭제 성공:', imageNames.length, '개');
      
      return res.status(200).json({
        success: true,
        message: `${imageNames.length}개의 중복 이미지가 삭제되었습니다.`,
        deletedImages: imageNames
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
