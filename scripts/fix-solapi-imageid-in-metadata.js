/**
 * image_metadata에서 Solapi imageId를 Supabase URL로 변환
 * 
 * 1. image_metadata에서 image_url이 ST01FZ로 시작하는 항목 찾기
 * 2. 해당 imageId로 실제 파일 찾기
 * 3. image_url을 Supabase URL로 업데이트
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixSolapiImageIdInMetadata() {
  console.log('='.repeat(100));
  console.log('🔧 image_metadata에서 Solapi imageId를 Supabase URL로 변환');
  console.log('='.repeat(100));
  console.log('');

  // 1. image_metadata에서 image_url이 ST01FZ로 시작하는 항목 찾기
  console.log('📋 image_metadata에서 Solapi imageId 찾기...\n');
  
  // 모든 image_metadata 조회 (image_url이 ST01FZ로 시작하는 것)
  const { data: allMetadata, error: allError } = await supabase
    .from('image_metadata')
    .select('id, image_url, folder_path, tags')
    .limit(10000); // 충분히 큰 수

  if (allError) {
    console.error('❌ image_metadata 조회 실패:', allError.message);
    return;
  }

  const solapiImageIdMetadata = allMetadata?.filter(meta => 
    meta.image_url && meta.image_url.startsWith('ST01FZ')
  ) || [];

  console.log(`✅ 발견된 항목: ${solapiImageIdMetadata.length}개\n`);

  if (solapiImageIdMetadata.length === 0) {
    console.log('ℹ️  image_metadata에 Solapi imageId가 없습니다.');
    return;
  }

  // 2. originals/mms/solapi에서 모든 파일 조회
  const { data: solapiFiles, error: filesError } = await supabase.storage
    .from('blog-images')
    .list('originals/mms/solapi', { limit: 1000 });

  if (filesError) {
    console.error('❌ 파일 조회 실패:', filesError.message);
    return;
  }

  console.log(`📁 originals/mms/solapi 파일: ${solapiFiles?.length || 0}개\n`);

  // imageId로 파일 매핑
  const fileMap = new Map();
  solapiFiles?.forEach(file => {
    const match = file.name.match(/solapi-(ST01FZ[A-Z0-9a-z]+)/);
    if (match) {
      const imageId = match[1];
      const filePath = `originals/mms/solapi/${file.name}`;
      const { data: urlData } = supabase.storage
        .from('blog-images')
        .getPublicUrl(filePath);
      
      if (urlData?.publicUrl) {
        fileMap.set(imageId, {
          name: file.name,
          path: filePath,
          url: urlData.publicUrl
        });
      }
    }
  });

  // 3. 각 메타데이터 업데이트
  console.log('📋 메타데이터 업데이트 중...\n');
  let updatedCount = 0;
  let notFoundCount = 0;

  for (const meta of solapiImageIdMetadata) {
    const imageId = meta.image_url;
    console.log(`📋 imageId: ${imageId.substring(0, 30)}...`);

    const fileInfo = fileMap.get(imageId);

    if (fileInfo) {
      console.log(`   ✅ 파일 발견: ${fileInfo.name}`);
      
      // 기존 태그 유지
      const existingTags = meta.tags || [];
      const newTags = [...new Set([...existingTags, `solapi-${imageId}`, 'solapi-permanent'])];

      // image_metadata 업데이트
      const { error: updateError } = await supabase
        .from('image_metadata')
        .update({
          image_url: fileInfo.url,
          folder_path: 'originals/mms/solapi',
          tags: newTags,
          updated_at: new Date().toISOString()
        })
        .eq('id', meta.id);

      if (updateError) {
        console.error(`   ❌ 업데이트 실패:`, updateError.message);
      } else {
        console.log(`   ✅ 업데이트 완료`);
        updatedCount++;
      }
    } else {
      console.log(`   ⚠️  파일을 찾을 수 없음`);
      notFoundCount++;
    }
    console.log('');
  }

  console.log('='.repeat(100));
  console.log('✅ 완료!');
  console.log('='.repeat(100));
  console.log(`📋 업데이트: ${updatedCount}개`);
  console.log(`⚠️  파일 없음: ${notFoundCount}개`);
  console.log('');
}

fixSolapiImageIdInMetadata()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });

