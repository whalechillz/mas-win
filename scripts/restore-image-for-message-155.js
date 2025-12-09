/**
 * 155번 메시지의 이미지 복원
 * Solapi imageId를 기반으로 Supabase에 저장된 원본 이미지 찾기
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

async function restoreImageForMessage155() {
  try {
    console.log('🔍 155번 메시지 이미지 복원\n');
    console.log('='.repeat(100));

    // 1. 메시지 정보 확인
    const { data: message, error: msgError } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('id', 155)
      .single();

    if (msgError || !message) {
      console.error('❌ 155번 메시지를 찾을 수 없습니다:', msgError);
      return;
    }

    console.log(`📋 메시지 ID: 155`);
    console.log(`   상태: ${message.status}`);
    console.log(`   타입: ${message.message_type}`);
    console.log(`   Solapi imageId: ${message.image_url || '(없음)'}`);
    console.log(`   발송일: ${message.sent_at || '(없음)'}`);
    console.log(`   수신자 수: ${message.recipient_numbers?.length || 0}명\n`);

    if (!message.image_url) {
      console.error('❌ 메시지에 이미지가 없습니다.');
      return;
    }

    const isHttpUrl = /^https?:\/\//i.test(message.image_url);
    const isSolapiId = /^[A-Z0-9]+$/i.test(message.image_url) && message.image_url.length > 10;

    if (isHttpUrl) {
      console.log('✅ 이미지 타입: HTTP URL (Supabase)');
      console.log(`   이미지 URL: ${message.image_url}`);
      console.log('\n💡 이미지가 이미 Supabase URL로 저장되어 있습니다.');
      console.log('   에디터에서 페이지를 새로고침하면 이미지가 표시됩니다.');
      return;
    } else if (isSolapiId) {
      console.log('⚠️ 이미지 타입: Solapi imageId');
      console.log(`   Solapi imageId: ${message.image_url}`);
      console.log('\n📤 Solapi imageId는 HTTP URL이 아니므로 직접 표시할 수 없습니다.');
      console.log('   Supabase에 저장된 원본 이미지를 찾아야 합니다.\n');
    } else {
      console.log('❓ 알 수 없는 이미지 형식');
      return;
    }

    // 2. image_metadata에서 해당 메시지의 이미지 찾기
    console.log('🔍 image_metadata에서 이미지 검색 중...');
    const tag = `sms-155`;
    const { data: images, error: imgError } = await supabase
      .from('image_metadata')
      .select('*')
      .contains('tags', [tag])
      .eq('source', 'mms')
      .eq('channel', 'sms')
      .order('created_at', { ascending: false })
      .limit(5);

    if (imgError) {
      console.error('❌ 이미지 메타데이터 조회 오류:', imgError);
      return;
    }

    if (!images || images.length === 0) {
      console.log('⚠️ image_metadata에 태그가 없습니다.');
      console.log(`   검색한 태그: "${tag}"`);
      console.log('\n💡 해결 방법:');
      console.log('   1. 갤러리에서 이미지를 찾아 수동으로 업로드');
      console.log('   2. 또는 Solapi 콘솔에서 이미지를 다운로드하여 다시 업로드');
      console.log('   3. 발송 시 사용된 이미지를 다시 찾아서 업로드');
      return;
    }

    console.log(`✅ 이미지 발견: ${images.length}개\n`);

    images.forEach((image, idx) => {
      console.log(`📷 이미지 ${idx + 1}:`);
      console.log(`   URL: ${image.image_url}`);
      console.log(`   폴더: ${image.folder_path}`);
      console.log(`   파일명: ${image.file_name}`);
      console.log(`   크기: ${(image.file_size / 1024).toFixed(2)}KB`);
      console.log(`   생성일: ${image.created_at}`);
      console.log(`   태그: ${image.tags?.join(', ') || '(없음)'}`);
      console.log('');
    });

    // 3. 가장 최근 이미지 사용
    const latestImage = images[0];
    console.log('='.repeat(100));
    console.log('\n📌 복원 정보:');
    console.log(`   사용할 이미지: ${latestImage.image_url}`);
    console.log(`   폴더 경로: ${latestImage.folder_path}`);
    console.log(`   파일명: ${latestImage.file_name}`);
    
    // 4. 이미지가 이미 DB에 저장되어 있는지 확인
    if (message.image_url === latestImage.image_url) {
      console.log('\n✅ 이미지가 이미 DB에 올바르게 저장되어 있습니다.');
      console.log('   에디터에서 페이지를 새로고침하면 이미지가 표시됩니다.');
    } else {
      console.log('\n⚠️ 이미지 URL이 일치하지 않습니다.');
      console.log(`   메시지 image_url: ${message.image_url} (Solapi imageId)`);
      console.log(`   메타데이터 image_url: ${latestImage.image_url} (Supabase URL)`);
      console.log('\n💡 해결 방법:');
      console.log('   1. 에디터에서 이미지를 수동으로 다시 업로드');
      console.log('   2. 또는 아래 URL을 사용하여 이미지 복원:');
      console.log(`      ${latestImage.image_url}`);
      console.log('\n📝 DB 업데이트 옵션:');
      console.log('   메시지의 image_url을 Supabase URL로 업데이트할 수 있습니다.');
      console.log('   하지만 Solapi imageId를 유지하는 것이 권장됩니다.');
    }

    console.log('\n' + '='.repeat(100));
    console.log('\n📌 갤러리에서 찾는 방법:');
    console.log('   1. 갤러리 관리 페이지 접속');
    console.log('   2. "SMS" 채널 필터 선택');
    console.log('   3. 날짜: 2025-12-05');
    console.log('   4. 또는 태그: "sms-155" 검색');
    console.log(`   5. 이미지 URL: ${latestImage.image_url}`);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

restoreImageForMessage155();



