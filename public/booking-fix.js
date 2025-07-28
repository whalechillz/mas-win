// 예약 폼 수정 스크립트
// funnel-2025-07-complete.html의 예약 처리를 API 경로로 변경

(function() {
    // 페이지 로드 완료 후 실행
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBookingFix);
    } else {
        initBookingFix();
    }

    function initBookingFix() {
        const bookingForm = document.getElementById('bookingForm');
        if (!bookingForm) {
            console.log('예약 폼을 찾을 수 없습니다.');
            return;
        }

        // 기존 이벤트 리스너 제거
        const newForm = bookingForm.cloneNode(true);
        bookingForm.parentNode.replaceChild(newForm, bookingForm);

        // 새로운 이벤트 리스너 추가
        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // 버튼 상태 변경
            const submitButton = e.target.querySelector('button[type="submit"]');
            const originalText = submitButton.innerHTML;
            submitButton.innerHTML = '<span class="loading"></span> 처리중...';
            submitButton.disabled = true;
            
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);
            
            // 퀴즈 데이터 가져오기 (전역 변수에서)
            const quizDataToSend = window.quizData || {};
            
            try {
                // API 엔드포인트로 전송
                const response = await fetch('/api/booking', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: data.name,
                        phone: data.phone,
                        date: data.date,
                        time: data.time,
                        club: data.club,
                        // 퀴즈 데이터 추가
                        swing_style: quizDataToSend.styleText || null,
                        priority: quizDataToSend.priorityText || null,
                        current_distance: quizDataToSend.distance || null,
                        recommended_flex: quizDataToSend.recommendedFlex || null,
                        expected_distance: quizDataToSend.expectedDistance || null,
                        campaign_source: 'funnel-2025-07'
                    })
                });
                
                const result = await response.json();
                
                if (response.ok && result.success) {
                    alert('예약이 완료되었습니다. 곧 연락드리겠습니다.');
                    if (window.closeModal) {
                        window.closeModal('bookingModal');
                    }
                    e.target.reset();
                } else {
                    throw new Error(result.error || '예약 처리 중 오류가 발생했습니다.');
                }
            } catch (error) {
                console.error('예약 오류:', error);
                alert('예약 중 오류가 발생했습니다. 전화로 문의해주세요. (080-028-8888)');
            } finally {
                // 버튼 원상 복구
                submitButton.innerHTML = originalText;
                submitButton.disabled = false;
            }
        });

        console.log('예약 폼 수정 완료');
    }

    // 문의 폼도 동일하게 수정
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        const newContactForm = contactForm.cloneNode(true);
        contactForm.parentNode.replaceChild(newContactForm, contactForm);
        
        newContactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitButton = e.target.querySelector('button[type="submit"]');
            const originalText = submitButton.innerHTML;
            submitButton.innerHTML = '<span class="loading"></span> 처리중...';
            submitButton.disabled = true;
            
            const formData = new FormData(e.target);
            const callTimes = formData.getAll('callTime');
            
            const data = {
                name: formData.get('name'),
                phone: formData.get('phone'),
                call_times: callTimes.join(', ')
            };
            
            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ...data,
                        // 퀴즈 데이터 추가
                        swing_style: window.quizData?.styleText || null,
                        priority: window.quizData?.priorityText || null,
                        current_distance: window.quizData?.distance || null,
                        recommended_flex: window.quizData?.recommendedFlex || null,
                        campaign_source: 'funnel-2025-07'
                    })
                });
                
                const result = await response.json();
                
                if (response.ok && result.success) {
                    alert('문의가 접수되었습니다. 선택하신 시간대에 연락드리겠습니다.');
                    if (window.closeModal) {
                        window.closeModal('contactModal');
                    }
                    e.target.reset();
                } else {
                    throw new Error(result.error || '문의 처리 중 오류가 발생했습니다.');
                }
            } catch (error) {
                console.error('문의 오류:', error);
                alert('문의 접수 중 오류가 발생했습니다. 전화로 문의해주세요. (080-028-8888)');
            } finally {
                submitButton.innerHTML = originalText;
                submitButton.disabled = false;
            }
        });
    }
})();
