import React from 'react';
import Image from 'next/image';
import { PRODUCTS_FOR_COMPOSITION, ProductForComposition } from '../../lib/product-composition';

interface ProductSelectorProps {
  selectedProductId?: string;
  onSelect: (productId: string) => void;
  showDescription?: boolean;
  layout?: 'grid' | 'list';
  className?: string;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  selectedProductId,
  onSelect,
  showDescription = false,
  layout = 'grid',
  className = ''
}) => {
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
          7개 제품 중 하나를 선택하여 모델 이미지에 합성합니다.
        </p>
      </div>

      {layout === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {PRODUCTS_FOR_COMPOSITION.map((product) => (
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
                />
              </div>

              {/* 제품 정보 */}
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs font-semibold text-gray-900 line-clamp-2 flex-1">
                    {product.displayName}
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
          {PRODUCTS_FOR_COMPOSITION.map((product) => (
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
                  src={encodeURI(product.imageUrl)}
                  alt={product.name}
                  fill
                  className="object-contain"
                  sizes="80px"
                  unoptimized
                />
              </div>

              {/* 제품 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-gray-900">
                    {product.displayName}
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
            {PRODUCTS_FOR_COMPOSITION.find((p) => p.id === selectedProductId)?.displayName}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductSelector;

