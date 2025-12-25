import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import AdminNav from '../../components/admin/AdminNav';

type Supplier = {
  id: number;
  name: string;
  category: string | null;
  order_method: string | null;
  contact: string | null;
  note: string | null;
  created_at?: string;
  updated_at?: string;
};

export default function SuppliersAdminPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formOrderMethod, setFormOrderMethod] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formNote, setFormNote] = useState('');
  const [saving, setSaving] = useState(false);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('q', search.trim());

      const res = await fetch(`/api/admin/suppliers?${params.toString()}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setSuppliers(json.suppliers || []);
      } else {
        alert(json.message || '공급업체 목록 조회에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('공급업체 목록 조회 오류:', error);
      alert(error.message || '공급업체 목록 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, [search]);

  const resetForm = () => {
    setEditingSupplier(null);
    setFormName('');
    setFormCategory('');
    setFormOrderMethod('');
    setFormContact('');
    setFormNote('');
    setShowForm(false);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormName(supplier.name);
    setFormCategory(supplier.category || '');
    setFormOrderMethod(supplier.order_method || '');
    setFormContact(supplier.contact || '');
    setFormNote(supplier.note || '');
    setShowForm(true);
  };

  const saveSupplier = async () => {
    if (!formName.trim()) {
      alert('공급업체 이름은 필수입니다.');
      return;
    }
    setSaving(true);
    try {
      const body: any = {
        name: formName.trim(),
        category: formCategory.trim() || null,
        order_method: formOrderMethod.trim() || null,
        contact: formContact.trim() || null,
        note: formNote.trim() || null,
      };
      if (editingSupplier) {
        body.id = editingSupplier.id;
      }

      const res = await fetch('/api/admin/suppliers', {
        method: editingSupplier ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.message || '저장에 실패했습니다.');
        setSaving(false);
        return;
      }
      alert('저장되었습니다.');
      resetForm();
      await loadSuppliers();
    } catch (error: any) {
      console.error('공급업체 저장 오류:', error);
      alert(error.message || '공급업체 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const deleteSupplier = async (id: number) => {
    if (!confirm('이 공급업체를 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/admin/suppliers?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.message || '삭제에 실패했습니다.');
        return;
      }
      await loadSuppliers();
    } catch (error: any) {
      console.error('공급업체 삭제 오류:', error);
      alert(error.message || '공급업체 삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <>
      <Head>
        <title>공급업체 관리 - MASGOLF</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">공급업체 관리</h1>
              <p className="text-sm text-gray-600 mt-1">
                마플, 은성인쇄, GSI coffee, TDG사업자몰, 원투스포츠, 쿠팡, 로젠택배 등 공급업체를 관리합니다.
              </p>
            </div>
            <button
              onClick={openCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              ➕ 공급업체 추가
            </button>
          </div>

          {/* 검색 */}
          <div className="mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="공급업체명, 카테고리, 주문방법, 메모 검색..."
              className="w-full px-4 py-2 border rounded-md text-sm"
            />
          </div>

          {/* 테이블 */}
          <div className="bg-white border rounded-lg overflow-hidden">
            {loading ? (
              <div className="py-10 text-center text-gray-500 text-sm">로딩 중...</div>
            ) : suppliers.length === 0 ? (
              <div className="py-10 text-center text-gray-500 text-sm">
                등록된 공급업체가 없습니다.
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left">이름</th>
                    <th className="p-3 text-left">카테고리</th>
                    <th className="p-3 text-left">주문방법</th>
                    <th className="p-3 text-left">연락처</th>
                    <th className="p-3 text-left">메모</th>
                    <th className="p-3 text-left">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((s) => (
                    <tr key={s.id} className="border-t">
                      <td className="p-3 font-medium">{s.name}</td>
                      <td className="p-3">{s.category || '-'}</td>
                      <td className="p-3">{s.order_method || '-'}</td>
                      <td className="p-3">{s.contact || '-'}</td>
                      <td className="p-3 text-gray-600">{s.note || '-'}</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEdit(s)}
                            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => deleteSupplier(s.id)}
                            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* 입력/수정 폼 */}
          {showForm && (
            <div className="mt-6 bg-white border rounded-lg p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">
                {editingSupplier ? '공급업체 수정' : '새 공급업체 추가'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    이름 *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-2 py-1.5 border rounded-md"
                    placeholder="예: 마플, 은성인쇄, GSI coffee"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    카테고리
                  </label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-2 py-1.5 border rounded-md"
                    placeholder="예: goods_maker, printing, online_mall"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    주문방법
                  </label>
                  <input
                    type="text"
                    value={formOrderMethod}
                    onChange={(e) => setFormOrderMethod(e.target.value)}
                    className="w-full px-2 py-1.5 border rounded-md"
                    placeholder="예: online_mall, kakao, phone, email"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    연락처
                  </label>
                  <input
                    type="text"
                    value={formContact}
                    onChange={(e) => setFormContact(e.target.value)}
                    className="w-full px-2 py-1.5 border rounded-md"
                    placeholder="전화번호, 카카오채널, URL 등"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    메모
                  </label>
                  <textarea
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    rows={3}
                    className="w-full px-2 py-1.5 border rounded-md"
                    placeholder="재주문 방법, 담당자 이름 등"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-1.5 border rounded-md text-xs hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={saveSupplier}
                  disabled={saving}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-xs hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving
                    ? '저장 중...'
                    : editingSupplier
                    ? '공급업체 수정'
                    : '공급업체 추가'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

