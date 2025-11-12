import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { error } = req.query;
  
  console.error('인증 오류 발생:', {
    error,
    url: req.url,
    method: req.method,
    headers: {
      host: req.headers.host,
      referer: req.headers.referer,
      'user-agent': req.headers['user-agent']
    },
    cookies: req.cookies,
    env: {
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '설정됨' : '없음',
      NODE_ENV: process.env.NODE_ENV,
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '설정됨' : '없음'
    }
  });

  // 오류 타입별 메시지
  const errorMessages: Record<string, string> = {
    Configuration: '인증 설정 오류가 발생했습니다. 환경 변수를 확인해주세요.',
    AccessDenied: '접근이 거부되었습니다.',
    Verification: '인증 검증에 실패했습니다.',
    Default: '인증 오류가 발생했습니다.'
  };

  const errorMessage = errorMessages[error as string] || errorMessages.Default;

  res.status(200).json({
    error: error || 'Unknown',
    message: errorMessage,
    details: {
      timestamp: new Date().toISOString(),
      url: req.url,
      method: req.method
    }
  });
}


