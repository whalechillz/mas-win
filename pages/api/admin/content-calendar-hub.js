import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  } else if (req.method === 'POST') {
    return handlePost(req, res);
  } else if (req.method === 'PUT') {
    return handlePut(req, res);
  } else if (req.method === 'DELETE') {
    return handleDelete(req, res);
  } else if (req.method === 'PATCH') {
    return handlePatch(req, res);
  } else {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
}

// GET 요청 처리 - 허브 콘텐츠 조회
async function handleGet(req, res) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ 
      success: false, 
      message: '서버 설정 오류'
    });
  }

  try {
    console.log('🔍 허브 콘텐츠 조회 시작');
    
    const { page = 1, limit = 20, date_from, date_to } = req.query;
    const offset = (page - 1) * limit;
    
    console.log('📊 페이지네이션 파라미터:', { page, limit, offset, date_from, date_to });
    
    // 허브 콘텐츠 조회 (채널별 상태 포함)
    let query = supabase
      .from('cc_content_calendar')
      .select(`
        id, title, summary, content_body, content_date,
        blog_post_id, sms_id, naver_blog_id, kakao_id,
        channel_status, is_hub_content, hub_priority,
        auto_derive_channels, created_at, updated_at
      `, { count: 'exact' })
      .eq('is_hub_content', true)
      .order('content_date', { ascending: false })
      .range(offset, offset + limit - 1);

    // 날짜 필터 적용
    if (date_from) query = query.gte('content_date', date_from);
    if (date_to) query = query.lte('content_date', date_to);

    const { data: contents, error, count } = await query;
    
    console.log('📅 허브 콘텐츠 조회 결과:', {
      dataLength: contents ? contents.length : 0,
      error: error
    });

    // 디버깅: 첫 번째 콘텐츠의 채널 상태 확인
    if (contents && contents.length > 0) {
      console.log('🔍 첫 번째 콘텐츠 채널 상태:', contents[0].channel_status);
    }

    if (error) {
      console.error('❌ 허브 콘텐츠 조회 오류:', error);
      return res.status(500).json({
        success: false,
        error: '허브 콘텐츠 조회 실패',
        details: error.message
      });
    }

    // 전체 통계 계산 (페이지네이션과 별개)
    const overallStats = {
      total: count || 0, // 전체 개수 사용
      blog: { connected: 0, total: count || 0 },
      sms: { connected: 0, total: count || 0 },
      naver_blog: { connected: 0, total: count || 0 },
      kakao: { connected: 0, total: count || 0 }
    };

    // 각 채널별 연결된 콘텐츠 수 계산
    try {
      // 블로그 연결 수 계산
      const { count: blogConnected } = await supabase
        .from('cc_content_calendar')
        .select('*', { count: 'exact', head: true })
        .not('blog_post_id', 'is', null)
        .eq('is_hub_content', true);
      
      overallStats.blog.connected = blogConnected || 0;

      // SMS 연결 수 계산
      const { count: smsConnected } = await supabase
        .from('cc_content_calendar')
        .select('*', { count: 'exact', head: true })
        .not('sms_id', 'is', null)
        .eq('is_hub_content', true);
      
      overallStats.sms.connected = smsConnected || 0;

      // 네이버 블로그 연결 수 계산
      const { count: naverConnected } = await supabase
        .from('cc_content_calendar')
        .select('*', { count: 'exact', head: true })
        .not('naver_blog_id', 'is', null)
        .eq('is_hub_content', true);
      
      overallStats.naver_blog.connected = naverConnected || 0;

      // 카카오 연결 수 계산
      const { count: kakaoConnected } = await supabase
        .from('cc_content_calendar')
        .select('*', { count: 'exact', head: true })
        .not('kakao_id', 'is', null)
        .eq('is_hub_content', true);
      
      overallStats.kakao.connected = kakaoConnected || 0;

    } catch (statsError) {
      console.error('❌ 통계 계산 오류:', statsError);
    }

    console.log('📊 전체 통계:', overallStats);
    console.log('✅ 허브 콘텐츠 조회 완료:', contents ? contents.length : 0, '개');

    res.status(200).json({ 
      success: true, 
      data: contents || [],
      stats: overallStats, // 전체 통계 사용
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasMore: offset + limit < (count || 0)
      }
    });

  } catch (error) {
    console.error('❌ 허브 콘텐츠 조회 오류:', error);
    res.status(500).json({ 
      success: false, 
      message: '허브 콘텐츠 조회 실패', 
      error: error.message
    });
  }
}

