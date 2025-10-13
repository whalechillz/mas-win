// 기존 블로그 콘텐츠 스크래핑 API
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

    // URL에서 콘텐츠 스크래핑
    const scrapedData = await scrapeBlogContent(url);

    res.status(200).json({
      success: true,
      data: scrapedData
    });

  } catch (error) {
    console.error('스크래핑 오류:', error);
    res.status(500).json({ 
      error: '스크래핑 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
}

async function scrapeBlogContent(url) {
  try {
    // 웹페이지 가져오기
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();

    // 플랫폼별 파싱 로직
    const platform = detectPlatform(url);
    const parsedData = parseContentByPlatform(html, platform, url);

    return parsedData;

  } catch (error) {
    throw new Error(`스크래핑 실패: ${error.message}`);
  }
}

function detectPlatform(url) {
  if (url.includes('wix.com') || url.includes('mas9golf.com')) {
    return 'wix';
  } else if (url.includes('wordpress.com') || url.includes('wp-content')) {
    return 'wordpress';
  } else if (url.includes('tistory.com')) {
    return 'tistory';
  } else if (url.includes('blog.naver.com')) {
    return 'naver';
  } else {
    return 'generic';
  }
}

function parseContentByPlatform(html, platform, url) {
  switch (platform) {
    case 'wix':
      return parseWixContent(html, url);
    case 'wordpress':
      return parseWordPressContent(html, url);
    case 'tistory':
      return parseTistoryContent(html, url);
    case 'naver':
      return parseNaverContent(html, url);
    default:
      return parseGenericContent(html, url);
  }
}

function parseWixContent(html, url) {
  try {
    // Wix 특화 파싱 로직
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '제목 없음';

    // 본문 내용 추출 (Wix 구조에 맞게)
    const contentMatch = html.match(/<div[^>]*class="[^"]*blog-post-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
                        html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
                        html.match(/<div[^>]*class="[^"]*post-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    
    let content = contentMatch ? contentMatch[1] : '';

    // HTML 태그 정리
    content = cleanHtmlContent(content);

    // 이미지 URL 추출
    const imageMatches = html.match(/<img[^>]+src="([^"]+)"[^>]*>/gi) || [];
    const images = imageMatches.map(img => {
      const srcMatch = img.match(/src="([^"]+)"/);
      return srcMatch ? srcMatch[1] : null;
    }).filter(Boolean);

    // 메타데이터 추출
    const descriptionMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
    const description = descriptionMatch ? descriptionMatch[1] : '';

    return {
      title,
      content,
      images,
      description,
      originalUrl: url,
      platform: 'wix',
      scrapedAt: new Date().toISOString()
    };

  } catch (error) {
    throw new Error(`Wix 파싱 오류: ${error.message}`);
  }
}

function parseWordPressContent(html, url) {
  try {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '제목 없음';

    const contentMatch = html.match(/<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
                        html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    
    let content = contentMatch ? contentMatch[1] : '';
    content = cleanHtmlContent(content);

    const imageMatches = html.match(/<img[^>]+src="([^"]+)"[^>]*>/gi) || [];
    const images = imageMatches.map(img => {
      const srcMatch = img.match(/src="([^"]+)"/);
      return srcMatch ? srcMatch[1] : null;
    }).filter(Boolean);

    const descriptionMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
    const description = descriptionMatch ? descriptionMatch[1] : '';

    return {
      title,
      content,
      images,
      description,
      originalUrl: url,
      platform: 'wordpress',
      scrapedAt: new Date().toISOString()
    };

  } catch (error) {
    throw new Error(`WordPress 파싱 오류: ${error.message}`);
  }
}

function parseTistoryContent(html, url) {
  try {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '제목 없음';

    const contentMatch = html.match(/<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
                        html.match(/<div[^>]*class="[^"]*post-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    
    let content = contentMatch ? contentMatch[1] : '';
    content = cleanHtmlContent(content);

    const imageMatches = html.match(/<img[^>]+src="([^"]+)"[^>]*>/gi) || [];
    const images = imageMatches.map(img => {
      const srcMatch = img.match(/src="([^"]+)"/);
      return srcMatch ? srcMatch[1] : null;
    }).filter(Boolean);

    const descriptionMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
    const description = descriptionMatch ? descriptionMatch[1] : '';

    return {
      title,
      content,
      images,
      description,
      originalUrl: url,
      platform: 'tistory',
      scrapedAt: new Date().toISOString()
    };

  } catch (error) {
    throw new Error(`Tistory 파싱 오류: ${error.message}`);
  }
}

function parseNaverContent(html, url) {
  try {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '제목 없음';

    const contentMatch = html.match(/<div[^>]*class="[^"]*se-main-container[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
                        html.match(/<div[^>]*class="[^"]*post-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    
    let content = contentMatch ? contentMatch[1] : '';
    content = cleanHtmlContent(content);

    const imageMatches = html.match(/<img[^>]+src="([^"]+)"[^>]*>/gi) || [];
    const images = imageMatches.map(img => {
      const srcMatch = img.match(/src="([^"]+)"/);
      return srcMatch ? srcMatch[1] : null;
    }).filter(Boolean);

    const descriptionMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
    const description = descriptionMatch ? descriptionMatch[1] : '';

    return {
      title,
      content,
      images,
      description,
      originalUrl: url,
      platform: 'naver',
      scrapedAt: new Date().toISOString()
    };

  } catch (error) {
    throw new Error(`Naver 파싱 오류: ${error.message}`);
  }
}

function parseGenericContent(html, url) {
  try {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '제목 없음';

    // 일반적인 본문 추출 시도
    const contentMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
                        html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
                        html.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    
    let content = contentMatch ? contentMatch[1] : '';
    content = cleanHtmlContent(content);

    const imageMatches = html.match(/<img[^>]+src="([^"]+)"[^>]*>/gi) || [];
    const images = imageMatches.map(img => {
      const srcMatch = img.match(/src="([^"]+)"/);
      return srcMatch ? srcMatch[1] : null;
    }).filter(Boolean);

    const descriptionMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
    const description = descriptionMatch ? descriptionMatch[1] : '';

    return {
      title,
      content,
      images,
      description,
      originalUrl: url,
      platform: 'generic',
      scrapedAt: new Date().toISOString()
    };

  } catch (error) {
    throw new Error(`일반 파싱 오류: ${error.message}`);
  }
}

function cleanHtmlContent(html) {
  if (!html) return '';

  // HTML 태그 제거
  let cleaned = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned;
}
