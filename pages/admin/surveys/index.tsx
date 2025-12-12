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
            
            {/* 일괄 삭제 버튼 */}
            {selectedIds.length > 0 && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className="text-sm text-gray-700">
                  {selectedIds.length}개 항목 선택됨
                </span>
                <button
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {isDeleting ? '삭제 중...' : `선택한 ${selectedIds.length}개 삭제`}
                </button>
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
                            {survey.name}
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
                            {new Date(survey.created_at).toLocaleDateString('ko-KR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
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
    </>
  );
}

