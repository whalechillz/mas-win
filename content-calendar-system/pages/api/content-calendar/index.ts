// Content Calendar API
// /pages/api/content-calendar/index.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { 
  ContentCalendarItem,
  ApiResponse,
  FilterParams,
  PaginationParams 
} from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<ContentCalendarItem[] | ContentCalendarItem>>
) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return handleGet(req, res);
      case 'POST':
        return handlePost(req, res);
      case 'PUT':
        return handlePut(req, res);
      case 'DELETE':
        return handleDelete(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({
          success: false,
          error: `Method ${method} not allowed`
        });
    }
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}

// =====================================================
// GET - 콘텐츠 목록 조회
// =====================================================
async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<ContentCalendarItem[]>>
) {
  const {
    page = '1',
    limit = '20',
    sortBy = 'content_date',
    sortOrder = 'desc',
    contentType,
    status,
    dateRangeStart,
    dateRangeEnd,
    search
  } = req.query;

  // 쿼리 빌더 시작
  let query = supabase
    .from('content_calendar')
    .select('*', { count: 'exact' });

  // 필터 적용
  if (contentType) {
    const types = Array.isArray(contentType) ? contentType : [contentType];
    query = query.in('content_type', types);
  }

  if (status) {
    const statuses = Array.isArray(status) ? status : [status];
    query = query.in('status', statuses);
  }

  if (dateRangeStart) {
    query = query.gte('content_date', dateRangeStart as string);
  }

  if (dateRangeEnd) {
    query = query.lte('content_date', dateRangeEnd as string);
  }

  if (search) {
    query = query.or(
      `title.ilike.%${search}%,subtitle.ilike.%${search}%,content_body.ilike.%${search}%`
    );
  }

  // 정렬 적용
  query = query.order(sortBy as string, { ascending: sortOrder === 'asc' });

  // 페이지네이션 적용
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const from = (pageNum - 1) * limitNum;
  const to = from + limitNum - 1;
  
  query = query.range(from, to);

  // 쿼리 실행
  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  // 응답 데이터 변환 (snake_case to camelCase)
  const transformedData = (data || []).map(transformDatabaseToAPI);

  return res.status(200).json({
    success: true,
    data: transformedData,
    metadata: {
      total: count || 0,
      page: pageNum,
      limit: limitNum
    }
  });
}

// =====================================================
// POST - 새 콘텐츠 생성
// =====================================================
async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<ContentCalendarItem>>
) {
  const contentData = req.body;

  // 유효성 검사
  if (!contentData.title || !contentData.contentType || !contentData.contentDate) {
    return res.status(400).json({
      success: false,
      error: 'Required fields missing: title, contentType, contentDate'
    });
  }

  // 데이터베이스 형식으로 변환
  const dbData = transformAPIToDatabase(contentData);

  // 데이터 삽입
  const { data, error } = await supabase
    .from('content_calendar')
    .insert([dbData])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return res.status(201).json({
    success: true,
    data: transformDatabaseToAPI(data)
  });
}

// =====================================================
// PUT - 콘텐츠 수정
// =====================================================
async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<ContentCalendarItem>>
) {
  const { id, ...contentData } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Content ID is required'
    });
  }

  // 데이터베이스 형식으로 변환
  const dbData = transformAPIToDatabase(contentData);
  
  // 업데이트 시간 추가
  dbData.updated_at = new Date().toISOString();

  // 데이터 업데이트
  const { data, error } = await supabase
    .from('content_calendar')
    .update(dbData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // 버전 관리 - 새 버전 생성
  await createContentVersion(id, contentData);

  return res.status(200).json({
    success: true,
    data: transformDatabaseToAPI(data)
  });
}

