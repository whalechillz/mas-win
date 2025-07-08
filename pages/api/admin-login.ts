import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { username, password } = req.body;
  
  // 환경변수가 없을 경우 기본값 사용
  const ADMIN_USER = process.env.ADMIN_USER || 'admin';
  const ADMIN_PASS = process.env.ADMIN_PASS || 'Masgolf!!';
  
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    res.setHeader('Set-Cookie', `admin_auth=1; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`);
    return res.status(200).json({ success: true });
  }
  
  return res.status(401).json({ error: 'Invalid credentials' });
} 