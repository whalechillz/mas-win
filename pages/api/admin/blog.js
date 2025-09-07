import { createServerSupabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await getPosts(req, res);
      case 'POST':
        return await createPost(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function getPosts(req, res) {
  try {
    console.log('Admin API: Getting posts...');
    
    // 환경 변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('Admin API: Environment check:', {
      supabaseUrl: supabaseUrl ? 'Set' : 'Missing',
      serviceKey: serviceKey ? 'Set' : 'Missing'
    });
    
    if (!supabaseUrl || !serviceKey) {
      console.error('Admin API: Missing environment variables');
      return res.status(500).json({ 
        error: '환경 변수가 설정되지 않았습니다.',
        details: 'Supabase URL or Service Key missing'
      });
    }
    
    // Supabase 클라이언트 사용 (최소 설정)
    console.log('Admin API: Using Supabase client with minimal configuration');
    
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log('Admin API: Supabase client created, attempting to fetch posts...');
    
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Admin API: 게시물 로드 실패:', error);
      return res.status(500).json({ 
        error: '게시물을 불러올 수 없습니다.',
        details: error.message,
        code: error.code,
        fullError: JSON.stringify(error)
      });
    }

    console.log(`Admin API: Found ${posts.length} posts`);

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
      status: post.status,
      meta_title: post.meta_title,
      meta_description: post.meta_description,
      meta_keywords: post.meta_keywords,
      view_count: post.view_count,
      is_featured: post.is_featured,
      is_scheduled: post.is_scheduled || false,
      scheduled_at: post.scheduled_at,
      author: post.author || '마쓰구골프',
      createdAt: post.created_at,
      updatedAt: post.updated_at
    }));

    return res.status(200).json(transformedPosts);
  } catch (error) {
    console.error('Admin API: 게시물 로드 실패:', error);
    console.error('Admin API: Error stack:', error.stack);
    return res.status(500).json({ 
      error: '게시물을 불러올 수 없습니다.',
      details: error.message,
      stack: error.stack,
      type: error.constructor.name
    });
  }
}

async function createPost(req, res) {
  try {
    const { 
      title, 
      slug, 
      excerpt, 
      content, 
      featured_image, 
      publishedAt, 
      category, 
      tags,
      status,
      meta_title,
      meta_description,
      meta_keywords,
      is_scheduled,
      scheduled_at,
      author
    } = req.body;

    const supabase = createServerSupabase();
    
    // 새 게시물 데이터
    const newPost = {
      title,
      slug,
      excerpt,
      content,
      featured_image,
      published_at: publishedAt || new Date().toISOString(),
      category: category || '골프',
      tags: tags || [],
      status: status || 'published',
      meta_title,
      meta_description,
      meta_keywords,
      view_count: 0,
      is_featured: false,
      is_scheduled: is_scheduled || false,
      scheduled_at: scheduled_at || null,
      author: author || '마쓰구골프'
    };

    const { data, error } = await supabase
      .from('blog_posts')
      .insert([newPost])
      .select()
      .single();

    if (error) {
      console.error('게시물 생성 실패:', error);
      return res.status(500).json({ error: '게시물을 생성할 수 없습니다.' });
    }

    return res.status(201).json({ 
      message: '게시물이 생성되었습니다.',
      post: data 
    });
  } catch (error) {
    console.error('게시물 생성 실패:', error);
    return res.status(500).json({ error: '게시물을 생성할 수 없습니다.' });
  }
}
