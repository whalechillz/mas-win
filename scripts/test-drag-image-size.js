/**
 * 드래그 이미지 크기 테스트 스크립트
 * 128번 이미지와 170번 이미지의 드래그 크기를 확인
 */

require('dotenv').config({ path: '.env.local' });
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '010-6669-9000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '66699000';

async function testDragImageSize() {
  console.log('🧪 드래그 이미지 크기 테스트 시작...\n');
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // 스크린샷 저장 디렉토리 생성
  const screenshotsDir = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  try {
    // 1. 로그인
    console.log('📝 1단계: 로그인...\n');
    await page.goto(`${BASE_URL}/admin/login`);
    await page.waitForSelector('input[name="login"]', { timeout: 10000 });
    await page.fill('input[name="login"]', ADMIN_EMAIL);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/, { timeout: 15000 });
    console.log('✅ 로그인 완료\n');

    // 2. 갤러리 페이지로 이동
    console.log('📝 2단계: 갤러리 페이지로 이동...\n');
    await page.goto(`${BASE_URL}/admin/gallery`);
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    await page.waitForTimeout(3000);
    console.log('✅ 페이지 로드 완료\n');
    await page.screenshot({ path: 'screenshots/gallery-loaded.png', fullPage: true });
    
    // 페이지 구조 확인을 위한 디버깅
    const pageContent = await page.content();
    console.log('📋 페이지 구조 확인 중...\n');
    
    // draggable 요소가 있는지 확인
    const draggableCount = await page.locator('[draggable]').count();
    console.log(`📋 draggable 요소 개수: ${draggableCount}\n`);
    
    // 이미지 요소가 있는지 확인
    const imgCount = await page.locator('img').count();
    console.log(`📋 이미지 요소 개수: ${imgCount}\n`);

    // 3. 128번 이미지가 있는 폴더로 이동 (JavaScript로 폴더 필터 직접 설정)
    console.log('📝 3단계: 128번 이미지 폴더로 이동...\n');
    
    // JavaScript로 직접 폴더 필터 설정 시도
    await page.evaluate(() => {
      // React DevTools를 통해 상태 변경 시도
      const reactKey = Object.keys(window).find(key => key.startsWith('__REACT'));
      if (reactKey) {
        console.log('React DevTools 발견');
      }
      
      // 직접 DOM 이벤트 발생 시도
      const event = new CustomEvent('folderFilterChange', { 
        detail: { folder: 'originals/mms/2025-11-28/128' } 
      });
      window.dispatchEvent(event);
    });
    
    // 폴더 트리에서 클릭 시도 (더 관대한 선택자 사용)
    try {
      // 모든 클릭 가능한 요소 찾기
      const clickableElements = await page.locator('div, span, button').filter({ hasText: /originals|mms|2025-11-28|128/ }).all();
      console.log(`📋 클릭 가능한 폴더 요소: ${clickableElements.length}개\n`);
      
      // originals 텍스트가 포함된 요소 찾기
      for (const elem of clickableElements.slice(0, 10)) {
        const text = await elem.textContent();
        if (text && text.includes('originals')) {
          await elem.click();
          await page.waitForTimeout(500);
          break;
        }
      }
      
      await page.waitForTimeout(1000);
      
      // mms 텍스트가 포함된 요소 찾기
      for (const elem of clickableElements.slice(0, 20)) {
        const text = await elem.textContent();
        if (text && text.includes('mms') && !text.includes('originals')) {
          await elem.click();
          await page.waitForTimeout(500);
          break;
        }
      }
      
      await page.waitForTimeout(1000);
      
      // 2025-11-28 텍스트가 포함된 요소 찾기
      for (const elem of clickableElements) {
        const text = await elem.textContent();
        if (text && text.includes('2025-11-28')) {
          await elem.click();
          await page.waitForTimeout(1000);
          break;
        }
      }
      
      await page.waitForTimeout(1000);
      
      // 128 텍스트가 포함된 요소 찾기 (정확히 128만)
      const folder128Elements = await page.locator('div, span').filter({ hasText: /^128$/ }).all();
      if (folder128Elements.length > 0) {
        await folder128Elements[0].click();
        await page.waitForTimeout(2000);
      }
    } catch (err) {
      console.log('⚠️ 폴더 트리 클릭 실패:', err.message);
    }
    
    await page.waitForTimeout(3000);
    console.log('✅ 128번 폴더로 이동 완료\n');
    await page.screenshot({ path: 'screenshots/128-folder.png', fullPage: true });

    // 4. 128번 이미지 요소 찾기 및 드래그 시작
    console.log('📝 4단계: 128번 이미지 드래그 테스트...\n');
    
    // 드래그 가능한 요소 찾기 (더 관대한 대기)
    const draggableSelector = '[draggable="true"], [draggable]';
    let allDraggable = [];
    
    try {
      await page.waitForSelector(draggableSelector, { timeout: 15000 });
      allDraggable = await page.locator(draggableSelector).all();
    } catch (err) {
      console.log('⚠️ draggable 요소를 찾을 수 없습니다. 모든 div 요소 확인:', err.message);
      // 대체: 모든 div 요소 확인
      const allDivs = await page.locator('div').all();
      console.log(`📋 전체 div 요소: ${allDivs.length}개\n`);
      
      // 이미지가 포함된 div 찾기
      for (const div of allDivs.slice(0, 50)) {
        const hasImg = await div.locator('img').count();
        if (hasImg > 0) {
          allDraggable.push(div);
        }
      }
    }
    
    console.log(`📋 드래그 가능한 요소: ${allDraggable.length}개\n`);
    
    if (allDraggable.length > 0) {
      // 첫 번째 이미지 사용 (128번 폴더에 있는 이미지)
      const firstImage = allDraggable[0];
      const imageInfo = await firstImage.evaluate((el) => {
        const img = el.querySelector('img');
        return {
          src: img?.src || '',
          alt: img?.alt || '',
          naturalWidth: img?.naturalWidth || 0,
          naturalHeight: img?.naturalHeight || 0,
          complete: img?.complete || false,
          width: img?.width || 0,
          height: img?.height || 0
        };
      });
      console.log('📸 128번 이미지 정보:', imageInfo);
      
      // 드래그 시작
      const box = await firstImage.boundingBox();
      if (box) {
        console.log(`📍 이미지 위치: x=${box.x}, y=${box.y}, width=${box.width}, height=${box.height}\n`);
        
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(500);
        
        // 드래그 중 스크린샷
        await page.screenshot({ path: 'screenshots/128-dragging.png' });
        console.log('✅ 128번 이미지 드래그 중 스크린샷 저장\n');
        
        // 마우스 이동 (드래그 시뮬레이션)
        await page.mouse.move(box.x + 200, box.y + 200);
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'screenshots/128-dragging-moved.png' });
        console.log('✅ 128번 이미지 드래그 이동 스크린샷 저장\n');
        
        await page.mouse.up();
        await page.waitForTimeout(500);
      } else {
        console.log('⚠️ 이미지 요소의 boundingBox를 가져올 수 없습니다.\n');
      }
    } else {
      console.log('⚠️ 드래그 가능한 이미지를 찾을 수 없습니다.\n');
    }

    // 5. 170번 이미지가 있는 폴더로 이동
    console.log('📝 5단계: 170번 이미지 폴더로 이동...\n');
    
    // 갤러리 페이지로 다시 이동
    await page.goto(`${BASE_URL}/admin/gallery`);
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    await page.waitForTimeout(2000);
    
    // 폴더 트리에서 직접 클릭 시도
    try {
      // originals 폴더 확장
      await page.waitForSelector('text=originals', { timeout: 5000 });
      const originalsFolder = page.locator('text=originals').first();
      if (await originalsFolder.count() > 0) {
        await originalsFolder.click();
        await page.waitForTimeout(500);
      }
      
      // mms 폴더 클릭
      await page.waitForSelector('text=mms', { timeout: 5000 });
      const mmsFolder = page.locator('text=mms').first();
      if (await mmsFolder.count() > 0) {
        await mmsFolder.click();
        await page.waitForTimeout(500);
      }
      
      // 2025-12-05 폴더 클릭
      await page.waitForSelector('text=2025-12-05', { timeout: 5000 });
      const dateFolder = page.locator('text=2025-12-05').first();
      if (await dateFolder.count() > 0) {
        await dateFolder.click();
        await page.waitForTimeout(1000);
      }
      
      // 170 폴더 클릭
      await page.waitForSelector('text=/^170$/', { timeout: 5000 });
      const folder170 = page.locator('text=/^170$/').first();
      if (await folder170.count() > 0) {
        await folder170.click();
        await page.waitForTimeout(2000);
      }
    } catch (err) {
      console.log('⚠️ 폴더 트리 클릭 실패:', err.message);
    }
    
    await page.waitForTimeout(3000);
    console.log('✅ 170번 폴더로 이동 완료\n');
    await page.screenshot({ path: 'screenshots/170-folder.png' });

    // 6. 170번 이미지 드래그 테스트
    console.log('📝 6단계: 170번 이미지 드래그 테스트...\n');
    
    const draggableSelector170 = 'div[draggable="true"]';
    await page.waitForSelector(draggableSelector170, { timeout: 10000 });
    
    const allDraggable170 = await page.locator(draggableSelector170).all();
    console.log(`📋 드래그 가능한 요소: ${allDraggable170.length}개\n`);
    
    if (allDraggable170.length > 0) {
      // 첫 번째 이미지 사용 (170번 폴더에 있는 이미지)
      const firstImage170 = allDraggable170[0];
      const imageInfo170 = await firstImage170.evaluate((el) => {
        const img = el.querySelector('img');
        return {
          src: img?.src || '',
          alt: img?.alt || '',
          naturalWidth: img?.naturalWidth || 0,
          naturalHeight: img?.naturalHeight || 0,
          complete: img?.complete || false,
          width: img?.width || 0,
          height: img?.height || 0
        };
      });
      console.log('📸 170번 이미지 정보:', imageInfo170);
      
      // 드래그 시작
      const box170 = await firstImage170.boundingBox();
      if (box170) {
        console.log(`📍 이미지 위치: x=${box170.x}, y=${box170.y}, width=${box170.width}, height=${box170.height}\n`);
        
        await page.mouse.move(box170.x + box170.width / 2, box170.y + box170.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(500);
        
        // 드래그 중 스크린샷
        await page.screenshot({ path: 'screenshots/170-dragging.png' });
        console.log('✅ 170번 이미지 드래그 중 스크린샷 저장\n');
        
        // 마우스 이동 (드래그 시뮬레이션)
        await page.mouse.move(box170.x + 200, box170.y + 200);
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'screenshots/170-dragging-moved.png' });
        console.log('✅ 170번 이미지 드래그 이동 스크린샷 저장\n');
        
        await page.mouse.up();
        await page.waitForTimeout(500);
      } else {
        console.log('⚠️ 이미지 요소의 boundingBox를 가져올 수 없습니다.\n');
      }
    } else {
      console.log('⚠️ 드래그 가능한 이미지를 찾을 수 없습니다.\n');
    }

    // 7. 콘솔 로그 확인
    console.log('📝 7단계: 콘솔 로그 확인...\n');
    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('드래그') || text.includes('drag') || text.includes('CORS') || text.includes('이미지')) {
        consoleLogs.push(text);
      }
    });
    
    await page.waitForTimeout(2000);
    
    if (consoleLogs.length > 0) {
      console.log(`✅ 관련 콘솔 로그 ${consoleLogs.length}개:\n`);
      consoleLogs.forEach(log => console.log(`  - ${log}`));
    } else {
      console.log('✅ 관련 콘솔 로그 없음\n');
    }

    console.log('\n⏳ 5초 대기 중... (스크린샷 확인)\n');
    await page.waitForTimeout(5000);

    console.log('✅ 테스트 완료!\n');
    console.log('📸 스크린샷 위치: screenshots/');
    console.log('  - 128-dragging.png: 128번 이미지 드래그 중');
    console.log('  - 170-dragging.png: 170번 이미지 드래그 중\n');

  } catch (error) {
    console.error('❌ 테스트 오류:', error);
    await page.screenshot({ path: 'screenshots/error.png' });
  } finally {
    await browser.close();
  }
}

