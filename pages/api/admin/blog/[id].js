// 개별 게시물 관리 API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  const { id } = req.query;
  console.log('🔍 개별 게시물 API 요청:', req.method, 'ID:', id);
  
  try {
    if (req.method === 'PUT') {
      // 게시물 수정
      console.log('📝 게시물 수정 중...');
      
      const updateData = req.body;
      console.log('수정 데이터:', updateData);
      
      const { data: updatedPost, error } = await supabase
        .from('blog_posts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ 게시물 수정 에러:', error);
        return res.status(500).json({
          error: '게시물을 수정할 수 없습니다.',
          details: error.message
        });
      }
      
      console.log('✅ 게시물 수정 성공:', updatedPost.id);
      return res.status(200).json({ post: updatedPost });
      
    } else if (req.method === 'DELETE') {
      // 게시물 삭제
      console.log('🗑️ 게시물 삭제 중...');
      
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('❌ 게시물 삭제 에러:', error);
        return res.status(500).json({
          error: '게시물을 삭제할 수 없습니다.',
          details: error.message
        });
      }
      
      console.log('✅ 게시물 삭제 성공:', id);
      return res.status(200).json({ success: true });
      
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