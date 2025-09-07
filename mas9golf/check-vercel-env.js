const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Vercel 환경 설정 확인...');
  
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome', // 일반 Chrome 사용
    slowMo: 1000, // 1초씩 천천히 실행
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
    console.log('📱 Vercel 대시보드 접속...');
    await page.goto('https://vercel.com/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 스크린샷
    await page.screenshot({ path: 'vercel-dashboard.png', fullPage: true });
    console.log('📸 Vercel 대시보드 스크린샷 저장됨');
    
    // 로그인 상태 확인
    const loginStatus = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a'));
      const loginButton = buttons.find(btn => btn.textContent.includes('Sign In') || btn.textContent.includes('Log In'));
      const userMenu = document.querySelector('[data-testid="user-menu"], .user-menu, [aria-label*="user"]');
      const projectList = document.querySelector('[data-testid="project-list"], .project-list');
      
      return {
        needsLogin: loginButton !== null,
        isLoggedIn: userMenu !== null,
        hasProjects: projectList !== null,
        currentUrl: window.location.href,
        pageTitle: document.title
      };
    });
    
    console.log('로그인 상태:', loginStatus);
    
    if (loginStatus.needsLogin) {
      console.log('🔐 로그인이 필요합니다');
      
      // 로그인 버튼 클릭
      const loginBtn = await page.$('button:text("Sign In"), a:text("Sign In")');
      if (loginBtn) {
        await loginBtn.click();
        await page.waitForTimeout(3000);
      }
      
      // 로그인 페이지 스크린샷
      await page.screenshot({ path: 'vercel-login-page.png', fullPage: true });
      console.log('📸 로그인 페이지 스크린샷 저장됨');
      
      // 로그인 방법 확인
      const loginMethods = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, a'));
        const githubLogin = buttons.find(btn => btn.textContent.includes('GitHub'));
        const emailLogin = document.querySelector('input[type="email"], input[placeholder*="email"]');
        const passwordLogin = document.querySelector('input[type="password"]');
        
        return {
          hasGithubLogin: githubLogin !== null,
          hasEmailLogin: emailLogin !== null,
          hasPasswordLogin: passwordLogin !== null,
          loginUrl: window.location.href
        };
      });
      
      console.log('로그인 방법:', loginMethods);
      
      if (loginMethods.hasGithubLogin) {
        console.log('✅ GitHub 로그인 가능');
      }
      
      if (loginMethods.hasEmailLogin) {
        console.log('✅ 이메일 로그인 가능');
      }
      
      console.log('❌ 로그인이 필요합니다. 사용자 도움이 필요합니다.');
      console.log('⏳ 브라우저를 열어둡니다. 로그인 후 Enter를 눌러주세요...');
      
      // 사용자 입력 대기
      await new Promise(resolve => {
        process.stdin.once('data', () => {
          resolve();
        });
      });
      
      // 페이지 새로고침
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      // 로그인 후 상태 재확인
      const afterLoginStatus = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, a'));
        const loginButton = buttons.find(btn => btn.textContent.includes('Sign In') || btn.textContent.includes('Log In'));
        const userMenu = document.querySelector('[data-testid="user-menu"], .user-menu, [aria-label*="user"]');
        const projectList = document.querySelector('[data-testid="project-list"], .project-list');
        
        return {
          needsLogin: loginButton !== null,
          isLoggedIn: userMenu !== null,
          hasProjects: projectList !== null,
          currentUrl: window.location.href,
          pageTitle: document.title
        };
      });
      
      console.log('로그인 후 상태:', afterLoginStatus);
      
      if (afterLoginStatus.isLoggedIn) {
        console.log('✅ 로그인 성공!');
        loginStatus.isLoggedIn = true;
        loginStatus.hasProjects = afterLoginStatus.hasProjects;
      }
      
    } 
    
    if (loginStatus.isLoggedIn) {
      console.log('✅ 이미 로그인되어 있습니다');
      
      // 프로젝트 찾기
      const projectInfo = await page.evaluate(() => {
        const projects = Array.from(document.querySelectorAll('[data-testid="project-card"], .project-card, [data-testid="project-item"]'));
        const masProject = projects.find(project => {
          const text = project.textContent.toLowerCase();
          return text.includes('mas') || text.includes('masgolf') || text.includes('win');
        });
        
        return {
          totalProjects: projects.length,
          foundMasProject: masProject !== null,
          projectNames: projects.map(p => p.textContent.trim()).slice(0, 5)
        };
      });
      
      console.log('프로젝트 정보:', projectInfo);
      
      if (projectInfo.foundMasProject) {
        console.log('✅ MAS 프로젝트를 찾았습니다');
        
        // MAS 프로젝트 클릭
        const masProject = await page.$('[data-testid="project-card"], .project-card');
        if (masProject) {
          await masProject.click();
          await page.waitForTimeout(3000);
        }
        
        // 프로젝트 페이지 스크린샷
        await page.screenshot({ path: 'vercel-project-page.png', fullPage: true });
        console.log('📸 프로젝트 페이지 스크린샷 저장됨');
        
        // 환경 변수 탭 찾기
        const envTab = await page.$('a:text("Environment Variables"), button:text("Environment Variables"), [data-testid="env-vars"]');
        if (envTab) {
          console.log('✅ 환경 변수 탭을 찾았습니다');
          await envTab.click();
          await page.waitForTimeout(3000);
          
          // 환경 변수 페이지 스크린샷
          await page.screenshot({ path: 'vercel-env-vars.png', fullPage: true });
          console.log('📸 환경 변수 페이지 스크린샷 저장됨');
          
          // Supabase 환경 변수 확인
          const supabaseVars = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('tr, .env-row, [data-testid="env-row"]'));
            const supabaseRows = rows.filter(row => {
              const text = row.textContent.toLowerCase();
              return text.includes('supabase');
            });
            
            return {
              totalEnvVars: rows.length,
              supabaseVars: supabaseRows.map(row => ({
                name: row.querySelector('td:first-child, .env-name')?.textContent?.trim(),
                value: row.querySelector('td:nth-child(2), .env-value')?.textContent?.trim(),
                status: row.querySelector('.status, .env-status')?.textContent?.trim()
              }))
            };
          });
          
          console.log('Supabase 환경 변수:', supabaseVars);
          
        } else {
          console.log('❌ 환경 변수 탭을 찾을 수 없습니다');
        }
        
      } else {
        console.log('❌ MAS 프로젝트를 찾을 수 없습니다');
        console.log('사용 가능한 프로젝트:', projectInfo.projectNames);
      }
    }
    
  } catch (error) {
    console.error('❌ 확인 중 오류:', error.message);
    await page.screenshot({ path: 'vercel-check-error.png', fullPage: true });
  } finally {
    console.log('⏳ 브라우저를 10초 후에 닫습니다...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    await browser.close();
  }
})();
