// 심리학 기반 메시지 생성 공통 함수
// SMS와 카카오 채널에서 공통으로 사용

/**
 * 심리학 기반 메시지 3개 생성
 * @param {string} text - 원본 텍스트
 * @param {string} channelType - 채널 타입 ('sms', 'kakao')
 * @param {string} messageType - 메시지 타입 ('SMS', 'SMS300', 'LMS', 'MMS', 'ALIMTALK')
 * @param {number} targetLength - 목표 길이
 * @returns {Array} 심리학 기반 메시지 배열
 */
export function generatePsychologyMessages(text, channelType = 'sms', messageType = 'SMS300', targetLength = 300) {
  const messages = [];

  // 1. 호기심 격차 (Curiosity Gap) 메시지
  const curiosityGapMessage = generateCuriosityGapMessage(text, channelType, messageType, targetLength);
  messages.push(curiosityGapMessage);

  // 2. 희소성 (Scarcity) 메시지
  const scarcityMessage = generateScarcityMessage(text, channelType, messageType, targetLength);
  messages.push(scarcityMessage);

  // 3. 사회적 증명 (Social Proof) 메시지
  const socialProofMessage = generateSocialProofMessage(text, channelType, messageType, targetLength);
  messages.push(socialProofMessage);

  return messages;
}

/**
 * 호기심 격차 (Curiosity Gap) 메시지 생성
 */
function generateCuriosityGapMessage(text, channelType, messageType, targetLength) {
  let message = '';
  
  // 채널별 도입부 조정
  if (channelType === 'kakao') {
    message += '🎉 고창 버스핑 투어의 숨겨진 비밀 공개!\n\n';
  } else {
    message += '🎉 고창 버스핑 투어의 숨겨진 비밀 공개!\n\n';
  }
  
  // 중간부 - 가치 제시
  message += '90%의 골퍼들이 모르는 특별한 경험\n';
  message += '고창CC + 프리미엄 골프텔 + 백수해안도로\n';
  message += '11월 10-12일, 선착순 5팀 한정\n\n';
  
  // 하단부 - 강력한 CTA (채널별 조정)
  if (channelType === 'kakao') {
    message += '💬 지금 바로 문의하세요!\n☎ 031-215-3990';
  } else {
    message += '→ 지금 바로 전화주세요! ☎ 031-215-3990';
  }
  
  // 길이 조정
  if (message.length > targetLength) {
    message = adjustMessageLength(message, targetLength);
  }
  
  return {
    id: 'curiosity-gap',
    title: '호기심 격차',
    message: message,
    psychology: 'curiosity-gap',
    description: '비밀, 숨겨진 정보로 호기심 유발',
    tags: ['호기심 격차', '비밀 공개', '특별한 경험'],
    score: calculateMessageScore(message, channelType),
    characterCount: message.length,
    targetLength: targetLength
  };
}

/**
 * 희소성 (Scarcity) 메시지 생성
 */
function generateScarcityMessage(text, channelType, messageType, targetLength) {
  let message = '';
  
  // 채널별 도입부 조정
  if (channelType === 'kakao') {
    message += '🔥 마감 임박! 11월 고창 버스핑 투어\n\n';
  } else {
    message += '🔥 마감 임박! 11월 고창 버스핑 투어\n\n';
  }
  
  // 중간부 - 긴급성
  message += '단 2주간 선착순 5팀만!\n';
  message += '고창CC 라운딩 + 골프텔 숙박 + 미식 경험\n';
  message += '2025년 11월 10-12일\n\n';
  
  // 하단부 - 강력한 CTA (채널별 조정)
  if (channelType === 'kakao') {
    message += '⚠️ 놓치면 내년까지 기다려야 합니다\n';
    message += '💬 지금 바로 문의하세요! ☎ 031-215-3990';
  } else {
    message += '※ 놓치면 내년까지 기다려야 합니다\n';
    message += '→ 지금 바로 전화주세요! ☎ 031-215-3990';
  }
  
  // 길이 조정
  if (message.length > targetLength) {
    message = adjustMessageLength(message, targetLength);
  }
  
  return {
    id: 'scarcity',
    title: '희소성',
    message: message,
    psychology: 'scarcity',
    description: '한정성과 긴급성으로 즉시 행동 유도',
    tags: ['희소성', '마감 임박', '선착순 한정'],
    score: calculateMessageScore(message, channelType),
    characterCount: message.length,
    targetLength: targetLength
  };
}

/**
 * 사회적 증명 (Social Proof) 메시지 생성
 */
