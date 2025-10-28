const { createClient } = require('@supabase/supabase-js');
const { createSolapiSignature } = require('../../utils/solapiSignature.js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || "";
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || "";
const SOLAPI_SENDER = process.env.SOLAPI_SENDER || "";

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({ success: false, message: '전화번호와 메시지는 필수입니다.' });
    }

    if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET || !SOLAPI_SENDER) {
      return res.status(500).json({ success: false, message: 'SMS 서비스 설정이 완료되지 않았습니다.' });
    }

    // 전화번호 정리
    const cleanPhone = phoneNumber.replace(/[\-\s]/g, '');
    const cleanSender = SOLAPI_SENDER.replace(/[\-\s]/g, '');

    // Solapi v4 API로 단순 발송
    const authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);

    const response = await fetch('https://api.solapi.com/messages/v4/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders
      },
      body: JSON.stringify({
        messages: [{
          to: cleanPhone,
          from: cleanSender,
          text: message,
          type: 'SMS'
        }]
      })
    });

    const result = await response.json();
    console.log('Solapi 응답:', result);

    if (!response.ok) {
      throw new Error(`Solapi API 오류: ${response.status} - ${JSON.stringify(result)}`);
    }

    return res.status(200).json({ success: true, result, message: 'SMS 발송 요청 성공' });

  } catch (error) {
    console.error('SMS 발송 오류:', error);
    return res.status(500).json({ success: false, message: 'SMS 발송 중 오류가 발생했습니다.', error: error.message });
  }
};
