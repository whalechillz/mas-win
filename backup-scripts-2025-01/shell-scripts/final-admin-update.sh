#!/bin/bash

echo "🔧 관리자 페이지 퀴즈 데이터 표시 기능 추가..."

# 백업 생성
BACKUP_FILE="pages/admin-backup-$(date +%Y%m%d_%H%M%S).tsx"
cp pages/admin.tsx "$BACKUP_FILE"
echo "✅ 백업 생성: $BACKUP_FILE"

# Python 스크립트 실행
if [ -f "update_admin_safe.py" ]; then
    python3 update_admin_safe.py
    
    # 성공 여부 확인
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ 수정 완료!"
        echo ""
        echo "📌 확인사항:"
        echo "1. Next.js 서버 재시작 (Ctrl+C 후 npm run dev)"
        echo "2. 관리자 페이지 접속: http://localhost:3000/admin"
        echo "3. 예약/문의 테이블에서 다음 컬럼 확인:"
        echo "   - 스윙타입 (안정형/파워형/복합형)"
        echo "   - 현재거리 (180m 등)"
        echo ""
        echo "💡 퀴즈를 완료한 고객만 데이터가 표시됩니다"
    else
        echo "❌ 수정 실패. 백업 파일로 복원하세요:"
        echo "cp $BACKUP_FILE pages/admin.tsx"
    fi
    
    # 임시 파일 삭제
    rm -f update_admin_safe.py
else
    echo "❌ 업데이트 스크립트를 찾을 수 없습니다"
fi