// Playwright로 여러 이미지 일괄 이동 문제 재현 및 디버그
import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const STORAGE_BUCKET = 'blog-images';

// 테스트 설정
const SOURCE_FOLDER = 'originals/composed/2025-12-11';
const TARGET_FOLDER = 'originals/goods/bucket-hat-muziik-white/gallery';

(async () => {
  console.log('🧪 여러 이미지 일괄 이동 문제 재현 테스트 시작...\n');
  console.log(`📋 소스 폴더: ${SOURCE_FOLDER}`);
  console.log(`📋 대상 폴더: ${TARGET_FOLDER}\n`);

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 콘솔 로그 캡처
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    const timestamp = new Date().toISOString();
    consoleLogs.push({ type, text, timestamp });
    
    // 관련 로그만 필터링하여 출력
    if (text.includes('일괄') || 
        text.includes('드롭') ||
        text.includes('이동') ||
        text.includes('move') ||
        text.includes('bulk') ||
        text.includes('선택') ||
        text.includes('selectedImages') ||
        text.includes('handleBulk') ||
        text.includes('이미지') ||
        text.includes('API') ||
        text.includes('🔍') ||
        text.includes('✅') ||
        text.includes('❌') ||
        text.includes('📋') ||
        text.includes('📁') ||
        type === 'error') {
      const prefix = type === 'error' ? '🔴' : type === 'warn' ? '⚠️' : '📝';
      console.log(`   ${prefix} [${type}] ${text.substring(0, 400)}`);
    }
  });

  try {
    // 1. 로그인
    console.log('1️⃣ 로그인...');
    await page.goto('http://localhost:3000/admin/login');
    await page.waitForTimeout(2000);

    const loginForm = await page.locator('form').first();
    if (await loginForm.isVisible({ timeout: 5000 })) {
      console.log('   ✅ 로그인 폼 발견');
      await page.fill('input[name="email"], input[type="text"]', '010-6669-9000');
      await page.fill('input[name="password"], input[type="password"]', '66699000');
      await page.click('button[type="submit"], button:has-text("로그인")');
      await page.waitForTimeout(3000);
      console.log('   ✅ 로그인 완료\n');
    } else {
      throw new Error('로그인 폼을 찾을 수 없습니다.');
    }

    // 2. 갤러리 페이지로 이동
    console.log('2️⃣ 갤러리 페이지로 이동...');
    await page.goto('http://localhost:3000/admin/gallery');
    await page.waitForTimeout(5000);
    console.log('   ✅ 갤러리 페이지 로드 완료\n');

    // 3. 소스 폴더 선택
    console.log(`3️⃣ 소스 폴더 선택: ${SOURCE_FOLDER}...`);
    
    // 폴더 트리에서 해당 폴더 찾기 및 클릭
    const folderPathParts = SOURCE_FOLDER.split('/');
    for (const part of folderPathParts) {
      console.log(`   📁 폴더 클릭: ${part}`);
      
      // 폴더 트리에서 해당 폴더 찾기 (더 정확한 선택자 사용)
      const folderText = page.locator(`text=${part}`).first();
      if (await folderText.isVisible({ timeout: 3000 })) {
        await folderText.click();
        await page.waitForTimeout(500);
      } else {
        console.warn(`   ⚠️ 폴더 "${part}"를 찾을 수 없습니다.`);
      }
    }
    
    await page.waitForTimeout(2000);
    console.log('   ✅ 폴더 선택 완료\n');

    // 4. 폴더 내 이미지 확인
    console.log('4️⃣ 폴더 내 이미지 확인...');
    await page.waitForTimeout(2000);
    
    // 이미지 요소 찾기
    const imageElements = await page.locator('[data-image-id], img[src*="supabase"]').all();
    console.log(`   📊 발견된 이미지 요소: ${imageElements.length}개`);
    
    if (imageElements.length < 2) {
      console.warn('   ⚠️ 이미지가 2개 미만입니다. 테스트를 계속 진행합니다...');
    }
    
    // 최소 2개 이미지 선택 (최대 3개)
    const imagesToSelect = Math.min(imageElements.length, 3);
    console.log(`   📊 선택할 이미지 개수: ${imagesToSelect}개\n`);

    // 5. 이미지 선택 (체크박스 클릭)
    console.log('5️⃣ 이미지 선택...');
    for (let i = 0; i < imagesToSelect; i++) {
      const imageElement = imageElements[i];
      const checkbox = imageElement.locator('input[type="checkbox"]').first();
      
      if (await checkbox.isVisible({ timeout: 1000 })) {
        await checkbox.click({ force: true });
        await page.waitForTimeout(300);
        console.log(`   ✅ 이미지 ${i + 1} 선택 완료`);
      } else {
        // 체크박스가 없으면 이미지 자체를 클릭
        await imageElement.click({ force: true });
        await page.waitForTimeout(300);
        console.log(`   ✅ 이미지 ${i + 1} 클릭 완료`);
      }
    }
    
    await page.waitForTimeout(1000);
    console.log('   ✅ 이미지 선택 완료\n');

    // 6. 선택된 이미지 개수 확인
    console.log('6️⃣ 선택된 이미지 개수 확인...');
    const selectedCount = await page.evaluate(() => {
      // 선택 모드 확인
      const selectionModeCheckbox = document.querySelector('input[type="checkbox"]:checked');
      const selectedImages = document.querySelectorAll('[data-image-id][class*="selected"], img[src*="supabase"][class*="selected"]');
      const bulkActionBar = Array.from(document.querySelectorAll('*')).find(el => el.textContent && el.textContent.includes('개 이미지 선택됨'));
      return {
        selectionMode: selectionModeCheckbox ? true : false,
        selectedCount: selectedImages.length,
        bulkActionBar: bulkActionBar ? true : false
      };
    });
    
    console.log('   📊 선택 상태:', selectedCount);
    console.log('');

    // 7. 대상 폴더로 드래그 앤 드롭
    console.log(`7️⃣ 대상 폴더로 드래그 앤 드롭: ${TARGET_FOLDER}...`);
    
    // 대상 폴더 찾기
    const targetFolderParts = TARGET_FOLDER.split('/');
    let targetFolderElement = null;
    
    for (const part of targetFolderParts) {
      const folderText = page.locator(`text=${part}`).first();
      if (await folderText.isVisible({ timeout: 2000 })) {
        await folderText.click();
        await page.waitForTimeout(500);
        targetFolderElement = folderText;
      }
    }
    
    if (!targetFolderElement) {
      throw new Error('대상 폴더를 찾을 수 없습니다.');
    }
    
    console.log('   ✅ 대상 폴더 찾기 완료');
    
    // 첫 번째 선택된 이미지 요소 찾기
    const firstSelectedImage = imageElements[0];
    
    // Alt 키를 누른 채로 드래그 앤 드롭 (이동)
    console.log('   🔄 Alt 키를 누른 채 드래그 앤 드롭 시작...');
    
    await firstSelectedImage.dragTo(targetFolderElement, {
      force: true,
      modifiers: ['Alt']
    });
    
    await page.waitForTimeout(2000);
    console.log('   ✅ 드래그 앤 드롭 완료\n');

    // 8. 결과 확인 (콘솔 로그 분석)
    console.log('8️⃣ 결과 확인 (콘솔 로그 분석)...');
    
    // 일괄 처리 관련 로그 필터링
    const bulkLogs = consoleLogs.filter(log => 
      log.text.includes('일괄') ||
      log.text.includes('handleBulk') ||
      log.text.includes('이미지') && (log.text.includes('처리') || log.text.includes('이동'))
    );
    
    console.log(`   📊 일괄 처리 관련 로그: ${bulkLogs.length}개`);
    
    // 각 이미지 처리 로그 확인
    const imageProcessLogs = consoleLogs.filter(log => 
      log.text.includes('[이미지') && log.text.includes('처리')
    );
    
    console.log(`   📊 이미지 처리 로그: ${imageProcessLogs.length}개`);
    imageProcessLogs.forEach((log, index) => {
      console.log(`   ${index + 1}. ${log.text.substring(0, 200)}`);
    });
    
    // 최종 결과 로그 확인
    const finalResultLogs = consoleLogs.filter(log => 
      log.text.includes('최종 결과') ||
      log.text.includes('일괄 처리 완료')
    );
    
    if (finalResultLogs.length > 0) {
      console.log('   📊 최종 결과:');
      finalResultLogs.forEach(log => {
        console.log(`      ${log.text.substring(0, 300)}`);
      });
    }
    
    console.log('');

    // 9. UI에서 성공 메시지 확인
    console.log('9️⃣ UI에서 성공 메시지 확인...');
    await page.waitForTimeout(3000);
    
    const successMessage = await page.evaluate(() => {
      const toast = document.querySelector('[class*="toast"], [class*="notification"]');
      return toast ? toast.textContent : null;
    });
    
    if (successMessage) {
      console.log(`   📊 성공 메시지: ${successMessage}`);
    } else {
      console.log('   ⚠️ 성공 메시지를 찾을 수 없습니다.');
    }
    console.log('');

    // 10. 대상 폴더로 이동하여 이미지 개수 확인
    console.log('🔟 대상 폴더로 이동하여 이미지 개수 확인...');
    
    // 대상 폴더 클릭
    for (const part of targetFolderParts) {
      const folderText = page.locator(`text=${part}`).first();
      if (await folderText.isVisible({ timeout: 2000 })) {
        await folderText.click();
        await page.waitForTimeout(500);
      }
    }
    
    await page.waitForTimeout(3000);
    
    const targetFolderImages = await page.locator('[data-image-id], img[src*="supabase"]').count();
    console.log(`   📊 대상 폴더의 이미지 개수: ${targetFolderImages}개`);
    console.log('');

    // 11. 문제 진단
    console.log('1️⃣1️⃣ 문제 진단...');
    const expectedMoved = imagesToSelect;
    const actualMoved = targetFolderImages;
    
    console.log('   📊 진단 결과:');
    console.log(`      - 선택한 이미지: ${expectedMoved}개`);
    console.log(`      - 대상 폴더 이미지: ${actualMoved}개`);
    console.log(`      - 예상 이동: ${expectedMoved}개`);
    
    if (actualMoved < expectedMoved) {
      console.log(`   ❌ 문제 발견: ${expectedMoved - actualMoved}개 이미지가 이동되지 않았습니다.`);
    } else {
      console.log('   ✅ 모든 이미지가 정상적으로 이동되었습니다.');
    }
    console.log('');

    // 12. 전체 콘솔 로그 저장
    console.log('1️⃣2️⃣ 전체 콘솔 로그 저장...');
    const fs = require('fs');
    const path = require('path');
    
    const logData = {
      testConfig: {
        sourceFolder: SOURCE_FOLDER,
        targetFolder: TARGET_FOLDER,
        imagesToSelect: imagesToSelect
      },
      results: {
        expectedMoved,
        actualMoved,
        issueDetected: actualMoved < expectedMoved
      },
      consoleLogs: consoleLogs.filter(log => 
        log.text.includes('일괄') ||
        log.text.includes('드롭') ||
        log.text.includes('이동') ||
        log.text.includes('handleBulk') ||
        log.text.includes('이미지') ||
        log.type === 'error'
      )
    };
    
    const logPath = path.join(process.cwd(), `test-bulk-image-move-log-${Date.now()}.json`);
    fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));
    console.log(`   ✅ 로그 저장 완료: ${logPath}\n`);

    console.log('✅ 테스트 완료!');
    console.log('\n📋 결과 요약:');
    console.log(`   - 선택한 이미지: ${expectedMoved}개`);
    console.log(`   - 대상 폴더 이미지: ${actualMoved}개`);
    console.log(`   - 문제 발견: ${actualMoved < expectedMoved ? '❌ 예' : '✅ 아니오'}`);
    
    // 브라우저를 열어두고 수동 확인 가능하도록 대기
    console.log('\n⏸️ 브라우저를 열어두고 있습니다. 수동 확인 후 Enter를 눌러 종료하세요...');
    await page.waitForTimeout(60000); // 60초 대기

  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    throw error;
  } finally {
    await browser.close();
  }
})();
