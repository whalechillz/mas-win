import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { blogPostId, channelType } = req.body;

    if (!blogPostId || !channelType) {
      return res.status(400).json({ success: false, message: 'Blog post ID and channel type are required' });
    }

    // 블로그 포스트 조회
    const { data: blogPost, error: fetchError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', blogPostId)
      .single();

    if (fetchError || !blogPost) {
      return res.status(404).json({ success: false, message: 'Blog post not found' });
    }

    // 채널별 최적화된 내용 생성
    const optimizedContent = await generateChannelContent(blogPost, channelType);

    res.status(200).json({
      success: true,
      data: {
        originalContent: blogPost,
        optimizedContent,
        channelType
      }
    });

  } catch (error) {
    console.error('Content conversion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to convert content',
      error: error.message
    });
  }
}

async function generateChannelContent(blogPost, channelType) {
  const { title, content, excerpt, tags } = blogPost;

  switch (channelType) {
    case 'sms':
      return generateSMSContent(title, content, excerpt);
    case 'kakao':
      return generateKakaoContent(title, content, excerpt, tags);
    case 'naver':
      return generateNaverContent(title, content, excerpt, tags);
    default:
      throw new Error(`Unsupported channel type: ${channelType}`);
  }
}

function generateSMSContent(title, content, excerpt) {
  // 전체 내용을 하나의 메시지로 구성
  let fullText = title;
  
  if (excerpt && excerpt.length > 0) {
    fullText += `\n\n${excerpt}`;
  } else {
    // excerpt가 없으면 content에서 HTML 태그 제거 후 사용
    const cleanContent = content.replace(/<[^>]*>/g, '').trim();
    fullText += `\n\n${cleanContent}`;
  }

  // 내용 길이에 따라 메시지 타입 결정
  let messageType = 'SMS';
  let maxLength = 90;
  
  if (fullText.length > 90) {
    messageType = 'LMS';
    maxLength = 2000;
  }

  // SMS인 경우에만 90자로 자르기
  let finalText = fullText;
  if (messageType === 'SMS' && fullText.length > 90) {
    finalText = fullText.substring(0, 87) + '...';
  }

  return {
    messageText: finalText,
    messageType: messageType,
    characterCount: finalText.length,
    maxLength: maxLength
  };
}

function generateKakaoContent(title, content, excerpt, tags) {
  // 카카오는 친근한 톤, 이모지 활용
  const emojis = ['📢', '💡', '🎯', '✨', '🔥', '📝', '🎉'];
  const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

  let kakaoText = `${randomEmoji} ${title}\n\n`;

  if (excerpt && excerpt.length > 0) {
    kakaoText += excerpt;
  } else {
    const shortContent = content.replace(/<[^>]*>/g, '').substring(0, 200);
    kakaoText += shortContent;
  }

  // 태그가 있으면 추가
  if (tags && tags.length > 0) {
    kakaoText += `\n\n#${tags.join(' #')}`;
  }

  return {
    messageText: kakaoText,
    messageType: 'ALIMTALK', // 알림톡
    characterCount: kakaoText.length,
    emoji: randomEmoji,
    tags: tags || []
  };
}

function generateNaverContent(title, content, excerpt, tags) {
  // 네이버는 SEO 최적화, 키워드 포함
  let naverText = title;

  if (excerpt && excerpt.length > 0) {
    naverText += `\n\n${excerpt}`;
  } else {
    const shortContent = content.replace(/<[^>]*>/g, '').substring(0, 300);
    naverText += `\n\n${shortContent}`;
  }

  // 태그가 있으면 SEO 키워드로 활용
  if (tags && tags.length > 0) {
    naverText += `\n\n키워드: ${tags.join(', ')}`;
  }

  return {
    messageText: naverText,
    messageType: 'BLOG',
    characterCount: naverText.length,
    seoKeywords: tags || [],
    estimatedReadTime: Math.ceil(naverText.length / 200) // 분당 200자 기준
  };
}
