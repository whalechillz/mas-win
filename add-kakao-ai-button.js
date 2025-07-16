// 카카오톡 AI 자동 생성 버튼 추가
// Admin 페이지 콘솔에서 실행

(function addKakaoAIButton() {
  console.log('🤖 카카오톡 AI 생성 버튼 추가 중...');
  
  // 캠페인 추가 폼이 열려있는지 확인
  const modal = document.querySelector('.fixed.inset-0');
  if (!modal) {
    alert('먼저 캠페인 추가 버튼을 클릭해서 폼을 열어주세요!');
    return;
  }
  
  // 채널 선택 셀렉트 찾기
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
  
  // 내용 입력 필드 아래에 버튼 추가
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
      // AI 생성 API 호출
      const response = await fetch('/api/generate-kakao-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: dateInput.value || new Date().toISOString().split('T')[0],
          theme: '7월 여름 프로모션',
          topic: topicInput.value,
          aiSettings: {
            useAI: true,
            model: 'claude-sonnet',
            style: 'friendly'
          }
        })
      });
      
      if (!response.ok) {
        // API가 없으면 템플릿 사용
        const templates = [
          `🎉 ${topicInput.value} 이벤트! 🎉\n\n특별한 혜택으로 여러분을 찾아갑니다!\n\n✨ 이달의 혜택:\n• 신규 가입 10% 할인\n• 구매 고객 사은품 증정\n• 무료 배송 이벤트\n\n지금 바로 확인하세요! 👉`,
          
          `안녕하세요! 마스골프입니다 🏌️‍♂️\n\n${topicInput.value} 소식을 전해드립니다!\n\n🎁 특별 프로모션\n• 전 상품 최대 30% 할인\n• 베스트 아이템 추가 할인\n• 한정 수량 특가\n\n놓치지 마세요! 💝`,
          
          `⛳ 골프 시즌 특별 이벤트!\n\n${topicInput.value}\n\n🏆 이번 주 핫딜\n🚚 당일 배송 가능\n💳 무이자 할부 혜택\n📱 모바일 전용 쿠폰\n\n[바로가기] 클릭!`
        ];
        
        const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
        contentTextarea.value = randomTemplate;
        
        // 애니메이션 효과
        contentTextarea.style.backgroundColor = '#F3E8FF';
        setTimeout(() => {
          contentTextarea.style.backgroundColor = '';
        }, 1000);
        
      } else {
        const data = await response.json();
        contentTextarea.value = data.data.content || data.content;
        
        // 성공 애니메이션
        contentTextarea.style.backgroundColor = '#D1FAE5';
        setTimeout(() => {
          contentTextarea.style.backgroundColor = '';
        }, 1000);
      }
      
    } catch (error) {
      console.error('AI 생성 에러:', error);
      alert('AI 생성 중 오류가 발생했습니다. 템플릿을 사용합니다.');
      
      // 기본 템플릿 사용
      contentTextarea.value = `🏌️ ${topicInput.value}\n\n특별한 혜택을 준비했습니다!\n\n✅ 이달의 특가 상품\n✅ 신규 회원 혜택\n✅ 무료 배송 이벤트\n\n자세히 보기 👉`;
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
    AI 모델: Claude Sonnet 3.5 (카카오톡 최적화)
  `;
  contentTextarea.parentElement.appendChild(aiInfo);
  
  console.log('✅ AI 생성 버튼이 추가되었습니다!');
  console.log('카카오톡을 선택하고 주제를 입력한 후 "AI로 내용 생성" 버튼을 클릭하세요.');
})();