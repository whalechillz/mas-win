/**
 * Playwright로 브라우저 콘솔에서 이미지 직접 설정
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

async function setImageViaConsole() {
  console.log('='.repeat(100));
  console.log('🖼️ 브라우저 콘솔에서 이미지 직접 설정');
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
  console.log(`   URL: ${imageUrl}`);
  console.log('');

  // 2. Playwright로 브라우저 열기
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
    // 3. SMS 에디터 페이지로 이동
    const editorUrl = 'http://localhost:3000/admin/sms?id=155';
    console.log(`📄 SMS 에디터 페이지로 이동: ${editorUrl}`);
    await page.goto(editorUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // 4. 브라우저 콘솔에서 이미지 설정
    console.log('🖼️ 브라우저 콘솔에서 이미지 설정 중...');
    
    const result = await page.evaluate(async (imgUrl) => {
      // React DevTools를 통해 컴포넌트 상태 업데이트 시도
      // 또는 직접 DOM 조작
      
      // 방법 1: 이미지 요소 찾아서 src 설정
      const imgElements = Array.from(document.querySelectorAll('img'));
      let found = false;
      
      for (const img of imgElements) {
        const src = img.getAttribute('src') || '';
        const alt = img.getAttribute('alt') || '';
        
        // 이미지 미리보기 영역의 img 태그 찾기
        if (alt.includes('선택된') || alt.includes('이미지') || 
            img.closest('[class*="preview"], [class*="image"]')) {
          img.src = imgUrl;
          img.onload = () => console.log('✅ 이미지 로드 완료');
          img.onerror = () => console.error('❌ 이미지 로드 실패');
          found = true;
          break;
        }
      }
      
      if (found) {
        return { success: true, method: 'img-src-update' };
      }
      
      // 방법 2: window 객체에 이미지 URL 저장 (프론트엔드에서 읽을 수 있도록)
      window.__tempImageUrl = imgUrl;
      
      // 방법 3: localStorage에 저장
      localStorage.setItem('tempImageUrl155', imgUrl);
      
      return { 
        success: true, 
        method: 'localStorage',
        message: '이미지 URL을 localStorage에 저장했습니다. 페이지를 새로고침하세요.'
      };
    }, imageUrl);

    console.log('📊 결과:', result);
    console.log('');

    if (result.success) {
      console.log('✅ 이미지 URL 설정 완료!');
      
      if (result.method === 'localStorage') {
        console.log('💡 페이지를 새로고침하면 이미지가 표시됩니다.');
        console.log('   또는 브라우저 콘솔에서 다음 명령을 실행하세요:');
        console.log(`   localStorage.getItem('tempImageUrl155')`);
        console.log('');
      }
    }

    // 5. 페이지 새로고침
    console.log('🔄 페이지 새로고침 중...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // 6. 결과 확인
    const imageVisible = await page.locator(`img[src*="${imageUrl.substring(0, 50)}"]`).first().isVisible({ timeout: 5000 }).catch(() => false);
    
    if (imageVisible) {
      console.log('✅ 이미지가 표시되고 있습니다!');
    } else {
      console.log('⚠️ 이미지가 여전히 표시되지 않습니다.');
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

setImageViaConsole();