// POST 요청 처리 - 새 허브 콘텐츠 생성
async function handlePost(req, res) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ 
      success: false, 
      message: '서버 설정 오류'
    });
  }

  try {
    console.log('🎯 새 허브 콘텐츠 생성 시작');
    
    const { 
      title, 
      summary,
      content_body, 
      content_date,
      auto_derive_channels = ['blog', 'sms', 'naver_blog', 'kakao']
    } = req.body;

    if (!title || !content_body) {
      return res.status(400).json({ 
        success: false, 
        message: '제목과 내용은 필수입니다.' 
      });
    }

    // 새 허브 콘텐츠 생성
    const insertData = {
      title,
      summary: summary || '',
      content_body,
      content_date: content_date || new Date().toISOString().split('T')[0],
      is_hub_content: true,
      hub_priority: 1,
      auto_derive_channels,
      channel_status: {
        blog: { status: '미연결', post_id: null, created_at: null },
        sms: { status: '미발행', post_id: null, created_at: null },
        naver_blog: { status: '미발행', post_id: null, created_at: null },
        kakao: { status: '미발행', post_id: null, created_at: null }
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newContent, error: createError } = await supabase
      .from('cc_content_calendar')
      .insert(insertData)
      .select()
      .single();

    if (createError) {
      console.error('❌ 허브 콘텐츠 생성 오류:', createError);
      return res.status(500).json({ 
        success: false, 
        message: '허브 콘텐츠 생성에 실패했습니다.',
        error: createError.message 
      });
    }

    console.log('✅ 허브 콘텐츠 생성 완료:', newContent.id);
    
    return res.status(200).json({
      success: true,
      message: '허브 콘텐츠가 생성되었습니다.',
      content: newContent
    });

  } catch (error) {
    console.error('❌ 허브 콘텐츠 생성 오류:', error);
    return res.status(500).json({ 
      success: false, 
      message: '허브 콘텐츠 생성 중 오류가 발생했습니다.',
      error: error.message 
    });
  }
}

// PUT 요청 처리 - 허브 콘텐츠 수정
async function handlePut(req, res) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ 
      success: false, 
      message: '서버 설정 오류'
    });
  }

  try {
    console.log('✏️ 허브 콘텐츠 수정 시작');
    
    const { id, title, summary, content_body, content_date } = req.body;

    if (!id || !title || !content_body) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID, 제목, 내용은 필수입니다.' 
      });
    }

    // 허브 콘텐츠 수정
    const updateData = {
      title,
      summary: summary || '',
      content_body,
      content_date: content_date || new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString()
    };

    const { data: updatedContent, error: updateError } = await supabase
      .from('cc_content_calendar')
      .update(updateData)
      .eq('id', id)
      .eq('is_hub_content', true)
      .select()
      .single();

    if (updateError) {
      console.error('❌ 허브 콘텐츠 수정 오류:', updateError);
      return res.status(500).json({ 
        success: false, 
        message: '허브 콘텐츠 수정에 실패했습니다.',
        error: updateError.message 
      });
    }

    console.log('✅ 허브 콘텐츠 수정 완료:', updatedContent.id);
    
    return res.status(200).json({
      success: true,
      message: '허브 콘텐츠가 수정되었습니다.',
      content: updatedContent
    });

  } catch (error) {
    console.error('❌ 허브 콘텐츠 수정 오류:', error);
    return res.status(500).json({ 
      success: false, 
      message: '허브 콘텐츠 수정 중 오류가 발생했습니다.',
      error: error.message 
    });
  }
}

// DELETE 요청 처리 - 허브 콘텐츠 삭제
async function handleDelete(req, res) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ 
      success: false, 
      message: '서버 설정 오류'
    });
  }

  try {
    console.log('🗑️ 허브 콘텐츠 삭제 시작');
    
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID는 필수입니다.' 
      });
    }

    // 허브 콘텐츠 삭제
    const { error: deleteError } = await supabase
      .from('cc_content_calendar')
      .delete()
      .eq('id', id)
      .eq('is_hub_content', true);

    if (deleteError) {
      console.error('❌ 허브 콘텐츠 삭제 오류:', deleteError);
      return res.status(500).json({ 
        success: false, 
        message: '허브 콘텐츠 삭제에 실패했습니다.',
        error: deleteError.message 
      });
    }

    console.log('✅ 허브 콘텐츠 삭제 완료:', id);
    
    return res.status(200).json({
      success: true,
      message: '허브 콘텐츠가 삭제되었습니다.'
    });

  } catch (error) {
    console.error('❌ 허브 콘텐츠 삭제 오류:', error);
    return res.status(500).json({ 
      success: false, 
      message: '허브 콘텐츠 삭제 중 오류가 발생했습니다.',
      error: error.message 
    });
  }
}

