/**
 * 참고 사이트(golfdistillery.com, golfclubsadvisor.com)에서 콘텐츠와 이미지를 가져와서
 * 브랜드 함수와 나노바나나를 활용해 킬러 콘텐츠를 생성하는 스크립트
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * 웹페이지에서 콘텐츠와 이미지 추출
 */
async function scrapeWebpage(url) {
  try {
    console.log(`🌐 웹페이지 스크래핑 시작: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    
    // 제목 추출
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '제목 없음';
    
    // 메타 설명 추출
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    const description = metaDescMatch ? metaDescMatch[1].trim() : '';
    
    // 본문 콘텐츠 추출 (간단한 버전)
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyContent = bodyMatch ? bodyMatch[1] : html;
    
    // 이미지 URL 추출
    const imageMatches = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi) || [];
    const images = [];
    const baseUrl = new URL(url);
    
    imageMatches.forEach(imgTag => {
      const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
      if (srcMatch) {
        let src = srcMatch[1];
        // 상대 URL을 절대 URL로 변환
        if (src.startsWith('//')) {
          src = `https:${src}`;
        } else if (src.startsWith('/')) {
          src = `${baseUrl.origin}${src}`;
        } else if (!src.startsWith('http')) {
          src = `${baseUrl.origin}/${src}`;
        }
        images.push(src);
      }
    });
    
    // 콘텐츠 텍스트 추출 (간단한 버전)
    const textContent = bodyContent
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 5000); // 처음 5000자만
    
    return {
      title,
      description,
      content: textContent,
      images: images.slice(0, 5) // 최대 5개 이미지
    };
  } catch (error) {
    console.error('❌ 웹페이지 스크래핑 오류:', error);
    throw error;
  }
}

/**
 * 브랜드 함수를 사용해 콘텐츠 최적화
 */
async function optimizeWithBrandFunctions(originalContent, title, topic) {
  try {
    console.log('🎨 브랜드 함수로 콘텐츠 최적화 중...');
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/generate-enhanced-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: title,
        type: 'content',
        contentType: 'information',
        audienceTemp: 'warm',
        brandWeight: 'medium',
        customerChannel: 'local_customers',
        customerPersona: 'fitting_preferred_senior', // 피팅 선호 시니어
        painPoint: 'distance',
        keywords: '비거리, 드라이버, 골프',
        excerpt: originalContent.substring(0, 200)
      })
    });
    
    if (!response.ok) {
      throw new Error(`브랜드 최적화 API 오류: ${response.status}`);
    }
    
    const data = await response.json();
    return data.content || originalContent;
  } catch (error) {
    console.error('❌ 브랜드 최적화 오류:', error);
    // 오류 시 원본 콘텐츠 반환
    return originalContent;
  }
}

/**
 * 나노바나나로 이미지 변형
 */
async function transformImageWithNanoBanana(imageUrl, prompt) {
  try {
    console.log(`🔄 나노바나나로 이미지 변형 중: ${imageUrl.substring(0, 50)}...`);
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/compose-product-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_urls: [imageUrl],
        prompt: prompt || 'Korean golfer, professional golf course, high quality, natural lighting',
        compositionMethod: 'nano-banana-pro',
        num_images: 1,
        aspect_ratio: '16:9',
        resolution: '1024x576'
      })
    });
    
    if (!response.ok) {
      throw new Error(`나노바나나 API 오류: ${response.status}`);
    }
    
    const data = await response.json();
    return data.images?.[0]?.url || imageUrl; // 변형된 이미지 URL 또는 원본
  } catch (error) {
    console.error('❌ 나노바나나 변형 오류:', error);
    // 오류 시 원본 이미지 URL 반환
    return imageUrl;
  }
}

/**
 * 킬러 콘텐츠 생성 메인 함수
 */
async function generateKillerContent(referenceUrl, topic, contentDate) {
  try {
    console.log('🚀 킬러 콘텐츠 생성 시작...\n');
    console.log(`📌 참고 사이트: ${referenceUrl}`);
    console.log(`📌 주제: ${topic}`);
    console.log(`📌 날짜: ${contentDate}\n`);
    
    // 1. 웹페이지 스크래핑
    const scrapedData = await scrapeWebpage(referenceUrl);
    console.log('✅ 웹페이지 스크래핑 완료');
    console.log(`   제목: ${scrapedData.title}`);
    console.log(`   이미지: ${scrapedData.images.length}개\n`);
    
    // 2. 브랜드 함수로 콘텐츠 최적화
    const optimizedContent = await optimizeWithBrandFunctions(
      scrapedData.content,
      topic,
      scrapedData.title
    );
    
    // 3. 이미지 변형 (첫 번째 이미지만)
    let transformedImageUrl = null;
    if (scrapedData.images.length > 0) {
      const imagePrompt = `Korean male golfer in his 50s-60s, professional golf course setting, warm lighting, elegant atmosphere, ${topic} related scene, high quality photography`;
      transformedImageUrl = await transformImageWithNanoBanana(
        scrapedData.images[0],
        imagePrompt
      );
    }
    
    // 4. 허브 콘텐츠 생성
    const hubTitle = topic;
    const hubSummary = scrapedData.description || optimizedContent.substring(0, 200);
    
    // 최신 hub_order 확인
    const { data: allHubs } = await supabase
      .from('cc_content_calendar')
      .select('hub_order')
      .eq('is_hub_content', true)
      .not('hub_order', 'is', null);
    
    let nextHubOrder = 1;
    if (allHubs && allHubs.length > 0) {
      const maxOrder = Math.max(...allHubs.map(h => h.hub_order || 0));
      nextHubOrder = maxOrder + 1;
    }
    
    const { data: newHubContent, error: hubError } = await supabase
      .from('cc_content_calendar')
      .insert({
        title: hubTitle,
        summary: hubSummary,
        content_body: optimizedContent,
        content_date: contentDate,
        is_hub_content: true,
        hub_priority: 1,
        hub_order: nextHubOrder,
        auto_derive_channels: ['blog', 'sms', 'naver_blog', 'kakao'],
        channel_status: {
          blog: { status: '미연결', post_id: null, created_at: null },
          sms: { status: '미발행', post_id: null, created_at: null },
          naver_blog: { status: '미발행', post_id: null, created_at: null },
          kakao: { status: '미발행', post_id: null, created_at: null }
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (hubError) throw hubError;
    
    console.log('✅ 허브 콘텐츠 생성 완료!');
    console.log(`   허브 ID: ${newHubContent.id}`);
    console.log(`   hub_order: ${newHubContent.hub_order}\n`);
    
    // 5. 블로그 포스트 생성
    const slug = hubTitle.toLowerCase()
      .replace(/[^a-z0-9가-힣\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100);
    
    const blogContent = optimizedContent;
    
    const { data: newBlogPost, error: blogError } = await supabase
      .from('blog_posts')
      .insert({
        title: hubTitle,
        slug,
        content: blogContent,
        excerpt: hubSummary,
        status: 'draft',
        category: '골프 가이드',
        tags: ['비거리 향상', '골프 가이드'],
        published_at: contentDate,
        calendar_id: newHubContent.id,
        featured_image: transformedImageUrl, // 나노바나나로 변형된 이미지
        author: '마쓰구골프',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (blogError) throw blogError;
    
    console.log('✅ 블로그 포스트 생성 완료!');
    console.log(`   블로그 ID: ${newBlogPost.id}\n`);
    
    // 6. 허브와 블로그 연결
    const { error: updateError } = await supabase
      .from('cc_content_calendar')
      .update({
        blog_post_id: newBlogPost.id,
        channel_status: {
          ...newHubContent.channel_status,
          blog: {
            status: '연결됨',
            post_id: newBlogPost.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', newHubContent.id);
    
    if (updateError) throw updateError;
    
    console.log('✅ 허브와 블로그 연결 완료!\n');
    
    console.log('🎉 킬러 콘텐츠 생성 완료!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 생성 결과:');
    console.log(`   허브 ID: ${newHubContent.id}`);
    console.log(`   블로그 ID: ${newBlogPost.id}`);
    console.log(`   제목: ${hubTitle}`);
    console.log(`   날짜: ${contentDate}`);
    console.log(`   hub_order: ${newHubContent.hub_order}`);
    if (transformedImageUrl) {
      console.log(`   변형된 이미지: ${transformedImageUrl}`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 다음 단계:');
    console.log(`   1. 허브 콘텐츠 편집: /admin/content-calendar-hub`);
    console.log(`   2. 블로그 포스트 편집: /admin/blog?edit=${newBlogPost.id}&hub=${newHubContent.id}`);
    console.log(`   3. 추가 이미지 생성: 블로그 편집 화면에서 "골프 AI 생성" 버튼 사용`);
    
    return {
      hubId: newHubContent.id,
      blogId: newBlogPost.id,
      transformedImageUrl
    };
    
  } catch (error) {
    console.error('❌ 킬러 콘텐츠 생성 오류:', error);
    throw error;
  }
}

// 스크립트 실행 예시
if (require.main === module) {
  const args = process.argv.slice(2);
  const referenceUrl = args[0] || 'https://golfdistillery.com/how-to-increase-driver-distance';
  const topic = args[1] || '스윙 속도 향상의 5가지 비법';
  const contentDate = args[2] || new Date().toISOString().split('T')[0];
  
  generateKillerContent(referenceUrl, topic, contentDate)
    .then(() => {
      console.log('\n✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { generateKillerContent, scrapeWebpage, optimizeWithBrandFunctions, transformImageWithNanoBanana };

