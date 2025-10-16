export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { text, channelType, messageType } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: '텍스트는 필수입니다.'
      });
    }

    // AI 텍스트 개선 로직 (실제 AI API 연동 전까지는 규칙 기반 개선)
    const improvedText = await improveTextWithAI(text, channelType, messageType);

    return res.status(200).json({
      success: true,
      improvedText,
      originalLength: text.length,
      improvedLength: improvedText.length
    });

  } catch (error) {
    console.error('텍스트 개선 오류:', error);
    return res.status(500).json({
      success: false,
      message: '텍스트 개선 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}

async function improveTextWithAI(text, channelType, messageType) {
  let improvedText = text;

  // 1. HTML 태그 제거
  improvedText = improvedText.replace(/<[^>]*>/g, '');
  
  // 2. 불필요한 공백 정리
  improvedText = improvedText.replace(/\s+/g, ' ').trim();
  
  // 3. 채널별 개선 로직
  if (channelType === 'sms') {
    improvedText = improveForSMS(improvedText, messageType);
  }

  // 4. 일반적인 개선
  improvedText = applyGeneralImprovements(improvedText);

  return improvedText;
}

function improveForSMS(text, messageType) {
  let improved = text;

  // SMS 특화 개선
  if (messageType === 'SMS' || messageType === 'SMS300') {
    // 1. 이모지 추가 (골프 관련)
    if (improved.includes('골프') && !improved.includes('⛳')) {
      improved = improved.replace(/골프/g, '⛳골프');
    }
    
    // 2. 행동 유도 문구 강화
    if (improved.includes('예약') && !improved.includes('지금')) {
      improved = improved.replace(/예약/g, '지금 예약');
    }
    
    // 3. 긴급성 표현 추가
    if (improved.includes('할인') && !improved.includes('한정')) {
      improved = improved.replace(/할인/g, '한정 할인');
    }
    
    // 4. 연락처 정보 강조
    if (improved.includes('문의') && !improved.includes('📞')) {
      improved = improved.replace(/문의/g, '📞문의');
    }
  }

  return improved;
}

function applyGeneralImprovements(text) {
  let improved = text;

  // 1. 문장 부호 정리
  improved = improved.replace(/\s*([.!?])\s*/g, '$1 ');
  improved = improved.replace(/\s+/g, ' ').trim();

  // 2. 반복되는 단어 제거
  const words = improved.split(' ');
  const uniqueWords = [];
  let lastWord = '';
  
  for (const word of words) {
    if (word !== lastWord) {
      uniqueWords.push(word);
      lastWord = word;
    }
  }
  
  improved = uniqueWords.join(' ');

  // 3. 문장 시작 대문자화
  improved = improved.replace(/(^|\.\s+)([a-z가-힣])/g, (match, prefix, char) => {
    return prefix + char.toUpperCase();
  });

  // 4. 마지막 문장에 마침표 추가
  if (!improved.endsWith('.') && !improved.endsWith('!') && !improved.endsWith('?')) {
    improved += '.';
  }

  return improved;
}
