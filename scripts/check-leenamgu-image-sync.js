/**
 * 이남구 고객 이미지 동기화 확인 및 불필요한 썸네일 삭제
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
    console.error(`❌ ${path} 조회 실패:`, error.message);
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
        size: item.metadata?.size || 0,
        updated_at: item.updated_at
      });
    } else {
      // 폴더인 경우 재귀적으로 탐색
      await getAllFilesFromStorage(fullPath, allFiles);
    }
  }

  return allFiles;
}

async function checkLeenamguImageSync() {
  console.log('🔍 이남구 고객 이미지 동기화 확인 중...\n');

  try {
    // 1. 고객 정보 확인
    const { data: customer } = await supabase
      .from('customers')
      .select('id, name, folder_name')
      .eq('folder_name', 'leenamgu-8768')
      .single();

    if (!customer) {
      console.error('❌ 이남구 고객을 찾을 수 없습니다.');
      return;
    }

    console.log(`✅ 고객: ${customer.name} (ID: ${customer.id}, 폴더: ${customer.folder_name})\n`);

    // 2. Storage에서 실제 파일 확인
    console.log('📦 Storage 실제 파일 확인 중...\n');
    const storageFiles = await getAllFilesFromStorage(`originals/customers/${customer.folder_name}`);
    
    // 썸네일/리사이즈 파일 필터링
    const originalFiles = storageFiles.filter(f => {
      const name = f.name.toLowerCase();
      // 썸네일/리사이즈 파일 패턴 제외
      return !name.includes('_resized_') && 
             !name.includes('_thumbnail_') && 
             !name.includes('_thumb_') &&
             !name.includes('_s_') &&
             !name.includes('_m_') &&
             !name.includes('_l_');
    });

    console.log(`📦 Storage 파일:`);
    console.log(`   전체: ${storageFiles.length}개`);
    console.log(`   원본 (썸네일 제외): ${originalFiles.length}개\n`);

    // 3. DB 메타데이터 확인
    console.log('📊 DB 메타데이터 확인 중...\n');
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

    // 4. 비교 분석
    console.log('🔍 비교 분석:\n');

    // Storage 파일명 목록 (확장자 제외)
    const storageFileNames = new Set(
      originalFiles.map(f => {
        const name = f.name;
        // 확장자 제거
        return name.substring(0, name.lastIndexOf('.')) || name;
      })
    );

    // DB 파일명 목록 (확장자 제외)
    const dbFileNames = new Set(
      dbImages.map(img => {
        const filename = img.filename || img.file_path?.split('/').pop() || '';
        return filename.substring(0, filename.lastIndexOf('.')) || filename;
      })
    );

    // DB에만 있는 이미지 (Storage에 실제 파일 없음)
    const dbOnly = dbImages.filter(img => {
      const filename = img.filename || img.file_path?.split('/').pop() || '';
      const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename;
      return !storageFileNames.has(nameWithoutExt);
    });

    // Storage에만 있는 파일 (DB 메타데이터 없음)
    const storageOnly = originalFiles.filter(f => {
      const nameWithoutExt = f.name.substring(0, f.name.lastIndexOf('.')) || f.name;
      return !dbFileNames.has(nameWithoutExt);
    });

    console.log(`📊 분석 결과:`);
    console.log(`   Storage 원본 파일: ${originalFiles.length}개`);
    console.log(`   DB 메타데이터: ${dbImages.length}개`);
    console.log(`   DB에만 있는 이미지 (Storage 파일 없음): ${dbOnly.length}개`);
    console.log(`   Storage에만 있는 파일 (DB 메타데이터 없음): ${storageOnly.length}개\n`);

    // 5. DB에만 있는 이미지 상세
    if (dbOnly.length > 0) {
      console.log('⚠️  DB에만 있는 이미지 (삭제 권장):\n');
      dbOnly.forEach((img, idx) => {
        if (idx < 10) {
          console.log(`   ${idx + 1}. ${img.filename || img.id}`);
          console.log(`      file_path: ${img.file_path?.substring(0, 80)}...`);
          console.log(`      ID: ${img.id}\n`);
        }
      });
      if (dbOnly.length > 10) {
        console.log(`   ... 외 ${dbOnly.length - 10}개\n`);
      }
    }

    // 6. Storage에만 있는 파일 상세
    if (storageOnly.length > 0) {
      console.log('📦 Storage에만 있는 파일:\n');
      storageOnly.slice(0, 10).forEach((file, idx) => {
        console.log(`   ${idx + 1}. ${file.name}`);
        console.log(`      경로: ${file.path}`);
        console.log(`      크기: ${(file.size / 1024).toFixed(2)} KB\n`);
      });
      if (storageOnly.length > 10) {
        console.log(`   ... 외 ${storageOnly.length - 10}개\n`);
      }
    }

    // 7. 썸네일/리사이즈 파일 확인
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
      console.log(`\n🖼️  썸네일/리사이즈 파일: ${thumbnailFiles.length}개\n`);
      thumbnailFiles.slice(0, 10).forEach((file, idx) => {
        console.log(`   ${idx + 1}. ${file.name}`);
        console.log(`      경로: ${file.path}`);
        console.log(`      크기: ${(file.size / 1024).toFixed(2)} KB\n`);
      });
      if (thumbnailFiles.length > 10) {
        console.log(`   ... 외 ${thumbnailFiles.length - 10}개\n`);
      }
    }

    // 8. 요약 및 권장사항
    console.log('\n💡 요약:\n');
    console.log(`   실제 원본 파일: ${originalFiles.length}개`);
    console.log(`   DB 메타데이터: ${dbImages.length}개`);
    console.log(`   불일치: ${Math.abs(originalFiles.length - dbImages.length)}개\n`);

    if (dbOnly.length > 0) {
      console.log(`   ⚠️  DB에만 있는 이미지 ${dbOnly.length}개를 삭제하면 동기화됩니다.`);
    }

    if (thumbnailFiles.length > 0) {
      console.log(`   🖼️  썸네일/리사이즈 파일 ${thumbnailFiles.length}개가 Storage에 존재합니다.`);
    }

    // 9. 삭제 스크립트 생성 정보
    if (dbOnly.length > 0 || thumbnailFiles.length > 0) {
      console.log('\n📝 삭제 스크립트 실행 방법:');
      console.log('   node scripts/cleanup-leenamgu-unnecessary-images.js --execute');
    }

  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

checkLeenamguImageSync().catch(console.error);
