// Individual blog post API endpoint
import { createServerSupabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  const { slug } = req.query;
  
  try {
    const supabase = createServerSupabase();
    
    // 관리자 권한 확인 (관리자 페이지에서 온 요청은 모두 허용)
    const isAdmin = req.headers.referer?.includes('/admin/') || 
                   req.headers.cookie?.includes('admin-auth=true') || 
                   req.headers['x-admin-auth'] === 'true' ||
                   req.query.admin === 'true';
    
    console.log('🔍 게시물 조회 요청:', { 
      slug, 
      isAdmin,
      cookie: req.headers.cookie,
      referer: req.headers.referer,
      xAdminAuth: req.headers['x-admin-auth']
    });
    
    // Get the specific post (ID 또는 slug로 조회)
    let postQuery = supabase
      .from('blog_posts')
      .select('*');
    
    // 숫자인 경우 ID로 조회, 그렇지 않으면 slug로 조회
    if (/^\d+$/.test(slug)) {
      postQuery = postQuery.eq('id', parseInt(slug));
    } else {
      postQuery = postQuery.eq('slug', slug);
    }
    
    // 관리자가 아닌 경우 발행된 게시물만 조회
    if (!isAdmin) {
      postQuery = postQuery.eq('status', 'published');
    }
    
    const { data: post, error } = await postQuery.single();

    if (error || !post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Get related posts (same category, excluding current post)
    const { data: relatedPosts } = await supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt, featured_image, published_at, category')
      .eq('category', post.category)
      .neq('id', post.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(3);

    // Get previous and next posts by published_at order
    // published_at이 없으면 created_at 사용
    const orderDate = post.published_at || post.created_at;
    
    // 이전 포스트: published_at이 orderDate보다 작거나, published_at이 null이고 created_at이 orderDate보다 작은 경우
    let prevPostQuery = supabase
      .from('blog_posts')
      .select('id, title, slug, published_at, created_at')
      .neq('id', post.id)
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });
    
    // 다음 포스트: published_at이 orderDate보다 크거나, published_at이 null이고 created_at이 orderDate보다 큰 경우
    let nextPostQuery = supabase
      .from('blog_posts')
      .select('id, title, slug, published_at, created_at')
      .neq('id', post.id)
      .order('published_at', { ascending: true, nullsFirst: true })
      .order('created_at', { ascending: true });

    // 관리자가 아닌 경우 발행된 게시물만 조회
    if (!isAdmin) {
      prevPostQuery = prevPostQuery.eq('status', 'published');
      nextPostQuery = nextPostQuery.eq('status', 'published');
    }

    // 모든 포스트를 가져와서 필터링
    const [prevPostsResult, nextPostsResult] = await Promise.all([
      prevPostQuery.limit(100), // 충분한 수를 가져와서 필터링
      nextPostQuery.limit(100)
    ]);

    // 현재 포스트의 정렬 기준 날짜
    const currentDate = post.published_at || post.created_at;
    
    // 이전 포스트: 정렬된 데이터에서 현재보다 이전 날짜의 포스트 중 첫 번째 (가장 최근)
    const prevPost = (prevPostsResult.data || []).find(p => {
      const postDate = p.published_at || p.created_at;
      if (!postDate || !currentDate) return false;
      return new Date(postDate) < new Date(currentDate);
    }) || null;
    
    // 다음 포스트: 정렬된 데이터에서 현재보다 이후 날짜의 포스트 중 첫 번째 (가장 오래된)
    const nextPost = (nextPostsResult.data || []).find(p => {
      const postDate = p.published_at || p.created_at;
      if (!postDate || !currentDate) return false;
      return new Date(postDate) > new Date(currentDate);
    }) || null;

    // Transform data for frontend
    const transformedPost = {
      id: post.id,
      title: post.title,
      slug: post.slug,
      summary: post.summary || post.excerpt,
      content: post.content,
      featured_image: post.featured_image,
      published_at: post.published_at,
      category: post.category,
      tags: post.tags,
      meta_title: post.meta_title,
      meta_description: post.meta_description,
      meta_keywords: post.meta_keywords,
      status: post.status,
      customer_persona: post.customer_persona,
      brand_weight: post.brand_weight,
      pain_point: post.pain_point,
      conversion_goal: post.conversion_goal,
      storytelling_framework: post.storytelling_framework,
      target_audience: post.target_audience,
      seo_meta: post.seo_meta,
      published_channels: post.published_channels,
      content_type: post.content_type
    };

    // 관리자 요청인 경우 단일 포스트만 반환 (편집용)
    if (isAdmin && /^\d+$/.test(slug)) {
      return res.status(200).json(transformedPost);
    }

    const transformedRelatedPosts = (relatedPosts || []).map(relatedPost => ({
      id: relatedPost.id,
      title: relatedPost.title,
      slug: relatedPost.slug,
      excerpt: relatedPost.excerpt,
      featured_image: relatedPost.featured_image,
      publishedAt: relatedPost.published_at,
      category: relatedPost.category
    }));
    
    res.status(200).json({
      post: transformedPost,
      relatedPosts: transformedRelatedPosts,
      prevPost: prevPost ? {
        id: prevPost.id,
        title: prevPost.title,
        slug: prevPost.slug
      } : null,
      nextPost: nextPost ? {
        id: nextPost.id,
        title: nextPost.title,
        slug: nextPost.slug
      } : null
    });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ error: 'Failed to load blog post' });
  }
}
