#!/bin/bash

# GTM 자동화 설정 스크립트

# 1. 필요한 패키지 설치
echo "📦 필요한 패키지 설치 중..."
pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client

# 2. 환경 변수 설정
export ACCOUNT_ID="6241977234"
export CONTAINER_ID="191131940"
export WORKSPACE_ID="8"

# 3. Python 스크립트 실행
echo "🚀 GTM 자동 설정 시작..."
python3 scripts/gtm_automation.py

echo "✅ GTM 설정 완료!"
