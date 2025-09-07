import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabase } from '../../../lib/supabase';

// AI 콘텐츠 생성 함수 (실제 구현시 Claude API 연동)
async function generateAIContent(
  channel: string,
  funnelData: any,
  mainImagePath: string,
  keywords: string[]
): Promise<{ content: string; metadata: any }> {
  // TODO: Claude API 연동
  // 임시 구현
  const channelTemplates = {
    blog: {
      content: `## ${funnelData.theme}\n\n### 이번 달 특별 혜택\n\n여러분을 위한 특별한 혜택을 준비했습니다...\n\n### 주요 특징\n- 특징 1\n- 특징 2\n- 특징 3\n\n지금 바로 신청하세요!`,
      metadata: {
        title: `${funnelData.theme} - 특별한 혜택을 만나보세요`,
        wordCount: 150,
        estimatedReadTime: '2분'
      }
    },
    kakao: {
      content: `안녕하세요! 😊\n\n이번 달 특별한 혜택 소식을 전해드립니다.\n\n✨ 혜택 1\n✨ 혜택 2\n✨ 혜택 3\n\n자세한 내용은 링크를 확인해주세요!\n\n[바로가기]`,
      metadata: {
        title: `🎯 ${funnelData.theme}`,
        charCount: 100,
        hasEmoji: true
      }
    },
    sms: {
      content: `[마스골프] ${funnelData.theme} 안내\n\n특별 혜택:\n- 혜택 1\n- 혜택 2\n\n신청: 1588-XXXX`,
      metadata: {
        title: `SMS 발송`,
        charCount: 80,
        type: 'promotional'
      }
    },
    email: {
      content: `<h2>${funnelData.theme}</h2>\n<p>안녕하세요, 고객님</p>\n<p>이번 달 준비한 특별한 혜택을 소개합니다.</p>\n<ul>\n<li>혜택 1</li>\n<li>혜택 2</li>\n<li>혜택 3</li>\n</ul>\n<p>지금 바로 확인하세요!</p>`,
      metadata: {
        title: `${funnelData.theme} - 놓치면 후회하는 특별 혜택`,
        subject: `[마스골프] ${funnelData.theme} 안내`,
        previewText: '이번 달 특별한 혜택을 확인하세요'
      }
    },
    instagram: {
      content: `🏌️‍♂️ ${funnelData.theme}\n\n✅ 특별 혜택 1\n✅ 특별 혜택 2\n✅ 특별 혜택 3\n\n.\n.\n.\n#마스골프 #골프 #${keywords.join(' #')}`,
      metadata: {
        title: `${funnelData.theme} 🏌️‍♂️`,
        hashtags: ['마스골프', '골프', ...keywords],
        mediaType: 'image'
      }
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
          keywords = []
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
            funnel_pages (
              page_data
            )
          `)
          .eq('id', funnel_plan_id)
          .single();

        if (funnelError) throw funnelError;

        const generatedContents = [];
        const errors = [];

        // 각 채널별로 콘텐츠 생성
        for (const channel of channels) {
          try {
            // AI로 콘텐츠 생성
            const { content, metadata } = await generateAIContent(
              channel,
              funnelPlan,
              mainImagePath || funnelPlan.funnel_pages?.[0]?.page_data?.mainImage?.path || '',
              keywords
            );

            // 생성된 콘텐츠 저장
            const { data: savedContent, error: saveError } = await supabase
              .from('generated_contents')
              .insert({
                funnel_plan_id,
                channel,
                content,
                metadata: {
                  ...metadata,
                  generatedAt: new Date().toISOString(),
                  generatedBy: 'claude',
                  tone,
                  keywords
                },
                validation_score: {
                  seoScore: 0,
                  readability: 0,
                  brandConsistency: 0,
                  channelOptimization: 0,
                  suggestions: []
                },
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

        return res.status(201).json({ 
          data: generatedContents,
          errors: errors.length > 0 ? errors : undefined,
          summary: {
            requested: channels.length,
            generated: generatedContents.length,
            failed: errors.length
          }
        });

      case 'GET':
        // 생성된 콘텐츠 조회
        const { funnel_plan_id: planId, channel: channelFilter, status } = query;
        
        let query = supabase
          .from('generated_contents')
          .select(`
            *,
            monthly_funnel_plans (
              year,
              month,
              theme
            )
          `);

        if (planId) query = query.eq('funnel_plan_id', planId);
        if (channelFilter) query = query.eq('channel', channelFilter);
        if (status) query = query.eq('status', status);

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        return res.status(200).json({ data });

      default:
        res.setHeader('Allow', ['POST', 'GET']);
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
