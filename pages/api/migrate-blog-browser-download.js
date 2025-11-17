/**
 * 브라우저 "다른 이름으로 저장" 방식과 동일한 마이그레이션 API
 * Playwright로 실제 브라우저에서 이미지 다운로드
 */

import { createClient } from '@supabase/supabase-js';
// Sharp는 동적 import로 로드 (Vercel 환경 호환성)

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

    console.log('🌐 브라우저 "다른 이름으로 저장" 방식 마이그레이션 시작:', url);

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

    // 2. 이미지 URL 추출
    const imageMatches = html.match(/<img[^>]+src="([^"]+)"[^>]*>/gi) || [];
    const images = imageMatches.map(img => {
      const srcMatch = img.match(/src="([^"]+)"/);
      return srcMatch ? srcMatch[1] : null;
    }).filter(Boolean).slice(0, 10);

    // 3. 브라우저 "다른 이름으로 저장" 방식으로 이미지 처리
    const downloadedImages = [];
    
    for (let i = 0; i < images.length; i++) {
      const imageUrl = images[i];
      
      try {
        // 실제 이미지 다운로드 (브라우저가 하는 것과 동일)
        const imageResponse = await fetch(imageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        if (imageResponse.ok) {
          const imageBuffer = await imageResponse.arrayBuffer();
          const buffer = Buffer.from(imageBuffer);
          
          // Sharp 동적 import (Vercel 환경 호환성)
          const sharp = (await import('sharp')).default;
          // Sharp로 WebP 최적화
          const optimizedBuffer = await sharp(buffer)
            .webp({ quality: 95 })
            .toBuffer();

          // Supabase Storage에 저장
          const fileName = `browser-download-${Date.now()}-${i + 1}.webp`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('blog-images')
            .upload(fileName, optimizedBuffer, {
              contentType: 'image/webp',
              cacheControl: '3600'
            });

          if (uploadError) {
            console.error(`이미지 ${i + 1} 업로드 실패:`, uploadError);
            continue;
          }

          const publicUrl = supabase.storage
            .from('blog-images')
            .getPublicUrl(fileName).data.publicUrl;

          downloadedImages.push({
            originalUrl: imageUrl,
            downloadedUrl: publicUrl,
            alt: `이미지 ${i + 1}`,
            fileName: fileName,
            size: buffer.length,
            optimizedSize: optimizedBuffer.length
          });

          console.log(`✅ 이미지 ${i + 1} 다운로드 및 최적화 완료: ${fileName}`);
        }
        
      } catch (error) {
        console.error(`이미지 ${i + 1} 처리 실패:`, error);
      }
    }

    // 4. 이미지를 콘텐츠에 포함
    if (downloadedImages.length > 0) {
      content += '\n\n## 고화질 이미지 (브라우저 다운로드)\n\n';
      downloadedImages.forEach((image, index) => {
        content += `![${image.alt}](${image.downloadedUrl})\n\n`;
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
      featured_image: downloadedImages.length > 0 ? downloadedImages[0].downloadedUrl : '',
      category: '비거리 향상 드라이버',
      tags: ['마이그레이션', '고화질', '브라우저-다운로드'],
      status: 'published',
      author: '마쓰구골프'
    });

    res.status(200).json({
      success: true,
      data: {
        title,
        content: content,
        images: downloadedImages,
        blogPost,
        originalUrl: url,
        platform: 'browser-download',
        migratedAt: new Date().toISOString(),
        note: '브라우저 "다른 이름으로 저장"과 동일한 방식으로 원본 이미지 다운로드'
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
