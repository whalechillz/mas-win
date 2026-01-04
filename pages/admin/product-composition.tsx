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
  product_id?: number; // ✅ 추가: products 테이블 참조
  name: string;
  category: 'driver' | 'cap' | 'apparel' | 'accessory';
  composition_target: 'hands' | 'head' | 'body' | 'accessory';
  image_url: string;
  reference_images?: string[];
  driver_parts?: {
    crown?: string[];
    sole?: string[];
    face?: string[];
  };
  hat_type?: 'bucket' | 'baseball' | 'visor';
  slug: string;
  description?: string;
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
    category: 'cap',
    composition_target: 'head',
    image_url: '',
    reference_images: [],
    slug: '',
    description: '',
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

  // 제품 비활성화
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
        alert(`오류: ${error.error || '제품 비활성화에 실패했습니다.'}`);
      }
    } catch (error) {
      console.error('제품 비활성화 오류:', error);
      alert('제품 비활성화 중 오류가 발생했습니다.');
    }
  };

  // 제품 완전 삭제
  const handleHardDelete = async (id: string, name: string) => {
    if (!confirm(`정말 "${name}" 제품을 완전히 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다.\n제품 합성 데이터가 영구적으로 삭제됩니다.`)) return;
    
    try {
      const response = await fetch(`/api/admin/product-composition?id=${id}`, {
        method: 'DELETE',
        headers: {
          'X-Hard-Delete': 'true'
        },
      });

      if (response.ok) {
        await loadProducts();
        alert('제품이 완전히 삭제되었습니다.');
      } else {
        const error = await response.json();
        alert(`오류: ${error.error || '제품 삭제에 실패했습니다.'}`);
      }
    } catch (error) {
      console.error('제품 완전 삭제 오류:', error);
      alert('제품 삭제 중 오류가 발생했습니다.');
    }
  };

  // 수정 모드 시작
  const handleEdit = (product: ProductComposition) => {
    setEditingProduct(product);
    
    // 🔍 디버깅: 제품 데이터 확인
    console.log('🔍 제품 수정 - 원본 데이터:', {
      id: product.id,
      name: product.name,
      image_url: product.image_url,
      reference_images: product.reference_images,
      reference_images_type: typeof product.reference_images,
      reference_images_isArray: Array.isArray(product.reference_images),
      reference_images_length: Array.isArray(product.reference_images) ? product.reference_images.length : 'N/A',
    });
    
    // 이미지 URL 정리
    const mainImageUrl = product.image_url ? getCorrectedImageUrl(product.image_url) : '';
    
    // reference_images가 배열인지 확인하고 처리
    let refImages: string[] = [];
    if (product.reference_images) {
      if (Array.isArray(product.reference_images)) {
        refImages = product.reference_images
          .map((img: string) => getCorrectedImageUrl(img))
          .filter((img: string) => img && img.trim() !== '');
      } else if (typeof product.reference_images === 'string') {
        // 문자열인 경우 JSON 파싱 시도
        try {
          const parsed = JSON.parse(product.reference_images);
          if (Array.isArray(parsed)) {
            refImages = parsed
              .map((img: string) => getCorrectedImageUrl(img))
              .filter((img: string) => img && img.trim() !== '');
          }
        } catch (e) {
          console.warn('⚠️ reference_images 파싱 실패:', e);
        }
      }
    }
    
    // 🔍 디버깅: 처리된 이미지 확인
    console.log('🔍 제품 수정 - 처리된 이미지:', {
      mainImageUrl,
      refImages,
      refImagesCount: refImages.length,
      totalImages: [mainImageUrl, ...refImages].filter(img => img).length,
    });
    
    setFormData({
      name: product.name,
      product_id: product.product_id,
      category: product.category,
      composition_target: product.composition_target,
      image_url: mainImageUrl,
      reference_images: refImages,
      driver_parts: product.driver_parts,
      hat_type: product.hat_type,
      slug: product.slug,
      description: product.description || '', // null 체크
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
      category: 'cap',
      composition_target: 'head',
      image_url: '',
      reference_images: [],
      slug: '',
      description: '',
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
        const allImages = getAllImages();
        
        // 첫 번째 이미지면 대표로, 아니면 참조로 추가
        if (allImages.length === 0) {
          setFormData({ ...formData, image_url: data.url });
        } else {
          setFormData({ 
            ...formData, 
            reference_images: [...(formData.reference_images || []), data.url] 
          });
        }
        alert('이미지가 추가되었습니다.');
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

  // 참조 이미지 업로드 (합성용) - 통합 이미지 관리 방식으로 동작
  const handleReferenceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // handleImageUpload와 동일한 로직 사용
    await handleImageUpload(e);
  };

  // 참조 이미지 삭제 (기존 함수 - 호환성 유지)
  const handleRemoveReferenceImage = (index: number) => {
    const currentRefs = formData.reference_images || [];
    setFormData({
      ...formData,
      reference_images: currentRefs.filter((_, i) => i !== index),
    });
  };

  // 모든 이미지를 하나의 배열로 관리하는 함수
  const getAllImages = (): string[] => {
    const images: string[] = [];
    if (formData.image_url && formData.image_url.trim() !== '') {
      images.push(formData.image_url);
    }
    if (formData.reference_images && formData.reference_images.length > 0) {
      images.push(...formData.reference_images.filter(img => img && img.trim() !== ''));
    }
    
    // 🔍 디버깅: 이미지 배열 상태 확인
    if (images.length === 0) {
      console.log('⚠️ getAllImages - 이미지가 없습니다:', {
        image_url: formData.image_url,
        reference_images: formData.reference_images,
        reference_images_length: formData.reference_images?.length || 0,
      });
    }
    
    return images;
  };

  // 대표 이미지 설정 함수
  const handleSetMainImage = (imageUrl: string) => {
    const allImages = getAllImages();
    const otherImages = allImages.filter(img => img !== imageUrl);
    
    setFormData({
      ...formData,
      image_url: imageUrl,
      reference_images: otherImages,
    });
  };

  // 이미지 삭제 함수 (Storage에서도 삭제)
  const handleDeleteImage = async (imageUrl: string) => {
    if (!confirm('정말로 이 이미지를 삭제하시겠습니까?\n\n⚠️ Supabase Storage에서도 영구적으로 삭제됩니다.')) {
      return;
    }

    try {
      // Storage에서 삭제
      const response = await fetch('/api/admin/delete-product-image', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '이미지 삭제에 실패했습니다.');
      }

      // 폼 데이터에서 제거
      const allImages = getAllImages();
      const remainingImages = allImages.filter(img => img !== imageUrl);
      
      if (remainingImages.length > 0) {
        // 첫 번째 이미지를 대표 이미지로 설정
        setFormData({
          ...formData,
          image_url: remainingImages[0],
          reference_images: remainingImages.slice(1),
        });
      } else {
        // 모든 이미지가 삭제된 경우
        setFormData({
          ...formData,
          image_url: '',
          reference_images: [],
        });
      }

      alert('이미지가 삭제되었습니다.');
    } catch (error: any) {
      console.error('이미지 삭제 오류:', error);
      alert(`이미지 삭제 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  // 이미지 경로 자동 수정 (hat-white-bucket → bucket-hat-muziik)
  const getCorrectedImageUrl = (url: string): string => {
    if (!url || typeof url !== 'string' || url.trim() === '') return '';
    // hat-white-bucket → bucket-hat-muziik 경로 수정
    return url.replace(
      'originals/goods/hat-white-bucket/',
      'originals/goods/bucket-hat-muziik/'
    );
  };

  // URL에서 파일명 추출 함수
  const getFileNameFromUrl = (url: string): string => {
    if (!url) return '';
    
    try {
      // 절대 URL인 경우
      if (url.startsWith('http://') || url.startsWith('https://')) {
        // URL에서 경로 부분 추출
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        const fileName = pathParts[pathParts.length - 1];
        // 쿼리 파라미터 제거
        return fileName.split('?')[0] || fileName;
      }
      
      // 상대 경로인 경우
      const pathParts = url.split('/');
      const fileName = pathParts[pathParts.length - 1];
      return fileName.split('?')[0] || fileName;
    } catch (error) {
      // URL 파싱 실패 시 마지막 경로 부분 반환
      const parts = url.split('/');
      return parts[parts.length - 1] || url;
    }
  };

  // 갤러리에서 이미지 선택
  const getCompositionFolderPath = (): string | undefined => {
    if (!formData.slug || !formData.category) return undefined;
    
    // ✅ includeChildren='false'일 때는 현재 폴더만 조회하므로
    // 기본적으로 composition 폴더를 반환 (이미지가 여기에 있음)
    // 사용자는 브레드크럼으로 detail, gallery 폴더로 이동 가능
    
    // 굿즈/액세서리: originals/goods/{slug}/composition (cap = 모자)
    if (formData.category === 'goods' || formData.category === 'cap' || formData.category === 'accessory') {
      // ✅ 구식 slug를 새 색상별 slug로 매핑
      const goodsSlugToFolder: Record<string, string> = {
        // 구식 버킷햇 slug → 새 색상별 slug
        'hat-white-bucket': 'bucket-hat-muziik-white',
        'hat-black-bucket': 'bucket-hat-muziik-black',
        // 구식 골프모자 slug → 새 색상별 slug
        'hat-white-golf': 'golf-hat-muziik-white',
        // 새로운 색상별 slug는 그대로 사용
        'bucket-hat-muziik-black': 'bucket-hat-muziik-black',
        'bucket-hat-muziik-white': 'bucket-hat-muziik-white',
        'golf-hat-muziik-black': 'golf-hat-muziik-black',
        'golf-hat-muziik-white': 'golf-hat-muziik-white',
        'golf-hat-muziik-navy': 'golf-hat-muziik-navy',
        'golf-hat-muziik-beige': 'golf-hat-muziik-beige',
      };
      
      const folderSlug = goodsSlugToFolder[formData.slug] || formData.slug;
      return `originals/goods/${folderSlug}/composition`;
    } else {
      // 드라이버 제품: slug를 그대로 사용 (실제 폴더명과 일치)
      return `originals/products/${formData.slug}/composition`;
    }
  };

  const handleOpenGallery = (mode: 'image' | 'reference') => {
    if (!formData.slug || !formData.category) {
      alert('제품 정보(Slug, 카테고리)를 먼저 입력해주세요.');
      return;
    }
    // 통합 이미지 관리이므로 mode는 무시하고 항상 'image'로 설정
    setGalleryPickerMode('image');
    setShowGalleryPicker(true);
  };

  const handleGalleryImageSelect = (imageUrl: string) => {
    const allImages = getAllImages();
    
    // 이미 존재하는 이미지는 추가하지 않음
    if (allImages.includes(imageUrl)) {
      alert('이미 추가된 이미지입니다.');
      return;
    }

    // 첫 번째 이미지면 대표로, 아니면 참조로 추가
    if (allImages.length === 0) {
      setFormData({ ...formData, image_url: imageUrl });
    } else {
      setFormData({ 
        ...formData, 
        reference_images: [...(formData.reference_images || []), imageUrl] 
      });
    }
    
    setShowGalleryPicker(false);
    setGalleryPickerMode(null);
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
                            src={getAbsoluteImageUrl(getCorrectedImageUrl(product.image_url))}
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
                          {product.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.composition_target}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="max-w-xs truncate" title={getCorrectedImageUrl(product.image_url)}>
                          {getCorrectedImageUrl(product.image_url)}
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
                          className="text-orange-600 hover:text-orange-900 mr-2"
                          title="비활성화"
                        >
                          비활성화
                        </button>
                        <button
                          onClick={() => handleHardDelete(product.id, product.name)}
                          className="text-red-600 hover:text-red-900"
                          title="완전 삭제"
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
                      제품 이미지 관리 *
                      {getAllImages().length > 0 && (
                        <span className="ml-2 text-xs text-gray-500 font-normal">
                          (총 {getAllImages().length}개)
                        </span>
                      )}
                    </label>
                    
                    {/* 이미지 추가 버튼 */}
                    <div className="flex gap-2 mb-4">
                      <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                        {uploadingImage ? '업로드 중...' : '📷 이미지 업로드'}
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

                    {/* 통합 이미지 그리드 */}
                    {getAllImages().length > 0 ? (
                      <div className="grid grid-cols-4 gap-4">
                        {getAllImages().map((img, index) => {
                          const isMain = formData.image_url === img;
                          const fileName = getFileNameFromUrl(img);
                          return (
                            <div key={index} className="relative group">
                              <div className={`relative w-full h-32 bg-gray-100 rounded overflow-hidden border-2 ${
                                isMain ? 'border-blue-500' : 'border-gray-300'
                              }`}>
                                <Image
                                  src={getAbsoluteImageUrl(getCorrectedImageUrl(img))}
                                  alt={isMain ? '대표 이미지' : `이미지 ${index + 1}`}
                                  fill
                                  className="object-contain"
                                  unoptimized
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    console.error('❌ 이미지 로드 실패:', img);
                                  }}
                                />
                                {/* 대표 이미지 배지 */}
                                {isMain && (
                                  <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                                    대표
                                  </div>
                                )}
                              </div>
                              
                              {/* 파일명 표시 */}
                              <div className="mt-1 text-xs text-gray-600 truncate" title={fileName || img}>
                                {fileName || '파일명 없음'}
                              </div>
                              
                              {/* 버튼 그룹 */}
                              <div className="mt-2 flex gap-1">
                                {!isMain && (
                                  <button
                                    type="button"
                                    onClick={() => handleSetMainImage(img)}
                                    className="flex-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                                    title="대표 이미지로 설정"
                                  >
                                    대표로
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteImage(img)}
                                  className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                                  title="이미지 삭제"
                                >
                                  삭제
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded">
                        <p className="mb-2 font-medium">이미지가 없습니다.</p>
                        <p className="text-xs text-gray-400">
                          위 버튼을 사용하여 이미지를 추가하세요.
                        </p>
                        {editingProduct && (
                          <p className="text-xs text-red-500 mt-2">
                            ⚠️ 참조 이미지가 데이터베이스에 있을 수 있지만 로드되지 않았습니다.
                            <br />
                            브라우저 콘솔을 확인하세요.
                          </p>
                        )}
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

