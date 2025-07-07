#!/bin/bash
echo "=== 정적 HTML 파일 캐시 강제 갱신 ==="
echo ""

cd /Users/m2/MASLABS/win.masgolf.co.kr

# 현재 시간을 버전으로 사용
VERSION=$(date +%Y%m%d%H%M%S)

# funnel-2025-07.tsx 파일 수정
cat > pages/funnel-2025-07.tsx << EOF
import { useEffect } from 'react';

export default function Funnel202507() {
  useEffect(() => {
    // API fix 스크립트 동적 로드
    const script = document.createElement('script');
    script.src = '/api-fix.js';
    script.async = true;
    document.head.appendChild(script);
    
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // 캐시 방지를 위한 버전 파라미터
  const version = '${VERSION}';

  return (
    <iframe
      src={\`/versions/funnel-2025-07-complete.html?v=\${version}\`}
      style={{
        width: '100%',
        height: '100vh',
        border: 'none',
        margin: 0,
        padding: 0
      }}
      title="MAS Golf 7월 퍼널"
    />
  );
}
EOF

echo "✅ 캐시 버전 업데이트 완료: v=${VERSION}"
echo ""
echo "다음 단계:"
echo "1. npm run build"
echo "2. vercel --prod"
echo ""
echo "이렇게 하면 브라우저가 새로운 HTML 파일을 강제로 로드합니다."
