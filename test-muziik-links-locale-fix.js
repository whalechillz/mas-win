const { chromium } = require('playwright');

async function testMuziikLinksLocaleFix() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🔍 MUZIIK 링크 locale prop 수정 후 테스트 시작...\n');

  const results = {
    success: [],
    failed: []
  };

  try {
    // 1. 메인 페이지 로드 (천천히)
    console.log('📌 1. MUZIIK 메인 페이지 로드 중...');
    await page.goto('https://muziik.masgolf.co.kr/muziik', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(5000); // 충분한 대기
    
    const currentUrl = page.url();
    console.log(`   ✅ 현재 URL: ${currentUrl}\n`);

    // 2. "자세히 보기" 버튼 찾기 및 href 확인
    console.log('📌 2. "자세히 보기" 버튼 href 확인...\n');
    await page.waitForTimeout(2000);
    
    // Sapphire 버튼 찾기
    const sapphireButtons = await page.locator('a[href*="sapphire"]:has-text("자세히 보기")').all();
    console.log(`   발견된 Sapphire "자세히 보기" 버튼: ${sapphireButtons.length}개`);
    
    if (sapphireButtons.length > 0) {
      const sapphireButton = sapphireButtons[0];
      const sapphireHref = await sapphireButton.getAttribute('href');
      const sapphireComputedHref = await sapphireButton.evaluate(el => el.href);
      console.log(`   버튼 href 속성: "${sapphireHref}"`);
      console.log(`   버튼 실제 href: "${sapphireComputedHref}"`);
      
      if (sapphireHref === '/muziik/sapphire' || sapphireHref === '/muziik/sapphire') {
        console.log(`   ✅ href가 올바르게 설정됨: ${sapphireHref}`);
        results.success.push({ type: 'Sapphire 버튼 href', value: sapphireHref });
      } else if (sapphireHref === '/sapphire') {
        console.log(`   ❌ href가 여전히 잘못됨: ${sapphireHref} (예상: /muziik/sapphire)`);
        results.failed.push({ type: 'Sapphire 버튼 href', value: sapphireHref, expected: '/muziik/sapphire' });
      } else {
        console.log(`   ⚠️  예상치 못한 href: ${sapphireHref}`);
        results.failed.push({ type: 'Sapphire 버튼 href', value: sapphireHref, expected: '/muziik/sapphire' });
      }
      
      // 버튼 클릭 테스트
      console.log(`   클릭 테스트 중...`);
      await page.waitForTimeout(1000);
      await sapphireButton.click({ timeout: 10000 });
      
      await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      await page.waitForTimeout(3000);
      
      const finalUrl = page.url();
      const bodyText = await page.textContent('body');
      const has404 = bodyText.includes('404') || 
                     bodyText.includes('페이지를 찾을 수 없습니다') || 
                     bodyText.includes('제품을 찾을 수 없습니다');
      const hasSapphire = bodyText.includes('Sapphire') || bodyText.includes('サファイア');
      
      if (has404) {
        console.log(`   ❌ 404 오류 발생!`);
        results.failed.push({ type: 'Sapphire 버튼 클릭', url: finalUrl, reason: '404 오류' });
      } else if (hasSapphire) {
        console.log(`   ✅ Sapphire 페이지 정상 로드`);
        console.log(`   최종 URL: ${finalUrl}`);
        if (finalUrl.includes('/muziik/sapphire')) {
          console.log(`   ✅ 올바른 경로로 이동됨`);
          results.success.push({ type: 'Sapphire 버튼 클릭', url: finalUrl });
        } else {
          console.log(`   ⚠️  다른 경로로 이동: ${finalUrl}`);
          results.failed.push({ type: 'Sapphire 버튼 클릭', url: finalUrl, expected: '/muziik/sapphire' });
        }
      } else {
        console.log(`   ⚠️  페이지는 로드되었지만 Sapphire 내용이 없음`);
        results.failed.push({ type: 'Sapphire 버튼 클릭', url: finalUrl, reason: 'Sapphire 내용 없음' });
      }
    } else {
      console.log(`   ❌ Sapphire "자세히 보기" 버튼을 찾을 수 없습니다.`);
      results.failed.push({ type: 'Sapphire 버튼', reason: '버튼을 찾을 수 없음' });
    }

    // 3. 메인 페이지로 돌아가기
    console.log('\n📌 3. 메인 페이지로 돌아가기...');
    await page.goto('https://muziik.masgolf.co.kr/muziik', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(3000);

    // 4. Beryl 버튼 찾기 및 href 확인
    console.log('\n📌 4. Beryl "자세히 보기" 버튼 href 확인...\n');
    await page.waitForTimeout(2000);
    
    const berylButtons = await page.locator('a[href*="beryl"]:has-text("자세히 보기")').all();
    console.log(`   발견된 Beryl "자세히 보기" 버튼: ${berylButtons.length}개`);
    
    if (berylButtons.length > 0) {
      const berylButton = berylButtons[0];
      const berylHref = await berylButton.getAttribute('href');
      const berylComputedHref = await berylButton.evaluate(el => el.href);
      console.log(`   버튼 href 속성: "${berylHref}"`);
      console.log(`   버튼 실제 href: "${berylComputedHref}"`);
      
      if (berylHref === '/muziik/beryl' || berylHref === '/muziik/beryl') {
        console.log(`   ✅ href가 올바르게 설정됨: ${berylHref}`);
        results.success.push({ type: 'Beryl 버튼 href', value: berylHref });
      } else if (berylHref === '/beryl') {
        console.log(`   ❌ href가 여전히 잘못됨: ${berylHref} (예상: /muziik/beryl)`);
        results.failed.push({ type: 'Beryl 버튼 href', value: berylHref, expected: '/muziik/beryl' });
      } else {
        console.log(`   ⚠️  예상치 못한 href: ${berylHref}`);
        results.failed.push({ type: 'Beryl 버튼 href', value: berylHref, expected: '/muziik/beryl' });
      }
      
      // 버튼 클릭 테스트
      console.log(`   클릭 테스트 중...`);
      await page.waitForTimeout(1000);
      await berylButton.click({ timeout: 10000 });
      
      await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      await page.waitForTimeout(3000);
      
      const finalUrl = page.url();
      const bodyText = await page.textContent('body');
      const has404 = bodyText.includes('404') || 
                     bodyText.includes('페이지를 찾을 수 없습니다') || 
                     bodyText.includes('제품을 찾을 수 없습니다');
      const hasBeryl = bodyText.includes('Beryl') || bodyText.includes('ベリル');
      
      if (has404) {
        console.log(`   ❌ 404 오류 발생!`);
        results.failed.push({ type: 'Beryl 버튼 클릭', url: finalUrl, reason: '404 오류' });
      } else if (hasBeryl) {
        console.log(`   ✅ Beryl 페이지 정상 로드`);
        console.log(`   최종 URL: ${finalUrl}`);
        if (finalUrl.includes('/muziik/beryl')) {
          console.log(`   ✅ 올바른 경로로 이동됨`);
          results.success.push({ type: 'Beryl 버튼 클릭', url: finalUrl });
        } else {
          console.log(`   ⚠️  다른 경로로 이동: ${finalUrl}`);
          results.failed.push({ type: 'Beryl 버튼 클릭', url: finalUrl, expected: '/muziik/beryl' });
        }
      } else {
        console.log(`   ⚠️  페이지는 로드되었지만 Beryl 내용이 없음`);
        results.failed.push({ type: 'Beryl 버튼 클릭', url: finalUrl, reason: 'Beryl 내용 없음' });
      }
    } else {
      console.log(`   ❌ Beryl "자세히 보기" 버튼을 찾을 수 없습니다.`);
      results.failed.push({ type: 'Beryl 버튼', reason: '버튼을 찾을 수 없음' });
    }

    // 5. 페이지 소스에서 직접 확인
    console.log('\n📌 5. 페이지 소스에서 직접 확인...\n');
    await page.goto('https://muziik.masgolf.co.kr/muziik', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const pageContent = await page.content();
    
    // href="/muziik/sapphire" 패턴 찾기
    const muziikSapphireMatches = pageContent.match(/href=["']\/muziik\/sapphire["']/g);
    const sapphireMatches = pageContent.match(/href=["']\/sapphire["']/g);
    
    console.log(`   href="/muziik/sapphire" 패턴: ${muziikSapphireMatches ? muziikSapphireMatches.length : 0}개 발견`);
    console.log(`   href="/sapphire" 패턴: ${sapphireMatches ? sapphireMatches.length : 0}개 발견`);
    
    if (muziikSapphireMatches && muziikSapphireMatches.length > 0) {
      console.log(`   ✅ 올바른 href="/muziik/sapphire" 패턴 발견`);
      results.success.push({ type: '페이지 소스 Sapphire', count: muziikSapphireMatches.length });
    } else {
      console.log(`   ❌ href="/muziik/sapphire" 패턴이 발견되지 않음`);
      results.failed.push({ type: '페이지 소스 Sapphire', reason: '올바른 패턴 없음' });
    }
    
    if (sapphireMatches && sapphireMatches.length > 0) {
      console.log(`   ⚠️  문제: href="/sapphire" 패턴이 여전히 발견됨!`);
      results.failed.push({ type: '페이지 소스 Sapphire', reason: '잘못된 패턴 발견', count: sapphireMatches.length });
    }
    
    // href="/muziik/beryl" 패턴 찾기
    const muziikBerylMatches = pageContent.match(/href=["']\/muziik\/beryl["']/g);
    const berylMatches = pageContent.match(/href=["']\/beryl["']/g);
    
    console.log(`\n   href="/muziik/beryl" 패턴: ${muziikBerylMatches ? muziikBerylMatches.length : 0}개 발견`);
    console.log(`   href="/beryl" 패턴: ${berylMatches ? berylMatches.length : 0}개 발견`);
    
    if (muziikBerylMatches && muziikBerylMatches.length > 0) {
      console.log(`   ✅ 올바른 href="/muziik/beryl" 패턴 발견`);
      results.success.push({ type: '페이지 소스 Beryl', count: muziikBerylMatches.length });
    } else {
      console.log(`   ❌ href="/muziik/beryl" 패턴이 발견되지 않음`);
      results.failed.push({ type: '페이지 소스 Beryl', reason: '올바른 패턴 없음' });
    }
    
    if (berylMatches && berylMatches.length > 0) {
      console.log(`   ⚠️  문제: href="/beryl" 패턴이 여전히 발견됨!`);
      results.failed.push({ type: '페이지 소스 Beryl', reason: '잘못된 패턴 발견', count: berylMatches.length });
    }

    // 6. 결과 요약
    console.log('\n📊 테스트 결과 요약:');
    console.log('='.repeat(60));
    console.log(`✅ 성공: ${results.success.length}개`);
    results.success.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.type}`);
      if (item.value) {
        console.log(`      값: ${item.value}`);
      }
      if (item.url) {
        console.log(`      URL: ${item.url}`);
      }
      if (item.count) {
        console.log(`      개수: ${item.count}`);
      }
    });
    
    console.log(`\n❌ 실패: ${results.failed.length}개`);
    if (results.failed.length > 0) {
      results.failed.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.type}`);
        if (item.value) {
          console.log(`      값: ${item.value}`);
        }
        if (item.expected) {
          console.log(`      예상: ${item.expected}`);
        }
        if (item.url) {
          console.log(`      URL: ${item.url}`);
        }
        if (item.reason) {
          console.log(`      이유: ${item.reason}`);
        }
        if (item.count) {
          console.log(`      개수: ${item.count}`);
        }
      });
    } else {
      console.log('   실패한 테스트 없음');
    }

    // 7. 최종 판정
    console.log('\n🎯 최종 판정:');
    if (results.failed.length === 0) {
      console.log('   ✅ 모든 테스트 통과! locale prop 수정이 성공적으로 작동합니다.');
    } else {
      console.log('   ⚠️  일부 테스트 실패. locale prop 수정이 완전히 작동하지 않을 수 있습니다.');
    }

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    console.log('\n✅ 테스트 완료');
    await browser.close();
  }
}

testMuziikLinksLocaleFix()
  .then(() => {
    console.log('\n✅ 모든 테스트 완료');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 테스트 실패:', error);
    process.exit(1);
  });












