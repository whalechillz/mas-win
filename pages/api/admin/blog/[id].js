// 개별 게시물 관리 API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  const { id } = req.query;
  console.log('🔍 개별 게시물 API 요청:', req.method, 'ID:', id);
  
  try {
    if (req.method === 'GET') {
      // 게시물 조회
      console.log('📖 게시물 조회 중...', id);
      
      const { data: post, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('❌ 게시물 조회 오류:', error);
        return res.status(404).json({
          error: '게시물을 찾을 수 없습니다.',
          details: error.message
        });
      }
      
      if (!post) {
        return res.status(404).json({
          error: '게시물이 존재하지 않습니다.'
        });
      }
      
      console.log('✅ 게시물 조회 성공:', post.id);
      return res.status(200).json({ post });
      
    } else if (req.method === 'PUT') {
      // 게시물 수정
      console.log('📝 게시물 수정 중...');
      
      const updateData = req.body;
      console.log('수정 데이터:', JSON.stringify(updateData, null, 2));
      
      // 데이터베이스에 존재하는 필드만 허용
      const allowedFields = [
        'title', 'slug', 'excerpt', 'content', 'featured_image', 'category', 
        'tags', 'status', 'meta_title', 'meta_description', 'meta_keywords',
        'view_count', 'is_featured', 'is_scheduled', 'scheduled_at', 'author',
        'summary', 'customerPersona', 'published_at', 'created_at'
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
        scheduled_at: filteredData.scheduled_at && filteredData.scheduled_at !== '' ? filteredData.scheduled_at : null,
        published_at: filteredData.published_at && filteredData.published_at !== '' ? filteredData.published_at : null,
        created_at: filteredData.created_at && filteredData.created_at !== '' ? filteredData.created_at : null
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
      
      // created_at이 변경된 경우 콘텐츠 캘린더의 content_date도 업데이트
      if (filteredData.created_at) {
        try {
          const { error: calendarError } = await supabase
            .from('cc_content_calendar')
            .update({
              content_date: new Date(filteredData.created_at).toISOString().split('T')[0]
            })
            .eq('blog_post_id', id);
          
          if (calendarError) {
            console.error('❌ 콘텐츠 캘린더 날짜 업데이트 오류:', calendarError);
          } else {
            console.log('✅ 콘텐츠 캘린더 날짜 업데이트 완료');
          }
        } catch (error) {
          console.error('❌ 콘텐츠 캘린더 업데이트 중 오류:', error);
        }
      }
      
      return res.status(200).json({ post: updatedPost });
      
    } else if (req.method === 'DELETE') {
      // 게시물 삭제
      console.log('🗑️ 게시물 삭제 중...');
      
      // 삭제 전에 허브 연결 정보 확인
      const { data: blogData, error: fetchError } = await supabase
        .from('blog_posts')
        .select('calendar_id')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('❌ 블로그 데이터 조회 오류:', fetchError);
        return res.status(500).json({
          error: '블로그 데이터를 조회할 수 없습니다.',
          details: fetchError.message
        });
      }
      
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
      
      // ✅ 허브 상태 완전 동기화 (블로그 삭제 시 blog_post_id + channel_status 모두 업데이트)
      if (blogData?.calendar_id) {
        try {
          // 허브 콘텐츠 조회
          const { data: hubContent, error: hubFetchError } = await supabase
            .from('cc_content_calendar')
            .select('channel_status, blog_post_id')
            .eq('id', blogData.calendar_id)
            .single();
          
          if (!hubFetchError && hubContent) {
            // channel_status에서 blog 채널 제거/업데이트
            const currentChannels = hubContent.channel_status || {};
            const updatedChannels = { ...currentChannels };
            
            // blog 채널 상태를 미발행으로 변경
            updatedChannels['blog'] = {
              status: '미발행',
              post_id: null,
              updated_at: new Date().toISOString()
            };
            
            // ✅ 허브 콘텐츠 업데이트 (blog_post_id도 null로, channel_status도 업데이트)
            const { error: updateError } = await supabase
              .from('cc_content_calendar')
              .update({
                blog_post_id: null,
                channel_status: updatedChannels,
                updated_at: new Date().toISOString()
              })
              .eq('id', blogData.calendar_id);
          
            if (updateError) {
              console.error('❌ 블로그 삭제 후 허브 상태 업데이트 실패:', updateError);
            } else {
              console.log('✅ 블로그 삭제 후 허브 상태 완전 동기화 완료 (blog_post_id + channel_status)');
            }
          } else {
            console.error('❌ 허브 콘텐츠 조회 실패:', hubFetchError);
          }
        } catch (syncError) {
          console.error('❌ 블로그 삭제 후 허브 상태 동기화 오류:', syncError);
        }
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