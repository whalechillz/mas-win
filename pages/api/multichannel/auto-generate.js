import { CONTENT_STRATEGY, AUDIENCE_STAGES } from '../../../lib/masgolf-brand-data';
import { AUDIENCE_TARGETS, CHANNEL_PRIORITY, CONTENT_LENGTH_GUIDE, CTA_STRATEGY } from '../../../lib/audience-targets';
import { IMAGE_SPECS, TARGET_IMAGE_SPECS } from '../../../lib/image-specs';
import { LANDING_PAGE_STRATEGY, generateLandingUrl } from '../../../lib/landing-page-strategy';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 추적 URL 생성 (랜딩페이지 전략 적용)
function generateTrackingUrl({ channel, targetAudience, source, campaign, content }) {
  const landingUrl = generateLandingUrl(channel, targetAudience, {
    content: content,
    term: campaign
  });
  
  return landingUrl;
}

// 타겟별 카카오톡 메시지 생성
async function generateKakaoMessage(blogPost, targetAudience, trackingUrl) {
  const target = AUDIENCE_TARGETS[targetAudience];
  const lengthGuide = CONTENT_LENGTH_GUIDE[targetAudience].kakao;
  const cta = CTA_STRATEGY[targetAudience];
  
  const prompt = `
블로그 제목: ${blogPost.title}
요약: ${blogPost.summary}
타겟 오디언스: ${target.name}
페르소나: ${target.personas.join(', ')}
톤앤매너: ${target.tone}
포커스: ${target.focus}
CTA: ${cta.primary}

카카오톡 메시지 생성 요구사항:
- ${lengthGuide.optimal}자 이내 (최대 ${lengthGuide.max}자)
- ${target.messaging?.greeting || '안녕하세요'}로 시작
- ${target.focus}에 집중
- ${target.tone}한 톤앤매너
- 명확한 CTA: "${cta.primary}"
- 전환 링크 포함

형식:
[인사말: ${target.messaging?.greeting || '안녕하세요'}]
[핵심 혜택 1-2줄]
[CTA] 👉 [링크]
`;

  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : process.env.NEXT_PUBLIC_BASE_URL || 'https://win.masgolf.co.kr';
  
  const response = await fetch(`${baseUrl}/api/blog/generate-summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: blogPost.title,
      contentType: blogPost.contentType,
      customerPersona: blogPost.customerPersona,
      brandWeight: blogPost.brandWeight,
      painPoint: blogPost.painPoint,
      conversionGoal: blogPost.conversionGoal,
      targetAudience: targetAudience,
      customPrompt: prompt
    })
  });

  const data = await response.json();
  const content = data.summary || blogPost.summary;
  
  return {
    channel: 'kakao',
    target_audience: targetAudience,
    content: content + `\n\n${cta.primary} 👉 ${trackingUrl}`,
    schedule_date: getKakaoScheduleDate(),
    conversion_tracking: {
      url: trackingUrl,
      goal: cta.primary
    },
    status: 'draft',
    image_spec: IMAGE_SPECS.kakao_channel
  };
}

// 타겟별 SMS 메시지 생성
async function generateSMS(blogPost, targetAudience, trackingUrl) {
  const target = AUDIENCE_TARGETS[targetAudience];
  const lengthGuide = CONTENT_LENGTH_GUIDE[targetAudience].sms;
  const cta = CTA_STRATEGY[targetAudience];
  
  // SMS는 80자 제한
  const shortContent = blogPost.title.length > 50 
    ? blogPost.title.substring(0, 47) + '...'
    : blogPost.title;
  
  return {
    channel: 'sms',
    target_audience: targetAudience,
    content: `${shortContent}\n${cta.primary} ${trackingUrl}`,
    schedule_date: getSMSScheduleDate(),
    conversion_tracking: {
      url: trackingUrl,
      goal: cta.primary
    },
    status: 'draft',
    image_spec: IMAGE_SPECS.sms_mms
  };
}

// 타겟별 네이버 블로그 포스트 생성 (3개 계정)
async function generateNaverBlogPost(blogPost, targetAudience, trackingUrl) {
  const target = AUDIENCE_TARGETS[targetAudience];
  const cta = CTA_STRATEGY[targetAudience];
  
  // 3개 계정별로 변형된 콘텐츠 생성
  const blogAccounts = [
    { id: 'account1', name: '마쓰구골프 공식', style: 'formal' },
    { id: 'account2', name: '마쓰구 리뷰', style: 'review' },
    { id: 'account3', name: '골프 비거리 연구소', style: 'educational' }
  ];
  
  const blogPosts = [];
  
  for (const account of blogAccounts) {
    const title = account.style === 'formal' 
      ? blogPost.title
      : account.style === 'review'
      ? `[리뷰] ${blogPost.title}`
      : `[연구] ${blogPost.title}`;
    
    blogPosts.push({
      channel: 'naver_blog',
      target_audience: targetAudience,
      naver_blog_account: account.id,
      naver_blog_account_name: account.name,
      title: title,
      content: blogPost.content,
      excerpt: blogPost.summary,
      cta_banner: {
        text: cta.primary,
        url: trackingUrl,
        button_text: '지금 확인하기'
      },
      schedule_date: getNaverBlogScheduleDate(account.id),
      conversion_tracking: {
        url: trackingUrl,
        goal: cta.primary
      },
      status: 'draft',
      image_specs: [
        IMAGE_SPECS.naver_blog_1,
        IMAGE_SPECS.naver_blog_2,
        IMAGE_SPECS.naver_blog_3
      ]
    });
  }
  
  return blogPosts;
}

// 타겟별 네이버 광고 생성 (파워링크 + 쇼핑)
async function generateNaverAd(blogPost, targetAudience, trackingUrl) {
  const target = AUDIENCE_TARGETS[targetAudience];
  const cta = CTA_STRATEGY[targetAudience];
  
  // 파워링크 광고
  const powerlinkAd = {
    channel: 'naver_powerlink',
    target_audience: targetAudience,
    headline: blogPost.title.substring(0, 30),
    description: blogPost.summary.substring(0, 45),
    landing_page: trackingUrl,
    target_keywords: extractKeywords(blogPost.title),
    schedule_date: getNaverAdScheduleDate(),
    conversion_tracking: {
      url: trackingUrl,
      goal: cta.primary
    },
    status: 'draft',
    image_spec: IMAGE_SPECS.naver_store
  };
  
  // 쇼핑 광고 (신규 고객용)
  const shoppingAd = targetAudience === 'new_customer' ? {
    channel: 'naver_shopping',
    target_audience: targetAudience,
    title: blogPost.title.substring(0, 50),
    description: blogPost.summary.substring(0, 100),
    landing_page: 'https://smartstore.naver.com/masgolf',
    target_keywords: extractKeywords(blogPost.title),
    schedule_date: getNaverAdScheduleDate(),
    conversion_tracking: {
      url: 'https://smartstore.naver.com/masgolf',
      goal: 'direct_purchase'
    },
    status: 'draft',
    image_spec: IMAGE_SPECS.naver_store
  } : null;
  
  return [powerlinkAd, shoppingAd].filter(ad => ad !== null);
}

// 타겟별 구글 광고 생성 (다양한 사이즈)
async function generateGoogleAd(blogPost, targetAudience, trackingUrl) {
  const target = AUDIENCE_TARGETS[targetAudience];
  const cta = CTA_STRATEGY[targetAudience];
  
  // 다양한 사이즈의 구글 광고 생성
  const googleAds = [
    {
      channel: 'google_ads',
      target_audience: targetAudience,
      ad_type: 'square',
      headline1: blogPost.title.substring(0, 30),
      headline2: cta.primary,
      description: blogPost.summary.substring(0, 90),
      landing_page: trackingUrl,
      target_keywords: extractKeywords(blogPost.title),
      schedule_date: getGoogleAdScheduleDate(),
      conversion_tracking: {
        url: trackingUrl,
        goal: cta.primary
      },
      status: 'draft',
      image_spec: IMAGE_SPECS.google_square
    },
    {
      channel: 'google_ads',
      target_audience: targetAudience,
      ad_type: 'landscape',
      headline1: blogPost.title.substring(0, 30),
      headline2: cta.primary,
      description: blogPost.summary.substring(0, 90),
      landing_page: trackingUrl,
      target_keywords: extractKeywords(blogPost.title),
      schedule_date: getGoogleAdScheduleDate(),
      conversion_tracking: {
        url: trackingUrl,
        goal: cta.primary
      },
      status: 'draft',
      image_spec: IMAGE_SPECS.google_landscape
    }
  ];
  
  return googleAds;
}

// 타겟별 인스타그램 포스트 생성 (피드 + 스토리)
async function generateInstagramPost(blogPost, targetAudience, trackingUrl) {
  const target = AUDIENCE_TARGETS[targetAudience];
  const cta = CTA_STRATEGY[targetAudience];
  
  const instagramPosts = [
    {
      channel: 'instagram',
      target_audience: targetAudience,
      post_type: 'feed',
      caption: `${blogPost.title}\n\n${blogPost.summary}\n\n${cta.primary} 👉 ${trackingUrl}`,
      hashtags: generateHashtags(blogPost, targetAudience),
      schedule_date: getInstagramScheduleDate(),
      conversion_tracking: {
        url: trackingUrl,
        goal: cta.primary
      },
      status: 'draft',
      image_spec: IMAGE_SPECS.instagram_feed
    },
    {
      channel: 'instagram',
      target_audience: targetAudience,
      post_type: 'story',
      caption: `${cta.primary} 👉 ${trackingUrl}`,
      story_cta: {
        text: cta.primary,
        url: trackingUrl
      },
      schedule_date: getInstagramScheduleDate(),
      conversion_tracking: {
        url: trackingUrl,
        goal: cta.primary
      },
      status: 'draft',
      image_spec: IMAGE_SPECS.instagram_story
    }
  ];
  
  return instagramPosts;
}

// 타겟별 페이스북 포스트 생성
async function generateFacebookPost(blogPost, targetAudience, trackingUrl) {
  const target = AUDIENCE_TARGETS[targetAudience];
  const cta = CTA_STRATEGY[targetAudience];
  
  return {
    channel: 'facebook',
    target_audience: targetAudience,
    post: `${blogPost.title}\n\n${blogPost.summary}\n\n${cta.primary} 👉 ${trackingUrl}`,
    hashtags: generateHashtags(blogPost, targetAudience),
    schedule_date: getFacebookScheduleDate(),
    conversion_tracking: {
      url: trackingUrl,
      goal: cta.primary
    },
    status: 'draft',
    image_spec: IMAGE_SPECS.facebook_feed
  };
}

// 유틸리티 함수들
function getKakaoScheduleDate() {
  const date = new Date();
  date.setHours(date.getHours() + 1); // 1시간 후
  return date.toISOString();
}

function getSMSScheduleDate() {
  const date = new Date();
  date.setHours(date.getHours() + 2); // 2시간 후
  return date.toISOString();
}

function getNaverBlogScheduleDate(accountId) {
  const date = new Date();
  // 계정별로 다른 일정 (중복 방지)
  const dayOffset = accountId === 'account1' ? 1 : accountId === 'account2' ? 2 : 3;
  date.setDate(date.getDate() + dayOffset);
  return date.toISOString();
}

function getNaverAdScheduleDate() {
  const date = new Date();
  date.setHours(date.getHours() + 3); // 3시간 후
  return date.toISOString();
}

function getGoogleAdScheduleDate() {
  const date = new Date();
  date.setHours(date.getHours() + 4); // 4시간 후
  return date.toISOString();
}

function getInstagramScheduleDate() {
  const date = new Date();
  date.setHours(date.getHours() + 6); // 6시간 후
  return date.toISOString();
}

function getFacebookScheduleDate() {
  const date = new Date();
  date.setHours(date.getHours() + 8); // 8시간 후
  return date.toISOString();
}

function extractKeywords(title) {
  const keywords = title.split(' ').slice(0, 5);
  return keywords.map(k => k.replace(/[^\w가-힣]/g, '')).filter(k => k.length > 1);
}

function generateHashtags(blogPost, targetAudience) {
  const baseHashtags = ['#골프', '#드라이버', '#마쓰구골프'];
  const target = AUDIENCE_TARGETS[targetAudience];
  
  const targetHashtags = targetAudience === 'existing_customer' 
    ? ['#업그레이드', '#VIP', '#특별혜택', '#재구매']
    : ['#비거리', '#고반발', '#무료시타', '#맞춤피팅'];
  
  const personaHashtags = {
    '중상급 골퍼': ['#중상급골퍼', '#비거리향상'],
    '시니어 골퍼': ['#시니어골퍼', '#60대골프'],
    '초보 골퍼': ['#초보골퍼', '#골프입문'],
    '비즈니스 골퍼': ['#비즈니스골프', '#골프네트워킹']
  };
  
  return [...baseHashtags, ...targetHashtags, ...(personaHashtags[blogPost.customerPersona] || [])];
}

// 멀티채널 콘텐츠를 데이터베이스에 저장
async function saveMultichannelContent(parentId, multichannelContent) {
  try {
    // 먼저 기존 멀티채널 콘텐츠가 있는지 확인하고 삭제
    console.log('🗑️ 기존 멀티채널 콘텐츠 삭제 중...', parentId);
    
    // 1. parent_content_id로 삭제
    const { error: deleteError1 } = await supabase
      .from('cc_content_calendar')
      .delete()
      .eq('parent_content_id', parentId)
      .eq('content_type', 'multichannel');

    if (deleteError1) {
      console.error('❌ parent_content_id로 삭제 오류:', deleteError1);
    }

    // 2. blog_post_id로도 삭제 (혹시 모를 경우)
    const { error: deleteError2 } = await supabase
      .from('cc_content_calendar')
      .delete()
      .eq('blog_post_id', parentId)
      .eq('content_type', 'multichannel');

    if (deleteError2) {
      console.error('❌ blog_post_id로 삭제 오류:', deleteError2);
    }

    // 3. 제목 패턴으로 삭제 (혹시 모를 경우)
    const { error: deleteError3 } = await supabase
      .from('cc_content_calendar')
      .delete()
      .like('title', '%[kakao%')
      .eq('content_type', 'multichannel');

    if (deleteError3) {
      console.error('❌ 제목 패턴으로 삭제 오류:', deleteError3);
    }

    // 4. 모든 멀티채널 콘텐츠 삭제 (강제 삭제)
    const { error: deleteError4 } = await supabase
      .from('cc_content_calendar')
      .delete()
      .eq('content_type', 'multichannel');

    if (deleteError4) {
      console.error('❌ 모든 멀티채널 콘텐츠 삭제 오류:', deleteError4);
    }

    console.log('✅ 기존 멀티채널 콘텐츠 삭제 완료');

    // 각 콘텐츠에 고유한 제목과 날짜 생성 (중복 방지)
    const currentDate = new Date();
    const timestamp = Date.now();
    const insertData = multichannelContent.map((content, index) => {
      const baseTitle = content.title || content.headline || content.headline1 || content.caption || content.post || content.content;
      const uniqueTitle = `${baseTitle} [${content.channel}-${content.target_audience}-${timestamp}-${index}]`;
      
      // 각 콘텐츠마다 다른 날짜로 설정 (중복 방지)
      const contentDate = new Date(currentDate);
      contentDate.setDate(contentDate.getDate() + index);
      const dateString = contentDate.toISOString().split('T')[0];
      
      return {
        parent_content_id: parentId,
        title: uniqueTitle,
        content_type: 'multichannel',
        target_audience_type: content.target_audience,
        channel_type: content.channel,
        content_body: content.content || content.description || content.post,
        status: content.status || 'draft',
        content_date: dateString,
        year: contentDate.getFullYear(),
        month: contentDate.getMonth() + 1,
        is_root_content: false,
        multichannel_status: 'completed',
        naver_blog_account: content.naver_blog_account,
        naver_blog_account_name: content.naver_blog_account_name,
        generated_images: content.image_spec ? [content.image_spec] : content.image_specs || [],
        landing_page_url: content.landing_page || content.conversion_tracking?.url,
        utm_parameters: content.conversion_tracking || {},
        conversion_goals: [content.conversion_tracking?.goal || 'engagement'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });

    console.log('📝 삽입할 데이터:', insertData.map(item => ({ title: item.title, channel: item.channel_type, target: item.target_audience_type })));

    const { data, error } = await supabase
      .from('cc_content_calendar')
      .insert(insertData)
      .select();

    if (error) {
      console.error('멀티채널 콘텐츠 저장 오류:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('멀티채널 콘텐츠 저장 실패:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { blogPostId, targetAudiences = ['existing_customer', 'new_customer'] } = req.body;
    
    if (!blogPostId) {
      return res.status(400).json({ error: 'blogPostId는 필수입니다.' });
    }
    
    // 실제 블로그 포스트 조회
    console.log('🔍 블로그 포스트 조회 시작:', blogPostId);
    const { data: blogPost, error: blogError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', blogPostId)
      .single();

    console.log('📊 블로그 포스트 조회 결과:', { blogPost, blogError });

    if (blogError || !blogPost) {
      console.error('❌ 블로그 포스트 조회 오류:', blogError);
      return res.status(404).json({ 
        error: '블로그 포스트를 찾을 수 없습니다.',
        details: blogError?.message || 'No blog post found',
        blogPostId: blogPostId
      });
    }
    
    const strategy = CONTENT_STRATEGY[blogPost.content_type];
    const stage = AUDIENCE_STAGES[blogPost.conversion_goal];
    
    // 기존 루트 콘텐츠가 있는지 확인
    let rootContent;
    const { data: existingRoot, error: existingError } = await supabase
      .from('cc_content_calendar')
      .select('*')
      .eq('blog_post_id', blogPostId)
      .eq('is_root_content', true)
      .single();

    if (existingRoot) {
      // 기존 루트 콘텐츠 사용
      rootContent = existingRoot;
      
      // 멀티채널 상태를 generating으로 업데이트
      await supabase
        .from('cc_content_calendar')
        .update({ 
          multichannel_status: 'generating',
          updated_at: new Date().toISOString()
        })
        .eq('id', rootContent.id);
    } else {
      // 새 루트 콘텐츠 생성
      const { data: newRootContent, error: rootError } = await supabase
        .from('cc_content_calendar')
        .insert({
          title: blogPost.title,
          content_type: 'blog',
          target_audience_type: 'new_customer',
          channel_type: 'blog',
          content_body: blogPost.content,
          status: blogPost.status || 'published',
          content_date: new Date().toISOString().split('T')[0],
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
          is_root_content: true,
          multichannel_status: 'generating',
          blog_post_id: blogPostId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (rootError) {
        console.error('루트 콘텐츠 저장 오류:', rootError);
        throw rootError;
      }
      
      rootContent = newRootContent;
    }

    const allMultichannelContent = [];
    
    // 각 타겟 오디언스별로 멀티채널 콘텐츠 생성
    for (const targetAudience of targetAudiences) {
      const target = AUDIENCE_TARGETS[targetAudience];
      const channels = target.channels;
      
      // 전환 추적 URL 생성
      const trackingUrl = generateTrackingUrl({
        channel: channels[0], // 첫 번째 채널 기준
        targetAudience: targetAudience,
        source: 'multichannel',
        campaign: blogPost.id,
        content: blogPost.title
      });
      
      // 채널별 콘텐츠 생성
      const channelResults = [];
      
      for (const channel of channels) {
        let channelContent = null;
        
        switch (channel) {
          case 'kakao':
            channelContent = await generateKakaoMessage(blogPost, targetAudience, trackingUrl);
            break;
          case 'sms':
            channelContent = await generateSMS(blogPost, targetAudience, trackingUrl);
            break;
          case 'naver_blog':
            channelContent = await generateNaverBlogPost(blogPost, targetAudience, trackingUrl);
            break;
          case 'naver_powerlink':
          case 'naver_shopping':
            channelContent = await generateNaverAd(blogPost, targetAudience, trackingUrl);
            break;
          case 'google_ads':
            channelContent = await generateGoogleAd(blogPost, targetAudience, trackingUrl);
            break;
          case 'instagram':
            channelContent = await generateInstagramPost(blogPost, targetAudience, trackingUrl);
            break;
          case 'facebook':
            channelContent = await generateFacebookPost(blogPost, targetAudience, trackingUrl);
            break;
        }
        
        if (channelContent) {
          // 배열인 경우 (네이버 블로그, 구글 광고 등)
          if (Array.isArray(channelContent)) {
            channelResults.push(...channelContent);
          } else {
            channelResults.push(channelContent);
          }
        }
      }
      
      allMultichannelContent.push(...channelResults);
    }
    
    // 멀티채널 콘텐츠를 데이터베이스에 저장
    const savedContent = await saveMultichannelContent(rootContent.id, allMultichannelContent);
    
    // 루트 콘텐츠의 멀티채널 상태 업데이트
    await supabase
      .from('cc_content_calendar')
      .update({ 
        multichannel_status: 'completed',
        derived_content_count: allMultichannelContent.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', rootContent.id);
    
    return res.json({
      success: true,
      rootContent: rootContent,
      multichannelContent: allMultichannelContent,
      savedContent: savedContent,
      totalChannels: allMultichannelContent.length,
      targetAudiences: targetAudiences,
      message: `총 ${allMultichannelContent.length}개의 멀티채널 콘텐츠가 생성되었습니다.`
    });

  } catch (error) {
    console.error('멀티채널 생성 오류:', error);
    return res.status(500).json({ 
      error: '멀티채널 생성 실패',
      details: error.message 
    });
  }
}
