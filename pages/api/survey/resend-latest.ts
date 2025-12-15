import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { sendSlackNotification } from '@/lib/slack-notification';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const limit = Math.min(parseInt(String(req.body?.limit || 3), 10) || 3, 20);

    const { data: surveys, error } = await supabase
      .from('surveys')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('설문 조회 오류:', error);
      return res.status(500).json({ success: false, message: '설문 조회에 실패했습니다.' });
    }

    for (const survey of surveys || []) {
      try {
        const formattedDate = new Date(survey.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
        const factorMap: Record<string, string> = {
          distance: '비거리',
          direction: '방향성',
          feel: '타구감',
        };
        const factorNames = (survey.important_factors || []).map((f: string) => factorMap[f] || f);

        const blocks = [
          {
            type: 'header',
            text: { type: 'plain_text', text: '📝 설문 재전송', emoji: true },
          },
          { type: 'divider' },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*이름*\n${survey.name}` },
              { type: 'mrkdwn', text: `*연락처*\n${survey.phone}` },
              { type: 'mrkdwn', text: `*연령대*\n${survey.age_group || '미입력'}` },
              { type: 'mrkdwn', text: `*선택 모델*\n${survey.selected_model}` },
              { type: 'mrkdwn', text: `*중요 요소*\n${factorNames.join(', ') || '미입력'}` },
              { type: 'mrkdwn', text: `*제출시각*\n${formattedDate}` },
            ],
          },
          {
            type: 'section',
            text: { type: 'mrkdwn', text: `*주소*\n${survey.address || '미입력'}` },
          },
          {
            type: 'section',
            text: { type: 'mrkdwn', text: `*추가 의견*\n${survey.additional_feedback || '없음'}` },
          },
        ];

        await sendSlackNotification({
          username: '설문 알림봇',
          icon_emoji: ':clipboard:',
          text: `설문 재전송: ${survey.name}`,
          blocks,
        });
      } catch (notifyError) {
        console.error('슬랙 재전송 오류 (무시):', notifyError);
      }
    }

    return res.status(200).json({
      success: true,
      message: `${surveys?.length || 0}건을 슬랙으로 재전송했습니다.`,
    });
  } catch (err: any) {
    console.error('재전송 오류:', err);
    return res.status(500).json({ success: false, message: err.message || '서버 오류' });
  }
}


