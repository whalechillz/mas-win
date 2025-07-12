#!/bin/bash

echo "🚀 Building and deploying static files"
echo "======================================"

# 1. 클린 빌드
echo "🧹 Cleaning old builds..."
rm -rf .next out

# 2. 빌드
echo "🔨 Building static files..."
npm run build

# 3. out 폴더 확인
if [ ! -d "out" ]; then
    echo "❌ Error: out folder not created"
    echo "Make sure output: 'export' is set in next.config.js"
    exit 1
fi

# 4. public 폴더에 복사
echo "📂 Copying files to public..."

# funnel 페이지들 복사
cp out/funnel-2025-06.html public/
cp out/funnel-2025-05.html public/

# index.html 업데이트 (동적 경로가 아닌 정적 파일로)
cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>MASGOLF | 6월, 인생 황금기 캠페인</title>
    <meta http-equiv="refresh" content="0;url=/funnel-2025-06.html">
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

echo "✅ Static files ready in public folder"
echo ""
echo "📝 Next steps:"
echo "1. Commit and push:"
echo "   git add ."
echo "   git commit -m 'build: static files for production'"
echo "   git push"
echo ""
echo "2. Upload public folder contents to your web server"
echo ""
echo "Available pages:"
echo "- /funnel-2025-06.html (6월 캠페인)"
echo "- /funnel-2025-05.html (5월 백업)"
