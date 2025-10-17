import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 고유한 slug 생성 함수
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
  return slug;
}

export default async function handler(req, res) {
  console.log('🔍 콘텐츠 캘린더에서 블로그 생성 API 요청:', req.method, req.url);
  
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
      error: '서버 설정 오류: 환경 변수가 설정되지 않았습니다.'
    });
  }
  
  try {
    if (req.method === 'POST') {
      // 콘텐츠 캘린더에서 블로그 초안 생성
      console.log('📝 콘텐츠 캘린더에서 블로그 초안 생성 중...');
      
      const { calendarId, title, content, category, targetAudience, conversionGoal } = req.body;
      
      console.log('📝 생성 요청 데이터:', {
        calendarId,
        title,
        category,
        targetAudience,
        conversionGoal
      });
      
      if (!title) {
        console.error('❌ 제목이 없습니다');
        return res.status(400).json({ error: '제목은 필수입니다.' });
      }
      
      // slug 생성
      const slug = await generateUniqueSlug(title);
      
      // 블로그 포스트 데이터 생성
      const blogPostData = {
        title: title,
        slug: slug,
        content: content || '',
        excerpt: '',
        category: category || '골프',
        status: 'draft',
        author: '마쓰구골프',
        meta_title: title,
        meta_description: '',
        meta_keywords: '',
        tags: [],
        target_audience: targetAudience || 'all',
        target_product: 'all',
        published_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('📝 생성할 블로그 데이터:', blogPostData);
      
      // 블로그 포스트 생성
      const { data: newPost, error: postError } = await supabase
        .from('blog_posts')
        .insert([blogPostData])
        .select()
        .single();
      
      if (postError) {
        console.error('❌ 블로그 포스트 생성 에러:', postError);
        return res.status(500).json({
          error: '블로그 포스트를 생성할 수 없습니다.',
          details: postError.message
        });
      }
      
      console.log('✅ 블로그 포스트 생성 성공:', newPost.id);
      
      // 콘텐츠 캘린더에 blog_post_id 연결
      if (calendarId) {
        const { error: updateError } = await supabase
          .from('cc_content_calendar')
          .update({ 
            blog_post_id: newPost.id,
            status: 'draft',
            updated_at: new Date().toISOString()
          })
          .eq('id', calendarId);
        
        if (updateError) {
          console.warn('⚠️ 콘텐츠 캘린더 업데이트 실패:', updateError);
        } else {
          console.log('✅ 콘텐츠 캘린더 연결 성공');
        }
      }
      
      return res.status(201).json({
        success: true,
        post: newPost,
        message: '블로그 초안이 성공적으로 생성되었습니다.'
      });
      
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
