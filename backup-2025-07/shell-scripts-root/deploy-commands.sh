#!/bin/bash

# Git 및 Vercel 배포 스크립트

echo "🚀 MASGOLF 프로젝트 배포 시작..."

# 1. Git 상태 확인
echo "📊 Git 상태 확인..."
git status

# 2. 새로운 파일들 추가
echo "➕ 새 파일들 추가..."
git add public/js/database-handler.js
git add public/js/form-handler.js
git add public/debug-test.html
git add public/DEPLOYMENT_GUIDE.md
git add config.js

# 3. 커밋
echo "💾 변경사항 커밋..."
git commit -m "feat: 데이터베이스 연결 및 에러 핸들링 개선

- DatabaseHandler 모듈 추가: 중앙화된 DB 연결 및 에러 처리
- FormHandler 스크립트 추가: 안전한 폼 제출 처리
- 디버그 테스트 페이지 추가: 문제 진단 도구
- 로컬 스토리지 폴백 기능 추가
- 배포 가이드 문서 추가"

# 4. 푸시
echo "📤 원격 저장소에 푸시..."
git push origin main

# 5. Vercel 배포 상태 확인
echo "🔄 Vercel 자동 배포 진행 중..."
echo "Vercel 대시보드에서 배포 상태를 확인하세요:"
echo "https://vercel.com/dashboard"

echo "✅ 배포 명령 완료!"
echo ""
echo "다음 단계:"
echo "1. Vercel 대시보드에서 배포 완료 확인"
echo "2. https://win.masgolf.co.kr/debug-test.html 접속하여 테스트"
echo "3. 환경 변수 설정 확인 (필요시)"
