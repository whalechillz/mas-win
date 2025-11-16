import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    pathname: req.url?.split('?')[0],
    headers: {
      host: req.headers.host,
      'user-agent': req.headers['user-agent'],
      referer: req.headers.referer,
      origin: req.headers.origin,
      // Vercel 특정 헤더들
      'x-vercel-id': req.headers['x-vercel-id'],
      'x-matched-path': req.headers['x-matched-path'], // ⚠️ 중요: 이 값이 /ko/500이면 i18n 문제
      'x-vercel-deployment-url': req.headers['x-vercel-deployment-url'],
      'x-forwarded-for': req.headers['x-forwarded-for'],
      'x-forwarded-host': req.headers['x-forwarded-host'],
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
    },
    analysis: {
      isApiRoute: req.url?.startsWith('/api'),
      hasLocalePrefix: /^\/(ko|ja)\/api/.test(req.url || ''),
      matchedPath: req.headers['x-matched-path'],
      isVercel: !!req.headers['x-vercel-id'],
      // ⚠️ 핵심: x-matched-path가 /ko/500이면 Next.js i18n이 API를 페이지로 해석한 것
      isI18nIntercepted: req.headers['x-matched-path']?.includes('/ko/') || 
                         req.headers['x-matched-path']?.includes('/ja/'),
      isErrorPage: req.headers['x-matched-path']?.includes('/500') ||
                   req.headers['x-matched-path']?.includes('/404'),
    }
  };

  res.status(200).json({
    success: true,
    message: 'API 라우팅 디버깅 정보',
    data: debugInfo,
    summary: {
      'API 경로인가?': debugInfo.analysis.isApiRoute,
      '로케일 프리픽스 있는가?': debugInfo.analysis.hasLocalePrefix,
      'x-matched-path': debugInfo.analysis.matchedPath,
      'i18n 가로채기 여부': debugInfo.analysis.isI18nIntercepted,
      '에러 페이지로 매칭?': debugInfo.analysis.isErrorPage,
      'Vercel 환경?': debugInfo.analysis.isVercel,
    }
  });
}

