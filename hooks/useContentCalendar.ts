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
    initial: false, // 초기 로딩 상태를 false로 설정
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
    filters = {},
    showInitialLoading = true
  ) => {
    console.log('🚀 fetchContentCalendar 호출됨', { page, filters, showInitialLoading, currentLoading: loading });
    
    try {
      if (showInitialLoading) {
        console.log('🔄 초기 로딩 시작');
        setLoading(prev => {
          console.log('📝 로딩 상태 변경:', { ...prev, initial: true });
          return { ...prev, initial: true };
        });
      } else {
        console.log('🔄 새로고침 시작');
        setLoading(prev => ({ ...prev, refreshing: true }));
      }
      
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
        setContents(data.contents || []);
        setPagination(data.pagination || {});
        
        // 데이터 로드 완료 후 즉시 로딩 상태 해제
        if (showInitialLoading) {
          console.log('🔄 데이터 로드 완료, 즉시 로딩 상태 해제');
          setLoading(prev => {
            console.log('📝 로딩 상태 완료:', { ...prev, initial: false });
            return { ...prev, initial: false };
          });
        }
      } else {
        console.error('❌ 콘텐츠 캘린더 API 호출 실패');
        setContents([]);
      }
    } catch (error) {
      console.error('콘텐츠 캘린더 데이터 로드 오류:', error);
    } finally {
      if (!showInitialLoading) {
        console.log('🔄 새로고침 완료, loading.refreshing을 false로 설정');
        setLoading(prev => ({ ...prev, refreshing: false }));
      }
    }
  }, []);

  const refreshContent = useCallback(() => {
    fetchContentCalendar(false);
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
