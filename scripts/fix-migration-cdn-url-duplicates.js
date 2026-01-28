/**
 * 마이그레이션 후 cdn_url 중복 문제 해결
 * 중복 제약 조건 오류로 업데이트되지 않은 이미지들을 재처리
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// file_path에서 점 형식 날짜를 찾아 대시 형식으로 변환
function convertFilePath(filePath) {
  if (!filePath) return filePath;
  return filePath.replace(/\/(\d{4})\.(\d{2})\.(\d{2})(\/|$)/g, '/$1-$2-$3$4');
}

async function fixCdnUrlDuplicates() {
  console.log('🔧 cdn_url 중복 문제 해결 중...\n');

  try {
    // 점 형식 날짜가 남아있는 이미지 조회
    const { data: allImages, error: allImagesError } = await supabase
      .from('image_assets')
      .select('id, filename, file_path, cdn_url')
      .ilike('file_path', 'originals/customers/%')
      .limit(10000);

    if (allImagesError) {
      console.error('❌ 이미지 조회 실패:', allImagesError);
      return;
    }

    // 점 형식 날짜가 포함된 이미지만 필터링
    const imagesToFix = (allImages || []).filter((img) => {
      const filePath = img.file_path || '';
      return /\d{4}\.\d{2}\.\d{2}/.test(filePath);
    });

    console.log(`📦 수정 대상: ${imagesToFix.length}개 이미지\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const img of imagesToFix) {
      const oldFilePath = img.file_path || '';
      const newFilePath = convertFilePath(oldFilePath);

      if (oldFilePath === newFilePath) {
        continue;
      }

      console.log(`📝 처리 중: ${img.filename || img.id}`);
      console.log(`   file_path: ${oldFilePath.substring(0, 80)}...`);
      console.log(`            → ${newFilePath.substring(0, 80)}...`);

      // 새 cdn_url 생성
      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(newFilePath);

      // cdn_url 중복 확인 및 처리
      const { data: duplicateImages } = await supabase
        .from('image_assets')
        .select('id')
        .eq('cdn_url', publicUrl)
        .neq('id', img.id);

      if (duplicateImages && duplicateImages.length > 0) {
        // 중복된 이미지들의 cdn_url을 NULL로 설정
        const duplicateIds = duplicateImages.map(d => d.id);
        await supabase
          .from('image_assets')
          .update({ cdn_url: null })
          .in('id', duplicateIds);
        console.log(`   ⚠️  중복 cdn_url 처리: ${duplicateIds.length}개 이미지의 cdn_url을 NULL로 설정`);
      }

      // 업데이트
      const { error: updateError } = await supabase
        .from('image_assets')
        .update({
          file_path: newFilePath,
          cdn_url: publicUrl
        })
        .eq('id', img.id);

      if (updateError) {
        console.error(`   ❌ 업데이트 실패: ${updateError.message}`);
        errorCount++;
      } else {
        console.log(`   ✅ 업데이트 완료\n`);
        successCount++;
      }
    }

    console.log('\n📊 결과:');
    console.log(`   ✅ 성공: ${successCount}개`);
    console.log(`   ❌ 실패: ${errorCount}개`);

  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

fixCdnUrlDuplicates().catch(console.error);
