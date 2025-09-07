import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    headers: req.headers,
    hostname: req.headers.host,
    userAgent: req.headers['user-agent'],
    referer: req.headers.referer,
    origin: req.headers.origin,
    // Vercel 특정 헤더들
    vercelHeaders: {
      'x-vercel-id': req.headers['x-vercel-id'],
      'x-vercel-cache': req.headers['x-vercel-cache'],
      'x-matched-path': req.headers['x-matched-path'],
      'x-vercel-deployment-url': req.headers['x-vercel-deployment-url'],
    },
    // 환경 변수 확인 (보안상 민감한 정보는 제외)
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
    }
  };

  res.status(200).json({
    success: true,
    message: '404 디버깅 정보',
    data: debugInfo,
    analysis: {
      isVercel: !!req.headers['x-vercel-id'],
      isProduction: process.env.NODE_ENV === 'production',
      hostnameAnalysis: {
        current: req.headers.host,
        expected: 'www.masgolf.co.kr',
        matches: req.headers.host === 'www.masgolf.co.kr',
        isSubdomain: req.headers.host?.includes('www.'),
        isRootDomain: req.headers.host === 'masgolf.co.kr',
      },
      routingAnalysis: {
        currentPath: req.url,
        isRoot: req.url === '/',
        hasTrailingSlash: req.url?.endsWith('/'),
      }
    }
  });
}
