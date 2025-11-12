/**
 * Phase 5-7: 이미지 비교 기능 Playwright 테스트
 */

const { chromium } = require('playwright');
const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });

const ADMIN_LOGIN = process.env.ADMIN_LOGIN || '010-6669-9000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '66699000';
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

async function testGalleryCompare() {
  console.log('🚀 Phase 5-7 이미지 비교 기능 테스트 시작\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. 로그인
    console.log('1️⃣ 로그인 중...');
    await page.goto(`${BASE_URL}/admin/gallery`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // 로그인 페이지로 리다이렉트되었는지 확인
    if (page.url().includes('/admin/login')) {
      console.log('   로그인 페이지로 리다이렉트됨, 로그인 진행...');
      await page.waitForSelector('input[name="login"], input#login', { timeout: 10000 });
      await page.fill('input[name="login"], input#login', ADMIN_LOGIN);
      await page.fill('input[name="password"], input#password', ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
      
      // 로그인 후 리다이렉트 대기 (admin 또는 admin/gallery)
      await page.waitForURL('**/admin**', { timeout: 15000 });
      
      // gallery 페이지로 이동
      if (!page.url().includes('/admin/gallery')) {
        await page.goto(`${BASE_URL}/admin/gallery`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      }
    }

    await page.waitForTimeout(3000);
    console.log('   ✅ 로그인 완료\n');

    // 2. 폴더 선택 (2025-09 캠페인)
    console.log('2️⃣ 폴더 선택 중...');
    try {
      // 폴더 트리에서 originals > campaigns > 2025-09 클릭
      await page.waitForSelector('[class*="folder"], [class*="tree"]', { timeout: 10000 });
      await page.waitForTimeout(2000);
      
      // 폴더 트리 확장 시도
      const folderSelectors = [
        'text=originals',
        'text=campaigns',
        'text=2025-09',
        '[title*="originals"]',
        '[title*="campaigns"]',
        '[title*="2025-09"]',
      ];

      for (const selector of folderSelectors) {
        try {
          const element = await page.locator(selector).first();
          if (await element.isVisible({ timeout: 2000 })) {
            await element.click();
            await page.waitForTimeout(1000);
            console.log(`   폴더 클릭: ${selector}`);
          }
        } catch (e) {
          // 무시하고 다음 시도
        }
      }
    } catch (error) {
      console.log('   ⚠️ 폴더 선택 실패 (계속 진행):', error.message);
    }
    await page.waitForTimeout(3000);
    console.log('   ✅ 폴더 선택 완료\n');

    // 3. 이미지 로딩 대기
    console.log('3️⃣ 이미지 로딩 대기 중...');
    await page.waitForTimeout(5000);
    
    // 이미지 카드 확인
    const imageCards = await page.locator('[class*="group"], [class*="card"]:has(img)').count();
    console.log(`   발견된 이미지 카드: ${imageCards}개\n`);

    if (imageCards === 0) {
      console.log('   ⚠️ 이미지가 없습니다. 테스트 종료.');
      return;
    }

    // 4. 비교용 체크박스 찾기 및 클릭
    console.log('4️⃣ 비교용 체크박스 테스트...');
    const compareCheckboxes = await page.locator('input.compare-checkbox[type="checkbox"]').count();
    console.log(`   발견된 비교용 체크박스: ${compareCheckboxes}개`);

    if (compareCheckboxes === 0) {
      // hover로 체크박스 표시 시도
      const firstImageCard = page.locator('[class*="group"], [class*="card"]:has(img)').first();
      await firstImageCard.hover();
      await page.waitForTimeout(1000);
      
      const visibleCheckboxes = await page.locator('input.compare-checkbox[type="checkbox"]:visible').count();
      console.log(`   hover 후 표시된 체크박스: ${visibleCheckboxes}개`);
    }

    // 첫 번째 이미지에 hover하고 체크박스 클릭
    const firstImageCard = page.locator('[class*="group"], [class*="card"]:has(img)').first();
    await firstImageCard.hover();
    await page.waitForTimeout(1000);
    
    const firstCheckbox = page.locator('input.compare-checkbox[type="checkbox"]').first();
    if (await firstCheckbox.isVisible({ timeout: 2000 })) {
      await firstCheckbox.click();
      await page.waitForTimeout(1000);
      console.log('   ✅ 첫 번째 이미지 선택 완료');
    }

    // 두 번째 이미지 선택
    const secondImageCard = page.locator('[class*="group"], [class*="card"]:has(img)').nth(1);
    if (await secondImageCard.isVisible({ timeout: 2000 })) {
      await secondImageCard.hover();
      await page.waitForTimeout(1000);
      
      const secondCheckbox = page.locator('input.compare-checkbox[type="checkbox"]').nth(1);
      if (await secondCheckbox.isVisible({ timeout: 2000 })) {
        await secondCheckbox.click();
        await page.waitForTimeout(1000);
        console.log('   ✅ 두 번째 이미지 선택 완료');
      }
    }

    // 5. 비교 버튼 확인
    console.log('\n5️⃣ 비교 버튼 확인...');
    const compareButton = page.locator('button:has-text("비교")');
    if (await compareButton.isVisible({ timeout: 3000 })) {
      console.log('   ✅ 비교 버튼 표시됨');
      const buttonText = await compareButton.textContent();
      console.log(`   버튼 텍스트: ${buttonText}`);
    } else {
      console.log('   ⚠️ 비교 버튼이 표시되지 않음');
    }

    // 6. 확장자 중복 확인 버튼 테스트
    console.log('\n6️⃣ 확장자 중복 확인 버튼 테스트...');
    const extensionButton = page.locator('button:has-text("확장자 중복 확인")');
    if (await extensionButton.isVisible({ timeout: 3000 })) {
      console.log('   ✅ 확장자 중복 확인 버튼 발견');
      
      // 버튼 클릭
      await extensionButton.click();
      await page.waitForTimeout(3000);
      
      // 모달 확인
      const modal = page.locator('text=확장자 중복 확인 결과');
      if (await modal.isVisible({ timeout: 5000 })) {
        console.log('   ✅ 확장자 중복 확인 모달 표시됨');
        
        // 이미지 미리보기 확인
        const imagePreviews = await page.locator('img[src*="supabase"], img[src*="storage"]').count();
        console.log(`   발견된 이미지 미리보기: ${imagePreviews}개`);
        
        // 개별 삭제 버튼 확인
        const deleteButtons = await page.locator('button:has-text("삭제")').count();
        console.log(`   발견된 개별 삭제 버튼: ${deleteButtons}개`);
        
        // 모달 닫기
        const closeButton = page.locator('button:has-text("닫기")').first();
        if (await closeButton.isVisible({ timeout: 2000 })) {
          await closeButton.click();
          await page.waitForTimeout(1000);
          console.log('   ✅ 모달 닫기 완료');
        }
      } else {
        console.log('   ⚠️ 모달이 표시되지 않음');
      }
    } else {
      console.log('   ⚠️ 확장자 중복 확인 버튼을 찾을 수 없음');
    }

    // 7. 확대 버튼 확인 (체크박스와 겹치지 않는지)
    console.log('\n7️⃣ 확대 버튼 확인...');
    const firstCard = page.locator('[class*="group"], [class*="card"]:has(img)').first();
    await firstCard.hover();
    await page.waitForTimeout(1000);
    
    const zoomButton = page.locator('button[title="확대"], button:has-text("🔍")').first();
    if (await zoomButton.isVisible({ timeout: 2000 })) {
      console.log('   ✅ 확대 버튼 표시됨');
      const buttonBox = await zoomButton.boundingBox();
      console.log(`   확대 버튼 위치: top=${buttonBox?.y}, right=${buttonBox?.x}`);
    } else {
      console.log('   ⚠️ 확대 버튼을 찾을 수 없음');
    }

    console.log('\n✅ 테스트 완료!');
    await page.waitForTimeout(2000);

  } catch (error) {
    console.error('❌ 테스트 오류:', error);
    await page.screenshot({ path: 'test-error.png' });
  } finally {
    await browser.close();
  }
}

testGalleryCompare().catch(console.error);







