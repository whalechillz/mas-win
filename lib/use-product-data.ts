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
          
          // detail_images 처리 - 정확히 매칭 (폴백 없음)
          if (Array.isArray(productData.detail_images) && productData.detail_images.length > 0) {
            const detailUrls = productData.detail_images.map((img: string) => getProductImageUrl(img));
            setProductImages(detailUrls);
          } else {
            // 데이터베이스에 이미지가 없으면 빈 배열
            setProductImages([]);
          }
          
          // gallery_images 처리 (착용 이미지)
          if (Array.isArray(productData.gallery_images) && productData.gallery_images.length > 0) {
            const galleryUrls = productData.gallery_images.map((img: string) => getProductImageUrl(img));
            setGalleryImages(galleryUrls);
          } else {
            setGalleryImages([]);
          }
        } else {
          // 데이터베이스에 제품이 없으면 빈 배열
          setProductImages([]);
          setGalleryImages([]);
        }
      } catch (error) {
        console.error('제품 로드 오류:', error);
        // 오류 발생 시에도 폴백 없이 빈 배열
        setProductImages([]);
        setGalleryImages([]);
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

