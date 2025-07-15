// Admin 페이지의 멀티채널 생성 버튼 수정
// 브라우저 콘솔에 붙여넣기

(function fixAdminButtons() {
  console.log('🔧 Admin 버튼 수정 중...');
  
  // 기존 API 대신 직접 Supabase 호출
  window.generateMultichannelContent = async function() {
    const supabaseUrl = 'https://yyytjudftrvpmcnppaymw.supabase.co';
    const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5eXRqdWRmdHZ2cG1jbnBwYXltdyIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3NTE0NDcxMTksImV4cCI6MjA2NzAyMzExOX0.1X23B7AANAg_g2Q1AAYl_kIHdd_OQap8YxElvvJn1io';
    
    const contents = [];
    
    // 선택된 채널 확인
    const channels = {
      blog: document.querySelector('input[value="blog"]')?.checked ?? true,
      kakao: document.querySelector('input[value="kakao"]')?.checked ?? true,
      sms: document.querySelector('input[value="sms"]')?.checked ?? true,
      instagram: document.querySelector('input[value="instagram"]')?.checked ?? true,
      youtube: document.querySelector('input[value="youtube"]')?.checked ?? true
    };
    
    const month = 7;
    const year = 2025;
    
    if (channels.blog) {
      contents.push(
        {
          title: `[블로그] ${month}월 프로모션 안내`,
          content: '이달의 특별 혜택을 소개합니다',
          platform: 'blog',
          status: 'idea',
          assignee: '마케팅팀',
          scheduled_date: `${year}-${String(month).padStart(2, '0')}-05`,
          tags: '프로모션,블로그'
        },
        {
          title: `[블로그] ${month}월 골프 팁`,
          content: '시즌별 골프 노하우',
          platform: 'blog', 
          status: 'idea',
          assignee: '콘텐츠팀',
          scheduled_date: `${year}-${String(month).padStart(2, '0')}-15`,
          tags: '팁,블로그'
        }
      );
    }
    
    if (channels.kakao) {
      contents.push({
        title: `[카카오톡] ${month}월 이벤트`,
        content: '카카오톡 채널 이벤트',
        platform: 'kakao',
        status: 'idea',
        assignee: 'CRM팀',
        scheduled_date: `${year}-${String(month).padStart(2, '0')}-01`,
        tags: '카카오톡,이벤트'
      });
    }
    
    if (channels.sms) {
      contents.push({
        title: `[SMS] ${month}월 할인 안내`,
        content: 'SMS 할인 정보',
        platform: 'sms',
        status: 'idea',
        assignee: 'CRM팀',
        scheduled_date: `${year}-${String(month).padStart(2, '0')}-03`,
        tags: 'SMS,할인'
      });
    }
    
    if (channels.instagram) {
      contents.push({
        title: `[인스타그램] ${month}월 피드`,
        content: '인스타그램 콘텐츠',
        platform: 'instagram',
        status: 'idea',
        assignee: 'SNS팀',
        scheduled_date: `${year}-${String(month).padStart(2, '0')}-10`,
        tags: '인스타그램,SNS'
      });
    }
    
    if (channels.youtube) {
      contents.push({
        title: `[유튜브] ${month}월 영상`,
        content: '유튜브 콘텐츠',
        platform: 'youtube',
        status: 'idea',
        assignee: '영상팀',
        scheduled_date: `${year}-${String(month).padStart(2, '0')}-20`,
        tags: '유튜브,영상'
      });
    }
    
    if (contents.length === 0) {
      alert('채널을 선택해주세요!');
      return;
    }
    
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
      
      if (!response.ok) {
        throw new Error('생성 실패');
      }
      
      const data = await response.json();
      alert(`✅ ${data.length}개의 콘텐츠가 생성되었습니다!`);
      location.reload();
    } catch (error) {
      alert('❌ 에러: ' + error.message);
    }
  };
  
  // 기존 버튼에 새 기능 연결
  const buttons = document.querySelectorAll('button');
  const targetButton = Array.from(buttons).find(btn => 
    btn.textContent.includes('멀티채널') || 
    btn.textContent.includes('데이터 생성') ||
    btn.textContent.includes('테이터 생성')  // 오타도 체크
  );
  
  if (targetButton) {
    targetButton.onclick = window.generateMultichannelContent;
    console.log('✅ 버튼이 수정되었습니다!');
    
    // 버튼 텍스트도 수정
    targetButton.textContent = '📮 멀티채널 콘텐츠 생성';
    targetButton.style.backgroundColor = '#10B981';
  }
})();