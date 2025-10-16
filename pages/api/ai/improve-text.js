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
  
  // 2. 불필요한 공백 정리 (줄바꿈 유지)
  improvedText = improvedText.replace(/[ \t]+/g, ' ').trim(); // 탭과 연속된 공백만 하나로 (줄바꿈은 유지)
  
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

  // SMS 특화 개선 (기존 메시지 패턴 반영)
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

  // 5. 기존 메시지 패턴 반영 - 가독성 향상
  improved = addVisualSeparators(improved);
  improved = addUrgencyExpressions(improved);
  improved = addCallToAction(improved, messageType);

  return improved;
}

// 새로운 함수: 시각적 구분자 추가 (기존 메시지 패턴 반영)
function addVisualSeparators(text) {
  let improved = text;
  
  // 중요한 정보 앞에 구분자 추가
  improved = improved.replace(/(\d{3}-\d{3,4}-\d{4})/g, '☎ $1');
  improved = improved.replace(/(최저가|특가|할인)/g, '▶$1');
  improved = improved.replace(/(선착순|한정|이벤트)/g, '※$1');
  
  return improved;
}

// 새로운 함수: 긴급성 표현 추가 (기존 메시지 패턴 반영)
function addUrgencyExpressions(text) {
  let improved = text;
  
  // 기존 패턴 반영
  improved = improved.replace(/지금/g, '지금');
  improved = improved.replace(/바로/g, '바로');
  improved = improved.replace(/서두르세요/g, '서두르세요!');
  
  // 추가 긴급성 표현
  if (!improved.includes('지금') && !improved.includes('바로')) {
    improved = improved.replace(/전화/g, '지금 전화');
  }
  
  return improved;
}

// 새로운 함수: 강력한 CTA 추가 (기존 메시지 패턴 반영)
function addCallToAction(text, messageType) {
  let improved = text;
  
  // 기존 패턴 반영
  if (improved.includes('☎') && !improved.includes('지금 바로 전화')) {
    improved += '\n\n→ 지금 바로 전화주세요!';
  }
  
  return improved;
}

function applyGeneralImprovements(text) {
  let improved = text;

  // 1. 문장 부호 정리 (줄바꿈 유지)
  improved = improved.replace(/\s*([.!?])\s*/g, '$1 ');
  improved = improved.replace(/[ \t]+/g, ' ').trim(); // 줄바꿈은 유지

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

  // 5. 기존 메시지 패턴 반영 - 가독성 향상
  improved = addLineBreaksForReadability(improved);

  return improved;
}

// 새로운 함수: 가독성을 위한 줄바꿈 추가 (기존 메시지 패턴 반영)
function addLineBreaksForReadability(text) {
  let improved = text;
  
  // 중요한 정보 전후에 줄바꿈 추가
  improved = improved.replace(/(☎ \d{3}-\d{3,4}-\d{4})/g, '\n$1');
  improved = improved.replace(/(▶[^\\n]+)/g, '\n$1');
  improved = improved.replace(/(※[^\\n]+)/g, '\n$1');
  
  // 전화 유도 문구 전에 줄바꿈 추가
  improved = improved.replace(/(→ 지금 바로 전화)/g, '\n\n$1');
  
  return improved;
}
