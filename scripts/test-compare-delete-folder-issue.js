// Playwright로 비교 모달에서 삭제 후 폴더 이미지가 사라지는 문제 재현
import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const STORAGE_BUCKET = 'blog-images';

// 테스트용 폴더
const TEST_FOLDER = 'originals/composed/2025-12-11';

(async () => {
  console.log('🧪 비교 모달 삭제 후 폴더 이미지 사라짐 문제 재현 테스트 시작...\n');
  console.log(`📋 테스트 폴더: ${TEST_FOLDER}\n`);

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 콘솔 로그 캡처
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    consoleLogs.push({ type, text, timestamp: new Date().toISOString() });
    
    // 관련 로그만 필터링하여 출력
    if (text.includes('삭제') || 
        text.includes('delete') || 
        text.includes('API') || 
        text.includes('fetchImages') ||
        text.includes('compareResult') ||
        text.includes('images 상태') ||
        text.includes('폴더 필터') ||
        text.includes('folderFilter') ||
        text.includes('Storage') ||
        text.includes('🔍') ||
        text.includes('✅') ||
        text.includes('❌') ||
        text.includes('⚠️') ||
        text.includes('🔄') ||
        type === 'error') {
      const prefix = type === 'error' ? '🔴' : type === 'warn' ? '⚠️' : '📝';
      console.log(`   ${prefix} [${type}] ${text.substring(0, 300)}`);
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

    // 2. 테스트용 이미지 2개 생성
    console.log('2️⃣ 테스트용 이미지 2개 생성...');
    const testImage1 = `test-compare-delete-1-${Date.now()}.png`;
    const testImage2 = `test-compare-delete-2-${Date.now()}.png`;
    
    // 간단한 PNG 이미지 생성 (1x1 픽셀)
    const createTestImage = () => {
      // Base64 인코딩된 1x1 빨간색 PNG
      return Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );
    };

    const imageBuffer = createTestImage();
    
    // 이미지 1 업로드
    const { data: upload1, error: uploadError1 } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(`${TEST_FOLDER}/${testImage1}`, imageBuffer, {
        contentType: 'image/png',
        upsert: true
      });
    
    if (uploadError1) {
      console.error('   ❌ 이미지 1 업로드 실패:', uploadError1);
      throw uploadError1;
    }
    console.log(`   ✅ 이미지 1 업로드 완료: ${testImage1}`);

    // 이미지 2 업로드
    const { data: upload2, error: uploadError2 } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(`${TEST_FOLDER}/${testImage2}`, imageBuffer, {
        contentType: 'image/png',
        upsert: true
      });
    
    if (uploadError2) {
      console.error('   ❌ 이미지 2 업로드 실패:', uploadError2);
      throw uploadError2;
    }
    console.log(`   ✅ 이미지 2 업로드 완료: ${testImage2}\n`);

    // 3. 갤러리 페이지로 이동
    console.log('3️⃣ 갤러리 페이지로 이동...');
    await page.goto('http://localhost:3000/admin/gallery');
    await page.waitForTimeout(5000);
    console.log('   ✅ 갤러리 페이지 로드 완료\n');

    // 4. 테스트 폴더 선택
    console.log(`4️⃣ 테스트 폴더 선택: ${TEST_FOLDER}...`);
    
    // 폴더 트리에서 해당 폴더 찾기 및 클릭
    const folderPathParts = TEST_FOLDER.split('/');
    let currentPath = '';
    
    for (const part of folderPathParts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      console.log(`   📁 폴더 클릭: ${part} (경로: ${currentPath})`);
      
      // 폴더 트리에서 해당 폴더 찾기
      const folderSelector = `text=${part}`;
      const folderElement = page.locator(folderSelector).first();
      
      if (await folderElement.isVisible({ timeout: 3000 })) {
        await folderElement.click();
        await page.waitForTimeout(500);
      } else {
        console.warn(`   ⚠️ 폴더 "${part}"를 찾을 수 없습니다. 계속 진행...`);
      }
    }
    
    await page.waitForTimeout(2000);
    console.log('   ✅ 폴더 선택 완료\n');

    // 5. 폴더 내 이미지 개수 확인 (삭제 전)
    console.log('5️⃣ 삭제 전 폴더 내 이미지 개수 확인...');
    
    const imagesBeforeDelete = await page.evaluate(() => {
      const imageElements = document.querySelectorAll('[data-image-id], img[src*="supabase"]');
      return Array.from(imageElements).map((el) => ({
        id: el.getAttribute('data-image-id') || el.getAttribute('id') || '',
        src: el.src || el.getAttribute('src') || '',
        name: el.alt || el.getAttribute('alt') || ''
      })).filter(img => img.src && img.src.includes('supabase'));
    });
    
    console.log(`   📊 삭제 전 이미지 개수: ${imagesBeforeDelete.length}개`);
    console.log(`   📊 테스트 이미지 포함 여부:`, {
      image1: imagesBeforeDelete.some(img => img.name.includes('test-compare-delete-1') || img.src.includes('test-compare-delete-1')),
      image2: imagesBeforeDelete.some(img => img.name.includes('test-compare-delete-2') || img.src.includes('test-compare-delete-2'))
    });
    console.log('');

    // 6. API로 폴더 내 이미지 목록 가져오기
    console.log('6️⃣ API로 폴더 내 이미지 목록 확인...');
    const apiResponse = await page.evaluate(async (folderPath) => {
      const response = await fetch(`/api/admin/all-images?folder=${encodeURIComponent(folderPath)}&includeChildren=false&forceRefresh=true&_t=${Date.now()}`);
      const data = await response.json();
      return data;
    }, TEST_FOLDER);
    
    console.log(`   📊 API 응답 - total: ${apiResponse.total}, files: ${apiResponse.files?.length || 0}개`);
    const testImagesInApi = (apiResponse.files || []).filter((f) => 
      f.name?.includes('test-compare-delete-1') || f.name?.includes('test-compare-delete-2')
    );
    console.log(`   📊 API에서 테스트 이미지 개수: ${testImagesInApi.length}개`);
    if (testImagesInApi.length > 0) {
      console.log(`   📊 테스트 이미지 ID:`, testImagesInApi.map((img) => ({ id: img.id, name: img.name })));
    }
    console.log('');

    // 7. 이미지 2개 선택 (테스트 이미지 우선, 없으면 처음 2개)
    console.log('7️⃣ 이미지 2개 선택...');
    
    const selectedImages = await page.evaluate(({ testImage1, testImage2 }) => {
      // 테스트 이미지 찾기
      const allImages = Array.from(document.querySelectorAll('[data-image-id], img[src*="supabase"]'));
      let image1Element = null;
      let image2Element = null;
      
      // 테스트 이미지 우선 찾기
      for (const el of allImages) {
        const src = el.src || el.getAttribute('src') || '';
        const name = el.alt || el.getAttribute('alt') || '';
        if (src.includes(testImage1) || name.includes(testImage1)) {
          image1Element = el;
        }
        if (src.includes(testImage2) || name.includes(testImage2)) {
          image2Element = el;
        }
      }
      
      // 테스트 이미지가 없으면 처음 2개 선택
      if (!image1Element && allImages.length > 0) {
        image1Element = allImages[0];
      }
      if (!image2Element && allImages.length > 1) {
        image2Element = allImages[1];
      }
      
      if (!image1Element || !image2Element) {
        return { success: false, message: '이미지 2개를 찾을 수 없습니다.' };
      }
      
      // 이미지 클릭하여 선택
      image1Element.click();
      setTimeout(() => {
        image2Element.click();
      }, 300);
      
      return { success: true, image1: image1Element, image2: image2Element };
    }, { testImage1, testImage2 });
    
    if (!selectedImages.success) {
      throw new Error(selectedImages.message);
    }
    
    await page.waitForTimeout(1000);
    console.log('   ✅ 이미지 2개 선택 완료\n');

    // 8. 비교 버튼 클릭
    console.log('8️⃣ 비교 버튼 클릭...');
    const compareButton = page.locator('button:has-text("비교"), button:has-text("Compare")').first();
    if (await compareButton.isVisible({ timeout: 3000 })) {
      await compareButton.click();
      await page.waitForTimeout(2000);
      console.log('   ✅ 비교 모달 열림\n');
    } else {
      throw new Error('비교 버튼을 찾을 수 없습니다.');
    }

    // 9. 비교 모달에서 첫 번째 이미지 삭제
    console.log('9️⃣ 비교 모달에서 첫 번째 이미지 삭제...');
    
    // 삭제 버튼 찾기 및 클릭
    const deleteButton = page.locator('button:has-text("삭제"), button[aria-label*="삭제"], button[title*="삭제"]').first();
    if (await deleteButton.isVisible({ timeout: 3000 })) {
      await deleteButton.click();
      await page.waitForTimeout(1000);
      
      // 확인 버튼 클릭
      const confirmButton = page.locator('button:has-text("확인"), button:has-text("삭제"), button:has-text("Yes")').first();
      if (await confirmButton.isVisible({ timeout: 3000 })) {
        await confirmButton.click();
        console.log('   ✅ 삭제 확인 버튼 클릭');
      }
    } else {
      console.warn('   ⚠️ 삭제 버튼을 찾을 수 없습니다. 직접 API 호출 시도...');
    }
    
    // 삭제 완료 대기
    await page.waitForTimeout(3000);
    console.log('   ✅ 삭제 프로세스 완료 대기\n');

    // 10. 삭제 후 폴더 내 이미지 개수 확인
    console.log('🔟 삭제 후 폴더 내 이미지 개수 확인...');
    
    // 비교 모달이 열려있으면 닫기
    const closeButton = page.locator('button:has-text("닫기"), button:has-text("Close"), button[aria-label*="닫기"]').first();
    if (await closeButton.isVisible({ timeout: 2000 })) {
      await closeButton.click();
      await page.waitForTimeout(1000);
    }
    
    // 페이지 새로고침 없이 현재 상태 확인
    await page.waitForTimeout(2000);
    
    const imagesAfterDelete = await page.evaluate(() => {
      const imageElements = document.querySelectorAll('[data-image-id], img[src*="supabase"]');
      return Array.from(imageElements).map((el) => ({
        id: el.getAttribute('data-image-id') || el.getAttribute('id') || '',
        src: el.src || el.getAttribute('src') || '',
        name: el.alt || el.getAttribute('alt') || ''
      })).filter(img => img.src && img.src.includes('supabase'));
    });
    
    console.log(`   📊 삭제 후 이미지 개수: ${imagesAfterDelete.length}개`);
    console.log(`   📊 삭제 전/후 차이: ${imagesBeforeDelete.length - imagesAfterDelete.length}개`);
    
    // API로 다시 확인
    const apiResponseAfter = await page.evaluate(async (folderPath) => {
      const response = await fetch(`/api/admin/all-images?folder=${encodeURIComponent(folderPath)}&includeChildren=false&forceRefresh=true&_t=${Date.now()}`);
      const data = await response.json();
      return data;
    }, TEST_FOLDER);
    
    console.log(`   📊 API 응답 (삭제 후) - total: ${apiResponseAfter.total}, files: ${apiResponseAfter.files?.length || 0}개`);
    console.log('');

    // 11. 문제 진단
    console.log('1️⃣1️⃣ 문제 진단...');
    const issueDetected = imagesAfterDelete.length === 0 && apiResponseAfter.total > 0;
    
    if (issueDetected) {
      console.log('   ❌ 문제 발견: UI에 이미지가 0개 표시되지만 API에는 이미지가 있습니다.');
      console.log(`   📊 API total: ${apiResponseAfter.total}, UI 이미지: ${imagesAfterDelete.length}개`);
    } else if (imagesAfterDelete.length < imagesBeforeDelete.length - 1) {
      console.log('   ⚠️ 부분 문제: 삭제된 이미지보다 더 많은 이미지가 사라졌습니다.');
      console.log(`   📊 삭제 전: ${imagesBeforeDelete.length}개, 삭제 후: ${imagesAfterDelete.length}개`);
    } else {
      console.log('   ✅ 정상: 삭제가 정상적으로 작동했습니다.');
    }
    console.log('');

    // 12. 로그 저장
    console.log('1️⃣2️⃣ 로그 저장...');
    const logData = {
      testFolder: TEST_FOLDER,
      testImages: [testImage1, testImage2],
      beforeDelete: {
        uiImages: imagesBeforeDelete.length,
        apiTotal: apiResponse.total,
        apiFiles: apiResponse.files?.length || 0
      },
      afterDelete: {
        uiImages: imagesAfterDelete.length,
        apiTotal: apiResponseAfter.total,
        apiFiles: apiResponseAfter.files?.length || 0
      },
      issueDetected,
      consoleLogs: consoleLogs.filter(log => 
        log.text.includes('fetchImages') || 
        log.text.includes('폴더 필터') ||
        log.text.includes('folderFilter') ||
        log.text.includes('compareResult') ||
        log.text.includes('삭제') ||
        log.type === 'error'
      )
    };
    
    const logPath = path.join(process.cwd(), `test-compare-delete-log-${Date.now()}.json`);
    fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));
    console.log(`   ✅ 로그 저장 완료: ${logPath}\n`);

    // 13. 정리 (테스트 이미지 삭제)
    console.log('1️⃣3️⃣ 테스트 이미지 정리...');
    try {
      await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([`${TEST_FOLDER}/${testImage1}`, `${TEST_FOLDER}/${testImage2}`]);
      console.log('   ✅ 테스트 이미지 삭제 완료\n');
    } catch (cleanupError) {
      console.warn('   ⚠️ 테스트 이미지 정리 실패:', cleanupError);
    }

    console.log('✅ 테스트 완료!');
    console.log('\n📋 결과 요약:');
    console.log(`   - 삭제 전 이미지: ${imagesBeforeDelete.length}개 (UI), ${apiResponse.total}개 (API)`);
    console.log(`   - 삭제 후 이미지: ${imagesAfterDelete.length}개 (UI), ${apiResponseAfter.total}개 (API)`);
    console.log(`   - 문제 발견: ${issueDetected ? '❌ 예' : '✅ 아니오'}`);
    
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
