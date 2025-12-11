/**
 * 155번 메시지의 이미지 복구 스크립트
 * 솔라피 API를 통해 이미지를 가져와서 복구
 * 
 * 사용법:
 * node scripts/recover-message-155-image.js
 */

import { createClient } from '@supabase/supabase-js';
import { createSolapiSignature } from '../utils/solapiSignature.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || "";
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || "";

if (!supabaseUrl || !supabaseKey || !SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function recoverMessage155Image() {
  console.log('🔄 155번 메시지 이미지 복구 시작...\n');

  const messageId = 155;

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
    console.log(`   현재 image_url: ${message.image_url || '없음'}`);
    console.log(`   솔라피 그룹 ID: ${message.solapi_group_id || '없음'}`);
    console.log(`   발송일: ${message.sent_at || '없음'}\n`);

    if (!message.solapi_group_id) {
      console.error('❌ 솔라피 그룹 ID가 없습니다. 복구할 수 없습니다.');
      process.exit(1);
    }

    // 발송일에서 날짜 추출 (YYYY-MM-DD)
    let sentDate = new Date().toISOString().split('T')[0];
    if (message.sent_at) {
      const sentDateObj = new Date(message.sent_at);
      sentDate = sentDateObj.toISOString().split('T')[0];
    } else if (message.created_at) {
      const createdDateObj = new Date(message.created_at);
      sentDate = createdDateObj.toISOString().split('T')[0];
    }
    console.log(`📅 사용할 날짜 폴더: ${sentDate}\n`);

    // 2. 솔라피 메시지 목록에서 이미지 ID 확인
    const authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);
    
    // 그룹 ID가 여러 개일 수 있으므로 첫 번째 그룹 ID 사용
    const groupId = message.solapi_group_id.split(',')[0].trim();
    
    console.log('🔍 솔라피 메시지 목록 조회 중...');
    console.log(`   그룹 ID: ${groupId}\n`);
    
    const messageListResponse = await fetch(
      `https://api.solapi.com/messages/v4/list?groupId=${groupId}&limit=1`,
      {
        method: 'GET',
        headers: authHeaders
      }
    );

    if (!messageListResponse.ok) {
      const errorText = await messageListResponse.text();
      console.error('❌ 솔라피 메시지 목록 조회 실패:', messageListResponse.status, errorText);
      process.exit(1);
    }

    const messageListData = await messageListResponse.json();
    console.log('✅ 솔라피 메시지 목록 조회 성공\n');
    
    // 3. 이미지 ID 추출
    let imageId = null;
    
    // messageList 객체에서 첫 번째 메시지 찾기
    if (messageListData.messageList) {
      const messageKeys = Object.keys(messageListData.messageList);
      if (messageKeys.length > 0) {
        const firstMessageKey = messageKeys[0];
        const firstMessage = messageListData.messageList[firstMessageKey];
        imageId = firstMessage.imageId || firstMessage.image_id || null;
        
        if (imageId) {
          console.log(`✅ 솔라피 이미지 ID 확인: ${imageId}\n`);
        } else {
          console.log('⚠️ 메시지에 imageId가 없습니다.');
          console.log('   메시지 RAW DATA:', JSON.stringify(firstMessage, null, 2).substring(0, 500));
        }
      }
    } else if (messageListData.messages && messageListData.messages.length > 0) {
      const firstMessage = messageListData.messages[0];
      imageId = firstMessage.imageId || firstMessage.image_id || null;
      
      if (imageId) {
        console.log(`✅ 솔라피 이미지 ID 확인 (배열 형태): ${imageId}\n`);
      }
    }

    // 4. channel_sms.image_url에서 Solapi imageId 추출 (대안)
    if (!imageId && message.image_url && !message.image_url.startsWith('http')) {
      imageId = message.image_url;
      console.log(`📌 channel_sms.image_url에서 이미지 ID 추출: ${imageId}\n`);
    }

    if (!imageId) {
      console.error('❌ 솔라피에서 이미지 ID를 찾을 수 없습니다.');
      console.log('💡 솔라피 콘솔에서 직접 확인하거나, 수동으로 imageId를 입력하세요.');
      console.log(`   솔라피 그룹 ID: ${groupId}`);
      process.exit(1);
    }

    // 5. 솔라피 Storage에서 이미지 다운로드 시도
    console.log('📥 솔라피에서 이미지 다운로드 시도 중...');
    
    let imageBuffer = null;
    let downloadSuccess = false;

    // 솔라피 Storage 다운로드 URL (여러 엔드포인트 시도)
    const downloadUrls = [
      `https://api.solapi.com/storage/v1/files/${imageId}/download`,
      `https://api.solapi.com/storage/v1/files/${imageId}`,
      `https://storage.solapi.com/files/${imageId}`,
      `https://api.solapi.com/storage/v1/files/${imageId}?download=true`,
      `https://api.solapi.com/storage/v1/files/${imageId}/content`
    ];

    for (const downloadUrl of downloadUrls) {
      try {
        console.log(`   시도 중: ${downloadUrl}`);
        const downloadResponse = await fetch(downloadUrl, {
          method: 'GET',
          headers: authHeaders
        });

        if (downloadResponse.ok) {
          const arrayBuffer = await downloadResponse.arrayBuffer();
          imageBuffer = Buffer.from(arrayBuffer);
          
          // 파일 크기 확인 (너무 작으면 실제 이미지가 아닐 수 있음)
          if (imageBuffer.length > 10 * 1024) { // 10KB 이상
            downloadSuccess = true;
            console.log(`✅ 이미지 다운로드 성공: ${(imageBuffer.length / 1024).toFixed(2)}KB\n`);
            break;
          } else {
            console.log(`   ⚠️ 파일 크기가 너무 작습니다: ${imageBuffer.length} bytes`);
          }
        } else {
          console.log(`   실패: ${downloadResponse.status} ${downloadResponse.statusText}`);
        }
      } catch (error) {
        console.log(`   오류: ${error.message}`);
      }
    }

    // 6. 다운로드 실패 시 안내
    if (!downloadSuccess) {
      console.error('❌ 솔라피 Storage API로 이미지 다운로드 실패');
      console.log('\n💡 대안 방법:');
      console.log('   1. 솔라피 콘솔에서 이미지를 직접 다운로드');
      console.log(`      https://console.solapi.com/message-log?criteria=groupId&value=${groupId}`);
      console.log('   2. 다운로드한 이미지로 복구:');
      console.log(`      node scripts/recover-message-image-from-file.js 155 ~/Downloads/다운로드한파일명.jpg\n`);
      process.exit(1);
    }

    // 7. Supabase Storage에 저장
    const dateFolder = sentDate;
    const folderPath = `originals/mms/${dateFolder}/${messageId}`;
    const timestamp = Date.now();
    const fileName = `mms-${messageId}-${timestamp}.jpg`;
    const storagePath = `${folderPath}/${fileName}`;

    console.log('💾 Supabase Storage에 저장 중...');
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

    // 8. 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(storagePath);
    const supabaseImageUrl = urlData.publicUrl;

    console.log(`✅ 공개 URL 생성: ${supabaseImageUrl}\n`);

    // 9. image_metadata에 메타데이터 저장
    const metadataPayload = {
      image_url: supabaseImageUrl,
      folder_path: folderPath,
      date_folder: dateFolder,
      source: 'mms',
      channel: 'sms',
      file_size: imageBuffer.length,
      format: 'jpg',
      upload_source: 'mms-recovery-api',
      tags: [`sms-${messageId}`, 'mms', dateFolder, 'recovered'],
      title: `MMS 이미지 (메시지 #${messageId}) - API 복구됨`,
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

    // 10. channel_sms.image_url 업데이트
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
    console.log(`   솔라피 이미지 ID: ${imageId}`);
    console.log(`   Supabase URL: ${supabaseImageUrl}`);
    console.log(`   Storage 경로: ${storagePath}`);
    console.log(`   메타데이터 ID: ${metadata?.id || upsertMeta?.id}`);
    console.log(`   파일 크기: ${(imageBuffer.length / 1024).toFixed(2)}KB\n`);
    console.log('💡 SMS 편집 페이지에서 확인하세요: /admin/sms?id=155\n');

  } catch (error) {
    console.error('❌ 복구 중 오류:', error);
    console.error('   스택:', error.stack);
    process.exit(1);
  }
}

recoverMessage155Image()
  .then(() => {
    console.log('✅ 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });







