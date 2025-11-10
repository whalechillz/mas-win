import { chromium } from 'playwright';

(async () => {
  console.log('🚀 갤러리 이미지 변형 기능 플레이라이트 테스트 시작...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. 로그인
    console.log('1️⃣ 로그인 페이지 접속...');
    await page.goto('http://localhost:3000/admin/login');
    await page.waitForTimeout(2000);

    const loginForm = await page.locator('form').first();
    if (await loginForm.isVisible({ timeout: 5000 })) {
      console.log('   ✅ 로그인 폼 발견');
      
      // 로그인 정보 입력
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

    // 3. 첫 번째 이미지에 호버하여 확대 버튼 클릭
    console.log('3️⃣ 첫 번째 이미지에 호버하여 확대 모달 열기...');
    await page.waitForTimeout(3000); // 이미지 로딩 대기

    // 이미지 그리드에서 첫 번째 이미지 카드 찾기
    const firstImageCard = await page.locator('div[class*="group"][class*="border"][class*="rounded-lg"]').first();
    if (await firstImageCard.isVisible({ timeout: 10000 })) {
      console.log('   ✅ 첫 번째 이미지 카드 발견');
      
      // 이미지 카드에 호버하여 "🔍" 버튼 표시
      await firstImageCard.hover();
      await page.waitForTimeout(1000);
      console.log('   ✅ 이미지 카드 호버 완료');
      
      // "🔍" 버튼 찾기 및 클릭
      const zoomButton = await firstImageCard.locator('button[title="확대"], button:has-text("🔍")').first();
      if (await zoomButton.isVisible({ timeout: 3000 })) {
        console.log('   ✅ 확대 버튼 발견');
        await zoomButton.click();
        await page.waitForTimeout(2000);
        console.log('   ✅ 확대 버튼 클릭 완료 (확대 모달 열림)\n');
      } else {
        // 호버가 제대로 작동하지 않으면 직접 클릭 시도
        console.log('   ⚠️ 확대 버튼을 찾을 수 없습니다. 이미지 카드를 직접 클릭 시도...');
        await firstImageCard.click();
        await page.waitForTimeout(2000);
        console.log('   ✅ 이미지 카드 클릭 완료\n');
      }
    } else {
      console.log('   ⚠️ 이미지 카드를 찾을 수 없습니다.');
      await page.screenshot({ path: 'test-gallery-no-images.png', fullPage: true });
      throw new Error('이미지 카드를 찾을 수 없습니다.');
    }

    // 4. 확대 모달에서 "변형 (FAL)" 버튼 클릭
    console.log('4️⃣ 확대 모달에서 "변형 (FAL)" 버튼 클릭...');
    await page.waitForTimeout(2000);

    // 괄호를 포함한 텍스트는 정확한 매칭이 필요하므로 여러 방법 시도
    const variationFalButton = await page.locator('button:has-text("변형"), button[title*="변형"]').filter({ hasText: /FAL|FAL AI/ }).first();
    if (await variationFalButton.isVisible({ timeout: 5000 })) {
      console.log('   ✅ "변형 (FAL)" 버튼 발견');
      await variationFalButton.click();
      await page.waitForTimeout(2000);
      console.log('   ✅ "변형 (FAL)" 버튼 클릭 완료\n');
    } else {
      console.log('   ⚠️ "변형 (FAL)" 버튼을 찾을 수 없습니다.');
      await page.screenshot({ path: 'test-gallery-no-variation-button.png', fullPage: true });
      throw new Error('"변형 (FAL)" 버튼을 찾을 수 없습니다.');
    }

    // 5. 변형 모달 확인 및 갤러리 탭 클릭
    console.log('5️⃣ 변형 모달 확인 및 갤러리 탭 클릭...');
    await page.waitForTimeout(2000);

    const variationModal = await page.locator('div[class*="fixed"][class*="z-50"]').first();
    if (await variationModal.isVisible({ timeout: 5000 })) {
      console.log('   ✅ 변형 모달 확인');

      const galleryTab = await variationModal.locator('button:has-text("갤러리"), button:has-text("🖼️")').first();
      if (await galleryTab.isVisible({ timeout: 3000 })) {
        await galleryTab.click();
        await page.waitForTimeout(2000);
        console.log('   ✅ 갤러리 탭 클릭 완료\n');
      } else {
        console.log('   ⚠️ 갤러리 탭을 찾을 수 없습니다. 이미 갤러리 탭이 선택되어 있을 수 있습니다.');
        // 계속 진행
      }
    } else {
      console.log('   ⚠️ 변형 모달을 찾을 수 없습니다.');
      await page.screenshot({ path: 'test-gallery-no-modal.png', fullPage: true });
      throw new Error('변형 모달을 찾을 수 없습니다.');
    }

    // 6. 모달 내 첫 번째 이미지 선택
    console.log('6️⃣ 모달 내 첫 번째 이미지 선택...');
    await page.waitForTimeout(2000);

    // 모달 내부의 이미지 찾기 (여러 방법 시도)
    let firstImageInModal = null;
    
    // 방법 1: 이미지 그리드에서 찾기
    const imageGrid = await variationModal.locator('div[class*="grid"], div[class*="grid-cols"]').first();
    if (await imageGrid.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('   ✅ 모달 내 이미지 그리드 발견');
      firstImageInModal = await imageGrid.locator('div[class*="cursor-pointer"], div[class*="border"]').first();
    } else {
      // 방법 2: 모달 내부의 모든 이미지 카드에서 찾기
      console.log('   🔍 이미지 그리드를 찾을 수 없습니다. 다른 방법으로 시도...');
      firstImageInModal = await variationModal.locator('div[class*="cursor-pointer"][class*="border"], div[class*="border"][class*="rounded"]').first();
    }
    
    if (firstImageInModal && await firstImageInModal.isVisible({ timeout: 5000 }).catch(() => false)) {
      if (await firstImageInModal.isVisible({ timeout: 5000 })) {
        console.log('   ✅ 모달 내 첫 번째 이미지 발견');
        
        // JavaScript로 직접 클릭 (모달이 포인터 이벤트를 가로채는 경우 대비)
        await page.evaluate((element) => {
          element.click();
        }, await firstImageInModal.elementHandle());
        await page.waitForTimeout(1000);
        console.log('   ✅ 첫 번째 이미지 클릭 완료 (JavaScript)');

        // 선택된 이미지가 표시되는지 확인 (파란색 테두리 또는 체크 표시)
        let imageSelected = false;
        for (let i = 0; i < 10; i++) {
          // 파란색 테두리 확인
          const selectedIndicator = await firstImageInModal.locator('div[class*="border-blue-500"], div[class*="bg-blue-50"]').first();
          if (await selectedIndicator.isVisible({ timeout: 1000 }).catch(() => false)) {
            console.log(`   ✅ 이미지 선택 확인 (파란색 테두리) - 시도 ${i + 1}`);
            imageSelected = true;
            break;
          }
          
          // 체크 표시 확인
          const checkMark = await firstImageInModal.locator('div:has-text("✓"), span:has-text("✓")').first();
          if (await checkMark.isVisible({ timeout: 500 }).catch(() => false)) {
            console.log(`   ✅ 이미지 선택 확인 (체크 표시) - 시도 ${i + 1}`);
            imageSelected = true;
            break;
          }
          
          await page.waitForTimeout(500);
        }

        if (imageSelected) {
          console.log('   ✅ 첫 번째 이미지 선택 완료\n');
        } else {
          console.log('   ⚠️ 이미지 선택 상태를 확인할 수 없지만 계속 진행...\n');
        }
      } else {
        console.log('   ⚠️ 모달 내 이미지를 찾을 수 없습니다.');
        await page.screenshot({ path: 'test-gallery-no-images-in-modal.png', fullPage: true });
        throw new Error('모달 내 이미지를 찾을 수 없습니다.');
      }
    } else {
      console.log('   ⚠️ 모달 내 이미지 그리드를 찾을 수 없습니다.');
      await page.screenshot({ path: 'test-gallery-no-images-in-modal.png', fullPage: true });
      throw new Error('모달 내 이미지를 찾을 수 없습니다.');
    }

    // 7. "이미지 불러오기" 버튼 클릭 (활성화될 때까지 대기)
    console.log('7️⃣ "이미지 불러오기" 버튼 클릭...');
    await page.waitForTimeout(2000);
    
    // 스크린샷으로 현재 상태 확인
    await page.screenshot({ path: 'test-gallery-before-load-button.png', fullPage: true });
    console.log('   📸 현재 상태 스크린샷 저장: test-gallery-before-load-button.png');

    // 버튼이 활성화될 때까지 대기 (최대 10초)
    let loadButton = null;
    let attempts = 0;
    const maxAttempts = 20;

    while (attempts < maxAttempts) {
      // 여러 방법으로 버튼 찾기 (모달 내부 우선)
      loadButton = await variationModal.locator('button:has-text("이미지 불러오기")').first();
      if (!await loadButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        // 페이지 전체에서 찾기
        loadButton = await page.locator('button:has-text("이미지 불러오기")').first();
      }
      
      if (loadButton && await loadButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        const isEnabled = await loadButton.isEnabled({ timeout: 1000 }).catch(() => false);
        if (isEnabled) {
          console.log(`   ✅ "이미지 불러오기" 버튼 활성화됨 (시도 ${attempts + 1})`);
          break;
        } else {
          console.log(`   ⏳ "이미지 불러오기" 버튼 비활성화 상태 (시도 ${attempts + 1})`);
        }
      } else {
        console.log(`   ⏳ "이미지 불러오기" 버튼을 찾는 중... (시도 ${attempts + 1})`);
      }

      attempts++;
      await page.waitForTimeout(500);
    }

    if (loadButton && await loadButton.isVisible({ timeout: 1000 }).catch(() => false) && await loadButton.isEnabled({ timeout: 1000 }).catch(() => false)) {
      console.log('   ✅ "이미지 불러오기" 버튼 발견 (활성화됨)');

      // API 응답 리스너 설정
      page.on('response', async response => {
        if (response.url().includes('/api/get-image-prompt') && response.request().method() === 'POST') {
          try {
            const apiResponse = await response.json();
            console.log('   📦 get-image-prompt API 응답:', JSON.stringify(apiResponse, null, 2));
          } catch (e) {
            console.log('   ⚠️ API 응답 파싱 실패:', e.message);
          }
        }
        if (response.url().includes('/api/analyze-image-prompt') && response.request().method() === 'POST') {
          try {
            const apiResponse = await response.json();
            console.log('   📦 analyze-image-prompt API 응답:', JSON.stringify(apiResponse, null, 2));
          } catch (e) {
            console.log('   ⚠️ API 응답 파싱 실패:', e.message);
          }
        }
        if (response.url().includes('/api/analyze-image-general') && response.request().method() === 'POST') {
          try {
            const apiResponse = await response.json();
            console.log('   📦 analyze-image-general API 응답:', JSON.stringify(apiResponse, null, 2));
          } catch (e) {
            console.log('   ⚠️ API 응답 파싱 실패:', e.message);
          }
        }
      });

      await loadButton.click();
      await page.waitForTimeout(5000);
      console.log('   ✅ "이미지 불러오기" 버튼 클릭 완료\n');
    } else {
      console.log('   ⚠️ "이미지 불러오기" 버튼을 찾을 수 없거나 활성화되지 않았습니다.');
      await page.screenshot({ path: 'test-gallery-load-button-not-found.png', fullPage: true });
      throw new Error('"이미지 불러오기" 버튼 클릭 실패');
    }

    // 8. "생성된 이미지" 섹션 나타날 때까지 대기
    console.log('8️⃣ "생성된 이미지" 섹션 나타날 때까지 대기...');
    await page.waitForTimeout(3000);

    // "생성된 이미지" 섹션 확인 (최대 30초 대기)
    let generatedImagesSection = null;
    let sectionAttempts = 0;
    const maxSectionAttempts = 30;

    while (sectionAttempts < maxSectionAttempts) {
      generatedImagesSection = await page.locator('h4:has-text("생성된 이미지"), div:has-text("생성된 이미지")').first();
      if (await generatedImagesSection.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log(`   ✅ "생성된 이미지" 섹션 발견 (시도 ${sectionAttempts + 1})`);
        break;
      }
      sectionAttempts++;
      await page.waitForTimeout(1000);
    }

    if (generatedImagesSection && await generatedImagesSection.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('   ✅ "생성된 이미지" 섹션 확인 완료');

      // "이미지 변형 중" 또는 "업로드 중" 상태가 끝날 때까지 대기
      console.log('   ⏳ 이미지 업로드 완료 대기 중...');
      let uploadComplete = false;
      let uploadAttempts = 0;
      const maxUploadAttempts = 60; // 최대 60초 대기

      while (!uploadComplete && uploadAttempts < maxUploadAttempts) {
        // "변형 중", "업로드 중", "생성 중" 텍스트 확인
        const uploadingText = await page.locator('text=변형 중, text=업로드 중, text=생성 중, text=...').first();
        const isUploading = await uploadingText.isVisible({ timeout: 1000 }).catch(() => false);

        if (!isUploading) {
          // 이미지가 완전히 로드되었는지 확인
          const generatedImage = await generatedImagesSection.locator('..').locator('..').locator('img').first();
          if (await generatedImage.isVisible({ timeout: 2000 }).catch(() => false)) {
            const imageSrc = await generatedImage.getAttribute('src');
            if (imageSrc && !imageSrc.includes('placeholder')) {
              console.log(`   ✅ 이미지 업로드 완료 확인 (시도 ${uploadAttempts + 1})`);
              uploadComplete = true;
              break;
            }
          }
        }

        uploadAttempts++;
        await page.waitForTimeout(1000);

        if (uploadAttempts % 10 === 0) {
          console.log(`   ⏳ 이미지 업로드 대기 중... (${uploadAttempts}초 경과)`);
        }
      }

      if (uploadComplete) {
        console.log('   ✅ 이미지 업로드 완료');
      } else {
        console.log('   ⚠️ 이미지 업로드 완료를 확인할 수 없지만 계속 진행...');
      }

      await page.screenshot({ path: 'test-gallery-generated-images-section.png', fullPage: true });

      // 9. 생성된 이미지 위의 "변형" 버튼 클릭
      console.log('9️⃣ 생성된 이미지 위의 "변형" 버튼 클릭...');
      await page.waitForTimeout(2000);

      // "생성된 이미지" 섹션 내부의 이미지 찾기 (모달 밖에 있을 수 있음)
      let generatedImage = null;
      let imageParent = null;

      // 페이지의 "생성된 이미지" 섹션 찾기
      const pageGeneratedSection = await page.locator('h4:has-text("생성된 이미지")').first();
      if (await pageGeneratedSection.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('   ✅ 페이지의 "생성된 이미지" 섹션 발견');
        const pageImageContainer = await pageGeneratedSection.locator('..').locator('..').first();
        generatedImage = await pageImageContainer.locator('img').first();
        imageParent = await generatedImage.locator('..').locator('..').first();
      } else {
        // 모달 내부에서 찾기
        const generatedImageContainer = await generatedImagesSection.locator('..').locator('..').first();
        generatedImage = await generatedImageContainer.locator('img').first();
        imageParent = await generatedImage.locator('..').locator('..').first();
      }

      if (await generatedImage.isVisible({ timeout: 5000 })) {
        console.log('   ✅ 생성된 이미지 발견');

        // 이미지에 직접 호버 (오버레이를 피하기 위해 이미지 자체에 호버)
        await page.evaluate((img) => {
          const container = img.closest('.relative.group, .relative[class*="group"]');
          if (container) {
            const event = new MouseEvent('mouseenter', {
              view: window,
              bubbles: true,
              cancelable: true
            });
            container.dispatchEvent(event);
          }
        }, await generatedImage.elementHandle());
        await page.waitForTimeout(1500);
        console.log('   ✅ 이미지 호버 완료');

        // 호버 시 나타나는 "변형" 버튼 찾기 (🎨 이모지 또는 title="변형")
        const variationButton = await imageParent.locator('button[title="변형"], button:has-text("🎨")').first();

        if (await variationButton.isVisible({ timeout: 5000 })) {
          console.log('   ✅ 이미지 위의 "변형" 버튼 발견');
          await variationButton.click();
          await page.waitForTimeout(3000);
          console.log('   ✅ "변형" 버튼 클릭 완료\n');

          // 10. 변형 생성 완료까지 대기
          console.log('🔟 변형 생성 완료까지 대기...');
          await page.waitForTimeout(3000);

          // "변형 중..." 또는 "생성 중..." 메시지 확인 및 대기
          let isGenerating = true;
          let generationAttempts = 0;
          const maxGenerationAttempts = 120; // 최대 2분 대기

          while (isGenerating && generationAttempts < maxGenerationAttempts) {
            // "변형 중...", "생성 중...", "업로드 중..." 텍스트 확인
            const generatingText = await page.locator('text=변형 중, text=생성 중, text=업로드 중, text=...').first();
            const isStillGenerating = await generatingText.isVisible({ timeout: 1000 }).catch(() => false);

            if (!isStillGenerating) {
              // 생성 완료 확인 모달 확인
              const completionModal = await page.locator('div[role="dialog"]:has-text("변형이 완료되었습니다"), div[role="dialog"]:has-text("생성되었습니다")').first();
              if (await completionModal.isVisible({ timeout: 2000 }).catch(() => false)) {
                console.log('   ✅ 생성 완료 확인 모달 발견');

                // "확인" 버튼 클릭하여 모달 닫기
                const confirmButton = await completionModal.locator('button:has-text("확인")').first();
                if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
                  await confirmButton.click();
                  await page.waitForTimeout(1000);
                  console.log('   ✅ 생성 완료 모달 닫기 완료');
                }

                isGenerating = false;
                break;
              }

              // 생성된 이미지 개수 확인
              const pageGeneratedSection2 = await page.locator('h4:has-text("생성된 이미지")').first();
              if (await pageGeneratedSection2.isVisible({ timeout: 2000 }).catch(() => false)) {
                const imageContainer = await pageGeneratedSection2.locator('..').locator('..').first();
                const newGeneratedImages = await imageContainer.locator('img').all();
                const imageCount = newGeneratedImages.length;

                if (imageCount > 1) {
                  console.log(`   ✅ 새로운 이미지 생성 완료! (총 ${imageCount}개)`);
                  isGenerating = false;
                  break;
                }
              }
            }

            generationAttempts++;
            await page.waitForTimeout(2000);

            if (generationAttempts % 10 === 0) {
              console.log(`   ⏳ 변형 생성 대기 중... (${generationAttempts * 2}초 경과)`);
            }
          }

          if (generationAttempts >= maxGenerationAttempts) {
            console.log('   ⚠️ 변형 생성 시간 초과 (최대 대기 시간 도달)');
          }

          // 최종 생성된 이미지 개수 확인
          const pageGeneratedSection2 = await page.locator('h4:has-text("생성된 이미지")').first();
          if (await pageGeneratedSection2.isVisible({ timeout: 3000 }).catch(() => false)) {
            const imageContainer = await pageGeneratedSection2.locator('..').locator('..').first();
            const finalGeneratedImages = await imageContainer.locator('img').all();
            console.log(`   ✅ 최종 생성된 이미지 개수: ${finalGeneratedImages.length}개`);
          }

          // 최종 스크린샷
          await page.waitForTimeout(3000);
          await page.screenshot({ path: 'test-gallery-variation-completed.png', fullPage: true });
          console.log('   📸 최종 스크린샷 저장: test-gallery-variation-completed.png');

        } else {
          console.log('   ⚠️ 이미지 위의 "변형" 버튼을 찾을 수 없습니다.');
          // 스크린샷 저장
          await page.screenshot({ path: 'test-gallery-no-variation-button.png', fullPage: true });

          // 다른 방법으로 버튼 찾기 시도
          const allButtons = await imageParent.locator('button').all();
          console.log(`   🔍 이미지 컨테이너 내부 버튼 개수: ${allButtons.length}개`);
          for (let i = 0; i < allButtons.length; i++) {
            const buttonText = await allButtons[i].textContent();
            const buttonTitle = await allButtons[i].getAttribute('title');
            console.log(`   📋 버튼 ${i + 1}: text="${buttonText}", title="${buttonTitle}"`);
          }
        }
      } else {
        console.log('   ⚠️ 생성된 이미지를 찾을 수 없습니다.');
        await page.screenshot({ path: 'test-gallery-no-generated-image.png', fullPage: true });
      }
    } else {
      console.log('   ⚠️ "생성된 이미지" 섹션을 찾을 수 없습니다.');
      await page.screenshot({ path: 'test-gallery-no-generated-section.png', fullPage: true });
    }

    await page.screenshot({ path: 'test-gallery-variation-final-state.png', fullPage: true });
    console.log('\n✅ 갤러리 변형 기능 테스트 완료!');

  } catch (error) {
    console.error(`❌ 테스트 실패: ${error.message}`);
    // 실패 시 스크린샷
    await page.screenshot({ path: 'test-gallery-variation-flow-failure.png', fullPage: true });
    throw error;
  } finally {
    await page.close();
    await browser.close();
  }
})();

