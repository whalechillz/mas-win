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
      console.log('수정 데이터:', JSON.stringify(updateData, null, 2));
      
      // 데이터베이스에 존재하는 필드만 허용
      const allowedFields = [
        'title', 'slug', 'excerpt', 'content', 'featured_image', 'category', 
        'tags', 'status', 'meta_title', 'meta_description', 'meta_keywords',
        'view_count', 'is_featured', 'is_scheduled', 'scheduled_at', 'author',
        'summary', 'customerPersona', 'published_at'
      ];
      
      // 허용된 필드만 추출
      const filteredData = {};
      allowedFields.forEach(field => {
        if (updateData.hasOwnProperty(field)) {
          filteredData[field] = updateData[field];
        }
      });
      
      // 데이터 검증 및 정리
      const cleanedData = {
        ...filteredData,
        // tags가 문자열인 경우 배열로 변환
        tags: Array.isArray(filteredData.tags) ? filteredData.tags : 
              typeof filteredData.tags === 'string' ? filteredData.tags.split(',').map(t => t.trim()).filter(t => t) : 
              [],
        // 숫자 필드 검증
        view_count: parseInt(filteredData.view_count) || 0,
        is_featured: Boolean(filteredData.is_featured),
        is_scheduled: Boolean(filteredData.is_scheduled),
        // 날짜 필드 검증
        scheduled_at: filteredData.scheduled_at || null,
        published_at: filteredData.published_at || null
      };
      
      console.log('정리된 데이터:', JSON.stringify(cleanedData, null, 2));
      
      const { data: updatedPost, error } = await supabase
        .from('blog_posts')
        .update(cleanedData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ 게시물 수정 에러:', error);
        console.error('에러 코드:', error.code);
        console.error('에러 메시지:', error.message);
        console.error('에러 세부사항:', error.details);
        console.error('에러 힌트:', error.hint);
        
        return res.status(500).json({
          error: '게시물을 수정할 수 없습니다.',
          details: error.message,
          code: error.code,
          hint: error.hint
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