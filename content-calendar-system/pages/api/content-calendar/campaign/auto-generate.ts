// Campaign Auto-Generate API
// /pages/api/content-calendar/campaign/auto-generate.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import AIContentGenerator from '@/lib/ai/content-generator';
import { MassgooToneAndManner } from '@/lib/content-calendar/tone-and-manner';
import ContentQualityChecker from '@/lib/quality/content-quality-checker';
import IntegrationConfig from '@/lib/config/integration';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { campaign, targetAudience } = req.body;

  if (!campaign || !targetAudience) {
    return res.status(400).json({ 
      error: 'Campaign and target audience are required' 
    });
  }

  try {
    const generator = new AIContentGenerator({
      openaiApiKey: process.env.OPENAI_API_KEY!,
      falApiKey: process.env.FAL_AI_KEY!
    });

    const qualityChecker = new ContentQualityChecker();
    const generatedContents = [];

    // 캠페인의 각 콘텐츠 타입별로 생성
    for (const contentType of campaign.contentTypes || []) {
      try {
        // AI 프롬프트 구성
        const prompt = buildCampaignPrompt(campaign, contentType, targetAudience);
        
        // AI 콘텐츠 생성
        const generated = await generator.generateContent({
          contentType: contentType.type,
          topic: campaign.name,
          keywords: extractKeywords(campaign),
          tone: {
            principles: campaign.psychologyPrinciples,
            voice: 'encouraging',
            style: 'professional'
          },
          length: contentType.wordCount || 1500,
          additionalContext: prompt
        });

        // MASGOLF 톤앤매너 적용
        const enhanced = MassgooToneAndManner.applyToneAndManner(
          generated.body,
          contentType.type,
          '시니어_타겟'
        );

        // 품질 검증
        const qualityResult = await qualityChecker.checkContent({
          title: generated.title,
          contentBody: enhanced,
          contentType: contentType.type,
          keywords: generated.keywords,
          targetAudience
        } as any);

        // 품질 점수가 70점 이상인 경우만 저장
        if (qualityResult.score >= 70) {
          // 데이터베이스 저장
          const savedContent = await saveGeneratedContent({
            campaign,
            contentType: contentType.type,
            title: generated.title,
            body: enhanced,
            html: generated.html,
            keywords: generated.keywords,
            hashtags: generated.hashtags,
            qualityScore: qualityResult.score,
            metadata: {
              ...generated.metadata,
              campaign: campaign.name,
              hook: campaign.hook,
              cta: campaign.cta,
              psychologyPrinciples: campaign.psychologyPrinciples
            }
          });

          generatedContents.push({
            id: savedContent.id,
            title: generated.title,
            type: contentType.type,
            qualityScore: qualityResult.score,
            status: 'draft'
          });

          // 이미지 생성 (필요한 경우)
          if (['blog', 'social', 'funnel'].includes(contentType.type)) {
            await generateCampaignImage(savedContent.id, campaign.hook);
          }
        } else {
          // 품질 미달 시 재생성 시도 (1회)
          console.log(`Quality score too low (${qualityResult.score}), retrying...`);
          
          // 프롬프트 개선 후 재시도
          const improvedPrompt = improvePrompt(prompt, qualityResult.issues);
          const retryGenerated = await generator.generateContent({
            contentType: contentType.type,
            topic: campaign.name,
            keywords: extractKeywords(campaign),
            additionalContext: improvedPrompt
          });

          const retryEnhanced = MassgooToneAndManner.applyToneAndManner(
            retryGenerated.body,
            contentType.type,
            '시니어_타겟'
          );

          const retryQuality = await qualityChecker.checkContent({
            title: retryGenerated.title,
            contentBody: retryEnhanced,
            contentType: contentType.type,
            keywords: retryGenerated.keywords,
            targetAudience
          } as any);

          if (retryQuality.score >= 60) { // 재시도는 기준을 낮춤
            const savedContent = await saveGeneratedContent({
              campaign,
              contentType: contentType.type,
              title: retryGenerated.title,
              body: retryEnhanced,
              html: retryGenerated.html,
              keywords: retryGenerated.keywords,
              hashtags: retryGenerated.hashtags,
              qualityScore: retryQuality.score,
              metadata: retryGenerated.metadata
            });

            generatedContents.push({
              id: savedContent.id,
              title: retryGenerated.title,
              type: contentType.type,
              qualityScore: retryQuality.score,
              status: 'draft',
              retried: true
            });
          }
        }
      } catch (error) {
        console.error(`Failed to generate ${contentType.type}:`, error);
      }
    }

    // 생성 로그 저장
    await logGeneration(campaign.id, generatedContents);

    return res.status(200).json({
      success: true,
      generated: generatedContents,
      campaign: campaign.name,
      message: `${generatedContents.length}개 콘텐츠가 자동 생성되었습니다.`
    });

  } catch (error: any) {
    console.error('Auto-generation error:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to auto-generate content' 
    });
  }
}

/**
 * 캠페인 프롬프트 생성
 */
