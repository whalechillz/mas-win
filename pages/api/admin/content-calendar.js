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

// GET 요청 처리
async function handleGet(req, res) {

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
    return res.status(500).json({ 
      success: false, 
      message: '서버 설정 오류',
      error: 'Supabase 환경 변수가 설정되지 않았습니다'
    });
  }

  try {
    console.log('🔍 콘텐츠 캘린더 API 시작');
    
    // 쿼리 파라미터 추출
    const { page = 1, limit = 50, status, content_type } = req.query;
    const offset = (page - 1) * limit;
    
    console.log('📊 페이지네이션 파라미터:', { page, limit, offset, status, content_type });
    
    // cc_content_calendar 테이블에서 데이터 가져오기 (최적화된 쿼리)
    console.log('📅 cc_content_calendar 테이블 조회 시작...');
    
    let query = supabase
      .from('cc_content_calendar')
      .select('id, title, content_type, content_date, status, blog_post_id, published_channels, target_audience, seo_meta, content_body, summary', { count: 'exact' })
      .order('content_date', { ascending: false })
      .range(offset, offset + limit - 1);

    // 필터 적용
    if (status) query = query.eq('status', status);
    if (content_type) query = query.eq('content_type', content_type);

    const { data: calendarData, error: calendarError, count } = await query;
    
    console.log('📅 cc_content_calendar 조회 결과:', {
      dataLength: calendarData ? calendarData.length : 0,
      error: calendarError
    });

    console.log('📅 캘린더 데이터:', calendarData ? calendarData.length : 0, '개');
    if (calendarError) {
      console.error('❌ Supabase 쿼리 에러:', calendarError);
      return res.status(500).json({
        success: false,
        error: '콘텐츠 캘린더 데이터 조회 실패',
        details: calendarError.message
      });
    }

    // blog_posts 테이블에서도 데이터 가져오기 (연동된 블로그 포스트) - 최적화
    console.log('📝 blog_posts 테이블 조회 시작...');
    const { data: blogData, error: blogError } = await supabase
      .from('blog_posts')
      .select('id, title, slug, published_at, status, category, meta_title, meta_description, meta_keywords, target_audience, conversion_tracking, published_channels, content, summary')
      .order('published_at', { ascending: false })
      .limit(50); // 페이지네이션으로 인해 50개로 줄임
    
    console.log('📝 blog_posts 조회 결과:', {
      dataLength: blogData ? blogData.length : 0,
      error: blogError
    });

    console.log('📝 블로그 데이터:', blogData ? blogData.length : 0, '개');
    if (blogError) {
      console.error('❌ Supabase 쿼리 에러:', blogError);
      return res.status(500).json({
        success: false,
        error: '블로그 데이터 조회 실패',
        details: blogError.message
      });
    }

    // 데이터 변환 및 통합
    const contents = [];

    // 콘텐츠 캘린더 데이터 처리
    if (calendarData) {
      calendarData.forEach(item => {
        contents.push({
          id: item.id,
          title: item.title,
          content_type: item.content_type || 'blog',
          content_date: item.content_date,
          status: item.status || 'draft',
          target_audience: item.target_audience || {
            persona: '일반',
            stage: 'awareness'
          },
          conversion_tracking: {
            landingPage: item.landing_url || 'https://win.masgolf.co.kr',
            goal: item.conversion_goal || '홈페이지 방문',
            utmParams: {
              source: 'blog',
              medium: 'organic',
              campaign: item.theme || '일반'
            }
          },
          published_channels: item.published_channels || ['blog'],
          blog_post_id: item.blog_post_id,
          seo_meta: item.seo_meta,
          content_body: item.content_body
        });
      });
    }

    // 블로그 포스트 데이터도 포함 (모든 블로그 표시)
    if (blogData) {
      console.log('📝 블로그 데이터 처리 시작:', blogData.length, '개');
      blogData.forEach((blog, index) => {
        // 이미 캘린더에 등록된 블로그는 제외
        const alreadyInCalendar = contents.some(content => 
          content.blog_post_id === blog.id
        );
        
        console.log(`📄 블로그 ${index + 1}: "${blog.title}" - 캘린더 등록 여부: ${alreadyInCalendar}`);
        
        if (!alreadyInCalendar) {
          contents.push({
            id: `blog_${blog.id}`,
            title: blog.meta_title || blog.title || '제목 없음',
            content_type: 'blog',
            content_date: blog.published_at ? blog.published_at.split('T')[0] : new Date().toISOString().split('T')[0],
            status: blog.status || 'published',
            target_audience: blog.target_audience || {
              persona: '시니어 골퍼',
              stage: 'awareness'
            },
            conversion_tracking: blog.conversion_tracking || {
              landingPage: 'https://win.masgolf.co.kr',
              goal: '홈페이지 방문',
              utmParams: {
                source: 'blog',
                medium: 'organic',
                campaign: blog.category || '골프 정보'
              }
            },
            published_channels: blog.published_channels || ['blog', 'naver_blog'],
            blog_post_id: blog.id,
            seo_meta: {
              metaDescription: blog.meta_description,
              metaKeywords: blog.meta_keywords
            },
            content_body: blog.content || blog.summary || '콘텐츠 내용이 없습니다.'
          });
        }
      });
    }

    // 날짜순으로 정렬
    contents.sort((a, b) => new Date(b.content_date) - new Date(a.content_date));

    console.log('✅ 최종 콘텐츠:', contents.length, '개');
    console.log('📊 상세 통계:', {
      calendarCount: calendarData ? calendarData.length : 0,
      blogCount: blogData ? blogData.length : 0,
      finalCount: contents.length
    });

    res.status(200).json({ 
      success: true, 
      contents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || contents.length,
        totalPages: Math.ceil((count || contents.length) / limit),
        hasMore: offset + limit < (count || contents.length)
      },
      calendarCount: calendarData ? calendarData.length : 0,
      blogCount: blogData ? blogData.length : 0,
      debug: {
        calendarData: calendarData ? calendarData.map(item => ({ id: item.id, title: item.title, date: item.content_date })) : [],
        blogData: blogData ? blogData.map(item => ({ id: item.id, title: item.title, date: item.published_at })) : []
      }
    });

  } catch (error) {
    console.error('❌ 콘텐츠 캘린더 API 오류:', error);
    console.error('상세 오류 정보:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      success: false, 
      message: '콘텐츠 캘린더 데이터 조회 실패', 
      error: error.message,
      details: error.stack
    });
  }
}

