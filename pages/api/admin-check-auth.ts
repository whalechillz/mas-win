import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  
  // 쿠키에서 admin_auth와 admin_session 확인
  const authCookie = req.cookies.admin_auth;
  const sessionCookie = req.cookies.admin_session;
  
  console.log('Auth check cookies:', { authCookie, sessionCookie });
  
  if (authCookie === '1' && sessionCookie === 'active') {
    // 쿠키 갱신 (자동 연장)
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = [
      'admin_auth=1',
      'Path=/',
      'HttpOnly',
      'SameSite=Lax',
      'Max-Age=2592000', // 30일
      isProduction ? 'Secure' : ''
    ].filter(Boolean).join('; ');
    
    const sessionCookieOptions = [
      'admin_session=active',
      'Path=/',
      'HttpOnly',
      'SameSite=Lax',
      'Max-Age=2592000', // 30일
      isProduction ? 'Secure' : ''
    ].filter(Boolean).join('; ');
    
    res.setHeader('Set-Cookie', [cookieOptions, sessionCookieOptions]);
    
    return res.status(200).json({ 
      authenticated: true,
      message: '인증 유효',
      timestamp: new Date().toISOString()
    });
  }
  
  return res.status(401).json({ 
    authenticated: false,
    message: '인증 필요'
  });
}
