import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  
  // 쿠키에서 admin_auth 확인
  const authCookie = req.cookies.admin_auth;
  
  if (authCookie === '1') {
    return res.status(200).json({ authenticated: true });
  }
  
  return res.status(401).json({ authenticated: false });
}