testDragImageSize();


 * 128번 이미지와 170번 이미지의 드래그 크기를 확인
 */

require('dotenv').config({ path: '.env.local' });
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '010-6669-9000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '66699000';

async function testDragImageSize() {
  console.log('🧪 드래그 이미지 크기 테스트 시작...\n');
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // 스크린샷 저장 디렉토리 생성
  const screenshotsDir = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  try {
    // 1. 로그인
    console.log('📝 1단계: 로그인...\n');
    await page.goto(`${BASE_URL}/admin/login`);
    await page.waitForSelector('input[name="login"]', { timeout: 10000 });
    await page.fill('input[name="login"]', ADMIN_EMAIL);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/, { timeout: 15000 });
    console.log('✅ 로그인 완료\n');

    // 2. 갤러리 페이지로 이동
    console.log('📝 2단계: 갤러리 페이지로 이동...\n');
    await page.goto(`${BASE_URL}/admin/gallery`);
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    await page.waitForTimeout(3000);
    console.log('✅ 페이지 로드 완료\n');
    await page.screenshot({ path: 'screenshots/gallery-loaded.png', fullPage: true });
    
    // 페이지 구조 확인을 위한 디버깅
    const pageContent = await page.content();
    console.log('📋 페이지 구조 확인 중...\n');
    
    // draggable 요소가 있는지 확인
    const draggableCount = await page.locator('[draggable]').count();
    console.log(`📋 draggable 요소 개수: ${draggableCount}\n`);
    
    // 이미지 요소가 있는지 확인
    const imgCount = await page.locator('img').count();
    console.log(`📋 이미지 요소 개수: ${imgCount}\n`);

    // 3. 128번 이미지가 있는 폴더로 이동 (JavaScript로 폴더 필터 직접 설정)
    console.log('📝 3단계: 128번 이미지 폴더로 이동...\n');
    
    // JavaScript로 직접 폴더 필터 설정 시도
    await page.evaluate(() => {
      // React DevTools를 통해 상태 변경 시도
      const reactKey = Object.keys(window).find(key => key.startsWith('__REACT'));
      if (reactKey) {
        console.log('React DevTools 발견');
      }
      
      // 직접 DOM 이벤트 발생 시도
      const event = new CustomEvent('folderFilterChange', { 
        detail: { folder: 'originals/mms/2025-11-28/128' } 
      });
      window.dispatchEvent(event);
    });
    
    // 폴더 트리에서 클릭 시도 (더 관대한 선택자 사용)
    try {
      // 모든 클릭 가능한 요소 찾기
      const clickableElements = await page.locator('div, span, button').filter({ hasText: /originals|mms|2025-11-28|128/ }).all();
      console.log(`📋 클릭 가능한 폴더 요소: ${clickableElements.length}개\n`);
      
      // originals 텍스트가 포함된 요소 찾기
      for (const elem of clickableElements.slice(0, 10)) {
        const text = await elem.textContent();
        if (text && text.includes('originals')) {
          await elem.click();
          await page.waitForTimeout(500);
          break;
        }
      }
      
      await page.waitForTimeout(1000);
      
      // mms 텍스트가 포함된 요소 찾기
      for (const elem of clickableElements.slice(0, 20)) {
        const text = await elem.textContent();
        if (text && text.includes('mms') && !text.includes('originals')) {
          await elem.click();
          await page.waitForTimeout(500);
          break;
        }
      }
      
      await page.waitForTimeout(1000);
      
      // 2025-11-28 텍스트가 포함된 요소 찾기
      for (const elem of clickableElements) {
        const text = await elem.textContent();
        if (text && text.includes('2025-11-28')) {
          await elem.click();
          await page.waitForTimeout(1000);
          break;
        }
      }
      
      await page.waitForTimeout(1000);
      
      // 128 텍스트가 포함된 요소 찾기 (정확히 128만)
      const folder128Elements = await page.locator('div, span').filter({ hasText: /^128$/ }).all();
      if (folder128Elements.length > 0) {
        await folder128Elements[0].click();
        await page.waitForTimeout(2000);
      }
    } catch (err) {
      console.log('⚠️ 폴더 트리 클릭 실패:', err.message);
    }
    
    await page.waitForTimeout(3000);
    console.log('✅ 128번 폴더로 이동 완료\n');
    await page.screenshot({ path: 'screenshots/128-folder.png', fullPage: true });

    // 4. 128번 이미지 요소 찾기 및 드래그 시작
    console.log('📝 4단계: 128번 이미지 드래그 테스트...\n');
    
    // 드래그 가능한 요소 찾기 (더 관대한 대기)
    const draggableSelector = '[draggable="true"], [draggable]';
    let allDraggable = [];
    
    try {
      await page.waitForSelector(draggableSelector, { timeout: 15000 });
      allDraggable = await page.locator(draggableSelector).all();
    } catch (err) {
      console.log('⚠️ draggable 요소를 찾을 수 없습니다. 모든 div 요소 확인:', err.message);
      // 대체: 모든 div 요소 확인
      const allDivs = await page.locator('div').all();
      console.log(`📋 전체 div 요소: ${allDivs.length}개\n`);
      
      // 이미지가 포함된 div 찾기
      for (const div of allDivs.slice(0, 50)) {
        const hasImg = await div.locator('img').count();
        if (hasImg > 0) {
          allDraggable.push(div);
        }
      }
    }
    
    console.log(`📋 드래그 가능한 요소: ${allDraggable.length}개\n`);
    
    if (allDraggable.length > 0) {
      // 첫 번째 이미지 사용 (128번 폴더에 있는 이미지)
      const firstImage = allDraggable[0];
      const imageInfo = await firstImage.evaluate((el) => {
        const img = el.querySelector('img');
        return {
          src: img?.src || '',
          alt: img?.alt || '',
          naturalWidth: img?.naturalWidth || 0,
          naturalHeight: img?.naturalHeight || 0,
          complete: img?.complete || false,
          width: img?.width || 0,
          height: img?.height || 0
        };
      });
      console.log('📸 128번 이미지 정보:', imageInfo);
      
      // 드래그 시작
      const box = await firstImage.boundingBox();
      if (box) {
        console.log(`📍 이미지 위치: x=${box.x}, y=${box.y}, width=${box.width}, height=${box.height}\n`);
        
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(500);
        
        // 드래그 중 스크린샷
        await page.screenshot({ path: 'screenshots/128-dragging.png' });
        console.log('✅ 128번 이미지 드래그 중 스크린샷 저장\n');
        
        // 마우스 이동 (드래그 시뮬레이션)
        await page.mouse.move(box.x + 200, box.y + 200);
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'screenshots/128-dragging-moved.png' });
        console.log('✅ 128번 이미지 드래그 이동 스크린샷 저장\n');
        
        await page.mouse.up();
        await page.waitForTimeout(500);
      } else {
        console.log('⚠️ 이미지 요소의 boundingBox를 가져올 수 없습니다.\n');
      }
    } else {
      console.log('⚠️ 드래그 가능한 이미지를 찾을 수 없습니다.\n');
    }

    // 5. 170번 이미지가 있는 폴더로 이동
    console.log('📝 5단계: 170번 이미지 폴더로 이동...\n');
    
    // 갤러리 페이지로 다시 이동
    await page.goto(`${BASE_URL}/admin/gallery`);
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    await page.waitForTimeout(2000);
    
    // 폴더 트리에서 직접 클릭 시도
    try {
      // originals 폴더 확장
      await page.waitForSelector('text=originals', { timeout: 5000 });
      const originalsFolder = page.locator('text=originals').first();
      if (await originalsFolder.count() > 0) {
        await originalsFolder.click();
        await page.waitForTimeout(500);
      }
      
      // mms 폴더 클릭
      await page.waitForSelector('text=mms', { timeout: 5000 });
      const mmsFolder = page.locator('text=mms').first();
      if (await mmsFolder.count() > 0) {
        await mmsFolder.click();
        await page.waitForTimeout(500);
      }
      
      // 2025-12-05 폴더 클릭
      await page.waitForSelector('text=2025-12-05', { timeout: 5000 });
      const dateFolder = page.locator('text=2025-12-05').first();
      if (await dateFolder.count() > 0) {
        await dateFolder.click();
        await page.waitForTimeout(1000);
      }
      
      // 170 폴더 클릭
      await page.waitForSelector('text=/^170$/', { timeout: 5000 });
      const folder170 = page.locator('text=/^170$/').first();
      if (await folder170.count() > 0) {
        await folder170.click();
        await page.waitForTimeout(2000);
      }
    } catch (err) {
      console.log('⚠️ 폴더 트리 클릭 실패:', err.message);
    }
    
    await page.waitForTimeout(3000);
    console.log('✅ 170번 폴더로 이동 완료\n');
    await page.screenshot({ path: 'screenshots/170-folder.png' });

    // 6. 170번 이미지 드래그 테스트
    console.log('📝 6단계: 170번 이미지 드래그 테스트...\n');
    
    const draggableSelector170 = 'div[draggable="true"]';
    await page.waitForSelector(draggableSelector170, { timeout: 10000 });
    
    const allDraggable170 = await page.locator(draggableSelector170).all();
    console.log(`📋 드래그 가능한 요소: ${allDraggable170.length}개\n`);
    
    if (allDraggable170.length > 0) {
      // 첫 번째 이미지 사용 (170번 폴더에 있는 이미지)
      const firstImage170 = allDraggable170[0];
      const imageInfo170 = await firstImage170.evaluate((el) => {
        const img = el.querySelector('img');
        return {
          src: img?.src || '',
          alt: img?.alt || '',
          naturalWidth: img?.naturalWidth || 0,
          naturalHeight: img?.naturalHeight || 0,
          complete: img?.complete || false,
          width: img?.width || 0,
          height: img?.height || 0
        };
      });
      console.log('📸 170번 이미지 정보:', imageInfo170);
      
      // 드래그 시작
      const box170 = await firstImage170.boundingBox();
      if (box170) {
        console.log(`📍 이미지 위치: x=${box170.x}, y=${box170.y}, width=${box170.width}, height=${box170.height}\n`);
        
        await page.mouse.move(box170.x + box170.width / 2, box170.y + box170.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(500);
        
        // 드래그 중 스크린샷
        await page.screenshot({ path: 'screenshots/170-dragging.png' });
        console.log('✅ 170번 이미지 드래그 중 스크린샷 저장\n');
        
        // 마우스 이동 (드래그 시뮬레이션)
        await page.mouse.move(box170.x + 200, box170.y + 200);
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'screenshots/170-dragging-moved.png' });
        console.log('✅ 170번 이미지 드래그 이동 스크린샷 저장\n');
        
        await page.mouse.up();
        await page.waitForTimeout(500);
      } else {
        console.log('⚠️ 이미지 요소의 boundingBox를 가져올 수 없습니다.\n');
      }
    } else {
      console.log('⚠️ 드래그 가능한 이미지를 찾을 수 없습니다.\n');
    }

    // 7. 콘솔 로그 확인
    console.log('📝 7단계: 콘솔 로그 확인...\n');
    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('드래그') || text.includes('drag') || text.includes('CORS') || text.includes('이미지')) {
        consoleLogs.push(text);
      }
    });
    
    await page.waitForTimeout(2000);
    
    if (consoleLogs.length > 0) {
      console.log(`✅ 관련 콘솔 로그 ${consoleLogs.length}개:\n`);
      consoleLogs.forEach(log => console.log(`  - ${log}`));
    } else {
      console.log('✅ 관련 콘솔 로그 없음\n');
    }

    console.log('\n⏳ 5초 대기 중... (스크린샷 확인)\n');
    await page.waitForTimeout(5000);

    console.log('✅ 테스트 완료!\n');
    console.log('📸 스크린샷 위치: screenshots/');
    console.log('  - 128-dragging.png: 128번 이미지 드래그 중');
    console.log('  - 170-dragging.png: 170번 이미지 드래그 중\n');

  } catch (error) {
    console.error('❌ 테스트 오류:', error);
    await page.screenshot({ path: 'screenshots/error.png' });
  } finally {
    await browser.close();
  }
}

