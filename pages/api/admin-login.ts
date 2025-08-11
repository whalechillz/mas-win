import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Admin login API called:', req.method, req.body);
  
  if (req.method !== 'POST') return res.status(405).end();
  
  const { username, password } = req.body;
  
  // 환경변수가 없을 경우 기본값 사용
  const ADMIN_USER = process.env.ADMIN_USER || 'admin';
  const ADMIN_PASS = process.env.ADMIN_PASS || '1234';
  
  console.log('Auth check:', { 
    provided: { username, password },
    expected: { username: ADMIN_USER, password: ADMIN_PASS }
  });
  
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    // 프로덕션 환경에서는 Secure 추가
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = [
      'admin_auth=1',
      'Path=/',
      'HttpOnly',
      'SameSite=Lax',
      'Max-Age=604800', // 7일로 연장
      isProduction ? 'Secure' : ''
    ].filter(Boolean).join('; ');
    
    res.setHeader('Set-Cookie', cookieOptions);
    return res.status(200).json({ success: true });
  }
  
  return res.status(401).json({ error: 'Invalid credentials' });
} 