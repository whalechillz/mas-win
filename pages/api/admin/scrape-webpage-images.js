import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { webpageUrl, options = {} } = req.body;

  if (!webpageUrl) {
    return res.status(400).json({ error: '웹페이지 URL이 필요합니다.' });
  }

  try {
    console.log('🌐 웹페이지 이미지 스크래핑 시작:', webpageUrl);

    // 1. 웹페이지 HTML 가져오기
    const response = await fetch(webpageUrl, {
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
      timeout: 30000, // 30초 타임아웃
      redirect: 'follow',
      follow: 5
    });

    if (!response.ok) {
      throw new Error(`웹페이지 로드 실패: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    
    // 2. 정규식을 사용한 이미지 URL 추출 (JSDOM 대신)
    const images = [];
    const baseUrl = new URL(webpageUrl);
    
    // img 태그에서 src 추출
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let match;
    
    while ((match = imgRegex.exec(html)) !== null) {
      let src = match[1];
      
      if (!src) continue;

      // 상대 URL을 절대 URL로 변환
      if (src.startsWith('//')) {
        src = 'https:' + src;
      } else if (src.startsWith('/')) {
        src = baseUrl.origin + src;
      } else if (!src.startsWith('http')) {
        src = new URL(src, baseUrl.origin).href;
      }

      // 이미지 확장자 확인
      const extension = src.split('.').pop().toLowerCase().split('?')[0];
      if (!['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
        continue;
      }

      // 허용된 확장자 필터링
      if (options.allowedExtensions && !options.allowedExtensions.includes(extension)) {
        continue;
      }

      // 외부 도메인 제외 옵션
      if (options.excludeExternal) {
        const imgUrl = new URL(src);
        if (imgUrl.hostname !== baseUrl.hostname) {
          continue;
        }
      }

      images.push({
        src: src,
        alt: '',
        title: '',
        width: 0, // 정규식으로는 크기 정보를 얻을 수 없음
        height: 0,
        fileName: extractFileName(src),
        fileExtension: extension,
        fileSize: null,
        isExternal: !src.includes(baseUrl.hostname)
      });
    }

    // 3. CSS 배경 이미지도 추출 (정규식 사용)
    const bgImageRegex = /background-image\s*:\s*url\(['"]?([^'"]+)['"]?\)/gi;
    let bgMatch;
    
    while ((bgMatch = bgImageRegex.exec(html)) !== null) {
      let bgSrc = bgMatch[1];
      
      if (!bgSrc) continue;

      // 상대 URL을 절대 URL로 변환
      if (bgSrc.startsWith('//')) {
        bgSrc = 'https:' + bgSrc;
      } else if (bgSrc.startsWith('/')) {
        bgSrc = baseUrl.origin + bgSrc;
      } else if (!bgSrc.startsWith('http')) {
        bgSrc = new URL(bgSrc, baseUrl.origin).href;
      }

      // 이미지 확장자 확인
      const extension = bgSrc.split('.').pop().toLowerCase().split('?')[0];
      if (!['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
        continue;
      }

      // 허용된 확장자 필터링
      if (options.allowedExtensions && !options.allowedExtensions.includes(extension)) {
        continue;
      }

      // 외부 도메인 제외 옵션
      if (options.excludeExternal) {
        const imgUrl = new URL(bgSrc);
        if (imgUrl.hostname !== baseUrl.hostname) {
          continue;
        }
      }

      images.push({
        src: bgSrc,
        alt: 'Background Image',
        title: '',
        width: 0,
        height: 0,
        fileName: extractFileName(bgSrc),
        fileExtension: extension,
        fileSize: null,
        isExternal: !bgSrc.includes(baseUrl.hostname),
        isBackground: true
      });
    }

    // 4. 중복 제거
    const uniqueImages = images.filter((image, index, self) => 
      index === self.findIndex(img => img.src === image.src)
    );

    console.log(`✅ ${uniqueImages.length}개의 이미지 발견`);

    res.status(200).json({
      success: true,
      webpageUrl: webpageUrl,
      totalImages: uniqueImages.length,
      images: uniqueImages,
      message: `${uniqueImages.length}개의 이미지를 발견했습니다.`
    });

  } catch (error) {
    console.error('웹페이지 이미지 스크래핑 오류:', error);
    
    // 더 구체적인 에러 메시지 제공
    let errorMessage = '웹페이지 이미지 스크래핑 중 오류가 발생했습니다.';
    let errorDetails = error.message;
    
    if (error.message.includes('fetch')) {
      errorMessage = '웹페이지에 접근할 수 없습니다. URL을 확인해주세요.';
      errorDetails = '네트워크 오류 또는 잘못된 URL입니다.';
    } else if (error.message.includes('timeout')) {
      errorMessage = '웹페이지 로드 시간이 초과되었습니다.';
      errorDetails = '해당 웹사이트가 응답하지 않거나 너무 느립니다.';
    } else if (error.message.includes('CORS') || error.message.includes('blocked')) {
      errorMessage = '웹사이트에서 스크래핑을 차단했습니다.';
      errorDetails = '일부 웹사이트는 보안 정책으로 인해 스크래핑을 허용하지 않습니다.';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: errorDetails,
      originalError: error.message,
      url: webpageUrl
    });
  }
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
