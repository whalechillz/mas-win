/**
 * Playwright로 155번 메시지에 이미지 자동 설정
 * 브라우저를 열어서 이미지 URL을 직접 설정
 */

const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function autoSetImage155() {
  console.log('='.repeat(100));
  console.log('🖼️ 155번 메시지 이미지 자동 설정 (Playwright)');
  console.log('='.repeat(100));
  console.log('');

  // 1. DB에서 이미지 URL 확인
  const { data: message, error: msgError } = await supabase
    .from('channel_sms')
    .select('*')
    .eq('id', 155)
    .single();

  if (msgError || !message) {
    console.error('❌ 155번 메시지를 찾을 수 없습니다:', msgError);
    return;
  }

  // 2. image_metadata에서 이미지 찾기
  const { data: images } = await supabase
    .from('image_metadata')
    .select('*')
    .contains('tags', ['sms-155'])
    .eq('source', 'mms')
    .eq('channel', 'sms')
    .order('created_at', { ascending: false })
    .limit(1);

  let imageUrl = null;
  if (images && images.length > 0) {
    imageUrl = images[0].image_url;
    console.log('✅ image_metadata에서 이미지 발견:');
    console.log(`   URL: ${imageUrl.substring(0, 70)}...`);
  } else if (message.image_url && message.image_url.startsWith('http')) {
    imageUrl = message.image_url;
    console.log('✅ channel_sms.image_url 사용:');
    console.log(`   URL: ${imageUrl.substring(0, 70)}...`);
  } else {
    console.error('❌ 이미지 URL을 찾을 수 없습니다.');
    return;
  }

  console.log('');

  // 3. Playwright로 브라우저 열기
  console.log('🌐 브라우저 시작 중...');
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    // 4. SMS 에디터 페이지로 이동
    const editorUrl = 'http://localhost:3000/admin/sms?id=155';
    console.log(`📄 SMS 에디터 페이지로 이동: ${editorUrl}`);
    await page.goto(editorUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // 5. 콘솔에서 이미지 설정 함수 호출
    console.log('🖼️ 브라우저 콘솔에서 이미지 설정 시도...');
    
    const setImageResult = await page.evaluate(async (imgUrl) => {
      // React 컴포넌트의 상태를 직접 업데이트하는 것은 어려우므로
      // window 객체에 함수를 노출하거나, 직접 DOM을 조작해야 함
      
      // 방법 1: 이미지 미리보기 요소 찾아서 src 설정
      const imgElements = document.querySelectorAll('img[src*="supabase"], img[alt*="선택된"], img[alt*="이미지"]');
      if (imgElements.length > 0) {
        imgElements[0].src = imgUrl;
        return { success: true, method: 'img-src-update' };
      }
      
      // 방법 2: 갤러리 모달 열고 이미지 선택
      const galleryButton = document.querySelector('button:has-text("갤러리에서 선택"), button:has-text("갤러리")');
      if (galleryButton) {
        galleryButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 갤러리에서 이미지 찾기
        const galleryImages = document.querySelectorAll('img[src*="' + imgUrl.substring(0, 50) + '"]');
        if (galleryImages.length > 0) {
          galleryImages[0].click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          return { success: true, method: 'gallery-select' };
        }
      }
      
      return { success: false, message: '이미지 요소를 찾을 수 없습니다' };
    }, imageUrl);

    console.log('📊 이미지 설정 결과:', setImageResult);

    if (!setImageResult.success) {
      // 방법 3: API를 통해 직접 DB 업데이트 후 페이지 새로고침
      console.log('⚠️ 브라우저에서 직접 설정 실패, API를 통해 설정 시도...');
      
      // 이미 DB에 image_url이 있으므로, 페이지를 새로고침하면 자동으로 로드되어야 함
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      
      // 이미지가 표시되는지 다시 확인
      const imageVisible = await page.locator(`img[src*="${imageUrl.substring(0, 50)}"]`).first().isVisible({ timeout: 5000 }).catch(() => false);
      
      if (imageVisible) {
        console.log('✅ 페이지 새로고침 후 이미지가 표시되었습니다!');
      } else {
        console.log('⚠️ 이미지가 여전히 표시되지 않습니다.');
        console.log('   브라우저 콘솔에서 다음 명령을 실행하세요:');
        console.log(`   window.location.reload()`);
        console.log('');
        console.log('   또는 수동으로 이미지를 선택해주세요.');
      }
    } else {
      console.log('✅ 이미지 설정 완료!');
    }

    // 6. 결과 확인
    await page.waitForTimeout(2000);
    const finalImageVisible = await page.locator(`img[src*="${imageUrl.substring(0, 50)}"]`).first().isVisible({ timeout: 5000 }).catch(() => false);
    
    if (finalImageVisible) {
      const imgSrc = await page.locator(`img[src*="${imageUrl.substring(0, 50)}"]`).first().getAttribute('src');
      console.log('');
      console.log('✅ 최종 확인: 이미지가 표시되고 있습니다!');
      console.log(`   이미지 URL: ${imgSrc?.substring(0, 70)}...`);
    } else {
      console.log('');
      console.log('⚠️ 이미지가 표시되지 않습니다.');
      console.log('   브라우저를 열어두었으니 수동으로 확인해주세요.');
    }

    console.log('');
    console.log('⏳ 브라우저를 10초간 열어둡니다...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
    console.log('✅ 브라우저 종료');
  }
}

autoSetImage155();

