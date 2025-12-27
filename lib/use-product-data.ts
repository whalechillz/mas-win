/**
 * 제품 데이터 로드 훅 (재사용)
 */

import { useState, useEffect } from 'react';
import { getProductImageUrl } from './product-image-url';

interface UseProductDataResult {
  productImages: string[];
  galleryImages: string[];
  isLoadingProduct: boolean;
  product: any | null;
}

export function useProductData(slug: string, defaultImages: string[] = []): UseProductDataResult {
  const [productImages, setProductImages] = useState<string[]>([]);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [product, setProduct] = useState<any | null>(null);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setIsLoadingProduct(true);
        const res = await fetch(`/api/products/${slug}`);
        const json = await res.json();
        
        if (json.success && json.product) {
          const productData = json.product;
          setProduct(productData);
          
          // detail_images 처리
          if (Array.isArray(productData.detail_images) && productData.detail_images.length > 0) {
            const detailUrls = productData.detail_images.map((img: string) => getProductImageUrl(img));
            setProductImages(detailUrls);
          } else if (defaultImages.length > 0) {
            setProductImages(defaultImages.map(img => getProductImageUrl(img)));
          }
          
          // gallery_images 처리 (착용 이미지)
          if (Array.isArray(productData.gallery_images) && productData.gallery_images.length > 0) {
            const galleryUrls = productData.gallery_images.map((img: string) => getProductImageUrl(img));
            setGalleryImages(galleryUrls);
          }
        } else {
          // 데이터베이스에 없으면 기본 이미지 사용
          if (defaultImages.length > 0) {
            setProductImages(defaultImages.map(img => getProductImageUrl(img)));
          }
        }
      } catch (error) {
        console.error('제품 로드 오류:', error);
        if (defaultImages.length > 0) {
          setProductImages(defaultImages.map(img => getProductImageUrl(img)));
        }
      } finally {
        setIsLoadingProduct(false);
      }
    };

    if (slug) {
      loadProduct();
    }
  }, [slug]);

  return {
    productImages,
    galleryImages,
    isLoadingProduct,
    product,
  };
}

