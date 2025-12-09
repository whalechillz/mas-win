/**
 * 128번 메시지 이미지에 sms-155 태그 추가 (개선 버전)
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

async function addSms155TagTo128Image() {
  console.log('🔗 128번 메시지 이미지에 sms-155 태그 추가...\n');

  try {
    // 1. 128번 메시지의 image_url 확인
    const { data: sms128, error: smsError } = await supabase
      .from('channel_sms')
      .select('image_url')
      .eq('id', 128)
      .single();

    if (smsError || !sms128) {
      console.error('❌ 128번 메시지를 찾을 수 없습니다:', smsError?.message);
      process.exit(1);
    }

    if (!sms128.image_url) {
      console.error('❌ 128번 메시지에 image_url이 없습니다.');
      process.exit(1);
    }

    console.log('✅ 128번 메시지 발견:');
    console.log(`   image_url: ${sms128.image_url}\n`);

    // 2. image_metadata에서 해당 URL로 이미지 찾기
    const { data: imageMetadataList, error: metaError } = await supabase
      .from('image_metadata')
      .select('*')
      .eq('image_url', sms128.image_url);

    if (metaError) {
      console.error('❌ image_metadata 조회 실패:', metaError.message);
      process.exit(1);
    }

    if (!imageMetadataList || imageMetadataList.length === 0) {
      console.log('⚠️ image_metadata에 128번 메시지 이미지가 등록되지 않았습니다.');
      console.log('   💾 image_metadata에 새로 추가 중...\n');
      
      // image_url에서 폴더 경로 추출
      const urlParts = sms128.image_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const folderPath = 'originals/mms/2025-11-28/128';
      const originalPath = `${folderPath}/${fileName}`;
      
      // image_metadata에 새 레코드 추가
      const newMetadata = {
        image_url: sms128.image_url,
        folder_path: folderPath,
        date_folder: '2025-11-28',
        source: 'mms',
        channel: 'sms',
        original_path: originalPath,
        tags: ['sms-128', 'sms-155'], // 128과 155 태그 모두 추가
        upload_source: 'manual-link',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: insertedMetadata, error: insertError } = await supabase
        .from('image_metadata')
        .insert(newMetadata)
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ image_metadata 추가 실패:', insertError.message);
        process.exit(1);
      }
      
      console.log('✅ image_metadata에 새 레코드 추가 완료!');
      console.log(`   이미지 ID: ${insertedMetadata.id}`);
      console.log(`   태그: ${insertedMetadata.tags.join(', ')}\n`);
      
      console.log('='.repeat(60));
      console.log('✅ 완료!');
      console.log('   image_metadata에 128번 메시지 이미지를 추가하고 sms-155 태그를 포함했습니다.');
      console.log('   이제 155번 폴더를 열면 128번 메시지 이미지가 링크된 이미지로 표시됩니다.');
      console.log('='.repeat(60));
      return;
    }

    console.log(`✅ image_metadata에서 이미지 ${imageMetadataList.length}개 발견:\n`);

    let updatedCount = 0;
    let alreadyHasTagCount = 0;

    // 3. 각 이미지에 sms-155 태그 추가
    for (const imageMetadata of imageMetadataList) {
      console.log(`📋 이미지 ID: ${imageMetadata.id}`);
      console.log(`   이미지 URL: ${imageMetadata.image_url}`);
      console.log(`   현재 태그: ${imageMetadata.tags?.join(', ') || '(없음)'}`);

      // sms-155 태그가 이미 있는지 확인
      const hasSms155Tag = imageMetadata.tags?.includes('sms-155');
      
      if (hasSms155Tag) {
        console.log(`   ✅ 이미 sms-155 태그가 있습니다.\n`);
        alreadyHasTagCount++;
        continue;
      }

      // sms-155 태그 추가
      const updatedTags = [...(imageMetadata.tags || []), 'sms-155'];
      
      console.log(`   💾 sms-155 태그 추가 중...`);
      const { error: updateError } = await supabase
        .from('image_metadata')
        .update({
          tags: updatedTags,
          updated_at: new Date().toISOString()
        })
        .eq('id', imageMetadata.id);

      if (updateError) {
        console.error(`   ❌ 태그 업데이트 실패: ${updateError.message}\n`);
        continue;
      }

      console.log(`   ✅ 태그 업데이트 완료!`);
      console.log(`   새 태그: ${updatedTags.join(', ')}\n`);
      updatedCount++;
    }

    console.log('='.repeat(60));
    console.log('✅ 완료!');
    console.log(`   업데이트된 이미지: ${updatedCount}개`);
    console.log(`   이미 태그가 있던 이미지: ${alreadyHasTagCount}개`);
    console.log('   이제 155번 폴더를 열면 128번 메시지 이미지가 링크된 이미지로 표시됩니다.');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

addSms155TagTo128Image();

