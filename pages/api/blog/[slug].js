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
      relatedPosts: transformedRelatedPosts
    });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ error: 'Failed to load blog post' });
  }
}
