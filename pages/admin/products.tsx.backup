import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import AdminNav from '../../components/admin/AdminNav';
import { getProductImageUrl } from '../../lib/product-image-url';
import FolderImagePicker from '../../components/admin/FolderImagePicker';

type Product = {
  id: number;
  name: string;
  sku?: string | null;
  category?: string | null;
  color?: string | null;
  size?: string | null;
  legacy_name?: string | null;
  is_gift: boolean;
  is_sellable: boolean;
  is_active: boolean;
  normal_price?: number | null;
  sale_price?: number | null;
  is_component?: boolean;
  condition?: string | null;
  // 드라이버 제품 필드
  product_type?: 'goods' | 'driver' | 'component' | null;
  slug?: string | null;
  subtitle?: string | null;
  badge_left?: string | null;
  badge_right?: string | null;
  badge_left_color?: string | null;
  badge_right_color?: string | null;
  border_color?: string | null;
  features?: string[] | null;
  specifications?: Record<string, any> | null;
  display_order?: number | null;
  // 이미지 타입별 배열
  detail_images?: string[] | null;
  composition_images?: string[] | null;
  gallery_images?: string[] | null;
  // 제품 합성 관리 데이터
  product_composition?: {
    id: string;
    name: string;
    slug: string;
  }[] | null;
};

