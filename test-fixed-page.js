/**
 * 수정된 페이지 테스트
 */

const { chromium } = require('playwright');

async function testFixedPage() {
    console.log('🚀 수정된 페이지 테스트 시작...\n');
    
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
        await page.goto('http://localhost:3000/25-09-fixed', { 
            waitUntil: 'domcontentloaded',
            timeout: 10000 
        });
        
        console.log('✅ 페이지 로드 완료');
        
        // 초기 상태 확인
        const initialState = await page.evaluate(() => {
            const iframe = document.querySelector('iframe');
            const loadingSpinner = document.querySelector('.animate-spin');
            const body = document.body;
            
            return {
                iframeExists: !!iframe,
                iframeVisible: iframe ? iframe.offsetHeight > 0 : false,
                loadingSpinnerExists: !!loadingSpinner,
                loadingSpinnerVisible: loadingSpinner ? loadingSpinner.offsetHeight > 0 : false,
                bodyHeight: body.offsetHeight,
                bodyBackgroundColor: window.getComputedStyle(body).backgroundColor
            };
        });
        
        console.log('\n🔍 초기 상태:');
        console.log(`- iframe 존재: ${initialState.iframeExists ? '✅' : '❌'}`);
        console.log(`- iframe 표시: ${initialState.iframeVisible ? '✅' : '❌'}`);
        console.log(`- 로딩 스피너 존재: ${initialState.loadingSpinnerExists ? '✅' : '❌'}`);
        console.log(`- 로딩 스피너 표시: ${initialState.loadingSpinnerVisible ? '⚠️' : '✅'}`);
        console.log(`- 페이지 높이: ${initialState.bodyHeight}px`);
        console.log(`- 배경색: ${initialState.bodyBackgroundColor}`);
        
        // 3초 대기
        console.log('\n⏳ 3초 대기...');
        await page.waitForTimeout(3000);
        
        // 중간 상태 확인
        const middleState = await page.evaluate(() => {
            const iframe = document.querySelector('iframe');
            const loadingSpinner = document.querySelector('.animate-spin');
            
            return {
                iframeVisible: iframe ? iframe.offsetHeight > 0 : false,
                loadingSpinnerVisible: loadingSpinner ? loadingSpinner.offsetHeight > 0 : false
            };
        });
        
        console.log('\n🔍 중간 상태 (3초 후):');
        console.log(`- iframe 표시: ${middleState.iframeVisible ? '✅' : '❌'}`);
        console.log(`- 로딩 스피너 표시: ${middleState.loadingSpinnerVisible ? '⚠️' : '✅'}`);
        
        // 5초 더 대기 (총 8초)
        console.log('\n⏳ 5초 더 대기...');
        await page.waitForTimeout(5000);
        
        // 최종 상태 확인
        const finalState = await page.evaluate(() => {
            const iframe = document.querySelector('iframe');
            const loadingSpinner = document.querySelector('.animate-spin');
            const fallbackContent = document.querySelector('div[style*="position: absolute"]');
            
            return {
                iframeVisible: iframe ? iframe.offsetHeight > 0 : false,
                loadingSpinnerVisible: loadingSpinner ? loadingSpinner.offsetHeight > 0 : false,
                fallbackContentVisible: fallbackContent ? fallbackContent.offsetHeight > 0 : false,
                pageOpacity: iframe ? window.getComputedStyle(iframe).opacity : '0'
            };
        });
        
        console.log('\n🔍 최종 상태 (8초 후):');
        console.log(`- iframe 표시: ${finalState.iframeVisible ? '✅' : '❌'}`);
        console.log(`- 로딩 스피너 표시: ${finalState.loadingSpinnerVisible ? '⚠️' : '❌'}`);
        console.log(`- 대체 콘텐츠 표시: ${finalState.fallbackContentVisible ? '✅' : '❌'}`);
        console.log(`- iframe 투명도: ${finalState.pageOpacity}`);
        
        // 스크린샷
        await page.screenshot({ 
            path: 'fixed-page-test-result.png',
            fullPage: true 
        });
        console.log('\n📸 스크린샷 저장: fixed-page-test-result.png');
        
        // 최종 진단
        if (finalState.loadingSpinnerVisible) {
            console.log('\n❌ 최종 진단: 여전히 로딩 스피너가 표시됨 (회색 화면 문제)');
        } else if (finalState.iframeVisible) {
            console.log('\n✅ 최종 진단: iframe이 정상적으로 표시됨');
        } else if (finalState.fallbackContentVisible) {
            console.log('\n✅ 최종 진단: 대체 콘텐츠가 표시됨 (안전장치 작동)');
        } else {
            console.log('\n❌ 최종 진단: 아무것도 표시되지 않음');
        }
        
    } catch (error) {
        console.error('❌ 테스트 중 오류 발생:', error.message);
    } finally {
        await browser.close();
    }
}

// 테스트 실행
testFixedPage().catch(console.error);
