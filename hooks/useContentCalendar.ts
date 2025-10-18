import { useState, useCallback } from 'react';

interface ContentCalendarItem {
  id: string;
  title: string;
  content_type: string;
  content_date: string;
  status: string;
  target_audience: {
    persona: string;
    stage: string;
  };
  conversion_tracking: {
    landingPage: string;
    goal: string;
    utmParams: any;
  };
  published_channels: string[];
  blog_post_id?: string;
  parent_content_id?: string;
  target_audience_type?: 'existing_customer' | 'new_customer';
  channel_type?: string;
  is_root_content?: boolean;
  derived_content_count?: number;
  multichannel_status?: 'pending' | 'generating' | 'completed' | 'failed';
  naver_blog_account?: string;
  naver_blog_account_name?: string;
  generated_images?: any[];
  image_generation_status?: 'pending' | 'generating' | 'completed' | 'failed';
  landing_page_url?: string;
  landing_page_strategy?: any;
  utm_parameters?: any;
  performance_metrics?: any;
  conversion_goals?: string[];
  tracking_enabled?: boolean;
  children?: ContentCalendarItem[];
  level?: number;
}

interface LoadingState {
  initial: boolean;
  refreshing: boolean;
  action: boolean;
}

export const useContentCalendar = () => {
  const [contents, setContents] = useState<ContentCalendarItem[]>([]);
  const [loading, setLoading] = useState<LoadingState>({
    initial: false,
    refreshing: false,
    action: false
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasMore: true
  });

  const fetchContentCalendar = useCallback(async (
    page = 1,
    filters = {}
  ) => {
    console.log('🚀 fetchContentCalendar 호출됨', { page, filters });
    
    try {
      // 로딩 시작
      console.log('🔄 로딩 상태 시작');
      setLoading(prev => ({ ...prev, initial: true }));
      
      // 쿼리 파라미터 구성
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...filters
      });
      
      console.log('🌐 API 호출 시작: /api/admin/content-calendar?' + params.toString());
      const response = await fetch(`/api/admin/content-calendar?${params}`);
      console.log('📡 API 응답 받음:', { ok: response.ok, status: response.status });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 콘텐츠 캘린더 API 응답:', data);
        
        // 데이터 설정
        setContents(data.contents || []);
        setPagination(data.pagination || {});
        
        // 로딩 완료
        console.log('✅ 데이터 로드 완료, 로딩 상태 해제');
        setLoading({
          initial: false,
          refreshing: false,
          action: false
        });
      } else {
        console.error('❌ 콘텐츠 캘린더 API 호출 실패');
        setContents([]);
        setLoading({
          initial: false,
          refreshing: false,
          action: false
        });
      }
    } catch (error) {
      console.error('❌ 콘텐츠 캘린더 데이터 로드 오류:', error);
      setContents([]);
      setLoading({
        initial: false,
        refreshing: false,
        action: false
      });
    }
  }, []);

  const refreshContent = useCallback(() => {
    fetchContentCalendar(1);
  }, [fetchContentCalendar]);

  const setActionLoading = useCallback((isLoading: boolean) => {
    setLoading(prev => ({ ...prev, action: isLoading }));
  }, []);

  return {
    contents,
    loading,
    pagination,
    fetchContentCalendar,
    refreshContent,
    setActionLoading
  };
};