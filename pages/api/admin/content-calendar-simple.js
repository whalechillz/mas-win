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
  } else {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
}

// GET 요청 처리 - 핵심 필드만 조회
async function handleGet(req, res) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ 
      success: false, 
      message: '서버 설정 오류'
    });
  }

  try {
    console.log('🔍 콘텐츠 캘린더 API 시작 (간소화 버전)');
    
    // 쿼리 파라미터 추출
    const { page = 1, limit = 50, status, content_type } = req.query;
    const offset = (page - 1) * limit;
    
    console.log('📊 페이지네이션 파라미터:', { page, limit, offset, status, content_type });
    
    // 핵심 필드만 조회
    let query = supabase
      .from('cc_content_calendar')
      .select('id, title, summary, content_body, content_type, content_date, status, blog_post_id, created_at, updated_at', { count: 'exact' })
      .order('content_date', { ascending: false })
      .range(offset, offset + limit - 1);

    // 필터 적용
    if (status) query = query.eq('status', status);
    if (content_type) query = query.eq('content_type', content_type);

    const { data: contents, error, count } = await query;
    
    console.log('📅 콘텐츠 조회 결과:', {
      dataLength: contents ? contents.length : 0,
      error: error
    });

    if (error) {
      console.error('❌ Supabase 쿼리 에러:', error);
      return res.status(500).json({
        success: false,
        error: '콘텐츠 조회 실패',
        details: error.message
      });
    }

    console.log('✅ 최종 콘텐츠:', contents ? contents.length : 0, '개');

    res.status(200).json({ 
      success: true, 
      data: contents || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasMore: offset + limit < (count || 0)
      }
    });

  } catch (error) {
    console.error('❌ 콘텐츠 캘린더 API 오류:', error);
    res.status(500).json({ 
      success: false, 
      message: '콘텐츠 조회 실패', 
      error: error.message
    });
  }
}

// POST 요청 처리 - 새 콘텐츠 생성
async function handlePost(req, res) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ 
      success: false, 
      message: '서버 설정 오류'
    });
  }

  try {
    console.log('🎯 새 콘텐츠 생성 시작');
    
    const { 
      title, 
      summary,
      content_body, 
      content_type = 'hub',
      content_date,
      is_hub_content = true,
      hub_priority = 1,
      auto_derive_channels = ['blog', 'sms', 'naver_blog']
    } = req.body;

    if (!title || !summary || !content_body) {
      return res.status(400).json({ 
        success: false, 
        message: '제목, 요약, 내용은 필수입니다.' 
      });
    }

    // 새 콘텐츠 생성
    const insertData = {
      title,
      summary,
      content_body,
      content_type,
      content_date: content_date || new Date().toISOString().split('T')[0],
      status: 'draft',
      is_hub_content,
      hub_priority,
      auto_derive_channels,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newContent, error: createError } = await supabase
      .from('cc_content_calendar')
      .insert(insertData)
      .select()
      .single();

    if (createError) {
      console.error('❌ 콘텐츠 생성 오류:', createError);
      return res.status(500).json({ 
        success: false, 
        message: '콘텐츠 생성에 실패했습니다.',
        error: createError.message 
      });
    }

    console.log('✅ 콘텐츠 생성 완료:', newContent.id);
    
    return res.status(200).json({
      success: true,
      message: '콘텐츠가 생성되었습니다.',
      content: newContent
    });

  } catch (error) {
    console.error('❌ 콘텐츠 생성 오류:', error);
    return res.status(500).json({ 
      success: false, 
      message: '콘텐츠 생성 중 오류가 발생했습니다.',
      error: error.message 
    });
  }
}

// PUT 요청 처리 - 콘텐츠 수정
async function handlePut(req, res) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ 
      success: false, 
      message: '서버 설정 오류'
    });
  }

  try {
    console.log('✏️ 콘텐츠 수정 시작');
    
    const { id, title, summary, content_body, content_type, content_date, status } = req.body;

    if (!id || !title || !summary || !content_body) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID, 제목, 요약, 내용은 필수입니다.' 
      });
    }

    // 콘텐츠 수정
    const updateData = {
      title,
      summary,
      content_body,
      content_type: content_type || 'hub',
      content_date: content_date || new Date().toISOString().split('T')[0],
      status: status || 'draft',
      updated_at: new Date().toISOString()
    };

    const { data: updatedContent, error: updateError } = await supabase
      .from('cc_content_calendar')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ 콘텐츠 수정 오류:', updateError);
      return res.status(500).json({ 
        success: false, 
        message: '콘텐츠 수정에 실패했습니다.',
        error: updateError.message 
      });
    }

    console.log('✅ 콘텐츠 수정 완료:', updatedContent.id);
    
    return res.status(200).json({
      success: true,
      message: '콘텐츠가 수정되었습니다.',
      content: updatedContent
    });

  } catch (error) {
    console.error('❌ 콘텐츠 수정 오류:', error);
    return res.status(500).json({ 
      success: false, 
      message: '콘텐츠 수정 중 오류가 발생했습니다.',
      error: error.message 
    });
  }
}

// DELETE 요청 처리 - 콘텐츠 삭제
async function handleDelete(req, res) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ 
      success: false, 
      message: '서버 설정 오류'
    });
  }

  try {
    console.log('🗑️ 콘텐츠 삭제 시작');
    
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID는 필수입니다.' 
      });
    }

    // 콘텐츠 삭제
    const { error: deleteError } = await supabase
      .from('cc_content_calendar')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('❌ 콘텐츠 삭제 오류:', deleteError);
      return res.status(500).json({ 
        success: false, 
        message: '콘텐츠 삭제에 실패했습니다.',
        error: deleteError.message 
      });
    }

    console.log('✅ 콘텐츠 삭제 완료:', id);
    
    return res.status(200).json({
      success: true,
      message: '콘텐츠가 삭제되었습니다.'
    });

  } catch (error) {
    console.error('❌ 콘텐츠 삭제 오류:', error);
    return res.status(500).json({ 
      success: false, 
      message: '콘텐츠 삭제 중 오류가 발생했습니다.',
      error: error.message 
    });
  }
}
