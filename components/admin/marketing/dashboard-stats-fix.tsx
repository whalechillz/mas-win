// IntegratedCampaignManager의 loadDashboardStats 함수 수정
// components/admin/marketing/IntegratedCampaignManager.tsx 파일의 일부를 수정

// 대시보드 통계 로드 (에러 처리 개선)
const loadDashboardStats = async () => {
  try {
    // 먼저 뷰에서 시도
    const { data, error } = await supabase
      .from('integrated_campaign_dashboard')
      .select('*')
      .eq('year', selectedYear)
      .eq('month', selectedMonth)
      .single();
    
    if (!error && data) {
      setDashboardStats(data);
      return;
    }
    
    // 뷰가 없으면 직접 계산
    if (error && error.code === '42P01') { // 테이블/뷰가 존재하지 않음
      console.log('Dashboard view not found, calculating manually...');
      
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];
      
      const { data: contents, error: contentsError } = await supabase
        .from('content_ideas')
        .select('*')
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate)
        .neq('status', 'deleted');
      
      if (!contentsError && contents) {
        // 수동으로 통계 계산
        const stats = {
          year: selectedYear,
          month: selectedMonth,
          blog_count: contents.filter(c => c.platform === 'blog').length,
          kakao_count: contents.filter(c => c.platform === 'kakao').length,
          sms_count: contents.filter(c => c.platform === 'sms').length,
          instagram_count: contents.filter(c => c.platform === 'instagram').length,
          youtube_count: contents.filter(c => c.platform === 'youtube').length,
          total_contents: contents.length,
          published_count: contents.filter(c => c.status === 'published').length,
          idea_count: contents.filter(c => c.status === 'idea').length,
          writing_count: contents.filter(c => c.status === 'writing').length,
          ready_count: contents.filter(c => c.status === 'ready').length
        };
        
        setDashboardStats(stats);
      }
    }
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
    // 에러가 있어도 빈 통계로 초기화
    setDashboardStats({
      blog_count: 0,
      kakao_count: 0,
      sms_count: 0,
      instagram_count: 0,
      youtube_count: 0,
      total_contents: 0,
      published_count: 0,
      idea_count: 0,
      writing_count: 0,
      ready_count: 0
    });
  }
};