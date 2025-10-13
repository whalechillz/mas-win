import { AUDIENCE_STAGES } from '../../../../lib/masgolf-brand-data';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { blogPost, trackingUrl } = req.body;
    const stage = AUDIENCE_STAGES[blogPost.conversionGoal];
    
    const prompt = `
블로그 제목: ${blogPost.title}
요약: ${blogPost.summary}
오디언스 단계: ${stage.name}
전환 목표: ${stage.conversionGoal}
CTA: ${stage.cta}

카카오톡 메시지 생성 요구사항:
- 150자 이내
- 후킹력 있는 첫 문장
- 핵심 혜택 강조
- 명확한 CTA: "${stage.cta}"
- 전환 링크 포함

형식:
[첫 문장: 후킹]
[핵심 혜택 1-2줄]
[CTA] 👉 [링크]
`;

    // 실제로는 OpenAI API 호출
    const content = `${blogPost.title}\n\n${blogPost.summary}\n\n${stage.cta} 👉 ${trackingUrl}`;
    
    return res.json({
      success: true,
      channel: 'kakao',
      content: content,
      schedule_date: getKakaoScheduleDate(),
      conversion_tracking: {
        url: trackingUrl,
        goal: stage.conversionGoal
      },
      status: 'draft',
      characterCount: content.length
    });

  } catch (error) {
    console.error('카카오톡 메시지 생성 오류:', error);
    return res.status(500).json({ 
      error: '카카오톡 메시지 생성 실패',
      details: error.message 
    });
  }
}

function getKakaoScheduleDate() {
  const date = new Date();
  date.setHours(date.getHours() + 1); // 1시간 후
  return date.toISOString();
}
