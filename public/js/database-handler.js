// Database Handler Module
// 데이터베이스 연결과 에러 처리를 담당하는 모듈

class DatabaseHandler {
    constructor() {
        this.supabase = null;
        this.isConnected = false;
        this.errorLog = [];
        this.debugMode = true; // 디버깅 모드
    }

    // 초기화
    async init() {
        try {
            this.log('DatabaseHandler 초기화 시작...');
            
            // 1. config.js 로드 확인
            if (typeof SUPABASE_CONFIG === 'undefined') {
                throw new Error('SUPABASE_CONFIG가 정의되지 않았습니다. config.js를 확인하세요.');
            }
            
            // 2. Supabase 라이브러리 확인
            if (typeof window.supabase === 'undefined') {
                throw new Error('Supabase 라이브러리가 로드되지 않았습니다.');
            }
            
            // 3. Supabase 연결
            this.supabase = window.supabase.createClient(
                SUPABASE_CONFIG.url,
                SUPABASE_CONFIG.anonKey
            );
            
            // 4. 연결 테스트
            const { data, error } = await this.supabase
                .from('bookings')
                .select('count')
                .limit(1);
            
            if (error) {
                throw new Error(`Supabase 연결 실패: ${error.message}`);
            }
            
            this.isConnected = true;
            this.log('DatabaseHandler 초기화 완료!', 'success');
            return true;
            
        } catch (error) {
            this.logError('초기화 실패', error);
            return false;
        }
    }

    // 시타 예약 저장
    async saveBooking(bookingData) {
        try {
            this.log('예약 저장 시도:', bookingData);
            
            if (!this.isConnected) {
                throw new Error('데이터베이스가 연결되지 않았습니다.');
            }
            
            const { data, error } = await this.supabase
                .from('bookings')
                .insert([{
                    name: bookingData.name,
                    phone: bookingData.phone,
                    date: bookingData.preferredDate,
                    time: bookingData.preferredTime,
                    club: bookingData.clubInterest
                }])
                .select();
            
            if (error) {
                throw error;
            }
            
            this.log('예약 저장 성공!', 'success', data);
            return { success: true, data };
            
        } catch (error) {
            this.logError('예약 저장 실패', error);
            return { success: false, error: error.message };
        }
    }

    // 문의 저장
    async saveContact(contactData) {
        try {
            this.log('문의 저장 시도:', contactData);
            
            if (!this.isConnected) {
                throw new Error('데이터베이스가 연결되지 않았습니다.');
            }
            
            const { data, error } = await this.supabase
                .from('contacts')
                .insert([{
                    name: contactData.name,
                    phone: contactData.phone,
                    call_time: contactData.callTime
                }])
                .select();
            
            if (error) {
                throw error;
            }
            
            this.log('문의 저장 성공!', 'success', data);
            return { success: true, data };
            
        } catch (error) {
            this.logError('문의 저장 실패', error);
            return { success: false, error: error.message };
        }
    }

    // 로그 기록
    log(message, type = 'info', data = null) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            type,
            message,
            data
        };
        
        this.errorLog.push(logEntry);
        
        if (this.debugMode) {
            const style = type === 'success' ? 'color: green' : 
                         type === 'error' ? 'color: red' : 
                         'color: blue';
            console.log(`%c[DatabaseHandler] ${message}`, style, data || '');
        }
    }

    // 에러 로그
    logError(context, error) {
        this.log(`${context}: ${error.message}`, 'error', error);
        
        // 사용자에게 친화적인 에러 메시지 표시
        if (window.showNotification) {
            window.showNotification(`${context}: ${error.message}`, 'error');
        }
    }

    // 디버그 정보 출력
    getDebugInfo() {
        return {
            isConnected: this.isConnected,
            configLoaded: typeof SUPABASE_CONFIG !== 'undefined',
            supabaseLoaded: typeof window.supabase !== 'undefined',
            errorLog: this.errorLog,
            environment: {
                protocol: window.location.protocol,
                host: window.location.host,
                pathname: window.location.pathname
            }
        };
    }

    // 로컬 스토리지 폴백
    async saveToLocalStorage(type, data) {
        try {
            const key = type === 'booking' ? 'masgolf_bookings' : 'masgolf_contacts';
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            existing.push({
                ...data,
                id: Date.now(),
                timestamp: new Date().toISOString()
            });
            localStorage.setItem(key, JSON.stringify(existing));
            
            this.log(`로컬 스토리지에 ${type} 저장됨`, 'success');
            return { success: true, fallback: true };
        } catch (error) {
            this.logError('로컬 스토리지 저장 실패', error);
            return { success: false, error: error.message };
        }
    }
}

// 전역 인스턴스 생성
window.dbHandler = new DatabaseHandler();

// 알림 함수
window.showNotification = function(message, type = 'info') {
    // 기존 알림 제거
    const existing = document.querySelector('.notification-toast');
    if (existing) existing.remove();
    
    // 새 알림 생성
    const toast = document.createElement('div');
    toast.className = `notification-toast fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        'bg-blue-500 text-white'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // 3초 후 제거
    setTimeout(() => toast.remove(), 3000);
};