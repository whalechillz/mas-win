/**
 * 원래 잘 작동하던 네이버 블로그 마이그레이션 API
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
    const { blogUrl } = req.body;

    if (!blogUrl) {
      return res.status(400).json({ error: '블로그 URL이 필요합니다.' });
    }

    console.log('🚀 원래 네이버 블로그 마이그레이션 시작:', blogUrl);

    // 1. 웹페이지 스크래핑
    const response = await fetch(blogUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    
    // 2. 제목 추출 (여러 패턴 시도)
    let title = '제목 없음';
    
    // 패턴 1: title 태그
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
    }
    
    // 패턴 2: 네이버 블로그 특화 제목
    const naverTitleMatch = html.match(/<h1[^>]*class="[^"]*se-title-text[^"]*"[^>]*>(.*?)<\/h1>/s);
    if (naverTitleMatch) {
      title = naverTitleMatch[1].replace(/<[^>]*>/g, '').trim();
    }
    
    // 패턴 3: 다른 제목 패턴
    const altTitleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/s);
    if (altTitleMatch && title === '제목 없음') {
      title = altTitleMatch[1].replace(/<[^>]*>/g, '').trim();
    }

    // 3. 본문 콘텐츠 추출 (여러 패턴 시도)
    let content = '';
    
    // 패턴 1: se-main-container (네이버 블로그 신형)
    const contentMatch = html.match(/<div[^>]*class="[^"]*se-main-container[^"]*"[^>]*>(.*?)<\/div>/s);
    if (contentMatch) {
      content = contentMatch[1];
    } else {
      // 패턴 2: postViewArea (네이버 블로그 구형)
      const altContentMatch = html.match(/<div[^>]*id="postViewArea"[^>]*>(.*?)<\/div>/s);
      if (altContentMatch) {
        content = altContentMatch[1];
      } else {
        // 패턴 3: se-text-paragraph (텍스트 단락)
        const textMatch = html.match(/<div[^>]*class="[^"]*se-text-paragraph[^"]*"[^>]*>(.*?)<\/div>/s);
        if (textMatch) {
          content = textMatch[1];
        } else {
          // 패턴 4: 일반적인 콘텐츠 영역
          const generalMatch = html.match(/<div[^>]*class="[^"]*post-content[^"]*"[^>]*>(.*?)<\/div>/s);
          if (generalMatch) {
            content = generalMatch[1];
          }
        }
      }
    }
    
    // HTML 태그 정리 (기본적인 정리만)
    if (content) {
      content = content
        .replace(/<script[^>]*>.*?<\/script>/gis, '') // 스크립트 제거
        .replace(/<style[^>]*>.*?<\/style>/gis, '') // 스타일 제거
        .replace(/<noscript[^>]*>.*?<\/noscript>/gis, '') // noscript 제거
        .trim();
    }

    // 4. 이미지 URL 추출 (여러 패턴 시도)
    let images = [];
    
    // 패턴 1: 모든 img 태그
    const imageMatches = html.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi) || [];
    images = imageMatches.map(img => {
      const srcMatch = img.match(/src=["']([^"']+)["']/i);
      return srcMatch ? srcMatch[1] : null;
    }).filter(Boolean);
    
    // 패턴 2: 네이버 블로그 특화 이미지 (data-src 속성)
    const dataSrcMatches = html.match(/<img[^>]*data-src=["']([^"']+)["'][^>]*>/gi) || [];
    const dataSrcImages = dataSrcMatches.map(img => {
      const srcMatch = img.match(/data-src=["']([^"']+)["']/i);
      return srcMatch ? srcMatch[1] : null;
    }).filter(Boolean);
    
    // 패턴 3: 배경 이미지
    const bgImageMatches = html.match(/background-image:\s*url\(["']?([^"')]+)["']?\)/gi) || [];
    const bgImages = bgImageMatches.map(bg => {
      const urlMatch = bg.match(/url\(["']?([^"')]+)["']?\)/i);
      return urlMatch ? urlMatch[1] : null;
    }).filter(Boolean);
    
    // 모든 이미지 합치기 (중복 제거)
    const allImages = [...images, ...dataSrcImages, ...bgImages];
    images = [...new Set(allImages)]; // 중복 제거

    // 5. 디버깅 정보 출력
    console.log('🔍 스크래핑 결과:');
    console.log('- 제목:', title);
    console.log('- 콘텐츠 길이:', content ? content.length : 0);
    console.log('- 이미지 개수:', images.length);
    console.log('- 이미지 URL들:', images.slice(0, 3)); // 처음 3개만 출력

    // 6. 원래 형식에 맞게 포스트 데이터 생성
    const post = {
      title: title,
      content: content || '콘텐츠를 추출할 수 없습니다.',
      excerpt: title,
      images: images,
      url: blogUrl,
      extracted_at: new Date().toISOString(),
      debug: {
        contentLength: content ? content.length : 0,
        imageCount: images.length,
        hasContent: !!content
      }
    };

    console.log(`✅ 원래 마이그레이션 완료: ${title}`);

    return res.status(200).json({
      success: true,
      message: '네이버 블로그 포스트를 성공적으로 가져왔습니다.',
      posts: [post] // 원래 형식: posts 배열
    });

  } catch (error) {
    console.error('원래 마이그레이션 오류:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
