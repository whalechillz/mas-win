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
    
    // 제목 추출
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '제목 없음';

    // 실제 콘텐츠 추출 (더 간단하고 효과적인 방법)
    let content = '';
    
    // 1. 메타 태그에서 설명 추출
    const metaDescMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i);
    if (metaDescMatch) {
      content += metaDescMatch[1] + '\n\n';
    }
    
    // 2. Open Graph 설명 추출
    const ogDescMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"[^>]*>/i);
    if (ogDescMatch) {
      content += ogDescMatch[1] + '\n\n';
    }
    
    // 3. Twitter 카드 설명 추출
    const twitterDescMatch = html.match(/<meta[^>]*name="twitter:description"[^>]*content="([^"]*)"[^>]*>/i);
    if (twitterDescMatch) {
      content += twitterDescMatch[1] + '\n\n';
    }
    
    // 4. JSON-LD 구조화된 데이터에서 설명 추출
    const jsonLdMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
    if (jsonLdMatches) {
      jsonLdMatches.forEach(match => {
        try {
          const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '');
          const data = JSON.parse(jsonContent);
          if (data.description) {
            content += data.description + '\n\n';
          }
          if (data.articleBody) {
            content += data.articleBody + '\n\n';
          }
        } catch (e) {
          // JSON 파싱 오류 무시
        }
      });
    }
    
    // 5. 일반적인 텍스트 콘텐츠 추출
    const textMatches = html.match(/<p[^>]*>([^<]+)<\/p>/gi);
    if (textMatches) {
      textMatches.forEach(match => {
        const text = match.replace(/<[^>]*>/g, '').trim();
        if (text && text.length > 20) {
          content += text + '\n\n';
        }
      });
    }
    
    // 6. 제목 태그들 추출
    const headingMatches = html.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi);
    if (headingMatches) {
      headingMatches.forEach(match => {
        const text = match.replace(/<[^>]*>/g, '').trim();
        if (text && text.length > 5) {
          content += '## ' + text + '\n\n';
        }
      });
    }
    
    // 7. 리스트 아이템 추출
    const listMatches = html.match(/<li[^>]*>([^<]+)<\/li>/gi);
    if (listMatches) {
      listMatches.forEach(match => {
        const text = match.replace(/<[^>]*>/g, '').trim();
        if (text && text.length > 10) {
          content += '- ' + text + '\n';
        }
      });
    }
    
    // 8. 콘텐츠가 없으면 기본 메시지
    if (!content.trim()) {
      content = `마이그레이션된 콘텐츠: ${title}\n\n원본 URL: ${url}\n\n이미지 수: 0개`;
    }

    // 이미지 URL 추출 (더 정확하게)
    const imageMatches = html.match(/<img[^>]+src="([^"]+)"[^>]*>/gi) || [];
    const images = imageMatches.map(img => {
      const srcMatch = img.match(/src="([^"]+)"/);
      return srcMatch ? srcMatch[1] : null;
    }).filter(Boolean).slice(0, 10); // 최대 10개로 증가

    // 고유 slug 생성
    const slug = await generateUniqueSlug(title);

    // 이미지를 콘텐츠에 포함
    let finalContent = content;
    if (images.length > 0) {
      finalContent += '\n\n## 이미지\n\n';
      images.forEach((imageUrl, index) => {
        finalContent += `![이미지 ${index + 1}](${imageUrl})\n\n`;
      });
    }
    
    // 블로그 포스트 생성
    const blogPost = await createBlogPost({
      title: title,
      slug: slug,
      content: finalContent,
      excerpt: content.substring(0, 200) + '...',
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
        content: finalContent,
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
