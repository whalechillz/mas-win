/**
 * 간단한 모바일 테스트 스크립트
 */

const { chromium } = require('playwright');

async function simpleMobileTest() {
    console.log('🚀 간단한 모바일 테스트 시작...\n');
    
    const browser = await chromium.launch({ 
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        // 모바일 디바이스 시뮬레이션
        const mobileContext = await browser.newContext({
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
            viewport: { width: 375, height: 667 },
            deviceScaleFactor: 2,
            isMobile: true,
            hasTouch: true
        });
        
        const page = await mobileContext.newPage();
        
        // 콘솔 메시지 모니터링
        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                console.error(`❌ 에러: ${msg.text()}`);
            } else {
                console.log(`📊 ${msg.text()}`);
            }
        });
        
        console.log('📱 페이지 로드 중...');
        await page.goto('http://localhost:3000/25-09/', { 
            waitUntil: 'domcontentloaded',
            timeout: 15000 
        });
        
        console.log('✅ 페이지 로드 완료');
        
        // 3초 대기
        await page.waitForTimeout(3000);
        
        // 스크린샷 촬영
        await page.screenshot({ 
            path: 'mobile-test-result.png',
            fullPage: true 
        });
        console.log('📸 스크린샷 저장: mobile-test-result.png');
        
        // 페이지 상태 확인
        const pageState = await page.evaluate(() => {
            const iframe = document.querySelector('iframe');
            const loadingSpinner = document.querySelector('.animate-spin');
            const body = document.body;
            
            return {
                iframeExists: !!iframe,
                iframeVisible: iframe ? iframe.offsetHeight > 0 : false,
                loadingSpinnerExists: !!loadingSpinner,
                loadingSpinnerVisible: loadingSpinner ? loadingSpinner.offsetHeight > 0 : false,
                bodyHeight: body.offsetHeight,
                bodyBackgroundColor: window.getComputedStyle(body).backgroundColor,
                bodyTextContent: body.textContent.length
            };
        });
        
        console.log('\n🔍 페이지 상태:');
        console.log(`- iframe 존재: ${pageState.iframeExists ? '✅' : '❌'}`);
        console.log(`- iframe 표시: ${pageState.iframeVisible ? '✅' : '❌'}`);
        console.log(`- 로딩 스피너 존재: ${pageState.loadingSpinnerExists ? '✅' : '❌'}`);
        console.log(`- 로딩 스피너 표시: ${pageState.loadingSpinnerVisible ? '⚠️' : '✅'}`);
        console.log(`- 페이지 높이: ${pageState.bodyHeight}px`);
        console.log(`- 배경색: ${pageState.bodyBackgroundColor}`);
        console.log(`- 텍스트 길이: ${pageState.bodyTextContent} 문자`);
        
        // 문제 진단
        if (pageState.loadingSpinnerVisible) {
            console.log('\n❌ 문제: 로딩 스피너가 계속 표시됨 (회색 화면 문제)');
        } else if (!pageState.iframeVisible) {
            console.log('\n❌ 문제: iframe이 표시되지 않음');
        } else if (pageState.bodyHeight < 100) {
            console.log('\n❌ 문제: 페이지 높이가 너무 작음');
        } else {
            console.log('\n✅ 정상: 페이지가 올바르게 로드됨');
        }
        
        // 5초 더 대기
        console.log('\n⏳ 5초 더 대기...');
        await page.waitForTimeout(5000);
        
        // 최종 상태 재확인
        const finalState = await page.evaluate(() => {
            const iframe = document.querySelector('iframe');
            const loadingSpinner = document.querySelector('.animate-spin');
            
            return {
                iframeVisible: iframe ? iframe.offsetHeight > 0 : false,
                loadingSpinnerVisible: loadingSpinner ? loadingSpinner.offsetHeight > 0 : false
            };
        });
        
        console.log('\n🔍 최종 상태:');
        console.log(`- iframe 표시: ${finalState.iframeVisible ? '✅' : '❌'}`);
        console.log(`- 로딩 스피너 표시: ${finalState.loadingSpinnerVisible ? '⚠️' : '✅'}`);
        
        if (finalState.loadingSpinnerVisible) {
            console.log('\n❌ 최종 진단: 회색 화면 문제 확인됨');
        } else {
            console.log('\n✅ 최종 진단: 정상 작동');
        }
        
    } catch (error) {
        console.error('❌ 테스트 중 오류 발생:', error.message);
    } finally {
        await browser.close();
    }
}

// 테스트 실행
simpleMobileTest().catch(console.error);
