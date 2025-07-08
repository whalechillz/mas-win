#!/bin/bash

echo "=== win.masgolf.co.kr Admin Dashboard 수정 스크립트 ==="
echo "1. 검색 아이콘 문제 수정"
echo "2. 문의하기 스윙스타일 저장 기능 추가"
echo "3. 데이터베이스 스키마 업데이트"

# 1. 데이터베이스에 contacts 테이블 퀴즈 필드 추가
echo ""
echo "📊 데이터베이스 업데이트 중..."
echo "다음 SQL을 실행하세요:"
echo ""
cat << 'EOF'
-- contacts 테이블에 퀴즈 결과 필드 추가
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS swing_style VARCHAR(50),
ADD COLUMN IF NOT EXISTS priority VARCHAR(100),
ADD COLUMN IF NOT EXISTS current_distance VARCHAR(50);

-- 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_contacts_swing_style ON contacts(swing_style);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at);
EOF

echo ""
echo "✅ 수정 완료!"
echo ""
echo "=== 수정 내용 요약 ==="
echo ""
echo "1. ContactManagement.tsx:"
echo "   - MessageSquare 아이콘을 Search 아이콘으로 변경"
echo "   - 검색 아이콘 위치 스타일 수정 (top-1/2 transform -translate-y-1/2)"
echo "   - 스윙스타일 필드 표시 및 상세보기 기능 추가"
echo ""
echo "2. contact-v2.js API:"
echo "   - contacts 테이블에 swing_style, priority, current_distance 저장"
echo "   - 문의 시 퀴즈 정보도 함께 저장되도록 수정"
echo ""
echo "3. 데이터베이스:"
echo "   - contacts 테이블에 퀴즈 관련 필드 추가"
echo ""
echo "=== 추가 작업 필요 ==="
echo ""
echo "1. Supabase 대시보드에서 위 SQL 실행"
echo "2. Next.js 개발 서버 재시작: npm run dev"
echo "3. 브라우저 캐시 새로고침 (Ctrl+Shift+R)"
echo ""
echo "완료!"
