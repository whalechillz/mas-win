import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  
  // 쿠키 삭제 (Max-Age=0으로 설정)
  res.setHeader('Set-Cookie', 'admin_auth=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
  
  return res.status(200).json({ success: true });
}
