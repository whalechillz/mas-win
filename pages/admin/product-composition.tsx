import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import AdminNav from '../../components/admin/AdminNav';
import Image from 'next/image';

interface ProductComposition {
  id: string;
  name: string;
  display_name?: string;
  category: 'driver' | 'hat' | 'apparel' | 'accessory';
  composition_target: 'hands' | 'head' | 'body' | 'accessory';
  image_url: string;
  reference_images?: string[];
  color_variants?: Record<string, string>;
  driver_parts?: {
    crown?: string[];
    sole?: string[];
    face?: string[];
  };
  hat_type?: 'bucket' | 'baseball' | 'visor';
  slug: string;
  badge?: string;
  description?: string;
  price?: string;
  features?: string[];
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export default function ProductCompositionManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<ProductComposition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductComposition | null>(null);
  const [formData, setFormData] = useState<Partial<ProductComposition>>({
    name: '',
    display_name: '',
    category: 'hat',
    composition_target: 'head',
    image_url: '',
    reference_images: [],
    color_variants: {},
    slug: '',
    badge: '',
    description: '',
    price: '',
    features: [],
    is_active: true,
    display_order: 0,
    hat_type: 'baseball',
  });
  const [filter, setFilter] = useState<{
    category?: string;
    target?: string;
    active?: boolean;
  }>({});

