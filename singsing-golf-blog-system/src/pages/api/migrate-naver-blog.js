/**
 * 원래 강력한 네이버 블로그 마이그레이션 API
 * 임시 보여주기용 - 저장하지 않고 데이터만 반환
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { blogUrl } = req.body;

    if (!blogUrl) {
      return res.status(400).json({ error: '블로그 URL이 필요합니다.' });
    }

    console.log('🚀 강력한 네이버 블로그 마이그레이션 시작:', blogUrl);

    // 1. 강력한 웹페이지 스크래핑
    const response = await fetch(blogUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': 'https://blog.naver.com/',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin'
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

    // 3. 강력한 본문 콘텐츠 추출
    let content = '';
    let excerpt = '';
    
    // 패턴 1: 네이버 블로그 신형 구조 (se-main-container)
    const seMainMatch = html.match(/<div[^>]*class="[^"]*se-main-container[^"]*"[^>]*>(.*?)<\/div>/s);
    if (seMainMatch) {
      content = seMainMatch[1];
    } else {
      // 패턴 2: 네이버 블로그 구형 구조 (postViewArea)
      const postViewMatch = html.match(/<div[^>]*id="postViewArea"[^>]*>(.*?)<\/div>/s);
      if (postViewMatch) {
        content = postViewMatch[1];
      } else {
        // 패턴 3: 전체 콘텐츠 영역 (se-text-paragraph)
        const textParagraphs = html.match(/<div[^>]*class="[^"]*se-text-paragraph[^"]*"[^>]*>(.*?)<\/div>/gs);
        if (textParagraphs) {
          content = textParagraphs.join('\n');
        } else {
          // 패턴 4: 일반적인 콘텐츠 영역
          const generalMatch = html.match(/<div[^>]*class="[^"]*post-content[^"]*"[^>]*>(.*?)<\/div>/s);
          if (generalMatch) {
            content = generalMatch[1];
          } else {
            // 패턴 5: body 태그 내 모든 텍스트
            const bodyMatch = html.match(/<body[^>]*>(.*?)<\/body>/s);
            if (bodyMatch) {
              content = bodyMatch[1];
            }
          }
        }
      }
    }
    
    // 강력한 HTML 정리
    if (content) {
      // 1단계: 불필요한 태그 제거
      content = content
        .replace(/<script[^>]*>.*?<\/script>/gis, '') // 스크립트 제거
        .replace(/<style[^>]*>.*?<\/style>/gis, '') // 스타일 제거
        .replace(/<noscript[^>]*>.*?<\/noscript>/gis, '') // noscript 제거
        .replace(/<nav[^>]*>.*?<\/nav>/gis, '') // 네비게이션 제거
        .replace(/<header[^>]*>.*?<\/header>/gis, '') // 헤더 제거
        .replace(/<footer[^>]*>.*?<\/footer>/gis, '') // 푸터 제거
        .replace(/<aside[^>]*>.*?<\/aside>/gis, '') // 사이드바 제거
        .replace(/<div[^>]*class="[^"]*ad[^"]*"[^>]*>.*?<\/div>/gis, '') // 광고 제거
        .replace(/<div[^>]*class="[^"]*banner[^"]*"[^>]*>.*?<\/div>/gis, '') // 배너 제거
        .replace(/<div[^>]*class="[^"]*widget[^"]*"[^>]*>.*?<\/div>/gis, '') // 위젯 제거
        .trim();
      
      // 2단계: 텍스트 추출 및 정리
      content = content
        .replace(/<br\s*\/?>/gi, '\n') // br 태그를 줄바꿈으로
        .replace(/<\/p>/gi, '\n\n') // p 태그 끝을 줄바꿈으로
        .replace(/<\/div>/gi, '\n') // div 태그 끝을 줄바꿈으로
        .replace(/<[^>]*>/g, '') // 모든 HTML 태그 제거
        .replace(/\n\s*\n\s*\n/g, '\n\n') // 연속된 줄바꿈 정리
        .replace(/&nbsp;/g, ' ') // &nbsp;를 공백으로
        .replace(/&amp;/g, '&') // &amp;를 &로
        .replace(/&lt;/g, '<') // &lt;를 <로
        .replace(/&gt;/g, '>') // &gt;를 >로
        .replace(/&quot;/g, '"') // &quot;를 "로
        .trim();
      
      // 3단계: 요약 생성 (첫 200자)
      excerpt = content.length > 200 ? content.substring(0, 200) + '...' : content;
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

    // 6. 원래 구조에 맞게 포스트 데이터 생성 (임시 보여주기용)
    const post = {
      title: title,
      content: content || '콘텐츠를 추출할 수 없습니다.',
      excerpt: excerpt || title,
      images: images,
      url: blogUrl,
      extracted_at: new Date().toISOString(),
      // 원래 구조에 맞는 추가 필드들
      category: 'migrated',
      tags: ['네이버 블로그', '마이그레이션'],
      status: 'draft',
      author: '마쓰구골프',
      debug: {
        contentLength: content ? content.length : 0,
        imageCount: images.length,
        hasContent: !!content,
        hasImages: images.length > 0
      }
    };

    console.log(`✅ 강력한 마이그레이션 완료: ${title}`);
    console.log(`- 콘텐츠 길이: ${content ? content.length : 0}자`);
    console.log(`- 이미지 개수: ${images.length}개`);
    console.log(`- 요약: ${excerpt ? excerpt.substring(0, 100) + '...' : '없음'}`);

    return res.status(200).json({
      success: true,
      message: '네이버 블로그 포스트를 성공적으로 가져왔습니다.',
      posts: [post], // 원래 형식: posts 배열
      // 원래 구조에 맞는 추가 정보
      totalPosts: 1,
      successfulPosts: 1,
      failedPosts: 0
    });

  } catch (error) {
    console.error('원래 마이그레이션 오류:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
