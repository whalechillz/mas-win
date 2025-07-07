// 모바일 터치 이벤트 중복 방지
(function() {
    // 터치와 클릭 이벤트 중복 방지
    let lastTouchTime = 0;
    
    document.addEventListener('touchstart', function(e) {
        lastTouchTime = Date.now();
    });
    
    document.addEventListener('click', function(e) {
        const currentTime = Date.now();
        const timeDiff = currentTime - lastTouchTime;
        
        // 터치 후 300ms 이내의 클릭은 무시
        if (timeDiff < 300) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }, true);
    
    // 폼 submit 버튼에 대한 추가 보호
    document.addEventListener('DOMContentLoaded', function() {
        const submitButtons = document.querySelectorAll('button[type="submit"], input[type="submit"]');
        
        submitButtons.forEach(button => {
            let isSubmitting = false;
            
            button.addEventListener('click', function(e) {
                if (isSubmitting) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
                
                isSubmitting = true;
                
                // 3초 후 다시 활성화
                setTimeout(() => {
                    isSubmitting = false;
                }, 3000);
            });
        });
    });
    
    // iOS 특정 이슈 해결
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
        document.addEventListener('touchend', function(e) {
            // 더블 탭 방지
            const now = Date.now();
            if (e.target.lastTouchEnd && now - e.target.lastTouchEnd < 300) {
                e.preventDefault();
                return false;
            }
            e.target.lastTouchEnd = now;
        }, false);
    }
})();
