// Supabase 설정
// 로컬 스토리지 전용 모드로 임시 설정

const SUPABASE_CONFIG = {
    // Supabase를 사용하지 않고 로컬 스토리지만 사용하려면
    // url과 anonKey를 null로 설정하세요
    url: null,
    anonKey: null
    
    // 실제 Supabase 사용 시 아래와 같이 설정:
    // url: 'https://YOUR_PROJECT_REF.supabase.co',
    // anonKey: 'YOUR_ANON_KEY'
};

// 로컬 스토리지 모드 플래그
const USE_LOCAL_STORAGE_ONLY = !SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey;