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
      description: content.description,
      content_body: content.description,
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

    const { data, error } = await supabase
      .from('cc_content_calendar')
      .insert(calendarItems)
      .select();

    if (error) {
      console.error('콘텐츠 캘린더 등록 오류:', error);
      console.error('상세 오류 정보:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return res.status(500).json({ 
        success: false,
        message: '콘텐츠 캘린더 등록 실패',
        error: error.message,
        details: error.details
      });
    }

    console.log(`✅ ${calendarItems.length}개의 콘텐츠가 캘린더에 등록되었습니다.`);

    res.status(200).json({
      success: true,
      message: `${calendarItems.length}개의 콘텐츠가 캘린더에 추가되었습니다.`,
      addedItems: data,
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
