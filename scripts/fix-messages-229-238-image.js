/**
 * 229-238 메시지의 image_metadata 연결 확인 및 수정
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixMessages229238() {
  console.log('='.repeat(100));
  console.log('🔧 229-238 메시지 이미지 연결 확인 및 수정');
  console.log('='.repeat(100));
  console.log('');

  const solapiImageId = 'ST01FZ251215022939395w6sR1vmZC52';
  const messageIds = [229, 230, 231, 232, 233, 234, 235, 236, 237, 238];

  // 1. channel_sms에서 image_url 확인
  console.log('📋 channel_sms에서 image_url 확인 중...\n');
  const { data: messages, error: messagesError } = await supabase
    .from('channel_sms')
    .select('id, image_url')
    .in('id', messageIds);

  if (messagesError) {
    console.error('❌ 메시지 조회 실패:', messagesError.message);
    return;
  }

  console.log(`✅ 메시지 조회 완료: ${messages.length}개\n`);

  // 2. image_metadata에서 solapi-{imageId} 태그로 이미지 찾기
  console.log('🔍 image_metadata에서 Solapi 이미지 찾기...\n');
  const { data: metadataImages, error: metadataError } = await supabase
    .from('image_metadata')
    .select('id, image_url, tags, folder_path')
    .contains('tags', [`solapi-${solapiImageId}`])
    .order('created_at', { ascending: true })
    .limit(5);

  if (metadataError) {
    console.error('❌ 메타데이터 조회 실패:', metadataError.message);
    return;
  }

  if (!metadataImages || metadataImages.length === 0) {
    console.log('⚠️  image_metadata에 Solapi 이미지가 없습니다.');
    console.log('💡 get-image-preview API가 이미지를 다운로드하면 자동으로 생성됩니다.\n');
    return;
  }

  console.log(`✅ 발견된 이미지: ${metadataImages.length}개\n`);
  const targetImage = metadataImages[0];
  console.log(`📌 사용할 이미지:`);
  console.log(`   URL: ${targetImage.image_url}`);
  console.log(`   폴더: ${targetImage.folder_path || '(없음)'}`);
  console.log(`   태그: ${targetImage.tags?.join(', ') || '(없음)'}\n`);

  // 3. 각 메시지에 대해 태그 확인 및 추가
  console.log('📋 메시지별 태그 확인 및 추가 중...\n');
  let successCount = 0;
  let failCount = 0;

  for (const messageId of messageIds) {
    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) {
        console.log(`⚠️  메시지 ${messageId}: 메시지를 찾을 수 없습니다.`);
        failCount++;
        continue;
      }

      if (message.image_url !== solapiImageId) {
        console.log(`⚠️  메시지 ${messageId}: image_url이 일치하지 않습니다. (${message.image_url?.substring(0, 30)}...)`);
        failCount++;
        continue;
      }

      // 기존 메타데이터 확인
      const { data: existing } = await supabase
        .from('image_metadata')
        .select('id, tags')
        .eq('image_url', targetImage.image_url)
        .single();

      if (!existing) {
        console.log(`⚠️  메시지 ${messageId}: 메타데이터를 찾을 수 없습니다.`);
        failCount++;
        continue;
      }

      // 태그 확인
      const requiredTag = `sms-${messageId}`;
      const hasTag = existing.tags?.includes(requiredTag);
      const hasSolapiTag = existing.tags?.includes(`solapi-${solapiImageId}`);

      if (hasTag && hasSolapiTag) {
        console.log(`✅ 메시지 ${messageId}: 이미 연결되어 있습니다.`);
        successCount++;
        continue;
      }

      // 태그 추가
      const existingTags = existing.tags || [];
      const newTags = [...new Set([...existingTags, requiredTag, `solapi-${solapiImageId}`])];

      const { error: updateError } = await supabase
        .from('image_metadata')
        .update({
          tags: newTags,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error(`❌ 메시지 ${messageId}: 태그 추가 실패:`, updateError.message);
        failCount++;
      } else {
        console.log(`✅ 메시지 ${messageId}: 태그 추가 완료`);
        successCount++;
      }
    } catch (error) {
      console.error(`❌ 메시지 ${messageId}: 처리 중 오류:`, error.message);
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(100));
  console.log('✅ 완료!');
  console.log('='.repeat(100));
  console.log(`성공: ${successCount}개`);
  console.log(`실패: ${failCount}개\n`);

  // 4. 검증
  console.log('🔍 연결 검증 중...\n');
  for (const messageId of messageIds) {
    const { data: metadata } = await supabase
      .from('image_metadata')
      .select('tags')
      .eq('image_url', targetImage.image_url)
      .single();

    if (metadata) {
      const hasTag = metadata.tags?.includes(`sms-${messageId}`);
      const hasSolapiTag = metadata.tags?.includes(`solapi-${solapiImageId}`);
      console.log(`ID ${messageId}: 태그=${hasTag ? '✅' : '❌'} | Solapi 태그=${hasSolapiTag ? '✅' : '❌'}`);
    } else {
      console.log(`ID ${messageId}: ❌ 메타데이터 없음`);
    }
  }
}

fixMessages229238()
  .then(() => {
    console.log('\n✅ 모든 작업 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });

