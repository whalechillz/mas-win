/**
 * hat-* 폴더 정리 스크립트
 * 1. hat-black-bucket/gallery/ → bucket-hat-muziik/gallery/ 이동
 * 2. hat-white-bucket/gallery/ → bucket-hat-muziik/gallery/ 이동
 * 3. hat-white-golf/ 폴더 삭제
 * 4. product_composition 테이블 업데이트
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const STORAGE_BUCKET = 'blog-images';

const results = {
  hatBlackBucket: { moved: [], errors: [] },
  hatWhiteBucket: { moved: [], errors: [] },
  hatWhiteGolf: { deleted: [], errors: [] },
  dbUpdated: { updated: [], errors: [] }
};

/**
 * 파일 이동 (복사 후 원본 삭제)
 */
async function moveFile(fromPath, toPath) {
  try {
    // 1. 파일 다운로드
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(fromPath);

    if (downloadError) {
      throw new Error(`다운로드 실패: ${downloadError.message}`);
    }

    // 2. 새 위치에 업로드
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(toPath, fileData, {
        contentType: 'image/webp',
        upsert: true // 중복 시 덮어쓰기
      });

    if (uploadError) {
      throw new Error(`업로드 실패: ${uploadError.message}`);
    }

    // 3. 원본 삭제
    const { error: deleteError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([fromPath]);

    if (deleteError) {
      console.warn(`⚠️ 원본 삭제 실패 (이미 이동됨): ${fromPath} - ${deleteError.message}`);
    }

    return { success: true, fromPath, toPath };
  } catch (error) {
    return { success: false, fromPath, toPath, error: error.message };
  }
}

/**
 * 폴더 내 모든 파일 목록 조회
 */
async function listFiles(folderPath) {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(folderPath, {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      throw error;
    }

    return data ? data.filter(file => !file.name.endsWith('/')) : [];
  } catch (error) {
    console.error(`❌ 폴더 목록 조회 실패: ${folderPath}`, error.message);
    return [];
  }
}

/**
 * 폴더 삭제 (모든 파일 삭제)
 */
async function deleteFolder(folderPath) {
  try {
    const files = await listFiles(folderPath);
    
    if (files.length === 0) {
      console.log(`   ℹ️ 폴더가 비어있음: ${folderPath}`);
      return { success: true, deleted: [] };
    }

    const filePaths = files.map(file => `${folderPath}/${file.name}`);
    
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove(filePaths);

    if (error) {
      throw error;
    }

    return { success: true, deleted: filePaths };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * hat-black-bucket 폴더 이미지 이동
 */
async function moveHatBlackBucketImages() {
  console.log('\n1️⃣ hat-black-bucket 폴더 이미지 이동 시작...\n');
  
  const sourceFolder = 'originals/goods/hat-black-bucket/gallery';
  const targetFolder = 'originals/goods/bucket-hat-muziik/gallery';

  // 소스 폴더의 파일 목록 조회
  const files = await listFiles(sourceFolder);

  if (files.length === 0) {
    console.log('   ℹ️ 이동할 이미지가 없습니다.');
    return;
  }

  console.log(`   📋 발견된 이미지: ${files.length}개`);

  // 대상 폴더의 기존 파일 확인 (중복 체크)
  const existingFiles = await listFiles(targetFolder);
  const existingFileNames = new Set(existingFiles.map(f => f.name));
  console.log(`   📋 대상 폴더 기존 이미지: ${existingFiles.length}개`);

  for (const file of files) {
    const fromPath = `${sourceFolder}/${file.name}`;
    const toPath = `${targetFolder}/${file.name}`;

    // 중복 체크
    if (existingFileNames.has(file.name)) {
      console.log(`   ⚠️ 중복 파일 발견, 원본만 삭제: ${file.name}`);
      // 원본만 삭제 (대상 폴더에 이미 있음)
      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([fromPath]);
      
      if (error) {
        results.hatBlackBucket.errors.push({
          file: file.name,
          error: `원본 삭제 실패: ${error.message}`
        });
      } else {
        results.hatBlackBucket.moved.push({
          fileName: file.name,
          action: 'deleted_duplicate',
          from: fromPath,
          to: toPath
        });
      }
      continue;
    }

    // 파일 이동
    console.log(`   📦 이동 중: ${file.name}`);
    const result = await moveFile(fromPath, toPath);

    if (result.success) {
      results.hatBlackBucket.moved.push({
        fileName: file.name,
        from: fromPath,
        to: toPath
      });
      console.log(`   ✅ 이동 완료: ${file.name}`);
    } else {
      results.hatBlackBucket.errors.push({
        file: file.name,
        error: result.error
      });
      console.error(`   ❌ 이동 실패: ${file.name} - ${result.error}`);
    }
  }

  console.log(`\n   ✅ hat-black-bucket 이동 완료: ${results.hatBlackBucket.moved.length}개`);
  if (results.hatBlackBucket.errors.length > 0) {
    console.log(`   ⚠️ 오류: ${results.hatBlackBucket.errors.length}개`);
  }
}

/**
 * hat-white-bucket 폴더 이미지 이동
 */
async function moveHatWhiteBucketImages() {
  console.log('\n2️⃣ hat-white-bucket 폴더 이미지 이동 시작...\n');
  
  const sourceFolder = 'originals/goods/hat-white-bucket/gallery';
  const targetFolder = 'originals/goods/bucket-hat-muziik/gallery';

  // 소스 폴더의 파일 목록 조회
  const files = await listFiles(sourceFolder);

  if (files.length === 0) {
    console.log('   ℹ️ 이동할 이미지가 없습니다.');
    return;
  }

  console.log(`   📋 발견된 이미지: ${files.length}개`);

  // 대상 폴더의 기존 파일 확인 (중복 체크)
  const existingFiles = await listFiles(targetFolder);
  const existingFileNames = new Set(existingFiles.map(f => f.name));
  console.log(`   📋 대상 폴더 기존 이미지: ${existingFiles.length}개`);

  for (const file of files) {
    const fromPath = `${sourceFolder}/${file.name}`;
    const toPath = `${targetFolder}/${file.name}`;

    // 중복 체크
    if (existingFileNames.has(file.name)) {
      console.log(`   ⚠️ 중복 파일 발견, 원본만 삭제: ${file.name}`);
      // 원본만 삭제 (대상 폴더에 이미 있음)
      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([fromPath]);
      
      if (error) {
        results.hatWhiteBucket.errors.push({
          file: file.name,
          error: `원본 삭제 실패: ${error.message}`
        });
      } else {
        results.hatWhiteBucket.moved.push({
          fileName: file.name,
          action: 'deleted_duplicate',
          from: fromPath,
          to: toPath
        });
      }
      continue;
    }

    // 파일 이동
    console.log(`   📦 이동 중: ${file.name}`);
    const result = await moveFile(fromPath, toPath);

    if (result.success) {
      results.hatWhiteBucket.moved.push({
        fileName: file.name,
        from: fromPath,
        to: toPath
      });
      console.log(`   ✅ 이동 완료: ${file.name}`);
    } else {
      results.hatWhiteBucket.errors.push({
        file: file.name,
        error: result.error
      });
      console.error(`   ❌ 이동 실패: ${file.name} - ${result.error}`);
    }
  }

  console.log(`\n   ✅ hat-white-bucket 이동 완료: ${results.hatWhiteBucket.moved.length}개`);
  if (results.hatWhiteBucket.errors.length > 0) {
    console.log(`   ⚠️ 오류: ${results.hatWhiteBucket.errors.length}개`);
  }
}

/**
 * hat-white-golf 폴더 삭제
 */
async function deleteHatWhiteGolfFolder() {
  console.log('\n3️⃣ hat-white-golf 폴더 삭제 시작...\n');
  
  const folderPath = 'originals/goods/hat-white-golf';

  // 하위 폴더 확인
  const { data: folders, error: listError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .list(folderPath, {
      limit: 1000
    });

  if (listError) {
    console.log(`   ℹ️ 폴더가 존재하지 않거나 접근 불가: ${listError.message}`);
    return;
  }

  if (!folders || folders.length === 0) {
    console.log('   ℹ️ 폴더가 비어있습니다.');
    return;
  }

  // 모든 하위 폴더와 파일 삭제
  for (const item of folders) {
    const itemPath = `${folderPath}/${item.name}`;
    
    if (item.id === null) {
      // 폴더인 경우 재귀적으로 삭제
      const subFiles = await listFiles(itemPath);
      if (subFiles.length > 0) {
        const filePaths = subFiles.map(f => `${itemPath}/${f.name}`);
        const { error } = await supabase.storage
          .from(STORAGE_BUCKET)
          .remove(filePaths);
        
        if (error) {
          results.hatWhiteGolf.errors.push({
            path: itemPath,
            error: error.message
          });
          console.error(`   ❌ 삭제 실패: ${itemPath} - ${error.message}`);
        } else {
          results.hatWhiteGolf.deleted.push(...filePaths);
          console.log(`   ✅ 삭제 완료: ${itemPath} (${subFiles.length}개 파일)`);
        }
      }
    } else {
      // 파일인 경우
      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([itemPath]);
      
      if (error) {
        results.hatWhiteGolf.errors.push({
          path: itemPath,
          error: error.message
        });
        console.error(`   ❌ 삭제 실패: ${itemPath} - ${error.message}`);
      } else {
        results.hatWhiteGolf.deleted.push(itemPath);
        console.log(`   ✅ 삭제 완료: ${itemPath}`);
      }
    }
  }

  console.log(`\n   ✅ hat-white-golf 삭제 완료: ${results.hatWhiteGolf.deleted.length}개`);
  if (results.hatWhiteGolf.errors.length > 0) {
    console.log(`   ⚠️ 오류: ${results.hatWhiteGolf.errors.length}개`);
  }
}

/**
 * product_composition 테이블 업데이트
 */
async function updateProductComposition() {
  console.log('\n4️⃣ product_composition 테이블 업데이트 시작...\n');

  try {
    // hat-* slug를 사용하는 제품 비활성화
    const { data, error } = await supabase
      .from('product_composition')
      .update({ is_active: false })
      .in('slug', ['hat-black-bucket', 'hat-white-bucket', 'hat-white-golf'])
      .select();

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      results.dbUpdated.updated = data.map(item => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        action: 'deactivated'
      }));
      console.log(`   ✅ ${data.length}개 제품 비활성화 완료:`);
      data.forEach(item => {
        console.log(`      - ${item.name} (${item.slug})`);
      });
    } else {
      console.log('   ℹ️ 업데이트할 제품이 없습니다.');
    }
  } catch (error) {
    results.dbUpdated.errors.push({
      error: error.message
    });
    console.error(`   ❌ DB 업데이트 실패: ${error.message}`);
  }
}

/**
 * 빈 폴더 삭제 (hat-black-bucket, hat-white-bucket)
 */
async function deleteEmptyFolders() {
  console.log('\n5️⃣ 빈 폴더 삭제 시작...\n');

  const foldersToDelete = [
    'originals/goods/hat-black-bucket',
    'originals/goods/hat-white-bucket'
  ];

  for (const folderPath of foldersToDelete) {
    try {
      // 폴더 내 파일 확인
      const files = await listFiles(folderPath);
      
      if (files.length > 0) {
        console.log(`   ⚠️ 폴더에 파일이 남아있음: ${folderPath} (${files.length}개)`);
        // 하위 폴더도 확인
        const { data: subFolders } = await supabase.storage
          .from(STORAGE_BUCKET)
          .list(folderPath, { limit: 100 });
        
        if (subFolders && subFolders.length > 0) {
          // 하위 폴더의 파일도 확인
          let hasFiles = false;
          for (const subFolder of subFolders) {
            if (subFolder.id === null) {
              const subFiles = await listFiles(`${folderPath}/${subFolder.name}`);
              if (subFiles.length > 0) {
                hasFiles = true;
                break;
              }
            }
          }
          
          if (!hasFiles) {
            console.log(`   ℹ️ 폴더가 비어있음: ${folderPath}`);
          }
        }
      } else {
        console.log(`   ✅ 폴더가 비어있음: ${folderPath}`);
      }
    } catch (error) {
      console.log(`   ℹ️ 폴더 확인 실패 (이미 삭제되었을 수 있음): ${folderPath}`);
    }
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🚀 hat-* 폴더 정리 시작...\n');
  console.log('='.repeat(60));

  try {
    // 1. hat-black-bucket 이미지 이동
    await moveHatBlackBucketImages();

    // 2. hat-white-bucket 이미지 이동
    await moveHatWhiteBucketImages();

    // 3. hat-white-golf 폴더 삭제
    await deleteHatWhiteGolfFolder();

    // 4. product_composition 테이블 업데이트
    await updateProductComposition();

    // 5. 빈 폴더 확인
    await deleteEmptyFolders();

    // 결과 저장
    const resultPath = path.join(__dirname, 'consolidate-hat-folders-result.json');
    fs.writeFileSync(resultPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 결과 저장: ${resultPath}`);

    // 최종 요약
    console.log('\n' + '='.repeat(60));
    console.log('✅ 폴더 정리 완료!\n');
    console.log('📊 작업 요약:');
    console.log(`   - hat-black-bucket 이동: ${results.hatBlackBucket.moved.length}개`);
    console.log(`   - hat-white-bucket 이동: ${results.hatWhiteBucket.moved.length}개`);
    console.log(`   - hat-white-golf 삭제: ${results.hatWhiteGolf.deleted.length}개`);
    console.log(`   - DB 업데이트: ${results.dbUpdated.updated.length}개`);
    
    const totalErrors = 
      results.hatBlackBucket.errors.length +
      results.hatWhiteBucket.errors.length +
      results.hatWhiteGolf.errors.length +
      results.dbUpdated.errors.length;
    
    if (totalErrors > 0) {
      console.log(`\n⚠️ 오류 발생: ${totalErrors}개`);
    } else {
      console.log('\n✨ 모든 작업이 성공적으로 완료되었습니다!');
    }

  } catch (error) {
    console.error('\n❌ 치명적 오류:', error);
    process.exit(1);
  }
}

// 실행
main();

