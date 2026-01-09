import React, { useEffect, useState, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AdminNav from '../../../components/admin/AdminNav';
import DualRangeSlider from '../../../components/admin/DualRangeSlider';
import { formatPhoneNumber } from '../../../lib/formatters';

// 한국 시간대 상수 (UTC+9)
const KST_OFFSET_MS = 9 * 60 * 60 * 1000; // 9시간을 밀리초로

type Survey = {
  id: string;
  name: string;
  phone: string;
  age: number | null;
  age_group: string | null;
  selected_model: string;
  important_factors: string[];
  additional_feedback: string | null;
  address: string;
  gift_text?: string | null;
  gift_product_id?: number | null;
  created_at: string;
  event_candidate?: boolean;
  event_winner?: boolean;
  gift_delivered?: boolean;
  is_winner?: boolean; // 경품 선정 당첨 여부
  distance_km?: number | null; // 거리 (km)
  is_purchased?: boolean; // 구매 여부
  days_since_last_purchase?: number | null; // 구매 경과 일수
  thank_you_message_sent_at?: string | null; // 감사 메시지 발송 완료 시간
  winner_message_sent_at?: string | null; // 당첨 메시지 발송 완료 시간
};

export default function SurveysPage() {
  const router = useRouter();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [stats, setStats] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModelFilter, setSelectedModelFilter] = useState('');
  const [ageGroupFilter, setAgeGroupFilter] = useState('');
  const [winnerFilter, setWinnerFilter] = useState<'all' | 'winner' | 'non_winner'>('all');
  const [purchasedFilter, setPurchasedFilter] = useState<'all' | 'purchased' | 'non_purchased'>('all');
  const [recommendationNameFilter, setRecommendationNameFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Survey>>({});
  const [viewSurvey, setViewSurvey] = useState<Survey | null>(null);
  const [creatingSurvey, setCreatingSurvey] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    phone: '',
    age: null as number | null,
    age_group: '',
    selected_model: '',
    important_factors: [] as string[],
    additional_feedback: '',
    address: '',
  });
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [customerSearchResult, setCustomerSearchResult] = useState<any>(null);
  const [giftProducts, setGiftProducts] = useState<
    { id: number; name: string; sku: string | null }[]
  >([]);
  const [editingGiftProductId, setEditingGiftProductId] = useState<number | null>(null);
  const [editingGiftText, setEditingGiftText] = useState<string>('');
  const [savingGiftRecord, setSavingGiftRecord] = useState(false);
  const [autoSaveGift, setAutoSaveGift] = useState(false);
  const [updatingEventCandidates, setUpdatingEventCandidates] = useState(false);
  const [recommendingPrizes, setRecommendingPrizes] = useState(false);
  const [activeTab, setActiveTab] = useState<'surveys' | 'prize' | 'geocoding'>('surveys');
  const [prizeHistoryList, setPrizeHistoryList] = useState<any[]>([]);
  const [scoreCriteriaExpanded, setScoreCriteriaExpanded] = useState<boolean>(true);
  const [loadingPrizeHistory, setLoadingPrizeHistory] = useState(false);
  const [selectedDetailDate, setSelectedDetailDate] = useState<string | null>(null);
  const [selectedDetailDateTime, setSelectedDetailDateTime] = useState<string | null>(null);
  const [prizeHistoryDetail, setPrizeHistoryDetail] = useState<any>(null);
  const [prizeHistoryFilter, setPrizeHistoryFilter] = useState<'all'>('all');
  const [editingRecommendationName, setEditingRecommendationName] = useState<{ date: string; datetime: string | null } | null>(null);
  const [editingNameValue, setEditingNameValue] = useState<string>('');
  const [updatingRecommendationName, setUpdatingRecommendationName] = useState(false);
  const [loadingPrizeHistoryDetail, setLoadingPrizeHistoryDetail] = useState(false);
  const [prizeSelections, setPrizeSelections] = useState<any[]>([]);
  const [loadingPrizeSelections, setLoadingPrizeSelections] = useState(false);
  const [selectingPrizes, setSelectingPrizes] = useState(false);
  const [geocodingCustomers, setGeocodingCustomers] = useState<any[]>([]);
  const [loadingGeocoding, setLoadingGeocoding] = useState(false);
  const [batchGeocoding, setBatchGeocoding] = useState(false);
  const [geocodingStatus, setGeocodingStatus] = useState<'all' | 'missing' | 'failed' | 'success'>('all');
  const [geocodingSortBy, setGeocodingSortBy] = useState<'name' | 'address' | 'status' | 'distance'>('name');
  const [geocodingSortOrder, setGeocodingSortOrder] = useState<'asc' | 'desc'>('asc');
  const [editingGeocoding, setEditingGeocoding] = useState<{
    customer: any;
    address: string;
  } | null>(null);
  const [updatingGeocoding, setUpdatingGeocoding] = useState(false);
  const [syncingAddresses, setSyncingAddresses] = useState(false);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<number[]>([]);
  const [duplicateMap, setDuplicateMap] = useState<Map<string, number>>(new Map()); // 전화번호별 중복 개수 (전체 설문 기준)
  const [expandedPhones, setExpandedPhones] = useState<Set<string>>(new Set()); // 펼쳐진 전화번호
  // 경품 선정 조건 설정 (통합된 구조)
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [selectionCriteria, setSelectionCriteria] = useState({
    // 선정 방식: 'auto' (자동) | 'manual' (수동)
    selectionType: 'auto' as 'auto' | 'manual',
    // 총 선정 인원
    totalCount: 20,
    // 1. 구매자/비구매자 비율 (단일 슬라이드, 점 하나)
    purchasedRatio: 50, // 0-100%
    // 2. 구매 경과 기간 (슬라이드, 점 2개)
    // 0=0개월, 10=1개월, 30=3개월, 60=6개월, 120=1년, 240=2년, 360=3년, 480=4년, 600=5년+
    purchasePeriodRange: { min: 0, max: 600 },
    purchasePeriodAll: true, // 전체 체크박스
    // 3. 거리 (슬라이드, 점 2개, 0-500km)
    distanceRange: { min: 0, max: 500 },
    distanceAll: true, // 전체 체크박스
    // 4. 나이대 (슬라이드, 점 2개, 0-80+)
    ageRange: { min: 0, max: 80 },
    // 5. 시타 방문수
    visitCountNoVisit: false, // 무방문 체크박스
    visitCountAll: true, // 방문전체 체크박스
    visitCountRange: { min: 1, max: 10 }, // 1회-10회+ 슬라이드 (체크박스 해제시)
    // 6. 답변 품질
    qualityScoreAll: true, // 전체 체크박스
    qualityScoreRange: { min: 0, max: 10 }, // 0점-만점 슬라이드 (체크박스 해제시)
    // 선정 사유 팩터
    reasonFactors: {
      includeDistance: true,
      includePurchasePeriod: true,
      includeVisitCount: true,
      includeQualityScore: true,
      includeAgeGroup: false,
    },
  });
  const [manualSelectedCustomers, setManualSelectedCustomers] = useState<string[]>([]); // 수동 선정 시 선택된 survey_id 목록
  const [surveyStats, setSurveyStats] = useState<{
    totalSurveys: number;
    uniquePhones: number;
    duplicateCount: number;
  } | null>(null); // 설문 통계
  const [messageModal, setMessageModal] = useState<{
    open: boolean;
    survey: Survey | null;
    message: string;
    customerNeeds: any;
    loading: boolean;
  }>({
    open: false,
    survey: null,
    message: '',
    customerNeeds: null,
    loading: false,
  });
  const [analysisModal, setAnalysisModal] = useState<{
    open: boolean;
    loading: boolean;
    data: any;
  }>({
    open: false,
    loading: false,
    data: null,
  });
  const [sendingMessages, setSendingMessages] = useState(false);
  const [messageSendResults, setMessageSendResults] = useState<{
    sent: number;
    failed: number;
    errors?: string[];
  } | null>(null);
  const [messagePreviewModal, setMessagePreviewModal] = useState<{
    open: boolean;
    survey: Survey | null;
    messageType: 'thank_you' | 'winner' | null;
    message: string;
    loading: boolean;
  }>({
    open: false,
    survey: null,
    messageType: null,
    message: '',
    loading: false,
  });

  const fetchSurveys = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: '1',
        pageSize: '10000', // 모든 설문을 한 화면에 표시
        ...(searchQuery && { q: searchQuery }),
        ...(selectedModelFilter && { selected_model: selectedModelFilter }),
        ...(ageGroupFilter && { age_group: ageGroupFilter }),
        ...(winnerFilter !== 'all' && { winner: winnerFilter }),
        ...(purchasedFilter !== 'all' && { purchased: purchasedFilter }),
        ...(recommendationNameFilter !== 'all' && { recommendation_name: recommendationNameFilter }),
        sortBy: sortBy,
        sortOrder: sortOrder,
      });

      const res = await fetch(`/api/survey/list?${params}`);
      const json = await res.json();

      if (json.success) {
        const surveyData = json.data || [];
        setSurveys(surveyData);
        setTotalPages(json.pagination?.totalPages || 1);
        // 중복 정보는 fetchDuplicatePhones에서 전체 설문 기준으로 가져옴
      } else {
        setError(json.message || '설문 목록을 불러오는데 실패했습니다.');
      }
    } catch (err: any) {
      setError(err.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/survey/stats');
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
      }
    } catch (err) {
      console.error('통계 조회 오류:', err);
    }
  };

  // 전체 설문의 전화번호별 중복 정보 가져오기
  const fetchDuplicatePhones = async () => {
    try {
      const res = await fetch('/api/admin/surveys/duplicate-phones');
      const json = await res.json();
      
      if (json.success && json.data) {
        // 전화번호별 카운트를 Map으로 변환
        const phoneCountMap = new Map<string, number>();
        Object.entries(json.data.phoneCountMap || {}).forEach(([phone, count]) => {
          phoneCountMap.set(phone, count as number);
        });
        setDuplicateMap(phoneCountMap);
        
        // 통계 정보 저장
        setSurveyStats({
          totalSurveys: json.data.totalSurveys || 0,
          uniquePhones: json.data.uniquePhones || 0,
          duplicateCount: json.data.duplicateCount || 0,
        });
      }
    } catch (err) {
      console.error('중복 전화번호 조회 오류:', err);
    }
  };

  // 사은품(굿즈) 상품 목록 조회
  const fetchGiftProducts = async () => {
    try {
      const res = await fetch('/api/admin/products?isGift=true');
      const json = await res.json();
      if (res.ok && json.success) {
        setGiftProducts(json.products || []);
      } else {
        console.error('사은품 상품 목록 조회 실패:', json.message);
      }
    } catch (err) {
      console.error('사은품 상품 목록 조회 오류:', err);
    }
  };

  useEffect(() => {
    fetchSurveys();
    fetchStats();
    fetchGiftProducts();
    fetchDuplicatePhones(); // 전체 설문 기준 중복 정보 가져오기
      // 필터 변경 시 선택 초기화
      setSelectedIds([]);
    }, [searchQuery, selectedModelFilter, ageGroupFilter, winnerFilter, purchasedFilter, recommendationNameFilter, sortBy, sortOrder, page]);

  // 정렬 핸들러
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const getModelName = (modelId: string) => {
    const modelMap: Record<string, string> = {
      'beryl-47g': '풀티타늄 베릴 47g',
      'beryl-42g': '풀티타늄 베릴 42g',
      'sapphire-53g': '원플렉스 사파이어 53g',
      'sapphire-44g': '원플렉스 사파이어 44g',
    };
    return modelMap[modelId] || modelId;
  };

  const getFactorNames = (factors: string[]) => {
    const factorMap: Record<string, string> = {
      distance: '비거리',
      direction: '방향성',
      feel: '타구감',
    };
    return factors.map(f => factorMap[f] || f).join(', ');
  };

  // 개별 삭제 (bulk-delete API 재사용)
  const handleDelete = async (id: string) => {
    if (!confirm('정말로 이 설문을 삭제하시겠습니까?')) return;

    setIsDeleting(true);
    try {
      const response = await fetch('/api/survey/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });

      let result: any = null;
      try {
        result = await response.json();
      } catch {
        // 응답이 비어있거나 JSON이 아니어도 안전하게 처리
      }

      if (response.ok && result?.success) {
        alert(result.message || '삭제되었습니다.');
        fetchSurveys();
        fetchStats();
      } else {
        alert(result?.message || '삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  // 체크박스 토글
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // 전체 선택/해제
  const handleToggleAll = () => {
    if (selectedIds.length === surveys.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(surveys.map(s => s.id));
    }
  };

  // 수정 모달 열기
  const handleEdit = async (survey: Survey) => {
    setEditingSurvey(survey);
    
    // 해당 설문에 연결된 선물 기록 확인 (지급 완료된 것만)
    let hasDeliveredGift = false;
    try {
      const giftRes = await fetch(`/api/admin/customer-gifts?surveyId=${survey.id}`);
      const giftJson = await giftRes.json();
      if (giftJson.success && giftJson.gifts && giftJson.gifts.length > 0) {
        // 지급 완료된 선물이 있는지 확인
        const deliveredGifts = giftJson.gifts.filter(
          (g: any) => g.delivery_status === 'sent'
        );
        hasDeliveredGift = deliveredGifts.length > 0;
      }
    } catch (error) {
      console.error('선물 기록 조회 오류:', error);
    }
    
    setEditFormData({
      name: survey.name,
      phone: survey.phone,
      age: survey.age,
      age_group: survey.age_group,
      selected_model: survey.selected_model,
      important_factors: survey.important_factors,
      additional_feedback: survey.additional_feedback,
      address: survey.address,
      gift_text: survey.gift_text ?? '',
      gift_product_id: survey.gift_product_id ?? null,
      // 이벤트 응모 대상은 자동 체크하지 않음 (수동 체크만)
      event_candidate: survey.event_candidate ?? false,
      event_winner: survey.event_winner ?? false,
      // 선물 지급 완료는 실제 지급 기록이 있으면 체크
      gift_delivered: hasDeliveredGift || survey.gift_delivered || false,
    });
    setEditingGiftProductId(survey.gift_product_id ?? null);
    setEditingGiftText(survey.gift_text ?? '');
    // 모달을 열 때는 아직 저장 중이 아니므로 false로 초기화
    setIsEditing(false);
  };

  // 고객관리 페이지로 이동 (새 창으로 열기)
  const handleGoToCustomerManagement = (survey: Survey) => {
    // 전화번호를 사용하여 고객관리 페이지로 새 창에서 열기
    const phone = survey.phone.replace(/[^0-9]/g, ''); // 숫자만 추출
    const url = `/admin/customers?autoEdit=${phone}`;
    window.open(url, '_blank');
  };

  // 수정 모달 닫기
  const handleCloseEdit = () => {
    setEditingSurvey(null);
    setEditFormData({});
    setEditingGiftProductId(null);
    setEditingGiftText('');
    setAutoSaveGift(false);
    setIsEditing(false);
  };

  // 새 설문 생성 모달 열기
  const handleCreateSurvey = () => {
    setCreatingSurvey(true);
    setCreateFormData({
      name: '',
      phone: '',
      age: null,
      age_group: '',
      selected_model: '',
      important_factors: [],
      additional_feedback: '',
      address: '',
    });
    setCustomerSearchResult(null);
  };

  // 새 설문 생성 모달 닫기
  const handleCloseCreate = () => {
    setCreatingSurvey(false);
    setCreateFormData({
      name: '',
      phone: '',
      age: null,
      age_group: '',
      selected_model: '',
      important_factors: [],
      additional_feedback: '',
      address: '',
    });
    setCustomerSearchResult(null);
  };

  // 고객 정보 검색 (전화번호로)
  const handleSearchCustomer = async () => {
    if (!createFormData.phone || createFormData.phone.trim() === '') {
      alert('전화번호를 입력해주세요.');
      return;
    }

    setSearchingCustomer(true);
    try {
      const normalizedPhone = createFormData.phone.replace(/[^0-9]/g, '');
      const response = await fetch(`/api/admin/customers?q=${encodeURIComponent(normalizedPhone)}&page=1&pageSize=1`);
      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        const customer = result.data[0];
        setCustomerSearchResult(customer);
        // 고객 정보로 폼 자동 채우기
        setCreateFormData(prev => ({
          ...prev,
          name: customer.name || prev.name,
          age: customer.age || prev.age,
          age_group: customer.age_group || prev.age_group,
          address: customer.address || prev.address,
        }));
        alert('고객 정보를 찾았습니다. 자동으로 입력되었습니다.');
      } else {
        setCustomerSearchResult(null);
        alert('등록된 고객 정보를 찾을 수 없습니다. 새로 입력해주세요.');
      }
    } catch (error) {
      console.error('고객 검색 오류:', error);
      alert('고객 검색 중 오류가 발생했습니다.');
    } finally {
      setSearchingCustomer(false);
    }
  };

  // 나이 입력 시 연령대 자동 계산 (생성용)
  const handleCreateAgeChange = (age: string) => {
    const ageNum = age ? parseInt(age) : null;
    let ageGroup = '';
    if (ageNum !== null && !isNaN(ageNum)) {
      if (ageNum < 20) ageGroup = '10대';
      else if (ageNum < 30) ageGroup = '20대';
      else if (ageNum < 40) ageGroup = '30대';
      else if (ageNum < 50) ageGroup = '40대';
      else if (ageNum < 60) ageGroup = '50대';
      else if (ageNum < 70) ageGroup = '70대';
      else if (ageNum < 80) ageGroup = '80대';
      else ageGroup = '80대 이상';
    }
    setCreateFormData(prev => ({
      ...prev,
      age: ageNum,
      age_group: ageGroup,
    }));
  };

  // 중요 요소 토글 (생성용)
  const toggleCreateImportantFactor = (factor: string) => {
    setCreateFormData(prev => {
      const factors = prev.important_factors || [];
      if (factors.includes(factor)) {
        return { ...prev, important_factors: factors.filter(f => f !== factor) };
      } else {
        return { ...prev, important_factors: [...factors, factor] };
      }
    });
  };

  // 새 설문 저장
  const handleSaveCreate = async () => {
    if (!createFormData.name || !createFormData.phone || !createFormData.selected_model) {
      alert('필수 항목(이름, 전화번호, 모델 선택)을 입력해주세요.');
      return;
    }

    setIsEditing(true);
    try {
      const response = await fetch('/api/survey/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createFormData.name,
          phone: createFormData.phone,
          age: createFormData.age,
          selected_model: createFormData.selected_model,
          important_factors: createFormData.important_factors,
          additional_feedback: createFormData.additional_feedback || null,
          address: createFormData.address || '',
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('테스트 설문이 생성되었습니다.');
        handleCloseCreate();
        fetchSurveys();
        fetchStats();
      } else {
        alert(result.message || '설문 생성에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('설문 생성 오류:', error);
      alert('설문 생성 중 오류가 발생했습니다: ' + (error.message || '알 수 없는 오류'));
    } finally {
      setIsEditing(false);
    }
  };

  // 수정 저장
  const handleSaveEdit = async () => {
    if (!editingSurvey) return;

    // 선물 지급 완료가 체크되었는데 사은품 정보가 없으면 경고
    if (editFormData.gift_delivered && !editingGiftProductId && !editingGiftText) {
      alert('선물 지급 완료를 체크하려면 사은품을 선택하거나 메모를 입력해주세요.');
      return;
    }

    setIsEditing(true);
    try {
      const response = await fetch('/api/survey/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingSurvey.id,
          ...editFormData,
          gift_product_id: editingGiftProductId,
          gift_text: editingGiftText,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // 자동 저장 체크박스가 체크되어 있고 사은품 정보가 있으면 선물 기록도 저장
        // (단, 선물 지급 완료가 체크되지 않은 경우만 - 체크되어 있으면 이미 API에서 처리됨)
        if (autoSaveGift && (editingGiftProductId || editingGiftText) && !editFormData.gift_delivered) {
          await handleSaveGiftToCustomer(true); // 자동 저장 플래그 전달
        }
        
        alert('수정되었습니다.');
        handleCloseEdit();
        fetchSurveys();
        fetchStats();
      } else {
        alert(result.message || '수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('수정 오류:', error);
      alert('수정 중 오류가 발생했습니다.');
    } finally {
      setIsEditing(false);
    }
  };

  // 설문 -> 고객 선물 기록 저장
  const handleSaveGiftToCustomer = async (isAutoSave = false) => {
    if (!editingSurvey) {
      return;
    }
    if (!editingGiftProductId && !editingGiftText) {
      if (!isAutoSave) {
      alert('사은품을 선택하거나 메모를 입력한 후 저장할 수 있습니다.');
      }
      return;
    }

    const name = (editFormData.name || editingSurvey.name || '').trim();
    const phoneRaw = (editFormData.phone || editingSurvey.phone || '').trim();
    const address = (editFormData.address || editingSurvey.address || '').trim();

    if (!name || !phoneRaw) {
      alert('이름과 전화번호가 있어야 고객 선물 기록을 저장할 수 있습니다.');
      return;
    }

    const normalizedPhone = phoneRaw.replace(/[^0-9]/g, '');
    if (normalizedPhone.length < 10 || normalizedPhone.length > 11) {
      alert('전화번호 형식이 올바르지 않습니다. (10~11자리 숫자)');
      return;
    }

    // 자동 저장이 아닐 때만 확인 메시지 표시
    if (!isAutoSave) {
    if (
      !confirm(
        `이 설문 정보를 기반으로 고객 선물 기록을 저장합니다.\n\n이름: ${name}\n전화: ${normalizedPhone}\n사은품: ${
          editingGiftProductId
            ? giftProducts.find((p) => p.id === editingGiftProductId)?.name || '선택된 상품'
            : '직접 입력'
        }\n메모: ${editingGiftText || '-'}\n\n계속하시겠습니까?`,
      )
    ) {
      return;
      }
    }

    setSavingGiftRecord(true);
    try {
      // 1) 고객 검색
      const searchParams = new URLSearchParams({
        q: normalizedPhone,
        page: '1',
        pageSize: '1',
      });
      const customersRes = await fetch(`/api/admin/customers?${searchParams.toString()}`);
      const customersJson = await customersRes.json();

      let customer =
        customersJson?.data?.find?.(
          (c: any) => String(c.phone || '').replace(/[^0-9]/g, '') === normalizedPhone,
        ) || null;

      // 2) 없으면 고객 생성
      if (!customer) {
        const createRes = await fetch('/api/admin/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            phone: normalizedPhone,
            address: address || null,
          }),
        });
        const createJson = await createRes.json();
        if (!createRes.ok || !createJson.success) {
          alert(createJson.message || '고객 생성에 실패했습니다.');
          setSavingGiftRecord(false);
          return;
        }
        customer = createJson.data;
      }

      if (!customer || !customer.id) {
        alert('고객 정보를 확인할 수 없습니다.');
        setSavingGiftRecord(false);
        return;
      }

      // 3) customer_gifts 레코드 생성
      const giftRes = await fetch('/api/admin/customer-gifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customer.id,
          survey_id: editingSurvey.id,
          product_id: editingGiftProductId,
          gift_text: editingGiftText || null,
          quantity: 1,
          delivery_type: 'in_person',
          delivery_status: 'pending',
          delivery_date: null,
          note: '설문 편집 화면에서 자동 생성',
        }),
      });
      const giftJson = await giftRes.json();
      if (!giftRes.ok || !giftJson.success) {
        alert(giftJson.message || '고객 선물 기록 저장에 실패했습니다.');
        setSavingGiftRecord(false);
        return;
      }

      if (!isAutoSave) {
      alert('고객 선물 기록에 저장되었습니다.\n고객 관리 > 🎁 선물 버튼에서 확인할 수 있습니다.');
      }
      // 자동 저장 후 체크박스 해제
      if (isAutoSave) {
        setAutoSaveGift(false);
      }
    } catch (error: any) {
      console.error('고객 선물 기록 저장 오류:', error);
      alert(error.message || '고객 선물 기록 저장 중 오류가 발생했습니다.');
    } finally {
      setSavingGiftRecord(false);
    }
  };

  // 경품 추천 고객 조회 및 다운로드
  // 새 경품 추천 생성 (완전 재구성)
  const handleCreatePrizeRecommendation = async () => {
    const confirmed = window.confirm('새로운 경품 추천을 생성하시겠습니까?\n\n이 작업은 시간이 걸릴 수 있습니다.');
    if (!confirmed) return;

    setRecommendingPrizes(true);
    try {
      console.log('[생성] 경품 추천 생성 시작');
      
      const res = await fetch('/api/admin/surveys/recommend-prizes');
      
      if (!res.ok) {
        const text = await res.text();
        console.error('[생성] API 오류:', res.status, text.substring(0, 500));
        throw new Error(`생성 실패 (${res.status}): ${text.substring(0, 200)}`);
      }
      
      const json = await res.json();
      
      console.log('[생성] API 응답:', {
        success: json.success,
        recommendationDate: json.recommendationDate,
        saveSuccess: json.saveSuccess,
        saveError: json.saveError,
      });
      
      if (!json.success) {
        console.error('[생성] API 응답 실패:', json);
        throw new Error(json.message || '경품 추천 생성에 실패했습니다.');
      }
      
      const recommendationDate = json.recommendationDate || new Date().toISOString().split('T')[0];
      const saveSuccess = json.saveSuccess !== false; // 기본값은 true
      const saveError = json.saveError || null;
      console.log('[생성] 완료, 날짜:', recommendationDate, '저장 성공:', saveSuccess);
      if (saveError) {
        console.error('[생성] 저장 에러 상세:', saveError);
      }
      
      // 저장 실패 시 경고
      if (!saveSuccess) {
        console.error('[생성] 저장 실패 - 데이터가 저장되지 않았을 수 있습니다.');
        let errorMessage = `⚠️ 경품 추천 생성은 완료되었지만 저장에 실패했을 수 있습니다.\n생성일: ${recommendationDate}\n\n`;
        if (saveError) {
          errorMessage += `에러 정보:\n`;
          if (saveError.message) errorMessage += `• 메시지: ${saveError.message}\n`;
          if (saveError.code) errorMessage += `• 코드: ${saveError.code}\n`;
          if (saveError.hint) errorMessage += `• 힌트: ${saveError.hint}\n`;
          if (saveError.details) errorMessage += `• 상세: ${JSON.stringify(saveError.details)}\n`;
        }
        errorMessage += `\n서버 로그를 확인해주세요.`;
        alert(errorMessage);
      }
      
      // 누락된 고객 정보 확인
      if (json.data?.missingCustomers && json.data.missingCustomers.length > 0) {
        const missingInfo = json.data.missingCustomers.map((c: any) => 
          `• ${c.name} (${c.phone || '전화번호 없음'}) - ${c.reason === 'no_phone' ? '전화번호 없음' : c.reason === 'duplicate_phone' ? '중복 전화번호' : '알 수 없음'}`
        ).join('\n');
        
        console.warn('[생성] 누락된 고객:', json.data.missingCustomers);
        const message = saveSuccess 
          ? `경품 추천이 생성되었습니다.\n생성일: ${recommendationDate}\n\n⚠️ 누락된 고객 (${json.data.missingCustomers.length}명):\n\n${missingInfo}`
          : `⚠️ 경품 추천 생성은 완료되었지만 저장에 실패했을 수 있습니다.\n생성일: ${recommendationDate}\n\n⚠️ 누락된 고객 (${json.data.missingCustomers.length}명):\n\n${missingInfo}`;
        alert(message);
      } else {
        const message = saveSuccess
          ? `경품 추천이 생성되었습니다.\n생성일: ${recommendationDate}`
          : `⚠️ 경품 추천 생성은 완료되었지만 저장에 실패했을 수 있습니다.\n생성일: ${recommendationDate}\n\n서버 로그를 확인해주세요.`;
        alert(message);
      }
      
      // 저장 완료 대기 (DB 커밋 대기)
      console.log('[생성] 저장 완료 대기 중... (5초)');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // 이력 목록 새로고침
      console.log('[생성] 이력 목록 새로고침');
      await fetchPrizeHistoryList();
      
    } catch (error: any) {
      console.error('[생성] 오류:', error);
      alert(`경품 추천 생성 중 오류가 발생했습니다.\n\n${error.message || '알 수 없는 오류'}`);
    } finally {
      setRecommendingPrizes(false);
    }
  };



  // 특정 날짜의 경품 추천 데이터 삭제
  const handleDeletePrizeHistory = async (date: string | undefined, recommendationDatetime?: string) => {
    if (!date) {
      alert('삭제할 날짜 정보가 없습니다.');
      return;
    }

    const confirmMessage = recommendationDatetime 
      ? `${date} ${recommendationDatetime} 시간의 경품 추천 데이터를 삭제하시겠습니까?`
      : `${date} 날짜의 모든 경품 추천 데이터를 삭제하시겠습니까?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      console.log('[삭제] 삭제 시작:', date, recommendationDatetime);
      
      // 날짜 형식 정규화 (YYYY-MM-DD)
      // '2026. 01. 06.' 또는 '2026-01-06' 형식을 '2026-01-06'으로 변환
      let normalizedDate = date.trim();
      
      // 'YYYY. MM. DD.' 형식을 'YYYY-MM-DD'로 변환
      const dateMatch = normalizedDate.match(/(\d{4})[.\s-]+(\d{1,2})[.\s-]+(\d{1,2})/);
      if (dateMatch) {
        const year = dateMatch[1];
        const month = dateMatch[2].padStart(2, '0');
        const day = dateMatch[3].padStart(2, '0');
        normalizedDate = `${year}-${month}-${day}`;
      }

      console.log('[삭제] 정규화된 날짜:', normalizedDate);

      // recommendation_datetime이 있으면 쿼리 파라미터에 추가
      let url = `/api/admin/surveys/prize-history?date=${encodeURIComponent(normalizedDate)}`;
      if (recommendationDatetime) {
        url += `&recommendation_datetime=${encodeURIComponent(recommendationDatetime)}`;
      }

      const res = await fetch(url, {
        method: 'DELETE',
      });

      const json = await res.json();

      console.log('[삭제] API 응답:', {
        success: json.success,
        message: json.message,
        deletedCount: json.deletedCount,
      });

      if (json.success) {
        alert(json.message || '데이터가 삭제되었습니다.');
        // 이력 목록 새로고침
        fetchPrizeHistoryList();
      } else {
        alert(json.message || '데이터 삭제에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('[삭제] 데이터 삭제 오류:', error);
      alert('데이터 삭제 중 오류가 발생했습니다.');
    }
  };

  // 저장된 경품 추천 이력 다운로드 (HTML)

  // 경품 추천 이력 목록 조회 (날짜별 통계만)
  const fetchPrizeHistoryList = async () => {
    setLoadingPrizeHistory(true);
    try {
      console.log('[이력목록] 조회 시작');
      
      const res = await fetch('/api/admin/surveys/prize-history?limit=10000');
      
      if (!res.ok) {
        const text = await res.text();
        console.error('[이력목록] API 오류:', res.status, text.substring(0, 500));
        throw new Error(`조회 실패 (${res.status}): ${text.substring(0, 200)}`);
      }
      
      const json = await res.json();
      
      if (!json.success) {
        console.error('[이력목록] API 응답 실패:', json);
        throw new Error(json.message || '이력 조회에 실패했습니다.');
      }
      
      if (!json.data || !json.data.dateStats) {
        console.warn('[이력목록] data가 없음');
        setPrizeHistoryList([]);
        return;
      }
      
      const dateStats = json.data.dateStats || [];
      console.log('[이력목록] 조회 성공:', { count: dateStats.length });
      
      setPrizeHistoryList(dateStats);
      
    } catch (error: any) {
      console.error('[이력목록] 오류:', error);
      alert(`조회 오류: ${error.message || '이력 조회 중 오류가 발생했습니다.'}`);
      setPrizeHistoryList([]);
    } finally {
      setLoadingPrizeHistory(false);
    }
  };

  // 경품 추천 이름 업데이트
  const handleUpdateRecommendationName = async (date: string, recommendation_datetime: string | null) => {
    if (!editingNameValue.trim()) {
      alert('이름을 입력해주세요.');
      return;
    }

    setUpdatingRecommendationName(true);
    try {
      const res = await fetch('/api/admin/surveys/prize-history', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          recommendation_datetime: recommendation_datetime || undefined,
          recommendation_name: editingNameValue.trim(),
        }),
      });

      const json = await res.json();

      if (json.success) {
        // 이력 목록 새로고침
        await fetchPrizeHistoryList();
        setEditingRecommendationName(null);
        setEditingNameValue('');
        alert(json.message || '이름이 업데이트되었습니다.');
      } else {
        alert(json.message || '이름 업데이트에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('이름 업데이트 오류:', error);
      alert('이름 업데이트 중 오류가 발생했습니다.');
    } finally {
      setUpdatingRecommendationName(false);
    }
  };

  // 경품 추천 상세 조회 (특정 날짜와 시간의 추천)
  const fetchPrizeHistoryDetail = async (date: string, recommendation_datetime?: string, resetFilter: boolean = false) => {
    setLoadingPrizeHistoryDetail(true);
    setSelectedDetailDate(date);
    setSelectedDetailDateTime(recommendation_datetime || null);
    try {
      console.log('[상세] 조회 시작:', date, recommendation_datetime ? `시간: ${recommendation_datetime}` : '전체');
      
      // recommendation_datetime이 있으면 특정 시간의 추천만 조회, 없으면 해당 날짜의 모든 추천 조회
      const url = recommendation_datetime 
        ? `/api/admin/surveys/prize-history?date=${date}&recommendation_datetime=${encodeURIComponent(recommendation_datetime)}&section=all&limit=10000`
        : `/api/admin/surveys/prize-history?date=${date}&section=all&limit=10000`;
      
      console.log('[상세] API 요청 URL:', url);
      
      const startTime = Date.now();
      const res = await fetch(url);
      const requestTime = Date.now() - startTime;
      
      console.log('[상세] API 응답 시간:', `${requestTime}ms`, '상태:', res.status, res.statusText);
      
      if (!res.ok) {
        const text = await res.text();
        console.error('[상세] API 오류:', {
          status: res.status,
          statusText: res.statusText,
          responseText: text.substring(0, 500),
        });
        throw new Error(`조회 실패 (${res.status}): ${text.substring(0, 200)}`);
      }
      
      const json = await res.json();
      
      console.log('[상세] API 응답:', {
        success: json.success,
        hasData: !!json.data,
        hasRecommendations: !!(json.data?.recommendations),
        recommendationsCount: json.data?.recommendations?.length || 0,
      });
      
      if (!json.success) {
        console.error('[상세] API 응답 실패:', json);
        throw new Error(json.message || '상세 조회에 실패했습니다.');
      }
      
      if (!json.data || !json.data.recommendations) {
        console.warn('[상세] data가 없음:', {
          hasData: !!json.data,
          hasRecommendations: !!(json.data?.recommendations),
        });
        setPrizeHistoryDetail(null);
        return;
      }
      
      const recommendations = json.data.recommendations || [];
      
      // 지오코딩 완료/미완료/주소없음 통계
      const geocodingStats = {
        completed: recommendations.filter((r: any) => r.latitude && r.longitude).length,
        incomplete: recommendations.filter((r: any) => {
          // 주소가 없거나 플레이스홀더인 경우와 지오코딩 실패를 구분
          const hasAddress = r.address && !['[주소 미제공]', '[직접방문]', '[온라인 전용]', 'N/A'].includes(r.address);
          return (!r.latitude || !r.longitude) && hasAddress;
        }).length,
        noAddress: recommendations.filter((r: any) => {
          // 주소가 없거나 플레이스홀더인 경우
          return !r.address || ['[주소 미제공]', '[직접방문]', '[온라인 전용]', 'N/A'].includes(r.address);
        }).length,
      };
      
      console.log('[상세] 조회 성공:', {
        count: recommendations.length,
        requestTime: `${requestTime}ms`,
        geocodingStats,
        uniqueCustomers: recommendations.filter((r: any) => r.is_primary === true).length,
        duplicates: recommendations.filter((r: any) => r.is_duplicate === true).length,
      });
      
      // recommendation_name은 recommendations 배열의 첫 번째 항목에서 가져오기
      const recommendation_name = recommendations.length > 0 ? recommendations[0]?.recommendation_name || null : null;
      
      setPrizeHistoryDetail({
        date,
        recommendation_datetime: recommendation_datetime || null,
        recommendation_name: recommendation_name,
        recommendations,
        total: recommendations.length,
      });
      
    } catch (error: any) {
      console.error('[상세] 오류:', {
        message: error.message,
        stack: error.stack,
        error: error,
      });
      alert(`상세 조회 오류: ${error.message || '상세 조회 중 오류가 발생했습니다.'}`);
      setPrizeHistoryDetail(null);
    } finally {
      setLoadingPrizeHistoryDetail(false);
    }
  };

  // 경품 선정 목록 조회
  const fetchPrizeSelections = async (date: string, recommendation_datetime?: string) => {
    setLoadingPrizeSelections(true);
    try {
      // recommendation_datetime이 있으면 쿼리 파라미터에 추가 (API에서 지원하는 경우)
      const url = recommendation_datetime
        ? `/api/admin/surveys/prize-selections?recommendation_date=${date}&recommendation_datetime=${encodeURIComponent(recommendation_datetime)}`
        : `/api/admin/surveys/prize-selections?recommendation_date=${date}`;
      const res = await fetch(url);
      const json = await res.json();
      
      if (json.success) {
        setPrizeSelections(json.data || []);
      } else {
        console.error('경품 선정 조회 실패:', json);
        setPrizeSelections([]);
      }
    } catch (error: any) {
      console.error('경품 선정 조회 오류:', error);
      setPrizeSelections([]);
    } finally {
      setLoadingPrizeSelections(false);
    }
  };

  // 경품 선정하기 (개선된 버전)
  const handleSelectPrizes = async (date: string, recommendation_datetime?: string) => {
    setSelectingPrizes(true);
    try {
      const res = await fetch('/api/admin/surveys/prize-selections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendation_date: date,
          recommendation_datetime: recommendation_datetime || undefined,
          selection_mode: selectionCriteria.selectionType === 'manual' ? 'manual' : 'ratio',
          total_count: selectionCriteria.totalCount,
          purchased_ratio: 100 - selectionCriteria.purchasedRatio, // 반대로 변환
          non_purchased_ratio: selectionCriteria.purchasedRatio, // 반대로 변환
          purchased_count: calculatedPurchasedCount,
          non_purchased_count: calculatedNonPurchasedCount,
          filters: {
            purchasePeriodRange: selectionCriteria.purchasePeriodRange,
            purchasePeriodAll: selectionCriteria.purchasePeriodAll,
            distanceRange: selectionCriteria.distanceRange,
            distanceAll: selectionCriteria.distanceAll,
            ageRange: selectionCriteria.ageRange,
            visitCountNoVisit: selectionCriteria.visitCountNoVisit,
            visitCountAll: selectionCriteria.visitCountAll,
            visitCountRange: selectionCriteria.visitCountRange,
            qualityScoreAll: selectionCriteria.qualityScoreAll,
            qualityScoreRange: selectionCriteria.qualityScoreRange,
          },
          reason_factors: selectionCriteria.reasonFactors,
          customer_ids: selectionCriteria.selectionType === 'manual' ? manualSelectedCustomers : undefined,
        }),
      });

      const json = await res.json();

      if (json.success) {
        alert(json.message || `${json.data?.length || 0}명이 선정되었습니다.`);
        setShowSelectionModal(false);
        await fetchPrizeSelections(date, recommendation_datetime);
      } else {
        alert(json.message || '경품 선정에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('경품 선정 오류:', error);
      alert('경품 선정 중 오류가 발생했습니다.');
    } finally {
      setSelectingPrizes(false);
    }
  };

  // 통합된 필터링 로직: 구매 경과 기간 슬라이드 값을 일수로 변환
  const purchasePeriodToDays = (value: number): number => {
    // 0=0개월, 10=1개월, 30=3개월, 60=6개월, 120=1년, 240=2년, 360=3년, 480=4년, 600=5년+
    if (value <= 10) return 0; // 0개월
    if (value <= 30) return 30; // 1개월
    if (value <= 60) return 90; // 3개월
    if (value <= 120) return 180; // 6개월
    if (value <= 240) return 365; // 1년
    if (value <= 360) return 730; // 2년
    if (value <= 480) return 1095; // 3년
    if (value <= 600) return 1460; // 4년
    return 1825; // 5년+
  };

  // 구매 경과 기간 일수를 슬라이드 값으로 변환 (역변환)
  const daysToPurchasePeriod = (days: number): number => {
    if (days <= 0) return 0;
    if (days <= 30) return 10;
    if (days <= 90) return 30;
    if (days <= 180) return 60;
    if (days <= 365) return 120;
    if (days <= 730) return 240;
    if (days <= 1095) return 360;
    if (days <= 1460) return 480;
    return 600;
  };

  // 비율 기반: 총 인원과 비율로 계산 (반대로 계산)
  // purchasedRatio가 0이면 구매자 100%, 100이면 구매자 0%
  const calculatedPurchasedCount = useMemo(() => {
    const actualPurchasedRatio = 100 - selectionCriteria.purchasedRatio;
    return Math.round((selectionCriteria.totalCount * actualPurchasedRatio) / 100);
  }, [selectionCriteria.totalCount, selectionCriteria.purchasedRatio]);

  const calculatedNonPurchasedCount = useMemo(() => {
    // purchasedRatio가 0이면 비구매자 0%, 100이면 비구매자 100%
    return Math.round((selectionCriteria.totalCount * selectionCriteria.purchasedRatio) / 100);
  }, [selectionCriteria.totalCount, selectionCriteria.purchasedRatio]);

  // 나이대별 분포 계산
  const ageDistribution = useMemo(() => {
    if (!prizeHistoryDetail?.recommendations) return {};
    
    const primaryRecommendations = prizeHistoryDetail.recommendations.filter((r: any) => r.is_primary === true);
    const distribution: Record<string, number> = {
      '20대': 0,
      '30대': 0,
      '40대': 0,
      '50대': 0,
      '60대': 0,
      '70대': 0,
      '80대+': 0,
    };
    
    primaryRecommendations.forEach((r: any) => {
      const age = r.age;
      if (!age) return;
      
      if (age >= 20 && age < 30) distribution['20대']++;
      else if (age >= 30 && age < 40) distribution['30대']++;
      else if (age >= 40 && age < 50) distribution['40대']++;
      else if (age >= 50 && age < 60) distribution['50대']++;
      else if (age >= 60 && age < 70) distribution['60대']++;
      else if (age >= 70 && age < 80) distribution['70대']++;
      else if (age >= 80) distribution['80대+']++;
    });
    
    return distribution;
  }, [prizeHistoryDetail]);

  // 통합된 필터링된 고객 목록 계산
  const getFilteredCustomers = useMemo(() => {
    if (!prizeHistoryDetail?.recommendations) return [];
    
    let filtered = prizeHistoryDetail.recommendations.filter((r: any) => r.is_primary === true);
    
    // 구매자/비구매자 필터 (가장 먼저 적용)
    // purchasedRatio가 100이면 비구매자만, 0이면 구매자만
    if (selectionCriteria.purchasedRatio === 100) {
      // 비구매자만 (is_purchased === false 또는 days_since_last_purchase === null)
      filtered = filtered.filter((r: any) => 
        !(r.is_purchased === true && r.days_since_last_purchase != null)
      );
    } else if (selectionCriteria.purchasedRatio === 0) {
      // 구매자만 (is_purchased === true && days_since_last_purchase != null)
      filtered = filtered.filter((r: any) => 
        r.is_purchased === true && r.days_since_last_purchase != null
      );
    }
    // purchasedRatio가 0-100 사이면 구매자/비구매자 모두 포함 (필터 없음)
    
    // 거리 필터
    if (!selectionCriteria.distanceAll) {
      const { min, max } = selectionCriteria.distanceRange;
      filtered = filtered.filter((r: any) => {
        const distance = r.distance_km || 0;
        return distance >= min && distance <= max;
      });
    }
    
    // 구매 경과 기간 필터
    if (!selectionCriteria.purchasePeriodAll) {
      const minDays = purchasePeriodToDays(selectionCriteria.purchasePeriodRange.min);
      const maxDays = purchasePeriodToDays(selectionCriteria.purchasePeriodRange.max);
      filtered = filtered.filter((r: any) => {
        if (!r.is_purchased || r.days_since_last_purchase === null) return false;
        const days = r.days_since_last_purchase;
        return days >= minDays && days <= maxDays;
      });
    }
    
    // 시타 방문수 필터
    if (!selectionCriteria.visitCountAll) {
      // 방문전체가 체크되지 않은 경우
      filtered = filtered.filter((r: any) => {
        const visitCount = r.visit_count || 0;
        const bookingCount = r.booking_count || 0;
        const hasVisit = visitCount > 0 || bookingCount > 0;
        
        if (selectionCriteria.visitCountNoVisit) {
          // 무방문 체크: visit_count === 0이고 booking_count === 0인 경우만
          return !hasVisit;
        } else {
          // 무방문 미체크: 범위 내만 (방문 이력이 있어야 함)
          if (!hasVisit) return false; // 방문 이력이 없으면 제외
          const { min, max } = selectionCriteria.visitCountRange;
          return visitCount >= min && visitCount <= max;
        }
      });
    } else {
      // 방문전체가 체크된 경우
      if (selectionCriteria.visitCountNoVisit) {
        // 방문전체 + 무방문 체크 = 모든 방문수 포함 (필터 없음)
        filtered = filtered;
      } else {
        // 방문전체 + 무방문 미체크 = 방문한 고객만 (visit_count > 0 또는 booking_count > 0)
        filtered = filtered.filter((r: any) => {
          const visitCount = r.visit_count || 0;
          const bookingCount = r.booking_count || 0;
          return visitCount > 0 || bookingCount > 0;
        });
      }
    }
    
    // 나이대 범위 필터
    const { min, max } = selectionCriteria.ageRange;
    filtered = filtered.filter((r: any) => {
      const age = r.age;
      if (!age) return true; // age 정보가 없으면 통과
      return age >= min && age <= max;
    });
    
    // 답변 품질 필터
    if (!selectionCriteria.qualityScoreAll) {
      const { min, max } = selectionCriteria.qualityScoreRange;
      filtered = filtered.filter((r: any) => {
        const quality = r.survey_quality_score || 0;
        return quality >= min && quality <= max;
      });
    }
    
    return filtered;
  }, [prizeHistoryDetail, selectionCriteria]);

  // 선정 조건 기본값
  const getDefaultSelectionCriteria = () => ({
    selectionType: 'auto' as 'auto' | 'manual',
    totalCount: 20,
    purchasedRatio: 50,
    purchasePeriodRange: { min: 0, max: 600 },
    purchasePeriodAll: true,
    distanceRange: { min: 0, max: 500 },
    distanceAll: true,
    ageRange: { min: 0, max: 80 },
    visitCountNoVisit: false,
    visitCountAll: true,
    visitCountRange: { min: 1, max: 10 },
    qualityScoreAll: true,
    qualityScoreRange: { min: 0, max: 10 },
    reasonFactors: {
      includeDistance: true,
      includePurchasePeriod: true,
      includeVisitCount: true,
      includeQualityScore: true,
      includeAgeGroup: false,
    },
  });

  // 설정값 초기화
  const handleResetCriteria = () => {
    if (!prizeHistoryDetail?.recommendations) return;
    
    const purchased = prizeHistoryDetail.recommendations.filter((r: any) => 
      r.is_primary === true && r.is_purchased === true && r.days_since_last_purchase != null
    );
    const nonPurchased = prizeHistoryDetail.recommendations.filter((r: any) => 
      r.is_primary === true && !(r.is_purchased === true && r.days_since_last_purchase != null)
    );
    
    const defaultCriteria = getDefaultSelectionCriteria();
    setSelectionCriteria({
      ...defaultCriteria,
      totalCount: Math.min(defaultCriteria.totalCount, purchased.length + nonPurchased.length),
    });
    setManualSelectedCustomers([]);
  };

  // 선정 조건 모달 열기
  const handleOpenSelectionModal = () => {
    if (!prizeHistoryDetail?.recommendations) {
      alert('경품 추천 상세 정보를 먼저 조회해주세요.');
      return;
    }
    
    // 가능한 최대 인원 계산
    const purchased = prizeHistoryDetail.recommendations.filter((r: any) => 
      r.is_purchased === true && r.days_since_last_purchase != null
    );
    const nonPurchased = prizeHistoryDetail.recommendations.filter((r: any) => 
      !(r.is_purchased === true && r.days_since_last_purchase != null)
    );
    
    setSelectionCriteria({
      ...selectionCriteria,
      totalCount: Math.min(selectionCriteria.totalCount, purchased.length + nonPurchased.length),
    });
    
    // 이미 선정된 고객들을 manualSelectedCustomers에 추가
    const alreadySelected = prizeSelections
      .filter((s: any) => {
        if (s.recommendation_date !== selectedDetailDate) return false;
        if (selectedDetailDateTime && s.recommendation_datetime && s.recommendation_datetime !== selectedDetailDateTime) return false;
        return s.selection_status === 'selected';
      })
      .map((s: any) => s.survey_id);
    
    setManualSelectedCustomers(alreadySelected);
    setShowSelectionModal(true);
  };

  // 수동 선정: 고객 선택 토글
  const toggleManualCustomerSelection = (surveyId: string) => {
    setManualSelectedCustomers(prev => {
      if (prev.includes(surveyId)) {
        return prev.filter(id => id !== surveyId);
      } else {
        return [...prev, surveyId];
      }
    });
  };

  // 선정 삭제
  const handleRemoveSelection = async (selectionId: string) => {
    if (!confirm('이 선정을 삭제하시겠습니까?')) return;
    
    try {
      const res = await fetch(`/api/admin/surveys/prize-selections?id=${selectionId}`, {
        method: 'DELETE',
      });
      
      const json = await res.json();
      
      if (json.success) {
        await fetchPrizeSelections(selectedDetailDate || '', selectedDetailDateTime || undefined);
      } else {
        alert(json.message || '선정 삭제에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('선정 삭제 오류:', error);
      alert('선정 삭제 중 오류가 발생했습니다.');
    }
  };

  // 선정 추가
  const handleAddToSelection = async (item: any) => {
    try {
      const res = await fetch('/api/admin/surveys/prize-selections', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendation_date: selectedDetailDate,
          recommendation_datetime: selectedDetailDateTime || undefined,
          customer_ids: [item.survey_id],
          reason_factors: selectionCriteria.reasonFactors,
        }),
      });
      
      const json = await res.json();
      
      if (json.success) {
        await fetchPrizeSelections(selectedDetailDate || '', selectedDetailDateTime || undefined);
      } else {
        alert(json.message || '선정 추가에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('선정 추가 오류:', error);
      alert('선정 추가 중 오류가 발생했습니다.');
    }
  };

  // 탭 변경 시 이력 목록 자동 조회 (경품 추천 이력 탭 진입 시)
  useEffect(() => {
    if (activeTab === 'prize') {
      if (prizeHistoryList.length === 0 && !loadingPrizeHistory) {
        fetchPrizeHistoryList();
      }
    }
  }, [activeTab]);

  // 상세보기 열릴 때 선정 목록도 조회
  useEffect(() => {
    if (selectedDetailDate) {
      fetchPrizeSelections(selectedDetailDate, selectedDetailDateTime || undefined);
    }
  }, [selectedDetailDate, selectedDetailDateTime]);

  // 위치 미확인 고객 조회
  const fetchGeocodingCustomers = async () => {
    setLoadingGeocoding(true);
    try {
      const params = new URLSearchParams();
      if (geocodingStatus !== 'all') {
        params.append('status', geocodingStatus);
      }
      params.append('limit', '100');

      const res = await fetch(`/api/admin/surveys/geocoding?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        const customers = json.data.customers || [];
        
        // 전화번호별로 그룹화하여 중복 표시
        const phoneMap = new Map<string, any[]>();
        customers.forEach((c: any) => {
          const normalizedPhone = c.phone?.replace(/[^0-9]/g, '') || '';
          if (!phoneMap.has(normalizedPhone)) {
            phoneMap.set(normalizedPhone, []);
          }
          phoneMap.get(normalizedPhone)!.push(c);
        });
        
        // 중복 정보 추가
        const customersWithDuplicate = customers.map((c: any) => {
          const normalizedPhone = c.phone?.replace(/[^0-9]/g, '') || '';
          const duplicates = phoneMap.get(normalizedPhone) || [];
          return {
            ...c,
            duplicateCount: duplicates.length,
            isDuplicate: duplicates.length > 1,
          };
        });
        
        // 전화번호별로 정렬 (최신 설문 우선)
        customersWithDuplicate.sort((a: any, b: any) => {
          const phoneA = a.phone?.replace(/[^0-9]/g, '') || '';
          const phoneB = b.phone?.replace(/[^0-9]/g, '') || '';
          if (phoneA !== phoneB) {
            return phoneA.localeCompare(phoneB);
          }
          // 같은 전화번호면 최신 설문 우선
          const dateA = a.survey_created_at || a.created_at || '';
          const dateB = b.survey_created_at || b.created_at || '';
          return dateB.localeCompare(dateA);
        });
        
        setGeocodingCustomers(customersWithDuplicate);
      } else {
        alert(json.message || '조회에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('위치 정보 조회 오류:', error);
      alert(error.message || '조회 중 오류가 발생했습니다.');
    } finally {
      setLoadingGeocoding(false);
    }
  };

  // 위치 정보 수동 업데이트
  const handleUpdateGeocoding = async () => {
    if (!editingGeocoding || !editingGeocoding.address.trim()) {
      alert('주소를 입력해주세요.');
      return;
    }

    setUpdatingGeocoding(true);
    try {
      const res = await fetch('/api/admin/surveys/geocoding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: editingGeocoding.customer.customer_id,
          surveyId: editingGeocoding.customer.survey_id,
          address: editingGeocoding.address.trim(),
        }),
      });

      const json = await res.json();

      if (json.success) {
        if (json.data.distance_km !== null && json.data.distance_km !== undefined) {
          alert(`위치 정보가 업데이트되었습니다.\n거리: ${json.data.distance_km.toFixed(2)}km`);
        } else {
          alert(json.message || '주소가 저장되었습니다.');
        }
        setEditingGeocoding(null);
        fetchGeocodingCustomers();
      } else {
        alert(json.message || '업데이트에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('위치 정보 업데이트 오류:', error);
      alert(error.message || '업데이트 중 오류가 발생했습니다.');
    } finally {
      setUpdatingGeocoding(false);
    }
  };

  // 일괄 주소 동기화 함수
  const handleSyncAddresses = async () => {
    const customerIds = selectedCustomerIds.length > 0 ? selectedCustomerIds : undefined;
    const count = customerIds ? customerIds.length : geocodingCustomers.length;
    
    if (
      !confirm(
        `${count}명의 고객 주소를 일괄 동기화하시겠습니까?\n\n- 고객관리 주소가 없거나 플레이스홀더인 경우만\n- 설문 주소가 실제 주소인 경우만 동기화됩니다.`,
      )
    ) {
      return;
    }

    setSyncingAddresses(true);
    try {
      const res = await fetch('/api/admin/surveys/sync-addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerIds ? { customerIds } : {}),
      });

      const json = await res.json();
      if (json.success) {
        alert(json.message);
        setSelectedCustomerIds([]);
        fetchGeocodingCustomers();
      } else {
        alert(json.message || '동기화에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('주소 동기화 오류:', error);
      alert('동기화 중 오류가 발생했습니다.');
    } finally {
      setSyncingAddresses(false);
    }
  };

  // 지오코딩 일괄 실행 함수
  const handleBatchGeocoding = async () => {
    // 선택된 고객의 survey_id 수집
    const selectedSurveys = geocodingCustomers.filter(
      (c: any) => c.customer_id && selectedCustomerIds.includes(c.customer_id)
    );
    
    // 선택된 항목이 있으면 선택된 것만, 없으면 전체
    const targetSurveys = selectedSurveys.length > 0 
      ? selectedSurveys 
      : geocodingCustomers;
    
    // 지오코딩이 필요한 항목만 필터링 (재실행도 가능하도록 모든 항목 포함)
    const needsGeocoding = targetSurveys;
    
    if (needsGeocoding.length === 0) {
      alert('처리할 설문이 없습니다.');
      return;
    }
    
    const count = needsGeocoding.length;
    const isSelected = selectedSurveys.length > 0;
    
    if (
      !confirm(
        `${isSelected ? '선택된' : '모든'} ${count}개 설문에 대해 카카오맵 API를 ${isSelected ? '재' : ''}호출하시겠습니까?\n\n주의: API 호출 제한이 있을 수 있으므로 시간이 걸릴 수 있습니다.`
      )
    ) {
      return;
    }
    
    setBatchGeocoding(true);
    try {
      // 선택된 항목이 있으면 survey_id 배열 전달
      const surveyIds = isSelected 
        ? needsGeocoding.map((c: any) => c.survey_id).filter(Boolean)
        : undefined;
      
      console.log('[클라이언트] 지오코딩 일괄 실행 시작', {
        selectedCount: selectedSurveys.length,
        totalCount: needsGeocoding.length,
        surveyIdsCount: surveyIds?.length || 0,
        surveyIds: surveyIds?.slice(0, 5) || '전체', // 처음 5개만 로그
      });
      
      const res = await fetch('/api/admin/surveys/batch-geocoding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          surveyIds: surveyIds, // 선택된 항목만 전달
          limit: surveyIds ? undefined : 1000 // 선택된 항목이 있으면 limit 무시
        }),
      });

      const json = await res.json();
      
      console.log('[클라이언트] 지오코딩 API 응답:', {
        success: json.success,
        message: json.message,
        processed: json.data?.processed,
        successCount: json.data?.success,
        failedCount: json.data?.failed,
        errors: json.data?.errors?.slice(0, 5) || [], // 처음 5개만 로그
      });

      if (json.success) {
        const message = `${json.message}\n\n처리: ${json.data.processed}건\n성공: ${json.data.success}건\n실패: ${json.data.failed}건`;
        
        // 실패한 항목이 있으면 상세 정보 표시
        if (json.data.errors && json.data.errors.length > 0) {
          console.error('[클라이언트] 실패 목록:', json.data.errors);
          const errorDetails = json.data.errors.slice(0, 10).join('\n');
          alert(`${message}\n\n실패 상세 (최대 10개):\n${errorDetails}`);
        } else {
          alert(message);
        }
        
        // 목록 새로고침
        await fetchGeocodingCustomers();
      } else {
        console.error('[클라이언트] 지오코딩 실패:', json);
        alert(json.message || '일괄 지오코딩에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('[클라이언트] 일괄 지오코딩 오류:', error);
      console.error('[클라이언트] 에러 스택:', error.stack);
      alert('일괄 지오코딩 중 오류가 발생했습니다.');
    } finally {
      setBatchGeocoding(false);
    }
  };

  // 위치 정보 관리 정렬 핸들러
  const handleGeocodingSort = (column: 'name' | 'address' | 'status' | 'distance') => {
    if (geocodingSortBy === column) {
      setGeocodingSortOrder(geocodingSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setGeocodingSortBy(column);
      setGeocodingSortOrder('asc');
    }
  };

  // 정렬된 위치 정보 목록
  const sortedGeocodingCustomers = [...geocodingCustomers].sort((a: any, b: any) => {
    let aValue: any;
    let bValue: any;

    switch (geocodingSortBy) {
      case 'name':
        aValue = a.name || '';
        bValue = b.name || '';
        break;
      case 'address':
        aValue = a.address || a.original_survey_address || '';
        bValue = b.address || b.original_survey_address || '';
        break;
      case 'status':
        // 상태 순서: 성공 > 미확인 > 실패 > 주소 없음
        const statusOrder: any = { 'success': 1, null: 2, undefined: 2, 'failed': 3, '주소 없음': 4 };
        aValue = statusOrder[a.geocoding_status] || (a.address ? 2 : 4);
        bValue = statusOrder[b.geocoding_status] || (b.address ? 2 : 4);
        break;
      case 'distance':
        aValue = a.distance_km ?? Infinity;
        bValue = b.distance_km ?? Infinity;
        break;
      default:
        return 0;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue, 'ko');
      return geocodingSortOrder === 'asc' ? comparison : -comparison;
    } else {
      const comparison = aValue - bValue;
      return geocodingSortOrder === 'asc' ? comparison : -comparison;
    }
  });

  // 체크박스 관련 함수들
  const handleSelectCustomer = (customerId: number) => {
    setSelectedCustomerIds((prev) =>
      prev.includes(customerId) ? prev.filter((id) => id !== customerId) : [...prev, customerId],
    );
  };

  const handleSelectAllCustomers = () => {
    const customersWithId = geocodingCustomers.filter((c: any) => c.customer_id);
    const allSelected = selectedCustomerIds.length === customersWithId.length && customersWithId.length > 0;
    
    if (allSelected) {
      setSelectedCustomerIds([]);
    } else {
      setSelectedCustomerIds(customersWithId.map((c: any) => c.customer_id));
    }
  };

  // 동기화 가능 여부 확인 함수
  const canSync = (customer: any) => {
    // 주소 정규화 함수 (공백 제거 및 정규화)
    const normalizeForCompare = (addr: string | null | undefined): string => {
      if (!addr) return '';
      return addr.trim().replace(/\s+/g, ' '); // 앞뒤 공백 제거, 중간 공백 정규화
    };

    const customerAddr = normalizeForCompare(customer.customer_address);
    const surveyAddr = normalizeForCompare(customer.original_survey_address);

    // 동기화 가능: 고객관리 주소가 없거나 플레이스홀더 + 설문 주소가 실제 주소
    const canInitialSync =
      (!customerAddr ||
        customerAddr.startsWith('[') ||
        customerAddr === 'N/A') &&
      surveyAddr &&
      !surveyAddr.startsWith('[') &&
      surveyAddr !== 'N/A';

    // 재동기화 가능: 주소가 다름 (정규화 후 비교)
    const canResync =
      customerAddr &&
      !customerAddr.startsWith('[') &&
      customerAddr !== 'N/A' &&
      surveyAddr &&
      !surveyAddr.startsWith('[') &&
      surveyAddr !== 'N/A' &&
      customerAddr !== surveyAddr; // 정규화된 주소로 비교

    return { canInitialSync, canResync };
  };

  // 개별 주소 동기화 함수
  const handleSyncSingleAddress = async (customerId: number, customerName: string) => {
    if (!confirm(`${customerName} 고객의 설문 주소를 고객관리 주소로 동기화하시겠습니까?`)) {
      return;
    }

    try {
      const res = await fetch('/api/admin/surveys/sync-addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerIds: [customerId] }),
      });

      const json = await res.json();
      if (json.success) {
        alert(json.message);
        fetchGeocodingCustomers();
      } else {
        alert(json.message || '동기화에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('주소 동기화 오류:', error);
      alert('동기화 중 오류가 발생했습니다.');
    }
  };

  // 탭 변경 시 위치 정보 자동 조회
  useEffect(() => {
    if (activeTab === 'geocoding' && geocodingCustomers.length === 0) {
      fetchGeocodingCustomers();
    }
  }, [activeTab]);

  // 선물 지급 완료된 설문을 일괄 업데이트 (설문 연결 + 체크박스 업데이트)
  const handleBulkUpdateEventCandidates = async () => {
    if (!confirm('선물 지급 완료된 고객의 설문을 자동으로 연결하고 "선물 지급 완료"로 일괄 업데이트하시겠습니까?\n\n- 설문에 연결되지 않은 선물을 전화번호/이름으로 자동 매칭\n- 연결된 설문의 gift_delivered 체크박스 자동 업데이트')) {
      return;
    }

    setUpdatingEventCandidates(true);
    try {
      const res = await fetch('/api/admin/surveys/check-and-update-gifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const json = await res.json();
      if (res.ok && json.success) {
        const summary = json.summary || {};
        alert(
          `일괄 업데이트 완료!\n\n` +
          `- 총 선물 지급: ${summary.totalGifts}건\n` +
          `- 설문 연결: ${summary.giftsWithSurvey}건 (${summary.linkedCount}건 새로 연결)\n` +
          `- 설문 체크 완료: ${summary.surveysChecked}건 (${summary.updatedCount}건 새로 체크)`
        );
        fetchSurveys(); // 목록 새로고침
      } else {
        alert(json.message || '일괄 업데이트에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('일괄 업데이트 오류:', error);
      alert(error.message || '일괄 업데이트 중 오류가 발생했습니다.');
    } finally {
      setUpdatingEventCandidates(false);
    }
  };

  // 중요 요소 토글
  const toggleImportantFactor = (factorId: string) => {
    const current = editFormData.important_factors || [];
    const exists = current.includes(factorId);
    setEditFormData(prev => ({
      ...prev,
      important_factors: exists
        ? current.filter(f => f !== factorId)
        : [...current, factorId],
    }));
  };

  // 전화번호 포맷팅
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  // 나이를 연령대 그룹으로 변환
  const convertAgeToAgeGroup = (age: string): string => {
    if (!age) return '';
    const ageNum = parseInt(age);
    if (isNaN(ageNum)) return '';
    if (ageNum < 20) return '10대';
    if (ageNum < 30) return '20대';
    if (ageNum < 40) return '30대';
    if (ageNum < 50) return '40대';
    if (ageNum < 60) return '50대';
    if (ageNum < 70) return '60대';
    if (ageNum < 80) return '70대';
    return '80대 이상';
  };

  // 메시지 생성
  const handleGenerateMessage = async (survey: Survey) => {
    setMessageModal({
      open: true,
      survey,
      message: '',
      customerNeeds: null,
      loading: true,
    });

    try {
      const response = await fetch('/api/survey/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveyId: survey.id, messageType: 'mms' }),
      });

      const result = await response.json();

      if (result.success) {
        setMessageModal({
          open: true,
          survey,
          message: result.data.message,
          customerNeeds: result.data.customerNeeds,
          loading: false,
        });
      } else {
        alert(result.message || '메시지 생성에 실패했습니다.');
        setMessageModal(prev => ({ ...prev, open: false }));
      }
    } catch (error) {
      console.error('메시지 생성 오류:', error);
      alert('메시지 생성 중 오류가 발생했습니다.');
      setMessageModal(prev => ({ ...prev, open: false }));
    }
  };

  // 메시지 미리보기
  const handlePreviewMessage = async (survey: Survey, messageType: 'thank_you' | 'winner') => {
    if (messageType === 'winner' && !survey.is_winner) {
      alert('당첨자가 아닌 고객에게는 당첨 메시지를 발송할 수 없습니다.');
      return;
    }

    setMessagePreviewModal({
      open: true,
      survey,
      messageType,
      message: '',
      loading: true,
    });

    try {
      const res = await fetch(`/api/admin/surveys/send-messages?surveyId=${survey.id}&messageType=${messageType}`);
      const json = await res.json();

      if (json.success) {
        setMessagePreviewModal({
          open: true,
          survey,
          messageType,
          message: json.data.message,
          loading: false,
        });
      } else {
        alert(json.message || '메시지 미리보기에 실패했습니다.');
        setMessagePreviewModal(prev => ({ ...prev, open: false }));
      }
    } catch (error: any) {
      console.error('메시지 미리보기 오류:', error);
      alert('메시지 미리보기 중 오류가 발생했습니다.');
      setMessagePreviewModal(prev => ({ ...prev, open: false }));
    }
  };

  // 메시지 실제 발송 (미리보기에서 확인 후)
  const handleConfirmSendMessage = async () => {
    if (!messagePreviewModal.survey || !messagePreviewModal.messageType) {
      console.error('[발송] 필수 데이터 누락:', {
        survey: !!messagePreviewModal.survey,
        messageType: messagePreviewModal.messageType,
      });
      alert('발송할 메시지 정보가 없습니다.');
      return;
    }

    console.log('[발송] 발송 시작:', {
      surveyId: messagePreviewModal.survey.id,
      messageType: messagePreviewModal.messageType,
      surveyName: messagePreviewModal.survey.name,
      phone: messagePreviewModal.survey.phone,
    });

    setSendingMessages(true);
    try {
      const requestBody = {
        surveyIds: [messagePreviewModal.survey!.id],
        messageType: messagePreviewModal.messageType,
        sendToAll: false,
      };
      
      console.log('[발송] API 요청:', requestBody);

      const res = await fetch('/api/admin/surveys/send-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log('[발송] API 응답 상태:', res.status, res.statusText);

      const json = await res.json();
      console.log('[발송] API 응답 데이터:', json);
      
      // ⭐ 상세 로그 추가
      console.log('[발송] 상세 분석:', {
        success: json.success,
        message: json.message,
        data: json.data,
        sent: json.data?.sent,
        failed: json.data?.failed,
        total: json.data?.total,
        errors: json.data?.errors,
        errorCount: json.data?.errors?.length || 0,
      });
      
      // 에러가 있으면 상세 출력
      if (json.data?.errors && json.data.errors.length > 0) {
        console.error('[발송] 발송 실패 상세:', {
          errorCount: json.data.errors.length,
          errors: json.data.errors,
        });
        json.data.errors.forEach((error: string, index: number) => {
          console.error(`[발송] 에러 ${index + 1}:`, error);
        });
      }

      if (json.success) {
        // ⭐ 성공 여부를 더 정확히 판단
        const actualSent = json.data?.sent || 0;
        const actualFailed = json.data?.failed || 0;
        
        console.log('[발송] 최종 결과:', {
          actualSent,
          actualFailed,
          isSuccess: actualSent > 0 && actualFailed === 0,
          isPartial: actualSent > 0 && actualFailed > 0,
          isFailed: actualSent === 0,
        });
        
        if (actualSent > 0) {
          setMessageSendResults(json.data);
          setMessagePreviewModal({ open: false, survey: null, messageType: null, message: '', loading: false });
          alert(json.message || '메시지가 발송되었습니다.');
          // 발송 완료 후 목록 새로고침 (발송 상태 업데이트 반영)
          fetchSurveys();
        } else {
          // 실제로는 발송되지 않았지만 API는 success: true를 반환한 경우
          console.error('[발송] 실제 발송 실패 (API는 success지만 sent=0):', json);
          const errorMsg = json.data?.errors?.[0] || json.message || '메시지 발송에 실패했습니다.';
          alert(`발송 실패: ${errorMsg}`);
        }
      } else {
        console.error('[발송] API 실패:', json);
        alert(json.message || '메시지 발송에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('[발송] 메시지 발송 오류:', error);
      alert(`메시지 발송 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setSendingMessages(false);
    }
  };

  // 버튼명 생성 함수
  const getMessageButtonText = (messageType: 'thank_you' | 'winner', selectedCount: number, totalCount: number): string => {
    const messageName = messageType === 'thank_you' ? '감사 메시지' : '당첨 메시지';
    
    if (selectedCount === 0) {
      return `${messageName} 발송`;
    } else if (selectedCount === totalCount) {
      return `${messageName} 전체 (${totalCount}개)`;
    } else {
      return `${messageName} 발송 (${selectedCount}개)`;
    }
  };

  // 일괄 메시지 발송
  const handleBulkSendMessages = async (messageType: 'thank_you' | 'winner', sendToAll: boolean = false) => {
    const targetCount = sendToAll ? surveys.length : selectedIds.length;
    const targetText = sendToAll ? '전체' : '선택된';

    if (!sendToAll && selectedIds.length === 0) {
      alert('발송할 설문을 선택해주세요.');
      return;
    }

    if (messageType === 'winner') {
      // 당첨 메시지인 경우 당첨자만 필터링 (이미 발송된 설문 제외)
      const targetSurveys = sendToAll
        ? surveys.filter(s => s.is_winner && !s.winner_message_sent_at)
        : surveys.filter(s => selectedIds.includes(s.id) && s.is_winner && !s.winner_message_sent_at);

      if (targetSurveys.length === 0) {
        alert('발송 가능한 당첨자가 없습니다. (이미 발송된 설문 제외)');
        return;
      }

      const alreadySentCount = sendToAll
        ? surveys.filter(s => s.is_winner && s.winner_message_sent_at).length
        : surveys.filter(s => selectedIds.includes(s.id) && s.is_winner && s.winner_message_sent_at).length;

      if (alreadySentCount > 0) {
        if (!confirm(`${targetText} 설문 중 당첨자 ${targetSurveys.length}명에게 당첨 메시지를 발송하시겠습니까?\n(이미 발송된 ${alreadySentCount}명은 제외됩니다.)`)) {
          return;
        }
      } else {
        if (!confirm(`${targetText} 설문 중 당첨자 ${targetSurveys.length}명에게 당첨 메시지를 발송하시겠습니까?`)) {
          return;
        }
      }
    } else {
      // 감사 메시지인 경우 이미 발송된 설문 제외
      const targetSurveys = sendToAll
        ? surveys.filter(s => !s.thank_you_message_sent_at)
        : surveys.filter(s => selectedIds.includes(s.id) && !s.thank_you_message_sent_at);

      if (targetSurveys.length === 0) {
        alert('발송 가능한 설문이 없습니다. (이미 발송된 설문 제외)');
        return;
      }

      const alreadySentCount = sendToAll
        ? surveys.filter(s => s.thank_you_message_sent_at).length
        : surveys.filter(s => selectedIds.includes(s.id) && s.thank_you_message_sent_at).length;

      if (alreadySentCount > 0) {
        if (!confirm(`${targetText} 설문 중 ${targetSurveys.length}명에게 감사 메시지를 발송하시겠습니까?\n(이미 발송된 ${alreadySentCount}명은 제외됩니다.)`)) {
          return;
        }
      } else {
        if (!confirm(`${targetText} ${targetSurveys.length}명에게 감사 메시지를 발송하시겠습니까?`)) {
          return;
        }
      }
    }

    setSendingMessages(true);
    try {
      // 이미 발송된 설문 제외
      let targetSurveyIds: string[];
      if (messageType === 'winner') {
        const targetSurveys = sendToAll
          ? surveys.filter(s => s.is_winner && !s.winner_message_sent_at)
          : surveys.filter(s => selectedIds.includes(s.id) && s.is_winner && !s.winner_message_sent_at);
        targetSurveyIds = targetSurveys.map(s => s.id);
      } else {
        const targetSurveys = sendToAll
          ? surveys.filter(s => !s.thank_you_message_sent_at)
          : surveys.filter(s => selectedIds.includes(s.id) && !s.thank_you_message_sent_at);
        targetSurveyIds = targetSurveys.map(s => s.id);
      }

      if (targetSurveyIds.length === 0) {
        alert('발송 가능한 설문이 없습니다.');
        setSendingMessages(false);
        return;
      }

      const res = await fetch('/api/admin/surveys/send-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyIds: sendToAll ? undefined : targetSurveyIds,
          messageType,
          sendToAll,
        }),
      });

      const json = await res.json();

      if (json.success) {
        setMessageSendResults(json.data);
        alert(json.message || '메시지가 발송되었습니다.');
        // 발송 완료 후 목록 새로고침 (발송 상태 업데이트 반영)
        fetchSurveys();
        if (json.data?.errors && json.data.errors.length > 0) {
          console.error('발송 오류 목록:', json.data.errors);
        }
      } else {
        alert(json.message || '메시지 발송에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('메시지 발송 오류:', error);
      alert('메시지 발송 중 오류가 발생했습니다.');
    } finally {
      setSendingMessages(false);
    }
  };

  // 일괄 분석
  const handleBulkAnalyze = async () => {
    if (selectedIds.length === 0) {
      alert('분석할 설문을 선택해주세요.');
      return;
    }

    setAnalysisModal({
      open: true,
      loading: true,
      data: null,
    });

    try {
      const response = await fetch('/api/survey/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveyIds: selectedIds }),
      });

      const result = await response.json();

      if (result.success) {
        setAnalysisModal({
          open: true,
          loading: false,
          data: result.data,
        });
      } else {
        alert(result.message || '분석에 실패했습니다.');
        setAnalysisModal(prev => ({ ...prev, open: false }));
      }
    } catch (error) {
      console.error('분석 오류:', error);
      alert('분석 중 오류가 발생했습니다.');
      setAnalysisModal(prev => ({ ...prev, open: false }));
    }
  };

  // 메시지 복사
  const handleCopyMessage = () => {
    if (messageModal.message) {
      navigator.clipboard.writeText(messageModal.message);
      alert('메시지가 클립보드에 복사되었습니다.');
    }
  };

  // 일괄 삭제
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      alert('선택된 항목이 없습니다.');
      return;
    }

    const confirmMessage = `선택한 ${selectedIds.length}개의 설문을 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다.`;
    if (!confirm(confirmMessage)) return;

    setIsDeleting(true);
    try {
      const response = await fetch('/api/survey/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });

      const result = await response.json();

      if (result.success) {
        alert(result.message || '삭제되었습니다.');
        setSelectedIds([]);
        fetchSurveys();
        fetchStats();
      } else {
        alert(result.message || '일괄 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('일괄 삭제 오류:', error);
      alert('일괄 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Head>
        <title>설문 조사 관리 - MASGOLF</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">설문 조사 관리</h1>
            <p className="text-gray-600 mt-2">MASSGOO X MUZIIK 설문 조사 결과를 관리합니다.</p>
          </div>

          {/* 탭 네비게이션 */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('surveys')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'surveys'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                설문 목록
              </button>
              <button
                onClick={() => setActiveTab('prize')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'prize'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                경품 추천 이력
              </button>
              <button
                onClick={() => setActiveTab('geocoding')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'geocoding'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                위치 정보 관리
              </button>
            </nav>
          </div>

          {/* 탭별 콘텐츠 */}
          {activeTab === 'surveys' && (
            <>

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {surveyStats && (
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-600 mb-3">총 참여자 수</div>
                <div className="text-3xl font-bold text-gray-900 mb-4">{surveyStats.uniquePhones}</div>
                <div className="border-t border-gray-200 pt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">총 설문 수</span>
                    <span className="text-lg font-semibold text-gray-900">{surveyStats.totalSurveys}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">중복 설문</span>
                    <span className="text-lg font-semibold text-orange-600">{surveyStats.duplicateCount}</span>
                  </div>
                </div>
              </div>
            )}
            {stats && (
              <>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-sm text-gray-600">비거리 선택</div>
                  <div className="text-2xl font-bold text-gray-900">{stats.byFactor?.distance || 0}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-sm text-gray-600">방향성 선택</div>
                  <div className="text-2xl font-bold text-gray-900">{stats.byFactor?.direction || 0}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-sm text-gray-600">타구감 선택</div>
                  <div className="text-2xl font-bold text-gray-900">{stats.byFactor?.feel || 0}</div>
                </div>
              </>
            )}
          </div>

          {/* 필터 및 일괄 삭제 */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="이름, 전화번호"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">모델 필터</label>
                <select
                  value={selectedModelFilter}
                  onChange={(e) => setSelectedModelFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">전체</option>
                  <option value="beryl-47g">풀티타늄 베릴 47g</option>
                  <option value="beryl-42g">풀티타늄 베릴 42g</option>
                  <option value="sapphire-53g">원플렉스 사파이어 53g</option>
                  <option value="sapphire-44g">원플렉스 사파이어 44g</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">연령대 필터</label>
                <select
                  value={ageGroupFilter}
                  onChange={(e) => setAgeGroupFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">전체</option>
                  <option value="20대">20대</option>
                  <option value="30대">30대</option>
                  <option value="40대">40대</option>
                  <option value="50대">50대</option>
                  <option value="60대">60대</option>
                  <option value="70대">70대</option>
                  <option value="80대 이상">80대 이상</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">당첨자 필터</label>
                <select
                  value={winnerFilter}
                  onChange={(e) => setWinnerFilter(e.target.value as 'all' | 'winner' | 'non_winner')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">전체</option>
                  <option value="winner">당첨자</option>
                  <option value="non_winner">비당첨자</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">구매자 필터</label>
                <select
                  value={purchasedFilter}
                  onChange={(e) => setPurchasedFilter(e.target.value as 'all' | 'purchased' | 'non_purchased')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">전체</option>
                  <option value="purchased">구매자</option>
                  <option value="non_purchased">비구매자</option>
                </select>
              </div>
            </div>
            
            {/* 두 번째 행: 추천명 필터 */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">추천명 필터</label>
                <select
                  value={recommendationNameFilter}
                  onChange={(e) => setRecommendationNameFilter(e.target.value)}
                  className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">전체</option>
                  {prizeHistoryList
                    .filter((stat: any) => stat.recommendation_name && stat.recommendation_name.trim() !== '')
                    .map((stat: any, index: number) => {
                      // 중복 제거: 같은 추천명이 여러 번 나타날 수 있으므로 첫 번째 것만 사용
                      const isFirst = prizeHistoryList.findIndex(
                        (s: any) => s.recommendation_name === stat.recommendation_name
                      ) === index;
                      if (!isFirst) return null;
                      
                      return (
                        <option
                          key={`${stat.date}_${stat.recommendation_datetime || 'no-time'}_${index}`}
                          value={`${stat.date}_${stat.recommendation_datetime || ''}`}
                        >
                          {stat.recommendation_name}
                        </option>
                      );
                    })
                    .filter(Boolean)}
                </select>
              </div>
            </div>
            
            {/* 일괄 작업 버튼 */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex gap-2">
                <button
                  onClick={handleCreateSurvey}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  ➕ 새 설문 추가 (테스트)
                </button>
              </div>
              {selectedIds.length > 0 ? (
                <>
                <span className="text-sm text-gray-700">
                  {selectedIds.length}개 항목 선택됨
                </span>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={handleBulkAnalyze}
                    disabled={analysisModal.loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {analysisModal.loading ? '분석 중...' : `선택한 ${selectedIds.length}개 분석`}
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {isDeleting ? '삭제 중...' : `선택한 ${selectedIds.length}개 삭제`}
                  </button>
                  {/* 메시지 발송 버튼 (선택 상태에 따라 동적) */}
                  <button
                    onClick={() => handleBulkSendMessages('thank_you', selectedIds.length === surveys.length)}
                    disabled={sendingMessages}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {sendingMessages ? '발송 중...' : getMessageButtonText('thank_you', selectedIds.length, surveys.length)}
                  </button>
                  <button
                    onClick={() => handleBulkSendMessages('winner', selectedIds.length === surveys.length)}
                    disabled={sendingMessages}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {sendingMessages ? '발송 중...' : getMessageButtonText('winner', selectedIds.length, surveys.length)}
                  </button>
                </div>
                </>
              ) : (
                <>
                  <span className="text-sm text-gray-700">
                    일괄 작업
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    {/* 경품 추천 버튼 제거 - 경품 추천 이력 탭으로 이동 */}
                    <button
                      onClick={handleBulkUpdateEventCandidates}
                      disabled={updatingEventCandidates}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      {updatingEventCandidates ? '업데이트 중...' : '🎁 선물 지급 설문 자동 연결 및 업데이트'}
                    </button>
                    {/* 메시지 발송 버튼 (선택 항목 없을 때) */}
                    <button
                      onClick={() => handleBulkSendMessages('thank_you', true)}
                      disabled={sendingMessages}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      {sendingMessages ? '발송 중...' : getMessageButtonText('thank_you', 0, surveys.length)}
                    </button>
                    <button
                      onClick={() => handleBulkSendMessages('winner', true)}
                      disabled={sendingMessages}
                      className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      {sendingMessages ? '발송 중...' : getMessageButtonText('winner', 0, surveys.length)}
                    </button>
              </div>
                </>
            )}
            </div>
          </div>

          {/* 테이블 */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">로딩 중...</div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">{error}</div>
            ) : surveys.length === 0 ? (
              <div className="p-8 text-center text-gray-500">설문 결과가 없습니다.</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={selectedIds.length === surveys.length && surveys.length > 0}
                            onChange={handleToggleAll}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center gap-1">
                            이름
                            {sortBy === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('phone')}
                        >
                          <div className="flex items-center gap-1">
                            전화번호
                            {sortBy === 'phone' && (sortOrder === 'asc' ? '▲' : '▼')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('age_group')}
                        >
                          <div className="flex items-center gap-1">
                            연령대
                            {sortBy === 'age_group' && (sortOrder === 'asc' ? '▲' : '▼')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('selected_model')}
                        >
                          <div className="flex items-center gap-1">
                            선택 모델
                            {sortBy === 'selected_model' && (sortOrder === 'asc' ? '▲' : '▼')}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          중요 요소
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('created_at')}
                        >
                          <div className="flex items-center gap-1">
                            제출일
                            {sortBy === 'created_at' && (sortOrder === 'asc' ? '▲' : '▼')}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          작업
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(() => {
                        // 전화번호별로 설문 그룹화
                        const groupedSurveys = new Map<string, Survey[]>();
                        surveys.forEach((survey) => {
                          const phone = survey.phone;
                          if (!groupedSurveys.has(phone)) {
                            groupedSurveys.set(phone, []);
                          }
                          groupedSurveys.get(phone)!.push(survey);
                        });

                        // 각 그룹을 날짜순으로 정렬 (최신순)
                        groupedSurveys.forEach((group) => {
                          group.sort((a, b) => 
                            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                          );
                        });

                        // 렌더링할 설문 목록 생성
                        const renderSurveys: Array<{ survey: Survey; isDuplicate: boolean; isExpanded: boolean; duplicateCount: number }> = [];
                        groupedSurveys.forEach((group, phone) => {
                          // 전체 설문 기준으로 중복 확인 (duplicateMap 사용)
                          const totalCount = duplicateMap.get(phone) || 0;
                          const isDuplicate = totalCount > 1; // 전체 설문 기준
                          const isExpanded = expandedPhones.has(phone);
                          
                          if (isDuplicate) {
                            // 중복인 경우: 최신 설문만 기본 표시
                            renderSurveys.push({
                              survey: group[0],
                              isDuplicate: true,
                              isExpanded: isExpanded,
                              duplicateCount: totalCount // 전체 설문 기준 카운트
                            });
                            
                            // 펼쳐진 경우 나머지 설문도 표시
                            if (isExpanded) {
                              group.slice(1).forEach((survey) => {
                                renderSurveys.push({
                                  survey,
                                  isDuplicate: true,
                                  isExpanded: true,
                                  duplicateCount: group.length
                                });
                              });
                            }
                          } else {
                            // 중복이 아닌 경우: 그대로 표시
                            renderSurveys.push({
                              survey: group[0],
                              isDuplicate: false,
                              isExpanded: false,
                              duplicateCount: 1
                            });
                          }
                        });

                        return renderSurveys.map((item, idx) => {
                          const { survey, isDuplicate, isExpanded, duplicateCount } = item;
                          const isFirstInGroup = idx === 0 || renderSurveys[idx - 1].survey.phone !== survey.phone;
                          
                          return (
                            <tr 
                              key={survey.id} 
                              className={`hover:bg-gray-50 ${!isFirstInGroup ? 'bg-gray-50' : ''}`}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={selectedIds.includes(survey.id)}
                                  onChange={() => handleToggleSelect(survey.id)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setViewSurvey(survey)}
                                    className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                                    role="button"
                                    tabIndex={0}
                                  >
                                    {survey.name}
                                  </button>
                                  {isDuplicate && isFirstInGroup && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newExpanded = new Set(expandedPhones);
                                        if (newExpanded.has(survey.phone)) {
                                          newExpanded.delete(survey.phone);
                                        } else {
                                          newExpanded.add(survey.phone);
                                        }
                                        setExpandedPhones(newExpanded);
                                      }}
                                      className="text-xs text-gray-500 hover:text-gray-700"
                                      title={`같은 전화번호로 ${duplicateCount}개의 설문이 있습니다. 클릭하여 ${isExpanded ? '접기' : '펼치기'}`}
                                    >
                                      {isExpanded ? '▼' : '▶'} 중복({duplicateCount})
                                    </button>
                                  )}
                                </div>
                                <div className="mt-1 flex gap-1 flex-wrap">
                                  {/* 중복 배지 제거 - 이름 옆에 "중복(2)" 버튼이 이미 있으므로 */}
                                  {survey.event_candidate && (
                                    <span className="inline-flex px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-[10px]">
                                      응모
                                    </span>
                                  )}
                                  {survey.event_winner && (
                                    <span className="inline-flex px-1.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px]">
                                      당첨
                                    </span>
                                  )}
                                  {survey.is_winner && (
                                    <span className="inline-flex px-1.5 py-0.5 rounded-full bg-green-100 text-green-800 text-[10px] font-semibold">
                                      🎁 경품 당첨
                                    </span>
                                  )}
                                  {survey.gift_delivered && (
                                    <span className="inline-flex px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px]">
                                      🎁 선물
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatPhoneNumber(survey.phone)}
                              </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {survey.age_group || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getModelName(survey.selected_model)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {getFactorNames(survey.important_factors)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(survey.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex flex-col gap-1">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleGenerateMessage(survey)}
                                  className="text-green-600 hover:text-green-900 font-medium"
                                  title="맞춤형 메시지 생성"
                                >
                                  메시지
                                </button>
                                <button
                                  onClick={() => handleEdit(survey)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  수정
                                </button>
                                <button
                                  onClick={() => handleGoToCustomerManagement(survey)}
                                  className="text-purple-600 hover:text-purple-900"
                                  title="고객관리 페이지에서 수정"
                                >
                                  고객관리
                                </button>
                                <button
                                  onClick={() => handleDelete(survey.id)}
                                  disabled={isDeleting}
                                  className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  삭제
                                </button>
                              </div>
                              <div className="flex gap-2 mt-1">
                                <button
                                  onClick={() => handlePreviewMessage(survey, 'thank_you')}
                                  disabled={sendingMessages}
                                  className={`text-xs px-2 py-1 rounded hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed ${
                                    survey.thank_you_message_sent_at 
                                      ? 'bg-orange-50 text-orange-700' 
                                      : 'bg-blue-50 text-blue-700'
                                  }`}
                                  title={survey.thank_you_message_sent_at ? "감사 메시지 재발송" : "감사 메시지 미리보기 및 발송"}
                                >
                                  {survey.thank_you_message_sent_at ? '감사 메시지 재발송' : '감사 메시지'}
                                  {survey.thank_you_message_sent_at && (
                                    <span className="ml-1 text-xs text-gray-500">
                                      ({new Date(survey.thank_you_message_sent_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })})
                                    </span>
                                  )}
                                </button>
                                <button
                                  onClick={() => handlePreviewMessage(survey, 'winner')}
                                  disabled={sendingMessages || !survey.is_winner}
                                  className={`text-xs px-2 py-1 rounded hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed ${
                                    survey.winner_message_sent_at 
                                      ? 'bg-orange-50 text-orange-700' 
                                      : 'bg-green-50 text-green-700'
                                  }`}
                                  title={survey.winner_message_sent_at ? "당첨 메시지 재발송" : survey.is_winner ? "당첨 메시지 미리보기 및 발송" : "당첨자만 발송 가능"}
                                >
                                  {survey.winner_message_sent_at ? '당첨 메시지 재발송' : '당첨 메시지'}
                                  {survey.winner_message_sent_at && (
                                    <span className="ml-1 text-xs text-gray-500">
                                      ({new Date(survey.winner_message_sent_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })})
                                    </span>
                                  )}
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>

              </>
            )}
          </div>
            </>
          )}

          {/* 경품 추천 이력 탭 */}
          {activeTab === 'prize' && (
            <div className="space-y-6">
              {/* 헤더 및 액션 */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">경품 추천 이력</h2>
                    <p className="text-gray-600 mt-1">저장된 경품 추천 결과를 조회하고 비교 분석할 수 있습니다.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreatePrizeRecommendation}
                      disabled={recommendingPrizes}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      title="새로운 경품 추천을 생성합니다"
                    >
                      {recommendingPrizes ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          생성 중...
                        </span>
                      ) : (
                        '🆕 새 경품 추천 생성'
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* 점수 기준 표 */}
              <div className="bg-white rounded-lg shadow p-4">
                <button
                  onClick={() => setScoreCriteriaExpanded(!scoreCriteriaExpanded)}
                  className="flex items-center justify-between w-full text-left mb-3 hover:text-blue-600 transition-colors"
                >
                  <h3 className="text-sm font-bold text-gray-900">📊 점수 계산 기준</h3>
                  <svg
                    className={`w-5 h-5 transform transition-transform ${scoreCriteriaExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {scoreCriteriaExpanded && (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-2 py-1 text-left">항목</th>
                            <th className="px-2 py-1 text-center">최대 점수</th>
                            <th className="px-2 py-1 text-left">설명</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          <tr>
                            <td className="px-2 py-1 font-medium">거리</td>
                            <td className="px-2 py-1 text-center">40점</td>
                            <td className="px-2 py-1 text-gray-600">가까울수록 높음 (모든 고객)</td>
                          </tr>
                          <tr>
                            <td className="px-2 py-1 font-medium">설문 품질</td>
                            <td className="px-2 py-1 text-center">20점</td>
                            <td className="px-2 py-1 text-gray-600">품질 × 2 (모든 고객)</td>
                          </tr>
                          <tr>
                            <td className="px-2 py-1 font-medium">시타 방문</td>
                            <td className="px-2 py-1 text-center">15점</td>
                            <td className="px-2 py-1 text-gray-600">방문 × 1.5 (모든 고객)</td>
                          </tr>
                          <tr>
                            <td className="px-2 py-1 font-medium">예약</td>
                            <td className="px-2 py-1 text-center">10점</td>
                            <td className="px-2 py-1 text-gray-600">예약 × 2 (모든 고객)</td>
                          </tr>
                          <tr>
                            <td className="px-2 py-1 font-medium">구매 경과 기간</td>
                            <td className="px-2 py-1 text-center">30점</td>
                            <td className="px-2 py-1 text-gray-600">1-3년 고객 최대 가중치 (구매 고객만)</td>
                          </tr>
                          <tr>
                            <td className="px-2 py-1 font-medium">최근 활동</td>
                            <td className="px-2 py-1 text-center">15점</td>
                            <td className="px-2 py-1 text-gray-600">30일 이내 최대 (모든 고객)</td>
                          </tr>
                          <tr>
                            <td className="px-2 py-1 font-medium">선물</td>
                            <td className="px-2 py-1 text-center">+5 ~ -10점</td>
                            <td className="px-2 py-1 text-gray-600">많이 받을수록 감점</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    {/* 제정/개정 날짜 표시 */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500 text-right">
                        2026년 1월 7일 제정
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* 이력 목록 */}
              {loadingPrizeHistory ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <svg className="animate-spin h-8 w-8 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-600">이력을 조회하는 중입니다...</p>
                  </div>
                </div>
              ) : prizeHistoryList.length > 0 ? (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900">경품 추천 이력 목록</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">추천일</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">추천 시간</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">추천명</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">고유 고객</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">중복 설문</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">구매</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">비구매</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">전체 설문</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">최고 점수</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">평균 점수</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {prizeHistoryList.map((stat: any) => {
                          // recommendation_datetime을 한국 시간으로 포맷팅 (시간만)
                          // SMS/MMS 관리 페이지와 동일한 방식 사용
                          const timeOnly = stat.recommendation_datetime 
                            ? (() => {
                                try {
                                  // UTC 문자열을 파싱 (UTC로 해석)
                                  const utcDate = new Date(stat.recommendation_datetime);
                                  if (Number.isNaN(utcDate.getTime())) return '-';
                                  
                                  // UTC 시간에 9시간을 더하여 KST로 변환
                                  const kstDate = new Date(utcDate.getTime() + KST_OFFSET_MS);
                                  
                                  // 시간만 추출하여 포맷팅: "오전 09:30" 또는 "오후 03:42"
                                  const hour = kstDate.getHours();
                                  const minute = String(kstDate.getMinutes()).padStart(2, '0');
                                  const ampm = hour < 12 ? '오전' : '오후';
                                  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                                  
                                  return `${ampm} ${displayHour}:${minute}`;
                                } catch {
                                  return '-';
                                }
                              })()
                            : '-';
                          
                          return (
                            <tr key={`${stat.date || 'no-date'}_${stat.recommendation_datetime || 'no-time'}`} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                {stat.date || '-'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                {timeOnly}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {editingRecommendationName?.date === stat.date && editingRecommendationName?.datetime === stat.recommendation_datetime ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={editingNameValue}
                                      onChange={(e) => setEditingNameValue(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleUpdateRecommendationName(stat.date, stat.recommendation_datetime || null);
                                        } else if (e.key === 'Escape') {
                                          setEditingRecommendationName(null);
                                          setEditingNameValue('');
                                        }
                                      }}
                                      className="px-2 py-1 border border-gray-300 rounded text-sm w-48"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => handleUpdateRecommendationName(stat.date, stat.recommendation_datetime || null)}
                                      disabled={updatingRecommendationName}
                                      className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                                    >
                                      저장
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingRecommendationName(null);
                                        setEditingNameValue('');
                                      }}
                                      className="px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                                    >
                                      취소
                                    </button>
                                  </div>
                                ) : (
                                  <div
                                    className="cursor-pointer hover:text-blue-600 hover:underline"
                                    onClick={() => {
                                      setEditingRecommendationName({ date: stat.date, datetime: stat.recommendation_datetime || null });
                                      setEditingNameValue(stat.recommendation_name || '');
                                    }}
                                    title="클릭하여 이름 수정"
                                  >
                                    {stat.recommendation_name || <span className="text-gray-400 italic">이름 없음 (클릭하여 추가)</span>}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {stat.all}명
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                {stat.duplicateCount > 0 ? (
                                  <span className="text-orange-600 font-medium">{stat.duplicateCount}개</span>
                                ) : (
                                  <span className="text-gray-400">0개</span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600 font-medium">
                                {stat.purchased}명
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-orange-600 font-medium">
                                {stat.nonPurchased}명
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                {stat.total}개
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                                {stat.topScore?.toFixed(2) || '0.00'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                {stat.avgScore?.toFixed(2) || '0.00'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={async () => {
                                      setSelectedDetailDate(stat.date);
                                      setSelectedDetailDateTime(stat.recommendation_datetime || null);
                                      setPrizeHistoryFilter('all');
                                      await fetchPrizeHistoryDetail(stat.date, stat.recommendation_datetime || undefined, true);
                                      await fetchPrizeSelections(stat.date, stat.recommendation_datetime || undefined);
                                    }}
                                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                  >
                                    상세보기
                                  </button>
                                  <button
                                    onClick={() => handleDeletePrizeHistory(stat.date, stat.recommendation_datetime)}
                                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                  >
                                    삭제
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-gray-700 font-medium text-lg mb-2">경품 추천 이력이 없습니다</p>
                  <p className="text-sm text-gray-500">상단의 "🆕 새 경품 추천 생성" 버튼을 클릭하여 경품 추천을 생성해주세요.</p>
                </div>
              )}

              {/* 상세보기 모달 */}
              {selectedDetailDate && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                      <div>
                        <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {selectedDetailDate} 경품 추천 상세
                          {prizeHistoryDetail?.recommendation_name && (
                            <span className="text-blue-600 ml-2">- {prizeHistoryDetail.recommendation_name}</span>
                          )}
                          {' '}(
                            {prizeHistoryFilter !== 'all' 
                              ? (() => {
                                  const winnerSurveyIds = new Set(
                                    prizeSelections
                                      .filter((s: any) => {
                                        if (s.recommendation_date !== selectedDetailDate) return false;
                                        if (selectedDetailDateTime && s.recommendation_datetime && s.recommendation_datetime !== selectedDetailDateTime) return false;
                                        return s.selection_status === 'selected';
                                      })
                                      .map((s: any) => s.survey_id)
                                  );
                                  let filtered = prizeHistoryDetail?.recommendations?.filter((item: any) => winnerSurveyIds.has(item.survey_id)) || [];
                                  return filtered.length;
                                })()
                              : prizeHistoryDetail?.total || 0
                            }명
                          )
                            {selectedDetailDateTime && (() => {
                              try {
                                const utcDate = new Date(selectedDetailDateTime);
                                if (!Number.isNaN(utcDate.getTime())) {
                                  const kstDate = new Date(utcDate.getTime() + KST_OFFSET_MS);
                                  const hour = kstDate.getHours();
                                  const minute = String(kstDate.getMinutes()).padStart(2, '0');
                                  const ampm = hour < 12 ? '오전' : '오후';
                                  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                                  return ` (${ampm} ${displayHour}:${minute})`;
                                }
                              } catch {}
                              return '';
                            })()}
                          </h3>
                        </div>
                        {prizeHistoryDetail?.recommendations && (
                          <p className="text-sm text-gray-600 mt-1">
                            고유 고객: {prizeHistoryDetail.recommendations.filter((r: any) => r.is_primary === true).length}명
                            {prizeHistoryDetail.recommendations.filter((r: any) => r.is_duplicate === true).length > 0 && (
                              <span className="ml-2">
                                (중복 설문: {prizeHistoryDetail.recommendations.filter((r: any) => r.is_duplicate === true).length}개)
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 items-center">
                        {prizeHistoryDetail?.recommendations && (() => {
                          const incompleteItems = prizeHistoryDetail.recommendations.filter((r: any) => {
                            const hasAddress = r.address && !['[주소 미제공]', '[직접방문]', '[온라인 전용]', 'N/A'].includes(r.address);
                            return (!r.latitude || !r.longitude) && hasAddress;
                          });
                          return incompleteItems.length > 0 ? (
                            <button
                              onClick={async (e) => {
                                const incompleteItems = prizeHistoryDetail.recommendations.filter((r: any) => {
                                  const hasAddress = r.address && !['[주소 미제공]', '[직접방문]', '[온라인 전용]', 'N/A'].includes(r.address);
                                  return (!r.latitude || !r.longitude) && hasAddress;
                                });
                                
                                if (incompleteItems.length === 0) {
                                  alert('지오코딩 미완료 항목이 없습니다.');
                                  return;
                                }
                                
                                if (!confirm(`지오코딩 미완료 항목 ${incompleteItems.length}개를 재시도하시겠습니까?`)) {
                                  return;
                                }
                                
                                const surveyIds = incompleteItems.map((r: any) => r.survey_id).filter(Boolean);
                                
                                console.log('[상세] 지오코딩 재시도 시작:', {
                                  count: surveyIds.length,
                                  surveyIds: surveyIds.slice(0, 5),
                                });
                                
                                // 로딩 상태 표시
                                const button = e.currentTarget;
                                const originalText = button.textContent;
                                button.disabled = true;
                                button.textContent = `🗺️ 지오코딩 재시도 중... (${incompleteItems.length}개)`;
                                
                                try {
                                  const res = await fetch('/api/admin/surveys/batch-geocoding', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ surveyIds }),
                                  });
                                  
                                  console.log('[상세] API 응답 상태:', res.status, res.statusText);
                                  
                                  if (!res.ok) {
                                    const text = await res.text();
                                    console.error('[상세] API 오류 응답:', text.substring(0, 500));
                                    throw new Error(`API 오류 (${res.status}): ${text.substring(0, 200)}`);
                                  }
                                  
                                  const json = await res.json();
                                  
                                  console.log('[상세] 지오코딩 재시도 결과:', {
                                    success: json.success,
                                    message: json.message,
                                    processed: json.data?.processed,
                                    successCount: json.data?.success,
                                    failedCount: json.data?.failed,
                                    errors: json.data?.errors?.slice(0, 3),
                                  });
                                  
                                  if (json.success) {
                                    const message = `지오코딩 재시도 완료:\n처리: ${json.data.processed || 0}건\n성공: ${json.data.success || 0}건\n실패: ${json.data.failed || 0}건`;
                                    alert(message);
                                    // 상세보기 새로고침 (캐시 정보 반영을 위해 약간의 딜레이)
                                    await new Promise(resolve => setTimeout(resolve, 1000));
                                    await fetchPrizeHistoryDetail(selectedDetailDate || '', selectedDetailDateTime || undefined);
                                  } else {
                                    console.error('[상세] 지오코딩 재시도 실패:', json);
                                    alert(json.message || '지오코딩 재시도에 실패했습니다.');
                                  }
                                } catch (error: any) {
                                  console.error('[상세] 지오코딩 재시도 오류:', {
                                    message: error.message,
                                    stack: error.stack,
                                    error: error,
                                  });
                                  alert(`지오코딩 재시도 중 오류가 발생했습니다.\n\n${error.message || '알 수 없는 오류'}`);
                                } finally {
                                  button.disabled = false;
                                  button.textContent = originalText;
                                }
                              }}
                              className="px-4 py-2 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              title="지오코딩 미완료 항목 재시도"
                            >
                              🗺️ 지오코딩 재시도 ({incompleteItems.length}개)
                            </button>
                          ) : null;
                        })()}
                        <button
                          onClick={handleOpenSelectionModal}
                          disabled={selectingPrizes || !prizeHistoryDetail}
                          className="px-4 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          title="경품 선정 조건 설정"
                        >
                          🎁 경품 선정하기
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDetailDate(null);
                            setPrizeHistoryDetail(null);
                          }}
                          className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-auto p-6">
                      {loadingPrizeHistoryDetail ? (
                        <div className="flex justify-center items-center h-64">
                          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      ) : prizeHistoryDetail && prizeHistoryDetail.recommendations ? (
                        <>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">순위</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">이름</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">전화번호</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">구매여부</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">구매경과</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">점수</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">거리</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">주소</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">최근설문일</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">시타방문</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">선물</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">지오코딩</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">작업</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {(() => {
                                // 필터링된 목록 계산
                                let filteredRecommendations = prizeHistoryDetail.recommendations;
                                
                                // 당첨자 필터 적용
                                if (prizeHistoryFilter !== 'all') {
                                  // 당첨자 survey_id 목록 조회
                                  const winnerSurveyIds = new Set(
                                    prizeSelections
                                      .filter((s: any) => {
                                        // recommendation_date가 일치하는 선정만
                                        if (s.recommendation_date !== selectedDetailDate) return false;
                                        // recommendation_datetime이 있으면 일치하는 것만 (없으면 모든 것)
                                        if (selectedDetailDateTime && s.recommendation_datetime && s.recommendation_datetime !== selectedDetailDateTime) return false;
                                        return s.selection_status === 'selected';
                                      })
                                      .map((s: any) => s.survey_id)
                                  );
                                  
                                  // 당첨자만 필터링
                                  filteredRecommendations = filteredRecommendations.filter((item: any) => 
                                    winnerSurveyIds.has(item.survey_id)
                                  );
                                }
                                
                                // 필터링된 개수 표시를 위한 변수
                                const filteredCount = filteredRecommendations.length;
                                
                                return filteredRecommendations.map((item: any, idx: number) => {
                              // 구매경과(days_since_last_purchase)가 있는 경우만 구매로 표시
                              const isPurchased = item.is_purchased === true && item.days_since_last_purchase != null;
                              
                              // 지오코딩 상태 결정: 완료 > 주소 없음 > 미완료
                              let geocodingStatus = '지오코딩 미완료';
                              let geocodingStatusClass = 'bg-gray-100 text-gray-800';
                              
                              if (item.latitude && item.longitude) {
                                geocodingStatus = '지오코딩 완료';
                                geocodingStatusClass = 'bg-green-100 text-green-800';
                              } else if (!item.address || ['[주소 미제공]', '[직접방문]', '[온라인 전용]', 'N/A'].includes(item.address)) {
                                geocodingStatus = '주소 없음';
                                geocodingStatusClass = 'bg-yellow-100 text-yellow-800';
                              } else {
                                geocodingStatus = '지오코딩 미완료';
                                geocodingStatusClass = 'bg-red-100 text-red-800';
                              }
                              
                              return (
                                <tr key={`${item.recommendation_datetime || item.recommendation_date}-${idx}`} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {item.rank || idx + 1}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                    <div className="flex items-center gap-2">
                                      <span>{item.name || '-'}</span>
                                      {item.is_duplicate && (
                                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
                                          중복
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.phone || '-'}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    <span
                                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                                        isPurchased
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-orange-100 text-orange-800'
                                      }`}
                                    >
                                      {isPurchased ? '구매' : '비구매'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                    {isPurchased && item.days_since_last_purchase !== null && item.days_since_last_purchase !== undefined
                                      ? `${item.days_since_last_purchase}일`
                                      : '-'}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">{item.total_score || 0}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                    {item.distance_km ? `${Number(item.distance_km).toFixed(2)}km` : '-'}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={item.address || ''}>
                                    {item.address || '-'}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                    {item.recent_survey_date 
                                      ? new Date(item.recent_survey_date).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })
                                      : '-'}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-center">
                                    {item.visit_count || 0}회
                                    {selectedDetailDate && (
                                      <span 
                                        className="ml-1 text-xs text-gray-400 cursor-help" 
                                        title={`경품 추천 생성 시점(${selectedDetailDate}) 기준 스냅샷 값입니다. 실제 예약 수와 다를 수 있습니다.`}
                                      >
                                        📸
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-center">
                                    {item.gift_count || 0}회
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${geocodingStatusClass}`}>
                                      {geocodingStatus}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    {prizeSelections.some((s: any) => s.survey_id === item.survey_id) ? (
                                      <span className="text-xs text-gray-500">이미 선정됨</span>
                                    ) : (
                                      <button
                                        onClick={() => handleAddToSelection(item)}
                                        className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                                      >
                                        + 선정 추가
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            });
                              })()}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* 경품 선정 목록 */}
                      {prizeSelections.length > 0 && (
                        <div className="mt-8 border-t border-gray-200 pt-6">
                          <h4 className="text-lg font-bold text-gray-900 mb-4">
                            🎁 경품 선정 목록 ({prizeSelections.length}명)
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-purple-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">순위</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">이름</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">전화번호</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">점수</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">선정 이유</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">상태</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">상태 변경</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">삭제</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {prizeSelections.map((selection: any) => (
                                  <tr key={selection.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{selection.selection_rank}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">{selection.name}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{selection.phone}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold">{selection.total_score || 0}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                      <input
                                        type="text"
                                        value={selection.selection_reason || ''}
                                        onChange={async (e) => {
                                          try {
                                            const res = await fetch('/api/admin/surveys/prize-selections', {
                                              method: 'PUT',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({
                                                id: selection.id,
                                                status: selection.selection_status,
                                                reason: e.target.value,
                                              }),
                                            });
                                            const json = await res.json();
                                            if (json.success) {
                                              await fetchPrizeSelections(selectedDetailDate || '', selectedDetailDateTime || undefined);
                                            } else {
                                              alert(json.message || '선정 사유 업데이트에 실패했습니다.');
                                            }
                                          } catch (error: any) {
                                            console.error('선정 사유 업데이트 오류:', error);
                                            alert('선정 사유 업데이트 중 오류가 발생했습니다.');
                                          }
                                        }}
                                        className="text-xs border border-gray-300 rounded px-2 py-1 w-full max-w-xs"
                                        placeholder="선정 사유"
                                      />
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                                        selection.selection_status === 'delivered' ? 'bg-green-100 text-green-800' :
                                        selection.selection_status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                        selection.selection_status === 'canceled' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {selection.selection_status === 'delivered' ? '지급 완료' :
                                         selection.selection_status === 'confirmed' ? '확정' :
                                         selection.selection_status === 'canceled' ? '취소' :
                                         '선정'}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                      <select
                                        value={selection.selection_status}
                                        onChange={async (e) => {
                                          try {
                                            const res = await fetch('/api/admin/surveys/prize-selections', {
                                              method: 'PUT',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({
                                                id: selection.id,
                                                status: e.target.value,
                                              }),
                                            });
                                            const json = await res.json();
                                            if (json.success) {
                                              await fetchPrizeSelections(selectedDetailDate || '', selectedDetailDateTime || undefined);
                                            } else {
                                              alert(json.message || '상태 업데이트에 실패했습니다.');
                                            }
                                          } catch (error: any) {
                                            console.error('상태 업데이트 오류:', error);
                                            alert('상태 업데이트 중 오류가 발생했습니다.');
                                          }
                                        }}
                                        className="text-xs border border-gray-300 rounded px-2 py-1"
                                      >
                                        <option value="selected">선정</option>
                                        <option value="confirmed">확정</option>
                                        <option value="delivered">지급 완료</option>
                                        <option value="canceled">취소</option>
                                      </select>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                      <button
                                        onClick={() => handleRemoveSelection(selection.id)}
                                        className="text-red-600 hover:text-red-800 text-xs px-2 py-1 border border-red-300 rounded hover:bg-red-50"
                                      >
                                        삭제
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                        </>
                      ) : (
                        <div className="text-center py-12 text-gray-500">상세 정보가 없습니다.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 선정 조건 설정 모달 */}
              {showSelectionModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                      <h3 className="text-xl font-bold text-gray-900">🎁 경품 선정 조건 설정</h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleResetCriteria}
                          className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 border border-gray-300"
                          title="설정값 초기화"
                        >
                          설정값 초기화
                        </button>
                        <button
                          onClick={() => setShowSelectionModal(false)}
                          className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-auto p-6">
                      {/* 통합된 선정 조건 설정 */}
                      <div className="space-y-6">
                        {/* 총 선정 인원 */}
                        <div className="border-2 border-purple-200 rounded-lg p-4">
                          <label className="block text-sm font-medium mb-2 text-purple-700">
                            총 선정 인원
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={selectionCriteria.totalCount}
                              onChange={(e) => {
                                const total = parseInt(e.target.value) || 20;
                                setSelectionCriteria({
                                  ...selectionCriteria,
                                  totalCount: total,
                                });
                              }}
                              min="1"
                              max={prizeHistoryDetail?.recommendations?.filter((r: any) => r.is_primary === true).length || 100}
                              className="w-24 px-3 py-2 border rounded"
                            />
                            <span className="text-sm text-gray-600">명</span>
                            <span className="text-xs text-gray-500">
                              (가능: {prizeHistoryDetail?.recommendations?.filter((r: any) => r.is_primary === true).length || 0}명)
                            </span>
                          </div>
                        </div>

                        {/* 1. 구매자/비구매자 비율 (단일 슬라이드) */}
                        <div className="border-2 border-gray-200 rounded-lg p-4">
                          <label className="block text-sm font-medium mb-2 text-gray-700">
                            구매자 / 비구매자 비율
                          </label>
                          <div className="relative">
                            <div className="flex justify-between text-xs mb-2">
                              <span className="text-blue-700 font-medium">구매자</span>
                              <span className="text-orange-700 font-medium">비구매자</span>
                            </div>
                            
                            {/* 커스텀 슬라이드 */}
                            <div 
                              className="relative h-2 bg-gray-200 rounded-full cursor-pointer"
                              onMouseDown={(e) => {
                                const slider = e.currentTarget;
                                const rect = slider.getBoundingClientRect();
                                const percentage = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                                const newRatio = Math.round(percentage);
                                setSelectionCriteria({
                                  ...selectionCriteria,
                                  purchasedRatio: newRatio,
                                });
                                
                                const handleMouseMove = (moveEvent: MouseEvent) => {
                                  const rect = slider.getBoundingClientRect();
                                  const percentage = Math.max(0, Math.min(100, ((moveEvent.clientX - rect.left) / rect.width) * 100));
                                  const newRatio = Math.round(percentage);
                                  setSelectionCriteria({
                                    ...selectionCriteria,
                                    purchasedRatio: newRatio,
                                  });
                                };
                                
                                const handleMouseUp = () => {
                                  document.removeEventListener('mousemove', handleMouseMove);
                                  document.removeEventListener('mouseup', handleMouseUp);
                                };
                                
                                document.addEventListener('mousemove', handleMouseMove);
                                document.addEventListener('mouseup', handleMouseUp);
                              }}
                            >
                              {/* 핸들 (원) */}
                              <div
                                className="absolute w-4 h-4 bg-blue-600 rounded-full cursor-grab active:cursor-grabbing transform -translate-x-1/2 -translate-y-1/2 shadow-md hover:shadow-lg transition-shadow z-10"
                                style={{ 
                                  left: `${selectionCriteria.purchasedRatio}%`,
                                  top: '50%'
                                }}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  const slider = e.currentTarget.parentElement;
                                  if (!slider) return;
                                  
                                  const handleMouseMove = (moveEvent: MouseEvent) => {
                                    const rect = slider.getBoundingClientRect();
                                    const percentage = Math.max(0, Math.min(100, ((moveEvent.clientX - rect.left) / rect.width) * 100));
                                    const newRatio = Math.round(percentage);
                                    setSelectionCriteria({
                                      ...selectionCriteria,
                                      purchasedRatio: newRatio,
                                    });
                                  };
                                  
                                  const handleMouseUp = () => {
                                    document.removeEventListener('mousemove', handleMouseMove);
                                    document.removeEventListener('mouseup', handleMouseUp);
                                  };
                                  
                                  document.addEventListener('mousemove', handleMouseMove);
                                  document.addEventListener('mouseup', handleMouseUp);
                                }}
                              />
                            </div>
                            
                            <div className="flex justify-between text-sm mt-2">
                              <span className="font-bold text-blue-600">
                                {calculatedPurchasedCount}명 ({100 - selectionCriteria.purchasedRatio}%)
                              </span>
                              <span className="font-bold text-orange-600">
                                {calculatedNonPurchasedCount}명 ({selectionCriteria.purchasedRatio}%)
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 2. 구매 경과 기간 (슬라이드, 점 2개) */}
                        <div className="border-2 border-gray-200 rounded-lg p-4">
                          <label className="block text-sm font-medium mb-2 text-gray-700">
                            구매 경과 기간
                          </label>
                          <div className="mb-2">
                            <label className="flex items-center gap-2 text-xs">
                              <input
                                type="checkbox"
                                checked={selectionCriteria.purchasePeriodAll}
                                onChange={(e) => {
                                  const isAll = e.target.checked;
                                  setSelectionCriteria({
                                    ...selectionCriteria,
                                    purchasePeriodAll: isAll,
                                    purchasePeriodRange: isAll ? { min: 0, max: 600 } : selectionCriteria.purchasePeriodRange,
                                  });
                                }}
                                className="w-3 h-3"
                              />
                              전체
                            </label>
                          </div>
                          {!selectionCriteria.purchasePeriodAll && (
                            <div>
                              <div className="flex justify-between text-xs mb-2 text-gray-500">
                                <span>0개월</span>
                                <span>1개월</span>
                                <span>3개월</span>
                                <span>6개월</span>
                                <span>1년</span>
                                <span>2년</span>
                                <span>3년</span>
                                <span>4년</span>
                                <span>5년+</span>
                              </div>
                              <DualRangeSlider
                                min={0}
                                max={600}
                                values={[selectionCriteria.purchasePeriodRange.min, selectionCriteria.purchasePeriodRange.max]}
                                onChange={(values) => {
                                  const [min, max] = values;
                                  setSelectionCriteria({
                                    ...selectionCriteria,
                                    purchasePeriodRange: { min, max },
                                    // 양 끝이면 전체 자동 체크
                                    purchasePeriodAll: min === 0 && max === 600,
                                  });
                                }}
                                marks={[0, 10, 30, 60, 120, 240, 360, 480, 600]}
                                step={1}
                              />
                              <div className="text-xs text-gray-500 mt-1">
                                {(() => {
                                  const minDays = purchasePeriodToDays(selectionCriteria.purchasePeriodRange.min);
                                  const maxDays = purchasePeriodToDays(selectionCriteria.purchasePeriodRange.max);
                                  const minLabel = minDays === 0 ? '0개월' : minDays <= 30 ? '1개월' : minDays <= 90 ? '3개월' : minDays <= 180 ? '6개월' : minDays <= 365 ? '1년' : minDays <= 730 ? '2년' : minDays <= 1095 ? '3년' : minDays <= 1460 ? '4년' : '5년+';
                                  const maxLabel = maxDays === 0 ? '0개월' : maxDays <= 30 ? '1개월' : maxDays <= 90 ? '3개월' : maxDays <= 180 ? '6개월' : maxDays <= 365 ? '1년' : maxDays <= 730 ? '2년' : maxDays <= 1095 ? '3년' : maxDays <= 1460 ? '4년' : '5년+';
                                  return `${minLabel} ~ ${maxLabel}`;
                                })()}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 3. 거리 (슬라이드, 점 2개, 0-500km) */}
                        <div className="border-2 border-gray-200 rounded-lg p-4">
                          <label className="block text-sm font-medium mb-2 text-gray-700">
                            거리 범위
                          </label>
                          <div className="mb-2">
                            <label className="flex items-center gap-2 text-xs">
                              <input
                                type="checkbox"
                                checked={selectionCriteria.distanceAll}
                                onChange={(e) => {
                                  const isAll = e.target.checked;
                                  setSelectionCriteria({
                                    ...selectionCriteria,
                                    distanceAll: isAll,
                                    distanceRange: isAll ? { min: 0, max: 500 } : selectionCriteria.distanceRange,
                                  });
                                }}
                                className="w-3 h-3"
                              />
                              전체
                            </label>
                          </div>
                          {!selectionCriteria.distanceAll && (
                            <div>
                              <DualRangeSlider
                                min={0}
                                max={500}
                                values={[selectionCriteria.distanceRange.min, selectionCriteria.distanceRange.max]}
                                onChange={(values) => {
                                  const [min, max] = values;
                                  setSelectionCriteria({
                                    ...selectionCriteria,
                                    distanceRange: { min, max },
                                    // 양 끝이면 전체 자동 체크
                                    distanceAll: min === 0 && max === 500,
                                  });
                                }}
                                step={1}
                              />
                              <div className="text-xs text-gray-500 mt-1">
                                {selectionCriteria.distanceRange.min}km ~ {selectionCriteria.distanceRange.max}km
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 4. 나이대 (슬라이드, 점 2개, 0-80+) */}
                        <div className="border-2 border-gray-200 rounded-lg p-4">
                          <label className="block text-sm font-medium mb-2 text-gray-700">
                            나이대 범위
                          </label>
                          
                          {/* 나이대별 분포 그래프 */}
                          <div className="mb-3">
                            <div className="flex justify-between text-xs mb-2 text-gray-500">
                              <span>20대</span>
                              <span>30대</span>
                              <span>40대</span>
                              <span>50대</span>
                              <span>60대</span>
                              <span>70대</span>
                              <span>80대+</span>
                            </div>
                            <div className="flex items-end gap-1 h-16">
                              {['20대', '30대', '40대', '50대', '60대', '70대', '80대+'].map((ageGroup) => {
                                const count = ageDistribution[ageGroup] || 0;
                                const maxCount = Math.max(...Object.values(ageDistribution), 1);
                                const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                                const isInRange = (() => {
                                  const ageGroupMin = ageGroup === '80대+' ? 80 : parseInt(ageGroup);
                                  const ageGroupMax = ageGroup === '80대+' ? 100 : ageGroupMin + 9;
                                  return (
                                    (ageGroupMin >= selectionCriteria.ageRange.min && ageGroupMin <= selectionCriteria.ageRange.max) ||
                                    (ageGroupMax >= selectionCriteria.ageRange.min && ageGroupMax <= selectionCriteria.ageRange.max) ||
                                    (ageGroupMin <= selectionCriteria.ageRange.min && ageGroupMax >= selectionCriteria.ageRange.max)
                                  );
                                })();
                                
                                return (
                                  <div key={ageGroup} className="flex-1 flex flex-col items-center">
                                    <div className="w-full flex flex-col items-center justify-end h-full">
                                      <div
                                        className={`w-full rounded-t transition-all ${
                                          isInRange
                                            ? 'bg-blue-500 hover:bg-blue-600'
                                            : 'bg-gray-300 hover:bg-gray-400'
                                        }`}
                                        style={{ height: `${height}%`, minHeight: count > 0 ? '4px' : '0' }}
                                        title={`${ageGroup}: ${count}명`}
                                      />
                                    </div>
                                    <div className="text-[10px] text-gray-600 mt-1">{count}</div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          
                          <DualRangeSlider
                            min={0}
                            max={80}
                            values={[selectionCriteria.ageRange.min, selectionCriteria.ageRange.max]}
                            onChange={(values) => {
                              setSelectionCriteria({
                                ...selectionCriteria,
                                ageRange: { min: values[0], max: values[1] },
                              });
                            }}
                            marks={[20, 30, 40, 50, 60, 70, 80]}
                            step={1}
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            {(() => {
                              const { min, max } = selectionCriteria.ageRange;
                              const getAgeGroupLabel = (age: number): string => {
                                if (age < 20) return `${age}세`;
                                if (age < 30) return age === 20 ? '20대' : `${age}세`;
                                if (age < 40) return age === 30 ? '30대' : `${age}세`;
                                if (age < 50) return age === 40 ? '40대' : `${age}세`;
                                if (age < 60) return age === 50 ? '50대' : `${age}세`;
                                if (age < 70) return age === 60 ? '60대' : `${age}세`;
                                if (age < 80) return age === 70 ? '70대' : `${age}세`;
                                return '80대+';
                              };
                              
                              const minLabel = getAgeGroupLabel(min);
                              const maxLabel = max === 80 ? '80세+' : getAgeGroupLabel(max);
                              
                              // 같은 나이대 범위 내에 있으면 간단히 표시
                              if (min >= 20 && min < 30 && max >= 20 && max < 30) {
                                return '20대';
                              }
                              if (min >= 30 && min < 40 && max >= 30 && max < 40) {
                                return '30대';
                              }
                              if (min >= 40 && min < 50 && max >= 40 && max < 50) {
                                return '40대';
                              }
                              if (min >= 50 && min < 60 && max >= 50 && max < 60) {
                                return '50대';
                              }
                              if (min >= 60 && min < 70 && max >= 60 && max < 70) {
                                return '60대';
                              }
                              if (min >= 70 && min < 80 && max >= 70 && max < 80) {
                                return '70대';
                              }
                              
                              return `${minLabel} ~ ${maxLabel}`;
                            })()}
                          </div>
                        </div>

                        {/* 5. 시타 방문수 */}
                        <div className="border-2 border-gray-200 rounded-lg p-4">
                          <label className="block text-sm font-medium mb-2 text-gray-700">
                            시타 방문수
                          </label>
                          <div className="flex gap-4 mb-2">
                            <label className="flex items-center gap-2 text-xs">
                              <input
                                type="checkbox"
                                checked={selectionCriteria.visitCountNoVisit}
                                onChange={(e) => setSelectionCriteria({
                                  ...selectionCriteria,
                                  visitCountNoVisit: e.target.checked,
                                })}
                                className="w-3 h-3"
                              />
                              무방문
                            </label>
                            <label className="flex items-center gap-2 text-xs">
                              <input
                                type="checkbox"
                                checked={selectionCriteria.visitCountAll}
                                onChange={(e) => {
                                  const isAll = e.target.checked;
                                  setSelectionCriteria({
                                    ...selectionCriteria,
                                    visitCountAll: isAll,
                                    visitCountRange: isAll ? { min: 1, max: 10 } : selectionCriteria.visitCountRange,
                                  });
                                }}
                                className="w-3 h-3"
                              />
                              방문전체
                            </label>
                          </div>
                          {!selectionCriteria.visitCountAll && (
                            <div>
                              <div className="flex justify-between text-xs mb-2 text-gray-500">
                                <span>1회</span>
                                <span>2회</span>
                                <span>3회</span>
                                <span>4회</span>
                                <span>5회</span>
                                <span>10회+</span>
                              </div>
                              <DualRangeSlider
                                min={1}
                                max={10}
                                values={[selectionCriteria.visitCountRange.min, selectionCriteria.visitCountRange.max]}
                                onChange={(values) => {
                                  setSelectionCriteria({
                                    ...selectionCriteria,
                                    visitCountRange: { min: values[0], max: values[1] },
                                  });
                                }}
                                marks={[1, 2, 3, 4, 5, 10]}
                                step={1}
                              />
                              <div className="text-xs text-gray-500 mt-1">
                                {selectionCriteria.visitCountRange.min}회 ~ {selectionCriteria.visitCountRange.max === 10 ? '10회+' : `${selectionCriteria.visitCountRange.max}회`}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 6. 답변 품질 */}
                        <div className="border-2 border-gray-200 rounded-lg p-4">
                          <label className="block text-sm font-medium mb-2 text-gray-700">
                            답변 품질 점수
                            <span className="text-gray-400 ml-1 text-xs">
                              (중요 고려사항 개수 + 추가 의견 여부)
                            </span>
                          </label>
                          <div className="mb-2">
                            <label className="flex items-center gap-2 text-xs">
                              <input
                                type="checkbox"
                                checked={selectionCriteria.qualityScoreAll}
                                onChange={(e) => {
                                  const isAll = e.target.checked;
                                  setSelectionCriteria({
                                    ...selectionCriteria,
                                    qualityScoreAll: isAll,
                                    qualityScoreRange: isAll ? { min: 0, max: 10 } : selectionCriteria.qualityScoreRange,
                                  });
                                }}
                                className="w-3 h-3"
                              />
                              전체
                            </label>
                          </div>
                          {!selectionCriteria.qualityScoreAll && (
                            <div>
                              <div className="flex justify-between text-xs mb-2 text-gray-500">
                                <span>0점</span>
                                <span>1점</span>
                                <span>2점</span>
                                <span>만점(10점)</span>
                              </div>
                              <DualRangeSlider
                                min={0}
                                max={10}
                                values={[selectionCriteria.qualityScoreRange.min, selectionCriteria.qualityScoreRange.max]}
                                onChange={(values) => {
                                  setSelectionCriteria({
                                    ...selectionCriteria,
                                    qualityScoreRange: { min: values[0], max: values[1] },
                                  });
                                }}
                                marks={[0, 1, 2, 10]}
                                step={1}
                              />
                              <div className="text-xs text-gray-500 mt-1">
                                {selectionCriteria.qualityScoreRange.min}점 ~ {selectionCriteria.qualityScoreRange.max === 10 ? '만점' : `${selectionCriteria.qualityScoreRange.max}점`}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 선정 방식 선택 */}
                        <div className="border-2 border-gray-200 rounded-lg p-4">
                          <label className="block text-sm font-medium mb-2 text-gray-700">
                            선정 방식
                          </label>
                          <select
                            value={selectionCriteria.selectionType}
                            onChange={(e) => setSelectionCriteria({
                              ...selectionCriteria,
                              selectionType: e.target.value as 'auto' | 'manual',
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          >
                            <option value="auto">자동 선정 (필터 조건에 맞는 고객 자동 선택)</option>
                            <option value="manual">수동 선정 (필터 조건에 맞는 고객 목록에서 선택)</option>
                          </select>
                        </div>

                        {/* 수동 선정 시 고객 목록 표시 */}
                        {selectionCriteria.selectionType === 'manual' && (
                          <div className="border-2 border-blue-200 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="text-sm font-semibold">고객 선택</h4>
                              <span className="text-xs text-gray-600">
                                선정 가능 인원: <span className="font-bold text-blue-600">{getFilteredCustomers.length}명</span>
                                {getFilteredCustomers.length !== prizeHistoryDetail?.recommendations?.filter((r: any) => r.is_primary === true).length && (
                                  <span className="text-gray-400 ml-1">
                                    (전체: {prizeHistoryDetail?.recommendations?.filter((r: any) => r.is_primary === true).length}명)
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                              {getFilteredCustomers.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 text-sm">
                                  필터 조건에 맞는 고객이 없습니다.
                                </div>
                              ) : (
                                getFilteredCustomers
                                  .sort((a: any, b: any) => {
                                    // 선택된 고객을 상단으로 정렬
                                    const aSelected = manualSelectedCustomers.includes(a.survey_id);
                                    const bSelected = manualSelectedCustomers.includes(b.survey_id);
                                    if (aSelected && !bSelected) return -1;
                                    if (!aSelected && bSelected) return 1;
                                    return 0;
                                  })
                                  .map((item: any) => {
                                    const isSelected = manualSelectedCustomers.includes(item.survey_id);
                                    const isPurchased = item.is_purchased === true && item.days_since_last_purchase != null;
                                    
                                    return (
                                      <label
                                        key={item.survey_id}
                                        className={`flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => toggleManualCustomerSelection(item.survey_id)}
                                        />
                                        <span className="text-sm">
                                          {item.name} ({item.phone}) - 점수: {item.total_score}
                                          {isPurchased ? ' [구매]' : ' [비구매]'}
                                          {item.distance_km && ` - 거리: ${Number(item.distance_km).toFixed(1)}km`}
                                        </span>
                                      </label>
                                    );
                                  })
                              )}
                            </div>
                            <div className="mt-2 text-sm text-gray-600">
                              선택된 고객: <span className="font-bold text-purple-600">{manualSelectedCustomers.length}명</span>
                            </div>
                            {/* 선택된 고객 목록 표시 (필터 조건과 무관하게 전체 recommendations에서 찾기) */}
                            {manualSelectedCustomers.length > 0 && (
                              <div className="mt-2 p-2 bg-purple-50 rounded border border-purple-200 max-h-32 overflow-y-auto">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="text-xs font-semibold text-purple-700">선택된 고객 목록:</div>
                                  <button
                                    onClick={() => setManualSelectedCustomers([])}
                                    className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 border border-red-300"
                                    title="모든 선택 해제"
                                  >
                                    전체 해제
                                  </button>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {prizeHistoryDetail?.recommendations
                                    ?.filter((r: any) => r.is_primary === true && manualSelectedCustomers.includes(r.survey_id))
                                    .map((item: any) => {
                                      const isPurchased = item.is_purchased === true && item.days_since_last_purchase != null;
                                      const isInFiltered = getFilteredCustomers.some((c: any) => c.survey_id === item.survey_id);
                                      const isAlreadySelected = prizeSelections.some((s: any) => 
                                        s.survey_id === item.survey_id && 
                                        s.recommendation_date === selectedDetailDate &&
                                        (!selectedDetailDateTime || !s.recommendation_datetime || s.recommendation_datetime === selectedDetailDateTime) &&
                                        s.selection_status === 'selected'
                                      );
                                      
                                      return (
                                        <span 
                                          key={item.survey_id} 
                                          className={`text-xs px-2 py-1 rounded border ${
                                            isAlreadySelected
                                              ? 'bg-green-50 border-green-400 text-green-800'
                                              : isInFiltered 
                                                ? 'bg-white border-purple-300' 
                                                : 'bg-yellow-50 border-yellow-300 text-yellow-700'
                                          }`}
                                          title={
                                            isAlreadySelected 
                                              ? '이미 선정된 고객' 
                                              : isInFiltered 
                                                ? '' 
                                                : '현재 필터 조건에서 제외됨'
                                          }
                                        >
                                          {item.name}
                                          {isAlreadySelected && ' ✓'}
                                          {!isInFiltered && !isAlreadySelected && ' ⚠️'}
                                        </span>
                                      );
                                    })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 선정 사유 팩터 선택 */}
                      <div className="border-t pt-4">
                        <h4 className="text-sm font-semibold mb-3">선정 사유에 포함할 항목</h4>
                        <div className="flex flex-wrap gap-4">
                          <label className="text-sm flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={selectionCriteria.reasonFactors.includeDistance}
                              onChange={(e) => setSelectionCriteria({
                                ...selectionCriteria,
                                reasonFactors: {
                                  ...selectionCriteria.reasonFactors,
                                  includeDistance: e.target.checked,
                                },
                              })}
                            />
                            거리
                          </label>
                          <label className="text-sm flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={selectionCriteria.reasonFactors.includePurchasePeriod}
                              onChange={(e) => setSelectionCriteria({
                                ...selectionCriteria,
                                reasonFactors: {
                                  ...selectionCriteria.reasonFactors,
                                  includePurchasePeriod: e.target.checked,
                                },
                              })}
                            />
                            구매 경과 기간
                          </label>
                          <label className="text-sm flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={selectionCriteria.reasonFactors.includeVisitCount}
                              onChange={(e) => setSelectionCriteria({
                                ...selectionCriteria,
                                reasonFactors: {
                                  ...selectionCriteria.reasonFactors,
                                  includeVisitCount: e.target.checked,
                                },
                              })}
                            />
                            시타 방문수
                          </label>
                          <label className="text-sm flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={selectionCriteria.reasonFactors.includeQualityScore}
                              onChange={(e) => setSelectionCriteria({
                                ...selectionCriteria,
                                reasonFactors: {
                                  ...selectionCriteria.reasonFactors,
                                  includeQualityScore: e.target.checked,
                                },
                              })}
                            />
                            답변 품질
                          </label>
                          <label className="text-sm flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={selectionCriteria.reasonFactors.includeAgeGroup}
                              onChange={(e) => setSelectionCriteria({
                                ...selectionCriteria,
                                reasonFactors: {
                                  ...selectionCriteria.reasonFactors,
                                  includeAgeGroup: e.target.checked,
                                },
                              })}
                            />
                            나이대
                          </label>
                        </div>
                      </div>

                      {/* 총 선정 인원 표시 */}
                      <div className="mt-6 p-3 bg-gray-50 rounded">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">총 선정 인원:</span>
                          <span className="text-xl font-bold text-purple-600">
                            {selectionCriteria.selectionType === 'manual'
                              ? manualSelectedCustomers.length
                              : (calculatedPurchasedCount + calculatedNonPurchasedCount)
                            }명
                          </span>
                        </div>
                        {selectionCriteria.selectionType === 'auto' && (
                          <div className="text-xs text-gray-600 mt-1">
                            구매자: {calculatedPurchasedCount}명 ({selectionCriteria.purchasedRatio}%) / 
                            비구매자: {calculatedNonPurchasedCount}명 ({100 - selectionCriteria.purchasedRatio}%)
                          </div>
                        )}
                        {selectionCriteria.selectionType === 'manual' && (
                          <div className="text-xs text-gray-600 mt-1">
                            필터링된 인원: <span className="font-bold text-blue-600">{getFilteredCustomers.length}명</span> 중 선택
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
                      <button
                        onClick={() => setShowSelectionModal(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => handleSelectPrizes(selectedDetailDate || '', selectedDetailDateTime || undefined)}
                        disabled={selectingPrizes || (selectionCriteria.selectionType === 'manual' && manualSelectedCustomers.length === 0)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {selectingPrizes ? '선정 중...' : '선정하기'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 위치 정보 관리 탭 */}
          {activeTab === 'geocoding' && (
            <div className="space-y-6">
              {/* 헤더 및 필터 */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-gray-900">위치 정보 관리</h2>
                  <p className="text-gray-600 mt-1">위치 API로 변환되지 않은 고객 주소를 관리하고 수동으로 업데이트할 수 있습니다.</p>
                </div>

                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">상태 필터</label>
                    <select
                      value={geocodingStatus}
                      onChange={(e) => setGeocodingStatus(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">전체</option>
                      <option value="missing">위치 정보 없음</option>
                      <option value="failed">변환 실패</option>
                      <option value="success">변환 성공</option>
                    </select>
                  </div>
                  <button
                    onClick={fetchGeocodingCustomers}
                    disabled={loadingGeocoding}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {loadingGeocoding ? '조회 중...' : '조회'}
                  </button>
                  <button
                    onClick={handleSyncAddresses}
                    disabled={syncingAddresses || loadingGeocoding}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {syncingAddresses
                      ? '동기화 중...'
                      : selectedCustomerIds.length > 0
                        ? `주소 동기화 (${selectedCustomerIds.length}개)`
                        : '주소 동기화 (전체)'}
                  </button>
                  <button
                    onClick={handleBatchGeocoding}
                    disabled={batchGeocoding || loadingGeocoding}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-medium"
                    title={selectedCustomerIds.length > 0 
                      ? `선택된 ${selectedCustomerIds.length}개 고객의 지오코딩을 재실행합니다`
                      : "지오코딩이 안 된 모든 설문에 대해 카카오맵 API를 일괄 호출합니다"}
                  >
                    {batchGeocoding
                      ? '지오코딩 실행 중...'
                      : selectedCustomerIds.length > 0
                        ? `🗺️ 지오코딩 일괄 실행 (${selectedCustomerIds.length}개)`
                        : '🗺️ 지오코딩 일괄 실행 (전체)'}
                  </button>
                </div>
              </div>

              {/* 위치 미확인 고객 목록 */}
              {loadingGeocoding ? (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">로딩 중...</div>
              ) : geocodingCustomers.length > 0 ? (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900">
                      위치 정보 고객 목록 ({new Set(geocodingCustomers.map((c: any) => c.phone?.replace(/[^0-9]/g, '') || '')).size}명, {geocodingCustomers.length}건)
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                            <input
                              type="checkbox"
                              checked={
                                geocodingCustomers.length > 0 &&
                                selectedCustomerIds.length === geocodingCustomers.filter((c: any) => c.customer_id).length &&
                                geocodingCustomers.filter((c: any) => c.customer_id).length > 0
                              }
                              onChange={handleSelectAllCustomers}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                            onClick={() => handleGeocodingSort('name')}
                          >
                            이름 {geocodingSortBy === 'name' && (geocodingSortOrder === 'asc' ? '▲' : '▼')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            전화번호
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                            onClick={() => handleGeocodingSort('address')}
                          >
                            주소 {geocodingSortBy === 'address' && (geocodingSortOrder === 'asc' ? '▲' : '▼')}
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                            onClick={() => handleGeocodingSort('status')}
                          >
                            상태 {geocodingSortBy === 'status' && (geocodingSortOrder === 'asc' ? '▲' : '▼')}
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                            onClick={() => handleGeocodingSort('distance')}
                          >
                            거리(km) {geocodingSortBy === 'distance' && (geocodingSortOrder === 'asc' ? '▲' : '▼')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            액션
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sortedGeocodingCustomers.map((customer: any, idx: number) => {
                          const { canInitialSync, canResync } = canSync(customer);
                          const isSelected = customer.customer_id && selectedCustomerIds.includes(customer.customer_id);
                          
                          return (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                {customer.customer_id && (
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleSelectCustomer(customer.customer_id)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-900">{customer.name}</span>
                                  {customer.isDuplicate && customer.duplicateCount > 1 && (
                                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
                                      중복({customer.duplicateCount})
                                    </span>
                                  )}
                                  {!customer.customer_id && (
                                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
                                      고객정보 없음
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.phone}</td>
                              <td className="px-6 py-4 text-sm">
                                <div className="space-y-2">
                                  {/* 지오코딩 주소 */}
                                  <div>
                                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 mb-1">
                                      지오코딩(카카오맵)
                                    </span>
                                    <div className="text-sm mt-0.5">
                                      {!customer.address ? (
                                        <span className="text-red-500 italic">주소 없음</span>
                                      ) : customer.address.startsWith('[') || customer.address === 'N/A' ? (
                                        <span className="text-gray-400 italic">{customer.address}</span>
                                      ) : (
                                        <span className="text-gray-700">{customer.address}</span>
                                      )}
                                    </div>
                                  </div>

                                  {/* 설문 주소 */}
                                  <div>
                                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 mb-1">
                                      설문주소
                                    </span>
                                    <div className="text-sm mt-0.5">
                                      {!customer.original_survey_address ? (
                                        <span className="text-red-500 italic">없음</span>
                                      ) : customer.original_survey_address.startsWith('[') ||
                                        customer.original_survey_address === 'N/A' ? (
                                        <span className="text-gray-400 italic">{customer.original_survey_address}</span>
                                      ) : (
                                        <span className="text-gray-700">{customer.original_survey_address}</span>
                                      )}
                                    </div>
                                  </div>

                                  {/* 고객관리 주소 */}
                                  <div>
                                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 mb-1">
                                      고객관리주소
                                    </span>
                                    <div className="text-sm mt-0.5">
                                      {!customer.customer_address ? (
                                        <span className="text-red-500 italic">없음</span>
                                      ) : customer.customer_address.startsWith('[') || customer.customer_address === 'N/A' ? (
                                        <span className="text-gray-400 italic">{customer.customer_address}</span>
                                      ) : (
                                        <span className="text-gray-700">{customer.customer_address}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {!customer.address ? (
                                <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  주소 없음
                                </span>
                              ) : customer.geocoding_status === 'success' ? (
                                <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  성공
                                </span>
                              ) : customer.geocoding_status === 'failed' ? (
                                <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  실패
                                </span>
                              ) : (
                                <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  미확인
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {!customer.address ? (
                                <span className="text-yellow-600 italic">계산 불가</span>
                              ) : customer.distance_km ? (
                                `${customer.distance_km.toFixed(2)}km`
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    setEditingGeocoding({
                                      customer,
                                      address: customer.address || '',
                                    })
                                  }
                                  className="text-blue-600 hover:text-blue-900 font-medium"
                                >
                                  수정
                                </button>
                                {(canInitialSync || canResync) && (
                                  <button
                                    onClick={() => handleSyncSingleAddress(customer.customer_id, customer.name)}
                                    className="text-green-600 hover:text-green-900 font-medium text-xs"
                                    title="설문 주소를 고객관리 주소로 동기화"
                                  >
                                    동기화
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                  조회된 고객이 없습니다.
                </div>
              )}
            </div>
          )}

          {/* 위치 정보 수정 모달 */}
          {editingGeocoding && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">위치 정보 수정</h2>
                    <button
                      onClick={() => setEditingGeocoding(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">고객 정보</label>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{editingGeocoding.customer.name}</div>
                          <div className="text-gray-600 mt-1">{editingGeocoding.customer.phone}</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">주소</label>
                      <textarea
                        value={editingGeocoding.address}
                        onChange={(e) =>
                          setEditingGeocoding({
                            ...editingGeocoding,
                            address: e.target.value,
                          })
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="주소를 입력하세요"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        주소를 입력하면 자동으로 좌표로 변환하고 매장과의 거리를 계산합니다.
                        <br />
                        <span className="text-blue-600 font-medium">
                          ※ 주소 수정 시 설문과 고객 정보의 주소도 자동으로 동기화됩니다.
                        </span>
                        <br />
                        <span className="text-gray-600">
                          ※ 주소가 없으면 <code className="bg-gray-100 px-1 rounded">[직접방문]</code> 또는 <code className="bg-gray-100 px-1 rounded">[주소 미제공]</code>을 입력하세요.
                        </span>
                      </p>
                    </div>

                    {editingGeocoding.customer.geocoding_status === 'success' && (
                      <div className="bg-green-50 border border-green-200 rounded-md p-3">
                        <div className="text-sm text-green-800">
                          <div className="font-medium">현재 위치 정보</div>
                          <div className="mt-1">
                            거리: {editingGeocoding.customer.distance_km?.toFixed(2)}km
                          </div>
                          {editingGeocoding.customer.latitude && editingGeocoding.customer.longitude && (
                            <div className="mt-1 text-xs">
                              좌표: {editingGeocoding.customer.latitude.toFixed(6)},{' '}
                              {editingGeocoding.customer.longitude.toFixed(6)}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {editingGeocoding.customer.geocoding_status === 'failed' && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3">
                        <div className="text-sm text-red-800">
                          <div className="font-medium">이전 변환 실패</div>
                          {editingGeocoding.customer.geocoding_error && (
                            <div className="mt-1 text-xs">{editingGeocoding.customer.geocoding_error}</div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <button
                        onClick={() => setEditingGeocoding(null)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        취소
                      </button>
                      <button
                        onClick={handleUpdateGeocoding}
                        disabled={updatingGeocoding || (!editingGeocoding.address || !editingGeocoding.address.trim())}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        {updatingGeocoding ? '업데이트 중...' : '거리 업데이트'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 수정 모달 */}
      {editingSurvey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">설문 수정</h2>
                <button
                  onClick={handleCloseEdit}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* 이름 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* 전화번호 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    전화번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, phone: formatPhoneNumber(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* 연령대 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    연령대 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={editFormData.age || ''}
                    onChange={(e) => {
                      const age = e.target.value;
                      setEditFormData(prev => ({
                        ...prev,
                        age: age ? parseInt(age) : null,
                        age_group: convertAgeToAgeGroup(age),
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  {editFormData.age_group && (
                    <p className="text-sm text-gray-500 mt-1">{editFormData.age_group}로 분류됩니다.</p>
                  )}
                </div>

                {/* 선택 모델 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    선택 모델 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editFormData.selected_model || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, selected_model: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">선택하세요</option>
                    <option value="beryl-47g">풀티타늄 베릴 47g</option>
                    <option value="beryl-42g">풀티타늄 베릴 42g</option>
                    <option value="sapphire-53g">원플렉스 사파이어 53g</option>
                    <option value="sapphire-44g">원플렉스 사파이어 44g</option>
                  </select>
                </div>

                {/* 중요 요소 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    중요 요소 <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {[
                      { id: 'distance', label: '비거리' },
                      { id: 'direction', label: '방향성' },
                      { id: 'feel', label: '타구감' },
                    ].map((factor) => (
                      <label key={factor.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={(editFormData.important_factors || []).includes(factor.id)}
                          onChange={() => toggleImportantFactor(factor.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{factor.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 추가 의견 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    추가 의견
                  </label>
                  <textarea
                    value={editFormData.additional_feedback || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, additional_feedback: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* 주소 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    주소 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={editFormData.address || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, address: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* 사은품 / 굿즈 정보 */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">사은품 / 굿즈 정보</h3>

                  <div className="mb-3 space-y-2">
                    <div className="flex gap-4 text-xs">
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={!!editFormData.event_candidate}
                        onChange={(e) =>
                          setEditFormData((prev) => ({
                            ...prev,
                            event_candidate: e.target.checked,
                          }))
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">이벤트 응모 대상</span>
                        <span className="text-gray-400 text-[10px]">(특이사항 체크용, 재고 차감 없음)</span>
                    </label>
                    </div>
                    <div className="flex gap-4 text-xs">
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={!!editFormData.event_winner}
                        onChange={(e) =>
                          setEditFormData((prev) => ({
                            ...prev,
                            event_winner: e.target.checked,
                          }))
                        }
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-gray-700">당첨</span>
                        <span className="text-gray-400 text-[10px]">(재고 차감 필요)</span>
                    </label>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={!!editFormData.gift_delivered}
                          onChange={(e) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              gift_delivered: e.target.checked,
                            }))
                          }
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          disabled={!editingGiftProductId && !editingGiftText}
                        />
                        <span className={`text-gray-700 ${!editingGiftProductId && !editingGiftText ? 'text-gray-400' : ''}`}>
                          🎁 선물 지급 완료
                        </span>
                        <span className="text-gray-400 text-[10px]">(당첨이 아닌 일반 선물, 재고 차감 필요)</span>
                      </label>
                    </div>
                    {!editingGiftProductId && !editingGiftText && (
                      <p className="text-[10px] text-gray-500 ml-6">
                        선물 지급 완료를 체크하려면 먼저 사은품을 선택하거나 메모를 입력해주세요.
                      </p>
                    )}
                  </div>

                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    제공 사은품 (굿즈)
                  </label>
                  <select
                    value={editingGiftProductId ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const id = val ? Number(val) : null;
                      setEditingGiftProductId(id);
                      const selected = giftProducts.find((p) => p.id === id);
                      if (selected) {
                        setEditingGiftText(selected.name);
                        setEditFormData(prev => ({ ...prev, gift_text: selected.name, gift_product_id: id }));
                      } else {
                        setEditFormData(prev => ({ ...prev, gift_text: '', gift_product_id: null }));
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">선택 안 함</option>
                    {giftProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>

                  <label className="block text-xs font-medium text-gray-700 mt-3 mb-1">
                    기타 메모 (원래 제품명, 색/사이즈, 특이사항 등)
                  </label>
                  <input
                    type="text"
                    value={editingGiftText}
                    onChange={(e) => {
                      const value = e.target.value;
                      setEditingGiftText(value);
                      setEditFormData(prev => ({ ...prev, gift_text: value }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  
                  {/* 자동 저장 체크박스 */}
                  <div className="mt-3">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={autoSaveGift}
                        onChange={(e) => setAutoSaveGift(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>
                        설문 저장 시 자동으로 고객 선물 기록에 저장
                        {autoSaveGift && (editingGiftProductId || editingGiftText) && (
                          <span className="ml-2 text-xs text-blue-600">✓ 활성화됨</span>
                        )}
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1 ml-6">
                      체크하면 설문 저장 시 사은품 정보가 자동으로 고객 선물 기록에 저장됩니다.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center gap-3 mt-6">
                <button
                  onClick={() => handleSaveGiftToCustomer(false)}
                  disabled={savingGiftRecord}
                  className="px-3 py-2 text-sm border border-yellow-400 text-yellow-700 rounded-md hover:bg-yellow-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingGiftRecord ? '선물 기록 저장 중...' : '🎁 고객 선물 기록으로 저장'}
                </button>
                <button
                  onClick={handleCloseEdit}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isEditing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isEditing ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 상세 보기 모달 */}
      {viewSurvey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">설문 상세</h2>
                <button
                  onClick={() => setViewSurvey(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4 text-sm text-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-500">이름</div>
                    <div className="font-medium text-gray-900 flex flex-wrap items-center gap-1">
                      <span>{viewSurvey.name}</span>
                      {viewSurvey.event_candidate && (
                        <span className="inline-flex px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-[10px]">
                          이벤트 응모
                        </span>
                      )}
                      {viewSurvey.event_winner && (
                        <span className="inline-flex px-1.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px]">
                          당첨
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">연락처</div>
                    <div className="font-medium text-gray-900">{viewSurvey.phone}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">연령대</div>
                    <div className="font-medium text-gray-900">{viewSurvey.age_group || '-'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">선택 모델</div>
                    <div className="font-medium text-gray-900">{getModelName(viewSurvey.selected_model)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">중요 요소</div>
                    <div className="font-medium text-gray-900">{getFactorNames(viewSurvey.important_factors)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">제출시각</div>
                    <div className="font-medium text-gray-900">
                      {new Date(viewSurvey.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-gray-500">주소</div>
                  <div className="font-medium text-gray-900 whitespace-pre-line">
                    {viewSurvey.address || '-'}
                  </div>
                </div>

                <div>
                  <div className="text-gray-500">추가 의견</div>
                  <div className="font-medium text-gray-900 whitespace-pre-line">
                    {viewSurvey.additional_feedback || '없음'}
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setViewSurvey(null)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 메시지 미리보기 모달 */}
      {messagePreviewModal.open && messagePreviewModal.survey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {messagePreviewModal.messageType === 'thank_you' ? '감사 메시지' : '당첨 메시지'} 미리보기
                </h2>
                <button
                  onClick={() => setMessagePreviewModal({ open: false, survey: null, messageType: null, message: '', loading: false })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {messagePreviewModal.loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-600">메시지를 불러오는 중...</p>
                </div>
              ) : (
                <>
                  {/* 재발송 경고 */}
                  {(messagePreviewModal.messageType === 'thank_you' && messagePreviewModal.survey.thank_you_message_sent_at) ||
                   (messagePreviewModal.messageType === 'winner' && messagePreviewModal.survey.winner_message_sent_at) ? (
                    <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800">
                            재발송 안내
                          </h3>
                          <div className="mt-2 text-sm text-yellow-700">
                            <p>
                              이 설문에는 이미 {messagePreviewModal.messageType === 'thank_you' ? '감사' : '당첨'} 메시지가 발송되었습니다.
                              <br />
                              이전 발송 시간: {new Date(
                                messagePreviewModal.messageType === 'thank_you' 
                                  ? messagePreviewModal.survey.thank_you_message_sent_at!
                                  : messagePreviewModal.survey.winner_message_sent_at!
                              ).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
                            </p>
                            <p className="mt-2 font-medium">
                              재발송하시겠습니까?
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* 고객 정보 */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">고객 정보</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">이름:</span>
                        <span className="ml-2 font-medium">{messagePreviewModal.survey.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">전화번호:</span>
                        <span className="ml-2 font-medium">{formatPhoneNumber(messagePreviewModal.survey.phone)}</span>
                      </div>
                    </div>
                  </div>

                  {/* 메시지 내용 */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      메시지 내용
                    </label>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                        {messagePreviewModal.message}
                      </pre>
                    </div>
                  </div>

                  {/* 발송 버튼 */}
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setMessagePreviewModal({ open: false, survey: null, messageType: null, message: '', loading: false })}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleConfirmSendMessage}
                      disabled={sendingMessages}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingMessages ? '발송 중...' : '발송하기'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 메시지 생성 모달 */}
      {messageModal.open && messageModal.survey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">맞춤형 메시지 생성</h2>
                <button
                  onClick={() => setMessageModal({ open: false, survey: null, message: '', customerNeeds: null, loading: false })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {messageModal.loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-600">메시지를 생성하고 있습니다...</p>
                </div>
              ) : (
                <>
                  {/* 고객 정보 */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">고객 정보</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">이름:</span>
                        <span className="ml-2 font-medium">{messageModal.survey.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">전화번호:</span>
                        <span className="ml-2 font-medium">{formatPhoneNumber(messageModal.survey.phone)}</span>
                      </div>
                      {messageModal.customerNeeds && (
                        <>
                          <div>
                            <span className="text-gray-600">중요 요소:</span>
                            <span className="ml-2 font-medium">
                              {messageModal.customerNeeds.primaryFactors.join(', ')}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">선택 모델:</span>
                            <span className="ml-2 font-medium">
                              {messageModal.customerNeeds.selectedModel}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 생성된 메시지 */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        생성된 메시지
                      </label>
                      <button
                        onClick={handleCopyMessage}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        복사
                      </button>
                    </div>
                    <textarea
                      value={messageModal.message}
                      onChange={(e) => setMessageModal(prev => ({ ...prev, message: e.target.value }))}
                      rows={15}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    />
                  </div>

                  {/* 전화 유도 포인트 */}
                  {messageModal.customerNeeds && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-3">전화 유도 포인트</h3>
                      <ul className="space-y-2 text-sm">
                        {messageModal.customerNeeds.primaryFactors.includes('비거리') && (
                          <li className="flex items-start">
                            <span className="text-blue-600 mr-2">•</span>
                            <span>한 번의 시타로 25m 비거리 증가를 직접 체험 가능</span>
                          </li>
                        )}
                        {messageModal.customerNeeds.primaryFactors.includes('방향성') && (
                          <li className="flex items-start">
                            <span className="text-blue-600 mr-2">•</span>
                            <span>정확한 샷을 위한 맞춤 피팅 상담</span>
                          </li>
                        )}
                        {messageModal.customerNeeds.primaryFactors.includes('타구감') && (
                          <li className="flex items-start">
                            <span className="text-blue-600 mr-2">•</span>
                            <span>프리미엄 타구감 체험 - 가벼운 스윙으로도 강력한 임팩트</span>
                          </li>
                        )}
                        {messageModal.customerNeeds.selectedModel && (
                          <li className="flex items-start">
                            <span className="text-blue-600 mr-2">•</span>
                            <span>{messageModal.customerNeeds.selectedModel} 모델 특별 체험</span>
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setMessageModal({ open: false, survey: null, message: '', customerNeeds: null, loading: false })}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      닫기
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 새 설문 생성 모달 */}
      {creatingSurvey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">새 설문 추가 (테스트)</h2>
                <button
                  onClick={handleCloseCreate}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* 전화번호 및 고객 검색 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    전화번호 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={createFormData.phone}
                      onChange={(e) => {
                        const formatted = formatPhoneNumber(e.target.value);
                        setCreateFormData(prev => ({ ...prev, phone: formatted }));
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="010-1234-5678"
                    />
                    <button
                      onClick={handleSearchCustomer}
                      disabled={searchingCustomer || !createFormData.phone}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {searchingCustomer ? '검색 중...' : '고객 검색'}
                    </button>
                  </div>
                  {customerSearchResult && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-800">
                        ✓ 고객 정보를 찾았습니다: {customerSearchResult.name}
                      </p>
                    </div>
                  )}
                </div>

                {/* 이름 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={createFormData.name}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* 나이 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    나이
                  </label>
                  <input
                    type="number"
                    value={createFormData.age || ''}
                    onChange={(e) => handleCreateAgeChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="예: 45"
                  />
                  {createFormData.age_group && (
                    <p className="text-sm text-gray-500 mt-1">{createFormData.age_group}로 분류됩니다.</p>
                  )}
                </div>

                {/* 선택 모델 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    선택 모델 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={createFormData.selected_model}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, selected_model: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">선택하세요</option>
                    <option value="beryl-47g">풀티타늄 베릴 47g</option>
                    <option value="beryl-42g">풀티타늄 베릴 42g</option>
                    <option value="sapphire-53g">원플렉스 사파이어 53g</option>
                    <option value="sapphire-44g">원플렉스 사파이어 44g</option>
                  </select>
                </div>

                {/* 중요 요소 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    중요 요소
                  </label>
                  <div className="space-y-2">
                    {[
                      { id: 'distance', label: '비거리' },
                      { id: 'direction', label: '방향성' },
                      { id: 'feel', label: '타구감(음)' },
                    ].map((factor) => (
                      <label key={factor.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={createFormData.important_factors.includes(factor.id)}
                          onChange={() => toggleCreateImportantFactor(factor.id)}
                          className="mr-2"
                        />
                        <span>{factor.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 추가 의견 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    추가 의견
                  </label>
                  <textarea
                    value={createFormData.additional_feedback}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, additional_feedback: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="추가 의견을 입력하세요"
                  />
                </div>

                {/* 주소 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    주소
                  </label>
                  <input
                    type="text"
                    value={createFormData.address}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="주소를 입력하세요 (선택사항)"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={handleCloseCreate}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveCreate}
                    disabled={isEditing}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isEditing ? '생성 중...' : '설문 생성'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 일괄 분석 모달 */}
      {analysisModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">설문 조사 분석 결과</h2>
                <button
                  onClick={() => setAnalysisModal({ open: false, loading: false, data: null })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {analysisModal.loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-600">분석 중입니다...</p>
                </div>
              ) : analysisModal.data ? (
                <>
                  {/* 전체 통계 */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-4">전체 통계</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600">총 설문 수</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {analysisModal.data.overallStats.totalCount}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600">비거리 관심</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {analysisModal.data.overallStats.factorDistribution.distance || 0}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600">방향성 관심</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {analysisModal.data.overallStats.factorDistribution.direction || 0}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600">타구감 관심</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {analysisModal.data.overallStats.factorDistribution.feel || 0}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 개별 분석 결과 */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-gray-900">개별 분석 결과</h3>
                      <button
                        onClick={async () => {
                          if (!analysisModal.data || !analysisModal.data.analyses) return;
                          
                          // 사용자 확인
                          if (!confirm(`선택한 ${analysisModal.data.analyses.length}개 설문에 대한 메시지를 모두 생성하시겠습니까?\n\n각 메시지가 순차적으로 표시됩니다.`)) {
                            return;
                          }
                          
                          // 분석 모달 닫기
                          setAnalysisModal({ open: false, loading: false, data: null });
                          
                          // 각 설문에 대해 메시지 생성 모달을 순차적으로 표시
                          const analyses = analysisModal.data.analyses;
                          for (let i = 0; i < analyses.length; i++) {
                            const analysis = analyses[i];
                            const survey = surveys.find(s => s.id === analysis.surveyId);
                            if (survey) {
                              // 첫 번째 메시지는 바로 표시
                              if (i === 0) {
                                handleGenerateMessage(survey);
                              } else {
                                // 두 번째부터는 이전 메시지 모달이 닫힐 때까지 대기
                                await new Promise<void>((resolve) => {
                                  const checkClosed = setInterval(() => {
                                    if (!messageModal.open) {
                                      clearInterval(checkClosed);
                                      // 약간의 딜레이 후 다음 메시지 표시
                                      setTimeout(() => {
                                        handleGenerateMessage(survey);
                                        resolve();
                                      }, 300);
                                    }
                                  }, 200);
                                  
                                  // 최대 60초 대기 후 다음으로 진행 (타임아웃 방지)
                                  setTimeout(() => {
                                    clearInterval(checkClosed);
                                    handleGenerateMessage(survey);
                                    resolve();
                                  }, 60000);
                                });
                              }
                            }
                          }
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                      >
                        전체 메시지 생성 ({analysisModal.data?.analyses?.length || 0}개)
                      </button>
                    </div>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {analysisModal.data.analyses.map((analysis: any, index: number) => (
                        <div key={analysis.surveyId} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-medium text-gray-900">{analysis.name}</h4>
                              <p className="text-sm text-gray-600">{analysis.phone}</p>
                            </div>
                            <button
                              onClick={() => {
                                const survey = surveys.find(s => s.id === analysis.surveyId);
                                if (survey) {
                                  handleGenerateMessage(survey);
                                  setAnalysisModal({ open: false, loading: false, data: null });
                                }
                              }}
                              className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                            >
                              메시지 생성
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">연령대:</span>
                              <span className="ml-2 font-medium">
                                {surveys.find(s => s.id === analysis.surveyId)?.age_group || analysis.customerNeeds.ageGroup || '-'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">주소:</span>
                              <span className="ml-2 font-medium">
                                {surveys.find(s => s.id === analysis.surveyId)?.address || '-'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">매장과의 거리:</span>
                              <span className="ml-2 font-medium">
                                {surveys.find(s => s.id === analysis.surveyId)?.distance_km 
                                  ? `${Number(surveys.find(s => s.id === analysis.surveyId)?.distance_km).toFixed(1)}km`
                                  : '-'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">중요 요소:</span>
                              <span className="ml-2 font-medium">
                                {analysis.customerNeeds.primaryFactors.join(', ')}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">선택 모델:</span>
                              <span className="ml-2 font-medium">
                                {analysis.customerNeeds.selectedModel}
                              </span>
                            </div>
                          </div>
                          <div className="mt-3">
                            <span className="text-gray-600 text-sm">전화 유도 포인트:</span>
                            <ul className="mt-2 space-y-1">
                              {analysis.callToActionPoints.map((point: string, idx: number) => (
                                <li key={idx} className="text-sm text-gray-700 flex items-start">
                                  <span className="text-blue-600 mr-2">•</span>
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => setAnalysisModal({ open: false, loading: false, data: null })}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      닫기
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

