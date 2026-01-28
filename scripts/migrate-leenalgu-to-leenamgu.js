/**
 * leenalgu-8768 → leenamgu-8768 마이그레이션 및 삭제
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

async function migrateLeenalguToLeenamgu() {
  console.log('🔄 leenalgu-8768 → leenamgu-8768 마이그레이션 시작...\n');

  try {
    // 1. leenalgu-8768의 이미지 조회
    const { data: leenalguImages, error: imagesError } = await supabase
      .from('image_assets')
      .select('id, filename, file_path, cdn_url, ai_tags')
      .ilike('file_path', 'originals/customers/leenalgu-8768/%');

    if (imagesError) {
      console.error('❌ 이미지 조회 실패:', imagesError);
      return;
    }

    if (!leenalguImages || leenalguImages.length === 0) {
      console.log('✅ leenalgu-8768에 이미지가 없습니다. 바로 삭제 가능합니다.\n');
      
      // Storage 폴더 삭제
      const { error: deleteError } = await supabase.storage
        .from('blog-images')
        .remove(['originals/customers/leenalgu-8768']);

      if (deleteError) {
        console.error('❌ Storage 폴더 삭제 실패:', deleteError);
      } else {
        console.log('✅ Storage 폴더 삭제 완료');
      }
      return;
    }

    console.log(`📦 마이그레이션 대상: ${leenalguImages.length}개 이미지\n`);

    // 2. Storage 폴더 확인
    const { data: leenalguFiles, error: listError } = await supabase.storage
      .from('blog-images')
      .list('originals/customers/leenalgu-8768', {
        limit: 100
      });

    if (listError) {
      console.error('❌ Storage 폴더 조회 실패:', listError);
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    // 3. 각 이미지 처리
    for (const img of leenalguImages) {
      const oldFilePath = img.file_path || '';
      const newFilePath = oldFilePath.replace('leenalgu-8768', 'leenamgu-8768');

      console.log(`📝 처리 중: ${img.filename || img.id}`);
      console.log(`   ${oldFilePath.substring(0, 80)}...`);
      console.log(`   → ${newFilePath.substring(0, 80)}...`);

      // 3-1. Storage 파일 이동 (파일이 존재하는 경우만)
      const { data: fileExists, error: checkError } = await supabase.storage
        .from('blog-images')
        .list(oldFilePath.substring(0, oldFilePath.lastIndexOf('/')), {
          search: oldFilePath.split('/').pop()
        });

      if (!checkError && fileExists && fileExists.length > 0) {
        const { error: moveError } = await supabase.storage
          .from('blog-images')
          .move(oldFilePath, newFilePath);

        if (moveError) {
          console.log(`   ⚠️  파일 이동 실패 (파일이 이미 없을 수 있음): ${moveError.message}`);
          // 파일이 없어도 DB 메타데이터는 업데이트 진행
        } else {
          console.log(`   ✅ 파일 이동 완료`);
        }
      } else {
        console.log(`   ℹ️  Storage에 파일이 없음 (이미 이동되었거나 삭제됨). DB 메타데이터만 업데이트합니다.`);
      }

      // 3-2. DB 업데이트
      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(newFilePath);

      // cdn_url 중복 확인
      const { data: duplicateImages } = await supabase
        .from('image_assets')
        .select('id')
        .eq('cdn_url', publicUrl)
        .neq('id', img.id);

      if (duplicateImages && duplicateImages.length > 0) {
        const duplicateIds = duplicateImages.map(d => d.id);
        await supabase
          .from('image_assets')
          .update({ cdn_url: null })
          .in('id', duplicateIds);
        console.log(`   ⚠️  중복 cdn_url 처리: ${duplicateIds.length}개 이미지`);
      }

      const { error: updateError } = await supabase
        .from('image_assets')
        .update({
          file_path: newFilePath,
          cdn_url: publicUrl
        })
        .eq('id', img.id);

      if (updateError) {
        console.error(`   ❌ DB 업데이트 실패: ${updateError.message}`);
        errorCount++;
      } else {
        console.log(`   ✅ DB 업데이트 완료\n`);
        successCount++;
      }
    }

    console.log('\n📊 마이그레이션 결과:');
    console.log(`   ✅ 성공: ${successCount}개`);
    console.log(`   ❌ 실패: ${errorCount}개`);

    // 4. leenalgu-8768 폴더 삭제 (모든 파일 이동 완료 후)
    if (errorCount === 0 && successCount === leenalguImages.length) {
      console.log('\n🗑️  leenalgu-8768 폴더 삭제 중...');
      
      // 모든 하위 폴더와 파일 삭제
      const { error: deleteError } = await supabase.storage
        .from('blog-images')
        .remove(['originals/customers/leenalgu-8768']);

      if (deleteError) {
        console.error('❌ 폴더 삭제 실패:', deleteError);
      } else {
        console.log('✅ leenalgu-8768 폴더 삭제 완료');
      }
    } else {
      console.log('\n⚠️  일부 파일 이동 실패로 폴더 삭제를 건너뜁니다.');
      console.log('   수동으로 확인 후 삭제해주세요.');
    }

  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

migrateLeenalguToLeenamgu().catch(console.error);
