/**
 * 제품 데이터 로드 훅 (재사용)
 */

import { useState, useEffect } from 'react';
import { getProductImageUrl } from './product-image-url';

interface UseProductDataResult {
  productImages: string[]; // detail_images (기존 호환성 유지)
  heroImages: string[]; // hero_images
  hookImages: string[]; // hook_images
  hookContent: Array<{ image: string; title: string; description: string }>; // hook_content
  detailImages: string[]; // detail_images (명시적)
  detailContent: Array<{ image: string; title: string; description: string }>; // detail_content
  galleryImages: string[];
  performanceImages: string[];
  isLoadingProduct: boolean;
  product: any | null;
}

export function useProductData(slug: string, defaultImages: string[] = []): UseProductDataResult {
  const [productImages, setProductImages] = useState<string[]>([]); // detail_images (기존 호환성)
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [hookImages, setHookImages] = useState<string[]>([]);
  const [hookContent, setHookContent] = useState<Array<{ image: string; title: string; description: string }>>([]);
  const [detailImages, setDetailImages] = useState<string[]>([]);
  const [detailContent, setDetailContent] = useState<Array<{ image: string; title: string; description: string }>>([]);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [performanceImages, setPerformanceImages] = useState<string[]>([]);
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
          
          // hero_images 처리
          if (Array.isArray(productData.hero_images) && productData.hero_images.length > 0) {
            const heroUrls = productData.hero_images.map((img: string) => getProductImageUrl(img));
            setHeroImages(heroUrls);
          } else {
            setHeroImages([]);
          }
          
          // hook_images 처리
          if (Array.isArray(productData.hook_images) && productData.hook_images.length > 0) {
            const hookUrls = productData.hook_images.map((img: string) => getProductImageUrl(img));
            setHookImages(hookUrls);
          } else {
            setHookImages([]);
          }
          
          // hook_content 처리
          if (Array.isArray(productData.hook_content) && productData.hook_content.length > 0) {
            const hookContentData = productData.hook_content.map((item: any) => ({
              image: getProductImageUrl(item.image || ''),
              title: item.title || '',
              description: item.description || '',
            }));
            setHookContent(hookContentData);
          } else {
            setHookContent([]);
          }
          
          // detail_images 처리 - 정확히 매칭 (폴백 없음)
          if (Array.isArray(productData.detail_images) && productData.detail_images.length > 0) {
            const detailUrls = productData.detail_images.map((img: string) => getProductImageUrl(img));
            setProductImages(detailUrls); // 기존 호환성 유지
            setDetailImages(detailUrls); // 명시적 필드
          } else {
            // 데이터베이스에 이미지가 없으면 빈 배열
            setProductImages([]);
            setDetailImages([]);
          }
          
          // detail_content 처리
          if (Array.isArray(productData.detail_content) && productData.detail_content.length > 0) {
            const detailContentData = productData.detail_content.map((item: any) => ({
              image: getProductImageUrl(item.image || ''),
              title: item.title || '',
              description: item.description || '',
            }));
            setDetailContent(detailContentData);
          } else {
            setDetailContent([]);
          }
          
          // gallery_images 처리 (착용 이미지)
          if (Array.isArray(productData.gallery_images) && productData.gallery_images.length > 0) {
            const galleryUrls = productData.gallery_images.map((img: string) => getProductImageUrl(img));
            setGalleryImages(galleryUrls);
          } else {
            setGalleryImages([]);
          }
          
          // performance_images 처리 (성능 데이터 이미지)
          if (Array.isArray(productData.performance_images) && productData.performance_images.length > 0) {
            const performanceUrls = productData.performance_images.map((img: string) => getProductImageUrl(img));
            setPerformanceImages(performanceUrls);
          } else {
            setPerformanceImages([]);
          }
        } else {
          // 데이터베이스에 제품이 없으면 빈 배열
          setProductImages([]);
          setHeroImages([]);
          setHookImages([]);
          setHookContent([]);
          setDetailImages([]);
          setDetailContent([]);
          setGalleryImages([]);
          setPerformanceImages([]);
        }
      } catch (error) {
        console.error('제품 로드 오류:', error);
        // 오류 발생 시에도 폴백 없이 빈 배열
        setProductImages([]);
        setHeroImages([]);
        setHookImages([]);
        setHookContent([]);
        setDetailImages([]);
        setDetailContent([]);
        setGalleryImages([]);
        setPerformanceImages([]);
      } finally {
        setIsLoadingProduct(false);
      }
    };

    if (slug) {
      loadProduct();
    }
  }, [slug]);

  return {
    productImages, // detail_images (기존 호환성 유지)
    heroImages,
    hookImages,
    hookContent,
    detailImages,
    detailContent,
    galleryImages,
    performanceImages,
    isLoadingProduct,
    product,
  };
}

