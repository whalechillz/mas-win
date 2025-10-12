import { createClient } from '@supabase/supabase-js';
import { AUDIENCE_TARGETS, CHANNEL_PRIORITY, CONTENT_LENGTH_GUIDE, CTA_STRATEGY } from '../../lib/audience-targets';
import { IMAGE_SPECS, TARGET_IMAGE_SPECS } from '../../lib/image-specs';
import { LANDING_PAGE_STRATEGY, generateLandingUrl } from '../../lib/landing-page-strategy';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 멀티채널 콘텐츠 생성 함수들 (간소화된 버전)
function generateKakaoMessage(blogPost, targetAudience, trackingUrl) {
  const target = AUDIENCE_TARGETS[targetAudience];
  return {
    channel: 'kakao',
    target_audience: targetAudience,
    title: blogPost.title.substring(0, 50),
    content: `${target.messaging?.greeting || '안녕하세요!'}\n\n${blogPost.summary.substring(0, 200)}...\n\n자세히 보기: ${trackingUrl}`,
    status: 'draft',
    conversion_tracking: {
      url: trackingUrl,
      goal: 'engagement'
    }
  };
}

function generateSMS(blogPost, targetAudience, trackingUrl) {
  const target = AUDIENCE_TARGETS[targetAudience];
  return {
    channel: 'sms',
    target_audience: targetAudience,
    title: blogPost.title.substring(0, 30),
    content: `${blogPost.summary.substring(0, 80)}... 자세히: ${trackingUrl}`,
    status: 'draft',
    conversion_tracking: {
      url: trackingUrl,
      goal: 'engagement'
    }
  };
}

function generateNaverBlogPost(blogPost, targetAudience, trackingUrl) {
  return [
    {
      channel: 'naver_blog',
      target_audience: targetAudience,
      title: blogPost.title,
      content: blogPost.content.substring(0, 500) + '...',
      status: 'draft',
      conversion_tracking: {
        url: trackingUrl,
        goal: 'engagement'
      }
    }
  ];
}

function generateGoogleAd(blogPost, targetAudience, trackingUrl) {
  const cta = CTA_STRATEGY[targetAudience];
  return [
    {
      channel: 'google_ads',
      target_audience: targetAudience,
      title: blogPost.title.substring(0, 30),
      content: blogPost.summary.substring(0, 90),
      status: 'draft',
      conversion_tracking: {
        url: trackingUrl,
        goal: cta.primary
      }
    }
  ];
}

function generateInstagramPost(blogPost, targetAudience, trackingUrl) {
  return {
    channel: 'instagram',
    target_audience: targetAudience,
    title: blogPost.title.substring(0, 40),
    content: blogPost.summary.substring(0, 150) + '...',
    status: 'draft',
    conversion_tracking: {
      url: trackingUrl,
      goal: 'engagement'
    }
  };
}

function generateFacebookPost(blogPost, targetAudience, trackingUrl) {
  return {
    channel: 'facebook',
    target_audience: targetAudience,
    title: blogPost.title.substring(0, 40),
    content: blogPost.summary.substring(0, 200) + '...',
    status: 'draft',
    conversion_tracking: {
      url: trackingUrl,
      goal: 'engagement'
    }
  };
}

function generateTrackingUrl(params) {
  const baseUrl = generateLandingUrl(params.channel, params.targetAudience);
  const utmParams = new URLSearchParams({
    utm_source: params.source,
    utm_medium: params.channel,
    utm_campaign: params.campaign,
    utm_content: params.content
  });
  return `${baseUrl}?${utmParams.toString()}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { blogPostId, targetAudiences } = req.body;

    if (!blogPostId || !targetAudiences) {
      return res.status(400).json({ error: 'blogPostId and targetAudiences are required' });
    }

    console.log('🔍 디버그: 멀티채널 데이터 생성 시작', { blogPostId, targetAudiences });

    // 블로그 포스트 조회
    const { data: blogPost, error: blogError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', blogPostId)
      .single();

    if (blogError || !blogPost) {
      console.error('❌ 블로그 포스트 조회 오류:', blogError);
      return res.status(404).json({ error: 'Blog post not found' });
    }

    console.log('✅ 블로그 포스트 조회 성공:', blogPost.title);

    const allMultichannelContent = [];
    
    // 각 타겟 오디언스별로 멀티채널 콘텐츠 생성
    for (const targetAudience of targetAudiences) {
      const target = AUDIENCE_TARGETS[targetAudience];
      const channels = target.channels;
      
      console.log(`🎯 타겟 오디언스: ${targetAudience}, 채널: ${channels.join(', ')}`);
      
      // 전환 추적 URL 생성
      const trackingUrl = generateTrackingUrl({
        channel: channels[0],
        targetAudience: targetAudience,
        source: 'multichannel',
        campaign: blogPost.id,
        content: blogPost.title
      });
      
      // 채널별 콘텐츠 생성
      for (const channel of channels) {
        let channelContent = null;
        
        switch (channel) {
          case 'kakao':
            channelContent = generateKakaoMessage(blogPost, targetAudience, trackingUrl);
            break;
          case 'sms':
            channelContent = generateSMS(blogPost, targetAudience, trackingUrl);
            break;
          case 'naver_blog':
            channelContent = generateNaverBlogPost(blogPost, targetAudience, trackingUrl);
            break;
          case 'google_ads':
            channelContent = generateGoogleAd(blogPost, targetAudience, trackingUrl);
            break;
          case 'instagram':
            channelContent = generateInstagramPost(blogPost, targetAudience, trackingUrl);
            break;
          case 'facebook':
            channelContent = generateFacebookPost(blogPost, targetAudience, trackingUrl);
            break;
        }
        
        if (channelContent) {
          if (Array.isArray(channelContent)) {
            allMultichannelContent.push(...channelContent);
          } else {
            allMultichannelContent.push(channelContent);
          }
        }
      }
    }

    console.log(`📊 생성된 멀티채널 콘텐츠 총 ${allMultichannelContent.length}개`);

    // 삽입할 데이터 생성 (실제 API와 동일한 로직)
    const currentDate = new Date();
    const timestamp = Date.now();
    const insertData = allMultichannelContent.map((content, index) => {
      const baseTitle = content.title || content.headline || content.headline1 || content.caption || content.post || content.content;
      const uniqueTitle = `${baseTitle} [${content.channel}-${content.target_audience}-${timestamp}-${index}-${Math.random().toString(36).substr(2, 9)}]`;
      
      const contentDate = new Date(currentDate);
      contentDate.setDate(contentDate.getDate() + index);
      const dateString = contentDate.toISOString().split('T')[0];
      
      return {
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
        conversion_goals: [content.conversion_tracking?.goal || 'engagement'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });

    // 중복 확인
    const duplicates = [];
    for (let i = 0; i < insertData.length; i++) {
      for (let j = i + 1; j < insertData.length; j++) {
        if (insertData[i].year === insertData[j].year &&
            insertData[i].month === insertData[j].month &&
            insertData[i].content_date === insertData[j].content_date &&
            insertData[i].title === insertData[j].title) {
          duplicates.push({
            index1: i,
            index2: j,
            data1: insertData[i],
            data2: insertData[j]
          });
        }
      }
    }

    return res.json({
      success: true,
      blogPost: {
        id: blogPost.id,
        title: blogPost.title
      },
      targetAudiences: targetAudiences,
      totalContent: allMultichannelContent.length,
      insertData: insertData.map(item => ({
        title: item.title,
        year: item.year,
        month: item.month,
        content_date: item.content_date,
        channel: item.channel_type,
        target: item.target_audience_type
      })),
      duplicates: duplicates,
      hasDuplicates: duplicates.length > 0
    });

  } catch (error) {
    console.error('❌ 디버그 API 오류:', error);
    return res.status(500).json({ 
      error: '디버그 API 실패', 
      details: error.message 
    });
  }
}
