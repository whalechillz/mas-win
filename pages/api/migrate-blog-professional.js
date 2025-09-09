/**
 * 전문적인 블로그 마이그레이션 API
 * 강석 블로그 수준의 고품질 마이그레이션
 */

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log('🎯 전문적인 블로그 마이그레이션 시작:', url);

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
    
    // 2. 제목 추출
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '제목 없음';

    // 3. 이미지 URL 추출 및 고화질 다운로드
    const imageMatches = html.match(/<img[^>]+src="([^"]+)"[^>]*>/gi) || [];
    const images = imageMatches.map(img => {
      const srcMatch = img.match(/src="([^"]+)"/);
      return srcMatch ? srcMatch[1] : null;
    }).filter(Boolean).slice(0, 10);

    // 4. 안정적인 이미지 처리 (실패해도 계속 진행)
    const processedImages = [];
    for (let i = 0; i < images.length; i++) {
      const imageUrl = images[i];
      
      try {
        console.log(`🖼️ 이미지 ${i + 1} 처리 시작: ${imageUrl}`);
        
        // 이미지 URL 유효성 검사
        if (!imageUrl || !imageUrl.startsWith('http')) {
          console.log(`⚠️ 이미지 ${i + 1} URL 무효, 건너뜀`);
          continue;
        }

        // 실제 이미지 다운로드 (타임아웃 설정)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃

        const imageResponse = await fetch(imageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (imageResponse.ok) {
          const imageBuffer = await imageResponse.arrayBuffer();
          const buffer = Buffer.from(imageBuffer);
          
          // 이미지 크기 검사 (너무 작으면 건너뜀)
          if (buffer.length < 1000) {
            console.log(`⚠️ 이미지 ${i + 1} 크기가 너무 작음 (${buffer.length} bytes), 건너뜀`);
            continue;
          }

          // Sharp로 WebP 최적화
          const optimizedBuffer = await sharp(buffer)
            .webp({ quality: 95 })
            .toBuffer();

          // Supabase Storage에 저장
          const fileName = `professional-migration-${Date.now()}-${i + 1}.webp`;
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
              processedUrl: imageUrl, // 원본 URL 사용
              alt: `이미지 ${i + 1}`,
              fileName: `original-${i + 1}`,
              size: buffer.length,
              optimizedSize: buffer.length,
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
            size: buffer.length,
            optimizedSize: optimizedBuffer.length,
            status: 'success'
          });

          console.log(`✅ 이미지 ${i + 1} 고화질 처리 완료: ${fileName}`);
        } else {
          console.log(`⚠️ 이미지 ${i + 1} 다운로드 실패 (HTTP ${imageResponse.status}), 원본 URL 사용`);
          // 다운로드 실패해도 원본 URL로 계속 진행
          processedImages.push({
            originalUrl: imageUrl,
            processedUrl: imageUrl, // 원본 URL 사용
            alt: `이미지 ${i + 1}`,
            fileName: `original-${i + 1}`,
            size: 0,
            optimizedSize: 0,
            status: 'download-failed'
          });
        }
        
      } catch (error) {
        console.error(`❌ 이미지 ${i + 1} 처리 실패:`, error.message);
        // 처리 실패해도 원본 URL로 계속 진행
        processedImages.push({
          originalUrl: imageUrl,
          processedUrl: imageUrl, // 원본 URL 사용
          alt: `이미지 ${i + 1}`,
          fileName: `original-${i + 1}`,
          size: 0,
          optimizedSize: 0,
          status: 'error'
        });
      }
    }

    // 5. GPT-4o-mini로 콘텐츠 구조화 및 최적화
    const structuredContent = await generateStructuredContent(html, title, processedImages);

    // 6. 고유 slug 생성
    const slug = await generateUniqueSlug(title);

    // 7. 블로그 포스트 생성
    const blogPost = await createBlogPost({
      title: title,
      slug: slug,
      content: structuredContent,
      excerpt: structuredContent.substring(0, 200) + '...',
      featured_image: processedImages.length > 0 ? processedImages[0].processedUrl : '',
      category: '비거리 향상 드라이버',
      tags: ['마이그레이션', '고화질', '전문적'],
      status: 'published',
      author: '마쓰구골프'
    });

    res.status(200).json({
      success: true,
      data: {
        title,
        content: structuredContent,
        images: processedImages,
        blogPost,
        originalUrl: url,
        platform: 'professional-migration',
        migratedAt: new Date().toISOString(),
        note: '강석 블로그 수준의 전문적인 마이그레이션 완료'
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

// GPT-4o-mini로 콘텐츠 구조화
async function generateStructuredContent(html, title, images) {
  try {
    // 기본 텍스트 추출
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `당신은 전문적인 블로그 콘텐츠 구조화 전문가입니다. 
          
다음 요구사항에 따라 콘텐츠를 구조화하세요:

1. **제목 구조**: H1, H2, H3를 적절히 사용
2. **단락 구분**: 명확한 단락 구분과 가독성
3. **이미지 배치**: 적절한 위치에 이미지 삽입
4. **마크다운 형식**: 표준 마크다운 문법 사용
5. **SEO 최적화**: 키워드와 구조화된 콘텐츠

예시 형식:
# 메인 제목
## 섹션 제목
### 하위 제목

단락 내용...

![이미지 설명](이미지URL)

## 다음 섹션
...`
        },
        {
          role: "user",
          content: `다음 콘텐츠를 전문적인 블로그 포스트로 구조화해주세요:

제목: ${title}
원본 텍스트: ${textContent.substring(0, 2000)}
이미지 개수: ${images.length}개

이미지들을 적절한 위치에 배치하고, H1, H2, H3 제목을 사용하여 구조화된 마크다운 콘텐츠를 생성해주세요.`
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    let structuredContent = response.choices[0].message.content;

    // 이미지 URL을 실제 처리된 URL로 교체
    images.forEach((image, index) => {
      const imageMarkdown = `![${image.alt}](${image.processedUrl})`;
      structuredContent = structuredContent.replace(
        new RegExp(`!\\[이미지 ${index + 1}\\]\\([^)]+\\)`, 'g'),
        imageMarkdown
      );
    });

    return structuredContent;

  } catch (error) {
    console.error('콘텐츠 구조화 오류:', error);
    // 기본 구조로 폴백
    let fallbackContent = `# ${title}\n\n`;
    images.forEach((image, index) => {
      fallbackContent += `![${image.alt}](${image.processedUrl})\n\n`;
    });
    return fallbackContent;
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
