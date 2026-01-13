'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Image, Sparkles, X, RotateCcw, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import GalleryPicker from '../GalleryPicker';

interface FeedData {
  imageCategory: string;
  imagePrompt: string;
  caption: string;
  imageUrl?: string;
  imageCount?: number; // ✅ 이미지 개수 추가
  url?: string;
  basePrompt?: string;
  abTest?: {
    methodA: {
      images: Array<{ imageUrl: string; originalUrl: string; method: string }>;
      totalSize: number;
      generationTime: number;
      method: string;
    } | null; // null 허용
    methodB: {
      images: Array<{ imageUrl: string; originalUrl: string; method: string }>;
      totalSize: number;
      generationTime: number;
      method: string;
    } | null; // null 허용
    comparison: {
      methodA: {
        fileSize: number;
        generationTime: number;
        imageCount: number;
      } | null; // null 허용
      methodB: {
        fileSize: number;
        generationTime: number;
        imageCount: number;
      } | null; // null 허용
    };
  };
}

interface FeedManagerProps {
  account: {
    number: string;
    name: string;
    persona: string;
    tone: 'gold' | 'black';
  };
  feedData: FeedData;
  onUpdate: (data: FeedData) => void;
  onGenerateImage: (prompt: string) => Promise<{ imageUrls: string[], generatedPrompt?: string, paragraphImages?: any[] }>;
  isGenerating?: boolean;
  accountKey?: 'account1' | 'account2';
  calendarData?: any;
  selectedDate?: string;
  onBasePromptUpdate?: (basePrompt: string) => void;
  publishStatus?: 'created' | 'published'; // ✅ 배포 상태 추가
}

export default function FeedManager({
  account,
  feedData,
  onUpdate,
  onGenerateImage,
  isGenerating = false,
  accountKey,
  calendarData,
  selectedDate,
  onBasePromptUpdate,
  publishStatus = 'created' // ✅ 배포 상태 기본값
}: FeedManagerProps) {
  const [showGallery, setShowGallery] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingBasePrompt, setIsGeneratingBasePrompt] = useState(false);
  const [isRegeneratingPrompt, setIsRegeneratingPrompt] = useState(false);
  const [isRecoveringImage, setIsRecoveringImage] = useState(false);
  const [isRegeneratingWithTextOption, setIsRegeneratingWithTextOption] = useState<string | null>(null);
  // 프롬프트 토글 상태
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  
  // ✅ 중복 호출 방지를 위한 플래그
  const isRecoveringRef = useRef<boolean>(false);
  
  // ✅ alert 중복 방지를 위한 플래그
  const alertShownRef = useRef<boolean>(false);
  // ✅ 제품 합성 관련 상태
  const [enableProductComposition, setEnableProductComposition] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isComposingProduct, setIsComposingProduct] = useState(false);

  // ✅ 제품 합성 관련 상태 추가
  const [selectedProductCategory, setSelectedProductCategory] = useState<string | undefined>();

  // ✅ 제품 목록 로드 (드라이버, 모자, 액세서리)
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoadingProducts(true);
      try {
        // ✅ product_composition 테이블은 'hat' 카테고리 사용
        const [driverRes, hatRes, accessoryRes] = await Promise.all([
          fetch('/api/admin/product-composition?category=driver&active=true'),
          fetch('/api/admin/product-composition?category=hat&active=true'), // ✅ 'hat' 사용
          fetch('/api/admin/product-composition?category=accessory&active=true')
        ]);
        
        const [driverData, hatData, accessoryData] = await Promise.all([
          driverRes.json(),
          hatRes.json(),
          accessoryRes.json()
        ]);
        
        console.log('📦 제품 목록 로드 결과:', {
          driver: driverData.success ? driverData.products?.length || 0 : 0,
          hat: hatData.success ? hatData.products?.length || 0 : 0,
          accessory: accessoryData.success ? accessoryData.products?.length || 0 : 0
        });
        
        const allProducts: any[] = [];
        if (driverData.success && driverData.products) {
          allProducts.push(...driverData.products.map((p: any) => ({ ...p, category: 'driver' })));
        }
        if (hatData.success && hatData.products) {
          allProducts.push(...hatData.products.map((p: any) => ({ ...p, category: 'hat' })));
          console.log('✅ 모자 제품 로드 완료:', hatData.products.map((p: any) => p.name));
        } else {
          console.warn('⚠️ 모자 제품 로드 실패:', hatData);
        }
        if (accessoryData.success && accessoryData.products) {
          allProducts.push(...accessoryData.products.map((p: any) => ({ ...p, category: 'accessory' })));
        }
        
        console.log('📦 총 제품 개수:', allProducts.length);
        setProducts(allProducts);
      } catch (error) {
        console.error('❌ 제품 목록 로드 실패:', error);
      } finally {
        setIsLoadingProducts(false);
      }
    };
    loadProducts();
  }, []);

  // ✅ 선택한 제품의 compositionTarget 가져오기
  const getCompositionTarget = (productId: string | undefined): 'hands' | 'head' | 'body' | 'accessory' => {
    if (!productId) return 'hands';
    const product = products.find(p => p.id === productId);
    if (!product) return 'hands';
    
    // 제품의 compositionTarget이 있으면 사용, 없으면 카테고리에 따라 기본값 설정
    if (product.composition_target) {
      return product.composition_target;
    }
    
    // 카테고리에 따라 기본값 설정
    if (product.category === 'driver') return 'hands';
    if (product.category === 'hat') return 'head';
    if (product.category === 'accessory') return 'accessory';
    return 'hands';
  };

  // 이미지 자동 복구 함수 (갤러리에서 해당 날짜 이미지 찾기)
  const handleAutoRecoverImage = async () => {
    // ✅ 배포 완료 상태면 자동 복구 차단
    if (publishStatus === 'published') {
      console.info('ℹ️ 피드 이미지 자동 복구 차단: 배포 완료 상태에서는 이미지가 고정됩니다.');
      return;
    }

    // ✅ 중복 호출 방지
    if (isRecoveringRef.current) {
      console.log('ℹ️ 피드 이미지 복구 이미 진행 중, 중복 호출 무시');
      return;
    }

    if (!selectedDate || !accountKey) {
      console.warn('날짜 또는 계정 정보가 없어 자동 복구를 수행할 수 없습니다.');
      return;
    }

    try {
      isRecoveringRef.current = true; // ✅ 플래그 설정
      setIsRecoveringImage(true);

      // 갤러리에서 해당 날짜의 피드 이미지 조회
      const response = await fetch(
        `/api/kakao-content/fetch-gallery-images-by-date?date=${selectedDate}&account=${accountKey}&type=feed`
      );

      if (!response.ok) {
        throw new Error('갤러리 이미지 조회 실패');
      }

      const data = await response.json();
      
      if (data.success && data.images && data.images.length > 0) {
        // 첫 번째 이미지 사용 (가장 최근 생성된 이미지)
        const recoveredImageUrl = data.images[0].url;
        
        onUpdate({
          ...feedData,
          imageUrl: recoveredImageUrl
        });

        console.log('✅ 피드 이미지 자동 복구 완료:', recoveredImageUrl);
        // ✅ alert는 한 번만 표시 (중복 방지)
        if (!alertShownRef.current) {
          alertShownRef.current = true;
          alert('✅ 피드 이미지가 갤러리에서 자동으로 복구되었습니다.');
          // 1초 후 플래그 리셋 (다음 복구 시 다시 표시 가능)
          setTimeout(() => {
            alertShownRef.current = false;
          }, 1000);
        }
      } else {
        console.warn('⚠️ 갤러리에서 피드 이미지를 찾을 수 없습니다.');
        // ✅ alert는 한 번만 표시
        if (!alertShownRef.current) {
          alertShownRef.current = true;
          alert('⚠️ 갤러리에서 피드 이미지를 찾을 수 없습니다.');
          setTimeout(() => {
            alertShownRef.current = false;
          }, 1000);
        }
      }
    } catch (error: any) {
      console.error('❌ 피드 이미지 자동 복구 실패:', error);
      // ✅ alert는 한 번만 표시
      if (!alertShownRef.current) {
        alertShownRef.current = true;
        alert(`이미지 자동 복구 실패: ${error.message}`);
        setTimeout(() => {
          alertShownRef.current = false;
        }, 1000);
      }
    } finally {
      isRecoveringRef.current = false; // ✅ 플래그 해제
      setIsRecoveringImage(false);
    }
  };

  // 이미지 에러 핸들러
  const handleImageError = async (event: React.SyntheticEvent<HTMLImageElement>) => {
    // ✅ 배포 완료 상태면 자동 복구 차단
    if (publishStatus === 'published') {
      console.info('ℹ️ 피드 이미지 로드 실패: 배포 완료 상태에서는 자동 복구하지 않습니다.');
      return;
    }

    // ✅ 이미 복구 중이면 무시
    if (isRecoveringRef.current) {
      console.log('ℹ️ 피드 이미지 복구 이미 진행 중, 에러 핸들러 무시');
      return;
    }

    const img = event.currentTarget;
    console.warn('⚠️ 피드 이미지 로드 실패:', img.src);
    
    // 이미지 URL을 즉시 undefined로 설정하여 표시 제거 (캐시된 이미지 방지)
    onUpdate({
      ...feedData,
      imageUrl: undefined
    });
    
    // 자동 복구 시도
    await handleAutoRecoverImage();
  };

  // basePrompt 가져오기
  const getBasePrompt = (): string | undefined => {
    // 1순위: calendarData에서 조회
    if (calendarData && accountKey && selectedDate) {
      const feedSchedule = calendarData.kakaoFeed?.dailySchedule || [];
      const schedule = feedSchedule.find((s: any) => s.date === selectedDate);
      if (schedule) {
        const basePrompt = accountKey === 'account1' 
          ? schedule.account1?.basePrompt || schedule.account1?.imageCategory
          : schedule.account2?.basePrompt || schedule.account2?.imageCategory;
        
        if (basePrompt && basePrompt !== '없음') {
          return basePrompt;
        }
      }
    }
    
    // 2순위: feedData에서 조회
    return feedData.basePrompt || feedData.imageCategory;
  };

  // basePrompt 자동 생성
  const handleGenerateBasePrompt = async () => {
    try {
      setIsGeneratingBasePrompt(true);
      
      const weeklyTheme = calendarData?.profileContent?.[accountKey || 'account1']?.weeklyThemes?.week1 || 
                          '비거리의 감성 – 스윙과 마음의 연결';
      
      const response = await fetch('/api/kakao-content/generate-base-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate || new Date().toISOString().split('T')[0],
          accountType: accountKey || (account.tone === 'gold' ? 'account1' : 'account2'),
          type: 'feed',
          weeklyTheme: weeklyTheme
        })
      });

      const data = await response.json();
      if (data.success && data.basePrompt) {
        // 자동으로 저장
        if (onBasePromptUpdate) {
          onBasePromptUpdate(data.basePrompt);
        }
        onUpdate({ ...feedData, basePrompt: data.basePrompt });
        alert('✅ basePrompt가 자동 생성되어 저장되었습니다.');
      } else {
        throw new Error(data.message || 'basePrompt 생성 실패');
      }
    } catch (error: any) {
      alert(`basePrompt 생성 실패: ${error.message}`);
    } finally {
      setIsGeneratingBasePrompt(false);
    }
  };


  // 통합 이미지 생성/재생성 함수 (프롬프트 재생성 옵션 포함)
  const handleGenerateImage = async (regeneratePrompt: boolean = false) => {
    // ✅ 배포 완료 상태면 차단
    if (publishStatus === 'published') {
      alert('배포 완료 상태에서는 이미지를 재생성할 수 없습니다. 배포 대기로 변경해주세요.');
      return;
    }

    try {
      setIsGeneratingImage(true);
      
      let promptToUse = feedData.imagePrompt;
      
      // 프롬프트 재생성 옵션
      if (regeneratePrompt) {
        setIsRegeneratingPrompt(true);
        try {
          let basePrompt: string | undefined = getBasePrompt();
          
          if (!basePrompt) {
            alert('basePrompt를 먼저 설정해주세요.');
            setIsRegeneratingPrompt(false);
            setIsGeneratingImage(false);
            return;
          }

          // 프롬프트 재생성 API 호출
          const promptResponse = await fetch('/api/kakao-content/generate-prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: basePrompt,
              accountType: accountKey || (account.tone === 'gold' ? 'account1' : 'account2'),
              type: 'feed',
              brandStrategy: {
                customerpersona: account.tone === 'gold' ? 'senior_fitting' : 'tech_enthusiast',
                customerChannel: 'local_customers',
                brandWeight: account.tone === 'gold' ? '높음' : '중간',
                audienceTemperature: 'warm'
              },
              weeklyTheme: calendarData?.profileContent?.[accountKey || 'account1']?.weeklyThemes?.week1 || 
                          '비거리의 감성 – 스윙과 마음의 연결',
              date: selectedDate || new Date().toISOString().split('T')[0]
            })
          });

          const promptData = await promptResponse.json();
          if (!promptData.success) {
            throw new Error(promptData.message || '프롬프트 재생성 실패');
          }

          promptToUse = promptData.prompt;
        } catch (error: any) {
          alert(`프롬프트 재생성 실패: ${error.message}`);
          setIsRegeneratingPrompt(false);
          setIsGeneratingImage(false);
          return;
        } finally {
          setIsRegeneratingPrompt(false);
        }
      }
      
      // ✅ 기존 이미지가 있고 제품 합성이 활성화된 경우: 제품 합성만 수행 (프롬프트 재생성 제외)
      if (feedData.imageUrl && enableProductComposition && selectedProductId && !regeneratePrompt) {
        setIsComposingProduct(true);
        try {
          const selectedProduct = products.find(p => p.id === selectedProductId);
          if (!selectedProduct) {
            console.error('❌ 선택한 제품을 찾을 수 없습니다:', selectedProductId);
            alert('선택한 제품을 찾을 수 없습니다. 제품을 다시 선택해주세요.');
            return;
          }

          const compositionTarget = getCompositionTarget(selectedProductId);
          
          // ✅ baseImageUrl 명확히 생성 (카카오 콘텐츠 폴더 경로)
          const dateStr = selectedDate || new Date().toISOString().split('T')[0];
          const accountFolder = accountKey === 'account1' ? 'account1' : 'account2';
          // 기존 이미지 URL에서 경로 추출 시도, 실패 시 명시적 경로 생성
          let baseImageUrl = feedData.imageUrl;
          
          // feedData.imageUrl이 이미 Supabase public URL인 경우, 경로 추출
          // 만약 경로 추출이 불가능하면 명시적 경로를 생성하여 전달
          // ✅ 두 곳 저장을 보장하기 위해 명시적 경로 생성
          if (!feedData.imageUrl.includes('blog-images') || !feedData.imageUrl.includes('daily-branding/kakao')) {
            // 명시적 경로 생성 (저장 위치 결정용)
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yyytjudftvpmcnppaymw.supabase.co';
            baseImageUrl = `${supabaseUrl}/storage/v1/object/public/blog-images/originals/daily-branding/kakao/${dateStr}/${accountFolder}/feed/kakao-${accountFolder}-feed-${Date.now()}.jpg`;
          } else {
            // feedData.imageUrl에 경로가 있지만, 명시적으로 카카오 콘텐츠 경로를 포함하도록 보장
            // URL에서 경로 부분만 추출하여 명시적 경로 생성
            const pathMatch = feedData.imageUrl.match(/blog-images\/(originals\/daily-branding\/kakao\/[^?]+)/);
            if (pathMatch) {
              const extractedPath = pathMatch[1];
              const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yyytjudftvpmcnppaymw.supabase.co';
              baseImageUrl = `${supabaseUrl}/storage/v1/object/public/blog-images/${extractedPath}`;
            } else {
              // 경로 추출 실패 시 명시적 경로 생성
              const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yyytjudftvpmcnppaymw.supabase.co';
              baseImageUrl = `${supabaseUrl}/storage/v1/object/public/blog-images/originals/daily-branding/kakao/${dateStr}/${accountFolder}/feed/kakao-${accountFolder}-feed-${Date.now()}.jpg`;
            }
          }
          
          console.log('🎨 기존 피드 이미지 제품 합성 시작:', {
            productId: selectedProductId,
            productName: selectedProduct.name,
            productCategory: selectedProduct.category,
            compositionTarget,
            modelImageUrl: feedData.imageUrl,
            baseImageUrl: baseImageUrl // ✅ 명확한 경로 전달
          });
          
          const composeResponse = await fetch('/api/compose-product-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              modelImageUrl: feedData.imageUrl,
              productId: selectedProductId,
              compositionTarget: compositionTarget,
              compositionMethod: 'nano-banana-pro',
              compositionBackground: 'natural',
              baseImageUrl: baseImageUrl, // ✅ 명확한 경로 전달
              prompt: feedData.imagePrompt || feedData.basePrompt // ✅ 기존 프롬프트 전달
            })
          });
          
          if (!composeResponse.ok) {
            const errorData = await composeResponse.json().catch(() => ({ 
              error: `서버 오류 (${composeResponse.status})` 
            }));
            console.error('❌ 제품 합성 API 실패:', {
              status: composeResponse.status,
              statusText: composeResponse.statusText,
              error: errorData
            });
            alert(`제품 합성 실패: ${errorData.error || errorData.message || '서버 오류가 발생했습니다.'}`);
            return;
          }
          
          const composeResult = await composeResponse.json();
          
          if (composeResult.success && composeResult.images && composeResult.images.length > 0) {
            const finalImageUrl = composeResult.images[0].imageUrl;
            console.log('✅ 기존 이미지 제품 합성 완료:', {
              productName: composeResult.product?.name,
              composedImageUrl: finalImageUrl
            });
            
            onUpdate({
              ...feedData,
              imageUrl: finalImageUrl
            });
            alert('✅ 기존 이미지에 제품이 합성되었습니다.');
          } else {
            console.warn('⚠️ 제품 합성 응답에 이미지가 없습니다:', composeResult);
            alert('제품 합성은 완료되었지만 결과 이미지를 가져올 수 없습니다.');
          }
        } catch (composeError: any) {
          console.error('❌ 제품 합성 예외 발생:', composeError);
          alert(`제품 합성 중 오류가 발생했습니다: ${composeError.message || '알 수 없는 오류'}`);
        } finally {
          setIsComposingProduct(false);
          setIsGeneratingImage(false);
        }
        return; // 제품 합성만 수행한 경우 여기서 종료
      }
      
      // ✅ 기존 로직: 새 이미지 생성 → 제품 합성 (필요한 경우)
      const result = await onGenerateImage(promptToUse);
      if (result.imageUrls.length > 0) {
        let finalImageUrl = result.imageUrls[0];
        
        // ✅ 제품 합성 활성화 시 제품 합성 수행
        if (enableProductComposition && selectedProductId) {
          setIsComposingProduct(true);
          try {
            const selectedProduct = products.find(p => p.id === selectedProductId);
            if (!selectedProduct) {
              console.error('❌ 선택한 제품을 찾을 수 없습니다:', selectedProductId);
              alert('선택한 제품을 찾을 수 없습니다. 제품을 다시 선택해주세요.');
              return;
            }

            const compositionTarget = getCompositionTarget(selectedProductId);
            
            // ✅ baseImageUrl 명확히 생성 (카카오 콘텐츠 폴더 경로)
            const dateStr = selectedDate || new Date().toISOString().split('T')[0];
            const accountFolder = accountKey === 'account1' ? 'account1' : 'account2';
            // 생성된 이미지 URL에서 경로 추출 시도, 실패 시 명시적 경로 생성
            let baseImageUrl = finalImageUrl;
            
            // finalImageUrl이 이미 Supabase public URL인 경우, 경로 추출
            // 만약 경로 추출이 불가능하면 명시적 경로를 생성하여 전달
            // ✅ 두 곳 저장을 보장하기 위해 명시적 경로 생성
            if (!finalImageUrl.includes('blog-images') || !finalImageUrl.includes('daily-branding/kakao')) {
              // 명시적 경로 생성 (저장 위치 결정용)
              const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yyytjudftvpmcnppaymw.supabase.co';
              baseImageUrl = `${supabaseUrl}/storage/v1/object/public/blog-images/originals/daily-branding/kakao/${dateStr}/${accountFolder}/feed/kakao-${accountFolder}-feed-${Date.now()}.jpg`;
            } else {
              // finalImageUrl에 경로가 있지만, 명시적으로 카카오 콘텐츠 경로를 포함하도록 보장
              // URL에서 경로 부분만 추출하여 명시적 경로 생성
              const pathMatch = finalImageUrl.match(/blog-images\/(originals\/daily-branding\/kakao\/[^?]+)/);
              if (pathMatch) {
                const extractedPath = pathMatch[1];
                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yyytjudftvpmcnppaymw.supabase.co';
                baseImageUrl = `${supabaseUrl}/storage/v1/object/public/blog-images/${extractedPath}`;
              } else {
                // 경로 추출 실패 시 명시적 경로 생성
                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yyytjudftvpmcnppaymw.supabase.co';
                baseImageUrl = `${supabaseUrl}/storage/v1/object/public/blog-images/originals/daily-branding/kakao/${dateStr}/${accountFolder}/feed/kakao-${accountFolder}-feed-${Date.now()}.jpg`;
              }
            }
            
            console.log('🎨 피드 이미지 제품 합성 시작:', {
              productId: selectedProductId,
              productName: selectedProduct.name,
              productCategory: selectedProduct.category,
              compositionTarget,
              modelImageUrl: finalImageUrl,
              baseImageUrl: baseImageUrl // ✅ 명확한 경로 전달
            });
            
            // 🔍 디버깅: baseImageUrl 및 productId 검증
            console.log('🔍 [디버깅] 제품 합성 요청 정보:', {
              productId: selectedProductId,
              productName: selectedProduct?.name,
              productSlug: selectedProduct?.slug,
              baseImageUrl: baseImageUrl,
              baseImageUrlType: typeof baseImageUrl,
              baseImageUrlLength: baseImageUrl?.length,
              baseImageUrlIncludesKakao: baseImageUrl?.includes('daily-branding/kakao'),
              baseImageUrlIncludesBlogImages: baseImageUrl?.includes('blog-images'),
              compositionTarget: compositionTarget,
              dateStr: dateStr,
              accountFolder: accountFolder
            });
            
            const composeResponse = await fetch('/api/compose-product-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                modelImageUrl: finalImageUrl,
                productId: selectedProductId,
                compositionTarget: compositionTarget,
                compositionMethod: 'nano-banana-pro',
                compositionBackground: 'natural', // 배경 유지 명시
                baseImageUrl: baseImageUrl, // ✅ 명확한 경로 전달
                prompt: promptToUse // ✅ 프롬프트 전달
              })
            });
            
            if (!composeResponse.ok) {
              // ✅ API 실패 시 상세 에러 메시지
              const errorData = await composeResponse.json().catch(() => ({ 
                error: `서버 오류 (${composeResponse.status})` 
              }));
              console.error('❌ 제품 합성 API 실패:', {
                status: composeResponse.status,
                statusText: composeResponse.statusText,
                error: errorData
              });
              alert(`제품 합성 실패: ${errorData.error || errorData.message || '서버 오류가 발생했습니다.'}\n\n원본 이미지를 사용합니다.`);
              // 원본 이미지 사용 (finalImageUrl은 이미 설정됨)
            } else {
              const composeResult = await composeResponse.json();
              
              // ✅ AI 이미지 생성기와 동일한 방식으로 수정
              if (composeResult.success && composeResult.images && composeResult.images.length > 0) {
                finalImageUrl = composeResult.images[0].imageUrl;
                console.log('✅ 피드 이미지 제품 합성 완료:', {
                  productName: composeResult.product?.name,
                  composedImageUrl: finalImageUrl
                });
              } else {
                // ✅ 합성은 성공했지만 이미지가 없는 경우
                console.warn('⚠️ 제품 합성 응답에 이미지가 없습니다:', composeResult);
                alert('제품 합성은 완료되었지만 결과 이미지를 가져올 수 없습니다.\n원본 이미지를 사용합니다.');
              }
            }
          } catch (composeError: any) {
            console.error('❌ 제품 합성 예외 발생:', composeError);
            alert(`제품 합성 중 오류가 발생했습니다: ${composeError.message || '알 수 없는 오류'}\n\n원본 이미지를 사용합니다.`);
            // 합성 실패해도 원본 이미지는 사용
          } finally {
            setIsComposingProduct(false);
          }
        }
        
        const updateData: FeedData = {
          ...feedData,
          imageUrl: finalImageUrl,
          imagePrompt: result.generatedPrompt || promptToUse
        };
        
        onUpdate(updateData);
        
        alert(regeneratePrompt 
          ? '✅ 프롬프트와 이미지가 재생성되었습니다.' 
          : '✅ 이미지가 생성되었습니다.');
      }
    } catch (error: any) {
      alert(`피드 이미지 생성 실패: ${error.message}`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // 로고 옵션으로 이미지 재생성 함수
  const handleRegenerateWithLogoOption = async (logoOption: 'logo' | 'full-brand' | 'none') => {
    // ✅ 배포 완료 상태면 차단
    if (publishStatus === 'published') {
      alert('배포 완료 상태에서는 이미지를 재생성할 수 없습니다. 배포 대기로 변경해주세요.');
      return;
    }

    try {
      setIsRegeneratingWithTextOption(logoOption);
      
      let modifiedPrompt = feedData.imagePrompt;
      
      // 기존 브랜딩 관련 지시사항 제거
      modifiedPrompt = modifiedPrompt.replace(/\.?\s*(CRITICAL.*?MASSGOO|brandSpec|logo|branding|embroidery|ABSOLUTELY NO.*?MASSGOO)[^.]*\.?/gi, '');
      
      // account type에 맞는 나이/인물 지시사항
      const accountType = accountKey || (account.tone === 'gold' ? 'account1' : 'account2');
      const ageSpec = accountType === 'account1' 
        ? 'Korean senior golfer (50-70 years old, Korean ethnicity, Asian facial features, silver/gray hair)'
        : 'Korean young golfer (30-50 years old, Korean ethnicity, Asian facial features)';
      
      // 로고 옵션에 따른 브랜딩 지시사항
      let brandSpec = '';
      if (logoOption === 'logo') {
        // L: 인물의 옷, 모자, 건물, 매장, 조형물에 MASSGOO 로고
        brandSpec = 'CRITICAL: If the golfer is wearing a cap, hat, or any headwear, the cap MUST have "MASSGOO" logo or embroidery clearly visible and readable. If the golfer is wearing clothing (polo shirt, jacket, etc.), the clothing MUST have "MASSGOO" logo or branding clearly visible. If the scene includes buildings, stores, or structures, include "MASSGOO" store sign, logo, or branding visible on storefronts, interior walls, displays, or architectural elements. If the scene includes sculptures or decorative elements, include "MASSGOO" branding naturally integrated. The brand name "MASSGOO" must be naturally integrated into the cap/hat fabric as embroidery or printed logo, on clothing as a logo patch or embroidered text, and on buildings/structures as realistic store signs or architectural elements. Use "MASSGOO" (not "MASGOO") as the official brand name.';
      } else if (logoOption === 'full-brand') {
        // BL: 전체 MASSGOO (로고 + 브랜딩 요소 전체)
        brandSpec = 'CRITICAL: Prominently feature "MASSGOO" branding throughout the entire image. Include "MASSGOO" logo or embroidery on golfer\'s cap, hat, or headwear clearly visible and readable. Include "MASSGOO" logo or branding on golfer\'s clothing (polo shirt, jacket, etc.) clearly visible. If the scene includes buildings, stores, or structures, prominently display "MASSGOO" store signs, logos, or branding on storefronts, interior walls, displays, or architectural elements. If the scene includes sculptures, decorative elements, or background elements, integrate "MASSGOO" branding naturally throughout. The brand name "MASSGOO" should be visible in multiple locations naturally integrated into the scene. Use "MASSGOO" (not "MASGOO") as the official brand name.';
      } else {
        // X: 아무것도 안 넣음
        brandSpec = 'ABSOLUTELY NO "MASSGOO" branding, logo, text, or any brand elements whatsoever in the image. No logos on caps, hats, clothing, buildings, stores, structures, or any elements. The image must be completely brand-free.';
      }
      
      // 피드 이미지: 나이 스펙 + 브랜딩 옵션
      modifiedPrompt = `${modifiedPrompt}. ${ageSpec}. ${brandSpec}`;
      
      // 프롬프트 재생성 없이 직접 이미지 생성 API 호출
      const account = accountKey || (account.tone === 'gold' ? 'account1' : 'account2');
      
      const response = await fetch('/api/kakao-content/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompts: [{ prompt: modifiedPrompt, paragraph: '' }],
          imageCount: 1,
          logoOption: logoOption, // 로고 옵션 전달
          metadata: {
            account: account,
            type: 'feed',
            date: selectedDate || new Date().toISOString().split('T')[0],
            message: feedData.caption || ''
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '알 수 없는 오류' }));
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const imageUrls = data.imageUrls || [];
      
      if (imageUrls.length > 0) {
        onUpdate({
          ...feedData,
          imagePrompt: modifiedPrompt,
          imageUrl: imageUrls[0]
        });
        alert(`✅ ${logoOption === 'logo' ? '로고 추가' : logoOption === 'full-brand' ? '전체 브랜딩' : '브랜딩 없음'} 옵션으로 이미지가 재생성되었습니다.`);
      }
    } catch (error: any) {
      alert(`이미지 재생성 실패: ${error.message}`);
    } finally {
      setIsRegeneratingWithTextOption(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* 이미지 카테고리 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          피드 이미지
        </label>
        <div className="space-y-2">
          <div className="text-sm text-gray-600">
            <strong>카테고리:</strong> {feedData.imageCategory}
          </div>
          
          {/* basePrompt 관리 */}
          <div className="border-t pt-2 mt-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-600">Base Prompt (요일별 템플릿)</label>
              <button
                onClick={handleGenerateBasePrompt}
                disabled={isGeneratingBasePrompt}
                className="text-xs px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded disabled:opacity-50 flex items-center gap-1"
                title="자동 생성"
              >
                {isGeneratingBasePrompt ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>생성 중...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3" />
                    <span>자동 생성</span>
                  </>
                )}
              </button>
            </div>
            <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
              {getBasePrompt() || 'basePrompt 없음'}
            </div>
          </div>
          
          {/* 프롬프트 토글 */}
          <div className="text-xs text-gray-500 flex items-start gap-2 mt-2">
            <div className="flex-1">
              <button
                onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                className="flex items-center gap-1 font-medium hover:text-gray-700"
              >
                {isPromptExpanded ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
                <strong>프롬프트:</strong>
              </button>
              {isPromptExpanded && (
                <div className="mt-1 pl-5 break-words max-h-40 overflow-y-auto">{feedData.imagePrompt}</div>
              )}
            </div>
          </div>
          <div className="text-xs text-gray-500">
            <strong>생성 사이즈:</strong> 1080x1350 (4:5 세로형, 카카오톡 피드 최적화)
          </div>
          
          {feedData.imageUrl && (
            <div className="mt-2 relative">
              <img 
                src={feedData.imageUrl} 
                alt="피드 이미지"
                className="w-full aspect-[4/5] object-cover rounded-lg"
                onError={handleImageError}
              />
              {isRecoveringImage && (
                <div className="absolute inset-0 bg-blue-100 bg-opacity-75 flex items-center justify-center rounded-lg">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <div className="text-sm text-blue-700">갤러리에서 이미지 복구 중...</div>
                  </div>
                </div>
              )}
              {feedData.imageCount !== undefined && feedData.imageCount > 1 && (
                <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  이미지 {feedData.imageCount}개 중 1번째
                </div>
              )}
              <button
                onClick={() => onUpdate({
                  ...feedData,
                  imageUrl: undefined
                })}
                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                title="이미지 삭제"
              >
                <X className="w-3 h-3" />
              </button>
              <div className="mt-1 text-xs text-gray-500">
                피드 이미지 사이즈: 1080x1350 (4:5 세로형, 최적화됨)
              </div>
            </div>
          )}
          
          {/* ✅ 제품 합성 옵션 */}
          <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id={`enable-product-composition-feed-${accountKey || 'default'}`}
                checked={enableProductComposition}
                onChange={(e) => {
                  setEnableProductComposition(e.target.checked);
                  if (!e.target.checked) {
                    setSelectedProductId(undefined);
                    setSelectedProductCategory(undefined);
                  }
                }}
                disabled={publishStatus === 'published'}
                className="w-4 h-4"
              />
              <label htmlFor={`enable-product-composition-feed-${accountKey || 'default'}`} className="text-gray-700 font-medium">
                제품 합성 활성화
              </label>
            </div>
            {enableProductComposition && (
              <div className="space-y-2">
                <select
                  value={selectedProductCategory || ''}
                  onChange={(e) => {
                    setSelectedProductCategory(e.target.value || undefined);
                    setSelectedProductId(undefined); // 카테고리 변경 시 제품 선택 초기화
                  }}
                  disabled={publishStatus === 'published' || isLoadingProducts}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-white"
                >
                  <option value="">카테고리 선택...</option>
                  <option value="driver">드라이버</option>
                  <option value="hat">모자</option>
                  <option value="accessory">액세서리</option>
                </select>
                {selectedProductCategory && (
                  <select
                    value={selectedProductId || ''}
                    onChange={(e) => setSelectedProductId(e.target.value || undefined)}
                    disabled={publishStatus === 'published' || isLoadingProducts}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-white"
                  >
                    <option value="">제품 선택...</option>
                    {products
                      .filter((product) => product.category === selectedProductCategory)
                      .map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} {product.badge ? `(${product.badge})` : ''}
                        </option>
                      ))}
                  </select>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            <button
              onClick={() => {
                // ✅ 배포 완료 상태면 차단
                if (publishStatus === 'published') {
                  alert('배포 완료 상태에서는 이미지를 변경할 수 없습니다. 배포 대기로 변경해주세요.');
                  return;
                }
                setShowGallery(true);
              }}
              disabled={publishStatus === 'published'}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title={publishStatus === 'published' ? '배포 완료 상태에서는 이미지를 변경할 수 없습니다. 배포 대기로 변경해주세요.' : '갤러리에서 선택'}
            >
              <Image className="w-4 h-4" />
              갤러리에서 선택
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleGenerateImage(false)}
                disabled={isGeneratingImage || isGenerating || publishStatus === 'published' || isComposingProduct}
                className="flex items-center gap-2 px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm disabled:opacity-50"
                title={publishStatus === 'published' 
                  ? '배포 완료 상태에서는 이미지를 재생성할 수 없습니다.' 
                  : feedData.imageUrl 
                    ? (enableProductComposition && selectedProductId 
                        ? '기존 이미지에 제품 합성' 
                        : '이미지 재생성')
                    : '⚡ 피드 이미지 생성'}
              >
                {isGeneratingImage || isComposingProduct ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    {isComposingProduct ? '제품 합성 중...' : '생성 중...'}
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    {feedData.imageUrl 
                      ? (enableProductComposition && selectedProductId ? '제품 합성' : '이미지 재생성')
                      : '⚡ 피드 이미지 생성'}
                  </>
                )}
              </button>
              {/* 프롬프트 재생성 옵션 (이미지가 있을 때만 표시) */}
              {feedData.imageUrl && feedData.imagePrompt && (
                <button
                  onClick={() => handleGenerateImage(true)}
                  disabled={isRegeneratingPrompt || isGeneratingImage || isGenerating || publishStatus === 'published'}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  title="프롬프트 재생성 + 이미지 재생성 (제품 합성 포함)"
                >
                  {isRegeneratingPrompt ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      재생성 중...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      프롬프트 이미지 재생성
                    </>
                  )}
                </button>
              )}
              {feedData.imageUrl && (
                <>
                  <button
                    onClick={() => handleRegenerateWithLogoOption('logo')}
                    disabled={isRegeneratingWithTextOption !== null || isGeneratingImage || isGenerating}
                    className="w-6 h-6 text-xs font-bold bg-blue-500 hover:bg-blue-600 text-white rounded disabled:opacity-50 flex items-center justify-center"
                    title="인물 옷/모자/건물/매장/조형물에 MASSGOO 로고 추가"
                  >로고</button>
                  <button
                    onClick={() => handleRegenerateWithLogoOption('full-brand')}
                    disabled={isRegeneratingWithTextOption !== null || isGeneratingImage || isGenerating}
                    className="w-6 h-6 text-xs font-bold bg-green-500 hover:bg-green-600 text-white rounded disabled:opacity-50 flex items-center justify-center"
                    title="전체 MASSGOO 브랜딩 추가"
                  >전체</button>
                  <button
                    onClick={() => handleRegenerateWithLogoOption('none')}
                    disabled={isRegeneratingWithTextOption !== null || isGeneratingImage || isGenerating}
                    className="w-6 h-6 text-xs font-bold bg-red-500 hover:bg-red-600 text-white rounded disabled:opacity-50 flex items-center justify-center"
                    title="브랜딩 없음"
                  >없음</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 캡션 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor={`feed-caption-${accountKey || 'default'}`}>
          피드 캡션
        </label>
        <textarea
          id={`feed-caption-${accountKey || 'default'}`}
          value={feedData.caption}
          onChange={(e) => onUpdate({ ...feedData, caption: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={2}
          placeholder="피드 캡션을 입력하세요"
        />
        <div className="text-xs text-gray-500 mt-1">
          {feedData.caption.length}자
        </div>
      </div>

      {/* URL */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          피드 URL (캡션 하단에 표시)
        </label>
        <label className="sr-only" htmlFor={`feed-url-${accountKey || 'default'}`}>피드 URL 선택</label>
        <select
          id={`feed-url-${accountKey || 'default'}`}
          value={feedData.url || ''}
          onChange={(e) => onUpdate({ ...feedData, url: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          aria-label="피드 URL 선택"
        >
          <option value="">URL 선택 (선택사항)</option>
          <option value="https://masgolf.co.kr">신규 홈페이지 (masgolf.co.kr)</option>
          <option value="https://www.mas9golf.com">기존 홈페이지 (mas9golf.com)</option>
          <option value="https://masgolf.co.kr/muziik">뮤직 콜라보 (MUZIIK)</option>
          <option value="https://www.masgolf.co.kr/contact">시타 매장 안내</option>
          <option value="https://www.mas9golf.com/try-a-massgo">시타 예약</option>
          <option value="https://smartstore.naver.com/mas9golf">네이버 스마트스토어</option>
        </select>
        {feedData.url && (
          <div className="mt-2 text-xs text-gray-600">
            선택된 URL: <a href={feedData.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{feedData.url}</a>
          </div>
        )}
        <div className="mt-2">
          <label className="sr-only" htmlFor={`feed-url-input-${accountKey || 'default'}`}>피드 URL 직접 입력</label>
          <input
            id={`feed-url-input-${accountKey || 'default'}`}
            type="text"
            value={feedData.url || ''}
            onChange={(e) => onUpdate({ ...feedData, url: e.target.value })}
            placeholder="또는 직접 URL 입력"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* 갤러리 모달 */}
      <GalleryPicker
        isOpen={showGallery}
        onSelect={(imageUrl) => {
          // ✅ 배포 완료 상태면 차단
          if (publishStatus === 'published') {
            alert('배포 완료 상태에서는 이미지를 변경할 수 없습니다. 배포 대기로 변경해주세요.');
            setShowGallery(false);
            return;
          }

          // 프롬프트가 없으면 기본값 설정
          const currentPrompt = feedData.imagePrompt || '';
          
          onUpdate({
            ...feedData,
            imageUrl,
            // 프롬프트가 비어있으면 경고용 메시지 설정 (하지만 업데이트는 진행)
            imagePrompt: currentPrompt || '프롬프트를 입력해주세요'
          });
          setShowGallery(false);
          
          // 프롬프트가 없으면 경고 메시지 (비동기로 표시하여 모달이 닫힌 후 표시)
          if (!currentPrompt) {
            setTimeout(() => {
              alert('⚠️ 프롬프트가 없습니다.\n\n나중에 AI 이미지 재생성을 하려면 프롬프트를 입력해주세요.');
            }, 300);
          }
        }}
        onClose={() => setShowGallery(false)}
        autoFilterFolder={
          selectedDate && accountKey
            ? `originals/daily-branding/kakao/${selectedDate}/${accountKey}/feed`
            : undefined
        }
        showCompareMode={true}
        maxCompareCount={3}
      />
    </div>
  );
}

