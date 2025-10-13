/**
 * Playwright를 사용한 강력한 네이버 블로그 마이그레이션 API
 * 모든 방법을 동원해서 콘텐츠 추출
 */

import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';

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

  let browser = null;
  
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL이 필요합니다.' });
    }

    console.log('🚀 Playwright 네이버 블로그 마이그레이션 시작:', url);

    // Playwright 브라우저 실행
    browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    // 1단계: 데스크톱 뷰로 시도
    console.log('🌐 1단계: 데스크톱 뷰 접근');
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    
    let title = '';
    let content = '';
    let images = [];

    // 제목 추출 (여러 방법 시도)
    try {
      // 방법 1: se-title-text
      title = await page.textContent('.se-title-text').catch(() => '');
      if (!title) {
        // 방법 2: post-title
        title = await page.textContent('.post-title').catch(() => '');
      }
      if (!title) {
        // 방법 3: h1 태그
        title = await page.textContent('h1').catch(() => '');
      }
      if (!title) {
        // 방법 4: title 태그
        title = await page.title();
      }
    } catch (e) {
      console.log('제목 추출 실패:', e.message);
    }

    // 콘텐츠 추출 (여러 방법 시도)
    try {
      // 방법 1: se-main-container
      content = await page.textContent('.se-main-container').catch(() => '');
      if (!content || content.length < 50) {
        // 방법 2: postViewArea
        content = await page.textContent('#postViewArea').catch(() => '');
      }
      if (!content || content.length < 50) {
        // 방법 3: 모든 p 태그
        const pElements = await page.$$('p');
        const pTexts = await Promise.all(pElements.map(p => p.textContent()));
        content = pTexts.filter(text => text && text.length > 10).join('\n\n');
      }
      if (!content || content.length < 50) {
        // 방법 4: 모든 div에서 텍스트 추출
        const divElements = await page.$$('div');
        const divTexts = await Promise.all(divElements.map(div => div.textContent()));
        content = divTexts
          .filter(text => text && text.length > 20 && !text.includes('네이버') && !text.includes('블로그'))
          .join('\n\n');
      }
    } catch (e) {
      console.log('콘텐츠 추출 실패:', e.message);
    }

    // 이미지 추출
    try {
      const imgElements = await page.$$('img');
      images = await Promise.all(
        imgElements.map(async (img) => {
          const src = await img.getAttribute('src').catch(() => '');
          const dataSrc = await img.getAttribute('data-src').catch(() => '');
          const dataOriginal = await img.getAttribute('data-original').catch(() => '');
          return dataSrc || dataOriginal || src;
        })
      );
      images = images.filter(url => url && url.startsWith('http'));
    } catch (e) {
      console.log('이미지 추출 실패:', e.message);
    }

    // 2단계: 모바일 뷰로 재시도 (콘텐츠가 부족한 경우)
    if (!content || content.length < 100) {
      console.log('📱 2단계: 모바일 뷰로 재시도');
      
      const mobileUrl = url.replace('blog.naver.com', 'm.blog.naver.com');
      await page.goto(mobileUrl, { waitUntil: 'networkidle', timeout: 30000 });
      
      try {
        const mobileContent = await page.textContent('.se-main-container').catch(() => '');
        if (mobileContent && mobileContent.length > content.length) {
          content = mobileContent;
          console.log('✅ 모바일 뷰에서 더 나은 콘텐츠 추출');
        }
      } catch (e) {
        console.log('모바일 콘텐츠 추출 실패:', e.message);
      }
    }

    // 3단계: JavaScript 비활성화 모드로 재시도
    if (!content || content.length < 100) {
      console.log('🚫 3단계: JavaScript 비활성화 모드로 재시도');
      
      await page.setJavaScriptEnabled(false);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      try {
        const noJsContent = await page.textContent('body').catch(() => '');
        if (noJsContent && noJsContent.length > content.length) {
          // HTML 태그 제거하고 텍스트만 추출
          content = noJsContent
            .replace(/<script[^>]*>.*?<\/script>/gis, '')
            .replace(/<style[^>]*>.*?<\/style>/gis, '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          console.log('✅ JavaScript 비활성화 모드에서 콘텐츠 추출');
        }
      } catch (e) {
        console.log('JavaScript 비활성화 콘텐츠 추출 실패:', e.message);
      }
    }

    // 4단계: iframe 내부 콘텐츠 추출
    if (!content || content.length < 100) {
      console.log('🖼️ 4단계: iframe 내부 콘텐츠 추출');
      
      try {
        const iframe = await page.$('iframe#mainFrame');
        if (iframe) {
          const frame = await iframe.contentFrame();
          if (frame) {
            const iframeContent = await frame.textContent('body').catch(() => '');
            if (iframeContent && iframeContent.length > content.length) {
              content = iframeContent
                .replace(/<script[^>]*>.*?<\/script>/gis, '')
                .replace(/<style[^>]*>.*?<\/style>/gis, '')
                .replace(/<[^>]*>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
              console.log('✅ iframe 내부에서 콘텐츠 추출');
            }
          }
        }
      } catch (e) {
        console.log('iframe 콘텐츠 추출 실패:', e.message);
      }
    }

    // 5단계: 최후의 수단 - 전체 페이지 텍스트 추출
    if (!content || content.length < 100) {
      console.log('🔍 5단계: 전체 페이지 텍스트 추출');
      
      try {
        const fullText = await page.textContent('body');
        if (fullText) {
          // 의미있는 문장들만 추출
          const sentences = fullText
            .split(/[.!?]\s+/)
            .filter(s => s.length > 20 && s.length < 500)
            .filter(s => !s.includes('네이버') && !s.includes('블로그') && !s.includes('로그인'));
          
          if (sentences.length > 0) {
            content = sentences.slice(0, 15).join('. ') + '.';
            console.log('✅ 전체 페이지에서 의미있는 텍스트 추출:', sentences.length, '개 문장');
          }
        }
      } catch (e) {
        console.log('전체 페이지 텍스트 추출 실패:', e.message);
      }
    }

    // 결과 정리
    title = title || '제목을 추출할 수 없습니다';
    content = content || '콘텐츠를 추출할 수 없습니다';
    
    // 고유 slug 생성
    const baseSlug = title.toLowerCase()
      .replace(/[^a-z0-9가-힣\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    const timestamp = Date.now();
    const slug = `${baseSlug}-${timestamp}`;

    console.log('📊 추출 결과:');
    console.log('  - 제목:', title);
    console.log('  - 콘텐츠 길이:', content.length);
    console.log('  - 이미지 개수:', images.length);

    // 데이터베이스에 저장
    const { data: post, error: insertError } = await supabase
      .from('blog_posts')
      .insert({
        title: title,
        slug: slug,
        content: content,
        excerpt: content.length > 200 ? content.substring(0, 200) + '...' : content,
        featured_image: images[0] || null,
        category: 'migrated',
        tags: ['네이버 블로그', '마이그레이션'],
        status: 'draft',
        meta_title: title,
        meta_description: content.length > 160 ? content.substring(0, 160) + '...' : content,
        meta_keywords: '네이버 블로그, 마이그레이션',
        author: '마쓰구골프',
        published_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`데이터베이스 저장 실패: ${insertError.message}`);
    }

    console.log(`✅ Playwright 마이그레이션 완료: ${post.id}`);

    return res.status(200).json({
      success: true,
      message: 'Playwright 네이버 블로그 마이그레이션 성공',
      data: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt,
        featured_image: post.featured_image,
        images: images,
        imageCount: images.length,
        status: 'playwright-migration-success'
      }
    });

  } catch (error) {
    console.error('❌ Playwright 마이그레이션 오류:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
