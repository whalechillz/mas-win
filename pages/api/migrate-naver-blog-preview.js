import { createClient } from "@supabase/supabase-js";

// Supabase 클라이언트 생성
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ 
        success: false, 
        error: "URL이 필요합니다" 
      });
    }

    console.log('🔍 네이버 블로그 미리보기 시작:', url);

    // 1. URL 유효성 검사
    if (!url.includes('blog.naver.com')) {
      return res.status(400).json({ 
        success: false, 
        error: "네이버 블로그 URL이 아닙니다" 
      });
    }

    // 2. 웹 스크래핑
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      return res.status(400).json({ 
        success: false, 
        error: `블로그 접근 실패: ${response.status}` 
      });
    }

    const html = await response.text();
    console.log('📄 HTML 길이:', html.length);

    // 3. 강력한 제목 추출
    let title = '';
    
    // 패턴 1: 네이버 블로그 신형 구조 (se-title-text)
    const seTitleMatch = html.match(/<div[^>]*class="[^"]*se-title-text[^"]*"[^>]*>(.*?)<\/div>/s);
    if (seTitleMatch) {
      title = seTitleMatch[1].replace(/<[^>]*>/g, '').trim();
    } else {
      // 패턴 2: 네이버 블로그 구형 구조 (post-title)
      const postTitleMatch = html.match(/<h3[^>]*class="[^"]*post-title[^"]*"[^>]*>(.*?)<\/h3>/s);
      if (postTitleMatch) {
        title = postTitleMatch[1].replace(/<[^>]*>/g, '').trim();
      } else {
        // 패턴 3: 일반적인 제목 태그
        const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/s);
        if (h1Match) {
          title = h1Match[1].replace(/<[^>]*>/g, '').trim();
        } else {
          // 패턴 4: title 태그
          const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/s);
          if (titleMatch) {
            title = titleMatch[1].replace(/<[^>]*>/g, '').trim();
          }
        }
      }
    }

    // 제목이 없으면 기본값
    if (!title) {
      title = '제목을 추출할 수 없습니다';
    }

    console.log('📝 추출된 제목:', title);

    // 4. 강력한 본문 콘텐츠 추출
    let content = '';
    
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
    
    // HTML 태그 정리
    if (content) {
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
      
      // 텍스트 추출 및 정리
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
    }

    // 콘텐츠가 없으면 기본값
    if (!content || content.length < 10) {
      content = '콘텐츠를 추출할 수 없습니다.';
    }

    console.log('📄 추출된 콘텐츠 길이:', content.length);

    // 5. 강력한 이미지 URL 추출
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

    console.log('🖼️ 추출된 이미지 개수:', images.length);
    console.log('🖼️ 이미지 URL들:', images.slice(0, 3)); // 처음 3개만 로그

    // 6. 슬러그 생성 (저장하지 않으므로 임시)
    const timestamp = Date.now();
    const slug = `${title.replace(/[^a-zA-Z0-9가-힣]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}-${timestamp}`;

    // 7. 미리보기 데이터 반환 (저장하지 않음)
    const previewData = {
      title: title,
      slug: slug,
      content: content,
      excerpt: content.length > 200 ? content.substring(0, 200) + '...' : content,
      featured_image: images.length > 0 ? images[0] : null,
      images: images,
      imageCount: images.length,
      tags: ['네이버 블로그', '마이그레이션'],
      category: 'migrated',
      status: 'preview', // 미리보기 상태
      url: url // 원본 URL 저장
    };

    console.log('✅ 미리보기 데이터 생성 완료');
    console.log('📊 미리보기 요약:');
    console.log('  - 제목:', previewData.title);
    console.log('  - 콘텐츠 길이:', previewData.content.length);
    console.log('  - 이미지 개수:', previewData.imageCount);
    console.log('  - 상태:', previewData.status);

    return res.status(200).json({
      success: true,
      message: "미리보기 데이터 추출 완료",
      data: previewData
    });

  } catch (error) {
    console.error('❌ 미리보기 API 오류:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
