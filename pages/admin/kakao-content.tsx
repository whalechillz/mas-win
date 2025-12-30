'use client';

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AdminNav from '../../components/admin/AdminNav';
import BrandStrategySelector from '../../components/admin/BrandStrategySelector';
import KakaoAccountEditor from '../../components/admin/kakao/KakaoAccountEditor';
import ImageSelectionModal from '../../components/admin/kakao/ImageSelectionModal';
import MessageListView from '../../components/admin/kakao/MessageListView';
import WorkflowVisualization from '../../components/admin/kakao/WorkflowVisualization';
import VariationTestPanel from '../../components/admin/kakao/VariationTestPanel';
import VariationPreview from '../../components/admin/kakao/VariationPreview';
import { generateGoldToneImages, generateBlackToneImages, generateImagePrompts, generateKakaoImagePrompts } from '../../lib/ai-image-generation';
import { promptConfigManager } from '../../lib/prompt-config-manager';
import { Rocket, Calendar, Settings, Loader, ChevronLeft, ChevronRight, CheckCircle, Clock, ChevronDown, ChevronUp, Sparkles, TestTube, Eye } from 'lucide-react';

interface CalendarData {
  profileContent: {
    account1: {
      account: string;
      name: string;
      persona: string;
      tone: string;
      dailySchedule: Array<{
        date: string;
        background: { image: string; prompt: string; status: string; imageUrl?: string; basePrompt?: string };
        profile: { image: string; prompt: string; status: string; imageUrl?: string; basePrompt?: string };
        message: string;
        status: string;
        created: boolean;
        publishedAt?: string;
        createdAt?: string;
      }>;
      weeklyThemes?: {
        week1?: string;
        week2?: string;
        week3?: string;
        week4?: string;
      };
    };
    account2: {
      account: string;
      name: string;
      persona: string;
      tone: string;
      dailySchedule: Array<{
        date: string;
        background: { image: string; prompt: string; status: string; imageUrl?: string; basePrompt?: string };
        profile: { image: string; prompt: string; status: string; imageUrl?: string; basePrompt?: string };
        message: string;
        status: string;
        created: boolean;
        publishedAt?: string;
        createdAt?: string;
      }>;
      weeklyThemes?: {
        week1?: string;
        week2?: string;
        week3?: string;
        week4?: string;
      };
    };
  };
  kakaoFeed: {
    dailySchedule: Array<{
      date: string;
      account1: {
        imageCategory: string;
        imagePrompt: string;
        caption: string;
        status: string;
        created: boolean;
        imageUrl?: string;
        url?: string;
        createdAt?: string;
      };
      account2: {
        imageCategory: string;
        imagePrompt: string;
        caption: string;
        status: string;
        created: boolean;
        imageUrl?: string;
        url?: string;
        createdAt?: string;
      };
    }>;
  };
}

