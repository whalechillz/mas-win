// Blog posts API endpoint
import { createServerSupabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  const { page = 1, limit = 10 } = req.query;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  
  try {
    let posts, count, error;
    
    try {
      // 환경 변수 직접 확인
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      console.log('Blog API: Environment check:', {
        supabaseUrl: supabaseUrl ? 'Set' : 'Missing',
        serviceKey: serviceKey ? 'Set' : 'Missing'
      });
      
      if (!supabaseUrl || !serviceKey) {
        throw new Error('Missing Supabase environment variables');
      }
      
      // Supabase 클라이언트 직접 생성
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, serviceKey);
      
      console.log('Blog API: Supabase client created, fetching posts...');
      
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
      
      console.log('Blog API: Fetched posts:', posts?.length || 0);
    } catch (fetchError) {
      console.error('Supabase fetch failed:', fetchError);
      throw fetchError; // fallback 제거하고 에러를 다시 던짐
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