testDragImageSize();


 * 128번 이미지와 170번 이미지의 드래그 크기를 확인
 */

require('dotenv').config({ path: '.env.local' });
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '010-6669-9000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '66699000';

async function testDragImageSize() {
  console.log('🧪 드래그 이미지 크기 테스트 시작...\n');
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // 스크린샷 저장 디렉토리 생성
  const screenshotsDir = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  try {
    // 1. 로그인
    console.log('📝 1단계: 로그인...\n');
    await page.goto(`${BASE_URL}/admin/login`);
    await page.waitForSelector('input[name="login"]', { timeout: 10000 });
    await page.fill('input[name="login"]', ADMIN_EMAIL);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/, { timeout: 15000 });
    console.log('✅ 로그인 완료\n');

    // 2. 갤러리 페이지로 이동
    console.log('📝 2단계: 갤러리 페이지로 이동...\n');
    await page.goto(`${BASE_URL}/admin/gallery`);
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    await page.waitForTimeout(3000);
    console.log('✅ 페이지 로드 완료\n');
    await page.screenshot({ path: 'screenshots/gallery-loaded.png', fullPage: true });
    
    // 페이지 구조 확인을 위한 디버깅
    const pageContent = await page.content();
    console.log('📋 페이지 구조 확인 중...\n');
    
    // draggable 요소가 있는지 확인
    const draggableCount = await page.locator('[draggable]').count();
    console.log(`📋 draggable 요소 개수: ${draggableCount}\n`);
    
    // 이미지 요소가 있는지 확인
    const imgCount = await page.locator('img').count();
    console.log(`📋 이미지 요소 개수: ${imgCount}\n`);

    // 3. 128번 이미지가 있는 폴더로 이동 (JavaScript로 폴더 필터 직접 설정)
    console.log('📝 3단계: 128번 이미지 폴더로 이동...\n');
    
    // JavaScript로 직접 폴더 필터 설정 시도
    await page.evaluate(() => {
      // React DevTools를 통해 상태 변경 시도
      const reactKey = Object.keys(window).find(key => key.startsWith('__REACT'));
      if (reactKey) {
        console.log('React DevTools 발견');
      }
      
      // 직접 DOM 이벤트 발생 시도
      const event = new CustomEvent('folderFilterChange', { 
        detail: { folder: 'originals/mms/2025-11-28/128' } 
      });
      window.dispatchEvent(event);
    });
    
    // 폴더 트리에서 클릭 시도 (더 관대한 선택자 사용)
    try {
      // 모든 클릭 가능한 요소 찾기
      const clickableElements = await page.locator('div, span, button').filter({ hasText: /originals|mms|2025-11-28|128/ }).all();
      console.log(`📋 클릭 가능한 폴더 요소: ${clickableElements.length}개\n`);
      
      // originals 텍스트가 포함된 요소 찾기
      for (const elem of clickableElements.slice(0, 10)) {
        const text = await elem.textContent();
        if (text && text.includes('originals')) {
          await elem.click();
          await page.waitForTimeout(500);
          break;
        }
      }
      
      await page.waitForTimeout(1000);
      
      // mms 텍스트가 포함된 요소 찾기
      for (const elem of clickableElements.slice(0, 20)) {
        const text = await elem.textContent();
        if (text && text.includes('mms') && !text.includes('originals')) {
          await elem.click();
          await page.waitForTimeout(500);
          break;
        }
      }
      
      await page.waitForTimeout(1000);
      
      // 2025-11-28 텍스트가 포함된 요소 찾기
      for (const elem of clickableElements) {
        const text = await elem.textContent();
        if (text && text.includes('2025-11-28')) {
          await elem.click();
          await page.waitForTimeout(1000);
          break;
        }
      }
      
      await page.waitForTimeout(1000);
      
      // 128 텍스트가 포함된 요소 찾기 (정확히 128만)
      const folder128Elements = await page.locator('div, span').filter({ hasText: /^128$/ }).all();
      if (folder128Elements.length > 0) {
        await folder128Elements[0].click();
        await page.waitForTimeout(2000);
      }
    } catch (err) {
      console.log('⚠️ 폴더 트리 클릭 실패:', err.message);
    }
    
    await page.waitForTimeout(3000);
    console.log('✅ 128번 폴더로 이동 완료\n');
    await page.screenshot({ path: 'screenshots/128-folder.png', fullPage: true });

    // 4. 128번 이미지 요소 찾기 및 드래그 시작
    console.log('📝 4단계: 128번 이미지 드래그 테스트...\n');
    
    // 드래그 가능한 요소 찾기 (더 관대한 대기)
    const draggableSelector = '[draggable="true"], [draggable]';
    let allDraggable = [];
    
    try {
      await page.waitForSelector(draggableSelector, { timeout: 15000 });
      allDraggable = await page.locator(draggableSelector).all();
    } catch (err) {
      console.log('⚠️ draggable 요소를 찾을 수 없습니다. 모든 div 요소 확인:', err.message);
      // 대체: 모든 div 요소 확인
      const allDivs = await page.locator('div').all();
      console.log(`📋 전체 div 요소: ${allDivs.length}개\n`);
      
      // 이미지가 포함된 div 찾기
      for (const div of allDivs.slice(0, 50)) {
        const hasImg = await div.locator('img').count();
        if (hasImg > 0) {
          allDraggable.push(div);
        }
      }
    }
    
    console.log(`📋 드래그 가능한 요소: ${allDraggable.length}개\n`);
    
    if (allDraggable.length > 0) {
      // 첫 번째 이미지 사용 (128번 폴더에 있는 이미지)
      const firstImage = allDraggable[0];
      const imageInfo = await firstImage.evaluate((el) => {
        const img = el.querySelector('img');
        return {
          src: img?.src || '',
          alt: img?.alt || '',
          naturalWidth: img?.naturalWidth || 0,
          naturalHeight: img?.naturalHeight || 0,
          complete: img?.complete || false,
          width: img?.width || 0,
          height: img?.height || 0
        };
      });
      console.log('📸 128번 이미지 정보:', imageInfo);
      
      // 드래그 시작
      const box = await firstImage.boundingBox();
      if (box) {
        console.log(`📍 이미지 위치: x=${box.x}, y=${box.y}, width=${box.width}, height=${box.height}\n`);
        
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(500);
        
        // 드래그 중 스크린샷
        await page.screenshot({ path: 'screenshots/128-dragging.png' });
        console.log('✅ 128번 이미지 드래그 중 스크린샷 저장\n');
        
        // 마우스 이동 (드래그 시뮬레이션)
        await page.mouse.move(box.x + 200, box.y + 200);
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'screenshots/128-dragging-moved.png' });
        console.log('✅ 128번 이미지 드래그 이동 스크린샷 저장\n');
        
        await page.mouse.up();
        await page.waitForTimeout(500);
      } else {
        console.log('⚠️ 이미지 요소의 boundingBox를 가져올 수 없습니다.\n');
      }
    } else {
      console.log('⚠️ 드래그 가능한 이미지를 찾을 수 없습니다.\n');
    }

    // 5. 170번 이미지가 있는 폴더로 이동
    console.log('📝 5단계: 170번 이미지 폴더로 이동...\n');
    
    // 갤러리 페이지로 다시 이동
    await page.goto(`${BASE_URL}/admin/gallery`);
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    await page.waitForTimeout(2000);
    
    // 폴더 트리에서 직접 클릭 시도
    try {
      // originals 폴더 확장
      await page.waitForSelector('text=originals', { timeout: 5000 });
      const originalsFolder = page.locator('text=originals').first();
      if (await originalsFolder.count() > 0) {
        await originalsFolder.click();
        await page.waitForTimeout(500);
      }
      
      // mms 폴더 클릭
      await page.waitForSelector('text=mms', { timeout: 5000 });
      const mmsFolder = page.locator('text=mms').first();
      if (await mmsFolder.count() > 0) {
        await mmsFolder.click();
        await page.waitForTimeout(500);
      }
      
      // 2025-12-05 폴더 클릭
      await page.waitForSelector('text=2025-12-05', { timeout: 5000 });
      const dateFolder = page.locator('text=2025-12-05').first();
      if (await dateFolder.count() > 0) {
        await dateFolder.click();
        await page.waitForTimeout(1000);
      }
      
      // 170 폴더 클릭
      await page.waitForSelector('text=/^170$/', { timeout: 5000 });
      const folder170 = page.locator('text=/^170$/').first();
      if (await folder170.count() > 0) {
        await folder170.click();
        await page.waitForTimeout(2000);
      }
    } catch (err) {
      console.log('⚠️ 폴더 트리 클릭 실패:', err.message);
    }
    
    await page.waitForTimeout(3000);
    console.log('✅ 170번 폴더로 이동 완료\n');
    await page.screenshot({ path: 'screenshots/170-folder.png' });

    // 6. 170번 이미지 드래그 테스트
    console.log('📝 6단계: 170번 이미지 드래그 테스트...\n');
    
    const draggableSelector170 = 'div[draggable="true"]';
    await page.waitForSelector(draggableSelector170, { timeout: 10000 });
    
    const allDraggable170 = await page.locator(draggableSelector170).all();
    console.log(`📋 드래그 가능한 요소: ${allDraggable170.length}개\n`);
    
    if (allDraggable170.length > 0) {
      // 첫 번째 이미지 사용 (170번 폴더에 있는 이미지)
      const firstImage170 = allDraggable170[0];
      const imageInfo170 = await firstImage170.evaluate((el) => {
        const img = el.querySelector('img');
        return {
          src: img?.src || '',
          alt: img?.alt || '',
          naturalWidth: img?.naturalWidth || 0,
          naturalHeight: img?.naturalHeight || 0,
          complete: img?.complete || false,
          width: img?.width || 0,
          height: img?.height || 0
        };
      });
      console.log('📸 170번 이미지 정보:', imageInfo170);
      
      // 드래그 시작
      const box170 = await firstImage170.boundingBox();
      if (box170) {
        console.log(`📍 이미지 위치: x=${box170.x}, y=${box170.y}, width=${box170.width}, height=${box170.height}\n`);
        
        await page.mouse.move(box170.x + box170.width / 2, box170.y + box170.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(500);
        
        // 드래그 중 스크린샷
        await page.screenshot({ path: 'screenshots/170-dragging.png' });
        console.log('✅ 170번 이미지 드래그 중 스크린샷 저장\n');
        
        // 마우스 이동 (드래그 시뮬레이션)
        await page.mouse.move(box170.x + 200, box170.y + 200);
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'screenshots/170-dragging-moved.png' });
        console.log('✅ 170번 이미지 드래그 이동 스크린샷 저장\n');
        
        await page.mouse.up();
        await page.waitForTimeout(500);
      } else {
        console.log('⚠️ 이미지 요소의 boundingBox를 가져올 수 없습니다.\n');
      }
    } else {
      console.log('⚠️ 드래그 가능한 이미지를 찾을 수 없습니다.\n');
    }

    // 7. 콘솔 로그 확인
    console.log('📝 7단계: 콘솔 로그 확인...\n');
    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('드래그') || text.includes('drag') || text.includes('CORS') || text.includes('이미지')) {
        consoleLogs.push(text);
      }
    });
    
    await page.waitForTimeout(2000);
    
    if (consoleLogs.length > 0) {
      console.log(`✅ 관련 콘솔 로그 ${consoleLogs.length}개:\n`);
      consoleLogs.forEach(log => console.log(`  - ${log}`));
    } else {
      console.log('✅ 관련 콘솔 로그 없음\n');
    }

    console.log('\n⏳ 5초 대기 중... (스크린샷 확인)\n');
    await page.waitForTimeout(5000);

    console.log('✅ 테스트 완료!\n');
    console.log('📸 스크린샷 위치: screenshots/');
    console.log('  - 128-dragging.png: 128번 이미지 드래그 중');
    console.log('  - 170-dragging.png: 170번 이미지 드래그 중\n');

  } catch (error) {
    console.error('❌ 테스트 오류:', error);
    await page.screenshot({ path: 'screenshots/error.png' });
  } finally {
    await browser.close();
  }
}

