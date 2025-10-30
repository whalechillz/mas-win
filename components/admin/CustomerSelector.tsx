import React, { useState, useEffect } from 'react';

type Customer = {
  id: number;
  name: string;
  phone: string;
  address?: string | null;
  opt_out: boolean;
  vip_level?: string | null;
};

type CustomerSelectorProps = {
  onSelect: (customers: Customer[]) => void;
  onClose: () => void;
  selectedPhones?: string[];
};

export const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  onSelect,
  onClose,
  selectedPhones = []
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [onlyOptIn, setOnlyOptIn] = useState(true); // 수신거부 아닌 고객만
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const pageSize = 20;

  const fetchCustomers = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      q: search,
      page: String(page),
      pageSize: String(pageSize)
    });
    if (onlyOptIn) {
      params.set('optout', 'false');
    }
    try {
      const res = await fetch(`/api/admin/customers?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setCustomers(json.data || []);
        setCount(json.count || 0);
        // 이미 선택된 번호와 매칭
        const selectedIds = new Set<number>();
        json.data?.forEach((c: Customer) => {
          if (selectedPhones.includes(c.phone)) {
            selectedIds.add(c.id);
          }
        });
        setSelected(selectedIds);
      }
    } catch (error) {
      console.error('고객 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, onlyOptIn]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== '') {
        setPage(1);
        fetchCustomers();
      } else {
        fetchCustomers();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleToggle = (customer: Customer) => {
    const newSelected = new Set(selected);
    if (newSelected.has(customer.id)) {
      newSelected.delete(customer.id);
    } else {
      newSelected.add(customer.id);
    }
    setSelected(newSelected);
  };

  const handleConfirm = () => {
    const selectedCustomers = customers.filter(c => selected.has(c.id));
    onSelect(selectedCustomers);
    onClose();
  };

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">고객 선택</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* 검색 영역 */}
        <div className="p-4 border-b">
          <div className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이름/번호/주소 검색"
              className="flex-1 px-3 py-2 border rounded-md"
            />
            <label className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={onlyOptIn}
                onChange={(e) => setOnlyOptIn(e.target.checked)}
              />
              수신가능만
            </label>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            선택됨: {selected.size}명 / 전체: {count}명
          </div>
        </div>

        {/* 고객 목록 */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">로딩 중...</div>
          ) : customers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">고객 데이터가 없습니다.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="p-2 w-12"></th>
                  <th className="p-2 text-left">이름</th>
                  <th className="p-2 text-left">전화</th>
                  <th className="p-2 text-left">VIP</th>
                  <th className="p-2 text-left">주소</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className={`border-t hover:bg-gray-50 cursor-pointer ${
                      selected.has(customer.id) ? 'bg-blue-50' : ''
                    } ${customer.opt_out ? 'opacity-50' : ''}`}
                    onClick={() => !customer.opt_out && handleToggle(customer)}
                  >
                    <td className="p-2 text-center">
                      <input
                        type="checkbox"
                        checked={selected.has(customer.id)}
                        onChange={() => handleToggle(customer)}
                        disabled={customer.opt_out}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="p-2">{customer.name}</td>
                    <td className="p-2">{customer.phone}</td>
                    <td className="p-2">{customer.vip_level || 'NONE'}</td>
                    <td className="p-2 text-gray-500">{customer.address || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 페이지네이션 */}
        <div className="p-4 border-t flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {page} / {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              이전
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              다음
            </button>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="p-4 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={selected.size === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            선택 ({selected.size}명 추가)
          </button>
        </div>
      </div>
    </div>
  );
};

