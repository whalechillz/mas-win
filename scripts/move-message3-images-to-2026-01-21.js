/**
 * 메시지 3 (472-482) 이미지를 2026-01-21 폴더로 이동
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

async function moveImageToNewDate(messageId, oldDateFolder, newDateFolder) {
  console.log(`\n📋 메시지 #${messageId} 이미지 이동 중...`);
  
  try {
    // 1. 현재 메시지 정보 확인
    const { data: message, error: msgError } = await supabase
      .from('channel_sms')
      .select('id, image_url')
      .eq('id', messageId)
      .single();

    if (msgError || !message || !message.image_url) {
      console.error(`   ❌ 메시지 ${messageId} 조회 실패 또는 이미지 없음`);
      return { success: false };
    }

    const oldImageUrl = message.image_url;
    console.log(`   현재 이미지 URL: ${oldImageUrl}`);

    // 2. 이미지 파일 경로 추출
    const urlParts = oldImageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const oldPath = `originals/mms/${oldDateFolder}/${messageId}/${fileName}`;
    const newPath = `originals/mms/${newDateFolder}/${messageId}/${fileName}`;

    console.log(`   이전 경로: ${oldPath}`);
    console.log(`   새 경로: ${newPath}`);

    // 3. 이미지 다운로드
    const { data: imageData, error: downloadError } = await supabase.storage
      .from('blog-images')
      .download(oldPath);

    if (downloadError) {
      console.error(`   ❌ 이미지 다운로드 실패: ${downloadError.message}`);
      return { success: false, error: downloadError };
    }

    const imageBuffer = Buffer.from(await imageData.arrayBuffer());
    console.log(`   ✅ 이미지 다운로드 완료 (${(imageBuffer.length / 1024).toFixed(2)}KB)`);

    // 4. 새 경로에 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(newPath, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (uploadError) {
      console.error(`   ❌ 새 경로 업로드 실패: ${uploadError.message}`);
      return { success: false, error: uploadError };
    }

    console.log(`   ✅ 새 경로 업로드 완료`);

    // 5. 새 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(newPath);
    const newImageUrl = urlData.publicUrl;

    console.log(`   ✅ 새 공개 URL: ${newImageUrl}`);

    // 6. image_metadata 업데이트
    const { data: metadata, error: metaError } = await supabase
      .from('image_metadata')
      .update({
        image_url: newImageUrl,
        folder_path: `originals/mms/${newDateFolder}/${messageId}`,
        original_path: newPath,
        updated_at: new Date().toISOString()
      })
      .eq('image_url', oldImageUrl)
      .select()
      .single();

    if (metaError) {
      console.warn(`   ⚠️ 메타데이터 업데이트 실패 (계속 진행): ${metaError.message}`);
    } else {
      console.log(`   ✅ 메타데이터 업데이트 완료`);
    }

    // 7. channel_sms.image_url 업데이트
    const { error: updateError } = await supabase
      .from('channel_sms')
      .update({
        image_url: newImageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId);

    if (updateError) {
      console.error(`   ❌ channel_sms 업데이트 실패: ${updateError.message}`);
      return { success: false, error: updateError };
    }

    console.log(`   ✅ channel_sms.image_url 업데이트 완료`);

    // 8. 이전 파일 삭제
    const { error: deleteError } = await supabase.storage
      .from('blog-images')
      .remove([oldPath]);

    if (deleteError) {
      console.warn(`   ⚠️ 이전 파일 삭제 실패 (무시): ${deleteError.message}`);
    } else {
      console.log(`   ✅ 이전 파일 삭제 완료`);
    }

    return { success: true, newImageUrl };
  } catch (error) {
    console.error(`   ❌ 오류: ${error.message}`);
    return { success: false, error };
  }
}

async function main() {
  console.log('🚀 메시지 3 이미지를 2026-01-21로 이동\n');
  console.log('='.repeat(60));

  const message3Ids = [472, 473, 474, 475, 476, 477, 478, 479, 480, 481, 482];
  const oldDateFolder = '2026-01-20';
  const newDateFolder = '2026-01-21';

  try {
    let successCount = 0;
    let failCount = 0;

    for (const messageId of message3Ids) {
      const result = await moveImageToNewDate(messageId, oldDateFolder, newDateFolder);
      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    // 최종 요약
    console.log('\n' + '='.repeat(60));
    console.log('📊 최종 요약');
    console.log('='.repeat(60));
    console.log(`\n✅ 성공: ${successCount}개`);
    console.log(`❌ 실패: ${failCount}개`);
    console.log(`\n📁 이미지 경로 변경:`);
    console.log(`   이전: originals/mms/${oldDateFolder}/`);
    console.log(`   새: originals/mms/${newDateFolder}/`);
    console.log(`\n💡 메시지 3은 2026-01-21 발송 예정입니다.\n`);

  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log('✅ 모든 작업 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });
