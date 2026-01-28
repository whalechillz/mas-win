/**
 * 이남구 고객 중복 이미지 삭제 (filename별로 가장 최근 것만 유지)
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

async function deleteDuplicateImages() {
  console.log('🗑️  이남구 고객 중복 이미지 삭제...\n');

  const DRY_RUN = !process.argv.includes('--execute');

  if (DRY_RUN) {
    console.log('🔍 DRY RUN 모드: 실제 삭제 없이 시뮬레이션만 수행합니다.\n');
    console.log('   실제 삭제를 실행하려면: node scripts/delete-leenamgu-duplicate-images.js --execute\n');
  } else {
    console.log('🚀 실제 삭제를 시작합니다...\n');
  }

  try {
    // 1. DB 이미지 조회
    const { data: dbImages, error: dbError } = await supabase
      .from('image_assets')
      .select('id, filename, file_path, created_at')
      .ilike('file_path', 'originals/customers/leenamgu-8768/%')
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('❌ DB 조회 실패:', dbError);
      return;
    }

    console.log(`📊 총 ${dbImages.length}개 이미지\n`);

    // 2. Storage 파일 확인
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from('blog-images')
      .list('originals/customers/leenamgu-8768/2024-10-29', {
        limit: 1000
      });

    if (storageError) {
      console.error('❌ Storage 조회 실패:', storageError);
      return;
    }

    const storageFileNames = new Set(
      (storageFiles || [])
        .filter(f => f.id) // 파일만
        .map(f => f.name.toLowerCase())
    );

    console.log(`📦 Storage 실제 파일: ${storageFileNames.size}개\n`);

    // 3. filename별로 그룹화
    const filenameGroups = new Map();
    dbImages.forEach(img => {
      const filename = img.filename || '없음';
      if (!filenameGroups.has(filename)) {
        filenameGroups.set(filename, []);
      }
      filenameGroups.get(filename).push(img);
    });

    // 4. 각 그룹에서 유지할 것과 삭제할 것 결정
    const toKeep = [];
    const toDelete = [];

    filenameGroups.forEach((images, filename) => {
      const filenameLower = filename.toLowerCase();
      
      if (storageFileNames.has(filenameLower)) {
        // Storage에 존재하는 경우, 가장 최근 것만 유지
        const sorted = images.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
        toKeep.push(sorted[0]);
        // 나머지는 삭제 대상
        toDelete.push(...sorted.slice(1));
      } else {
        // Storage에 없는 경우 모두 삭제
        toDelete.push(...images);
      }
    });

    console.log(`✅ 유지할 이미지: ${toKeep.length}개`);
    console.log(`❌ 삭제할 이미지: ${toDelete.length}개\n`);

    if (toDelete.length > 0) {
      console.log('🗑️  삭제 대상 이미지:\n');
      toDelete.slice(0, 10).forEach((img, idx) => {
        console.log(`   ${idx + 1}. ID: ${img.id}`);
        console.log(`      filename: ${img.filename}`);
        console.log(`      생성일: ${img.created_at}\n`);
      });
      if (toDelete.length > 10) {
        console.log(`   ... 외 ${toDelete.length - 10}개\n`);
      }

      if (!DRY_RUN) {
        const deleteIds = toDelete.map(img => img.id);
        
        const { error: deleteError } = await supabase
          .from('image_assets')
          .delete()
          .in('id', deleteIds);

        if (deleteError) {
          console.error('❌ 삭제 실패:', deleteError);
        } else {
          console.log(`✅ ${toDelete.length}개 중복 이미지 삭제 완료\n`);
        }
      }
    }

    // 5. 최종 결과
    console.log('📊 최종 결과:\n');
    console.log(`   Storage 실제 파일: ${storageFileNames.size}개`);
    if (!DRY_RUN) {
      console.log(`   DB 이미지 (삭제 후): ${toKeep.length}개`);
      console.log(`   삭제된 중복 이미지: ${toDelete.length}개`);
    } else {
      console.log(`   DB 이미지 (현재): ${dbImages.length}개`);
      console.log(`   삭제 예정 중복 이미지: ${toDelete.length}개`);
    }

    if (DRY_RUN) {
      console.log('\n💡 실제 삭제를 실행하려면:');
      console.log('   node scripts/delete-leenamgu-duplicate-images.js --execute');
    }

  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

deleteDuplicateImages().catch(console.error);
