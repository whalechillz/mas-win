// Individual blog post API endpoint
import { createServerSupabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  const { slug } = req.query;
  
  try {
    const supabase = createServerSupabase();
    
    // 관리자 권한 확인 (쿠키에서 확인)
    const isAdmin = req.headers.cookie?.includes('admin-auth=true') || 
                   req.headers['x-admin-auth'] === 'true' ||
                   req.headers.referer?.includes('/admin/');
    
    console.log('🔍 게시물 조회 요청:', { slug, isAdmin });
    
    // Get the specific post
    let postQuery = supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug);
    
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
    };

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
