import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import axios from 'axios';

function generateSolapiAuthHeader(apiKey: string, apiSecret: string) {
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(16).toString('hex');
  const signature = crypto.createHmac('sha256', apiSecret).update(date + salt).digest('hex');
  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { apiKey, apiSecret, sender } = req.body as { apiKey?: string; apiSecret?: string; sender?: string };

    if (!apiKey || !apiSecret) {
      return res.status(400).json({ success: false, message: 'API Key와 Secret을 입력해주세요.' });
    }

    const authHeader = generateSolapiAuthHeader(apiKey, apiSecret);

    // 인증 확인: 등록된 발신번호 목록을 조회하여 권한 및 연결 상태를 점검
    // 참고: 엔드포인트가 변경될 수 있으므로 401/403/400에 대한 방어적 처리 포함
    const result = await axios.get('https://api.solapi.com/messages/v4/senders', {
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json'
      }
    });

    const senders: Array<{ phoneNumber?: string; number?: string }> = (result.data?.senders as any[]) || [];
    const normalized = senders.map((s) => (s.phoneNumber || s.number || '')).filter(Boolean);

    let senderOk = true;
    if (sender) {
      const target = sender.replace(/[^0-9]/g, '');
      senderOk = normalized.some((n) => n.replace(/[^0-9]/g, '') === target);
    }

    return res.status(200).json({
      success: true,
      message: sender ? (senderOk ? '인증 및 발신번호 확인 완료' : '인증 성공, 단 등록된 발신번호에 일치 항목이 없습니다.') : '인증 성공',
      data: {
        registeredSenders: normalized
      }
    });
  } catch (error: any) {
    const status = error?.response?.status;
    let message = '솔라피 인증에 실패했습니다.';
    if (status === 401 || status === 403) message = '인증 실패: API Key/Secret을 확인해주세요.';
    else if (status === 429) message = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
    else if (status === 400) message = '요청 형식 오류가 발생했습니다.';

    return res.status(500).json({
      success: false,
      message,
      error: error?.message,
      details: error?.response?.data
    });
  }
}


