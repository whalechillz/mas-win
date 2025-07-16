// 멀티채널 콘텐츠 데이터 직접 확인
// Admin 페이지 콘솔에서 실행

(async function checkMultichannelContent() {
  console.log('🔍 멀티채널 콘텐츠 확인 중...');
  
  try {
    // Supabase에서 직접 데이터 가져오기
    const response = await fetch('https://yyytjudftvpmcnppaymw.supabase.co/rest/v1/content_ideas?order=scheduled_date.asc', {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5eXRqdWRmdHZwbWNucHBheW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NDcxMTksImV4cCI6MjA2NzAyMzExOX0.TxT-vnDjFip_CCL7Ag8mR7G59dMdQAKfPLY1S3TJqRE'
      }
    });
    
    const data = await response.json();
    console.log('✅ 전체 콘텐츠:', data);
    
    // 플랫폼별 분류
    const byPlatform = {};
    data.forEach(item => {
      if (!byPlatform[item.platform]) {
        byPlatform[item.platform] = [];
      }
      byPlatform[item.platform].push(item);
    });
    
    console.log('📊 플랫폼별 분류:');
    Object.entries(byPlatform).forEach(([platform, items]) => {
      console.log(`- ${platform}: ${items.length}개`);
    });
    
    // 임시 표시 UI 생성
    showMultichannelUI(data, byPlatform);
    
  } catch (error) {
    console.error('❌ 에러:', error);
  }
})();

// 임시 UI 표시 함수
function showMultichannelUI(allData, byPlatform) {
  // 기존 에러 메시지 숨기기
  const errorDiv = document.querySelector('[class*="error"]');
  if (errorDiv) errorDiv.style.display = 'none';
  
  // 새로운 콘텐츠 영역 생성
  const contentArea = document.querySelector('.container') || document.querySelector('main') || document.body;
  
  const tempUI = document.createElement('div');
  tempUI.className = 'p-6 bg-white rounded-lg shadow-lg';
  tempUI.innerHTML = `
    <h2 class="text-2xl font-bold mb-6">📱 멀티채널 콘텐츠 (임시 뷰)</h2>
    
    <div class="mb-6">
      <p class="text-sm text-gray-600">총 ${allData.length}개의 콘텐츠</p>
    </div>
    
    <!-- 플랫폼별 탭 -->
    <div class="flex gap-2 border-b mb-4" id="platform-tabs">
      <button class="px-4 py-2 font-medium border-b-2 border-blue-500" data-platform="all">
        전체 (${allData.length})
      </button>
      ${Object.entries(byPlatform).map(([platform, items]) => `
        <button class="px-4 py-2 font-medium hover:bg-gray-100" data-platform="${platform}">
          ${getPlatformIcon(platform)} ${platform} (${items.length})
        </button>
      `).join('')}
    </div>
    
    <!-- 콘텐츠 리스트 -->
    <div id="content-list" class="space-y-4">
      ${allData.map(item => createContentCard(item)).join('')}
    </div>
  `;
  
  contentArea.innerHTML = '';
  contentArea.appendChild(tempUI);
  
  // 탭 클릭 이벤트
  document.querySelectorAll('#platform-tabs button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const platform = e.target.dataset.platform;
      
      // 탭 스타일 변경
      document.querySelectorAll('#platform-tabs button').forEach(b => {
        b.className = 'px-4 py-2 font-medium hover:bg-gray-100';
      });
      e.target.className = 'px-4 py-2 font-medium border-b-2 border-blue-500';
      
      // 콘텐츠 필터링
      const filtered = platform === 'all' 
        ? allData 
        : allData.filter(item => item.platform === platform);
      
      document.getElementById('content-list').innerHTML = 
        filtered.map(item => createContentCard(item)).join('');
    });
  });
}

// 콘텐츠 카드 생성
function createContentCard(item) {
  const date = new Date(item.scheduled_date).toLocaleDateString('ko-KR');
  const statusColor = {
    'idea': 'bg-yellow-100 text-yellow-800',
    'writing': 'bg-blue-100 text-blue-800',
    'ready': 'bg-green-100 text-green-800',
    'published': 'bg-gray-100 text-gray-800'
  };
  
  return `
    <div class="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-lg">${getPlatformIcon(item.platform)}</span>
            <h3 class="font-semibold">${item.title}</h3>
            <span class="text-xs px-2 py-1 rounded ${statusColor[item.status] || 'bg-gray-100'}">
              ${item.status}
            </span>
          </div>
          <p class="text-sm text-gray-600 mb-2">${item.content}</p>
          <div class="flex items-center gap-4 text-xs text-gray-500">
            <span>📅 ${date}</span>
            <span>👤 ${item.assignee || '미지정'}</span>
            ${item.tags ? `<span>🏷️ ${item.tags}</span>` : ''}
          </div>
        </div>
        <div class="flex gap-2">
          <button class="p-2 text-gray-600 hover:bg-gray-100 rounded">
            ✏️
          </button>
          <button class="p-2 text-red-600 hover:bg-red-50 rounded">
            🗑️
          </button>
        </div>
      </div>
    </div>
  `;
}

// 플랫폼 아이콘
function getPlatformIcon(platform) {
  const icons = {
    'blog': '📝',
    'kakao': '💬',
    'sms': '📱',
    'instagram': '📷',
    'youtube': '🎥',
    'naver': '🟢'
  };
  return icons[platform] || '📄';
}