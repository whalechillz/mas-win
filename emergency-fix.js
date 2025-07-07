// 긴급 수정된 버전 - 퀴즈 데이터 오류 해결
// bookings와 contacts 테이블에 퀴즈 컬럼이 없어서 발생하는 오류를 수정합니다.

// bookingForm 제출 처리 (수정됨)
document.getElementById('bookingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<span class="loading"></span> 처리중...';
    submitButton.disabled = true;
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
        if (supabase) {
            // 1. 기본 예약 정보만 저장 (퀴즈 데이터 제외)
            const { data: bookingResult, error: bookingError } = await supabase
                .from('bookings')
                .insert([{
                    name: data.name,
                    phone: data.phone,
                    date: data.date,
                    time: data.time,
                    club: data.club
                }])
                .select();
            
            if (bookingError) throw bookingError;
            
            // 2. 퀴즈 결과는 quiz_results 테이블에 별도 저장
            if (quizData.distance > 0) {
                const { error: quizError } = await supabase
                    .from('quiz_results')
                    .insert([{
                        style: quizData.style,
                        priority: quizData.priority,
                        current_distance: quizData.distance,
                        recommended_prod: quizData.recommendedFlex,
                        ip_address: bookingResult[0].id.toString(),
                        user_agent: 'booking'
                    }]);
                
                if (quizError) console.error('퀴즈 결과 저장 오류:', quizError);
            }
            
            // Slack 알림 전송 (퀴즈 데이터 포함)
            try {
                const slackResponse = await fetch('/api/slack/notify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'booking',
                        data: {
                            name: data.name,
                            phone: data.phone,
                            date: data.date,
                            time: data.time,
                            club: data.club,
                            swing_style: quizData.styleText || null,
                            priority: quizData.priorityText || null,
                            current_distance: quizData.distance || null,
                            recommended_flex: quizData.recommendedFlex || null,
                            expected_distance: quizData.expectedDistance || null
                        }
                    })
                });
                
                if (!slackResponse.ok) {
                    console.error('Slack 알림 실패:', await slackResponse.text());
                }
            } catch (slackError) {
                console.error('Slack 알림 에러:', slackError);
            }
        }
        
        alert('예약이 완료되었습니다. 곧 연락드리겠습니다.');
        closeModal('bookingModal');
        e.target.reset();
    } catch (error) {
        console.error('Error:', error);
        alert('예약 중 오류가 발생했습니다. 전화로 문의해주세요.');
    } finally {
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
});

// contactForm 제출 처리 (수정됨)
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
        if (supabase) {
            // 1. 기본 문의 정보만 저장 (퀴즈 데이터 제외)
            const { data: contactResult, error } = await supabase
                .from('contacts')
                .insert([{
                    name: data.name,
                    phone: data.phone,
                    call_times: data.call_times
                }])
                .select();
            
            if (error) throw error;
            
            // 2. 퀴즈 결과는 quiz_results 테이블에 별도 저장
            if (quizData.distance > 0) {
                const { error: quizError } = await supabase
                    .from('quiz_results')
                    .insert([{
                        style: quizData.style,
                        priority: quizData.priority,
                        current_distance: quizData.distance,
                        recommended_prod: quizData.recommendedFlex,
                        ip_address: contactResult[0].id.toString(),
                        user_agent: 'contact'
                    }]);
                
                if (quizError) console.error('퀴즈 결과 저장 오류:', quizError);
            }
            
            // Slack 알림 전송 (퀴즈 데이터 포함)
            try {
                const slackResponse = await fetch('/api/slack/notify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'contact',
                        data: {
                            name: data.name,
                            phone: data.phone,
                            call_times: data.call_times,
                            swing_style: quizData.styleText || null,
                            priority: quizData.priorityText || null,
                            current_distance: quizData.distance || null,
                            recommended_flex: quizData.recommendedFlex || null,
                            expected_distance: quizData.expectedDistance || null
                        }
                    })
                });
                
                if (!slackResponse.ok) {
                    console.error('Slack 알림 실패:', await slackResponse.text());
                }
            } catch (slackError) {
                console.error('Slack 알림 에러:', slackError);
            }
        }
        
        alert('문의가 접수되었습니다. 선택하신 시간대에 연락드리겠습니다.');
        closeModal('contactModal');
        e.target.reset();
    } catch (error) {
        console.error('Error:', error);
        alert('문의 접수 중 오류가 발생했습니다. 전화로 문의해주세요.');
    } finally {
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
});