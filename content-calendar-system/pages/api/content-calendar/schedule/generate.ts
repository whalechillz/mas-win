// Annual Schedule Generation API
// /pages/api/content-calendar/schedule/generate.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { ANNUAL_MARKETING_CALENDAR } from '@/data/annual-marketing-calendar';
import { MASGOLF_CAMPAIGNS, convertCampaignToCalendarItems } from '@/data/masgolf-campaigns';
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

  const { year, schedule, autoActivate } = req.body;

  if (!year || !schedule) {
    return res.status(400).json({ 
      error: 'Year and schedule are required' 
    });
  }

  try {
    const savedItems = [];
    const errors = [];

    // 연간 일정 처리
    for (const item of schedule) {
      try {
        if (item.type === 'campaign') {
          // 캠페인 활성화
          const result = await activateCampaign(item, year);
          savedItems.push(result);
        } else if (item.type === 'content') {
          // 콘텐츠 일정 생성
          const result = await scheduleContent(item, year);
          savedItems.push(result);
        }
      } catch (error: any) {
        errors.push({
          item: item.name || item.type,
          error: error.message
        });
      }
    }

    // 자동화 규칙 설정
    if (autoActivate) {
      await setupYearlyAutomation(year);
    }

    // 연간 계획 레코드 생성 (테이블이 있다고 가정)
    const yearlyPlanData = {
      year,
      total_campaigns: schedule.filter((s: any) => s.type === 'campaign').length,
      total_content: schedule.filter((s: any) => s.type === 'content').length,
      automation_enabled: autoActivate,
      created_at: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      year,
      savedItems: savedItems.length,
      errors: errors.length,
      yearlyPlan: yearlyPlanData,
      message: `${year}년 연간 일정이 생성되었습니다. (성공: ${savedItems.length}, 실패: ${errors.length})`
    });

  } catch (error: any) {
    console.error('Schedule generation error:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to generate schedule' 
    });
  }
}

/**
 * 캠페인 활성화
 */
