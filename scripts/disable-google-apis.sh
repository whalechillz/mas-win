#!/bin/bash

# Google API 비활성화 스크립트
# 비용 절약을 위해 Google API들을 비활성화합니다

echo "🚨 Google API 비활성화 스크립트 시작"
echo "=================================="

# .env.local 파일 경로
ENV_FILE=".env.local"

# .env.local 파일이 없으면 생성
if [ ! -f "$ENV_FILE" ]; then
    echo "📝 .env.local 파일을 생성합니다..."
    touch "$ENV_FILE"
fi

echo "🔧 Google API 비활성화 설정을 추가합니다..."

# Google AI API 비활성화
if ! grep -q "GOOGLE_AI_API_KEY=disabled" "$ENV_FILE"; then
    echo "GOOGLE_AI_API_KEY=disabled" >> "$ENV_FILE"
    echo "✅ Google AI API 비활성화 추가"
else
    echo "⚠️ Google AI API 비활성화 이미 설정됨"
fi

# Google Analytics API 비활성화
if ! grep -q "GOOGLE_ANALYTICS_DISABLED=true" "$ENV_FILE"; then
    echo "GOOGLE_ANALYTICS_DISABLED=true" >> "$ENV_FILE"
    echo "✅ Google Analytics API 비활성화 추가"
else
    echo "⚠️ Google Analytics API 비활성화 이미 설정됨"
fi

# Google Ads API 비활성화
if ! grep -q "GOOGLE_ADS_DISABLED=true" "$ENV_FILE"; then
    echo "GOOGLE_ADS_DISABLED=true" >> "$ENV_FILE"
    echo "✅ Google Ads API 비활성화 추가"
else
    echo "⚠️ Google Ads API 비활성화 이미 설정됨"
fi

echo ""
echo "🎯 설정 완료!"
echo "=================================="
echo "📊 비활성화된 API들:"
echo "  - Google AI API (이미지 생성)"
echo "  - Google Analytics API (데이터 수집)"
echo "  - Google Ads API (캠페인 관리)"
echo ""
echo "💡 재활성화하려면 .env.local 파일에서 해당 라인을 삭제하세요"
echo "🔄 변경사항을 적용하려면 애플리케이션을 재시작하세요"
