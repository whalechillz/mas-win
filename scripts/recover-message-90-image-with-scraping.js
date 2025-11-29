/**
 * 90번 메시지의 이미지를 Playwright를 사용한 브라우저 자동화로 복구하는 스크립트
 * 솔라피 콘솔에 로그인하고 메시지 상세 페이지에서 이미지를 자동으로 다운로드
 * 
 * 사용법:
 * node scripts/recover-message-90-image-with-scraping.js
 */

import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SOLAPI_EMAIL = process.env.SOLAPI_EMAIL || '';
const SOLAPI_PASSWORD = process.env.SOLAPI_PASSWORD || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

if (!SOLAPI_EMAIL || !SOLAPI_PASSWORD) {
  console.error('❌ 솔라피 로그인 정보가 설정되지 않았습니다.');
  console.error('   .env.local에 SOLAPI_EMAIL과 SOLAPI_PASSWORD를 설정하세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function recoverMessage90ImageWithScraping() {
  console.log('🔄 90번 메시지 이미지 복구 시작 (Playwright 스크래핑)...\n');

  const messageId = 90;
  let browser = null;
  let page = null;

  try {
    // 1. 메시지 정보 조회
    const { data: message, error: msgError } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('id', messageId)
      .single();

    if (msgError || !message) {
      console.error('❌ 메시지 조회 실패:', msgError?.message);
      process.exit(1);
    }

    console.log('✅ 메시지 조회 성공:');
    console.log(`   - ID: ${message.id}`);
    console.log(`   - 상태: ${message.status}`);
    console.log(`   - 솔라피 그룹 ID: ${message.solapi_group_id || '없음'}`);
    console.log(`   - 발송일: ${message.sent_at || '없음'}\n`);

    if (!message.solapi_group_id) {
      console.error('❌ 솔라피 그룹 ID가 없습니다. 복구할 수 없습니다.');
      process.exit(1);
    }

    // 그룹 ID가 여러 개일 수 있으므로 첫 번째 그룹 ID 사용
    const groupId = message.solapi_group_id.split(',')[0].trim();
    console.log(`📋 사용할 그룹 ID: ${groupId}\n`);

    // 2. Playwright 브라우저 실행
    console.log('🌐 브라우저 실행 중...');
    browser = await chromium.launch({
      headless: false, // 헤드리스 모드 해제 (디버깅용)
      slowMo: 500 // 동작을 천천히 (디버깅용)
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });

    page = await context.newPage();

    // 3. 솔라피 콘솔 로그인
    console.log('🔐 솔라피 콘솔 로그인 중...');
    await page.goto('https://console.solapi.com/login');

    // 로그인 폼 입력
    await page.fill('input[name="email"], input[type="email"]', SOLAPI_EMAIL);
    await page.fill('input[name="password"], input[type="password"]', SOLAPI_PASSWORD);
    
    // 로그인 버튼 클릭
    await page.click('button[type="submit"], button:has-text("로그인")');

    // 로그인 완료 대기
    await page.waitForURL('**/dashboard**', { timeout: 10000 }).catch(() => {
      console.log('⚠️ 대시보드로 이동하지 않았습니다. 계속 진행합니다...');
    });

    console.log('✅ 로그인 완료\n');

    // 4. 메시지 로그 페이지로 이동
    console.log('📋 메시지 로그 페이지로 이동 중...');
    const messageLogUrl = `https://console.solapi.com/message-log?criteria=groupId&value=${groupId}`;
    await page.goto(messageLogUrl);
    
    // 페이지 로드 대기
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    console.log('✅ 메시지 로그 페이지 로드 완료\n');

    // 5. 메시지 상세 모달 열기
    console.log('🔍 메시지 상세 모달 찾는 중...');
    
    // 여러 선택자 시도
    const modalSelectors = [
      'div[role="dialog"]',
      '.modal',
      '[class*="modal"]',
      '[class*="Modal"]',
      'div:has-text("메시지 그룹 자세히")',
      'div:has-text("Message Group Details")'
    ];

    let modalFound = false;
    for (const selector of modalSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        console.log(`✅ 모달 발견: ${selector}`);
        modalFound = true;
        break;
      } catch (e) {
        // 다음 선택자 시도
      }
    }

    if (!modalFound) {
      // 테이블에서 메시지 클릭 시도
      console.log('⚠️ 모달이 자동으로 열리지 않았습니다. 메시지 행 클릭 시도...');
      await page.click('table tbody tr:first-child, .table tbody tr:first-child', { timeout: 5000 });
      await page.waitForTimeout(2000);
    }

    // 6. 이미지 찾기 및 다운로드
    console.log('🖼️ 이미지 찾는 중...');
    
    const imageSelectors = [
      'img[src*="solapi"]',
      'img[src*="storage"]',
      'img[src*="image"]',
      '.message-image img',
      '[class*="image"] img',
      'img'
    ];

    let imageUrl = null;
    for (const selector of imageSelectors) {
      try {
        const img = await page.$(selector);
        if (img) {
          imageUrl = await img.getAttribute('src');
          if (imageUrl && (imageUrl.includes('http') || imageUrl.startsWith('data:'))) {
            console.log(`✅ 이미지 발견: ${selector}`);
            console.log(`   URL: ${imageUrl.substring(0, 100)}...\n`);
            break;
          }
        }
      } catch (e) {
        // 다음 선택자 시도
      }
    }

    if (!imageUrl) {
      console.error('❌ 이미지를 찾을 수 없습니다.');
      console.log('💡 수동으로 확인:');
      console.log(`   ${messageLogUrl}`);
      await browser.close();
      process.exit(1);
    }

    // 7. 이미지 다운로드
    console.log('📥 이미지 다운로드 중...');
    
    // data URL인 경우
    if (imageUrl.startsWith('data:')) {
      const base64Data = imageUrl.split(',')[1];
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      // 다운로드 폴더에 저장
      const downloadPath = path.join(process.env.HOME || '', 'Downloads', `solapi-message-${messageId}-${Date.now()}.jpg`);
      fs.writeFileSync(downloadPath, imageBuffer);
      console.log(`✅ 이미지 다운로드 완료: ${downloadPath}\n`);
      
      // 8. Supabase에 업로드
      await uploadToSupabase(messageId, imageBuffer, message);
      
    } else {
      // HTTP URL인 경우
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        console.error('❌ 이미지 다운로드 실패:', imageResponse.status);
        await browser.close();
        process.exit(1);
      }

      const arrayBuffer = await imageResponse.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);
      console.log(`✅ 이미지 다운로드 완료: ${(imageBuffer.length / 1024).toFixed(2)}KB\n`);
      
      // 8. Supabase에 업로드
      await uploadToSupabase(messageId, imageBuffer, message);
    }

    await browser.close();
    console.log('✅ 완료!\n');

  } catch (error) {
    console.error('❌ 복구 중 오류:', error);
    console.error('   스택:', error.stack);
    if (browser) {
      await browser.close();
    }
    process.exit(1);
  }
}

