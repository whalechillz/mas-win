// Supabase 설정
// 주의: 이 파일은 절대로 Git에 커밋하지 마세요!
// 실제 값은 Supabase 프로젝트 설정에서 확인하세요

const SUPABASE_CONFIG = {
    url: 'https://YOUR_PROJECT_REF.supabase.co',
    anonKey: 'YOUR_ANON_KEY',
    
    // Slack Webhook (선택사항)
    slackWebhook: 'YOUR_SLACK_WEBHOOK_URL'
};

// 사용 예시:
// 1. Supabase 대시보드에서 프로젝트 설정 > API 클릭
// 2. Project URL 복사 (https://xxx.supabase.co)
// 3. anon public 키 복사
// 4. 위의 YOUR_PROJECT_REF와 YOUR_ANON_KEY를 실제 값으로 교체
