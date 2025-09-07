import type { NextApiRequest, NextApiResponse } from 'next';

export default function changePassword(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.status(200).json({ message: '비밀번호 변경 기능' });
}