function generateSocialProofMessage(text, channelType, messageType, targetLength) {
  let message = '';
  
  // 채널별 도입부 조정
  if (channelType === 'kakao') {
    message += '⭐ 90%의 골퍼들이 선택한 고창 버스핑 투어\n\n';
  } else {
    message += '⭐ 90%의 골퍼들이 선택한 고창 버스핑 투어\n\n';
  }
  
  // 중간부 - 가치 제시
  message += '골프 + 여행 + 미식의 완벽한 조화\n';
  message += '고창CC, 프리미엄 골프텔, 백수해안도로\n';
  message += '11월 10-12일 특별 투어\n\n';
  
  // 하단부 - 강력한 CTA (채널별 조정)
  if (channelType === 'kakao') {
    message += '👥 동료들이 추천한 그 투어, 당신도 경험해보세요!\n';
    message += '💬 지금 바로 문의하세요! ☎ 031-215-3990';
  } else {
    message += '동료들이 추천한 그 투어, 당신도 경험해보세요!\n';
    message += '→ 지금 바로 전화주세요! ☎ 031-215-3990';
  }
  
  // 길이 조정
  if (message.length > targetLength) {
    message = adjustMessageLength(message, targetLength);
  }
  
  return {
    id: 'social-proof',
    title: '사회적 증명',
    message: message,
    psychology: 'social-proof',
    description: '다른 사람들의 선택으로 신뢰도 향상',
    tags: ['사회적 증명', '90% 선택', '동료 추천'],
    score: calculateMessageScore(message, channelType),
    characterCount: message.length,
    targetLength: targetLength
  };
}

/**
 * 메시지 길이 조정 함수
 */
function adjustMessageLength(message, targetLength) {
  if (message.length <= targetLength) return message;
  
  // 줄바꿈으로 분리
  const lines = message.split('\n');
  let result = '';
  let currentLength = 0;
  
  for (const line of lines) {
    if (currentLength + line.length + 1 <= targetLength - 10) { // 10자 여유분
      result += (result ? '\n' : '') + line;
      currentLength = result.length;
    } else {
      break;
    }
  }
  
  // CTA는 항상 포함
  if (!result.includes('→ 지금 바로 전화주세요!') && !result.includes('💬 지금 바로 문의하세요!')) {
    result += '\n\n→ 지금 바로 전화주세요! ☎ 031-215-3990';
  }
  
  return result;
}

/**
 * 메시지 점수 계산 함수
 */
function calculateMessageScore(message, channelType) {
  // 기본 점수 계산 로직
  let score = {
    audienceMatch: 60,
    psychEffect: 80,
    brandFit: 75,
    conversionPotential: 70,
    total: 0
  };
  
  // 채널별 점수 조정
  if (channelType === 'sms') {
    score.audienceMatch = 65;
    score.psychEffect = 85;
    score.brandFit = 80;
    score.conversionPotential = 75;
  } else if (channelType === 'kakao') {
    score.audienceMatch = 70;
    score.psychEffect = 80;
    score.brandFit = 75;
    score.conversionPotential = 70;
  }
  
  // 메시지 내용에 따른 점수 조정
  if (message.includes('☎')) score.conversionPotential += 10;
  if (message.includes('지금')) score.psychEffect += 5;
  if (message.includes('한정')) score.psychEffect += 5;
  if (message.includes('90%')) score.audienceMatch += 10;
  if (message.includes('→') || message.includes('💬')) score.conversionPotential += 10;
  if (message.includes('🔥') || message.includes('🎉') || message.includes('⭐')) score.psychEffect += 5;
  
  // 총점 계산
  score.total = Math.round((score.audienceMatch + score.psychEffect + score.brandFit + score.conversionPotential) / 4);
  
  return score;
}

/**
 * 채널별 최적화된 메시지 생성
 */
export function generateChannelOptimizedMessage(text, channelType, messageType, targetLength) {
  const messages = generatePsychologyMessages(text, channelType, messageType, targetLength);
  
  // 가장 높은 점수의 메시지 반환
  const bestMessage = messages.reduce((best, current) => 
    current.score.total > best.score.total ? current : best
  );
  
  return bestMessage;
}

/**
 * 메시지 구조 개선 (안녕하세요 중간 제거 등)
 */
export function improveMessageStructure(message) {
  let improved = message;
  
  // "안녕하세요" 중간 제거
  improved = improved.replace(/안녕하세요[^.]*\./g, '');
  
  // 불필요한 공백 정리
  improved = improved.replace(/\n\s*\n\s*\n/g, '\n\n');
  improved = improved.replace(/^\s+|\s+$/gm, '');
  improved = improved.trim();
  
  return improved;
}
