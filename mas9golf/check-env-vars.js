const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Vercel 환경 변수 확인...');
  
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome',
    slowMo: 1000,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor'
    ]
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  // 자동화 감지 방지
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
  });
  
  try {
    console.log('📱 Vercel 환경 변수 페이지 직접 접속...');
    await page.goto('https://vercel.com/taksoo-kims-projects/mas-win/settings/environments/production');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // 스크린샷
    await page.screenshot({ path: 'vercel-env-vars-direct.png', fullPage: true });
    console.log('📸 환경 변수 페이지 스크린샷 저장됨');
    
    // 환경 변수 정보 추출
    const envVars = await page.evaluate(() => {
      // 다양한 셀렉터 시도
      const selectors = [
        'tr[data-testid="env-row"]',
        'tr[data-testid="environment-variable-row"]',
        '.env-row',
        'tbody tr',
        '[data-testid="env-vars"] tr',
        '.environment-variable-row'
      ];
      
      let rows = [];
      for (const selector of selectors) {
        rows = Array.from(document.querySelectorAll(selector));
        if (rows.length > 0) {
          console.log(`Found ${rows.length} rows with selector: ${selector}`);
          break;
        }
      }
      
      const envVars = rows.map((row, index) => {
        const cells = Array.from(row.querySelectorAll('td, th'));
        const nameCell = cells[0];
        const valueCell = cells[1];
        const statusCell = cells[2];
        
        return {
          index: index + 1,
          name: nameCell?.textContent?.trim() || '',
          value: valueCell?.textContent?.trim() || '',
          status: statusCell?.textContent?.trim() || '',
          isSupabase: nameCell?.textContent?.toLowerCase().includes('supabase') || false
        };
      });
      
      return {
        totalVars: envVars.length,
        supabaseVars: envVars.filter(v => v.isSupabase),
        allVars: envVars
      };
    });
    
    console.log('환경 변수 정보:', envVars);
    
    if (envVars.supabaseVars.length > 0) {
      console.log('\n🔍 Supabase 관련 환경 변수:');
      envVars.supabaseVars.forEach(v => {
        console.log(`  ${v.name}: ${v.value ? '설정됨' : '없음'} (${v.status})`);
      });
    } else {
      console.log('\n❌ Supabase 환경 변수를 찾을 수 없습니다');
    }
    
    if (envVars.allVars.length > 0) {
      console.log('\n📋 모든 환경 변수:');
      envVars.allVars.forEach(v => {
        console.log(`  ${v.name}: ${v.value ? '설정됨' : '없음'} (${v.status})`);
      });
    } else {
      console.log('\n❌ 환경 변수를 찾을 수 없습니다');
    }
    
    // 페이지 소스에서 환경 변수 찾기
    const pageContent = await page.content();
    const supabaseInSource = pageContent.toLowerCase().includes('supabase');
    console.log(`\n페이지 소스에 'supabase' 포함: ${supabaseInSource}`);
    
    if (supabaseInSource) {
      const supabaseMatches = pageContent.match(/supabase[^<]*/gi);
      console.log('Supabase 관련 텍스트:', supabaseMatches?.slice(0, 5));
    }
    
  } catch (error) {
    console.error('❌ 확인 중 오류:', error.message);
    await page.screenshot({ path: 'vercel-env-check-error.png', fullPage: true });
  } finally {
    console.log('⏳ 브라우저를 10초 후에 닫습니다...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    await browser.close();
  }
})();
