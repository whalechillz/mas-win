#!/bin/bash

# 빌드
echo "🔨 Building Next.js app..."
npm run build

# out 폴더가 있으면 복사
if [ -d "out" ]; then
    echo "📦 Copying build files..."
    # funnel-2025-06.html을 versions 폴더로 복사
    cp out/funnel-2025-06.html public/versions/
    echo "✅ Copied funnel-2025-06.html to public/versions/"
else
    echo "❌ out folder not found. Trying alternative..."
    # .next/server/pages에서 찾기
    if [ -f ".next/server/pages/funnel-2025-06.html" ]; then
        cp .next/server/pages/funnel-2025-06.html public/versions/
        echo "✅ Copied from .next folder"
    fi
fi

# index.html 업데이트 (6월로 변경)
cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>MASGOLF | 6월, 인생 황금기 캠페인</title>
    <meta http-equiv="refresh" content="0;url=/versions/funnel-2025-06.html">
    <style>
      body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #000; }
      .spinner {
        width: 48px; height: 48px;
        border: 6px solid #333;
        border-top: 6px solid #FFD700;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 20px;
      }
      @keyframes spin {
        100% { transform: rotate(360deg); }
      }
      .msg { font-size: 1.1rem; color: #FFD700; }
    </style>
</head>
<body>
  <div class="spinner"></div>
  <div class="msg">인생 황금기 캠페인으로 이동 중...</div>
</body>
</html>
EOF

echo "✅ Updated index.html to redirect to June campaign"
echo "🚀 Ready to commit and push!"
