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

// 고유 slug 생성 함수
async function generateUniqueSlug(title) {
  console.log('🔗 slug 생성 시작, 제목:', title);
  
  if (!title || typeof title !== 'string') {
    console.error('❌ 유효하지 않은 제목:', title);
    return `post-${Date.now()}`;
  }
  
  let baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
  
  // 빈 slug 방지
  if (!baseSlug || baseSlug.length === 0) {
    baseSlug = `post-${Date.now()}`;
    console.warn('⚠️ 빈 slug 방지, 기본값 사용:', baseSlug);
  }
  
  let slug = baseSlug;
  let counter = 1;
  
  // 중복 확인 및 고유 slug 생성
  while (true) {
    const { data: existing, error } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', slug)
      .single();
    
    // 에러가 있거나 데이터가 없으면 (중복되지 않음) 사용 가능
    if (error && error.code === 'PGRST116') {
      // PGRST116: No rows found (중복되지 않음)
      break;
    } else if (!existing) {
      break;
    }
    
    // 중복되면 다른 slug 생성
    slug = `${baseSlug}-${counter}`;
    counter++;
    
    // 무한 루프 방지 (최대 100번 시도)
    if (counter > 100) {
      slug = `${baseSlug}-${Date.now()}`;
      console.warn('⚠️ 슬러그 생성 시도 횟수 초과, 타임스탬프 사용:', slug);
      break;
    }
  }
  
  console.log('🔗 생성된 고유 slug:', slug);
  console.log('🔗 slug 유효성 검증:', {
    length: slug.length,
    isEmpty: slug === '',
    isNull: slug === null,
    isUndefined: slug === undefined
  });
  
  // 최종 안전장치
  if (!slug || slug === '' || slug === null || slug === undefined) {
    const fallbackSlug = `post-${Date.now()}`;
    console.error('❌ slug 생성 실패, fallback 사용:', fallbackSlug);
    return fallbackSlug;
  }
  
  return slug;
}

