/**
 * 스크립트로 업데이트한 메시지들의 image_metadata 연결
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function connectImagesToMetadata() {
  console.log('='.repeat(100));
  console.log('🔗 이미지 메타데이터 연결 스크립트');
  console.log('='.repeat(100));
  console.log('');

  const solapiImageId = 'ST01FZ251215022939395w6sR1vmZC52';
  const messageIds = [229, 230, 231, 232, 233, 234, 235, 236, 237, 238];

  // 1. Supabase Storage에 있는 이미지 URL 찾기
  console.log('🔍 Supabase Storage 이미지 URL 찾기...');
  const { data: storageFiles, error: storageError } = await supabase.storage
    .from('blog-images')
    .list('originals/mms/2025-12-15/survey', {
      limit: 10,
      sortBy: { column: 'created_at', order: 'desc' }
    });

  let supabaseImageUrl = null;
  if (!storageError && storageFiles && storageFiles.length > 0) {
    const fileName = storageFiles[0].name;
    const { data: urlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(`originals/mms/2025-12-15/survey/${fileName}`);
    supabaseImageUrl = urlData?.publicUrl;
    console.log(`✅ 이미지 URL 발견: ${supabaseImageUrl?.substring(0, 80)}...\n`);
  } else {
    // 대체: 직접 URL 구성
    supabaseImageUrl = 'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/originals/mms/2025-12-15/survey/bucket-hat-muziik-8-1765766236212.jpg';
    console.log(`⚠️ Storage 목록 조회 실패, 기본 URL 사용: ${supabaseImageUrl.substring(0, 80)}...\n`);
  }

  // 2. 각 메시지에 대해 image_metadata 연결
  console.log('📋 메시지별 메타데이터 연결 시작...\n');

  let successCount = 0;
  let failCount = 0;

  for (const messageId of messageIds) {
    try {
      // 기존 메타데이터 확인
      const { data: existing } = await supabase
        .from('image_metadata')
        .select('id, tags')
        .eq('image_url', supabaseImageUrl)
        .single();

      const requiredTags = [
        `sms-${messageId}`,
        `solapi-${solapiImageId}`,
        'solapi-temp',
        'survey',
        'mms'
      ];
      
      if (existing) {
        // 기존 메타데이터가 있으면 태그만 추가
        const existingTags = existing.tags || [];
        const newTags = [...new Set([...existingTags, ...requiredTags])];
        
        tags = newTags;

        const { error: updateError } = await supabase
          .from('image_metadata')
          .update({
            tags: tags,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error(`❌ 메시지 ${messageId} 메타데이터 업데이트 실패:`, updateError.message);
          failCount++;
        } else {
          console.log(`✅ 메시지 ${messageId} 메타데이터 태그 추가 완료`);
          successCount++;
        }
      } else {
        // 새 메타데이터 생성
        const { error: insertError } = await supabase
          .from('image_metadata')
          .insert({
            image_url: supabaseImageUrl,
            folder_path: 'originals/mms/2025-12-15/survey',
            date_folder: '2025-12-15',
            source: 'mms',
            channel: 'sms',
            format: 'jpg',
            upload_source: 'survey-mms-script',
            tags: tags,
            title: `MMS 이미지 (메시지 #${messageId}) - 설문 조사`,
            alt_text: 'MASSGOO X MUZIIK 콜라보 버킷햇',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error(`❌ 메시지 ${messageId} 메타데이터 생성 실패:`, insertError.message);
          failCount++;
        } else {
          console.log(`✅ 메시지 ${messageId} 메타데이터 생성 완료`);
          successCount++;
        }
      }
    } catch (error) {
      console.error(`❌ 메시지 ${messageId} 처리 중 오류:`, error.message);
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(100));
  console.log('✅ 완료!');
  console.log('='.repeat(100));
  console.log(`성공: ${successCount}개`);
  console.log(`실패: ${failCount}개\n`);

  // 3. 검증: 연결 확인
  console.log('🔍 연결 검증 중...\n');
  for (const messageId of messageIds) {
    const { data: metadata } = await supabase
      .from('image_metadata')
      .select('tags')
      .eq('image_url', supabaseImageUrl)
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

connectImagesToMetadata()
  .then(() => {
    console.log('\n✅ 모든 작업 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });

