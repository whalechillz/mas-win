const fs = require('fs');
const path = require('path');

// HTML 파일 경로
const htmlFile = path.join(__dirname, 'public/versions/funnel-2025-07-complete.html');

// 파일 읽기
const content = fs.readFileSync(htmlFile, 'utf8');

console.log('=== 히어로 섹션 분석 ===\n');

// 히어로 섹션 찾기 (뜨거운 여름 텍스트 근처)
const heroTextIndex = content.indexOf('뜨거운 여름');
if (heroTextIndex !== -1) {
    // 전후 500자 확인
    const start = Math.max(0, heroTextIndex - 500);
    const end = Math.min(content.length, heroTextIndex + 500);
    const heroArea = content.substring(start, end);
    
    console.log('히어로 텍스트 주변 HTML:');
    console.log('---');
    console.log(heroArea);
    console.log('---\n');
    
    // 이 영역에서 배경 이미지 찾기
    const bgMatch = heroArea.match(/background[^;]*url\([^)]+\)/gi);
    if (bgMatch) {
        console.log('발견된 배경 이미지:');
        bgMatch.forEach(bg => console.log('  - ' + bg));
    }
}

// 모든 이미지 경로 찾기
console.log('\n=== 모든 이미지 경로 ===\n');

const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
const bgRegex = /background[^;]*url\(["']?([^"')]+)["']?\)/gi;

const imgMatches = [...content.matchAll(imgRegex)];
const bgMatches = [...content.matchAll(bgRegex)];

console.log('IMG 태그:');
imgMatches.forEach(match => {
    if (match[1].includes('hero') || match[1].includes('2025-07')) {
        console.log('  - ' + match[1]);
    }
});

console.log('\n배경 이미지:');
bgMatches.forEach(match => {
    if (match[1].includes('hero') || match[1].includes('2025-07')) {
        console.log('  - ' + match[1]);
    }
});

// 잘못된 경로 찾기
console.log('\n=== 잘못된 경로 ===\n');
const wrongPaths = [];

[...imgMatches, ...bgMatches].forEach(match => {
    if (match[1].includes('/assets/campaigns/')) {
        wrongPaths.push(match[1]);
    }
});

if (wrongPaths.length > 0) {
    console.log('수정이 필요한 경로:', wrongPaths.length, '개');
    wrongPaths.forEach(path => {
        console.log(`  ❌ ${path}`);
        console.log(`  ✅ ${path.replace('/assets/campaigns/', '/campaigns/')}`);
    });
} else {
    console.log('잘못된 경로가 없습니다.');
}
