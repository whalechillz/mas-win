#!/bin/bash

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎬 MAS Golf 7월 캠페인 유튜브 팝업 추가 도구${NC}"
echo "========================================"

# 비디오 ID 입력받기
if [ -z "$1" ]; then
    echo -e "${YELLOW}유튜브 비디오 ID를 입력하세요:${NC}"
    echo "예시: https://www.youtube.com/watch?v=dQw4w9WgXcQ 에서 'dQw4w9WgXcQ' 부분"
    read -p "비디오 ID: " VIDEO_ID
else
    VIDEO_ID=$1
fi

# 비디오 ID 검증
if [ -z "$VIDEO_ID" ]; then
    echo -e "${RED}❌ 비디오 ID가 입력되지 않았습니다.${NC}"
    exit 1
fi

echo -e "\n${GREEN}✅ 비디오 ID: $VIDEO_ID${NC}"

# 타겟 파일 선택
echo -e "\n${YELLOW}어떤 파일에 팝업을 추가하시겠습니까?${NC}"
echo "1) funnel-2025-07-supabase.html (기본)"
echo "2) funnel-2025-07-complete-backup.html"
echo "3) 직접 입력"

read -p "선택 (1-3): " FILE_CHOICE

case $FILE_CHOICE in
    1)
        TARGET_FILE="public/versions/funnel-2025-07-supabase.html"
        ;;
    2)
        TARGET_FILE="public/versions/funnel-2025-07-complete-backup.html"
        ;;
    3)
        read -p "파일 경로 입력: " TARGET_FILE
        ;;
    *)
        TARGET_FILE="public/versions/funnel-2025-07-supabase.html"
        ;;
esac

echo -e "${GREEN}✅ 타겟 파일: $TARGET_FILE${NC}"

# 자바스크립트 파일 생성
cat > add-youtube-popup-temp.js << 'EOF'
const fs = require('fs').promises;
const path = require('path');

const CONFIG = {
  youtubeVideoId: process.argv[2],
  targetFile: process.argv[3],
  backupDir: 'public/versions/backup'
};

const popupHTML = `
<!-- YouTube Popup Modal -->
<div id="youtubeModal" style="display:none; position:fixed; z-index:9999; left:0; top:0; width:100%; height:100%; background-color:rgba(0,0,0,0.8);">
  <div class="modal-content" style="position:relative; margin:5% auto; width:90%; max-width:800px; background:#000; border-radius:10px; padding:20px;">
    <span class="close" onclick="closeYoutubeModal()" style="position:absolute; right:15px; top:15px; color:#fff; font-size:35px; cursor:pointer; z-index:10000;">&times;</span>
    <h3 style="color:#fff; margin-bottom:20px; text-align:center;">7월 피팅 특별 영상</h3>
    <div style="position:relative; padding-bottom:56.25%; height:0;">
      <iframe id="youtubeFrame" 
        src="https://www.youtube.com/embed/${CONFIG.youtubeVideoId}" 
        style="position:absolute; top:0; left:0; width:100%; height:100%; border-radius:5px;"
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen>
      </iframe>
    </div>
  </div>
</div>`;

const popupJS = `
<script>
function openYoutubeModal() {
  document.getElementById('youtubeModal').style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeYoutubeModal() {
  document.getElementById('youtubeModal').style.display = 'none';
  document.body.style.overflow = 'auto';
  const iframe = document.getElementById('youtubeFrame');
  iframe.src = iframe.src;
}

// ESC 키로 닫기
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeYoutubeModal();
});

// 모달 외부 클릭시 닫기
window.onclick = function(e) {
  if (e.target.id === 'youtubeModal') closeYoutubeModal();
}
</script>`;

const buttonHTML = `
<button id="youtubeBtn" onclick="openYoutubeModal()" style="
  position: fixed;
  bottom: 30px;
  right: 30px;
  background: linear-gradient(45deg, #ff0000, #cc0000);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 50px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 5px 15px rgba(255,0,0,0.3);
  z-index: 1000;
  transition: all 0.3s ease;
  animation: pulse 2s infinite;
">
  🎥 7월 피팅 영상 보기
</button>

<style>
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

#youtubeBtn:hover {
  transform: scale(1.1) !important;
  box-shadow: 0 7px 20px rgba(255,0,0,0.4);
}
</style>`;

async function run() {
  try {
    const filePath = path.join(process.cwd(), CONFIG.targetFile);
    
    // 파일 확인
    await fs.access(filePath);
    
    // 백업
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const backupPath = path.join(process.cwd(), CONFIG.backupDir, `july-youtube-backup-${timestamp}.html`);
    await fs.mkdir(path.dirname(backupPath), { recursive: true });
    
    let html = await fs.readFile(filePath, 'utf8');
    await fs.writeFile(backupPath, html);
    
    // 이미 있는지 확인
    if (html.includes('youtubeModal')) {
      console.log('⚠️  이미 유튜브 팝업이 존재합니다.');
      return;
    }
    
    // HTML 수정
    const bodyEnd = html.lastIndexOf('</body>');
    const newHTML = html.slice(0, bodyEnd) + '\n' + buttonHTML + '\n' + popupHTML + '\n' + popupJS + '\n' + html.slice(bodyEnd);
    
    await fs.writeFile(filePath, newHTML);
    console.log('✅ 성공적으로 추가되었습니다!');
    
  } catch (error) {
    console.error('❌ 오류:', error.message);
  }
}

run();
EOF

# 실행
echo -e "\n${BLUE}🚀 팝업 추가 중...${NC}"
node add-youtube-popup-temp.js "$VIDEO_ID" "$TARGET_FILE"

# 임시 파일 삭제
rm -f add-youtube-popup-temp.js

echo -e "\n${GREEN}✨ 작업 완료!${NC}"
echo -e "${YELLOW}📌 확인 방법:${NC}"
echo "1. 브라우저에서 페이지 열기"
echo "2. 우측 하단의 빨간 버튼 클릭"
echo "3. 유튜브 영상이 팝업으로 표시됨"
echo ""
echo -e "${BLUE}💡 팁: 버튼 위치나 스타일을 변경하려면 생성된 HTML 파일에서 #youtubeBtn 스타일을 수정하세요.${NC}"