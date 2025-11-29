/**
 * 메시지의 이미지를 로컬 파일에서 복구하는 스크립트
 * 
 * 사용법:
 * 1. 솔라피 콘솔에서 이미지를 "다른 이름으로 저장"으로 다운로드
 * 2. node scripts/recover-message-image-from-file.js <메시지ID> <이미지파일경로>
 * 
 * 예시:
 * node scripts/recover-message-image-from-file.js 86 ~/Downloads/solapi-image.jpg
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function recoverMessageImageFromFile(messageId, imageFilePath) {
  console.log(`\n🔄 ${messageId}번 메시지 이미지 복구 시작 (로컬 파일에서)...\n`);

  try {
    // 1. 인자 확인
    if (!messageId || !imageFilePath) {
      console.error('❌ 메시지 ID와 이미지 파일 경로가 필요합니다.');
      console.log('\n사용법:');
      console.log('  node scripts/recover-message-image-from-file.js <메시지ID> <이미지파일경로>');
      console.log('\n예시:');
      console.log('  node scripts/recover-message-image-from-file.js 86 ~/Downloads/solapi-image.jpg');
      process.exit(1);
    }

    const fullPath = path.resolve(imageFilePath);
    
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ 파일을 찾을 수 없습니다: ${fullPath}`);
      process.exit(1);
    }

    console.log(`✅ 파일 확인: ${fullPath}`);
    
    // 2. 파일 읽기
    const imageBuffer = fs.readFileSync(fullPath);
    const fileSize = imageBuffer.length;
    console.log(`   파일 크기: ${(fileSize / 1024).toFixed(2)}KB\n`);

    if (fileSize < 1024) {
      console.warn('⚠️ 파일 크기가 너무 작습니다. 실제 이미지가 아닐 수 있습니다.');
    }

    // 3. 메시지 정보 조회
    const { data: message, error: msgError } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('id', messageId)
      .single();

    if (msgError || !message) {
      console.error(`❌ 메시지를 찾을 수 없습니다: ${msgError?.message}`);
      process.exit(1);
    }

    console.log('✅ 메시지 조회 성공:');
    console.log(`   - ID: ${message.id}`);
    console.log(`   - 상태: ${message.status}`);
    console.log(`   - 발송일: ${message.sent_at || '없음'}\n`);

    // 발송일에서 날짜 추출 (YYYY-MM-DD)
    let sentDate = new Date().toISOString().split('T')[0]; // 기본값: 오늘
    if (message.sent_at) {
      const sentDateObj = new Date(message.sent_at);
      sentDate = sentDateObj.toISOString().split('T')[0]; // YYYY-MM-DD
    } else if (message.created_at) {
      const createdDateObj = new Date(message.created_at);
      sentDate = createdDateObj.toISOString().split('T')[0];
    }
    console.log(`📅 사용할 날짜 폴더: ${sentDate}\n`);

    // 4. Supabase Storage에 저장
    const dateFolder = sentDate;
    const folderPath = `originals/mms/${dateFolder}/${messageId}`;
    const timestamp = Date.now();
    const fileExt = path.extname(fullPath) || '.jpg';
    const fileName = `mms-${messageId}-${timestamp}-1${fileExt}`;
    const storagePath = `${folderPath}/${fileName}`;

    console.log('💾 Supabase Storage에 저장 중...');
    console.log(`   경로: ${storagePath}`);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(storagePath, imageBuffer, {
        contentType: fileExt === '.png' ? 'image/png' : 'image/jpeg',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Supabase 업로드 실패:', uploadError.message);
      
      // upsert로 재시도
      const { data: upsertData, error: upsertError } = await supabase.storage
        .from('blog-images')
        .upload(storagePath, imageBuffer, {
          contentType: fileExt === '.png' ? 'image/png' : 'image/jpeg',
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

    // 5. 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(storagePath);
    const supabaseImageUrl = urlData.publicUrl;

    console.log(`✅ 공개 URL 생성: ${supabaseImageUrl}\n`);

    // 6. image_metadata에 메타데이터 저장
    const metadataPayload = {
      image_url: supabaseImageUrl,
      folder_path: folderPath,
      date_folder: dateFolder,
      source: 'mms',
      channel: 'sms',
      file_size: fileSize,
      format: fileExt.replace('.', ''),
      upload_source: 'mms-recovery-manual',
      tags: [`sms-${messageId}`, 'mms', dateFolder, 'recovered', 'manual'],
      title: `MMS 이미지 (메시지 #${messageId}) - 수동 복구됨`,
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
      
      // upsert로 재시도
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

    // 7. channel_sms.image_url 업데이트
    const { error: updateError } = await supabase
      .from('channel_sms')
      .update({
        image_url: supabaseImageUrl, // Supabase URL로 업데이트
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
    console.log(`   원본 파일: ${fullPath}`);
    console.log(`   Supabase URL: ${supabaseImageUrl}`);
    console.log(`   Storage 경로: ${storagePath}`);
    console.log(`   메타데이터 ID: ${metadata?.id || upsertMeta?.id}`);
    console.log(`   파일 크기: ${(fileSize / 1024).toFixed(2)}KB\n`);
    console.log(`💡 SMS 편집 페이지에서 확인하세요: /admin/sms?id=${messageId}`);
    console.log('   페이지를 새로고침하면 이미지가 표시됩니다.\n');

  } catch (error) {
    console.error('❌ 복구 중 오류:', error);
    console.error('   스택:', error.stack);
    process.exit(1);
  }
}

// 명령줄 인자에서 메시지 ID와 파일 경로 가져오기
const args = process.argv.slice(2);
const messageId = args[0] ? parseInt(args[0], 10) : null;
const imageFilePath = args[1];

recoverMessageImageFromFile(messageId, imageFilePath)
  .then(() => {
    console.log('✅ 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });

