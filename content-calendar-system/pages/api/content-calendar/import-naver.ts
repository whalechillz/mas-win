// Naver Scraper Import API
// /pages/api/content-calendar/import-naver.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import IntegrationConfig from '@/lib/config/integration';
import { ContentCalendarItem } from '@/types';

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
        return handleImport(req, res);
      case 'GET':
        return handleGetScrapedPosts(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Naver import error:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * 네이버 스크랩 포스트 가져오기
 */
async function handleGetScrapedPosts(req: NextApiRequest, res: NextApiResponse) {
  const { notImported, limit = '50', search } = req.query;

  try {
    let query = supabase
      .from(IntegrationConfig.naverScraper.scrapedContentTable)
      .select('*')
      .order('scraped_at', { ascending: false })
      .limit(parseInt(limit as string));

    // 미가져온 포스트만 필터
    if (notImported === 'true') {
      query = query.eq('imported_to_calendar', false);
    }

    // 검색 필터
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // 응답 데이터 형식 변환
    const posts = (data || []).map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      originalUrl: post.original_url,
      scrapedAt: post.scraped_at,
      author: post.author || '네이버 블로거',
      tags: post.tags || [],
      images: post.image_urls || [],
      viewCount: post.view_count || 0,
      likeCount: post.like_count || 0,
      importedToCalendar: post.imported_to_calendar,
      calendarContentId: post.calendar_content_id
    }));

    return res.status(200).json({
      success: true,
      posts,
      total: posts.length
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * 네이버 스크랩 콘텐츠를 캘린더로 가져오기
 */
async function handleImport(req: NextApiRequest, res: NextApiResponse) {
  const { scrapedPostIds, options = {} } = req.body;

  if (!scrapedPostIds || !Array.isArray(scrapedPostIds)) {
    return res.status(400).json({ 
      error: 'scrapedPostIds array is required' 
    });
  }

  const imported: any[] = [];
  const failed: any[] = [];

  for (const postId of scrapedPostIds) {
    try {
      const result = await importSinglePost(postId, options);
      imported.push(result);
    } catch (error: any) {
      failed.push({ postId, error: error.message });
    }
  }

  return res.status(200).json({
    success: true,
    imported,
    failed,
    summary: {
      total: scrapedPostIds.length,
      succeeded: imported.length,
      failed: failed.length
    }
  });
}

/**
 * 단일 포스트 가져오기
 */
async function importSinglePost(
  scrapedPostId: string,
  options: any
): Promise<any> {
  // 스크랩 포스트 조회
  const { data: scrapedPost, error: fetchError } = await supabase
    .from(IntegrationConfig.naverScraper.scrapedContentTable)
    .select('*')
    .eq('id', scrapedPostId)
    .single();

  if (fetchError || !scrapedPost) {
    throw new Error('Scraped post not found');
  }

  // 이미 가져온 경우 스킵
  if (scrapedPost.imported_to_calendar && !options.force) {
    return {
      postId: scrapedPostId,
      status: 'already_imported',
      calendarContentId: scrapedPost.calendar_content_id
    };
  }

  // 콘텐츠 분석 및 향상
  const enhancedContent = await enhanceScrapedContent(scrapedPost);

  // 캘린더 콘텐츠 생성
  const calendarData = {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    week: Math.ceil(new Date().getDate() / 7),
    content_date: options.contentDate || new Date().toISOString(),
    season: getCurrentSeason(),
    
    // 콘텐츠 정보
    content_type: 'blog',
    title: enhancedContent.title,
    subtitle: enhancedContent.excerpt,
    description: enhancedContent.description,
    content_body: enhancedContent.content,
    content_html: enhancedContent.contentHtml,
    
    // 메타 정보
    keywords: enhancedContent.keywords,
    hashtags: enhancedContent.hashtags,
    thumbnail_url: scrapedPost.image_urls?.[0],
    
    // 상태
    status: options.autoApprove ? 'approved' : 'draft',
    priority: 3,
    
    // 연동 정보
    naver_scraper_id: scrapedPostId,
    source: 'naver_scraper',
    
    // SEO
    seo_meta: {
      originalUrl: scrapedPost.original_url,
      originalAuthor: scrapedPost.author,
      scrapedAt: scrapedPost.scraped_at,
      viewCount: scrapedPost.view_count,
      likeCount: scrapedPost.like_count
    },
    
    // 타겟 오디언스 (자동 분석)
    target_audience: analyzeTargetAudience(enhancedContent.content),
    
    // 톤앤매너 (자동 분석)
    tone_and_manner: analyzeToneAndManner(enhancedContent.content),
    
    created_by: options.userId || null
  };

  // 캘린더에 저장
  const { data: newContent, error: createError } = await supabase
    .from(IntegrationConfig.calendarTables.main)
    .insert(calendarData)
    .select()
    .single();

  if (createError) {
    throw new Error(`Failed to create calendar content: ${createError.message}`);
  }

  // 스크랩 테이블 업데이트
  await supabase
    .from(IntegrationConfig.naverScraper.scrapedContentTable)
    .update({
      imported_to_calendar: true,
      calendar_content_id: newContent.id,
      import_date: new Date().toISOString()
    })
    .eq('id', scrapedPostId);

  // 이미지 처리 (필요시)
  if (scrapedPost.image_urls && scrapedPost.image_urls.length > 0) {
    await processImages(newContent.id, scrapedPost.image_urls);
  }

  return {
    postId: scrapedPostId,
    status: 'imported',
    calendarContentId: newContent.id,
    title: newContent.title
  };
}

/**
 * 스크랩 콘텐츠 향상
 */
async function enhanceScrapedContent(scrapedPost: any): Promise<any> {
  // HTML 정제
  const cleanContent = cleanHtml(scrapedPost.content);
  
  // 요약 생성
  const excerpt = generateExcerpt(cleanContent, 200);
  
  // 키워드 추출
  const keywords = extractKeywords(cleanContent);
  
  // 해시태그 생성
  const hashtags = generateHashtags(keywords, scrapedPost.tags);
  
  // 제목 최적화
  const optimizedTitle = optimizeTitle(scrapedPost.title);
  
  return {
    title: optimizedTitle,
    excerpt,
    description: excerpt,
    content: cleanContent,
    contentHtml: convertToHtml(cleanContent),
    keywords,
    hashtags
  };
}

/**
 * 타겟 오디언스 분석
 */
function analyzeTargetAudience(content: string): any {
  // 간단한 키워드 기반 분석
  const seniorKeywords = ['시니어', '50대', '60대', '70대', '중년', '장년'];
  const beginnerKeywords = ['초보', '입문', '처음', '기초'];
  const advancedKeywords = ['프로', '상급', '전문', '고급'];
  
  const isSenior = seniorKeywords.some(k => content.includes(k));
  const isBeginner = beginnerKeywords.some(k => content.includes(k));
  const isAdvanced = advancedKeywords.some(k => content.includes(k));
  
  return {
    primary: isSenior ? '시니어 골퍼' : '일반 골퍼',
    ageRange: isSenior ? '50-70' : '30-60',
    skillLevel: isAdvanced ? '상급' : isBeginner ? '초급' : '중급',
    interests: ['골프', '장비', '기술 향상'],
    painPoints: extractPainPoints(content)
  };
}

/**
 * 톤앤매너 분석
 */
function analyzeToneAndManner(content: string): any {
  // 간단한 텍스트 분석
  const formalWords = ['습니다', '합니다', '있습니다'];
  const casualWords = ['해요', '있어요', '네요'];
  const technicalWords = ['스윙', '그립', '임팩트', '피니시'];
  
  const formalCount = formalWords.filter(w => content.includes(w)).length;
  const casualCount = casualWords.filter(w => content.includes(w)).length;
  const technicalCount = technicalWords.filter(w => content.includes(w)).length;
  
  return {
    tone: formalCount > casualCount ? 'professional' : 'casual',
    voice: technicalCount > 5 ? 'expert' : 'friendly',
    style: ['informative', 'engaging'],
    emotions: ['trust', 'confidence']
  };
}

/**
 * 헬퍼 함수들
 */
function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

function cleanHtml(html: string): string {
  // HTML 태그 제거 및 정제
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function generateExcerpt(content: string, maxLength: number): string {
  const cleanContent = content.substring(0, maxLength * 2);
  const sentences = cleanContent.split(/[.!?]+/);
  let excerpt = '';
  
  for (const sentence of sentences) {
    if (excerpt.length + sentence.length <= maxLength) {
      excerpt += sentence + '. ';
    } else {
      break;
    }
  }
  
  return excerpt.trim() || content.substring(0, maxLength) + '...';
}

function extractKeywords(content: string): string[] {
  // 간단한 키워드 추출
  const importantWords = [
    '골프', '드라이버', '아이언', '퍼터', '웨지',
    '스윙', '그립', '자세', '비거리', '정확도',
    'MASSGOO', '마스구', '티타늄', '샤프트'
  ];
  
  return importantWords.filter(word => 
    content.toLowerCase().includes(word.toLowerCase())
  );
}

function generateHashtags(keywords: string[], tags: string[]): string[] {
  const hashtags = [...keywords.slice(0, 5), ...tags.slice(0, 3)]
    .map(tag => tag.startsWith('#') ? tag : `#${tag}`)
    .filter((tag, index, self) => self.indexOf(tag) === index);
  
  // 기본 해시태그 추가
  if (!hashtags.includes('#골프')) hashtags.push('#골프');
  if (!hashtags.includes('#MASSGOO')) hashtags.push('#MASSGOO');
  
  return hashtags.slice(0, 10);
}

function optimizeTitle(title: string): string {
  // 제목 최적화
  title = title.trim();
  
  // 너무 긴 제목 단축
  if (title.length > 100) {
    title = title.substring(0, 97) + '...';
  }
  
  // 특수문자 정제
  title = title.replace(/[^\w\s가-힣]/g, ' ').replace(/\s+/g, ' ').trim();
  
  return title;
}

function convertToHtml(content: string): string {
  // 단락 분리
  const paragraphs = content.split('\n\n');
  return paragraphs
    .map(p => `<p>${p.trim()}</p>`)
    .join('\n');
}

function extractPainPoints(content: string): string[] {
  const painPointKeywords = [
    '어려움', '문제', '고민', '실수', '슬럼프',
    '비거리 감소', '정확도 문제', '일관성 부족'
  ];
  
  return painPointKeywords.filter(keyword => content.includes(keyword));
}

async function processImages(contentId: string, imageUrls: string[]): Promise<void> {
  // 이미지 다운로드 및 저장 로직
  // 실제 구현에서는 이미지를 다운로드하여 Supabase Storage에 저장
  console.log(`Processing ${imageUrls.length} images for content ${contentId}`);
}
