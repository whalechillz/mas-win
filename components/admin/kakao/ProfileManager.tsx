'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Image, Upload, Sparkles, X, RotateCcw, List, ChevronDown, ChevronUp } from 'lucide-react';
import GalleryPicker from '../GalleryPicker';
import ProfileMessageList from './ProfileMessageList';

interface ProfileData {
  background: {
    image: string;
    prompt: string;
    imageUrl?: string;
    imageCount?: number; // ✅ 이미지 개수 추가
  };
  profile: {
    image: string;
    prompt: string;
    imageUrl?: string;
    imageCount?: number; // ✅ 이미지 개수 추가
  };
  message: string;
}

interface ProfileManagerProps {
  account: {
    number: string;
    name: string;
    persona: string;
    tone: 'gold' | 'black';
  };
  profileData: ProfileData;
  onUpdate: (data: ProfileData) => void;
  onGenerateImage: (type: 'background' | 'profile', prompt: string) => Promise<{ imageUrls: string[], generatedPrompt?: string }>;
  isGenerating?: boolean;
  accountKey?: 'account1' | 'account2';
  calendarData?: any;
  selectedDate?: string;
  onBasePromptUpdate?: (type: 'background' | 'profile', basePrompt: string) => void;
  publishStatus?: 'created' | 'published'; // ✅ 배포 상태 추가
}

