// pages/api/contact/muziik.js
// Next.js API route handler
const nodemailer = require('nodemailer');

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // JSON 데이터 파싱
    const { type, language, name, email, phone, company, businessNumber, inquiryType, message, quantity } = req.body;

    // 필수 필드 검증
    if (!name || !email || !message) {
      console.error('필수 필드 누락:', { name: !!name, email: !!email, message: !!message });
      return res.status(400).json({ 
        error: '필수 필드가 누락되었습니다.',
        missing: { name: !name, email: !email, message: !message }
      });
    }

    console.log('=== MUZIIK 문의 접수 ===');
    console.log('문의 유형:', type);
    console.log('언어:', language);
    console.log('이름:', name);
    console.log('이메일:', email);
    console.log('전화번호:', phone);
    console.log('회사명:', company);
    console.log('사업자번호:', businessNumber);
    console.log('문의 유형:', inquiryType);
    console.log('문의 내용:', message);
    console.log('수량:', quantity);
    console.log('========================');

    // Gmail App Password 확인
    console.log('Gmail App Password 설정 상태:', process.env.GMAIL_APP_PASSWORD ? '설정됨' : '설정되지 않음');
    console.log('SLACK_WEBHOOK_URL_01_MA_OP 설정 상태:', process.env.SLACK_WEBHOOK_URL_01_MA_OP ? '설정됨' : '설정되지 않음');
    
    // Slack 알림 발송 (새로운 01-ma-op 채널 웹훅 사용)
    const SLACK_WEBHOOK_URL_01_MA_OP = process.env.SLACK_WEBHOOK_URL_01_MA_OP;
    
    console.log('=== 환경 변수 디버깅 ===');
    console.log('SLACK_WEBHOOK_URL_01_MA_OP 존재 여부:', !!SLACK_WEBHOOK_URL_01_MA_OP);
    console.log('SLACK_WEBHOOK_URL_01_MA_OP 길이:', SLACK_WEBHOOK_URL_01_MA_OP ? SLACK_WEBHOOK_URL_01_MA_OP.length : 0);
    console.log('SLACK_WEBHOOK_URL_01_MA_OP 시작 부분:', SLACK_WEBHOOK_URL_01_MA_OP ? SLACK_WEBHOOK_URL_01_MA_OP.substring(0, 20) + '...' : 'undefined');
    console.log('========================');
    
    if (SLACK_WEBHOOK_URL_01_MA_OP) {
      console.log('Slack 웹훅 URL 확인됨, 메시지 생성 시작...');
      try {
        const slackMessage = {
          username: 'MUZIIK 문의봇',
          icon_emoji: ':golf:',
          text: `🚨 새로운 MUZIIK 문의 접수 - ${name}`,
          attachments: [
            {
              color: '#36a64f',
              title: `📋 ${type === 'general' ? '일반 문의' : type === 'partnership' ? '파트너십 문의' : '마쓰구 콜라보 문의'}`,
              title_link: 'https://muziik.masgolf.co.kr/contact',
              fields: [
                {
                  title: '문의 유형',
                  value: type === 'general' ? '일반 문의' : type === 'partnership' ? '파트너십 문의' : '마쓰구 콜라보 문의',
                  short: true
                },
                {
                  title: '이름',
                  value: name,
                  short: true
                },
                {
                  title: '이메일',
                  value: email,
                  short: true
                },
                {
                  title: '전화번호',
                  value: phone || '없음',
                  short: true
                },
                {
                  title: '문의 분류',
                  value: inquiryType || '없음',
                  short: true
                },
                {
                  title: '회사명',
                  value: company || '없음',
                  short: true
                },
                {
                  title: '문의 내용',
                  value: message ? (message.length > 200 ? message.substring(0, 200) + '...' : message) : '내용 없음',
                  short: false
                }
              ],
              footer: 'MUZIIK DOGATTI GENERATION 샤프트 문의 시스템',
              ts: Math.floor(Date.now() / 1000)
            }
          ]
        };
        
        console.log('Slack 메시지 전송 시작...', JSON.stringify(slackMessage, null, 2));
        
        const response = await fetch(SLACK_WEBHOOK_URL_01_MA_OP, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slackMessage)
        });
        
        console.log('Slack 응답 상태:', response.status);
        const responseText = await response.text();
        console.log('Slack 응답 내용:', responseText);
        
        if (!response.ok) {
          throw new Error(`Slack API error: ${response.status} - ${responseText}`);
        }
        
        console.log('Slack 알림 발송 완료');
      } catch (error) {
        console.error('Slack 알림 발송 실패:', error);
      }
    } else {
      console.log('SLACK_WEBHOOK_URL_01_MA_OP이 설정되지 않음');
      
      // 대안: 기존 SLACK_WEBHOOK_URL 사용
      const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
      if (SLACK_WEBHOOK_URL) {
        console.log('대안 Slack 웹훅 사용:', SLACK_WEBHOOK_URL.substring(0, 20) + '...');
        
        try {
          const fallbackMessage = {
            username: 'MUZIIK 문의봇',
            icon_emoji: ':golf:',
            text: `🚨 새로운 MUZIIK 문의 접수 - ${name}`,
            attachments: [
              {
                color: '#36a64f',
                title: `📋 ${type === 'general' ? '일반 문의' : type === 'partnership' ? '파트너십 문의' : '마쓰구 콜라보 문의'}`,
                fields: [
                  {
                    title: '이름',
                    value: name,
                    short: true
                  },
                  {
                    title: '이메일',
                    value: email,
                    short: true
                  },
                  {
                    title: '문의 내용',
                    value: message ? (message.length > 200 ? message.substring(0, 200) + '...' : message) : '내용 없음',
                    short: false
                  }
                ],
                footer: 'MUZIIK DOGATTI GENERATION 샤프트 문의 시스템',
                ts: Math.floor(Date.now() / 1000)
              }
            ]
          };
          
          const response = await fetch(SLACK_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fallbackMessage)
          });
          
          console.log('대안 Slack 응답 상태:', response.status);
          if (response.ok) {
            console.log('대안 Slack 알림 발송 완료');
          } else {
            console.log('대안 Slack 알림 발송 실패');
          }
        } catch (error) {
          console.error('대안 Slack 알림 발송 실패:', error);
        }
      } else {
        console.log('대안 Slack 웹훅도 설정되지 않음');
      }
    }
    
    // 슬랙 알림만 발송하고 성공 응답
    return res.status(200).json({ 
      success: true, 
      message: language === 'ja' ? 'お問い合わせを受け付けました' : '문의가 접수되었습니다' 
    });

  } catch (error) {
    console.error('MUZIIK 문의 처리 오류:', error);
    res.status(500).json({ 
      success: false, 
      message: language === 'ja' ? '送信に失敗しました。しばらくしてからもう一度お試しください。' : '전송에 실패했습니다. 잠시 후 다시 시도해주세요。' 
    });
  }
}
