// pages/api/check-env.js
// 환경 변수 확인용 API

export default function handler(req, res) {
  const envStatus = {
    NODE_VERSION: process.version,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    HAS_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    HAS_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    HAS_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
    HAS_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
    API_WORKING: true
  };
  
  res.status(200).json(envStatus);
}