export default function ProfileManager({
  account,
  profileData,
  onUpdate,
  onGenerateImage,
  isGenerating = false,
  accountKey,
  calendarData,
  selectedDate,
  onBasePromptUpdate,
  publishStatus = 'created' // ✅ 배포 상태 기본값
}: ProfileManagerProps) {
  const [showBackgroundGallery, setShowBackgroundGallery] = useState(false);
  const [showProfileGallery, setShowProfileGallery] = useState(false);
  const [isGeneratingBackground, setIsGeneratingBackground] = useState(false);
  const [isGeneratingProfile, setIsGeneratingProfile] = useState(false);
  const [showMessageList, setShowMessageList] = useState(false);
  const [isRegeneratingPrompt, setIsRegeneratingPrompt] = useState<'background' | 'profile' | null>(null);
  const [isRecoveringImage, setIsRecoveringImage] = useState<{ background: boolean; profile: boolean }>({ background: false, profile: false });
  
  // ✅ 중복 호출 방지를 위한 플래그
  const isRecoveringRef = useRef<{ background: boolean; profile: boolean }>({ 
    background: false, 
    profile: false 
  });
  
  // ✅ alert 중복 방지를 위한 플래그
  const alertShownRef = useRef<boolean>(false);
  const [isGeneratingBasePrompt, setIsGeneratingBasePrompt] = useState<{ background: boolean; profile: boolean }>({ background: false, profile: false });
  const [editingBasePrompt, setEditingBasePrompt] = useState<{ type: 'background' | 'profile' | null; value: string }>({ type: null, value: '' });
  // 프롬프트 토글 상태
  const [isBackgroundPromptExpanded, setIsBackgroundPromptExpanded] = useState(false);
  const [isProfilePromptExpanded, setIsProfilePromptExpanded] = useState(false);
  // ✅ 제품 합성 관련 상태
  const [enableProductComposition, setEnableProductComposition] = useState<{ background: boolean; profile: boolean }>({ background: false, profile: false });
  const [selectedProductId, setSelectedProductId] = useState<{ background: string | undefined; profile: string | undefined }>({ background: undefined, profile: undefined });
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isComposingProduct, setIsComposingProduct] = useState<{ background: boolean; profile: boolean }>({ background: false, profile: false });
  const [selectedProductCategory, setSelectedProductCategory] = useState<{ background: string | undefined; profile: string | undefined }>({ background: undefined, profile: undefined });

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
  const getCompositionTarget = (productId: string | undefined, type: 'background' | 'profile'): 'hands' | 'head' | 'body' | 'accessory' => {
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

  const handleGenerateBackground = async () => {
    // ✅ 배포 완료 상태면 차단
    if (publishStatus === 'published') {
      alert('배포 완료 상태에서는 이미지를 재생성할 수 없습니다. 배포 대기로 변경해주세요.');
      return;
    }

    try {
      setIsGeneratingBackground(true);
      
      // ✅ "이미지 재생성" 버튼: 기존 이미지가 있고 제품 합성이 활성화된 경우 → 제품 합성만 수행 (1장)
      // 제품 합성이 활성화되어 있고 제품이 선택되어 있으면 제품 합성만 수행
      if (enableProductComposition.background && selectedProductId.background) {
        // 제품 합성이 활성화되어 있지만 이미지가 없는 경우 안내
        if (!profileData.background.imageUrl) {
          alert('⚠️ 제품 합성을 하려면 먼저 이미지가 필요합니다.\n\n갤러리에서 이미지를 선택해주세요.');
          setIsGeneratingBackground(false);
          return;
        }
        setIsComposingProduct(prev => ({ ...prev, background: true }));
        try {
          const selectedProduct = products.find(p => p.id === selectedProductId.background);
          if (!selectedProduct) {
            console.error('❌ 선택한 제품을 찾을 수 없습니다:', selectedProductId.background);
            alert('선택한 제품을 찾을 수 없습니다. 제품을 다시 선택해주세요.');
            return;
          }

          const compositionTarget = getCompositionTarget(selectedProductId.background, 'background');
          
          console.log('🎨 기존 배경 이미지 제품 합성 시작:', {
            productId: selectedProductId.background,
            productName: selectedProduct.name,
            productCategory: selectedProduct.category,
            compositionTarget,
            modelImageUrl: profileData.background.imageUrl
          });
          
          // ✅ baseImageUrl 명확히 생성 (카카오 콘텐츠 폴더 경로)
          const dateStr = selectedDate || new Date().toISOString().split('T')[0];
          const accountFolder = accountKey === 'account1' ? 'account1' : 'account2';
          // 기존 이미지 URL에서 경로 추출 시도, 실패 시 명시적 경로 생성
          let baseImageUrl = profileData.background.imageUrl;
          
          // profileData.background.imageUrl이 이미 Supabase public URL인 경우, 경로 추출
          // 만약 경로 추출이 불가능하면 명시적 경로를 생성하여 전달
          // ✅ 두 곳 저장을 보장하기 위해 명시적 경로 생성
          if (!profileData.background.imageUrl.includes('blog-images') || !profileData.background.imageUrl.includes('daily-branding/kakao')) {
            // 명시적 경로 생성 (저장 위치 결정용)
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yyytjudftvpmcnppaymw.supabase.co';
            baseImageUrl = `${supabaseUrl}/storage/v1/object/public/blog-images/originals/daily-branding/kakao/${dateStr}/${accountFolder}/background/kakao-${accountFolder}-background-${Date.now()}.jpg`;
          } else {
            // profileData.background.imageUrl에 경로가 있지만, 명시적으로 카카오 콘텐츠 경로를 포함하도록 보장
            // URL에서 경로 부분만 추출하여 명시적 경로 생성
            const pathMatch = profileData.background.imageUrl.match(/blog-images\/(originals\/daily-branding\/kakao\/[^?]+)/);
            if (pathMatch) {
              const extractedPath = pathMatch[1];
              const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yyytjudftvpmcnppaymw.supabase.co';
              baseImageUrl = `${supabaseUrl}/storage/v1/object/public/blog-images/${extractedPath}`;
            } else {
              // 경로 추출 실패 시 명시적 경로 생성
              const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yyytjudftvpmcnppaymw.supabase.co';
              baseImageUrl = `${supabaseUrl}/storage/v1/object/public/blog-images/originals/daily-branding/kakao/${dateStr}/${accountFolder}/background/kakao-${accountFolder}-background-${Date.now()}.jpg`;
            }
          }
          
          // ✅ 타임아웃 처리를 위한 AbortController 추가 (5분 30초)
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 330000); // 5분 30초
          
          let composeResponse;
          try {
            composeResponse = await fetch('/api/compose-product-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                modelImageUrl: profileData.background.imageUrl,
                productId: selectedProductId.background,
                compositionTarget: compositionTarget,
                compositionMethod: 'nano-banana-pro',
                compositionBackground: 'natural',
                baseImageUrl: baseImageUrl, // ✅ 명확한 경로 전달
                prompt: profileData.background.prompt, // ✅ 기존 프롬프트 전달
                imageType: 'background' // ✅ 배경 이미지 타입 추가
              }),
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!composeResponse.ok) {
              const errorData = await composeResponse.json().catch(() => ({ 
                error: `서버 오류 (${composeResponse.status})` 
              }));
              
              // ✅ 타임아웃 오류 구체적인 메시지 표시
              let errorMessage = errorData.error || errorData.message || '서버 오류가 발생했습니다.';
              if (composeResponse.status === 504) {
                errorMessage = '제품 합성 처리 시간이 초과되었습니다. FAL AI 큐 대기 시간이 길어서 발생할 수 있습니다. 잠시 후 다시 시도해주세요.';
              } else if (composeResponse.status === 408) {
                errorMessage = '제품 합성 요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.';
              }
              
              console.error('❌ 제품 합성 API 실패:', {
                status: composeResponse.status,
                statusText: composeResponse.statusText,
                error: errorData
              });
              alert(`제품 합성 실패: ${errorMessage}`);
              return;
            }
          } catch (fetchError: any) {
            clearTimeout(timeoutId);
            
            // ✅ AbortError (타임아웃) 처리
            if (fetchError.name === 'AbortError') {
              console.error('❌ 제품 합성 타임아웃:', '5분 30초 초과');
              alert('제품 합성 처리 시간이 초과되었습니다.\n\nFAL AI 큐 대기 시간이 길어서 발생할 수 있습니다.\n잠시 후 다시 시도해주세요.');
              return;
            }
            
            // ✅ 네트워크 오류 처리
            console.error('❌ 제품 합성 네트워크 오류:', fetchError);
            alert(`제품 합성 중 네트워크 오류가 발생했습니다: ${fetchError.message || '알 수 없는 오류'}`);
            return;
          }
          
          const composeResult = await composeResponse.json();
          
          if (composeResult.success && composeResult.images && composeResult.images.length > 0) {
            const finalImageUrl = composeResult.images[0].imageUrl;
            console.log('✅ 기존 배경 이미지 제품 합성 완료:', {
              productName: composeResult.product?.name,
              composedImageUrl: finalImageUrl
            });
            
            onUpdate({
              ...profileData,
              background: {
                ...profileData.background,
                imageUrl: finalImageUrl
              }
            });
            alert('✅ 기존 배경 이미지에 제품이 합성되었습니다.');
          } else {
            console.warn('⚠️ 제품 합성 응답에 이미지가 없습니다:', composeResult);
            alert('제품 합성은 완료되었지만 결과 이미지를 가져올 수 없습니다.');
          }
        } catch (composeError: any) {
          console.error('❌ 제품 합성 예외 발생:', composeError);
          alert(`제품 합성 중 오류가 발생했습니다: ${composeError.message || '알 수 없는 오류'}`);
        } finally {
          setIsComposingProduct(prev => ({ ...prev, background: false }));
          setIsGeneratingBackground(false);
        }
        return; // 제품 합성만 수행한 경우 여기서 종료
      }
      
      // ✅ 기존 로직: 새 이미지 생성 → 제품 합성 (필요한 경우)
      const result = await onGenerateImage('background', profileData.background.prompt);
      if (result.imageUrls.length > 0) {
        let finalImageUrl = result.imageUrls[0];
        
        // ✅ 제품 합성 활성화 시 제품 합성 수행
        if (enableProductComposition.background && selectedProductId.background) {
          setIsComposingProduct(prev => ({ ...prev, background: true }));
          try {
            const compositionTarget = getCompositionTarget(selectedProductId.background, 'background');
            
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
              baseImageUrl = `${supabaseUrl}/storage/v1/object/public/blog-images/originals/daily-branding/kakao/${dateStr}/${accountFolder}/background/kakao-${accountFolder}-background-${Date.now()}.jpg`;
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
                baseImageUrl = `${supabaseUrl}/storage/v1/object/public/blog-images/originals/daily-branding/kakao/${dateStr}/${accountFolder}/background/kakao-${accountFolder}-background-${Date.now()}.jpg`;
              }
            }
            
            // ✅ 타임아웃 처리를 위한 AbortController 추가 (5분 30초)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 330000); // 5분 30초
            
            try {
              const                 composeResponse = await fetch('/api/compose-product-image', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    modelImageUrl: finalImageUrl,
                    productId: selectedProductId.background,
                    compositionTarget: compositionTarget, // 선택한 제품의 compositionTarget 사용
                    compositionMethod: 'nano-banana-pro',
                    compositionBackground: 'natural', // 배경 유지 명시
                    baseImageUrl: baseImageUrl, // ✅ 명확한 경로 전달
                    prompt: profileData.background.prompt, // ✅ 기존 프롬프트 전달
                    imageType: 'background' // ✅ 배경 이미지 타입 추가
                  }),
                  signal: controller.signal
                });
              
              clearTimeout(timeoutId);
              
              if (composeResponse.ok) {
                const composeResult = await composeResponse.json();
                // ✅ AI 이미지 생성기와 동일한 방식으로 수정
                if (composeResult.success && composeResult.images && composeResult.images.length > 0) {
                  finalImageUrl = composeResult.images[0].imageUrl;
                  console.log('✅ 배경 이미지 제품 합성 완료:', composeResult.product?.name);
                } else {
                  console.warn('⚠️ 배경 이미지 제품 합성 응답에 이미지가 없습니다:', composeResult);
                }
              } else {
                // ✅ 타임아웃 오류 구체적인 메시지 표시
                if (composeResponse.status === 504 || composeResponse.status === 408) {
                  console.warn('⚠️ 제품 합성 타임아웃, 원본 이미지 사용');
                } else {
                  const errorData = await composeResponse.json().catch(() => ({}));
                  console.warn('⚠️ 제품 합성 실패, 원본 이미지 사용:', errorData);
                }
              }
            } catch (composeError: any) {
              clearTimeout(timeoutId);
              
              // ✅ AbortError (타임아웃) 처리
              if (composeError.name === 'AbortError') {
                console.warn('⚠️ 제품 합성 타임아웃 (5분 30초 초과), 원본 이미지 사용');
              } else {
                console.error('제품 합성 실패, 원본 이미지 사용:', composeError);
              }
              // 합성 실패해도 원본 이미지는 사용
            } finally {
              setIsComposingProduct(prev => ({ ...prev, background: false }));
            }
          } catch (composeError: any) {
            console.error('❌ 제품 합성 예외 발생:', composeError);
            alert(`제품 합성 중 오류가 발생했습니다: ${composeError.message || '알 수 없는 오류'}`);
          } finally {
            setIsComposingProduct(prev => ({ ...prev, background: false }));
          }
        }
        
        onUpdate({
          ...profileData,
          background: {
            ...profileData.background,
            imageUrl: finalImageUrl,
            prompt: result.generatedPrompt || profileData.background.prompt // 생성된 프롬프트 저장
          }
        });
      }
    } catch (error: any) {
      alert(`배경 이미지 생성 실패: ${error.message}`);
    } finally {
      setIsGeneratingBackground(false);
    }
  };

  // basePrompt 가져오기 (프로필용)
  const getProfileBasePrompt = (): string | undefined => {
    // 1순위: calendarData에서 조회
    if (calendarData && accountKey && selectedDate) {
      const profileSchedule = calendarData.profileContent?.[accountKey]?.dailySchedule || [];
      const schedule = profileSchedule.find((s: any) => s.date === selectedDate);
      if (schedule) {
        const basePrompt = schedule.profile?.basePrompt || schedule.profile?.image;
        if (basePrompt && basePrompt !== '없음') {
          return basePrompt;
        }
      }
    }
    
    // 2순위: profileData에서 조회
    return profileData.profile.prompt;
  };

  const handleGenerateProfile = async (regeneratePrompt: boolean = false) => {
    // ✅ 배포 완료 상태면 차단
    if (publishStatus === 'published') {
      alert('배포 완료 상태에서는 이미지를 재생성할 수 없습니다. 배포 대기로 변경해주세요.');
      return;
    }

    try {
      setIsGeneratingProfile(true);
      
      let promptToUse = profileData.profile.prompt;
      
      // ✅ 프롬프트 재생성 옵션 (피드와 동일)
      if (regeneratePrompt) {
        setIsRegeneratingPrompt('profile');
        try {
          let basePrompt: string | undefined = getProfileBasePrompt();
          
          if (!basePrompt) {
            alert('basePrompt를 먼저 설정해주세요.');
            setIsRegeneratingPrompt(null);
            setIsGeneratingProfile(false);
            return;
          }

          // 프롬프트 재생성 API 호출
          const promptResponse = await fetch('/api/kakao-content/generate-prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: basePrompt,
              accountType: accountKey || (account.tone === 'gold' ? 'account1' : 'account2'),
              type: 'profile',
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
          setIsRegeneratingPrompt(null);
          setIsGeneratingProfile(false);
          return;
        } finally {
          setIsRegeneratingPrompt(null);
        }
      }
      
      // ✅ "이미지 재생성" 버튼: 기존 이미지가 있고 제품 합성이 활성화된 경우 → 제품 합성만 수행 (1장)
      // ✅ "프롬프트 이미지 재생성" 버튼: regeneratePrompt=true → 새 이미지 생성 후 제품 합성 (2장)
      // 제품 합성이 활성화되어 있고 제품이 선택되어 있으면, 프롬프트 재생성이 아닌 경우 제품 합성만 수행
      if (!regeneratePrompt && enableProductComposition.profile && selectedProductId.profile) {
        // 제품 합성이 활성화되어 있지만 이미지가 없는 경우 안내
        if (!profileData.profile.imageUrl) {
          alert('⚠️ 제품 합성을 하려면 먼저 이미지가 필요합니다.\n\n"프롬프트 이미지 재생성" 버튼을 사용하거나 갤러리에서 이미지를 선택해주세요.');
          setIsGeneratingProfile(false);
          return;
        }
        setIsComposingProduct(prev => ({ ...prev, profile: true }));
        try {
          const selectedProduct = products.find(p => p.id === selectedProductId.profile);
          if (!selectedProduct) {
            console.error('❌ 선택한 제품을 찾을 수 없습니다:', selectedProductId.profile);
            alert('선택한 제품을 찾을 수 없습니다. 제품을 다시 선택해주세요.');
            return;
          }

          const compositionTarget = getCompositionTarget(selectedProductId.profile, 'profile');
          
          console.log('🎨 기존 프로필 이미지 제품 합성 시작:', {
            productId: selectedProductId.profile,
            productName: selectedProduct.name,
            productCategory: selectedProduct.category,
            compositionTarget,
            modelImageUrl: profileData.profile.imageUrl
          });
          
          // ✅ baseImageUrl 명확히 생성 (카카오 콘텐츠 폴더 경로)
          const dateStr = selectedDate || new Date().toISOString().split('T')[0];
          const accountFolder = accountKey === 'account1' ? 'account1' : 'account2';
          // 기존 이미지 URL에서 경로 추출 시도, 실패 시 명시적 경로 생성
          let baseImageUrl = profileData.profile.imageUrl;
          
          // profileData.profile.imageUrl이 이미 Supabase public URL인 경우, 경로 추출
          // 만약 경로 추출이 불가능하면 명시적 경로를 생성하여 전달
          // ✅ 두 곳 저장을 보장하기 위해 명시적 경로 생성
          if (!profileData.profile.imageUrl.includes('blog-images') || !profileData.profile.imageUrl.includes('daily-branding/kakao')) {
            // 명시적 경로 생성 (저장 위치 결정용)
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yyytjudftvpmcnppaymw.supabase.co';
            baseImageUrl = `${supabaseUrl}/storage/v1/object/public/blog-images/originals/daily-branding/kakao/${dateStr}/${accountFolder}/profile/kakao-${accountFolder}-profile-${Date.now()}.jpg`;
          } else {
            // profileData.profile.imageUrl에 경로가 있지만, 명시적으로 카카오 콘텐츠 경로를 포함하도록 보장
            // URL에서 경로 부분만 추출하여 명시적 경로 생성
            const pathMatch = profileData.profile.imageUrl.match(/blog-images\/(originals\/daily-branding\/kakao\/[^?]+)/);
            if (pathMatch) {
              const extractedPath = pathMatch[1];
              const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yyytjudftvpmcnppaymw.supabase.co';
              baseImageUrl = `${supabaseUrl}/storage/v1/object/public/blog-images/${extractedPath}`;
            } else {
              // 경로 추출 실패 시 명시적 경로 생성
              const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yyytjudftvpmcnppaymw.supabase.co';
              baseImageUrl = `${supabaseUrl}/storage/v1/object/public/blog-images/originals/daily-branding/kakao/${dateStr}/${accountFolder}/profile/kakao-${accountFolder}-profile-${Date.now()}.jpg`;
            }
          }
          
          // ✅ 타임아웃 처리를 위한 AbortController 추가 (5분 30초)
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 330000); // 5분 30초
          
          let composeResponse;
          try {
            composeResponse = await fetch('/api/compose-product-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                modelImageUrl: profileData.profile.imageUrl,
                productId: selectedProductId.profile,
                compositionTarget: compositionTarget,
                compositionMethod: 'nano-banana-pro',
                compositionBackground: 'natural',
                baseImageUrl: baseImageUrl, // ✅ 명확한 경로 전달
                prompt: profileData.profile.prompt, // ✅ 기존 프롬프트 전달 (피드와 동일)
                imageType: 'profile' // ✅ 프로필 이미지 타입 명시 (클로즈업 지시사항 적용)
              }),
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!composeResponse.ok) {
              const errorData = await composeResponse.json().catch(() => ({ 
                error: `서버 오류 (${composeResponse.status})` 
              }));
              
              // ✅ 타임아웃 오류 구체적인 메시지 표시
              let errorMessage = errorData.error || errorData.message || '서버 오류가 발생했습니다.';
              if (composeResponse.status === 504) {
                errorMessage = '제품 합성 처리 시간이 초과되었습니다. FAL AI 큐 대기 시간이 길어서 발생할 수 있습니다. 잠시 후 다시 시도해주세요.';
              } else if (composeResponse.status === 408) {
                errorMessage = '제품 합성 요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.';
              }
              
              console.error('❌ 제품 합성 API 실패:', {
                status: composeResponse.status,
                statusText: composeResponse.statusText,
                error: errorData
              });
              alert(`제품 합성 실패: ${errorMessage}`);
              return;
            }
          } catch (fetchError: any) {
            clearTimeout(timeoutId);
            
            // ✅ AbortError (타임아웃) 처리
            if (fetchError.name === 'AbortError') {
              console.error('❌ 제품 합성 타임아웃:', '5분 30초 초과');
              alert('제품 합성 처리 시간이 초과되었습니다.\n\nFAL AI 큐 대기 시간이 길어서 발생할 수 있습니다.\n잠시 후 다시 시도해주세요.');
              return;
            }
            
            // ✅ 네트워크 오류 처리
            console.error('❌ 제품 합성 네트워크 오류:', fetchError);
            alert(`제품 합성 중 네트워크 오류가 발생했습니다: ${fetchError.message || '알 수 없는 오류'}`);
            return;
          }
          
          const composeResult = await composeResponse.json();
          
          if (composeResult.success && composeResult.images && composeResult.images.length > 0) {
            const finalImageUrl = composeResult.images[0].imageUrl;
            console.log('✅ 기존 프로필 이미지 제품 합성 완료:', {
              productName: composeResult.product?.name,
              composedImageUrl: finalImageUrl
            });
            
            onUpdate({
              ...profileData,
              profile: {
                ...profileData.profile,
                imageUrl: finalImageUrl
              }
            });
            alert('✅ 기존 프로필 이미지에 제품이 합성되었습니다.');
          } else {
            console.warn('⚠️ 제품 합성 응답에 이미지가 없습니다:', composeResult);
            alert('제품 합성은 완료되었지만 결과 이미지를 가져올 수 없습니다.');
          }
        } catch (composeError: any) {
          console.error('❌ 제품 합성 예외 발생:', composeError);
          alert(`제품 합성 중 오류가 발생했습니다: ${composeError.message || '알 수 없는 오류'}`);
        } finally {
          setIsComposingProduct(prev => ({ ...prev, profile: false }));
          setIsGeneratingProfile(false);
        }
        return; // 제품 합성만 수행한 경우 여기서 종료
      }
      
      // ✅ 기존 로직: 새 이미지 생성 → 제품 합성 (필요한 경우)
      const result = await onGenerateImage('profile', promptToUse);
      if (result.imageUrls.length > 0) {
        let finalImageUrl = result.imageUrls[0];
        
        // ✅ 제품 합성 활성화 시 제품 합성 수행
        if (enableProductComposition.profile && selectedProductId.profile) {
          setIsComposingProduct(prev => ({ ...prev, profile: true }));
          try {
            const selectedProduct = products.find(p => p.id === selectedProductId.profile);
            if (!selectedProduct) {
              console.error('❌ 선택한 제품을 찾을 수 없습니다:', selectedProductId.profile);
              alert('선택한 제품을 찾을 수 없습니다. 제품을 다시 선택해주세요.');
              return;
            }

            const compositionTarget = getCompositionTarget(selectedProductId.profile, 'profile');
            
            console.log('🎨 프로필 이미지 제품 합성 시작:', {
              productId: selectedProductId.profile,
              productName: selectedProduct.name,
              productCategory: selectedProduct.category,
              compositionTarget,
              modelImageUrl: finalImageUrl
            });
            
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
              baseImageUrl = `${supabaseUrl}/storage/v1/object/public/blog-images/originals/daily-branding/kakao/${dateStr}/${accountFolder}/profile/kakao-${accountFolder}-profile-${Date.now()}.jpg`;
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
                baseImageUrl = `${supabaseUrl}/storage/v1/object/public/blog-images/originals/daily-branding/kakao/${dateStr}/${accountFolder}/profile/kakao-${accountFolder}-profile-${Date.now()}.jpg`;
              }
            }
            
            // ✅ 타임아웃 처리를 위한 AbortController 추가 (5분 30초)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 330000); // 5분 30초
            
            try {
              const composeResponse = await fetch('/api/compose-product-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  modelImageUrl: finalImageUrl,
                  productId: selectedProductId.profile,
                  compositionTarget: compositionTarget,
                  compositionMethod: 'nano-banana-pro',
                  compositionBackground: 'natural', // 배경 유지 명시
                  baseImageUrl: baseImageUrl, // ✅ 명확한 경로 전달
                  prompt: promptToUse, // ✅ 프롬프트 전달 (피드와 동일)
                  imageType: 'profile' // ✅ 프로필 이미지 타입 명시 (클로즈업 지시사항 적용)
                }),
                signal: controller.signal
              });
              
              clearTimeout(timeoutId);
              
              if (!composeResponse.ok) {
                // ✅ 타임아웃 오류 구체적인 메시지 표시
                const errorData = await composeResponse.json().catch(() => ({ 
                  error: `서버 오류 (${composeResponse.status})` 
                }));
                
                let errorMessage = errorData.error || errorData.message || '서버 오류가 발생했습니다.';
                if (composeResponse.status === 504) {
                  errorMessage = '제품 합성 처리 시간이 초과되었습니다. FAL AI 큐 대기 시간이 길어서 발생할 수 있습니다.';
                } else if (composeResponse.status === 408) {
                  errorMessage = '제품 합성 요청 시간이 초과되었습니다.';
                }
                
                console.error('❌ 제품 합성 API 실패:', {
                  status: composeResponse.status,
                  statusText: composeResponse.statusText,
                  error: errorData
                });
                alert(`제품 합성 실패: ${errorMessage}\n\n원본 이미지를 사용합니다.`);
                // 원본 이미지 사용 (finalImageUrl은 이미 설정됨)
              } else {
                const composeResult = await composeResponse.json();
                
                // ✅ AI 이미지 생성기와 동일한 방식으로 수정
                if (composeResult.success && composeResult.images && composeResult.images.length > 0) {
                  finalImageUrl = composeResult.images[0].imageUrl;
                  console.log('✅ 프로필 이미지 제품 합성 완료:', {
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
              clearTimeout(timeoutId);
              
              // ✅ AbortError (타임아웃) 처리
              if (composeError.name === 'AbortError') {
                console.warn('⚠️ 제품 합성 타임아웃 (5분 30초 초과), 원본 이미지 사용');
                alert('제품 합성 처리 시간이 초과되었습니다.\n\nFAL AI 큐 대기 시간이 길어서 발생할 수 있습니다.\n원본 이미지를 사용합니다.');
              } else {
                console.error('제품 합성 실패, 원본 이미지 사용:', composeError);
                alert(`제품 합성 중 오류가 발생했습니다: ${composeError.message || '알 수 없는 오류'}\n원본 이미지를 사용합니다.`);
              }
              // 합성 실패해도 원본 이미지는 사용
            } finally {
              setIsComposingProduct(prev => ({ ...prev, profile: false }));
            }
          } catch (composeError: any) {
            console.error('❌ 제품 합성 예외 발생:', composeError);
            alert(`제품 합성 중 오류가 발생했습니다: ${composeError.message || '알 수 없는 오류'}`);
          } finally {
            setIsComposingProduct(prev => ({ ...prev, profile: false }));
          }
        }
        
        onUpdate({
          ...profileData,
          profile: {
            ...profileData.profile,
            imageUrl: finalImageUrl,
            prompt: result.generatedPrompt || promptToUse || profileData.profile.prompt // ✅ 생성된 프롬프트 또는 재생성된 프롬프트 저장
          }
        });
      }
    } catch (error: any) {
      alert(`프로필 이미지 생성 실패: ${error.message}`);
    } finally {
      setIsGeneratingProfile(false);
    }
  };

  // 이미지 자동 복구 함수 (갤러리에서 해당 날짜 이미지 찾기)
  const handleAutoRecoverImage = async (type: 'background' | 'profile') => {
    // ✅ 배포 완료 상태면 자동 복구 차단
    if (publishStatus === 'published') {
      console.info(`ℹ️ ${type} 이미지 자동 복구 차단: 배포 완료 상태에서는 이미지가 고정됩니다.`);
      return;
    }

    // ✅ 중복 호출 방지
    if (isRecoveringRef.current[type]) {
      console.log(`ℹ️ ${type} 이미지 복구 이미 진행 중, 중복 호출 무시`);
      return;
    }

    if (!selectedDate || !accountKey) {
      console.warn('날짜 또는 계정 정보가 없어 자동 복구를 수행할 수 없습니다.');
      return;
    }

    try {
      isRecoveringRef.current[type] = true; // ✅ 플래그 설정
      setIsRecoveringImage(prev => ({ ...prev, [type]: true }));

      // 갤러리에서 해당 날짜의 이미지 조회
      const response = await fetch(
        `/api/kakao-content/fetch-gallery-images-by-date?date=${selectedDate}&account=${accountKey}&type=${type}`
      );

      if (!response.ok) {
        throw new Error('갤러리 이미지 조회 실패');
      }

      const data = await response.json();
      
      if (data.success && data.images && data.images.length > 0) {
        // 첫 번째 이미지 사용 (가장 최근 생성된 이미지)
        const recoveredImageUrl = data.images[0].url;
        
        onUpdate({
          ...profileData,
          [type]: {
            ...profileData[type],
            imageUrl: recoveredImageUrl
          }
        });

        console.log(`✅ ${type} 이미지 자동 복구 완료:`, recoveredImageUrl);
        // ✅ alert는 한 번만 표시 (중복 방지)
        if (!alertShownRef.current) {
          alertShownRef.current = true;
          alert(`✅ ${type === 'background' ? '배경' : '프로필'} 이미지가 갤러리에서 자동으로 복구되었습니다.`);
          // 1초 후 플래그 리셋 (다음 복구 시 다시 표시 가능)
          setTimeout(() => {
            alertShownRef.current = false;
          }, 1000);
        }
      } else {
        console.warn(`⚠️ 갤러리에서 ${type} 이미지를 찾을 수 없습니다.`);
        // ✅ alert는 한 번만 표시
        if (!alertShownRef.current) {
          alertShownRef.current = true;
          alert(`⚠️ 갤러리에서 ${type === 'background' ? '배경' : '프로필'} 이미지를 찾을 수 없습니다.`);
          setTimeout(() => {
            alertShownRef.current = false;
          }, 1000);
        }
      }
    } catch (error: any) {
      console.error(`❌ ${type} 이미지 자동 복구 실패:`, error);
      // ✅ alert는 한 번만 표시
      if (!alertShownRef.current) {
        alertShownRef.current = true;
        alert(`이미지 자동 복구 실패: ${error.message}`);
        setTimeout(() => {
          alertShownRef.current = false;
        }, 1000);
      }
    } finally {
      isRecoveringRef.current[type] = false; // ✅ 플래그 해제
      setIsRecoveringImage(prev => ({ ...prev, [type]: false }));
    }
  };

  // 이미지 에러 핸들러
  const handleImageError = async (type: 'background' | 'profile', event: React.SyntheticEvent<HTMLImageElement>) => {
    // ✅ 배포 완료 상태면 자동 복구 차단
    if (publishStatus === 'published') {
      console.info(`ℹ️ ${type} 이미지 로드 실패: 배포 완료 상태에서는 자동 복구하지 않습니다.`);
      return;
    }

    // ✅ 이미 복구 중이면 무시
    if (isRecoveringRef.current[type]) {
      console.log(`ℹ️ ${type} 이미지 복구 이미 진행 중, 에러 핸들러 무시`);
      return;
    }

    const img = event.currentTarget;
    console.info(`ℹ️ ${type} 이미지 로드 실패, 자동 복구 시도 중:`, img.src);
    
    // 이미지 URL을 즉시 undefined로 설정하여 표시 제거 (캐시된 이미지 방지)
    if (type === 'background') {
      onUpdate({
        ...profileData,
        background: {
          ...profileData.background,
          imageUrl: undefined
        }
      });
    } else {
      onUpdate({
        ...profileData,
        profile: {
          ...profileData.profile,
          imageUrl: undefined
        }
      });
    }
    
    // 자동 복구 시도
    await handleAutoRecoverImage(type);
  };

  // basePrompt 자동 생성
  const handleGenerateBasePrompt = async (type: 'background' | 'profile') => {
    try {
      setIsGeneratingBasePrompt({ ...isGeneratingBasePrompt, [type]: true });
      
      const weeklyTheme = calendarData?.profileContent?.[accountKey || 'account1']?.weeklyThemes?.week1 || 
                          '비거리의 감성 – 스윙과 마음의 연결';
      
      const response = await fetch('/api/kakao-content/generate-base-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate || new Date().toISOString().split('T')[0],
          accountType: accountKey || (account.tone === 'gold' ? 'account1' : 'account2'),
          type: type,
          weeklyTheme: weeklyTheme
        })
      });

      const data = await response.json();
      if (data.success && data.basePrompt) {
        setEditingBasePrompt({ type, value: data.basePrompt });
        
        // 부모 컴포넌트에 basePrompt 저장 요청
        if (onBasePromptUpdate) {
          onBasePromptUpdate(type, data.basePrompt);
        }
      } else {
        throw new Error(data.message || 'basePrompt 생성 실패');
      }
    } catch (error: any) {
      alert(`basePrompt 생성 실패: ${error.message}`);
    } finally {
      setIsGeneratingBasePrompt({ ...isGeneratingBasePrompt, [type]: false });
    }
  };

  // basePrompt 저장
  const handleSaveBasePrompt = async (type: 'background' | 'profile') => {
    if (!editingBasePrompt.value.trim()) {
      alert('basePrompt를 입력해주세요.');
      return;
    }

    // 부모 컴포넌트에 basePrompt 저장 요청
    if (onBasePromptUpdate) {
      onBasePromptUpdate(type, editingBasePrompt.value);
    }
    
    setEditingBasePrompt({ type: null, value: '' });
    alert('✅ basePrompt가 저장되었습니다.');
  };


  // 프롬프트 재생성 함수 (프롬프트 재생성 + 이미지 자동 재생성)
  const handleRegeneratePrompt = async (type: 'background' | 'profile') => {
    try {
      setIsRegeneratingPrompt(type);
      
      // calendarData에서 basePrompt 가져오기
      let basePrompt: string | undefined;
      if (calendarData && accountKey) {
        const targetDate = selectedDate || new Date().toISOString().split('T')[0];
        const accountData = calendarData.profileContent?.[accountKey];
        const schedule = accountData?.dailySchedule?.find((s: any) => s.date === targetDate);
        
        if (schedule) {
          basePrompt = type === 'background' 
            ? schedule.background?.basePrompt || schedule.background?.image
            : schedule.profile?.basePrompt || schedule.profile?.image;
        }
      }
      
      if (!basePrompt) {
        // basePrompt가 없으면 현재 프롬프트의 첫 부분 사용 (한글 설명 추출)
        basePrompt = type === 'background' 
          ? profileData.background.image
          : profileData.profile.image;
      }

      if (!basePrompt) {
        alert('기본 프롬프트를 찾을 수 없습니다.');
        return;
      }

      // 프롬프트 재생성 API 호출
      const promptResponse = await fetch('/api/kakao-content/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: basePrompt,
          accountType: accountKey || (account.tone === 'gold' ? 'account1' : 'account2'),
          type: type,
          brandStrategy: {
            customerpersona: account.tone === 'gold' ? 'senior_fitting' : 'tech_enthusiast',
            customerChannel: 'local_customers',
            brandWeight: account.tone === 'gold' ? '높음' : '중간',
            audienceTemperature: 'warm'
          },
          weeklyTheme: '비거리의 감성 – 스윙과 마음의 연결',
          date: new Date().toISOString().split('T')[0]
        })
      });

      const promptData = await promptResponse.json();
      if (!promptData.success) {
        throw new Error(promptData.message || '프롬프트 재생성 실패');
      }

      const newPrompt = promptData.prompt;

      // 새 프롬프트로 이미지 재생성
      const result = await onGenerateImage(type, newPrompt);
      if (result.imageUrls.length > 0) {
        onUpdate({
          ...profileData,
          [type]: {
            ...profileData[type],
            prompt: newPrompt, // 새 프롬프트 저장
            imageUrl: result.imageUrls[0] // 새 이미지 저장
          }
        });
        alert('✅ 프롬프트와 이미지가 재생성되었습니다.');
      }
    } catch (error: any) {
      alert(`프롬프트 재생성 실패: ${error.message}`);
    } finally {
      setIsRegeneratingPrompt(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* 배경 이미지 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          배경 이미지
        </label>
        <div className="space-y-2">
          {/* Base Prompt 섹션 */}
          <div className="bg-gray-50 p-2 rounded text-xs">
            <div className="flex items-center justify-between mb-1">
              <strong className="text-gray-700">Base Prompt (요일별 템플릿):</strong>
              {editingBasePrompt.type === 'background' ? (
                <div className="flex gap-1">
                  <button
                    onClick={() => handleSaveBasePrompt('background')}
                    className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs"
                  >
                    💾 저장
                  </button>
                  <button
                    onClick={() => setEditingBasePrompt({ type: null, value: '' })}
                    className="px-2 py-1 bg-gray-400 hover:bg-gray-500 text-white rounded text-xs"
                  >
                    ❌ 취소
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleGenerateBasePrompt('background')}
                  disabled={isGeneratingBasePrompt.background || isGenerating}
                  className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs disabled:opacity-50"
                >
                  {isGeneratingBasePrompt.background ? '🔄 생성 중...' : '🔄 자동 생성'}
                </button>
              )}
            </div>
            {editingBasePrompt.type === 'background' ? (
              <textarea
                value={editingBasePrompt.value}
                onChange={(e) => setEditingBasePrompt({ type: 'background', value: e.target.value })}
                className="w-full p-1 border rounded text-xs"
                rows={2}
                placeholder="basePrompt를 입력하세요..."
              />
            ) : (
              <div className="text-gray-500 italic">
                {calendarData && accountKey && selectedDate ? (
                  (() => {
                    const schedule = calendarData.profileContent?.[accountKey]?.dailySchedule?.find((s: any) => s.date === selectedDate);
                    return schedule?.background?.basePrompt || 'basePrompt 없음';
                  })()
                ) : (
                  'basePrompt 없음'
                )}
              </div>
            )}
          </div>
          
          {/* 프롬프트 토글 */}
          <div className="text-xs text-gray-500 flex items-start justify-between gap-2">
            <div className="flex-1">
              <button
                onClick={() => setIsBackgroundPromptExpanded(!isBackgroundPromptExpanded)}
                className="flex items-center gap-1 font-medium hover:text-gray-700"
              >
                {isBackgroundPromptExpanded ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
                <strong>프롬프트:</strong>
              </button>
              {isBackgroundPromptExpanded && (
                <div className="mt-1 pl-5 break-words">{profileData.background.prompt}</div>
              )}
            </div>
            <button
              onClick={() => handleRegeneratePrompt('background')}
              disabled={isRegeneratingPrompt === 'background' || isGenerating}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              title="프롬프트 재생성 (새로운 로직 적용) + 이미지 자동 재생성"
            >
              {isRegeneratingPrompt === 'background' ? '🔄 재생성 중...' : '🔄 재생성'}
            </button>
          </div>
          
          {profileData.background.imageUrl && (
            <div className="mt-2 relative">
              <img 
                src={profileData.background.imageUrl} 
                alt="배경 이미지"
                className="w-full aspect-square object-cover rounded border border-gray-200"
                style={{ maxWidth: '400px' }}
                onError={handleImageError.bind(null, 'background')}
              />
              {isRecoveringImage.background && (
                <div className="absolute inset-0 bg-blue-100 bg-opacity-75 flex items-center justify-center rounded">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <div className="text-sm text-blue-700">갤러리에서 이미지 복구 중...</div>
                  </div>
                </div>
              )}
              {profileData.background.imageCount !== undefined && profileData.background.imageCount > 1 && profileData.background.imageCount !== 0 && (
                <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  이미지 {profileData.background.imageCount}개 중 1번째
                </div>
              )}
              <button
                onClick={() => {
                  // ✅ 배포 완료 상태면 차단
                  if (publishStatus === 'published') {
                    alert('배포 완료 상태에서는 이미지를 삭제할 수 없습니다. 배포 대기로 변경해주세요.');
                    return;
                  }
                  onUpdate({
                    ...profileData,
                    background: {
                      ...profileData.background,
                      imageUrl: undefined
                    }
                  });
                }}
                disabled={publishStatus === 'published'}
                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                title={publishStatus === 'published' ? '배포 완료 상태에서는 이미지를 삭제할 수 없습니다.' : '이미지 삭제'}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          
          {/* ✅ 제품 합성 옵션 */}
          <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="enable-product-composition-background"
                checked={enableProductComposition.background}
                onChange={(e) => {
                  setEnableProductComposition(prev => ({ ...prev, background: e.target.checked }));
                  if (!e.target.checked) {
                    setSelectedProductId(prev => ({ ...prev, background: undefined }));
                    setSelectedProductCategory(prev => ({ ...prev, background: undefined }));
                  }
                }}
                disabled={publishStatus === 'published'}
                className="w-4 h-4"
              />
              <label htmlFor="enable-product-composition-background" className="text-gray-700 font-medium">
                제품 합성 활성화
              </label>
            </div>
            {enableProductComposition.background && (
              <div className="space-y-2">
                <select
                  value={selectedProductCategory.background || ''}
                  onChange={(e) => {
                    setSelectedProductCategory(prev => ({ ...prev, background: e.target.value || undefined }));
                    setSelectedProductId(prev => ({ ...prev, background: undefined })); // 카테고리 변경 시 제품 선택 초기화
                  }}
                  disabled={publishStatus === 'published' || isLoadingProducts}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-white"
                >
                  <option value="">카테고리 선택...</option>
                  <option value="driver">드라이버</option>
                  <option value="hat">모자</option>
                  <option value="accessory">액세서리</option>
                </select>
                {selectedProductCategory.background && (
                  <select
                    value={selectedProductId.background || ''}
                    onChange={(e) => setSelectedProductId(prev => ({ ...prev, background: e.target.value || undefined }))}
                    disabled={publishStatus === 'published' || isLoadingProducts}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-white"
                  >
                    <option value="">제품 선택...</option>
                    {products
                      .filter((product) => product.category === selectedProductCategory.background)
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
                setShowBackgroundGallery(true);
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
                onClick={handleGenerateBackground}
                disabled={isGeneratingBackground || isGenerating || publishStatus === 'published' || isComposingProduct.background}
                className="flex items-center gap-2 px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm disabled:opacity-50"
                title={publishStatus === 'published' ? '배포 완료 상태에서는 이미지를 재생성할 수 없습니다.' : (profileData.background.imageUrl ? '이미지 재생성' : (account.tone === 'gold' ? '골드톤 이미지 생성' : '블랙톤 이미지 생성'))}
              >
                {isGeneratingBackground || isComposingProduct.background ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    {isComposingProduct.background ? '제품 합성 중...' : '생성 중...'}
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    {profileData.background.imageUrl 
                      ? (enableProductComposition.background && selectedProductId.background && selectedProductId.background.trim() !== '' 
                          ? '제품 합성' 
                          : '이미지 재생성')
                      : (account.tone === 'gold' ? '골드톤 이미지 생성' : '블랙톤 이미지 생성')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 프로필 이미지 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          프로필 이미지
        </label>
        <div className="space-y-2">
          {/* Base Prompt 섹션 */}
          <div className="bg-gray-50 p-2 rounded text-xs">
            <div className="flex items-center justify-between mb-1">
              <strong className="text-gray-700">Base Prompt (요일별 템플릿):</strong>
              {editingBasePrompt.type === 'profile' ? (
                <div className="flex gap-1">
                  <button
                    onClick={() => handleSaveBasePrompt('profile')}
                    className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs"
                  >
                    💾 저장
                  </button>
                  <button
                    onClick={() => setEditingBasePrompt({ type: null, value: '' })}
                    className="px-2 py-1 bg-gray-400 hover:bg-gray-500 text-white rounded text-xs"
                  >
                    ❌ 취소
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleGenerateBasePrompt('profile')}
                  disabled={isGeneratingBasePrompt.profile || isGenerating}
                  className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs disabled:opacity-50"
                >
                  {isGeneratingBasePrompt.profile ? '🔄 생성 중...' : '🔄 자동 생성'}
                </button>
              )}
            </div>
            {editingBasePrompt.type === 'profile' ? (
              <textarea
                value={editingBasePrompt.value}
                onChange={(e) => setEditingBasePrompt({ type: 'profile', value: e.target.value })}
                className="w-full p-1 border rounded text-xs"
                rows={2}
                placeholder="basePrompt를 입력하세요..."
              />
            ) : (
              <div className="text-gray-500 italic">
                {calendarData && accountKey && selectedDate ? (
                  (() => {
                    const schedule = calendarData.profileContent?.[accountKey]?.dailySchedule?.find((s: any) => s.date === selectedDate);
                    return schedule?.profile?.basePrompt || 'basePrompt 없음';
                  })()
                ) : (
                  'basePrompt 없음'
                )}
              </div>
            )}
          </div>
          
          {/* 프롬프트 토글 */}
          <div className="text-xs text-gray-500 flex items-start justify-between gap-2">
            <div className="flex-1">
              <button
                onClick={() => setIsProfilePromptExpanded(!isProfilePromptExpanded)}
                className="flex items-center gap-1 font-medium hover:text-gray-700"
              >
                {isProfilePromptExpanded ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
                <strong>프롬프트:</strong>
              </button>
              {isProfilePromptExpanded && (
                <div className="mt-1 pl-5 break-words">{profileData.profile.prompt}</div>
              )}
            </div>
            <button
              onClick={() => handleRegeneratePrompt('profile')}
              disabled={isRegeneratingPrompt === 'profile' || isGenerating}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              title="프롬프트 재생성 (새로운 로직 적용) + 이미지 자동 재생성"
            >
              {isRegeneratingPrompt === 'profile' ? '🔄 재생성 중...' : '🔄 재생성'}
            </button>
          </div>
          
          {profileData.profile.imageUrl && (
            <div className="mt-2 relative inline-block">
              <img 
                src={profileData.profile.imageUrl} 
                alt="프로필 이미지"
                className="w-24 h-24 object-cover rounded-full"
                onError={handleImageError.bind(null, 'profile')}
              />
              {isRecoveringImage.profile && (
                <div className="absolute inset-0 bg-blue-100 bg-opacity-75 flex items-center justify-center rounded-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-1"></div>
                    <div className="text-xs text-blue-700">복구 중...</div>
                  </div>
                </div>
              )}
              {profileData.profile.imageCount !== undefined && profileData.profile.imageCount > 1 && profileData.profile.imageCount !== 0 && (
                <div className="absolute top-0 left-0 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded">
                  {profileData.profile.imageCount}개
                </div>
              )}
              <button
                onClick={() => {
                  // ✅ 배포 완료 상태면 차단
                  if (publishStatus === 'published') {
                    alert('배포 완료 상태에서는 이미지를 삭제할 수 없습니다. 배포 대기로 변경해주세요.');
                    return;
                  }
                  onUpdate({
                    ...profileData,
                    profile: {
                      ...profileData.profile,
                      imageUrl: undefined
                    }
                  });
                }}
                disabled={publishStatus === 'published'}
                className="absolute top-0 right-0 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                title={publishStatus === 'published' ? '배포 완료 상태에서는 이미지를 삭제할 수 없습니다.' : '이미지 삭제'}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          
          {/* ✅ 제품 합성 옵션 */}
          <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="enable-product-composition-profile"
                checked={enableProductComposition.profile}
                onChange={(e) => {
                  setEnableProductComposition(prev => ({ ...prev, profile: e.target.checked }));
                  if (!e.target.checked) {
                    setSelectedProductId(prev => ({ ...prev, profile: undefined }));
                    setSelectedProductCategory(prev => ({ ...prev, profile: undefined }));
                  }
                }}
                disabled={publishStatus === 'published'}
                className="w-4 h-4"
              />
              <label htmlFor="enable-product-composition-profile" className="text-gray-700 font-medium">
                제품 합성 활성화
              </label>
            </div>
            {enableProductComposition.profile && (
              <div className="space-y-2">
                <select
                  value={selectedProductCategory.profile || ''}
                  onChange={(e) => {
                    setSelectedProductCategory(prev => ({ ...prev, profile: e.target.value || undefined }));
                    setSelectedProductId(prev => ({ ...prev, profile: undefined })); // 카테고리 변경 시 제품 선택 초기화
                  }}
                  disabled={publishStatus === 'published' || isLoadingProducts}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-white"
                >
                  <option value="">카테고리 선택...</option>
                  <option value="driver">드라이버</option>
                  <option value="hat">모자</option>
                  <option value="accessory">액세서리</option>
                </select>
                {selectedProductCategory.profile && (
                  <select
                    value={selectedProductId.profile || ''}
                    onChange={(e) => setSelectedProductId(prev => ({ ...prev, profile: e.target.value || undefined }))}
                    disabled={publishStatus === 'published' || isLoadingProducts}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-white"
                  >
                    <option value="">제품 선택...</option>
                    {products
                      .filter((product) => product.category === selectedProductCategory.profile)
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
                setShowProfileGallery(true);
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
                onClick={() => handleGenerateProfile(false)}
                disabled={isGeneratingProfile || isGenerating || publishStatus === 'published' || isComposingProduct.profile}
                className="flex items-center gap-2 px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm disabled:opacity-50"
                title={publishStatus === 'published' 
                  ? '배포 완료 상태에서는 이미지를 재생성할 수 없습니다.' 
                  : profileData.profile.imageUrl 
                    ? (enableProductComposition.profile && selectedProductId.profile
                        ? '기존 이미지에 제품 합성'
                        : '이미지 재생성')
                    : (account.tone === 'gold' ? '골드톤 이미지 생성' : '블랙톤 이미지 생성')}
              >
                {isGeneratingProfile || isComposingProduct.profile ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    {isComposingProduct.profile ? '제품 합성 중...' : '생성 중...'}
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    {profileData.profile.imageUrl 
                      ? (enableProductComposition.profile && selectedProductId.profile && selectedProductId.profile.trim() !== '' 
                          ? '제품 합성' 
                          : '이미지 재생성')
                      : (account.tone === 'gold' ? '골드톤 이미지 생성' : '블랙톤 이미지 생성')}
                  </>
                )}
              </button>
              {/* ✅ 프롬프트 재생성 옵션 (이미지가 있을 때만 표시) - 피드와 동일 */}
              {profileData.profile.imageUrl && profileData.profile.prompt && (
                <button
                  onClick={() => handleGenerateProfile(true)}
                  disabled={isRegeneratingPrompt === 'profile' || isGeneratingProfile || isGenerating || publishStatus === 'published'}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  title="프롬프트 재생성 + 이미지 재생성 (제품 합성 포함)"
                >
                  {isRegeneratingPrompt === 'profile' ? (
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
            </div>
          </div>
        </div>
      </div>

      {/* 메시지 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700" htmlFor={`profile-message-${accountKey || 'default'}`}>
            프로필 메시지
          </label>
          {accountKey && calendarData && (
            <button
              onClick={() => setShowMessageList(true)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
              title="저장된 메시지 목록에서 선택"
            >
              <List className="w-3 h-3" />
              목록에서 선택
            </button>
          )}
        </div>
        <textarea
          id={`profile-message-${accountKey || 'default'}`}
          value={profileData.message}
          onChange={(e) => onUpdate({ ...profileData, message: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={2}
          placeholder="짧고 명확한 헤드라인 + 한 문장 철학형"
        />
        <div className="text-xs text-gray-500 mt-1">
          {profileData.message.length}자
        </div>
      </div>

      {/* 갤러리 모달 */}
      <GalleryPicker
        isOpen={showBackgroundGallery}
        onSelect={(imageUrl) => {
          // ✅ 배포 완료 상태면 차단
          if (publishStatus === 'published') {
            alert('배포 완료 상태에서는 이미지를 변경할 수 없습니다. 배포 대기로 변경해주세요.');
            setShowBackgroundGallery(false);
            return;
          }

          // 프롬프트가 없으면 기본값 설정
          const currentPrompt = profileData.background.prompt || profileData.background.image || '';
          
          onUpdate({
            ...profileData,
            background: {
              ...profileData.background,
              imageUrl,
              // 프롬프트가 비어있으면 경고용 메시지 설정 (하지만 업데이트는 진행)
              prompt: currentPrompt || '프롬프트를 입력해주세요'
            }
          });
          setShowBackgroundGallery(false);
          
          // 프롬프트가 없으면 경고 메시지 (비동기로 표시하여 모달이 닫힌 후 표시)
          if (!currentPrompt) {
            setTimeout(() => {
              alert('⚠️ 프롬프트가 없습니다.\n\n나중에 AI 이미지 재생성을 하려면 프롬프트를 입력해주세요.');
            }, 300);
          }
        }}
        onClose={() => {
          setShowBackgroundGallery(false);
          // ✅ 갤러리 닫기 후 이미지 개수 재조회
          if (selectedDate && accountKey) {
            fetch(`/api/kakao-content/fetch-gallery-images-by-date?date=${selectedDate}&account=${accountKey}&type=background`)
              .then(res => res.json())
              .then(data => {
                if (data.success && data.count !== undefined) {
                  // ✅ 이미지가 0개일 때도 명시적으로 0으로 업데이트
                  onUpdate({
                    ...profileData,
                    background: {
                      ...profileData.background,
                      imageCount: data.count
                    }
                  });
                }
              })
              .catch(err => {
                console.error('이미지 개수 조회 실패:', err);
                // 오류 발생 시에도 imageCount를 0으로 설정하여 잘못된 표시 방지
                onUpdate({
                  ...profileData,
                  background: {
                    ...profileData.background,
                    imageCount: 0
                  }
                });
              });
          }
        }}
        autoFilterFolder={
          selectedDate && accountKey
            ? `originals/daily-branding/kakao/${selectedDate}/${accountKey}/background`
            : undefined
        }
        showCompareMode={true}
        maxCompareCount={3}
      />

      <GalleryPicker
        isOpen={showProfileGallery}
        onSelect={(imageUrl) => {
          // ✅ 배포 완료 상태면 차단
          if (publishStatus === 'published') {
            alert('배포 완료 상태에서는 이미지를 변경할 수 없습니다. 배포 대기로 변경해주세요.');
            setShowProfileGallery(false);
            return;
          }

          // 프롬프트가 없으면 기본값 설정
          const currentPrompt = profileData.profile.prompt || profileData.profile.image || '';
          
          onUpdate({
            ...profileData,
            profile: {
              ...profileData.profile,
              imageUrl,
              // 프롬프트가 비어있으면 경고용 메시지 설정 (하지만 업데이트는 진행)
              prompt: currentPrompt || '프롬프트를 입력해주세요'
            }
          });
          setShowProfileGallery(false);
          
          // 프롬프트가 없으면 경고 메시지 (비동기로 표시하여 모달이 닫힌 후 표시)
          if (!currentPrompt) {
            setTimeout(() => {
              alert('⚠️ 프롬프트가 없습니다.\n\n나중에 AI 이미지 재생성을 하려면 프롬프트를 입력해주세요.');
            }, 300);
          }
        }}
        onClose={() => {
          setShowProfileGallery(false);
          // ✅ 갤러리 닫기 후 이미지 개수 재조회
          if (selectedDate && accountKey) {
            fetch(`/api/kakao-content/fetch-gallery-images-by-date?date=${selectedDate}&account=${accountKey}&type=profile`)
              .then(res => res.json())
              .then(data => {
                if (data.success && data.count !== undefined) {
                  // ✅ 이미지가 0개일 때도 명시적으로 0으로 업데이트
                  onUpdate({
                    ...profileData,
                    profile: {
                      ...profileData.profile,
                      imageCount: data.count
                    }
                  });
                }
              })
              .catch(err => {
                console.error('이미지 개수 조회 실패:', err);
                // 오류 발생 시에도 imageCount를 0으로 설정하여 잘못된 표시 방지
                onUpdate({
                  ...profileData,
                  profile: {
                    ...profileData.profile,
                    imageCount: 0
                  }
                });
              });
          }
        }}
        autoFilterFolder={
          selectedDate && accountKey
            ? `originals/daily-branding/kakao/${selectedDate}/${accountKey}/profile`
            : undefined
        }
        showCompareMode={true}
        maxCompareCount={3}
      />

      {/* 메시지 목록 모달 */}
      {accountKey && calendarData && (
        <ProfileMessageList
          isOpen={showMessageList}
          onClose={() => setShowMessageList(false)}
          onSelect={(message) => {
            onUpdate({ ...profileData, message });
          }}
          account={accountKey}
          calendarData={calendarData}
          currentMessage={profileData.message}
        />
      )}
    </div>
  );
}

