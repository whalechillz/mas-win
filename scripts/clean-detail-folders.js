/**
 * 모든 드라이버 제품의 detail 폴더 정리
 * 1. _-_-_-_로 시작하는 불필요한 파일 삭제
 * 2. 500/350 관련 파일 삭제 (composition 폴더에 메인 파일이 있으므로)
 * 3. 중복 파일 정리 (깨끗한 파일명만 유지)
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const driverProducts = [
  { folder: 'black-weapon', slug: 'secret-weapon-black', name: '시크리트웨폰 블랙' },
  { folder: 'gold-weapon4', slug: 'secret-weapon-4-1', name: '시크리트웨폰 골드 4.1' },
  { folder: 'gold2', slug: 'secret-force-gold-2', name: '시크리트포스 골드 2' },
  { folder: 'gold2-sapphire', slug: 'gold2-sapphire', name: '시크리트포스 골드 2 MUZIIK' },
  { folder: 'pro3', slug: 'secret-force-pro-3', name: '시크리트포스 PRO 3' },
  { folder: 'v3', slug: 'secret-force-v3', name: '시크리트포스 V3' },
];

async function cleanDetailFolder(product) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧹 ${product.name} (${product.folder}) detail 폴더 정리...`);
  console.log(`${'='.repeat(60)}`);

  const result = {
    product: product.name,
    folder: product.folder,
    deleted: [],
    errors: []
  };

  try {
    // detail 폴더 파일 목록
    const { data: detailFiles, error: detailError } = await supabase.storage
      .from('blog-images')
      .list(`originals/products/${product.folder}/detail`, {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (detailError || !detailFiles) {
      console.error(`   ❌ detail 폴더 조회 오류: ${detailError?.message}`);
      result.errors.push({ step: 'list', error: detailError?.message });
      return result;
    }

    const filesToDelete = [];

    // 1. _-_-_-_로 시작하는 불필요한 파일
    detailFiles.forEach(file => {
      const fileName = file.name;
      if (fileName.startsWith('_-_-_-_') || fileName.startsWith('_-_-_') || fileName.startsWith('_-_')) {
        filesToDelete.push({
          fileName,
          reason: 'malformed_filename',
          path: `originals/products/${product.folder}/detail/${fileName}`
        });
      }
    });

    // 2. 500/350 관련 파일 (composition 폴더에 메인 파일이 있으므로 삭제)
    detailFiles.forEach(file => {
      const fileName = file.name;
      if ((fileName.includes('500') || fileName.includes('350')) && 
          !filesToDelete.find(f => f.fileName === fileName)) {
        filesToDelete.push({
          fileName,
          reason: 'composition_file_in_detail',
          path: `originals/products/${product.folder}/detail/${fileName}`
        });
      }
    });

    // 3. 중복 파일 정리
    const fileMap = new Map();
    detailFiles.forEach(file => {
      const fileName = file.name;
      if (filesToDelete.find(f => f.fileName === fileName)) return; // 이미 삭제 대상
      
      const numberMatch = fileName.match(/(\d{2}(?:[-_]\d{2})?)/);
      if (numberMatch) {
        const number = numberMatch[1];
        if (!fileMap.has(number)) {
          fileMap.set(number, []);
        }
        fileMap.get(number).push(fileName);
      }
    });

    fileMap.forEach((files, number) => {
      if (files.length > 1) {
        // 가장 깨끗한 파일명 찾기
        const cleanFiles = files.filter(f => !f.startsWith('_-'));
        if (cleanFiles.length > 0) {
          const keepFile = cleanFiles[0]; // 가장 짧은 것 또는 첫 번째
          files.forEach(fileName => {
            if (fileName !== keepFile && !filesToDelete.find(f => f.fileName === fileName)) {
              filesToDelete.push({
                fileName,
                reason: 'duplicate',
                path: `originals/products/${product.folder}/detail/${fileName}`
              });
            }
          });
        }
      }
    });

    // 삭제 실행
    if (filesToDelete.length === 0) {
      console.log(`   ✅ 정리할 파일 없음`);
      return result;
    }

    console.log(`   📋 삭제 대상: ${filesToDelete.length}개 파일`);

    for (const file of filesToDelete) {
      console.log(`   🗑️  삭제: ${file.fileName} (${file.reason})`);
      
      const { error: deleteError } = await supabase.storage
        .from('blog-images')
        .remove([file.path]);
      
      if (deleteError) {
        console.error(`      ❌ 삭제 실패: ${deleteError.message}`);
        result.errors.push({ file: file.fileName, error: deleteError.message });
      } else {
        result.deleted.push(file);
        console.log(`      ✅ 삭제 완료`);
      }
    }

    // 데이터베이스 업데이트
    const { data: dbProduct, error: dbError } = await supabase
      .from('products')
      .select('id, detail_images')
      .eq('slug', product.slug)
      .single();

    if (!dbError && dbProduct && Array.isArray(dbProduct.detail_images)) {
      // 삭제된 파일 경로 제거
      const deletedPaths = filesToDelete.map(f => 
        `originals/products/${product.folder}/detail/${f.fileName}`
      );
      const updatedImages = dbProduct.detail_images.filter(img => 
        !deletedPaths.some(deleted => img.includes(deleted.split('/').pop()))
      );

      const { error: updateError } = await supabase
        .from('products')
        .update({ detail_images: updatedImages })
        .eq('id', dbProduct.id);

      if (updateError) {
        console.error(`   ❌ 데이터베이스 업데이트 실패: ${updateError.message}`);
        result.errors.push({ step: 'update_db', error: updateError.message });
      } else {
        console.log(`   💾 데이터베이스 업데이트 완료 (${updatedImages.length}개 이미지 유지)`);
      }
    }

  } catch (error) {
    console.error(`   ❌ 오류: ${error.message}`);
    result.errors.push({ step: 'general', error: error.message });
  }

  return result;
}

async function cleanAllDetailFolders() {
  console.log('🚀 모든 드라이버 제품 detail 폴더 정리 시작...\n');

  const allResults = [];

  for (const product of driverProducts) {
    const result = await cleanDetailFolder(product);
    allResults.push(result);
  }

  // 결과 저장
  const outputPath = path.join(__dirname, 'detail-folders-cleanup-result.json');
  fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2));

  console.log('\n\n📊 전체 요약:');
  console.log(`${'='.repeat(60)}`);
  allResults.forEach(r => {
    console.log(`\n   ${r.product} (${r.folder}):`);
    console.log(`      - 삭제: ${r.deleted.length}개`);
    console.log(`      - 오류: ${r.errors.length}개`);
  });

  const totalDeleted = allResults.reduce((sum, r) => sum + r.deleted.length, 0);
  const totalErrors = allResults.reduce((sum, r) => sum + r.errors.length, 0);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 전체 통계:`);
  console.log(`   - 총 삭제: ${totalDeleted}개`);
  console.log(`   - 총 오류: ${totalErrors}개`);
  console.log(`${'='.repeat(60)}`);

  console.log(`\n✅ 결과가 ${outputPath}에 저장되었습니다.`);
  console.log('\n✅ 모든 detail 폴더 정리 완료!');
}

cleanAllDetailFolders();

