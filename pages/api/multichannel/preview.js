import { AUDIENCE_STAGES } from '../../../lib/masgolf-brand-data';

// 추적 URL 생성
function generateTrackingUrl({ baseUrl, source, campaign }) {
  const params = new URLSearchParams({
    utm_source: source,
    utm_medium: 'content',
    utm_campaign: campaign,
    utm_content: Date.now()
  });
  
  return `${baseUrl}?${params.toString()}`;
}

// 카카오톡 미리보기 생성
function generateKakaoPreview(blogPost, trackingUrl) {
  const stage = AUDIENCE_STAGES[blogPost.conversionGoal];
  
  return {
    channel: 'kakao',
    content: `${blogPost.title}\n\n${blogPost.summary}\n\n${stage.cta} 👉 ${trackingUrl}`,
    cta: stage.cta,
    url: trackingUrl,
    goal: stage.conversionGoal,
    characterCount: blogPost.title.length + blogPost.summary.length + stage.cta.length + 10
  };
}

// SMS 미리보기 생성
function generateSMSPreview(blogPost, trackingUrl) {
  const stage = AUDIENCE_STAGES[blogPost.conversionGoal];
  
  // SMS는 80자 제한
  const shortContent = blogPost.title.length > 50 
    ? blogPost.title.substring(0, 47) + '...'
    : blogPost.title;
  
  return {
    channel: 'sms',
    content: `${shortContent}\n${stage.cta} ${trackingUrl}`,
    shortUrl: trackingUrl,
    characterCount: shortContent.length + stage.cta.length + trackingUrl.length + 2
  };
}

// 네이버 블로그 미리보기 생성
function generateNaverBlogPreview(blogPost, trackingUrl) {
  const stage = AUDIENCE_STAGES[blogPost.conversionGoal];
  
  return {
    channel: 'naver_blog',
    title: blogPost.title,
    excerpt: blogPost.summary,
    cta: stage.cta,
    url: trackingUrl,
    goal: stage.conversionGoal
  };
}

// 네이버 광고 미리보기 생성
function generateNaverAdPreview(blogPost, trackingUrl) {
  const stage = AUDIENCE_STAGES[blogPost.conversionGoal];
  
  return {
    channel: 'naver_ad',
    headline: blogPost.title.substring(0, 30),
    description: blogPost.summary.substring(0, 80),
    landingPage: trackingUrl,
    url: trackingUrl,
    goal: stage.conversionGoal
  };
}

// 구글 광고 미리보기 생성
function generateGoogleAdPreview(blogPost, trackingUrl) {
  const stage = AUDIENCE_STAGES[blogPost.conversionGoal];
  
  return {
    channel: 'google_ad',
    headline1: blogPost.title.substring(0, 30),
    headline2: stage.cta,
    description: blogPost.summary.substring(0, 80),
    landingPage: trackingUrl,
    url: trackingUrl,
    goal: stage.conversionGoal
  };
}

// 인스타그램 미리보기 생성
function generateInstagramPreview(blogPost, trackingUrl) {
  const stage = AUDIENCE_STAGES[blogPost.conversionGoal];
  
  const hashtags = generateHashtags(blogPost);
  
  return {
    channel: 'instagram',
    caption: `${blogPost.title}\n\n${blogPost.summary}\n\n${stage.cta} 👉 ${trackingUrl}\n\n${hashtags.join(' ')}`,
    hashtags: hashtags,
    storyCta: {
      text: stage.cta,
      url: trackingUrl
    },
    url: trackingUrl,
    goal: stage.conversionGoal
  };
}

// 해시태그 생성
function generateHashtags(blogPost) {
  const baseHashtags = ['#골프', '#드라이버', '#마쓰구프'];
  const personaHashtags = {
    '중상급 골퍼': ['#중상급골퍼', '#비거리향상'],
    '시니어 골퍼': ['#시니어골퍼', '#60대골프'],
    '초보 골퍼': ['#초보골퍼', '#골프입문'],
    '비즈니스 골퍼': ['#비즈니스골프', '#골프네트워킹']
  };
  
  return [...baseHashtags, ...(personaHashtags[blogPost.customerPersona] || [])];
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { blogPost } = req.body;
    
    if (!blogPost) {
      return res.status(400).json({ error: '블로그 포스트 데이터가 필요합니다.' });
    }
    
    const stage = AUDIENCE_STAGES[blogPost.conversionGoal];
    
    // 전환 추적 URL 생성
    const trackingUrl = generateTrackingUrl({
      baseUrl: stage.landingPage,
      source: 'multichannel',
      campaign: blogPost.id || 'preview'
    });
    
    // 채널별 미리보기 생성
    const preview = {
      kakao: generateKakaoPreview(blogPost, trackingUrl),
      sms: generateSMSPreview(blogPost, trackingUrl),
      naver_blog: generateNaverBlogPreview(blogPost, trackingUrl),
      naver_ad: blogPost.conversionGoal === 'consideration' ? generateNaverAdPreview(blogPost, trackingUrl) : null,
      google_ad: blogPost.conversionGoal === 'decision' ? generateGoogleAdPreview(blogPost, trackingUrl) : null,
      instagram: generateInstagramPreview(blogPost, trackingUrl)
    };
    
    // null 값 제거
    Object.keys(preview).forEach(key => {
      if (preview[key] === null) {
        delete preview[key];
      }
    });
    
    return res.json({
      success: true,
      preview: preview,
      trackingUrl: trackingUrl,
      totalChannels: Object.keys(preview).length,
      conversionGoal: blogPost.conversionGoal
    });

  } catch (error) {
    console.error('멀티채널 미리보기 오류:', error);
    return res.status(500).json({ 
      error: '멀티채널 미리보기 생성 실패',
      details: error.message 
    });
  }
}
