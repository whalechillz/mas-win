/**
 * 155번 메시지 이미지 복원 스크립트 (Playwright)
 * Solapi 콘솔에서 이미지를 찾아 Supabase에 저장하고 image_metadata에 등록
 */

const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SOLAPI_EMAIL = process.env.SOLAPI_EMAIL || 'taksoo.kim@gmail.com';
const SOLAPI_PASSWORD = process.env.SOLAPI_PASSWORD || 'Zoo100MAS!!';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreMessage155Image() {
  console.log('='.repeat(100));
  console.log('🔄 155번 메시지 이미지 복원 (Playwright)');
  console.log('='.repeat(100));
  console.log('');

  // 1. 155번 메시지 정보 조회
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
  console.log(`   솔라피 그룹 ID: ${message.solapi_group_id || '(없음)'}`);
  console.log(`   image_url: ${message.image_url || '(없음)'}`);
  console.log('');

  if (!message.solapi_group_id) {
    console.error('❌ 솔라피 그룹 ID가 없습니다.');
    return;
  }

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
    // 3. Solapi 로그인
    console.log('🔐 Solapi 로그인 중...');
    await page.goto('https://solapi.com/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 로그인 폼 찾기 및 입력
    await page.fill('input[type="email"], input[name="email"], input[placeholder*="이메일"]', SOLAPI_EMAIL);
    await page.fill('input[type="password"], input[name="password"]', SOLAPI_PASSWORD);
    await page.click('button[type="submit"], button:has-text("로그인")');
    
    // 로그인 완료 대기
    await page.waitForURL('**/dashboard**', { timeout: 10000 }).catch(() => {
      console.log('⚠️ 대시보드 URL로 이동하지 않음, 계속 진행...');
    });
    await page.waitForTimeout(3000);

    // 4. 메시지 그룹 페이지로 이동
    const groupId = message.solapi_group_id;
    const groupUrl = `https://solapi.com/messages/groups/${groupId}`;
    console.log(`📨 메시지 그룹 페이지로 이동: ${groupUrl}`);
    await page.goto(groupUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // 5. 그룹 상세 모달 열기 (필요한 경우)
    try {
      const groupRow = await page.locator('tbody tr, [role="row"]').first();
      if (await groupRow.isVisible({ timeout: 5000 })) {
        await groupRow.click();
        await page.waitForTimeout(2000);
        console.log('   ✅ 그룹 상세 모달 열기');
      }
    } catch (e) {
      console.log(`   ⚠️ 그룹 모달 열기 실패: ${e.message}`);
    }

    // 6. "RawData 보기" 탭 클릭
    try {
      const rawDataTab = page.locator('text=RawData 보기, button:has-text("RawData 보기"), [role="tab"]:has-text("RawData")').first();
      if (await rawDataTab.isVisible({ timeout: 3000 })) {
        await rawDataTab.click();
        await page.waitForTimeout(2000);
        console.log('   ✅ RawData 보기 탭 클릭');
      }
    } catch (e) {
      console.log(`   ⚠️ RawData 탭 클릭 실패: ${e.message}`);
    }

    // 7. imageId 추출
    let imageId = message.image_url; // DB에 저장된 imageId 사용

    // RawData에서 imageId 확인
    try {
      const rawDataContent = await page.evaluate(() => {
        const rawDataElements = document.querySelectorAll('[class*="raw"], [class*="data"], pre, code, [class*="json"]');
        for (const el of rawDataElements) {
          const text = el.textContent || el.innerText;
          if (text && text.includes('imageId')) {
            return text;
          }
        }
        return null;
      });

      if (rawDataContent) {
        const imageIdMatch = rawDataContent.match(/"imageId"\s*:\s*"([^"]+)"/i) || 
                            rawDataContent.match(/imageId["\s:]+["']?([A-Z0-9]{20,})/i);
        if (imageIdMatch && imageIdMatch[1]) {
          const candidate = imageIdMatch[1].trim();
          if (/^ST01FZ[A-Z0-9a-z]{20,}$/i.test(candidate)) {
            imageId = candidate;
            console.log(`   ✅ RawData에서 imageId 확인: ${imageId.substring(0, 30)}...`);
          }
        }
      }
    } catch (e) {
      console.log(`   ⚠️ RawData 추출 실패: ${e.message}`);
    }

    if (!imageId || !/^ST01FZ[A-Z0-9a-z]{20,}$/i.test(imageId)) {
      console.error('❌ 유효한 imageId를 찾을 수 없습니다.');
      await browser.close();
      return;
    }

    console.log(`\n✅ imageId 확인: ${imageId}\n`);

    // 8. Solapi Storage API로 이미지 다운로드
    console.log('📥 Solapi Storage에서 이미지 다운로드 중...');
    const { createSolapiSignature } = require('../utils/solapiSignature');
    const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY;
    const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET;

    if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
      console.error('❌ Solapi API 키가 설정되지 않았습니다.');
      await browser.close();
      return;
    }

    const authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);
    const downloadUrls = [
      `https://api.solapi.com/storage/v1/files/${imageId}/download`,
      `https://api.solapi.com/storage/v1/files/${imageId}`,
    ];

    let imageBuffer = null;
    for (const downloadUrl of downloadUrls) {
      try {
        const downloadResponse = await fetch(downloadUrl, {
          method: 'GET',
          headers: authHeaders
        });

        if (downloadResponse.ok) {
          const arrayBuffer = await downloadResponse.arrayBuffer();
          imageBuffer = Buffer.from(arrayBuffer);
          console.log(`✅ 이미지 다운로드 성공: ${(imageBuffer.length / 1024).toFixed(2)}KB`);
          break;
        }
      } catch (error) {
        console.log(`   ⚠️ ${downloadUrl} 실패: ${error.message}`);
      }
    }

    if (!imageBuffer) {
      console.error('❌ 이미지 다운로드 실패');
      await browser.close();
      return;
    }

    // 9. Supabase Storage에 저장
    const now = new Date();
    const dateFolder = message.sent_at ? new Date(message.sent_at).toISOString().slice(0, 10) : now.toISOString().slice(0, 10);
    const folderPath = `originals/mms/${dateFolder}/155`;
    const fileName = `mms-155-${Date.now()}.jpg`;
    const storagePath = `${folderPath}/${fileName}`;

    console.log('💾 Supabase Storage에 저장 중...');
    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(storagePath, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Supabase 업로드 실패:', uploadError.message);
      await browser.close();
      return;
    }

    // 10. 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(storagePath);
    const supabaseImageUrl = urlData.publicUrl;

    console.log(`✅ 공개 URL 생성: ${supabaseImageUrl}\n`);

    // 11. image_metadata에 저장
    const metadataPayload = {
      image_url: supabaseImageUrl,
      folder_path: folderPath,
      date_folder: dateFolder,
      source: 'mms',
      channel: 'sms',
      file_size: imageBuffer.length,
      format: 'jpg',
      upload_source: 'mms-recovery-playwright',
      tags: ['sms-155', 'mms', dateFolder, 'recovered', 'playwright'],
      title: `MMS 이미지 (메시지 #155) - Playwright 복구`,
      alt_text: `MMS 이미지`,
      created_at: message.sent_at || message.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: metadata, error: metaError } = await supabase
      .from('image_metadata')
      .insert(metadataPayload)
      .select()
      .single();

    if (metaError) {
      console.error('⚠️ 메타데이터 insert 실패, upsert로 재시도:', metaError.message);
      
      const { data: upsertMeta, error: upsertError } = await supabase
        .from('image_metadata')
        .upsert(metadataPayload, { onConflict: 'image_url' })
        .select()
        .single();

      if (upsertError) {
        console.error('❌ 메타데이터 upsert 실패:', upsertError.message);
        await browser.close();
        return;
      }
      console.log(`✅ 메타데이터 upsert 성공 (ID: ${upsertMeta.id})\n`);
    } else {
      console.log(`✅ 메타데이터 저장 성공 (ID: ${metadata.id})\n`);
    }

    // 12. channel_sms.image_url 업데이트 (Supabase URL로)
    const { error: updateError } = await supabase
      .from('channel_sms')
      .update({
        image_url: supabaseImageUrl, // Supabase URL로 업데이트
        updated_at: new Date().toISOString()
      })
      .eq('id', 155);

    if (updateError) {
      console.error('❌ channel_sms 업데이트 실패:', updateError.message);
    } else {
      console.log('✅ channel_sms.image_url 업데이트 완료!');
      console.log(`   - image_url: ${supabaseImageUrl}`);
    }

    console.log('');
    console.log('='.repeat(100));
    console.log('✅ 155번 메시지 이미지 복원 완료!');
    console.log('='.repeat(100));
    console.log(`   이미지 URL: ${supabaseImageUrl}`);
    console.log(`   Storage 경로: ${storagePath}`);
    console.log('');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

restoreMessage155Image();