// =====================================================
// DELETE - 콘텐츠 삭제
// =====================================================
async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<void>>
) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Content ID is required'
    });
  }

  // Soft delete - status를 'archived'로 변경
  const { error } = await supabase
    .from('content_calendar')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    throw error;
  }

  return res.status(200).json({
    success: true,
    message: 'Content archived successfully'
  });
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * 데이터베이스 형식을 API 형식으로 변환
 */
function transformDatabaseToAPI(dbData: any): ContentCalendarItem {
  return {
    id: dbData.id,
    year: dbData.year,
    month: dbData.month,
    week: dbData.week,
    contentDate: new Date(dbData.content_date),
    season: dbData.season,
    theme: dbData.theme,
    campaignId: dbData.campaign_id,
    contentType: dbData.content_type,
    title: dbData.title,
    subtitle: dbData.subtitle,
    description: dbData.description,
    targetAudience: dbData.target_audience,
    keywords: dbData.keywords,
    hashtags: dbData.hashtags,
    toneAndManner: dbData.tone_and_manner,
    contentBody: dbData.content_body,
    contentHtml: dbData.content_html,
    thumbnailUrl: dbData.thumbnail_url,
    status: dbData.status,
    priority: dbData.priority,
    assignedTo: dbData.assigned_to,
    reviewedBy: dbData.reviewed_by,
    approvedBy: dbData.approved_by,
    publishedAt: dbData.published_at ? new Date(dbData.published_at) : undefined,
    publishedChannels: dbData.published_channels || [],
    performanceMetrics: dbData.performance_metrics || {},
    seoMeta: dbData.seo_meta || {},
    createdBy: dbData.created_by,
    createdAt: dbData.created_at ? new Date(dbData.created_at) : undefined,
    updatedAt: dbData.updated_at ? new Date(dbData.updated_at) : undefined
  };
}

/**
 * API 형식을 데이터베이스 형식으로 변환
 */
function transformAPIToDatabase(apiData: any): any {
  return {
    year: apiData.year,
    month: apiData.month,
    week: apiData.week,
    content_date: apiData.contentDate,
    season: apiData.season,
    theme: apiData.theme,
    campaign_id: apiData.campaignId,
    content_type: apiData.contentType,
    title: apiData.title,
    subtitle: apiData.subtitle,
    description: apiData.description,
    target_audience: apiData.targetAudience,
    keywords: apiData.keywords,
    hashtags: apiData.hashtags,
    tone_and_manner: apiData.toneAndManner,
    content_body: apiData.contentBody,
    content_html: apiData.contentHtml,
    thumbnail_url: apiData.thumbnailUrl,
    status: apiData.status,
    priority: apiData.priority,
    assigned_to: apiData.assignedTo,
    reviewed_by: apiData.reviewedBy,
    approved_by: apiData.approvedBy,
    published_at: apiData.publishedAt,
    published_channels: apiData.publishedChannels,
    performance_metrics: apiData.performanceMetrics,
    seo_meta: apiData.seoMeta,
    created_by: apiData.createdBy
  };
}

/**
 * 콘텐츠 버전 생성
 */
async function createContentVersion(
  contentId: string,
  contentData: any
): Promise<void> {
  try {
    // 현재 최신 버전 번호 조회
    const { data: versions } = await supabase
      .from('content_versions')
      .select('version_number')
      .eq('content_id', contentId)
      .order('version_number', { ascending: false })
      .limit(1);

    const nextVersion = versions && versions.length > 0 
      ? versions[0].version_number + 1 
      : 1;

    // 새 버전 생성
    await supabase
      .from('content_versions')
      .insert({
        content_id: contentId,
        version_number: nextVersion,
        title: contentData.title,
        content_body: contentData.contentBody,
        content_html: contentData.contentHtml,
        changes_summary: `Version ${nextVersion} - Updated at ${new Date().toLocaleString()}`,
        edited_by: contentData.updatedBy || 'system'
      });
  } catch (error) {
    console.error('버전 생성 실패:', error);
    // 버전 생성 실패는 메인 프로세스를 중단하지 않음
  }
}
