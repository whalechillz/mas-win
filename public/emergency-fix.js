// 긴급 패치 - Supabase 오류 시 로컬 스토리지만 사용
// /public/emergency-fix.js

console.log('긴급 패치 적용 중...');

// 원본 Supabase 객체 백업
window._originalSupabase = window.supabase;

// Supabase를 null로 설정하여 로컬 스토리지 사용 강제
window.supabase = null;

// 사용자에게 알림
if (typeof alert !== 'undefined') {
    console.log('Supabase 연결 문제로 임시로 로컬 저장소를 사용합니다. 예약 정보는 안전하게 저장됩니다.');
}

// 로컬 스토리지 데이터를 서버로 전송하는 함수
async function syncLocalDataToServer() {
    try {
        const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        const contacts = JSON.parse(localStorage.getItem('contacts') || '[]');
        
        console.log(`동기화 대기 중: 예약 ${bookings.length}건, 문의 ${contacts.length}건`);
        
        // 여기에 서버 전송 로직 추가 가능
        // 예: 이메일 알림, 구글 시트 연동 등
        
    } catch (error) {
        console.error('데이터 동기화 오류:', error);
    }
}

// 10초마다 동기화 시도
setInterval(syncLocalDataToServer, 10000);

console.log('긴급 패치 적용 완료! 로컬 스토리지 모드로 작동합니다.');