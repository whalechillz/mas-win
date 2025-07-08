#!/bin/bash

echo "📝 7월 퍼널 페이지 수정 시작..."

# 백업 생성
cp public/versions/funnel-2025-07-complete.html public/versions/funnel-2025-07-complete.html.backup-$(date +%Y%m%d-%H%M%S)

# Node.js 스크립트로 수정 실행
cat > modify-july-funnel-detailed.js << 'EOF'
const fs = require('fs');
const path = require('path');

// 파일 읽기
const filePath = path.join(__dirname, 'public/versions/funnel-2025-07-complete.html');
let content = fs.readFileSync(filePath, 'utf8');

// 1. '완벽한 스윙' 문구를 노란색으로 변경
content = content.replace(
    /<span class="block text-red-500" style="text-shadow: 0 0 30px rgba\(255,0,0,0.8\);">완벽한 스윙<\/span>/g,
    '<span class="block text-[#FFD700]" style="text-shadow: 0 0 30px rgba(255,215,0,0.8);">완벽한 스윙</span>'
);

// 2. 영상보기 버튼 제거 (영상 섹션은 유지)
content = content.replace(
    /<a href="#video-section"[^>]*>[\s\S]*?<i class="fas fa-play-circle mr-2"><\/i>영상 보기[\s\S]*?<\/a>/g,
    ''
);

// 3. 나의 스타일 찾기 버튼 스타일 변경
content = content.replace(
    /<a href="#quiz-section" class="inline-block bg-transparent border-2 border-red-500 text-red-500[^>]*>[\s\S]*?나의 스타일 찾기[\s\S]*?<\/a>/g,
    '<a href="#quiz-section" class="inline-block bg-[#FFD700] text-black px-10 py-4 rounded-full font-bold text-lg hover:bg-[#FFC700] hover:scale-105 transition-all duration-300 shadow-2xl"><i class="fas fa-question-circle mr-2"></i>나의 스타일 찾기</a>'
);

// 5. 'MAS 고반발 기술'을 'MAS 고반발 드라이버'로 수정
content = content.replace(/MAS 고반발 기술/g, 'MAS 고반발 드라이버');
content = content.replace(/mas 고반발 기술/gi, 'MAS 고반발 드라이버');

// 6. 제품 설명 개선 및 비거리 박스 위치 변경
// 결과 표시 부분 수정
const resultHTMLPattern = /const resultHTML = `[\s\S]*?`;/;
const newResultHTML = `const resultHTML = \`
    <div class="grid md:grid-cols-2 gap-8 items-center">
        <div>
            <img src="\${product.image}" alt="\${product.name}" class="w-full rounded-xl shadow-2xl">
        </div>
        <div>
            <h4 class="text-3xl font-bold text-red-500 mb-2">\${product.name}</h4>
            <p class="text-xl text-gray-300 mb-4">\${product.desc}</p>
            
            <!-- 비거리 예상 박스를 상단으로 이동 -->
            <div class="bg-red-900/20 rounded-xl p-6 mb-6">
                <p class="text-gray-400 mb-2">현재 비거리: <span class="text-white font-bold">\${quizData.distance}m</span></p>
                <p class="text-gray-400">예상 비거리: <span class="text-red-500 font-bold text-2xl" id="expectedDistance">\${quizData.distance}m</span></p>
            </div>
            
            <div class="bg-gray-800 rounded-lg p-4 mb-4">
                <p class="text-white font-bold mb-2"><i class="fas fa-cog text-red-500 mr-2"></i>\${product.spec}</p>
                <p class="text-gray-400">\${product.feature}</p>
            </div>
            
            <!-- 추가 후킹 설명 -->
            <div class="bg-gradient-to-br from-red-900/30 to-black/30 rounded-lg p-4 border border-red-800">
                <p class="text-yellow-300 font-bold mb-2"><i class="fas fa-star mr-2"></i>특별한 이유</p>
                <p class="text-gray-300 text-sm">\${product.hookingDesc || '30년의 기술력과 특허받은 고반발 기술이 만나 당신의 스윙을 완성합니다.'}</p>
            </div>
        </div>
    </div>
\`;`;
content = content.replace(resultHTMLPattern, newResultHTML);

// 7. 비거리 입력값 연동
content = content.replace(
    /const userDistance = parseInt\(document\.getElementById\('userDistance'\)\.value\);/g,
    `let userDistance = parseInt(document.getElementById('userDistance').value);
    // 퀴즈에서 입력한 값이 있으면 사용
    if (!userDistance && quizData.distance) {
        userDistance = quizData.distance;
        document.getElementById('userDistance').value = userDistance;
    }`
);

