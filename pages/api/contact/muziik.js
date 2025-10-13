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
    const { type, language, name, email, phone, company, businessNumber, inquiryType, message, quantity } = req.body;

    console.log('MUZIIK 문의 접수:', {
      type, language, name, email, phone, company, businessNumber, inquiryType, message, quantity
    });

    // Gmail App Password 확인
    console.log('Gmail App Password 설정 상태:', process.env.GMAIL_APP_PASSWORD ? '설정됨' : '설정되지 않음');
    console.log('SLACK_WEBHOOK_URL_01_MA_OP 설정 상태:', process.env.SLACK_WEBHOOK_URL_01_MA_OP ? '설정됨' : '설정되지 않음');
    
    // 임시로 이메일 발송 없이 로그만 기록
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
    
    // Slack 알림 발송 (새로운 01-ma-op 채널 웹훅 사용)
    const SLACK_WEBHOOK_URL_01_MA_OP = process.env.SLACK_WEBHOOK_URL_01_MA_OP;
    
    if (SLACK_WEBHOOK_URL_01_MA_OP) {
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
        
        const response = await fetch(SLACK_WEBHOOK_URL_01_MA_OP, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slackMessage)
        });
        
        if (!response.ok) {
          throw new Error(`Slack API error: ${response.status}`);
        }
        
        console.log('Slack 알림 발송 완료');
      } catch (error) {
        console.error('Slack 알림 발송 실패:', error);
      }
    } else {
      console.log('SLACK_WEBHOOK_URL_01_MA_OP이 설정되지 않음');
    }
    
    if (!process.env.GMAIL_APP_PASSWORD) {
      console.log('Gmail App Password가 설정되지 않음. Slack 알림만 발송.');
      
      return res.status(200).json({ 
        success: true, 
        message: language === 'ja' ? 'お問い合わせを受け付けました' : '문의가 접수되었습니다' 
      });
    }

    // 이메일 전송 로직 (Gmail App Password가 있을 때만)
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: 'massgoogolf@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // 문의 유형별 제목 설정
    const getSubject = (type, language) => {
      const subjects = {
        ja: {
          general: '[MUZIIK 문의] 일반 문의',
          partnership: '[MUZIIK 문의] 파트너십 문의',
          collaboration: '[MUZIIK 문의] 마쓰구 콜라보 문의'
        },
        ko: {
          general: '[MUZIIK 문의] 일반 문의',
          partnership: '[MUZIIK 문의] 파트너십 문의',
          collaboration: '[MUZIIK 문의] 마쓰구 콜라보 문의'
        }
      };
      return subjects[language]?.[type] || '[MUZIIK 문의]';
    };

    // 이메일 템플릿 생성
    const createEmailTemplate = (data, language) => {
      const isJapanese = language === 'ja';
      
      return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
    .header { background-color: #f4f4f4; padding: 10px; text-align: center; border-bottom: 1px solid #ddd; }
    .content { padding: 20px 0; }
    .footer { font-size: 0.9em; text-align: center; color: #777; border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; }
    .data-row { margin-bottom: 10px; }
    .data-label { font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>${isJapanese ? 'MUZIIK お問い合わせ' : 'MUZIIK 문의 접수'}</h2>
    </div>
    <div class="content">
      <p>${isJapanese ? '新しいお問い合わせが届きました。' : '새로운 문의가 접수되었습니다.'}</p>
      <div class="data-row"><span class="data-label">${isJapanese ? 'お問い合わせタイプ' : '문의 유형'}:</span> ${data.type}</div>
      <div class="data-row"><span class="data-label">${isJapanese ? '言語' : '언어'}:</span> ${data.language === 'ja' ? '日本語' : '한국어'}</div>
      <div class="data-row"><span class="data-label">${isJapanese ? '名前' : '이름'}:</span> ${data.name}</div>
      <div class="data-row"><span class="data-label">${isJapanese ? 'メール' : '이메일'}:</span> ${data.email}</div>
      ${data.phone ? `<div class="data-row"><span class="data-label">${isJapanese ? '電話番号' : '전화번호'}:</span> ${data.phone}</div>` : ''}
      ${data.company ? `<div class="data-row"><span class="data-label">${isJapanese ? '会社名' : '회사명'}:</span> ${data.company}</div>` : ''}
      ${data.businessNumber ? `<div class="data-row"><span class="data-label">${isJapanese ? '事業者登録番号' : '사업자등록번호'}:</span> ${data.businessNumber}</div>` : ''}
      ${data.inquiryType ? `<div class="data-row"><span class="data-label">${isJapanese ? '詳細お問い合わせタイプ' : '세부 문의 유형'}:</span> ${data.inquiryType}</div>` : ''}
      ${data.quantity ? `<div class="data-row"><span class="data-label">${isJapanese ? '数量' : '수량'}:</span> ${data.quantity}</div>` : ''}
      <div class="data-row"><span class="data-label">${isJapanese ? 'お問い合わせ内容' : '문의 내용'}:</span><br>${data.message}</div>
    </div>
    <div class="footer">
      <p>Email: massgoogolf@gmail.com</p>
    </div>
  </div>
</body>
</html>
      `;
    };

    // 고객용 자동 응답 이메일 템플릿
    const createAutoReplyTemplate = (data: any, language: string) => {
      const isJapanese = language === 'ja';
      return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
    .header { background-color: #f4f4f4; padding: 10px; text-align: center; border-bottom: 1px solid #ddd; }
    .content { padding: 20px 0; }
    .footer { font-size: 0.9em; text-align: center; color: #777; border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>${isJapanese ? 'お問い合わせありがとうございます' : '문의해주셔서 감사합니다'}</h2>
    </div>
    <div class="content">
      <p>${isJapanese ? `${data.name}様、` : `${data.name}님,`}</p>
      <p>${isJapanese ? 'お問い合わせいただきありがとうございます。' : '문의해주셔서 감사합니다.'}</p>
      <p>${isJapanese ? 'お問い合わせ内容を確認後、24時間以内にご返信いたします。' : '문의 내용을 확인 후 24시간 이내에 답변드리겠습니다.'}</p>
      <p>${isJapanese ? 'よろしくお願いいたします。' : '감사합니다.'}</p>
      
      <p><strong>MUZIIK DOGATTI GENERATION</strong><br>
      ${isJapanese ? '日本製プレミアムゴルフシャフト' : '일본제 프리미엄 골프 샤프트'}</p>
    </div>

    <div class="footer">
      <p>Email: massgoogolf@gmail.com</p>
      <p>${isJapanese ? 'このメールは自動送信されています。' : '이 이메일은 자동으로 발송되었습니다.'}</p>
    </div>
  </div>
</body>
</html>
      `;
    };

    // 메인 이메일 발송
    const mailOptions = {
      from: 'massgoogolf@gmail.com',
      to: 'massgoogolf@gmail.com',
      subject: `[MUZIIK 문의] ${name} - ${inquiryType}`,
      text: `
문의 유형: ${type}
이름: ${name}
이메일: ${email}
전화번호: ${phone || '없음'}
문의 유형: ${inquiryType}
문의 내용: ${message}
      `,
      html: createEmailTemplate(req.body, language),
    };

    // 고객용 자동 응답 이메일
    const autoReplyOptions = {
      from: 'massgoogolf@gmail.com',
      to: email,
      subject: language === 'ja' ? 
        '[MUZIIK] お問い合わせありがとうございます' : 
        '[MUZIIK] 문의해주셔서 감사합니다',
      html: createAutoReplyTemplate(req.body, language),
    };

        // 이메일 발송 (개선된 에러 처리)
        console.log('이메일 발송 시작...');
        console.log('Gmail App Password 상태:', process.env.GMAIL_APP_PASSWORD ? '설정됨' : '설정되지 않음');
        
        let emailSent = false;
        let autoReplySent = false;
        
        try {
          const result = await transporter.sendMail(mailOptions);
          console.log('문의 이메일 발송 완료:', result.messageId);
          emailSent = true;
        } catch (error) {
          console.error('문의 이메일 발송 실패:', error);
          console.error('에러 상세:', error.message);
        }
        
        try {
          const result = await transporter.sendMail(autoReplyOptions);
          console.log('자동 응답 이메일 발송 완료:', result.messageId);
          autoReplySent = true;
        } catch (error) {
          console.error('자동 응답 이메일 발송 실패:', error);
          console.error('에러 상세:', error.message);
        }
        
        console.log('이메일 발송 결과:', { emailSent, autoReplySent });

    // 로그 기록
    console.log(`MUZIIK 문의 접수: ${type} - ${name} (${email})`);

    res.status(200).json({ 
      success: true, 
      message: language === 'ja' ? 'お問い合わせを受け付けました' : '문의가 접수되었습니다' 
    });

  } catch (error) {
    console.error('MUZIIK 문의 처리 오류:', error);
    res.status(500).json({ 
      success: false, 
      message: language === 'ja' ? '送信に失敗しました。しばらくしてからもう一度お試しください。' : '전송에 실패했습니다. 잠시 후 다시 시도해주세요.' 
    });
  }
}