  // 제품 목록 로드 (useCallback으로 메모이제이션)
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.category) params.append('category', filter.category);
      if (filter.target) params.append('target', filter.target);
      if (filter.active !== undefined) params.append('active', String(filter.active));

      const response = await fetch(`/api/admin/product-composition?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      } else {
        console.error('제품 로드 실패:', response.statusText);
      }
    } catch (error) {
      console.error('제품 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // useEffect는 모든 hooks 이후, 조건부 return 이전에 배치
  useEffect(() => {
    if (status === 'loading' || !session) return;
    loadProducts();
  }, [loadProducts, status, session]);

  // 조건부 return은 모든 hooks 이후에 배치
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    router.push('/admin/login');
    return null;
  }

  // 제품 추가/수정
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = '/api/admin/product-composition';
      const method = editingProduct ? 'PUT' : 'POST';
      
      const payload = editingProduct 
        ? { id: editingProduct.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await loadProducts();
        setShowModal(false);
        setEditingProduct(null);
        resetForm();
        alert(editingProduct ? '제품이 수정되었습니다.' : '제품이 추가되었습니다.');
      } else {
        const error = await response.json();
        alert(`오류: ${error.error || '제품 저장에 실패했습니다.'}`);
      }
    } catch (error) {
      console.error('제품 저장 오류:', error);
      alert('제품 저장 중 오류가 발생했습니다.');
    }
  };

  // 제품 삭제
  const handleDelete = async (id: string) => {
    if (!confirm('정말로 이 제품을 비활성화하시겠습니까?')) return;
    
    try {
      const response = await fetch(`/api/admin/product-composition?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadProducts();
        alert('제품이 비활성화되었습니다.');
      } else {
        const error = await response.json();
        alert(`오류: ${error.error || '제품 삭제에 실패했습니다.'}`);
      }
    } catch (error) {
      console.error('제품 삭제 오류:', error);
      alert('제품 삭제 중 오류가 발생했습니다.');
    }
  };

  // 수정 모드 시작
  const handleEdit = (product: ProductComposition) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      display_name: product.display_name || product.name,
      category: product.category,
      composition_target: product.composition_target,
      image_url: product.image_url,
      reference_images: product.reference_images || [],
      color_variants: product.color_variants || {},
      driver_parts: product.driver_parts,
      hat_type: product.hat_type,
      slug: product.slug,
      badge: product.badge,
      description: product.description,
      price: product.price,
      features: product.features || [],
      is_active: product.is_active,
      display_order: product.display_order,
    });
    setShowModal(true);
  };

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      name: '',
      display_name: '',
      category: 'hat',
      composition_target: 'head',
      image_url: '',
      reference_images: [],
      color_variants: {},
      slug: '',
      badge: '',
      description: '',
      price: '',
      features: [],
      is_active: true,
      display_order: 0,
      hat_type: 'baseball',
    });
  };

  // 새 제품 추가 모드
  const handleAdd = () => {
    setEditingProduct(null);
    resetForm();
    setShowModal(true);
  };

  return (
    <>
      <Head>
        <title>제품 합성 관리 - 관리자</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <AdminNav />

        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">제품 합성 관리</h1>
              <p className="mt-2 text-sm text-gray-600">
                AI 이미지 합성에 사용할 제품 정보를 관리합니다
              </p>
            </div>
            <button
              onClick={handleAdd}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + 제품 추가
            </button>
          </div>

          {/* 필터 */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  카테고리
                </label>
                <select
                  value={filter.category || ''}
                  onChange={(e) => setFilter({ ...filter, category: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">전체</option>
                  <option value="driver">드라이버</option>
                  <option value="hat">모자</option>
                  <option value="apparel">의류</option>
                  <option value="accessory">액세서리</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  합성 타겟
                </label>
                <select
                  value={filter.target || ''}
                  onChange={(e) => setFilter({ ...filter, target: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">전체</option>
                  <option value="hands">손</option>
                  <option value="head">머리</option>
                  <option value="body">몸</option>
                  <option value="accessory">액세서리</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상태
                </label>
                <select
                  value={filter.active === undefined ? '' : String(filter.active)}
                  onChange={(e) => setFilter({ ...filter, active: e.target.value === '' ? undefined : e.target.value === 'true' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">전체</option>
                  <option value="true">활성</option>
                  <option value="false">비활성</option>
                </select>
              </div>
            </div>
          </div>

          {/* 제품 목록 */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      이미지
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      제품명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      카테고리
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      합성 타겟
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      이미지 URL
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative w-16 h-16 bg-gray-100 rounded overflow-hidden">
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            className="object-contain"
                            unoptimized
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/placeholder-image.jpg';
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.display_name || product.name}
                        </div>
                        {product.badge && (
                          <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                            {product.badge}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.composition_target}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="max-w-xs truncate" title={product.image_url}>
                          {product.image_url}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded ${
                          product.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.is_active ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
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

          {/* 모달 */}
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-y-auto w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">
                    {editingProduct ? '제품 수정' : '제품 추가'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setEditingProduct(null);
                      resetForm();
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        제품명 *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        표시명
                      </label>
                      <input
                        type="text"
                        value={formData.display_name}
                        onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        카테고리 *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        required
                      >
                        <option value="driver">드라이버</option>
                        <option value="hat">모자</option>
                        <option value="apparel">의류</option>
                        <option value="accessory">액세서리</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        합성 타겟 *
                      </label>
                      <select
                        value={formData.composition_target}
                        onChange={(e) => setFormData({ ...formData, composition_target: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        required
                      >
                        <option value="hands">손</option>
                        <option value="head">머리</option>
                        <option value="body">몸</option>
                        <option value="accessory">액세서리</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      이미지 URL *
                    </label>
                    <input
                      type="text"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="/main/products/goods/white-bucket-hat.webp"
                      required
                    />
                    {formData.image_url && (
                      <div className="mt-2 relative w-32 h-32 bg-gray-100 rounded overflow-hidden">
                        <Image
                          src={formData.image_url}
                          alt="미리보기"
                          fill
                          className="object-contain"
                          unoptimized
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder-image.jpg';
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Slug *
                    </label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        배지
                      </label>
                      <input
                        type="text"
                        value={formData.badge}
                        onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="BEST, LIMITED, NEW"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        가격
                      </label>
                      <input
                        type="text"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="1,700,000원"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      설명
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        표시 순서
                      </label>
                      <input
                        type="number"
                        value={formData.display_order}
                        onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                      />
                      <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700">
                        활성화
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingProduct(null);
                        resetForm();
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {editingProduct ? '수정' : '추가'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

