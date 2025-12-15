export async function sendSlackNotification(message) {
  // 기본 웹훅이 없으면 백업 키(SLACK_WEBHOOK_URL_01_MA_OP) 사용
  const webhookUrl =
    process.env.SLACK_WEBHOOK_URL ||
    process.env.SLACK_WEBHOOK_URL_01_MA_OP;

  if (!webhookUrl) {
    console.log('Slack webhook URL not configured, skipping notification');
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: message
      })
    });

    if (!response.ok) {
      console.error('Slack notification failed:', response.statusText);
    }
  } catch (error) {
    console.error('Slack notification error:', error);
    // 슬랙 에러는 무시하고 계속 진행
  }
}
