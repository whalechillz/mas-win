import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { id, calendar_id } = req.query;
      
      // 특정 ID로 조회하는 경우
      if (id) {
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

        return res.status(200).json({
          success: true,
          data: post
        });
      }

      // calendar_id로 필터링된 네이버 블로그 포스트 조회
      if (calendar_id) {
        console.log('📝 허브별 네이버 블로그 포스트 조회 중:', calendar_id);
        
        const { data: posts, error } = await supabase
          .from('naver_blog_posts')
          .select('*')
          .eq('calendar_id', calendar_id)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('❌ 허브별 네이버 블로그 조회 에러:', error);
          return res.status(500).json({
            error: '네이버 블로그 포스트를 불러올 수 없습니다.',
            details: error.message
          });
        }
        
        console.log('✅ 허브별 네이버 블로그 조회 성공:', posts.length, '개');
        return res.status(200).json({
          success: true,
          data: posts || []
        });
      }

      // 전체 네이버 블로그 목록 조회
      const { data: posts, error } = await supabase
        .from('naver_blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('네이버 블로그 목록 조회 오류:', error);
        return res.status(500).json({
          success: false,
          error: '네이버 블로그 목록을 불러올 수 없습니다.',
          details: error.message
        });
      }

      return res.status(200).json({
        success: true,
        data: posts || []
      });
    } catch (error) {
      console.error('네이버 블로그 목록 조회 오류:', error);
      return res.status(500).json({
        success: false,
        error: '네이버 블로그 목록 조회 중 오류가 발생했습니다.',
        details: error.message
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const postData = req.body;

      // 필수 필드 검증
      if (!postData.title || postData.title.trim() === '') {
        return res.status(400).json({
          success: false,
          error: '제목은 필수입니다.',
          details: 'title field is required'
        });
      }

      if (!postData.content || postData.content.trim() === '') {
        return res.status(400).json({
          success: false,
          error: '내용은 필수입니다.',
          details: 'content field is required'
        });
      }

      // 데이터 정규화
      const finalData = {
        title: postData.title.trim(),
        content: postData.content.trim(),
        excerpt: postData.excerpt || '',
        status: postData.status || 'draft',
        category: postData.category || '골프',
        tags: postData.tags || [],
        featured_image: postData.featured_image || null,
        meta_title: postData.meta_title || '',
        meta_description: postData.meta_description || '',
        meta_keywords: postData.meta_keywords || '',
        naver_blog_id: postData.naver_blog_id || '',
        naver_post_url: postData.naver_post_url || '',
        naver_tags: postData.naver_tags || [],
        naver_category: postData.naver_category || '골프',
        naver_visibility: postData.naver_visibility || 'public',
        naver_allow_comments: postData.naver_allow_comments !== false,
        naver_allow_trackbacks: postData.naver_allow_trackbacks !== false,
        calendar_id: postData.hub_content_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newPost, error } = await supabase
        .from('naver_blog_posts')
        .insert(finalData)
        .select()
        .single();

      if (error) {
        console.error('네이버 블로그 생성 오류:', error);
        return res.status(500).json({
          success: false,
          error: '네이버 블로그를 저장할 수 없습니다.',
          details: error.message
        });
      }

      // 허브 연동 처리 (calendar_id가 있는 경우)
      if (postData.hub_content_id) {
        try {
          console.log('🔗 네이버 블로그 허브 상태 동기화 시작:', postData.hub_content_id);
          
          // 허브 콘텐츠의 channel_status 업데이트
          const { data: hubData, error: hubFetchError } = await supabase
            .from('cc_content_calendar')
            .select('channel_status')
            .eq('id', postData.hub_content_id)
            .single();
          
          if (hubFetchError) {
            console.error('❌ 허브 데이터 조회 오류:', hubFetchError);
          } else {
            const currentStatus = hubData.channel_status || {};
            const updatedStatus = {
              ...currentStatus,
              naver_blog: {
                status: '연결됨',
                post_id: newPost.id,
                created_at: new Date().toISOString()
              }
            };
            
            const { error: hubError } = await supabase
              .from('cc_content_calendar')
              .update({ channel_status: updatedStatus })
              .eq('id', postData.hub_content_id);
            
            if (hubError) {
              console.error('❌ 허브 상태 업데이트 오류:', hubError);
            } else {
              console.log('✅ 네이버 블로그 허브 상태 동기화 성공');
            }
          }
        } catch (syncError) {
          console.error('❌ 네이버 블로그 허브 연동 처리 오류:', syncError);
        }
      }

      return res.status(201).json({
        success: true,
        message: '네이버 블로그가 성공적으로 생성되었습니다.',
        data: newPost
      });
    } catch (error) {
      console.error('네이버 블로그 생성 오류:', error);
      return res.status(500).json({
        success: false,
        error: '네이버 블로그 생성 중 오류가 발생했습니다.',
        details: error.message
      });
    }
  }

  return res.status(405).json({
    success: false,
    error: 'Method not allowed'
  });
}