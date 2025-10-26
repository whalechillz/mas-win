import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminNav from '../../components/admin/AdminNav';

interface Category {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    sort_order: 0
  });

  // 카테고리 목록 로드
  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      } else {
        console.error('카테고리 로드 실패:', response.statusText);
      }
    } catch (error) {
      console.error('카테고리 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 카테고리 추가/수정
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCategory 
        ? `/api/admin/categories?id=${editingCategory.id}`
        : '/api/admin/categories';
      
      const method = editingCategory ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await loadCategories();
        setShowAddModal(false);
        setEditingCategory(null);
        setFormData({ name: '', description: '', is_active: true, sort_order: 0 });
        alert(editingCategory ? '카테고리가 수정되었습니다.' : '카테고리가 추가되었습니다.');
      } else {
        const error = await response.json();
        alert(`오류: ${error.message || '카테고리 저장에 실패했습니다.'}`);
      }
    } catch (error) {
      console.error('카테고리 저장 오류:', error);
      alert('카테고리 저장 중 오류가 발생했습니다.');
    }
  };

  // 카테고리 삭제
  const handleDelete = async (id: string) => {
    if (!confirm('정말로 이 카테고리를 삭제하시겠습니까?')) return;
    
    try {
      const response = await fetch(`/api/admin/categories?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadCategories();
        alert('카테고리가 삭제되었습니다.');
      } else {
        const error = await response.json();
        alert(`오류: ${error.message || '카테고리 삭제에 실패했습니다.'}`);
      }
    } catch (error) {
      console.error('카테고리 삭제 오류:', error);
      alert('카테고리 삭제 중 오류가 발생했습니다.');
    }
  };

  // 수정 모드 시작
  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      is_active: category.is_active,
      sort_order: category.sort_order
    });
    setShowAddModal(true);
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '', is_active: true, sort_order: 0 });
  };

  useEffect(() => {
    loadCategories();
  }, []);

  return (
    <div>
      <AdminNav />
      <Head>
        <title>카테고리 관리 - MAS Golf</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">📂 카테고리 관리</h1>
                <p className="text-sm text-gray-600 mt-1">블로그 및 콘텐츠 카테고리 관리</p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  ➕ 카테고리 추가
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">로딩 중...</span>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">카테고리 목록</h3>
              </div>
              
              {categories.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">등록된 카테고리가 없습니다.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          순서
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          카테고리명
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          설명
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          상태
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          생성일
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          작업
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {categories.map((category) => (
                        <tr key={category.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {category.sort_order}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {category.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {category.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              category.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {category.is_active ? '활성' : '비활성'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(category.created_at).toLocaleDateString('ko-KR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleEdit(category)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDelete(category.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              삭제
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 추가/수정 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingCategory ? '카테고리 수정' : '카테고리 추가'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    카테고리명 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    설명
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    정렬 순서
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                    활성 상태
                  </label>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {editingCategory ? '수정' : '추가'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
