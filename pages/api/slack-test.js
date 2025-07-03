export default async function handler(req, res) {
  const webhookUrl = 'https://hooks.slack.com/services/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';
  
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
