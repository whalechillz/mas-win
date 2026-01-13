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
  category: 'driver' | 'hat' | 'apparel' | 'accessory' | 'component'; // ✅ component 추가
  composition_target: 'hands' | 'head' | 'body' | 'accessory';
  image_url: string;
  reference_images?: string[];
  reference_images_enabled?: Record<string, boolean>; // ✅ 참조 이미지 활성화 상태
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
  const [canRender, setCanRender] = useState(false);
  const [products, setProducts] = useState<ProductComposition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductComposition | null>(null);
  // ✅ 탭 분리: 클럽/굿즈/부품
  const [activeTab, setActiveTab] = useState<'clubs' | 'goods' | 'components'>('clubs');
  const [formData, setFormData] = useState<Partial<ProductComposition>>({
    name: '',
    category: 'driver', // ✅ 기본값을 driver로 변경 (탭에 따라 자동 설정)
    composition_target: 'hands',
    image_url: '',
    reference_images: [],
    reference_images_enabled: {}, // ✅ 참조 이미지 활성화 상태
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
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const [galleryPickerMode, setGalleryPickerMode] = useState<'image' | 'reference' | null>(null);
  // ✅ 변경사항 추적
  const [originalFormData, setOriginalFormData] = useState<Partial<ProductComposition> | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // ✅ 업로드 모드 (기본값: optimize-filename)
  const [uploadMode, setUploadMode] = useState<'optimize-filename' | 'preserve-filename'>('optimize-filename');

  // 제품 목록 로드 (useCallback으로 메모이제이션)
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.category) params.append('category', filter.category);
      if (filter.target) params.append('target', filter.target);
      if (filter.active !== undefined) params.append('active', String(filter.active));

      const response = await fetch(`/api/admin/product-composition?${params.toString()}`, {
        credentials: 'include', // ✅ 쿠키 포함 명시 (Playwright 호환)
        headers: {
          'Content-Type': 'application/json',
        },
      });
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

  // ✅ 탭별 제품 필터링
  const filteredProducts = products.filter(product => {
    if (activeTab === 'clubs') {
      return product.category === 'driver';
    } else if (activeTab === 'goods') {
      return product.category !== 'driver' && product.category !== 'component';
    } else if (activeTab === 'components') {
      return product.category === 'component';
    }
    return true;
  });

  // ✅ Slug prefix 가져오기
  const getSlugPrefix = () => {
    if (activeTab === 'clubs') return 'originals/products/';
    if (activeTab === 'goods') return 'originals/goods/';
    if (activeTab === 'components') return 'originals/components/';
    return 'originals/products/';
  };

  // ✅ Slug 입력 핸들러 (prefix 자동 처리)
  const handleSlugChange = (value: string) => {
    const prefix = getSlugPrefix();
    // prefix가 포함되어 있으면 제거
    if (value.startsWith(prefix)) {
      value = value.replace(prefix, '');
    }
    // originals/products/ 또는 originals/goods/로 시작하는 경우도 제거
    value = value.replace(/^originals\/(products|goods)\//, '');
    setFormData({ ...formData, slug: value });
  };

  // 세션 체크는 미들웨어에서 처리하므로 클라이언트 사이드 리다이렉트 제거
  // 프로덕션에서는 디버깅 모드 비활성화 (환경 변수로만 제어)
  const DEBUG_MODE = false;
  
  useEffect(() => {
    if (DEBUG_MODE) {
      setCanRender(true);
      return;
    }
    
    // 세션이 있으면 즉시 렌더링
    if (session) {
      setCanRender(true);
      return;
    }
    
    // 세션이 없어도 미들웨어가 통과시켰다면 2초 후 렌더링 시도
    const timer = setTimeout(() => {
      setCanRender(true);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [status, session, DEBUG_MODE]);

  // ✅ 변경사항 확인 함수 (모든 hooks는 조건부 return 이전에 배치)
  const checkForChanges = useCallback(() => {
    if (!originalFormData || !editingProduct) {
      setHasUnsavedChanges(false);
      return false;
    }

    // 주요 필드 비교
    const hasChanges = 
      formData.image_url !== originalFormData.image_url ||
      JSON.stringify(formData.reference_images) !== JSON.stringify(originalFormData.reference_images) ||
      JSON.stringify(formData.reference_images_enabled) !== JSON.stringify(originalFormData.reference_images_enabled) ||
      formData.name !== originalFormData.name ||
      formData.category !== originalFormData.category ||
      formData.composition_target !== originalFormData.composition_target ||
      formData.slug !== originalFormData.slug ||
      formData.description !== originalFormData.description ||
      JSON.stringify(formData.features) !== JSON.stringify(originalFormData.features) ||
      formData.is_active !== originalFormData.is_active ||
      formData.display_order !== originalFormData.display_order;

    setHasUnsavedChanges(hasChanges);
    return hasChanges;
  }, [formData, originalFormData, editingProduct]);

  // ✅ formData 변경 시 변경사항 확인
  useEffect(() => {
    if (editingProduct) {
      checkForChanges();
    }
  }, [formData, editingProduct, checkForChanges]);

  // ✅ 제품 목록 로드 useEffect
  useEffect(() => {
    if (status === 'loading') return;
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

  // 디버깅 모드가 아니고 세션이 없으면
  // 미들웨어가 이미 통과시켰으므로 세션 확인 중일 수 있음
  // 무한 로딩 방지를 위해 일정 시간 후 렌더링 시도
  if (!DEBUG_MODE && !session && !canRender) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 제품 추가/수정
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 변경사항이 없으면 저장하지 않음
    if (editingProduct && !hasUnsavedChanges) {
      alert('변경사항이 없습니다.');
      return;
    }

    setIsSaving(true);
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
        
        // ✅ 원본 데이터 업데이트
        setOriginalFormData(JSON.parse(JSON.stringify(formData))); // deep copy
        setHasUnsavedChanges(false);
        
        // ✅ 저장 성공 메시지 및 모달 닫기
        if (confirm(editingProduct ? '제품이 수정되었습니다. 모달을 닫으시겠습니까?' : '제품이 추가되었습니다. 모달을 닫으시겠습니까?')) {
          setShowModal(false);
          setEditingProduct(null);
          resetForm();
          setOriginalFormData(null);
        }
      } else {
        const error = await response.json();
        alert(`오류: ${error.error || '제품 저장에 실패했습니다.'}`);
      }
    } catch (error) {
      console.error('제품 저장 오류:', error);
      alert('제품 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
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

  // ✅ 제품 추가 시 탭에 따라 카테고리 자동 설정 및 표시 순서 자동 설정
  const handleAdd = () => {
    // ✅ 현재 제품 목록에서 가장 높은 display_order 조회
    const maxOrder = products.length > 0 
      ? Math.max(...products.map(p => p.display_order || 0))
      : -1;
    
    const defaultCategory = activeTab === 'clubs' ? 'driver' : activeTab === 'components' ? 'component' : 'hat';
    const defaultTarget = activeTab === 'clubs' ? 'hands' : activeTab === 'components' ? 'accessory' : 'head';
    setFormData({
      name: '',
      category: defaultCategory,
      composition_target: defaultTarget,
      image_url: '',
      reference_images: [],
      reference_images_enabled: {},
      slug: '',
      description: '',
      features: [],
      is_active: true,
      display_order: maxOrder + 1, // ✅ 자동으로 가장 높은 번호 + 1
      hat_type: 'baseball',
    });
    setOriginalFormData(null);
    setHasUnsavedChanges(false);
    setShowModal(true);
  };

  // 수정 모드 시작
  const handleEdit = (product: ProductComposition) => {
    setEditingProduct(product);
    // ✅ 수정 시 해당 제품의 탭으로 자동 전환
    if (product.category === 'driver') {
      setActiveTab('clubs');
    } else if (product.category === 'component') {
      setActiveTab('components');
    } else {
      setActiveTab('goods');
    }
    
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
    
    // reference_images_enabled 파싱
    let refImagesEnabled: Record<string, boolean> = {};
    if (product.reference_images_enabled) {
      if (typeof product.reference_images_enabled === 'object') {
        refImagesEnabled = product.reference_images_enabled;
      } else if (typeof product.reference_images_enabled === 'string') {
        try {
          refImagesEnabled = JSON.parse(product.reference_images_enabled);
        } catch (e) {
          console.warn('⚠️ reference_images_enabled 파싱 실패:', e);
        }
      }
    }

    // 🔍 디버깅: 처리된 이미지 확인
    console.log('🔍 제품 수정 - 처리된 이미지:', {
      mainImageUrl,
      refImages,
      refImagesCount: refImages.length,
      totalImages: [mainImageUrl, ...refImages].filter(img => img).length,
      reference_images_enabled: refImagesEnabled,
    });
    
    const newFormData = {
      name: product.name,
      product_id: product.product_id,
      category: product.category,
      composition_target: product.composition_target,
      image_url: mainImageUrl,
      reference_images: refImages,
      reference_images_enabled: refImagesEnabled, // ✅ 참조 이미지 활성화 상태 로드
      driver_parts: product.driver_parts,
      hat_type: product.hat_type,
      slug: product.slug,
      description: product.description || '', // null 체크
      features: product.features || [],
      is_active: product.is_active,
      display_order: product.display_order,
    };
    
    setFormData(newFormData);
    // ✅ 원본 데이터 저장 (변경사항 추적용)
    setOriginalFormData(JSON.parse(JSON.stringify(newFormData))); // deep copy
    setHasUnsavedChanges(false);
    setShowModal(true);
  };

  // 폼 초기화
  const resetForm = () => {
    const defaultCategory = activeTab === 'clubs' ? 'driver' : activeTab === 'components' ? 'component' : 'hat';
    const defaultTarget = activeTab === 'clubs' ? 'hands' : activeTab === 'components' ? 'accessory' : 'head';
    setFormData({
      name: '',
      category: defaultCategory,
      composition_target: defaultTarget,
      image_url: '',
      reference_images: [],
      reference_images_enabled: {}, // ✅ 참조 이미지 활성화 상태 초기화
      slug: '',
      description: '',
      features: [],
      is_active: true,
      display_order: 0,
      hat_type: 'baseball',
    });
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
    
    // ✅ reference_images_enabled 상태 업데이트
    const prevEnabled = formData.reference_images_enabled || {};
    const newEnabled: Record<string, boolean> = {};
    
    // 이전 대표 이미지가 있었다면 참조 이미지로 이동하면서 활성화 상태 유지
    if (formData.image_url && formData.image_url !== imageUrl) {
      // 이전 대표 이미지의 활성화 상태를 참조 이미지로 이동 (기본값: true)
      newEnabled[formData.image_url] = prevEnabled[formData.image_url] !== false;
    }
    
    // 나머지 참조 이미지들의 활성화 상태 유지
    otherImages.forEach(img => {
      if (img !== formData.image_url) {
        newEnabled[img] = prevEnabled[img] !== false;
      }
    });
    
    setFormData({
      ...formData,
      image_url: imageUrl,
      reference_images: otherImages,
      reference_images_enabled: newEnabled, // ✅ 활성화 상태 업데이트
    });
    
    setHasUnsavedChanges(true); // ✅ 변경사항 추적
  };

  // ✅ 목록에서만 제거 (Storage는 유지)
  const handleRemoveFromList = (imageUrl: string) => {
    const allImages = getAllImages();
    const remainingImages = allImages.filter(img => img !== imageUrl);
    
    if (remainingImages.length > 0) {
      // 첫 번째 이미지를 대표 이미지로 설정
      setFormData({
        ...formData,
        image_url: remainingImages[0],
        reference_images: remainingImages.slice(1),
        // 참조 비활성화 상태도 제거
        reference_images_enabled: Object.fromEntries(
          Object.entries(formData.reference_images_enabled || {}).filter(([key]) => key !== imageUrl)
        ),
      });
    } else {
      // 모든 이미지가 제거된 경우
      setFormData({
        ...formData,
        image_url: '',
        reference_images: [],
        reference_images_enabled: {},
      });
    }
  };

  // ✅ Storage에서 완전 삭제
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

  // 이미지 경로 자동 수정 (구식 폴더명 → 새 폴더명)
  const getCorrectedImageUrl = (url: string): string => {
    if (!url || typeof url !== 'string' || url.trim() === '') return '';
    
    let corrected = url;
    
    // 구식 폴더명을 새 폴더명으로 변환
    const folderMappings: Record<string, string> = {
      'originals/goods/hat-white-bucket/': 'originals/goods/bucket-hat-muziik/',
      'originals/products/black-beryl/': 'originals/products/secret-weapon-black-muziik/',
      'originals/products/black-weapon/': 'originals/products/secret-weapon-black/',
      'originals/products/gold-weapon4/': 'originals/products/secret-weapon-gold-4-1/',
      'originals/products/gold2/': 'originals/products/secret-force-gold-2/',
      'originals/products/gold2-sapphire/': 'originals/products/secret-force-gold-2-muziik/',
      'originals/products/pro3-muziik/': 'originals/products/secret-force-pro-3-muziik/',
      'originals/products/pro3/': 'originals/products/secret-force-pro-3/',
      'originals/products/v3/': 'originals/products/secret-force-v3/',
      '/main/products/black-beryl/': 'originals/products/secret-weapon-black-muziik/',
      '/main/products/black-weapon/': 'originals/products/secret-weapon-black/',
      '/main/products/gold-weapon4/': 'originals/products/secret-weapon-gold-4-1/',
      '/main/products/gold2/': 'originals/products/secret-force-gold-2/',
      '/main/products/gold2-sapphire/': 'originals/products/secret-force-gold-2-muziik/',
      '/main/products/pro3-muziik/': 'originals/products/secret-force-pro-3-muziik/',
      '/main/products/pro3/': 'originals/products/secret-force-pro-3/',
      '/main/products/v3/': 'originals/products/secret-force-v3/',
    };
    
    for (const [oldPath, newPath] of Object.entries(folderMappings)) {
      if (corrected.includes(oldPath)) {
        corrected = corrected.replace(oldPath, newPath);
        break; // 첫 번째 매칭만 처리
      }
    }
    
    return corrected;
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
  // ✅ 공통 폴더 경로 반환 함수 추가 (그립 공통) - components로 변경
  const getCommonFolderPath = (): string => {
    return 'originals/components/grip-common/composition';
  };

  // ✅ MUZIIK 공통 폴더 경로 반환 함수 추가 - components로 변경
  const getMuziikCommonFolderPath = (): string => {
    return 'originals/components/muziik-common/composition';
  };

  // ✅ NGS 샤프트 공통 폴더 경로 반환 함수 추가 - components로 변경
  const getNgsCommonFolderPath = (): string => {
    return 'originals/components/ngs-common/composition';
  };

  // ✅ 시크리트포스 공통 폴더 경로 반환 함수 추가 - components로 변경
  const getSecretForceCommonFolderPath = (): string => {
    return 'originals/components/secret-force-common/composition';
  };

  // ✅ 골드 공통 폴더 경로 반환 함수 추가 - components로 변경
  const getGoldCommonFolderPath = (): string => {
    return 'originals/components/secret-force-gold-common/composition';
  };

  // ✅ 시크리트웨폰 골드 공통 폴더 경로 반환 함수 추가 - components로 변경
  const getSecretWeaponGoldCommonFolderPath = (): string => {
    return 'originals/components/secret-weapon-gold-common/composition';
  };

  // ✅ 시크리트웨폰 블랙 공통 폴더 경로 반환 함수 추가 - components로 변경
  const getSecretWeaponBlackCommonFolderPath = (): string => {
    return 'originals/components/secret-weapon-black-common/composition';
  };

  // ✅ MUZIIK 제품인지 확인하는 함수
  const isMuziikProduct = (slug: string): boolean => {
    return slug.includes('muziik') || 
           slug === 'secret-force-pro-3-muziik' ||
           slug === 'secret-weapon-black-muziik' ||
           slug === 'secret-force-gold-2-muziik';
  };

  // ✅ 골드 2 제품인지 확인하는 함수 추가
  const isGold2Product = (slug: string): boolean => {
    return slug === 'secret-force-gold-2' || 
           slug === 'secret-force-gold-2-muziik';
  };

  const getCompositionFolderPath = (): string | undefined => {
    if (!formData.slug || !formData.category) return undefined;
    
    // ✅ includeChildren='false'일 때는 현재 폴더만 조회하므로
    // 기본적으로 composition 폴더를 반환 (이미지가 여기에 있음)
    // 사용자는 브레드크럼으로 detail, gallery 폴더로 이동 가능
    
    // ✅ 부품 카테고리: originals/components/{slug}/composition
    if (formData.category === 'component') {
      return `originals/components/${formData.slug}/composition`;
    }
    
    // grip-common은 공통 참조 이미지 폴더 (그립 공통)
    // slug가 없거나 특별한 경우 originals/components/grip-common/composition 반환
    if (formData.slug === 'grip-common' || formData.slug === 'secret-force-common' || formData.slug === '') {
      // component 카테고리인 경우에만 getCommonFolderPath 사용
      if (formData.category === ('component' as ProductComposition['category'])) {
        return getCommonFolderPath();
      }
    }
    
    // 굿즈/액세서리: originals/goods/{slug}/composition (hat = 모자)
    if (formData.category === 'hat' || formData.category === 'accessory') {
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
      // 구식 slug를 새 slug로 변환
      const slugMapping: Record<string, string> = {
        'black-beryl': 'secret-weapon-black-muziik',
        'black-weapon': 'secret-weapon-black',
        'gold-weapon4': 'secret-weapon-gold-4-1',
        'gold2': 'secret-force-gold-2',
        'gold2-sapphire': 'secret-force-gold-2-muziik',
        'pro3-muziik': 'secret-force-pro-3-muziik',
        'pro3': 'secret-force-pro-3',
        'v3': 'secret-force-v3',
      };
      
      const folderSlug = slugMapping[formData.slug] || formData.slug;
      return `originals/products/${folderSlug}/composition`;
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

          {/* ✅ 탭 분리: 클럽/굿즈/부품 */}
          <div className="mb-6 bg-white rounded-lg shadow p-4">
            <div className="flex gap-4 border-b border-gray-200">
              <button
                onClick={() => {
                  setActiveTab('clubs');
                  setFilter({ ...filter, category: undefined }); // 필터 초기화
                }}
                className={`px-6 py-3 font-medium text-sm transition-colors ${
                  activeTab === 'clubs'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                클럽 (Clubs)
                <span className="ml-2 text-xs text-gray-400">
                  ({products.filter(p => p.category === 'driver').length}개)
                </span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('goods');
                  setFilter({ ...filter, category: undefined }); // 필터 초기화
                }}
                className={`px-6 py-3 font-medium text-sm transition-colors ${
                  activeTab === 'goods'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                굿즈 (Goods)
                <span className="ml-2 text-xs text-gray-400">
                  ({products.filter(p => p.category !== 'driver' && p.category !== 'component').length}개)
                </span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('components');
                  setFilter({ ...filter, category: undefined }); // 필터 초기화
                }}
                className={`px-6 py-3 font-medium text-sm transition-colors ${
                  activeTab === 'components'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                부품 (Components)
                <span className="ml-2 text-xs text-gray-400">
                  ({products.filter(p => p.category === 'component').length}개)
                </span>
              </button>
            </div>
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
                  <option value="component">부품</option>
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
                  {filteredProducts.map((product) => (
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
                        onChange={(e) => {
                          const newCategory = e.target.value as any;
                          setFormData({ 
                            ...formData, 
                            category: newCategory,
                            // 카테고리 변경 시 합성 타겟 자동 설정
                            composition_target: newCategory === 'driver' ? 'hands' : 
                                              newCategory === 'hat' ? 'head' : 
                                              newCategory === 'apparel' ? 'body' : 
                                              newCategory === 'component' ? 'accessory' : 'accessory'
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        required
                      >
                        {activeTab === 'clubs' ? (
                          <option value="driver">드라이버</option>
                        ) : activeTab === 'components' ? (
                          <option value="component">부품</option>
                        ) : (
                          <>
                            <option value="hat">모자</option>
                            <option value="apparel">의류</option>
                            <option value="accessory">액세서리</option>
                          </>
                        )}
                      </select>
                      {formData.category === 'hat' && (
                        <div className="mt-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            모자 타입
                          </label>
                          <select
                            value={formData.hat_type || 'baseball'}
                            onChange={(e) => setFormData({ ...formData, hat_type: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          >
                            <option value="baseball">야구모자</option>
                            <option value="bucket">버킷햇</option>
                            <option value="visor">비저</option>
                          </select>
                        </div>
                      )}
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
                    <div className="flex gap-2 mb-4 items-center">
                      <button
                        type="button"
                        onClick={() => handleOpenGallery('image')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        🖼️ 갤러리에서 선택
                      </button>
                      <span className="text-xs text-gray-500">
                        💡 완전 삭제는 갤러리 모달에서 가능합니다
                      </span>
                    </div>

                    {/* 통합 이미지 그리드 */}
                    {getAllImages().length > 0 ? (
                      <div className="grid grid-cols-4 gap-4">
                        {getAllImages().map((img, index) => {
                          const isMain = formData.image_url === img;
                          const fileName = getFileNameFromUrl(img);
                          // ✅ 참조 이미지 활성화 상태 확인 (기본값: true)
                          const isRefEnabled = formData.reference_images_enabled?.[img] !== false;
                          return (
                            <div key={img || `image-${index}`} className="relative group">
                              <div className={`relative w-full h-32 bg-gray-100 rounded overflow-hidden border-2 ${
                                isMain ? 'border-blue-500' : isRefEnabled ? 'border-gray-300' : 'border-gray-200 opacity-60'
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
                                {/* ✅ 참조 이미지 활성화 배지 */}
                                {!isMain && (
                                  <div className={`absolute top-1 right-1 text-xs px-2 py-1 rounded ${
                                    isRefEnabled 
                                      ? 'bg-green-500 text-white' 
                                      : 'bg-gray-400 text-white'
                                  }`}>
                                    {isRefEnabled ? '✓ 참조' : '✗ 비활성'}
                                  </div>
                                )}
                              </div>
                              
                              {/* 파일명 표시 */}
                              <div className="mt-1 text-xs text-gray-600 truncate" title={fileName || img}>
                                {fileName || '파일명 없음'}
                              </div>
                              
                              {/* 버튼 그룹 */}
                              <div className="mt-2 flex flex-col gap-1">
                                {/* 첫 번째 줄: 참조 토글 + 대표 설정 */}
                                <div className="flex gap-1">
                                  {!isMain && (
                                    <>
                                      {/* ✅ 참조 이미지 활성화 토글 버튼 */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setFormData(prev => ({
                                            ...prev,
                                            reference_images_enabled: {
                                              ...(prev.reference_images_enabled || {}),
                                              [img]: !isRefEnabled
                                            }
                                          }));
                                        }}
                                        className={`flex-1 px-2 py-1 text-xs rounded ${
                                          isRefEnabled
                                            ? 'bg-green-500 text-white hover:bg-green-600'
                                            : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
                                        }`}
                                        title={isRefEnabled ? '참조 이미지 사용 중 - 클릭하여 비활성화' : '참조 이미지 비활성화 - 클릭하여 활성화'}
                                      >
                                        {isRefEnabled ? '✓ 참조' : '✗ 비활성'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSetMainImage(img)}
                                        className="flex-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                                        title="대표 이미지로 설정"
                                      >
                                        대표로
                                      </button>
                                    </>
                                  )}
                                </div>
                                {/* 두 번째 줄: 목록 제거만 (완전 삭제는 갤러리 모달에서) */}
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFromList(img)}
                                    className="flex-1 px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600"
                                    title="목록에서만 제거 (Storage는 유지)"
                                  >
                                    목록 제거
                                  </button>
                                  {/* 완전 삭제는 "갤러리에서 선택" 모달에서만 가능 */}
                                </div>
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
                      <span className="ml-2 text-xs text-gray-500 font-normal">
                        ({getSlugPrefix()})
                      </span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 font-mono bg-gray-100 px-2 py-2 rounded-l-lg border border-r-0 border-gray-300">
                        {getSlugPrefix()}
                      </span>
                      <input
                        type="text"
                        value={formData.slug || ''}
                        onChange={(e) => handleSlugChange(e.target.value)}
                        onBlur={(e) => {
                          // 제품명이 변경되었는데 slug가 비어있으면 자동 생성
                          if (!e.target.value && formData.name) {
                            const generatedSlug = generateSlug(formData.name);
                            setFormData({ ...formData, slug: generatedSlug });
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg"
                        placeholder="slug 입력 (예: secret-force-gold-2-muziik)"
                        required
                      />
                    </div>
                    {formData.name && !formData.slug && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, slug: generateSlug(formData.name || '') })}
                        className="mt-1 text-xs text-blue-600 hover:text-blue-800"
                      >
                        자동 생성: {generateSlug(formData.name)}
                      </button>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      전체 경로: <span className="font-mono">{getSlugPrefix()}{formData.slug || '...'}/composition</span>
                    </p>
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

                  {/* ✅ 변경사항 표시 */}
                  {hasUnsavedChanges && (
                    <div className="flex items-center gap-2 text-orange-600 text-sm bg-orange-50 border border-orange-200 rounded-lg p-2 mt-4">
                      <span>⚠️</span>
                      <span>저장하지 않은 변경사항이 있습니다.</span>
                    </div>
                  )}
                  
                  <div className="flex justify-end gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        // 변경사항이 있으면 확인
                        if (hasUnsavedChanges) {
                          if (!confirm('저장하지 않은 변경사항이 있습니다. 정말 닫으시겠습니까?')) {
                            return;
                          }
                        }
                        setShowModal(false);
                        setEditingProduct(null);
                        resetForm();
                        setOriginalFormData(null);
                        setHasUnsavedChanges(false);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={(!hasUnsavedChanges && editingProduct !== null) || isSaving}
                      className={`px-4 py-2 rounded-lg ${
                        hasUnsavedChanges && !isSaving
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : isSaving
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      title={!hasUnsavedChanges && editingProduct ? '변경사항이 없습니다' : ''}
                    >
                      {isSaving ? '저장 중...' : hasUnsavedChanges ? '저장' : editingProduct ? '변경사항 없음' : '추가'}
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
            // ✅ 삭제/업로드 기능 활성화
            enableDelete={true}
            enableUpload={true}
            onDelete={async (imageUrl: string) => {
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

              // ✅ 추가: 현재 제품의 이미지 목록에서도 자동 제거
              const allImages = getAllImages();
              if (allImages.includes(imageUrl)) {
                const remainingImages = allImages.filter(img => img !== imageUrl);
                
                if (remainingImages.length > 0) {
                  setFormData({
                    ...formData,
                    image_url: remainingImages[0],
                    reference_images: remainingImages.slice(1),
                    // 참조 비활성화 상태도 제거
                    reference_images_enabled: Object.fromEntries(
                      Object.entries(formData.reference_images_enabled || {}).filter(([key]) => key !== imageUrl)
                    ),
                  });
                } else {
                  setFormData({
                    ...formData,
                    image_url: '',
                    reference_images: [],
                    reference_images_enabled: {},
                  });
                }
                
                // 변경사항 표시
                setHasUnsavedChanges(true);
              }
            }}
            onUpload={async (file: File, folderPath: string, uploadModeParam?: 'optimize-filename' | 'preserve-filename') => {
              // 폴더 경로에서 slug 추출
              // 예: originals/products/secret-force-pro-3/composition -> secret-force-pro-3
              // 예: originals/components/grip-common/composition -> grip-common
              const pathParts = folderPath.split('/');
              const slugIndex = pathParts.indexOf('products') !== -1 
                ? pathParts.indexOf('products') + 1
                : pathParts.indexOf('goods') !== -1
                ? pathParts.indexOf('goods') + 1
                : pathParts.indexOf('components') !== -1
                ? pathParts.indexOf('components') + 1
                : -1;
              
              let productSlug = slugIndex !== -1 && pathParts[slugIndex] 
                ? pathParts[slugIndex] 
                : formData.slug || '';
              
              // ✅ components 폴더인 경우 category를 component로 설정
              let category = formData.category || 'cap';
              if (folderPath.includes('originals/components/')) {
                category = 'component';
              }
              
              // ✅ productSlug가 여전히 없으면 에러
              if (!productSlug || productSlug.trim() === '') {
                throw new Error('제품 정보를 확인할 수 없습니다. 폴더 경로를 확인해주세요.');
              }

              // ✅ 업로드 모드 결정 (파라미터 우선, 없으면 state 사용, 기본값: optimize-filename)
              const effectiveUploadMode = uploadModeParam ?? uploadMode ?? 'optimize-filename';
              const preserveFilename = effectiveUploadMode === 'preserve-filename';

              const uploadFormData = new FormData();
              uploadFormData.append('file', file);
              uploadFormData.append('productSlug', productSlug);
              uploadFormData.append('category', category);
              uploadFormData.append('imageType', 'composition');
              uploadFormData.append('preserveFilename', String(preserveFilename));

              const response = await fetch('/api/admin/upload-product-image', {
                method: 'POST',
                body: uploadFormData,
              });

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: '알 수 없는 오류' }));
                throw new Error(errorData.error || errorData.details || '이미지 업로드에 실패했습니다.');
              }
            }}
            // ✅ 업로드 모드 전달
            uploadMode={uploadMode}
            onUploadModeChange={(mode) => setUploadMode(mode)}
            // ✅ 공통 폴더 접근 추가
            alternativeFolders={[
              {
                label: '그립 공통',
                path: getCommonFolderPath(), // grip-common/composition
                icon: '📁',
              },
              {
                label: '시크리트포스 공통',
                path: getSecretForceCommonFolderPath(), // secret-force-common/composition
                icon: '🔧',
              },
              {
                label: '시크리트포스 골드 공통',
                path: getGoldCommonFolderPath(), // secret-force-gold-common/composition
                icon: '⭐',
              },
              {
                label: '시크리트웨폰 골드 공통',
                path: getSecretWeaponGoldCommonFolderPath(), // secret-weapon-gold-common/composition
                icon: '⭐',
              },
              {
                label: '시크리트웨폰 블랙 공통',
                path: getSecretWeaponBlackCommonFolderPath(), // secret-weapon-black-common/composition
                icon: '⚫',
              },
              // ✅ 드라이버 제품인 경우 NGS 샤프트 폴더 추가
              ...(formData.category === 'driver' ? [{
                label: 'NGS 샤프트',
                path: getNgsCommonFolderPath(), // ngs-common/composition
                icon: '🔧',
              }] : []),
              // ✅ MUZIIK 제품인 경우 MUZIIK 공통 폴더 추가
              ...(isMuziikProduct(formData.slug) ? [{
                label: 'MUZIIK 샤프트',
                path: getMuziikCommonFolderPath(), // muziik-common/composition
                icon: '🎯',
              }] : []),
            ]}
            onFolderChange={(newPath) => {
              console.log('📁 폴더 변경:', newPath);
            }}
          />
        </div>
      </div>
    </>
  );
}

