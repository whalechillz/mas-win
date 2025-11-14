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
 * 카카오톡 콘텐츠 슬랙 메시지 포맷 생성 (Block Kit 형식)
 * 각 단락을 별도 섹션으로 분리하여 모바일에서 선택하기 쉽게 함
 * @param {Object} params - 콘텐츠 데이터
 * @param {string} params.date - 날짜 (YYYY-MM-DD)
 * @param {Object} params.account1Data - account1 데이터
 * @param {Object} params.account2Data - account2 데이터
 * @param {Object} params.feedData - 피드 데이터
 * @param {Object} params.calendarData - 캘린더 전체 데이터
 * @param {boolean} params.includeNotCreated - created: false인 항목도 포함할지 여부
 * @returns {Object} 슬랙 메시지 객체 (Block Kit 형식)
 */
export function formatKakaoContentSlackMessage({ 
  date, 
  account1Data, 
  account2Data, 
  feedData, 
  calendarData,
  includeNotCreated = false 
}) {
  const blocks = [];
  
  // 헤더
  blocks.push({
    type: 'header',
    text: {
      type: 'plain_text',
      text: `📱 ${date} 카카오톡 콘텐츠`,
      emoji: true
    }
  });
  
  blocks.push({ type: 'divider' });

  // Account 1 (대표폰) 블록 생성
  if (account1Data && (account1Data.created || includeNotCreated)) {
    const account1Name = calendarData?.profileContent?.account1?.name || '대표폰';
    const account1Phone = calendarData?.profileContent?.account1?.account || '';
    
    // 계정 헤더
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*📱 ${account1Name}${account1Phone ? ` (${account1Phone})` : ''}*${!account1Data.created ? ' ⚠️ *미생성 상태*' : ''}`
      }
    });
    
    // 프로필 배경 이미지
    if (account1Data.background?.imageUrl) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*[프로필 배경 이미지]*'
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '🌐 브라우저에서 열기',
            emoji: true
          },
          url: account1Data.background.imageUrl,
          style: 'primary'
        }
      });
      // URL 텍스트 (복사용)
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `\`\`\`\n${account1Data.background.imageUrl}\n\`\`\``
        }
      });
    } else {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*[프로필 배경 이미지]*\n❌ 미생성'
        }
      });
    }
    
    // 프로필 이미지
    if (account1Data.profile?.imageUrl) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*[프로필 이미지]*'
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '🌐 브라우저에서 열기',
            emoji: true
          },
          url: account1Data.profile.imageUrl,
          style: 'primary'
        }
      });
      // URL 텍스트 (복사용)
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `\`\`\`\n${account1Data.profile.imageUrl}\n\`\`\``
        }
      });
    } else {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*[프로필 이미지]*\n❌ 미생성'
        }
      });
    }
    
    // 프로필 문구
    if (account1Data.message) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*[프로필 문구]*'
        }
      });
      // plain_text 섹션 (선택하기 쉽게)
      blocks.push({
        type: 'section',
        text: {
          type: 'plain_text',
          text: account1Data.message
        }
      });
      // 코드 블록 (복사용)
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `\`\`\`\n${account1Data.message}\n\`\`\``
        }
      });
    }
    
    // 피드 이미지
    if (feedData?.account1?.imageUrl) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*[피드 이미지]*'
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '🌐 브라우저에서 열기',
            emoji: true
          },
          url: feedData.account1.imageUrl,
          style: 'primary'
        }
      });
      // URL 텍스트 (복사용)
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `\`\`\`\n${feedData.account1.imageUrl}\n\`\`\``
        }
      });
    }
    
    // 피드 문구
    if (feedData?.account1?.caption) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*[피드 문구]*'
        }
      });
      // plain_text 섹션 (선택하기 쉽게)
      blocks.push({
        type: 'section',
        text: {
          type: 'plain_text',
          text: feedData.account1.caption
        }
      });
      // 코드 블록 (복사용)
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `\`\`\`\n${feedData.account1.caption}\n\`\`\``
        }
      });
    }
    
    // 피드 URL
    if (feedData?.account1?.url) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*[피드 URL]*'
        }
      });
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: feedData.account1.url
        }
      });
    }
    
    blocks.push({ type: 'divider' });
  }
  
  // Account 2 (업무폰) 블록 생성
  if (account2Data && (account2Data.created || includeNotCreated)) {
    const account2Name = calendarData?.profileContent?.account2?.name || '업무폰';
    const account2Phone = calendarData?.profileContent?.account2?.account || '';
    
    // 계정 헤더
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*📱 ${account2Name}${account2Phone ? ` (${account2Phone})` : ''}*${!account2Data.created ? ' ⚠️ *미생성 상태*' : ''}`
      }
    });
    
    // 프로필 배경 이미지
    if (account2Data.background?.imageUrl) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*[프로필 배경 이미지]*'
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '🌐 브라우저에서 열기',
            emoji: true
          },
          url: account2Data.background.imageUrl,
          style: 'primary'
        }
      });
      // URL 텍스트 (복사용)
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `\`\`\`\n${account2Data.background.imageUrl}\n\`\`\``
        }
      });
    } else {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*[프로필 배경 이미지]*\n❌ 미생성'
        }
      });
    }
    
    // 프로필 이미지
    if (account2Data.profile?.imageUrl) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*[프로필 이미지]*'
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '🌐 브라우저에서 열기',
            emoji: true
          },
          url: account2Data.profile.imageUrl,
          style: 'primary'
        }
      });
      // URL 텍스트 (복사용)
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `\`\`\`\n${account2Data.profile.imageUrl}\n\`\`\``
        }
      });
    } else {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*[프로필 이미지]*\n❌ 미생성'
        }
      });
    }
    
    // 프로필 문구
    if (account2Data.message) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*[프로필 문구]*'
        }
      });
      // plain_text 섹션 (선택하기 쉽게)
      blocks.push({
        type: 'section',
        text: {
          type: 'plain_text',
          text: account2Data.message
        }
      });
      // 코드 블록 (복사용)
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `\`\`\`\n${account2Data.message}\n\`\`\``
        }
      });
    }
    
    // 피드 이미지
    if (feedData?.account2?.imageUrl) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*[피드 이미지]*'
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '🌐 브라우저에서 열기',
            emoji: true
          },
          url: feedData.account2.imageUrl,
          style: 'primary'
        }
      });
      // URL 텍스트 (복사용)
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `\`\`\`\n${feedData.account2.imageUrl}\n\`\`\``
        }
      });
    }
    
    // 피드 문구
    if (feedData?.account2?.caption) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*[피드 문구]*'
        }
      });
      // plain_text 섹션 (선택하기 쉽게)
      blocks.push({
        type: 'section',
        text: {
          type: 'plain_text',
          text: feedData.account2.caption
        }
      });
      // 코드 블록 (복사용)
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `\`\`\`\n${feedData.account2.caption}\n\`\`\``
        }
      });
    }
    
    // 피드 URL
    if (feedData?.account2?.url) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*[피드 URL]*'
        }
      });
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: feedData.account2.url
        }
      });
    }
  }
  
  // 콘텐츠가 없으면 메시지
  if (blocks.length <= 2) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `❌ ${date} 생성된 콘텐츠가 없습니다.`
      }
    });
  }
  
  // 푸터
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: '💡 *이미지*: 🌐 버튼 클릭 → 브라우저에서 열기 → 우클릭 → 다른 이름으로 저장\n💡 *텍스트*: plain_text 섹션을 길게 눌러 전체 선택 후 복사'
      }
    ]
  });
  
  return {
    username: '카카오톡 콘텐츠 알림봇',
    icon_emoji: ':kakao:',
    text: `📱 ${date} 카카오톡 콘텐츠`,
    blocks: blocks
  };
}

