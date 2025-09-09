 // 깔끔한 블로그 게시물 API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  console.log('🔍 블로그 API 요청:', req.method, req.url);
  
  try {
    if (req.method === 'GET') {
      const { page = 1, limit = 6, category } = req.query;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit - 1;
      
      console.log('📝 게시물 목록 조회 중...', { page, limit, category, startIndex, endIndex });
      
      // 전체 게시물 수 조회용 쿼리
      let countQuery = supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');
      
      // 카테고리 필터링 추가
      if (category && category !== '전체') {
        countQuery = countQuery.eq('category', category);
      }
      
      // 전체 게시물 수 조회
      const { count: totalCount } = await countQuery;
      
      // 페이지네이션된 게시물 조회용 쿼리
      let postsQuery = supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published');
      
      // 카테고리 매핑 (기존 카테고리를 새로운 카테고리로 변환)
      const categoryMapping = {
        '골프': '비거리 향상 드라이버',
        '드라이버': '맞춤형 드라이버', 
        '후기': '고객 성공 스토리',
        '이벤트': '이벤트 & 프로모션'
      };
      
      // 카테고리 필터링 추가
      if (category && category !== '전체') {
        // 새로운 카테고리명으로 필터링
        postsQuery = postsQuery.eq('category', category);
      }
      
      // 페이지네이션된 게시물 조회 (추천 글 우선, 그 다음 최신 순)
      const { data: posts, error } = await postsQuery
        .order('is_featured', { ascending: false })
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
      
      // 게시물 카테고리 변환
      const transformedPosts = (posts || []).map(post => ({
        ...post,
        category: categoryMapping[post.category] || post.category
      }));
      
      console.log('✅ 게시물 조회 성공:', {
        postsCount: transformedPosts?.length || 0,
        totalCount,
        currentPage: parseInt(page),
        totalPages
      });
      
      return res.status(200).json({
        posts: transformedPosts,
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