export default function ProductsAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const [showGiftOnly, setShowGiftOnly] = useState(false);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [isSellableFilter, setIsSellableFilter] = useState<'all' | 'sellable' | 'not_sellable'>(
    'all',
  );
  const [productTypeFilter, setProductTypeFilter] =
    useState<'all' | 'finished' | 'component'>('all');
  const [productCategoryFilter, setProductCategoryFilter] =
    useState<'all' | 'driver' | 'goods'>('all');
  const [conditionFilter, setConditionFilter] =
    useState<'all' | 'new' | 'used' | 'scrap'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'sku' | 'category' | 'normal_price' | 'sale_price'>(
    'name',
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkNormalPrice, setBulkNormalPrice] = useState<string>('');
  const [bulkSalePrice, setBulkSalePrice] = useState<string>('');
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [inventoryProduct, setInventoryProduct] = useState<Product | null>(null);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryQuantity, setInventoryQuantity] = useState<number>(0);
  const [inventoryHistory, setInventoryHistory] = useState<any[]>([]);
  const [inventoryTxType, setInventoryTxType] =
    useState<'inbound' | 'outbound' | 'scrap' | 'adjustment'>('inbound');
  const [inventoryTxQty, setInventoryTxQty] = useState<number>(1);
  const [inventoryTxNote, setInventoryTxNote] = useState<string>('');
  const [inventorySupplierId, setInventorySupplierId] = useState<number | ''>('');
  const [inventoryTxDate, setInventoryTxDate] = useState<string>('');
  const [inventorySuppliers, setInventorySuppliers] = useState<{ id: number; name: string }[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [detailImages, setDetailImages] = useState<string[]>([]);
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const [galleryPickerMode, setGalleryPickerMode] = useState<'detail' | null>(null);
  const [mainImageUrl, setMainImageUrl] = useState<string>(''); // 대표 이미지
  
  // 합성 관리가 불필요한 카테고리
  const COMPOSITION_EXCLUDED_CATEGORIES = ['component', 'weight_pack'];
  
  // 합성 관리 필요 여부 확인
  const needsComposition = (product: Product): boolean => {
    if (product.category && COMPOSITION_EXCLUDED_CATEGORIES.includes(product.category)) {
      return false;
    }
    return true;
  };
  
  // 합성 관리 버튼 클릭 핸들러
  const handleOpenComposition = (product: Product) => {
    const params = new URLSearchParams();
    
    if (product.slug) {
      params.set('slug', product.slug);
    } else if (product.id) {
      params.set('productId', product.id.toString());
    }
    
    if (product.category) {
      params.set('category', product.category);
    }
    
    router.push(`/admin/product-composition?${params.toString()}`);
  };
  const [createComposition, setCreateComposition] = useState(true);
  const [formState, setFormState] = useState<Partial<Product>>({
    name: '',
    sku: '',
    category: '',
    color: '',
    size: '',
    legacy_name: '',
    is_gift: true,
    is_sellable: false,
    is_active: true,
    normal_price: undefined,
    sale_price: undefined,
    subtitle: '',
    badge_left: null,
    badge_right: null,
    badge_left_color: null,
    badge_right_color: null,
  });

  useEffect(() => {
    if (status === 'loading') return;
    // 세션 체크 (프로덕션에서 활성화)
    // 프로덕션에서는 디버깅 모드 비활성화 (환경 변수로만 제어)
    const DEBUG_MODE = false;
    
    if (!DEBUG_MODE && !session) {
      router.push('/admin/login');
      return;
    }
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    session,
    status,
    // 필터 변경 시에만 리로딩 (불필요한 리로딩 방지)
    showGiftOnly,
    includeInactive,
    categoryFilter,
    isSellableFilter,
    productTypeFilter,
    productCategoryFilter,
    conditionFilter,
    sortBy,
    sortOrder,
    router.query.showCompositionOnly, // 합성 제품 필터 추가
  ]);

  // 초기 로드 시 카테고리 목록 가져오기
  useEffect(() => {
    if (status === 'authenticated' || status === 'unauthenticated') {
      loadAvailableCategories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status  ]);

  const loadAvailableCategories = async () => {
    try {
      const res = await fetch('/api/admin/products?distinctCategories=true');
      const json = await res.json();
      if (json.success && json.categories) {
        // null 제외하고 정렬
        const categories = json.categories
          .filter((cat: string | null) => cat && cat.trim() !== '')
          .sort();
        setAvailableCategories(categories);
      }
    } catch (error) {
      console.error('카테고리 목록 조회 오류:', error);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('q', search.trim());
      if (showGiftOnly) params.set('isGift', 'true');
      if (includeInactive) params.set('includeInactive', 'true');
      if (categoryFilter) params.set('category', categoryFilter);
      if (isSellableFilter === 'sellable') params.set('isSellable', 'true');
      if (isSellableFilter === 'not_sellable') params.set('isSellable', 'false');
      if (productTypeFilter === 'finished') params.set('isComponent', 'false');
      if (productTypeFilter === 'component') params.set('isComponent', 'true');
      if (productCategoryFilter === 'driver') params.set('productType', 'driver');
      if (productCategoryFilter === 'goods') params.set('productType', 'goods');
      if (conditionFilter !== 'all') params.set('condition', conditionFilter);
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);

      const res = await fetch(`/api/admin/products?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        let filteredProducts = json.products || [];
        
        // 제품 합성 관리 데이터가 실제로 있는 제품만 필터링
        // URL 파라미터에 showCompositionOnly=true가 있으면 필터링
        if (router.query.showCompositionOnly === 'true') {
          filteredProducts = filteredProducts.filter((p: Product) => {
            // product_composition 테이블에 실제 데이터가 있는 경우만
            return p.product_composition && 
              (Array.isArray(p.product_composition) 
                ? p.product_composition.length > 0 
                : p.product_composition);
          });
        }
        
        setProducts(filteredProducts);
        setSelectedIds([]);
      } else {
        alert(json.message || '상품 목록 조회에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('상품 목록 조회 오류:', error);
      alert(error.message || '상품 목록 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const openInventoryModal = async (product: Product) => {
    setInventoryProduct(product);
    setInventoryModalOpen(true);
    // 모달 열 때 폼 초기화
    setInventoryTxDate('');
    setEditingTransaction(null);
    setInventoryLoading(true);
    setInventoryQuantity(0);
    setInventoryHistory([]);
    try {
      // 재고 정보와 공급업체 목록을 동시에 로드
      const [inventoryRes, suppliersRes] = await Promise.all([
        fetch(`/api/admin/inventory?productId=${product.id}`),
        fetch('/api/admin/suppliers'),
      ]);
      
      const inventoryJson = await inventoryRes.json();
      if (inventoryRes.ok && inventoryJson.success) {
        setInventoryQuantity(inventoryJson.currentQuantity ?? 0);
        setInventoryHistory(inventoryJson.history ?? []);
      } else {
        alert(inventoryJson.message || '재고 정보를 불러오지 못했습니다.');
      }

      const suppliersJson = await suppliersRes.json();
      if (suppliersRes.ok && suppliersJson.success) {
        setInventorySuppliers(suppliersJson.suppliers || []);
      }
    } catch (error: any) {
      console.error('재고 정보 조회 오류:', error);
      alert(error.message || '재고 정보 조회 중 오류가 발생했습니다.');
    } finally {
      setInventoryLoading(false);
    }
  };

  const addInventoryTransaction = async () => {
    if (!inventoryProduct) return;
    if (!inventoryTxQty || inventoryTxQty <= 0) {
      alert('수량을 1 이상으로 입력하세요.');
      return;
    }
    try {
      const qty =
        inventoryTxType === 'inbound'
          ? inventoryTxQty
          : -Math.abs(inventoryTxQty);
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: inventoryProduct.id,
          tx_type: inventoryTxType,
          quantity: qty,
          tx_date: inventoryTxDate || null,
          note: inventoryTxNote || null,
          supplier_id: inventorySupplierId || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.message || '재고 이력 추가에 실패했습니다.');
        return;
      }
      // 성공 시 다시 조회
      await openInventoryModal(inventoryProduct);
      setInventoryTxQty(1);
      setInventoryTxNote('');
      setInventorySupplierId('');
      setInventoryTxDate('');
    } catch (error: any) {
      console.error('재고 이력 추가 오류:', error);
      alert(error.message || '재고 이력 추가 중 오류가 발생했습니다.');
    }
  };

  const handleEditTransaction = (tx: any) => {
    setEditingTransaction(tx);
    setInventoryTxType(tx.tx_type);
    setInventoryTxQty(Math.abs(tx.quantity));
    setInventoryTxNote(tx.note || '');
    setInventorySupplierId(tx.supplier_id || '');
    // 날짜 추가 (YYYY-MM-DD 형식으로 변환)
    setInventoryTxDate(tx.tx_date ? new Date(tx.tx_date).toISOString().split('T')[0] : '');
  };

  const handleUpdateTransaction = async () => {
    if (!editingTransaction || !inventoryProduct) return;
    if (!inventoryTxQty || inventoryTxQty <= 0) {
      alert('수량을 1 이상으로 입력하세요.');
      return;
    }
    try {
      const qty =
        inventoryTxType === 'inbound'
          ? inventoryTxQty
          : -Math.abs(inventoryTxQty);
      const res = await fetch('/api/admin/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTransaction.id,
          tx_type: inventoryTxType,
          quantity: qty,
          tx_date: inventoryTxDate || null,
          note: inventoryTxNote || null,
          supplier_id: inventorySupplierId || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.message || '재고 이력 수정에 실패했습니다.');
        return;
      }
      alert('재고 이력이 수정되었습니다.');
      setEditingTransaction(null);
      setInventoryTxQty(1);
      setInventoryTxNote('');
      setInventorySupplierId('');
      setInventoryTxDate('');
      await openInventoryModal(inventoryProduct);
    } catch (error: any) {
      console.error('재고 이력 수정 오류:', error);
      alert(error.message || '재고 이력 수정 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    if (!confirm('이 재고 이력을 삭제하시겠습니까?')) return;
    if (!inventoryProduct) return;

    try {
      const res = await fetch(`/api/admin/inventory?id=${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.message || '재고 이력 삭제에 실패했습니다.');
        return;
      }
      alert('재고 이력이 삭제되었습니다.');
      await openInventoryModal(inventoryProduct);
    } catch (error: any) {
      console.error('재고 이력 삭제 오류:', error);
      alert(error.message || '재고 이력 삭제 중 오류가 발생했습니다.');
    }
  };

  // 모달 닫기 함수 (formState 초기화 포함)
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormState({
      name: '',
      sku: '',
      category: '',
      color: '',
      size: '',
      legacy_name: '',
      is_gift: true,
      is_sellable: false,
      is_active: true,
      normal_price: undefined,
      sale_price: undefined,
    });
    setMainImageUrl('');
    setDetailImages([]);
    setCreateComposition(true);
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormState({
      name: '',
      sku: '', // ✅ SKU는 빈 문자열로 초기화
      category: '',
      color: '',
      size: '',
      legacy_name: '',
      is_gift: true,
      is_sellable: false,
      is_active: true,
      normal_price: undefined,
      sale_price: undefined,
    });
    setMainImageUrl(''); // ✅ 메인 이미지도 초기화
    setDetailImages([]);
    setCreateComposition(true); // ✅ 합성 데이터 생성 옵션 초기화
    setShowModal(true);
  };

  // Slug를 SKU로 변환하는 함수
  const slugToSku = (slug: string): string => {
    if (!slug) return '';
    return slug.toUpperCase().replace(/-/g, '_');
  };

  // 제품명에서 SKU를 자동 생성하는 함수
  const generateSkuFromName = (name: string): string => {
    if (!name) return '';
    // 영문과 숫자만 유지하고, 공백과 특수문자를 언더스코어로 변환
    return name
      .replace(/[^a-zA-Z0-9\s]/g, '_') // 특수문자를 언더스코어로
      .replace(/\s+/g, '_') // 공백을 언더스코어로
      .replace(/_+/g, '_') // 연속된 언더스코어를 하나로
      .replace(/^_|_$/g, '') // 앞뒤 언더스코어 제거
      .toUpperCase(); // 대문자로 변환
  };

  // 이미지 경로에서 slug 추출
  const extractSlugFromImagePath = (imagePath: string): string | null => {
    if (!imagePath) return null;
    
    // originals/goods/{slug}/detail 또는 originals/products/{slug}/detail 패턴
    // originals/goods/{slug}/gallery 또는 originals/products/{slug}/gallery 패턴
    // originals/goods/{slug}/composition 또는 originals/products/{slug}/composition 패턴
    const match = imagePath.match(/originals\/(?:goods|products)\/([^\/]+)\//);
    if (match) {
      return match[1];
    }
    return null;
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    // 합성 데이터가 없으면 생성 옵션 활성화
    const hasComposition = product.product_composition && 
      (Array.isArray(product.product_composition) 
        ? product.product_composition.length > 0 
        : product.product_composition);
    setCreateComposition(!hasComposition); // 합성 데이터가 없으면 true
    
    // 이미지에서 slug 추출하여 SKU 자동 설정
    let autoSku = product.sku || '';
    if (!autoSku) {
      // detail_images에서 추출 시도
      const images = Array.isArray(product.detail_images) ? product.detail_images : [];
      for (const img of images) {
        const slug = extractSlugFromImagePath(img);
        if (slug) {
          autoSku = slugToSku(slug);
          break;
        }
      }
      
      // gallery_images에서 추출 시도 (detail_images에서 못 찾은 경우)
      if (!autoSku) {
        const galleryImages = Array.isArray(product.gallery_images) ? product.gallery_images : [];
        for (const img of galleryImages) {
          const slug = extractSlugFromImagePath(img);
          if (slug) {
            autoSku = slugToSku(slug);
            break;
          }
        }
      }
      
      // composition_images에서 추출 시도 (위에서 못 찾은 경우)
      if (!autoSku) {
        const compositionImages = Array.isArray(product.composition_images) ? product.composition_images : [];
        for (const img of compositionImages) {
          const slug = extractSlugFromImagePath(img);
          if (slug) {
            autoSku = slugToSku(slug);
            break;
          }
        }
      }
      
      // slug에서 추출 시도 (이미지가 없는 경우)
      if (!autoSku && product.slug) {
        autoSku = slugToSku(product.slug);
      }
    }
    
    // 카테고리 통일: 모자 관련 카테고리를 'cap'으로 통일
    let unifiedCategory = product.category || '';
    if (product.product_type === 'driver') {
      unifiedCategory = 'driver';
    } else if (['bucket_hat', 'hat', 'cap', 'bucket-hat', 'bucket hat'].includes(unifiedCategory)) {
      unifiedCategory = 'cap';
    }
    
    setFormState({
      ...product,
      sku: autoSku, // 자동 추출된 SKU 사용
      category: unifiedCategory, // 통일된 카테고리 사용
    });
    
    // 이미지 초기화: detail_images를 배열로 변환
    const images = Array.isArray(product.detail_images) ? product.detail_images : [];
    // 첫 번째 이미지를 대표 이미지로 설정
    if (images.length > 0) {
      setMainImageUrl(images[0]);
      setDetailImages(images.slice(1));
    } else {
      setMainImageUrl('');
      setDetailImages([]);
    }
    setShowModal(true);
  };

  const handleClone = (product: Product) => {
    const { id, ...rest } = product;
    setEditingProduct(null);
    setFormState({
      ...rest,
      name: `${product.name} (복제)`,
      sku: '',
      is_active: true,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
      if (!formState.name) {
      alert('제품명을 입력해주세요.');
      return;
    }

    try {
      const isEdit = !!editingProduct;
      const url = '/api/admin/products';
      
      // 이미지 배열 구성: 대표 이미지 + 나머지 이미지
      const allImages = getAllImages();
      const finalDetailImages = allImages.length > 0 ? allImages : [];
      const method = isEdit ? 'PUT' : 'POST';

      const body: any = {
        ...(isEdit ? { id: editingProduct!.id } : {}),
        name: formState.name,
        sku: formState.sku || null,
        slug: formState.slug || null,
        category: formState.category || null,
        color: formState.color || null,
        size: formState.size || null,
        legacy_name: formState.legacy_name || null,
        is_gift: !!formState.is_gift,
        is_sellable: !!formState.is_sellable,
        is_active: formState.is_active !== false,
        normal_price:
          formState.normal_price === undefined || formState.normal_price === null
            ? null
            : formState.normal_price,
        sale_price:
          formState.sale_price === undefined || formState.sale_price === null
            ? null
            : formState.sale_price,
        detail_images: finalDetailImages,
        // 합성 데이터 생성 옵션 (신규 제품 또는 합성 데이터가 없는 제품)
        ...(isEdit 
          ? (createComposition && !editingProduct?.product_composition ? { createComposition: true } : {})
          : { createComposition }),
      };

      // product_type 추가
      if (formState.product_type) {
        body.product_type = formState.product_type;
      }

      // 드라이버 제품 전용 필드 추가
      if (formState.product_type === 'driver') {
        body.subtitle = formState.subtitle || null;
        body.badge_left = formState.badge_left || null;
        body.badge_right = formState.badge_right || null;
        body.badge_left_color = formState.badge_left_color || null;
        body.badge_right_color = formState.badge_right_color || null;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) {
        alert(json.message || '저장에 실패했습니다.');
        return;
      }
      
      // 합성 데이터 생성 실패 시 경고 표시
      if (json.compositionError) {
        alert('제품이 생성되었습니다.\n\n단, 제품 합성 관리 데이터 생성에 실패했습니다:\n' + json.compositionError);
      } else if (json.message && json.message.includes('slug가 없어')) {
        alert(json.message);
      } else {
        alert(isEdit ? '제품이 수정되었습니다.' : '제품이 추가되었습니다.');
      }
      
      handleCloseModal();
      await loadProducts();
    } catch (error: any) {
      console.error('상품 저장 오류:', error);
      alert(error.message || '상품 저장 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`정말 "${product.name}" 상품을 비활성화하시겠습니까?`)) return;
    try {
      const res = await fetch(`/api/admin/products?id=${product.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!json.success) {
        alert(json.message || '비활성화에 실패했습니다.');
        return;
      }
      alert('제품이 비활성화되었습니다.');
      await loadProducts();
    } catch (error: any) {
      console.error('상품 비활성화 오류:', error);
      alert(error.message || '상품 비활성화 중 오류가 발생했습니다.');
    }
  };

  const handleHardDelete = async (product: Product) => {
    if (!confirm(`정말 "${product.name}" 상품을 완전히 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다.\n재고 이력도 함께 삭제됩니다.`)) return;
    try {
      const res = await fetch(`/api/admin/products?id=${product.id}`, {
        method: 'DELETE',
        headers: {
          'X-Hard-Delete': 'true'
        },
      });
      const json = await res.json();
      if (!json.success) {
        alert(json.message || '삭제에 실패했습니다.');
        return;
      }
      alert('제품이 완전히 삭제되었습니다.');
      await loadProducts();
    } catch (error: any) {
      console.error('상품 삭제 오류:', error);
      alert(error.message || '상품 삭제 중 오류가 발생했습니다.');
    }
  };

  // 상세페이지 이미지 업로드
  // 통합 이미지 관리: 모든 이미지를 하나의 배열로 관리
  const getAllImages = (): string[] => {
    const images: string[] = [];
    if (mainImageUrl && mainImageUrl.trim() !== '') {
      images.push(mainImageUrl);
    }
    // detailImages에서 mainImageUrl 제외
    const otherImages = detailImages.filter(img => img && img.trim() !== '' && img !== mainImageUrl);
    images.push(...otherImages);
    return images;
  };

  // 대표 이미지 설정
  const handleSetMainImage = (imageUrl: string) => {
    setMainImageUrl(imageUrl);
  };

  // 이미지 삭제 (Storage에서도 삭제)
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

      const result = await response.json();
      
      // 이미 삭제된 파일인 경우도 성공으로 처리
      if (!response.ok && !result.alreadyDeleted && !result.skipped) {
        throw new Error(result.error || '이미지 삭제에 실패했습니다.');
      }

      // 폼 데이터에서 제거 (이미 삭제된 파일이어도 UI에서 제거)
      const allImages = getAllImages();
      const remainingImages = allImages.filter(img => img !== imageUrl);
      
      if (remainingImages.length > 0) {
        // 첫 번째 이미지를 대표 이미지로 설정
        setMainImageUrl(remainingImages[0]);
        setDetailImages(remainingImages.slice(1));
      } else {
        // 모든 이미지가 삭제된 경우
        setMainImageUrl('');
        setDetailImages([]);
      }

      // 메시지 표시
      if (result.alreadyDeleted || result.skipped) {
        alert('이미지가 이미 삭제되었거나 경로를 찾을 수 없습니다. 목록에서 제거했습니다.');
      } else {
        alert('이미지가 삭제되었습니다.');
      }
    } catch (error: any) {
      console.error('이미지 삭제 오류:', error);
      alert(`이미지 삭제 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  // URL에서 파일명 추출
  const getFileNameFromUrl = (url: string): string => {
    if (!url) return '';
    
    try {
      // 절대 URL인 경우
      if (url.startsWith('http://') || url.startsWith('https://')) {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        const fileName = pathParts[pathParts.length - 1];
        return fileName.split('?')[0] || fileName;
      }
      
      // 상대 경로인 경우
      const pathParts = url.split('/');
      const fileName = pathParts[pathParts.length - 1];
      return fileName.split('?')[0] || fileName;
    } catch (error) {
      const parts = url.split('/');
      return parts[parts.length - 1] || url;
    }
  };

  const handleDetailImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ✅ slug 또는 SKU가 없으면 경고
    if (!formState.slug && !formState.sku) {
      alert('제품 Slug 또는 SKU를 먼저 입력해주세요.');
      return;
    }

    setUploadingImage(true);
    try {
      // slug 정규화: SKU를 slug 형식으로 변환 (대문자 폴더명 방지)
      let productSlugForUpload = formState.slug;
      if (!productSlugForUpload && formState.sku) {
        productSlugForUpload = formState.sku.toLowerCase().replace(/_+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      }
      
      // ✅ productSlugForUpload가 여전히 없으면 에러
      if (!productSlugForUpload || productSlugForUpload.trim() === '') {
        alert('제품 Slug를 생성할 수 없습니다. SKU를 확인해주세요.');
        setUploadingImage(false);
        return;
      }
      
      const categoryForUpload = formState.category === 'hat' || formState.category === 'bucket_hat'
        ? 'cap' // hat, bucket_hat을 cap으로 통일
        : (formState.category || (formState.product_type === 'driver' ? 'driver' : 'cap'));

      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('productSlug', productSlugForUpload); // ✅ 빈 문자열 체크 후 전달
      uploadFormData.append('category', categoryForUpload);
      uploadFormData.append('imageType', 'detail');

      console.log('📤 이미지 업로드 요청:', {
        productSlug: productSlugForUpload,
        category: categoryForUpload,
        fileName: file.name,
      });

      const response = await fetch('/api/admin/upload-product-image', {
        method: 'POST',
        body: uploadFormData,
      });

      if (response.ok) {
        const data = await response.json();
        const imageUrl = data.url || data.storageUrl;
        const allImages = getAllImages();
        
        // 첫 번째 이미지면 대표로, 아니면 참조로 추가
        if (allImages.length === 0) {
          setMainImageUrl(imageUrl);
        } else {
          setDetailImages([...detailImages, imageUrl]);
        }
        alert('이미지가 추가되었습니다.');
      } else {
        const errorData = await response.json().catch(() => ({ error: '알 수 없는 오류' }));
        console.error('❌ 이미지 업로드 오류:', errorData);
        alert(`오류: ${errorData.error || errorData.details || '이미지 업로드에 실패했습니다.'}`);
      }
    } catch (error: any) {
      console.error('❌ 이미지 업로드 예외:', error);
      alert(`오류: ${error.message || '이미지 업로드 중 오류가 발생했습니다.'}`);
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // 갤러리에서 이미지 선택
  const getDetailFolderPath = (): string | undefined => {
    if (!formState.slug && !formState.sku) return undefined;
    
    // slug 정규화: SKU를 slug 형식으로 변환
    let slug = formState.slug;
    if (!slug && formState.sku) {
      slug = formState.sku.toLowerCase().replace(/_+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    }
    if (!slug) return undefined;
    
    const category = formState.category === 'hat' || formState.category === 'bucket_hat'
      ? 'cap'
      : (formState.category || (formState.product_type === 'driver' ? 'driver' : 'cap'));
    
    if (formState.product_type === 'driver' || category === 'driver') {
      return `originals/products/${slug}/detail`;
    }
    
    return `originals/goods/${slug}/detail`;
  };

  const handleOpenGallery = () => {
    if (!formState.slug && !formState.sku) {
      alert('제품 정보(Slug, SKU)를 먼저 입력해주세요.');
      return;
    }
    setGalleryPickerMode('detail');
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
      setMainImageUrl(imageUrl);
    } else {
      setDetailImages([...detailImages, imageUrl]);
    }
    
    setShowGalleryPicker(false);
    setGalleryPickerMode(null);
  };

  // 상세페이지 이미지 삭제
  // 상세페이지 이미지 순서 변경 (기존 함수 유지 - 호환성)
  const handleMoveDetailImage = (index: number, direction: 'up' | 'down') => {
    const allImages = getAllImages();
    const newImages = [...allImages];
    if (direction === 'up' && index > 0) {
      [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    } else if (direction === 'down' && index < newImages.length - 1) {
      [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    }
    // 첫 번째 이미지를 대표로 설정
    if (newImages.length > 0) {
      setMainImageUrl(newImages[0]);
      setDetailImages(newImages.slice(1));
    }
  };

  const toggleSort = (column: 'name' | 'sku' | 'category' | 'normal_price' | 'sale_price') => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p.id));
    }
  };

  const handleBulkUpdatePrices = async () => {
    if (selectedIds.length === 0) {
      alert('먼저 일괄 수정할 상품을 선택해주세요.');
      return;
    }
    if (!bulkNormalPrice && !bulkSalePrice) {
      alert('정상가 또는 할인가 중 하나 이상을 입력해야 합니다.');
      return;
    }
    if (
      !confirm(
        `선택된 ${selectedIds.length}개 상품의 가격을 일괄 수정합니다.\n\n정상가: ${
          bulkNormalPrice || '변경 안 함'
        }\n할인가: ${bulkSalePrice || '변경 안 함'}\n\n계속하시겠습니까?`,
      )
    ) {
      return;
    }

    setBulkUpdating(true);
    try {
      const body: any = {
        ids: selectedIds,
        update: {},
      };
      if (bulkNormalPrice) {
        body.update.normal_price = Number(bulkNormalPrice);
      }
      if (bulkSalePrice) {
        body.update.sale_price = Number(bulkSalePrice);
      }

      const res = await fetch('/api/admin/products/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) {
        alert(json.message || '일괄 수정에 실패했습니다.');
        setBulkUpdating(false);
        return;
      }
      alert('선택한 상품의 가격이 일괄 수정되었습니다.');
      setBulkNormalPrice('');
      setBulkSalePrice('');
      await loadProducts();
    } catch (error: any) {
      console.error('일괄 가격 수정 오류:', error);
      alert(error.message || '일괄 가격 수정 중 오류가 발생했습니다.');
    } finally {
      setBulkUpdating(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  // 세션 체크 (프로덕션에서 활성화)
  // DEBUG_MODE는 환경 변수로만 제어 (SSR 호환성)
  // 프로덕션에서는 디버깅 모드 비활성화
  const DEBUG_MODE = false;
  
  if (!DEBUG_MODE && !session) {
    return null;
  }

  return (
    <>
      <Head>
        <title>제품 관리 - MASGOLF</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">제품 관리</h1>
              <p className="text-sm text-gray-600 mt-1">
                드라이버 제품과 굿즈/사은품을 통합 관리합니다.
              </p>
            </div>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              ➕ 상품 추가
            </button>
          </div>

          <div className="mb-4 flex flex-wrap gap-3 items-center">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onBlur={loadProducts}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  loadProducts();
                }
              }}
              placeholder="상품명 / SKU / 기존명 검색"
              className="px-3 py-2 border rounded-md text-sm min-w-[200px]"
            />
            <button
              onClick={() => {
                const newQuery = { ...router.query };
                if (router.query.showCompositionOnly === 'true') {
                  delete newQuery.showCompositionOnly;
                } else {
                  newQuery.showCompositionOnly = 'true';
                }
                router.push({
                  pathname: router.pathname,
                  query: newQuery
                }, undefined, { shallow: true });
                setTimeout(() => loadProducts(), 100);
              }}
              className={`px-3 py-2 border rounded-md text-sm ${
                router.query.showCompositionOnly === 'true'
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              합성 제품만 ({products.filter((p: Product) => 
                p.product_composition && 
                (Array.isArray(p.product_composition) ? p.product_composition.length > 0 : p.product_composition)
              ).length}개)
            </button>
            <label className="flex items-center gap-1 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={showGiftOnly}
                onChange={() => setShowGiftOnly(!showGiftOnly)}
              />
              사은품만
            </label>
            <select
              value={productCategoryFilter}
              onChange={(e) => setProductCategoryFilter(e.target.value as 'all' | 'driver' | 'goods')}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="all">전체 제품</option>
              <option value="driver">드라이버</option>
              <option value="goods">굿즈/사은품</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="">전체 카테고리</option>
              {availableCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <select
              value={productTypeFilter}
              onChange={(e) =>
                setProductTypeFilter(e.target.value as 'all' | 'finished' | 'component')
              }
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="all">완제품/부품 전체</option>
              <option value="finished">완제품만</option>
              <option value="component">부품만</option>
            </select>
            <select
              value={conditionFilter}
              onChange={(e) =>
                setConditionFilter(e.target.value as 'all' | 'new' | 'used' | 'scrap')
              }
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="all">상태 전체</option>
              <option value="new">신품</option>
              <option value="used">중고</option>
              <option value="scrap">폐기</option>
            </select>
            <select
              value={isSellableFilter}
              onChange={(e) =>
                setIsSellableFilter(e.target.value as 'all' | 'sellable' | 'not_sellable')
              }
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="all">판매 여부 전체</option>
              <option value="sellable">판매 가능만</option>
              <option value="not_sellable">판매용 아님만</option>
            </select>
            <label className="flex items-center gap-1 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={() => setIncludeInactive(!includeInactive)}
              />
              비활성 포함
            </label>
            <button
              onClick={loadProducts}
              className="px-3 py-2 border rounded-md text-sm hover:bg-gray-50"
            >
              새로고침
            </button>
          </div>

          {selectedIds.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-3 text-sm bg-yellow-50 border border-yellow-200 rounded-md px-3 py-2">
              <span className="font-medium text-yellow-800">
                {selectedIds.length}개 상품 선택됨
              </span>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1">
                  <span className="text-gray-700">정상가 일괄:</span>
                  <input
                    type="number"
                    value={bulkNormalPrice}
                    onChange={(e) => setBulkNormalPrice(e.target.value)}
                    className="w-28 px-2 py-1 border rounded-md text-xs"
                  />
                </label>
                <label className="flex items-center gap-1">
                  <span className="text-gray-700">할인가 일괄:</span>
                  <input
                    type="number"
                    value={bulkSalePrice}
                    onChange={(e) => setBulkSalePrice(e.target.value)}
                    className="w-28 px-2 py-1 border rounded-md text-xs"
                  />
                </label>
                <button
                  onClick={handleBulkUpdatePrices}
                  disabled={bulkUpdating}
                  className="px-3 py-1 bg-yellow-600 text-white rounded-md text-xs hover:bg-yellow-700 disabled:opacity-50"
                >
                  {bulkUpdating ? '적용 중...' : '가격 일괄 적용'}
                </button>
              </div>
            </div>
          )}

          <div className="bg-white border rounded-lg overflow-hidden">
            {loading ? (
              <div className="py-10 text-center text-gray-500 text-sm">로딩 중...</div>
            ) : products.length === 0 ? (
              <div className="py-10 text-center text-gray-500 text-sm">
                등록된 상품이 없습니다.
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === products.length && products.length > 0}
                        onChange={handleToggleSelectAll}
                      />
                    </th>
                    <th
                      className="p-2 text-left cursor-pointer select-none"
                      onClick={() => toggleSort('name')}
                    >
                      이름 {sortBy === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>
                    <th
                      className="p-2 text-left cursor-pointer select-none"
                      onClick={() => toggleSort('sku')}
                    >
                      SKU {sortBy === 'sku' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>
                    <th
                      className="p-2 text-left cursor-pointer select-none"
                      onClick={() => toggleSort('category')}
                    >
                      카테고리 {sortBy === 'category' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="p-2 text-left">색상/사이즈</th>
                    <th
                      className="p-2 text-left cursor-pointer select-none"
                      onClick={() => toggleSort('normal_price')}
                    >
                      정상가/할인가{' '}
                      {sortBy === 'normal_price' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="p-2 text-left">플래그</th>
                    <th className="p-2 text-left">상태</th>
                    <th className="p-2 text-left">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(p.id)}
                          onChange={() => handleToggleSelect(p.id)}
                        />
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-gray-900">{p.name}</div>
                          {/* 합성 상태 배지 */}
                          {p.product_composition && 
                           (Array.isArray(p.product_composition) 
                             ? p.product_composition.length > 0 
                             : p.product_composition) ? (
                            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded font-medium">
                              합성
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded font-medium">
                              미합성
                            </span>
                          )}
                        </div>
                        {/* 제품 합성 관리 제품명 표시 - 드라이버 제품만 표시 */}
                        {p.product_type === 'driver' && p.product_composition && 
                          (Array.isArray(p.product_composition) 
                            ? p.product_composition.length > 0 
                            : p.product_composition) && (
                            (Array.isArray(p.product_composition) 
                              ? p.product_composition 
                              : [p.product_composition])
                              .filter((comp: any) => comp && comp.name !== p.name)
                              .map((comp: any) => (
                                <div key={comp.id} className="text-xs text-gray-500 mt-0.5">
                                  합성: {comp.name}
                                </div>
                              ))
                          )
                        }
                        {p.product_type === 'driver' && p.subtitle && (
                          <div className="text-xs text-gray-500">{p.subtitle}</div>
                        )}
                        {p.product_type === 'driver' && (p.badge_left || p.badge_right) && (
                          <div className="flex gap-1 mt-1">
                            {p.badge_left && (
                              <span className={`text-xs px-1.5 py-0.5 rounded ${
                                p.badge_left_color === 'red' ? 'bg-red-100 text-red-800' :
                                p.badge_left_color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                p.badge_left_color === 'purple' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {p.badge_left}
                              </span>
                            )}
                            {p.badge_right && (
                              <span className={`text-xs px-1.5 py-0.5 rounded ${
                                p.badge_right_color === 'green' ? 'bg-green-100 text-green-800' :
                                p.badge_right_color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {p.badge_right}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-2">
                        <div className="text-sm">
                          <div className="font-medium">
                            {p.sku || (p.slug ? p.slug.toUpperCase().replace(/-/g, '_') : '-')}
                          </div>
                          {/* slug 표시: SKU가 없거나 SKU와 slug가 다를 때만 표시 */}
                          {(() => {
                            if (!p.slug) return null;
                            // SKU가 없으면 slug 표시
                            if (!p.sku) {
                              return (
                                <div className="text-xs text-gray-400 mt-0.5">
                                  slug: {p.slug}
                                </div>
                              );
                            }
                            // SKU를 slug 형식으로 변환 (이중 언더스코어/하이픈 정규화)
                            const skuAsSlug = p.sku
                              .toLowerCase()
                              .replace(/_+/g, '-') // 연속된 언더스코어를 단일 하이픈으로
                              .replace(/-+/g, '-') // 연속된 하이픈을 단일 하이픈으로
                              .replace(/^-|-$/g, ''); // 앞뒤 하이픈 제거
                            const normalizedSlug = p.slug
                              .replace(/-+/g, '-') // 연속된 하이픈을 단일 하이픈으로
                              .replace(/^-|-$/g, ''); // 앞뒤 하이픈 제거
                            // SKU와 slug가 같으면 표시하지 않음
                            if (normalizedSlug === skuAsSlug) return null;
                            // 다를 때만 표시
                            return (
                              <div className="text-xs text-gray-400 mt-0.5">
                                slug: {p.slug}
                              </div>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="p-2">
                        {p.product_type === 'driver' ? 'driver' : (p.category || '-')}
                      </td>
                      <td className="p-2">
                        {(p.color || '-')}/{p.size || '-'}
                      </td>
                      <td className="p-2">
                        {p.normal_price != null ? p.normal_price.toLocaleString() : '-'}
                        {p.sale_price != null && (
                          <span className="text-xs text-red-600 ml-1">
                            ({p.sale_price.toLocaleString()})
                          </span>
                        )}
                      </td>
                      <td className="p-2">
                        <div className="flex flex-col gap-1 text-xs">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded ${
                              p.is_gift
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {p.is_gift ? '사은품' : '일반'}
                          </span>
                          <span
                            className={`inline-flex px-2 py-0.5 rounded ${
                              p.is_sellable
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {p.is_sellable ? '판매 가능' : '판매용 아님'}
                          </span>
                        </div>
                      </td>
                      <td className="p-2">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs ${
                            p.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {p.is_active ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          <button
                            onClick={() => openInventoryModal(p)}
                            className="px-2 py-1 text-xs bg-amber-500 text-white rounded hover:bg-amber-600"
                          >
                            재고
                          </button>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleClone(p)}
                            className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                          >
                            복제
                          </button>
                          {needsComposition(p) ? (
                            <button
                              onClick={() => handleOpenComposition(p)}
                              className="px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
                              title="제품 합성 관리로 이동"
                            >
                              합성관리
                            </button>
                          ) : (
                            <button
                              disabled
                              className="px-2 py-1 text-xs bg-gray-300 text-gray-500 rounded cursor-not-allowed"
                              title="이 카테고리는 합성 관리가 필요하지 않습니다"
                            >
                              합성관리
                            </button>
                          )}
                          <select
                            onChange={(e) => {
                              if (e.target.value === 'deactivate') {
                                handleDelete(p);
                              } else if (e.target.value === 'delete') {
                                handleHardDelete(p);
                              }
                              e.target.value = '';
                            }}
                            className="px-2 py-1 text-xs border border-gray-300 rounded bg-white"
                            disabled={!p.is_active}
                          >
                            <option value="">작업 선택</option>
                            <option value="deactivate">비활성화</option>
                            <option value="delete">삭제</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {editingProduct ? '제품 수정' : '제품 추가'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  제품명 *
                </label>
                <input
                  type="text"
                  value={formState.name || ''}
                  onChange={(e) => {
                    const newName = e.target.value;
                    const newState = { ...formState, name: newName };
                    // SKU가 비어있을 때만 자동 생성
                    if (!formState.sku || formState.sku.trim() === '') {
                      newState.sku = generateSkuFromName(newName);
                    }
                    setFormState(newState);
                  }}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU {editingProduct && (
                      <span className="text-xs text-gray-500 font-normal">(변경 가능)</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={formState.sku || ''}
                    onChange={(e) => {
                      const newSku = e.target.value.toUpperCase().replace(/\s+/g, '_');
                      setFormState({ ...formState, sku: newSku });
                    }}
                    onFocus={(e) => {
                      // 포커스 시 빈 값이면 placeholder가 보이도록
                      if (!e.target.value) {
                        e.target.placeholder = '예: CALVIN_TEST';
                      }
                    }}
                    onBlur={(e) => {
                      // 포커스 해제 시 placeholder 복원
                      e.target.placeholder = '예: MAS_CAP_GRAY';
                    }}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    placeholder={formState.sku ? '' : '예: MAS_CAP_GRAY'}
                  />
                  {editingProduct && editingProduct.sku !== formState.sku && formState.sku && (
                    <p className="mt-1 text-xs text-amber-600">
                      ⚠️ SKU가 변경됩니다. 저장 시 Supabase에서 중복 체크가 수행됩니다.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    카테고리
                  </label>
                  <input
                    type="text"
                    value={formState.category || ''}
                    onChange={(e) =>
                      setFormState({ ...formState, category: e.target.value })
                    }
                    placeholder="cap, driver, component 등"
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    색상
                  </label>
                  <input
                    type="text"
                    value={formState.color || ''}
                    onChange={(e) => setFormState({ ...formState, color: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    사이즈
                  </label>
                  <input
                    type="text"
                    value={formState.size || ''}
                    onChange={(e) => setFormState({ ...formState, size: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    정상가
                  </label>
                  <input
                    type="number"
                    value={formState.normal_price ?? ''}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        normal_price: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    할인가
                  </label>
                  <input
                    type="number"
                    value={formState.sale_price ?? ''}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        sale_price: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                </div>
              </div>
              {/* 드라이버 제품 전용 필드 */}
              {formState.product_type === 'driver' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      제품 설명 (Subtitle)
                    </label>
                    <input
                      type="text"
                      value={formState.subtitle || ''}
                      onChange={(e) =>
                        setFormState({ ...formState, subtitle: e.target.value })
                      }
                      placeholder="예: 프리미엄 드라이버, MUZIIK 협업 제품, 고반발 드라이버 등"
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      배지 설정
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-2">왼쪽 배지</label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="badge_left"
                              checked={formState.badge_left === 'NEW'}
                              onChange={() => {
                                setFormState({
                                  ...formState,
                                  badge_left: 'NEW',
                                  badge_left_color: 'red',
                                });
                              }}
                              className="rounded"
                            />
                            <span className="text-sm">NEW (빨간색)</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="badge_left"
                              checked={formState.badge_left === 'BEST'}
                              onChange={() => {
                                setFormState({
                                  ...formState,
                                  badge_left: 'BEST',
                                  badge_left_color: 'yellow',
                                });
                              }}
                              className="rounded"
                            />
                            <span className="text-sm">BEST (노란색)</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="badge_left"
                              checked={!formState.badge_left || formState.badge_left === null}
                              onChange={() => {
                                setFormState({
                                  ...formState,
                                  badge_left: null,
                                  badge_left_color: null,
                                });
                              }}
                              className="rounded"
                            />
                            <span className="text-sm text-gray-400">없음</span>
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-2">오른쪽 배지</label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="badge_right"
                              checked={formState.badge_right === 'LIMITED'}
                              onChange={() => {
                                setFormState({
                                  ...formState,
                                  badge_right: 'LIMITED',
                                  badge_right_color: 'green',
                                });
                              }}
                              className="rounded"
                            />
                            <span className="text-sm">LIMITED (초록색)</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="badge_right"
                              checked={!formState.badge_right || formState.badge_right === null}
                              onChange={() => {
                                setFormState({
                                  ...formState,
                                  badge_right: null,
                                  badge_right_color: null,
                                });
                              }}
                              className="rounded"
                            />
                            <span className="text-sm text-gray-400">없음</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={!!formState.is_gift}
                    onChange={(e) =>
                      setFormState({ ...formState, is_gift: e.target.checked })
                    }
                  />
                  사은품
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={!!formState.is_sellable}
                    onChange={(e) =>
                      setFormState({ ...formState, is_sellable: e.target.checked })
                    }
                  />
                  판매 가능
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={formState.is_active !== false}
                    onChange={(e) =>
                      setFormState({ ...formState, is_active: e.target.checked })
                    }
                  />
                  활성
                </label>
              </div>
              {/* 합성 데이터 생성 옵션 (신규 제품 또는 합성 데이터가 없는 제품) */}
              {formState.category && 
               !['component', 'weight_pack', 'ball', 'tshirt'].includes(formState.category) && (
                <div className="border-t pt-4 mt-4">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={createComposition}
                      onChange={(e) => setCreateComposition(e.target.checked)}
                      className="rounded"
                    />
                    <span>
                      {editingProduct && !editingProduct.product_composition
                        ? '제품 합성 관리 데이터 생성'
                        : '제품 합성 관리 데이터도 함께 생성'}
                      <span className="text-xs text-gray-500 ml-1">
                        {editingProduct && !editingProduct.product_composition
                          ? '(현재 합성 데이터가 없습니다)'
                          : '(제품 합성 관리 페이지에서 바로 사용 가능)'}
                      </span>
                    </span>
                  </label>
                </div>
              )}
              
              {/* 제품 이미지 관리 */}
              <div className="border-t pt-4 mt-4">
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
                  <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer text-sm">
                    {uploadingImage ? '업로드 중...' : '📷 이미지 업로드'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleDetailImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleOpenGallery}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    🖼️ 갤러리에서 선택
                  </button>
                </div>

                {/* 통합 이미지 그리드 */}
                {getAllImages().length > 0 ? (
                  <div className="grid grid-cols-4 gap-4">
                    {getAllImages().map((img, index) => {
                      const isMain = mainImageUrl === img;
                      const fileName = getFileNameFromUrl(img);
                      return (
                        <div key={index} className="relative group">
                          <div className={`relative w-full h-32 bg-gray-100 rounded overflow-hidden border-2 ${
                            isMain ? 'border-blue-500' : 'border-gray-300'
                          }`}>
                            <Image
                              src={getProductImageUrl(img)}
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
                  </div>
                )}
              </div>
              
              {/* 메모 (하단으로 이동) */}
              <div className="border-t pt-4 mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  메모
                </label>
                <input
                  type="text"
                  value={formState.legacy_name || ''}
                  onChange={(e) =>
                    setFormState({ ...formState, legacy_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  placeholder="메모를 입력하세요"
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border rounded-md text-sm hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                >
                  {editingProduct ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 갤러리 이미지 선택 모달 */}
      <FolderImagePicker
        isOpen={showGalleryPicker}
        onClose={() => {
          setShowGalleryPicker(false);
          setGalleryPickerMode(null);
        }}
        onSelect={handleGalleryImageSelect}
        folderPath={getDetailFolderPath() || ''}
        title="갤러리에서 이미지 선택"
      />

      {inventoryModalOpen && inventoryProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                재고 관리 - {inventoryProduct.name}
              </h2>
              <button
                onClick={() => {
                  setInventoryModalOpen(false);
                  setEditingTransaction(null);
                  setInventoryTxType('inbound');
                  setInventoryTxQty(1);
                  setInventoryTxNote('');
                  setInventorySupplierId('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <div className="text-sm text-gray-600">현재 재고</div>
              <div className="text-2xl font-bold text-gray-900">
                {inventoryLoading ? '...' : `${inventoryQuantity.toLocaleString()} 개`}
              </div>
            </div>

            <div className="mb-6 border rounded-md p-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                {editingTransaction ? '재고 이력 수정' : '재고 이력 추가'}
              </h3>
              <div className="grid grid-cols-5 gap-3 items-end text-sm">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    일시
                  </label>
                  <input
                    type="date"
                    value={inventoryTxDate}
                    onChange={(e) => setInventoryTxDate(e.target.value)}
                    className="w-full px-2 py-1.5 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    유형
                  </label>
                  <select
                    value={inventoryTxType}
                    onChange={(e) =>
                      setInventoryTxType(
                        e.target.value as
                          | 'inbound'
                          | 'outbound'
                          | 'scrap'
                          | 'adjustment',
                      )
                    }
                    className="w-full px-2 py-1.5 border rounded-md"
                  >
                    <option value="inbound">입고(+)</option>
                    <option value="outbound">출고/지급(-)</option>
                    <option value="scrap">폐기(-)</option>
                    <option value="adjustment">조정(+/-)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    수량
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={inventoryTxQty}
                    onChange={(e) =>
                      setInventoryTxQty(Math.max(1, Number(e.target.value) || 1))
                    }
                    className="w-full px-2 py-1.5 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    공급처
                  </label>
                  <select
                    value={inventorySupplierId}
                    onChange={(e) =>
                      setInventorySupplierId(e.target.value ? Number(e.target.value) : '')
                    }
                    className="w-full px-2 py-1.5 border rounded-md"
                  >
                    <option value="">선택 안 함</option>
                    {inventorySuppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    메모
                  </label>
                  <input
                    type="text"
                    value={inventoryTxNote}
                    onChange={(e) => setInventoryTxNote(e.target.value)}
                    className="w-full px-2 py-1.5 border rounded-md"
                    placeholder="예: 초기 입고, 시타 사은품 지급, 폐기 사유 등"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-3">
                {editingTransaction && (
                  <button
                    onClick={() => {
                      setEditingTransaction(null);
                      setInventoryTxType('inbound');
                      setInventoryTxQty(1);
                      setInventoryTxNote('');
                      setInventorySupplierId('');
                      setInventoryTxDate('');
                    }}
                    className="px-3 py-1.5 border rounded-md text-xs hover:bg-gray-50"
                  >
                    취소
                  </button>
                )}
                <button
                  onClick={editingTransaction ? handleUpdateTransaction : addInventoryTransaction}
                  className="px-3 py-1.5 bg-amber-600 text-white rounded-md text-xs hover:bg-amber-700"
                >
                  {editingTransaction ? '재고 이력 수정' : '재고 이력 추가'}
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                최근 재고 이력
              </h3>
              {inventoryLoading ? (
                <div className="py-4 text-sm text-gray-500">로딩 중...</div>
              ) : inventoryHistory.length === 0 ? (
                <div className="py-4 text-sm text-gray-500">
                  등록된 재고 이력이 없습니다.
                </div>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 text-left">일시</th>
                        <th className="p-2 text-left">유형</th>
                        <th className="p-2 text-right">수량</th>
                        <th className="p-2 text-left">공급처</th>
                        <th className="p-2 text-left">메모</th>
                        <th className="p-2 text-left">액션</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryHistory.map((tx) => (
                        <tr key={tx.id} className="border-t">
                          <td className="p-2">
                            {tx.tx_date
                              ? new Date(tx.tx_date).toLocaleString('ko-KR', {
                                  timeZone: 'Asia/Seoul',
                                })
                              : '-'}
                          </td>
                          <td className="p-2">
                            {tx.tx_type === 'inbound'
                              ? '입고'
                              : tx.tx_type === 'outbound'
                              ? '출고/지급'
                              : tx.tx_type === 'scrap'
                              ? '폐기'
                              : '조정'}
                          </td>
                          <td className="p-2 text-right">
                            {tx.quantity > 0
                              ? `+${tx.quantity}`
                              : tx.quantity}
                          </td>
                          <td className="p-2">
                            {tx.supplier_id
                              ? inventorySuppliers.find((s) => s.id === tx.supplier_id)?.name || '-'
                              : '-'}
                          </td>
                          <td className="p-2">{tx.note || '-'}</td>
                          <td className="p-2">
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleEditTransaction(tx)}
                                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                              >
                                수정
                              </button>
                              <button
                                onClick={() => handleDeleteTransaction(tx.id)}
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
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}


