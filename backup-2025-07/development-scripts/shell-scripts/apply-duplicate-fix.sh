#!/bin/bash

echo "슬랙 중복 알림 방지 적용 중..."

# 1. 서버 측 중복 방지 적용
cd /Users/m2/MASLABS/win.masgolf.co.kr/pages/api/slack
mv notify.js notify.js.backup-$(date +%Y%m%d-%H%M%S)
mv notify-with-duplicate-check.js notify.js
echo "✅ 서버 측 중복 방지 적용 완료"

# 2. 클라이언트 측 중복 방지 적용
cd /Users/m2/MASLABS/win.masgolf.co.kr
chmod +x fix-duplicate-slack.sh
./fix-duplicate-slack.sh

echo ""
echo "✅ 모든 중복 방지 기능이 적용되었습니다!"
echo ""
echo "적용된 내용:"
echo "1. 서버에서 30초 이내 동일 전화번호 중복 요청 차단"
echo "2. 클라이언트에서 폼 제출 중 재제출 방지 (3초 대기)"
echo "3. 전화번호 유효성 검사 추가"
echo "4. 요청 ID를 통한 추적 가능"
echo ""
echo "추가 테스트 방법:"
echo "1. 모바일과 PC에서 동시에 테스트"
echo "2. 빠른 더블 클릭 테스트"
echo "3. 네트워크 느린 상황 시뮬레이션"
