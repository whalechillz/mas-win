const { chromium } = require('playwright');
const fs = require('fs');
const { execSync } = require('child_process');

async function fixIconIssues() {
  console.log('🔧 아이콘 문제 자동 해결 시작...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const page = await browser.newPage();
  
  try {
    // 1. 현재 상태 확인
    console.log('\n1️⃣ 현재 상태 확인...');
    
    // lucide-react 설치 상태 확인
    try {
      const lucideCheck = execSync('npm list lucide-react', { encoding: 'utf8' });
      console.log('✅ lucide-react 설치됨');
    } catch (error) {
      console.log('❌ lucide-react 미설치');
    }
    
    // 2. 서버 시작 및 오류 확인
    console.log('\n2️⃣ 서버 시작 및 오류 확인...');
    
    // 서버 시작 (백그라운드)
    const serverProcess = execSync('npm run dev', { 
      encoding: 'utf8',
      timeout: 10000 
    });
    
    console.log('서버 시작됨');
    
    // 3. 브라우저에서 오류 확인
    console.log('\n3️⃣ 브라우저에서 오류 확인...');
    
    await page.goto('http://localhost:3000/admin');
    
    // 콘솔 오류 확인
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.log('❌ 브라우저 오류:', msg.text());
      }
    });
    
    await page.waitForTimeout(3000);
    
    // 4. 아이콘 관련 오류 분석
    console.log('\n4️⃣ 아이콘 관련 오류 분석...');
    
    const iconErrors = errors.filter(error => 
      error.includes('lucide') || 
      error.includes('icon') || 
      error.includes('feather') ||
      error.includes('Module not found')
    );
    
    if (iconErrors.length > 0) {
      console.log('🔍 아이콘 관련 오류 발견:');
      iconErrors.forEach(error => console.log(`   - ${error}`));
      
      // 5. 해결 방법 선택
      console.log('\n5️⃣ 해결 방법 선택...');
      
      const hasLucideErrors = iconErrors.some(error => error.includes('lucide'));
      const hasFeatherErrors = iconErrors.some(error => error.includes('feather'));
      
      if (hasLucideErrors) {
        console.log('📦 lucide-react 재설치 필요');
        await fixLucideReact();
      } else if (hasFeatherErrors) {
        console.log('🪶 Feather 아이콘 설정 수정 필요');
        await fixFeatherIcons();
      } else {
        console.log('🔧 일반적인 아이콘 문제 해결');
        await fixGeneralIconIssues();
      }
    } else {
      console.log('✅ 아이콘 관련 오류 없음');
    }
    
    // 6. 대시보드 상태 확인
    console.log('\n6️⃣ 대시보드 상태 확인...');
    
    try {
      // 로그인 시도
      await page.fill('input[type="text"]', 'admin');
      const password = process.env.ADMIN_PASSWORD || ''; await page.fill('input[type="password"]', password);
      await page.click('button[type="submit"]');
      
      await page.waitForSelector('h1:has-text("MASGOLF 관리자")', { timeout: 10000 });
      console.log('✅ 로그인 성공');
      
      // 대시보드 스크린샷
      await page.screenshot({ path: 'dashboard-after-fix.png', fullPage: true });
      console.log('📸 대시보드 스크린샷 저장됨');
      
      // 아이콘 렌더링 확인
      const icons = await page.evaluate(() => {
        const iconElements = document.querySelectorAll('[data-feather], .lucide, svg');
        return Array.from(iconElements).map(el => ({
          tag: el.tagName,
          className: el.className,
          dataFeather: el.getAttribute('data-feather')
        }));
      });
      
      console.log(`✅ ${icons.length}개의 아이콘 요소 발견`);
      
    } catch (error) {
      console.log('❌ 로그인 또는 대시보드 로드 실패:', error.message);
    }
    
  } catch (error) {
    console.error('❌ 자동화 오류:', error);
    await page.screenshot({ path: 'icon-fix-error.png' });
  } finally {
    await browser.close();
  }
}

async function fixLucideReact() {
  console.log('\n📦 lucide-react 재설치 중...');
  
  try {
    // 기존 설치 제거
    execSync('npm uninstall lucide-react', { stdio: 'inherit' });
    console.log('✅ 기존 lucide-react 제거됨');
    
    // 새로 설치
    execSync('npm install lucide-react', { stdio: 'inherit' });
    console.log('✅ lucide-react 재설치됨');
    
    // 컴포넌트 파일 수정
    await updateComponentsToLucide();
    
  } catch (error) {
    console.error('❌ lucide-react 설치 오류:', error.message);
  }
}

