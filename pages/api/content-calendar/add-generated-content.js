// 생성된 콘텐츠를 캘린더에 추가하는 API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '설정됨' : '없음');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '설정됨' : '없음');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// URL 친화적인 슬러그 생성 함수
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s가-힣]/g, '') // 특수문자 제거
    .replace(/\s+/g, '-') // 공백을 하이픈으로 변경
    .replace(/-+/g, '-') // 연속된 하이픈을 하나로 변경
    .trim()
    .substring(0, 100); // 길이 제한
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
    return res.status(500).json({ 
      success: false, 
      message: '서버 설정 오류',
      error: 'Supabase 환경 변수가 설정되지 않았습니다'
    });
  }

  const { contentItems } = req.body;

  if (!contentItems || !Array.isArray(contentItems)) {
    return res.status(400).json({ message: 'Invalid content items' });
  }

  try {
    console.log('🔍 캘린더 추가 요청:', { contentItemsCount: contentItems.length });
    console.log('📝 첫 번째 콘텐츠:', contentItems[0]);
    
    const calendarItems = contentItems.map((content, index) => ({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      content_date: content.estimatedPublishDate || new Date(Date.now() + index * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      theme: content.title,
      content_type: 'blog',
      title: content.title,
      description: content.description || content.title || '설명이 없습니다.',
      content_body: content.description || content.title || '콘텐츠 내용이 없습니다.',
      target_audience: content.target_audience || {
        persona: content.targetAudience || '시니어 골퍼',
        stage: content.conversionGoal || 'awareness'
      },
      conversion_tracking: {
        landingPage: 'https://win.masgolf.co.kr',
        goal: content.conversionGoal,
        utmParams: {
          source: 'blog',
          medium: 'organic',
          campaign: content.campaignType || content.contentType
        }
      },
      status: 'draft',
      published_channels: content.channels || ['blog'],
      seo_meta: {
        title: content.title,
        description: content.description,
        keywords: content.keywords ? content.keywords.join(', ') : ''
      },
      campaign_metadata: {
        campaignType: content.campaignType,
        storyFramework: content.storyFramework,
        seasonalTheme: content.seasonalTheme,
        hookMessage: content.hookMessage,
        cta: content.cta,
        storyStructure: content.storyStructure
      }
    }));

    const { data: calendarData, error: calendarError } = await supabase
      .from('cc_content_calendar')
      .insert(calendarItems)
      .select();

    if (calendarError) {
      console.error('콘텐츠 캘린더 등록 오류:', calendarError);
      console.error('상세 오류 정보:', {
        code: calendarError.code,
        message: calendarError.message,
        details: calendarError.details,
        hint: calendarError.hint
      });
      return res.status(500).json({ 
        success: false,
        message: '콘텐츠 캘린더 등록 실패',
        error: calendarError.message,
        details: calendarError.details
      });
    }

    console.log(`✅ ${calendarItems.length}개의 콘텐츠가 캘린더에 등록되었습니다.`);

    // 블로그 포스트에도 자동으로 저장 (양방향 동기화)
    const blogPosts = [];
    for (let i = 0; i < contentItems.length; i++) {
      const content = contentItems[i];
      const calendarItem = calendarData[i];
      
      try {
        // blog_posts 테이블에 저장
        const { data: blogPost, error: blogError } = await supabase
          .from('blog_posts')
          .insert({
            title: content.title,
            slug: generateSlug(content.title),
            summary: content.description || content.title || '요약이 없습니다.',
            content: content.description || content.title || '콘텐츠 내용이 없습니다.',
            category: content.campaignType || '일반',
            status: 'draft',
            meta_title: content.title,
            meta_description: content.description || content.title || '메타 설명이 없습니다.',
            meta_keywords: content.keywords ? content.keywords.join(', ') : '',
            target_audience: content.targetAudience || 'new_customer',
            conversion_goal: content.conversionGoal || 'awareness',
            content_type: 'blog',
            published_channels: content.channels || ['blog'],
            calendar_content_id: calendarItem.id, // 캘린더 콘텐츠 ID 연결
            author: '마쓰구골프'
          })
          .select()
          .single();

        if (blogError) {
          console.error(`블로그 포스트 ${i + 1} 저장 오류:`, blogError);
        } else {
          console.log(`✅ 블로그 포스트 ${i + 1} 저장 성공:`, blogPost.id);
          blogPosts.push(blogPost);
          
          // 캘린더 테이블에 blog_post_id 업데이트
          await supabase
            .from('cc_content_calendar')
            .update({ blog_post_id: blogPost.id })
            .eq('id', calendarItem.id);
        }
      } catch (blogError) {
        console.error(`블로그 포스트 ${i + 1} 저장 중 오류:`, blogError);
      }
    }

    res.status(200).json({
      success: true,
      message: `${calendarItems.length}개의 콘텐츠가 캘린더와 블로그에 추가되었습니다.`,
      addedItems: calendarData,
      blogPosts: blogPosts,
      count: calendarItems.length
    });

  } catch (error) {
    console.error('캘린더 추가 오류:', error);
    res.status(500).json({
      success: false,
      message: '캘린더 추가 실패',
      error: error.message
    });
  }
}
