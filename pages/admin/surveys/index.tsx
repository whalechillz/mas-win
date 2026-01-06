import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import AdminNav from '../../../components/admin/AdminNav';

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
};

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [stats, setStats] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModelFilter, setSelectedModelFilter] = useState('');
  const [ageGroupFilter, setAgeGroupFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Survey>>({});
  const [viewSurvey, setViewSurvey] = useState<Survey | null>(null);
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
  const [prizeHistory, setPrizeHistory] = useState<any>(null);
  const [loadingPrizeHistory, setLoadingPrizeHistory] = useState(false);
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string | null>(null);
  const [historySection, setHistorySection] = useState<'purchased' | 'non_purchased' | 'all' | ''>('');
  const [geocodingCustomers, setGeocodingCustomers] = useState<any[]>([]);
  const [loadingGeocoding, setLoadingGeocoding] = useState(false);
  const [geocodingStatus, setGeocodingStatus] = useState<'all' | 'missing' | 'failed' | 'success'>('all');
  const [editingGeocoding, setEditingGeocoding] = useState<{
    customer: any;
    address: string;
  } | null>(null);
  const [updatingGeocoding, setUpdatingGeocoding] = useState(false);
  const [syncingAddresses, setSyncingAddresses] = useState(false);
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

  const fetchSurveys = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '50',
        ...(searchQuery && { q: searchQuery }),
        ...(selectedModelFilter && { selected_model: selectedModelFilter }),
        ...(ageGroupFilter && { age_group: ageGroupFilter }),
        sortBy: sortBy,
        sortOrder: sortOrder,
      });

      const res = await fetch(`/api/survey/list?${params}`);
      const json = await res.json();

      if (json.success) {
        setSurveys(json.data || []);
        setTotalPages(json.pagination?.totalPages || 1);
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
      // 필터나 페이지 변경 시 선택 초기화
      setSelectedIds([]);
    }, [page, searchQuery, selectedModelFilter, ageGroupFilter, sortBy, sortOrder]);

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

  // 수정 모달 닫기
  const handleCloseEdit = () => {
    setEditingSurvey(null);
    setEditFormData({});
    setEditingGiftProductId(null);
    setEditingGiftText('');
    setAutoSaveGift(false);
    setIsEditing(false);
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
  const handleRecommendPrizes = async () => {
    setRecommendingPrizes(true);
    try {
      // HTML 파일 다운로드 (A4 최적화)
      const res = await fetch('/api/admin/surveys/recommend-prizes?format=html');
      if (res.ok) {
        const html = await res.text();
        
        // 새 창에서 HTML 표시
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(html);
          newWindow.document.close();
          
          // 새 창이 열린 후 포커스
          newWindow.focus();
        }
        
        // 동시에 다운로드도 제공 (선택적)
        const blob = new Blob([html], { type: 'text/html; charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prize-recommendation-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const json = await res.json();
        alert(json.message || '경품 추천 조회에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('경품 추천 오류:', error);
      alert(error.message || '경품 추천 중 오류가 발생했습니다.');
    } finally {
      setRecommendingPrizes(false);
    }
  };

  // 경품 추천 이력 조회
  const fetchPrizeHistory = async () => {
    setLoadingPrizeHistory(true);
    try {
      const params = new URLSearchParams();
      if (selectedHistoryDate) {
        params.append('date', selectedHistoryDate);
      }
      if (historySection) {
        params.append('section', historySection);
      }
      params.append('limit', '1000');

      const res = await fetch(`/api/admin/surveys/prize-history?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setPrizeHistory(json.data);
      } else {
        alert(json.message || '이력 조회에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('이력 조회 오류:', error);
      alert(error.message || '이력 조회 중 오류가 발생했습니다.');
    } finally {
      setLoadingPrizeHistory(false);
    }
  };

  // 탭 변경 시 이력 자동 조회
  useEffect(() => {
    if (activeTab === 'prize' && !prizeHistory) {
      fetchPrizeHistory();
    }
  }, [activeTab]);

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
        setGeocodingCustomers(json.data.customers || []);
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
    if (
      !confirm(
        '고객관리 주소가 없고 설문 주소가 있는 고객의 주소를 일괄 동기화하시겠습니까?\n\n- 고객관리 주소가 없거나 플레이스홀더인 경우만\n- 설문 주소가 실제 주소인 경우만 동기화됩니다.',
      )
    ) {
      return;
    }

    setSyncingAddresses(true);
    try {
      const res = await fetch('/api/admin/surveys/sync-addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
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
    } finally {
      setSyncingAddresses(false);
    }
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
        body: JSON.stringify({ surveyId: survey.id, messageType: 'sms' }),
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
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-600">총 응답 수</div>
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              </div>
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
            </div>
          )}

          {/* 필터 및 일괄 삭제 */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
            </div>
            
            {/* 일괄 작업 버튼 */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              {selectedIds.length > 0 ? (
                <>
                <span className="text-sm text-gray-700">
                  {selectedIds.length}개 항목 선택됨
                </span>
                <div className="flex gap-2">
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
                </div>
                </>
              ) : (
                <>
                  <span className="text-sm text-gray-700">
                    일괄 작업
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleRecommendPrizes}
                      disabled={recommendingPrizes}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      {recommendingPrizes ? '생성 중...' : '🎁 경품 추천 목록 다운로드'}
                    </button>
                    <button
                      onClick={handleBulkUpdateEventCandidates}
                      disabled={updatingEventCandidates}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      {updatingEventCandidates ? '업데이트 중...' : '🎁 선물 지급 설문 자동 연결 및 업데이트'}
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
                      {surveys.map((survey) => (
                        <tr key={survey.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(survey.id)}
                              onChange={() => handleToggleSelect(survey.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <button
                              type="button"
                              onClick={() => setViewSurvey(survey)}
                              className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                              role="button"
                              tabIndex={0}
                            >
                              {survey.name}
                            </button>
                              <div className="mt-1 flex gap-1">
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
                              {survey.gift_delivered ? (
                                <span className="inline-flex px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px]">
                                  🎁 선물
                                </span>
                              ) : null}
                              </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {survey.phone}
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
                                onClick={() => handleDelete(survey.id)}
                                disabled={isDeleting}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                삭제
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        이전
                      </button>
                      <button
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        다음
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          페이지 <span className="font-medium">{page}</span> /{' '}
                          <span className="font-medium">{totalPages}</span>
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                          >
                            이전
                          </button>
                          <button
                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                          >
                            다음
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
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
                  <button
                    onClick={handleRecommendPrizes}
                    disabled={recommendingPrizes}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {recommendingPrizes ? '생성 중...' : '🎁 경품 추천 목록 다운로드'}
                  </button>
                </div>

                {/* 필터 */}
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">날짜 필터</label>
                    <input
                      type="date"
                      value={selectedHistoryDate || ''}
                      onChange={(e) => setSelectedHistoryDate(e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">섹션 필터</label>
                    <select
                      value={historySection}
                      onChange={(e) => setHistorySection(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">전체</option>
                      <option value="purchased">구매 고객</option>
                      <option value="non_purchased">비구매 고객</option>
                      <option value="all">전체 고객</option>
                    </select>
                  </div>
                  <button
                    onClick={fetchPrizeHistory}
                    disabled={loadingPrizeHistory}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {loadingPrizeHistory ? '조회 중...' : '조회'}
                  </button>
                  {selectedHistoryDate && (
                    <button
                      onClick={() => {
                        setSelectedHistoryDate(null);
                        setHistorySection('');
                        fetchPrizeHistory();
                      }}
                      className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                    >
                      필터 초기화
                    </button>
                  )}
                </div>
              </div>

              {/* 이력 목록 */}
              {loadingPrizeHistory ? (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">로딩 중...</div>
              ) : prizeHistory ? (
                <>
                  {/* 날짜별 통계 */}
                  {prizeHistory.dateStats && prizeHistory.dateStats.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">날짜별 통계</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {prizeHistory.dateStats.map((stat: any) => (
                          <div key={stat.date} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="text-sm text-gray-600">추천일</div>
                                <div className="text-lg font-bold text-gray-900">
                                  {new Date(stat.date).toLocaleDateString('ko-KR')}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-gray-600">총 고객</div>
                                <div className="text-lg font-bold text-blue-600">{stat.total}명</div>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                              <div>
                                <div className="text-gray-600">구매</div>
                                <div className="font-medium text-green-600">{stat.purchased}명</div>
                              </div>
                              <div>
                                <div className="text-gray-600">비구매</div>
                                <div className="font-medium text-orange-600">{stat.nonPurchased}명</div>
                              </div>
                              <div>
                                <div className="text-gray-600">전체</div>
                                <div className="font-medium text-blue-600">{stat.all}명</div>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">최고 점수</span>
                                <span className="font-medium">{stat.topScore.toFixed(1)}</span>
                              </div>
                              <div className="flex justify-between text-sm mt-1">
                                <span className="text-gray-600">평균 점수</span>
                                <span className="font-medium">{stat.avgScore.toFixed(1)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 상세 이력 테이블 */}
                  {prizeHistory.recommendations && prizeHistory.recommendations.length > 0 ? (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900">
                          상세 이력 ({prizeHistory.total}건)
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                날짜
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                섹션
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                순위
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                이름
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                전화번호
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                점수
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                선물
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                시타방문
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                거리(km)
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {prizeHistory.recommendations.map((item: any, idx: number) => (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {new Date(item.recommendation_date).toLocaleDateString('ko-KR')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <span
                                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                      item.section === 'purchased'
                                        ? 'bg-green-100 text-green-800'
                                        : item.section === 'non_purchased'
                                        ? 'bg-orange-100 text-orange-800'
                                        : 'bg-blue-100 text-blue-800'
                                    }`}
                                  >
                                    {item.category || item.section}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                  {item.rank}위
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.phone}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <span className="font-medium text-blue-600">{item.total_score?.toFixed(1) || 0}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {item.gift_count || 0}회
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {item.visit_count || 0}회
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {item.distance_km ? `${item.distance_km.toFixed(2)}km` : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                      조회된 이력이 없습니다.
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                  조회 버튼을 클릭하여 경품 추천 이력을 확인하세요.
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
                    {syncingAddresses ? '동기화 중...' : '📋 설문 주소 → 고객 주소 일괄 동기화'}
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
                      위치 정보 고객 목록 ({geocodingCustomers.length}건)
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            이름
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            전화번호
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            주소
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            상태
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            거리(km)
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            액션
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {geocodingCustomers.map((customer: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.phone}</td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                              <div className="space-y-1">
                                {/* 거리 계산 주소 (메인 표시) */}
                                <div>
                                  <span className="text-xs font-medium text-gray-600">📍 거리 계산 주소:</span>
                                  <div className="truncate mt-0.5">
                                    {customer.address && (customer.address.startsWith('[') || customer.address === 'N/A') ? (
                                      <span className="text-gray-400 italic">{customer.address}</span>
                                    ) : (
                                      <span className="text-gray-900 font-medium">{customer.address}</span>
                                    )}
                                  </div>
                                </div>

                                {/* 설문 주소 */}
                                {customer.original_survey_address && (
                                  <div className="text-xs">
                                    <span className="font-medium text-gray-500">📝 설문 주소:</span>
                                    <span
                                      className={`ml-1 ${
                                        customer.original_survey_address.startsWith('[') ||
                                        customer.original_survey_address === 'N/A'
                                          ? 'text-gray-400 italic'
                                          : 'text-gray-600'
                                      }`}
                                    >
                                      {customer.original_survey_address}
                                    </span>
                                  </div>
                                )}

                                {/* 고객관리 주소 */}
                                {customer.customer_address && (
                                  <div className="text-xs">
                                    <span className="font-medium text-blue-600">👤 고객관리 주소:</span>
                                    <span
                                      className={`ml-1 ${
                                        customer.customer_address.startsWith('[') || customer.customer_address === 'N/A'
                                          ? 'text-gray-400 italic'
                                          : 'text-blue-600'
                                      }`}
                                    >
                                      {customer.customer_address}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {customer.geocoding_status === 'success' ? (
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
                              {customer.distance_km ? `${customer.distance_km.toFixed(2)}km` : '-'}
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
                                {(!customer.customer_address ||
                                  customer.customer_address.startsWith('[') ||
                                  customer.customer_address === 'N/A') &&
                                  customer.original_survey_address &&
                                  !customer.original_survey_address.startsWith('[') &&
                                  customer.original_survey_address !== 'N/A' && (
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
                        ))}
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
                        <span className="ml-2 font-medium">{messageModal.survey.phone}</span>
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
                    <h3 className="font-semibold text-gray-900 mb-4">개별 분석 결과</h3>
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

