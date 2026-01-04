import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { PRODUCTS_FOR_COMPOSITION, ProductForComposition, getProductsByTarget, CompositionTarget } from '../../lib/product-composition';

interface ProductSelectorProps {
  selectedProductId?: string;
  onSelect: (productId: string) => void;
  compositionTarget?: CompositionTarget; // 합성 타겟
  showDescription?: boolean;
  layout?: 'grid' | 'list';
  className?: string;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  selectedProductId,
  onSelect,
  compositionTarget = 'hands', // 기본값: 손에 드라이버
  showDescription = false,
  layout = 'grid',
  className = ''
}) => {
  const [products, setProducts] = useState<ProductForComposition[]>([]);
  const [loading, setLoading] = useState(true);

  // Supabase에서 합성 타겟별 제품 조회
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Supabase에서 합성 타겟별 제품 가져오기
        const supabaseProducts = await getProductsByTarget(compositionTarget);
        if (supabaseProducts.length > 0) {
          setProducts(supabaseProducts);
        } else {
          // Fallback: 기존 하드코딩 데이터에서 필터링
          const filtered = PRODUCTS_FOR_COMPOSITION.filter(
            p => p.compositionTarget === compositionTarget
          );
          setProducts(filtered);
        }
      } catch (error) {
        console.error('제품 목록 로드 실패:', error);
        // Fallback: 기존 하드코딩 데이터
        const filtered = PRODUCTS_FOR_COMPOSITION.filter(
          p => p.compositionTarget === compositionTarget
        );
        setProducts(filtered);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [compositionTarget]);

  const getBadgeColor = (badge?: string) => {
    switch (badge) {
      case 'BEST':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'LIMITED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'NEW':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          합성할 제품 선택 *
        </label>
        <p className="text-xs text-gray-500 mb-3">
          {loading ? '로딩 중...' : `${products.length}개 ${compositionTarget === 'head' ? '모자' : '드라이버'} 제품 중 하나를 선택하여 모델 이미지에 합성합니다.`}
        </p>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">로딩 중...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {compositionTarget === 'head' ? '모자' : '드라이버'} 제품이 없습니다.
        </div>
      ) : layout === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => onSelect(product.id)}
              className={`relative p-3 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                selectedProductId === product.id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              {/* 제품 이미지 */}
              <div className="relative h-24 mb-2 bg-gray-50 rounded overflow-hidden">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  unoptimized
                  onError={(e) => {
                    console.error('제품 이미지 로드 실패:', product.imageUrl, product.name);
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-image.jpg';
                  }}
                />
              </div>

              {/* 제품 정보 */}
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs font-semibold text-gray-900 line-clamp-2 flex-1">
                    {product.name}
                  </div>
                  {product.badge && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded border flex-shrink-0 ${getBadgeColor(
                        product.badge
                      )}`}
                    >
                      {product.badge}
                    </span>
                  )}
                </div>
                
                {showDescription && product.description && (
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {product.description}
                  </p>
                )}
                
                {product.price && (
                  <p className="text-xs font-medium text-gray-700">
                    {product.price}
                  </p>
                )}
              </div>

              {/* 선택 표시 */}
              {selectedProductId === product.id && (
                <div className="absolute top-2 right-2">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => onSelect(product.id)}
              className={`w-full p-4 border-2 rounded-lg text-left transition-all hover:shadow-md flex items-center gap-4 ${
                selectedProductId === product.id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              {/* 제품 이미지 */}
              <div className="relative w-20 h-20 bg-gray-50 rounded overflow-hidden flex-shrink-0">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-contain"
                  sizes="80px"
                  unoptimized
                  onError={(e) => {
                    console.error('제품 이미지 로드 실패:', product.imageUrl, product.name);
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-image.jpg';
                  }}
                />
              </div>

              {/* 제품 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-gray-900">
                    {product.name}
                  </h4>
                  {product.badge && (
                    <span
                      className={`text-xs px-2 py-1 rounded border flex-shrink-0 ${getBadgeColor(
                        product.badge
                      )}`}
                    >
                      {product.badge}
                    </span>
                  )}
                </div>
                
                <p className="text-xs text-gray-600 mb-1">{product.category}</p>
                
                {showDescription && product.description && (
                  <p className="text-xs text-gray-500 line-clamp-1">
                    {product.description}
                  </p>
                )}
                
                {product.price && (
                  <p className="text-xs font-medium text-gray-700 mt-1">
                    {product.price}
                  </p>
                )}
              </div>

              {/* 선택 표시 */}
              {selectedProductId === product.id && (
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {selectedProductId && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <span className="font-semibold">선택된 제품:</span>{' '}
            {products.find((p) => p.id === selectedProductId)?.name}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductSelector;

