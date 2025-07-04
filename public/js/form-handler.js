// Form Handler with Enhanced Error Handling
// 폼 제출 처리와 에러 핸들링을 담당하는 스크립트

(function() {
    'use strict';
    
    // 디버그 모드
    const DEBUG_MODE = true;
    
    // 로그 함수
    function log(message, data = null) {
        if (DEBUG_MODE) {
            console.log(`[FormHandler] ${message}`, data || '');
        }
    }
    
    // 초기화
    async function initializeFormHandler() {
        log('폼 핸들러 초기화 시작...');
        
        // 1. 데이터베이스 핸들러 확인
        if (typeof window.dbHandler === 'undefined') {
            log('DatabaseHandler를 찾을 수 없습니다. 스크립트 로딩 대기...');
            
            // 스크립트 로딩 대기 (최대 5초)
            let attempts = 0;
            const checkHandler = setInterval(async () => {
                attempts++;
                
                if (typeof window.dbHandler !== 'undefined') {
                    clearInterval(checkHandler);
                    log('DatabaseHandler 로드 완료!');
                    await setupForms();
                } else if (attempts > 10) {
                    clearInterval(checkHandler);
                    log('DatabaseHandler 로드 실패. 로컬 스토리지 모드로 전환.');
                    setupLocalStorageMode();
                }
            }, 500);
        } else {
            await setupForms();
        }
    }
    
    // 폼 설정
    async function setupForms() {
        log('폼 설정 시작...');
        
        // 데이터베이스 초기화
        const dbInitialized = await window.dbHandler.init();
        
        if (!dbInitialized) {
            log('데이터베이스 초기화 실패. 로컬 스토리지 모드로 전환.');
            setupLocalStorageMode();
            return;
        }
        
        // 시타 예약 폼
        const bookingForm = document.getElementById('bookingForm');
        if (bookingForm) {
            bookingForm.addEventListener('submit', handleBookingSubmit);
            log('시타 예약 폼 핸들러 등록 완료');
        }
        
        // 문의 폼
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', handleContactSubmit);
            log('문의 폼 핸들러 등록 완료');
        }
    }
    
    // 로컬 스토리지 모드 설정
    function setupLocalStorageMode() {
        log('로컬 스토리지 모드 활성화');
        
        // 시타 예약 폼
        const bookingForm = document.getElementById('bookingForm');
        if (bookingForm) {
            bookingForm.addEventListener('submit', handleBookingLocalStorage);
        }
        
        // 문의 폼
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', handleContactLocalStorage);
        }
    }
    
    // 시타 예약 제출 (데이터베이스)
    async function handleBookingSubmit(e) {
        e.preventDefault();
        log('시타 예약 폼 제출');
        
        const formData = new FormData(e.target);
        const bookingData = {
            name: formData.get('name'),
            phone: formData.get('phone'),
            preferredDate: formData.get('preferredDate'),
            preferredTime: formData.get('preferredTime'),
            clubInterest: formData.get('clubInterest')
        };
        
        log('예약 데이터:', bookingData);
        
        // 로딩 표시
        showLoading(e.target);
        
        const result = await window.dbHandler.saveBooking(bookingData);
        
        if (result.success) {
            showSuccess('시타 예약이 완료되었습니다!');
            e.target.reset();
            
            // 성공 페이지로 리다이렉트 (옵션)
            // window.location.href = '/success?type=booking';
        } else {
            // 폴백: 로컬 스토리지에 저장
            const fallbackResult = await window.dbHandler.saveToLocalStorage('booking', bookingData);
            
            if (fallbackResult.success) {
                showWarning('예약이 임시 저장되었습니다. 나중에 서버에 동기화됩니다.');
                e.target.reset();
            } else {
                showError('예약 저장에 실패했습니다. 다시 시도해주세요.');
            }
        }
        
        hideLoading(e.target);
    }
    
    // 문의 제출 (데이터베이스)
    async function handleContactSubmit(e) {
        e.preventDefault();
        log('문의 폼 제출');
        
        const formData = new FormData(e.target);
        const contactData = {
            name: formData.get('name'),
            phone: formData.get('phone'),
            callTime: formData.get('callTime')
        };
        
        log('문의 데이터:', contactData);
        
        // 로딩 표시
        showLoading(e.target);
        
        const result = await window.dbHandler.saveContact(contactData);
        
        if (result.success) {
            showSuccess('문의가 접수되었습니다!');
            e.target.reset();
        } else {
            // 폴백: 로컬 스토리지에 저장
            const fallbackResult = await window.dbHandler.saveToLocalStorage('contact', contactData);
            
            if (fallbackResult.success) {
                showWarning('문의가 임시 저장되었습니다. 나중에 서버에 동기화됩니다.');
                e.target.reset();
            } else {
                showError('문의 저장에 실패했습니다. 다시 시도해주세요.');
            }
        }
        
        hideLoading(e.target);
    }
    
    // 시타 예약 제출 (로컬 스토리지)
    function handleBookingLocalStorage(e) {
        e.preventDefault();
        log('시타 예약 로컬 저장');
        
        const formData = new FormData(e.target);
        const bookingData = {
            id: Date.now(),
            name: formData.get('name'),
            phone: formData.get('phone'),
            preferredDate: formData.get('preferredDate'),
            preferredTime: formData.get('preferredTime'),
            clubInterest: formData.get('clubInterest'),
            timestamp: new Date().toISOString()
        };
        
        try {
            const bookings = JSON.parse(localStorage.getItem('masgolf_bookings') || '[]');
            bookings.push(bookingData);
            localStorage.setItem('masgolf_bookings', JSON.stringify(bookings));
            
            showSuccess('시타 예약이 완료되었습니다!');
            e.target.reset();
        } catch (error) {
            log('로컬 저장 실패:', error);
            showError('예약 저장에 실패했습니다.');
        }
    }
    
    // 문의 제출 (로컬 스토리지)
    function handleContactLocalStorage(e) {
        e.preventDefault();
        log('문의 로컬 저장');
        
        const formData = new FormData(e.target);
        const contactData = {
            id: Date.now(),
            name: formData.get('name'),
            phone: formData.get('phone'),
            callTime: formData.get('callTime'),
            timestamp: new Date().toISOString()
        };
        
        try {
            const contacts = JSON.parse(localStorage.getItem('masgolf_contacts') || '[]');
            contacts.push(contactData);
            localStorage.setItem('masgolf_contacts', JSON.stringify(contacts));
            
            showSuccess('문의가 접수되었습니다!');
            e.target.reset();
        } catch (error) {
            log('로컬 저장 실패:', error);
            showError('문의 저장에 실패했습니다.');
        }
    }
    
    // UI 헬퍼 함수들
    function showLoading(form) {
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>처리 중...';
        }
    }
    
    function hideLoading(form) {
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = submitButton.getAttribute('data-original-text') || '제출';
        }
    }
    
    function showSuccess(message) {
        if (window.showNotification) {
            window.showNotification(message, 'success');
        } else {
            alert(message);
        }
    }
    
    function showError(message) {
        if (window.showNotification) {
            window.showNotification(message, 'error');
        } else {
            alert('오류: ' + message);
        }
    }
    
    function showWarning(message) {
        if (window.showNotification) {
            window.showNotification(message, 'warning');
        } else {
            alert('주의: ' + message);
        }
    }
    
    // 페이지 로드 시 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeFormHandler);
    } else {
        initializeFormHandler();
    }
    
})();