function buildCampaignPrompt(
  campaign: any,
  contentType: any,
  targetAudience: any
): string {
  const principles = campaign.psychologyPrinciples.join(', ');
  
  return `
캠페인: ${campaign.name}
단계: ${campaign.stage}
목표: ${campaign.objectives.join(', ')}

후킹 메시지: ${campaign.hook}

타겟 오디언스:
- 주요 타겟: ${targetAudience.primary}
- 연령대: ${targetAudience.ageRange}
- 관심사: ${targetAudience.interests.join(', ')}
- 고민: ${targetAudience.painPoints.join(', ')}
- 목표: ${targetAudience.goals.join(', ')}

스토리 구조:
${campaign.story ? `
- 주인공: ${campaign.story.hero}
- 문제: ${campaign.story.problem}
- 가이드: ${campaign.story.guide}
- 해결책: ${campaign.story.solution}
- 성공: ${campaign.story.success}
- 변화: ${campaign.story.transformation}
` : '일반 구조 사용'}

설득 심리학 원칙: ${principles}

CTA:
- Primary: ${campaign.cta.primary}
- Secondary: ${campaign.cta.secondary || '없음'}

콘텐츠 타입: ${contentType.type}
${contentType.format ? `형식: ${contentType.format}` : ''}
${contentType.duration ? `길이: ${contentType.duration}` : ''}

작성 지침:
1. 후킹 메시지를 효과적으로 활용
2. 타겟 오디언스의 고민에 공감
3. MASGOLF를 가이드로 포지셔닝
4. 설득 심리학 원칙 적용
5. 명확한 CTA 포함
6. 시니어 골퍼에 대한 존중과 격려
7. 전문적이면서도 친근한 톤

금지 표현: 노인, 늙은, 쇠퇴, 한계
필수 포함: 프리미엄, 혁신, 비거리, 경험, MASGOLF
  `.trim();
}

/**
 * 키워드 추출
 */
function extractKeywords(campaign: any): string[] {
  const keywords = [];
  
  // 후킹 메시지에서 추출
  const hookWords = campaign.hook
    .split(/\s+/)
    .filter((word: string) => word.length > 3)
    .slice(0, 5);
  keywords.push(...hookWords);
  
  // 캠페인 이름에서 추출
  const nameWords = campaign.name
    .split(/\s+/)
    .filter((word: string) => word.length > 2);
  keywords.push(...nameWords);
  
  // 기본 키워드 추가
  keywords.push('MASGOLF', '마스구', '시니어', '골프', '비거리');
  
  // 중복 제거
  return [...new Set(keywords)].slice(0, 10);
}

/**
 * 생성된 콘텐츠 저장
 */
async function saveGeneratedContent(data: any): Promise<any> {
  const { data: saved, error } = await supabase
    .from(IntegrationConfig.calendarTables.main || 'cc_content_calendar')
    .insert({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      content_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1주일 후
      content_type: data.contentType,
      title: data.title,
      content_body: data.body,
      content_html: data.html,
      keywords: data.keywords,
      hashtags: data.hashtags,
      status: 'draft',
      campaign_id: data.campaign.id,
      theme: data.campaign.name,
      tone_and_manner: {
        hook: data.metadata.hook,
        cta: data.metadata.cta,
        principles: data.metadata.psychologyPrinciples
      },
      seo_meta: {
        title: data.title,
        description: data.body.substring(0, 160),
        keywords: data.keywords.join(', ')
      },
      source: 'ai_generated',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  // 품질 점수 저장
  await supabase
    .from('cc_quality_checks')
    .insert({
      content_id: saved.id,
      overall_score: data.qualityScore,
      checked_by: 'ai_system',
      approved: data.qualityScore >= 70,
      created_at: new Date().toISOString()
    });

  return saved;
}

/**
 * 캠페인 이미지 생성
 */
async function generateCampaignImage(
  contentId: string,
  hook: string
): Promise<void> {
  try {
    const imagePrompt = `
Professional golf marketing image for MASGOLF.
Theme: ${hook}
Style: Premium, elegant, senior-friendly
Elements: Golf driver, titanium finish, Korean senior golfer
Colors: Navy blue (#1e3a8a) and gold (#f59e0b)
Mood: Confident, successful, premium quality
    `.trim();

    const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.FAL_AI_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: imagePrompt,
        image_size: 'landscape_16_9',
        num_inference_steps: 4,
        num_images: 1
      })
    });

    if (response.ok) {
      const data = await response.json();
      const imageUrl = data.images[0].url;

      // 이미지 URL 업데이트
      await supabase
        .from(IntegrationConfig.calendarTables.main || 'cc_content_calendar')
        .update({ thumbnail_url: imageUrl })
        .eq('id', contentId);
    }
  } catch (error) {
    console.error('Image generation failed:', error);
  }
}

/**
 * 프롬프트 개선
 */
function improvePrompt(
  originalPrompt: string,
  issues: any[]
): string {
  let improvedPrompt = originalPrompt;
  
  // 이슈별 개선사항 추가
  issues.forEach(issue => {
    if (issue.category === '브랜드 준수') {
      improvedPrompt += '\n\n브랜드 가이드라인을 더 강조해주세요.';
    }
    if (issue.category === 'SEO') {
      improvedPrompt += '\n\n키워드를 자연스럽게 더 포함시켜주세요.';
    }
    if (issue.category === '가독성') {
      improvedPrompt += '\n\n문장을 더 짧고 명확하게 작성해주세요.';
    }
  });
  
  return improvedPrompt;
}

/**
 * 생성 로그 기록
 */
async function logGeneration(
  campaignId: string,
  generatedContents: any[]
): Promise<void> {
  try {
    await supabase
      .from('cc_ai_generation_logs')
      .insert({
        campaign_id: campaignId,
        prompt: 'Campaign auto-generation',
        model: 'gpt-4',
        tokens_used: generatedContents.length * 1500, // 추정치
        cost: generatedContents.length * 0.05, // 추정 비용
        response_quality_score: 
          generatedContents.reduce((sum, c) => sum + (c.qualityScore || 0), 0) / 
          generatedContents.length,
        status: 'success',
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to log generation:', error);
  }
}
