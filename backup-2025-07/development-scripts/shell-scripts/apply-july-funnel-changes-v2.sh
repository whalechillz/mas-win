#!/bin/bash

echo "📝 7월 퍼널 페이지 추가 수정 시작..."

# 백업 생성
cp public/versions/funnel-2025-07-complete.html public/versions/funnel-2025-07-complete.html.backup-$(date +%Y%m%d-%H%M%S)

# Node.js 스크립트로 수정 실행
cat > modify-july-funnel-v2.js << 'EOF'
const fs = require('fs');
const path = require('path');

// 파일 읽기
const filePath = path.join(__dirname, 'public/versions/funnel-2025-07-complete.html');
let content = fs.readFileSync(filePath, 'utf8');

// 1. 헤드 클로즈업 영역 전체 삭제
// 영상 섹션 전체를 삭제
content = content.replace(
    /<section id="video-section"[\s\S]*?<\/section>\s*<!-- 영역2: 퀴즈 섹션 -->/g,
    '<!-- 영역2: 퀴즈 섹션 -->'
);

// 2. 상세보기 버튼 삭제
content = content.replace(
    /<a href="\${product\.link}"[^>]*>[\s\S]*?<i class="fas fa-info-circle mr-2"><\/i>상세보기[\s\S]*?<\/a>/g,
    ''
);

// 3. 결과 표시 HTML 수정 - 비거리 박스를 하단으로 이동
const resultHTMLPattern = /const resultHTML = `[\s\S]*?`;/;
const newResultHTML = `const resultHTML = \`
    <div class="grid md:grid-cols-2 gap-8 items-center">
        <div>
            <img src="\${product.image}" alt="\${product.name}" class="w-full rounded-xl shadow-2xl">
        </div>
        <div>
            <h4 class="text-3xl font-bold text-red-500 mb-2">\${product.name}</h4>
            <p class="text-xl text-gray-300 mb-4">\${product.desc}</p>
            
            <div class="bg-gray-800 rounded-lg p-4 mb-4">
                <p class="text-white font-bold mb-2"><i class="fas fa-cog text-red-500 mr-2"></i>\${product.spec}</p>
                <p class="text-gray-400">\${product.feature}</p>
            </div>
            
            <!-- 상세 스펙 추가 -->
            <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-4 mb-4 border border-gray-700">
                <p class="text-yellow-300 font-bold mb-3"><i class="fas fa-chart-bar mr-2"></i>상세 스펙</p>
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div class="text-gray-400">페이스 두께:</div>
                    <div class="text-white font-bold">\${product.faceThickness || '2.3mm'}</div>
                    <div class="text-gray-400">반발계수:</div>
                    <div class="text-white font-bold">\${product.cor || '0.87'}</div>
                    <div class="text-gray-400">헤드 체적:</div>
                    <div class="text-white font-bold">\${product.headVolume || '460cc'}</div>
                    <div class="text-gray-400">샤프트:</div>
                    <div class="text-white font-bold">\${product.shaft || 'NGS 50/60'}</div>
                </div>
            </div>
            
            <!-- 특별한 이유 -->
            <div class="bg-gradient-to-br from-red-900/30 to-black/30 rounded-lg p-4 border border-red-800">
                <p class="text-yellow-300 font-bold mb-2"><i class="fas fa-star mr-2"></i>특별한 이유</p>
                <p class="text-gray-300 text-sm">\${product.hookingDesc || '30년의 기술력과 특허받은 고반발 기술이 만나 당신의 스윙을 완성합니다.'}</p>
            </div>
        </div>
    </div>
    
    <!-- 비거리 예상 박스를 하단으로 이동 -->
    <div class="bg-red-900/20 rounded-xl p-6 mt-8 text-center">
        <p class="text-gray-400 mb-2 text-lg">현재 비거리: <span class="text-white font-bold text-2xl">\${quizData.distance}m</span></p>
        <p class="text-gray-400 text-lg">예상 비거리: <span class="text-red-500 font-bold text-3xl" id="expectedDistance">\${quizData.distance}m</span></p>
    </div>
\`;`;
content = content.replace(resultHTMLPattern, newResultHTML);

