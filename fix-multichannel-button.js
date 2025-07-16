// Admin 페이지에서 버튼이 작동하도록 수정
// 브라우저 콘솔에서 실행

(function fixMultichannelButton() {
  console.log('🔧 멀티채널 생성 버튼 수정 중...');
  
  // 모든 버튼 찾기
  const buttons = document.querySelectorAll('button');
  let targetButton = null;
  
  buttons.forEach(button => {
    if (button.textContent.includes('멀티채널') || 
        button.textContent.includes('데이터 관리') ||
        button.textContent.includes('테이터 관리')) {
      targetButton = button;
    }
  });
  
  if (!targetButton) {
    console.log('❌ 버튼을 찾을 수 없습니다');
    return;
  }
  
  // 새로운 클릭 이벤트
  targetButton.onclick = async function(e) {
    e.preventDefault();
    console.log('🚀 브라우저에서 직접 콘텐츠 생성...');
    
    const supabaseUrl = 'https://yyytjudftrvpmcnppaymw.supabase.co';
    const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5eXRqdWRmdHZwbWNucHBheW13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ0NzExOSwiZXhwIjoyMDY3MDIzMTE5fQ.1X23B7AANAg_g2Q1AAYl_kIHdd_OQap8YxElvvJn1io';
    
    // 현재 월 확인
    const monthSelect = document.querySelector('select');
    const currentMonth = monthSelect ? parseInt(monthSelect.value) : 7;
    const currentYear = 2025;
    
    const contents = [
      {
        title: `[블로그] ${currentMonth}월 프로모션`,
        content: '이달의 특별 혜택',
        platform: 'blog',
        status: 'idea',
        assignee: '마케팅팀',
        scheduled_date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-05`,
        tags: '프로모션,블로그'
      },
      {
        title: `[카카오톡] ${currentMonth}월 이벤트`,
        content: '카카오톡 이벤트',
        platform: 'kakao',
        status: 'idea',
        assignee: 'CRM팀',
        scheduled_date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
        tags: '카카오톡,이벤트'
      },
      {
        title: `[SMS] ${currentMonth}월 할인`,
        content: 'SMS 할인 정보',
        platform: 'sms',
        status: 'idea',
        assignee: 'CRM팀',
        scheduled_date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-03`,
        tags: 'SMS,할인'
      },
      {
        title: `[인스타그램] ${currentMonth}월 콘텐츠`,
        content: '인스타그램 피드',
        platform: 'instagram',
        status: 'idea',
        assignee: 'SNS팀',
        scheduled_date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-07`,
        tags: '인스타그램,SNS'
      },
      {
        title: `[유튜브] ${currentMonth}월 영상`,
        content: '유튜브 콘텐츠',
        platform: 'youtube',
        status: 'idea',
        assignee: '영상팀',
        scheduled_date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-15`,
        tags: '유튜브,영상'
      }
    ];
    
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/content_ideas`, {
        method: 'POST',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(contents)
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`✅ ${data.length}개의 콘텐츠가 생성되었습니다!`);
        setTimeout(() => location.reload(), 1000);
      } else {
        const error = await response.json();
        alert('❌ 생성 실패: ' + (error.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ 네트워크 에러: ' + error.message);
    }
  };
  
  // 버튼 스타일 변경
  targetButton.style.backgroundColor = '#10B981';
  targetButton.textContent = '🚀 멀티채널 생성 (수정됨)';
  
  console.log('✅ 버튼이 수정되었습니다!');
  console.log('이제 버튼을 클릭하면 브라우저에서 직접 콘텐츠를 생성합니다.');
})();