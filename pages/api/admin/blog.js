// 깔끔한 블로그 관리자 API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '설정됨' : '없음');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '설정됨' : '없음');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  console.log('🔍 관리자 API 요청:', req.method, req.url);
  
  try {
    if (req.method === 'GET') {
      // 게시물 목록 조회
      console.log('📝 게시물 목록 조회 중...');
      
      // 정렬 옵션 파라미터 처리
      const { sortBy = 'published_at', sortOrder = 'desc' } = req.query;
      console.log('정렬 옵션:', { sortBy, sortOrder });
      
      // 정렬 옵션 검증
      const validSortFields = ['published_at', 'created_at', 'updated_at', 'title', 'view_count'];
      const validSortOrders = ['asc', 'desc'];
      
      const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'published_at';
      const finalSortOrder = validSortOrders.includes(sortOrder) ? sortOrder : 'desc';
      
      const { data: posts, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order(finalSortBy, { ascending: finalSortOrder === 'asc' });
      
      if (error) {
        console.error('❌ Supabase 쿼리 에러:', error);
        return res.status(500).json({
          error: '게시물을 불러올 수 없습니다.',
          details: error.message
        });
      }
      
      console.log('✅ 게시물 조회 성공:', posts?.length || 0, '개');
      return res.status(200).json({ posts: posts || [] });
      
    } else if (req.method === 'POST') {
      // 새 게시물 생성
      console.log('📝 새 게시물 생성 중...');
      
      const postData = req.body;
      console.log('게시물 데이터:', postData);
      
      const { data: newPost, error } = await supabase
        .from('blog_posts')
        .insert([postData])
        .select()
        .single();
      
      if (error) {
        console.error('❌ 게시물 생성 에러:', error);
        return res.status(500).json({
          error: '게시물을 저장할 수 없습니다.',
          details: error.message
        });
      }
      
      console.log('✅ 게시물 생성 성공:', newPost.id);
      return res.status(201).json({ post: newPost });
      
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