// 4. 제품 데이터에 상세 스펙 추가
const productsUpdate = `
        const products = {
            'stability-distance': { 
                name: '시크리트포스 PRO 3', 
                desc: '안정적인 비거리 향상',
                spec: '2.3mm 고반발 헤드',
                feature: '완벽한 티샷을 위한 업그레이드된 반발력',
                hookingDesc: '검도 27년차 고객님이 227m 달성! 당신의 안정적인 스윙에 25m를 더합니다.',
                link: 'https://www.mas9golf.com/secret-force-pro-3',
                image: '/assets/campaigns/2025-07/secret-force-pro3.jpg',
                faceThickness: '2.3mm',
                cor: '0.87',
                headVolume: '460cc',
                shaft: 'NGS 50/60 전용'
            },
            'stability-direction': { 
                name: '시크리트웨폰 블랙', 
                desc: '정확한 방향성',
                spec: '2.2mm 고반발 페이스',
                feature: '안정적인 저중심 설계와 맑고 청아한 타구음',
                hookingDesc: '프로도 인정한 방향성! 페어웨이 안착률 89%의 비밀병기입니다.',
                link: 'https://www.mas9golf.com/secret-weapon-black',
                image: '/assets/campaigns/2025-07/secret-weapon-black.jpg',
                faceThickness: '2.2mm',
                cor: '0.86',
                headVolume: '445cc',
                shaft: 'NGS 저중심 설계'
            },
            'stability-comfort': { 
                name: '시크리트포스 V3', 
                desc: '편안한 스윙감',
                spec: '2.4mm 초강력 페이스',
                feature: '한계를 넘는 비거리 혁신',
                hookingDesc: 'V2 사용자 98%가 V3로 업그레이드! 더 편하고 더 멀리 날아갑니다.',
                link: 'https://www.mas9golf.com/secret-force-v3',
                image: '/assets/campaigns/2025-07/secret-force-v3.jpg',
                faceThickness: '2.4mm',
                cor: '0.87',
                headVolume: '460cc',
                shaft: 'NGS V3 전용'
            },
            'power-distance': { 
                name: '시크리트포스 PRO 3', 
                desc: '파워풀한 비거리',
                spec: '2.3mm 고반발 헤드',
                feature: '검도 27년차 고객 227m 비거리 달성',
                hookingDesc: '당신의 파워 스윙을 폭발시킬 유일한 선택! 평균 28m 비거리 증가.',
                link: 'https://www.mas9golf.com/secret-force-pro-3',
                image: '/assets/campaigns/2025-07/secret-force-pro3.jpg',
                faceThickness: '2.3mm',
                cor: '0.87',
                headVolume: '460cc',
                shaft: 'NGS 50/60 전용'
            },
            'power-direction': { 
                name: '시크리트웨폰 블랙', 
                desc: '강력하고 정확한 샷',
                spec: '2.2mm 저중심 설계',
                feature: '더 멀리, 더 정확하게',
                hookingDesc: '파워와 정확성의 완벽한 조화! 동반자들이 부러워하는 드라이버샷.',
                link: 'https://www.mas9golf.com/secret-weapon-black',
                image: '/assets/campaigns/2025-07/secret-weapon-black.jpg',
                faceThickness: '2.2mm',
                cor: '0.86',
                headVolume: '445cc',
                shaft: 'NGS 저중심 설계'
            },
            'power-comfort': { 
                name: '시크리트포스 V3', 
                desc: '부드러운 파워',
                spec: '2.4mm 강력한 티샷',
                feature: '프로 대회 수준을 초월하는 드라이버',
                hookingDesc: '부드러운 스윙에서 나오는 폭발적인 파워! 관절 부담 없이 30m 더.',
                link: 'https://www.mas9golf.com/secret-force-v3',
                image: '/assets/campaigns/2025-07/secret-force-v3.jpg',
                faceThickness: '2.4mm',
                cor: '0.87',
                headVolume: '460cc',
                shaft: 'NGS V3 전용'
            },
            'hybrid-distance': { 
                name: '시크리트포스 PRO 3', 
                desc: '균형잡힌 비거리',
                spec: '2.3mm 정확한 두께',
                feature: '실제 고객 60대 비거리 20m 증가',
                hookingDesc: '균형잡힌 스윙에 최적화! 일관된 비거리로 스코어가 안정됩니다.',
                link: 'https://www.mas9golf.com/secret-force-pro-3',
                image: '/assets/campaigns/2025-07/secret-force-pro3.jpg',
                faceThickness: '2.3mm',
                cor: '0.87',
                headVolume: '460cc',
                shaft: 'NGS 50/60 전용'
            },
            'hybrid-direction': { 
                name: '시크리트웨폰 블랙', 
                desc: '올라운드 정확성',
                spec: '2.2mm 업그레이드 반발력',
                feature: '60대 골퍼 비거리 15m 향상 비결',
                hookingDesc: '어떤 상황에서도 믿을 수 있는 파트너! 비거리와 정확성 모두 잡았습니다.',
                link: 'https://www.mas9golf.com/secret-weapon-black',
                image: '/assets/campaigns/2025-07/secret-weapon-black.jpg',
                faceThickness: '2.2mm',
                cor: '0.86',
                headVolume: '445cc',
                shaft: 'NGS 저중심 설계'
            },
            'hybrid-comfort': { 
                name: '시크리트포스 V3', 
                desc: '편안한 올라운드',
                spec: '2.4mm 고반발 페이스',
                feature: 'V2에서 V3로 업그레이드, 2년간의 신뢰',
                hookingDesc: '모든 것을 갖춘 완벽한 드라이버! 편안함과 성능의 황금비율.',
                link: 'https://www.mas9golf.com/secret-force-v3',
                image: '/assets/campaigns/2025-07/secret-force-v3.jpg',
                faceThickness: '2.4mm',
                cor: '0.87',
                headVolume: '460cc',
                shaft: 'NGS V3 전용'
            }
        };`;