// POST 요청 처리 (허브 콘텐츠 생성)
async function handlePost(req, res) {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
    return res.status(500).json({ 
      success: false, 
      message: '서버 설정 오류',
      error: 'Supabase 환경 변수가 설정되지 않았습니다'
    });
  }

  try {
    console.log('🎯 허브 콘텐츠 생성 시작');
    
    const { 
      title, 
      summary,
      content_body, 
      content_type = 'hub',
      is_hub_content = true,
      hub_priority = 1,
      auto_derive_channels = []
    } = req.body;

    if (!title) {
      return res.status(400).json({ 
        success: false, 
        message: '제목은 필수입니다.' 
      });
    }

    // 허브 콘텐츠 생성
    const insertData = {
      title,
      content_body: content_body || '',
      content_type,
      is_hub_content,
      hub_priority,
      auto_derive_channels,
      content_date: new Date().toISOString().split('T')[0],
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // summary 컬럼이 존재하는 경우에만 추가
    if (summary !== undefined) {
      insertData.summary = summary || '';
    }

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

// PUT 요청 처리 (콘텐츠 수정)
async function handlePut(req, res) {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
    return res.status(500).json({ 
      success: false, 
      message: '서버 설정 오류',
      error: 'Supabase 환경 변수가 설정되지 않았습니다'
    });
  }

  try {
    console.log('✏️ 콘텐츠 수정 시작');
    
    const { id, title, summary, content_body, status } = req.body;

    if (!id || !title) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID와 제목은 필수입니다.' 
      });
    }

    // 콘텐츠 수정
    const updateData = {
      title,
      content_body: content_body || '',
      status: status || 'draft',
      updated_at: new Date().toISOString()
    };

    // summary 컬럼이 존재하는 경우에만 추가
    if (summary !== undefined) {
      updateData.summary = summary || '';
    }

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

