// Admin 페이지 콘솔에서 실행
// Supabase 클라이언트를 직접 사용하는 방법

(async function createWithSupabase() {
  console.log('🔧 Supabase 클라이언트로 직접 생성...');
  
  // 이미 페이지에 로드된 Supabase 사용
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  
  const supabase = createClient(
    'https://yyytjudftrvpmcnppaymw.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5eXRqdWRmdHZwbWNucHBheW13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ0NzExOSwiZXhwIjoyMDY3MDIzMTE5fQ.1X23B7AANAg_g2Q1AAYl_kIHdd_OQap8YxElvvJn1io'
  );
  
  const contents = [
    {
      title: '[블로그] 7월 여름 프로모션',
      content: '여름 특별 할인!',
      platform: 'blog',
      status: 'idea',
      assignee: '마케팅팀',
      scheduled_date: '2025-07-05',
      tags: '프로모션,여름'
    },
    {
      title: '[카카오톡] 7월 이벤트',
      content: '카카오톡 이벤트',
      platform: 'kakao',
      status: 'idea',
      assignee: 'CRM팀',
      scheduled_date: '2025-07-01',
      tags: '카카오톡,이벤트'
    },
    {
      title: '[SMS] 여름 할인쿠폰',
      content: '20% 할인쿠폰',
      platform: 'sms',
      status: 'idea',
      assignee: 'CRM팀',
      scheduled_date: '2025-07-03',
      tags: 'SMS,쿠폰'
    },
    {
      title: '[인스타그램] 여름 콘텐츠',
      content: '인스타 피드',
      platform: 'instagram',
      status: 'idea',
      assignee: 'SNS팀',
      scheduled_date: '2025-07-07',
      tags: '인스타그램,SNS'
    },
    {
      title: '[유튜브] 7월 영상',
      content: '유튜브 콘텐츠',
      platform: 'youtube',
      status: 'idea',
      assignee: '영상팀',
      scheduled_date: '2025-07-15',
      tags: '유튜브,영상'
    }
  ];
  
  try {
    const { data, error } = await supabase
      .from('content_ideas')
      .insert(contents)
      .select();
    
    if (error) throw error;
    
    console.log('✅ 성공!', data);
    alert(`🎉 ${data.length}개의 콘텐츠가 생성되었습니다!`);
    setTimeout(() => location.reload(), 2000);
  } catch (error) {
    console.error('❌ 에러:', error);
    alert('에러: ' + error.message);
  }
})();