content = content.replace(/const products = {[\s\S]*?};/, productsUpdate);

// 5. 마일드한 애니메이션 효과 추가
// 스타일 섹션에 추가
const animationStyles = `
        /* 거리 비교 성공 애니메이션 */
        @keyframes successPulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.9; }
        }
        
        @keyframes glowEffect {
            0%, 100% { box-shadow: 0 0 20px rgba(255, 0, 0, 0.5); }
            50% { box-shadow: 0 0 40px rgba(255, 0, 0, 0.8), 0 0 60px rgba(255, 0, 0, 0.4); }
        }
        
        .success-animation {
            animation: successPulse 1s ease-in-out 3, glowEffect 3s ease-in-out;
        }
        
        /* 부드러운 라인 애니메이션 */
        @keyframes drawLine {
            0% { width: 0%; opacity: 0; }
            100% { width: 100%; opacity: 1; }
        }
        
        .line-animation {
            position: relative;
            overflow: hidden;
        }
        
        .line-animation::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            height: 3px;
            background: linear-gradient(90deg, transparent, #FFD700, transparent);
            animation: drawLine 2s ease-out forwards;
        }
    </style>`;

// 스타일 태그 닫기 전에 추가
content = content.replace('</style>', animationStyles + '\n    </style>');

// showDistanceComparison 함수 수정
const newShowDistanceComparison = `function showDistanceComparison() {
        const container = document.getElementById('distanceComparison');
        if (container.classList.contains('animated')) return; // 이미 애니메이션 실행됨
        
        container.classList.add('animated');
        
        const userDistance = parseInt(document.getElementById('userDistance').value);
        if (!userDistance && quizData.distance) {
            userDistance = quizData.distance;
            document.getElementById('userDistance').value = userDistance;
        }
        
        if (!userDistance) {
            alert('비거리를 입력해주세요.');
            return;
        }
        
        const masDistance = userDistance + 25;
        const maxDistance = Math.max(masDistance, 300);
        
        // 비거리 표시
        document.getElementById('normalDistance').textContent = userDistance + 'm';
        document.getElementById('masDistance').textContent = masDistance + 'm';
        
        // 비교 영역 표시
        document.getElementById('distanceComparison').classList.remove('hidden');
        
        // 애니메이션 효과 추가
        const comparisonSection = document.getElementById('distanceComparison');
        comparisonSection.classList.add('success-animation');
        
        // 증가량 표시 영역에 하이라이트 효과
        const increaseDisplay = document.querySelector('.text-6xl.font-black.text-red-500');
        if (increaseDisplay) {
            increaseDisplay.parentElement.parentElement.classList.add('line-animation');
        }
        
        // 골프공 애니메이션
        setTimeout(() => {
            const normalBall = document.getElementById('normalBall');
            const masBall = document.getElementById('masBall');
            
            normalBall.style.setProperty('--distance', \`\${(userDistance / maxDistance) * 90}%\`);
            masBall.style.setProperty('--distance', \`\${(masDistance / maxDistance) * 90}%\`);
            
            normalBall.classList.add('ball-animate');
            masBall.classList.add('ball-animate');
            
            // 숫자 카운트업 애니메이션
            animateDistanceIncrease();
        }, 100);
    }
    
    // 비거리 증가 카운트업 애니메이션
    function animateDistanceIncrease() {
        const increaseElement = document.querySelector('.text-6xl.font-black.text-red-500');
        if (!increaseElement) return;
        
        let current = 0;
        const target = 25;
        const duration = 2000;
        const increment = target / (duration / 16);
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            increaseElement.textContent = '+' + Math.floor(current);
        }, 16);
    }`;

content = content.replace(/function showDistanceComparison\(\) {[\s\S]*?^    }/m, newShowDistanceComparison);

// 파일 저장
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ 모든 수정사항이 적용되었습니다!');
EOF

# Node.js로 수정 실행
node modify-july-funnel-v2.js

# 임시 파일 삭제
rm modify-july-funnel-v2.js

echo ""
echo "✅ 7월 퍼널 페이지 추가 수정 완료!"
echo ""
echo "📋 적용된 수정사항:"
echo "1. ✓ 헤드 클로즈업 영역 전체 삭제"
echo "2. ✓ 상세보기 버튼 삭제"
echo "3. ✓ 비거리 박스를 버튼 위로 이동"
echo "4. ✓ 상세 스펙 정보 추가 (페이스 두께, 반발계수, 헤드 체적, 샤프트)"
echo "5. ✓ 마일드한 애니메이션 효과 추가 (펄스, 글로우, 라인 효과)"