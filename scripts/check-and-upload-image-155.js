/**
 * Playwright로 155번 메시지 이미지 확인 및 업로드
 * 브라우저를 열어서 이미지가 표시되는지 확인하고, 없으면 업로드
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

async function checkAndUploadImage155() {
  console.log('='.repeat(100));
  console.log('🔍 155번 메시지 이미지 확인 및 업로드 (Playwright)');
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

  console.log('📋 메시지 정보:');
  console.log(`   ID: ${message.id}`);
  console.log(`   image_url: ${message.image_url || '(없음)'}`);
  console.log('');

  // 2. image_metadata에서 이미지 확인
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
    console.log('');
  } else {
    console.log('⚠️ image_metadata에서 이미지를 찾을 수 없습니다.');
    if (message.image_url && message.image_url.startsWith('http')) {
      imageUrl = message.image_url;
      console.log(`   channel_sms.image_url 사용: ${imageUrl.substring(0, 70)}...`);
    }
    console.log('');
  }

  if (!imageUrl) {
    console.error('❌ 이미지 URL을 찾을 수 없습니다.');
    return;
  }

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

    // 5. 콘솔 로그 확인
    console.log('📊 콘솔 로그 확인 중...');
    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('이미지') || text.includes('image') || text.includes('🖼️') || text.includes('✅')) {
        consoleLogs.push(text);
        console.log(`   콘솔: ${text}`);
      }
    });

    await page.waitForTimeout(2000);

    // 6. 이미지가 표시되는지 확인
    console.log('🔍 이미지 표시 여부 확인 중...');
    const imageVisible = await page.locator('img[src*="supabase"], img[src*="mms-155"]').first().isVisible({ timeout: 5000 }).catch(() => false);
    
    if (imageVisible) {
      const imgSrc = await page.locator('img[src*="supabase"], img[src*="mms-155"]').first().getAttribute('src');
      console.log('✅ 이미지가 표시되고 있습니다!');
      console.log(`   이미지 URL: ${imgSrc?.substring(0, 70)}...`);
      console.log('');
    } else {
      console.log('⚠️ 이미지가 표시되지 않습니다.');
      console.log('   이미지를 수동으로 업로드하거나 갤러리에서 선택해야 합니다.');
      console.log('');

      // 7. 이미지 URL을 클립보드에 복사하거나 직접 입력
      console.log('💡 해결 방법:');
      console.log(`   1. "갤러리에서 선택" 버튼 클릭`);
      console.log(`   2. 또는 이미지 URL을 직접 입력: ${imageUrl}`);
      console.log('');

      // 8. 갤러리 버튼 찾기 및 클릭 시도
      try {
        const galleryButton = page.locator('button:has-text("갤러리에서 선택"), button:has-text("갤러리")').first();
        if (await galleryButton.isVisible({ timeout: 3000 })) {
          console.log('🔘 "갤러리에서 선택" 버튼 발견');
          console.log('   수동으로 클릭하여 이미지를 선택해주세요.');
          console.log('');
        }
      } catch (e) {
        console.log('   갤러리 버튼을 찾을 수 없습니다.');
      }

      // 9. 이미지 URL을 input 필드에 직접 입력 시도
      try {
        // imageUrl input 필드 찾기
        const imageInputs = await page.locator('input[type="text"][value*="supabase"], input[type="url"], input[name*="image"]').all();
        if (imageInputs.length > 0) {
          console.log('📝 이미지 URL 입력 필드 발견, URL 입력 시도...');
          await imageInputs[0].fill(imageUrl);
          await page.waitForTimeout(1000);
          console.log('✅ 이미지 URL 입력 완료');
        }
      } catch (e) {
        console.log('   이미지 URL 입력 필드를 찾을 수 없습니다.');
      }

      // 10. 브라우저를 열어두고 사용자가 수동으로 작업할 수 있도록 대기
      console.log('');
      console.log('⏳ 브라우저를 열어두었습니다. 수동으로 이미지를 선택해주세요.');
      console.log('   완료되면 브라우저를 닫고 Enter를 눌러주세요.');
      console.log('');
      
      // 사용자 입력 대기
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      await new Promise(resolve => {
        rl.question('브라우저에서 작업을 완료한 후 Enter를 눌러주세요: ', () => {
          rl.close();
          resolve();
        });
      });
    }

    console.log('');
    console.log('='.repeat(100));
    console.log('✅ 작업 완료');
    console.log('='.repeat(100));

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

checkAndUploadImage155();











