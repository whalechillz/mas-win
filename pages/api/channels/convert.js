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
    const optimizedContent = await generateChannelContent(blogPost, channelType, req.body.targetMessageType);

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

async function generateChannelContent(blogPost, channelType, targetMessageType = null) {
  const { title, content, excerpt, tags } = blogPost;

  switch (channelType) {
    case 'sms':
      return generateSMSContent(title, content, excerpt, targetMessageType);
    case 'kakao':
      return generateKakaoContent(title, content, excerpt, tags);
    case 'naver':
      return generateNaverContent(title, content, excerpt, tags);
    default:
      throw new Error(`Unsupported channel type: ${channelType}`);
  }
}

function generateSMSContent(title, content, excerpt, targetMessageType = null) {
  // 전체 내용을 하나의 메시지로 구성
  let fullText = title;
  
  if (excerpt && excerpt.length > 0) {
    fullText += `\n\n${excerpt}`;
  } else {
    // excerpt가 없으면 content에서 HTML 태그 제거 후 사용
    const cleanContent = content.replace(/<[^>]*>/g, '').trim();
    fullText += `\n\n${cleanContent}`;
  }

  // 텍스트 정리 강화
  fullText = cleanTextForSMS(fullText);

  // 선택된 메시지 타입이 있으면 해당 타입에 맞게 최적화
  if (targetMessageType) {
    return optimizeForMessageType(fullText, targetMessageType);
  }

  // 선택된 타입이 없으면 내용 길이에 따라 자동 결정
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

function optimizeForMessageType(fullText, targetMessageType) {
  let maxLength;
  let messageType = targetMessageType;

  // 타겟 메시지 타입에 따른 길이 제한 설정
  switch (targetMessageType) {
    case 'SMS':
      maxLength = 90;
      break;
    case 'SMS300':
      maxLength = 300;
      break;
    case 'LMS':
    case 'MMS':
      maxLength = 2000;
      break;
    default:
      maxLength = 90;
      messageType = 'SMS';
  }

  // 전화/문자 유도 메시지로 강화
  let optimizedText = enhanceForCallToAction(fullText, maxLength);
  
  if (optimizedText.length > maxLength) {
    // 타겟 길이보다 길면 핵심 내용만 추출
    optimizedText = extractKeyContent(optimizedText, maxLength);
  }

  return {
    messageText: optimizedText,
    messageType: messageType,
    characterCount: optimizedText.length,
    maxLength: maxLength
  };
}

function extractKeyContent(text, maxLength) {
  // 문장 단위로 분리
  const sentences = text.split(/[.!?]\s*/).filter(s => s.trim().length > 0);
  
  // 핵심 키워드 추출 (전화/문자 유도 키워드 우선)
  const keywords = ['예약', '문의', '상담', '전화', '골프', '여행', '투어', '할인', '특가', '이벤트'];
  
  // 키워드가 포함된 문장 우선 선택
  const rankedSentences = sentences.map(sentence => {
    let score = 0;
    keywords.forEach(keyword => {
      if (sentence.toLowerCase().includes(keyword.toLowerCase())) {
        // 전화/문자 유도 키워드는 더 높은 점수
        if (['예약', '문의', '상담', '전화'].includes(keyword)) {
          score += 20;
        } else {
          score += 10;
        }
      }
    });
    
    // 숫자 포함 점수 (전화번호 등)
    if (/\d{3}-\d{3,4}-\d{4}/.test(sentence)) score += 15; // 전화번호 패턴
    else if (/\d+/.test(sentence)) score += 5; // 일반 숫자
    
    // 물음표나 느낌표 포함 점수
    if (/[!?]/.test(sentence)) score += 3;
    
    return { sentence, score };
  }).sort((a, b) => b.score - a.score);

  // 목표 길이에 맞게 문장 선택
  let result = '';
  let currentLength = 0;
  
  for (const { sentence } of rankedSentences) {
    const sentenceWithPunctuation = sentence.trim() + '.';
    if (currentLength + sentenceWithPunctuation.length <= maxLength - 10) {
      result += (result ? ' ' : '') + sentenceWithPunctuation;
      currentLength = result.length;
    } else {
      break;
    }
  }
  
  // 목표 길이보다 짧으면 첫 번째 문장 추가
  if (result.length < maxLength - 20 && sentences.length > 0) {
    const firstSentence = sentences[0].trim() + '.';
    if (result.length + firstSentence.length <= maxLength) {
      result = firstSentence + (result ? ' ' + result : '');
    }
  }
  
  // 최종 길이 조정
  if (result.length > maxLength) {
    result = result.substring(0, maxLength - 3) + '...';
  }
  
  return result.trim();
}

// 새로운 함수: SMS용 텍스트 정리
function cleanTextForSMS(text) {
  let cleaned = text;
  
  // 1. 마크다운 문법 제거
  cleaned = cleaned.replace(/^#{1,6}\s*/gm, ''); // #, ##, ### 등 제거
  cleaned = cleaned.replace(/^---+\s*$/gm, ''); // --- 구분선 제거
  cleaned = cleaned.replace(/^\*\*\s*/gm, ''); // ** 제거
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1'); // **텍스트** → 텍스트
  
  // 2. 불완전한 링크 제거
  cleaned = cleaned.replace(/\(https?:\/\/[^)]*$/gm, ''); // 불완전한 링크 제거
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1'); // [텍스트](링크) → 텍스트
  
  // 3. 이미지 마크다운 제거
  cleaned = cleaned.replace(/!\[([^\]]*)\]\([^)]*\)/g, ''); // ![alt](url) 제거
  cleaned = cleaned.replace(/Jpg\)##/g, ''); // Jpg)## 제거
  
  // 4. 불필요한 공백 정리
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n'); // 연속된 줄바꿈 정리
  cleaned = cleaned.replace(/^\s+|\s+$/gm, ''); // 각 줄의 앞뒤 공백 제거
  cleaned = cleaned.replace(/\s+/g, ' ').trim(); // 연속된 공백을 하나로
  
  // 5. 추가 정리
  cleaned = cleaned.replace(/^-\s*/gm, ''); // - 리스트 마커 제거
  cleaned = cleaned.replace(/^\d+\.\s*/gm, ''); // 1. 번호 리스트 마커 제거
  cleaned = cleaned.replace(/^•\s*/gm, ''); // • 불릿 포인트 제거
  
  // 6. 불필요한 문구 제거
  cleaned = cleaned.replace(/해시태그\s*#/g, ''); // 해시태그 제거
  cleaned = cleaned.replace(/#[가-힣\w]+/g, ''); // #태그 제거
  
  // 7. 추가 정리
  cleaned = cleaned.replace(/^투어 정보\s*-\s*/gm, ''); // "투어 정보 -" 제거
  cleaned = cleaned.replace(/^포함 내역\s*-\s*/gm, ''); // "포함 내역 -" 제거
  cleaned = cleaned.replace(/^불포함 내역\s*-\s*/gm, ''); // "불포함 내역 -" 제거
  cleaned = cleaned.replace(/^예약 안내\s*/gm, ''); // "예약 안내" 제거
  
  // 8. 불필요한 설명 제거
  cleaned = cleaned.replace(/^안녕하세요[^.]*\./gm, ''); // "안녕하세요..." 제거
  cleaned = cleaned.replace(/^여러분의 소중한 추억[^.]*\./gm, ''); // 불필요한 문구 제거
  
  return cleaned;
}

// 새로운 함수: 전화/문자 유도 메시지 강화
function enhanceForCallToAction(text, maxLength) {
  let enhanced = text;
  
  // 1. 전화번호 강조
  enhanced = enhanced.replace(/(\d{3}-\d{3,4}-\d{4})/g, '📞 $1');
  
  // 2. 행동 유도 문구 강화
  enhanced = enhanced.replace(/예약/g, '지금 예약');
  enhanced = enhanced.replace(/문의/g, '📞문의');
  enhanced = enhanced.replace(/상담/g, '📞상담');
  
  // 3. 긴급성 표현 추가
  enhanced = enhanced.replace(/기회/g, '지금 기회');
  enhanced = enhanced.replace(/할인/g, '한정 할인');
  
  // 4. 강력한 행동 유도 문구 추가 (길이 허용 시)
  if (enhanced.length < maxLength - 50) {
    // 전화번호가 이미 있으면 간단하게, 없으면 강력하게
    if (enhanced.includes('📞')) {
      enhanced += '\n\n🔥 지금 전화하세요!';
    } else {
      enhanced += '\n\n🔥 지금 전화하세요! 📞 031-215-3990';
    }
  } else if (enhanced.length < maxLength - 20) {
    // 길이가 부족하면 간단하게
    enhanced += '\n\n📞 지금 전화!';
  }
  
  // 5. 추가 강화 (길이 여유가 있을 때)
  if (enhanced.length < maxLength - 30) {
    enhanced = enhanced.replace(/투어/g, '특별 투어');
    enhanced = enhanced.replace(/여행/g, '특별 여행');
    enhanced = enhanced.replace(/골프/g, '프리미엄 골프');
    enhanced = enhanced.replace(/패키지/g, '특별 패키지');
  }
  
  // 6. 최종 정리
  enhanced = enhanced.replace(/\n\s*\n\s*\n/g, '\n\n'); // 연속된 줄바꿈 정리
  enhanced = enhanced.replace(/^\s+|\s+$/gm, ''); // 각 줄의 앞뒤 공백 제거
  enhanced = enhanced.trim();
  
  // 7. 마지막 점검 - 전화번호가 없으면 추가
  if (!enhanced.includes('📞') && enhanced.length < maxLength - 20) {
    enhanced += '\n\n📞 031-215-3990';
  }
  
  // 8. 최종 길이 조정
  if (enhanced.length > maxLength) {
    enhanced = enhanced.substring(0, maxLength - 3) + '...';
  }
  
  return enhanced;
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
