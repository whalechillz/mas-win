/**
 * 모바일 성능 테스트 스크립트
 * 회색 화면 문제 및 로딩 속도 테스트
 */

const { chromium } = require('playwright');

async function testMobilePerformance() {
    console.log('🚀 모바일 성능 테스트 시작...\n');
    
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
        
        // 성능 메트릭 수집
        const performanceMetrics = [];
        
        // 페이지 로드 이벤트 리스너
        page.on('load', () => {
            console.log('✅ 페이지 로드 완료');
        });
        
        page.on('domcontentloaded', () => {
            console.log('✅ DOM 콘텐츠 로드 완료');
        });
        
        // 네트워크 요청 모니터링
        page.on('request', (request) => {
            const url = request.url();
            if (url.includes('funnel-2025-09') || url.includes('mobile-performance-fix')) {
                console.log(`📡 요청: ${url}`);
            }
        });
        
        page.on('response', (response) => {
            const url = response.url();
            if (url.includes('funnel-2025-09') || url.includes('mobile-performance-fix')) {
                console.log(`📥 응답: ${url} - ${response.status()}`);
            }
        });
        
        // 콘솔 메시지 모니터링
        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                console.error(`❌ 콘솔 에러: ${msg.text()}`);
            } else if (msg.text().includes('성능') || msg.text().includes('로드')) {
                console.log(`📊 ${msg.text()}`);
            }
        });
        
        // 페이지 로드 시간 측정 시작
        const startTime = Date.now();
        
        console.log('📱 모바일 환경에서 페이지 로드 테스트...');
        await page.goto('http://localhost:3000/25-09/', { 
            waitUntil: 'domcontentloaded',
            timeout: 30000 
        });
        
        // 로딩 스피너 확인
        console.log('\n🔍 로딩 스피너 확인...');
        const loadingSpinner = await page.locator('.animate-spin').first();
        if (await loadingSpinner.isVisible()) {
            console.log('✅ 로딩 스피너가 표시됨');
            
            // 로딩 스피너가 사라질 때까지 대기
            await loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 });
            console.log('✅ 로딩 스피너가 사라짐');
        } else {
            console.log('⚠️ 로딩 스피너가 표시되지 않음');
        }
        
        // iframe 로드 확인
        console.log('\n🔍 iframe 로드 확인...');
        const iframe = page.locator('iframe');
        await iframe.waitFor({ state: 'visible', timeout: 10000 });
        console.log('✅ iframe이 표시됨');
        
        // iframe 내부 콘텐츠 확인
        const iframeContent = await iframe.contentFrame();
        if (iframeContent) {
            console.log('✅ iframe 콘텐츠에 접근 가능');
            
            // iframe 내부 요소 확인
            const iframeBody = await iframeContent.locator('body');
            if (await iframeBody.isVisible()) {
                console.log('✅ iframe 내부 콘텐츠가 표시됨');
            }
        }
        
        // 성능 메트릭 수집
        const loadTime = Date.now() - startTime;
        console.log(`\n⏱️ 총 로드 시간: ${loadTime}ms`);
        
        // 페이지 성능 메트릭
        const metrics = await page.evaluate(() => {
            const navigation = performance.getEntriesByType('navigation')[0];
            return {
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                totalLoadTime: navigation.loadEventEnd - navigation.navigationStart
            };
        });
        
        console.log('\n📊 성능 메트릭:');
        console.log(`- DOM 로드 시간: ${metrics.domContentLoaded}ms`);
        console.log(`- 완전 로드 시간: ${metrics.loadComplete}ms`);
        console.log(`- 총 로드 시간: ${metrics.totalLoadTime}ms`);
        
        // 회색 화면 문제 확인
        console.log('\n🔍 회색 화면 문제 확인...');
        const bodyColor = await page.evaluate(() => {
            const body = document.body;
            const computedStyle = window.getComputedStyle(body);
            return {
                backgroundColor: computedStyle.backgroundColor,
                color: computedStyle.color,
                visibility: computedStyle.visibility,
                display: computedStyle.display
            };
        });
        
        console.log('📱 페이지 스타일 정보:');
        console.log(`- 배경색: ${bodyColor.backgroundColor}`);
        console.log(`- 텍스트 색상: ${bodyColor.color}`);
        console.log(`- 가시성: ${bodyColor.visibility}`);
        console.log(`- 디스플레이: ${bodyColor.display}`);
        
        // 스크린샷 촬영
        await page.screenshot({ 
            path: 'mobile-performance-test.png',
            fullPage: true 
        });
        console.log('📸 스크린샷 저장: mobile-performance-test.png');
        
        // 성능 평가
        console.log('\n📈 성능 평가:');
        if (metrics.totalLoadTime < 2000) {
            console.log('🟢 우수: 로딩 시간이 2초 미만');
        } else if (metrics.totalLoadTime < 4000) {
            console.log('🟡 보통: 로딩 시간이 2-4초');
        } else {
            console.log('🔴 개선 필요: 로딩 시간이 4초 이상');
        }
        
        // 회색 화면 문제 진단
        if (bodyColor.backgroundColor === 'rgba(0, 0, 0, 0)' || bodyColor.backgroundColor === 'transparent') {
            console.log('⚠️ 회색 화면 문제 가능성: 배경색이 투명함');
        } else {
            console.log('✅ 배경색 정상');
        }
        
        // 5초 대기 후 추가 확인
        console.log('\n⏳ 5초 대기 후 추가 확인...');
        await page.waitForTimeout(5000);
        
        // 최종 상태 확인
        const finalState = await page.evaluate(() => {
            const iframe = document.querySelector('iframe');
            const loadingSpinner = document.querySelector('.animate-spin');
            return {
                iframeVisible: iframe && iframe.offsetHeight > 0,
                loadingSpinnerVisible: loadingSpinner && loadingSpinner.offsetHeight > 0,
                bodyContent: document.body.textContent.length
            };
        });
        
        console.log('\n🔍 최종 상태:');
        console.log(`- iframe 표시: ${finalState.iframeVisible ? '✅' : '❌'}`);
        console.log(`- 로딩 스피너 표시: ${finalState.loadingSpinnerVisible ? '⚠️' : '✅'}`);
        console.log(`- 페이지 콘텐츠 길이: ${finalState.bodyContent} 문자`);
        
        if (finalState.loadingSpinnerVisible) {
            console.log('❌ 문제: 로딩 스피너가 계속 표시됨 (회색 화면 문제)');
        } else if (!finalState.iframeVisible) {
            console.log('❌ 문제: iframe이 표시되지 않음');
        } else {
            console.log('✅ 정상: 페이지가 올바르게 로드됨');
        }
        
    } catch (error) {
        console.error('❌ 테스트 중 오류 발생:', error);
    } finally {
        await browser.close();
    }
}

// 테스트 실행
testMobilePerformance().catch(console.error);
