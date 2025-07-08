#!/bin/bash

echo "📝 더 자세히 보기 기능 추가 중..."

# 백업 생성
cp public/versions/funnel-2025-07-complete.html public/versions/funnel-2025-07-complete.html.backup-detail-$(date +%Y%m%d-%H%M%S)

# Python 스크립트로 더 자세히 보기 기능 추가
cat > add_detail_view.py << 'EOF'
#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re

# 파일 읽기
with open('public/versions/funnel-2025-07-complete.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 전체 제품 데이터 업데이트 - 추가 스펙 정보 포함
products_data = """
        const products = {
            'stability-distance': { 
                name: '시크리트포스 PRO 3', 
                desc: '안정적인 비거리 향상',
                spec: '2.3mm 고반발 헤드',
                feature: '완벽한 티샷을 위한 업그레이드된 반발력',
                hookingDesc: '검도 27년차 고객님이 227m 달성! 당신의 안정적인 스윙에 25m를 더합니다.',
                link: 'https://www.mas9golf.com/secret-force-pro-3',
                image: '/assets/campaigns/2025-07/secret-force-pro3.jpg',
                // 기본 스펙
                faceThickness: '2.3mm',
                cor: '0.87',
                headVolume: '460cc',
                shaft: 'NGS 전용',
                loftAngle: '9°/10°',
                lieAngle: '59°',
                weight: '285-296g',
                kickPoint: 'Mid Low',
                // 추가 상세 스펙
                balance: 'D1/C9',
                shaftFreq: '202-212 cpm',
                ballSpeed: '48-50 m/s',
                grip: '45/35',
                length: '45.75"',
                shaftFlex: 'R1/R2 (스페셜 오더)',
                material: '일본산 티타늄'
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
                headVolume: '460cc',
                shaft: 'NGS 저중심',
                loftAngle: '10°',
                lieAngle: '59.5°',
                weight: '268-296g',
                kickPoint: 'Mid Low/Low',
                // 추가 상세 스펙
                balance: 'D2/D0',
                shaftFreq: '202-240 cpm',
                ballSpeed: '48-62 m/s',
                grip: '35/45',
                length: '45.75"',
                shaftFlex: 'R2/S (스페셜 오더)',
                material: '프리미엄 티타늄'
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
                shaft: 'NGS V3 전용',
                loftAngle: '9°/10°',
                lieAngle: '59°',
                weight: '285-296g',
                kickPoint: 'Mid Low',
                // 추가 상세 스펙
                balance: 'D1/C9',
                shaftFreq: '202-212 cpm',
                ballSpeed: '48-50 m/s',
                grip: '45/35',
                length: '45.75"',
                shaftFlex: 'R1/R2 (스페셜 오더)',
                material: 'JFE 티타늄'
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
                shaft: 'NGS 전용',
                loftAngle: '9°/10°',
                lieAngle: '59°',
                weight: '285-296g',
                kickPoint: 'Mid Low',
                balance: 'D1/C9',
                shaftFreq: '202-212 cpm',
                ballSpeed: '48-50 m/s',
                grip: '45/35',
                length: '45.75"',
                shaftFlex: 'R1/R2 (스페셜 오더)',
                material: '일본산 티타늄'
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
                headVolume: '460cc',
                shaft: 'NGS 저중심',
                loftAngle: '10°',
                lieAngle: '59.5°',
                weight: '268-296g',
                kickPoint: 'Mid Low/Low',
                balance: 'D2/D0',
                shaftFreq: '202-240 cpm',
                ballSpeed: '48-62 m/s',
                grip: '35/45',
                length: '45.75"',
                shaftFlex: 'R2/S (스페셜 오더)',
                material: '프리미엄 티타늄'
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
                shaft: 'NGS V3 전용',
                loftAngle: '9°/10°',
                lieAngle: '59°',
                weight: '285-296g',
                kickPoint: 'Mid Low',
                balance: 'D1/C9',
                shaftFreq: '202-212 cpm',
                ballSpeed: '48-50 m/s',
                grip: '45/35',
                length: '45.75"',
                shaftFlex: 'R1/R2 (스페셜 오더)',
                material: 'JFE 티타늄'
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
                shaft: 'NGS 전용',
                loftAngle: '9°/10°',
                lieAngle: '59°',
                weight: '285-296g',
                kickPoint: 'Mid Low',
                balance: 'D1/C9',
                shaftFreq: '202-212 cpm',
                ballSpeed: '48-50 m/s',
                grip: '45/35',
                length: '45.75"',
                shaftFlex: 'R1/R2 (스페셜 오더)',
                material: '일본산 티타늄'
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
                headVolume: '460cc',
                shaft: 'NGS 저중심',
                loftAngle: '10°',
                lieAngle: '59.5°',
                weight: '268-296g',
                kickPoint: 'Mid Low/Low',
                balance: 'D2/D0',
                shaftFreq: '202-240 cpm',
                ballSpeed: '48-62 m/s',
                grip: '35/45',
                length: '45.75"',
                shaftFlex: 'R2/S (스페셜 오더)',
                material: '프리미엄 티타늄'
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
                shaft: 'NGS V3 전용',
                loftAngle: '9°/10°',
                lieAngle: '59°',
                weight: '285-296g',
                kickPoint: 'Mid Low',
                balance: 'D1/C9',
                shaftFreq: '202-212 cpm',
                ballSpeed: '48-50 m/s',
                grip: '45/35',
                length: '45.75"',
                shaftFlex: 'R1/R2 (스페셜 오더)',
                material: 'JFE 티타늄'
            }
        };"""

# products 객체 교체
content = re.sub(r'const products = \{[\s\S]*?\};', products_data, content, count=1)

# resultHTML 수정 - 더 자세히 보기 기능 추가
result_html = """const resultHTML = `
    <div class="grid md:grid-cols-2 gap-8 items-center">
        <div>
            <img src="${product.image}" alt="${product.name}" class="w-full rounded-xl shadow-2xl">
        </div>
        <div>
            <h4 class="text-3xl font-bold text-red-500 mb-2">${product.name}</h4>
            <p class="text-xl text-gray-300 mb-4">${product.desc}</p>
            
            <div class="bg-gray-800 rounded-lg p-4 mb-4">
                <p class="text-white font-bold mb-2"><i class="fas fa-cog text-red-500 mr-2"></i>${product.spec}</p>
                <p class="text-gray-400">${product.feature}</p>
            </div>
            
            <!-- 상세 스펙 -->
            <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-4 mb-4 border border-gray-700">
                <p class="text-yellow-300 font-bold mb-3"><i class="fas fa-chart-bar mr-2"></i>상세 스펙</p>
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div class="text-gray-400">페이스 두께:</div>
                    <div class="text-white font-bold">${product.faceThickness || '2.3mm'}</div>
                    <div class="text-gray-400">반발계수:</div>
                    <div class="text-white font-bold">${product.cor || '0.87'}</div>
                    <div class="text-gray-400">헤드 체적:</div>
                    <div class="text-white font-bold">${product.headVolume || '460cc'}</div>
                    <div class="text-gray-400">샤프트:</div>
                    <div class="text-white font-bold">${product.shaft || 'NGS'}</div>
                    <div class="text-gray-400">로프트 각도:</div>
                    <div class="text-white font-bold">${product.loftAngle || '9°/10°'}</div>
                    <div class="text-gray-400">라이 각도:</div>
                    <div class="text-white font-bold">${product.lieAngle || '59°'}</div>
                    <div class="text-gray-400">중량:</div>
                    <div class="text-white font-bold">${product.weight || '290-300g'}</div>
                    <div class="text-gray-400">킥 포인트:</div>
                    <div class="text-white font-bold">${product.kickPoint || 'Low'}</div>
                </div>
                
                <!-- 더 자세히 보기 -->
                <div id="moreSpecs" class="hidden mt-4 pt-4 border-t border-gray-700">
                    <div class="grid grid-cols-2 gap-2 text-sm">
                        <div class="text-gray-400">가변형 밸런스:</div>
                        <div class="text-white font-bold">${product.balance || 'D0'}</div>
                        <div class="text-gray-400">샤프트 진동수:</div>
                        <div class="text-white font-bold">${product.shaftFreq || '220 cpm'}</div>
                        <div class="text-gray-400">맞춤 볼스피드:</div>
                        <div class="text-white font-bold">${product.ballSpeed || '54 m/s'}</div>
                        <div class="text-gray-400">탄성 그립:</div>
                        <div class="text-white font-bold">${product.grip || '45'}</div>
                        <div class="text-gray-400">최적의 길이:</div>
                        <div class="text-white font-bold">${product.length || '45.75"'}</div>
                        <div class="text-gray-400">샤프트 플렉스:</div>
                        <div class="text-white font-bold">${product.shaftFlex || 'R/SR/S'}</div>
                        <div class="text-gray-400">소재:</div>
                        <div class="text-white font-bold">${product.material || '티타늄'}</div>
                    </div>
                </div>
                
                <button onclick="toggleMoreSpecs()" class="mt-4 text-yellow-300 hover:text-yellow-200 transition text-sm font-medium">
                    <span id="moreSpecsText">
                        <i class="fas fa-chevron-down mr-1"></i>더 자세히 보기
                    </span>
                </button>
            </div>
            
            <!-- 특별한 이유 -->
            <div class="bg-gradient-to-br from-red-900/30 to-black/30 rounded-lg p-4 border border-red-800">
                <p class="text-yellow-300 font-bold mb-2"><i class="fas fa-star mr-2"></i>특별한 이유</p>
                <p class="text-gray-300 text-sm">${product.hookingDesc || '30년의 기술력과 특허받은 고반발 기술이 만나 당신의 스윙을 완성합니다.'}</p>
            </div>
        </div>
    </div>
    
    <!-- 비거리 예상 박스 -->
    <div class="bg-red-900/20 rounded-xl p-6 mt-8 text-center">
        <p class="text-gray-400 mb-2 text-lg">현재 비거리: <span class="text-white font-bold text-2xl">${quizData.distance}m</span></p>
        <p class="text-gray-400 text-lg">예상 비거리: <span class="text-red-500 font-bold text-3xl" id="expectedDistance">${quizData.distance}m</span></p>
    </div>
`;"""

content = re.sub(r'const resultHTML = `[\s\S]*?`;', result_html, content, count=1)

# toggleMoreSpecs 함수 추가
toggle_function = """
        // 더 자세히 보기 토글
        function toggleMoreSpecs() {
            const moreSpecs = document.getElementById('moreSpecs');
            const moreSpecsText = document.getElementById('moreSpecsText');
            
            if (moreSpecs.classList.contains('hidden')) {
                moreSpecs.classList.remove('hidden');
                moreSpecsText.innerHTML = '<i class="fas fa-chevron-up mr-1"></i>간단히 보기';
            } else {
                moreSpecs.classList.add('hidden');
                moreSpecsText.innerHTML = '<i class="fas fa-chevron-down mr-1"></i>더 자세히 보기';
            }
        }
        
        // 퀴즈 로직"""

# 퀴즈 로직 앞에 함수 추가
content = re.sub(r'// 퀴즈 로직', toggle_function + '\n        // 퀴즈 로직', content)

# 파일 저장
with open('public/versions/funnel-2025-07-complete.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ 더 자세히 보기 기능이 추가되었습니다!")
EOF

# Python 스크립트 실행
python3 add_detail_view.py

# 임시 파일 삭제
rm add_detail_view.py

echo ""
echo "✅ 더 자세히 보기 기능 추가 완료!"