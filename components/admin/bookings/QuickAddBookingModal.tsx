import React, { useState, useEffect, useMemo } from 'react';

interface QuickAddBookingModalProps {
  date: string;
  time: string;
  supabase: any;
  customers: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function QuickAddBookingModal({
  date,
  time,
  supabase,
  customers,
  onClose,
  onSuccess,
}: QuickAddBookingModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    service_type: '마쓰구 드라이버 시타서비스',
    location: 'Massgoo Studio',
    club: '',
    notes: '',
  });
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [activeField, setActiveField] = useState<'phone' | 'name' | null>(null);
  const [suggestionQuery, setSuggestionQuery] = useState('');
  const [closingSuggestions, setClosingSuggestions] = useState(false);

  const normalizePhone = (phone: string) => phone.replace(/[^0-9]/g, '');

  const filteredSuggestions = useMemo(() => {
    if (!suggestionQuery || suggestionQuery.trim().length < 2 || !activeField) return [];
    const queryLower = suggestionQuery.toLowerCase();
    const normalizedQuery = normalizePhone(suggestionQuery);

    return customers
      .filter((customer) => {
        const customerName = customer.name?.toLowerCase() || '';
        const customerPhone = normalizePhone(customer.phone || '');

        if (activeField === 'phone') {
          return (
            customerPhone.includes(normalizedQuery) ||
            customerName.includes(queryLower)
          );
        }
        return (
          customerName.includes(queryLower) ||
          customerPhone.includes(normalizedQuery)
        );
      })
      .slice(0, 8);
  }, [customers, suggestionQuery, activeField]);

  // 전화번호로 고객 정보 자동 조회
  useEffect(() => {
    const phone = normalizePhone(formData.phone);
    if (phone && phone.length >= 10) {
      searchCustomer(phone);
    } else {
      setCustomerInfo(null);
    }
  }, [formData.phone]);

  const searchCustomer = async (phone: string) => {
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone)
        .single();

      if (!error && data) {
        setCustomerInfo(data);
        setFormData(prev => ({
          ...prev,
          name: data.name || prev.name,
          email: data.email || prev.email,
        }));
      } else {
        setCustomerInfo(null);
      }
    } catch (err) {
      setCustomerInfo(null);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectCustomer = (customer: any) => {
    setCustomerInfo(customer);
    setFormData((prev) => ({
      ...prev,
      name: customer.name || prev.name,
      phone: customer.phone || prev.phone,
      email: customer.email || prev.email,
    }));
    setSuggestionQuery('');
    setActiveField(null);
  };

  const handleSuggestionBlur = () => {
    setClosingSuggestions(true);
    setTimeout(() => {
      setClosingSuggestions(false);
      setActiveField(null);
      setSuggestionQuery('');
    }, 150);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/bookings/quick-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          date,
          time,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '예약 추가에 실패했습니다.');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">빠른 예약 추가</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>예약 시간:</strong> {date} {time}
            </p>
          </div>

          {customerInfo && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">
                ✅ 기존 고객 정보를 찾았습니다. (VIP: {customerInfo.customer_grade || 'NONE'})
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                전화번호 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={formData.phone}
                  onFocus={() => {
                    setActiveField('phone');
                    setSuggestionQuery(formData.phone);
                  }}
                  onBlur={() => {
                    if (!closingSuggestions) {
                      handleSuggestionBlur();
                    }
                  }}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, phone: value });
                    setActiveField('phone');
                    setSuggestionQuery(value);
                  }}
                  required
                  placeholder="010-1234-5678"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
                {activeField === 'phone' && filteredSuggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredSuggestions.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectCustomer(customer);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50"
                      >
                        <p className="text-sm font-medium text-gray-900">{customer.name || '이름 없음'}</p>
                        <p className="text-xs text-gray-500">
                          {customer.phone || '-'} {customer.email ? `• ${customer.email}` : ''}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {searching && (
                <p className="text-xs text-gray-500 mt-1">고객 정보 검색 중...</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이름 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.name}
                  onFocus={() => {
                    setActiveField('name');
                    setSuggestionQuery(formData.name);
                  }}
                  onBlur={() => {
                    if (!closingSuggestions) {
                      handleSuggestionBlur();
                    }
                  }}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, name: value });
                    setActiveField('name');
                    setSuggestionQuery(value);
                  }}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
                {activeField === 'name' && filteredSuggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredSuggestions.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectCustomer(customer);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50"
                      >
                        <p className="text-sm font-medium text-gray-900">{customer.name || '이름 없음'}</p>
                        <p className="text-xs text-gray-500">
                          {customer.phone || '-'} {customer.email ? `• ${customer.email}` : ''}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                서비스
              </label>
              <select
                value={formData.service_type}
                onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="마쓰구 드라이버 시타서비스">마쓰구 드라이버 시타서비스</option>
                <option value="KGFA 1급 시타 체험하기">KGFA 1급 시타 체험하기</option>
                <option value="만족스런 비거리를 점검해 보세요">만족스런 비거리를 점검해 보세요</option>
                <option value="시타 신청하기">시타 신청하기</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                희망 클럽 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.club}
                onChange={(e) => setFormData({ ...formData, club: e.target.value })}
                required
                placeholder="예: 드라이버, 아이언 등"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                메모
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300"
              >
                {loading ? '저장 중...' : '예약 추가'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

