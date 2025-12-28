import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import AdminNav from '../../components/admin/AdminNav';
import { getProductImageUrl } from '../../lib/product-image-url';

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
  const [inventorySuppliers, setInventorySuppliers] = useState<{ id: number; name: string }[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [detailImages, setDetailImages] = useState<string[]>([]);
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
  ]);

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
        setProducts(json.products || []);
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

  const handleOpenCreate = () => {
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
    setDetailImages([]);
    setShowModal(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormState({
      ...product,
    });
    setDetailImages(Array.isArray(product.detail_images) ? product.detail_images : []);
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
      alert('상품명을 입력해주세요.');
      return;
    }

    try {
      const isEdit = !!editingProduct;
      const url = '/api/admin/products';
      const method = isEdit ? 'PUT' : 'POST';

      const body: any = {
        ...(isEdit ? { id: editingProduct!.id } : {}),
        name: formState.name,
        sku: formState.sku ?? '',
        category: formState.category ?? '',
        color: formState.color ?? '',
        size: formState.size ?? '',
        legacy_name: formState.legacy_name ?? '',
        is_gift: !!formState.is_gift,
        is_sellable: !!formState.is_sellable,
        is_active: formState.is_active !== false,
        normal_price:
          formState.normal_price === undefined || formState.normal_price === null
            ? ''
            : formState.normal_price,
        sale_price:
          formState.sale_price === undefined || formState.sale_price === null
            ? ''
            : formState.sale_price,
        detail_images: detailImages,
      };

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
      alert(isEdit ? '상품이 수정되었습니다.' : '상품이 추가되었습니다.');
      setShowModal(false);
      setEditingProduct(null);
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
      alert('상품이 비활성화되었습니다.');
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
      alert('상품이 완전히 삭제되었습니다.');
      await loadProducts();
    } catch (error: any) {
      console.error('상품 삭제 오류:', error);
      alert(error.message || '상품 삭제 중 오류가 발생했습니다.');
    }
  };

  // 상세페이지 이미지 업로드
  const handleDetailImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!formState.slug && !formState.sku && !formState.category) {
      alert('제품 slug, SKU 또는 카테고리를 먼저 입력해주세요.');
      return;
    }

    setUploadingImage(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('productSlug', formState.slug || formState.sku || '');
      uploadFormData.append('category', formState.category || (formState.product_type === 'driver' ? 'driver' : 'hat'));
      uploadFormData.append('imageType', 'detail');

      const response = await fetch('/api/admin/upload-product-image', {
        method: 'POST',
        body: uploadFormData,
      });

      if (response.ok) {
        const data = await response.json();
        const imageUrl = data.url || data.storageUrl;
        setDetailImages([...detailImages, imageUrl]);
        alert('이미지가 업로드되었습니다.');
      } else {
        const error = await response.json();
        alert(`오류: ${error.error || '이미지 업로드에 실패했습니다.'}`);
      }
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      alert('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // 상세페이지 이미지 삭제
  const handleDeleteDetailImage = (index: number) => {
    if (confirm('이 이미지를 삭제하시겠습니까?')) {
      setDetailImages(detailImages.filter((_, i) => i !== index));
    }
  };

  // 상세페이지 이미지 순서 변경
  const handleMoveDetailImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...detailImages];
    if (direction === 'up' && index > 0) {
      [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    } else if (direction === 'down' && index < newImages.length - 1) {
      [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    }
    setDetailImages(newImages);
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
              <option value="cap">cap</option>
              <option value="bucket_hat">bucket_hat</option>
              <option value="tshirt">tshirt</option>
              <option value="clutch">clutch</option>
              <option value="ball">ball</option>
              <option value="accessory">accessory</option>
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
                        <div className="font-medium text-gray-900">{p.name}</div>
                        {p.product_type === 'driver' && p.subtitle && (
                          <div className="text-xs text-gray-500">{p.subtitle}</div>
                        )}
                        {p.legacy_name && (
                          <div className="text-xs text-gray-500">{p.legacy_name}</div>
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
                        {p.product_type === 'driver' ? (p.slug || '-') : (p.sku || '-')}
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
                {editingProduct ? '상품 수정' : '상품 추가'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingProduct(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    상품명 *
                  </label>
                  <input
                    type="text"
                    value={formState.name || ''}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    기존명 (메모)
                  </label>
                  <input
                    type="text"
                    value={formState.legacy_name || ''}
                    onChange={(e) =>
                      setFormState({ ...formState, legacy_name: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={formState.sku || ''}
                    onChange={(e) => setFormState({ ...formState, sku: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
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
                    placeholder="cap, bucket_hat, tshirt 등"
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
              
              {/* 상세페이지 이미지 관리 */}
              <div className="border-t pt-4 mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상세페이지 이미지
                </label>
                <div className="mb-3">
                  <label className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 cursor-pointer inline-block">
                    {uploadingImage ? '업로드 중...' : '📷 이미지 업로드'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleDetailImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
                {detailImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-3">
                    {detailImages.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                          <Image
                            src={getProductImageUrl(imageUrl)}
                            alt={`상세 이미지 ${index + 1}`}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => handleMoveDetailImage(index, 'up')}
                              className="p-1 bg-blue-500 text-white rounded text-xs"
                              title="위로"
                            >
                              ↑
                            </button>
                          )}
                          {index < detailImages.length - 1 && (
                            <button
                              type="button"
                              onClick={() => handleMoveDetailImage(index, 'down')}
                              className="p-1 bg-blue-500 text-white rounded text-xs"
                              title="아래로"
                            >
                              ↓
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteDetailImage(index)}
                            className="p-1 bg-red-500 text-white rounded text-xs"
                            title="삭제"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="mt-1 text-xs text-center text-gray-500">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {detailImages.length === 0 && (
                  <div className="text-sm text-gray-500 py-4 text-center">
                    업로드된 이미지가 없습니다.
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProduct(null);
                  }}
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
              <div className="grid grid-cols-4 gap-3 items-end text-sm">
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


