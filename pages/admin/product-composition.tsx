import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import AdminNav from '../../components/admin/AdminNav';
import Image from 'next/image';
import { getAbsoluteImageUrl } from '../../lib/product-composition';
import FolderImagePicker from '../../components/admin/FolderImagePicker';

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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingRefImage, setUploadingRefImage] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>('default');
  const [uploadingColorImage, setUploadingColorImage] = useState<string | null>(null);
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const [galleryPickerMode, setGalleryPickerMode] = useState<'image' | 'reference' | null>(null);

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
  }, [filter.category, filter.target, filter.active]);

  // ✅ 제품 목록 로드 useEffect: 단순화 (세션 체크 임시 비활성화 - 디버깅용)
  useEffect(() => {
    if (status === 'loading') return;
    
    // if (!session) {
    //   router.push('/admin/login');
    //   return;
    // }
    
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, !!session, filter.category, filter.target, filter.active]);

  // 조건부 return은 모든 hooks 이후에 배치
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 세션 체크 (프로덕션에서 활성화)
  // 프로덕션에서는 디버깅 모드 비활성화 (환경 변수로만 제어)
  const DEBUG_MODE = false;
  
  if (!DEBUG_MODE && !session) {
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

  // 순서 변경 (위/아래)
  const handleMoveOrder = async (productId: string, direction: 'up' | 'down') => {
    try {
      const response = await fetch('/api/admin/product-composition', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: productId, direction }),
      });

      if (response.ok) {
        await loadProducts();
      } else {
        const error = await response.json();
        alert(`오류: ${error.error || '순서 변경에 실패했습니다.'}`);
      }
    } catch (error) {
      console.error('순서 변경 오류:', error);
      alert('순서 변경 중 오류가 발생했습니다.');
    }
  };

  // 이미지 업로드 (메인 이미지 - 합성용)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ✅ slug와 category 검증 추가
    if (!formData.slug || !formData.category) {
      alert('제품 정보(Slug, 카테고리)를 먼저 입력해주세요.');
      e.target.value = ''; // 파일 입력 초기화
      return;
    }

    setUploadingImage(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      // ✅ 필수 필드이므로 항상 전달
      uploadFormData.append('productSlug', formData.slug);
      uploadFormData.append('category', formData.category);
      // ✅ 합성용 이미지로 지정
      uploadFormData.append('imageType', 'composition');

      const response = await fetch('/api/admin/upload-product-image', {
        method: 'POST',
        body: uploadFormData,
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({ ...formData, image_url: data.url });
        alert('이미지가 업로드되었습니다.');
      } else {
        const errorData = await response.json().catch(() => ({ error: '알 수 없는 오류' }));
        console.error('업로드 오류 상세:', errorData);
        alert(`오류: ${errorData.error || errorData.details || '이미지 업로드에 실패했습니다.'}`);
      }
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      alert('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploadingImage(false);
      e.target.value = ''; // 파일 입력 초기화
    }
  };

  // 참조 이미지 업로드 (합성용)
  const handleReferenceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ✅ slug와 category 검증 추가
    if (!formData.slug || !formData.category) {
      alert('제품 정보(Slug, 카테고리)를 먼저 입력해주세요.');
      e.target.value = ''; // 파일 입력 초기화
      return;
    }

    setUploadingRefImage(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      // ✅ 필수 필드이므로 항상 전달
        uploadFormData.append('productSlug', formData.slug);
        uploadFormData.append('category', formData.category);
      // ✅ 합성용 이미지로 지정
      uploadFormData.append('imageType', 'composition');

      const response = await fetch('/api/admin/upload-product-image', {
        method: 'POST',
        body: uploadFormData,
      });

      if (response.ok) {
        const data = await response.json();
        const currentRefs = formData.reference_images || [];
        setFormData({ 
          ...formData, 
          reference_images: [...currentRefs, data.url] 
        });
        alert('참조 이미지가 추가되었습니다.');
      } else {
        const errorData = await response.json().catch(() => ({ error: '알 수 없는 오류' }));
        console.error('업로드 오류 상세:', errorData);
        alert(`오류: ${errorData.error || errorData.details || '이미지 업로드에 실패했습니다.'}`);
      }
    } catch (error) {
      console.error('참조 이미지 업로드 오류:', error);
      alert('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploadingRefImage(false);
      e.target.value = ''; // 파일 입력 초기화
    }
  };

  // 참조 이미지 삭제
  const handleRemoveReferenceImage = (index: number) => {
    const currentRefs = formData.reference_images || [];
    setFormData({
      ...formData,
      reference_images: currentRefs.filter((_, i) => i !== index),
    });
  };

  // 갤러리에서 이미지 선택
  const getCompositionFolderPath = (): string | undefined => {
    if (!formData.slug || !formData.category) return undefined;
    
    // ✅ includeChildren='false'일 때는 현재 폴더만 조회하므로
    // 기본적으로 composition 폴더를 반환 (이미지가 여기에 있음)
    // 사용자는 브레드크럼으로 detail, gallery 폴더로 이동 가능
    
    // 굿즈/액세서리: originals/goods/{slug}/composition
    if (formData.category === 'goods' || formData.category === 'hat' || formData.category === 'accessory') {
      return `originals/goods/${formData.slug}/composition`;
    } else {
      // ✅ 드라이버 제품: slug → 실제 폴더명 매핑 추가
      // 데이터베이스의 slug와 실제 Storage 폴더명이 다른 경우 처리
      const driverSlugToFolder: Record<string, string> = {
        'secret-weapon-black': 'black-weapon',
        'black-beryl': 'black-beryl',
        'secret-weapon-4-1': 'gold-weapon4',
        'secret-force-gold-2': 'gold2',
        'gold2-sapphire': 'gold2-sapphire',
        'secret-force-pro-3': 'pro3',
        'pro3-muziik': 'pro3-muziik',
        'secret-force-v3': 'v3',
      };
      
      const folderName = driverSlugToFolder[formData.slug] || formData.slug;
      return `originals/products/${folderName}/composition`;
    }
  };

  const handleOpenGallery = (mode: 'image' | 'reference') => {
    if (!formData.slug || !formData.category) {
      alert('제품 정보(Slug, 카테고리)를 먼저 입력해주세요.');
      return;
    }
    setGalleryPickerMode(mode);
    setShowGalleryPicker(true);
  };

  const handleGalleryImageSelect = (imageUrl: string) => {
    if (galleryPickerMode === 'image') {
      setFormData({ ...formData, image_url: imageUrl });
    } else if (galleryPickerMode === 'reference') {
      const currentRefs = formData.reference_images || [];
      if (!currentRefs.includes(imageUrl)) {
        setFormData({ 
          ...formData, 
          reference_images: [...currentRefs, imageUrl] 
        });
      }
    }
    setShowGalleryPicker(false);
    setGalleryPickerMode(null);
  };

  // 색상별 이미지 업로드
  const handleColorImageUpload = async (color: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!formData.slug || !formData.category) {
      alert('제품 정보(Slug, 카테고리)를 먼저 입력해주세요.');
      e.target.value = '';
      return;
    }

    setUploadingColorImage(color);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('productSlug', formData.slug);
      uploadFormData.append('category', formData.category);
      uploadFormData.append('imageType', 'composition');

      const response = await fetch('/api/admin/upload-product-image', {
        method: 'POST',
        body: uploadFormData,
      });

      if (response.ok) {
        const data = await response.json();
        const currentVariants = formData.color_variants || {};
        setFormData({
          ...formData,
          color_variants: {
            ...currentVariants,
            [color]: data.url
          }
        });
        alert(`${color} 색상 이미지가 추가되었습니다.`);
      } else {
        const errorData = await response.json().catch(() => ({ error: '알 수 없는 오류' }));
        alert(`오류: ${errorData.error || errorData.details || '이미지 업로드에 실패했습니다.'}`);
      }
    } catch (error) {
      console.error('색상별 이미지 업로드 오류:', error);
      alert('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploadingColorImage(null);
      e.target.value = '';
    }
  };

  // Slug 자동 생성
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      순서
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
                            src={getAbsoluteImageUrl(product.image_url)}
                            alt={product.name}
                            fill
                            className="object-contain"
                            unoptimized
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{product.display_order}</span>
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => handleMoveOrder(product.id, 'up')}
                              className="text-gray-600 hover:text-blue-600 text-xs"
                              title="위로 이동"
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => handleMoveOrder(product.id, 'down')}
                              className="text-gray-600 hover:text-blue-600 text-xs"
                              title="아래로 이동"
                            >
                              ↓
                            </button>
                          </div>
                        </div>
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
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value });
                          // Slug가 비어있으면 자동 생성
                          if (!formData.slug && e.target.value) {
                            setFormData(prev => ({ ...prev, name: e.target.value, slug: generateSlug(e.target.value) }));
                          }
                        }}
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
                    {/* 색상 선택 드롭다운 (color_variants가 있을 때만 표시) */}
                    {formData.color_variants && Object.keys(formData.color_variants).length > 0 && (
                      <div className="mb-2">
                        <label className="block text-xs text-gray-600 mb-1">
                          색상 선택
                        </label>
                        <select
                          value={selectedColor}
                          onChange={(e) => {
                            setSelectedColor(e.target.value);
                            if (e.target.value === 'default') {
                              // 기본 이미지 URL 유지
                            } else {
                              // color_variants에서 선택한 색상 이미지 사용
                              const colorImage = formData.color_variants?.[e.target.value];
                              if (colorImage) {
                                setFormData({ ...formData, image_url: colorImage });
                              }
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="default">기본 이미지</option>
                          {Object.keys(formData.color_variants).map(color => (
                            <option key={color} value={color}>{color}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="/originals/goods/white-bucket-hat.webp"
                      required
                    />
                      <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                        {uploadingImage ? '업로드 중...' : '📷 업로드'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploadingImage}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => handleOpenGallery('image')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        🖼️ 갤러리에서 선택
                      </button>
                    </div>
                    {formData.image_url && (
                      <div className="mt-2 relative w-32 h-32 bg-gray-100 rounded overflow-hidden">
                        <Image
                          src={getAbsoluteImageUrl(formData.image_url)}
                          alt="미리보기"
                          fill
                          className="object-contain"
                          unoptimized
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    {/* 색상별 이미지 관리 섹션 */}
                    {formData.color_variants && Object.keys(formData.color_variants).length > 0 && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          색상별 이미지 관리
                        </label>
                        <div className="space-y-2">
                          {Object.entries(formData.color_variants).map(([color, imageUrl]) => (
                            <div key={color} className="flex items-center gap-2">
                              <span className="text-xs text-gray-600 w-16">{color}:</span>
                              <input
                                type="text"
                                value={imageUrl}
                                onChange={(e) => {
                                  const newVariants = { ...formData.color_variants };
                                  newVariants[color] = e.target.value;
                                  setFormData({ ...formData, color_variants: newVariants });
                                }}
                                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                              />
                              <label className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 cursor-pointer">
                                {uploadingColorImage === color ? '업로드 중...' : '📷'}
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleColorImageUpload(color, e)}
                                  className="hidden"
                                  disabled={uploadingColorImage === color}
                                />
                              </label>
                            </div>
                          ))}
                        </div>
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
                      onBlur={(e) => {
                        // 제품명이 변경되었는데 slug가 비어있으면 자동 생성
                        if (!e.target.value && formData.name) {
                          setFormData({ ...formData, slug: generateSlug(formData.name) });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="제품명 입력 시 자동 생성됩니다"
                      required
                    />
                    {formData.name && !formData.slug && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, slug: generateSlug(formData.name || '') })}
                        className="mt-1 text-xs text-blue-600 hover:text-blue-800"
                      >
                        자동 생성: {generateSlug(formData.name)}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        배지
                      </label>
                      <div className="flex gap-4">
                        {['BEST', 'LIMITED', 'NEW'].map((badge) => (
                          <label key={badge} className="flex items-center">
                            <input
                              type="radio"
                              name="badge"
                              checked={formData.badge === badge}
                              onChange={() => setFormData({ ...formData, badge: formData.badge === badge ? '' : badge })}
                              className="w-4 h-4 text-blue-600 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">{badge}</span>
                          </label>
                        ))}
                        <label className="flex items-center">
                      <input
                            type="radio"
                            name="badge"
                            checked={!formData.badge || !['BEST', 'LIMITED', 'NEW'].includes(formData.badge)}
                            onChange={() => setFormData({ ...formData, badge: '' })}
                            className="w-4 h-4 text-blue-600 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">없음</span>
                        </label>
                      </div>
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
                      참조 이미지 (다양한 각도)
                    </label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <label className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer">
                          {uploadingRefImage ? '업로드 중...' : '+ 참조 이미지 추가'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleReferenceImageUpload}
                            className="hidden"
                            disabled={uploadingRefImage}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => handleOpenGallery('reference')}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                          🖼️ 갤러리에서 선택
                        </button>
                      </div>
                      {formData.reference_images && formData.reference_images.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {formData.reference_images.map((refImg, index) => (
                            <div key={index} className="relative group">
                              <div className="relative w-full h-24 bg-gray-100 rounded overflow-hidden">
                                <Image
                                  src={getAbsoluteImageUrl(refImg)}
                                  alt={`참조 이미지 ${index + 1}`}
                                  fill
                                  className="object-contain"
                                  unoptimized
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveReferenceImage(index)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
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

          {/* 갤러리 이미지 선택 모달 - 빠른 버전 사용 */}
          <FolderImagePicker
            isOpen={showGalleryPicker}
            onClose={() => {
              setShowGalleryPicker(false);
              setGalleryPickerMode(null);
            }}
            onSelect={handleGalleryImageSelect}
            folderPath={getCompositionFolderPath() || ''}
            title="갤러리에서 이미지 선택"
          />
        </div>
      </div>
    </>
  );
}

