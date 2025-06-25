import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { password } = req.body;
  if (password === process.env.ADMIN_PASS) {
    res.setHeader('Set-Cookie', `admin_auth=1; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`);
    return res.status(200).end();
  }
  return res.status(401).end();
} 