// Content Calendar Publish API
// /pages/api/content-calendar/publish.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { ContentCalendarItem, Channel, ApiResponse } from '@/types';
import ContentAutomationWorkflow from '@/lib/workflows/content-workflow';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<any>>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  const { contentId, channels } = req.body;

  if (!contentId) {
    return res.status(400).json({
      success: false,
      error: 'Content ID is required'
    });
  }

  try {
    // 콘텐츠 조회
    const { data: content, error: fetchError } = await supabase
      .from('content_calendar')
      .select('*')
      .eq('id', contentId)
      .single();

    if (fetchError || !content) {
      throw new Error('Content not found');
    }

    // 상태 확인
    if (content.status !== 'approved') {
      return res.status(400).json({
        success: false,
        error: 'Content must be approved before publishing'
      });
    }

    // 워크플로우 인스턴스 생성
    const workflow = new ContentAutomationWorkflow({
      aiApiKey: process.env.OPENAI_API_KEY!,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_KEY!
    });

    // 채널별 발행
    const publishResults = await workflow.publishToChannels(content);

    // 발행 성공한 채널 기록
    const successfulChannels = publishResults
      .filter(r => r.success)
      .map(r => ({
        channel: r.channel,
        url: r.url,
        publishedAt: new Date()
      }));

    // 콘텐츠 상태 업데이트
    const { error: updateError } = await supabase
      .from('content_calendar')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        published_channels: successfulChannels,
        updated_at: new Date().toISOString()
      })
      .eq('id', contentId);

    if (updateError) {
      throw updateError;
    }

    // 발행 로그 기록
    await recordPublishingLog(contentId, publishResults);

    return res.status(200).json({
      success: true,
      data: {
        contentId,
        publishedChannels: successfulChannels.map(c => c.channel),
        results: publishResults
      }
    });

  } catch (error: any) {
    console.error('Publishing error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to publish content'
    });
  }
}

async function recordPublishingLog(
  contentId: string,
  results: any[]
): Promise<void> {
  const logs = results.map(result => ({
    content_id: contentId,
    channel: result.channel,
    success: result.success,
    url: result.url,
    error: result.error,
    published_at: new Date().toISOString()
  }));

  await supabase.from('publishing_logs').insert(logs);
}
