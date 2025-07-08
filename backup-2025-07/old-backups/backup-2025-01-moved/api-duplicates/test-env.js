export default function handler(req, res) {
  const env = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Not set',
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set',
    slackWebhook: process.env.SLACK_WEBHOOK_URL ? '✅ Set' : '❌ Not set',
    adminPass: process.env.ADMIN_PASS ? '✅ Set' : '❌ Not set',
  };

  res.status(200).json({
    message: 'Environment variables status',
    env,
    nodeVersion: process.version
  });
}