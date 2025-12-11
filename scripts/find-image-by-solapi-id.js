/**
 * Solapi imageId로 Supabase에 저장된 이미지 찾기
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

async function findImageBySolapiId() {
  try {
    const solapiImageId = 'ST01FZ251204102654100YtuFM06Qspg';
    
    console.log('🔍 Solapi imageId로 이미지 찾기\n');
    console.log('='.repeat(100));
    console.log(`Solapi imageId: ${solapiImageId}\n`);

    // 1. 이 imageId를 사용하는 모든 메시지 찾기
    const { data: messages, error: msgError } = await supabase
      .from('channel_sms')
      .select('id, status, sent_at, created_at')
      .eq('image_url', solapiImageId)
      .order('id', { ascending: true });

    if (msgError) {
      console.error('❌ 메시지 조회 오류:', msgError);
      return;
    }

    console.log(`📋 이 이미지를 사용하는 메시지: ${messages?.length || 0}개`);
    if (messages && messages.length > 0) {
      messages.forEach(msg => {
        console.log(`   - 메시지 ID ${msg.id} (상태: ${msg.status}, 발송일: ${msg.sent_at || '없음'})`);
      });
      console.log('');
    }

    // 2. 각 메시지의 태그로 이미지 찾기
    if (messages && messages.length > 0) {
      for (const msg of messages) {
        const tag = `sms-${msg.id}`;
        console.log(`🔍 태그 "${tag}"로 이미지 검색 중...`);
        
        const { data: images, error: imgError } = await supabase
          .from('image_metadata')
          .select('*')
          .contains('tags', [tag])
          .eq('source', 'mms')
          .eq('channel', 'sms')
          .order('created_at', { ascending: false })
          .limit(1);

        if (imgError) {
          console.error(`   ❌ 이미지 조회 오류:`, imgError);
          continue;
        }

        if (images && images.length > 0) {
          const image = images[0];
          console.log(`   ✅ 이미지 발견!`);
          console.log(`      URL: ${image.image_url}`);
          console.log(`      폴더: ${image.folder_path}`);
          console.log(`      파일명: ${image.file_name}`);
          console.log(`      생성일: ${image.created_at}`);
          console.log(`      태그: ${image.tags?.join(', ') || '(없음)'}`);
          console.log('');
          
          // 첫 번째로 찾은 이미지 반환
          console.log('='.repeat(100));
          console.log('\n📌 복원 정보:');
          console.log(`   메시지 ID: ${msg.id}`);
          console.log(`   이미지 URL: ${image.image_url}`);
          console.log(`   폴더 경로: ${image.folder_path}`);
          console.log(`   파일명: ${image.file_name}`);
          console.log('\n💡 이 이미지를 155번 메시지에도 사용할 수 있습니다.');
          console.log(`   갤러리에서 찾기: ${image.image_url}`);
          return;
        } else {
          console.log(`   ⚠️ 태그 "${tag}"로 이미지를 찾을 수 없습니다.\n`);
        }
      }
    }

    // 3. 날짜 기반으로 검색 (2025-12-04 또는 2025-12-05)
    console.log('🔍 날짜 기반으로 이미지 검색 중...');
    const dates = ['2025-12-04', '2025-12-05'];
    
    for (const date of dates) {
      const { data: images, error: imgError } = await supabase
        .from('image_metadata')
        .select('*')
        .eq('date_folder', date)
        .eq('source', 'mms')
        .eq('channel', 'sms')
        .order('created_at', { ascending: false })
        .limit(10);

      if (imgError) {
        console.error(`   ❌ ${date} 이미지 조회 오류:`, imgError);
        continue;
      }

      if (images && images.length > 0) {
        console.log(`   ✅ ${date}에 업로드된 이미지: ${images.length}개`);
        console.log(`   최근 이미지:`);
        const latest = images[0];
        console.log(`      URL: ${latest.image_url}`);
        console.log(`      폴더: ${latest.folder_path}`);
        console.log(`      파일명: ${latest.file_name}`);
        console.log(`      태그: ${latest.tags?.join(', ') || '(없음)'}`);
        console.log('');
      }
    }

    console.log('='.repeat(100));
    console.log('\n⚠️ 정확한 이미지를 찾을 수 없습니다.');
    console.log('\n💡 해결 방법:');
    console.log('   1. 갤러리에서 2025-12-04 또는 2025-12-05 날짜의 MMS 이미지 확인');
    console.log('   2. 또는 Solapi 콘솔에서 이미지를 다운로드하여 다시 업로드');
    console.log('   3. 발송 시 사용된 이미지를 수동으로 찾아서 업로드');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

findImageBySolapiId();









