/**
 * 블로그 486을 위한 킬러 콘텐츠 생성 스크립트
 * - 6장의 이미지 생성 (메인 1 + 시니어 1 + 챕터 4)
 * - originals/blog/YYYY-MM/{blog-id}/ 경로에 저장
 */

const { createClient } = require('@supabase/supabase-js');
const { chromium } = require('playwright');
const { fal } = require('@fal-ai/client');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// FAL AI API 키 설정
if (process.env.FAL_KEY) {
  fal.config({
    credentials: process.env.FAL_KEY
  });
} else if (process.env.FAL_API_KEY) {
  fal.config({
    credentials: process.env.FAL_API_KEY
  });
}

// generate-killer-content-from-reference.js의 함수들 import
const { 
  optimizeWithBrandFunctions
} = require('./generate-killer-content-from-reference');

/**
 * Playwright를 사용한 웹페이지 스크래핑 (403 오류 방지)
 */
async function scrapeWebpageWithPlaywright(url) {
  let browser = null;
  try {
    console.log(`🌐 웹페이지 스크래핑 시작 (Playwright): ${url}`);
    
    browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000); // 페이지 로드 대기
    
    // HTML 가져오기
    const html = await page.content();
    
    // 제목 추출
    const title = await page.title().catch(() => {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      return titleMatch ? titleMatch[1].trim() : '제목 없음';
    });
    
    // 메타 설명 추출
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    const description = metaDescMatch ? metaDescMatch[1].trim() : '';
    
    // 이미지 URL 추출
    const images = await page.evaluate(() => {
      const imgTags = Array.from(document.querySelectorAll('img'));
      return imgTags
        .map(img => {
          const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
          return src ? src : null;
        })
        .filter(src => src && !src.includes('data:image') && !src.includes('icon') && !src.includes('logo'))
        .slice(0, 5); // 최대 5개
    });
    
    // 본문 콘텐츠 추출
    const bodyContent = await page.evaluate(() => {
      const body = document.body;
      if (!body) return '';
      
      // 스크립트와 스타일 제거
      const scripts = body.querySelectorAll('script, style');
      scripts.forEach(el => el.remove());
      
      return body.innerText || body.textContent || '';
    });
    
    const textContent = bodyContent
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 5000); // 처음 5000자만
    
    await browser.close();
    
    return {
      title,
      description,
      content: textContent,
      images: images || []
    };
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    console.error('❌ 웹페이지 스크래핑 오류:', error);
    throw error;
  }
}

/**
 * 외부 이미지를 Supabase에 임시 저장 (FAL AI 접근 가능하도록)
 */
async function downloadAndSaveImageToSupabase(imageUrl) {
  try {
    // 이미지 다운로드
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`이미지 다운로드 실패: ${imageResponse.status}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const timestamp = Date.now();
    const fileExtension = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
    const fileName = `temp/golf-distillery-${timestamp}.${fileExtension}`;
    
    // Supabase Storage에 임시 저장
    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(fileName, imageBuffer, {
        contentType: imageResponse.headers.get('content-type') || `image/${fileExtension}`,
        upsert: false
      });
    
    if (uploadError) {
      throw new Error(`Supabase 업로드 실패: ${uploadError.message}`);
    }
    
    // 공개 URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(fileName);
    
    console.log(`✅ 임시 이미지 저장 완료: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error('❌ 이미지 다운로드/저장 오류:', error);
    throw error;
  }
}

/**
 * 나노바나나로 이미지 변형 (로고 교체 + 워터마크 제거 + 트렌드 스타일)
 * FAL AI를 직접 호출하여 이미지 변형
 */
async function transformImageWithNanoBananaEnhanced(imageUrl, prompt) {
  try {
    console.log(`🔄 나노바나나로 이미지 변형 중: ${imageUrl.substring(0, 50)}...`);
    
    // 외부 URL이면 먼저 Supabase에 저장
    let accessibleImageUrl = imageUrl;
    if (imageUrl.includes('golfdistillery.com') || imageUrl.includes('http://') || imageUrl.includes('https://')) {
      try {
        accessibleImageUrl = await downloadAndSaveImageToSupabase(imageUrl);
      } catch (error) {
        console.warn('⚠️ 이미지 다운로드 실패, 원본 URL 사용:', error.message);
      }
    }
    
    // 프롬프트에 로고 교체, 워터마크 제거, 트렌드 스타일 추가 (콘텐츠 정책 위반 방지)
    const enhancedPrompt = `${prompt || 'Korean golfer, professional golf course, high quality, natural lighting'}, remove watermark, remove logo, remove text, remove branding, add MASSGOO branding, MASSGOO logo on cap, modern golf style 2025, contemporary photography`;
    
    // FAL AI 직접 호출
    try {
      const result = await fal.subscribe('fal-ai/nano-banana-pro/edit', {
        input: {
          prompt: enhancedPrompt,
          image_urls: [accessibleImageUrl],
          num_images: 1,
          aspect_ratio: '16:9',
          output_format: 'jpeg',
          resolution: '1K'
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            update.logs?.map((log) => log.message).forEach((msg) => {
              console.log('📊 FAL AI 로그:', msg);
            });
          }
        },
      });
      
      if (!result.data || !result.data.images || result.data.images.length === 0) {
        throw new Error('FAL AI에서 이미지를 생성하지 못했습니다.');
      }
      
      return result.data.images[0].url || imageUrl;
    } catch (error) {
      // 에러 상세 정보 출력
      if (error.body && error.body.detail) {
        console.error('❌ FAL AI 상세 오류:', JSON.stringify(error.body.detail, null, 2));
      }
      throw error;
    }
  } catch (error) {
    console.error('❌ 나노바나나 변형 오류:', error);
    return imageUrl;
  }
}

/**
 * 이미지를 블로그 폴더에 저장 (카톡 콘텐츠와 동일한 패턴)
 */
