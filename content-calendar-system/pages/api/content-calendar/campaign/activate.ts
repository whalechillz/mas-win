// Campaign Management API
// /pages/api/content-calendar/campaign/activate.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { ContentCalendarItem } from '@/types';
import { MASGOLF_CAMPAIGNS } from '@/data/masgolf-campaigns';
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

  const { campaignId, items, startDate } = req.body;

  if (!campaignId || !items || !startDate) {
    return res.status(400).json({ 
      error: 'Missing required parameters' 
    });
  }

  try {
    const campaign = MASGOLF_CAMPAIGNS.campaigns.find(c => c.id === campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // 캠페인 레코드 생성
    const { data: campaignData, error: campaignError } = await supabase
      .from(IntegrationConfig.calendarTables.campaigns || 'cc_campaigns')
      .insert({
        name: campaign.name,
        description: campaign.objectives.join(', '),
        start_date: startDate,
        end_date: calculateEndDate(startDate, campaign.duration),
        goals: {
          objectives: campaign.objectives,
          stage: campaign.stage,
          hook: campaign.hook
        },
        status: 'active'
      })
      .select()
      .single();

    if (campaignError) {
      throw campaignError;
    }

    // 각 콘텐츠 아이템 저장
    const savedItems = [];
    for (const item of items) {
      const dbItem = transformToDatabase({
        ...item,
        campaign_id: campaignData.id,
        theme: campaign.name,
        tone_and_manner: {
          tone: 'professional',
          voice: 'encouraging',
          style: campaign.psychologyPrinciples || [],
          emotions: ['trust', 'confidence']
        }
      });

      const { data, error } = await supabase
        .from(IntegrationConfig.calendarTables.main || 'cc_content_calendar')
        .insert(dbItem)
        .select()
        .single();

      if (error) {
        console.error('Failed to save item:', error);
        continue;
      }

      savedItems.push(data);

      // 콘텐츠별 템플릿 생성
      await createContentTemplate(data.id, campaign, item);
    }

    // 자동화 워크플로우 설정
    await setupAutomationWorkflow(campaignData.id, campaign);

    // 알림 설정
    await setupNotifications(campaignData.id, campaign);

    return res.status(200).json({
      success: true,
      campaign: campaignData,
      items: savedItems,
      message: `캠페인 "${campaign.name}"이(가) 활성화되었습니다. ${savedItems.length}개 콘텐츠가 생성되었습니다.`
    });

  } catch (error: any) {
    console.error('Campaign activation error:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to activate campaign' 
    });
  }
}

/**
 * 캠페인 종료일 계산
 */
function calculateEndDate(startDate: string, duration: any): string {
  const start = new Date(startDate);
  
  if (typeof duration === 'number') {
    start.setDate(start.getDate() + duration);
  } else if (duration === 'ongoing') {
    start.setFullYear(start.getFullYear() + 1); // 1년 후
  } else if (duration === 'monthly') {
    start.setMonth(start.getMonth() + 1);
  }
  
  return start.toISOString();
}

/**
 * 데이터베이스 형식으로 변환
 */
function transformToDatabase(item: ContentCalendarItem): any {
  return {
    year: item.year,
    month: item.month,
    week: item.week,
    content_date: item.contentDate,
    season: item.season,
    theme: item.theme,
    campaign_id: item.campaignId,
    content_type: item.contentType,
    title: item.title,
    subtitle: item.subtitle,
    description: item.description,
    target_audience: item.targetAudience,
    keywords: item.keywords,
    hashtags: item.hashtags,
    tone_and_manner: item.toneAndManner,
    content_body: item.contentBody,
    status: item.status || 'planned',
    priority: item.priority || 3,
    seo_meta: item.seoMeta,
    created_at: new Date().toISOString()
  };
}

/**
 * 콘텐츠 템플릿 생성
 */
