// Next.js API route handler
import nodemailer from 'nodemailer';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, language, name, email, phone, company, businessNumber, inquiryType, message, quantity, attachment } = req.body;

    // Gmail App Password가 설정되지 않은 경우 로그만 기록하고 즉시 응답
    if (!process.env.GMAIL_APP_PASSWORD) {
      console.log('Gmail App Password가 설정되지 않음. 문의 내용:', {
        type, language, name, email, phone, company, businessNumber, inquiryType, message, quantity
      });
      
      return res.status(200).json({ 
        success: true, 
        message: language === 'ja' ? 'お問い合わせを受け付けました' : '문의가 접수되었습니다' 
      });
    }

    // 이메일 전송 설정 (Gmail App Password가 있을 때만)
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: 'massgoogolf@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // 문의 유형별 제목 설정
    const getSubject = (type: string, language: string) => {
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
    const createEmailTemplate = (data: any, language: string) => {
      const isJapanese = language === 'ja';
      
      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a1a1a; color: white; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 20px; }
    .field { margin-bottom: 15px; }
    .label { font-weight: bold; color: #2c3e50; }
    .value { margin-top: 5px; padding: 10px; background: white; border-left: 3px solid #3498db; }
    .footer { background: #34495e; color: white; padding: 15px; text-align: center; font-size: 12px; }
    .priority { background: #e74c3c; color: white; padding: 5px 10px; border-radius: 3px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>MUZIIK DOGATTI GENERATION</h1>
      <p>${isJapanese ? 'お問い合わせ受付' : '문의 접수'}</p>
    </div>
    
    <div class="content">
      <div class="field">
        <div class="label">${isJapanese ? 'お問い合わせ種別' : '문의 유형'}</div>
        <div class="value">
          ${data.type === 'general' ? (isJapanese ? '一般お問い合わせ' : '일반 문의') : 
            data.type === 'partnership' ? (isJapanese ? 'パートナーシップ' : '파트너십') : 
            (isJapanese ? 'マツグコラボ' : '마쓰구 콜라보')}
          <span class="priority">${data.type === 'partnership' ? 'HIGH' : 'NORMAL'}</span>
        </div>
      </div>

      <div class="field">
        <div class="label">${isJapanese ? 'お名前' : '이름'}</div>
        <div class="value">${data.name}</div>
      </div>

      <div class="field">
        <div class="label">${isJapanese ? 'メールアドレス' : '이메일'}</div>
        <div class="value">${data.email}</div>
      </div>

      ${data.phone ? `
      <div class="field">
        <div class="label">${isJapanese ? '電話番号' : '전화번호'}</div>
        <div class="value">${data.phone}</div>
      </div>
      ` : ''}

      ${data.company ? `
      <div class="field">
        <div class="label">${isJapanese ? '会社名' : '업체명'}</div>
        <div class="value">${data.company}</div>
      </div>
      ` : ''}

      ${data.businessNumber ? `
      <div class="field">
        <div class="label">${isJapanese ? '事業者登録番号' : '사업자등록번호'}</div>
        <div class="value">${data.businessNumber}</div>
      </div>
      ` : ''}

      <div class="field">
        <div class="label">${isJapanese ? 'お問い合わせ種別' : '문의 유형'}</div>
        <div class="value">${data.inquiryType}</div>
      </div>

      ${data.quantity ? `
      <div class="field">
        <div class="label">${isJapanese ? '希望取引数量' : '희망 거래 수량'}</div>
        <div class="value">${data.quantity}</div>
      </div>
      ` : ''}

      <div class="field">
        <div class="label">${isJapanese ? 'メッセージ' : '문의 내용'}</div>
        <div class="value">${data.message.replace(/\n/g, '<br>')}</div>
      </div>

      <div class="field">
        <div class="label">${isJapanese ? '受信日時' : '수신 시간'}</div>
        <div class="value">${new Date().toLocaleString('ko-KR', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        })}</div>
      </div>
    </div>

    <div class="footer">
      <p>${isJapanese ? 'このメールは自動送信されています。' : '이 이메일은 자동으로 발송되었습니다.'}</p>
      <p>MUZIIK DOGATTI GENERATION - ${isJapanese ? '日本製プレミアムゴルフシャフト' : '일본제 프리미엄 골프 샤프트'}</p>
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
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a1a1a; color: white; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 20px; }
    .footer { background: #34495e; color: white; padding: 15px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>MUZIIK DOGATTI GENERATION</h1>
      <p>${isJapanese ? 'お問い合わせありがとうございます' : '문의해주셔서 감사합니다'}</p>
    </div>
    
    <div class="content">
      <p>${data.name}${isJapanese ? '様' : '님'},</p>
      
      <p>${isJapanese ? 
        'この度は、MUZIIK DOGATTI GENERATION シャフトにお問い合わせいただき、誠にありがとうございます。' :
        'MUZIIK DOGATTI GENERATION 샤프트에 문의해주셔서 진심으로 감사합니다.'
      }</p>
      
      <p>${isJapanese ? 
        'お問い合わせ内容を確認いたしました。担当者より2営業日以内にご連絡いたします。' :
        '문의 내용을 확인했습니다. 담당자가 영업일 기준 2일 이내에 연락드리겠습니다.'
      }</p>
      
      <p>${isJapanese ? 
        'ご質問がございましたら、お気軽にお問い合わせください。' :
        '추가 문의사항이 있으시면 언제든 연락주세요.'
      }</p>
      
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
      subject: `${getSubject(type, language)} - ${name}`,
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

    // 이메일 발송
    await transporter.sendMail(mailOptions);
    await transporter.sendMail(autoReplyOptions);

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
      message: language === 'ja' ? '送信に失敗しました' : '전송에 실패했습니다' 
    });
  }
}
