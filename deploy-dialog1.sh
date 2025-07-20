#!/bin/bash
# Git 커밋 및 Vercel 배포 스크립트

echo "🚀 대화창1 작업 배포 시작"
echo ""

# 1. Git 상태 확인
echo "📊 Git 상태 확인..."
git status --short

echo ""
echo "🔍 추가된 파일 확인:"
git status --porcelain | grep "^??" | cut -c4-

# 2. Git 추가 및 커밋
echo ""
echo "📝 변경사항을 커밋하시겠습니까? (y/n)"
read -r response

if [[ "$response" == "y" || "$response" == "Y" ]]; then
    # 새 파일 추가
    git add database/integrated-marketing-schema.sql
    git add pages/api/integrated/
    git add DIALOG1_COMPLETION_CHECKLIST.md
    git add setup-integrated-marketing-schema.sh
    git add complete-dialog1.sh
    git add deploy-dialog1-check.sh
    git add database/drop-and-create-integrated-schema.sql
    
    # 수정된 파일 추가
    git add .env.local
    
    # 커밋
    echo ""
    echo "💬 커밋 메시지를 입력하세요 (기본값: '통합 마케팅 시스템 대화창1 작업 완료'):"
    read -r commit_message
    
    if [ -z "$commit_message" ]; then
        commit_message="통합 마케팅 시스템 대화창1 작업 완료

- 데이터베이스 테이블 4개 추가 (monthly_funnel_plans, funnel_pages, generated_contents, monthly_kpis)
- API 엔드포인트 6개 구현 (v2 버전)
- 통합 마케팅 대시보드 뷰 추가
- 환경변수 정리"
    fi
    
    git commit -m "$commit_message"
    
    # 3. Push
    echo ""
    echo "🚀 GitHub에 Push하시겠습니까? (y/n)"
    read -r push_response
    
    if [[ "$push_response" == "y" || "$push_response" == "Y" ]]; then
        git push
        echo "✅ GitHub Push 완료!"
    fi
else
    echo "⏭️ 커밋을 건너뛰었습니다."
fi

# 4. Vercel 배포 상태 확인
echo ""
echo "🔄 Vercel 자동 배포가 시작됩니다."
echo "📌 Vercel 대시보드에서 배포 상태를 확인하세요:"
echo "   https://vercel.com/dashboard"
echo ""
echo "✅ 배포 후 확인사항:"
echo "  1. 기존 페이지들이 정상 작동하는지"
echo "  2. 어드민 로그인이 되는지"
echo "  3. 기존 마케팅 대시보드가 정상인지"
echo "  4. 통합 마케팅 관리 탭이 보이는지 (아직 미구현)"
