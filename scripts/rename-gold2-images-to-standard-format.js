/**
 * gold2 제품 이미지 파일명을 표준 형식으로 변경
 * gold2_00_01.jpg -> secret-force-gold-2-gallery-01.webp
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * 파일명 매핑 (기존 -> 신규)
 */
const imageMapping = {
  'gold2_00_01.jpg': 'secret-force-gold-2-gallery-01.webp',
  'gold2_00_01.webp': 'secret-force-gold-2-gallery-01.webp',
  'gold2_01.jpg': 'secret-force-gold-2-gallery-02.webp',
  'gold2_01.webp': 'secret-force-gold-2-gallery-02.webp',
  'gold2_02.jpg': 'secret-force-gold-2-gallery-03.webp',
  'gold2_02.webp': 'secret-force-gold-2-gallery-03.webp',
  'gold2_03.jpg': 'secret-force-gold-2-gallery-04.webp',
  'gold2_03.webp': 'secret-force-gold-2-gallery-04.webp',
  'gold2_04.jpg': 'secret-force-gold-2-gallery-05.webp',
  'gold2_04.webp': 'secret-force-gold-2-gallery-05.webp',
  'gold2_05.jpg': 'secret-force-gold-2-gallery-06.webp',
  'gold2_05.webp': 'secret-force-gold-2-gallery-06.webp',
  'gold2_06.jpg': 'secret-force-gold-2-gallery-07.webp',
  'gold2_06.webp': 'secret-force-gold-2-gallery-07.webp',
  'gold2_07.jpg': 'secret-force-gold-2-gallery-08.webp',
  'gold2_07.webp': 'secret-force-gold-2-gallery-08.webp',
  'gold2_08_01.jpg': 'secret-force-gold-2-gallery-09.webp',
  'gold2_08_01.webp': 'secret-force-gold-2-gallery-09.webp',
};

async function renameGold2Images() {
  console.log('🔄 gold2 이미지 파일명 변경 시작...\n');

  const results = {
    filesFound: [],
    filesRenamed: [],
    filesFailed: [],
    dbUpdated: false,
    errors: []
  };

  try {
    // 1. detail 폴더의 파일 목록 조회
    console.log('1️⃣ detail 폴더 파일 목록 조회 중...');
    const { data: files, error: listError } = await supabase.storage
      .from('blog-images')
      .list('originals/products/gold2/detail', {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (listError) {
      console.error('   ❌ 파일 목록 조회 실패:', listError.message);
      results.errors.push({ step: 'list_files', error: listError.message });
      return results;
    }

    console.log(`   ✅ ${files.length}개 파일 발견`);

    // 2. 매핑에 있는 파일만 필터링
    const filesToRename = files.filter(file => {
      const fileName = file.name;
      return imageMapping[fileName] !== undefined;
    });

    console.log(`   📝 변경 대상: ${filesToRename.length}개 파일\n`);

    // 3. 각 파일 다운로드 → 변환 → 재업로드 → 삭제
    for (const file of filesToRename) {
      const oldFileName = file.name;
      const newFileName = imageMapping[oldFileName];
      const oldPath = `originals/products/gold2/detail/${oldFileName}`;
      const newPath = `originals/products/gold2/detail/${newFileName}`;

      try {
        console.log(`   🔄 ${oldFileName} -> ${newFileName}`);

        // 다운로드
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('blog-images')
          .download(oldPath);

        if (downloadError) {
          console.error(`      ❌ 다운로드 실패: ${downloadError.message}`);
          results.filesFailed.push({ old: oldFileName, new: newFileName, error: downloadError.message });
          continue;
        }

        // WebP로 변환 (이미 .webp면 그대로 사용)
        let processedBuffer;
        if (oldFileName.endsWith('.webp')) {
          processedBuffer = Buffer.from(await fileData.arrayBuffer());
        } else {
          // JPG/PNG를 WebP로 변환
          processedBuffer = await sharp(await fileData.arrayBuffer())
            .webp({ quality: 90 })
            .toBuffer();
        }

        // 새 파일명으로 업로드
        const { error: uploadError } = await supabase.storage
          .from('blog-images')
          .upload(newPath, processedBuffer, {
            contentType: 'image/webp',
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error(`      ❌ 업로드 실패: ${uploadError.message}`);
          results.filesFailed.push({ old: oldFileName, new: newFileName, error: uploadError.message });
          continue;
        }

        // 기존 파일 삭제
        const { error: deleteError } = await supabase.storage
          .from('blog-images')
          .remove([oldPath]);

        if (deleteError) {
          console.error(`      ⚠️  기존 파일 삭제 실패: ${deleteError.message}`);
          // 삭제 실패해도 계속 진행
        }

        console.log(`      ✅ 완료`);
        results.filesRenamed.push({
          old: oldFileName,
          new: newFileName,
          oldPath: oldPath,
          newPath: newPath
        });
      } catch (error) {
        console.error(`      ❌ 오류: ${error.message}`);
        results.filesFailed.push({ old: oldFileName, new: newFileName, error: error.message });
      }
    }

    // 4. 데이터베이스 업데이트
    console.log('\n2️⃣ 데이터베이스 업데이트 중...');
    try {
      // gold2 제품 조회
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('id, detail_images')
        .eq('slug', 'gold2')
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('   ❌ 제품 조회 실패:', fetchError.message);
        results.errors.push({ step: 'fetch_product', error: fetchError.message });
      } else if (product) {
        // detail_images 경로 업데이트
        const updatedImages = (product.detail_images || []).map(imgPath => {
          // 기존 경로에서 파일명 추출
          const fileName = imgPath.split('/').pop();
          
          // 매핑에 있으면 새 파일명으로 변경
          if (imageMapping[fileName]) {
            const newFileName = imageMapping[fileName];
            return `originals/products/gold2/detail/${newFileName}`;
          }
          
          // 이미 새 형식이면 그대로 유지
          return imgPath;
        });

        // 중복 제거 및 정렬
        const uniqueImages = [...new Set(updatedImages)].sort();

        const { error: updateError } = await supabase
          .from('products')
          .update({
            detail_images: uniqueImages,
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id);

        if (updateError) {
          console.error('   ❌ 데이터베이스 업데이트 실패:', updateError.message);
          results.errors.push({ step: 'update_db', error: updateError.message });
        } else {
          console.log(`   ✅ 데이터베이스 업데이트 완료 (${uniqueImages.length}개 이미지)`);
          results.dbUpdated = true;
        }
      } else {
        console.log('   ⚠️  gold2 제품이 데이터베이스에 없습니다.');
      }
    } catch (error) {
      console.error('   ❌ 데이터베이스 업데이트 오류:', error.message);
      results.errors.push({ step: 'update_db', error: error.message });
    }

  } catch (error) {
    console.error('❌ 전체 작업 오류:', error.message);
    results.errors.push({ step: 'general', error: error.message });
  }

  // 결과 저장
  const outputPath = path.join(__dirname, 'gold2-images-rename-result.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  // 요약 출력
  console.log('\n' + '='.repeat(50));
  console.log('📊 작업 요약');
  console.log('='.repeat(50));
  console.log(`   - 변경 완료: ${results.filesRenamed.length}개`);
  console.log(`   - 변경 실패: ${results.filesFailed.length}개`);
  console.log(`   - 데이터베이스 업데이트: ${results.dbUpdated ? '✅ 성공' : '❌ 실패'}`);
  console.log(`   - 총 오류: ${results.errors.length}개`);

  if (results.filesRenamed.length > 0) {
    console.log('\n✅ 변경된 파일:');
    results.filesRenamed.forEach(({ old, new: newName }) => {
      console.log(`   ${old} -> ${newName}`);
    });
  }

  if (results.filesFailed.length > 0) {
    console.log('\n❌ 실패한 파일:');
    results.filesFailed.forEach(({ old, error }) => {
      console.log(`   ${old}: ${error}`);
    });
  }

  if (results.errors.length > 0) {
    console.log('\n⚠️  오류 목록:');
    results.errors.forEach((err, index) => {
      console.log(`   ${index + 1}. ${err.step}: ${err.error}`);
    });
  }

  console.log(`\n✅ 결과가 ${outputPath}에 저장되었습니다.`);
  console.log('\n✅ gold2 이미지 파일명 변경 완료!');

  return results;
}

renameGold2Images();











