import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, AlertCircle } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
  updated_at?: string;
}

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({
  isOpen,
  onClose
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 카테고리 목록 로드
  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/categories');
      const data = await response.json();
      
      if (response.ok) {
        setCategories(data.categories || []);
      } else {
        setError(data.error || '카테고리 로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('❌ 카테고리 로드 오류:', error);
      setError('카테고리 로드 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 새 카테고리 추가
  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      setError('카테고리 이름을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory)
      });

      const data = await response.json();

      if (response.ok) {
        setCategories(prev => [...prev, data.category]);
        setNewCategory({ name: '', description: '' });
        setIsAdding(false);
      } else {
        setError(data.error || '카테고리 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('❌ 카테고리 추가 오류:', error);
      setError('카테고리 추가 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 카테고리 수정
  const handleUpdateCategory = async (category: Category) => {
    if (!category.name.trim()) {
      setError('카테고리 이름을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: category.id,
          name: category.name,
          description: category.description
        })
      });

      const data = await response.json();

      if (response.ok) {
        setCategories(prev => prev.map(cat => 
          cat.id === category.id ? data.category : cat
        ));
        setEditingCategory(null);
      } else {
        setError(data.error || '카테고리 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('❌ 카테고리 수정 오류:', error);
      setError('카테고리 수정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 카테고리 삭제
  const handleDeleteCategory = async (category: Category) => {
    if (!confirm(`"${category.name}" 카테고리를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: category.id })
      });

      const data = await response.json();

      if (response.ok) {
        setCategories(prev => prev.filter(cat => cat.id !== category.id));
      } else {
        setError(data.error || '카테고리 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('❌ 카테고리 삭제 오류:', error);
      setError('카테고리 삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 모달 열릴 때 카테고리 로드
  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">📂 카테고리 관리</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            <X size={24} />
          </button>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* 내용 */}
        <div className="p-6 max-h-[60vh] overflow-auto">
          {/* 새 카테고리 추가 */}
          <div className="mb-6">
            {!isAdding ? (
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                disabled={loading}
              >
                <Plus size={16} />
                새 카테고리 추가
              </button>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="text-lg font-semibold mb-3">새 카테고리 추가</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      카테고리 이름 *
                    </label>
                    <input
                      type="text"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="예: 드라이버, 아이언, 퍼터"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      maxLength={50}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      설명 (선택사항)
                    </label>
                    <textarea
                      value={newCategory.description}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="카테고리에 대한 설명을 입력하세요"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={2}
                      maxLength={200}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddCategory}
                      disabled={loading || !newCategory.name.trim()}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save size={16} />
                      {loading ? '추가 중...' : '추가'}
                    </button>
                    <button
                      onClick={() => {
                        setIsAdding(false);
                        setNewCategory({ name: '', description: '' });
                        setError(null);
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 카테고리 목록 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">카테고리 목록 ({categories.length}개)</h3>
            
            {loading && categories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                카테고리를 불러오는 중...
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                등록된 카테고리가 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {categories.map((category) => (
                  <div key={category.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    {editingCategory?.id === category.id ? (
                      // 편집 모드
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            카테고리 이름 *
                          </label>
                          <input
                            type="text"
                            value={editingCategory.name}
                            onChange={(e) => setEditingCategory(prev => 
                              prev ? { ...prev, name: e.target.value } : null
                            )}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            maxLength={50}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            설명 (선택사항)
                          </label>
                          <textarea
                            value={editingCategory.description || ''}
                            onChange={(e) => setEditingCategory(prev => 
                              prev ? { ...prev, description: e.target.value } : null
                            )}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            rows={2}
                            maxLength={200}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateCategory(editingCategory)}
                            disabled={loading || !editingCategory.name.trim()}
                            className="flex items-center gap-2 px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Save size={14} />
                            {loading ? '저장 중...' : '저장'}
                          </button>
                          <button
                            onClick={() => setEditingCategory(null)}
                            className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition-colors"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      // 보기 모드
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">{category.name}</h4>
                          {category.description && (
                            <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            생성일: {new Date(category.created_at).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => setEditingCategory(category)}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="수정"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="삭제"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
