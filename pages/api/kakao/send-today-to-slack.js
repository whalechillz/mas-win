// pages/api/kakao/send-today-to-slack.js
// 오늘 날짜의 카카오톡 메시지를 마스골프와 마스텍 슬랙으로 전송하는 API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 슬랙 메시지 전송 함수
async function sendToSlack(webhookUrl, message) {
  if (!webhookUrl) {
    console.warn('⚠️ 슬랙 웹훅 URL이 설정되지 않았습니다.');
    return { success: false, error: '웹훅 URL이 설정되지 않았습니다.' };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(`Slack 전송 실패: ${response.status} - ${responseText}`);
    }

    return { success: true, status: response.status };
  } catch (error) {
    console.error('❌ 슬랙 전송 에러:', error);
    return { success: false, error: error.message };
  }
}

// 카카오톡 메시지를 슬랙 메시지 형식으로 변환
function formatKakaoMessageForSlack(kakaoMessages) {
  const blocks = [];

  // 헤더
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  blocks.push({
    type: 'header',
    text: {
      type: 'plain_text',
      text: `📱 ${todayStr} 카카오톡 메시지`,
      emoji: true
    }
  });

  blocks.push({ type: 'divider' });

  if (!kakaoMessages || kakaoMessages.length === 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `❌ ${todayStr} 생성된 카카오톡 메시지가 없습니다.`
      }
    });
  } else {
    kakaoMessages.forEach((msg, index) => {
      // 메시지 헤더
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*📱 메시지 #${msg.id}* ${msg.status === 'sent' ? '✅ 발송됨' : msg.status === 'draft' ? '📝 초안' : msg.status === 'scheduled' ? '⏰ 예약됨' : '❌ 실패'}`
        }
      });

      // 제목
      if (msg.title) {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*제목:*\n${msg.title}`
          }
        });
      }

      // 내용
      if (msg.content) {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*내용:*`
          }
        });
        // plain_text 섹션 (선택하기 쉽게)
        blocks.push({
          type: 'section',
          text: {
            type: 'plain_text',
            text: msg.content
          }
        });
        // 코드 블록 (복사용)
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `\`\`\`\n${msg.content}\n\`\`\``
          }
        });
      }

      // 메시지 타입
      if (msg.message_type) {
        const messageTypeText = msg.message_type === 'ALIMTALK' ? '알림톡' : 
                                msg.message_type === 'FRIENDTALK' ? '친구톡' : 
                                msg.message_type;
        blocks.push({
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*메시지 타입:*\n${messageTypeText}`
            },
            {
              type: 'mrkdwn',
              text: `*상태:*\n${msg.status === 'sent' ? '✅ 발송됨' : msg.status === 'draft' ? '📝 초안' : msg.status === 'scheduled' ? '⏰ 예약됨' : '❌ 실패'}`
            }
          ]
        });
      }

      // 버튼 정보
      if (msg.button_text && msg.button_link) {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*버튼:* ${msg.button_text}\n*링크:* ${msg.button_link}`
          }
        });
      }

      // 수신자 수
      if (msg.recipient_uuids && Array.isArray(msg.recipient_uuids)) {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*수신자 수:* ${msg.recipient_uuids.length}명`
          }
        });
      }

      // 생성 시간
      if (msg.created_at) {
        const createdDate = new Date(msg.created_at);
        const createdStr = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}-${String(createdDate.getDate()).padStart(2, '0')} ${String(createdDate.getHours()).padStart(2, '0')}:${String(createdDate.getMinutes()).padStart(2, '0')}`;
        blocks.push({
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `생성일: ${createdStr}`
            }
          ]
        });
      }

      // 마지막 메시지가 아니면 구분선 추가
      if (index < kakaoMessages.length - 1) {
        blocks.push({ type: 'divider' });
      }
    });
  }

  // 푸터
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: '💡 *텍스트*: plain_text 섹션을 길게 눌러 전체 선택 후 복사'
      }
    ]
  });

  return {
    username: '카카오톡 메시지 알림봇',
    icon_emoji: ':kakao:',
    text: `📱 ${todayStr} 카카오톡 메시지`,
    blocks: blocks
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 오늘 날짜 계산 (KST 기준)
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000; // UTC+9
    const kstDate = new Date(now.getTime() + kstOffset);
    const todayStr = `${kstDate.getUTCFullYear()}-${String(kstDate.getUTCMonth() + 1).padStart(2, '0')}-${String(kstDate.getUTCDate()).padStart(2, '0')}`;
    
    console.log(`📅 오늘 날짜 (KST): ${todayStr}`);

    // 오늘 날짜에 생성된 카카오톡 메시지 조회
    const startOfDay = `${todayStr}T00:00:00.000Z`;
    const endOfDay = `${todayStr}T23:59:59.999Z`;

    const { data: kakaoMessages, error: fetchError } = await supabase
      .from('channel_kakao')
      .select('*')
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ 카카오톡 메시지 조회 오류:', fetchError);
      return res.status(500).json({
        success: false,
        message: '카카오톡 메시지 조회 실패',
        error: fetchError.message
      });
    }

    console.log(`📱 조회된 메시지 수: ${kakaoMessages?.length || 0}건`);

    // 슬랙 메시지 포맷 생성
    const slackMessage = formatKakaoMessageForSlack(kakaoMessages || []);

    // 마스골프와 마스텍 슬랙으로 전송
    const masgolfWebhook = process.env.SLACK_WEBHOOK_URL_MASGOLF;
    const mastechWebhook = process.env.SLACK_WEBHOOK_URL_MASTECH;

    const results = {
      masgolf: { success: false, error: null },
      mastech: { success: false, error: null }
    };

    // 마스골프 슬랙으로 전송
    if (masgolfWebhook) {
      console.log('📤 마스골프 슬랙으로 전송 중...');
      const masgolfResult = await sendToSlack(masgolfWebhook, slackMessage);
      results.masgolf = masgolfResult;
      if (masgolfResult.success) {
        console.log('✅ 마스골프 슬랙 전송 성공');
      } else {
        console.error('❌ 마스골프 슬랙 전송 실패:', masgolfResult.error);
      }
    } else {
      console.warn('⚠️ SLACK_WEBHOOK_URL_MASGOLF가 설정되지 않았습니다.');
      results.masgolf.error = '웹훅 URL이 설정되지 않았습니다.';
    }

    // 마스텍 슬랙으로 전송
    if (mastechWebhook) {
      console.log('📤 마스텍 슬랙으로 전송 중...');
      const mastechResult = await sendToSlack(mastechWebhook, slackMessage);
      results.mastech = mastechResult;
      if (mastechResult.success) {
        console.log('✅ 마스텍 슬랙 전송 성공');
      } else {
        console.error('❌ 마스텍 슬랙 전송 실패:', mastechResult.error);
      }
    } else {
      console.warn('⚠️ SLACK_WEBHOOK_URL_MASTECH가 설정되지 않았습니다.');
      results.mastech.error = '웹훅 URL이 설정되지 않았습니다.';
    }

    return res.status(200).json({
      success: true,
      date: todayStr,
      messageCount: kakaoMessages?.length || 0,
      results: results
    });

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    return res.status(500).json({
      success: false,
      message: '카카오톡 메시지 슬랙 전송 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}

