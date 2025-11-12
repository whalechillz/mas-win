#!/usr/bin/env node

/**
 * Phase 8: 중복 제거 확인 버튼 Playwright 테스트
 * 
 * 갤러리 페이지에서 중복 제거 확인 버튼이 정상 작동하는지 테스트합니다.
 * - 로그인
 * - 폴더 선택
 * - 중복 제거 확인 버튼 클릭
 * - 모달 표시 확인
 * - 이미지 표시 확인
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });

// 로그인 정보: docs/e2e-tests/TEST_CREDENTIALS.md 참고
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || '010-6669-9000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '66699000';
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

async function testDuplicateCheckButton() {
  console.log('🎭 Playwright: 중복 제거 확인 버튼 테스트\n');
  console.log('='.repeat(60));
  console.log('⚠️  참고: 서버가 정상 작동 중이어야 합니다.');
  console.log('   브라우저에서 수동으로 로그인한 후 테스트를 진행할 수 있습니다.\n');

  const browser = await chromium.launch({
    headless: false,
    viewport: { width: 1920, height: 1080 },
  });
  const page = await browser.newPage();

  try {
    // 1. 갤러리 페이지로 이동 (이미 로그인되어 있다고 가정)
    console.log('\n📸 1단계: 갤러리 페이지로 이동');
    await page.goto(`${BASE_URL}/admin/gallery`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    console.log(`  현재 URL: ${currentUrl}`);
    
    // 로그인 페이지로 리다이렉트되었는지 확인
    if (currentUrl.includes('/admin/login')) {
      console.log('  ⚠️  로그인 페이지로 리다이렉트되었습니다.');
      console.log('  💡 브라우저에서 수동으로 로그인해주세요.');
      console.log('  💡 로그인 후 갤러리 페이지가 표시되면 자동으로 테스트를 계속합니다.\n');
      
      // 갤러리 페이지로 리다이렉트될 때까지 대기
      await page.waitForURL(/\/admin\/gallery/, { timeout: 120000 }).catch(() => {
        console.log('  ⚠️  타임아웃: 갤러리 페이지로 이동하지 않았습니다.');
        console.log('  💡 수동으로 갤러리 페이지로 이동한 후 스크립트를 재실행하세요.');
      });
    }

    // 2. 갤러리 페이지 로드 대기
    console.log('\n📸 2단계: 갤러리 페이지 로드 대기');
    await page.waitForSelector('div[class*="grid"], div[class*="gallery"], h1, h2', { timeout: 15000 });
    await page.waitForTimeout(3000);
    console.log('✅ 갤러리 페이지 로드 완료');

    // 3. originals/campaigns/2025-07 폴더 선택
    console.log('\n📁 3단계: originals/campaigns/2025-07 폴더 선택');
    
    await page.waitForTimeout(2000);
    
    // originals 폴더 확장
    const originalsText = page.locator('text=/originals/i').first();
    if (await originalsText.count() > 0) {
      const originalsFolder = originalsText.locator('xpath=ancestor::div[contains(@class, "cursor-pointer")]').first();
      if (await originalsFolder.count() > 0) {
        const expandButton = originalsFolder.locator('button').first();
        if (await expandButton.count() > 0) {
          const buttonText = await expandButton.textContent().catch(() => '');
          if (buttonText?.trim() === '▶' || buttonText?.trim() === '') {
            await expandButton.click();
            await page.waitForTimeout(1000);
            console.log('  ✅ originals 폴더 확장');
          }
        }
        await originalsFolder.click();
        await page.waitForTimeout(1000);
      }
    }
    
    // campaigns 폴더 확장
    await page.waitForTimeout(1000);
    const campaignsText = page.locator('text=/campaigns/i').first();
    if (await campaignsText.count() > 0) {
      const campaignsFolder = campaignsText.locator('xpath=ancestor::div[contains(@class, "cursor-pointer")]').first();
      if (await campaignsFolder.count() > 0) {
        const expandButton = campaignsFolder.locator('button').first();
        if (await expandButton.count() > 0) {
          const buttonText = await expandButton.textContent().catch(() => '');
          if (buttonText?.trim() === '▶' || buttonText?.trim() === '') {
            await expandButton.click();
            await page.waitForTimeout(1000);
            console.log('  ✅ campaigns 폴더 확장');
          }
        }
        await campaignsFolder.click();
        await page.waitForTimeout(1000);
      }
    }
    
    // 2025-07 폴더 선택
    await page.waitForTimeout(1000);
    const folder202507Text = page.locator('text=/2025-07/i').first();
    if (await folder202507Text.count() > 0) {
      const folder202507 = folder202507Text.locator('xpath=ancestor::div[contains(@class, "cursor-pointer")]').first();
      if (await folder202507.count() > 0) {
        await folder202507.click();
        await page.waitForTimeout(3000);
        console.log('  ✅ 2025-07 폴더 선택');
      }
    }
    
    await page.waitForTimeout(2000);
    console.log('✅ originals/campaigns/2025-07 폴더 선택 완료');

    // 4. 이미지 표시 확인
    console.log('\n🖼️  4단계: 이미지 표시 확인');
    
    const imageElements = await page.locator('img[src*="supabase"], img[src*="storage"], img[src*="blog-images"]').all();
    console.log(`  발견된 이미지: ${imageElements.length}개`);
    
    if (imageElements.length > 0) {
      console.log('  ✅ 이미지가 정상적으로 표시되고 있습니다.');
      
      // 첫 번째 이미지의 src 확인
      const firstImageSrc = await imageElements[0].getAttribute('src');
      console.log(`  첫 번째 이미지 URL: ${firstImageSrc?.substring(0, 80)}...`);
      
      // 이미지 로드 상태 확인
      const imageLoaded = await imageElements[0].evaluate((img) => {
        return img.complete && img.naturalHeight !== 0;
      });
      console.log(`  이미지 로드 상태: ${imageLoaded ? '✅ 로드됨' : '❌ 로드 안 됨'}`);
    } else {
      console.log('  ⚠️  이미지가 표시되지 않습니다.');
    }

    // 5. 중복 제거 확인 버튼 찾기 및 클릭
    console.log('\n🔍 5단계: 중복 제거 확인 버튼 찾기');
    
    const duplicateButton = page.locator('button:has-text("중복 제거 확인"), button:has-text("확인 중")').first();
    const buttonCount = await duplicateButton.count();
    
    if (buttonCount === 0) {
      console.log('  ❌ 중복 제거 확인 버튼을 찾을 수 없습니다.');
      
      // 모든 버튼 텍스트 출력 (디버깅)
      const allButtons = await page.locator('button').all();
      console.log(`  발견된 버튼 수: ${allButtons.length}개`);
      for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
        const buttonText = await allButtons[i].textContent().catch(() => '');
        console.log(`    ${i + 1}. ${buttonText}`);
      }
    } else {
      console.log('  ✅ 중복 제거 확인 버튼 발견');
      
      // 버튼이 보이는지 확인
      const isVisible = await duplicateButton.isVisible();
      console.log(`  버튼 표시 상태: ${isVisible ? '✅ 보임' : '❌ 숨김'}`);
      
      // 버튼이 비활성화되어 있는지 확인
      const isDisabled = await duplicateButton.isDisabled();
      console.log(`  버튼 활성화 상태: ${isDisabled ? '❌ 비활성화' : '✅ 활성화'}`);
      
      if (!isDisabled) {
        console.log('  버튼 클릭 중...');
        await duplicateButton.click();
        await page.waitForTimeout(3000);
        console.log('  ✅ 버튼 클릭 완료');
        
        // 6. 모달 표시 확인
        console.log('\n📋 6단계: 모달 표시 확인');
        
        const modal = page.locator('text=/중복 이미지 확인 결과/i').first();
        const modalCount = await modal.count();
        
        if (modalCount > 0) {
          console.log('  ✅ 모달이 표시되었습니다.');
          
          // 모달 내용 확인
          const summaryText = await page.locator('text=/전체 파일|중복 그룹|제거 가능/i').all();
          console.log(`  모달 내 요약 정보: ${summaryText.length}개 항목`);
          
          // 중복 그룹 정보 확인
          const duplicateGroups = await page.locator('text=/그룹.*개 파일/i').all();
          console.log(`  중복 그룹 표시: ${duplicateGroups.length}개`);
          
          // 제거 가능한 파일 목록 확인
          const safeToRemove = await page.locator('text=/제거 가능한 파일/i').first();
          if (await safeToRemove.count() > 0) {
            console.log('  ✅ 제거 가능한 파일 목록이 표시되었습니다.');
          }
          
          // 스크린샷 촬영
          const screenshotPath = path.join(process.cwd(), 'docs', 'e2e-tests', `duplicate-check-modal-${Date.now()}.png`);
          await page.screenshot({ path: screenshotPath, fullPage: true });
          console.log(`  📸 스크린샷 저장: ${screenshotPath}`);
          
        } else {
          console.log('  ❌ 모달이 표시되지 않았습니다.');
          
          // 알림 메시지 확인
          const alertText = await page.locator('text=/중복 이미지가 없습니다|안전하게 제거할 수 있는 파일이 없습니다/i').first();
          if (await alertText.count() > 0) {
            const alertContent = await alertText.textContent();
            console.log(`  ℹ️  알림 메시지: ${alertContent}`);
          }
        }
      } else {
        console.log('  ⚠️  버튼이 비활성화되어 있어 클릭할 수 없습니다.');
      }
    }

    // 7. 최종 스크린샷
    console.log('\n📸 7단계: 최종 스크린샷');
    const finalScreenshotPath = path.join(process.cwd(), 'docs', 'e2e-tests', `gallery-duplicate-check-final-${Date.now()}.png`);
    await page.screenshot({ path: finalScreenshotPath, fullPage: true });
    console.log(`✅ 최종 스크린샷 저장: ${finalScreenshotPath}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ 테스트 완료!\n');
    console.log('💡 브라우저를 열어두었습니다. 수동으로 확인하세요.');
    console.log('   확인 후 브라우저를 닫으면 스크립트가 종료됩니다.\n');

    await page.waitForTimeout(300000); // 5분 대기 (수동 확인 시간)

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    
    // 오류 발생 시 스크린샷
    const errorScreenshotPath = path.join(process.cwd(), 'docs', 'e2e-tests', `duplicate-check-error-${Date.now()}.png`);
    await page.screenshot({ path: errorScreenshotPath, fullPage: true });
    console.log(`📸 오류 스크린샷 저장: ${errorScreenshotPath}`);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  testDuplicateCheckButton();
}

module.exports = { testDuplicateCheckButton };








