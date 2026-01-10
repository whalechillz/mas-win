/**
 * 제품 slug 마이그레이션 스크립트
 * 
 * 1. Supabase Storage 폴더명 변경
 * 2. 데이터베이스 slug 업데이트
 * 3. 이미지 경로 업데이트
 */

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

// 폴더명 매핑
const folderMappings = {
  'black-beryl': 'secret-weapon-black-muziik',
  'black-weapon': 'secret-weapon-black',
  'gold-weapon4': 'secret-weapon-gold-4-1',
  'gold2': 'secret-force-gold-2',
  'gold2-sapphire': 'secret-force-gold-2-muziik',
  'pro3-muziik': 'secret-force-pro-3-muziik',
  'pro3': 'secret-force-pro-3',
  'v3': 'secret-force-v3',
};

// 역매핑 (새 slug → 기존 slug)
const reverseMappings = Object.fromEntries(
  Object.entries(folderMappings).map(([old, new_]) => [new_, old])
);

/**
 * Supabase Storage에서 폴더의 모든 파일 목록 가져오기
 */
async function listAllFiles(folderPath) {
  const allFiles = [];
  let hasMore = true;
  let offset = 0;
  const limit = 1000;

  while (hasMore) {
    const { data, error } = await supabase.storage
      .from('blog-images')
      .list(folderPath, {
        limit,
        offset,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (error) {
      console.error(`❌ 폴더 목록 조회 오류 (${folderPath}):`, error);
      break;
    }

    if (!data || data.length === 0) {
      hasMore = false;
      break;
    }

    // 파일만 필터링 (폴더 제외)
    const files = data.filter(item => !item.id); // 폴더는 id가 있음
    allFiles.push(...files);

    if (data.length < limit) {
      hasMore = false;
    } else {
      offset += limit;
    }
  }

  return allFiles;
}

/**
 * 재귀적으로 폴더의 모든 파일 가져오기
 */
async function listAllFilesRecursive(folderPath) {
  const allFiles = [];
  
  async function traverse(currentPath) {
    const { data, error } = await supabase.storage
      .from('blog-images')
      .list(currentPath, {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (error) {
      console.error(`❌ 폴더 목록 조회 오류 (${currentPath}):`, error);
      return;
    }

    if (!data || data.length === 0) return;

    for (const item of data) {
      const itemPath = currentPath ? `${currentPath}/${item.name}` : item.name;
      
      if (item.id) {
        // 폴더인 경우 재귀 탐색
        await traverse(itemPath);
      } else {
        // 파일인 경우
        allFiles.push({
          path: itemPath,
          name: item.name,
          size: item.metadata?.size,
        });
      }
    }
  }

  await traverse(folderPath);
  return allFiles;
}

/**
 * 파일 이동 (복사 후 삭제)
 */
async function moveFile(oldPath, newPath) {
  try {
    // 1. 파일 다운로드
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('blog-images')
      .download(oldPath);

    if (downloadError) {
      console.error(`❌ 파일 다운로드 오류 (${oldPath}):`, downloadError);
      return { success: false, error: downloadError };
    }

    // 2. 새 경로에 업로드
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(newPath, buffer, {
        contentType: fileData.type || 'image/webp',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error(`❌ 파일 업로드 오류 (${newPath}):`, uploadError);
      return { success: false, error: uploadError };
    }

    // 3. 기존 파일 삭제
    const { error: deleteError } = await supabase.storage
      .from('blog-images')
      .remove([oldPath]);

    if (deleteError) {
      console.warn(`⚠️ 기존 파일 삭제 오류 (${oldPath}):`, deleteError);
      // 삭제 실패해도 업로드는 성공했으므로 계속 진행
    }

    return { success: true };
  } catch (error) {
    console.error(`❌ 파일 이동 오류 (${oldPath} → ${newPath}):`, error);
    return { success: false, error };
  }
}

/**
 * 제품 폴더 마이그레이션
 */
async function migrateProductFolder(oldFolderName, newFolderName) {
  console.log(`\n📁 폴더 마이그레이션: ${oldFolderName} → ${newFolderName}`);

  const basePath = `originals/products/${oldFolderName}`;
  const newBasePath = `originals/products/${newFolderName}`;

  // 하위 폴더 목록 (detail, composition, gallery)
  const subfolders = ['detail', 'composition', 'gallery'];

  let totalMoved = 0;
  let totalErrors = 0;

  for (const subfolder of subfolders) {
    const oldPath = `${basePath}/${subfolder}`;
    const newPath = `${newBasePath}/${subfolder}`;

    console.log(`  📂 ${subfolder} 폴더 처리 중...`);

    // 파일 목록 가져오기
    const files = await listAllFiles(oldPath);

    if (files.length === 0) {
      console.log(`    ℹ️ 파일이 없습니다.`);
      continue;
    }

    console.log(`    📄 ${files.length}개 파일 발견`);

    // 각 파일 이동
    for (const file of files) {
      const oldFilePath = `${oldPath}/${file.name}`;
      const newFilePath = `${newPath}/${file.name}`;

      const result = await moveFile(oldFilePath, newFilePath);

      if (result.success) {
        totalMoved++;
        process.stdout.write(`    ✅ ${file.name}\n`);
      } else {
        totalErrors++;
        console.error(`    ❌ ${file.name}:`, result.error?.message);
      }
    }
  }

  // 루트 폴더의 파일도 확인 (있는 경우)
  const rootFiles = await listAllFiles(basePath);
  if (rootFiles.length > 0) {
    console.log(`  📂 루트 폴더 파일 처리 중... (${rootFiles.length}개)`);
    for (const file of rootFiles) {
      const oldFilePath = `${basePath}/${file.name}`;
      const newFilePath = `${newBasePath}/${file.name}`;

      const result = await moveFile(oldFilePath, newFilePath);
      if (result.success) {
        totalMoved++;
      } else {
        totalErrors++;
      }
    }
  }

  console.log(`  ✅ 완료: ${totalMoved}개 이동, ${totalErrors}개 오류`);

  return { moved: totalMoved, errors: totalErrors };
}

/**
 * 데이터베이스 slug 업데이트
 */
async function updateDatabaseSlugs() {
  console.log('\n🗄️ 데이터베이스 slug 업데이트 중...');

  // products 테이블 업데이트
  for (const [oldSlug, newSlug] of Object.entries(folderMappings)) {
    const { data, error } = await supabase
      .from('products')
      .update({ slug: newSlug, updated_at: new Date().toISOString() })
      .eq('slug', oldSlug)
      .select();

    if (error) {
      console.error(`  ❌ products 테이블 업데이트 오류 (${oldSlug}):`, error);
    } else if (data && data.length > 0) {
      console.log(`  ✅ products: ${oldSlug} → ${newSlug} (${data.length}개)`);
    }
  }

  // product_composition 테이블 업데이트
  for (const [oldSlug, newSlug] of Object.entries(folderMappings)) {
    const { data, error } = await supabase
      .from('product_composition')
      .update({ slug: newSlug, updated_at: new Date().toISOString() })
      .eq('slug', oldSlug)
      .select();

    if (error) {
      console.error(`  ❌ product_composition 테이블 업데이트 오류 (${oldSlug}):`, error);
    } else if (data && data.length > 0) {
      console.log(`  ✅ product_composition: ${oldSlug} → ${newSlug} (${data.length}개)`);
    }
  }
}

/**
 * 이미지 경로 업데이트 (JSONB 배열)
 */
async function updateImagePaths() {
  console.log('\n🖼️ 이미지 경로 업데이트 중...');

  // products 테이블의 detail_images, gallery_images, composition_images 업데이트
  const { data: products, error: fetchError } = await supabase
    .from('products')
    .select('id, slug, detail_images, gallery_images, composition_images');

  if (fetchError) {
    console.error('❌ 제품 목록 조회 오류:', fetchError);
    return;
  }

  let updatedCount = 0;

  for (const product of products || []) {
    let needsUpdate = false;
    const updates = {};

    // 각 이미지 배열 업데이트
    for (const field of ['detail_images', 'gallery_images', 'composition_images']) {
      const images = product[field];
      if (!Array.isArray(images) || images.length === 0) continue;

      const updatedImages = images.map(img => {
        if (typeof img !== 'string') return img;

        let updated = img;
        for (const [oldSlug, newSlug] of Object.entries(folderMappings)) {
          const oldPath = `originals/products/${oldSlug}/`;
          const newPath = `originals/products/${newSlug}/`;
          
          if (updated.includes(oldPath)) {
            updated = updated.replace(oldPath, newPath);
            needsUpdate = true;
          }
        }
        return updated;
      });

      if (needsUpdate) {
        updates[field] = updatedImages;
      }
    }

    if (needsUpdate) {
      const { error } = await supabase
        .from('products')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', product.id);

      if (error) {
        console.error(`  ❌ 제품 업데이트 오류 (${product.slug}):`, error);
      } else {
        updatedCount++;
        console.log(`  ✅ ${product.slug}: 이미지 경로 업데이트 완료`);
      }
    }
  }

  console.log(`  ✅ 총 ${updatedCount}개 제품의 이미지 경로 업데이트 완료`);
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🚀 제품 slug 마이그레이션 시작\n');

  const results = {
    folders: {},
    database: { success: false },
    images: { success: false },
  };

  // 1. Supabase Storage 폴더 마이그레이션
  console.log('📦 Step 1: Supabase Storage 폴더 마이그레이션');
  for (const [oldFolder, newFolder] of Object.entries(folderMappings)) {
    const result = await migrateProductFolder(oldFolder, newFolder);
    results.folders[oldFolder] = result;
  }

  // 2. 데이터베이스 slug 업데이트
  console.log('\n📦 Step 2: 데이터베이스 slug 업데이트');
  await updateDatabaseSlugs();
  results.database.success = true;

  // 3. 이미지 경로 업데이트
  console.log('\n📦 Step 3: 이미지 경로 업데이트');
  await updateImagePaths();
  results.images.success = true;

  // 결과 저장
  const resultPath = path.join(__dirname, 'migrate-product-slugs-result.json');
  fs.writeFileSync(resultPath, JSON.stringify(results, null, 2));

  console.log('\n✅ 마이그레이션 완료!');
  console.log(`📄 결과 파일: ${resultPath}`);

  // 요약
  console.log('\n📊 요약:');
  const totalMoved = Object.values(results.folders).reduce((sum, r) => sum + r.moved, 0);
  const totalErrors = Object.values(results.folders).reduce((sum, r) => sum + r.errors, 0);
  console.log(`  - 이동된 파일: ${totalMoved}개`);
  console.log(`  - 오류: ${totalErrors}개`);
  console.log(`  - 데이터베이스 업데이트: ${results.database.success ? '✅' : '❌'}`);
  console.log(`  - 이미지 경로 업데이트: ${results.images.success ? '✅' : '❌'}`);
}

// 실행
main().catch(console.error);
