export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, data } = req.body;

  if (!process.env.SLACK_WEBHOOK_URL) {
    console.log('Slack webhook not configured');
    return res.status(200).json({ success: true, message: 'Slack not configured' });
  }

  try {
    let message = '';
    
    if (type === 'booking') {
      message = `🎯 *새로운 시타 예약*\n` +
        `• 이름: ${data.name}\n` +
        `• 연락처: ${data.phone}\n` +
        `• 날짜: ${data.date}\n` +
        `• 시간: ${data.time}\n` +
        `• 클럽: ${data.club}`;
    } else if (type === 'contact') {
      message = `📞 *새로운 문의*\n` +
        `• 이름: ${data.name}\n` +
        `• 연락처: ${data.phone}\n` +
        `• 통화가능시간: ${data.callTimes}`;
    }

    const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: message,
        username: 'MAS Golf 알림봇',
        icon_emoji: ':golf:',
      }),
    });

    if (!response.ok) {
      throw new Error('Slack notification failed');
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Slack notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
}