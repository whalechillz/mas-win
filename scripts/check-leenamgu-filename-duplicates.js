/**
 * 이남구 고객 DB 이미지 filename 중복 확인
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

async function checkFilenameDuplicates() {
  console.log('🔍 이남구 고객 DB 이미지 filename 중복 확인...\n');

  try {
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

    // filename별로 그룹화
    const filenameGroups = new Map();
    dbImages.forEach(img => {
      const filename = img.filename || '없음';
      if (!filenameGroups.has(filename)) {
        filenameGroups.set(filename, []);
      }
      filenameGroups.get(filename).push(img);
    });

    // 중복된 filename 확인
    const duplicates = Array.from(filenameGroups.entries())
      .filter(([filename, images]) => images.length > 1);

    console.log('📋 filename별 분류:\n');
    filenameGroups.forEach((images, filename) => {
      console.log(`   ${filename}: ${images.length}개`);
      if (images.length > 1) {
        images.forEach((img, idx) => {
          console.log(`      ${idx + 1}. ID: ${img.id}`);
          console.log(`         file_path: ${img.file_path}`);
          console.log(`         생성일: ${img.created_at}\n`);
        });
      }
    });

    console.log(`\n⚠️  중복된 filename: ${duplicates.length}개\n`);

    // Storage 파일 확인
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from('blog-images')
      .list('originals/customers/leenamgu-8768/2024-10-29', {
        limit: 1000
      });

    if (!storageError && storageFiles) {
      const storageFileNames = new Set(storageFiles
        .filter(f => f.id) // 파일만
        .map(f => f.name.toLowerCase()));

      console.log(`📦 Storage 실제 파일: ${storageFileNames.size}개\n`);

      // 각 filename 그룹에서 Storage에 존재하는 것만 남기고 나머지 삭제
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
          console.log(`      file_path: ${img.file_path}\n`);
        });
        if (toDelete.length > 10) {
          console.log(`   ... 외 ${toDelete.length - 10}개\n`);
        }
      }
    }

  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

checkFilenameDuplicates().catch(console.error);
