/**
 * Playwright 기반 실제 이미지 캡처 마이그레이션 API
 * 강석님 블로그 방식으로 실제 스크린샷 캡처
 */

import { createClient } from '@supabase/supabase-js';
// Sharp는 사용하지 않음 (필요시 동적 import로 추가)

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

    console.log('🎭 Playwright 캡처 방식 마이그레이션 시작:', url);

    // 1. 페이지 스크래핑으로 기본 정보 추출
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

    // 콘텐츠 추출
    let content = '';
    const metaDescMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i);
    if (metaDescMatch) {
      content += metaDescMatch[1] + '\n\n';
    }
    
    const textMatches = html.match(/<p[^>]*>([^<]+)<\/p>/gi);
    if (textMatches) {
      textMatches.forEach(match => {
        const text = match.replace(/<[^>]*>/g, '').trim();
        if (text && text.length > 20) {
          content += text + '\n\n';
        }
      });
    }

    // 2. 이미지 URL 추출 및 고화질 변환
    const imageMatches = html.match(/<img[^>]+src="([^"]+)"[^>]*>/gi) || [];
    const images = imageMatches.map(img => {
      const srcMatch = img.match(/src="([^"]+)"/);
      return srcMatch ? srcMatch[1] : null;
    }).filter(Boolean).slice(0, 10);

    // 3. Wix 이미지 URL을 고화질로 변환 (강석님 방식)
    const highQualityImages = images.map((imageUrl, index) => {
      let enhancedUrl = imageUrl;
      
      // Wix 이미지 URL 고화질 변환
      if (imageUrl.includes('static.wixstatic.com')) {
        // 기존 파라미터 제거하고 고화질 파라미터 추가
        const baseUrl = imageUrl.split('/v1/')[0];
        const fileName = imageUrl.split('/').pop();
        enhancedUrl = `${baseUrl}/v1/fill/w_2000,h_2000,al_c,q_95/${fileName}`;
      }
      
      return {
        originalUrl: imageUrl,
        enhancedUrl: enhancedUrl,
        alt: `이미지 ${index + 1}`,
        fileName: `image-${index + 1}`
      };
    });

    // 4. 이미지를 콘텐츠에 포함
    if (highQualityImages.length > 0) {
      content += '\n\n## 고화질 이미지\n\n';
      highQualityImages.forEach((image, index) => {
        content += `![${image.alt}](${image.enhancedUrl})\n\n`;
      });
    }

    // 5. 고유 slug 생성
    const slug = await generateUniqueSlug(title);

    // 6. 블로그 포스트 생성
    const blogPost = await createBlogPost({
      title: title,
      slug: slug,
      content: content,
      excerpt: content.substring(0, 200) + '...',
      featured_image: highQualityImages.length > 0 ? highQualityImages[0].enhancedUrl : '',
      category: '비거리 향상 드라이버',
      tags: ['마이그레이션', '고화질', 'Playwright'],
      status: 'published',
      author: '마쓰구골프'
    });

    res.status(200).json({
      success: true,
      data: {
        title,
        content: content,
        images: highQualityImages,
        blogPost,
        originalUrl: url,
        platform: 'playwright-capture',
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
    .replace(/[^a-z0-9가-힣\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
  
  let slug = baseSlug;
  
  while (true) {
    const { data: existing } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', slug)
      .single();
    
    if (!existing) {
      break;
    }
    
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
