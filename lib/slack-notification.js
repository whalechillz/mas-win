// lib/slack-notification.js
// 슬랙 알림 유틸리티 함수

/**
 * 슬랙 메시지 전송
 * @param {Object} message - 슬랙 메시지 객체
 * @param {string} webhookUrl - 슬랙 웹훅 URL (선택사항, 없으면 환경변수 사용)
 * @returns {Promise<Object>} 전송 결과
 */
export async function sendSlackNotification(message, webhookUrl = null) {
  const SLACK_WEBHOOK_URL = webhookUrl || process.env.SLACK_WEBHOOK_URL_01_MA_OP;
  
  // muziik.js와 동일한 디버깅 로그 추가
  console.log('SLACK_WEBHOOK_URL_01_MA_OP 설정 상태:', SLACK_WEBHOOK_URL ? '설정됨' : '설정되지 않음');
  console.log('=== 환경 변수 디버깅 ===');
  console.log('SLACK_WEBHOOK_URL_01_MA_OP 존재 여부:', !!SLACK_WEBHOOK_URL);
  console.log('SLACK_WEBHOOK_URL_01_MA_OP 길이:', SLACK_WEBHOOK_URL ? SLACK_WEBHOOK_URL.length : 0);
  console.log('SLACK_WEBHOOK_URL_01_MA_OP 시작 부분:', SLACK_WEBHOOK_URL ? SLACK_WEBHOOK_URL.substring(0, 20) + '...' : 'undefined');
  console.log('========================');
  
  if (!SLACK_WEBHOOK_URL) {
    throw new Error('SLACK_WEBHOOK_URL_01_MA_OP이 설정되지 않았습니다');
  }

  try {
    console.log('Slack 메시지 전송 시작...', JSON.stringify(message, null, 2));
    
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });

    console.log('Slack 응답 상태:', response.status);
    const responseText = await response.text();
    console.log('Slack 응답 내용:', responseText);
    
    if (!response.ok) {
      throw new Error(`Slack 전송 실패: ${response.status} - ${responseText}`);
    }

    console.log('✅ Slack 알림 전송 성공');
    return { success: true, status: response.status };
  } catch (error) {
    console.error('❌ 슬랙 알림 전송 에러:', error);
    throw error;
  }
}

/**
 * 카카오톡 콘텐츠 슬랙 메시지 포맷 생성
 * @param {Object} params - 콘텐츠 데이터
 * @param {string} params.date - 날짜 (YYYY-MM-DD)
 * @param {Object} params.account1Data - account1 데이터
 * @param {Object} params.account2Data - account2 데이터
 * @param {Object} params.feedData - 피드 데이터
 * @param {Object} params.calendarData - 캘린더 전체 데이터
 * @param {boolean} params.includeNotCreated - created: false인 항목도 포함할지 여부
 * @returns {Object} 슬랙 메시지 객체
 */
