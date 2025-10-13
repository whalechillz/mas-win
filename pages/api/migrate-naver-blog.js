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
    
    // 2. 제목 추출
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '제목 없음';

    // 3. 본문 콘텐츠 추출
    let content = '';
    
    // 네이버 블로그의 메인 콘텐츠 영역 찾기
    const contentMatch = html.match(/<div[^>]*class="[^"]*se-main-container[^"]*"[^>]*>(.*?)<\/div>/s);
    if (contentMatch) {
      content = contentMatch[1];
    } else {
      // 대안: 다른 패턴으로 콘텐츠 찾기
      const altContentMatch = html.match(/<div[^>]*id="postViewArea"[^>]*>(.*?)<\/div>/s);
      if (altContentMatch) {
        content = altContentMatch[1];
      }
    }

    // 4. 이미지 URL 추출
    const imageMatches = html.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi) || [];
    const images = imageMatches.map(img => {
      const srcMatch = img.match(/src=["']([^"']+)["']/i);
      return srcMatch ? srcMatch[1] : null;
    }).filter(Boolean);

    // 5. 원래 형식에 맞게 포스트 데이터 생성
    const post = {
      title: title,
      content: content || '콘텐츠를 추출할 수 없습니다.',
      excerpt: title,
      images: images,
      url: blogUrl,
      extracted_at: new Date().toISOString()
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
