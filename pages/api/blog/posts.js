// Blog posts API endpoint
import { createServerSupabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  const { page = 1, limit = 10 } = req.query;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  
  try {
    let posts, count, error;
    
    try {
      const supabase = createServerSupabase();
      
      // Get total count
      const { count: totalCount } = await supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');

      // Get paginated posts
      const { data: postsData, error: postsError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .range(startIndex, endIndex - 1);

      posts = postsData;
      count = totalCount;
      error = postsError;
    } catch (fetchError) {
      console.error('Supabase fetch failed, using fallback data:', fetchError);
      // Fallback 데이터
      const fallbackPosts = [
        {
          id: 1,
          title: '뜨거운 여름, 완벽한 스윙 로얄살루트 증정 행사',
          slug: 'hot-summer-perfect-swing-royal-salute-gift-event',
          excerpt: '마쓰구골프에서 특별한 여름 이벤트를 진행합니다.',
          content: '마쓰구골프 드라이버로 완벽한 스윙을 만들어보세요.',
          featured_image: '/blog/images/post-1-featured.png',
          published_at: '2024-07-09T00:00:00.000Z',
          category: '골프',
          tags: ['이벤트', '드라이버'],
          status: 'published',
          meta_title: '뜨거운 여름, 완벽한 스윙 로얄살루트 증정 행사',
          meta_description: '마쓰구골프 특별 이벤트',
          meta_keywords: '골프, 드라이버, 이벤트'
        },
        {
          id: 2,
          title: '골프 드라이버 비거리 +25m 증가하는 완벽한 선택법 - 초보자도 따라할 수 있는 가이드',
          slug: 'golf-driver-distance-increase-guide',
          excerpt: '골프 드라이버 비거리를 25m 이상 늘리는 완벽한 선택법을 초보자도 쉽게 따라할 수 있도록 단계별로 안내합니다.',
          content: 'MASGOLF 고반발 드라이버로 비거리를 늘려보세요.',
          featured_image: '/blog/images/post-2-featured.png',
          published_at: '2024-09-08T00:00:00.000Z',
          category: '골프',
          tags: ['고반발드라이버', '골프드라이버', '비거리'],
          status: 'published',
          meta_title: '골프 드라이버 비거리 +25m 증가하는 완벽한 선택법',
          meta_description: '초보자도 따라할 수 있는 드라이버 비거리 증가 가이드',
          meta_keywords: '골프, 드라이버, 비거리, 초보자'
        },
        {
          id: 3,
          title: '김회장님의 실제 후기 - MASGOLF 드라이버로 70대에도 비거리 25m 증가한 놀라운 경험',
          slug: 'customer-testimonial-kim-chairman',
          excerpt: '70대 김회장님이 MASGOLF 드라이버를 사용한 후 실제로 경험한 비거리 25m 증가의 놀라운 결과를 생생하게 전해드립니다.',
          content: '시니어 골퍼도 비거리를 늘릴 수 있습니다.',
          featured_image: '/blog/images/post-3-featured.png',
          published_at: '2024-09-08T00:00:00.000Z',
          category: '골프',
          tags: ['고객후기', '시니어골퍼', '비거리'],
          status: 'published',
          meta_title: '김회장님의 실제 후기 - MASGOLF 드라이버',
          meta_description: '70대 골퍼의 비거리 25m 증가 후기',
          meta_keywords: '고객후기, 시니어, 드라이버'
        }
      ];
      
      // 페이지네이션 적용
      const paginatedPosts = fallbackPosts.slice(startIndex, endIndex);
      posts = paginatedPosts;
      count = fallbackPosts.length;
      error = null;
    }

    if (error) {
      console.error('Error fetching blog posts:', error);
      return res.status(500).json({ error: 'Failed to load blog posts' });
    }

    // Transform data for frontend
    const transformedPosts = posts.map(post => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      featured_image: post.featured_image,
      publishedAt: post.published_at,
      category: post.category,
      tags: post.tags,
      meta_title: post.meta_title,
      meta_description: post.meta_description,
      meta_keywords: post.meta_keywords,
      status: post.status
    }));
    
    res.status(200).json({
      posts: transformedPosts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalPosts: count,
        hasNext: endIndex < count,
        hasPrev: startIndex > 0
      }
    });
  } catch (error) {
    console.error('Error in blog posts API:', error);
    res.status(500).json({ error: 'Failed to load blog posts' });
  }
}