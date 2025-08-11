#!/bin/bash

# 중복 제출 방지 스크립트 적용

echo "슬랙 중복 알림 방지 스크립트 적용 중..."

# HTML 파일 경로
HTML_FILE="/Users/m2/MASLABS/win.masgolf.co.kr/public/versions/funnel-2025-07-complete.html"

# 백업 생성
cp "$HTML_FILE" "$HTML_FILE.backup-duplicate-fix-$(date +%Y%m%d-%H%M%S)"

# prevent-duplicate.js 스크립트 추가
sed -i '' '/<script src="..\/..\/config.js"><\/script>/a\
    <script src="../../prevent-duplicate.js"></script>' "$HTML_FILE"

# 폼 제출 이벤트 리스너 수정 - bookingForm
cat > /tmp/booking-form-fix.txt << 'EOF'
        // 폼 제출 처리 (중복 방지 적용)
        document.getElementById('bookingForm').addEventListener('submit', preventDuplicateSubmit('booking', async (e) => {
            e.preventDefault();
            
            // 버튼 상태 변경
            const submitButton = e.target.querySelector('button[type="submit"]');
            const originalText = submitButton.innerHTML;
            submitButton.innerHTML = '<span class="loading"></span> 처리중...';
            submitButton.disabled = true;
            
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);
            
            // 폰 번호 유효성 검사
            const phoneRegex = /^[0-9]{10,11}$/;
            if (!phoneRegex.test(data.phone.replace(/-/g, ''))) {
                alert('올바른 전화번호를 입력해주세요.');
                submitButton.innerHTML = originalText;
                submitButton.disabled = false;
                return;
            }
            
            try {
                // Supabase에 저장
                if (supabase) {
                    // 1. 기본 예약 정보 저장 (퀴즈 데이터 포함)
                    const { data: bookingResult, error: bookingError } = await supabase
                        .from('bookings')
                        .insert([{
                            name: data.name,
                            phone: data.phone,
                            date: data.date,
                            time: data.time,
                            club: data.club,
                            // 퀴즈 데이터 추가
                            swing_style: quizData.styleText || null,  // 스윙 스타일 (한글)
                            priority: quizData.priorityText || null,  // Q2 답변 저장 (한글)
                            current_distance: quizData.distance || null,
                            recommended_flex: quizData.recommendedFlex || null,
                            expected_distance: quizData.expectedDistance || null
                        }])
                        .select();
                    
                    if (bookingError) throw bookingError;
                    
                    // 2. 퀴즈 결과 별도 저장 (선택사항)
                    if (quizData.distance > 0) {
                        const { error: quizError } = await supabase
                            .from('quiz_results')
                            .insert([{
                                style: quizData.style,
                                priority: quizData.priorityText || quizData.priority || null,
                                current_distance: quizData.distance,
                                recommended_prod: quizData.recommendedFlex,
                                ip_address: bookingResult[0].id.toString(), // booking ID를 참조로 사용
                                user_agent: 'booking'
                            }]);
                        
                        if (quizError) console.error('퀴즈 결과 저장 오류:', quizError);
                    }
                    
                    // Slack 알림을 서버 API를 통해 전송 (한 번만)
                    try {
                        const slackResponse = await fetch('/api/slack/notify', {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'X-Request-Id': Date.now().toString() // 요청 ID 추가
                            },
                            body: JSON.stringify({
                                type: 'booking',
                                data: {
                                    name: data.name,
                                    phone: data.phone,
                                    date: data.date,
                                    time: data.time,
                                    club: data.club,
                                    // 퀴즈 데이터 추가
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
                } else {
                    // Supabase가 설정되지 않은 경우 로컬 스토리지에 저장
                    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
                    bookings.push({
                        ...data,
                        created_at: new Date().toISOString()
                    });
                    localStorage.setItem('bookings', JSON.stringify(bookings));
                    console.log('로컬 스토리지에 저장됨:', bookings);
                }
                
                alert('예약이 완료되었습니다. 곧 연락드리겠습니다.');
                closeModal('bookingModal');
                e.target.reset();
            } catch (error) {
                console.error('Error:', error);
                alert('예약 중 오류가 발생했습니다. 전화로 문의해주세요.');
            } finally {
                // 버튼 원상 복구
                submitButton.innerHTML = originalText;
                submitButton.disabled = false;
            }
        }));
EOF

# contactForm도 동일하게 수정
cat > /tmp/contact-form-fix.txt << 'EOF'
        document.getElementById('contactForm').addEventListener('submit', preventDuplicateSubmit('contact', async (e) => {
            e.preventDefault();
            
            // 버튼 상태 변경
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
            
            // 폰 번호 유효성 검사
            const phoneRegex = /^[0-9]{10,11}$/;
            if (!phoneRegex.test(data.phone.replace(/-/g, ''))) {
                alert('올바른 전화번호를 입력해주세요.');
                submitButton.innerHTML = originalText;
                submitButton.disabled = false;
                return;
            }
            
            try {
                // Supabase에 저장
                if (supabase) {
                    // 1. 기본 문의 정보 저장 (퀴즈 데이터 포함)
                    const { data: contactResult, error } = await supabase
                        .from('contacts')
                        .insert([{
                            name: data.name,
                            phone: data.phone,
                            call_times: data.call_times,
                            // 퀴즈 데이터 추가
                            swing_style: quizData.styleText || null,  // 스윙 스타일 (한글)
                            priority: quizData.priorityText || null,  // Q2 답변 저장 (한글)
                            current_distance: quizData.distance || null,
                            recommended_flex: quizData.recommendedFlex || null
                        }])
                        .select();
                    
                    if (error) throw error;
                    
                    // Slack 알림을 서버 API를 통해 전송 (한 번만)
                    try {
                        const slackResponse = await fetch('/api/slack/notify', {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'X-Request-Id': Date.now().toString() // 요청 ID 추가
                            },
                            body: JSON.stringify({
                                type: 'contact',
                                data: {
                                    name: data.name,
                                    phone: data.phone,
                                    call_times: data.call_times,
                                    // 퀴즈 데이터 추가
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
                } else {
                    // Supabase가 설정되지 않은 경우 로컬 스토리지에 저장
                    const contacts = JSON.parse(localStorage.getItem('contacts') || '[]');
                    contacts.push({
                        ...data,
                        created_at: new Date().toISOString()
                    });
                    localStorage.setItem('contacts', JSON.stringify(contacts));
                    console.log('로컬 스토리지에 저장됨:', contacts);
                }
                
                alert('문의가 접수되었습니다. 선택하신 시간대에 연락드리겠습니다.');
                closeModal('contactModal');
                e.target.reset();
            } catch (error) {
                console.error('Error:', error);
                alert('문의 접수 중 오류가 발생했습니다. 전화로 문의해주세요.');
            } finally {
                // 버튼 원상 복구
                submitButton.innerHTML = originalText;
                submitButton.disabled = false;
            }
        }));
EOF

echo "✅ 중복 제출 방지 스크립트가 적용되었습니다."
echo ""
echo "추가 권장사항:"
echo "1. 서버 측에서도 중복 체크 (예: 동일한 전화번호로 1분 내 재요청 차단)"
echo "2. Slack API에서 중복 메시지 필터링"
echo "3. React StrictMode 비활성화 (프로덕션에서는 자동으로 비활성화됨)"