async function uploadToSupabase(messageId, imageBuffer, message) {
  console.log('💾 Supabase Storage에 저장 중...');

  // 발송일에서 날짜 추출
  let sentDate = new Date().toISOString().split('T')[0];
  if (message.sent_at) {
    const sentDateObj = new Date(message.sent_at);
    sentDate = sentDateObj.toISOString().split('T')[0];
  } else if (message.created_at) {
    const createdDateObj = new Date(message.created_at);
    sentDate = createdDateObj.toISOString().split('T')[0];
  }

  const dateFolder = sentDate;
  const folderPath = `originals/mms/${dateFolder}/${messageId}`;
  const timestamp = Date.now();
  const fileName = `mms-${messageId}-${timestamp}-1.jpg`;
  const storagePath = `${folderPath}/${fileName}`;

  console.log(`   경로: ${storagePath}`);

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('blog-images')
    .upload(storagePath, imageBuffer, {
      contentType: 'image/jpeg',
      upsert: false
    });

  if (uploadError) {
    console.error('❌ Supabase 업로드 실패:', uploadError.message);
    
    // upsert로 재시도
    const { data: upsertData, error: upsertError } = await supabase.storage
      .from('blog-images')
      .upload(storagePath, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (upsertError) {
      console.error('❌ Supabase upsert 실패:', upsertError.message);
      process.exit(1);
    }
    console.log('✅ Supabase Storage 저장 성공 (upsert)\n');
  } else {
    console.log('✅ Supabase Storage 저장 성공\n');
  }

  // 공개 URL 생성
  const { data: urlData } = supabase.storage
    .from('blog-images')
    .getPublicUrl(storagePath);
  const supabaseImageUrl = urlData.publicUrl;

  console.log(`✅ 공개 URL 생성: ${supabaseImageUrl}\n`);

  // image_metadata에 메타데이터 저장
  const metadataPayload = {
    image_url: supabaseImageUrl,
    folder_path: folderPath,
    date_folder: dateFolder,
    source: 'mms',
    channel: 'sms',
    file_size: imageBuffer.length,
    format: 'jpg',
    upload_source: 'mms-recovery-scraping',
    tags: [`sms-${messageId}`, 'mms', dateFolder, 'recovered', 'scraping'],
    title: `MMS 이미지 (메시지 #${messageId}) - 스크래핑 복구됨`,
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
      process.exit(1);
    }
    console.log(`✅ 메타데이터 upsert 성공 (ID: ${upsertMeta.id})\n`);
  } else {
    console.log(`✅ 메타데이터 저장 성공 (ID: ${metadata.id})\n`);
  }

  // channel_sms.image_url 업데이트
  const { error: updateError } = await supabase
    .from('channel_sms')
    .update({
      image_url: supabaseImageUrl,
      updated_at: new Date().toISOString()
    })
    .eq('id', messageId);

  if (updateError) {
    console.error('❌ channel_sms 업데이트 실패:', updateError.message);
    process.exit(1);
  }

  console.log('✅ channel_sms.image_url 업데이트 완료!\n');
  console.log('📋 복구 완료 요약:');
  console.log(`   메시지 ID: ${messageId}`);
  console.log(`   Supabase URL: ${supabaseImageUrl}`);
  console.log(`   Storage 경로: ${storagePath}`);
  console.log(`   메타데이터 ID: ${metadata?.id || upsertMeta?.id}`);
  console.log(`   파일 크기: ${(imageBuffer.length / 1024).toFixed(2)}KB\n`);
  console.log(`💡 SMS 편집 페이지에서 확인하세요: /admin/sms?id=${messageId}\n`);
}

recoverMessage90ImageWithScraping()
  .then(() => {
    console.log('✅ 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });

