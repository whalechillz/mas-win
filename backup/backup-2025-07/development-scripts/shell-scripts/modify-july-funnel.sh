#!/bin/bash

echo "📝 7월 퍼널 페이지 수정 중..."

# 백업 생성
cp public/versions/funnel-2025-07-complete.html public/versions/funnel-2025-07-complete.html.backup

# 파일을 읽어서 수정사항 적용
cat > temp_modifications.js << 'EOF'
const fs = require('fs');
const path = require('path');

// 파일 읽기
const filePath = path.join(__dirname, 'public/versions/funnel-2025-07-complete.html');
let content = fs.readFileSync(filePath, 'utf8');

// 1. '완벽한 스윙' 문구를 노란색으로 변경
content = content.replace(/완벽한 스윙/g, '<span class="text-[#FFD700]">완벽한 스윙</span>');

// 2. 영상보기 버튼 제거 - 영상 섹션 자체를 제거
content = content.replace(/<section id="video-section"[\s\S]*?<\/section>/g, '');
content = content.replace(/<a[^>]*href="#video-section"[^>]*>[\s\S]*?<\/a>/g, '');

// 3. 나의 스타일 찾기 버튼 스타일 변경
content = content.replace(
    /<a[^>]*href="#style-quiz"[^>]*class="[^"]*"[^>]*>나의 스타일 찾기/g,
    '<a href="#style-quiz" class="inline-block bg-[#FFD700] text-black px-8 py-4 rounded-full font-bold hover:bg-[#FFC700] transform hover:scale-105 transition-all duration-300 shadow-xl">나의 스타일 찾기'
);

// 5. 'MAS 고반발 기술'을 'MAS 고반발 드라이버'로 수정
content = content.replace(/MAS 고반발 기술/g, 'MAS 고반발 드라이버');
content = content.replace(/mas 고반발 기술/gi, 'MAS 고반발 드라이버');

// 파일 저장
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ 수정 완료!');
EOF

# Node.js로 수정 실행
node temp_modifications.js

# 임시 파일 삭제
rm temp_modifications.js

echo "✅ 7월 퍼널 페이지 수정 완료!"