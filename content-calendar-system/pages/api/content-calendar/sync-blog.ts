// Blog System Sync API
// /pages/api/content-calendar/sync-blog.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import IntegrationConfig from '@/lib/config/integration';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  try {
    switch (method) {
      case 'POST':
        return handleSync(req, res);
      case 'GET':
        return handleCheckSync(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Blog sync error:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * 콘텐츠 캘린더와 블로그 시스템 동기화
 */
async function handleSync(req: NextApiRequest, res: NextApiResponse) {
  const { contentId, action, direction } = req.body;

  // direction: 'calendar_to_blog' | 'blog_to_calendar'
  if (!contentId || !action || !direction) {
    return res.status(400).json({ 
      error: 'Missing required parameters: contentId, action, direction' 
    });
  }

  try {
    if (direction === 'calendar_to_blog') {
      return await syncCalendarToBlog(contentId, action, res);
    } else {
      return await syncBlogToCalendar(contentId, action, res);
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * 캘린더 → 블로그 동기화
 */
async function syncCalendarToBlog(
  contentId: string,
  action: string,
  res: NextApiResponse
) {
  // 캘린더 콘텐츠 조회
  const { data: calendarContent, error: fetchError } = await supabase
    .from(IntegrationConfig.calendarTables.main)
    .select('*')
    .eq('id', contentId)
    .single();

  if (fetchError || !calendarContent) {
    return res.status(404).json({ error: 'Content not found in calendar' });
  }

  // 콘텐츠 타입이 블로그가 아니면 스킵
  if (calendarContent.content_type !== 'blog') {
    return res.status(400).json({ 
      error: 'Only blog content can be synced to blog system' 
    });
  }

  let blogPostId = calendarContent.blog_post_id;

  switch (action) {
    case 'create':
      // 블로그 포스트 생성
      const { data: newPost, error: createError } = await supabase
        .from(IntegrationConfig.blogIntegration.postsTable)
        .insert({
          title: calendarContent.title,
          content: calendarContent.content_body,
          excerpt: calendarContent.subtitle,
          status: mapStatusToBlogs(calendarContent.status),
          tags: calendarContent.keywords,
          featured_image: calendarContent.thumbnail_url,
          calendar_content_id: contentId,
          sync_from_calendar: true,
          author_id: calendarContent.created_by,
          published_at: calendarContent.published_at
        })
        .select()
        .single();

      if (createError) {
        return res.status(500).json({ error: createError.message });
      }

      // 캘린더 테이블에 블로그 포스트 ID 업데이트
      await supabase
        .from(IntegrationConfig.calendarTables.main)
        .update({ blog_post_id: newPost.id })
        .eq('id', contentId);

      blogPostId = newPost.id;
      break;

    case 'update':
      if (!blogPostId) {
        // 블로그 포스트가 없으면 생성
        return syncCalendarToBlog(contentId, 'create', res);
      }

      // 블로그 포스트 업데이트
      const { error: updateError } = await supabase
        .from(IntegrationConfig.blogIntegration.postsTable)
        .update({
          title: calendarContent.title,
          content: calendarContent.content_body,
          excerpt: calendarContent.subtitle,
          status: mapStatusToBlogs(calendarContent.status),
          tags: calendarContent.keywords,
          featured_image: calendarContent.thumbnail_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', blogPostId);

      if (updateError) {
        return res.status(500).json({ error: updateError.message });
      }
      break;

    case 'delete':
      if (!blogPostId) {
        return res.status(200).json({ 
          message: 'No blog post to delete' 
        });
      }

      // 블로그 포스트 삭제 (soft delete)
      const { error: deleteError } = await supabase
        .from(IntegrationConfig.blogIntegration.postsTable)
        .update({ 
          deleted_at: new Date().toISOString(),
          status: 'archived'
        })
        .eq('id', blogPostId);

      if (deleteError) {
        return res.status(500).json({ error: deleteError.message });
      }
      break;
  }

  return res.status(200).json({
    success: true,
    message: `Successfully synced to blog system`,
    blogPostId,
    action
  });
}

/**
 * 블로그 → 캘린더 동기화
 */
async function syncBlogToCalendar(
  blogPostId: string,
  action: string,
  res: NextApiResponse
) {
  // 블로그 포스트 조회
  const { data: blogPost, error: fetchError } = await supabase
    .from(IntegrationConfig.blogIntegration.postsTable)
    .select('*')
    .eq('id', blogPostId)
    .single();

  if (fetchError || !blogPost) {
    return res.status(404).json({ error: 'Blog post not found' });
  }

  let calendarContentId = blogPost.calendar_content_id;

  switch (action) {
    case 'create':
      // 캘린더 콘텐츠 생성
      const { data: newContent, error: createError } = await supabase
        .from(IntegrationConfig.calendarTables.main)
        .insert({
          year: new Date(blogPost.published_at || Date.now()).getFullYear(),
          month: new Date(blogPost.published_at || Date.now()).getMonth() + 1,
          content_date: blogPost.published_at || new Date().toISOString(),
          content_type: 'blog',
          title: blogPost.title,
          subtitle: blogPost.excerpt,
          content_body: blogPost.content,
          thumbnail_url: blogPost.featured_image,
          keywords: blogPost.tags || [],
          status: mapStatusToCalendar(blogPost.status),
          blog_post_id: blogPostId,
          source: 'blog_import',
          created_by: blogPost.author_id,
          published_at: blogPost.published_at
        })
        .select()
        .single();

      if (createError) {
        return res.status(500).json({ error: createError.message });
      }

      // 블로그 테이블에 캘린더 ID 업데이트
      await supabase
        .from(IntegrationConfig.blogIntegration.postsTable)
        .update({ calendar_content_id: newContent.id })
        .eq('id', blogPostId);

      calendarContentId = newContent.id;
      break;

    case 'update':
      if (!calendarContentId) {
        // 캘린더 콘텐츠가 없으면 생성
        return syncBlogToCalendar(blogPostId, 'create', res);
      }

      // 캘린더 콘텐츠 업데이트
      const { error: updateError } = await supabase
        .from(IntegrationConfig.calendarTables.main)
        .update({
          title: blogPost.title,
          subtitle: blogPost.excerpt,
          content_body: blogPost.content,
          thumbnail_url: blogPost.featured_image,
          keywords: blogPost.tags || [],
          status: mapStatusToCalendar(blogPost.status),
          updated_at: new Date().toISOString()
        })
        .eq('id', calendarContentId);

      if (updateError) {
        return res.status(500).json({ error: updateError.message });
      }
      break;

    case 'delete':
      if (!calendarContentId) {
        return res.status(200).json({ 
          message: 'No calendar content to delete' 
        });
      }

      // 캘린더 콘텐츠 삭제 (soft delete)
      const { error: deleteError } = await supabase
        .from(IntegrationConfig.calendarTables.main)
        .update({ 
          deleted_at: new Date().toISOString(),
          status: 'archived'
        })
        .eq('id', calendarContentId);

      if (deleteError) {
        return res.status(500).json({ error: deleteError.message });
      }
      break;
  }

  return res.status(200).json({
    success: true,
    message: `Successfully synced to calendar system`,
    calendarContentId,
    action
  });
}

/**
 * 동기화 상태 확인
 */
async function handleCheckSync(req: NextApiRequest, res: NextApiResponse) {
  const { contentId, blogPostId } = req.query;

  try {
    let syncStatus;

    if (contentId) {
      // 캘린더 콘텐츠 기준으로 확인
      const { data } = await supabase
        .from(IntegrationConfig.calendarTables.main)
        .select('id, blog_post_id, status, updated_at')
        .eq('id', contentId)
        .single();

      syncStatus = {
        calendarContentId: data?.id,
        blogPostId: data?.blog_post_id,
        isSynced: !!data?.blog_post_id,
        lastUpdated: data?.updated_at
      };
    } else if (blogPostId) {
      // 블로그 포스트 기준으로 확인
      const { data } = await supabase
        .from(IntegrationConfig.blogIntegration.postsTable)
        .select('id, calendar_content_id, status, updated_at')
        .eq('id', blogPostId)
        .single();

      syncStatus = {
        blogPostId: data?.id,
        calendarContentId: data?.calendar_content_id,
        isSynced: !!data?.calendar_content_id,
        lastUpdated: data?.updated_at
      };
    } else {
      return res.status(400).json({ 
        error: 'Either contentId or blogPostId is required' 
      });
    }

    return res.status(200).json(syncStatus);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * 상태 매핑 함수들
 */
function mapStatusToBlogs(calendarStatus: string): string {
  const statusMap: { [key: string]: string } = {
    'planned': 'draft',
    'draft': 'draft',
    'review': 'pending',
    'approved': 'scheduled',
    'published': 'published',
    'archived': 'archived'
  };
  return statusMap[calendarStatus] || 'draft';
}

function mapStatusToCalendar(blogStatus: string): string {
  const statusMap: { [key: string]: string } = {
    'draft': 'draft',
    'pending': 'review',
    'scheduled': 'approved',
    'published': 'published',
    'archived': 'archived'
  };
  return statusMap[blogStatus] || 'draft';
}
