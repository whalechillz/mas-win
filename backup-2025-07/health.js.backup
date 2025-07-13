export default function handler(req, res) {
  res.status(200).json({ 
    message: 'API is working',
    method: req.method,
    env: {
      slackWebhook: process.env.SLACK_WEBHOOK_URL ? 'Set' : 'Not set'
    }
  });
}