async function saveBlogImageToSupabase(imageUrl, imageType, blogId, dateStr) {
  try {
    // YYYY-MM 형식으로 폴더 생성
    const yearMonth = dateStr.substring(0, 7); // YYYY-MM
    const folderPath = `originals/blog/${yearMonth}/${blogId}`;
    
    // 파일명 생성
    const fileName = imageType === 'main' 
      ? 'featured-image.jpg'
      : imageType === 'senior'
      ? 'senior-tip.jpg'
      : `chapter-${imageType.replace('chapter-', '')}.jpg`;
    
    const storagePath = `${folderPath}/${fileName}`;
    
    // 이미지 다운로드
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`이미지 다운로드 실패: ${imageResponse.status}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Supabase Storage에 업로드
    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(storagePath, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: true // 재생성 시 덮어쓰기
      });
    
    if (uploadError) {
      throw new Error(`업로드 실패: ${uploadError.message}`);
    }
    
    // 공개 URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(storagePath);
    
    console.log(`✅ 이미지 저장 완료: ${storagePath}`);
    
    return {
      path: storagePath,
      url: publicUrl,
      fileName: fileName,
      imageType: imageType
    };
    
  } catch (error) {
    console.error(`❌ 이미지 저장 오류 (${imageType}):`, error);
    throw error;
  }
}

/**
 * 블로그 486용 킬러 콘텐츠 생성
 */
async function generateKillerContentForBlog486() {
  try {
    console.log('🚀 블로그 486용 킬러 콘텐츠 생성 시작...\n');
    
    // 1. 블로그 486 정보 확인
    const { data: blog486, error: blogError } = await supabase
      .from('blog_posts')
      .select('id, title, content, published_at, calendar_id, featured_image')
      .eq('id', 486)
      .single();
    
    if (blogError || !blog486) {
      console.error('❌ 블로그 486을 찾을 수 없습니다:', blogError);
      return;
    }
    
    console.log('✅ 블로그 486 확인:');
    console.log(`   제목: ${blog486.title}`);
    console.log(`   발행일: ${blog486.published_at || '없음'}`);
    console.log(`   calendar_id: ${blog486.calendar_id || '없음'}\n`);
    
    // 2. 참고 사이트 URL 및 주제 설정 (블로그 486의 제목 기반)
    // 다운스윙 관련 콘텐츠로 가정
    const referenceUrl = 'https://www.golfdistillery.com/swing-tips/downswing/';
    const topic = blog486.title || '다운스윙 완벽 마스터하기';
    const contentDate = blog486.published_at ? blog486.published_at.split('T')[0] : new Date().toISOString().split('T')[0];
    
    console.log(`📌 참고 사이트: ${referenceUrl}`);
    console.log(`📌 주제: ${topic}`);
    console.log(`📌 날짜: ${contentDate}\n`);
    
    // 3. 웹페이지 스크래핑 시도 (Playwright 사용)
    let scrapedData = null;
    let baseImageUrl = null;
    
    try {
      scrapedData = await scrapeWebpageWithPlaywright(referenceUrl);
      console.log('✅ 웹페이지 스크래핑 완료');
      console.log(`   제목: ${scrapedData.title}`);
      console.log(`   이미지: ${scrapedData.images.length}개\n`);
      
      if (scrapedData.images.length > 0) {
        baseImageUrl = scrapedData.images[0];
      }
    } catch (error) {
      console.warn('⚠️ 웹페이지 스크래핑 실패, 기본 이미지 URL 사용:', error.message);
      // Golf Distillery 다운스윙 페이지의 대표 이미지 URL (직접 제공)
      baseImageUrl = 'https://www.golfdistillery.com/wp-content/uploads/swing-tips-downswing.jpg';
      scrapedData = {
        title: topic,
        description: '',
        content: blog486.content || '',
        images: [baseImageUrl]
      };
      console.log(`✅ 기본 이미지 URL 설정: ${baseImageUrl}\n`);
    }
    
    // baseImageUrl이 없으면 기본 이미지 URL 사용
    if (!baseImageUrl && scrapedData && scrapedData.images && scrapedData.images.length > 0) {
      baseImageUrl = scrapedData.images[0];
    } else if (!baseImageUrl) {
      baseImageUrl = 'https://www.golfdistillery.com/wp-content/uploads/swing-tips-downswing.jpg';
      console.log(`✅ 기본 이미지 URL 사용: ${baseImageUrl}\n`);
    }
    
    // 4. 브랜드 함수로 콘텐츠 최적화 (기존 콘텐츠 사용)
    let optimizedContent = blog486.content || '';
    if (scrapedData && scrapedData.content) {
      try {
        optimizedContent = await optimizeWithBrandFunctions(
          scrapedData.content || blog486.content,
          topic,
          scrapedData.title || topic
        );
      } catch (error) {
        console.warn('⚠️ 브랜드 최적화 실패, 기존 콘텐츠 사용:', error.message);
        optimizedContent = blog486.content || '';
      }
    }
    
    // 5. 이미지 생성 및 저장 (총 6장)
    const savedImages = [];
    
    if (baseImageUrl) {
      
      // 이미지 1: 메인 이미지
      console.log('📸 이미지 1/6 생성 중: 메인 이미지...');
      const mainImagePrompt = `Korean male golfer in his 50s-60s, professional golf course setting, warm lighting, elegant atmosphere, downswing motion, full body swing, club at mid-downswing position, high quality photography, dynamic action`;
      const mainImageUrl = await transformImageWithNanoBananaEnhanced(baseImageUrl, mainImagePrompt);
      const mainImage = await saveBlogImageToSupabase(mainImageUrl, 'main', blog486.id, contentDate);
      savedImages.push(mainImage);
      console.log('✅ 메인 이미지 저장 완료\n');
      
      // 이미지 2: 시니어 팁
      console.log('📸 이미지 2/6 생성 중: 시니어 팁...');
      const seniorTipPrompt = `Korean senior male golfer in his 60s-70s, professional golf course setting, warm lighting, elegant atmosphere, senior-friendly golf swing, comfortable posture, relaxed stance, smooth motion, high quality photography, gentle swing`;
      const seniorTipUrl = await transformImageWithNanoBananaEnhanced(baseImageUrl, seniorTipPrompt);
      const seniorTip = await saveBlogImageToSupabase(seniorTipUrl, 'senior', blog486.id, contentDate);
      savedImages.push(seniorTip);
      console.log('✅ 시니어 팁 이미지 저장 완료\n');
      
      // 이미지 3-6: 챕터 이미지 (각각 다른 스윙 단계)
      const chapters = [
        { 
          num: 1, 
          name: 'backswing', 
          prompt: 'Korean male golfer in his 50s-60s, professional golf course, backswing position, club at top of backswing, perfect timing, smooth transition, left arm straight, high quality photography' 
        },
        { 
          num: 2, 
          name: 'downswing', 
          prompt: 'Korean male golfer in his 50s-60s, professional golf course, downswing acceleration, club descending, power generation, smooth transition, body rotation, high quality photography' 
        },
        { 
          num: 3, 
          name: 'weight-transfer', 
          prompt: 'Korean male golfer in his 50s-60s, professional golf course, body movement technique, proper balance shift, stable stance, body coordination, high quality photography' 
        },
        { 
          num: 4, 
          name: 'release', 
          prompt: 'Korean male golfer in his 50s-60s, professional golf course, swing completion, impact moment, club contact, extension movement, follow through, high quality photography' 
        }
      ];
      
      for (const chapter of chapters) {
        console.log(`📸 이미지 ${chapter.num + 2}/6 생성 중: 챕터 ${chapter.num} (${chapter.name})...`);
        const chapterUrl = await transformImageWithNanoBananaEnhanced(baseImageUrl, chapter.prompt);
        const chapterImage = await saveBlogImageToSupabase(chapterUrl, `chapter-${chapter.num}`, blog486.id, contentDate);
        savedImages.push(chapterImage);
        console.log(`✅ 챕터 ${chapter.num} 이미지 저장 완료\n`);
      }
    }
    
    // 6. 블로그 포스트 업데이트 (이미지 URL 추가)
    const mainImage = savedImages.find(img => img.imageType === 'main');
    const seniorTipImage = savedImages.find(img => img.imageType === 'senior');
    const chapterImages = savedImages.filter(img => img.imageType.startsWith('chapter')).sort((a, b) => {
      const aNum = parseInt(a.imageType.split('-')[1]);
      const bNum = parseInt(b.imageType.split('-')[1]);
      return aNum - bNum;
    });
    
    // 본문에 이미지 삽입
    let blogContent = optimizedContent;
    
    // 시니어 팁 섹션 추가
    if (seniorTipImage) {
      const seniorSection = `\n\n## 👴 시니어 골퍼를 위한 특별 팁\n\n![시니어 골퍼 특별 팁](${seniorTipImage.url})\n\n*시니어 골퍼를 위한 맞춤형 스윙 팁을 제공합니다.*\n\n`;
      blogContent = seniorSection + blogContent;
    }
    
    // 챕터별 이미지 섹션 추가
    if (chapterImages.length > 0) {
      let chapterSection = '\n\n## 📸 골프 스윙 핵심 포인트\n\n';
      
      const chapterTitles = [
        '백스윙에서 타이밍 잡기',
        '다운스윙 가속화 기술',
        '체중 이동 활용하기',
        '릴리스 타이밍 최적화'
      ];
      
      chapterImages.forEach((img, index) => {
        const chapterNum = parseInt(img.imageType.split('-')[1]);
        chapterSection += `### ${chapterNum}. ${chapterTitles[chapterNum - 1]}\n\n![${chapterTitles[chapterNum - 1]}](${img.url})\n\n*${chapterTitles[chapterNum - 1]}에 대한 상세한 설명과 실전 팁을 제공합니다.*\n\n`;
      });
      
      // 본문 중간 위치에 챕터 섹션 삽입
      const contentLength = blogContent.length;
      const insertPosition = Math.floor(contentLength / 2);
      blogContent = blogContent.slice(0, insertPosition) + chapterSection + blogContent.slice(insertPosition);
    }
    
    // 블로그 포스트 업데이트
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({
        content: blogContent,
        featured_image: mainImage?.url || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', blog486.id);
    
    if (updateError) {
      console.error('❌ 블로그 포스트 업데이트 실패:', updateError);
      throw updateError;
    }
    
    console.log('✅ 블로그 포스트 업데이트 완료!\n');
    
    console.log('🎉 블로그 486용 킬러 콘텐츠 생성 완료!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 생성 결과:');
    console.log(`   블로그 ID: ${blog486.id}`);
    console.log(`   제목: ${blog486.title}`);
    console.log(`   날짜: ${contentDate}`);
    console.log(`   생성된 이미지: ${savedImages.length}장`);
    console.log(`   저장 경로: originals/blog/${contentDate.substring(0, 7)}/${blog486.id}/`);
    savedImages.forEach((img, index) => {
      console.log(`     ${index + 1}. ${img.fileName}: ${img.url}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return {
      blogId: blog486.id,
      savedImages,
      folderPath: `originals/blog/${contentDate.substring(0, 7)}/${blog486.id}/`
    };
    
  } catch (error) {
    console.error('❌ 킬러 콘텐츠 생성 오류:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  generateKillerContentForBlog486()
    .then(() => {
      console.log('\n✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { generateKillerContentForBlog486 };

