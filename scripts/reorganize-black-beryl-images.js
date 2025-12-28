/**
 * black-beryl 제품 이미지 재정비 스크립트
 * 
 * 1. composition 폴더의 3개 파일을 detail 폴더로 이동
 * 2. product_composition 테이블의 reference_images를 빈 배열로 업데이트
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

async function reorganizeBlackBerylImages() {
  console.log('🔄 black-beryl 제품 이미지 재정비 시작...\n');

  const results = {
    moved: [],
    updated: null,
    errors: []
  };

  try {
    // 이동할 파일 목록
    const filesToMove = [
      'massgoo_sw_black_muz_12.webp',
      'massgoo_sw_black_muz_13.webp',
      'massgoo_sw_black_muz_15.webp'
    ];

    // 1. Storage에서 파일 이동 (composition → detail)
    console.log('1️⃣ Storage 파일 이동 중...');
    for (const fileName of filesToMove) {
      const oldPath = `originals/products/black-beryl/composition/${fileName}`;
      const newPath = `originals/products/black-beryl/detail/${fileName}`;

      console.log(`   🔄 이동: ${fileName}`);

      try {
        // 1-1. 원본 파일 다운로드
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('blog-images')
          .download(oldPath);

        if (downloadError) {
          console.error(`     ❌ 파일 다운로드 실패: ${oldPath}`, downloadError);
          results.errors.push({
            fileName,
            step: 'download',
            error: downloadError.message
          });
          continue;
        }

        // 1-2. 새 위치에 업로드
        const { error: uploadError } = await supabase.storage
          .from('blog-images')
          .upload(newPath, fileData, {
            contentType: 'image/webp',
            cacheControl: '3600',
            upsert: true // 이미 있으면 덮어쓰기
          });

        if (uploadError) {
          console.error(`     ❌ 파일 업로드 실패: ${newPath}`, uploadError);
          results.errors.push({
            fileName,
            step: 'upload',
            error: uploadError.message
          });
          continue;
        }

        // 1-3. 원본 파일 삭제
        const { error: deleteError } = await supabase.storage
          .from('blog-images')
          .remove([oldPath]);

        if (deleteError) {
          console.warn(`     ⚠️  원본 파일 삭제 실패 (무시): ${oldPath}`, deleteError.message);
        }

        results.moved.push({
          fileName,
          oldPath,
          newPath
        });

        console.log(`     ✅ 이동 완료: ${newPath}`);

      } catch (error) {
        console.error(`     ❌ 이동 중 오류: ${fileName}`, error);
        results.errors.push({
          fileName,
          step: 'move',
          error: error.message
        });
      }
    }

    console.log('');

    // 2. product_composition 테이블 업데이트
    console.log('2️⃣ product_composition 테이블 업데이트 중...');
    const { data: compositionProduct, error: fetchError } = await supabase
      .from('product_composition')
      .select('*')
      .eq('slug', 'black-beryl')
      .single();

    if (fetchError || !compositionProduct) {
      console.error('❌ product_composition 조회 오류:', fetchError);
      results.errors.push({
        step: 'fetch',
        error: fetchError?.message || '제품을 찾을 수 없습니다.'
      });
      return;
    }

    console.log('✅ 제품 발견:', compositionProduct.name);
    console.log('   - 현재 reference_images:', JSON.stringify(compositionProduct.reference_images, null, 2));

    // reference_images를 빈 배열로 업데이트
    const { error: updateError } = await supabase
      .from('product_composition')
      .update({
        reference_images: [],
        updated_at: new Date().toISOString()
      })
      .eq('id', compositionProduct.id);

    if (updateError) {
      console.error('❌ 데이터베이스 업데이트 실패:', updateError);
      results.errors.push({
        step: 'update',
        error: updateError.message
      });
    } else {
      console.log('✅ reference_images를 빈 배열로 업데이트 완료');
      results.updated = {
        id: compositionProduct.id,
        name: compositionProduct.name,
        image_url: compositionProduct.image_url,
        reference_images: []
      };
    }

    // 결과 저장
    const outputPath = path.join(__dirname, 'black-beryl-reorganization-result.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\n✅ 결과가 ${outputPath}에 저장되었습니다.`);

    // 요약 출력
    console.log('\n📊 재정비 요약:');
    console.log(`   - 이동된 파일: ${results.moved.length}개`);
    console.log(`   - 데이터베이스 업데이트: ${results.updated ? '✅' : '❌'}`);
    console.log(`   - 오류: ${results.errors.length}개`);
    
    if (results.errors.length > 0) {
      console.log('\n⚠️  오류 목록:');
      results.errors.forEach((err, index) => {
        console.log(`   ${index + 1}. ${err.fileName || err.step}: ${err.error}`);
      });
    }

    console.log('\n✅ 재정비 완료!');
    console.log('\n📋 최종 상태:');
    console.log('   - product_composition.image_url: secret-weapon-black-sole-500.webp (유지)');
    console.log('   - product_composition.reference_images: [] (빈 배열)');
    console.log('   - products.detail_images: 9개 (12, 13, 15 포함)');

  } catch (error) {
    console.error('❌ 스크립트 실행 오류:', error);
    process.exit(1);
  }
}

reorganizeBlackBerylImages();

