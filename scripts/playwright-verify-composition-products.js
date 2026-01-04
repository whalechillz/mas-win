// Playwright로 제품 합성 관리 slug가 있는 제품들을 확인하는 스크립트
const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🚀 Playwright로 제품 합성 관리 제품 확인 시작...\n');

  // 1. 제품 합성 관리의 모든 slug 가져오기
  const { data: compositions, error: compError } = await supabase
    .from('product_composition')
    .select('id, name, slug, product_id, display_order')
    .not('slug', 'is', null)
    .neq('slug', '')
    .order('display_order', { ascending: true });

  if (compError) {
    console.error('❌ 제품 합성 관리 조회 오류:', compError);
    process.exit(1);
  }

  console.log(`📋 제품 합성 관리 slug 총 ${compositions.length}개 발견\n`);

  // 2. 각 slug를 SKU로 변환
  const expectedSkus = compositions.map(comp => ({
    ...comp,
    expected_sku: comp.slug.toUpperCase().replace(/-/g, '_')
  }));

  console.log('📝 예상 SKU 목록:');
  expectedSkus.forEach((item, index) => {
    console.log(`${index + 1}. ${item.name} - ${item.slug} → ${item.expected_sku}`);
  });
  console.log('');

  // 3. Playwright로 브라우저 열기
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 4. 제품 관리 페이지로 이동
    console.log('🌐 제품 관리 페이지로 이동 중...');
    await page.goto('http://localhost:3000/admin/products', { waitUntil: 'networkidle' });

    // 5. 로그인 필요 시 처리 (세션이 필요한 경우)
    // await page.waitForSelector('input[type="text"]', { timeout: 5000 }).catch(() => {});

    // 6. 각 SKU로 검색하여 제품 확인
    const foundProducts = [];
    const notFoundProducts = [];

    for (const item of expectedSkus) {
      console.log(`\n🔍 검색 중: ${item.expected_sku} (${item.name})`);
      
      // 검색 입력 필드 찾기
      const searchInput = await page.locator('input[placeholder*="SKU"]').first();
      if (await searchInput.count() === 0) {
        console.log('   ⚠️ 검색 입력 필드를 찾을 수 없습니다.');
        continue;
      }

      // 검색어 입력
      await searchInput.fill('');
      await searchInput.fill(item.expected_sku);
      await page.waitForTimeout(500);

      // Enter 키 누르거나 검색 버튼 클릭
      await searchInput.press('Enter');
      await page.waitForTimeout(1000);

      // 테이블에서 제품 확인
      const productRows = await page.locator('tbody tr').count();
      
      if (productRows > 0) {
        // SKU 컬럼에서 해당 SKU 찾기
        const skuCells = await page.locator('tbody tr td').filter({ hasText: item.expected_sku }).count();
        
        if (skuCells > 0) {
          foundProducts.push(item);
          console.log(`   ✅ 발견: ${item.expected_sku}`);
        } else {
          notFoundProducts.push(item);
          console.log(`   ❌ 발견 안됨: ${item.expected_sku}`);
        }
      } else {
        notFoundProducts.push(item);
        console.log(`   ❌ 발견 안됨: ${item.expected_sku}`);
      }

      // 검색어 초기화
      await searchInput.fill('');
      await page.waitForTimeout(300);
    }

    // 7. 결과 출력
    console.log('\n\n📊 검색 결과:');
    console.log(`✅ 발견된 제품: ${foundProducts.length}개`);
    console.log(`❌ 발견 안된 제품: ${notFoundProducts.length}개`);

    if (notFoundProducts.length > 0) {
      console.log('\n❌ 발견 안된 제품 목록:');
      notFoundProducts.forEach(item => {
        console.log(`   - ${item.name}: ${item.expected_sku} (slug: ${item.slug})`);
      });
    }

    // 8. 모든 SKU를 한 번에 검색 (19개 제품 필터링)
    console.log('\n\n🔍 모든 SKU로 필터링 중...');
    const allSkus = expectedSkus.map(item => item.expected_sku).join(' OR ');
    const searchInput = await page.locator('input[placeholder*="SKU"]').first();
    await searchInput.fill('');
    await searchInput.fill(allSkus);
    await page.waitForTimeout(500);
    await searchInput.press('Enter');
    await page.waitForTimeout(2000);

    const finalProductRows = await page.locator('tbody tr').count();
    console.log(`📋 필터링된 제품 수: ${finalProductRows}개`);

    // 9. 스크린샷 저장
    await page.screenshot({ path: 'scripts/playwright-composition-products-result.png', fullPage: true });
    console.log('📸 스크린샷이 scripts/playwright-composition-products-result.png에 저장되었습니다.');

    // 브라우저를 열어둠 (사용자가 확인할 수 있도록)
    console.log('\n✅ 확인 완료. 브라우저를 확인하세요.');
    console.log('   브라우저를 닫으려면 Ctrl+C를 누르세요.');

    // 30초 후 자동 종료 (또는 사용자가 수동으로 닫을 수 있음)
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);