export default async function handler(req, res) {
  console.log('🔍 관리자 API 요청:', req.method, req.url);
  
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // 환경 변수 확인
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase 환경 변수 누락');
    return res.status(500).json({ 
      error: '서버 설정 오류: 환경 변수가 설정되지 않았습니다.',
      details: {
        supabaseUrl: supabaseUrl ? '설정됨' : '없음',
        supabaseServiceKey: supabaseServiceKey ? '설정됨' : '없음'
      }
    });
  }
  
  try {
    if (req.method === 'GET') {
      // 특정 포스트 ID가 있는 경우 단일 포스트 조회
      const { id, calendar_id } = req.query;
      
      if (id) {
        console.log('📝 단일 게시물 조회 중:', id);
        
        const { data: post, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          console.error('❌ 단일 게시물 조회 에러:', error);
          return res.status(500).json({
            error: '게시물을 불러올 수 없습니다.',
            details: error.message
          });
        }
        
        if (!post) {
          return res.status(404).json({
            error: '게시물을 찾을 수 없습니다.'
          });
        }
        
        console.log('✅ 단일 게시물 조회 성공:', post.id);
        return res.status(200).json(post);
      }

      // calendar_id로 필터링된 블로그 포스트 조회
      if (calendar_id) {
        console.log('📝 허브별 블로그 포스트 조회 중:', calendar_id);
        
        const { data: posts, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('calendar_id', calendar_id)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('❌ 허브별 블로그 조회 에러:', error);
          return res.status(500).json({
            error: '블로그 포스트를 불러올 수 없습니다.',
            details: error.message
          });
        }
        
        console.log('✅ 허브별 블로그 조회 성공:', posts.length, '개');
        return res.status(200).json({
          success: true,
          posts: posts || []
        });
      }
      
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
        .select('*, calendar_id')
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
      console.log('📝 게시물 데이터:', JSON.stringify(postData, null, 2));
      console.log('📅 published_at 필드 상세:', {
        value: postData.published_at,
        type: typeof postData.published_at,
        length: postData.published_at?.length,
        isEmpty: postData.published_at === '',
        isNull: postData.published_at === null,
        isUndefined: postData.published_at === undefined
      });
      
      // 모든 필드의 상태 확인
      console.log('🔍 모든 필드 상태 확인:', {
        title: { value: postData.title, type: typeof postData.title, isEmpty: !postData.title },
        slug: { value: postData.slug, type: typeof postData.slug, isEmpty: !postData.slug },
        content: { value: postData.content?.substring(0, 50) + '...', type: typeof postData.content, isEmpty: !postData.content },
        published_at: { value: postData.published_at, type: typeof postData.published_at, isEmpty: !postData.published_at },
        status: { value: postData.status, type: typeof postData.status, isEmpty: !postData.status },
        category: { value: postData.category, type: typeof postData.category, isEmpty: !postData.category }
      });
      
      // 필수 필드 검증
      if (!postData.title || postData.title.trim() === '') {
        console.error('❌ 제목이 없습니다:', postData);
        return res.status(400).json({ 
          success: false,
          error: '제목은 필수입니다.',
          details: 'title field is required'
        });
      }
      
      if (!postData.content || postData.content.trim() === '') {
        console.error('❌ 내용이 없습니다:', postData);
        return res.status(400).json({ 
          success: false,
          error: '내용은 필수입니다.',
          details: 'content field is required'
        });
      }
      
      // slug 필드 강력한 처리
      console.log('🔗 slug 필드 상세:', {
        value: postData.slug,
        type: typeof postData.slug,
        length: postData.slug?.length,
        isEmpty: postData.slug === '',
        isNull: postData.slug === null,
        isUndefined: postData.slug === undefined
      });
      
      if (!postData.slug || postData.slug === '' || postData.slug === null || postData.slug === 'null' || postData.slug === 'undefined') {
        if (postData.title) {
          postData.slug = await generateUniqueSlug(postData.title);
          console.log('🔗 자동 생성된 slug:', postData.slug);
        } else {
          console.error('❌ 제목도 없어서 slug를 생성할 수 없습니다');
          return res.status(400).json({ error: '제목과 slug가 모두 없습니다.' });
        }
      } else {
        console.log('🔗 기존 slug 사용:', postData.slug);
      }
      
      console.log('🔗 최종 slug 값:', postData.slug);
      
      // published_at 필드 강력한 처리
      if (!postData.published_at || postData.published_at === '' || postData.published_at === 'null' || postData.published_at === 'undefined') {
        postData.published_at = null;
        console.log('📅 published_at을 null로 설정');
      } else {
        // 유효한 날짜인지 확인
        const date = new Date(postData.published_at);
        if (isNaN(date.getTime())) {
          console.warn('⚠️ 잘못된 published_at 형식, null로 설정:', postData.published_at);
          postData.published_at = null;
        } else {
          console.log('📅 published_at 유효한 날짜:', postData.published_at);
        }
      }
      
      console.log('📅 최종 published_at 값:', postData.published_at);
      
      // calendar_id 처리 (허브 연결)
      if (postData.calendar_id) {
        console.log('🔗 허브 연결 모드:', { calendar_id: postData.calendar_id });
      }
      
      // 최종 데이터 검증
      const finalData = {
        title: postData.title.trim(),
        slug: postData.slug,
        content: postData.content.trim(),
        excerpt: postData.excerpt || '',
        status: postData.status || 'draft',
        category: postData.category || '기타',
        published_at: postData.published_at,
        calendar_id: postData.calendar_id || null,
        author: postData.author || '마쓰구골프',
        tags: postData.tags || [],
        featured_image: postData.featured_image || null,
        meta_description: postData.meta_description || '',
        meta_keywords: postData.meta_keywords || ''
      };
      
      console.log('📝 최종 저장 데이터:', JSON.stringify(finalData, null, 2));
      
      const { data: newPost, error } = await supabase
        .from('blog_posts')
        .insert([finalData])
        .select()
        .single();
      
      if (error) {
        console.error('❌ 게시물 생성 에러:', error);
        console.error('❌ 요청 데이터:', JSON.stringify(finalData, null, 2));
        console.error('❌ 에러 상세:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        return res.status(500).json({
          success: false,
          error: '게시물을 저장할 수 없습니다.',
          details: error.message,
          code: error.code,
          hint: error.hint
        });
      }
      
      console.log('✅ 게시물 생성 성공:', newPost.id);
      
      // 허브 연동 처리 (calendar_id가 있는 경우)
      if (postData.calendar_id) {
        try {
          console.log('🔗 허브 상태 동기화 시작:', postData.calendar_id);
          
          // 허브 콘텐츠의 channel_status 업데이트
          const { data: hubData, error: hubFetchError } = await supabase
            .from('cc_content_calendar')
            .select('channel_status')
            .eq('id', postData.calendar_id)
            .single();
          
          if (hubFetchError) {
            console.error('❌ 허브 데이터 조회 오류:', hubFetchError);
          } else {
            const currentStatus = hubData.channel_status || {};
            const updatedStatus = {
              ...currentStatus,
              blog: {
                status: '연결됨',
                post_id: newPost.id,
                created_at: new Date().toISOString()
              }
            };
            
            const { error: hubError } = await supabase
              .from('cc_content_calendar')
              .update({ channel_status: updatedStatus })
              .eq('id', postData.calendar_id);
            
            if (hubError) {
              console.error('❌ 허브 상태 업데이트 오류:', hubError);
            } else {
              console.log('✅ 허브 상태 동기화 성공');
            }
          }
        } catch (syncError) {
          console.error('❌ 허브 연동 처리 오류:', syncError);
        }
      }
      
      // 성공 응답
      const response = {
        success: true,
        message: '게시물이 성공적으로 생성되었습니다.',
        data: newPost
      };
      
      // 콘텐츠 캘린더에 자동 등록
      try {
        const calendarData = {
          title: newPost.title,
          content_type: 'blog',
          content_date: newPost.published_at ? newPost.published_at.split('T')[0] : new Date().toISOString().split('T')[0],
          status: newPost.status || 'draft',
          target_audience: {
            persona: '시니어 골퍼',
            stage: 'awareness'
          },
          conversion_goal: '홈페이지 방문',
          blog_post_id: newPost.id,
          content_body: newPost.content || newPost.excerpt || '',
          seo_meta: {
            metaDescription: newPost.meta_description,
            metaKeywords: newPost.meta_keywords
          },
          published_channels: ['blog'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { error: calendarError } = await supabase
          .from('cc_content_calendar')
          .insert([calendarData]);
        
        if (calendarError) {
          console.warn('⚠️ 콘텐츠 캘린더 등록 실패:', calendarError);
        } else {
          console.log('✅ 콘텐츠 캘린더 자동 등록 성공');
        }
      } catch (calendarError) {
        console.warn('⚠️ 콘텐츠 캘린더 등록 중 오류:', calendarError);
      }
      
      // 허브 상태 동기화 (calendar_id가 있는 경우)
      if (postData.calendar_id) {
        try {
          console.log('🔄 허브 상태 동기화 시작...', { hubId: postData.calendar_id, blogId: newPost.id });
          const syncResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/sync-channel-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              hubContentId: postData.calendar_id,
              channel: 'blog',
              channelContentId: newPost.id,
              status: '수정중'
            })
          });
          
          if (syncResponse.ok) {
            console.log('✅ 허브 상태 동기화 완료');
          } else {
            console.error('❌ 허브 상태 동기화 실패');
          }
        } catch (syncError) {
          console.error('❌ 허브 상태 동기화 오류:', syncError);
        }
      }
      
      return res.status(201).json(response);
      
    } else if (req.method === 'PUT') {
      // 게시물 수정
      console.log('📝 게시물 수정 중...');
      
      const postData = req.body;
      const postId = req.query.id || req.body.id;
      
      console.log('📝 수정할 게시물 ID:', postId);
      console.log('📝 수정 데이터:', JSON.stringify(postData, null, 2));
      
      // 모든 필드의 상태 확인
      console.log('🔍 수정 요청 필드 상태 확인:', {
        title: { value: postData.title, type: typeof postData.title, isEmpty: !postData.title },
        slug: { value: postData.slug, type: typeof postData.slug, isEmpty: !postData.slug },
        content: { value: postData.content?.substring(0, 50) + '...', type: typeof postData.content, isEmpty: !postData.content },
        published_at: { value: postData.published_at, type: typeof postData.published_at, isEmpty: !postData.published_at },
        status: { value: postData.status, type: typeof postData.status, isEmpty: !postData.status },
        category: { value: postData.category, type: typeof postData.category, isEmpty: !postData.category }
      });
      
      if (!postId) {
        console.error('❌ 게시물 ID가 없습니다:', postData);
        return res.status(400).json({ error: '게시물 ID는 필수입니다.' });
      }
      
      // slug 필드 강력한 처리
      if (!postData.slug || postData.slug === '' || postData.slug === null || postData.slug === 'null' || postData.slug === 'undefined') {
        if (postData.title) {
          postData.slug = await generateUniqueSlug(postData.title);
          console.log('🔗 수정 시 자동 생성된 slug:', postData.slug);
        } else {
          console.error('❌ 제목도 없어서 slug를 생성할 수 없습니다');
          return res.status(400).json({ error: '제목과 slug가 모두 없습니다.' });
        }
      } else {
        console.log('🔗 수정 시 기존 slug 사용:', postData.slug);
      }
      
      // published_at 필드 강력한 처리
      if (!postData.published_at || postData.published_at === '' || postData.published_at === 'null' || postData.published_at === 'undefined') {
        postData.published_at = null;
        console.log('📅 수정 시 published_at을 null로 설정');
      } else {
        // 유효한 날짜인지 확인
        const date = new Date(postData.published_at);
        if (isNaN(date.getTime())) {
          console.warn('⚠️ 수정 시 잘못된 published_at 형식, null로 설정:', postData.published_at);
          postData.published_at = null;
        } else {
          console.log('📅 수정 시 published_at 유효한 날짜:', postData.published_at);
        }
      }
      
      // updated_at 필드 자동 설정
      postData.updated_at = new Date().toISOString();
      
      console.log('📅 수정 시 최종 published_at 값:', postData.published_at);
      console.log('📅 수정 시 updated_at 값:', postData.updated_at);
      
      const { data: updatedPost, error } = await supabase
        .from('blog_posts')
        .update(postData)
        .eq('id', postId)
        .select()
        .single();
      
      if (error) {
        console.error('❌ 게시물 수정 에러:', error);
        console.error('❌ 수정 요청 데이터:', JSON.stringify(postData, null, 2));
        console.error('❌ 에러 상세:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        return res.status(500).json({
          error: '게시물을 수정할 수 없습니다.',
          details: error.message,
          code: error.code
        });
      }
      
      console.log('✅ 게시물 수정 성공:', updatedPost.id);
      return res.status(200).json(updatedPost);
      
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('❌ API 에러:', error);
    console.error('❌ 에러 스택:', error.stack);
    console.error('❌ 요청 정보:', {
      method: req.method,
      url: req.url,
      body: req.body
    });
    return res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      details: error.message,
      type: 'server_error'
    });
  }
}