export function formatKakaoContentSlackMessage({ 
  date, 
  account1Data, 
  account2Data, 
  feedData, 
  calendarData,
  includeNotCreated = false 
}) {
  let slackText = `📱 *${date} 카카오톡 콘텐츠*\n━━━━━━━━━━━━━━━━━━━\n\n`;
  const attachments = [];

  // Account 1 (대표폰)
  if (account1Data && (account1Data.created || includeNotCreated)) {
    const account1Name = calendarData?.profileContent?.account1?.name || '대표폰';
    const account1Phone = calendarData?.profileContent?.account1?.account || '';
    
    let account1Content = `*📱 ${account1Name}*`;
    if (account1Phone) {
      account1Content += ` (${account1Phone})`;
    }
    account1Content += `\n\n`;
    
    // 생성 상태 표시
    if (!account1Data.created) {
      account1Content += `⚠️ *미생성 상태*\n\n`;
    }
    
    // 프로필 배경
    if (account1Data.background?.imageUrl) {
      account1Content += `*[프로필 배경 이미지]*\n\`\`\`\n${account1Data.background.imageUrl}\n\`\`\`\n\n`;
    } else {
      account1Content += `*[프로필 배경 이미지]*\n❌ 미생성\n\n`;
    }
    
    // 프로필 이미지
    if (account1Data.profile?.imageUrl) {
      account1Content += `*[프로필 이미지]*\n\`\`\`\n${account1Data.profile.imageUrl}\n\`\`\`\n\n`;
    } else {
      account1Content += `*[프로필 이미지]*\n❌ 미생성\n\n`;
    }
    
    // 프로필 문구
    if (account1Data.message) {
      account1Content += `*[프로필 문구]*\n\`${account1Data.message}\`\n\n`;
    }
    
    // 피드 이미지
    if (feedData?.account1?.imageUrl) {
      account1Content += `*[피드 이미지]*\n\`\`\`\n${feedData.account1.imageUrl}\n\`\`\`\n\n`;
    }
    
    // 피드 문구
    if (feedData?.account1?.caption) {
      account1Content += `*[피드 문구]*\n\`${feedData.account1.caption}\`\n\n`;
    }
    
    // 피드 URL
    if (feedData?.account1?.url) {
      account1Content += `*[피드 URL]*\n${feedData.account1.url}`;
    }
    
    attachments.push({
      color: account1Data.created ? '#FFD700' : '#FFA500', // 골드 또는 오렌지
      text: account1Content,
      footer: '복사해서 카카오톡에 붙여넣기',
      ts: Math.floor(Date.now() / 1000)
    });
  }
  
  // Account 2 (업무폰)
  if (account2Data && (account2Data.created || includeNotCreated)) {
    const account2Name = calendarData?.profileContent?.account2?.name || '업무폰';
    const account2Phone = calendarData?.profileContent?.account2?.account || '';
    
    let account2Content = `*📱 ${account2Name}*`;
    if (account2Phone) {
      account2Content += ` (${account2Phone})`;
    }
    account2Content += `\n\n`;
    
    // 생성 상태 표시
    if (!account2Data.created) {
      account2Content += `⚠️ *미생성 상태*\n\n`;
    }
    
    // 프로필 배경
    if (account2Data.background?.imageUrl) {
      account2Content += `*[프로필 배경 이미지]*\n\`\`\`\n${account2Data.background.imageUrl}\n\`\`\`\n\n`;
    } else {
      account2Content += `*[프로필 배경 이미지]*\n❌ 미생성\n\n`;
    }
    
    // 프로필 이미지
    if (account2Data.profile?.imageUrl) {
      account2Content += `*[프로필 이미지]*\n\`\`\`\n${account2Data.profile.imageUrl}\n\`\`\`\n\n`;
    } else {
      account2Content += `*[프로필 이미지]*\n❌ 미생성\n\n`;
    }
    
    // 프로필 문구
    if (account2Data.message) {
      account2Content += `*[프로필 문구]*\n\`${account2Data.message}\`\n\n`;
    }
    
    // 피드 이미지
    if (feedData?.account2?.imageUrl) {
      account2Content += `*[피드 이미지]*\n\`\`\`\n${feedData.account2.imageUrl}\n\`\`\`\n\n`;
    }
    
    // 피드 문구
    if (feedData?.account2?.caption) {
      account2Content += `*[피드 문구]*\n\`${feedData.account2.caption}\`\n\n`;
    }
    
    // 피드 URL
    if (feedData?.account2?.url) {
      account2Content += `*[피드 URL]*\n${feedData.account2.url}`;
    }
    
    attachments.push({
      color: account2Data.created ? '#000000' : '#666666', // 블랙 또는 회색
      text: account2Content,
      footer: '복사해서 카카오톡에 붙여넣기',
      ts: Math.floor(Date.now() / 1000)
    });
  }
  
  // 콘텐츠가 없으면 메시지
  if (attachments.length === 0) {
    slackText += `❌ ${date} 생성된 콘텐츠가 없습니다.`;
  }
  
  return {
    username: '카카오톡 콘텐츠 알림봇',
    icon_emoji: ':kakao:',
    text: slackText,
    attachments: attachments
  };
}

