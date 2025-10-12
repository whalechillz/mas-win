import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  try {
    // blog_posts 테이블에서 데이터 조회
    const { data: blogPost, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Blog post 조회 오류:', error);
      return res.status(500).json({ error: 'Blog post 조회 실패', details: error.message });
    }

    if (!blogPost) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    // blog_posts 테이블의 컬럼 정보도 조회
    const { data: columns, error: columnError } = await supabase
      .rpc('get_table_columns', { table_name: 'blog_posts' });

    return res.status(200).json({
      blogPost,
      columns: columnError ? '컬럼 정보 조회 실패' : columns,
      availableFields: Object.keys(blogPost)
    });

  } catch (error) {
    console.error('디버그 API 오류:', error);
    return res.status(500).json({ 
      error: '디버그 API 오류', 
      details: error.message,
      stack: error.stack 
    });
  }
}
