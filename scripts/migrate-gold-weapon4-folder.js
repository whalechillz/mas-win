/**
 * gold-weapon4 → secret-weapon-gold-4-1 폴더 마이그레이션 스크립트
 * Supabase Storage 폴더명 변경 및 데이터베이스 경로 업데이트
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

const OLD_FOLDER = 'gold-weapon4';
const NEW_FOLDER = 'secret-weapon-gold-4-1';
const BASE_PATH = 'originals/products';

/**
 * 폴더의 파일 목록 가져오기 (하위 폴더 포함)
 */
async function listAllFilesRecursive(folderPath) {
  const allFiles = [];
  
  // 하위 폴더 목록
  const subfolders = ['detail', 'composition', 'gallery'];
  
  // 각 하위 폴더의 파일 가져오기
  for (const subfolder of subfolders) {
    const subfolderPath = `${folderPath}/${subfolder}`;
    
    const { data, error } = await supabase.storage
      .from('blog-images')
      .list(subfolderPath, {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (error) {
      // 폴더가 없으면 스킵
      if (error.message.includes('not found') || error.statusCode === 404) {
        continue;
      }
      console.error(`❌ 폴더 목록 조회 오류 (${subfolderPath}):`, error.message);
      continue;
    }

    if (!data || data.length === 0) continue;

    // 파일만 필터링 (metadata.size가 있는 것만)
    const files = data.filter(item => item.metadata && item.metadata.size !== undefined);
    
    for (const file of files) {
      allFiles.push({
        path: `${subfolderPath}/${file.name}`,
        name: file.name,
        size: file.metadata?.size,
      });
    }
  }
  
  // 루트 폴더의 파일도 확인
  const { data: rootData, error: rootError } = await supabase.storage
    .from('blog-images')
    .list(folderPath, {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' },
    });

  if (!rootError && rootData) {
    const rootFiles = rootData.filter(item => item.metadata && item.metadata.size !== undefined);
    for (const file of rootFiles) {
      allFiles.push({
        path: `${folderPath}/${file.name}`,
        name: file.name,
        size: file.metadata?.size,
      });
    }
  }

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

    // Content-Type 추론
    const ext = path.extname(oldPath).toLowerCase();
    const contentTypeMap = {
      '.webp': 'image/webp',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
    };
    const contentType = contentTypeMap[ext] || 'image/webp';

    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(newPath, buffer, {
        contentType,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      // 이미 존재하는 경우 스킵
      if (uploadError.message.includes('already exists') || uploadError.message.includes('duplicate')) {
        console.log(`    ⚠️ 이미 존재함: ${newPath}`);
        return { success: true, skipped: true };
      }
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
 * 폴더 마이그레이션
 */
async function migrateFolder() {
  console.log(`\n📁 폴더 마이그레이션: ${OLD_FOLDER} → ${NEW_FOLDER}`);

  const oldBasePath = `${BASE_PATH}/${OLD_FOLDER}`;
  const newBasePath = `${BASE_PATH}/${NEW_FOLDER}`;

  // 모든 파일 재귀적으로 가져오기
  console.log(`  📂 ${oldBasePath} 폴더의 모든 파일 검색 중...`);
  const allFiles = await listAllFilesRecursive(oldBasePath);

  if (allFiles.length === 0) {
    console.log(`    ℹ️ 파일이 없습니다.`);
    return { moved: 0, errors: 0 };
  }

  console.log(`    📄 총 ${allFiles.length}개 파일 발견\n`);

  let totalMoved = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  // 각 파일 이동
  for (const file of allFiles) {
    const oldPath = file.path;
    const newPath = oldPath.replace(`${BASE_PATH}/${OLD_FOLDER}`, `${BASE_PATH}/${NEW_FOLDER}`);

    const result = await moveFile(oldPath, newPath);

    if (result.success) {
      if (result.skipped) {
        totalSkipped++;
        process.stdout.write(`    ⚠️ ${file.name} (이미 존재)\n`);
      } else {
        totalMoved++;
        process.stdout.write(`    ✅ ${file.name}\n`);
      }
    } else {
      totalErrors++;
      console.error(`    ❌ ${file.name}:`, result.error?.message);
    }
  }

  console.log(`\n  ✅ 완료: ${totalMoved}개 이동, ${totalSkipped}개 스킵, ${totalErrors}개 오류`);

  return { moved: totalMoved, skipped: totalSkipped, errors: totalErrors };
}

/**
 * 데이터베이스 이미지 경로 업데이트
 */
async function updateDatabasePaths() {
  console.log('\n🗄️ 데이터베이스 이미지 경로 업데이트 중...');

  // products 테이블 업데이트
  const { data: products, error: fetchError } = await supabase
    .from('products')
    .select('id, slug, detail_images, gallery_images, composition_images')
    .or(`slug.eq.${OLD_FOLDER},slug.eq.${NEW_FOLDER},slug.eq.secret-weapon-4-1`);

  if (fetchError) {
    console.error('❌ 제품 목록 조회 오류:', fetchError);
    return { updated: 0 };
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
        // gold-weapon4 경로를 secret-weapon-gold-4-1로 변경
        if (updated.includes(`originals/products/${OLD_FOLDER}/`)) {
          updated = updated.replace(
            `originals/products/${OLD_FOLDER}/`,
            `originals/products/${NEW_FOLDER}/`
          );
          needsUpdate = true;
        }
        // /main/products/gold-weapon4/ 경로도 변경
        if (updated.includes(`/main/products/${OLD_FOLDER}/`)) {
          updated = updated.replace(
            `/main/products/${OLD_FOLDER}/`,
            `originals/products/${NEW_FOLDER}/detail/`
          );
          needsUpdate = true;
        }
        return updated;
      });

      if (needsUpdate) {
        updates[field] = updatedImages;
      }
    }

    // slug도 업데이트
    if (product.slug === OLD_FOLDER || product.slug === 'secret-weapon-4-1') {
      updates.slug = NEW_FOLDER;
      needsUpdate = true;
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
        console.log(`  ✅ ${product.slug || product.id}: 이미지 경로 및 slug 업데이트 완료`);
      }
    }
  }

  // product_composition 테이블도 업데이트
  const { data: compositions, error: compError } = await supabase
    .from('product_composition')
    .select('id, slug, name')
    .or(`slug.eq.${OLD_FOLDER},slug.eq.${NEW_FOLDER},slug.eq.secret-weapon-4-1`);

  if (!compError && compositions) {
    for (const comp of compositions) {
      if (comp.slug === OLD_FOLDER || comp.slug === 'secret-weapon-4-1') {
        const { error } = await supabase
          .from('product_composition')
          .update({
            slug: NEW_FOLDER,
            updated_at: new Date().toISOString(),
          })
          .eq('id', comp.id);

        if (error) {
          console.error(`  ❌ product_composition 업데이트 오류 (${comp.slug}):`, error);
        } else {
          console.log(`  ✅ product_composition: ${comp.slug} → ${NEW_FOLDER}`);
        }
      }
    }
  }

  console.log(`  ✅ 총 ${updatedCount}개 제품의 이미지 경로 업데이트 완료`);
  return { updated: updatedCount };
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🚀 gold-weapon4 → secret-weapon-gold-4-1 마이그레이션 시작\n');

  try {
    // 1. Supabase Storage 폴더 마이그레이션
    console.log('📦 Step 1: Supabase Storage 폴더 마이그레이션');
    const folderResult = await migrateFolder();

    // 2. 데이터베이스 경로 업데이트
    console.log('\n📦 Step 2: 데이터베이스 경로 업데이트');
    const dbResult = await updateDatabasePaths();

    // 결과 저장
    const result = {
      folder: folderResult,
      database: dbResult,
      timestamp: new Date().toISOString(),
    };

    const resultPath = path.join(__dirname, 'migrate-gold-weapon4-result.json');
    fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));

    console.log('\n✅ 마이그레이션 완료!');
    console.log(`📄 결과 파일: ${resultPath}`);
    console.log('\n📊 요약:');
    console.log(`  - 이동된 파일: ${folderResult.moved}개`);
    console.log(`  - 스킵된 파일: ${folderResult.skipped}개`);
    console.log(`  - 오류: ${folderResult.errors}개`);
    console.log(`  - 데이터베이스 업데이트: ${dbResult.updated}개`);
  } catch (error) {
    console.error('\n❌ 마이그레이션 실패:', error);
    process.exit(1);
  }
}

// 실행
main().catch(console.error);
