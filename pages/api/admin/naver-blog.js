// 네이버 블로그 관리 API (SMS와 동일한 구조)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // 네이버 블로그 목록 조회
    try {
      const { id, hub_content_id } = req.query;
      
      let query = supabase
        .from('channel_naver_blog')
        .select('*, calendar_id')
        .order('created_at', { ascending: false });

      if (id) {
        query = query.eq('id', id);
      }

      if (hub_content_id) {
        query = query.eq('calendar_id', hub_content_id);
      }

      const { data: naverBlogs, error } = await query;

      if (error) {
        console.error('❌ 네이버 블로그 조회 오류:', error);
        return res.status(500).json({
          success: false,
          message: '네이버 블로그를 불러올 수 없습니다.',
          error: error.message
        });
      }

      return res.status(200).json({
        success: true,
        data: naverBlogs || []
      });

    } catch (error) {
      console.error('❌ 네이버 블로그 조회 중 오류:', error);
      return res.status(500).json({
        success: false,
        message: '네이버 블로그 조회 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  if (req.method === 'POST') {
    // 네이버 블로그 생성
    try {
      const { title, content, excerpt, account_name, status, hub_content_id } = req.body;

      if (!title || !content) {
        return res.status(400).json({
          success: false,
          message: '제목과 내용은 필수입니다.'
        });
      }

      const { data: newNaverBlog, error } = await supabase
        .from('channel_naver_blog')
        .insert({
          title,
          content,
          excerpt: excerpt || '',
          account_name: account_name || 'default',
          status: status || 'draft',
          calendar_id: hub_content_id || null, // 허브 ID를 calendar_id에 저장
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ 네이버 블로그 생성 오류:', error);
        return res.status(500).json({
          success: false,
          message: '네이버 블로그 생성에 실패했습니다.',
          error: error.message
        });
      }

      // 허브 상태 동기화
      if (hub_content_id) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/sync-channel-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              hubContentId: hub_content_id,
              channel: 'naver_blog',
              channelContentId: newNaverBlog.id,
              status: '수정중'
            })
          });
        } catch (syncError) {
          console.error('❌ 허브 상태 동기화 오류:', syncError);
        }
      }

      return res.status(200).json({
        success: true,
        message: '네이버 블로그가 생성되었습니다.',
        naverBlogId: newNaverBlog.id,
        naverBlogContent: newNaverBlog
      });

    } catch (error) {
      console.error('❌ 네이버 블로그 생성 중 오류:', error);
      return res.status(500).json({
        success: false,
        message: '네이버 블로그 생성 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  if (req.method === 'PUT') {
    // 네이버 블로그 수정
    try {
      const { id, title, content, excerpt, account_name, status, hub_content_id } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: '네이버 블로그 ID가 필요합니다.'
        });
      }

      const updateData = {
        updated_at: new Date().toISOString()
      };

      if (title) updateData.title = title;
      if (content) updateData.content = content;
      if (excerpt !== undefined) updateData.excerpt = excerpt;
      if (account_name) updateData.account_name = account_name;
      if (status) updateData.status = status;
      if (hub_content_id) updateData.calendar_id = hub_content_id;

      const { data: updatedNaverBlog, error } = await supabase
        .from('channel_naver_blog')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ 네이버 블로그 수정 오류:', error);
        return res.status(500).json({
          success: false,
          message: '네이버 블로그 수정에 실패했습니다.',
          error: error.message
        });
      }

      // 허브 상태 동기화
      if (hub_content_id) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/sync-channel-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              hubContentId: hub_content_id,
              channel: 'naver_blog',
              channelContentId: id,
              status: '수정중'
            })
          });
        } catch (syncError) {
          console.error('❌ 허브 상태 동기화 오류:', syncError);
        }
      }

      return res.status(200).json({
        success: true,
        message: '네이버 블로그가 수정되었습니다.',
        naverBlogContent: updatedNaverBlog
      });

    } catch (error) {
      console.error('❌ 네이버 블로그 수정 중 오류:', error);
      return res.status(500).json({
        success: false,
        message: '네이버 블로그 수정 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  if (req.method === 'DELETE') {
    // 네이버 블로그 삭제
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: '네이버 블로그 ID가 필요합니다.'
        });
      }

      const { error } = await supabase
        .from('channel_naver_blog')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ 네이버 블로그 삭제 오류:', error);
        return res.status(500).json({
          success: false,
          message: '네이버 블로그 삭제에 실패했습니다.',
          error: error.message
        });
      }

      return res.status(200).json({
        success: true,
        message: '네이버 블로그가 삭제되었습니다.'
      });

    } catch (error) {
      console.error('❌ 네이버 블로그 삭제 중 오류:', error);
      return res.status(500).json({
        success: false,
        message: '네이버 블로그 삭제 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: '허용되지 않은 메서드입니다.'
  });
}
