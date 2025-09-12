/**
 * 간단한 페이지 테스트
 */

const { chromium } = require('playwright');

async function testSimplePage() {
    console.log('🚀 간단한 페이지 테스트 시작...\n');
    
    const browser = await chromium.launch({ 
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        
        // 콘솔 메시지 모니터링
        page.on('console', (msg) => {
            console.log(`📊 [${msg.type()}] ${msg.text()}`);
        });
        
        console.log('📱 페이지 로드 중...');
        await page.goto('http://localhost:3000/25-09-simple', { 
            waitUntil: 'domcontentloaded',
            timeout: 10000 
        });
        
        console.log('✅ 페이지 로드 완료');
        
        // DOM 구조 확인
        const domInfo = await page.evaluate(() => {
            const iframe = document.querySelector('iframe');
            const loadingSpinner = document.querySelector('.animate-spin');
            const body = document.body;
            
            return {
                iframeExists: !!iframe,
                iframeSrc: iframe ? iframe.src : null,
                iframeVisible: iframe ? iframe.offsetHeight > 0 : false,
                loadingSpinnerExists: !!loadingSpinner,
                loadingSpinnerVisible: loadingSpinner ? loadingSpinner.offsetHeight > 0 : false,
                bodyHeight: body.offsetHeight,
                bodyBackgroundColor: window.getComputedStyle(body).backgroundColor,
                bodyTextContent: body.textContent.length
            };
        });
        
        console.log('\n🔍 DOM 정보:');
        console.log(`- iframe 존재: ${domInfo.iframeExists ? '✅' : '❌'}`);
        if (domInfo.iframeExists) {
            console.log(`- iframe src: ${domInfo.iframeSrc}`);
            console.log(`- iframe 표시: ${domInfo.iframeVisible ? '✅' : '❌'}`);
        }
        console.log(`- 로딩 스피너 존재: ${domInfo.loadingSpinnerExists ? '✅' : '❌'}`);
        console.log(`- 로딩 스피너 표시: ${domInfo.loadingSpinnerVisible ? '⚠️' : '✅'}`);
        console.log(`- 페이지 높이: ${domInfo.bodyHeight}px`);
        console.log(`- 배경색: ${domInfo.bodyBackgroundColor}`);
        console.log(`- 텍스트 길이: ${domInfo.bodyTextContent} 문자`);
        
        // 5초 대기
        await page.waitForTimeout(5000);
        
        // 최종 상태 확인
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
        
        // 스크린샷
        await page.screenshot({ 
            path: 'simple-page-test-result.png',
            fullPage: true 
        });
        console.log('\n📸 스크린샷 저장: simple-page-test-result.png');
        
        if (finalState.loadingSpinnerVisible) {
            console.log('\n❌ 최종 진단: 회색 화면 문제 확인됨');
        } else if (!finalState.iframeVisible) {
            console.log('\n❌ 최종 진단: iframe이 표시되지 않음');
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
testSimplePage().catch(console.error);
