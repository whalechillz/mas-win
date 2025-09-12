/**
 * 간단한 iframe 테스트
 */

const { chromium } = require('playwright');

async function testIframe() {
    console.log('🚀 iframe 테스트 시작...\n');
    
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
        await page.goto('http://localhost:3000/25-09/', { 
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
                iframeStyle: iframe ? iframe.style.cssText : null,
                loadingSpinnerExists: !!loadingSpinner,
                loadingSpinnerStyle: loadingSpinner ? loadingSpinner.style.cssText : null,
                bodyHTML: body.innerHTML.substring(0, 500) + '...',
                allElements: Array.from(document.querySelectorAll('*')).map(el => ({
                    tagName: el.tagName,
                    className: el.className,
                    id: el.id
                })).slice(0, 20)
            };
        });
        
        console.log('\n🔍 DOM 정보:');
        console.log(`- iframe 존재: ${domInfo.iframeExists ? '✅' : '❌'}`);
        if (domInfo.iframeExists) {
            console.log(`- iframe src: ${domInfo.iframeSrc}`);
            console.log(`- iframe style: ${domInfo.iframeStyle}`);
        }
        console.log(`- 로딩 스피너 존재: ${domInfo.loadingSpinnerExists ? '✅' : '❌'}`);
        if (domInfo.loadingSpinnerExists) {
            console.log(`- 로딩 스피너 style: ${domInfo.loadingSpinnerStyle}`);
        }
        
        console.log('\n📄 페이지 HTML (처음 500자):');
        console.log(domInfo.bodyHTML);
        
        console.log('\n🏷️ 페이지 요소들:');
        domInfo.allElements.forEach((el, index) => {
            console.log(`${index + 1}. ${el.tagName}${el.className ? '.' + el.className : ''}${el.id ? '#' + el.id : ''}`);
        });
        
        // 5초 대기
        await page.waitForTimeout(5000);
        
        // 스크린샷
        await page.screenshot({ 
            path: 'iframe-test-result.png',
            fullPage: true 
        });
        console.log('\n📸 스크린샷 저장: iframe-test-result.png');
        
    } catch (error) {
        console.error('❌ 테스트 중 오류 발생:', error.message);
    } finally {
        await browser.close();
    }
}

// 테스트 실행
testIframe().catch(console.error);
