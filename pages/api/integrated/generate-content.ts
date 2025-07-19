import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabase } from '../../../lib/supabase';

// AI 콘텐츠 생성 함수 (실제 구현시 Claude API 연동)
async function generateAIContent(
  channel: string,
  funnelData: any,
  mainImage: any,
  keywords: string[]
): Promise<{ title: string; content: string }> {
  // TODO: Claude API 연동
  // 임시 구현
  const channelTemplates = {
    blog: {
      title: `${funnelData.theme} - 특별한 혜택을 만나보세요`,
      content: `## ${funnelData.theme}\n\n### 이번 달 특별 혜택\n\n여러분을 위한 특별한 혜택을 준비했습니다...\n\n### 주요 특징\n- 특징 1\n- 특징 2\n- 특징 3\n\n지금 바로 신청하세요!`
    },
    kakao: {
      title: `🎯 ${funnelData.theme}`,
      content: `안녕하세요! 😊\n\n이번 달 특별한 혜택 소식을 전해드립니다.\n\n✨ 혜택 1\n✨ 혜택 2\n✨ 혜택 3\n\n자세한 내용은 링크를 확인해주세요!\n\n[바로가기]`
    },
    sms: {
      title: `SMS 발송`,
      content: `[마스골프] ${funnelData.theme} 안내\n\n특별 혜택:\n- 혜택 1\n- 혜택 2\n\n신청: 1588-XXXX`
    },
    email: {
      title: `${funnelData.theme} - 놓치면 후회하는 특별 혜택`,
      content: `<h2>${funnelData.theme}</h2>\n<p>안녕하세요, 고객님</p>\n<p>이번 달 준비한 특별한 혜택을 소개합니다.</p>\n<ul>\n<li>혜택 1</li>\n<li>혜택 2</li>\n<li>혜택 3</li>\n</ul>\n<p>지금 바로 확인하세요!</p>`
    },
    instagram: {
      title: `${funnelData.theme} 🏌️‍♂️`,
      content: `🏌️‍♂️ ${funnelData.theme}\n\n✅ 특별 혜택 1\n✅ 특별 혜택 2\n✅ 특별 혜택 3\n\n.\n.\n.\n#마스골프 #골프 #${keywords.join(' #')}`
    }
  };

  return channelTemplates[channel] || channelTemplates.blog;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerSupabase(req, res);

  // 인증 확인
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { method, body } = req;

  try {
    switch (method) {
      case 'POST':
        const { 
          funnel_plan_id,
          channels,
          mainImagePath,
          tone,
          keywords
        } = body;

        if (!funnel_plan_id || !channels || channels.length === 0) {
          return res.status(400).json({ 
            error: 'funnel_plan_id와 channels는 필수입니다.' 
          });
        }

        // 퍼널 계획 정보 조회
        const { data: funnelPlan, error: funnelError } = await supabase
          .from('monthly_funnel_plans')
          .select(`
            *,
            monthly_themes (
              theme,
              description,
              target_audience,
              focus_keywords
            ),
            funnel_pages (
              main_image,
              content
            )
          `)
          .eq('id', funnel_plan_id)
          .single();

        if (funnelError) throw funnelError;

        // 생성 요청 로그
        const { data: logEntry, error: logError } = await supabase
          .from('content_generation_logs')
          .insert({
            funnel_plan_id,
            request_type: 'generate',
            request_data: {
              channels,
              mainImagePath,
              tone,
              keywords
            },
            status: 'processing'
          })
          .select()
          .single();

        if (logError) throw logError;

        const generatedContents = [];
        const errors = [];

        // 각 채널별로 콘텐츠 생성
        for (const channel of channels) {
          try {
            // AI로 콘텐츠 생성
            const { title, content } = await generateAIContent(
              channel,
              funnelPlan,
              mainImagePath,
              keywords || funnelPlan.monthly_themes?.focus_keywords || []
            );

            // 생성된 콘텐츠 저장
            const { data: savedContent, error: saveError } = await supabase
              .from('generated_contents')
              .insert({
                funnel_plan_id,
                channel,
                title,
                content,
                generation_prompt: `Generate ${channel} content for ${funnelPlan.theme}`,
                generated_by: 'claude',
                status: 'draft'
              })
              .select()
              .single();

            if (saveError) throw saveError;

            generatedContents.push(savedContent);
          } catch (error: any) {
            errors.push({
              channel,
              error: error.message
            });
          }
        }

        // 로그 업데이트
        await supabase
          .from('content_generation_logs')
          .update({
            status: errors.length === channels.length ? 'failed' : 'completed',
            response_data: {
              generated: generatedContents.length,
              failed: errors.length,
              errors
            },
            completed_at: new Date().toISOString()
          })
          .eq('id', logEntry.id);

        return res.status(201).json({ 
          data: generatedContents,
          errors: errors.length > 0 ? errors : undefined
        });

      default:
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error: any) {
    console.error('Generate Content API Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal Server Error',
      details: error 
    });
  }
}
