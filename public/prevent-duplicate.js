// 중복 제출 방지를 위한 글로벌 플래그
window.formSubmitting = {
    booking: false,
    contact: false
};

// 디바운스 함수
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 중복 제출 방지 래퍼
function preventDuplicateSubmit(formType, submitFunction) {
    return async function(e) {
        e.preventDefault();
        
        // 이미 제출 중이면 무시
        if (window.formSubmitting[formType]) {
            console.log(`${formType} 폼이 이미 제출 중입니다.`);
            return;
        }
        
        // 제출 시작
        window.formSubmitting[formType] = true;
        
        try {
            await submitFunction(e);
        } finally {
            // 제출 완료 후 3초 대기 (재제출 방지)
            setTimeout(() => {
                window.formSubmitting[formType] = false;
            }, 3000);
        }
    };
}
