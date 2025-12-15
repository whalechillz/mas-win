/**
 * 155번 메시지 이미지 메타데이터 수정
 * 이미 Supabase에 있는 이미지를 image_metadata에 제대로 연결
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixMessage155ImageMetadata() {
  console.log('='.repeat(100));
  console.log('🔧 155번 메시지 이미지 메타데이터 수정');
  console.log('='.repeat(100));
  console.log('');

  const messageId = 155;

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
  console.log(`   image_url: ${message.image_url || '없음'}`);
  console.log(`   발송일: ${message.sent_at || '없음'}\n`);

  if (!message.image_url || !message.image_url.startsWith('http')) {
    console.error('❌ HTTP URL이 아닙니다. 이미지가 Supabase에 저장되어 있지 않습니다.');
    process.exit(1);
  }

  const imageUrl = message.image_url;
  console.log(`📋 이미지 URL: ${imageUrl}\n`);

  // 2. image_metadata에서 해당 이미지 찾기
  const { data: existingMeta, error: metaError } = await supabase
    .from('image_metadata')
    .select('*')
    .eq('image_url', imageUrl)
    .limit(1)
    .single();

  if (existingMeta) {
    console.log('✅ image_metadata에 이미지가 존재합니다.');
    console.log(`   메타데이터 ID: ${existingMeta.id}`);
    console.log(`   태그: ${existingMeta.tags?.join(', ') || '없음'}\n`);

    // 태그에 sms-155가 있는지 확인
    const hasTag = existingMeta.tags?.includes(`sms-${messageId}`);
    
    if (!hasTag) {
      console.log('⚠️ 태그에 sms-155가 없습니다. 태그 추가 중...');
      const updatedTags = [...(existingMeta.tags || []), `sms-${messageId}`];
      
      const { error: updateError } = await supabase
        .from('image_metadata')
        .update({
          tags: updatedTags,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingMeta.id);

      if (updateError) {
        console.error('❌ 태그 업데이트 실패:', updateError.message);
        process.exit(1);
      }
      console.log('✅ 태그 업데이트 완료!\n');
    } else {
      console.log('✅ 태그가 이미 올바르게 설정되어 있습니다.\n');
    }
  } else {
    console.log('⚠️ image_metadata에 이미지가 없습니다. 새로 생성 중...\n');

    // URL에서 경로 추출
    const urlMatch = imageUrl.match(/\/blog-images\/(.+)$/);
    const storagePath = urlMatch ? urlMatch[1] : null;

    if (!storagePath) {
      console.error('❌ Storage 경로를 추출할 수 없습니다.');
      process.exit(1);
    }

    // 폴더 경로 추출
    const folderMatch = storagePath.match(/^(.+)\/[^/]+$/);
    const folderPath = folderMatch ? folderMatch[1] : null;
    const dateFolder = folderPath?.match(/\/(\d{4}-\d{2}-\d{2})\//)?.[1] || new Date().toISOString().split('T')[0];

    console.log(`   Storage 경로: ${storagePath}`);
    console.log(`   폴더 경로: ${folderPath}`);
    console.log(`   날짜 폴더: ${dateFolder}\n`);

    // 이미지 파일 정보 가져오기 (Storage에서)
    const { data: fileList, error: listError } = await supabase.storage
      .from('blog-images')
      .list(folderPath, {
        limit: 1,
        search: storagePath.split('/').pop()
      });

    let fileSize = 0;
    if (fileList && fileList.length > 0) {
      fileSize = fileList[0].metadata?.size || 0;
      console.log(`   파일 크기: ${(fileSize / 1024).toFixed(2)}KB`);
    }

    // 메타데이터 생성
    const metadataPayload = {
      image_url: imageUrl,
      folder_path: folderPath,
      date_folder: dateFolder,
      source: 'mms',
      channel: 'sms',
      file_size: fileSize,
      format: 'jpg',
      upload_source: 'mms-recovery-fix',
      tags: [`sms-${messageId}`, 'mms', dateFolder, 'recovered', 'fixed'],
      title: `MMS 이미지 (메시지 #${messageId}) - 복구됨`,
      alt_text: `MMS 이미지`,
      created_at: message.sent_at || message.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newMeta, error: insertError } = await supabase
      .from('image_metadata')
      .insert(metadataPayload)
      .select()
      .single();

    if (insertError) {
      console.error('⚠️ insert 실패, upsert로 재시도:', insertError.message);
      
      const { data: upsertMeta, error: upsertError } = await supabase
        .from('image_metadata')
        .upsert(metadataPayload, { onConflict: 'image_url' })
        .select()
        .single();

      if (upsertError) {
        console.error('❌ upsert 실패:', upsertError.message);
        process.exit(1);
      }
      console.log(`✅ 메타데이터 upsert 성공 (ID: ${upsertMeta.id})\n`);
    } else {
      console.log(`✅ 메타데이터 생성 성공 (ID: ${newMeta.id})\n`);
    }
  }

  // 3. 최종 확인
  const { data: finalMeta } = await supabase
    .from('image_metadata')
    .select('*')
    .contains('tags', [`sms-${messageId}`])
    .eq('source', 'mms')
    .eq('channel', 'sms')
    .eq('image_url', imageUrl)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (finalMeta) {
    console.log('='.repeat(100));
    console.log('✅ 복구 완료!');
    console.log('='.repeat(100));
    console.log('');
    console.log('📋 최종 상태:');
    console.log(`   메시지 ID: ${messageId}`);
    console.log(`   이미지 URL: ${imageUrl}`);
    console.log(`   메타데이터 ID: ${finalMeta.id}`);
    console.log(`   태그: ${finalMeta.tags?.join(', ')}`);
    console.log('');
    console.log('💡 이제 SMS 편집 페이지를 새로고침하면 이미지가 표시됩니다.');
    console.log('   /admin/sms?id=155\n');
  } else {
    console.error('❌ 최종 확인 실패');
    process.exit(1);
  }
}

fixMessage155ImageMetadata()
  .then(() => {
    console.log('✅ 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });











