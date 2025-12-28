/**
 * 참조 이미지를 detail 폴더에서 composition 폴더로 이동
 * 
 * 1. product_composition 테이블의 reference_images 확인
 * 2. detail 폴더에 있는 참조 이미지들을 composition 폴더로 이동
 * 3. 데이터베이스 경로 업데이트
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

async function migrateReferenceImagesToComposition() {
  console.log('🔄 참조 이미지를 detail → composition 폴더로 이동 시작...\n');

  const results = {
    products: [],
    moved: [],
    errors: []
  };

  try {
    // 1. product_composition 테이블에서 모든 제품 조회
    console.log('1️⃣ product_composition 테이블 조회 중...');
    const { data: products, error: fetchError } = await supabase
      .from('product_composition')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (fetchError) {
      console.error('❌ 제품 조회 오류:', fetchError);
      return;
    }

    console.log(`✅ ${products.length}개 제품 발견\n`);

    // 2. 각 제품의 reference_images 확인 및 이동
    for (const product of products) {
      console.log(`\n📦 제품: ${product.name} (${product.slug})`);
      
      if (!product.reference_images || !Array.isArray(product.reference_images) || product.reference_images.length === 0) {
        console.log('   ⏭️  참조 이미지 없음, 건너뜀');
        continue;
      }

      console.log(`   - 참조 이미지 ${product.reference_images.length}개 발견`);
      
      const updatedReferenceImages = [];
      let hasChanges = false;

      for (const imagePath of product.reference_images) {
        // 경로에서 파일명 추출
        const fileName = imagePath.split('/').pop();
        const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
        
        // detail 폴더에 있는지 확인
        if (cleanPath.includes('/detail/')) {
          console.log(`   🔄 이동: ${fileName}`);
          
          // 새 경로 생성 (detail → composition)
          const newPath = cleanPath.replace('/detail/', '/composition/');
          const oldStoragePath = `originals/products/${product.slug}/detail/${fileName}`;
          const newStoragePath = `originals/products/${product.slug}/composition/${fileName}`;
          
          // 굿즈 제품인 경우 경로 다름
          let actualOldPath = oldStoragePath;
          let actualNewPath = newStoragePath;
          
          if (product.category === 'hat' || product.category === 'accessory') {
            // goods 폴더 구조 확인
            if (cleanPath.includes('goods/')) {
              // goods/{product-slug}/detail/... 형식
              const goodsMatch = cleanPath.match(/goods\/([^\/]+)\/detail\/(.+)$/);
              if (goodsMatch) {
                const goodsSlug = goodsMatch[1];
                actualOldPath = `originals/products/goods/${goodsSlug}/detail/${fileName}`;
                actualNewPath = `originals/products/goods/${goodsSlug}/composition/${fileName}`;
              }
            }
          }
          
          try {
            // Storage에서 파일 복사 (이동)
            // 1. 원본 파일 읽기
            const { data: fileData, error: downloadError } = await supabase.storage
              .from('blog-images')
              .download(actualOldPath);
            
            if (downloadError) {
              console.error(`     ❌ 파일 다운로드 실패: ${actualOldPath}`, downloadError);
              // 파일이 없으면 경로만 업데이트
              updatedReferenceImages.push(newPath.startsWith('/') ? newPath : `/${newPath}`);
              hasChanges = true;
              continue;
            }
            
            // 2. 새 위치에 업로드
            const { error: uploadError } = await supabase.storage
              .from('blog-images')
              .upload(actualNewPath, fileData, {
                contentType: 'image/webp',
                cacheControl: '3600',
                upsert: true // 이미 있으면 덮어쓰기
              });
            
            if (uploadError) {
              console.error(`     ❌ 파일 업로드 실패: ${actualNewPath}`, uploadError);
              results.errors.push({
                product: product.name,
                fileName,
                error: uploadError.message
              });
              // 실패해도 경로는 업데이트 (파일은 나중에 수동으로 처리)
              updatedReferenceImages.push(newPath.startsWith('/') ? newPath : `/${newPath}`);
              hasChanges = true;
              continue;
            }
            
            // 3. 원본 파일 삭제
            const { error: deleteError } = await supabase.storage
              .from('blog-images')
              .remove([actualOldPath]);
            
            if (deleteError) {
              console.warn(`     ⚠️  원본 파일 삭제 실패 (무시): ${actualOldPath}`, deleteError.message);
            }
            
            // 4. 경로 업데이트
            const newRelativePath = newPath.startsWith('/') ? newPath : `/${newPath}`;
            updatedReferenceImages.push(newRelativePath);
            hasChanges = true;
            
            results.moved.push({
              product: product.name,
              slug: product.slug,
              fileName,
              oldPath: actualOldPath,
              newPath: actualNewPath
            });
            
            console.log(`     ✅ 이동 완료: ${actualNewPath}`);
            
          } catch (error) {
            console.error(`     ❌ 이동 중 오류: ${fileName}`, error);
            results.errors.push({
              product: product.name,
              fileName,
              error: error.message
            });
            // 오류가 나도 경로는 업데이트
            updatedReferenceImages.push(newPath.startsWith('/') ? newPath : `/${newPath}`);
            hasChanges = true;
          }
        } else {
          // 이미 composition 폴더에 있거나 다른 경로면 그대로 유지
          updatedReferenceImages.push(imagePath);
        }
      }

      // 3. 데이터베이스 업데이트
      if (hasChanges) {
        console.log(`   💾 데이터베이스 업데이트 중...`);
        
        const { error: updateError } = await supabase
          .from('product_composition')
          .update({
            reference_images: updatedReferenceImages,
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id);
        
        if (updateError) {
          console.error(`     ❌ 데이터베이스 업데이트 실패:`, updateError);
          results.errors.push({
            product: product.name,
            error: `DB 업데이트 실패: ${updateError.message}`
          });
        } else {
          console.log(`     ✅ 데이터베이스 업데이트 완료`);
          results.products.push({
            id: product.id,
            name: product.name,
            slug: product.slug,
            updatedImages: updatedReferenceImages.length
          });
        }
      } else {
        console.log(`   ✅ 변경사항 없음 (이미 composition 폴더에 있음)`);
      }
    }

    // 결과 저장
    const outputPath = path.join(__dirname, 'reference-images-migration-result.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\n✅ 결과가 ${outputPath}에 저장되었습니다.`);

    // 요약 출력
    console.log('\n📊 마이그레이션 요약:');
    console.log(`   - 처리된 제품: ${results.products.length}개`);
    console.log(`   - 이동된 이미지: ${results.moved.length}개`);
    console.log(`   - 오류: ${results.errors.length}개`);
    
    if (results.errors.length > 0) {
      console.log('\n⚠️  오류 목록:');
      results.errors.forEach((err, index) => {
        console.log(`   ${index + 1}. ${err.product}: ${err.fileName || err.error}`);
      });
    }

  } catch (error) {
    console.error('❌ 스크립트 실행 오류:', error);
    process.exit(1);
  }
}

migrateReferenceImagesToComposition();

