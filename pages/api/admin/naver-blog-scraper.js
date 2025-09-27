import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { blogId, postUrls, options = {} } = req.body;

  if (!blogId && !postUrls) {
    return res.status(400).json({ error: '블로그 ID 또는 포스트 URL이 필요합니다.' });
  }

  try {
    console.log('🔵 네이버 블로그 스크래핑 시작:', { blogId, postUrls });

    let posts = [];

    if (blogId) {
      // 1. 블로그 ID로 RSS 피드에서 포스트 목록 가져오기
      posts = await getBlogPostsFromRSS(blogId);
    } else if (postUrls && Array.isArray(postUrls)) {
      // 2. 직접 제공된 포스트 URL들 처리
      posts = await scrapeMultiplePosts(postUrls);
    }

    // 3. 각 포스트 상세 정보 수집
    const detailedPosts = await Promise.all(
      posts.map(async (post) => {
        try {
          const postData = await scrapeNaverPost(post.url || post);
          return {
            ...post,
            title: postData.title,
            content: postData.content,
            images: postData.images,
            publishDate: postData.publishDate,
            naverPostId: extractPostId(post.url || post),
            originalUrl: post.url || post,
            scrapedAt: new Date().toISOString()
          };
        } catch (error) {
          console.error(`포스트 스크래핑 실패: ${post.url || post}`, error);
          return {
            ...post,
            error: error.message,
            originalUrl: post.url || post
          };
        }
      })
    );

    // 4. 성공한 포스트와 실패한 포스트 분리
    const successfulPosts = detailedPosts.filter(post => !post.error);
    const failedPosts = detailedPosts.filter(post => post.error);

    console.log(`✅ ${successfulPosts.length}개 포스트 성공, ${failedPosts.length}개 실패`);

    res.status(200).json({
      success: true,
      totalPosts: detailedPosts.length,
      successfulPosts: successfulPosts.length,
      failedPosts: failedPosts.length,
      posts: detailedPosts,
      message: `총 ${detailedPosts.length}개 포스트 중 ${successfulPosts.length}개 성공적으로 스크래핑되었습니다.`
    });

  } catch (error) {
    console.error('네이버 블로그 스크래핑 오류:', error);
    
    res.status(500).json({ 
      error: '네이버 블로그 스크래핑 중 오류가 발생했습니다.',
      details: error.message,
      originalError: error.message
    });
  }
}

// RSS 피드에서 포스트 목록 가져오기
async function getBlogPostsFromRSS(blogId) {
  try {
    const rssUrl = `https://rss.blog.naver.com/${blogId}.xml`;
    console.log('📡 RSS 피드 가져오기:', rssUrl);
    
    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NaverBlogScraper/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml'
      },
      timeout: 15000
    });

    if (!response.ok) {
      throw new Error(`RSS 피드 로드 실패: ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();
    
    // 간단한 XML 파싱 (정규식 사용)
    const postUrls = [];
    const linkRegex = /<link><!\[CDATA\[([^\]]+)\]\]><\/link>/g;
    let match;
    
    while ((match = linkRegex.exec(xmlText)) !== null) {
      const url = match[1];
      if (url && url.includes('blog.naver.com')) {
        postUrls.push({
          url: url,
          title: extractTitleFromRSS(xmlText, url),
          publishDate: extractDateFromRSS(xmlText, url)
        });
      }
    }

    console.log(`📝 RSS에서 ${postUrls.length}개 포스트 발견`);
    return postUrls;
    
  } catch (error) {
    console.error('RSS 피드 처리 오류:', error);
    throw new Error(`RSS 피드 처리 실패: ${error.message}`);
  }
}

// 여러 포스트 스크래핑
async function scrapeMultiplePosts(postUrls) {
  return postUrls.map(url => ({
    url: url,
    title: '',
    publishDate: null
  }));
}

// 네이버 블로그 포스트 상세 스크래핑
async function scrapeNaverPost(url) {
  try {
    console.log('📄 포스트 스크래핑:', url);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      },
      timeout: 30000,
      redirect: 'follow',
      follow: 5
    });

    if (!response.ok) {
      throw new Error(`포스트 로드 실패: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    
    // 네이버 블로그 특화 파싱
    const title = extractNaverTitle(html);
    const content = extractNaverContent(html);
    const images = extractNaverImages(html);
    const publishDate = extractNaverPublishDate(html);

    return {
      title,
      content,
      images,
      publishDate
    };
    
  } catch (error) {
    console.error('포스트 스크래핑 오류:', error);
    throw error;
  }
}

