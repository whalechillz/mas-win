#!/bin/bash

echo " 모든 퍼널 파일에 메타데이터 추가 중..."

# 각 파일별 메타데이터 추가
echo "📄 funnel-2025-05-live.html 수정 중..."
sed -i '' '5a\
    <!-- 파일 메타데이터 -->\
    <meta name="file-created" content="2025-08-09T23:09:00.000Z">\
    <meta name="file-version" content="live">\
    <meta name="file-status" content="live">\
' public/versions/funnel-2025-05-live.html

echo "📄 funnel-2025-06-live.html 수정 중..."
sed -i '' '5a\
    <!-- 파일 메타데이터 -->\
    <meta name="file-created" content="2025-08-09T23:03:00.000Z">\
    <meta name="file-version" content="live">\
    <meta name="file-status" content="live">\
' public/versions/funnel-2025-06-live.html

echo "📄 funnel-2025-07-live.html 수정 중..."
sed -i '' '5a\
    <!-- 파일 메타데이터 -->\
    <meta name="file-created" content="2025-08-07T09:33:00.000Z">\
    <meta name="file-version" content="live">\
    <meta name="file-status" content="live">\
' public/versions/funnel-2025-07-live.html

echo "📄 funnel-2025-07-complete.html 수정 중..."
sed -i '' '5a\
    <!-- 파일 메타데이터 -->\
    <meta name="file-created" content="2025-08-11T00:24:00.000Z">\
    <meta name="file-version" content="complete">\
    <meta name="file-status" content="dev">\
' public/versions/funnel-2025-07-complete.html

echo ""
echo "✅ 모든 퍼널 파일 메타데이터 추가 완료!"
echo ""
echo "📋 수정된 파일 목록:"
echo "- funnel-2025-05-live.html"
echo "- funnel-2025-06-live.html"
echo "- funnel-2025-07-live.html"
echo "- funnel-2025-07-complete.html"
echo "- funnel-2025-08-live-a.html (이미 수정됨)"
echo "- funnel-2025-08-live-b.html (이미 수정됨)"

echo ""
echo "🔄 다음 단계:"
echo "1. Git 커밋: git add . && git commit -m 'feat: 모든 퍼널 파일에 메타데이터 추가'"
echo "2. 배포: git push origin main"
echo "3. 관리자 페이지에서 정확한 날짜 확인"
