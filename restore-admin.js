const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function restoreAdminSystem() {
  console.log('🔧 오늘 만든 6단계 프로그램 복원 시작...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const page = await browser.newPage();
  
  try {
    // 1. 관리자 페이지 접속
    console.log('\n1️⃣ 관리자 페이지 접속...');
    await page.goto('http://localhost:3000/admin');
    await page.waitForSelector('input[type="text"]');
    
    // 2. 로그인
    console.log('2️⃣ 로그인...');
    await page.fill('input[type="text"]', 'admin');
    const password = process.env.ADMIN_PASSWORD || '';
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    
    // 3. 대시보드 로딩 대기
    await page.waitForSelector('h1:has-text("MASGOLF 관리자")', { timeout: 10000 });
    console.log('✅ 로그인 성공!');
    
    // 4. 각 탭 확인 및 복원
    console.log('\n3️⃣ 각 탭 확인 및 복원...');
    
    const tabs = [
      { id: 'dashboard', name: '대시보드', expected: ['CampaignKPIDashboard', 'GA4RealtimeDashboard'] },
      { id: 'campaigns', name: '캠페인 관리', expected: ['캠페인 관리 기능'] },
      { id: 'contacts', name: '고객 관리', expected: ['ContactManagement'] },
      { id: 'bookings', name: '예약 관리', expected: ['BookingManagement'] },
      { id: 'marketing', name: '마케팅 콘텐츠', expected: ['MarketingDashboardComplete'] },
      { id: 'team', name: '팀 관리', expected: ['TeamMemberManagement'] }
    ];
    
    for (const tab of tabs) {
      try {
        console.log(`\n📋 ${tab.name} 탭 확인...`);
        
        // 탭 클릭
        await page.click(`button:has-text("${tab.name}")`);
        await page.waitForTimeout(2000);
        
        // 탭 내용 확인
        const content = await page.evaluate(() => {
          const mainContent = document.querySelector('.p-6');
          return mainContent ? mainContent.textContent : '';
        });
        
        console.log(`✅ ${tab.name} 탭 로드됨`);
        console.log(`   내용: ${content.substring(0, 100)}...`);
        
        // 스크린샷 저장
        await page.screenshot({ path: `tab-${tab.id}-current.png` });
        
        // 예상 기능 확인
        for (const expected of tab.expected) {
          const hasFeature = content.includes(expected);
          console.log(`   ${expected}: ${hasFeature ? '✅' : '❌'}`);
        }
        
      } catch (error) {
        console.log(`❌ ${tab.name} 탭 오류: ${error.message}`);
      }
    }
    
    // 5. 전체 대시보드 스크린샷
    await page.screenshot({ path: 'admin-dashboard-current.png', fullPage: true });
    console.log('\n📸 현재 상태 스크린샷 저장됨');
    
    // 6. 복원 작업 시작
    console.log('\n4️⃣ 복원 작업 시작...');
    
    // 백업 파일에서 복원
    const backupFiles = [
      'pages/backup/admin-v2.tsx',
      'pages/backup/admin-new.tsx',
      'backup/admin-login-duplicate.tsx'
    ];
    
    for (const backupFile of backupFiles) {
      try {
        if (fs.existsSync(backupFile)) {
          console.log(`📁 백업 파일 발견: ${backupFile}`);
          const content = fs.readFileSync(backupFile, 'utf8');
          console.log(`   크기: ${content.length} 문자`);
        }
      } catch (error) {
        console.log(`❌ 백업 파일 읽기 오류: ${backupFile} - ${error.message}`);
      }
    }
    
    // 7. 컴포넌트 파일 확인
    console.log('\n5️⃣ 컴포넌트 파일 확인...');
    
    const components = [
      'components/admin/dashboard/CampaignKPIDashboard.tsx',
      'components/admin/dashboard/GA4RealtimeDashboard.tsx',
      'components/admin/contacts/ContactManagement.tsx',
      'components/admin/bookings/BookingManagement.tsx',
      'components/admin/marketing/MarketingDashboardComplete.tsx',
      'components/admin/team/TeamMemberManagement.tsx'
    ];
    
    for (const component of components) {
      try {
        if (fs.existsSync(component)) {
          const content = fs.readFileSync(component, 'utf8');
          console.log(`✅ ${component} (${content.length} 문자)`);
        } else {
          console.log(`❌ ${component} - 파일 없음`);
        }
      } catch (error) {
        console.log(`❌ ${component} - 읽기 오류: ${error.message}`);
      }
    }
    
    // 8. API 파일 확인
    console.log('\n6️⃣ API 파일 확인...');
    
    const apis = [
      'pages/api/admin-login.ts',
      'pages/api/admin-logout.ts',
      'pages/api/ga4-realtime.ts',
      'pages/api/campaigns/kpi.ts'
    ];
    
    for (const api of apis) {
      try {
        if (fs.existsSync(api)) {
          const content = fs.readFileSync(api, 'utf8');
          console.log(`✅ ${api} (${content.length} 문자)`);
        } else {
          console.log(`❌ ${api} - 파일 없음`);
        }
      } catch (error) {
        console.log(`❌ ${api} - 읽기 오류: ${error.message}`);
      }
    }
    
    console.log('\n🎉 복원 작업 완료!');
    console.log('\n📋 다음 단계:');
    console.log('1. 스크린샷 파일들을 확인하여 현재 상태 파악');
    console.log('2. 누락된 컴포넌트나 API 파일 복원');
    console.log('3. 백업 파일에서 필요한 코드 복사');
    
  } catch (error) {
    console.error('❌ 복원 작업 오류:', error);
    await page.screenshot({ path: 'restore-error.png' });
  } finally {
    await browser.close();
  }
}

// 스크립트 실행
restoreAdminSystem().catch(console.error); 