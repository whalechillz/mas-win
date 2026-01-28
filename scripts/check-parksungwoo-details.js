/**
 * 박성우 고객 이미지 상세 확인
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

// Storage에서 재귀적으로 모든 파일 목록 가져오기
async function getAllFilesFromStorage(path, allFiles = []) {
  const { data: items, error } = await supabase.storage
    .from('blog-images')
    .list(path, {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' }
    });

  if (error) {
    return allFiles;
  }

  if (!items || items.length === 0) {
    return allFiles;
  }

  for (const item of items) {
    const fullPath = `${path}/${item.name}`;
    
    if (item.id) {
      allFiles.push({
        path: fullPath,
        name: item.name,
        size: item.metadata?.size || 0
      });
    } else {
      await getAllFilesFromStorage(fullPath, allFiles);
    }
  }

  return allFiles;
}

async function checkParksungwooDetails() {
  console.log('🔍 박성우 고객 이미지 상세 확인...\n');

  try {
    // 1. 고객 정보 확인
    const { data: customer } = await supabase
      .from('customers')
      .select('id, name, folder_name')
      .eq('folder_name', 'parksungwoo-6003')
      .single();

    if (!customer) {
      console.error('❌ 박성우 고객을 찾을 수 없습니다.');
      return;
    }

    console.log(`✅ 고객: ${customer.name} (ID: ${customer.id}, 폴더: ${customer.folder_name})\n`);

    // 2. Storage 실제 파일 확인
    console.log('📦 Storage 실제 파일 확인 중...\n');
    const storageFiles = await getAllFilesFromStorage(`originals/customers/${customer.folder_name}`);
    
    // 썸네일/리사이즈 파일 제외
    const originalFiles = storageFiles.filter(f => {
      const name = f.name.toLowerCase();
      return !name.includes('_resized_') && 
             !name.includes('_thumbnail_') && 
             !name.includes('_thumb_') &&
             !name.includes('_s_') &&
             !name.includes('_m_') &&
             !name.includes('_l_');
    });

    console.log(`📦 Storage 원본 파일: ${originalFiles.length}개\n`);
    originalFiles.forEach((f, idx) => {
      console.log(`   ${idx + 1}. ${f.name} (${(f.size / 1024).toFixed(2)} KB)`);
    });

    // 3. DB 이미지 조회
    console.log('\n📊 DB 메타데이터 확인 중...\n');
    const { data: dbImages, error: dbError } = await supabase
      .from('image_assets')
      .select('id, filename, file_path, cdn_url, ai_tags, created_at')
      .ilike('file_path', `originals/customers/${customer.folder_name}/%`)
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('❌ DB 조회 실패:', dbError);
      return;
    }

    console.log(`📊 DB 이미지: ${dbImages.length}개\n`);

    // 4. filename별로 그룹화
    const filenameGroups = new Map();
    dbImages.forEach(img => {
      const filename = img.filename || '';
      if (!filenameGroups.has(filename)) {
        filenameGroups.set(filename, []);
      }
      filenameGroups.get(filename).push(img);
    });

    // 5. Storage 파일명 맵
    const storageFileNames = new Set(originalFiles.map(f => f.name.toLowerCase()));

    // 6. 상세 분석
    console.log('📋 filename별 상세 분석:\n');
    
    const validImages = [];
    const ghostImages = [];
    const duplicateImages = [];

    filenameGroups.forEach((images, filename) => {
      const filenameLower = filename.toLowerCase();
      const isInStorage = storageFileNames.has(filenameLower);
      
      console.log(`📸 ${filename}:`);
      console.log(`   DB 메타데이터: ${images.length}개`);
      console.log(`   Storage 존재: ${isInStorage ? '✅' : '❌'}`);
      
      images.forEach((img, idx) => {
        const isLatest = idx === 0;
        console.log(`   ${idx + 1}. ID: ${img.id}`);
        console.log(`      file_path: ${img.file_path}`);
        console.log(`      생성일: ${img.created_at}`);
        console.log(`      상태: ${isLatest && isInStorage ? '✅ 유지' : isInStorage ? '⚠️ 중복' : '❌ 고스트'}\n`);
        
        if (isLatest && isInStorage) {
          validImages.push(img);
        } else if (isInStorage) {
          duplicateImages.push(img);
        } else {
          ghostImages.push(img);
        }
      });
    });

    // 7. 요약
    console.log('\n📊 요약:\n');
    console.log(`   Storage 실제 파일: ${originalFiles.length}개`);
    console.log(`   DB 메타데이터: ${dbImages.length}개`);
    console.log(`   ✅ 유효한 이미지: ${validImages.length}개`);
    console.log(`   ⚠️  중복 이미지: ${duplicateImages.length}개`);
    console.log(`   ❌ 고스트 이미지: ${ghostImages.length}개\n`);

    // 8. 중복 확인
    if (duplicateImages.length > 0) {
      console.log('⚠️  중복 이미지 상세:\n');
      duplicateImages.forEach((img, idx) => {
        console.log(`   ${idx + 1}. ID: ${img.id}`);
        console.log(`      filename: ${img.filename}`);
        console.log(`      file_path: ${img.file_path}\n`);
      });
    }

    // 9. 고스트 이미지 확인
    if (ghostImages.length > 0) {
      console.log('❌ 고스트 이미지 상세:\n');
      ghostImages.forEach((img, idx) => {
        console.log(`   ${idx + 1}. ID: ${img.id}`);
        console.log(`      filename: ${img.filename}`);
        console.log(`      file_path: ${img.file_path}\n`);
      });
    }

    // 10. 고객관리 vs 갤러리 비교
    console.log('\n🔍 고객관리 vs 갤러리 비교:\n');
    console.log(`   갤러리 표시 (Storage 실제 파일): ${originalFiles.length}개`);
    console.log(`   고객관리 표시 (DB 메타데이터): ${dbImages.length}개`);
    console.log(`   차이: ${Math.abs(originalFiles.length - dbImages.length)}개\n`);

    if (originalFiles.length === dbImages.length) {
      console.log('   ⚠️  개수는 같지만 중복이 있을 수 있습니다.');
      console.log('   filename별로 확인해보면 중복이 발견될 수 있습니다.\n');
    } else {
      console.log(`   ⚠️  개수가 다릅니다. 고스트 이미지 또는 중복 때문입니다.\n`);
    }

  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

checkParksungwooDetails().catch(console.error);