async function activateCampaign(item: any, year: number): Promise<any> {
  const campaign = MASGOLF_CAMPAIGNS.campaigns.find(c => c.id === item.campaignId);
  if (!campaign) {
    throw new Error(`Campaign not found: ${item.campaignId}`);
  }

  // 캠페인 레코드 생성
  const { data: campaignData, error: campaignError } = await supabase
    .from(IntegrationConfig.calendarTables.campaigns)
    .insert({
      name: campaign.name,
      description: campaign.objectives.join(', '),
      start_date: item.startDate,
      end_date: item.endDate,
      budget: calculateCampaignBudget(campaign),
      goals: {
        objectives: campaign.objectives,
        stage: campaign.stage,
        hook: campaign.hook,
        kpi: getSeasonalKPI(item.month)
      },
      target_metrics: {
        reach: campaign.metrics?.targetReach || 10000,
        engagement: campaign.metrics?.targetEngagement || 1000,
        conversion: campaign.metrics?.targetConversion || 100
      },
      status: 'scheduled',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (campaignError) {
    throw campaignError;
  }

  // 캠페인 콘텐츠 생성
  const calendarItems = convertCampaignToCalendarItems(
    item.campaignId,
    new Date(item.startDate)
  );

  for (const calendarItem of calendarItems) {
    await supabase
      .from(IntegrationConfig.calendarTables.main)
      .insert({
        ...transformToDatabase(calendarItem),
        campaign_id: campaignData.id,
        year,
        month: item.month
      });
  }

  return {
    type: 'campaign',
    id: campaignData.id,
    name: campaign.name,
    status: 'scheduled'
  };
}

/**
 * 콘텐츠 일정 생성
 */
async function scheduleContent(item: any, year: number): Promise<any> {
  const contentData = {
    year,
    month: item.month,
    content_date: item.date,
    content_type: mapChannelToContentType(item.channel),
    title: `[${item.theme}] ${item.channel} 콘텐츠`,
    theme: item.theme,
    status: 'planned',
    priority: getPriorityByFrequency(item.frequency),
    source: 'annual_schedule',
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from(IntegrationConfig.calendarTables.main)
    .insert(contentData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return {
    type: 'content',
    id: data.id,
    channel: item.channel,
    date: item.date,
    status: 'scheduled'
  };
}

/**
 * 연간 자동화 설정
 */
async function setupYearlyAutomation(year: number): Promise<void> {
  const automationRules = ANNUAL_MARKETING_CALENDAR.automationRules;

  // 각 트리거별로 자동화 작업 생성
  for (const trigger of automationRules.triggers.seasonal) {
    await createAutomationJob({
      type: 'seasonal',
      trigger: trigger.condition,
      action: trigger.action,
      year,
      active: true
    });
  }

  for (const trigger of automationRules.triggers.performance) {
    await createAutomationJob({
      type: 'performance',
      trigger: trigger.condition,
      action: trigger.action,
      year,
      active: true
    });
  }

  // 워크플로우 설정
  for (const [series, config] of Object.entries(automationRules.workflows.contentSeries)) {
    await createContentSeriesWorkflow(series, config as any, year);
  }
}

/**
 * 자동화 작업 생성
 */
async function createAutomationJob(job: any): Promise<void> {
  // 실제 구현에서는 cron job이나 scheduled functions 사용
  console.log('Creating automation job:', job);
  
  // 자동화 로그만 남김 (테이블이 없을 수 있으므로)
  console.log('Automation job scheduled:', {
    type: job.type,
    trigger: job.trigger,
    action: job.action,
    year: job.year
  });
}

/**
 * 콘텐츠 시리즈 워크플로우 생성
 */
async function createContentSeriesWorkflow(
  seriesName: string,
  config: { months: number[], frequency: string },
  year: number
): Promise<void> {
  for (const month of config.months) {
    const dates = generateContentDates(year, month, config.frequency);
    
    for (const date of dates) {
      await supabase
        .from(IntegrationConfig.calendarTables.main)
        .insert({
          year,
          month,
          content_date: date,
          content_type: 'blog',
          title: `[${seriesName}] 시리즈`,
          theme: seriesName,
          status: 'planned',
          source: 'workflow',
          created_at: new Date().toISOString()
        });
    }
  }
}

// =====================================================
// Helper Functions
// =====================================================

function calculateCampaignBudget(campaign: any): number {
  const baseBudget = {
    awareness: 1000000,
    interest: 1500000,
    trust: 2000000,
    conversion: 3000000,
    retention: 2500000
  };
  
  return baseBudget[campaign.stage as keyof typeof baseBudget] || 1500000;
}

function getSeasonalKPI(month: number): any {
  const season = month >= 3 && month <= 5 ? 'spring' :
                month >= 6 && month <= 8 ? 'summer' :
                month >= 9 && month <= 11 ? 'autumn' : 'winter';
  
  const kpiMap = {
    spring: { primary: '비거리 향상', secondary: '신규 고객' },
    summer: { primary: '건강 관리', secondary: '커뮤니티 참여' },
    autumn: { primary: '매출 성장', secondary: '프리미엄 전환' },
    winter: { primary: '고객 유지', secondary: '재구매율' }
  };
  
  return kpiMap[season];
}

function mapChannelToContentType(channel: string): string {
  const mapping: { [key: string]: string } = {
    blog: 'blog',
    email: 'email',
    kakao: 'social',
    social: 'social',
    facebook: 'social',
    instagram: 'social'
  };
  
  return mapping[channel] || 'blog';
}

function getPriorityByFrequency(frequency: string): number {
  const priorityMap: { [key: string]: number } = {
    daily: 1,
    'twice-weekly': 2,
    weekly: 3,
    biweekly: 4,
    monthly: 5
  };
  
  return priorityMap[frequency] || 3;
}

function generateContentDates(year: number, month: number, frequency: string): Date[] {
  const dates: Date[] = [];
  
  switch (frequency) {
    case 'weekly':
      for (let week = 0; week < 4; week++) {
        dates.push(new Date(year, month - 1, 7 + (week * 7)));
      }
      break;
    case 'biweekly':
      dates.push(new Date(year, month - 1, 14));
      dates.push(new Date(year, month - 1, 28));
      break;
    case 'monthly':
      dates.push(new Date(year, month - 1, 15));
      break;
  }
  
  return dates;
}

function transformToDatabase(item: any): any {
  return {
    year: item.year,
    month: item.month,
    week: Math.ceil(new Date(item.contentDate).getDate() / 7),
    content_date: item.contentDate,
    season: item.season,
    theme: item.theme,
    content_type: item.contentType,
    title: item.title,
    subtitle: item.subtitle,
    description: item.description,
    keywords: item.keywords,
    hashtags: item.hashtags,
    target_audience: item.targetAudience,
    tone_and_manner: item.toneAndManner,
    status: item.status || 'planned',
    priority: item.priority || 3,
    seo_meta: item.seoMeta
  };
}
