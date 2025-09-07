import type { NextApiRequest, NextApiResponse } from 'next';

type SlackRequestBody = {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  clubBrand?: string;
  loft?: string;
  shaft?: string;
  distance?: string;
  ageGroup?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    return res.status(500).json({ ok: false, error: 'Slack webhook URL is not configured' });
  }

  try {
    const {
      name,
      email,
      phone,
      message,
      clubBrand,
      loft,
      shaft,
      distance,
      ageGroup,
    } = (req.body || {}) as SlackRequestBody;

    // 간단한 필수값 검증
    if (!name || !phone || !clubBrand || !loft || !shaft || !distance || !ageGroup) {
      return res.status(400).json({ ok: false, error: 'Required fields are missing' });
    }

    const lines = [
      `새 문의가 접수되었습니다 :telephone_receiver:`,
      `• 이름: ${name}`,
      email ? `• 이메일: ${email}` : undefined,
      `• 연락처: ${phone}`,
      `• 현재 클럽: ${clubBrand} / 로프트 ${loft} / 샤프트 ${shaft}`,
      `• 현재 비거리: ${distance}`,
      `• 연령대: ${ageGroup}`,
      message ? `• 문의내용: ${message}` : undefined,
      `• 접수시각: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`,
    ].filter(Boolean);

    const payload = { text: lines.join('\n') };

    const slackRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!slackRes.ok) {
      const text = await slackRes.text();
      return res.status(502).json({ ok: false, error: `Slack webhook failed: ${text}` });
    }

    return res.status(200).json({ ok: true });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error?.message || 'Unknown error' });
  }
}


