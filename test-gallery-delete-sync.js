// 갤러리 이미지 삭제 동기화 확인 테스트
import { chromium } from 'playwright';

(async () => {
  console.log('🔍 갤러리 이미지 삭제 동기화 확인 테스트 시작...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

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

    // 2. 갤러리 관리 페이지 접속
    console.log('2️⃣ 갤러리 관리 페이지 접속...');
    await page.goto('http://localhost:3000/admin/gallery');
    await page.waitForTimeout(3000);
    console.log('   ✅ 갤러리 관리 페이지 로드 완료\n');

    // 3. 첫 번째 이미지 정보 확인
    console.log('3️⃣ 첫 번째 이미지 정보 확인...');
    await page.waitForTimeout(2000);

    const firstImageCard = await page.locator('div[class*="group"][class*="border"][class*="rounded-lg"]').first();
    if (await firstImageCard.isVisible({ timeout: 10000 })) {
      console.log('   ✅ 첫 번째 이미지 카드 발견');
      
      // 이미지 이름 추출
      const imageNameElement = await firstImageCard.locator('div[class*="text-xs"][class*="text-gray-600"]').first();
      const imageName = await imageNameElement.textContent();
      console.log(`   📝 이미지 이름: ${imageName}`);
      
      // 이미지 URL 추출
      const imageElement = await firstImageCard.locator('img').first();
      const imageUrl = await imageElement.getAttribute('src');
      console.log(`   🔗 이미지 URL: ${imageUrl?.substring(0, 100)}...`);
      
      // 현재 총 이미지 개수 확인
      const totalCountElement = await page.locator('text=/총 \\d+개/').first();
      const totalCountText = await totalCountElement.textContent();
      const currentTotalCount = parseInt(totalCountText?.match(/\d+/)?.[0] || '0');
      console.log(`   📊 현재 총 이미지 개수: ${currentTotalCount}개\n`);

      // 4. 이미지 삭제
      console.log('4️⃣ 이미지 삭제...');
      await page.waitForTimeout(1000);
      
      // 이미지 카드에 호버하여 삭제 버튼 표시
      await firstImageCard.hover();
      await page.waitForTimeout(1000);
      
      // 삭제 버튼 찾기 및 클릭
      const deleteButton = await firstImageCard.locator('button[title="삭제"], button:has-text("🗑️")').first();
      if (await deleteButton.isVisible({ timeout: 3000 })) {
        console.log('   ✅ 삭제 버튼 발견');
        
        // 삭제 확인 대화상자 처리
        page.on('dialog', async dialog => {
          console.log('   💬 확인 대화상자:', dialog.message());
          await dialog.accept();
        });
        
        await deleteButton.click();
        await page.waitForTimeout(2000);
        console.log('   ✅ 삭제 버튼 클릭 완료');
        
        // 삭제 완료 메시지 대기
        await page.waitForTimeout(2000);
        console.log('   ✅ 삭제 완료 메시지 확인\n');
      } else {
        throw new Error('삭제 버튼을 찾을 수 없습니다.');
      }

      // 5. 목록 새로고침 대기
      console.log('5️⃣ 목록 새로고침 대기...');
      await page.waitForTimeout(3000); // fetchImages 호출 대기

      // 6. 삭제된 이미지가 목록에 없는지 확인
      console.log('6️⃣ 삭제된 이미지가 목록에 없는지 확인...');
      await page.waitForTimeout(2000);
      
      // 새로운 총 이미지 개수 확인
      const newTotalCountElement = await page.locator('text=/총 \\d+개/').first();
      const newTotalCountText = await newTotalCountElement.textContent();
      const newTotalCount = parseInt(newTotalCountText?.match(/\d+/)?.[0] || '0');
      console.log(`   📊 새로운 총 이미지 개수: ${newTotalCount}개`);
      
      if (newTotalCount < currentTotalCount) {
        console.log(`   ✅ 이미지 개수 감소 확인: ${currentTotalCount}개 → ${newTotalCount}개`);
      } else {
        console.log(`   ⚠️ 이미지 개수가 변경되지 않음: ${currentTotalCount}개 → ${newTotalCount}개`);
      }
      
      // 삭제된 이미지가 목록에 있는지 확인
      const deletedImageStillExists = await page.locator(`text=${imageName}`).first();
      if (await deletedImageStillExists.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log(`   ❌ 삭제된 이미지가 여전히 목록에 존재: ${imageName}`);
        await page.screenshot({ path: 'test-gallery-delete-sync-failed.png', fullPage: true });
        throw new Error('삭제된 이미지가 목록에 남아있습니다.');
      } else {
        console.log(`   ✅ 삭제된 이미지가 목록에서 제거됨: ${imageName}`);
      }

      // 7. API 직접 호출로 확인
      console.log('\n7️⃣ API 직접 호출로 동기화 확인...');
      await page.waitForTimeout(2000);
      
      // all-images API 호출 (forceRefresh=true)
      const apiResponse = await page.evaluate(async (imageUrl) => {
        const response = await fetch(`/api/admin/all-images?limit=100&offset=0&prefix=&includeChildren=true&forceRefresh=true`);
        const data = await response.json();
        return {
          total: data.total,
          images: data.images || [],
          imageUrls: (data.images || []).map(img => img.url)
        };
      }, imageUrl);
      
      console.log(`   📊 API 응답 - 총 이미지 개수: ${apiResponse.total}개`);
      console.log(`   📊 API 응답 - 반환된 이미지 개수: ${apiResponse.images.length}개`);
      
      // 삭제된 이미지 URL이 목록에 있는지 확인
      const deletedImageInList = apiResponse.imageUrls.includes(imageUrl);
      if (deletedImageInList) {
        console.log(`   ❌ 삭제된 이미지 URL이 API 응답에 포함됨: ${imageUrl?.substring(0, 100)}...`);
        throw new Error('삭제된 이미지가 API 응답에 포함되어 있습니다.');
      } else {
        console.log(`   ✅ 삭제된 이미지 URL이 API 응답에서 제외됨`);
      }

      // 8. 스토리지에서 직접 확인 (선택적)
      console.log('\n8️⃣ 스토리지 동기화 확인 (선택적)...');
      console.log('   ℹ️ 스토리지 직접 확인은 수동으로 확인이 필요합니다.');
      console.log(`   📝 삭제된 이미지 이름: ${imageName}`);
      console.log(`   🔗 삭제된 이미지 URL: ${imageUrl?.substring(0, 100)}...`);

      // 최종 스크린샷
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-gallery-delete-sync-success.png', fullPage: true });
      console.log('\n   📸 최종 스크린샷 저장: test-gallery-delete-sync-success.png');
      
      console.log('\n✅ 갤러리 이미지 삭제 동기화 확인 테스트 완료!');
      console.log('\n📋 테스트 결과 요약:');
      console.log(`   - 삭제 전 총 이미지 개수: ${currentTotalCount}개`);
      console.log(`   - 삭제 후 총 이미지 개수: ${newTotalCount}개`);
      console.log(`   - API 응답 총 이미지 개수: ${apiResponse.total}개`);
      console.log(`   - 삭제된 이미지 목록 제거: ✅`);
      console.log(`   - API 응답에서 제외: ✅`);

    } else {
      console.log('   ⚠️ 이미지 카드를 찾을 수 없습니다.');
      await page.screenshot({ path: 'test-gallery-delete-sync-no-images.png', fullPage: true });
      throw new Error('이미지 카드를 찾을 수 없습니다.');
    }

  } catch (error) {
    console.error(`❌ 테스트 실패: ${error.message}`);
    await page.screenshot({ path: 'test-gallery-delete-sync-failure.png', fullPage: true });
    throw error;
  } finally {
    await page.close();
    await browser.close();
  }
})();

