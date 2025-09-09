/**
 * Playwright 기반 블로그 마이그레이션 API
 * 강석님 블로그처럼 실제 콘텐츠 이미지를 캡처해서 가져오는 방식
 */

import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright-aws-lambda';
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

    console.log('🚀 Playwright 기반 블로그 마이그레이션 시작:', url);

    // Playwright로 블로그 콘텐츠 캡처 및 마이그레이션
    const migrationResult = await migrateBlogWithPlaywright(url);

    res.status(200).json({
      success: true,
      data: migrationResult
    });

  } catch (error) {
    console.error('마이그레이션 오류:', error);
    res.status(500).json({ 
      error: '마이그레이션 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
}

async function migrateBlogWithPlaywright(url) {
  let browser = null;
  
  try {
    console.log('🌐 Playwright 브라우저 시작...');
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    // 페이지 로드
    console.log('📄 페이지 로드 중:', url);
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // 페이지 제목 추출
    const title = await page.title();
    console.log('📝 제목 추출:', title);
    
    // 실제 블로그 콘텐츠 영역 찾기
    const contentSelector = await findBlogContentSelector(page);
    console.log('🎯 콘텐츠 선택자:', contentSelector);
    
    // 콘텐츠 영역의 모든 이미지 캡처
    const contentImages = await captureContentImages(page, contentSelector);
    console.log('📸 콘텐츠 이미지 캡처 완료:', contentImages.length, '개');
    
    // 콘텐츠 텍스트 추출
    const contentText = await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      if (!element) return '';
      
      // HTML 태그 제거하고 텍스트만 추출
      return element.innerText || element.textContent || '';
    }, contentSelector);
    
    // 마크다운 콘텐츠 생성 (이미지 포함)
    const markdownContent = await generateMarkdownWithImages(contentText, contentImages);
    
    // 고유 slug 생성
    const slug = await generateUniqueSlug(title);
    
    // 블로그 포스트 생성
    const blogPost = await createBlogPost({
      title: title,
      slug: slug,
      content: markdownContent,
      excerpt: contentText.substring(0, 200) + '...',
      featured_image: contentImages.length > 0 ? contentImages[0].storedUrl : '',
      category: '비거리 향상 드라이버',
      tags: ['마이그레이션', 'Playwright', '고화질'],
      status: 'published',
      author: '마쓰구골프'
    });
    
    return {
      title,
      content: markdownContent,
      images: contentImages,
      blogPost,
      originalUrl: url,
      platform: 'playwright',
      migratedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Playwright 마이그레이션 오류:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function findBlogContentSelector(page) {
  // 다양한 블로그 콘텐츠 선택자 시도
  const selectors = [
    'article',
    '.blog-post-content',
    '.post-content',
    '.entry-content',
    '.content',
    'main',
    '.main-content',
    '[role="main"]',
    '.blog-content',
    '.post-body'
  ];
  
  for (const selector of selectors) {
    const element = await page.$(selector);
    if (element) {
      // 이미지가 있는지 확인
      const hasImages = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        return el && el.querySelectorAll('img').length > 0;
      }, selector);
      
      if (hasImages) {
        console.log('✅ 콘텐츠 영역 발견:', selector);
        return selector;
      }
    }
  }
  
  // 기본 선택자 반환
  return 'body';
}

async function captureContentImages(page, contentSelector) {
  const images = [];
  
  // 콘텐츠 영역의 모든 이미지 요소 찾기
  const imageElements = await page.$$(`${contentSelector} img`);
  console.log('🖼️ 발견된 이미지 요소:', imageElements.length, '개');
  
  for (let i = 0; i < imageElements.length; i++) {
    try {
      const element = imageElements[i];
      
      // 이미지 정보 추출
      const imageInfo = await page.evaluate((el) => {
        const src = el.src || el.getAttribute('data-src') || el.getAttribute('data-lazy-src');
        const alt = el.alt || '';
        const width = el.naturalWidth || el.width || 0;
        const height = el.naturalHeight || el.height || 0;
        
        return { src, alt, width, height };
      }, element);
      
      if (!imageInfo.src || imageInfo.src.startsWith('data:')) {
        continue; // 유효하지 않은 이미지 스킵
      }
      
      console.log(`📸 이미지 ${i + 1} 캡처 중:`, imageInfo.src);
      
      // 이미지 요소 스크린샷 캡처
      const screenshot = await element.screenshot({
        type: 'png'
      });
      
      // WebP로 최적화
      const optimizedImage = await sharp(screenshot)
        .webp({ quality: 90 })
        .toBuffer();
      
      // Supabase Storage에 저장
      const fileName = `blog-image-${Date.now()}-${i + 1}.webp`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(fileName, optimizedImage, {
          contentType: 'image/webp',
          upsert: false
        });
      
      if (uploadError) {
        console.error('이미지 업로드 실패:', uploadError);
        continue;
      }
      
      const storedUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/blog-images/${fileName}`;
      
      images.push({
        originalUrl: imageInfo.src,
        storedUrl: storedUrl,
        alt: imageInfo.alt,
        width: imageInfo.width,
        height: imageInfo.height,
        fileName: fileName
      });
      
      console.log(`✅ 이미지 ${i + 1} 저장 완료:`, storedUrl);
      
    } catch (error) {
      console.error(`❌ 이미지 ${i + 1} 캡처 실패:`, error.message);
    }
  }
  
  return images;
}

async function generateMarkdownWithImages(contentText, images) {
  let markdown = contentText;
  
  // 이미지를 마크다운 형식으로 삽입
  images.forEach((image, index) => {
    const imageMarkdown = `![${image.alt || `이미지 ${index + 1}`}](${image.storedUrl})`;
    
    // 원본 이미지 URL을 새로운 URL로 교체
    if (image.originalUrl) {
      markdown = markdown.replace(new RegExp(image.originalUrl, 'g'), imageMarkdown);
    } else {
      // 이미지가 없으면 텍스트 끝에 추가
      markdown += `\n\n${imageMarkdown}`;
    }
  });
  
  return markdown;
}

async function generateUniqueSlug(title) {
  let baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s]/g, '') // 특수문자 제거
    .replace(/\s+/g, '-') // 공백을 하이픈으로
    .replace(/-+/g, '-') // 연속된 하이픈을 하나로
    .replace(/^-|-$/g, '') // 앞뒤 하이픈 제거
    .substring(0, 80); // 길이 제한 (타임스탬프 공간 확보)
  
  let slug = baseSlug;
  let counter = 1;
  
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