export default function KakaoContentPage() {
  const router = useRouter();
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [todayStr, setTodayStr] = useState('');
  const [selectedDate, setSelectedDate] = useState(''); // 선택된 날짜 (오늘/이번주/이번달)
  const [viewMode, setViewMode] = useState<'today' | 'week' | 'month' | 'list'>('today'); // 보기 모드
  const [savedConfigs, setSavedConfigs] = useState(promptConfigManager.getConfigs());
  const [selectedPromptConfig, setSelectedPromptConfig] = useState('');
  const [brandStrategy, setBrandStrategy] = useState<any>(null);
  const [isCreatingAll, setIsCreatingAll] = useState(false);
  const [showGenerationOptions, setShowGenerationOptions] = useState(false);
  const [generationOptions, setGenerationOptions] = useState({
    imageCount: 2 // 생성할 이미지 개수 (선택용)
  });
  const [saveStatus, setSaveStatus] = useState<{ status: 'idle' | 'saving' | 'success' | 'error'; message?: string }>({ status: 'idle' });
  // 날짜 선택 상태 (다중 선택)
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  // 생성 진행 상황
  const [generationProgress, setGenerationProgress] = useState<{
    isRunning: boolean;
    currentDate: string | null;
    currentAccount: 'account1' | 'account2' | null;
    currentType: 'background' | 'profile' | 'feed' | null;
    totalItems: number;
    completedItems: number;
    estimatedTimeRemaining: number; // 초 단위
  } | null>(null);
  // 이미지 선택 모달 상태
  const [imageSelectionModal, setImageSelectionModal] = useState<{
    isOpen: boolean;
    imageUrls: string[];
    onSelect: (url: string) => void;
    title: string;
  } | null>(null);
  // 토글 상태
  const [isBrandStrategyExpanded, setIsBrandStrategyExpanded] = useState(false);
  const [isPromptConfigExpanded, setIsPromptConfigExpanded] = useState(false);
  const [isDateSummaryExpanded, setIsDateSummaryExpanded] = useState(false); // 날짜 발행 요약 토글 (기본 접힘)
  const [isWorkflowExpanded, setIsWorkflowExpanded] = useState(false); // 워크플로우 토글
  const [isVariationTestExpanded, setIsVariationTestExpanded] = useState(false); // 베리에이션 테스트 토글
  const [isVariationPreviewExpanded, setIsVariationPreviewExpanded] = useState(false); // 베리에이션 미리보기 토글

  // 오늘 날짜 계산
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    setTodayStr(dateStr);
    if (!selectedDate) {
      setSelectedDate(dateStr);
      // 오늘 날짜를 기본 선택으로 설정
      setSelectedDates([dateStr]);
    }
  }, []);

  // URL 파라미터에서 date 읽기
  useEffect(() => {
    if (router.isReady) {
      const { date } = router.query;
      if (date && typeof date === 'string') {
        // URL 파라미터에서 날짜를 읽어서 selectedDate 설정
        console.log('📅 URL에서 날짜 파라미터 읽기:', date);
        setSelectedDate(date);
        setSelectedDates([date]);
        // 해당 날짜의 데이터 로드
        loadCalendarData(date);
      }
    }
  }, [router.isReady, router.query]);

  // 날짜 범위 계산 함수
  const getDateRange = (mode: 'today' | 'week' | 'month' | 'list') => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();

    if (mode === 'list') {
      return []; // 목록 모드에서는 빈 배열 반환
    } else if (mode === 'today') {
      return [todayStr];
    } else if (mode === 'week') {
      // 이번 주 (월요일부터 일요일까지)
      const monday = new Date(today);
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // 월요일로 조정
      monday.setDate(diff);
      
      const dates = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        dates.push(`${y}-${m}-${d}`);
      }
      return dates;
    } else {
      // 이번 달
      const dates = [];
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const m = String(month + 1).padStart(2, '0');
        const d = String(i).padStart(2, '0');
        dates.push(`${year}-${m}-${d}`);
      }
      return dates;
    }
  };

  // 저장된 생성 옵션 로드
  useEffect(() => {
    const savedOptions = localStorage.getItem('kakaoGenerationOptions');
    if (savedOptions) {
      try {
        setGenerationOptions(JSON.parse(savedOptions));
      } catch (e) {
        console.error('생성 옵션 로드 실패:', e);
      }
    }
  }, []);

  // 캘린더 데이터 로드 함수
  const loadCalendarData = async (targetDate?: string) => {
    try {
      setLoading(true);
      // 선택된 날짜가 있으면 해당 날짜의 월 사용, 없으면 오늘 날짜 사용
      const dateToUse = targetDate || selectedDate || todayStr;
      const dateObj = dateToUse ? new Date(dateToUse) : new Date();
      const monthStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      const res = await fetch(`/api/kakao-content/calendar-load?month=${monthStr}`);
      const data = await res.json();
      
      if (data.success && data.calendarData) {
        setCalendarData(data.calendarData);
      } else {
        console.error('캘린더 로드 실패:', data.message);
        // Supabase가 비어있을 경우 JSON 파일로 폴백 시도
        try {
          const fallbackRes = await fetch(`/api/content-calendar/load?month=${monthStr}`);
          const fallbackData = await fallbackRes.json();
          if (fallbackData.success && fallbackData.calendar) {
            setCalendarData(fallbackData.calendar);
          }
        } catch (fallbackError) {
          console.error('폴백 로드 실패:', fallbackError);
        }
      }
    } catch (error) {
      console.error('캘린더 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 캘린더 데이터 로드 (초기 로드)
  useEffect(() => {
    loadCalendarData();
  }, []);

  // 선택된 날짜가 변경될 때 해당 월의 데이터 로드
  useEffect(() => {
    if (selectedDate) {
      const selectedDateObj = new Date(selectedDate);
      const selectedMonth = `${selectedDateObj.getFullYear()}-${String(selectedDateObj.getMonth() + 1).padStart(2, '0')}`;
      
      // 현재 로드된 월과 선택된 날짜의 월이 다르면 다시 로드
      if (!calendarData || calendarData.month !== selectedMonth) {
        loadCalendarData(selectedDate);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // 공통 저장 함수 (Supabase에 저장)
  const saveCalendarData = async (updatedData: CalendarData): Promise<void> => {
    try {
      setSaveStatus({ status: 'saving', message: '저장 중...' });
      const today = new Date();
      const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      
      const response = await fetch('/api/kakao-content/calendar-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: monthStr, calendarData: updatedData })
      });

      const result = await response.json();

      if (result.success) {
        // 부분 성공인 경우 경고 메시지 표시
        if (result.partialSuccess && result.errors && result.errors.length > 0) {
          setSaveStatus({ 
            status: 'success', 
            message: `저장 완료 (${result.savedCount || 0}개 성공, ${result.errors.length}개 실패)` 
          });
          console.warn('⚠️ 일부 데이터 저장 실패:', result.errors);
        } else {
          setSaveStatus({ 
            status: 'success', 
            message: `저장 완료 (${result.savedCount || 0}개 항목)` 
          });
        }
        // 3초 후 상태 초기화
        setTimeout(() => {
          setSaveStatus({ status: 'idle' });
        }, 3000);
        return;
      } else {
        // 모두 실패한 경우만 에러로 처리
        throw new Error(result.message || '저장 실패');
      }
    } catch (error: any) {
      console.error('캘린더 저장 오류:', error);
      setSaveStatus({ 
        status: 'error', 
        message: `저장 실패: ${error.message}` 
      });
      // 5초 후 상태 초기화
      setTimeout(() => {
        setSaveStatus({ status: 'idle' });
      }, 5000);
      throw error;
    }
  };

  // 선택된 날짜의 데이터 가져오기
  const getDateData = (date: string) => {
    if (!date) {
      // 날짜가 없을 때 기본 빈 구조 반환
      return {
        account1Profile: null,
        account2Profile: null,
        feed: null
      };
    }

    if (!calendarData) {
      // 캘린더 데이터가 없을 때 기본 빈 구조 반환
      return {
        account1Profile: null,
        account2Profile: null,
        feed: null
      };
    }

    // created 여부와 관계없이 해당 날짜 데이터 가져오기
    const account1Profile = calendarData.profileContent?.account1?.dailySchedule?.find(
      p => p.date === date
    );
    const account2Profile = calendarData.profileContent?.account2?.dailySchedule?.find(
      p => p.date === date
    );
    const feed = calendarData.kakaoFeed?.dailySchedule?.find(
      f => f.date === date
    );

    return {
      account1Profile: account1Profile || null,
      account2Profile: account2Profile || null,
      feed: feed || null
    };
  };

  // 선택된 날짜의 데이터
  const selectedDateData = getDateData(selectedDate || todayStr);
  
  // 보기 모드에 따른 데이터 목록
  const dateRange = getDateRange(viewMode);
  const dateDataList = dateRange.map(date => ({
    date,
    data: getDateData(date)
  })).filter(item => item.data !== null);

  // 발행 상태 체크 함수
  const getPublishStatus = (dateData: any) => {
    if (!dateData) return { status: 'empty', label: '데이터 없음', color: 'gray' };
    
    const hasProfile1 = dateData.account1Profile?.background?.imageUrl && 
                       dateData.account1Profile?.profile?.imageUrl && 
                       dateData.account1Profile?.message;
    const hasProfile2 = dateData.account2Profile?.background?.imageUrl && 
                       dateData.account2Profile?.profile?.imageUrl && 
                       dateData.account2Profile?.message;
    const hasFeed1 = dateData.feed?.account1?.imageUrl && dateData.feed?.account1?.caption;
    const hasFeed2 = dateData.feed?.account2?.imageUrl && dateData.feed?.account2?.caption;
    
    const isCreated = dateData.account1Profile?.created || dateData.account2Profile?.created;
    const isPublished = dateData.account1Profile?.status === 'published' || 
                       dateData.account2Profile?.status === 'published';
    
    if (isPublished) {
      return { status: 'published', label: '발행됨', color: 'green' };
    } else if (isCreated && hasProfile1 && hasProfile2 && hasFeed1 && hasFeed2) {
      return { status: 'ready', label: '발행 준비', color: 'blue' };
    } else if (hasProfile1 || hasProfile2 || hasFeed1 || hasFeed2) {
      return { status: 'partial', label: '부분 완료', color: 'yellow' };
    } else {
      return { status: 'empty', label: '미작성', color: 'gray' };
    }
  };

  // 이미지 생성 후 선택 모달 표시 헬퍼 함수
  const handleImageGenerationWithSelection = async (
    generateFn: () => Promise<{ imageUrls: string[], generatedPrompt?: string, paragraphImages?: any[] }>,
    title: string,
    onSelect: (url: string, prompt?: string) => void
  ): Promise<{ imageUrls: string[], generatedPrompt?: string, paragraphImages?: any[] }> => {
    const result = await generateFn();
    
    // 2개 이상 생성된 경우 선택 모달 표시
    if (result.imageUrls.length > 1 && generationOptions.imageCount > 1) {
      return new Promise((resolve) => {
        setImageSelectionModal({
          isOpen: true,
          imageUrls: result.imageUrls,
          title: title,
          onSelect: (selectedUrl: string) => {
            onSelect(selectedUrl, result.generatedPrompt);
            setImageSelectionModal(null);
            resolve({ imageUrls: [selectedUrl], generatedPrompt: result.generatedPrompt, paragraphImages: result.paragraphImages });
          }
        });
      });
    }
    
    // 1개만 생성된 경우 바로 반환
    onSelect(result.imageUrls[0], result.generatedPrompt);
    return { imageUrls: [result.imageUrls[0]], generatedPrompt: result.generatedPrompt, paragraphImages: result.paragraphImages };
  };

        // 골드톤 이미지 생성 (프롬프트도 반환)
        const handleGenerateGoldToneImage = async (type: 'background' | 'profile', prompt: string): Promise<{ imageUrls: string[], generatedPrompt?: string, paragraphImages?: any[] }> => {
    try {
      // 브랜드 전략 또는 저장된 프롬프트 설정 사용
      let brandStrategyConfig = {
        customerpersona: 'senior_fitting',
        customerChannel: 'local_customers',
        brandWeight: '높음',
        audienceTemperature: 'warm',
        audienceWeight: '높음'
      };

      // 저장된 프롬프트 설정이 있으면 사용
      if (selectedPromptConfig && savedConfigs[selectedPromptConfig]) {
        const config = savedConfigs[selectedPromptConfig].brandStrategy;
        brandStrategyConfig = {
          customerpersona: config.customerpersona || 'senior_fitting',
          customerChannel: config.customerChannel || 'local_customers',
          brandWeight: config.brandWeight || '높음',
          audienceTemperature: config.audienceTemperature || 'warm',
          audienceWeight: config.audienceWeight || '높음'
        };
      } else if (brandStrategy) {
        // 브랜드 전략이 설정되어 있으면 사용
        brandStrategyConfig = {
          customerpersona: brandStrategy.persona || 'senior_fitting',
          customerChannel: brandStrategy.channel || 'local_customers',
          brandWeight: brandStrategy.brandStrength || '높음',
          audienceTemperature: brandStrategy.audienceTemperature || 'warm',
          audienceWeight: '높음'
        };
      }

      // 카카오 전용 프롬프트 생성 (블로그 API와 분리)
      // 캘린더 JSON에 상세 프롬프트가 있으면 우선 사용, 없으면 기본 프롬프트 사용
      const calendarPrompt = type === 'background' 
        ? selectedDateData?.account1Profile?.background?.prompt 
        : selectedDateData?.account1Profile?.profile?.prompt;
      const finalPrompt = calendarPrompt && calendarPrompt.length > 100 
        ? calendarPrompt  // 상세 프롬프트가 있으면 사용
        : prompt;  // 없으면 기본 프롬프트 사용
      
      const weeklyTheme = calendarData?.profileContent?.account1?.weeklyThemes?.week1 || '비거리의 감성 – 스윙과 마음의 연결';
      const prompts = await generateKakaoImagePrompts({
        prompt: finalPrompt,
        accountType: 'account1',
        type: type,
        brandStrategy: brandStrategyConfig,
        weeklyTheme: weeklyTheme,
        date: selectedDate || todayStr
      });

      // 메타데이터와 함께 이미지 생성
      const response = await fetch('/api/kakao-content/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompts: prompts,
          imageCount: generationOptions.imageCount, // 생성 개수 전달
          metadata: {
            account: 'account1',
            type: type,
            date: selectedDate || todayStr,
            message: selectedDateData?.account1Profile?.message || ''
          }
        })
      });
      
      // 응답이 JSON인지 확인
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ 서버 응답이 JSON이 아닙니다:', text.substring(0, 200));
        throw new Error(`서버 오류: ${response.status} ${response.statusText}`);
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '알 수 없는 오류', details: '' }));
        // 크레딧 부족 에러인 경우 명확한 메시지 표시
        const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}`;
        const errorDetails = errorData.details || '';
        throw new Error(errorDetails ? `${errorMessage}\n${errorDetails}` : errorMessage);
      }
      
      const data = await response.json();
      const imageUrls = data.imageUrls || [];
      const generatedPrompt = data.generatedPrompts?.[0] || prompts[0]?.prompt;
      const paragraphImages = data.paragraphImages || [];

      return { imageUrls, generatedPrompt, paragraphImages };
    } catch (error: any) {
      throw new Error(`골드톤 이미지 생성 실패: ${error.message}`);
    }
  };

        // 블랙톤 이미지 생성 (프롬프트도 반환)
        const handleGenerateBlackToneImage = async (type: 'background' | 'profile', prompt: string): Promise<{ imageUrls: string[], generatedPrompt?: string, paragraphImages?: any[] }> => {
    try {
      // 브랜드 전략 또는 저장된 프롬프트 설정 사용
      let brandStrategyConfig = {
        customerpersona: 'tech_enthusiast',
        customerChannel: 'local_customers',
        brandWeight: '중간',
        audienceTemperature: 'warm'
      };

      // 저장된 프롬프트 설정이 있으면 사용
      if (selectedPromptConfig && savedConfigs[selectedPromptConfig]) {
        const config = savedConfigs[selectedPromptConfig].brandStrategy;
        brandStrategyConfig = {
          customerpersona: config.customerpersona || 'tech_enthusiast',
          customerChannel: config.customerChannel || 'local_customers',
          brandWeight: config.brandWeight || '중간',
          audienceTemperature: config.audienceTemperature || 'warm'
        };
      } else if (brandStrategy) {
        // 브랜드 전략이 설정되어 있으면 사용
        brandStrategyConfig = {
          customerpersona: brandStrategy.persona || 'tech_enthusiast',
          customerChannel: brandStrategy.channel || 'local_customers',
          brandWeight: brandStrategy.brandStrength || '중간',
          audienceTemperature: brandStrategy.audienceTemperature || 'warm'
        };
      }

      // 카카오 전용 프롬프트 생성 (블로그 API와 분리)
      // 캘린더 JSON에 상세 프롬프트가 있으면 우선 사용, 없으면 기본 프롬프트 사용
      const calendarPrompt = type === 'background' 
        ? selectedDateData?.account2Profile?.background?.prompt 
        : selectedDateData?.account2Profile?.profile?.prompt;
      const finalPrompt = calendarPrompt && calendarPrompt.length > 100 
        ? calendarPrompt  // 상세 프롬프트가 있으면 사용
        : prompt;  // 없으면 기본 프롬프트 사용
      
      const weeklyTheme = calendarData?.profileContent?.account2?.weeklyThemes?.week1 || '비거리의 감성 – 스윙과 마음의 연결';
      const prompts = await generateKakaoImagePrompts({
        prompt: finalPrompt,
        accountType: 'account2',
        type: type,
        brandStrategy: brandStrategyConfig,
        weeklyTheme: weeklyTheme,
        date: selectedDate || todayStr
      });

      // 메타데이터와 함께 이미지 생성
      const response = await fetch('/api/kakao-content/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompts: prompts,
          imageCount: generationOptions.imageCount, // 생성 개수 전달
          metadata: {
            account: 'account2',
            type: type,
            date: selectedDate || todayStr,
            message: selectedDateData?.account2Profile?.message || ''
          }
        })
      });
      
      // 응답이 JSON인지 확인
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ 서버 응답이 JSON이 아닙니다:', text.substring(0, 200));
        throw new Error(`서버 오류: ${response.status} ${response.statusText}`);
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '알 수 없는 오류', details: '' }));
        // 크레딧 부족 에러인 경우 명확한 메시지 표시
        const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}`;
        const errorDetails = errorData.details || '';
        throw new Error(errorDetails ? `${errorMessage}\n${errorDetails}` : errorMessage);
      }
      
      const data = await response.json();
      const imageUrls = data.imageUrls || [];
      const generatedPrompt = data.generatedPrompts?.[0] || prompts[0]?.prompt;
      const paragraphImages = data.paragraphImages || [];

      return { imageUrls, generatedPrompt, paragraphImages };
    } catch (error: any) {
      throw new Error(`블랙톤 이미지 생성 실패: ${error.message}`);
    }
  };

        // 피드 이미지 생성 (프롬프트도 반환, A/B 테스트 결과 포함)
        const handleGenerateFeedImage = async (prompt: string, tone: 'gold' | 'black'): Promise<{ imageUrls: string[], generatedPrompt?: string, paragraphImages?: any[] }> => {
    try {
      // 브랜드 전략 또는 저장된 프롬프트 설정 사용
      let brandStrategyConfig = {
        customerpersona: tone === 'gold' ? 'senior_fitting' : 'tech_enthusiast',
        customerChannel: 'local_customers',
        brandWeight: '중간',
        audienceTemperature: 'warm'
      };

      // 저장된 프롬프트 설정이 있으면 사용
      if (selectedPromptConfig && savedConfigs[selectedPromptConfig]) {
        const config = savedConfigs[selectedPromptConfig].brandStrategy;
        brandStrategyConfig = {
          customerpersona: config.customerpersona || (tone === 'gold' ? 'senior_fitting' : 'tech_enthusiast'),
          customerChannel: config.customerChannel || 'local_customers',
          brandWeight: config.brandWeight || '중간',
          audienceTemperature: config.audienceTemperature || 'warm'
        };
      } else if (brandStrategy) {
        // 브랜드 전략이 설정되어 있으면 사용
        brandStrategyConfig = {
          customerpersona: brandStrategy.persona || (tone === 'gold' ? 'senior_fitting' : 'tech_enthusiast'),
          customerChannel: brandStrategy.channel || 'local_customers',
          brandWeight: brandStrategy.brandStrength || '중간',
          audienceTemperature: brandStrategy.audienceTemperature || 'warm'
        };
      }

      // 카카오 전용 프롬프트 생성 (블로그 API와 분리)
      const account = tone === 'gold' ? 'account1' : 'account2';
      const weeklyTheme = calendarData?.profileContent?.[account]?.weeklyThemes?.week1 || '비거리의 감성 – 스윙과 마음의 연결';
      const prompts = await generateKakaoImagePrompts({
        prompt: prompt,
        accountType: account,
        type: 'feed',
        brandStrategy: brandStrategyConfig,
        weeklyTheme: weeklyTheme,
        date: selectedDate || todayStr
      });

      // 메타데이터와 함께 이미지 생성
      const response = await fetch('/api/kakao-content/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompts: prompts,
          imageCount: generationOptions.imageCount, // 생성 개수 전달
          metadata: {
            account: account,
            type: 'feed',
            date: selectedDate || todayStr,
            message: tone === 'gold' 
              ? (selectedDateData?.feed?.account1?.caption || '')
              : (selectedDateData?.feed?.account2?.caption || '')
          }
        })
      });
      
      // 응답이 JSON인지 확인
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ 서버 응답이 JSON이 아닙니다:', text.substring(0, 200));
        throw new Error(`서버 오류: ${response.status} ${response.statusText}`);
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '알 수 없는 오류', details: '' }));
        // 크레딧 부족 에러인 경우 명확한 메시지 표시
        const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}`;
        const errorDetails = errorData.details || '';
        throw new Error(errorDetails ? `${errorMessage}\n${errorDetails}` : errorMessage);
      }
      
      const data = await response.json();
      const imageUrls = data.imageUrls || [];
      const generatedPrompt = data.generatedPrompts?.[0] || prompts[0]?.prompt;
      const paragraphImages = data.paragraphImages || []; // A/B 테스트 결과 포함

      return { imageUrls, generatedPrompt, paragraphImages };
    } catch (error: any) {
      throw new Error(`피드 이미지 생성 실패: ${error.message}`);
    }
  };

  // 계정 1 자동 생성 (API 호출 방식)
  const handleAccount1AutoCreate = async () => {
    const currentDate = selectedDate || todayStr;
    
    try {
      setIsCreatingAll(true);
      
      // API를 통해 자동 생성
      const success = await generateForSingleDate(currentDate, 'account1', false);
      
      if (success) {
        // 생성 완료 후 캘린더 데이터 다시 로드
        await loadCalendarData();
        alert('✅ 계정 1 자동 생성 완료!\n\n- Supabase에 저장됨 (로컬/배포 동기화)\n\n실제 카카오톡 업로드는 수동 또는 자동화 스크립트로 진행하세요.');
      } else {
        alert('⚠️ 자동 생성이 완료되었지만 일부 이미지가 생성되지 않았을 수 있습니다.');
      }
    } catch (error: any) {
      console.error('계정 1 자동 생성 오류:', error);
      alert(`자동 생성 실패: ${error.message}`);
    } finally {
      setIsCreatingAll(false);
    }
  };

  // 계정 2 자동 생성 (API 호출 방식)
  const handleAccount2AutoCreate = async () => {
    const currentDate = selectedDate || todayStr;
    
    try {
      setIsCreatingAll(true);
      
      // API를 통해 자동 생성
      const success = await generateForSingleDate(currentDate, 'account2', false);
      
      if (success) {
        // 생성 완료 후 캘린더 데이터 다시 로드
        await loadCalendarData();
        alert('✅ 계정 2 자동 생성 완료!\n\n- Supabase에 저장됨 (로컬/배포 동기화)\n\n실제 카카오톡 업로드는 수동 또는 자동화 스크립트로 진행하세요.');
      } else {
        alert('⚠️ 자동 생성이 완료되었지만 일부 이미지가 생성되지 않았을 수 있습니다.');
      }
    } catch (error: any) {
      console.error('계정 2 자동 생성 오류:', error);
      alert(`자동 생성 실패: ${error.message}`);
    } finally {
      setIsCreatingAll(false);
    }
  };

  // 단일 날짜에 대한 자동 생성 (API 호출)
  const generateForSingleDate = async (
    date: string, 
    account: 'account1' | 'account2', 
    forceRegenerate: boolean = false,
    onProgress?: (type: 'background' | 'profile' | 'feed') => void
  ): Promise<boolean> => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
        (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
      
      const apiEndpoint = account === 'account1' 
        ? '/api/kakao-content/auto-create-account1'
        : '/api/kakao-content/auto-create-account2';
      
      const response = await fetch(`${baseUrl}${apiEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, forceRegenerate, brandStrategy: brandStrategy })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // 실제 생성 결과 확인 및 타입별 진행 상황 추적
      if (data.success && data.results) {
        const results = data.results;
        const types: Array<'background' | 'profile' | 'feed'> = ['background', 'profile', 'feed'];
        
        // 각 타입별로 진행 상황 업데이트
        for (const type of types) {
          if (results[type]?.success && results[type]?.imageUrl) {
            // 각 타입 생성 완료 시 콜백 호출
            if (onProgress) {
              onProgress(type);
            }
          }
        }
        
        const hasNewImages = 
          (results.background?.success && results.background?.imageUrl) ||
          (results.profile?.success && results.profile?.imageUrl) ||
          (results.feed?.success && results.feed?.imageUrl);
        
        // 기존 이미지가 있는지 확인 (forceRegenerate가 아닌 경우)
        if (!forceRegenerate) {
          const existingImages = {
            background: results.background?.imageUrl && !results.background?.error,
            profile: results.profile?.imageUrl && !results.profile?.error,
            feed: results.feed?.imageUrl && !results.feed?.error
          };
          
          // 모든 이미지가 이미 존재하는 경우 경고 메시지
          if (existingImages.background && existingImages.profile && existingImages.feed) {
            console.log(`⚠️ ${date} ${account}: 모든 이미지가 이미 생성되어 있습니다. 재생성하려면 재생성 버튼을 사용하세요.`);
          }
        }
        
        if (!hasNewImages) {
          const errors = [];
          if (results.background?.error) errors.push(`배경: ${results.background.error}`);
          if (results.profile?.error) errors.push(`프로필: ${results.profile.error}`);
          if (results.feed?.error) errors.push(`피드: ${results.feed.error}`);
          
          throw new Error(`이미지 생성 실패: ${errors.join(', ') || '알 수 없는 오류'}`);
        }
      }
      
      return data.success === true;
    } catch (error: any) {
      console.error(`${date} ${account} 생성 실패:`, error);
      throw error;
    }
  };

  // 선택된 날짜들에 대한 순차 생성
  const handleSelectedDatesAutoCreate = async (customDates?: string[]) => {
    // 커스텀 날짜가 제공되면 사용, 없으면 선택된 날짜 또는 현재 날짜 사용
    let datesToGenerate: string[];
    
    if (customDates) {
      // 커스텀 날짜 사용 (이번 주 생성 등)
      datesToGenerate = customDates;
    } else if (selectedDates.length > 0) {
      // selectedDates가 있으면 사용
      datesToGenerate = selectedDates;
    } else {
      // 둘 다 없으면 selectedDate 또는 todayStr 사용
      datesToGenerate = [selectedDate || todayStr];
    }

    // 최대 생성 개수 제한 (7일)
    if (datesToGenerate.length > 7) {
      const confirm = window.confirm(
        `선택된 날짜가 ${datesToGenerate.length}개입니다. 최대 7개까지만 생성 가능합니다.\n\n처음 7개만 생성하시겠습니까?`
      );
      if (!confirm) return;
      datesToGenerate.splice(7);
    }

    if (datesToGenerate.length === 0) {
      alert('생성할 날짜를 선택해주세요.');
      return;
    }

    try {
      setIsCreatingAll(true);
      setGenerationProgress({
        isRunning: true,
        currentDate: null,
        currentAccount: null,
        currentType: null,
        totalItems: datesToGenerate.length * 2 * 3, // 날짜 × 계정 × 타입(배경, 프로필, 피드)
        completedItems: 0,
        estimatedTimeRemaining: datesToGenerate.length * 2 * 3 * 20 // 타입당 약 20초
      });

      let successCount = 0;
      let errorCount = 0;
      const errors: Array<{ date: string; account: string; error: string }> = [];

      // 날짜별로 순차 생성
      for (let i = 0; i < datesToGenerate.length; i++) {
        const date = datesToGenerate[i];
        
        // 날짜가 캘린더에 없으면 먼저 생성
        const dateData = getDateData(date);
        if (!dateData) {
          console.log(`📅 날짜 ${date}가 캘린더에 없습니다. 기본 구조를 생성합니다...`);
          
          // 기본 구조 생성
          const updated = { ...calendarData! };
          
          // Account1 기본 구조
          if (!updated.profileContent.account1.dailySchedule.find((s: any) => s.date === date)) {
            updated.profileContent.account1.dailySchedule.push({
              date,
              background: { image: '', imageUrl: null, prompt: '', basePrompt: null, status: 'planned' },
              profile: { image: '', imageUrl: null, prompt: '', basePrompt: null, status: 'planned' },
              message: '',
              status: 'planned',
              created: false
            });
          }
          
          // Account2 기본 구조
          if (!updated.profileContent.account2.dailySchedule.find((s: any) => s.date === date)) {
            updated.profileContent.account2.dailySchedule.push({
              date,
              background: { image: '', imageUrl: null, prompt: '', basePrompt: null, status: 'planned' },
              profile: { image: '', imageUrl: null, prompt: '', basePrompt: null, status: 'planned' },
              message: '',
              status: 'planned',
              created: false
            });
          }
          
          // Feed 기본 구조
          if (!updated.kakaoFeed.dailySchedule.find((s: any) => s.date === date)) {
            updated.kakaoFeed.dailySchedule.push({
              date,
              account1: {
                imageCategory: '',
                imagePrompt: '',
                caption: '',
                imageUrl: null,
                url: null,
                status: 'planned',
                created: false
              } as any, // basePrompt는 타입에 없지만 실제로는 사용됨
              account2: {
                imageCategory: '',
                imagePrompt: '',
                caption: '',
                imageUrl: null,
                url: null,
                status: 'planned',
                created: false
              } as any // basePrompt는 타입에 없지만 실제로는 사용됨
            });
          }
          
          // Supabase에 저장
          try {
            await saveCalendarData(updated);
            setCalendarData(updated);
            console.log(`✅ 날짜 ${date} 기본 구조 생성 완료`);
          } catch (error: any) {
            console.error(`❌ 날짜 ${date} 기본 구조 생성 실패:`, error);
            errorCount++;
            errors.push({ date, account: 'system', error: `날짜 생성 실패: ${error.message}` });
            continue; // 다음 날짜로
          }
        }
        
        // Account1 생성
        setGenerationProgress(prev => prev ? {
          ...prev,
          currentDate: date,
          currentAccount: 'account1',
          currentType: null,
          completedItems: prev.completedItems,
          estimatedTimeRemaining: (prev.totalItems - prev.completedItems) * 20
        } : null);

        try {
          await generateForSingleDate(date, 'account1', false, (type) => {
            // 각 타입 생성 완료 시 진행 상황 업데이트
            setGenerationProgress(prev => prev ? {
              ...prev,
              currentType: type,
              completedItems: prev.completedItems + 1,
              estimatedTimeRemaining: (prev.totalItems - prev.completedItems - 1) * 20
            } : null);
          });
          successCount++;
          
          // 1초 대기 (API 부하 방지)
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error: any) {
          errorCount++;
          errors.push({ date, account: 'account1', error: error.message });
          // 실패해도 3개 타입 모두 실패한 것으로 간주하고 진행 상황 업데이트
          setGenerationProgress(prev => prev ? {
            ...prev,
            completedItems: prev.completedItems + 3
          } : null);
        }

        // Account2 생성
        setGenerationProgress(prev => prev ? {
          ...prev,
          currentDate: date,
          currentAccount: 'account2',
          currentType: null,
          estimatedTimeRemaining: (prev.totalItems - prev.completedItems) * 20
        } : null);

        try {
          await generateForSingleDate(date, 'account2', false, (type) => {
            // 각 타입 생성 완료 시 진행 상황 업데이트
            setGenerationProgress(prev => prev ? {
              ...prev,
              currentType: type,
              completedItems: prev.completedItems + 1,
              estimatedTimeRemaining: (prev.totalItems - prev.completedItems - 1) * 20
            } : null);
          });
          successCount++;
          
          // 1초 대기 (API 부하 방지)
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error: any) {
          errorCount++;
          errors.push({ date, account: 'account2', error: error.message });
          // 실패해도 3개 타입 모두 실패한 것으로 간주하고 진행 상황 업데이트
          setGenerationProgress(prev => prev ? {
            ...prev,
            completedItems: prev.completedItems + 3
          } : null);
        }
      }

      // 캘린더 데이터 다시 로드
      const today = new Date();
      const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      const res = await fetch(`/api/kakao-content/calendar-load?month=${monthStr}`);
      const data = await res.json();
      if (data.success && data.calendarData) {
        setCalendarData(data.calendarData);
      }

      // 결과 알림
      let message = `✅ 생성 완료!\n\n성공: ${successCount}개\n실패: ${errorCount}개`;
      if (errors.length > 0) {
        message += `\n\n실패한 항목:\n${errors.slice(0, 5).map(e => `- ${e.date} ${e.account}: ${e.error}`).join('\n')}`;
        if (errors.length > 5) {
          message += `\n... 외 ${errors.length - 5}개`;
        }
      }
      alert(message);

    } catch (error: any) {
      alert(`생성 실패: ${error.message}`);
    } finally {
      setIsCreatingAll(false);
      setGenerationProgress(null);
    }
  };

  // 전체 자동 생성 (현재 날짜만)
  const handleAllAutoCreate = async () => {
    // 현재 날짜만 생성
    setSelectedDates([selectedDate || todayStr]);
    await handleSelectedDatesAutoCreate();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600">캘린더 데이터 로딩 중...</p>
            {todayStr && (
              <p className="text-sm text-gray-400 mt-2">날짜: {todayStr}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 데이터가 없어도 UI는 표시 (베리에이션 미리보기와 계정 자동 생성 버튼 사용 가능)
  // 경고 메시지만 표시하고 계속 진행

  // 배포 상태 업데이트 핸들러
  const handlePublishStatusChange = async (account: 'account1' | 'account2', status: 'created' | 'published') => {
    const updated = { ...calendarData! };
    const currentDate = selectedDate || todayStr;
    const profileIndex = updated.profileContent[account].dailySchedule.findIndex(
      p => p.date === currentDate
    );
    
    if (profileIndex >= 0) {
      const scheduleItem = updated.profileContent[account].dailySchedule[profileIndex] as any;
      scheduleItem.status = status;
      if (status === 'published') {
        scheduleItem.publishedAt = new Date().toISOString();
      } else {
        delete scheduleItem.publishedAt;
      }
    }
    
    setCalendarData(updated);

    // 캘린더 파일 저장
    await saveCalendarData(updated);

    // 저장 후 최신 데이터 다시 로드 (리스트 뷰 동기화를 위해)
    try {
      const today = new Date();
      const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      const res = await fetch(`/api/kakao-content/calendar-load?month=${monthStr}`);
      const data = await res.json();
      if (data.success && data.calendarData) {
        setCalendarData(data.calendarData);
      }
    } catch (error) {
      console.error('캘린더 데이터 새로고침 실패:', error);
    }
  };

  // 계정 1 데이터 변환
  const account1ProfileData = selectedDateData?.account1Profile ? {
    background: {
      image: selectedDateData.account1Profile.background?.image || '',
      prompt: selectedDateData.account1Profile.background?.prompt || '',
      imageUrl: (selectedDateData.account1Profile.background as any)?.imageUrl
    },
    profile: {
      image: selectedDateData.account1Profile.profile?.image || '',
      prompt: selectedDateData.account1Profile.profile?.prompt || '',
      imageUrl: (selectedDateData.account1Profile.profile as any)?.imageUrl
    },
    message: selectedDateData.account1Profile.message || ''
  } : {
    background: { image: '', prompt: '', imageUrl: undefined },
    profile: { image: '', prompt: '', imageUrl: undefined },
    message: ''
  };

  // 계정 2 데이터 변환
  const account2ProfileData = selectedDateData?.account2Profile ? {
    background: {
      image: selectedDateData.account2Profile.background?.image || '',
      prompt: selectedDateData.account2Profile.background?.prompt || '',
      imageUrl: (selectedDateData.account2Profile.background as any)?.imageUrl
    },
    profile: {
      image: selectedDateData.account2Profile.profile?.image || '',
      prompt: selectedDateData.account2Profile.profile?.prompt || '',
      imageUrl: (selectedDateData.account2Profile.profile as any)?.imageUrl
    },
    message: selectedDateData.account2Profile.message || ''
  } : {
    background: { image: '', prompt: '', imageUrl: undefined },
    profile: { image: '', prompt: '', imageUrl: undefined },
    message: ''
  };

  // 배포 상태 가져오기
  const account1PublishStatus = (selectedDateData?.account1Profile as any)?.status || 'created';
  const account2PublishStatus = (selectedDateData?.account2Profile as any)?.status || 'created';
  const account1PublishedAt = (selectedDateData?.account1Profile as any)?.publishedAt;
  const account2PublishedAt = (selectedDateData?.account2Profile as any)?.publishedAt;

  // 피드 데이터 변환
  const account1FeedData = selectedDateData?.feed?.account1 ? {
    imageCategory: selectedDateData.feed.account1.imageCategory || '',
    imagePrompt: selectedDateData.feed.account1.imagePrompt || '',
    caption: selectedDateData.feed.account1.caption || '',
    imageUrl: (selectedDateData.feed.account1 as any)?.imageUrl,
    url: (selectedDateData.feed.account1 as any)?.url
  } : {
    imageCategory: '',
    imagePrompt: '',
    caption: '',
    imageUrl: undefined,
    url: undefined
  };

  const account2FeedData = selectedDateData?.feed?.account2 ? {
    imageCategory: selectedDateData.feed.account2.imageCategory || '',
    imagePrompt: selectedDateData.feed.account2.imagePrompt || '',
    caption: selectedDateData.feed.account2.caption || '',
    imageUrl: (selectedDateData.feed.account2 as any)?.imageUrl,
    url: (selectedDateData.feed.account2 as any)?.url
  } : {
    imageCategory: '',
    imagePrompt: '',
    caption: '',
    imageUrl: undefined,
    url: undefined
  };

  // 로딩 중일 때
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>카카오톡 콘텐츠 생성 - MASGOLF</title>
        </Head>
        <AdminNav />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-4">
              <Loader className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-gray-600">캘린더 데이터를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // calendarData가 없을 때
  if (!calendarData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>카카오톡 콘텐츠 생성 - MASGOLF</title>
        </Head>
        <AdminNav />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-yellow-900 mb-2">데이터를 불러올 수 없습니다</h2>
            <p className="text-yellow-800">캘린더 데이터가 없습니다. 페이지를 새로고침하거나 관리자에게 문의하세요.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>카카오톡 콘텐츠 생성 - MASGOLF</title>
      </Head>
      <AdminNav />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                카카오톡 콘텐츠 생성
              </h1>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-5 h-5" />
                <span>오늘 날짜: {todayStr}</span>
              </div>
            </div>
          </div>
          
          {/* 날짜 선택 및 보기 모드 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">보기 모드:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setViewMode('today');
                        setSelectedDate(todayStr);
                      }}
                      className={`px-3 py-1 rounded text-sm ${
                        viewMode === 'today' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      오늘
                    </button>
                    <button
                      onClick={() => setViewMode('week')}
                      className={`px-3 py-1 rounded text-sm ${
                        viewMode === 'week' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      이번 주
                    </button>
                    <button
                      onClick={() => setViewMode('month')}
                      className={`px-3 py-1 rounded text-sm ${
                        viewMode === 'month' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      이번 달
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-1 rounded text-sm ${
                        viewMode === 'list' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      목록
                    </button>
                  </div>
                </div>
                
                {viewMode === 'today' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={selectedDate || todayStr}
                      onChange={(e) => {
                        const newDate = e.target.value;
                        setSelectedDate(newDate);
                        // 선택된 날짜가 변경되면 selectedDates도 업데이트
                        setSelectedDates([newDate]);
                      }}
                      className="px-3 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                )}
              </div>

              {/* 생성 옵션 설정 및 자동 생성 버튼 */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowGenerationOptions(true)}
                  disabled={isCreatingAll}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  <Settings className="w-4 h-4" />
                  생성 옵션 설정
                </button>
                {viewMode === 'week' && (
                  <button
                    onClick={async () => {
                      const weekDates = getDateRange('week');
                      setSelectedDates(weekDates);
                      await handleSelectedDatesAutoCreate(weekDates);
                    }}
                    disabled={isCreatingAll}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
                    title="이번 주 전체 생성 (최대 7일)"
                  >
                    {isCreatingAll ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        생성 중...
                      </>
                    ) : (
                      <>
                        <Rocket className="w-4 h-4" />
                        이번 주 생성
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={() => handleSelectedDatesAutoCreate()}
                  disabled={isCreatingAll}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                  title={selectedDates.length > 0 
                    ? `${selectedDates.length}개 날짜 생성 (최대 7개)` 
                    : '현재 날짜 생성'}
                >
                  {isCreatingAll ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      생성 중...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4" />
                      {selectedDates.length > 0 
                        ? `선택된 날짜 생성 (${selectedDates.length}개)`
                        : '오늘 날짜 생성'}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 생성 진행 상황 표시 */}
            {generationProgress && generationProgress.isRunning && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Loader className="w-5 h-5 animate-spin text-blue-600" />
                    <span className="font-medium text-blue-900">생성 진행 중...</span>
                  </div>
                  <span className="text-sm text-blue-700">
                    {generationProgress.completedItems} / {generationProgress.totalItems} 완료
                  </span>
                </div>
                <div className="mb-2">
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(generationProgress.completedItems / generationProgress.totalItems) * 100}%` 
                      }}
                    />
                  </div>
                </div>
                {generationProgress.currentDate && (
                  <div className="text-sm text-blue-800">
                    <div>현재 처리 중: {generationProgress.currentDate}</div>
                    <div>
                      계정: {generationProgress.currentAccount === 'account1' ? '대표폰 (시니어)' : '업무폰 (테크)'}
                    </div>
                    {generationProgress.currentType && (
                      <div>
                        타입: {
                          generationProgress.currentType === 'background' ? '배경 이미지' :
                          generationProgress.currentType === 'profile' ? '프로필 이미지' :
                          '피드 이미지'
                        }
                      </div>
                    )}
                    <div className="text-xs text-blue-600 mt-1">
                      예상 남은 시간: 약 {Math.ceil(generationProgress.estimatedTimeRemaining / 60)}분
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 데이터 없음 경고 메시지 */}
            {(!selectedDateData?.account1Profile || !selectedDateData?.account2Profile || !selectedDateData?.feed) && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 font-medium">
                  ⚠️ 선택된 날짜({selectedDate || todayStr})의 캘린더 데이터가 없습니다.
                </p>
                <p className="text-sm text-yellow-700 mt-2">
                  {!selectedDateData?.account1Profile ? '• 계정 1 프로필 데이터가 없습니다. ' : ''}
                  {!selectedDateData?.account2Profile ? '• 계정 2 프로필 데이터가 없습니다. ' : ''}
                  {!selectedDateData?.feed ? '• 피드 데이터가 없습니다. ' : ''}
                </p>
                <p className="text-xs text-yellow-600 mt-2">
                  💡 "계정 자동 생성" 버튼을 클릭하여 데이터를 생성할 수 있습니다.
                </p>
              </div>
            )}

            {/* 베리에이션 미리보기 및 테스트 섹션 */}
            <div className="mt-4 space-y-4">
              {/* 베리에이션 미리보기 */}
              <div className="bg-white rounded-lg shadow-lg border border-gray-200">
                <button
                  onClick={() => setIsVariationPreviewExpanded(!isVariationPreviewExpanded)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isVariationPreviewExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    )}
                    <Eye className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-900">베리에이션 미리보기</span>
                  </div>
                </button>
                {isVariationPreviewExpanded && (
                  <div className="p-4 border-t border-gray-200">
                    <VariationPreview
                      selectedDate={selectedDate || todayStr}
                      accountType={calendarData?.profileContent?.account1 ? 'account1' : 'account2'}
                      onDateChange={(date) => {
                        setSelectedDate(date);
                        setSelectedDates([date]);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* 베리에이션 테스트 */}
              <div className="bg-white rounded-lg shadow-lg border border-gray-200">
                <button
                  onClick={() => setIsVariationTestExpanded(!isVariationTestExpanded)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isVariationTestExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    )}
                    <TestTube className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-gray-900">베리에이션 테스트</span>
                  </div>
                </button>
                {isVariationTestExpanded && (
                  <div className="p-4 border-t border-gray-200">
                    <VariationTestPanel
                      onTestComplete={(results) => {
                        console.log('베리에이션 테스트 완료:', results);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 워크플로우 시각화 (보기 모드 선택 버튼 바로 아래) */}
            {viewMode !== 'list' && selectedDate && (
              <div className="mt-4 bg-white rounded-lg shadow-lg border border-gray-200">
                <button
                  onClick={() => setIsWorkflowExpanded(!isWorkflowExpanded)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isWorkflowExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    )}
                    <Sparkles className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">워크플로우 시각화</h3>
                    <span className="text-sm text-gray-500">({selectedDate || todayStr})</span>
                  </div>
                </button>
                
                {isWorkflowExpanded && (
                  <div className="p-4 border-t border-gray-200">
                    <WorkflowVisualization
                      calendarData={calendarData}
                      selectedDate={selectedDate || todayStr}
                      onUpdate={async (updates: any) => {
                        if (!calendarData) return;
                        const updated = { ...calendarData };
                        const currentDate = updates.date || selectedDate || todayStr;
                        const account = updates.account;
                        const type = updates.type;

                        if (type === 'background' || type === 'profile') {
                          const profileIndex = updated.profileContent[account].dailySchedule.findIndex(
                            (p: any) => p.date === currentDate
                          );
                          if (profileIndex >= 0) {
                            if (updates[`${type}_base_prompt`]) {
                              updated.profileContent[account].dailySchedule[profileIndex][type].basePrompt = updates[`${type}_base_prompt`];
                            }
                            if (updates[`${type}_prompt`]) {
                              updated.profileContent[account].dailySchedule[profileIndex][type].prompt = updates[`${type}_prompt`];
                            }
                          }
                        } else if (type === 'feed') {
                          const feedIndex = updated.kakaoFeed.dailySchedule.findIndex(
                            (f: any) => f.date === currentDate
                          );
                          if (feedIndex >= 0) {
                            if (updates.base_prompt) {
                              updated.kakaoFeed.dailySchedule[feedIndex][account].basePrompt = updates.base_prompt;
                            }
                            if (updates.image_prompt) {
                              updated.kakaoFeed.dailySchedule[feedIndex][account].imagePrompt = updates.image_prompt;
                            }
                          }
                        }
                        setCalendarData(updated);
                        // 업데이트 후 즉시 저장
                        await saveCalendarData(updated);
                      }}
                      onSave={async () => {
                        // onUpdate에서 이미 저장하므로 빈 함수
                      }}
                    />
                  </div>
                )}
              </div>
            )}
            
            {/* 날짜 발행 요약 (토글 가능) */}
            {viewMode !== 'list' && (
              <div className="mt-4 bg-white rounded-lg shadow-lg border border-gray-200">
                <button
                  onClick={() => setIsDateSummaryExpanded(!isDateSummaryExpanded)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isDateSummaryExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    )}
                    <Calendar className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">날짜 발행 요약</h3>
                    {viewMode === 'today' && selectedDate && (
                      <span className="text-sm text-gray-500">({selectedDate})</span>
                    )}
                    {viewMode !== 'today' && dateDataList.length > 0 && (
                      <span className="text-sm text-gray-500">({dateDataList.length}개 날짜)</span>
                    )}
                  </div>
                </button>
                
                {isDateSummaryExpanded && (
                  <div className="p-4 border-t border-gray-200">
                    {viewMode === 'today' ? (
                      <div className="text-sm text-gray-600">
                        <p>선택된 날짜: <strong>{selectedDate || todayStr}</strong></p>
                        {selectedDateData && (
                          <div className="mt-2 space-y-1">
                            <div>Account1 상태: {getPublishStatus(selectedDateData).label}</div>
                            <div>Account2 상태: {getPublishStatus(selectedDateData).label}</div>
                          </div>
                        )}
                      </div>
                    ) : dateDataList.length > 0 ? (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const allDates = dateDataList.map(({ date }) => date);
                                setSelectedDates(allDates);
                              }}
                              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            >
                              전체 선택
                            </button>
                            <button
                              onClick={() => setSelectedDates([])}
                              className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                            >
                              선택 해제
                            </button>
                            {selectedDates.length > 0 && (
                              <span className="text-xs text-blue-600 font-medium">
                                {selectedDates.length}개 선택됨
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                          {dateDataList.map(({ date, data }) => {
                            const status = getPublishStatus(data);
                            const isToday = date === todayStr;
                            const isSelected = selectedDates.includes(date);
                            return (
                              <div key={date} className="relative">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedDates([...selectedDates, date]);
                                    } else {
                                      setSelectedDates(selectedDates.filter(d => d !== date));
                                    }
                                  }}
                                  className="absolute top-1 left-1 z-10 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <button
                                  onClick={() => {
                                    setSelectedDate(date);
                                    setViewMode('today');
                                  }}
                                  className={`w-full p-2 rounded text-xs border-2 ${
                                    isToday ? 'border-blue-500' : 'border-gray-200'
                                  } ${
                                    isSelected ? 'ring-2 ring-blue-400 ring-offset-1' : ''
                                  } ${
                                    status.color === 'green' ? 'bg-green-50' :
                                    status.color === 'blue' ? 'bg-blue-50' :
                                    status.color === 'yellow' ? 'bg-yellow-50' :
                                    'bg-gray-50'
                                  } hover:bg-gray-100`}
                                  title={`${date}: ${status.label}`}
                                >
                                  <div className="font-medium">{new Date(date).getDate()}일</div>
                                  <div className={`text-xs ${
                                    status.color === 'green' ? 'text-green-600' :
                                    status.color === 'blue' ? 'text-blue-600' :
                                    status.color === 'yellow' ? 'text-yellow-600' :
                                    'text-gray-500'
                                  }`}>
                                    {status.label}
                                  </div>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">날짜 데이터가 없습니다.</p>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* 브랜드 전략 및 프롬프트 설정 - 상단 버튼 형태 */}
        <div className="mb-4 flex items-center gap-3 flex-wrap">
          {/* 브랜드 전략 버튼 */}
          <button
            onClick={() => setIsBrandStrategyExpanded(!isBrandStrategyExpanded)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              brandStrategy
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
            }`}
          >
            <Settings className="w-4 h-4" />
            {brandStrategy ? (
              <span>
                브랜드 전략: {brandStrategy.contentType || '골프 정보'}
              </span>
            ) : (
              <span>브랜드 전략 설정</span>
            )}
            {isBrandStrategyExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {/* 프롬프트 설정 버튼 */}
          <button
            onClick={() => setIsPromptConfigExpanded(!isPromptConfigExpanded)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedPromptConfig && savedConfigs[selectedPromptConfig]
                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border border-yellow-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
            }`}
          >
            <Settings className="w-4 h-4" />
            {selectedPromptConfig && savedConfigs[selectedPromptConfig] ? (
              <span>
                프롬프트: {savedConfigs[selectedPromptConfig].name}
              </span>
            ) : (
              <span>프롬프트 설정</span>
            )}
            {isPromptConfigExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* 브랜드 전략 설정 패널 (토글) */}
        {isBrandStrategyExpanded && (
          <div className="mb-4 bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="p-6">
              <BrandStrategySelector
                onStrategyChange={(strategy) => {
                  setBrandStrategy(strategy);
                }}
                onApplyStrategy={async (strategy) => {
              setBrandStrategy(strategy);
              
              // 브랜드 전략 적용 시 프롬프트와 메시지 자동 생성
              const currentData = getDateData(selectedDate || todayStr);
              if (!currentData || !calendarData) {
                alert('캘린더 데이터가 없습니다.');
                return;
              }

              try {
                setIsCreatingAll(true);
                
                const weeklyTheme = (calendarData.profileContent.account1 as any).weeklyThemes?.week1 || '비거리의 감성 – 스윙과 마음의 연결';
                
                // 계정 1 프롬프트 및 메시지 생성
                if (currentData.account1Profile) {
                  // 배경 프롬프트 생성
                  const bgPromptRes = await fetch('/api/kakao-content/generate-prompt-message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      type: 'background',
                      accountType: 'account1',
                      brandStrategy: strategy,
                      weeklyTheme,
                      date: selectedDate || todayStr,
                      basePrompt: currentData.account1Profile.background.prompt
                    })
                  });
                  
                  if (bgPromptRes.ok) {
                    const bgData = await bgPromptRes.json();
                    if (bgData.success && bgData.data.prompt) {
                      currentData.account1Profile.background.prompt = bgData.data.prompt;
                    }
                  }
                  
                  // 프로필 프롬프트 생성
                  const profilePromptRes = await fetch('/api/kakao-content/generate-prompt-message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      type: 'profile',
                      accountType: 'account1',
                      brandStrategy: strategy,
                      weeklyTheme,
                      date: selectedDate || todayStr,
                      basePrompt: currentData.account1Profile.profile.prompt
                    })
                  });
                  
                  if (profilePromptRes.ok) {
                    const profileData = await profilePromptRes.json();
                    if (profileData.success && profileData.data.prompt) {
                      currentData.account1Profile.profile.prompt = profileData.data.prompt;
                    }
                  }
                  
                  // 메시지 생성
                  const messageRes = await fetch('/api/kakao-content/generate-prompt-message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      type: 'message',
                      accountType: 'account1',
                      brandStrategy: strategy,
                      weeklyTheme,
                      date: selectedDate || todayStr
                    })
                  });
                  
                  if (messageRes.ok) {
                    const messageData = await messageRes.json();
                    if (messageData.success && messageData.data.message) {
                      currentData.account1Profile.message = messageData.data.message;
                    }
                  }
                }
                
                // 계정 2 프롬프트 및 메시지 생성
                if (currentData.account2Profile) {
                  // 배경 프롬프트 생성
                  const bgPromptRes = await fetch('/api/kakao-content/generate-prompt-message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      type: 'background',
                      accountType: 'account2',
                      brandStrategy: strategy,
                      weeklyTheme,
                      date: selectedDate || todayStr,
                      basePrompt: currentData.account2Profile.background.prompt
                    })
                  });
                  
                  if (bgPromptRes.ok) {
                    const bgData = await bgPromptRes.json();
                    if (bgData.success && bgData.data.prompt) {
                      currentData.account2Profile.background.prompt = bgData.data.prompt;
                    }
                  }
                  
                  // 프로필 프롬프트 생성
                  const profilePromptRes = await fetch('/api/kakao-content/generate-prompt-message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      type: 'profile',
                      accountType: 'account2',
                      brandStrategy: strategy,
                      weeklyTheme,
                      date: selectedDate || todayStr,
                      basePrompt: currentData.account2Profile.profile.prompt
                    })
                  });
                  
                  if (profilePromptRes.ok) {
                    const profileData = await profilePromptRes.json();
                    if (profileData.success && profileData.data.prompt) {
                      currentData.account2Profile.profile.prompt = profileData.data.prompt;
                    }
                  }
                  
                  // 메시지 생성
                  const messageRes = await fetch('/api/kakao-content/generate-prompt-message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      type: 'message',
                      accountType: 'account2',
                      brandStrategy: strategy,
                      weeklyTheme,
                      date: selectedDate || todayStr
                    })
                  });
                  
                  if (messageRes.ok) {
                    const messageData = await messageRes.json();
                    if (messageData.success && messageData.data.message) {
                      currentData.account2Profile.message = messageData.data.message;
                    }
                  }
                }
                
                // 피드 프롬프트 및 캡션 생성
                if (currentData.feed) {
                  // 계정 1 피드
                  const feed1Res = await fetch('/api/kakao-content/generate-prompt-message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      type: 'feed',
                      accountType: 'account1',
                      brandStrategy: strategy,
                      weeklyTheme,
                      date: selectedDate || todayStr,
                      basePrompt: currentData.feed.account1.imagePrompt
                    })
                  });
                  
                  if (feed1Res.ok) {
                    const feedData = await feed1Res.json();
                    if (feedData.success && feedData.data.prompt) {
                      currentData.feed.account1.imagePrompt = feedData.data.prompt;
                    }
                  }
                  
                  // 계정 2 피드
                  const feed2Res = await fetch('/api/kakao-content/generate-prompt-message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      type: 'feed',
                      accountType: 'account2',
                      brandStrategy: strategy,
                      weeklyTheme,
                      date: selectedDate || todayStr,
                      basePrompt: currentData.feed.account2.imagePrompt
                    })
                  });
                  
                  if (feed2Res.ok) {
                    const feedData = await feed2Res.json();
                    if (feedData.success && feedData.data.prompt) {
                      currentData.feed.account2.imagePrompt = feedData.data.prompt;
                    }
                  }
                }
                
                // 캘린더 데이터 업데이트 및 저장
                const updated = { ...calendarData };
                // ... (상태 업데이트 로직)
                setCalendarData(updated);
                
                // Supabase에 저장
                await saveCalendarData(updated);
                
                alert('✅ 브랜드 전략이 적용되었고 프롬프트와 메시지가 자동 생성되었습니다!');
                
              } catch (error: any) {
                console.error('브랜드 전략 적용 오류:', error);
                alert(`브랜드 전략 적용 실패: ${error.message}`);
              } finally {
                setIsCreatingAll(false);
              }
            }}
              />
            </div>
          </div>
        )}

        {/* 프롬프트 설정 패널 (토글) */}
        {isPromptConfigExpanded && (
          <div className="mb-4 bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="p-6 border-t border-gray-200">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    저장된 프롬프트 설정 선택
                  </label>
                  <label className="sr-only" htmlFor="prompt-config-select">프롬프트 설정 선택</label>
                  <select
                    id="prompt-config-select"
                    value={selectedPromptConfig}
                    onChange={(e) => setSelectedPromptConfig(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    aria-label="프롬프트 설정 선택"
                  >
                    <option value="">기본 설정 사용</option>
                    {Object.keys(savedConfigs).map(configName => (
                      <option key={configName} value={configName}>
                        {savedConfigs[configName].name} - {savedConfigs[configName].description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 목록 뷰 또는 계정 편집기 */}
        {viewMode === 'list' ? (
          <div className="space-y-6">
            <MessageListView
              calendarData={calendarData}
              onDateSelect={(date) => {
                setSelectedDate(date);
              }}
              onViewModeChange={(mode) => {
                setViewMode(mode);
              }}
            />
            {/* 목록 모드에서는 워크플로우를 별도 토글로 표시 */}
            {selectedDate && (
              <div className="bg-white rounded-lg shadow-lg border border-gray-200">
                <button
                  onClick={() => setIsWorkflowExpanded(!isWorkflowExpanded)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isWorkflowExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    )}
                    <Sparkles className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">워크플로우 시각화</h3>
                    <span className="text-sm text-gray-500">({selectedDate})</span>
                  </div>
                </button>
                
                {isWorkflowExpanded && (
                  <div className="p-4 border-t border-gray-200">
                    <WorkflowVisualization
                      calendarData={calendarData}
                      selectedDate={selectedDate}
                      onUpdate={async (updates: any) => {
                        if (!calendarData) return;
                        const updated = { ...calendarData };
                        const currentDate = updates.date || selectedDate || todayStr;
                        const account = updates.account;
                        const type = updates.type;

                        if (type === 'background' || type === 'profile') {
                          const profileIndex = updated.profileContent[account].dailySchedule.findIndex(
                            (p: any) => p.date === currentDate
                          );
                          if (profileIndex >= 0) {
                            if (updates[`${type}_base_prompt`]) {
                              updated.profileContent[account].dailySchedule[profileIndex][type].basePrompt = updates[`${type}_base_prompt`];
                            }
                            if (updates[`${type}_prompt`]) {
                              updated.profileContent[account].dailySchedule[profileIndex][type].prompt = updates[`${type}_prompt`];
                            }
                          }
                        } else if (type === 'feed') {
                          const feedIndex = updated.kakaoFeed.dailySchedule.findIndex(
                            (f: any) => f.date === currentDate
                          );
                          if (feedIndex >= 0) {
                            if (updates.base_prompt) {
                              updated.kakaoFeed.dailySchedule[feedIndex][account].basePrompt = updates.base_prompt;
                            }
                            if (updates.image_prompt) {
                              updated.kakaoFeed.dailySchedule[feedIndex][account].imagePrompt = updates.image_prompt;
                            }
                          }
                        }
                        setCalendarData(updated);
                        // 업데이트 후 즉시 저장
                        await saveCalendarData(updated);
                      }}
                      onSave={async () => {
                        // onUpdate에서 이미 저장하므로 빈 함수
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
        {/* 계정 편집기 - 좌우 배치 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 계정 1 */}
          <div>
            <KakaoAccountEditor
              account={{
                number: calendarData.profileContent.account1.account,
                name: calendarData.profileContent.account1.name,
                persona: calendarData.profileContent.account1.persona,
                tone: 'gold'
              }}
              profileData={account1ProfileData}
              feedData={account1FeedData}
              selectedDate={selectedDate || todayStr}
              accountKey="account1"
              calendarData={calendarData}
              setCalendarData={setCalendarData}
              saveCalendarData={saveCalendarData}
              onProfileUpdate={async (data) => {
              // 상태 업데이트
              const updated = { ...calendarData };
              const currentDate = selectedDate || todayStr;
              const profileIndex = updated.profileContent.account1.dailySchedule.findIndex(
                p => p.date === currentDate
              );
              
              if (profileIndex >= 0) {
                // 기존 데이터 업데이트
                updated.profileContent.account1.dailySchedule[profileIndex] = {
                  ...updated.profileContent.account1.dailySchedule[profileIndex],
                  background: {
                    ...updated.profileContent.account1.dailySchedule[profileIndex].background,
                    imageUrl: data.background.imageUrl,
                    prompt: data.background.prompt // 프롬프트도 저장
                  },
                  profile: {
                    ...updated.profileContent.account1.dailySchedule[profileIndex].profile,
                    imageUrl: data.profile.imageUrl,
                    prompt: data.profile.prompt // 프롬프트도 저장
                  },
                  message: data.message
                };
              } else {
                // ⚠️ 새 데이터 생성 (캘린더 데이터가 없는 경우)
                updated.profileContent.account1.dailySchedule.push({
                  date: currentDate,
                  background: {
                    image: data.background.image || '',
                    prompt: data.background.prompt || '',
                    status: 'created',
                    imageUrl: data.background.imageUrl
                  },
                  profile: {
                    image: data.profile.image || '',
                    prompt: data.profile.prompt || '',
                    status: 'created',
                    imageUrl: data.profile.imageUrl
                  },
                  message: data.message || '',
                  status: 'created',
                  created: false
                });
              }
              
              setCalendarData(updated);

              // Supabase에 저장
              await saveCalendarData(updated);
            }}
            onBasePromptUpdate={async (type, basePrompt) => {
              // basePrompt 업데이트
              const updated = { ...calendarData };
              const currentDate = selectedDate || todayStr;
              const profileIndex = updated.profileContent.account1.dailySchedule.findIndex(
                p => p.date === currentDate
              );
              if (profileIndex >= 0) {
                if (type === 'background') {
                  updated.profileContent.account1.dailySchedule[profileIndex].background = {
                    ...updated.profileContent.account1.dailySchedule[profileIndex].background,
                    basePrompt: basePrompt
                  };
                } else {
                  updated.profileContent.account1.dailySchedule[profileIndex].profile = {
                    ...updated.profileContent.account1.dailySchedule[profileIndex].profile,
                    basePrompt: basePrompt
                  };
                }
              }
              setCalendarData(updated);

              // Supabase에 저장
              await saveCalendarData(updated);
            }}
            onFeedUpdate={async (data) => {
              // 상태 업데이트
              const updated = { ...calendarData };
              const currentDate = selectedDate || todayStr;
              const feedIndex = updated.kakaoFeed.dailySchedule.findIndex(
                f => f.date === currentDate
              );
              
              if (feedIndex >= 0) {
                // 기존 데이터 업데이트
                updated.kakaoFeed.dailySchedule[feedIndex].account1 = {
                  ...updated.kakaoFeed.dailySchedule[feedIndex].account1,
                  imageUrl: data.imageUrl,
                  caption: data.caption,
                  imagePrompt: data.imagePrompt, // 프롬프트도 저장
                  url: data.url, // URL도 저장
                  basePrompt: data.basePrompt // basePrompt도 저장
                };
              } else {
                // ⚠️ 새 데이터 생성 (캘린더 데이터가 없는 경우)
                updated.kakaoFeed.dailySchedule.push({
                  date: currentDate,
                  account1: {
                    imageCategory: data.imageCategory || '',
                    imagePrompt: data.imagePrompt || '',
                    caption: data.caption || '',
                    status: 'created',
                    imageUrl: data.imageUrl,
                    url: data.url,
                    basePrompt: data.basePrompt
                  },
                  account2: {
                    imageCategory: '',
                    imagePrompt: '',
                    caption: '',
                    status: 'created',
                    imageUrl: undefined,
                    url: undefined,
                    basePrompt: undefined
                  }
                });
              }
              
              setCalendarData(updated);

              // Supabase에 저장
              await saveCalendarData(updated);
            }}
              onGenerateProfileImage={async (type, prompt) => {
                const result = await handleGenerateGoldToneImage(type, prompt);
                // 2개 이상 생성된 경우 선택 모달 표시
                if (result.imageUrls.length > 1 && generationOptions.imageCount > 1) {
                  return new Promise((resolve) => {
                    setImageSelectionModal({
                      isOpen: true,
                      imageUrls: result.imageUrls,
                      title: `${type === 'background' ? '배경' : '프로필'} 이미지 선택`,
                      onSelect: (selectedUrl: string) => {
                        setImageSelectionModal(null);
                        resolve({ imageUrls: [selectedUrl], generatedPrompt: result.generatedPrompt, paragraphImages: result.paragraphImages });
                      }
                    });
                  });
                }
                return { imageUrls: [result.imageUrls[0]], generatedPrompt: result.generatedPrompt, paragraphImages: result.paragraphImages };
              }}
              onGenerateFeedImage={async (prompt) => {
                const result = await handleGenerateFeedImage(prompt, 'gold');
                // 2개 이상 생성된 경우 선택 모달 표시
                if (result.imageUrls.length > 1 && generationOptions.imageCount > 1) {
                  return new Promise((resolve) => {
                    setImageSelectionModal({
                      isOpen: true,
                      imageUrls: result.imageUrls,
                      title: '피드 이미지 선택',
                      onSelect: (selectedUrl: string) => {
                        setImageSelectionModal(null);
                        resolve({ imageUrls: [selectedUrl], generatedPrompt: result.generatedPrompt, paragraphImages: result.paragraphImages });
                      }
                    });
                  });
                }
                return { imageUrls: [result.imageUrls[0]], generatedPrompt: result.generatedPrompt, paragraphImages: result.paragraphImages };
              }}
              onAutoCreate={handleAccount1AutoCreate}
              isCreating={isCreatingAll}
              publishStatus={account1PublishStatus as 'created' | 'published'}
              onPublishStatusChange={(status) => handlePublishStatusChange('account1', status)}
              publishedAt={account1PublishedAt}
            />
          </div>

          {/* 계정 2 */}
          <div>
            <KakaoAccountEditor
            account={{
              number: calendarData.profileContent.account2.account,
              name: calendarData.profileContent.account2.name,
              persona: calendarData.profileContent.account2.persona,
              tone: 'black'
            }}
            profileData={account2ProfileData}
            feedData={account2FeedData}
            selectedDate={selectedDate || todayStr}
            accountKey="account2"
            calendarData={calendarData}
            setCalendarData={setCalendarData}
            saveCalendarData={saveCalendarData}
            onProfileUpdate={async (data) => {
              // 상태 업데이트
              const updated = { ...calendarData! };
              const currentDate = selectedDate || todayStr;
              const profileIndex = updated.profileContent.account2.dailySchedule.findIndex(
                p => p.date === currentDate
              );
              
              if (profileIndex >= 0) {
                // 기존 데이터 업데이트
                updated.profileContent.account2.dailySchedule[profileIndex] = {
                  ...updated.profileContent.account2.dailySchedule[profileIndex],
                  background: {
                    ...updated.profileContent.account2.dailySchedule[profileIndex].background,
                    imageUrl: data.background.imageUrl,
                    prompt: data.background.prompt // 프롬프트도 저장
                  },
                  profile: {
                    ...updated.profileContent.account2.dailySchedule[profileIndex].profile,
                    imageUrl: data.profile.imageUrl,
                    prompt: data.profile.prompt // 프롬프트도 저장
                  },
                  message: data.message
                };
              } else {
                // ⚠️ 새 데이터 생성 (캘린더 데이터가 없는 경우)
                updated.profileContent.account2.dailySchedule.push({
                  date: currentDate,
                  background: {
                    image: data.background.image || '',
                    prompt: data.background.prompt || '',
                    status: 'created',
                    imageUrl: data.background.imageUrl
                  },
                  profile: {
                    image: data.profile.image || '',
                    prompt: data.profile.prompt || '',
                    status: 'created',
                    imageUrl: data.profile.imageUrl
                  },
                  message: data.message || '',
                  status: 'created',
                  created: false
                });
              }
              
              setCalendarData(updated);

              // Supabase에 저장
              await saveCalendarData(updated);
            }}
            onBasePromptUpdate={async (type, basePrompt) => {
              // basePrompt 업데이트
              const updated = { ...calendarData };
              const currentDate = selectedDate || todayStr;
              const profileIndex = updated.profileContent.account2.dailySchedule.findIndex(
                p => p.date === currentDate
              );
              if (profileIndex >= 0) {
                if (type === 'background') {
                  updated.profileContent.account2.dailySchedule[profileIndex].background = {
                    ...updated.profileContent.account2.dailySchedule[profileIndex].background,
                    basePrompt: basePrompt
                  };
                } else {
                  updated.profileContent.account2.dailySchedule[profileIndex].profile = {
                    ...updated.profileContent.account2.dailySchedule[profileIndex].profile,
                    basePrompt: basePrompt
                  };
                }
              }
              setCalendarData(updated);

              // Supabase에 저장
              await saveCalendarData(updated);
            }}
            onFeedUpdate={async (data) => {
              // 상태 업데이트
              const updated = { ...calendarData };
              const currentDate = selectedDate || todayStr;
              const feedIndex = updated.kakaoFeed.dailySchedule.findIndex(
                f => f.date === currentDate
              );
              
              if (feedIndex >= 0) {
                // 기존 데이터 업데이트
                updated.kakaoFeed.dailySchedule[feedIndex].account2 = {
                  ...updated.kakaoFeed.dailySchedule[feedIndex].account2,
                  imageUrl: data.imageUrl,
                  caption: data.caption,
                  imagePrompt: data.imagePrompt, // 프롬프트도 저장
                  url: data.url, // URL도 저장
                  basePrompt: data.basePrompt // basePrompt도 저장
                };
              } else {
                // ⚠️ 새 데이터 생성 (캘린더 데이터가 없는 경우)
                updated.kakaoFeed.dailySchedule.push({
                  date: currentDate,
                  account1: {
                    imageCategory: '',
                    imagePrompt: '',
                    caption: '',
                    status: 'created',
                    imageUrl: undefined,
                    url: undefined,
                    basePrompt: undefined
                  },
                  account2: {
                    imageCategory: data.imageCategory || '',
                    imagePrompt: data.imagePrompt || '',
                    caption: data.caption || '',
                    status: 'created',
                    imageUrl: data.imageUrl,
                    url: data.url,
                    basePrompt: data.basePrompt
                  }
                });
              }
              
              setCalendarData(updated);

              // Supabase에 저장
              await saveCalendarData(updated);
            }}
              onGenerateProfileImage={async (type, prompt) => {
                const result = await handleGenerateBlackToneImage(type, prompt);
                // 2개 이상 생성된 경우 선택 모달 표시
                if (result.imageUrls.length > 1 && generationOptions.imageCount > 1) {
                  return new Promise((resolve) => {
                    setImageSelectionModal({
                      isOpen: true,
                      imageUrls: result.imageUrls,
                      title: `${type === 'background' ? '배경' : '프로필'} 이미지 선택`,
                      onSelect: (selectedUrl: string) => {
                        setImageSelectionModal(null);
                        resolve({ imageUrls: [selectedUrl], generatedPrompt: result.generatedPrompt, paragraphImages: result.paragraphImages });
                      }
                    });
                  });
                }
                return { imageUrls: [result.imageUrls[0]], generatedPrompt: result.generatedPrompt, paragraphImages: result.paragraphImages };
              }}
              onGenerateFeedImage={async (prompt) => {
                const result = await handleGenerateFeedImage(prompt, 'black');
                // 2개 이상 생성된 경우 선택 모달 표시
                if (result.imageUrls.length > 1 && generationOptions.imageCount > 1) {
                  return new Promise((resolve) => {
                    setImageSelectionModal({
                      isOpen: true,
                      imageUrls: result.imageUrls,
                      title: '피드 이미지 선택',
                      onSelect: (selectedUrl: string) => {
                        setImageSelectionModal(null);
                        resolve({ imageUrls: [selectedUrl], generatedPrompt: result.generatedPrompt });
                      }
                    });
                  });
                }
                return { imageUrls: [result.imageUrls[0]], generatedPrompt: result.generatedPrompt };
              }}
              onAutoCreate={handleAccount2AutoCreate}
              isCreating={isCreatingAll}
              publishStatus={account2PublishStatus as 'created' | 'published'}
              onPublishStatusChange={(status) => handlePublishStatusChange('account2', status)}
              publishedAt={account2PublishedAt}
            />
          </div>
        </div>
          </>
        )}

        {/* 생성 옵션 모달 */}
        {showGenerationOptions && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full mx-4">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">이미지 생성 옵션</h3>
              
              <div className="space-y-6">
                {/* 안내 메시지 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>생성 범위</strong>는 상단의 <strong>보기 모드</strong>에서 설정합니다.
                    <br />
                    (오늘 / 이번 주 / 이번 달)
                  </p>
                </div>

                {/* 이미지 개수 (선택용) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    이미지 생성 개수 (선택용)
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="imageCount"
                        value="1"
                        checked={generationOptions.imageCount === 1}
                        onChange={(e) => setGenerationOptions({ ...generationOptions, imageCount: parseInt(e.target.value) })}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">1개 생성 (즉시 사용)</div>
                        <div className="text-xs text-gray-500">1개만 생성하고 바로 사용합니다</div>
                      </div>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="imageCount"
                        value="2"
                        checked={generationOptions.imageCount === 2}
                        onChange={(e) => setGenerationOptions({ ...generationOptions, imageCount: parseInt(e.target.value) })}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">2개 생성 (선택)</div>
                        <div className="text-xs text-gray-500">2개 생성 후 선택할 수 있습니다</div>
                      </div>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="imageCount"
                        value="4"
                        checked={generationOptions.imageCount === 4}
                        onChange={(e) => setGenerationOptions({ ...generationOptions, imageCount: parseInt(e.target.value) })}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">4개 생성 (다양한 선택)</div>
                        <div className="text-xs text-gray-500">4개 생성 후 가장 적합한 것을 선택합니다</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 저장 위치 안내 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">💾 저장 위치</h4>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• <strong>이미지:</strong> 갤러리 시스템에 저장됩니다</li>
                    <li>• <strong>프롬프트:</strong> 캘린더 JSON 파일에 저장됩니다</li>
                    <li>• <strong>메시지/캡션:</strong> 캘린더 JSON 파일에 저장됩니다</li>
                    <li>• <strong>파일 위치:</strong> <code className="bg-blue-100 px-1 rounded">docs/content-calendar/YYYY-MM.json</code></li>
                  </ul>
                </div>
              </div>

              {/* 모달 버튼 */}
              <div className="flex justify-end space-x-3 mt-8">
                <button
                  onClick={() => setShowGenerationOptions(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    setShowGenerationOptions(false);
                    // 옵션 저장 (로컬 스토리지 또는 상태로 관리)
                    localStorage.setItem('kakaoGenerationOptions', JSON.stringify(generationOptions));
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  옵션 저장
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 이미지 선택 모달 */}
        {imageSelectionModal && (
          <ImageSelectionModal
            isOpen={imageSelectionModal.isOpen}
            imageUrls={imageSelectionModal.imageUrls}
            onSelect={imageSelectionModal.onSelect}
            onClose={() => setImageSelectionModal(null)}
            title={imageSelectionModal.title}
            allowAutoSelect={true}
          />
        )}
      </div>
    </div>
  );
}