// 네이버 블로그 제목 추출
function extractNaverTitle(html) {
  const titleRegex = /<title>([^<]+)<\/title>/i;
  const match = html.match(titleRegex);
  return match ? match[1].trim() : '제목 없음';
}

// 네이버 블로그 콘텐츠 추출
function extractNaverContent(html) {
  // 네이버 블로그의 다양한 콘텐츠 컨테이너 시도
  const contentSelectors = [
    // 스마트에디터 3.0
    /<div[^>]*class="[^"]*se-main-container[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    // 스마트에디터 2.0
    /<div[^>]*class="[^"]*post-view[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    // 일반적인 포스트 영역
    /<div[^>]*id="postViewArea"[^>]*>([\s\S]*?)<\/div>/i,
    // 스마트에디터 4.0
    /<div[^>]*class="[^"]*se-component[^"]*"[^"]*se-text[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    // 더 넓은 범위의 콘텐츠 영역
    /<div[^>]*class="[^"]*se-text[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    // 본문 영역
    /<div[^>]*class="[^"]*post_ct[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    // 콘텐츠 영역
    /<div[^>]*class="[^"]*contents[^"]*"[^>]*>([\s\S]*?)<\/div>/i
  ];

  for (const selector of contentSelectors) {
    const match = html.match(selector);
    if (match && match[1]) {
      let content = match[1].trim();
      
      // HTML 태그 제거하고 텍스트만 추출
      content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
      content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
      content = content.replace(/<[^>]+>/g, ' ');
      content = content.replace(/\s+/g, ' ').trim();
      
      if (content.length > 50) { // 의미있는 콘텐츠가 있는지 확인
        return content;
      }
    }
  }

  // 마지막 시도: 전체 HTML에서 텍스트 추출
  let fallbackContent = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // 네이버 블로그 관련 텍스트 제거
  fallbackContent = fallbackContent
    .replace(/네이버 블로그/g, '')
    .replace(/블로그/g, '')
    .replace(/Naver Blog/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (fallbackContent.length > 100) {
    return fallbackContent.substring(0, 1000) + '...'; // 1000자로 제한
  }

  return '콘텐츠를 추출할 수 없습니다.';
}

// 네이버 블로그 이미지 추출
function extractNaverImages(html) {
  const images = [];
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  
  while ((match = imgRegex.exec(html)) !== null) {
    let src = match[1];
    
    if (!src) continue;

    // 네이버 이미지 서버 URL 처리
    if (src.includes('postfiles.pstatic.net') || src.includes('blogfiles.naver.net')) {
      images.push({
        src: src,
        alt: '',
        fileName: extractFileName(src),
        fileExtension: extractFileExtension(src),
        isNaverImage: true
      });
    }
  }

  return images;
}

// 네이버 블로그 발행일 추출
function extractNaverPublishDate(html) {
  const dateRegex = /<span[^>]*class="[^"]*date[^"]*"[^>]*>([^<]+)<\/span>/i;
  const match = html.match(dateRegex);
  return match ? match[1].trim() : null;
}

// 포스트 ID 추출
function extractPostId(url) {
  const match = url.match(/blog\.naver\.com\/[^\/]+\/(\d+)/);
  return match ? match[1] : null;
}

// RSS에서 제목 추출
function extractTitleFromRSS(xmlText, url) {
  const postId = extractPostId(url);
  if (!postId) return '';
  
  const titleRegex = new RegExp(`<title><!\\[CDATA\\[([^\\]]*?)\\]\\]></title>`, 'g');
  let match;
  let title = '';
  
  while ((match = titleRegex.exec(xmlText)) !== null) {
    if (match[1] && !match[1].includes('RSS')) {
      title = match[1];
      break;
    }
  }
  
  return title;
}

// RSS에서 날짜 추출
function extractDateFromRSS(xmlText, url) {
  const pubDateRegex = /<pubDate>([^<]+)<\/pubDate>/g;
  let match;
  let date = null;
  
  while ((match = pubDateRegex.exec(xmlText)) !== null) {
    date = match[1];
    break;
  }
  
  return date;
}

// 파일명 추출 함수
function extractFileName(url) {
  try {
    const pathname = new URL(url).pathname;
    const fileName = pathname.split('/').pop();
    return fileName || `image-${Date.now()}`;
  } catch {
    return `image-${Date.now()}`;
  }
}

// 파일 확장자 추출 함수
function extractFileExtension(url) {
  try {
    const fileName = extractFileName(url);
    const extension = fileName.split('.').pop()?.toLowerCase();
    return extension || 'jpg';
  } catch {
    return 'jpg';
  }
}
