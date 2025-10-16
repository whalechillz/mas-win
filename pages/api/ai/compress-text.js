export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { text, targetLength, preserveKeywords = true } = req.body;

    if (!text || !targetLength) {
      return res.status(400).json({
        success: false,
        message: '텍스트와 목표 길이는 필수입니다.'
      });
    }

    // AI 텍스트 압축 로직 (실제 AI API 연동 전까지는 규칙 기반 압축)
    const compressedText = await compressTextWithAI(text, targetLength, preserveKeywords);

    return res.status(200).json({
      success: true,
      compressedText,
      originalLength: text.length,
      compressedLength: compressedText.length,
      compressionRatio: Math.round((1 - compressedText.length / text.length) * 100)
    });

  } catch (error) {
    console.error('텍스트 압축 오류:', error);
    return res.status(500).json({
      success: false,
      message: '텍스트 압축 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}

async function compressTextWithAI(text, targetLength, preserveKeywords) {
  // 1. HTML 태그 제거
  let cleanText = text.replace(/<[^>]*>/g, '');
  
  // 2. 불필요한 공백 정리
  cleanText = cleanText.replace(/\s+/g, ' ').trim();
  
  // 3. 핵심 키워드 추출 (골프, 여행, 할인, 이벤트 등)
  const keywords = extractKeywords(cleanText);
  
  // 4. 문장 단위로 분리
  const sentences = cleanText.split(/[.!?]\s*/).filter(s => s.trim().length > 0);
  
  // 5. 중요도 기반 문장 정렬
  const rankedSentences = rankSentences(sentences, keywords);
  
  // 6. 목표 길이에 맞게 문장 선택
  let result = '';
  let currentLength = 0;
  
  for (const sentence of rankedSentences) {
    const sentenceWithPunctuation = sentence.trim() + '.';
    if (currentLength + sentenceWithPunctuation.length <= targetLength - 10) { // 여유분 10자
      result += (result ? ' ' : '') + sentenceWithPunctuation;
      currentLength = result.length;
    } else {
      break;
    }
  }
  
  // 7. 목표 길이보다 짧으면 핵심 키워드 추가
  if (result.length < targetLength - 20) {
    const remainingSpace = targetLength - result.length - 20;
    const keywordText = keywords.slice(0, 3).join(' ');
    if (keywordText.length <= remainingSpace) {
      result += ` ${keywordText}`;
    }
  }
  
  // 8. 최종 길이 조정
  if (result.length > targetLength) {
    result = result.substring(0, targetLength - 3) + '...';
  }
  
  return result.trim();
}

function extractKeywords(text) {
  const golfKeywords = ['골프', '여행', '투어', '코스', '그린', '티업', '버스핑', '고창'];
  const marketingKeywords = ['할인', '특가', '이벤트', '프로모션', '혜택', '선착순', '한정'];
  const actionKeywords = ['예약', '문의', '상담', '신청', '참여', '방문', '연락'];
  
  const allKeywords = [...golfKeywords, ...marketingKeywords, ...actionKeywords];
  const foundKeywords = allKeywords.filter(keyword => 
    text.toLowerCase().includes(keyword.toLowerCase())
  );
  
  return foundKeywords;
}

function rankSentences(sentences, keywords) {
  return sentences.map(sentence => {
    let score = 0;
    
    // 키워드 포함 점수
    keywords.forEach(keyword => {
      if (sentence.toLowerCase().includes(keyword.toLowerCase())) {
        score += 10;
      }
    });
    
    // 문장 길이 점수 (너무 짧거나 길면 감점)
    if (sentence.length < 10) score -= 5;
    if (sentence.length > 100) score -= 3;
    
    // 숫자 포함 점수 (가격, 할인율 등)
    if (/\d+/.test(sentence)) score += 5;
    
    // 물음표나 느낌표 포함 점수
    if (/[!?]/.test(sentence)) score += 3;
    
    return { sentence, score };
  })
  .sort((a, b) => b.score - a.score)
  .map(item => item.sentence);
}
