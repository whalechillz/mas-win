// AI 생성 콘텐츠 미리보기 및 선택 기능
// Admin 페이지 콘솔에서 실행

(function addKakaoAIWithPreview() {
  console.log('🤖 AI 생성 버튼 (미리보기 포함) 추가 중...');
  
  // 캠페인 추가 폼이 열려있는지 확인
  const modal = document.querySelector('.fixed.inset-0');
  if (!modal) {
    alert('먼저 캠페인 추가 버튼을 클릭해서 폼을 열어주세요!');
    return;
  }
  
  const channelSelect = modal.querySelector('select');
  const contentTextarea = modal.querySelector('textarea');
  
  if (!channelSelect || !contentTextarea) {
    console.error('폼 요소를 찾을 수 없습니다');
    return;
  }
  
  // AI 생성 버튼 추가
  const aiButton = document.createElement('button');
  aiButton.type = 'button';
  aiButton.className = 'mt-2 w-full px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 flex items-center justify-center gap-2';
  aiButton.innerHTML = `
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
    </svg>
    AI로 내용 생성
  `;
  
  contentTextarea.parentElement.appendChild(aiButton);
  
  // AI 생성 함수
  aiButton.onclick = async function() {
    const selectedChannel = channelSelect.value;
    
    if (selectedChannel !== 'kakao') {
      alert('카카오톡 채널을 선택해주세요!');
      channelSelect.focus();
      return;
    }
    
    const topicInput = modal.querySelector('input[placeholder*="주제"]');
    const dateInput = modal.querySelector('input[type="date"]');
    
    if (!topicInput.value) {
      alert('주제를 입력해주세요!');
      topicInput.focus();
      return;
    }
    
    // 버튼 비활성화 및 로딩 표시
    aiButton.disabled = true;
    aiButton.innerHTML = `
      <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      AI 생성 중...
    `;
    
    try {
      // AI 생성 시뮬레이션 (실제로는 API 호출)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 3개의 다른 버전 생성
      const versions = [
        {
          style: '친근한 스타일',
          content: `🎉 ${topicInput.value} 이벤트! 🎉

안녕하세요, 마스골프 가족 여러분! 😊

특별한 혜택으로 여러분을 찾아갑니다!
✨ 신규 가입 10% 할인
✨ 구매 고객 사은품 증정
✨ 무료 배송 이벤트

지금 바로 확인하세요! 👉 [링크]
#마스골프 #여름이벤트`
        },
        {
          style: '프로페셔널 스타일',
          content: `[마스골프] ${topicInput.value}

고객님께 특별한 혜택을 안내드립니다.

▶ 이달의 프로모션
- 전 상품 최대 30% 할인
- 신규 회원 가입 혜택
- 구매 금액별 사은품

▶ 기간: ${dateInput.value || '7월 한 달간'}
▶ 문의: 1588-0000

자세히 보기 > masgolf.co.kr`
        },
        {
          style: '감성적 스타일',
          content: `⛳ 골프가 주는 행복한 순간 ⛳

"${topicInput.value}"

무더운 여름,
시원한 그늘에서의 티타임처럼
상쾌한 할인 혜택을 준비했어요 🌿

• 여름 필수템 특가
• 베스트 아이템 추가 할인
• 한정 수량 이벤트

당신의 완벽한 라운딩을 위해 💚
[바로가기]`
        }
      ];
      
      // 미리보기 모달 생성
      const previewModal = document.createElement('div');
      previewModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]';
      previewModal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
            AI가 생성한 카카오톡 메시지 (3개 버전)
          </h3>
          
          <p class="text-sm text-gray-600 mb-4">
            원하는 스타일을 선택하거나, 직접 수정해서 사용하세요.
          </p>
          
          <div class="space-y-4">
            ${versions.map((version, index) => `
              <div class="border rounded-lg p-4 hover:border-purple-500 transition-colors">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium text-purple-600">${version.style}</span>
                  <span class="text-xs text-gray-500">${version.content.length}자</span>
                </div>
                <pre class="whitespace-pre-wrap text-sm text-gray-700 mb-3 font-sans">${version.content}</pre>
                <div class="flex gap-2">
                  <button type="button" 
                    onclick="selectAIContent(${index})"
                    class="flex-1 px-3 py-1.5 bg-purple-600 text-white text-sm rounded hover:bg-purple-700">
                    이 버전 사용
                  </button>
                  <button type="button"
                    onclick="copyAIContent(${index})"
                    class="px-3 py-1.5 border border-gray-300 text-sm rounded hover:bg-gray-50">
                    복사
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
          
          <div class="mt-6 flex gap-3">
            <button type="button"
              onclick="regenerateAI()"
              class="flex-1 px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50">
              다시 생성
            </button>
            <button type="button"
              onclick="closeAIPreview()"
              class="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
              취소
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(previewModal);
      
      // 선택 함수들 정의
      window.selectAIContent = function(index) {
        contentTextarea.value = versions[index].content;
        contentTextarea.style.backgroundColor = '#D1FAE5';
        setTimeout(() => {
          contentTextarea.style.backgroundColor = '';
        }, 1000);
        previewModal.remove();
        
        // 선택 기록 표시
        const selectedInfo = document.createElement('div');
        selectedInfo.className = 'mt-2 text-xs text-green-600 flex items-center gap-1';
        selectedInfo.innerHTML = `
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          AI 생성 콘텐츠 사용중 (${versions[index].style})
        `;
        if (contentTextarea.parentElement.querySelector('.text-green-600')) {
          contentTextarea.parentElement.querySelector('.text-green-600').remove();
        }
        contentTextarea.parentElement.appendChild(selectedInfo);
      };
      
      window.copyAIContent = function(index) {
        navigator.clipboard.writeText(versions[index].content);
        alert('클립보드에 복사되었습니다!');
      };
      
      window.closeAIPreview = function() {
        previewModal.remove();
      };
      
      window.regenerateAI = function() {
        previewModal.remove();
        aiButton.click(); // 다시 생성
      };
      
    } catch (error) {
      console.error('AI 생성 에러:', error);
      alert('AI 생성 중 오류가 발생했습니다.');
    } finally {
      // 버튼 원상복구
      aiButton.disabled = false;
      aiButton.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
        </svg>
        AI로 내용 생성
      `;
    }
  };
  
  // AI 설정 표시
  const aiInfo = document.createElement('div');
  aiInfo.className = 'mt-2 text-xs text-gray-500 flex items-center gap-1';
  aiInfo.innerHTML = `
    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
    AI가 3가지 스타일로 생성합니다 (친근한/프로페셔널/감성적)
  `;
  contentTextarea.parentElement.appendChild(aiInfo);
  
  console.log('✅ AI 미리보기 버튼이 추가되었습니다!');
})();