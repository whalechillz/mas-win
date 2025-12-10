/**
 * Playwright로 155번 메시지에 이미지 자동 선택
 * 갤러리 모달을 열고 이미지를 찾아서 클릭
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

async function selectImage155() {
  console.log('='.repeat(100));
  console.log('🖼️ 155번 메시지 이미지 자동 선택 (Playwright)');
  console.log('='.repeat(100));
  console.log('');

  // 1. image_metadata에서 이미지 찾기
  const { data: images } = await supabase
    .from('image_metadata')
    .select('*')
    .contains('tags', ['sms-155'])
    .eq('source', 'mms')
    .eq('channel', 'sms')
    .order('created_at', { ascending: false })
    .limit(1);

  if (!images || images.length === 0) {
    console.error('❌ image_metadata에서 이미지를 찾을 수 없습니다.');
    return;
  }

  const imageUrl = images[0].image_url;
  console.log('✅ 이미지 발견:');
  console.log(`   URL: ${imageUrl.substring(0, 70)}...`);
  console.log('');

  // 2. Playwright로 브라우저 열기
  console.log('🌐 브라우저 시작 중...');
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    // 3. SMS 에디터 페이지로 이동
    const editorUrl = 'http://localhost:3000/admin/sms?id=155';
    console.log(`📄 SMS 에디터 페이지로 이동: ${editorUrl}`);
    await page.goto(editorUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // 4. "갤러리에서 선택" 버튼 클릭
    console.log('🔘 "갤러리에서 선택" 버튼 찾기...');
    const galleryButton = page.locator('button:has-text("갤러리에서 선택"), button:has-text("갤러리")').first();
    
    if (await galleryButton.isVisible({ timeout: 5000 })) {
      console.log('✅ 갤러리 버튼 발견, 클릭...');
      await galleryButton.click();
      await page.waitForTimeout(2000);
    } else {
      console.log('⚠️ 갤러리 버튼을 찾을 수 없습니다.');
      console.log('   페이지를 확인하고 수동으로 클릭해주세요.');
      await page.waitForTimeout(10000);
      await browser.close();
      return;
    }

    // 5. 갤러리 모달에서 이미지 찾기
    console.log('🔍 갤러리에서 이미지 찾기...');
    await page.waitForTimeout(2000);

    // 이미지 URL의 일부로 이미지 찾기
    const imageUrlPart = imageUrl.split('/').pop() || imageUrl.substring(imageUrl.length - 50);
    console.log(`   검색어: ${imageUrlPart.substring(0, 30)}...`);

    // 방법 1: img 태그의 src 속성으로 찾기
    const imageElement = page.locator(`img[src*="${imageUrlPart.substring(0, 20)}"]`).first();
    
    if (await imageElement.isVisible({ timeout: 5000 })) {
      console.log('✅ 이미지 발견, 클릭...');
      await imageElement.click();
      await page.waitForTimeout(2000);
      console.log('✅ 이미지 선택 완료!');
    } else {
      // 방법 2: 갤러리에서 첫 번째 이미지 클릭 (임시)
      console.log('⚠️ 정확한 이미지를 찾지 못함, 첫 번째 이미지 클릭 시도...');
      const firstImage = page.locator('img[src*="supabase"], img[src*="blog-images"]').first();
      
      if (await firstImage.isVisible({ timeout: 5000 })) {
        await firstImage.click();
        await page.waitForTimeout(2000);
        console.log('✅ 첫 번째 이미지 선택 완료');
      } else {
        console.log('⚠️ 갤러리에서 이미지를 찾을 수 없습니다.');
        console.log('   수동으로 이미지를 선택해주세요.');
      }
    }

    // 6. 결과 확인
    await page.waitForTimeout(2000);
    const finalImageVisible = await page.locator(`img[src*="${imageUrl.substring(0, 50)}"]`).first().isVisible({ timeout: 5000 }).catch(() => false);
    
    if (finalImageVisible) {
      console.log('');
      console.log('✅ 최종 확인: 이미지가 표시되고 있습니다!');
    } else {
      console.log('');
      console.log('⚠️ 이미지가 표시되지 않습니다.');
      console.log('   브라우저를 열어두었으니 수동으로 확인해주세요.');
    }

    console.log('');
    console.log('⏳ 브라우저를 15초간 열어둡니다...');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
    console.log('✅ 브라우저 종료');
  }
}

selectImage155();






