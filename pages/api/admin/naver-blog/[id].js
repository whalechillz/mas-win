import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const { data: post, error } = await supabase
        .from('naver_blog_posts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('네이버 블로그 조회 오류:', error);
        return res.status(500).json({
          success: false,
          error: '네이버 블로그를 불러올 수 없습니다.',
          details: error.message
        });
      }

      if (!post) {
        return res.status(404).json({
          success: false,
          error: '네이버 블로그를 찾을 수 없습니다.'
        });
      }

      return res.status(200).json({
        success: true,
        data: post
      });
    } catch (error) {
      console.error('네이버 블로그 조회 오류:', error);
      return res.status(500).json({
        success: false,
        error: '네이버 블로그 조회 중 오류가 발생했습니다.',
        details: error.message
      });
    }
  }

  if (req.method === 'PUT') {
    try {
      const updateData = req.body;

      // 필수 필드 검증
      if (!updateData.title || updateData.title.trim() === '') {
        return res.status(400).json({
          success: false,
          error: '제목은 필수입니다.',
          details: 'title field is required'
        });
      }

      if (!updateData.content || updateData.content.trim() === '') {
        return res.status(400).json({
          success: false,
          error: '내용은 필수입니다.',
          details: 'content field is required'
        });
      }

      // 데이터 정규화
      const finalData = {
        title: updateData.title.trim(),
        content: updateData.content.trim(),
        excerpt: updateData.excerpt || '',
        status: updateData.status || 'draft',
        category: updateData.category || '골프',
        tags: updateData.tags || [],
        featured_image: updateData.featured_image || null,
        meta_title: updateData.meta_title || '',
        meta_description: updateData.meta_description || '',
        meta_keywords: updateData.meta_keywords || '',
        naver_blog_id: updateData.naver_blog_id || '',
        naver_post_url: updateData.naver_post_url || '',
        naver_tags: updateData.naver_tags || [],
        naver_category: updateData.naver_category || '골프',
        naver_visibility: updateData.naver_visibility || 'public',
        naver_allow_comments: updateData.naver_allow_comments !== false,
        naver_allow_trackbacks: updateData.naver_allow_trackbacks !== false,
        updated_at: new Date().toISOString()
      };

      const { data: updatedPost, error } = await supabase
        .from('naver_blog_posts')
        .update(finalData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('네이버 블로그 수정 오류:', error);
        return res.status(500).json({
          success: false,
          error: '네이버 블로그를 수정할 수 없습니다.',
          details: error.message
        });
      }

      return res.status(200).json({
        success: true,
        message: '네이버 블로그가 성공적으로 수정되었습니다.',
        data: updatedPost
      });
    } catch (error) {
      console.error('네이버 블로그 수정 오류:', error);
      return res.status(500).json({
        success: false,
        error: '네이버 블로그 수정 중 오류가 발생했습니다.',
        details: error.message
      });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('naver_blog_posts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('네이버 블로그 삭제 오류:', error);
        return res.status(500).json({
          success: false,
          error: '네이버 블로그를 삭제할 수 없습니다.',
          details: error.message
        });
      }

      return res.status(200).json({
        success: true,
        message: '네이버 블로그가 성공적으로 삭제되었습니다.'
      });
    } catch (error) {
      console.error('네이버 블로그 삭제 오류:', error);
      return res.status(500).json({
        success: false,
        error: '네이버 블로그 삭제 중 오류가 발생했습니다.',
        details: error.message
      });
    }
  }

  return res.status(405).json({
    success: false,
    error: 'Method not allowed'
  });
}
