const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });

// 로그인 정보: docs/e2e-tests/TEST_CREDENTIALS.md 참고
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || '010-6669-9000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '66699000';
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

async function checkGalleryDuplicates() {
  console.log('🎭 Playwright: 갤러리 중복 이미지 확인\n');
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  try {
    // 1. 로그인
    console.log('\n🔐 1단계: 관리자 로그인');
    
    // 갤러리 페이지로 먼저 이동 (로그인 페이지로 리다이렉트됨)
    await page.goto(`${BASE_URL}/admin/gallery`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // 로그인 페이지로 리다이렉트되었는지 확인
    const currentUrl = page.url();
    if (currentUrl.includes('/admin/login')) {
      console.log('  로그인 페이지로 리다이렉트됨, 로그인 진행...');
      
      // 로그인 폼 대기
      await page.waitForSelector('input[name="login"], input#login', { timeout: 10000 });
      
      // 여러 선택자 시도
      const loginInput = page.locator('input[name="login"]').or(page.locator('input#login')).first();
      const passwordInput = page.locator('input[name="password"]').or(page.locator('input#password')).first();
      const submitButton = page.locator('button[type="submit"]').or(page.locator('button:has-text("로그인")')).first();
      
      await loginInput.fill(ADMIN_LOGIN);
      await passwordInput.fill(ADMIN_PASSWORD);
      await submitButton.click();
      
      // 로그인 완료 대기 (갤러리 페이지로 리다이렉트)
      await page.waitForURL(/\/admin\/gallery/, { timeout: 20000 }).catch(async () => {
        // 갤러리 페이지가 아니면 /admin으로 이동 후 갤러리로 이동
        await page.waitForURL(/\/admin/, { timeout: 10000 });
        console.log('  /admin 페이지로 이동, 갤러리 페이지로 이동...');
        await page.goto(`${BASE_URL}/admin/gallery`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      });
      console.log('✅ 로그인 완료');
    } else if (currentUrl.includes('/admin/gallery')) {
      console.log('  이미 로그인되어 있거나 갤러리 페이지에 있음');
    } else {
      console.log('  ⚠️  예상치 못한 페이지:', currentUrl);
      // 로그인 페이지로 이동 시도
      await page.goto(`${BASE_URL}/admin/login?callbackUrl=${encodeURIComponent('/admin/gallery')}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForSelector('input[name="login"], input#login', { timeout: 10000 });
      
      const loginInput = page.locator('input[name="login"]').or(page.locator('input#login')).first();
      const passwordInput = page.locator('input[name="password"]').or(page.locator('input#password')).first();
      const submitButton = page.locator('button[type="submit"]').or(page.locator('button:has-text("로그인")')).first();
      
      await loginInput.fill(ADMIN_LOGIN);
      await passwordInput.fill(ADMIN_PASSWORD);
      await submitButton.click();
      
      await page.waitForURL(/\/admin\/gallery/, { timeout: 20000 });
      console.log('✅ 로그인 완료');
    }

    // 2. 갤러리 페이지 확인 및 대기
    console.log('\n📸 2단계: 갤러리 페이지 확인');
    
    // 현재 URL 확인
    const galleryUrl = page.url();
    console.log(`  현재 URL: ${galleryUrl}`);
    
    // 갤러리 페이지가 아니면 이동
    if (!galleryUrl.includes('/admin/gallery')) {
      console.log('  갤러리 페이지로 이동...');
      await page.goto(`${BASE_URL}/admin/gallery`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    }
    
    // 페이지 로드 대기 (갤러리 컨텐츠가 나타날 때까지)
    await page.waitForSelector('div[class*="grid"], div[class*="gallery"], h1, h2', { timeout: 15000 }).catch(() => {
      console.log('⚠️  갤러리 컨텐츠 로드 대기 중...');
    });
    
    // 추가 대기 (이미지 로드 완료)
    await page.waitForTimeout(5000);
    console.log('✅ 갤러리 페이지 로드 완료');

    // 3. originals/campaigns/2025-05 폴더 선택
    console.log('\n📁 3단계: originals/campaigns/2025-05 폴더 선택');
    
    // 페이지 로드 대기 (폴더 트리 로드 시간 확보)
    await page.waitForTimeout(5000);
    
    // 폴더 트리에서 originals 폴더 찾기
    console.log('  originals 폴더 찾기 중...');
    const originalsText = page.locator('text=/originals/i').first();
    
    if (await originalsText.count() > 0) {
      // originals 폴더의 부모 요소 찾기 (클릭 가능한 div)
      const originalsFolder = originalsText.locator('xpath=ancestor::div[contains(@class, "cursor-pointer")]').first();
      
      if (await originalsFolder.count() > 0) {
        // 확장 버튼 확인 (▶ 또는 ▼)
        const expandButton = originalsFolder.locator('button').first();
        if (await expandButton.count() > 0) {
          const buttonText = await expandButton.textContent().catch(() => '');
          if (buttonText?.trim() === '▶' || buttonText?.trim() === '') {
            await expandButton.click();
            await page.waitForTimeout(1000); // 확장 대기 시간 증가
            console.log('  ✅ originals 폴더 확장');
          }
        }
        
        // originals 폴더 클릭 (선택)
        await originalsFolder.click();
        await page.waitForTimeout(2000); // 선택 후 대기 시간 증가
        console.log('  ✅ originals 폴더 선택');
      }
    }
    
    // campaigns 폴더 찾기
    console.log('  campaigns 폴더 찾기 중...');
    await page.waitForTimeout(1000); // campaigns 폴더가 나타날 때까지 대기
    const campaignsText = page.locator('text=/campaigns/i').first();
    
    if (await campaignsText.count() > 0) {
      const campaignsFolder = campaignsText.locator('xpath=ancestor::div[contains(@class, "cursor-pointer")]').first();
      
      if (await campaignsFolder.count() > 0) {
        // 확장 버튼 확인
        const expandButton = campaignsFolder.locator('button').first();
        if (await expandButton.count() > 0) {
          const buttonText = await expandButton.textContent().catch(() => '');
          if (buttonText?.trim() === '▶' || buttonText?.trim() === '') {
            await expandButton.click();
            await page.waitForTimeout(1000); // 확장 대기 시간 증가
            console.log('  ✅ campaigns 폴더 확장');
          }
        }
        
        // campaigns 폴더 클릭 (선택)
        await campaignsFolder.click();
        await page.waitForTimeout(2000); // 선택 후 대기 시간 증가
        console.log('  ✅ campaigns 폴더 선택');
      }
    }
    
    // 2025-05 폴더 찾기 및 선택
    console.log('  2025-05 폴더 찾기 중...');
    await page.waitForTimeout(1000); // 2025-05 폴더가 나타날 때까지 대기
    const folder202505Text = page.locator('text=/2025-05/i').first();
    
    if (await folder202505Text.count() > 0) {
      const folder202505 = folder202505Text.locator('xpath=ancestor::div[contains(@class, "cursor-pointer")]').first();
      
      if (await folder202505.count() > 0) {
        await folder202505.click();
        await page.waitForTimeout(3000); // 이미지 로드 대기 시간 증가
        console.log('  ✅ 2025-05 폴더 선택');
      }
    } else {
      console.log('  ⚠️  2025-05 폴더를 찾을 수 없습니다. campaigns 폴더에서 확인합니다.');
    }
    
    // 이미지 로드 대기 (충분한 시간 확보)
    await page.waitForTimeout(5000);
    console.log('✅ originals/campaigns/2025-05 폴더 선택 완료');

    // 4. 이미지 수집
    console.log('\n🖼️  4단계: 이미지 수집');
    
    // 이미지 로드 대기
    await page.waitForTimeout(5000);
    
    // 페이지의 모든 이미지 찾기 (다양한 선택자 시도)
    console.log('  이미지 요소 찾기 중...');
    
    // 1차: Supabase/Storage 이미지
    let imageElements = await page.locator('img[src*="supabase"], img[src*="storage"], img[src*="blog-images"]').all();
    console.log(`  Supabase/Storage 이미지: ${imageElements.length}개`);
    
    // 2차: 모든 img 태그 (필터링)
    if (imageElements.length === 0) {
      const allImgs = await page.locator('img').all();
      imageElements = [];
      for (const img of allImgs) {
        const src = await img.getAttribute('src').catch(() => null);
        if (src && (src.includes('http') || src.includes('data:'))) {
          imageElements.push(img);
        }
      }
      console.log(`  모든 이미지 태그 (필터링 후): ${imageElements.length}개`);
    }
    
    // 3차: 이미지 카드에서 찾기
    const imageCards = await page.locator('div[class*="group"]:has(img), div[class*="card"]:has(img), div[class*="image"]:has(img)').all();
    console.log(`  발견된 이미지 카드: ${imageCards.length}개`);
    
    // 스크롤하여 더 많은 이미지 로드
    if (imageElements.length > 0) {
      console.log('  스크롤하여 더 많은 이미지 로드 중...');
      let previousImageCount = imageElements.length;
      let scrollAttempts = 0;
      const maxScrollAttempts = 5;
      
      while (scrollAttempts < maxScrollAttempts) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(2000);
        
        const currentImages = await page.locator('img[src*="supabase"], img[src*="storage"], img[src*="blog-images"]').count();
        
        if (currentImages === previousImageCount) {
          console.log(`  ✅ 추가 이미지 로드 완료: 총 ${currentImages}개`);
          break;
        }
        
        previousImageCount = currentImages;
        scrollAttempts++;
      }
      
      // 다시 수집
      imageElements = await page.locator('img[src*="supabase"], img[src*="storage"], img[src*="blog-images"]').all();
      console.log(`  최종 이미지 요소: ${imageElements.length}개`);
    }

    const imageData = [];
    const seenUrls = new Set();
    
    // 이미지 카드에서 정보 추출
    for (let i = 0; i < imageCards.length; i++) {
      const card = imageCards[i];
      
      try {
        // 이미지 요소 찾기
        const img = card.locator('img').first();
        const src = await img.getAttribute('src').catch(() => null);
        
        if (!src || seenUrls.has(src)) continue;
        seenUrls.add(src);
        
        // 파일명 추출 (카드 내 텍스트에서)
        const nameElement = card.locator('div[class*="text"]').first();
        const filename = await nameElement.textContent().catch(() => '') || '';
        
        // alt 속성
        const alt = await img.getAttribute('alt').catch(() => '') || '';
        
        // 폴더 경로 추출 시도
        const folderElement = card.locator('div[title*="폴더"]').first();
        const folderPath = await folderElement.getAttribute('title').catch(() => '') || '';
        
        imageData.push({
          index: i,
          src: src,
          alt: alt.trim(),
          filename: filename.trim(),
          folderPath: folderPath.replace('폴더: ', '').trim(),
        });
      } catch (error) {
        console.log(`  ⚠️  이미지 카드 ${i} 정보 추출 실패:`, error.message);
      }
    }
    
    // 이미지 요소에서 직접 정보 추출 (카드에서 못 찾은 경우)
    for (let i = 0; i < imageElements.length; i++) {
      const img = imageElements[i];
      
      try {
        const src = await img.getAttribute('src');
        if (!src || seenUrls.has(src)) continue;
        seenUrls.add(src);
        
        const alt = await img.getAttribute('alt') || '';
        
        // 이미지 카드에서 찾지 못한 경우에만 추가
        const existing = imageData.find(d => d.src === src);
        if (!existing) {
          imageData.push({
            index: imageData.length,
            src: src,
            alt: alt.trim(),
            filename: '',
            folderPath: '',
          });
        }
      } catch (error) {
        // 무시
      }
    }
    
    console.log(`✅ 이미지 데이터 수집 완료: ${imageData.length}개`);

    // 5. 중복 감지
    console.log('\n🔍 5단계: 중복 이미지 감지');
    
    // URL 기준 중복 감지
    const urlMap = new Map();
    const urlDuplicates = [];
    
    imageData.forEach((img, index) => {
      if (!img.src) return;
      
      // URL 정규화 (쿼리 파라미터 제거)
      const normalizedUrl = img.src.split('?')[0];
      
      if (urlMap.has(normalizedUrl)) {
        urlMap.get(normalizedUrl).push({ ...img, index });
      } else {
        urlMap.set(normalizedUrl, [{ ...img, index }]);
      }
    });
    
    urlMap.forEach((group, url) => {
      if (group.length > 1) {
        urlDuplicates.push({ url, count: group.length, images: group });
      }
    });
    
    console.log(`  ✅ URL 기준 중복: ${urlDuplicates.length}개 그룹`);
    
    // 파일명 기준 중복 감지 (UUID 제거 후)
    const fileNameMap = new Map();
    const fileNameDuplicates = [];
    
    imageData.forEach((img, index) => {
      if (!img.filename && !img.src) return;
      
      // 파일명 추출 (URL에서 또는 filename에서)
      let fileName = img.filename;
      if (!fileName && img.src) {
        const urlMatch = img.src.match(/\/([^\/]+\.(jpg|jpeg|png|gif|webp|mp4))(\?|$)/i);
        if (urlMatch) {
          fileName = urlMatch[1];
        }
      }
      
      if (!fileName) return;
      
      // UUID 제거
      const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}-(.+)$/;
      const match = fileName.match(uuidPattern);
      const baseFileName = match ? match[1] : fileName;
      
      // 정규화 (소문자, 특수문자 제거)
      const normalized = baseFileName.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
      
      if (fileNameMap.has(normalized)) {
        fileNameMap.get(normalized).push({ ...img, index, baseFileName });
      } else {
        fileNameMap.set(normalized, [{ ...img, index, baseFileName }]);
      }
    });
    
    fileNameMap.forEach((group, normalized) => {
      if (group.length > 1) {
        fileNameDuplicates.push({ normalized, count: group.length, images: group });
      }
    });
    
    console.log(`  ✅ 파일명 기준 중복: ${fileNameDuplicates.length}개 그룹`);

    // 6. 스크린샷 촬영
    console.log('\n📸 6단계: 스크린샷 촬영');
    const screenshotPath = path.join(process.cwd(), 'docs', `phase8-gallery-duplicate-check-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`✅ 스크린샷 저장: ${screenshotPath}`);

    // 7. 결과 저장
    const result = {
      timestamp: new Date().toISOString(),
      summary: {
        totalImages: imageData.length,
        urlDuplicates: urlDuplicates.length,
        fileNameDuplicates: fileNameDuplicates.length,
      },
      imageData,
      urlDuplicates,
      fileNameDuplicates,
    };

    const resultPath = path.join(process.cwd(), 'docs', 'phase8-gallery-duplicate-check-result.json');
    fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
    console.log(`\n📄 결과 저장: ${resultPath}`);

    // 8. 요약 출력
    console.log('\n' + '='.repeat(60));
    console.log('📊 갤러리 중복 이미지 확인 결과\n');
    console.log(`1. 전체 이미지: ${imageData.length}개`);
    console.log(`2. URL 기준 중복 그룹: ${urlDuplicates.length}개`);
    if (urlDuplicates.length > 0) {
      console.log('\n   URL 중복 상세:');
      urlDuplicates.forEach((dup, i) => {
        console.log(`   - 그룹 ${i + 1}: ${dup.count}개 이미지`);
        console.log(`     URL: ${dup.url.substring(0, 80)}...`);
      });
    }
    console.log(`3. 파일명 기준 중복 그룹: ${fileNameDuplicates.length}개`);
    if (fileNameDuplicates.length > 0) {
      console.log('\n   파일명 중복 상세:');
      fileNameDuplicates.forEach((dup, i) => {
        console.log(`   - 그룹 ${i + 1}: ${dup.count}개 이미지`);
        console.log(`     정규화 파일명: ${dup.normalized}`);
        dup.images.forEach((img, j) => {
          console.log(`       ${j + 1}. ${img.baseFileName || img.filename || img.src.substring(0, 60)}`);
        });
      });
    }
    console.log('\n' + '='.repeat(60));

    // 9. 브라우저 열어두기 (수동 확인용)
    console.log('\n💡 브라우저를 열어두었습니다. 수동으로 확인하세요.');
    console.log('   확인 후 브라우저를 닫으면 스크립트가 종료됩니다.\n');
    
    // 사용자가 브라우저를 닫을 때까지 대기
    await page.waitForTimeout(60000); // 1분 대기

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: path.join(process.cwd(), 'docs', `phase8-gallery-error-${Date.now()}.png`) });
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  checkGalleryDuplicates().catch(console.error);
}

module.exports = { checkGalleryDuplicates };