async function fixFeatherIcons() {
  console.log('\n🪶 Feather 아이콘 설정 수정 중...');
  
  try {
    // _document.tsx 확인 및 수정
    const documentPath = 'pages/_document.tsx';
    if (fs.existsSync(documentPath)) {
      let content = fs.readFileSync(documentPath, 'utf8');
      
      // Feather CDN 스크립트 추가
      if (!content.includes('feather-icons')) {
        content = content.replace(
          '<Head>',
          `<Head>
            <script src="https://unpkg.com/feather-icons"></script>`
        );
        
        // feather.replace() 호출 추가
        if (!content.includes('feather.replace()')) {
          content = content.replace(
            '<NextScript />',
            `<NextScript />
            <script dangerouslySetInnerHTML={{
              __html: \`
                feather.replace();
              \`
            }} />`
          );
        }
        
        fs.writeFileSync(documentPath, content);
        console.log('✅ _document.tsx Feather 설정 완료');
      }
    }
    
    // 컴포넌트 파일 수정
    await updateComponentsToFeather();
    
  } catch (error) {
    console.error('❌ Feather 아이콘 설정 오류:', error.message);
  }
}

async function fixGeneralIconIssues() {
  console.log('\n🔧 일반적인 아이콘 문제 해결 중...');
  
  try {
    // 모든 아이콘 관련 컴포넌트 확인
    const components = [
      'components/admin/dashboard/CampaignKPIDashboard.tsx',
      'components/admin/dashboard/GA4RealtimeDashboard.tsx',
      'components/admin/marketing/MarketingDashboardComplete.tsx',
      'components/admin/marketing/AIGenerationSettingsNew.tsx',
      'components/admin/marketing/AIContentAssistant.tsx'
    ];
    
    for (const component of components) {
      if (fs.existsSync(component)) {
        let content = fs.readFileSync(component, 'utf8');
        
        // lucide-react import 제거
        content = content.replace(/import.*lucide-react.*\n/g, '');
        
        // 아이콘 사용 부분을 텍스트로 대체
        content = content.replace(/<[^>]*lucide[^>]*>/g, '📊');
        content = content.replace(/<[^>]*feather[^>]*>/g, '📊');
        
        fs.writeFileSync(component, content);
        console.log(`✅ ${component} 아이콘 문제 해결됨`);
      }
    }
    
  } catch (error) {
    console.error('❌ 일반적인 아이콘 문제 해결 오류:', error.message);
  }
}

async function updateComponentsToLucide() {
  console.log('\n🔄 컴포넌트를 lucide-react로 업데이트 중...');
  
  const components = [
    'components/admin/dashboard/CampaignKPIDashboard.tsx',
    'components/admin/dashboard/GA4RealtimeDashboard.tsx',
    'components/admin/marketing/MarketingDashboardComplete.tsx'
  ];
  
  for (const component of components) {
    if (fs.existsSync(component)) {
      let content = fs.readFileSync(component, 'utf8');
      
      // lucide-react import 추가
      if (!content.includes('lucide-react')) {
        content = `import { TrendingUp, Users, Phone, Target, BarChart3, Calendar } from 'lucide-react';\n${content}`;
      }
      
      // Feather 아이콘을 lucide-react로 변경
      content = content.replace(/<i data-feather="([^"]+)"/g, (match, iconName) => {
        const lucideMap = {
          'trending-up': 'TrendingUp',
          'users': 'Users',
          'phone': 'Phone',
          'target': 'Target',
          'bar-chart-3': 'BarChart3',
          'calendar': 'Calendar'
        };
        const lucideIcon = lucideMap[iconName] || 'TrendingUp';
        return `<${lucideIcon}`;
      });
      
      content = content.replace(/<\/i>/g, ' />');
      
      fs.writeFileSync(component, content);
      console.log(`✅ ${component} lucide-react로 업데이트됨`);
    }
  }
}

async function updateComponentsToFeather() {
  console.log('\n🔄 컴포넌트를 Feather 아이콘으로 업데이트 중...');
  
  const components = [
    'components/admin/dashboard/CampaignKPIDashboard.tsx',
    'components/admin/dashboard/GA4RealtimeDashboard.tsx',
    'components/admin/marketing/MarketingDashboardComplete.tsx'
  ];
  
  for (const component of components) {
    if (fs.existsSync(component)) {
      let content = fs.readFileSync(component, 'utf8');
      
      // lucide-react import 제거
      content = content.replace(/import.*lucide-react.*\n/g, '');
      
      // lucide-react 아이콘을 Feather로 변경
      content = content.replace(/<TrendingUp/g, '<i data-feather="trending-up"');
      content = content.replace(/<Users/g, '<i data-feather="users"');
      content = content.replace(/<Phone/g, '<i data-feather="phone"');
      content = content.replace(/<Target/g, '<i data-feather="target"');
      content = content.replace(/<BarChart3/g, '<i data-feather="bar-chart-3"');
      content = content.replace(/<Calendar/g, '<i data-feather="calendar"');
      
      content = content.replace(/ \/>/g, '></i>');
      
      fs.writeFileSync(component, content);
      console.log(`✅ ${component} Feather 아이콘으로 업데이트됨`);
    }
  }
}

// 스크립트 실행
fixIconIssues().catch(console.error); 