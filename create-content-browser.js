// 브라우저 콘솔에서 직접 실행
// Admin 페이지에서 F12 → Console → 붙여넣기

async function createContentDirectly() {
  console.log('🚀 브라우저에서 직접 콘텐츠 생성 시작...');
  
  const supabaseUrl = 'https://yyytjudftrvpmcnppaymw.supabase.co';
  const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5eXRqdWRmdHZ2cG1jbnBwYXltdyIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3NTE0NDcxMTksImV4cCI6MjA2NzAyMzExOX0.1X23B7AANAg_g2Q1AAYl_kIHdd_OQap8YxElvvJn1io';
  
  // 7월 콘텐츠 데이터
  const contents = [
    {
      title: '[블로그] 7월 여름 특별 프로모션',
      content: '무더운 여름, 시원한 할인 혜택을 만나보세요!',
      platform: 'blog',
      status: 'ready',
      assignee: '마케팅팀',
      scheduled_date: '2025-07-05',
      tags: '프로모션,여름,블로그'
    },
    {
      title: '[블로그] 여름철 골프 필수 아이템',
      content: '더위를 이기는 골프 용품 추천',
      platform: 'blog',
      status: 'idea',
      assignee: '콘텐츠팀',
      scheduled_date: '2025-07-10',
      tags: '팁,여름,용품추천'
    },
    {
      title: '[카카오톡] 7월 이벤트 안내',
      content: '7월 한정 특가 이벤트 안내드립니다',
      platform: 'kakao',
      status: 'idea',
      assignee: 'CRM팀',
      scheduled_date: '2025-07-01',
      tags: '카카오톡,이벤트,공지'
    },
    {
      title: '[SMS] 여름 시즌 할인 쿠폰',
      content: '[마스골프] 여름맞이 20% 할인쿠폰이 도착했습니다!',
      platform: 'sms',
      status: 'idea',
      assignee: 'CRM팀',
      scheduled_date: '2025-07-03',
      tags: 'SMS,쿠폰,할인'
    },
    {
      title: '[인스타그램] 여름 골프룩 컬렉션',
      content: '2025 여름 신상 골프웨어 소개',
      platform: 'instagram',
      status: 'idea',
      assignee: 'SNS팀',
      scheduled_date: '2025-07-07',
      tags: '인스타그램,패션,신상품'
    },
    {
      title: '[유튜브] 여름철 골프 스윙 교정법',
      content: '더위에 지치지 않는 효율적인 스윙 레슨',
      platform: 'youtube',
      status: 'idea',
      assignee: '영상팀',
      scheduled_date: '2025-07-15',
      tags: '유튜브,레슨,여름'
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
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '생성 실패');
    }
    
    const data = await response.json();
    console.log('✅ 성공!', data);
    alert(`🎉 ${data.length}개의 콘텐츠가 생성되었습니다!`);
    
    // 3초 후 페이지 새로고침
    setTimeout(() => {
      console.log('페이지를 새로고침합니다...');
      location.reload();
    }, 3000);
    
    return data;
  } catch (error) {
    console.error('❌ 에러:', error);
    alert('에러: ' + error.message);
  }
}

// 즉시 실행
createContentDirectly();