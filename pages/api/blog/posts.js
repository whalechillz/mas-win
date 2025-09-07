// Blog posts API endpoint
import { createServerSupabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  const { page = 1, limit = 10 } = req.query;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  
  try {
    const supabase = createServerSupabase();
    
    // Get total count
    const { count } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    // Get paginated posts
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(startIndex, endIndex - 1);

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