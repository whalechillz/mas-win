export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
    
    if (!slackWebhookUrl) {
      throw new Error('Slack webhook URL not configured');
    }

    // Slack으로 메시지 전송
    const response = await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      throw new Error('Failed to send Slack notification');
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Slack notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
}