// DELETE 요청 처리 (콘텐츠 삭제)
async function handleDelete(req, res) {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
    return res.status(500).json({ 
      success: false, 
      message: '서버 설정 오류',
      error: 'Supabase 환경 변수가 설정되지 않았습니다'
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

// PATCH 요청 처리 (블로그 동기화)
async function handlePatch(req, res) {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
    return res.status(500).json({ 
      success: false, 
      message: '서버 설정 오류',
      error: 'Supabase 환경 변수가 설정되지 않았습니다'
    });
  }

  try {
    console.log('🔄 블로그 동기화 시작');
    
    const { action, contentId, blogPostId } = req.body;

    if (!action) {
      return res.status(400).json({ 
        success: false, 
        message: '액션은 필수입니다.' 
      });
    }

    switch (action) {
      case 'sync_blog_to_calendar':
        return await syncBlogToCalendar(blogPostId, res);
      
      case 'sync_calendar_to_blog':
        return await syncCalendarToBlog(contentId, res);
      
      case 'create_blog_draft':
        return await createBlogDraft(contentId, res);
      
      case 'create_channel_draft':
        return await createChannelDraft(contentId, req.body.channel, res);
      
      case 'update_channel_status':
        return await updateChannelStatus(contentId, req.body.channel, req.body.status, req.body.postId, res);
      
      default:
        return res.status(400).json({ 
          success: false, 
          message: '지원하지 않는 액션입니다.' 
        });
    }

  } catch (error) {
    console.error('❌ 블로그 동기화 오류:', error);
    return res.status(500).json({ 
      success: false, 
      message: '블로그 동기화 중 오류가 발생했습니다.',
      error: error.message 
    });
  }
}

// 블로그 포스트를 콘텐츠 캘린더로 동기화
async function syncBlogToCalendar(blogPostId, res) {
  try {
    console.log('📝 블로그 포스트를 콘텐츠 캘린더로 동기화:', blogPostId);
    
    // 블로그 포스트 조회
    const { data: blogPost, error: blogError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', blogPostId)
      .single();

    if (blogError || !blogPost) {
      return res.status(404).json({ 
        success: false, 
        message: '블로그 포스트를 찾을 수 없습니다.' 
      });
    }

    // 이미 캘린더에 등록된 블로그인지 확인
    const { data: existingContent } = await supabase
      .from('cc_content_calendar')
      .select('id')
      .eq('blog_post_id', blogPostId)
      .single();

    if (existingContent) {
      return res.status(200).json({
        success: true,
        message: '이미 콘텐츠 캘린더에 등록되어 있습니다.',
        contentId: existingContent.id
      });
    }

    // 콘텐츠 캘린더에 등록
    const { data: newContent, error: createError } = await supabase
      .from('cc_content_calendar')
      .insert({
        title: blogPost.title,
        content_body: blogPost.content,
        content_type: 'blog',
        content_date: blogPost.published_at ? blogPost.published_at.split('T')[0] : new Date().toISOString().split('T')[0],
        status: blogPost.status === 'published' ? 'published' : 'draft',
        blog_post_id: blogPostId,
        source: 'blog_import',
        published_at: blogPost.published_at,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ 콘텐츠 캘린더 등록 오류:', createError);
      return res.status(500).json({ 
        success: false, 
        message: '콘텐츠 캘린더 등록에 실패했습니다.',
        error: createError.message 
      });
    }

    console.log('✅ 블로그 포스트가 콘텐츠 캘린더에 등록되었습니다:', newContent.id);
    
    return res.status(200).json({
      success: true,
      message: '블로그 포스트가 콘텐츠 캘린더에 등록되었습니다.',
      content: newContent
    });

  } catch (error) {
    console.error('❌ 블로그 동기화 오류:', error);
    throw error;
  }
}

// 콘텐츠 캘린더에서 블로그로 동기화
async function syncCalendarToBlog(contentId, res) {
  try {
    console.log('📅 콘텐츠 캘린더를 블로그로 동기화:', contentId);
    
    // 콘텐츠 캘린더 조회
    const { data: calendarContent, error: calendarError } = await supabase
      .from('cc_content_calendar')
      .select('*')
      .eq('id', contentId)
      .single();

    if (calendarError || !calendarContent) {
      return res.status(404).json({ 
        success: false, 
        message: '콘텐츠 캘린더 항목을 찾을 수 없습니다.' 
      });
    }

    // 이미 블로그에 등록된 콘텐츠인지 확인
    if (calendarContent.blog_post_id) {
      return res.status(200).json({
        success: true,
        message: '이미 블로그에 등록되어 있습니다.',
        blogPostId: calendarContent.blog_post_id
      });
    }

    // 블로그 포스트 생성
    const { data: newBlogPost, error: createError } = await supabase
      .from('blog_posts')
      .insert({
        title: calendarContent.title,
        content: calendarContent.content_body,
        excerpt: calendarContent.subtitle,
        status: calendarContent.status === 'published' ? 'published' : 'draft',
        published_at: calendarContent.published_at,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ 블로그 포스트 생성 오류:', createError);
      return res.status(500).json({ 
        success: false, 
        message: '블로그 포스트 생성에 실패했습니다.',
        error: createError.message 
      });
    }

    // 콘텐츠 캘린더에 블로그 포스트 ID 업데이트
    const { error: updateError } = await supabase
      .from('cc_content_calendar')
      .update({ blog_post_id: newBlogPost.id })
      .eq('id', contentId);

    if (updateError) {
      console.error('❌ 콘텐츠 캘린더 업데이트 오류:', updateError);
    }

    console.log('✅ 콘텐츠 캘린더가 블로그로 동기화되었습니다:', newBlogPost.id);
    
    return res.status(200).json({
      success: true,
      message: '콘텐츠 캘린더가 블로그로 동기화되었습니다.',
      blogPost: newBlogPost
    });

  } catch (error) {
    console.error('❌ 캘린더 동기화 오류:', error);
    throw error;
  }
}

// 콘텐츠 캘린더에서 블로그 초안 생성
async function createBlogDraft(contentId, res) {
  try {
    console.log('📝 콘텐츠 캘린더에서 블로그 초안 생성:', contentId);
    
    // 콘텐츠 캘린더 조회
    const { data: calendarContent, error: calendarError } = await supabase
      .from('cc_content_calendar')
      .select('*')
      .eq('id', contentId)
      .single();

    if (calendarError || !calendarContent) {
      return res.status(404).json({ 
        success: false, 
        message: '콘텐츠 캘린더 항목을 찾을 수 없습니다.' 
      });
    }

    // 블로그 초안 생성
    const { data: newBlogPost, error: createError } = await supabase
      .from('blog_posts')
      .insert({
        title: calendarContent.title,
        content: calendarContent.content_body || '',
        excerpt: calendarContent.subtitle || '',
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ 블로그 초안 생성 오류:', createError);
      return res.status(500).json({ 
        success: false, 
        message: '블로그 초안 생성에 실패했습니다.',
        error: createError.message 
      });
    }

    // 콘텐츠 캘린더에 블로그 포스트 ID 업데이트
    const { error: updateError } = await supabase
      .from('cc_content_calendar')
      .update({ 
        blog_post_id: newBlogPost.id,
        status: 'draft'
      })
      .eq('id', contentId);

    if (updateError) {
      console.error('❌ 콘텐츠 캘린더 업데이트 오류:', updateError);
    }

    console.log('✅ 블로그 초안이 생성되었습니다:', newBlogPost.id);
    
    return res.status(200).json({
      success: true,
      message: '블로그 초안이 생성되었습니다.',
      blogPost: newBlogPost
    });

  } catch (error) {
    console.error('❌ 블로그 초안 생성 오류:', error);
    throw error;
  }
}

// 채널 초안 생성
async function createChannelDraft(contentId, channel, res) {
  try {
    console.log('📝 채널 초안 생성:', contentId, channel);
    
    // 콘텐츠 캘린더 조회
    const { data: calendarContent, error: calendarError } = await supabase
      .from('cc_content_calendar')
      .select('*')
      .eq('id', contentId)
      .single();

    if (calendarError || !calendarContent) {
      return res.status(404).json({ 
        success: false, 
        message: '콘텐츠 캘린더 항목을 찾을 수 없습니다.' 
      });
    }

    // 채널별 초안 생성 로직
    let newPostId = null;
    
    switch(channel) {
      case 'sms':
        // SMS 초안 생성 (예시)
        const { data: smsDraft, error: smsError } = await supabase
          .from('sms_campaigns')
          .insert({
            title: calendarContent.title,
            content: calendarContent.content_body,
            status: 'draft',
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (smsError) throw smsError;
        newPostId = smsDraft.id;
        break;
        
      case 'naver_blog':
        // 네이버 블로그 초안 생성 (예시)
        const { data: naverDraft, error: naverError } = await supabase
          .from('naver_blog_posts')
          .insert({
            title: calendarContent.title,
            content: calendarContent.content_body,
            status: 'draft',
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (naverError) throw naverError;
        newPostId = naverDraft.id;
        break;
        
      case 'kakao':
        // 카카오톡 초안 생성 (예시)
        const { data: kakaoDraft, error: kakaoError } = await supabase
          .from('kakao_messages')
          .insert({
            title: calendarContent.title,
            content: calendarContent.content_body,
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
    const currentChannelStatus = calendarContent.channel_status || {};
    currentChannelStatus[channel] = {
      status: '수정중',
      post_id: newPostId,
      created_at: new Date().toISOString()
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
    }

    console.log('✅ 채널 초안이 생성되었습니다:', newPostId);
    
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

// 채널 상태 업데이트
async function updateChannelStatus(contentId, channel, status, postId, res) {
  try {
    console.log('🔄 채널 상태 업데이트:', contentId, channel, status);
    
    // 콘텐츠 캘린더 조회
    const { data: calendarContent, error: calendarError } = await supabase
      .from('cc_content_calendar')
      .select('channel_status')
      .eq('id', contentId)
      .single();

    if (calendarError || !calendarContent) {
      return res.status(404).json({ 
        success: false, 
        message: '콘텐츠 캘린더 항목을 찾을 수 없습니다.' 
      });
    }

    // 채널 상태 업데이트
    const currentChannelStatus = calendarContent.channel_status || {};
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

    console.log('✅ 채널 상태가 업데이트되었습니다:', channel, status);
    
    return res.status(200).json({
      success: true,
      message: '채널 상태가 업데이트되었습니다.'
    });

  } catch (error) {
    console.error('❌ 채널 상태 업데이트 오류:', error);
    throw error;
  }
}
