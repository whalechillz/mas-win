/**
 * black-beryl 제품 루트 폴더 정리 스크립트
 * 
 * 1. 루트 폴더의 모든 파일 확인
 * 2. 파일명으로 타입 결정 (detail/composition/gallery)
 * 3. 하위 폴더에 이미 존재하는지 확인
 * 4. composition 폴더는 secret-weapon-black-sole-500.webp만 유지
 * 5. 루트 파일들을 적절한 하위 폴더로 이동 또는 삭제
 * 6. 데이터베이스 업데이트
 * 7. 루트 폴더 정리
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

/**
 * 파일명으로 이미지 타입 결정
 */
function determineImageType(fileName) {
  const lowerName = fileName.toLowerCase();
  
  // composition: 합성용 이미지
  // -sole-, -500, -500-long 포함하거나 파일명이 500으로 시작하는 경우
  if (
    lowerName.includes('-sole-') ||
    lowerName.includes('-500') ||
    lowerName.startsWith('500') ||
    lowerName.includes('composition') ||
    lowerName.includes('composed')
  ) {
    return 'composition';
  }
  
  // gallery: 갤러리 이미지
  if (lowerName.includes('gallery-')) {
    return 'gallery';
  }
  
  // detail: 기본값 (상세페이지용)
  return 'detail';
}

async function cleanBlackBerylRootFiles() {
  console.log('🧹 black-beryl 루트 폴더 정리 시작...\n');

  const results = {
    rootFiles: [],
    detailFiles: [],
    compositionFiles: [],
    moved: [],
    deleted: [],
    skipped: [],
    errors: []
  };

  try {
    // 1. 루트 폴더 파일 목록 확인
    console.log('1️⃣ 루트 폴더 파일 목록 확인 중...');
    const { data: rootFiles, error: rootError } = await supabase.storage
      .from('blog-images')
      .list('originals/products/black-beryl', {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (rootError) {
      console.error('❌ 루트 폴더 조회 오류:', rootError);
      results.errors.push({ step: 'list_root', error: rootError.message });
      return;
    }

    // 폴더 제외, 파일만 필터링 (폴더는 id가 없거나 name이 폴더명과 동일)
    const rootFileList = (rootFiles || []).filter(item => {
      // 폴더는 id가 없거나, name이 'detail', 'composition', 'gallery'인 경우 제외
      return item.id && 
             item.name !== 'detail' && 
             item.name !== 'composition' && 
             item.name !== 'gallery' &&
             !item.name.endsWith('/');
    });
    results.rootFiles = rootFileList.map(f => f.name);
    
    console.log(`✅ 루트 폴더에 ${rootFileList.length}개 파일 발견:`);
    rootFileList.forEach(file => {
      console.log(`   - ${file.name}`);
    });

    console.log('');

    // 2. 하위 폴더 파일 목록 확인
    console.log('2️⃣ 하위 폴더 파일 목록 확인 중...');
    
    // detail 폴더
    const { data: detailFiles, error: detailError } = await supabase.storage
      .from('blog-images')
      .list('originals/products/black-beryl/detail', {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (!detailError && detailFiles) {
      results.detailFiles = detailFiles.map(f => f.name);
      console.log(`✅ detail 폴더: ${results.detailFiles.length}개 파일`);
    }

    // composition 폴더
    const { data: compositionFiles, error: compositionError } = await supabase.storage
      .from('blog-images')
      .list('originals/products/black-beryl/composition', {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (!compositionError && compositionFiles) {
      results.compositionFiles = compositionFiles.map(f => f.name);
      console.log(`✅ composition 폴더: ${results.compositionFiles.length}개 파일`);
      compositionFiles.forEach(f => console.log(`   - ${f.name}`));
    }

    console.log('');

    // 3. composition 폴더 정리 (secret-weapon-black-sole-500.webp만 유지)
    console.log('3️⃣ composition 폴더 정리 중...');
    const compositionFilesToDelete = results.compositionFiles.filter(
      fileName => fileName !== 'secret-weapon-black-sole-500.webp'
    );

    if (compositionFilesToDelete.length > 0) {
      console.log(`   삭제할 파일: ${compositionFilesToDelete.length}개`);
      for (const fileName of compositionFilesToDelete) {
        const filePath = `originals/products/black-beryl/composition/${fileName}`;
        console.log(`   🗑️  삭제: ${fileName}`);
        
        const { error: deleteError } = await supabase.storage
          .from('blog-images')
          .remove([filePath]);
        
        if (deleteError) {
          console.error(`     ❌ 삭제 실패: ${deleteError.message}`);
          results.errors.push({ file: fileName, step: 'delete_composition', error: deleteError.message });
        } else {
          results.deleted.push({ type: 'composition', fileName, path: filePath });
          console.log(`     ✅ 삭제 완료`);
        }
      }
    } else {
      console.log('   ✅ composition 폴더는 이미 정리되어 있습니다.');
    }

    console.log('');

    // 4. 루트 파일 처리
    console.log('4️⃣ 루트 파일 처리 중...');
    
    for (const rootFile of rootFileList) {
      const fileName = rootFile.name;
      
      // 시스템 파일은 건너뛰기
      if (fileName.startsWith('.') || fileName === '.keep.png') {
        console.log(`   ⏭️  건너뛰기 (시스템 파일): ${fileName}`);
        results.skipped.push({ fileName, reason: 'system_file' });
        continue;
      }

      const imageType = determineImageType(fileName);
      const targetFolder = `originals/products/black-beryl/${imageType}`;
      const targetPath = `${targetFolder}/${fileName}`;
      const rootPath = `originals/products/black-beryl/${fileName}`;

      console.log(`\n   📄 처리 중: ${fileName}`);
      console.log(`      타입: ${imageType}`);

      // 하위 폴더에 이미 존재하는지 확인
      const existingFiles = imageType === 'detail' ? results.detailFiles : 
                           imageType === 'composition' ? results.compositionFiles : [];
      const alreadyExists = existingFiles.includes(fileName);

      if (alreadyExists) {
        console.log(`      ⚠️  하위 폴더에 이미 존재함 → 루트 파일만 삭제`);
        
        const { error: deleteError } = await supabase.storage
          .from('blog-images')
          .remove([rootPath]);
        
        if (deleteError) {
          console.error(`      ❌ 삭제 실패: ${deleteError.message}`);
          results.errors.push({ file: fileName, step: 'delete_duplicate', error: deleteError.message });
        } else {
          results.deleted.push({ type: 'root_duplicate', fileName, path: rootPath });
          console.log(`      ✅ 루트 파일 삭제 완료`);
        }
      } else {
        // 하위 폴더로 이동
        console.log(`      📦 하위 폴더로 이동: ${targetPath}`);
        
        try {
          // 1. 파일 다운로드
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('blog-images')
            .download(rootPath);
          
          if (downloadError) {
            console.error(`      ❌ 다운로드 실패: ${downloadError.message}`);
            results.errors.push({ file: fileName, step: 'download', error: downloadError.message });
            continue;
          }

          // 2. 새 위치에 업로드
          const { error: uploadError } = await supabase.storage
            .from('blog-images')
            .upload(targetPath, fileData, {
              contentType: 'image/webp',
              cacheControl: '3600',
              upsert: true
            });
          
          if (uploadError) {
            console.error(`      ❌ 업로드 실패: ${uploadError.message}`);
            results.errors.push({ file: fileName, step: 'upload', error: uploadError.message });
            continue;
          }

          // 3. 루트 파일 삭제
          const { error: deleteError } = await supabase.storage
            .from('blog-images')
            .remove([rootPath]);
          
          if (deleteError) {
            console.warn(`      ⚠️  루트 파일 삭제 실패 (무시): ${deleteError.message}`);
          }

          results.moved.push({
            fileName,
            from: rootPath,
            to: targetPath,
            type: imageType
          });
          console.log(`      ✅ 이동 완료`);

        } catch (error) {
          console.error(`      ❌ 이동 중 오류: ${error.message}`);
          results.errors.push({ file: fileName, step: 'move', error: error.message });
        }
      }
    }

    console.log('');

    // 5. 데이터베이스 업데이트
    console.log('5️⃣ 데이터베이스 업데이트 중...');
    
    // products 테이블의 detail_images 업데이트
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, detail_images')
      .eq('slug', 'black-beryl')
      .single();

    if (!productError && product) {
      const movedDetailFiles = results.moved
        .filter(m => m.type === 'detail')
        .map(m => m.to);
      
      if (movedDetailFiles.length > 0) {
        const currentImages = Array.isArray(product.detail_images) ? [...product.detail_images] : [];
        const updatedImages = [...new Set([...currentImages, ...movedDetailFiles])];
        
        const { error: updateError } = await supabase
          .from('products')
          .update({ detail_images: updatedImages })
          .eq('id', product.id);
        
        if (updateError) {
          console.error('❌ products.detail_images 업데이트 실패:', updateError);
          results.errors.push({ step: 'update_products', error: updateError.message });
        } else {
          console.log(`✅ products.detail_images 업데이트 완료 (${updatedImages.length}개)`);
        }
      }
    }

    // composition_images 업데이트 (secret-weapon-black-sole-500.webp만)
    if (!productError && product) {
      const compositionPath = 'originals/products/black-beryl/composition/secret-weapon-black-sole-500.webp';
      const { error: updateError } = await supabase
        .from('products')
        .update({ composition_images: [compositionPath] })
        .eq('id', product.id);
      
      if (updateError) {
        console.error('❌ products.composition_images 업데이트 실패:', updateError);
        results.errors.push({ step: 'update_composition', error: updateError.message });
      } else {
        console.log('✅ products.composition_images 업데이트 완료 (secret-weapon-black-sole-500.webp만 유지)');
      }
    }

    // 결과 저장
    const outputPath = path.join(__dirname, 'black-beryl-root-cleanup-result.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\n✅ 결과가 ${outputPath}에 저장되었습니다.`);

    // 요약 출력
    console.log('\n📊 정리 요약:');
    console.log(`   - 루트 파일: ${results.rootFiles.length}개`);
    console.log(`   - 이동된 파일: ${results.moved.length}개`);
    console.log(`   - 삭제된 파일: ${results.deleted.length}개`);
    console.log(`   - 건너뛴 파일: ${results.skipped.length}개`);
    console.log(`   - 오류: ${results.errors.length}개`);
    
    if (results.errors.length > 0) {
      console.log('\n⚠️  오류 목록:');
      results.errors.forEach((err, index) => {
        console.log(`   ${index + 1}. ${err.file || err.step}: ${err.error}`);
      });
    }

    console.log('\n✅ 정리 완료!');
    console.log('\n📋 최종 상태:');
    console.log('   - 루트 폴더: 비어있음 (또는 시스템 파일만)');
    console.log('   - detail/ 폴더: 상세페이지용 이미지');
    console.log('   - composition/ 폴더: secret-weapon-black-sole-500.webp만 유지');

  } catch (error) {
    console.error('❌ 스크립트 실행 오류:', error);
    process.exit(1);
  }
}

cleanBlackBerylRootFiles();

