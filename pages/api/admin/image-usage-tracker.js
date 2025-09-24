import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 전체 사이트에서 이미지 사용 현황을 추적하는 함수
const trackImageUsageAcrossSite = async (imageUrl) => {
  const usage = {
    blogPosts: [],
    funnelPages: [],
    staticPages: [],
    externalUsage: [],
    totalUsage: 0
  };

  try {
    // 1. 블로그 게시물에서 사용 확인
    const { data: blogPosts, error: blogError } = await supabase
      .from('blog_posts')
      .select('id, title, content, featured_image, slug, created_at')
      .or(`content.ilike.%${imageUrl}%,featured_image.eq.${imageUrl}`);
    
    if (!blogError && blogPosts) {
      usage.blogPosts = blogPosts.map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        type: 'blog_post',
        url: `/blog/${post.slug}`,
        isFeatured: post.featured_image === imageUrl,
        isInContent: post.content.includes(imageUrl),
        created_at: post.created_at
      }));
    }

    // 2. 퍼널 페이지에서 사용 확인 (funnel_pages 테이블이 있다면)
    try {
      const { data: funnelPages, error: funnelError } = await supabase
        .from('funnel_pages')
        .select('id, title, content, featured_image, slug, created_at')
        .or(`content.ilike.%${imageUrl}%,featured_image.eq.${imageUrl}`);
      
      if (!funnelError && funnelPages) {
        usage.funnelPages = funnelPages.map(page => ({
          id: page.id,
          title: page.title,
          slug: page.slug,
          type: 'funnel_page',
          url: `/funnel/${page.slug}`,
          isFeatured: page.featured_image === imageUrl,
          isInContent: page.content.includes(imageUrl),
          created_at: page.created_at
        }));
      }
    } catch (error) {
      console.log('퍼널 페이지 테이블이 없거나 접근할 수 없습니다.');
    }

    // 3. 정적 페이지에서 사용 확인 (pages 테이블이 있다면)
    try {
      const { data: staticPages, error: staticError } = await supabase
        .from('pages')
        .select('id, title, content, featured_image, slug, created_at')
        .or(`content.ilike.%${imageUrl}%,featured_image.eq.${imageUrl}`);
      
      if (!staticError && staticPages) {
        usage.staticPages = staticPages.map(page => ({
          id: page.id,
          title: page.title,
          slug: page.slug,
          type: 'static_page',
          url: `/${page.slug}`,
          isFeatured: page.featured_image === imageUrl,
          isInContent: page.content.includes(imageUrl),
          created_at: page.created_at
        }));
      }
    } catch (error) {
      console.log('정적 페이지 테이블이 없거나 접근할 수 없습니다.');
    }

    // 4. 외부 사용 확인 (이미지 URL이 다른 도메인에서 참조되는지)
    // 실제로는 웹 크롤링이나 로그 분석이 필요하지만, 여기서는 기본적인 패턴 매칭
    const externalPatterns = [
      // 소셜 미디어, 이메일, 외부 사이트 등에서 사용될 수 있는 패턴들
      `https://www.masgolf.co.kr${imageUrl}`,
      `http://www.masgolf.co.kr${imageUrl}`,
      `masgolf.co.kr${imageUrl}`
    ];

    // 5. 총 사용 횟수 계산
    usage.totalUsage = usage.blogPosts.length + usage.funnelPages.length + usage.staticPages.length;

    return usage;

  } catch (error) {
    console.error('이미지 사용 현황 추적 오류:', error);
    return usage;
  }
};

// 특정 이미지의 상세 사용 현황 조회
export default async function handler(req, res) {
  console.log('🔍 이미지 사용 현황 추적 API 요청:', req.method, req.url);

  try {
    if (req.method === 'GET') {
      const { imageUrl } = req.query;

      if (!imageUrl) {
        return res.status(400).json({ 
          error: 'imageUrl 파라미터가 필요합니다.' 
        });
      }

      console.log('📊 이미지 사용 현황 추적 중:', imageUrl);
      
      const usage = await trackImageUsageAcrossSite(imageUrl);
      
      console.log('✅ 이미지 사용 현황 추적 완료:', usage.totalUsage, '개 위치에서 사용');
      
      return res.status(200).json({
        imageUrl,
        usage,
        summary: {
          totalUsage: usage.totalUsage,
          blogPosts: usage.blogPosts.length,
          funnelPages: usage.funnelPages.length,
          staticPages: usage.staticPages.length,
          isUsed: usage.totalUsage > 0,
          isSafeToDelete: usage.totalUsage === 0
        }
      });

    } else if (req.method === 'POST') {
      // 여러 이미지의 사용 현황을 한 번에 조회
      const { imageUrls } = req.body;

      if (!imageUrls || !Array.isArray(imageUrls)) {
        return res.status(400).json({ 
          error: 'imageUrls 배열이 필요합니다.' 
        });
      }

      console.log('📊 여러 이미지 사용 현황 추적 중:', imageUrls.length, '개');
      
      const results = await Promise.all(
        imageUrls.map(async (imageUrl) => {
          const usage = await trackImageUsageAcrossSite(imageUrl);
          return {
            imageUrl,
            usage,
            summary: {
              totalUsage: usage.totalUsage,
              isUsed: usage.totalUsage > 0,
              isSafeToDelete: usage.totalUsage === 0
            }
          };
        })
      );
      
      console.log('✅ 여러 이미지 사용 현황 추적 완료');
      
      return res.status(200).json({
        results,
        summary: {
          totalImages: imageUrls.length,
          usedImages: results.filter(r => r.summary.isUsed).length,
          unusedImages: results.filter(r => r.summary.isSafeToDelete).length
        }
      });

    } else {
      return res.status(405).json({
        error: '지원하지 않는 HTTP 메서드입니다.'
      });
    }

  } catch (error) {
    console.error('❌ 이미지 사용 현황 추적 API 오류:', error);
    return res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      details: error.message
    });
  }
}
