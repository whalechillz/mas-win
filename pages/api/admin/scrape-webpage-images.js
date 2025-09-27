import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

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
    const dom = new JSDOM(html, {
      url: webpageUrl,
      resources: 'usable'
    });
    const document = dom.window.document;

    // 2. 모든 이미지 요소 추출
    const imgElements = document.querySelectorAll('img');
    const images = [];

    for (const img of imgElements) {
      let src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
      
      if (!src) continue;

      // 상대 URL을 절대 URL로 변환
      if (src.startsWith('//')) {
        src = 'https:' + src;
      } else if (src.startsWith('/')) {
        const urlObj = new URL(webpageUrl);
        src = urlObj.origin + src;
      } else if (!src.startsWith('http')) {
        const urlObj = new URL(webpageUrl);
        src = new URL(src, urlObj.origin).href;
      }

      // 이미지 메타데이터 수집
      const imageData = {
        src: src,
        alt: img.alt || '',
        title: img.title || '',
        width: img.width || img.getAttribute('width') || null,
        height: img.height || img.getAttribute('height') || null,
        className: img.className || '',
        id: img.id || '',
        fileName: extractFileName(src),
        fileExtension: extractFileExtension(src),
        fileSize: null, // 나중에 다운로드할 때 확인
        isExternal: !src.includes(new URL(webpageUrl).hostname)
      };

      // 필터링 옵션 적용
      if (options.minWidth && imageData.width && imageData.width < options.minWidth) continue;
      if (options.minHeight && imageData.height && imageData.height < options.minHeight) continue;
      if (options.allowedExtensions && !options.allowedExtensions.includes(imageData.fileExtension)) continue;
      if (options.excludeExternal && imageData.isExternal) continue;

      images.push(imageData);
    }

    // 3. CSS 배경 이미지도 추출
    const elementsWithBg = document.querySelectorAll('*');
    for (const element of elementsWithBg) {
      const style = element.style.backgroundImage || 
                   window.getComputedStyle(element).backgroundImage;
      
      if (style && style !== 'none') {
        const urlMatch = style.match(/url\(['"]?([^'"]+)['"]?\)/);
        if (urlMatch) {
          let bgSrc = urlMatch[1];
          
          // 상대 URL을 절대 URL로 변환
          if (bgSrc.startsWith('//')) {
            bgSrc = 'https:' + bgSrc;
          } else if (bgSrc.startsWith('/')) {
            const urlObj = new URL(webpageUrl);
            bgSrc = urlObj.origin + bgSrc;
          } else if (!bgSrc.startsWith('http')) {
            const urlObj = new URL(webpageUrl);
            bgSrc = new URL(bgSrc, urlObj.origin).href;
          }

          const imageData = {
            src: bgSrc,
            alt: 'Background Image',
            title: '',
            width: null,
            height: null,
            className: element.className || '',
            id: element.id || '',
            fileName: extractFileName(bgSrc),
            fileExtension: extractFileExtension(bgSrc),
            fileSize: null,
            isExternal: !bgSrc.includes(new URL(webpageUrl).hostname),
            isBackground: true
          };

          // 필터링 옵션 적용
          if (options.allowedExtensions && !options.allowedExtensions.includes(imageData.fileExtension)) continue;
          if (options.excludeExternal && imageData.isExternal) continue;

          images.push(imageData);
        }
      }
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
