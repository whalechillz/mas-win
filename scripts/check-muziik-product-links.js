const playwright = require('playwright');

async function checkMuziikProductLinks() {
  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const baseUrl = 'https://masgolf.co.kr';
  const results = [];

  // 테스트할 링크들
  const linksToTest = [
    // 한글 사이트
    { url: `${baseUrl}/muziik`, name: '한글 메인 페이지' },
    { url: `${baseUrl}/muziik/sapphire`, name: '한글 사파이어 페이지' },
    { url: `${baseUrl}/muziik/beryl`, name: '한글 베릴 페이지' },
    // 일본어 사이트
    { url: `${baseUrl}/ja/muziik`, name: '일본어 메인 페이지' },
    { url: `${baseUrl}/ja/muziik/sapphire`, name: '일본어 사파이어 페이지' },
    { url: `${baseUrl}/ja/muziik/beryl`, name: '일본어 베릴 페이지' },
  ];

  console.log('=== MUZIIK 제품 페이지 링크 확인 ===\n');

  for (const link of linksToTest) {
    try {
      console.log(`확인 중: ${link.name} (${link.url})`);
      const response = await page.goto(link.url, { waitUntil: 'networkidle', timeout: 30000 });
      
      if (response) {
        const status = response.status();
        const isOk = status >= 200 && status < 300;
        
        results.push({
          name: link.name,
          url: link.url,
          status,
          ok: isOk,
        });

        if (isOk) {
          console.log(`✅ 성공: ${status}`);
          
          // 페이지에서 "자세히 보기" 링크 확인
          const detailLinks = await page.$$eval('a[href*="sapphire"], a[href*="beryl"]', (links) => 
            links.map(link => ({
              text: link.textContent.trim(),
              href: link.getAttribute('href'),
            }))
          );
          
          if (detailLinks.length > 0) {
            console.log('  "자세히 보기" 링크:');
            detailLinks.forEach(detailLink => {
              console.log(`    - ${detailLink.text}: ${detailLink.href}`);
            });
          }
        } else {
          console.log(`❌ 실패: ${status}`);
        }
      } else {
        results.push({
          name: link.name,
          url: link.url,
          status: 'NO_RESPONSE',
          ok: false,
        });
        console.log(`❌ 실패: 응답 없음`);
      }
    } catch (error) {
      results.push({
        name: link.name,
        url: link.url,
        status: 'ERROR',
        ok: false,
        error: error.message,
      });
      console.log(`❌ 오류: ${error.message}`);
    }
    console.log('');
  }

  // 메인 페이지에서 "자세히 보기" 링크 확인
  console.log('\n=== 메인 페이지 "자세히 보기" 링크 확인 ===\n');
  
  try {
    await page.goto(`${baseUrl}/muziik`, { waitUntil: 'networkidle', timeout: 30000 });
    
    const sapphireLink = await page.$('a[href*="sapphire"]');
    const berylLink = await page.$('a[href*="beryl"]');
    
    if (sapphireLink) {
      const sapphireHref = await sapphireLink.getAttribute('href');
      const sapphireText = await sapphireLink.textContent();
      console.log(`사파이어 링크: ${sapphireText.trim()} -> ${sapphireHref}`);
      
      if (!sapphireHref.includes('/muziik/')) {
        console.log(`  ⚠️  경고: /muziik/ 경로가 포함되지 않음`);
      }
    }
    
    if (berylLink) {
      const berylHref = await berylLink.getAttribute('href');
      const berylText = await berylLink.textContent();
      console.log(`베릴 링크: ${berylText.trim()} -> ${berylHref}`);
      
      if (!berylHref.includes('/muziik/')) {
        console.log(`  ⚠️  경고: /muziik/ 경로가 포함되지 않음`);
      }
    }
  } catch (error) {
    console.log(`오류: ${error.message}`);
  }

  // 일본어 메인 페이지에서 "자세히 보기" 링크 확인
  console.log('\n=== 일본어 메인 페이지 "자세히 보기" 링크 확인 ===\n');
  
  try {
    await page.goto(`${baseUrl}/ja/muziik`, { waitUntil: 'networkidle', timeout: 30000 });
    
    const sapphireLinkJa = await page.$('a[href*="sapphire"]');
    const berylLinkJa = await page.$('a[href*="beryl"]');
    
    if (sapphireLinkJa) {
      const sapphireHrefJa = await sapphireLinkJa.getAttribute('href');
      const sapphireTextJa = await sapphireLinkJa.textContent();
      console.log(`사파이어 링크: ${sapphireTextJa.trim()} -> ${sapphireHrefJa}`);
      
      if (!sapphireHrefJa.includes('/muziik/')) {
        console.log(`  ⚠️  경고: /muziik/ 경로가 포함되지 않음`);
      }
    }
    
    if (berylLinkJa) {
      const berylHrefJa = await berylLinkJa.getAttribute('href');
      const berylTextJa = await berylLinkJa.textContent();
      console.log(`베릴 링크: ${berylTextJa.trim()} -> ${berylHrefJa}`);
      
      if (!berylHrefJa.includes('/muziik/')) {
        console.log(`  ⚠️  경고: /muziik/ 경로가 포함되지 않음`);
      }
    }
  } catch (error) {
    console.log(`오류: ${error.message}`);
  }

  // 결과 요약
  console.log('\n=== 결과 요약 ===\n');
  const successCount = results.filter(r => r.ok).length;
  const failCount = results.filter(r => !r.ok).length;
  
  console.log(`성공: ${successCount}개`);
  console.log(`실패: ${failCount}개\n`);
  
  if (failCount > 0) {
    console.log('실패한 링크:');
    results.filter(r => !r.ok).forEach(r => {
      console.log(`  - ${r.name}: ${r.url} (${r.status})`);
    });
  }

  await browser.close();
}

checkMuziikProductLinks().catch(console.error);

