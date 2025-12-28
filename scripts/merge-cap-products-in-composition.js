/**
 * 제품 합성 관리에서 캡 제품 통합
 * 1. MAS Limited Cap: gray와 black 통합
 * 2. MASSGOO Cap: white와 black 통합
 * color_variants 필드 활용
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

async function mergeCapProducts() {
  console.log('🔄 캡 제품 통합 시작...\n');

  const results = {
    masLimitedCap: { success: false, errors: [] },
    massgooCap: { success: false, errors: [] }
  };

  // 1. MAS Limited Cap 통합
  console.log('1️⃣ MAS Limited Cap 통합 중...');
  try {
    // gray와 black 제품 조회
    const { data: grayCap, error: grayError } = await supabase
      .from('product_composition')
      .select('id, slug, name, image_url, color_variants')
      .eq('slug', 'mas-limited-cap-gray')
      .maybeSingle();

    const { data: blackCap, error: blackError } = await supabase
      .from('product_composition')
      .select('id, slug, name, image_url, color_variants')
      .eq('slug', 'mas-limited-cap-black')
      .maybeSingle();

    if (grayError || !grayCap) {
      console.error(`   ❌ gray 제품 조회 실패: ${grayError?.message}`);
      results.masLimitedCap.errors.push({ step: 'fetch_gray', error: grayError?.message });
    } else if (blackError || !blackCap) {
      console.error(`   ❌ black 제품 조회 실패: ${blackError?.message}`);
      results.masLimitedCap.errors.push({ step: 'fetch_black', error: blackError?.message });
    } else {
      // gray를 기본으로 유지하고 color_variants 설정
      const colorVariants = {
        gray: grayCap.image_url,
        black: blackCap.image_url
      };

      const { error: updateError } = await supabase
        .from('product_composition')
        .update({
          color_variants: colorVariants,
          updated_at: new Date().toISOString()
        })
        .eq('id', grayCap.id);

      if (updateError) {
        console.error(`   ❌ 업데이트 실패: ${updateError.message}`);
        results.masLimitedCap.errors.push({ step: 'update', error: updateError.message });
      } else {
        console.log(`   ✅ gray 제품에 color_variants 설정 완료`);

        // black 제품 비활성화
        const { error: deactivateError } = await supabase
          .from('product_composition')
          .update({
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', blackCap.id);

        if (deactivateError) {
          console.error(`   ⚠️  black 제품 비활성화 실패: ${deactivateError.message}`);
          results.masLimitedCap.errors.push({ step: 'deactivate', error: deactivateError.message });
        } else {
          console.log(`   ✅ black 제품 비활성화 완료`);
          results.masLimitedCap.success = true;
        }
      }
    }
  } catch (error) {
    console.error(`   ❌ 오류: ${error.message}`);
    results.masLimitedCap.errors.push({ step: 'general', error: error.message });
  }

  // 2. MASSGOO Cap 통합
  console.log('\n2️⃣ MASSGOO Cap 통합 중...');
  try {
    // white와 black 제품 조회
    const { data: whiteCap, error: whiteError } = await supabase
      .from('product_composition')
      .select('id, slug, name, image_url, color_variants')
      .eq('slug', 'massgoo-white-cap')
      .maybeSingle();

    const { data: blackCap, error: blackError } = await supabase
      .from('product_composition')
      .select('id, slug, name, image_url, color_variants')
      .eq('slug', 'massgoo-black-cap')
      .maybeSingle();

    if (whiteError || !whiteCap) {
      console.error(`   ❌ white 제품 조회 실패: ${whiteError?.message}`);
      results.massgooCap.errors.push({ step: 'fetch_white', error: whiteError?.message });
    } else if (blackError || !blackCap) {
      console.error(`   ❌ black 제품 조회 실패: ${blackError?.message}`);
      results.massgooCap.errors.push({ step: 'fetch_black', error: blackError?.message });
    } else {
      // white를 기본으로 유지하고 color_variants 설정
      const colorVariants = {
        white: whiteCap.image_url,
        black: blackCap.image_url
      };

      const { error: updateError } = await supabase
        .from('product_composition')
        .update({
          color_variants: colorVariants,
          updated_at: new Date().toISOString()
        })
        .eq('id', whiteCap.id);

      if (updateError) {
        console.error(`   ❌ 업데이트 실패: ${updateError.message}`);
        results.massgooCap.errors.push({ step: 'update', error: updateError.message });
      } else {
        console.log(`   ✅ white 제품에 color_variants 설정 완료`);

        // black 제품 비활성화
        const { error: deactivateError } = await supabase
          .from('product_composition')
          .update({
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', blackCap.id);

        if (deactivateError) {
          console.error(`   ⚠️  black 제품 비활성화 실패: ${deactivateError.message}`);
          results.massgooCap.errors.push({ step: 'deactivate', error: deactivateError.message });
        } else {
          console.log(`   ✅ black 제품 비활성화 완료`);
          results.massgooCap.success = true;
        }
      }
    }
  } catch (error) {
    console.error(`   ❌ 오류: ${error.message}`);
    results.massgooCap.errors.push({ step: 'general', error: error.message });
  }

  // 결과 저장
  const outputPath = path.join(__dirname, 'cap-products-merge-result.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  // 요약 출력
  console.log('\n' + '='.repeat(50));
  console.log('📊 작업 요약');
  console.log('='.repeat(50));
  console.log(`   - MAS Limited Cap 통합: ${results.masLimitedCap.success ? '✅ 성공' : '❌ 실패'}`);
  console.log(`   - MASSGOO Cap 통합: ${results.massgooCap.success ? '✅ 성공' : '❌ 실패'}`);
  console.log(`   - 총 오류: ${results.masLimitedCap.errors.length + results.massgooCap.errors.length}개`);

  if (results.masLimitedCap.errors.length > 0 || results.massgooCap.errors.length > 0) {
    console.log('\n⚠️  오류 목록:');
    [...results.masLimitedCap.errors, ...results.massgooCap.errors].forEach((err, index) => {
      console.log(`   ${index + 1}. ${err.step}: ${err.error}`);
    });
  }

  console.log(`\n✅ 결과가 ${outputPath}에 저장되었습니다.`);
  console.log('\n✅ 캡 제품 통합 완료!');
}

mergeCapProducts();

