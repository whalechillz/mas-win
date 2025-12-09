/**
 * 154번 메시지 이미지 메타데이터 생성 및 channel_sms 업데이트
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fix154ImageMetadata() {
  console.log('🔧 154번 메시지 이미지 메타데이터 생성 및 업데이트...\n');
  console.log('='.repeat(60));

  const messageId = 154;
  const dateFolder = '2025-12-05';
  const folderPath = `originals/mms/${dateFolder}/${messageId}`;
  const fileName = 'mms-154-1764902209781.jpg';

  // 공개 URL 생성
  const { data: urlData } = supabase.storage
    .from('blog-images')
    .getPublicUrl(`${folderPath}/${fileName}`);

  const imageUrl = urlData.publicUrl;

  console.log('📋 작업 정보:');
  console.log(`   메시지 ID: ${messageId}`);
  console.log(`   폴더 경로: ${folderPath}`);
  console.log(`   파일명: ${fileName}`);
  console.log(`   이미지 URL: ${imageUrl}\n`);

  try {
    // 1. image_metadata에 메타데이터 생성
    console.log('📝 1단계: image_metadata 생성...\n');
    
    const metadataPayload = {
      image_url: imageUrl,
      folder_path: folderPath,
      original_path: `${folderPath}/${fileName}`,
      source: 'mms',
      channel: 'sms',
      upload_source: 'mms-upload',
      tags: ['sms-154', 'mms'],
      title: `MMS 이미지 (메시지 #${messageId})`,
      alt_text: `MMS 이미지`,
      file_size: 133200, // 확인된 파일 크기
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newMeta, error: insertError } = await supabase
      .from('image_metadata')
      .insert(metadataPayload)
      .select()
      .single();

    if (insertError) {
      console.error('❌ 메타데이터 생성 실패:', insertError.message);
      console.error('   상세:', JSON.stringify(insertError, null, 2));
      process.exit(1);
    }

    console.log('✅ 메타데이터 생성 완료:');
    console.log(`   ID: ${newMeta.id}`);
    console.log(`   image_url: ${newMeta.image_url}`);
    console.log(`   folder_path: ${newMeta.folder_path}`);
    console.log(`   tags: ${JSON.stringify(newMeta.tags)}\n`);

    // 2. channel_sms.image_url 업데이트
    console.log('📝 2단계: channel_sms.image_url 업데이트...\n');
    
    const { data: updatedMessage, error: updateError } = await supabase
      .from('channel_sms')
      .update({
        image_url: imageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ channel_sms 업데이트 실패:', updateError.message);
      console.error('   상세:', JSON.stringify(updateError, null, 2));
      process.exit(1);
    }

    console.log('✅ channel_sms 업데이트 완료:');
    console.log(`   ID: ${updatedMessage.id}`);
    console.log(`   image_url: ${updatedMessage.image_url}\n`);

    // 3. 최종 확인
    console.log('='.repeat(60));
    console.log('📊 최종 확인:\n');
    
    // image_metadata 재조회
    const { data: verifyMeta, error: verifyMetaError } = await supabase
      .from('image_metadata')
      .select('*')
      .eq('id', newMeta.id)
      .single();

    if (verifyMetaError) {
      console.error('❌ 메타데이터 확인 실패:', verifyMetaError.message);
    } else {
      console.log('✅ 메타데이터 확인:');
      console.log(`   folder_path: ${verifyMeta.folder_path}`);
      console.log(`   tags: ${JSON.stringify(verifyMeta.tags)}\n`);
    }

    // channel_sms 재조회
    const { data: verifyMessage, error: verifyMsgError } = await supabase
      .from('channel_sms')
      .select('id, image_url')
      .eq('id', messageId)
      .single();

    if (verifyMsgError) {
      console.error('❌ channel_sms 확인 실패:', verifyMsgError.message);
    } else {
      console.log('✅ channel_sms 확인:');
      console.log(`   image_url: ${verifyMessage.image_url}\n`);
    }

    console.log('='.repeat(60));
    console.log('🎉 작업 완료!\n');
    console.log('이제 "갤러리에서 선택" 클릭 시 154번 폴더에서 이미지가 바로 표시됩니다.\n');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

fix154ImageMetadata();

