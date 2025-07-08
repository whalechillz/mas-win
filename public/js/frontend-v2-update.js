// 프론트엔드 API 업데이트 스크립트
// funnel-2025-07-complete.html에 적용할 변경사항

// 1. 퀴즈 완료 시 quiz_result_id 저장
window.quizResultId = null;

// 기존 showResult 함수를 수정하여 퀴즈 결과 저장 API 호출 추가
const originalShowResult = window.showResult;
window.showResult = async function(style) {
    // 기존 showResult 함수 실행
    if (originalShowResult) {
        originalShowResult(style);
    }
    
    // 퀴즈 결과 API로 전송
    try {
        const response = await fetch('/api/quiz-result-v2', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: '', // 아직 이름은 모름
                phone: '', // 아직 전화번호도 모름
                swing_style: quizData.styleText,
                priority: quizData.priorityText,
                current_distance: quizData.distance.toString(),
                recommended_flex: quizData.recommendedFlex,
                expected_distance: quizData.expectedDistance,
                recommended_club: quizData.recommendedProduct,
                campaign_source: 'funnel-2025-07'
            })
        });
        
        const result = await response.json();
        if (result.success && result.quiz_result_id) {
            window.quizResultId = result.quiz_result_id;
            sessionStorage.setItem('quiz_result_id', result.quiz_result_id);
        }
    } catch (error) {
        console.error('퀴즈 결과 저장 실패:', error);
    }
};

// 2. 예약 폼 제출 시 수정
document.getElementById('bookingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<span class="loading"></span> 처리중...';
    submitButton.disabled = true;
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
        // 개선된 API 호출
        const response = await fetch('/api/booking-v2', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                quiz_result_id: window.quizResultId || sessionStorage.getItem('quiz_result_id'),
                name: data.name,
                phone: data.phone,
                date: data.date,
                time: data.time,
                club: data.club,
                // 폴백용 퀴즈 데이터
                swing_style: quizData.styleText,
                priority: quizData.priorityText,
                current_distance: quizData.distance,
                recommended_flex: quizData.recommendedFlex,
                expected_distance: quizData.expectedDistance,
                campaign_source: 'funnel-2025-07'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // 퀴즈 결과가 없었다면 이제 업데이트
            if (!window.quizResultId && result.quiz_result_id) {
                await updateQuizResultWithName(result.quiz_result_id, data.name, data.phone);
            }
            
            alert('예약이 완료되었습니다. 곧 연락드리겠습니다.');
            closeModal('bookingModal');
            e.target.reset();
            
            // GA/픽셀 이벤트
            if (typeof gtag !== 'undefined') {
                gtag('event', 'booking_complete', {
                    quiz_result_id: result.quiz_result_id,
                    booking_id: result.booking_id,
                    club: data.club
                });
            }
        } else {
            throw new Error(result.error || '예약 실패');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('예약 중 오류가 발생했습니다. 전화로 문의해주세요.');
    } finally {
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
});

// 3. 퀴즈 결과 이름/전화번호 업데이트 함수
async function updateQuizResultWithName(quizResultId, name, phone) {
    try {
        await fetch('/api/quiz-result-v2', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name,
                phone: phone,
                swing_style: quizData.styleText,
                priority: quizData.priorityText,
                current_distance: quizData.distance.toString(),
                recommended_flex: quizData.recommendedFlex,
                expected_distance: quizData.expectedDistance,
                campaign_source: 'funnel-2025-07'
            })
        });
    } catch (error) {
        console.error('퀴즈 결과 업데이트 실패:', error);
    }
}

// 4. 문의 폼도 동일하게 수정
document.getElementById('contactForm').addEventListener('submit', async (e) => {
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
        const response = await fetch('/api/contact-v2', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                quiz_result_id: window.quizResultId || sessionStorage.getItem('quiz_result_id'),
                name: data.name,
                phone: data.phone,
                inquiry_type: '상담요청',
                preferred_contact_time: data.call_times,
                // 폴백용 퀴즈 데이터
                swing_style: quizData.styleText,
                priority: quizData.priorityText,
                current_distance: quizData.distance,
                campaign_source: 'funnel-2025-07'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // 퀴즈 결과가 없었다면 이제 업데이트
            if (!window.quizResultId && result.quiz_result_id) {
                await updateQuizResultWithName(result.quiz_result_id, data.name, data.phone);
            }
            
            alert('문의가 접수되었습니다. 선택하신 시간대에 연락드리겠습니다.');
            closeModal('contactModal');
            e.target.reset();
        } else {
            throw new Error(result.error || '문의 실패');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('문의 접수 중 오류가 발생했습니다. 전화로 문의해주세요.');
    } finally {
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
});
