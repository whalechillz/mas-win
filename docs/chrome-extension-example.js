// Chrome Extension 예시 (manifest.json)
{
  "manifest_version": 3,
  "name": "MASGOLF 네이버 블로그 도우미",
  "version": "1.0",
  "description": "네이버 블로그 조회수를 쉽게 관리하세요",
  "permissions": [
    "activeTab",
    "storage"
  ],
  "host_permissions": [
    "https://blog.naver.com/*"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icon16.png",
      "48": "icon48.png",
      "128": "icon128.png"
    }
  },
  "content_scripts": [
    {
      "matches": ["https://blog.naver.com/*"],
      "js": ["content.js"]
    }
  ]
}

// content.js
function getViewCount() {
  // 조회수 요소 찾기 (네이버 블로그 구조에 따라 변경 필요)
  const viewElements = document.querySelectorAll('.se-view-count, .view-count, [class*="view"]');
  
  for (const element of viewElements) {
    const text = element.textContent || '';
    const match = text.match(/\d+/);
    if (match) {
      return parseInt(match[0]);
    }
  }
  
  return null;
}

// 현재 페이지 정보 수집
const pageInfo = {
  url: window.location.href,
  title: document.title,
  viewCount: getViewCount(),
  timestamp: new Date().toISOString()
};

// 백그라운드로 전송
chrome.runtime.sendMessage({
  action: 'saveViewCount',
  data: pageInfo
});

// popup.html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      width: 300px;
      padding: 10px;
      font-family: Arial, sans-serif;
    }
    .view-count {
      font-size: 24px;
      font-weight: bold;
      color: #2c5282;
      margin: 10px 0;
    }
    button {
      background: #4299e1;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 10px;
      width: 100%;
    }
    button:hover {
      background: #3182ce;
    }
    .status {
      margin-top: 10px;
      padding: 8px;
      border-radius: 4px;
      font-size: 12px;
    }
    .success {
      background: #c6f6d5;
      color: #276749;
    }
    .error {
      background: #fed7d7;
      color: #742a2a;
    }
  </style>
</head>
<body>
  <h3>네이버 블로그 조회수 도우미</h3>
  <div id="content">
    <p>네이버 블로그 페이지에서 사용하세요.</p>
  </div>
  <button id="syncButton">MASGOLF 대시보드에 동기화</button>
  <div id="status"></div>
  <script src="popup.js"></script>
</body>
</html>

// popup.js
document.addEventListener('DOMContentLoaded', async () => {
  const contentDiv = document.getElementById('content');
  const syncButton = document.getElementById('syncButton');
  const statusDiv = document.getElementById('status');
  
  // 현재 탭 확인
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (tab.url && tab.url.includes('blog.naver.com')) {
    // 콘텐츠 스크립트에서 데이터 가져오기
    chrome.tabs.sendMessage(tab.id, { action: 'getPageInfo' }, (response) => {
      if (response && response.viewCount) {
        contentDiv.innerHTML = `
          <p><strong>조회수:</strong></p>
          <div class="view-count">${response.viewCount.toLocaleString()}</div>
          <p style="font-size: 12px; color: #666;">URL: ${response.url}</p>
        `;
      }
    });
    
    // 동기화 버튼 이벤트
    syncButton.addEventListener('click', async () => {
      try {
        // MASGOLF 대시보드 API로 전송
        const response = await fetch('https://win.masgolf.co.kr/api/update-view-count', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url: tab.url,
            viewCount: response.viewCount,
            timestamp: new Date().toISOString()
          })
        });
        
        if (response.ok) {
          statusDiv.className = 'status success';
          statusDiv.textContent = '✓ 동기화 완료!';
        } else {
          throw new Error('동기화 실패');
        }
      } catch (error) {
        statusDiv.className = 'status error';
        statusDiv.textContent = '✗ 동기화 실패. 다시 시도해주세요.';
      }
    });
  } else {
    contentDiv.innerHTML = '<p style="color: #e53e3e;">네이버 블로그 페이지가 아닙니다.</p>';
    syncButton.disabled = true;
  }
});