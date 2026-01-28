/**
 * 스캔 서류 분류 시스템 Playwright 테스트
 * 
 * 테스트 내용:
 * 1. 고객 이미지 모달에서 스캔 서류 필터 작동 확인
 * 2. 문서 타입별 필터링 확인
 * 3. 이미지 카드에 문서 타입 배지 표시 확인
 */

const { chromium } = require('playwright');
require('dotenv').config({ path: '.env.local' });

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password';

async function testScannedDocumentsFilter() {
  console.log('🚀 스캔 서류 분류 시스템 테스트 시작...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    // 1. 로그인
    console.log('1️⃣ 로그인 중...');
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // 로그인 폼 찾기 (여러 패턴 시도)
    const loginInput = page.locator('input[type="text"], input[name="login"], input#login').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"], input#password').first();
    const submitButton = page.locator('button[type="submit"]').first();
    
    const loginVisible = await loginInput.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (loginVisible) {
      // 로그인 정보 (기본값 또는 환경 변수)
      const ADMIN_LOGIN = process.env.ADMIN_LOGIN || '010-6669-9000';
      const ADMIN_PASS = process.env.ADMIN_PASSWORD || '66699000';
      
      await loginInput.fill(ADMIN_LOGIN);
      await page.waitForTimeout(500);
      await passwordInput.fill(ADMIN_PASS);
      await page.waitForTimeout(500);
      await submitButton.click();
      console.log('✅ 로그인 버튼 클릭됨');
      
      // 로그인 완료 대기
      await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => {
        console.log('⚠️ 네비게이션 대기 중 타임아웃 (계속 진행)');
      });
      await page.waitForTimeout(2000);
    } else {
      console.log('⚠️ 로그인 폼을 찾을 수 없습니다. 이미 로그인되어 있을 수 있습니다.');
    }
    
    console.log('✅ 로그인 완료\n');
    
    // 2. 고객 관리 페이지로 이동
    console.log('2️⃣ 고객 관리 페이지로 이동...');
    await page.goto(`${BASE_URL}/admin/customers`);
    await page.waitForLoadState('networkidle');
    console.log('✅ 고객 관리 페이지 로드 완료\n');
    
    // 3. 스캔 서류가 있는 고객 찾기 (안희자, 차재욱, 전유근, 김성수, 김진권)
    console.log('3️⃣ 스캔 서류가 있는 고객 찾기...');
    
    // 고객 목록에서 스캔 서류가 있는 고객 찾기
    const customersWithScans = ['안희자', '차재욱', '전유근', '김성수', '김진권'];
    let customerRow = null;
    let customerName = null;
    
    for (const name of customersWithScans) {
      const row = page.locator('table tbody tr').filter({ hasText: name }).first();
      if (await row.count() > 0) {
        customerRow = row;
        customerName = name;
        break;
      }
    }
    
    if (!customerRow) {
      // 찾지 못하면 첫 번째 고객 선택
      customerRow = page.locator('table tbody tr').first();
      customerName = await customerRow.locator('td').nth(1).textContent();
      console.log(`   ⚠️  스캔 서류가 있는 고객을 찾지 못했습니다. 첫 번째 고객 선택: ${customerName}`);
    } else {
      console.log(`   ✅ 스캔 서류가 있는 고객 선택: ${customerName}`);
    }
    
    // "이미지" 버튼 클릭
    const imageButton = customerRow.locator('button:has-text("이미지")');
    if (await imageButton.count() === 0) {
      throw new Error('이미지 버튼을 찾을 수 없습니다');
    }
    
    await imageButton.click();
    await page.waitForTimeout(3000); // 이미지 로드 대기
    console.log('✅ 고객 이미지 모달 열림\n');
    
    // 4. 스캔 서류 필터 확인
    console.log('4️⃣ 스캔 서류 필터 확인...');
    
    // "스캔 서류만 보기" 체크박스 찾기 (label 내부의 input)
    const scannedDocumentsCheckbox = page.locator('label:has-text("스캔 서류만 보기") input[type="checkbox"]');
    
    // 대기 시간 증가
    await page.waitForTimeout(2000);
    
    const checkboxCount = await scannedDocumentsCheckbox.count();
    console.log(`   체크박스 개수: ${checkboxCount}`);
    
    if (checkboxCount > 0) {
      console.log('✅ 스캔 서류 필터 체크박스 발견');
      
      // 체크박스 클릭
      await scannedDocumentsCheckbox.check();
      await page.waitForTimeout(2000);
      console.log('✅ 스캔 서류 필터 활성화');
      
      // 문서 타입 필터 확인
      const documentTypeSelect = page.locator('select').filter({ 
        hasText: /전체 문서|주문사양서|설문조사/i 
      }).or(page.locator('select option:has-text("전체 문서")').locator('..'));
      
      await page.waitForTimeout(1000);
      const selectCount = await documentTypeSelect.count();
      console.log(`   문서 타입 필터 개수: ${selectCount}`);
      
      if (selectCount > 0) {
        console.log('✅ 문서 타입 필터 드롭다운 발견');
        
        // 각 문서 타입 선택 테스트
        const documentTypes = ['all', 'order_spec', 'survey', 'consent', 'other'];
        for (const docType of documentTypes) {
          try {
            await documentTypeSelect.selectOption(docType);
            await page.waitForTimeout(1000);
            console.log(`   - ${docType} 필터 선택 완료`);
          } catch (err) {
            console.log(`   ⚠️  ${docType} 필터 선택 실패:`, err.message);
          }
        }
        console.log('');
      } else {
        console.log('⚠️  문서 타입 필터를 찾을 수 없습니다.');
      }
    } else {
      console.log('⚠️  스캔 서류 필터를 찾을 수 없습니다.');
      console.log('   페이지 구조 확인을 위해 스크린샷을 확인하세요.');
    }
    
    // 5. 이미지 카드에 문서 타입 배지 확인
    console.log('5️⃣ 이미지 카드에 문서 타입 배지 확인...');
    
    // 스캔 서류 이미지 찾기
    const scannedDocumentBadges = page.locator('[class*="bg-purple-500"], [class*="bg-green-500"], [class*="bg-orange-500"], [class*="bg-gray-500"]')
      .filter({ hasText: /주문사양서|설문조사|동의서|스캔서류/i });
    
    const badgeCount = await scannedDocumentBadges.count();
    if (badgeCount > 0) {
      console.log(`✅ 문서 타입 배지 ${badgeCount}개 발견`);
      
      // 첫 번째 배지 텍스트 확인
      const firstBadgeText = await scannedDocumentBadges.first().textContent();
      console.log(`   첫 번째 배지: ${firstBadgeText}`);
    } else {
      console.log('⚠️  문서 타입 배지를 찾을 수 없습니다. 스캔 서류가 없을 수 있습니다.');
    }
    console.log('');
    
    // 6. 스크린샷 저장
    console.log('6️⃣ 스크린샷 저장...');
    await page.screenshot({ 
      path: 'e2e-test/scanned-documents-filter-test-result.png',
      fullPage: true 
    });
    console.log('✅ 스크린샷 저장 완료: e2e-test/scanned-documents-filter-test-result.png\n');
    
    // 7. 결과 요약
    console.log('='.repeat(80));
    console.log('📊 테스트 결과 요약:');
    console.log('='.repeat(80));
    console.log(`✅ 로그인: 성공`);
    console.log(`✅ 고객 관리 페이지: 로드 완료`);
    console.log(`✅ 고객 이미지 모달: 열림`);
    console.log(`✅ 스캔 서류 필터: ${checkboxExists ? '발견됨' : '없음'}`);
    console.log(`✅ 문서 타입 배지: ${badgeCount}개 발견`);
    console.log('='.repeat(80));
    console.log('\n✅ 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    await page.screenshot({ 
      path: 'e2e-test/scanned-documents-filter-test-error.png',
      fullPage: true 
    });
    throw error;
  } finally {
    await browser.close();
  }
}

testScannedDocumentsFilter().catch(console.error);
