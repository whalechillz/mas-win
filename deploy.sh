#!/bin/bash

echo "🚀 Deploying MASGOLF Dynamic Site"
echo "================================"

# 1. 의존성 설치
echo "📦 Installing dependencies..."
npm install

# 2. 빌드
echo "🔨 Building Next.js app..."
npm run build

# 3. PM2로 서버 실행 (프로덕션 서버인 경우)
if command -v pm2 &> /dev/null; then
    echo "🚀 Starting with PM2..."
    pm2 stop masgolf || true
    pm2 start npm --name "masgolf" -- start
    pm2 save
else
    echo "⚠️  PM2 not found. For production, install PM2:"
    echo "   npm install -g pm2"
    echo ""
    echo "📌 For development, run:"
    echo "   npm run dev"
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Available routes:"
echo "   - / → /funnel-2025-06 (redirect)"
echo "   - /funnel-2025-06 (6월 인생 황금기 캠페인)"
echo "   - /funnel-2025-05 (5월 캠페인 백업)"
echo ""
echo "🌐 Access your site at: https://win.masgolf.co.kr"