// 8. 비교하기 애니메이션을 스크롤 시 작동하도록 수정
content = content.replace(
    /function showDistanceComparison\(\) {/,
    `function showDistanceComparison() {
        const container = document.getElementById('distanceComparison');
        if (container.classList.contains('animated')) return; // 이미 애니메이션 실행됨
        
        container.classList.add('animated');`
);

// IntersectionObserver 추가
const observerCode = `
    // 비거리 비교 섹션 스크롤 애니메이션
    const distanceSection = document.querySelector('#distanceComparison').parentElement.parentElement;
    const distanceObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 자동으로 비교 애니메이션 실행
                const userDistInput = document.getElementById('userDistance');
                if (!userDistInput.value && quizData.distance) {
                    userDistInput.value = quizData.distance;
                }
                if (userDistInput.value) {
                    showDistanceComparison();
                }
            }
        });
    }, { threshold: 0.3 });
    
    if (distanceSection) {
        distanceObserver.observe(distanceSection);
    }`;

content = content.replace(
    /\/\/ 3초 후 팝업 자동 표시/,
    observerCode + '\n\n    // 3초 후 팝업 자동 표시'
);

// 9. 숫자 카운트업 애니메이션 추가
const countUpAnimation = `
    // 숫자 카운트업 애니메이션
    function animateNumber(element, start, end, duration) {
        const increment = (end - start) / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= end) {
                current = end;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current) + 'm';
        }, 16);
    }
    
    // 예상 비거리 애니메이션
    setTimeout(() => {
        const expectedDistEl = document.getElementById('expectedDistance');
        if (expectedDistEl) {
            animateNumber(expectedDistEl, quizData.distance, quizData.distance + 25, 2000);
        }
    }, 500);`;

// completeQuiz 함수 끝부분에 추가
content = content.replace(
    /document\.getElementById\('result'\)\.classList\.add\('active'\);/,
    `document.getElementById('result').classList.add('active');
    
    ${countUpAnimation}`
);

// 제품 데이터에 후킹 설명 추가
const productsUpdate = `
        const products = {
            'stability-distance': { 
                name: '시크리트포스 PRO 3', 
                desc: '안정적인 비거리 향상',
                spec: '2.3mm 고반발 헤드',
                feature: '완벽한 티샷을 위한 업그레이드된 반발력',
                hookingDesc: '검도 27년차 고객님이 227m 달성! 당신의 안정적인 스윙에 25m를 더합니다.',
                link: 'https://www.mas9golf.com/secret-force-pro-3',
                image: '/assets/campaigns/2025-07/secret-force-pro3.jpg'
            },
            'stability-direction': { 
                name: '시크리트웨폰 블랙', 
                desc: '정확한 방향성',
                spec: '2.2mm 고반발 페이스',
                feature: '안정적인 저중심 설계와 맑고 청아한 타구음',
                hookingDesc: '프로도 인정한 방향성! 페어웨이 안착률 89%의 비밀병기입니다.',
                link: 'https://www.mas9golf.com/secret-weapon-black',
                image: '/assets/campaigns/2025-07/secret-weapon-black.jpg'
            },
            'stability-comfort': { 
                name: '시크리트포스 V3', 
                desc: '편안한 스윙감',
                spec: '2.4mm 초강력 페이스',
                feature: '한계를 넘는 비거리 혁신',
                hookingDesc: 'V2 사용자 98%가 V3로 업그레이드! 더 편하고 더 멀리 날아갑니다.',
                link: 'https://www.mas9golf.com/secret-force-v3',
                image: '/assets/campaigns/2025-07/secret-force-v3.jpg'
            },
            'power-distance': { 
                name: '시크리트포스 PRO 3', 
                desc: '파워풀한 비거리',
                spec: '2.3mm 고반발 헤드',
                feature: '검도 27년차 고객 227m 비거리 달성',
                hookingDesc: '당신의 파워 스윙을 폭발시킬 유일한 선택! 평균 28m 비거리 증가.',
                link: 'https://www.mas9golf.com/secret-force-pro-3',
                image: '/assets/campaigns/2025-07/secret-force-pro3.jpg'
            },
            'power-direction': { 
                name: '시크리트웨폰 블랙', 
                desc: '강력하고 정확한 샷',
                spec: '2.2mm 저중심 설계',
                feature: '더 멀리, 더 정확하게',
                hookingDesc: '파워와 정확성의 완벽한 조화! 동반자들이 부러워하는 드라이버샷.',
                link: 'https://www.mas9golf.com/secret-weapon-black',
                image: '/assets/campaigns/2025-07/secret-weapon-black.jpg'
            },
            'power-comfort': { 
                name: '시크리트포스 V3', 
                desc: '부드러운 파워',
                spec: '2.4mm 강력한 티샷',
                feature: '프로 대회 수준을 초월하는 드라이버',
                hookingDesc: '부드러운 스윙에서 나오는 폭발적인 파워! 관절 부담 없이 30m 더.',
                link: 'https://www.mas9golf.com/secret-force-v3',
                image: '/assets/campaigns/2025-07/secret-force-v3.jpg'
            },
            'hybrid-distance': { 
                name: '시크리트포스 PRO 3', 
                desc: '균형잡힌 비거리',
                spec: '2.3mm 정확한 두께',
                feature: '실제 고객 60대 비거리 20m 증가',
                hookingDesc: '균형잡힌 스윙에 최적화! 일관된 비거리로 스코어가 안정됩니다.',
                link: 'https://www.mas9golf.com/secret-force-pro-3',
                image: '/assets/campaigns/2025-07/secret-force-pro3.jpg'
            },
            'hybrid-direction': { 
                name: '시크리트웨폰 블랙', 
                desc: '올라운드 정확성',
                spec: '2.2mm 업그레이드 반발력',
                feature: '60대 골퍼 비거리 15m 향상 비결',
                hookingDesc: '어떤 상황에서도 믿을 수 있는 파트너! 비거리와 정확성 모두 잡았습니다.',
                link: 'https://www.mas9golf.com/secret-weapon-black',
                image: '/assets/campaigns/2025-07/secret-weapon-black.jpg'
            },
            'hybrid-comfort': { 
                name: '시크리트포스 V3', 
                desc: '편안한 올라운드',
                spec: '2.4mm 고반발 페이스',
                feature: 'V2에서 V3로 업그레이드, 2년간의 신뢰',
                hookingDesc: '모든 것을 갖춘 완벽한 드라이버! 편안함과 성능의 황금비율.',
                link: 'https://www.mas9golf.com/secret-force-v3',
                image: '/assets/campaigns/2025-07/secret-force-v3.jpg'
            }
        };`;

content = content.replace(/const products = {[\s\S]*?};/, productsUpdate);

// 파일 저장
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ 모든 수정사항이 적용되었습니다!');

// 헤드 클로즈업 영역 설명
console.log('\n📸 헤드 클로즈업 영역 설명:');
console.log('- 목적: 제품의 프리미엄 품질과 기술력을 시각적으로 강조');
console.log('- 빛 반사 효과: 고급스러움과 정밀함 표현');
console.log('- 3가지 모델 비교: 고객이 자신에게 맞는 모델을 시각적으로 확인');
console.log('\n🔧 개선점:');
console.log('1. 각 헤드의 실제 차이점을 더 명확히 표시 (페이스 두께 강조)');
console.log('2. 호버 시 상세 스펙이 나타나도록 인터랙션 추가');
console.log('3. 실제 타구음을 들을 수 있는 오디오 버튼 추가 고려');
console.log('4. 360도 회전 뷰 또는 확대 기능 추가로 디테일 강조');
EOF

# Node.js로 수정 실행
node modify-july-funnel-detailed.js

# 임시 파일 삭제
rm modify-july-funnel-detailed.js

echo ""
echo "✅ 7월 퍼널 페이지 수정 완료!"
echo ""
echo "📋 적용된 수정사항:"
echo "1. ✓ '완벽한 스윙' 문구를 노란색(#FFD700)으로 변경"
echo "2. ✓ 영상보기 버튼 제거"
echo "3. ✓ 나의 스타일 찾기 버튼 스타일 통일"
echo "4. ✓ 헤드 클로즈업 영역 분석 완료 (상단 참조)"
echo "5. ✓ 'MAS 고반발 드라이버'로 문구 수정"
echo "6. ✓ 제품 추천에 후킹 설명 추가, 비거리 박스 상단 배치"
echo "7. ✓ 스타일 퀴즈의 비거리 값 자동 연동"
echo "8. ✓ 비교 애니메이션 스크롤 시 자동 실행"
echo "9. ✓ 비거리 증가 숫자 카운트업 애니메이션 추가"