export default function handler(req, res) {
  // 환경변수 디버깅
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Not set',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set',
    SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL ? '✅ Set' : '❌ Not set',
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV
  };

  res.status(200).json({
    message: 'Environment variables check',
    environment: env,
    timestamp: new Date().toISOString()
  });
}