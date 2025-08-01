const fs = require('fs');
const path = require('path');

// HTML 파일 읽기
const htmlPath = path.join(__dirname, 'public/versions/funnel-2025-07-complete.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// 이미지 경로 패턴
const patterns = [
    /<img[^>]+src=["']([^"']+)["'][^>]*>/gi,
    /url\(["']?([^"']+\.(?:jpg|jpeg|png|gif|webp))["']?\)/gi,
    /<meta[^>]+content=["']([^"']+\.(?:jpg|jpeg|png|gif|webp))["'][^>]*>/gi
];

const foundImages = new Set();

// 모든 패턴으로 이미지 찾기
patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(htmlContent)) !== null) {
        foundImages.add(match[1]);
    }
});

console.log('=== 7월 퍼널 HTML에서 찾은 이미지 경로 ===\n');

// 이미지 경로 분석
const imageAnalysis = {
    correct: [],
    incorrect: [],
    external: []
};

foundImages.forEach(imgPath => {
    if (imgPath.startsWith('http')) {
        // 외부 경로 중 win.masgolf.co.kr 도메인 체크
        if (imgPath.includes('win.masgolf.co.kr')) {
            // 도메인 제거하고 경로만 추출
            const pathOnly = imgPath.replace(/https?:\/\/win\.masgolf\.co\.kr/, '');
            
            // /assets/campaigns/ 경로 체크
            if (pathOnly.includes('/assets/campaigns/')) {
                imageAnalysis.incorrect.push({
                    found: imgPath,
                    shouldBe: imgPath.replace('/assets/campaigns/', '/campaigns/'),
                    issue: '/assets/ 경로는 존재하지 않음. /campaigns/로 수정 필요'
                });
            } else {
                imageAnalysis.external.push(imgPath);
            }
        } else {
            imageAnalysis.external.push(imgPath);
        }
    } else if (imgPath.startsWith('/assets/campaigns/')) {
        imageAnalysis.incorrect.push({
            found: imgPath,
            shouldBe: imgPath.replace('/assets/campaigns/', '/campaigns/'),
            issue: '/assets/ 경로는 존재하지 않음. /campaigns/로 수정 필요'
        });
    } else if (imgPath.startsWith('/campaigns/') || imgPath.startsWith('../') || imgPath.startsWith('../../')) {
        imageAnalysis.correct.push(imgPath);
    } else {
        imageAnalysis.correct.push(imgPath);
    }
});

// 결과 출력
console.log('✅ 올바른 경로:', imageAnalysis.correct.length, '개');
imageAnalysis.correct.forEach(path => console.log('  -', path));

console.log('\n❌ 수정이 필요한 경로:', imageAnalysis.incorrect.length, '개');
imageAnalysis.incorrect.forEach(item => {
    console.log(`  - 현재: ${item.found}`);
    console.log(`    수정: ${item.shouldBe}`);
    console.log(`    문제: ${item.issue}\n`);
});

console.log('\n🌐 외부 경로:', imageAnalysis.external.length, '개');
imageAnalysis.external.forEach(path => console.log('  -', path));

// 실제 파일 존재 여부 확인
console.log('\n=== 실제 파일 존재 확인 ===\n');

const checkPaths = [
    '/campaigns/2025-07/hero-summer-golf-mas.jpg',
    '/campaigns/2025-07/hero-summer-golf-mas-wide.jpg',
    '/campaigns/common/gifts/cooling-towel.jpeg',
    '/campaigns/common/gifts/cooling-sleeves.jpg',
    '/campaigns/common/gifts/SALUTE21-01.jpg',
    '/campaigns/common/gifts/SALUTE21-02.png'
];

checkPaths.forEach(checkPath => {
    const fullPath = path.join(__dirname, 'public', checkPath);
    const exists = fs.existsSync(fullPath);
    console.log(`${exists ? '✅' : '❌'} ${checkPath} - ${exists ? '파일 존재' : '파일 없음'}`);
});

// 수정 제안
if (imageAnalysis.incorrect.length > 0) {
    console.log('\n=== 수정 방법 ===');
    console.log('다음 명령어로 이미지 경로를 수정할 수 있습니다:');
    console.log(`\nsed -i '' 's|/assets/campaigns/|/campaigns/|g' public/versions/funnel-2025-07-complete.html`);
}
