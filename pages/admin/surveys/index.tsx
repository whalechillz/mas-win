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
  created_at: string;
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Survey>>({});
  const [viewSurvey, setViewSurvey] = useState<Survey | null>(null);
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

  useEffect(() => {
    fetchSurveys();
    fetchStats();
    // 필터나 페이지 변경 시 선택 초기화
    setSelectedIds([]);
  }, [page, searchQuery, selectedModelFilter, ageGroupFilter]);

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

  // 개별 삭제
  const handleDelete = async (id: string) => {
    if (!confirm('정말로 이 설문을 삭제하시겠습니까?')) return;

    setIsDeleting(true);
    try {
      const response = await fetch('/api/survey/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const result = await response.json();

      if (result.success) {
        alert('삭제되었습니다.');
        fetchSurveys();
        fetchStats();
      } else {
        alert(result.message || '삭제에 실패했습니다.');
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
  const handleEdit = (survey: Survey) => {
    setEditingSurvey(survey);
    setEditFormData({
      name: survey.name,
      phone: survey.phone,
      age: survey.age,
      age_group: survey.age_group,
      selected_model: survey.selected_model,
      important_factors: survey.important_factors,
      additional_feedback: survey.additional_feedback,
      address: survey.address,
    });
    setIsEditing(true);
  };

  // 수정 모달 닫기
  const handleCloseEdit = () => {
    setEditingSurvey(null);
    setEditFormData({});
    setIsEditing(false);
  };

  // 수정 저장
  const handleSaveEdit = async () => {
    if (!editingSurvey) return;

    setIsEditing(true);
    try {
      const response = await fetch('/api/survey/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingSurvey.id,
          ...editFormData,
        }),
      });

      const result = await response.json();

      if (result.success) {
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
            {selectedIds.length > 0 && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
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
              </div>
            )}
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          이름
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          전화번호
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          연령대
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          선택 모델
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          중요 요소
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          제출일
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
              </div>

              <div className="flex justify-end gap-3 mt-6">
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
                    <div className="font-medium text-gray-900">{viewSurvey.name}</div>
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
                            <span>한 번의 시타로 30m 비거리 증가를 직접 체험 가능</span>
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

