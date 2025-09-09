/**
 * Puppeteer 기반 고화질 이미지 캡처 마이그레이션 API
 * 강석님 블로그처럼 실제 콘텐츠 이미지를 고화질로 캡처
 */

import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer-core';
import chromium from 'chrome-aws-lambda';
import sharp from 'sharp';

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

    console.log('🎭 Puppeteer로 고화질 마이그레이션 시작:', url);

    // Puppeteer 브라우저 시작
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    
    // 뷰포트 설정 (고화질을 위해)
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
    
    // User-Agent 설정
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // 페이지 로드
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // 제목 추출
    const title = await page.title();

    // 실제 콘텐츠 추출
    const contentText = await page.evaluate(() => {
      // 메타 태그에서 설명 추출
      const metaDesc = document.querySelector('meta[name="description"]')?.content || '';
      const ogDesc = document.querySelector('meta[property="og:description"]')?.content || '';
      const twitterDesc = document.querySelector('meta[name="twitter:description"]')?.content || '';
      
      // JSON-LD에서 설명 추출
      let jsonLdDesc = '';
      const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
      jsonLdScripts.forEach(script => {
        try {
          const data = JSON.parse(script.textContent);
          if (data.description) jsonLdDesc += data.description + '\n';
          if (data.articleBody) jsonLdDesc += data.articleBody + '\n';
        } catch (e) {}
      });
      
      // 텍스트 콘텐츠 추출
      const paragraphs = Array.from(document.querySelectorAll('p')).map(p => p.textContent.trim()).filter(text => text.length > 20);
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => h.textContent.trim()).filter(text => text.length > 5);
      const listItems = Array.from(document.querySelectorAll('li')).map(li => li.textContent.trim()).filter(text => text.length > 10);
      
      return {
        metaDesc,
        ogDesc,
        twitterDesc,
        jsonLdDesc,
        paragraphs: paragraphs.join('\n\n'),
        headings: headings.map(h => '## ' + h).join('\n\n'),
        listItems: listItems.map(li => '- ' + li).join('\n')
      };
    });

    // 콘텐츠 조합
    let content = '';
    if (contentText.metaDesc) content += contentText.metaDesc + '\n\n';
    if (contentText.ogDesc) content += contentText.ogDesc + '\n\n';
    if (contentText.twitterDesc) content += contentText.twitterDesc + '\n\n';
    if (contentText.jsonLdDesc) content += contentText.jsonLdDesc + '\n\n';
    if (contentText.headings) content += contentText.headings + '\n\n';
    if (contentText.paragraphs) content += contentText.paragraphs + '\n\n';
    if (contentText.listItems) content += contentText.listItems + '\n\n';

    // 이미지 URL 추출
    const contentImages = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.map(img => ({
        src: img.src,
        alt: img.alt || '이미지',
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height
      })).filter(img => 
        img.src && 
        !img.src.includes('data:') && 
        !img.src.includes('placeholder') &&
        img.width > 100 && 
        img.height > 100
      ).slice(0, 10); // 최대 10개
    });

    console.log(`📸 ${contentImages.length}개의 이미지 발견`);

    // 고화질 이미지 캡처 및 업로드
    const processedImages = [];
    for (let i = 0; i < contentImages.length; i++) {
      const image = contentImages[i];
      try {
        console.log(`🖼️ 이미지 ${i + 1} 캡처 중: ${image.src}`);
        
        // 이미지 요소 찾기
        const imageElement = await page.$(`img[src="${image.src}"]`);
        if (!imageElement) continue;

        // 고화질 스크린샷 캡처
        const screenshot = await imageElement.screenshot({
          type: 'png',
          quality: 100
        });

        // Sharp로 WebP 최적화
        const optimizedImage = await sharp(screenshot)
          .webp({ quality: 95 })
          .resize(2000, 2000, { 
            fit: 'inside',
            withoutEnlargement: true 
          })
          .toBuffer();

        // 파일명 생성
        const timestamp = Date.now();
        const fileName = `high-quality-image-${i + 1}-${timestamp}.webp`;

        // Supabase Storage에 업로드
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('blog-images')
          .upload(fileName, optimizedImage, {
            contentType: 'image/webp',
            cacheControl: '3600'
          });

        if (uploadError) {
          console.error('이미지 업로드 오류:', uploadError);
          continue;
        }

        // 공개 URL 생성
        const { data: { publicUrl } } = supabase.storage
          .from('blog-images')
          .getPublicUrl(fileName);

        processedImages.push({
          originalUrl: image.src,
          storedUrl: publicUrl,
          alt: image.alt,
          fileName: fileName,
          width: image.width,
          height: image.height
        });

        console.log(`✅ 이미지 ${i + 1} 업로드 완료: ${publicUrl}`);

      } catch (error) {
        console.error(`이미지 ${i + 1} 처리 오류:`, error);
        // 오류가 발생해도 원본 URL 사용
        processedImages.push({
          originalUrl: image.src,
          storedUrl: image.src,
          alt: image.alt,
          fileName: `image-${i + 1}`,
          width: image.width,
          height: image.height
        });
      }
    }

    await browser.close();

    // 이미지를 콘텐츠에 포함
    if (processedImages.length > 0) {
      content += '\n\n## 고화질 이미지\n\n';
      processedImages.forEach((image, index) => {
        content += `![${image.alt}](${image.storedUrl})\n\n`;
      });
    }

    // 고유 slug 생성
    const slug = await generateUniqueSlug(title);

    // 블로그 포스트 생성
    const blogPost = await createBlogPost({
      title: title,
      slug: slug,
      content: content,
      excerpt: content.substring(0, 200) + '...',
      featured_image: processedImages.length > 0 ? processedImages[0].storedUrl : '',
      category: '비거리 향상 드라이버',
      tags: ['마이그레이션', '고화질', 'Puppeteer'],
      status: 'published',
      author: '마쓰구골프'
    });

    res.status(200).json({
      success: true,
      data: {
        title,
        content: content,
        images: processedImages,
        blogPost,
        originalUrl: url,
        platform: 'puppeteer-high-quality',
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
  
  // 중복 확인 및 고유 slug 생성
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
