const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function restoreCompleteSystem() {
  console.log('🚨 하루종일 개발한 6단계 프로그램 완전 복원 시작!');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const page = await browser.newPage();
  
  try {
    // 1. 현재 상태 진단
    console.log('\n1️⃣ 현재 상태 진단...');
    
    // 현재 admin.tsx 확인
    const currentAdmin = fs.readFileSync('pages/admin.tsx', 'utf8');
    console.log(`현재 admin.tsx 크기: ${currentAdmin.length} 문자`);
    
    // 허접한 소스인지 확인
    const isSimple = currentAdmin.includes('캠페인 관리 기능이 여기에 표시됩니다') || 
                    currentAdmin.length < 5000;
    
    if (isSimple) {
      console.log('❌ 허접한 소스로 변해버림! 복원 필요!');
    } else {
      console.log('✅ 현재 소스가 정상적임');
    }
    
    // 2. 백업 파일들 확인
    console.log('\n2️⃣ 백업 파일들 확인...');
    
    const backupFiles = [
      'pages/backup/admin-v2.tsx',
      'pages/backup/admin-new.tsx',
      'backup/admin-login-duplicate.tsx',
      'backup-2025-07/old-backups/backup-remove-2025-01-moved/admin-new.tsx'
    ];
    
    let bestBackup = null;
    let bestSize = 0;
    
    for (const backupFile of backupFiles) {
      try {
        if (fs.existsSync(backupFile)) {
          const content = fs.readFileSync(backupFile, 'utf8');
          console.log(`📁 ${backupFile}: ${content.length} 문자`);
          
          // 가장 큰 파일이 가장 완성도 높은 백업
          if (content.length > bestSize) {
            bestSize = content.length;
            bestBackup = backupFile;
          }
        }
      } catch (error) {
        console.log(`❌ ${backupFile} 읽기 실패`);
      }
    }
    
    if (bestBackup) {
      console.log(`🏆 최고 백업 파일: ${bestBackup} (${bestSize} 문자)`);
    }
    
    // 3. 완전한 복원 실행
    console.log('\n3️⃣ 완전한 복원 실행...');
    
    if (bestBackup && isSimple) {
      // 백업에서 복원
      const backupContent = fs.readFileSync(bestBackup, 'utf8');
      
      // 현재 파일 백업
      fs.writeFileSync('pages/admin-current-backup.tsx', currentAdmin);
      console.log('✅ 현재 파일 백업됨');
      
      // 백업에서 복원
      fs.writeFileSync('pages/admin.tsx', backupContent);
      console.log('✅ 백업에서 복원됨');
      
      // lucide-react 재설치
      try {
        execSync('npm install lucide-react', { stdio: 'inherit' });
        console.log('✅ lucide-react 재설치됨');
      } catch (error) {
        console.log('❌ lucide-react 설치 실패');
      }
    }
    
    // 4. 컴포넌트 파일들 복원
    console.log('\n4️⃣ 컴포넌트 파일들 복원...');
    
    const components = [
      'components/admin/dashboard/CampaignKPIDashboard.tsx',
      'components/admin/dashboard/GA4RealtimeDashboard.tsx',
      'components/admin/contacts/ContactManagement.tsx',
      'components/admin/bookings/BookingManagement.tsx',
      'components/admin/marketing/MarketingDashboardComplete.tsx',
      'components/admin/team/TeamMemberManagement.tsx'
    ];
    
    for (const component of components) {
      if (fs.existsSync(component)) {
        let content = fs.readFileSync(component, 'utf8');
        
        // lucide-react import 복원
        if (!content.includes('lucide-react')) {
          const lucideImports = {
            'CampaignKPIDashboard.tsx': 'import { TrendingUp, TrendingDown, Users, Eye, Phone, Target, BarChart3, Calendar } from \'lucide-react\';',
            'GA4RealtimeDashboard.tsx': 'import { Activity, Users, Eye, TrendingUp } from \'lucide-react\';',
            'MarketingDashboardComplete.tsx': 'import { BarChart3, TrendingUp, Users, Target, Calendar, FileText } from \'lucide-react\';',
            'AIGenerationSettingsNew.tsx': 'import { Settings, Zap, FileText, Target } from \'lucide-react\';',
            'AIContentAssistant.tsx': 'import { MessageSquare, FileText, Zap, Target } from \'lucide-react\';'
          };
          
          const importLine = lucideImports[path.basename(component)];
          if (importLine) {
            content = importLine + '\n' + content;
            fs.writeFileSync(component, content);
            console.log(`✅ ${component} lucide-react import 복원됨`);
          }
        }
        
        // Feather 아이콘을 lucide-react로 변경
        const iconMappings = [
          { feather: 'trending-up', lucide: 'TrendingUp' },
          { feather: 'trending-down', lucide: 'TrendingDown' },
          { feather: 'users', lucide: 'Users' },
          { feather: 'eye', lucide: 'Eye' },
          { feather: 'phone', lucide: 'Phone' },
          { feather: 'target', lucide: 'Target' },
          { feather: 'bar-chart-3', lucide: 'BarChart3' },
          { feather: 'calendar', lucide: 'Calendar' },
          { feather: 'activity', lucide: 'Activity' },
          { feather: 'file-text', lucide: 'FileText' },
          { feather: 'settings', lucide: 'Settings' },
          { feather: 'zap', lucide: 'Zap' },
          { feather: 'message-square', lucide: 'MessageSquare' }
        ];
        
        for (const mapping of iconMappings) {
          content = content.replace(
            new RegExp(`<i data-feather="${mapping.feather}"`, 'g'),
            `<${mapping.lucide}`
          );
        }
        
        content = content.replace(/<\/i>/g, ' />');
        
        fs.writeFileSync(component, content);
        console.log(`✅ ${component} 아이콘 복원됨`);
      }
    }
    
    // 5. API 파일들 확인 및 복원
    console.log('\n5️⃣ API 파일들 확인 및 복원...');
    
    const apis = [
      'pages/api/admin-login.ts',
      'pages/api/admin-logout.ts',
      'pages/api/ga4-realtime.ts',
      'pages/api/campaigns/kpi.ts',
      'pages/api/track-view.js',
      'pages/api/track-phone-click.js'
    ];
    
    for (const api of apis) {
      if (fs.existsSync(api)) {
        const content = fs.readFileSync(api, 'utf8');
        console.log(`✅ ${api} (${content.length} 문자)`);
      } else {
        console.log(`❌ ${api} - 파일 없음`);
      }
    }
    
    // 6. 서버 재시작 및 테스트
    console.log('\n6️⃣ 서버 재시작 및 테스트...');
    
    try {
      // 기존 서버 종료
      execSync('pkill -f "next dev"', { stdio: 'ignore' });
      console.log('✅ 기존 서버 종료됨');
      
      // 새 서버 시작
      execSync('npm run dev', { stdio: 'ignore' });
      console.log('✅ 새 서버 시작됨');
      
      await page.waitForTimeout(5000);
      
      // 7. 브라우저에서 테스트
      console.log('\n7️⃣ 브라우저에서 테스트...');
      
      await page.goto('http://localhost:3000/admin');
      await page.waitForSelector('input[type="text"]');
      
      // 로그인
      await page.fill('input[type="text"]', 'admin');
      const password = process.env.ADMIN_PASSWORD || ''; await page.fill('input[type="password"]', password);
      await page.click('button[type="submit"]');
      
      await page.waitForSelector('h1:has-text("MASGOLF 관리자")', { timeout: 10000 });
      console.log('✅ 로그인 성공!');
      
      // 각 탭 테스트
      const tabs = ['대시보드', '캠페인 관리', '고객 관리', '예약 관리', '마케팅 콘텐츠', '팀 관리'];
      
      for (const tabName of tabs) {
        try {
          await page.click(`button:has-text("${tabName}")`);
          await page.waitForTimeout(2000);
          
          const content = await page.evaluate(() => {
            const mainContent = document.querySelector('.p-6');
            return mainContent ? mainContent.textContent : '';
          });
          
          console.log(`✅ ${tabName} 탭: ${content.length > 50 ? '정상' : '문제있음'}`);
          
        } catch (error) {
          console.log(`❌ ${tabName} 탭 오류: ${error.message}`);
        }
      }
      
      // 전체 스크린샷
      await page.screenshot({ path: 'restored-dashboard.png', fullPage: true });
      console.log('📸 복원된 대시보드 스크린샷 저장됨');
      
      // 8. 복원 완료 보고
      console.log('\n🎉 복원 완료 보고!');
      
      const finalAdmin = fs.readFileSync('pages/admin.tsx', 'utf8');
      console.log(`📊 최종 admin.tsx 크기: ${finalAdmin.length} 문자`);
      
      if (finalAdmin.length > 8000) {
        console.log('✅ 복원 성공! 하루종일 개발한 소스가 복원되었습니다!');
      } else {
        console.log('❌ 복원 실패! 추가 작업 필요');
      }
      
    } catch (error) {
      console.log('❌ 서버 테스트 오류:', error.message);
    }
    
  } catch (error) {
    console.error('❌ 복원 작업 오류:', error);
    await page.screenshot({ path: 'restore-error.png' });
  } finally {
    await browser.close();
  }
}

// 스크립트 실행
restoreCompleteSystem().catch(console.error); 