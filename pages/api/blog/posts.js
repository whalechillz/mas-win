// 깔끔한 블로그 게시물 API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  console.log('🔍 블로그 API 요청:', req.method, req.url);
  
  try {
    if (req.method === 'GET') {
      const { page = 1, limit = 6 } = req.query;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit - 1;
      
      console.log('📝 게시물 목록 조회 중...', { page, limit, startIndex, endIndex });
      
      // 전체 게시물 수 조회
      const { count: totalCount } = await supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');
      
      // 페이지네이션된 게시물 조회
      const { data: posts, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .range(startIndex, endIndex);
      
      if (error) {
        console.error('❌ Supabase 쿼리 에러:', error);
        return res.status(500).json({
          error: '게시물을 불러올 수 없습니다.',
          details: error.message
        });
      }
      
      const totalPages = Math.ceil(totalCount / limit);
      
      console.log('✅ 게시물 조회 성공:', {
        postsCount: posts?.length || 0,
        totalCount,
        currentPage: parseInt(page),
        totalPages
      });
      
      return res.status(200).json({
        posts: posts || [],
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalPosts: totalCount,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      });
      
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('❌ API 에러:', error);
    return res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      details: error.message
    });
  }
}