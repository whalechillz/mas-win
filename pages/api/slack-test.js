export default async function handler(req, res) {
  // 환경 변수에서 webhook URL 가져오기
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  
  if (!webhookUrl) {
    return res.status(500).json({ 
      success: false,
      error: 'Slack webhook URL not configured' 
    });
  }
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: '테스트 메시지: API가 작동합니다!'
      })
    });

    const result = await response.text();
    
    res.status(200).json({ 
      success: true,
      message: 'Slack message sent',
      slackResponse: result,
      statusCode: response.status
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}