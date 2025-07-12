#!/bin/bash

# 도메인 설정 자동화 스크립트
# 실행: ./scripts/setup-domains.sh

set -e

echo "🌐 도메인 설정 시작..."

# Vercel CLI 설치 확인
if ! command -v vercel &> /dev/null; then
    echo "📦 Vercel CLI 설치 중..."
    npm i -g vercel
fi

# Vercel에 도메인 추가
echo "🔗 Vercel에 도메인 추가 중..."

# 프로덕션 도메인 추가
vercel domains add www.masgolf.co.kr || true
vercel domains add masgolf.co.kr || true

# 도메인 연결
echo "⚡ 도메인을 프로젝트에 연결 중..."
vercel alias set www.masgolf.co.kr || true
vercel alias set masgolf.co.kr www.masgolf.co.kr || true

# DNS 레코드 정보 출력
echo "
📋 DNS 설정 정보 (닷네임즈에 설정하세요):

1. masgolf.co.kr (루트 도메인):
   Type: A
   Name: @
   Value: 76.76.21.21

2. www.masgolf.co.kr (서브도메인):
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com

3. 리다이렉트 설정:
   masgolf.co.kr → www.masgolf.co.kr (자동)

⏱️ DNS 전파 시간: 최대 48시간 (보통 10분 이내)
"

# DNS 체크 함수
check_dns() {
    echo "🔍 DNS 전파 확인 중..."
    dig +short www.masgolf.co.kr
    nslookup www.masgolf.co.kr 8.8.8.8
}

echo "DNS 확인: check_dns 함수 실행"
