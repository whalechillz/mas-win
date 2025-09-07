const { chromium } = require('playwright');

// Git 및 Supabase 설정 확인
async function checkGitSupabaseSettings() {
  let browser;
  try {
    console.log('🔍 Git 및 Supabase 설정 확인 시작...');
    
    // Chrome Canary 연결
    console.log('🔗 Chrome Canary 연결 중...');
    browser = await chromium.connectOverCDP('http://localhost:9222');
    const page = await browser.newPage();
    
    // 더 큰 뷰포트 설정
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    console.log('✅ Chrome Canary 연결 완료');
    
    // 1. Vercel 프로젝트 설정 확인
    console.log('\n📋 Vercel 프로젝트 설정 확인 중...');
    
    const vercelUrl = 'https://vercel.com/taksoo-kims-projects/mas-win/settings/environments';
    console.log(`📄 Vercel 프로젝트 설정 페이지로 이동: ${vercelUrl}`);
    
    await page.goto(vercelUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // 페이지 제목 확인
    const vercelTitle = await page.title();
    console.log(`📋 Vercel 페이지 제목: ${vercelTitle}`);
    
    // Git 설정 확인
    console.log('\n🔧 Git 설정 확인...');
    
    // Branch Tracking 설정 확인
    const branchTracking = await page.evaluate(() => {
      const branchText = document.querySelector('input[value="main"]');
      const branchDescription = document.querySelector('p:contains("Every commit pushed to the main branch")');
      
      return {
        branch: branchText ? branchText.value : null,
        description: branchDescription ? branchDescription.textContent : null
      };
    });
    
    console.log(`  🌿 Production Branch: ${branchTracking.branch || '확인 불가'}`);
    console.log(`  📝 설명: ${branchTracking.description || '확인 불가'}`);
    
    // Auto-assign Custom Domains 설정 확인
    const autoAssignDomains = await page.evaluate(() => {
      const toggle = document.querySelector('input[type="checkbox"]:checked');
      const toggleLabel = document.querySelector('label:contains("Auto-assign Custom Production Domains")');
      
      return {
        enabled: toggle ? true : false,
        label: toggleLabel ? toggleLabel.textContent : null
      };
    });
    
    console.log(`  🔗 Auto-assign Custom Domains: ${autoAssignDomains.enabled ? 'Enabled' : 'Disabled'}`);
    
    // Environment Variables 확인
    console.log('\n🔑 Environment Variables 확인...');
    
    // Environment Variables 탭으로 이동
    try {
      await page.click('a[href*="environment-variables"]');
      await page.waitForTimeout(2000);
      
      const envVars = await page.evaluate(() => {
        const envRows = document.querySelectorAll('tr[data-testid*="env-var"]');
        const variables = [];
        
        envRows.forEach(row => {
          const name = row.querySelector('td:first-child')?.textContent;
          const value = row.querySelector('td:nth-child(2)')?.textContent;
          const environment = row.querySelector('td:nth-child(3)')?.textContent;
          
          if (name) {
            variables.push({
              name: name.trim(),
              value: value ? value.trim() : '***',
              environment: environment ? environment.trim() : 'Unknown'
            });
          }
        });
        
        return variables;
      });
      
      console.log(`  📊 발견된 환경 변수: ${envVars.length}개`);
      
      // Supabase 관련 환경 변수 찾기
      const supabaseVars = envVars.filter(v => 
        v.name.toLowerCase().includes('supabase') || 
        v.name.toLowerCase().includes('database') ||
        v.name.toLowerCase().includes('db_')
      );
      
      if (supabaseVars.length > 0) {
        console.log('  🗄️ Supabase 관련 환경 변수:');
        supabaseVars.forEach(v => {
          console.log(`    - ${v.name}: ${v.value} (${v.environment})`);
        });
      } else {
        console.log('  ❌ Supabase 관련 환경 변수를 찾을 수 없습니다');
      }
      
      // 모든 환경 변수 출력
      console.log('  📋 모든 환경 변수:');
      envVars.forEach(v => {
        console.log(`    - ${v.name}: ${v.value} (${v.environment})`);
      });
      
    } catch (error) {
      console.log('  ❌ Environment Variables 탭 접근 실패:', error.message);
    }
    
    // Vercel 스크린샷 저장
    await page.screenshot({ 
      path: 'mas9golf/vercel-settings-screenshot.png',
      fullPage: true 
    });
    console.log('📸 Vercel 설정 스크린샷 저장: mas9golf/vercel-settings-screenshot.png');
    
    // 2. Supabase 대시보드 확인
    console.log('\n🗄️ Supabase 대시보드 확인 중...');
    
    const supabaseUrl = 'https://supabase.com/dashboard/project/yyytjudftvpmcnppaym';
    console.log(`📄 Supabase 대시보드로 이동: ${supabaseUrl}`);
    
    await page.goto(supabaseUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // Supabase 페이지 제목 확인
    const supabaseTitle = await page.title();
    console.log(`📋 Supabase 페이지 제목: ${supabaseTitle}`);
    
    // 프로젝트 정보 확인
    const projectInfo = await page.evaluate(() => {
      const projectName = document.querySelector('h1, [data-testid*="project-name"]');
      const environment = document.querySelector('[data-testid*="environment"]');
      
      return {
        name: projectName ? projectName.textContent : null,
        environment: environment ? environment.textContent : null
      };
    });
    
    console.log(`  🏷️ 프로젝트명: ${projectInfo.name || '확인 불가'}`);
    console.log(`  🌍 환경: ${projectInfo.environment || '확인 불가'}`);
    
    // Table Editor 확인
    console.log('\n📊 Table Editor 확인...');
    
    try {
      // Table Editor 탭 클릭
      await page.click('[data-testid*="table-editor"], a[href*="table-editor"]');
      await page.waitForTimeout(2000);
      
      // 테이블 목록 확인
      const tables = await page.evaluate(() => {
        const tableRows = document.querySelectorAll('tr[data-testid*="table-row"], .table-row');
        const tableList = [];
        
        tableRows.forEach(row => {
          const name = row.querySelector('td:first-child, .table-name');
          const rls = row.querySelector('[data-testid*="rls"], .rls-status');
          
          if (name) {
            tableList.push({
              name: name.textContent.trim(),
              rls: rls ? rls.textContent.trim() : 'Unknown'
            });
          }
        });
        
        return tableList;
      });
      
      console.log(`  📋 발견된 테이블: ${tables.length}개`);
      
      // 블로그 관련 테이블 찾기
      const blogTables = tables.filter(t => 
        t.name.toLowerCase().includes('blog') || 
        t.name.toLowerCase().includes('post') ||
        t.name.toLowerCase().includes('content')
      );
      
      if (blogTables.length > 0) {
        console.log('  📝 블로그 관련 테이블:');
        blogTables.forEach(t => {
          console.log(`    - ${t.name}: RLS ${t.rls}`);
        });
      } else {
        console.log('  ❌ 블로그 관련 테이블을 찾을 수 없습니다');
      }
      
      // 모든 테이블 출력
      console.log('  📋 모든 테이블:');
      tables.forEach(t => {
        console.log(`    - ${t.name}: RLS ${t.rls}`);
      });
      
    } catch (error) {
      console.log('  ❌ Table Editor 접근 실패:', error.message);
    }
    
    // API 설정 확인
    console.log('\n🔌 API 설정 확인...');
    
    try {
      // API 탭으로 이동
      await page.click('a[href*="api"], [data-testid*="api"]');
      await page.waitForTimeout(2000);
      
      const apiInfo = await page.evaluate(() => {
        const url = document.querySelector('input[value*="supabase.co"], code:contains("supabase.co")');
        const key = document.querySelector('input[value*="eyJ"], code:contains("eyJ")');
        
        return {
          url: url ? url.value || url.textContent : null,
          key: key ? (key.value || key.textContent).substring(0, 20) + '...' : null
        };
      });
      
      console.log(`  🌐 API URL: ${apiInfo.url || '확인 불가'}`);
      console.log(`  🔑 API Key: ${apiInfo.key || '확인 불가'}`);
      
    } catch (error) {
      console.log('  ❌ API 설정 접근 실패:', error.message);
    }
    
    // Supabase 스크린샷 저장
    await page.screenshot({ 
      path: 'mas9golf/supabase-dashboard-screenshot.png',
      fullPage: true 
    });
    console.log('📸 Supabase 대시보드 스크린샷 저장: mas9golf/supabase-dashboard-screenshot.png');
    
    // 3. 설정값 검증
    console.log('\n✅ 설정값 검증 결과:');
    
    const verificationResults = {
      vercel: {
        branch: branchTracking.branch === 'main',
        autoAssign: autoAssignDomains.enabled,
        envVars: envVars.length > 0
      },
      supabase: {
        project: !!projectInfo.name,
        tables: tables.length > 0,
        blogTables: blogTables.length > 0
      }
    };
    
    console.log('  📋 Vercel 설정:');
    console.log(`    - Production Branch (main): ${verificationResults.vercel.branch ? '✅' : '❌'}`);
    console.log(`    - Auto-assign Domains: ${verificationResults.vercel.autoAssign ? '✅' : '❌'}`);
    console.log(`    - Environment Variables: ${verificationResults.vercel.envVars ? '✅' : '❌'}`);
    
    console.log('  🗄️ Supabase 설정:');
    console.log(`    - 프로젝트 연결: ${verificationResults.supabase.project ? '✅' : '❌'}`);
    console.log(`    - 테이블 존재: ${verificationResults.supabase.tables ? '✅' : '❌'}`);
    console.log(`    - 블로그 테이블: ${verificationResults.supabase.blogTables ? '✅' : '❌'}`);
    
    // 전체 설정 상태
    const allGood = Object.values(verificationResults).every(category => 
      Object.values(category).every(result => result)
    );
    
    if (allGood) {
      console.log('\n🎉 모든 설정이 정상적으로 구성되어 있습니다!');
    } else {
      console.log('\n⚠️ 일부 설정에 문제가 있습니다. 확인이 필요합니다.');
    }
    
    console.log('\n🎉 Git 및 Supabase 설정 확인 완료!');
    
    return {
      vercel: verificationResults.vercel,
      supabase: verificationResults.supabase,
      allGood: allGood
    };
    
  } catch (error) {
    console.error('❌ 설정 확인 중 오류 발생:', error);
    throw error;
  } finally {
    if (browser) {
      console.log('✨ 브라우저 연결 유지 (수동 확인 가능)');
    }
  }
}

// 스크립트 실행
if (require.main === module) {
  checkGitSupabaseSettings()
    .then((results) => {
      console.log('\n🚀 Git 및 Supabase 설정 확인 작업 완료!');
      console.log('📊 확인 결과:', results);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = { checkGitSupabaseSettings };
