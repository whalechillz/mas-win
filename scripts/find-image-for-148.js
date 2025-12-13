/**
 * 148번 메시지의 이미지 찾기
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

async function findImageFor148() {
  try {
    console.log('🔍 148번 메시지의 이미지 찾기\n');
    console.log('='.repeat(100));

    // 1. 148번 메시지 정보
    const { data: message148, error: msg148Error } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('id', 148)
      .single();

    if (msg148Error || !message148) {
      console.error('❌ 148번 메시지를 찾을 수 없습니다:', msg148Error);
      return;
    }

    console.log(`📋 메시지 ID: 148`);
    console.log(`   Solapi imageId: ${message148.image_url || '(없음)'}`);
    console.log(`   생성일: ${message148.created_at}`);
    console.log(`   발송일: ${message148.sent_at || '(없음)'}\n`);

    // 2. 148번 메시지의 태그로 이미지 찾기
    const tag = `sms-148`;
    console.log(`🔍 태그 "${tag}"로 이미지 검색 중...`);
    
    const { data: images, error: imgError } = await supabase
      .from('image_metadata')
      .select('*')
      .contains('tags', [tag])
      .eq('source', 'mms')
      .eq('channel', 'sms')
      .order('created_at', { ascending: false });

    if (imgError) {
      console.error('❌ 이미지 조회 오류:', imgError);
      return;
    }

    if (images && images.length > 0) {
      console.log(`✅ 이미지 발견: ${images.length}개\n`);
      images.forEach((img, idx) => {
        console.log(`📷 이미지 ${idx + 1}:`);
        console.log(`   URL: ${img.image_url}`);
        console.log(`   폴더: ${img.folder_path}`);
        console.log(`   파일명: ${img.file_name}`);
        console.log(`   생성일: ${img.created_at}`);
        console.log(`   태그: ${img.tags?.join(', ') || '(없음)'}`);
        console.log('');
      });

      const latestImage = images[0];
      console.log('='.repeat(100));
      console.log('\n📌 복원 정보:');
      console.log(`   이미지 URL: ${latestImage.image_url}`);
      console.log(`   폴더 경로: ${latestImage.folder_path}`);
      console.log(`   파일명: ${latestImage.file_name}`);
      console.log('\n💡 이 이미지를 155번 메시지에도 사용할 수 있습니다.');
      console.log(`   갤러리에서 찾기: ${latestImage.image_url}`);
    } else {
      console.log(`⚠️ 태그 "${tag}"로 이미지를 찾을 수 없습니다.`);
      console.log('\n💡 이미지가 image_metadata에 저장되지 않았을 수 있습니다.');
      console.log('   갤러리에서 수동으로 이미지를 찾아야 합니다.');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

findImageFor148();










