import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 크론 인증
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const pages = [
      'https://win.masgolf.co.kr/versions/funnel-2025-08-live-a.html',
      'https://win.masgolf.co.kr/versions/funnel-2025-08-live-b.html'
    ];

    const results = await Promise.all(
      pages.map(async (url) => {
        try {
          const response = await fetch(url);
          const html = await response.text();
          
          const checks = {
            statusCode: response.status,
            hasBodyTag: html.includes('<body>'),
            hasClosingBodyTag: html.includes('</body>'),
            hasScriptErrors: html.includes('SyntaxError') || html.includes('Unexpected token'),
            hasGTM: html.includes('GTM-WPBX97JG'),
            hasABTestTracker: html.includes('ABTestTracker')
          };

          return {
            url,
            timestamp: new Date().toISOString(),
            isHealthy: response.status === 200 && 
                      checks.hasBodyTag && 
                      checks.hasClosingBodyTag && 
                      !checks.hasScriptErrors,
            checks
          };
        } catch (error) {
          return {
            url,
            timestamp: new Date().toISOString(),
            isHealthy: false,
            error: error.message
          };
        }
      })
    );

    const unhealthyPages = results.filter(result => !result.isHealthy);

    if (unhealthyPages.length > 0) {
      await sendSlackAlert(unhealthyPages);
    }

    res.status(200).json({
      success: true,
      checkedAt: new Date().toISOString(),
      totalPages: results.length,
      healthyPages: results.length - unhealthyPages.length,
      unhealthyPages: unhealthyPages.length,
      results
    });

  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ error: 'Health check failed' });
  }
}

async function sendSlackAlert(unhealthyPages: any[]) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  
  if (!webhookUrl) return;

  const message = {
    text: '🚨 퍼널 페이지 오류 발생!',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*�� 퍼널 페이지 오류 발생!*\n\n발생 시각: ${new Date().toLocaleString('ko-KR')}\n문제 페이지: ${unhealthyPages.length}개`
        }
      },
      ...unhealthyPages.map(page => ({
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*페이지:*\n${page.url}`
          },
          {
            type: 'mrkdwn',
            text: `*상태:*\n${page.checks?.statusCode || '연결 실패'}`
          },
          {
            type: 'mrkdwn',
            text: `*스크립트 오류:*\n${page.checks?.hasScriptErrors ? '❌ 있음' : '✅ 없음'}`
          },
          {
            type: 'mrkdwn',
            text: `*GTM 로드:*\n${page.checks?.hasGTM ? '✅ 정상' : '❌ 실패'}`
          }
        ]
      })),
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '관리자 페이지 확인'
            },
            url: 'https://win.masgolf.co.kr/admin'
          }
        ]
      }
    ]
  };

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message)
  });
}