testDragImageSize();


 * 128번 이미지와 170번 이미지의 드래그 크기를 확인
 */

require('dotenv').config({ path: '.env.local' });
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '010-6669-9000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '66699000';

async function testDragImageSize() {
  console.log('🧪 드래그 이미지 크기 테스트 시작...\n');
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // 스크린샷 저장 디렉토리 생성
  const screenshotsDir = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  try {
    // 1. 로그인
    console.log('📝 1단계: 로그인...\n');
    await page.goto(`${BASE_URL}/admin/login`);
    await page.waitForSelector('input[name="login"]', { timeout: 10000 });
    await page.fill('input[name="login"]', ADMIN_EMAIL);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/, { timeout: 15000 });
    console.log('✅ 로그인 완료\n');

    // 2. 갤러리 페이지로 이동
    console.log('📝 2단계: 갤러리 페이지로 이동...\n');
    await page.goto(`${BASE_URL}/admin/gallery`);
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    await page.waitForTimeout(3000);
    console.log('✅ 페이지 로드 완료\n');
    await page.screenshot({ path: 'screenshots/gallery-loaded.png', fullPage: true });
    
    // 페이지 구조 확인을 위한 디버깅
    const pageContent = await page.content();
    console.log('📋 페이지 구조 확인 중...\n');
    
    // draggable 요소가 있는지 확인
    const draggableCount = await page.locator('[draggable]').count();
    console.log(`📋 draggable 요소 개수: ${draggableCount}\n`);
    
    // 이미지 요소가 있는지 확인
    const imgCount = await page.locator('img').count();
    console.log(`📋 이미지 요소 개수: ${imgCount}\n`);

    // 3. 128번 이미지가 있는 폴더로 이동 (JavaScript로 폴더 필터 직접 설정)
    console.log('📝 3단계: 128번 이미지 폴더로 이동...\n');
    
    // JavaScript로 직접 폴더 필터 설정 시도
    await page.evaluate(() => {
      // React DevTools를 통해 상태 변경 시도
      const reactKey = Object.keys(window).find(key => key.startsWith('__REACT'));
      if (reactKey) {
        console.log('React DevTools 발견');
      }
      
      // 직접 DOM 이벤트 발생 시도
      const event = new CustomEvent('folderFilterChange', { 
        detail: { folder: 'originals/mms/2025-11-28/128' } 
      });
      window.dispatchEvent(event);
    });
    
    // 폴더 트리에서 클릭 시도 (더 관대한 선택자 사용)
    try {
      // 모든 클릭 가능한 요소 찾기
      const clickableElements = await page.locator('div, span, button').filter({ hasText: /originals|mms|2025-11-28|128/ }).all();
      console.log(`📋 클릭 가능한 폴더 요소: ${clickableElements.length}개\n`);
      
      // originals 텍스트가 포함된 요소 찾기
      for (const elem of clickableElements.slice(0, 10)) {
        const text = await elem.textContent();
        if (text && text.includes('originals')) {
          await elem.click();
          await page.waitForTimeout(500);
          break;
        }
      }
      
      await page.waitForTimeout(1000);
      
      // mms 텍스트가 포함된 요소 찾기
      for (const elem of clickableElements.slice(0, 20)) {
        const text = await elem.textContent();
        if (text && text.includes('mms') && !text.includes('originals')) {
          await elem.click();
          await page.waitForTimeout(500);
          break;
        }
      }
      
      await page.waitForTimeout(1000);
      
      // 2025-11-28 텍스트가 포함된 요소 찾기
      for (const elem of clickableElements) {
        const text = await elem.textContent();
        if (text && text.includes('2025-11-28')) {
          await elem.click();
          await page.waitForTimeout(1000);
          break;
        }
      }
      
      await page.waitForTimeout(1000);
      
      // 128 텍스트가 포함된 요소 찾기 (정확히 128만)
      const folder128Elements = await page.locator('div, span').filter({ hasText: /^128$/ }).all();
      if (folder128Elements.length > 0) {
        await folder128Elements[0].click();
        await page.waitForTimeout(2000);
      }
    } catch (err) {
      console.log('⚠️ 폴더 트리 클릭 실패:', err.message);
    }
    
    await page.waitForTimeout(3000);
    console.log('✅ 128번 폴더로 이동 완료\n');
    await page.screenshot({ path: 'screenshots/128-folder.png', fullPage: true });

    // 4. 128번 이미지 요소 찾기 및 드래그 시작
    console.log('📝 4단계: 128번 이미지 드래그 테스트...\n');
    
    // 드래그 가능한 요소 찾기 (더 관대한 대기)
    const draggableSelector = '[draggable="true"], [draggable]';
    let allDraggable = [];
    
    try {
      await page.waitForSelector(draggableSelector, { timeout: 15000 });
      allDraggable = await page.locator(draggableSelector).all();
    } catch (err) {
      console.log('⚠️ draggable 요소를 찾을 수 없습니다. 모든 div 요소 확인:', err.message);
      // 대체: 모든 div 요소 확인
      const allDivs = await page.locator('div').all();
      console.log(`📋 전체 div 요소: ${allDivs.length}개\n`);
      
      // 이미지가 포함된 div 찾기
      for (const div of allDivs.slice(0, 50)) {
        const hasImg = await div.locator('img').count();
        if (hasImg > 0) {
          allDraggable.push(div);
        }
      }
    }
    
    console.log(`📋 드래그 가능한 요소: ${allDraggable.length}개\n`);
    
    if (allDraggable.length > 0) {
      // 첫 번째 이미지 사용 (128번 폴더에 있는 이미지)
      const firstImage = allDraggable[0];
      const imageInfo = await firstImage.evaluate((el) => {
        const img = el.querySelector('img');
        return {
          src: img?.src || '',
          alt: img?.alt || '',
          naturalWidth: img?.naturalWidth || 0,
          naturalHeight: img?.naturalHeight || 0,
          complete: img?.complete || false,
          width: img?.width || 0,
          height: img?.height || 0
        };
      });
      console.log('📸 128번 이미지 정보:', imageInfo);
      
      // 드래그 시작
      const box = await firstImage.boundingBox();
      if (box) {
        console.log(`📍 이미지 위치: x=${box.x}, y=${box.y}, width=${box.width}, height=${box.height}\n`);
        
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(500);
        
        // 드래그 중 스크린샷
        await page.screenshot({ path: 'screenshots/128-dragging.png' });
        console.log('✅ 128번 이미지 드래그 중 스크린샷 저장\n');
        
        // 마우스 이동 (드래그 시뮬레이션)
        await page.mouse.move(box.x + 200, box.y + 200);
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'screenshots/128-dragging-moved.png' });
        console.log('✅ 128번 이미지 드래그 이동 스크린샷 저장\n');
        
        await page.mouse.up();
        await page.waitForTimeout(500);
      } else {
        console.log('⚠️ 이미지 요소의 boundingBox를 가져올 수 없습니다.\n');
      }
    } else {
      console.log('⚠️ 드래그 가능한 이미지를 찾을 수 없습니다.\n');
    }

    // 5. 170번 이미지가 있는 폴더로 이동
    console.log('📝 5단계: 170번 이미지 폴더로 이동...\n');
    
    // 갤러리 페이지로 다시 이동
    await page.goto(`${BASE_URL}/admin/gallery`);
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    await page.waitForTimeout(2000);
    
    // 폴더 트리에서 직접 클릭 시도
    try {
      // originals 폴더 확장
      await page.waitForSelector('text=originals', { timeout: 5000 });
      const originalsFolder = page.locator('text=originals').first();
      if (await originalsFolder.count() > 0) {
        await originalsFolder.click();
        await page.waitForTimeout(500);
      }
      
      // mms 폴더 클릭
      await page.waitForSelector('text=mms', { timeout: 5000 });
      const mmsFolder = page.locator('text=mms').first();
      if (await mmsFolder.count() > 0) {
        await mmsFolder.click();
        await page.waitForTimeout(500);
      }
      
      // 2025-12-05 폴더 클릭
      await page.waitForSelector('text=2025-12-05', { timeout: 5000 });
      const dateFolder = page.locator('text=2025-12-05').first();
      if (await dateFolder.count() > 0) {
        await dateFolder.click();
        await page.waitForTimeout(1000);
      }
      
      // 170 폴더 클릭
      await page.waitForSelector('text=/^170$/', { timeout: 5000 });
      const folder170 = page.locator('text=/^170$/').first();
      if (await folder170.count() > 0) {
        await folder170.click();
        await page.waitForTimeout(2000);
      }
    } catch (err) {
      console.log('⚠️ 폴더 트리 클릭 실패:', err.message);
    }
    
    await page.waitForTimeout(3000);
    console.log('✅ 170번 폴더로 이동 완료\n');
    await page.screenshot({ path: 'screenshots/170-folder.png' });

    // 6. 170번 이미지 드래그 테스트
    console.log('📝 6단계: 170번 이미지 드래그 테스트...\n');
    
    const draggableSelector170 = 'div[draggable="true"]';
    await page.waitForSelector(draggableSelector170, { timeout: 10000 });
    
    const allDraggable170 = await page.locator(draggableSelector170).all();
    console.log(`📋 드래그 가능한 요소: ${allDraggable170.length}개\n`);
    
    if (allDraggable170.length > 0) {
      // 첫 번째 이미지 사용 (170번 폴더에 있는 이미지)
      const firstImage170 = allDraggable170[0];
      const imageInfo170 = await firstImage170.evaluate((el) => {
        const img = el.querySelector('img');
        return {
          src: img?.src || '',
          alt: img?.alt || '',
          naturalWidth: img?.naturalWidth || 0,
          naturalHeight: img?.naturalHeight || 0,
          complete: img?.complete || false,
          width: img?.width || 0,
          height: img?.height || 0
        };
      });
      console.log('📸 170번 이미지 정보:', imageInfo170);
      
      // 드래그 시작
      const box170 = await firstImage170.boundingBox();
      if (box170) {
        console.log(`📍 이미지 위치: x=${box170.x}, y=${box170.y}, width=${box170.width}, height=${box170.height}\n`);
        
        await page.mouse.move(box170.x + box170.width / 2, box170.y + box170.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(500);
        
        // 드래그 중 스크린샷
        await page.screenshot({ path: 'screenshots/170-dragging.png' });
        console.log('✅ 170번 이미지 드래그 중 스크린샷 저장\n');
        
        // 마우스 이동 (드래그 시뮬레이션)
        await page.mouse.move(box170.x + 200, box170.y + 200);
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'screenshots/170-dragging-moved.png' });
        console.log('✅ 170번 이미지 드래그 이동 스크린샷 저장\n');
        
        await page.mouse.up();
        await page.waitForTimeout(500);
      } else {
        console.log('⚠️ 이미지 요소의 boundingBox를 가져올 수 없습니다.\n');
      }
    } else {
      console.log('⚠️ 드래그 가능한 이미지를 찾을 수 없습니다.\n');
    }

    // 7. 콘솔 로그 확인
    console.log('📝 7단계: 콘솔 로그 확인...\n');
    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('드래그') || text.includes('drag') || text.includes('CORS') || text.includes('이미지')) {
        consoleLogs.push(text);
      }
    });
    
    await page.waitForTimeout(2000);
    
    if (consoleLogs.length > 0) {
      console.log(`✅ 관련 콘솔 로그 ${consoleLogs.length}개:\n`);
      consoleLogs.forEach(log => console.log(`  - ${log}`));
    } else {
      console.log('✅ 관련 콘솔 로그 없음\n');
    }

    console.log('\n⏳ 5초 대기 중... (스크린샷 확인)\n');
    await page.waitForTimeout(5000);

    console.log('✅ 테스트 완료!\n');
    console.log('📸 스크린샷 위치: screenshots/');
    console.log('  - 128-dragging.png: 128번 이미지 드래그 중');
    console.log('  - 170-dragging.png: 170번 이미지 드래그 중\n');

  } catch (error) {
    console.error('❌ 테스트 오류:', error);
    await page.screenshot({ path: 'screenshots/error.png' });
  } finally {
    await browser.close();
  }
}

