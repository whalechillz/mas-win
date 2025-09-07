import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  
  // 모든 관리자 쿠키 삭제
  const clearCookies = [
    'admin_auth=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
    'admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
  ];
  
  res.setHeader('Set-Cookie', clearCookies);
  
  return res.status(200).json({ 
    success: true,
    message: '로그아웃 완료'
  });
}