// PATCH 요청 처리 - 채널별 상태 업데이트
async function handlePatch(req, res) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ 
      success: false, 
      message: '서버 설정 오류'
    });
  }

  try {
    console.log('🔄 채널 상태 업데이트 시작');
    
    const { action, contentId, channel, status, postId } = req.body;

    if (!action || !contentId || !channel) {
      return res.status(400).json({ 
        success: false, 
        message: '액션, 콘텐츠 ID, 채널은 필수입니다.' 
      });
    }

    switch (action) {
      case 'update_channel_status':
        return await updateChannelStatus(contentId, channel, status, postId, res);
      
      case 'create_channel_draft':
        return await createChannelDraft(contentId, channel, res);
      
      default:
        return res.status(400).json({ 
          success: false, 
          message: '지원하지 않는 액션입니다.' 
        });
    }

  } catch (error) {
    console.error('❌ 채널 상태 업데이트 오류:', error);
    return res.status(500).json({ 
      success: false, 
      message: '채널 상태 업데이트 중 오류가 발생했습니다.',
      error: error.message 
    });
  }
}

// 채널별 상태 업데이트
async function updateChannelStatus(contentId, channel, status, postId, res) {
  try {
    console.log('🔄 채널 상태 업데이트:', contentId, channel, status);
    
    // 허브 콘텐츠 조회
    const { data: content, error: fetchError } = await supabase
      .from('cc_content_calendar')
      .select('channel_status')
      .eq('id', contentId)
      .eq('is_hub_content', true)
      .single();

    if (fetchError || !content) {
      return res.status(404).json({ 
        success: false, 
        message: '허브 콘텐츠를 찾을 수 없습니다.' 
      });
    }

    // 채널별 상태 업데이트
    const currentChannelStatus = content.channel_status || {};
    currentChannelStatus[channel] = {
      status: status,
      post_id: postId,
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('cc_content_calendar')
      .update({ 
        channel_status: currentChannelStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', contentId);

    if (updateError) {
      console.error('❌ 채널 상태 업데이트 오류:', updateError);
      return res.status(500).json({ 
        success: false, 
        message: '채널 상태 업데이트에 실패했습니다.',
        error: updateError.message 
      });
    }

    console.log('✅ 채널 상태 업데이트 완료:', channel, status);
    
    return res.status(200).json({
      success: true,
      message: '채널 상태가 업데이트되었습니다.'
    });

  } catch (error) {
    console.error('❌ 채널 상태 업데이트 오류:', error);
    throw error;
  }
}

// 채널별 초안 생성
async function createChannelDraft(contentId, channel, res) {
  try {
    console.log('📝 채널 초안 생성:', contentId, channel);
    
    // 허브 콘텐츠 조회
    const { data: content, error: fetchError } = await supabase
      .from('cc_content_calendar')
      .select('*')
      .eq('id', contentId)
      .eq('is_hub_content', true)
      .single();

    if (fetchError || !content) {
      return res.status(404).json({ 
        success: false, 
        message: '허브 콘텐츠를 찾을 수 없습니다.' 
      });
    }

    // 채널별 초안 생성 로직
    let newPostId = null;
    
    switch(channel) {
      case 'sms':
        // SMS 초안 생성
        const { data: smsDraft, error: smsError } = await supabase
          .from('sms_campaigns')
          .insert({
            title: content.title,
            content: content.summary || content.content_body,
            status: 'draft',
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (smsError) throw smsError;
        newPostId = smsDraft.id;
        break;
        
      case 'naver_blog':
        // 네이버 블로그 초안 생성
        const { data: naverDraft, error: naverError } = await supabase
          .from('naver_blog_posts')
          .insert({
            title: content.title,
            content: content.content_body,
            status: 'draft',
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (naverError) throw naverError;
        newPostId = naverDraft.id;
        break;
        
      case 'kakao':
        // 카카오톡 초안 생성
        const { data: kakaoDraft, error: kakaoError } = await supabase
          .from('kakao_messages')
          .insert({
            title: content.title,
            content: content.summary || content.content_body,
            status: 'draft',
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (kakaoError) throw kakaoError;
        newPostId = kakaoDraft.id;
        break;
        
      default:
        return res.status(400).json({ 
          success: false, 
          message: '지원하지 않는 채널입니다.' 
        });
    }

    // 채널 상태 업데이트
    await updateChannelStatus(contentId, channel, '수정중', newPostId, res);

    console.log('✅ 채널 초안 생성 완료:', newPostId);
    
    return res.status(200).json({
      success: true,
      message: `${channel} 초안이 생성되었습니다.`,
      postId: newPostId
    });

  } catch (error) {
    console.error('❌ 채널 초안 생성 오류:', error);
    throw error;
  }
}
