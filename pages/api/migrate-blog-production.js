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

    console.log(`🚀 프로덕션 마이그레이션 시작: ${url}`);

    // 1. 웹페이지 스크래핑
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // 2. 제목 추출
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '제목 없음';

    // 3. 이미지 URL 추출 (최대 5개로 제한)
    const imageMatches = html.match(/<img[^>]+src="[^"]+"[^>]*>/gi) || [];
    const images = imageMatches.map(img => {
      const srcMatch = img.match(/src="([^"]+)"/);
      return srcMatch ? srcMatch[1] : null;
    }).filter(Boolean).slice(0, 5);

    // 4. 프로덕션 최적화된 이미지 처리 (간소화)
    const processedImages = [];
    for (let i = 0; i < images.length; i++) {
      const imageUrl = images[i];
      
      try {
        console.log(`🖼️ 이미지 ${i + 1} 처리 시작`);
        
        // 이미지 URL 유효성 검사
        if (!imageUrl || !imageUrl.startsWith('http')) {
          console.log(`⚠️ 이미지 ${i + 1} URL 무효, 건너뜀`);
          continue;
        }

        // 간단한 이미지 다운로드 (타임아웃 5초)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const imageResponse = await fetch(imageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'image/*'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (imageResponse.ok) {
          const imageBuffer = await imageResponse.arrayBuffer();
          const buffer = Buffer.from(imageBuffer);
          
          // 이미지 크기 검사
          if (buffer.length < 500) {
            console.log(`⚠️ 이미지 ${i + 1} 크기가 너무 작음, 건너뜀`);
            continue;
          }

          // Sharp 동적 import (Vercel 환경 호환성)
          const sharp = (await import('sharp')).default;
          // 간단한 WebP 최적화
          const optimizedBuffer = await sharp(buffer)
            .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();

          // Supabase Storage에 저장
          const fileName = `production-migration-${Date.now()}-${i + 1}.webp`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('blog-images')
            .upload(fileName, optimizedBuffer, {
              contentType: 'image/webp',
              cacheControl: '3600'
            });

          if (uploadError) {
            console.error(`❌ 이미지 ${i + 1} 업로드 실패:`, uploadError);
            // 업로드 실패해도 원본 URL로 계속 진행
            processedImages.push({
              originalUrl: imageUrl,
              processedUrl: imageUrl,
              alt: `이미지 ${i + 1}`,
              fileName: `original-${i + 1}`,
              status: 'upload-failed'
            });
            continue;
          }

          const publicUrl = supabase.storage
            .from('blog-images')
            .getPublicUrl(fileName).data.publicUrl;

          processedImages.push({
            originalUrl: imageUrl,
            processedUrl: publicUrl,
            alt: `이미지 ${i + 1}`,
            fileName: fileName,
            status: 'success'
          });

          console.log(`✅ 이미지 ${i + 1} 처리 완료: ${fileName}`);
        } else {
          console.log(`⚠️ 이미지 ${i + 1} 다운로드 실패, 원본 URL 사용`);
          processedImages.push({
            originalUrl: imageUrl,
            processedUrl: imageUrl,
            alt: `이미지 ${i + 1}`,
            fileName: `original-${i + 1}`,
            status: 'download-failed'
          });
        }
        
      } catch (error) {
        console.error(`❌ 이미지 ${i + 1} 처리 실패:`, error.message);
        processedImages.push({
          originalUrl: imageUrl,
          processedUrl: imageUrl,
          alt: `이미지 ${i + 1}`,
          fileName: `original-${i + 1}`,
          status: 'error'
        });
      }
    }

    // 5. 간단한 콘텐츠 구조화 (GPT 없이)
    const contentMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyContent = contentMatch ? contentMatch[1] : html;
    
    // HTML 태그 제거하고 텍스트만 추출
    const textContent = bodyContent
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // 간단한 마크다운 생성
    let markdownContent = `# ${title}\n\n`;
    
    // 텍스트를 단락으로 나누기
    const paragraphs = textContent.split('.').filter(p => p.trim().length > 20);
    paragraphs.forEach((paragraph, index) => {
      if (index < 5) { // 최대 5개 단락
        markdownContent += `${paragraph.trim()}.\n\n`;
      }
    });

    // 이미지 추가
    processedImages.forEach((img, index) => {
      if (index < 3) { // 최대 3개 이미지
        markdownContent += `![${img.alt}](${img.processedUrl})\n\n`;
      }
    });

    // 6. 고유 slug 생성
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100) + '-' + Date.now();

    // 7. Supabase에 저장
    const { data: post, error: insertError } = await supabase
      .from('blog_posts')
      .insert({
        title: title,
        slug: slug,
        content: markdownContent,
        featured_image: processedImages[0]?.processedUrl || null,
        published_at: new Date().toISOString(),
        is_featured: false,
        author: '마쓰구골프',
        excerpt: textContent.substring(0, 200) + '...'
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`데이터베이스 저장 실패: ${insertError.message}`);
    }

    console.log(`✅ 프로덕션 마이그레이션 완료: ${post.id}`);

    return res.status(200).json({
      success: true,
      data: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        featured_image: post.featured_image,
        images: processedImages,
        imageCount: processedImages.length,
        status: 'production-optimized'
      }
    });

  } catch (error) {
    console.error('프로덕션 마이그레이션 오류:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