testDragImageSize();


 * 128번 이미지와 170번 이미지의 드래그 크기를 확인
 */

require('dotenv').config({ path: '.env.local' });
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '010-6669-9000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '66699000';

async function testDragImageSize() {
  console.log('🧪 드래그 이미지 크기 테스트 시작...\n');
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // 스크린샷 저장 디렉토리 생성
  const screenshotsDir = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  try {
    // 1. 로그인
    console.log('📝 1단계: 로그인...\n');
    await page.goto(`${BASE_URL}/admin/login`);
    await page.waitForSelector('input[name="login"]', { timeout: 10000 });
    await page.fill('input[name="login"]', ADMIN_EMAIL);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/, { timeout: 15000 });
    console.log('✅ 로그인 완료\n');

    // 2. 갤러리 페이지로 이동
    console.log('📝 2단계: 갤러리 페이지로 이동...\n');
    await page.goto(`${BASE_URL}/admin/gallery`);
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    await page.waitForTimeout(3000);
    console.log('✅ 페이지 로드 완료\n');
    await page.screenshot({ path: 'screenshots/gallery-loaded.png', fullPage: true });
    
    // 페이지 구조 확인을 위한 디버깅
    const pageContent = await page.content();
    console.log('📋 페이지 구조 확인 중...\n');
    
    // draggable 요소가 있는지 확인
    const draggableCount = await page.locator('[draggable]').count();
    console.log(`📋 draggable 요소 개수: ${draggableCount}\n`);
    
    // 이미지 요소가 있는지 확인
    const imgCount = await page.locator('img').count();
    console.log(`📋 이미지 요소 개수: ${imgCount}\n`);

    // 3. 128번 이미지가 있는 폴더로 이동 (JavaScript로 폴더 필터 직접 설정)
    console.log('📝 3단계: 128번 이미지 폴더로 이동...\n');
    
    // JavaScript로 직접 폴더 필터 설정 시도
    await page.evaluate(() => {
      // React DevTools를 통해 상태 변경 시도
      const reactKey = Object.keys(window).find(key => key.startsWith('__REACT'));
      if (reactKey) {
        console.log('React DevTools 발견');
      }
      
      // 직접 DOM 이벤트 발생 시도
      const event = new CustomEvent('folderFilterChange', { 
        detail: { folder: 'originals/mms/2025-11-28/128' } 
      });
      window.dispatchEvent(event);
    });
    
    // 폴더 트리에서 클릭 시도 (더 관대한 선택자 사용)
    try {
      // 모든 클릭 가능한 요소 찾기
      const clickableElements = await page.locator('div, span, button').filter({ hasText: /originals|mms|2025-11-28|128/ }).all();
      console.log(`📋 클릭 가능한 폴더 요소: ${clickableElements.length}개\n`);
      
      // originals 텍스트가 포함된 요소 찾기
      for (const elem of clickableElements.slice(0, 10)) {
        const text = await elem.textContent();
        if (text && text.includes('originals')) {
          await elem.click();
          await page.waitForTimeout(500);
          break;
        }
      }
      
      await page.waitForTimeout(1000);
      
      // mms 텍스트가 포함된 요소 찾기
      for (const elem of clickableElements.slice(0, 20)) {
        const text = await elem.textContent();
        if (text && text.includes('mms') && !text.includes('originals')) {
          await elem.click();
          await page.waitForTimeout(500);
          break;
        }
      }
      
      await page.waitForTimeout(1000);
      
      // 2025-11-28 텍스트가 포함된 요소 찾기
      for (const elem of clickableElements) {
        const text = await elem.textContent();
        if (text && text.includes('2025-11-28')) {
          await elem.click();
          await page.waitForTimeout(1000);
          break;
        }
      }
      
      await page.waitForTimeout(1000);
      
      // 128 텍스트가 포함된 요소 찾기 (정확히 128만)
      const folder128Elements = await page.locator('div, span').filter({ hasText: /^128$/ }).all();
      if (folder128Elements.length > 0) {
        await folder128Elements[0].click();
        await page.waitForTimeout(2000);
      }
    } catch (err) {
      console.log('⚠️ 폴더 트리 클릭 실패:', err.message);
    }
    
    await page.waitForTimeout(3000);
    console.log('✅ 128번 폴더로 이동 완료\n');
    await page.screenshot({ path: 'screenshots/128-folder.png', fullPage: true });

    // 4. 128번 이미지 요소 찾기 및 드래그 시작
    console.log('📝 4단계: 128번 이미지 드래그 테스트...\n');
    
    // 드래그 가능한 요소 찾기 (더 관대한 대기)
    const draggableSelector = '[draggable="true"], [draggable]';
    let allDraggable = [];
    
    try {
      await page.waitForSelector(draggableSelector, { timeout: 15000 });
      allDraggable = await page.locator(draggableSelector).all();
    } catch (err) {
      console.log('⚠️ draggable 요소를 찾을 수 없습니다. 모든 div 요소 확인:', err.message);
      // 대체: 모든 div 요소 확인
      const allDivs = await page.locator('div').all();
      console.log(`📋 전체 div 요소: ${allDivs.length}개\n`);
      
      // 이미지가 포함된 div 찾기
      for (const div of allDivs.slice(0, 50)) {
        const hasImg = await div.locator('img').count();
        if (hasImg > 0) {
          allDraggable.push(div);
        }
      }
    }
    
    console.log(`📋 드래그 가능한 요소: ${allDraggable.length}개\n`);
    
    if (allDraggable.length > 0) {
      // 첫 번째 이미지 사용 (128번 폴더에 있는 이미지)
      const firstImage = allDraggable[0];
      const imageInfo = await firstImage.evaluate((el) => {
        const img = el.querySelector('img');
        return {
          src: img?.src || '',
          alt: img?.alt || '',
          naturalWidth: img?.naturalWidth || 0,
          naturalHeight: img?.naturalHeight || 0,
          complete: img?.complete || false,
          width: img?.width || 0,
          height: img?.height || 0
        };
      });
      console.log('📸 128번 이미지 정보:', imageInfo);
      
      // 드래그 시작
      const box = await firstImage.boundingBox();
      if (box) {
        console.log(`📍 이미지 위치: x=${box.x}, y=${box.y}, width=${box.width}, height=${box.height}\n`);
        
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(500);
        
        // 드래그 중 스크린샷
        await page.screenshot({ path: 'screenshots/128-dragging.png' });
        console.log('✅ 128번 이미지 드래그 중 스크린샷 저장\n');
        
        // 마우스 이동 (드래그 시뮬레이션)
        await page.mouse.move(box.x + 200, box.y + 200);
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'screenshots/128-dragging-moved.png' });
        console.log('✅ 128번 이미지 드래그 이동 스크린샷 저장\n');
        
        await page.mouse.up();
        await page.waitForTimeout(500);
      } else {
        console.log('⚠️ 이미지 요소의 boundingBox를 가져올 수 없습니다.\n');
      }
    } else {
      console.log('⚠️ 드래그 가능한 이미지를 찾을 수 없습니다.\n');
    }

    // 5. 170번 이미지가 있는 폴더로 이동
    console.log('📝 5단계: 170번 이미지 폴더로 이동...\n');
    
    // 갤러리 페이지로 다시 이동
    await page.goto(`${BASE_URL}/admin/gallery`);
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    await page.waitForTimeout(2000);
    
    // 폴더 트리에서 직접 클릭 시도
    try {
      // originals 폴더 확장
      await page.waitForSelector('text=originals', { timeout: 5000 });
      const originalsFolder = page.locator('text=originals').first();
      if (await originalsFolder.count() > 0) {
        await originalsFolder.click();
        await page.waitForTimeout(500);
      }
      
      // mms 폴더 클릭
      await page.waitForSelector('text=mms', { timeout: 5000 });
      const mmsFolder = page.locator('text=mms').first();
      if (await mmsFolder.count() > 0) {
        await mmsFolder.click();
        await page.waitForTimeout(500);
      }
      
      // 2025-12-05 폴더 클릭
      await page.waitForSelector('text=2025-12-05', { timeout: 5000 });
      const dateFolder = page.locator('text=2025-12-05').first();
      if (await dateFolder.count() > 0) {
        await dateFolder.click();
        await page.waitForTimeout(1000);
      }
      
      // 170 폴더 클릭
      await page.waitForSelector('text=/^170$/', { timeout: 5000 });
      const folder170 = page.locator('text=/^170$/').first();
      if (await folder170.count() > 0) {
        await folder170.click();
        await page.waitForTimeout(2000);
      }
    } catch (err) {
      console.log('⚠️ 폴더 트리 클릭 실패:', err.message);
    }
    
    await page.waitForTimeout(3000);
    console.log('✅ 170번 폴더로 이동 완료\n');
    await page.screenshot({ path: 'screenshots/170-folder.png' });

    // 6. 170번 이미지 드래그 테스트
    console.log('📝 6단계: 170번 이미지 드래그 테스트...\n');
    
    const draggableSelector170 = 'div[draggable="true"]';
    await page.waitForSelector(draggableSelector170, { timeout: 10000 });
    
    const allDraggable170 = await page.locator(draggableSelector170).all();
    console.log(`📋 드래그 가능한 요소: ${allDraggable170.length}개\n`);
    
    if (allDraggable170.length > 0) {
      // 첫 번째 이미지 사용 (170번 폴더에 있는 이미지)
      const firstImage170 = allDraggable170[0];
      const imageInfo170 = await firstImage170.evaluate((el) => {
        const img = el.querySelector('img');
        return {
          src: img?.src || '',
          alt: img?.alt || '',
          naturalWidth: img?.naturalWidth || 0,
          naturalHeight: img?.naturalHeight || 0,
          complete: img?.complete || false,
          width: img?.width || 0,
          height: img?.height || 0
        };
      });
      console.log('📸 170번 이미지 정보:', imageInfo170);
      
      // 드래그 시작
      const box170 = await firstImage170.boundingBox();
      if (box170) {
        console.log(`📍 이미지 위치: x=${box170.x}, y=${box170.y}, width=${box170.width}, height=${box170.height}\n`);
        
        await page.mouse.move(box170.x + box170.width / 2, box170.y + box170.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(500);
        
        // 드래그 중 스크린샷
        await page.screenshot({ path: 'screenshots/170-dragging.png' });
        console.log('✅ 170번 이미지 드래그 중 스크린샷 저장\n');
        
        // 마우스 이동 (드래그 시뮬레이션)
        await page.mouse.move(box170.x + 200, box170.y + 200);
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'screenshots/170-dragging-moved.png' });
        console.log('✅ 170번 이미지 드래그 이동 스크린샷 저장\n');
        
        await page.mouse.up();
        await page.waitForTimeout(500);
      } else {
        console.log('⚠️ 이미지 요소의 boundingBox를 가져올 수 없습니다.\n');
      }
    } else {
      console.log('⚠️ 드래그 가능한 이미지를 찾을 수 없습니다.\n');
    }

    // 7. 콘솔 로그 확인
    console.log('📝 7단계: 콘솔 로그 확인...\n');
    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('드래그') || text.includes('drag') || text.includes('CORS') || text.includes('이미지')) {
        consoleLogs.push(text);
      }
    });
    
    await page.waitForTimeout(2000);
    
    if (consoleLogs.length > 0) {
      console.log(`✅ 관련 콘솔 로그 ${consoleLogs.length}개:\n`);
      consoleLogs.forEach(log => console.log(`  - ${log}`));
    } else {
      console.log('✅ 관련 콘솔 로그 없음\n');
    }

    console.log('\n⏳ 5초 대기 중... (스크린샷 확인)\n');
    await page.waitForTimeout(5000);

    console.log('✅ 테스트 완료!\n');
    console.log('📸 스크린샷 위치: screenshots/');
    console.log('  - 128-dragging.png: 128번 이미지 드래그 중');
    console.log('  - 170-dragging.png: 170번 이미지 드래그 중\n');

  } catch (error) {
    console.error('❌ 테스트 오류:', error);
    await page.screenshot({ path: 'screenshots/error.png' });
  } finally {
    await browser.close();
  }
}

testDragImageSize();

