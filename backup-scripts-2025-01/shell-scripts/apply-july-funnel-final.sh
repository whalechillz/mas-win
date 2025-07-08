#!/bin/bash

echo "📝 7월 퍼널 페이지 수정 작업 시작..."

# 현재 파일 백업
cp public/versions/funnel-2025-07-complete.html public/versions/funnel-2025-07-complete.html.backup-$(date +%Y%m%d-%H%M%S)

# Python 스크립트로 수정 (더 안정적인 처리)
cat > modify_july_funnel_final.py << 'EOF'
#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re

# 파일 읽기
with open('public/versions/funnel-2025-07-complete.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 헤드 클로즈업 영역 삭제
# 영상 섹션 전체 제거
content = re.sub(r'<!-- 영상 섹션 -->.*?</section>\s*<!-- 영역2: 퀴즈 섹션 -->', 
                 '<!-- 영역2: 퀴즈 섹션 -->', 
                 content, 
                 flags=re.DOTALL)

# 2. 제품 데이터 업데이트 - 더 상세한 스펙 추가
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
                // 상세 스펙
                faceThickness: '2.3mm',
                cor: '0.87',
                headVolume: '460cc',
                shaft: 'NGS 50/60 전용',
                loftAngle: '9.5°/10.5°',
                lieAngle: '59.5°',
                weight: '310g',
                material: '일본산 DAT55G 티타늄'
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
                shaft: 'NGS 저중심 설계',
                loftAngle: '10.5°/12°',
                lieAngle: '58.5°',
                weight: '305g',
                material: '프리미엄 6-4 티타늄'
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
                loftAngle: '9°/10.5°/12°',
                lieAngle: '60°',
                weight: '315g',
                material: 'JFE 고강도 티타늄'
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
                shaft: 'NGS 50/60 전용',
                loftAngle: '9.5°/10.5°',
                lieAngle: '59.5°',
                weight: '310g',
                material: '일본산 DAT55G 티타늄'
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
                shaft: 'NGS 저중심 설계',
                loftAngle: '10.5°/12°',
                lieAngle: '58.5°',
                weight: '305g',
                material: '프리미엄 6-4 티타늄'
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
                loftAngle: '9°/10.5°/12°',
                lieAngle: '60°',
                weight: '315g',
                material: 'JFE 고강도 티타늄'
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
                shaft: 'NGS 50/60 전용',
                loftAngle: '9.5°/10.5°',
                lieAngle: '59.5°',
                weight: '310g',
                material: '일본산 DAT55G 티타늄'
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
                shaft: 'NGS 저중심 설계',
                loftAngle: '10.5°/12°',
                lieAngle: '58.5°',
                weight: '305g',
                material: '프리미엄 6-4 티타늄'
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
                loftAngle: '9°/10.5°/12°',
                lieAngle: '60°',
                weight: '315g',
                material: 'JFE 고강도 티타늄'
            }
        };"""

# products 객체 교체
content = re.sub(r'const products = \{[^}]*\};', products_data, content, flags=re.DOTALL)

# 3. resultHTML 수정 - 상세보기 버튼 제거, 비거리 박스 하단 이동, 더 많은 스펙 추가
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
            
            <!-- 상세 스펙 - 더 많은 정보 추가 -->
            <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-4 mb-4 border border-gray-700">
                <p class="text-yellow-300 font-bold mb-3"><i class="fas fa-chart-bar mr-2"></i>상세 스펙</p>
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div class="text-gray-400">페이스 두께:</div>
                    <div class="text-white font-bold">${product.faceThickness}</div>
                    <div class="text-gray-400">반발계수:</div>
                    <div class="text-white font-bold">${product.cor}</div>
                    <div class="text-gray-400">헤드 체적:</div>
                    <div class="text-white font-bold">${product.headVolume}</div>
                    <div class="text-gray-400">샤프트:</div>
                    <div class="text-white font-bold">${product.shaft}</div>
                    <div class="text-gray-400">로프트 각도:</div>
                    <div class="text-white font-bold">${product.loftAngle}</div>
                    <div class="text-gray-400">라이 각도:</div>
                    <div class="text-white font-bold">${product.lieAngle}</div>
                    <div class="text-gray-400">중량:</div>
                    <div class="text-white font-bold">${product.weight}</div>
                    <div class="text-gray-400">소재:</div>
                    <div class="text-white font-bold">${product.material}</div>
                </div>
            </div>
            
            <!-- 특별한 이유 -->
            <div class="bg-gradient-to-br from-red-900/30 to-black/30 rounded-lg p-4 border border-red-800">
                <p class="text-yellow-300 font-bold mb-2"><i class="fas fa-star mr-2"></i>특별한 이유</p>
                <p class="text-gray-300 text-sm">${product.hookingDesc || '30년의 기술력과 특허받은 고반발 기술이 만나 당신의 스윙을 완성합니다.'}</p>
            </div>
        </div>
    </div>
    
    <!-- 비거리 예상 박스를 하단으로 이동 -->
    <div class="bg-red-900/20 rounded-xl p-6 mt-8 text-center">
        <p class="text-gray-400 mb-2 text-lg">현재 비거리: <span class="text-white font-bold text-2xl">${quizData.distance}m</span></p>
        <p class="text-gray-400 text-lg">예상 비거리: <span class="text-red-500 font-bold text-3xl" id="expectedDistance">${quizData.distance}m</span></p>
    </div>
`;"""

content = re.sub(r'const resultHTML = `[^`]*`;', result_html, content, flags=re.DOTALL)

# 4. 버튼 HTML에서 상세보기 버튼 제거
buttons_html = """
            const buttonsHTML = `
                <button onclick="showBookingModal('${product.name}')" class="bg-red-600 text-white px-6 py-3 rounded-full font-bold hover:bg-red-700 transition">
                    <i class="fas fa-calendar-check mr-2"></i>시타 예약
                </button>
                <a href="tel:080-028-8888" class="bg-gray-800 text-white px-6 py-3 rounded-full font-bold hover:bg-gray-700 transition">
                    <i class="fas fa-phone mr-2"></i>전화 상담
                </a>
                <button onclick="showContactModal()" class="bg-gray-800 text-white px-6 py-3 rounded-full font-bold hover:bg-gray-700 transition">
                    <i class="fas fa-comment mr-2"></i>문의하기
                </button>
            `;"""

content = re.sub(r'const buttonsHTML = `[^`]*`;', buttons_html, content, flags=re.DOTALL)

# 5. 애니메이션 스타일 추가
animation_styles = """
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
    </style>"""

# </style> 태그 앞에 추가
content = content.replace('    </style>', animation_styles + '\n    </style>')

# 파일 저장
with open('public/versions/funnel-2025-07-complete.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ 모든 수정사항이 적용되었습니다!")
EOF

# Python 스크립트 실행
python3 modify_july_funnel_final.py

# 임시 파일 삭제
rm modify_july_funnel_final.py

echo ""
echo "✅ 7월 퍼널 페이지 수정 완료!"
echo ""
echo "📋 적용된 수정사항:"
echo "1. ✓ 헤드 클로즈업 영역 삭제"
echo "2. ✓ 상세보기 버튼 제거"
echo "3. ✓ 비거리 박스를 버튼 위로 이동"
echo "4. ✓ 더 많은 상세 스펙 추가 (로프트/라이 각도, 중량, 소재)"
echo "5. ✓ 마일드한 애니메이션 효과 유지"