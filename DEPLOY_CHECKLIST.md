# 배포 전 체크리스트

## 📋 파일 확인
- [x] `/public/js/database-handler.js` - DB 연결 모듈
- [x] `/public/js/form-handler.js` - 폼 처리 스크립트  
- [x] `/public/debug-test.html` - 디버그 테스트 페이지
- [x] `/config.js` - Supabase 설정 파일
- [x] `/public/DEPLOYMENT_GUIDE.md` - 배포 가이드

## 🛠 기능 확인
- [x] 데이터베이스 연결 (Supabase)
- [x] 로컬 스토리지 폴백
- [x] 에러 핸들링 및 로깅
- [x] 디버그 모드
- [x] 사용자 알림 (토스트)

## 🚀 배포 단계
1. Git 커밋 및 푸시
2. Vercel 자동 배포 대기
3. 환경 변수 설정 (필요시)
4. 디버그 페이지로 테스트
5. 실제 페이지 테스트

## 🔗 테스트 URL
- 디버그: https://win.masgolf.co.kr/debug-test.html
- 메인 페이지: https://win.masgolf.co.kr/

## ⚠️ 주의사항
- config.js의 API 키가 실제 값으로 설정되어 있는지 확인
- HTTPS로 접속하는지 확인
- 브라우저 캐시 clear (Ctrl+Shift+R)
