/**
 * 간단한 네이버 블로그 마이그레이션 API
 * Sharp나 OpenAI 없이 기본적인 스크래핑만 수행
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
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL이 필요합니다.' });
    }

    console.log('🚀 간단한 네이버 블로그 마이그레이션 시작:', url);

    // 1. 웹페이지 스크래핑
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    
    // 2. 제목 추출
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '제목 없음';

    // 3. 메타 설명 추출
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : '';

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

    // 디버깅 정보 출력
    console.log('🔍 스크래핑 결과:');
    console.log('- 제목:', title);
    console.log('- 콘텐츠 길이:', content ? content.length : 0);
    console.log('- 이미지 개수:', images.length);
    console.log('- 이미지 URL들:', images.slice(0, 3)); // 처음 3개만 출력

    // 6. 고유 slug 생성
    const baseSlug = title.toLowerCase()
      .replace(/[^a-z0-9가-힣\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    const timestamp = Date.now();
    const slug = `${baseSlug}-${timestamp}`;

    // 7. 데이터베이스에 저장
    const { data: post, error: insertError } = await supabase
      .from('blog_posts')
      .insert({
        title: title,
        slug: slug,
        content: content || '콘텐츠를 추출할 수 없습니다.',
        excerpt: metaDescription || title,
        featured_image: images[0] || null,
        category: 'migrated',
        tags: ['네이버 블로그', '마이그레이션'],
        status: 'draft',
        meta_title: title,
        meta_description: metaDescription,
        meta_keywords: '네이버 블로그, 마이그레이션',
        author: '마쓰구골프',
        published_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`데이터베이스 저장 실패: ${insertError.message}`);
    }

    console.log(`✅ 간단한 마이그레이션 완료: ${post.id}`);

    return res.status(200).json({
      success: true,
      message: '네이버 블로그 마이그레이션 성공',
      data: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        featured_image: post.featured_image,
        images: images,
        imageCount: images.length,
        status: 'migration-success'
      }
    });

  } catch (error) {
    console.error('간단한 마이그레이션 오류:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
