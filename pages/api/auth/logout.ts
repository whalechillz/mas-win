import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // 모든 NextAuth 쿠키 삭제
  const cookieNames = [
    'next-auth.session-token',
    '__Secure-next-auth.session-token',
    '__Host-next-auth.session-token',
    'next-auth.csrf-token',
    '__Secure-next-auth.csrf-token',
    '__Host-next-auth.csrf-token'
  ];

  const domains = ['', '.masgolf.co.kr', 'www.masgolf.co.kr'];
  const paths = ['/', '/admin', '/admin/login'];

  const cookiesToClear: string[] = [];

  cookieNames.forEach(name => {
    domains.forEach(domain => {
      paths.forEach(path => {
        // 모든 가능한 조합으로 쿠키 삭제
        const domainPart = domain ? `; Domain=${domain}` : '';
        cookiesToClear.push(
          `${name}=; Path=${path}; Max-Age=0; SameSite=Lax${domainPart}`,
          `${name}=; Path=${path}; Max-Age=0; SameSite=None; Secure${domainPart}`,
          `${name}=; Path=${path}; Expires=Thu, 01 Jan 1970 00:00:00 GMT${domainPart}`
        );
      });
    });
  });

  // Set-Cookie 헤더 설정
  res.setHeader('Set-Cookie', cookiesToClear);

  return res.status(200).json({ success: true, message: '로그아웃 완료' });
}

