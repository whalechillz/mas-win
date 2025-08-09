/**
 * MASGOLF A/B 테스트 컨트롤러
 * 버전: 1.0.0
 * 날짜: 2025-01-13
 * 
 * 사용법:
 * 1. HTML 파일에 이 스크립트를 추가: <script src="ab-test-controller.js"></script>
 * 2. 자동으로 50:50 비율로 버전 분배
 * 3. Google Analytics로 자동 추적
 */

(function() {
    'use strict';
    
    // ========================================
    // 설정 영역
    // ========================================
    const CONFIG = {
        // A/B 테스트 설정
        testName: 'MASGOLF_SENIOR_2025_08',
        cookieName: 'mas_ab_version',
        cookieExpireDays: 30,
        
        // 버전 비율 (합이 100이어야 함)
        versionDistribution: {
            'A': 50,  // 50% - 원본 (골드 CTA)
            'B': 50   // 50% - 변형 (강렬한 레드 CTA)
        },
        
        // Google Analytics 설정
        ga: {
            enabled: true,
            eventCategory: 'AB_Test',
            eventAction: 'Version_Assigned',
            customDimension: 'dimension1' // GA4에서 설정한 커스텀 차원
        },
        
        // 디버그 모드
        debug: true // 콘솔 로그 표시
    };
    
    // ========================================
    // 버전별 변경 사항 정의
    // ========================================
    const VERSION_CHANGES = {
        'A': {
            name: '원본 - 골드 CTA',
            changes: function() {
                // A 버전은 원본 그대로 유지
                log('A 버전 (원본) 적용됨');
            }
        },
        'B': {
            name: '변형 - 강렬한 레드 CTA',
            changes: function() {
                log('B 버전 (변형) 적용 시작');
                
                // 1. CTA 버튼 색상 변경 (골드 → 레드)
                const style = document.createElement('style');
                style.innerHTML = `
                    /* B 버전: 강렬한 레드 CTA */
                    .btn-primary {
                        background: #FF4444 !important;
                        border-color: #FF4444 !important;
                    }
                    .btn-primary:hover {
                        background: #CC0000 !important;
                        border-color: #CC0000 !important;
                        box-shadow: 0 6px 20px rgba(255, 68, 68, 0.3) !important;
                    }
                    
                    /* 플로팅 전화 버튼도 레드로 */
                    .floating-phone {
                        background: #FF4444 !important;
                        box-shadow: 0 4px 20px rgba(255, 68, 68, 0.4) !important;
                    }
                    .floating-phone:hover {
                        background: #CC0000 !important;
                    }
                    
                    /* 전화 버튼 강조 */
                    .btn-phone {
                        background: linear-gradient(135deg, #FF4444 0%, #CC0000 100%) !important;
                        border-color: #990000 !important;
                        animation: pulse 1s infinite !important;
                    }
                    
                    /* 긴급성 메시지 추가 */
                    .btn-primary::after {
                        content: " (오늘까지!)";
                        font-weight: 800;
                        animation: blink 1s infinite;
                    }
                    
                    @keyframes blink {
                        0%, 50%, 100% { opacity: 1; }
                        25%, 75% { opacity: 0.5; }
                    }
                `;
                document.head.appendChild(style);
                
                // 2. 텍스트 변경 (더 긴급한 톤)
                document.querySelectorAll('.btn-primary').forEach(btn => {
                    if (btn.textContent.includes('시타 예약')) {
                        btn.innerHTML = '<i data-feather="alert-circle"></i> 지금 바로 예약하기';
                    }
                });
                
                // 3. 카운트다운 타이머 색상 변경
                const timer = document.getElementById('countdown-timer');
                if (timer) {
                    timer.style.color = '#FF4444';
                    timer.style.fontWeight = '900';
                }
                
                // 4. 상단 프로모션 바 배경색 변경
                const promoBar = document.querySelector('[style*="--navy-dark"]');
                if (promoBar) {
                    promoBar.style.background = 'linear-gradient(90deg, #990000 0%, #FF4444 100%)';
                }
                
                // Feather 아이콘 다시 렌더링
                if (typeof feather !== 'undefined') {
                    feather.replace();
                }
                
                log('B 버전 변경 사항 적용 완료');
            }
        }
    };
    
    // ========================================
    // 유틸리티 함수
    // ========================================
    
    // 디버그 로그
    function log(message, data = null) {
        if (CONFIG.debug) {
            const prefix = `[A/B Test - ${CONFIG.testName}]`;
            if (data) {
                console.log(`${prefix} ${message}`, data);
            } else {
                console.log(`${prefix} ${message}`);
            }
        }
    }
    
    // 쿠키 읽기
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            return parts.pop().split(';').shift();
        }
        return null;
    }
    
    // 쿠키 설정
    function setCookie(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = `expires=${date.toUTCString()}`;
        document.cookie = `${name}=${value};${expires};path=/`;
        log(`쿠키 설정: ${name}=${value} (${days}일간 유효)`);
    }
    
    // URL 파라미터 확인
    function getUrlParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }
    
    // 랜덤 버전 선택 (가중치 적용)
    function selectRandomVersion() {
        const random = Math.random() * 100;
        let accumulator = 0;
        
        for (const [version, weight] of Object.entries