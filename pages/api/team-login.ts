import type { NextApiRequest, NextApiResponse } from 'next';

export default function teamLogin(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.status(200).json({ message: '팀 로그인 기능' });
}
