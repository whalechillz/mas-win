/**
 * 간단한 블로그 마이그레이션 API (Playwright 없이)
 * HTTP 405 오류 해결을 위한 대안
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log('🚀 간단한 마이그레이션 시작:', url);

    // 간단한 스크래핑 (fetch 사용)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    
    // 간단한 파싱
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '제목 없음';

    // 이미지 URL 추출
    const imageMatches = html.match(/<img[^>]+src="([^"]+)"[^>]*>/gi) || [];
    const images = imageMatches.map(img => {
      const srcMatch = img.match(/src="([^"]+)"/);
      return srcMatch ? srcMatch[1] : null;
    }).filter(Boolean).slice(0, 5); // 최대 5개만

    // 고유 slug 생성
    const slug = await generateUniqueSlug(title);

    // 블로그 포스트 생성
    const blogPost = await createBlogPost({
      title: title,
      slug: slug,
      content: `마이그레이션된 콘텐츠: ${title}\n\n원본 URL: ${url}\n\n이미지 수: ${images.length}개`,
      excerpt: title.substring(0, 200) + '...',
      featured_image: images.length > 0 ? images[0] : '',
      category: '비거리 향상 드라이버',
      tags: ['마이그레이션', '간단버전'],
      status: 'published',
      author: '마쓰구골프'
    });

    res.status(200).json({
      success: true,
      data: {
        title,
        content: `마이그레이션된 콘텐츠: ${title}`,
        images: images.map((url, index) => ({
          originalUrl: url,
          storedUrl: url, // 원본 URL 사용
          alt: `이미지 ${index + 1}`,
          fileName: `image-${index + 1}`
        })),
        blogPost,
        originalUrl: url,
        platform: 'simple',
        migratedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('마이그레이션 오류:', error);
    res.status(500).json({ 
      error: '마이그레이션 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
}

async function generateUniqueSlug(title) {
  let baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s]/g, '') // 특수문자 제거
    .replace(/\s+/g, '-') // 공백을 하이픈으로
    .replace(/-+/g, '-') // 연속된 하이픈을 하나로
    .replace(/^-|-$/g, '') // 앞뒤 하이픈 제거
    .substring(0, 80); // 길이 제한
  
  let slug = baseSlug;
  
  // 중복 확인 및 고유 slug 생성
  while (true) {
    const { data: existing } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', slug)
      .single();
    
    if (!existing) {
      break; // 중복되지 않으면 사용
    }
    
    // 중복되면 타임스탬프 추가
    slug = `${baseSlug}-${Date.now()}`;
    break;
  }
  
  return slug;
}

async function createBlogPost(postData) {
  const { data, error } = await supabase
    .from('blog_posts')
    .insert([postData])
    .select()
    .single();
  
  if (error) {
    throw new Error(`블로그 포스트 생성 실패: ${error.message}`);
  }
  
  return data;
}
