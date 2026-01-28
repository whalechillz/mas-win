/**
 * 이남구 고객 고스트 이미지 삭제 및 실제 파일과 동기화
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
      // 파일인 경우
      allFiles.push({
        path: fullPath,
        name: item.name,
        size: item.metadata?.size || 0
      });
    } else {
      // 폴더인 경우 재귀적으로 탐색
      await getAllFilesFromStorage(fullPath, allFiles);
    }
  }

  return allFiles;
}

async function deleteLeenamguGhostImages() {
  console.log('🔍 이남구 고객 고스트 이미지 삭제 및 동기화...\n');

  const DRY_RUN = !process.argv.includes('--execute');

  if (DRY_RUN) {
    console.log('🔍 DRY RUN 모드: 실제 삭제 없이 시뮬레이션만 수행합니다.\n');
    console.log('   실제 삭제를 실행하려면: node scripts/delete-leenamgu-ghost-images.js --execute\n');
  } else {
    console.log('🚀 실제 삭제를 시작합니다...\n');
  }

  try {
    // 1. Storage 실제 파일 확인
    console.log('📦 Storage 실제 파일 확인 중...\n');
    const storageFiles = await getAllFilesFromStorage('originals/customers/leenamgu-8768');
    
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

    // 2. DB 이미지 조회
    const { data: dbImages, error: dbError } = await supabase
      .from('image_assets')
      .select('id, filename, file_path, cdn_url, ai_tags')
      .ilike('file_path', 'originals/customers/leenamgu-8768/%')
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('❌ DB 조회 실패:', dbError);
      return;
    }

    console.log(`📊 DB 이미지: ${dbImages.length}개\n`);

    // 3. 고스트 이미지 찾기
    // Storage 파일명을 키로 하는 맵 생성 (파일명만, 경로 무시)
    const storageFileNames = new Set(originalFiles.map(f => f.name.toLowerCase()));

    console.log('📋 Storage 파일명 목록:');
    originalFiles.forEach(f => {
      console.log(`   - ${f.name}`);
    });
    console.log('');

    // DB 이미지와 Storage 파일 매칭
    const validImages = [];
    const ghostImages = [];

    dbImages.forEach(img => {
      const fileName = img.filename || '';
      const filePath = img.file_path || '';
      
      // file_path가 날짜 폴더로만 끝나는 경우
      const isDateFolderOnly = /\/\d{4}-\d{2}-\d{2}$/.test(filePath);
      
      if (isDateFolderOnly && fileName) {
        // filename으로 매칭
        if (storageFileNames.has(fileName.toLowerCase())) {
          validImages.push(img);
        } else {
          ghostImages.push(img);
        }
      } else {
        // file_path에 파일명이 포함된 경우
        const pathFileName = filePath.split('/').pop() || '';
        if (storageFileNames.has(pathFileName.toLowerCase())) {
          validImages.push(img);
        } else {
          ghostImages.push(img);
        }
      }
    });

    console.log(`❌ 고스트 이미지: ${ghostImages.length}개\n`);
    console.log(`✅ 유효한 이미지: ${validImages.length}개\n`);

    // 5. 고스트 이미지 삭제
    if (ghostImages.length > 0) {
      console.log('🗑️  고스트 이미지 삭제 중...\n');
      
      const ghostIds = ghostImages.map(img => img.id);
      
      if (!DRY_RUN) {
        const { error: deleteError } = await supabase
          .from('image_assets')
          .delete()
          .in('id', ghostIds);

        if (deleteError) {
          console.error('❌ 삭제 실패:', deleteError);
        } else {
          console.log(`✅ ${ghostImages.length}개 고스트 이미지 삭제 완료\n`);
        }
      } else {
        console.log(`   (DRY RUN) ${ghostImages.length}개 고스트 이미지 삭제 예정`);
        ghostImages.slice(0, 5).forEach((img, idx) => {
          console.log(`   ${idx + 1}. ID: ${img.id}`);
          console.log(`      file_path: ${img.file_path}`);
          console.log(`      filename: ${img.filename || '없음'}\n`);
        });
        if (ghostImages.length > 5) {
          console.log(`   ... 외 ${ghostImages.length - 5}개\n`);
        }
      }
    }

    // 6. 썸네일/리사이즈 파일 확인 및 삭제
    const thumbnailFiles = storageFiles.filter(f => {
      const name = f.name.toLowerCase();
      return name.includes('_resized_') || 
             name.includes('_thumbnail_') || 
             name.includes('_thumb_') ||
             name.includes('_s_') ||
             name.includes('_m_') ||
             name.includes('_l_');
    });

    if (thumbnailFiles.length > 0) {
      console.log(`🖼️  썸네일/리사이즈 파일: ${thumbnailFiles.length}개\n`);
      
      if (!DRY_RUN) {
        const thumbnailPaths = thumbnailFiles.map(f => f.path);
        const { error: deleteThumbError } = await supabase.storage
          .from('blog-images')
          .remove(thumbnailPaths);

        if (deleteThumbError) {
          console.error('❌ 썸네일 삭제 실패:', deleteThumbError);
        } else {
          console.log(`✅ ${thumbnailFiles.length}개 썸네일/리사이즈 파일 삭제 완료\n`);
        }
      } else {
        console.log(`   (DRY RUN) ${thumbnailFiles.length}개 썸네일/리사이즈 파일 삭제 예정\n`);
      }
    }

    // 7. 최종 결과
    console.log('📊 최종 결과:\n');
    console.log(`   Storage 원본 파일: ${originalFiles.length}개`);
    if (!DRY_RUN) {
      console.log(`   DB 이미지 (삭제 후): ${validImages.length}개`);
      console.log(`   삭제된 고스트 이미지: ${ghostImages.length}개`);
    } else {
      console.log(`   DB 이미지 (현재): ${dbImages.length}개`);
      console.log(`   삭제 예정 고스트 이미지: ${ghostImages.length}개`);
    }

    if (DRY_RUN) {
      console.log('\n💡 실제 삭제를 실행하려면:');
      console.log('   node scripts/delete-leenamgu-ghost-images.js --execute');
    }

  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

deleteLeenamguGhostImages().catch(console.error);