async function createContentTemplate(
  contentId: string,
  campaign: any,
  item: ContentCalendarItem
): Promise<void> {
  try {
    // 캠페인과 콘텐츠 타입에 맞는 템플릿 생성
    const template = {
      name: `${campaign.name} - ${item.contentType}`,
      content_type: item.contentType,
      category: campaign.stage,
      template_body: generateTemplateBody(campaign, item.contentType),
      template_structure: {
        hook: campaign.hook,
        cta: campaign.cta,
        story: campaign.story,
        objectives: campaign.objectives
      },
      variables: {
        campaign_name: campaign.name,
        target_audience: 'MASGOLF_CAMPAIGNS.metadata.targetAudience'
      },
      tone_and_manner: {
        principles: campaign.psychologyPrinciples
      }
    };

    await supabase
      .from('cc_content_templates')
      .insert(template);
  } catch (error) {
    console.error('Template creation error:', error);
  }
}

/**
 * 템플릿 본문 생성
 */
function generateTemplateBody(campaign: any, contentType: string): string {
  const templates: { [key: string]: string } = {
    blog: `
# {title}

## 도입부
{hook}

## 문제 인식
{problem_description}

## 해결책 제시
- MASGOLF의 솔루션
- 구체적 혜택

## 성공 사례
{success_story}

## CTA
${campaign.cta.primary}
${campaign.cta.secondary || ''}
    `.trim(),
    
    social: `
{hook}

🎯 {main_message}

✨ {benefit_1}
✨ {benefit_2}
✨ {benefit_3}

👉 ${campaign.cta.primary}

#MASGOLF #시니어골프 {hashtags}
    `.trim(),
    
    email: `
<h2>{greeting}</h2>

<p>{hook}</p>

<div class="content">
  {main_content}
</div>

<div class="cta">
  <a href="{cta_link}" class="button">${campaign.cta.primary}</a>
</div>

<p class="footer">
  {closing_message}
</p>
    `.trim(),
    
    video: `
[0-5초: 훅]
{hook}

[5-15초: 문제 제시]
{problem}

[15-45초: 솔루션]
{solution}

[45-55초: 증거]
{proof}

[55-60초: CTA]
${campaign.cta.primary}
    `.trim(),
    
    funnel: `
<header>
  <h1>{headline}</h1>
  <p class="subheadline">{hook}</p>
</header>

<section class="problem">
  {problem_section}
</section>

<section class="solution">
  {solution_section}
</section>

<section class="proof">
  {social_proof}
</section>

<section class="cta">
  <button>${campaign.cta.primary}</button>
</section>
    `.trim()
  };

  return templates[contentType] || templates.blog;
}

/**
 * 자동화 워크플로우 설정
 */
async function setupAutomationWorkflow(
  campaignId: string,
  campaign: any
): Promise<void> {
  try {
    // 워크플로우 규칙 설정
    const workflow = {
      campaign_id: campaignId,
      name: `${campaign.name} Automation`,
      triggers: [
        {
          type: 'scheduled',
          schedule: 'daily',
          action: 'check_and_publish'
        },
        {
          type: 'event',
          event: 'content_approved',
          action: 'auto_publish'
        }
      ],
      actions: [
        {
          name: 'auto_generate',
          type: 'ai_generation',
          config: {
            tone: campaign.psychologyPrinciples,
            hook: campaign.hook
          }
        },
        {
          name: 'quality_check',
          type: 'validation',
          config: {
            minScore: 70
          }
        },
        {
          name: 'multi_channel_publish',
          type: 'publish',
          config: {
            channels: campaign.channels
          }
        }
      ],
      notifications: {
        onStart: true,
        onComplete: true,
        onError: true
      }
    };

    // 워크플로우 저장 (실제 구현에서는 별도 테이블 필요)
    console.log('Workflow setup:', workflow);
  } catch (error) {
    console.error('Workflow setup error:', error);
  }
}

/**
 * 알림 설정
 */
async function setupNotifications(
  campaignId: string,
  campaign: any
): Promise<void> {
  try {
    // 캠페인 관련 알림 설정
    const notifications = [
      {
        type: 'campaign_start',
        scheduled_at: new Date().toISOString(),
        message: `"${campaign.name}" 캠페인이 시작되었습니다.`
      },
      {
        type: 'content_reminder',
        scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        message: `"${campaign.name}" 콘텐츠 발행 예정입니다.`
      }
    ];

    // 알림 저장 (실제 구현에서는 notifications 테이블 사용)
    console.log('Notifications setup:', notifications);
  } catch (error) {
    console.error('Notification setup error:', error);
  }
}
