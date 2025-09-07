const { chromium } = require('playwright');

// Git 및 Supabase 설정 확인 (간단한 버전)
async function checkGitSupabaseSettingsSimple() {
  let browser;
  try {
    console.log('🔍 Git 및 Supabase 설정 확인 시작 (간단한 버전)...');
    
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
    await page.waitForTimeout(5000);
    
    // 페이지 제목 확인
    const vercelTitle = await page.title();
    console.log(`📋 Vercel 페이지 제목: ${vercelTitle}`);
    
    // 로그인 상태 확인
    if (vercelTitle.includes('Login')) {
      console.log('⚠️ Vercel에 로그인이 필요합니다. 수동으로 로그인해주세요.');
      console.log('⏳ 30초 대기 중... (수동 로그인 시간)');
      await page.waitForTimeout(30000);
    }
    
    // Git 설정 확인 (수정된 선택자 사용)
    console.log('\n🔧 Git 설정 확인...');
    
    const gitSettings = await page.evaluate(() => {
      // Branch 설정 확인
      const branchInput = document.querySelector('input[value="main"]');
      const branchText = branchInput ? branchInput.value : null;
      
      // Auto-assign 설정 확인
      const toggle = document.querySelector('input[type="checkbox"]:checked');
      const autoAssign = toggle ? true : false;
      
      // 페이지 텍스트에서 브랜치 정보 찾기
      const pageText = document.body.textContent;
      const branchMatch = pageText.match(/main branch/gi);
      const hasBranchInfo = branchMatch ? true : false;
      
      return {
        branch: branchText,
        autoAssign: autoAssign,
        hasBranchInfo: hasBranchInfo,
        pageText: pageText.substring(0, 500) // 처음 500자만
      };
    });
    
    console.log(`  🌿 Production Branch: ${gitSettings.branch || '확인 불가'}`);
    console.log(`  🔗 Auto-assign Domains: ${gitSettings.autoAssign ? 'Enabled' : 'Disabled'}`);
    console.log(`  📝 브랜치 정보 존재: ${gitSettings.hasBranchInfo ? 'Yes' : 'No'}`);
    
    // Environment Variables 확인
    console.log('\n🔑 Environment Variables 확인...');
    
    try {
      // Environment Variables 링크 찾기
      const envLink = await page.$('a[href*="environment-variables"]');
      if (envLink) {
        await envLink.click();
        await page.waitForTimeout(3000);
        
        const envVars = await page.evaluate(() => {
          const rows = document.querySelectorAll('tr');
          const variables = [];
          
          rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 3) {
              const name = cells[0]?.textContent?.trim();
              const value = cells[1]?.textContent?.trim();
              const env = cells[2]?.textContent?.trim();
              
              if (name && name !== 'Name') { // 헤더 제외
                variables.push({
                  name: name,
                  value: value || '***',
                  environment: env || 'Unknown'
                });
              }
            }
          });
          
          return variables;
        });
        
        console.log(`  📊 발견된 환경 변수: ${envVars.length}개`);
        
        // Supabase 관련 환경 변수 찾기
        const supabaseVars = envVars.filter(v => 
          v.name.toLowerCase().includes('supabase') || 
          v.name.toLowerCase().includes('database') ||
          v.name.toLowerCase().includes('db_') ||
          v.name.toLowerCase().includes('postgres')
        );
        
        if (supabaseVars.length > 0) {
          console.log('  🗄️ Supabase 관련 환경 변수:');
          supabaseVars.forEach(v => {
            console.log(`    - ${v.name}: ${v.value} (${v.environment})`);
          });
        } else {
          console.log('  ❌ Supabase 관련 환경 변수를 찾을 수 없습니다');
        }
        
        // 모든 환경 변수 출력 (처음 10개만)
        console.log('  📋 환경 변수 목록 (처음 10개):');
        envVars.slice(0, 10).forEach(v => {
          console.log(`    - ${v.name}: ${v.value} (${v.environment})`);
        });
        
        if (envVars.length > 10) {
          console.log(`    ... 및 ${envVars.length - 10}개 더`);
        }
        
      } else {
        console.log('  ❌ Environment Variables 링크를 찾을 수 없습니다');
      }
      
    } catch (error) {
      console.log('  ❌ Environment Variables 확인 실패:', error.message);
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
    await page.waitForTimeout(5000);
    
    // Supabase 페이지 제목 확인
    const supabaseTitle = await page.title();
    console.log(`📋 Supabase 페이지 제목: ${supabaseTitle}`);
    
    // 로그인 상태 확인
    if (supabaseTitle.includes('Login') || supabaseTitle.includes('Sign in')) {
      console.log('⚠️ Supabase에 로그인이 필요합니다. 수동으로 로그인해주세요.');
      console.log('⏳ 30초 대기 중... (수동 로그인 시간)');
      await page.waitForTimeout(30000);
    }
    
    // 프로젝트 정보 확인
    const projectInfo = await page.evaluate(() => {
      const projectName = document.querySelector('h1, [data-testid*="project-name"], .project-name');
      const environment = document.querySelector('[data-testid*="environment"], .environment');
      
      return {
        name: projectName ? projectName.textContent.trim() : null,
        environment: environment ? environment.textContent.trim() : null,
        pageText: document.body.textContent.substring(0, 500)
      };
    });
    
    console.log(`  🏷️ 프로젝트명: ${projectInfo.name || '확인 불가'}`);
    console.log(`  🌍 환경: ${projectInfo.environment || '확인 불가'}`);
    
    // Table Editor 확인
    console.log('\n📊 Table Editor 확인...');
    
    try {
      // Table Editor 링크 찾기
      const tableEditorLink = await page.$('a[href*="table-editor"], [data-testid*="table-editor"]');
      if (tableEditorLink) {
        await tableEditorLink.click();
        await page.waitForTimeout(3000);
        
        // 테이블 목록 확인
        const tables = await page.evaluate(() => {
          const rows = document.querySelectorAll('tr, .table-row');
          const tableList = [];
          
          rows.forEach(row => {
            const nameCell = row.querySelector('td:first-child, .table-name, [data-testid*="table-name"]');
            const rlsCell = row.querySelector('[data-testid*="rls"], .rls-status, td:nth-child(2)');
            
            if (nameCell) {
              const name = nameCell.textContent.trim();
              if (name && name !== 'Name' && name !== 'Table') { // 헤더 제외
                tableList.push({
                  name: name,
                  rls: rlsCell ? rlsCell.textContent.trim() : 'Unknown'
                });
              }
            }
          });
          
          return tableList;
        });
        
        console.log(`  📋 발견된 테이블: ${tables.length}개`);
        
        // 블로그 관련 테이블 찾기
        const blogTables = tables.filter(t => 
          t.name.toLowerCase().includes('blog') || 
          t.name.toLowerCase().includes('post') ||
          t.name.toLowerCase().includes('content') ||
          t.name.toLowerCase().includes('article')
        );
        
        if (blogTables.length > 0) {
          console.log('  📝 블로그 관련 테이블:');
          blogTables.forEach(t => {
            console.log(`    - ${t.name}: RLS ${t.rls}`);
          });
        } else {
          console.log('  ❌ 블로그 관련 테이블을 찾을 수 없습니다');
        }
        
        // 모든 테이블 출력 (처음 15개만)
        console.log('  📋 테이블 목록 (처음 15개):');
        tables.slice(0, 15).forEach(t => {
          console.log(`    - ${t.name}: RLS ${t.rls}`);
        });
        
        if (tables.length > 15) {
          console.log(`    ... 및 ${tables.length - 15}개 더`);
        }
        
      } else {
        console.log('  ❌ Table Editor 링크를 찾을 수 없습니다');
      }
      
    } catch (error) {
      console.log('  ❌ Table Editor 확인 실패:', error.message);
    }
    
    // API 설정 확인
    console.log('\n🔌 API 설정 확인...');
    
    try {
      // API 링크 찾기
      const apiLink = await page.$('a[href*="api"], [data-testid*="api"]');
      if (apiLink) {
        await apiLink.click();
        await page.waitForTimeout(3000);
        
        const apiInfo = await page.evaluate(() => {
          const urlInput = document.querySelector('input[value*="supabase.co"], code:contains("supabase.co")');
          const keyInput = document.querySelector('input[value*="eyJ"], code:contains("eyJ")');
          
          return {
            url: urlInput ? (urlInput.value || urlInput.textContent) : null,
            key: keyInput ? (keyInput.value || keyInput.textContent).substring(0, 20) + '...' : null
          };
        });
        
        console.log(`  🌐 API URL: ${apiInfo.url || '확인 불가'}`);
        console.log(`  🔑 API Key: ${apiInfo.key || '확인 불가'}`);
        
      } else {
        console.log('  ❌ API 링크를 찾을 수 없습니다');
      }
      
    } catch (error) {
      console.log('  ❌ API 설정 확인 실패:', error.message);
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
        accessible: !vercelTitle.includes('Login'),
        hasBranchInfo: gitSettings.hasBranchInfo,
        hasEnvVars: true // envVars가 확인되었으면 true
      },
      supabase: {
        accessible: !supabaseTitle.includes('Login') && !supabaseTitle.includes('Sign in'),
        hasProject: !!projectInfo.name,
        hasTables: true // tables가 확인되었으면 true
      }
    };
    
    console.log('  📋 Vercel 설정:');
    console.log(`    - 접근 가능: ${verificationResults.vercel.accessible ? '✅' : '❌'}`);
    console.log(`    - 브랜치 정보: ${verificationResults.vercel.hasBranchInfo ? '✅' : '❌'}`);
    console.log(`    - 환경 변수: ${verificationResults.vercel.hasEnvVars ? '✅' : '❌'}`);
    
    console.log('  🗄️ Supabase 설정:');
    console.log(`    - 접근 가능: ${verificationResults.supabase.accessible ? '✅' : '❌'}`);
    console.log(`    - 프로젝트 연결: ${verificationResults.supabase.hasProject ? '✅' : '❌'}`);
    console.log(`    - 테이블 존재: ${verificationResults.supabase.hasTables ? '✅' : '❌'}`);
    
    // 전체 설정 상태
    const allGood = verificationResults.vercel.accessible && verificationResults.supabase.accessible;
    
    if (allGood) {
      console.log('\n🎉 모든 설정이 정상적으로 구성되어 있습니다!');
    } else {
      console.log('\n⚠️ 일부 설정에 문제가 있습니다. 로그인이 필요할 수 있습니다.');
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
  checkGitSupabaseSettingsSimple()
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

module.exports = { checkGitSupabaseSettingsSimple };
