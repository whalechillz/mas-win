import { useState } from 'react';
import Head from 'next/head';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import AdminNav from '../../components/admin/AdminNav';
import ProductSelector from '../../components/admin/ProductSelector';
import Image from 'next/image';

interface ImageGenerationRequest {
  prompt: string;
  brandTone: 'senior_emotional' | 'high_tech_innovative';
  imageType: 'background' | 'profile' | 'feed';
  logoOption: 'logo' | 'full-brand' | 'none';
  imageCount: number;
  naturalStyle?: boolean; // 자연스러운 인물 사진 (no makeup, natural skin)
  useChatGPT?: boolean; // ChatGPT로 프롬프트 최적화
  enableProductComposition?: boolean; // 제품 합성 활성화
  selectedProductId?: string; // 선택된 제품 ID
  compositionMethod?: 'nano-banana-pro' | 'nano-banana'; // 합성 메서드
}

export default function AIImageGenerator() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<any[]>([]);
  const [optimizedPrompt, setOptimizedPrompt] = useState<string | null>(null); // 최적화된 프롬프트 저장
  const [compositionStatus, setCompositionStatus] = useState<string>(''); // 제품 합성 진행 상태
  const [formData, setFormData] = useState<ImageGenerationRequest>({
    prompt: '',
    brandTone: 'senior_emotional',
    imageType: 'feed',
    logoOption: 'full-brand',
    imageCount: 1,
    naturalStyle: true, // 기본값: 자연스러운 스타일
    useChatGPT: false, // 기본값: 직접 프롬프트 사용
    enableProductComposition: false, // 기본값: 제품 합성 비활성화
    selectedProductId: undefined,
    compositionMethod: 'nano-banana-pro', // 기본값: 나노바나나 프로
  });

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    router.push('/admin/login');
    return null;
  }

  // 한국 골퍼 스펙 (계절/요일 무관) - 강화된 한국인 외모 명시
  const koreanGolferSpec = `Korean professional fitter (Korean ethnicity, East Asian features, Korean facial structure, Korean skin tone, Korean hair, Korean eyes, Korean nose, Korean facial characteristics, 50-70 years old for senior emotional, 40-60 years old for high-tech innovative), authentic Korean appearance, natural Korean complexion, realistic Korean facial features, Korean professional golf attire appropriate for the brand tone, clearly Korean person, not Western or Caucasian, distinctly Asian Korean features`;

  // 브랜딩 톤별 프롬프트 가이드
  const brandToneGuides = {
    senior_emotional: {
      name: '시니어 중심 감성적 브랜딩',
      description: '골드 톤, 따뜻한 분위기, 감성적 메시지',
      colorScheme: 'warm gold tones, soft lighting, emotional atmosphere',
      mood: 'comfortable, warm, nostalgic, achievement, gratitude',
    },
    high_tech_innovative: {
      name: '하이테크 중심 혁신형 브랜딩',
      description: '블랙 톤, 현대적 분위기, 기술적 감성',
      colorScheme: 'cool blue-gray tones, modern lighting, technical atmosphere',
      mood: 'innovative, cutting-edge, professional, precision, excellence',
    },
  };

  // 계절/요일 무관 프롬프트 생성
  const buildUniversalPrompt = (userPrompt: string, tone: 'senior_emotional' | 'high_tech_innovative') => {
    const toneGuide = brandToneGuides[tone];
    
    const basePrompt = `${userPrompt}. 

**Korean Golfer Specifications (365 days applicable):**
${koreanGolferSpec}

**CRITICAL - Korean Appearance Requirements:**
- The person MUST be unmistakably Korean with distinct Korean/Asian facial features
- Korean eyes (monolid or double eyelid typical of Koreans), Korean nose structure, Korean facial bone structure
- Korean skin tone (typical Korean complexion, not Western or Caucasian)
- Korean hair (typical Korean hair texture and style)
- The person must NOT look Western, Caucasian, European, or non-Asian
- If showing a professional fitter, the fitter MUST be clearly Korean
- Korean ethnicity must be obvious and unmistakable in the image

**Brand Tone: ${toneGuide.name}**
- Color scheme: ${toneGuide.colorScheme}
- Mood: ${toneGuide.mood}
- Atmosphere: ${toneGuide.description}

**Universal Applicability (No seasonal/date restrictions):**
- Timeless, classic composition that works year-round
- Neutral seasonal elements (avoid specific seasonal markers)
- Professional, versatile setting
- Focus on core message and brand identity
- Suitable for any day of the week, any month, any season

**Image Quality:**
- Ultra-realistic, photorealistic, 8K resolution
- Professional commercial photography style
- Bright, well-lit natural lighting, professional composition
- High-end DSLR camera quality, 85mm lens
- Detailed textures, authentic Korean atmosphere
- Natural skin texture, authentic appearance, realistic human features

**Atmosphere and Expression:**
- Bright, positive, cheerful atmosphere
- Warm, genuine smile on the person's face
- Happy, friendly expression
- Well-lit scene that works year-round
- Timeless composition suitable for any day, any month, any season`;

    return basePrompt;
  };

  const handleGenerate = async () => {
    if (!formData.prompt.trim()) {
      alert('프롬프트를 입력해주세요.');
      return;
    }

    setLoading(true);
    setGeneratedImages([]);
    setOptimizedPrompt(null); // 최적화된 프롬프트 초기화

    try {
      let userPrompt = formData.prompt;
      let optimizedByChatGPT = false;

      // 로고 옵션이 활성화된 경우, 사용자 프롬프트에 로고 관련 내용이 없으면 추가
      if ((formData.logoOption === 'logo' || formData.logoOption === 'full-brand') && 
          !userPrompt.includes('MASSGOO') && 
          !userPrompt.includes('로고') && 
          !userPrompt.includes('브랜딩')) {
        userPrompt = `${userPrompt}, 피터가 모자를 쓰고 있고 모자와 옷에 MASSGOO 로고가 명확하게 보임, 스튜디오 벽면이나 아트월에 MASSGOO 브랜딩이 표시됨`;
      }

      // ChatGPT로 프롬프트 최적화 (선택)
      if (formData.useChatGPT) {
        try {
          console.log('🔄 ChatGPT 프롬프트 최적화 시작...');
          const chatGPTResponse = await fetch('/api/kakao-content/generate-prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: userPrompt,
              accountType: formData.brandTone === 'senior_emotional' ? 'account1' : 'account2',
              type: formData.imageType,
              useForImageGeneration: true, // 365일 통용 이미지 생성 (weeklyTheme, 날짜/계절 요소 제외)
              brandStrategy: {
                contentType: '골프 피팅',
                persona: formData.brandTone === 'senior_emotional' ? 'senior_golfer' : 'tech_enthusiast',
                brandStrength: 'high',
              },
            }),
          });

          if (chatGPTResponse.ok) {
            const chatGPTData = await chatGPTResponse.json();
            if (chatGPTData.prompt) {
              userPrompt = chatGPTData.prompt;
              optimizedByChatGPT = true;
              setOptimizedPrompt(userPrompt); // 최적화된 프롬프트 저장
              console.log('✅ ChatGPT 프롬프트 최적화 완료');
              console.log('📝 최적화된 프롬프트:', userPrompt);
            }
          }
        } catch (chatGPTError) {
          console.log('⚠️ ChatGPT 프롬프트 최적화 실패, 원본 프롬프트 사용:', chatGPTError);
        }
      }

      // 프롬프트 최적화
      const optimizedPrompt = buildUniversalPrompt(userPrompt, formData.brandTone);

      // 자연스러운 스타일 옵션 추가
      const naturalStyleSpec = formData.naturalStyle
        ? 'no makeup, natural skin, authentic appearance, realistic skin texture, natural complexion, documentary photography style, candid portrait, photojournalistic style, natural lighting, unretouched, authentic Korean appearance'
        : '';

      // 브랜딩 옵션에 따른 스펙 추가
      let brandSpec = '';
      if (formData.logoOption === 'logo') {
        brandSpec = 'MANDATORY: The person in the image MUST be wearing a cap or hat with the "MASSGOO" logo clearly visible and readable on the front of the cap. The person MUST be wearing clothing (polo shirt, jacket, or uniform) with the "MASSGOO" logo or branding clearly visible on the chest area or sleeve. If the scene includes a golf studio, store, or interior space, the "MASSGOO" logo or branding MUST be visible on the art wall, wall displays, interior walls, or architectural elements. The "MASSGOO" logo must appear in at least three locations: (1) on the cap/hat, (2) on the clothing, and (3) on the wall/art wall/background. Use "MASSGOO" (not "MASGOO") as the official brand name. The logo must be clearly visible, not blurred or obscured.';
      } else if (formData.logoOption === 'full-brand') {
        brandSpec = 'MANDATORY: The person in the image MUST be wearing a cap or hat with the "MASSGOO" logo clearly visible and readable on the front of the cap. The person MUST be wearing clothing (polo shirt, jacket, or uniform) with the "MASSGOO" logo or branding clearly visible on the chest area or sleeve. If the scene includes a golf studio, store, or interior space, the "MASSGOO" logo or branding MUST be prominently displayed on the art wall, wall displays, interior walls, storefronts, displays, or architectural elements. The "MASSGOO" brand name should be visible in multiple locations (at least 4-5 locations) naturally integrated throughout the scene: on the cap, on the clothing, on the walls, on displays, on equipment, etc. Use "MASSGOO" (not "MASGOO") as the official brand name. The logo must be clearly visible, not blurred or obscured.';
      } else {
        brandSpec = 'ABSOLUTELY NO "MASSGOO" branding, logo, text, or any brand elements whatsoever in the image. No logos on caps, hats, clothing, buildings, stores, structures, or any elements. The image must be completely brand-free.';
      }

      // 한국인 외모 강화 지시 추가
      const koreanAppearanceSpec = 'CRITICAL: The person in the image MUST be clearly Korean with distinct Korean/Asian features. The person must have Korean facial characteristics (Korean eyes, Korean nose, Korean facial structure), Korean skin tone, and Korean hair. The person must NOT look Western, Caucasian, or non-Asian. The person must be unmistakably Korean. If the image shows a professional fitter, the fitter must be Korean.';

      // 텍스트 제거 지시 추가 (시니어 중심 감성적 톤에서도 강화)
      // 로고 옵션이 'logo' 또는 'full-brand'인 경우, MASSGOO 로고는 허용하되 다른 텍스트는 제거
      let noTextSpec = '';
      if (formData.logoOption === 'logo' || formData.logoOption === 'full-brand') {
        // 로고는 허용하되 다른 텍스트는 제거 (시니어 중심 감성적 톤에서도 강화)
        noTextSpec = 'MANDATORY: The image must contain ABSOLUTELY NO text, NO letters, NO words, NO typography, NO written content, NO captions, NO subtitles, NO labels, NO signs, NO banners, NO text overlays, NO embedded text, NO floating text, NO text graphics, NO text elements, NO text decorations, NO text designs, NO text illustrations, NO numbers, NO data displays, NO screen text, NO tablet text, NO phone text, NO computer screen text EXCEPT for the "MASSGOO" brand logo and branding. The "MASSGOO" logo text is allowed and required, but all other text, numbers, and written content must be completely absent. Only visual elements and the MASSGOO brand logo, no other written language, no numbers, no data displays.';
      } else {
        // 브랜딩 없음: 모든 텍스트 제거
        noTextSpec = 'MANDATORY: The image must contain ABSOLUTELY NO text, NO letters, NO words, NO typography, NO written content, NO captions, NO subtitles, NO labels, NO signs, NO banners, NO text overlays, NO embedded text, NO floating text, NO text graphics, NO text elements, NO text decorations, NO text designs, NO text illustrations, NO numbers, NO data displays, NO screen text, NO tablet text, NO phone text, NO computer screen text. The image must be completely text-free and number-free. Only visual elements, no written language, no numbers, no data displays.';
      }

      const finalPrompt = `${optimizedPrompt}. ${brandSpec}. ${koreanAppearanceSpec}${naturalStyleSpec ? `. ${naturalStyleSpec}` : ''}. ${noTextSpec}`;

      // 최종 프롬프트 로깅 (디버깅용)
      console.log('📋 최종 프롬프트 생성 완료');
      console.log('🎨 브랜딩 톤:', formData.brandTone);
      console.log('🏷️ 로고 옵션:', formData.logoOption);
      console.log('🎭 자연스러운 스타일:', formData.naturalStyle);
      console.log('🤖 ChatGPT 최적화:', optimizedByChatGPT);
      console.log('📝 최종 프롬프트 길이:', finalPrompt.length, '자');
      if (optimizedByChatGPT) {
        console.log('💡 ChatGPT로 최적화된 프롬프트가 사용되었습니다.');
      }

      // 이미지 생성 API 호출
      const response = await fetch('/api/kakao-content/generate-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompts: [{ prompt: finalPrompt }],
          metadata: {
            account: formData.brandTone === 'senior_emotional' ? 'account1' : 'account2',
            type: formData.imageType,
            date: new Date().toISOString().split('T')[0],
          },
          logoOption: formData.logoOption,
          imageCount: formData.imageCount,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '이미지 생성에 실패했습니다.');
      }

      const result = await response.json();
      console.log('📦 API 응답:', result);
      console.log('🖼️ result.images:', result.images);
      console.log('📊 result.images 길이:', result.images?.length);
      
      const modelImages = result.images || [];
      console.log('✅ 추출된 modelImages:', modelImages);
      console.log('📊 modelImages 길이:', modelImages.length);

      if (modelImages.length === 0) {
        console.warn('⚠️ 경고: 생성된 이미지가 없습니다. API 응답:', result);
        alert('이미지가 생성되지 않았습니다. API 응답을 확인해주세요.');
      }

      // 제품 합성 활성화 시
      if (formData.enableProductComposition && formData.selectedProductId) {
        setCompositionStatus('제품 합성 준비 중...');
        
        const composedImages = [];
        
        for (let i = 0; i < modelImages.length; i++) {
          const modelImage = modelImages[i];
          const imageUrl = modelImage.url || modelImage;
          
          setCompositionStatus(`이미지 ${i + 1}/${modelImages.length} 제품 합성 중...`);
          
          try {
            const composeResponse = await fetch('/api/compose-product-image', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                modelImageUrl: imageUrl,
                productId: formData.selectedProductId,
                compositionMethod: formData.compositionMethod || 'nano-banana-pro',
                numImages: 1,
                resolution: '1K',
                aspectRatio: 'auto',
                outputFormat: 'png',
              }),
            });

            if (!composeResponse.ok) {
              const error = await composeResponse.json();
              console.error(`제품 합성 실패 (이미지 ${i + 1}):`, error);
              // 합성 실패해도 원본 이미지는 추가
              composedImages.push({
                ...modelImage,
                compositionError: error.error || '제품 합성 실패',
              });
              continue;
            }

            const composeResult = await composeResponse.json();
            
            if (composeResult.success && composeResult.images && composeResult.images.length > 0) {
              // 합성된 이미지 추가
              composedImages.push({
                url: composeResult.images[0].imageUrl,
                path: composeResult.images[0].path,
                originalUrl: composeResult.images[0].originalUrl,
                product: composeResult.product,
                metadata: composeResult.metadata,
                isComposed: true,
              });
              console.log(`✅ 이미지 ${i + 1} 제품 합성 완료:`, composeResult.product.name);
            } else {
              // 합성 실패해도 원본 이미지는 추가
              composedImages.push({
                ...modelImage,
                compositionError: '제품 합성 결과 없음',
              });
            }
          } catch (composeError: any) {
            console.error(`제품 합성 오류 (이미지 ${i + 1}):`, composeError);
            // 합성 실패해도 원본 이미지는 추가
            composedImages.push({
              ...modelImage,
              compositionError: composeError.message || '제품 합성 오류',
            });
          }
        }

        setCompositionStatus('');
        console.log('✅ 제품 합성 완료, composedImages:', composedImages);
        setGeneratedImages(composedImages);
      } else {
        // 제품 합성 비활성화 시 원본 이미지만 표시
        console.log('✅ 원본 이미지 설정, modelImages:', modelImages);
        setGeneratedImages(modelImages);
      }
      
      console.log('🎉 최종 generatedImages 상태:', modelImages.length > 0 || (formData.enableProductComposition && composedImages.length > 0) ? '이미지 있음' : '이미지 없음');
    } catch (error: any) {
      console.error('❌ 이미지 생성 오류:', error);
      console.error('❌ 에러 상세:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      alert(`이미지 생성 중 오류가 발생했습니다: ${error.message}`);
      // 에러 발생 시에도 상태 초기화
      setGeneratedImages([]);
    } finally {
      setLoading(false);
      setCompositionStatus('');
      console.log('🏁 이미지 생성 프로세스 완료');
    }
  };

  return (
    <>
      <Head>
        <title>AI 이미지 생성 - 관리자</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <AdminNav />

        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">AI 이미지 생성</h1>
            <p className="mt-2 text-sm text-gray-600">
              빠르고 간편하게 MASSGOO 브랜딩이 적용된 고품질 이미지를 생성하세요
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* 설정 패널 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">이미지 생성 설정</h2>

              <div className="space-y-6">
                {/* 프리셋 버튼 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    빠른 생성 프리셋
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          prompt: '한국인 전문 피터가 골프 스튜디오에서 스윙 데이터를 태블릿으로 분석하는 장면, 프리미엄 골프 클럽이 배경에 배치되어 있음, 고급스러운 골프 스튜디오 인테리어, 한국인 피터의 명확한 한국인 외모와 특징, 피터가 모자를 쓰고 있고 모자와 옷에 MASSGOO 로고가 명확하게 보임, 스튜디오 벽면이나 아트월에 MASSGOO 브랜딩이 표시됨',
                          brandTone: 'senior_emotional',
                          imageType: 'feed',
                          logoOption: 'full-brand',
                          imageCount: 1,
                          naturalStyle: true, // 자연스러운 스타일 기본값
                          useChatGPT: false, // ChatGPT 최적화는 선택사항
                        });
                      }}
                      className="w-full p-4 border-2 border-blue-500 bg-blue-50 rounded-lg text-left hover:bg-blue-100 transition-all"
                    >
                      <div className="font-semibold text-blue-900 mb-1">🎯 피팅 이미지 생성</div>
                      <div className="text-xs text-blue-700">
                        전문 피터 작업 장면 (시니어 중심 감성형, 전체 브랜딩)
                      </div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          prompt: '밝고 현대적인 시타장(피팅 스튜디오) 내부, 골프 시뮬레이터 대형 스크린이 배경에 보임, 스윙 분석 장비와 피팅 장비가 보임, 골프 클럽 랙에 프리미엄 골프 클럽이 배치되어 있음, 피팅 테이블과 전문 장비들이 보임, 밝은 자연광과 따뜻한 조명, 긍정적이고 친근한 분위기, 고급스러운 시타장 인테리어, 시타장 벽면이나 아트월에 MASSGOO 브랜딩이 명확하게 표시됨, 밝고 현대적인 분위기, 사람은 없고 시타장의 시설과 장비만 보임',
                          brandTone: 'senior_emotional',
                          imageType: 'background', // 히어로 섹션은 배경 이미지 타입이 더 적합
                          logoOption: 'full-brand',
                          imageCount: 1,
                          naturalStyle: true, // 자연스러운 스타일 기본값
                          useChatGPT: false, // ChatGPT 최적화는 선택사항
                        });
                      }}
                      className="w-full p-4 border-2 border-yellow-500 bg-yellow-50 rounded-lg text-left hover:bg-yellow-100 transition-all"
                    >
                      <div className="font-semibold text-yellow-900 mb-1">🌟 히어로 섹션 이미지 생성</div>
                      <div className="text-xs text-yellow-700">
                        밝고 긍정적인 히어로 배경 이미지 (가로형, 밝은 조명, 시타장 특징 포함, 사람 없음)
                      </div>
                    </button>
                  </div>
                </div>

                {/* 브랜딩 톤 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    브랜딩 톤 *
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, brandTone: 'senior_emotional' })}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        formData.brandTone === 'senior_emotional'
                          ? 'border-yellow-500 bg-yellow-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold text-gray-900">시니어 중심 감성적</div>
                      <div className="text-xs text-gray-600 mt-1">
                        골드 톤, 따뜻한 분위기
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, brandTone: 'high_tech_innovative' })}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        formData.brandTone === 'high_tech_innovative'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold text-gray-900">하이테크 중심 혁신형</div>
                      <div className="text-xs text-gray-600 mt-1">
                        블랙 톤, 현대적 분위기
                      </div>
                    </button>
                  </div>
                </div>

                {/* 이미지 타입 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이미지 타입 *
                  </label>
                  <select
                    value={formData.imageType}
                    onChange={(e) => setFormData({ ...formData, imageType: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="background">배경 이미지 (가로형)</option>
                    <option value="profile">프로필 이미지 (정사각형)</option>
                    <option value="feed">피드 이미지 (정사각형)</option>
                  </select>
                </div>

                {/* 브랜딩 옵션 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    브랜딩 옵션 *
                  </label>
                  <select
                    value={formData.logoOption}
                    onChange={(e) => setFormData({ ...formData, logoOption: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="full-brand">전체 브랜딩 (강조)</option>
                    <option value="logo">로고 포함</option>
                    <option value="none">브랜딩 없음</option>
                  </select>
                </div>

                {/* 생성 개수 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    생성 개수 *
                  </label>
                  <select
                    value={formData.imageCount}
                    onChange={(e) => setFormData({ ...formData, imageCount: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="1">1개</option>
                    <option value="2">2개</option>
                    <option value="4">4개</option>
                  </select>
                </div>

                {/* 자연스러운 스타일 옵션 */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex-1">
                    <label htmlFor="naturalStyle" className="block text-sm font-medium text-gray-700 mb-1">
                      자연스러운 인물 사진 (No Makeup)
                    </label>
                    <p className="text-xs text-gray-500">
                      자연스러운 피부, 메이크업 없는 인물 사진으로 생성
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      id="naturalStyle"
                      checked={formData.naturalStyle || false}
                      onChange={(e) => setFormData({ ...formData, naturalStyle: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* ChatGPT 프롬프트 최적화 옵션 */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex-1">
                    <label htmlFor="useChatGPT" className="block text-sm font-medium text-gray-700 mb-1">
                      ChatGPT로 프롬프트 최적화
                    </label>
                    <p className="text-xs text-gray-500">
                      ChatGPT를 사용하여 프롬프트를 영어로 최적화 (추가 시간 소요)
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      id="useChatGPT"
                      checked={formData.useChatGPT || false}
                      onChange={(e) => setFormData({ ...formData, useChatGPT: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* 제품 합성 활성화 옵션 */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex-1">
                    <label htmlFor="enableProductComposition" className="block text-sm font-medium text-gray-700 mb-1">
                      제품 합성 활성화
                    </label>
                    <p className="text-xs text-gray-500">
                      생성된 모델 이미지에 마쓰구 드라이버 제품을 자연스럽게 합성 (나노바나나 AI 사용)
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      id="enableProductComposition"
                      checked={formData.enableProductComposition || false}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        enableProductComposition: e.target.checked,
                        selectedProductId: e.target.checked ? formData.selectedProductId : undefined
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* 제품 선택 UI (제품 합성 활성화 시 표시) */}
                {formData.enableProductComposition && (
                  <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                    <ProductSelector
                      selectedProductId={formData.selectedProductId}
                      onSelect={(productId) => setFormData({ ...formData, selectedProductId: productId })}
                      showDescription={false}
                      layout="grid"
                    />
                    
                    {/* 합성 메서드 선택 */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        합성 메서드
                      </label>
                      <select
                        value={formData.compositionMethod || 'nano-banana-pro'}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          compositionMethod: e.target.value as 'nano-banana-pro' | 'nano-banana' 
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="nano-banana-pro">Nano Banana Pro (고품질, 추천)</option>
                        <option value="nano-banana">Nano Banana (빠른 처리)</option>
                      </select>
                      <p className="mt-1 text-xs text-gray-500">
                        💡 Nano Banana Pro는 더 정확하고 자연스러운 합성 결과를 제공합니다.
                      </p>
                    </div>
                  </div>
                )}

                {/* 프롬프트 입력 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이미지 설명 (프롬프트) *
                  </label>
                  <textarea
                    value={formData.prompt}
                    onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                    rows={6}
                    placeholder="예: 전문 피터가 골프 스튜디오에서 스윙 데이터를 분석하는 장면"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    💡 한국 골퍼 스펙과 브랜딩 톤은 자동으로 적용됩니다. 계절/요일 구애 없이 365일 사용 가능한 이미지로 생성됩니다.
                  </p>
                </div>

                {/* 생성 버튼 */}
                <button
                  onClick={handleGenerate}
                  disabled={loading || !formData.prompt.trim()}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? '이미지 생성 중...' : '이미지 생성하기'}
                </button>
              </div>
            </div>

            {/* 결과 패널 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">생성된 이미지</h2>

              {/* 최적화된 프롬프트 표시 (ChatGPT 사용 시) */}
              {optimizedPrompt && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-blue-900">🤖 ChatGPT 최적화된 프롬프트</h3>
                    <button
                      onClick={() => setOptimizedPrompt(null)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      닫기
                    </button>
                  </div>
                  <div className="text-xs text-gray-700 bg-white p-3 rounded border border-blue-200 max-h-40 overflow-y-auto">
                    {optimizedPrompt}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    💡 이 프롬프트는 ChatGPT로 최적화되었으며, 한국 골퍼 스펙, 브랜딩 톤, 자연스러운 스타일, 로고 지시가 추가로 적용됩니다.
                  </p>
                </div>
              )}

              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">
                      {compositionStatus || '이미지 생성 중...'}
                    </p>
                    {compositionStatus && (
                      <p className="mt-2 text-sm text-gray-500">
                        제품 합성은 약 10-30초 소요됩니다.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {!loading && generatedImages.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p>생성된 이미지가 없습니다.</p>
                  <p className="text-sm mt-2">왼쪽 설정을 입력하고 생성 버튼을 클릭하세요.</p>
                </div>
              )}

              {!loading && generatedImages.length > 0 && (
                <div className="space-y-4">
                  {generatedImages.map((image, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      <div className="relative aspect-square w-full">
                        <Image
                          src={image.url || image}
                          alt={`생성된 이미지 ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                              이미지 {index + 1}
                            </span>
                            {image.isComposed && (
                              <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                                제품 합성됨
                              </span>
                            )}
                            {image.compositionError && (
                              <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
                                합성 실패
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <a
                              href={image.url || image}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-700"
                            >
                              원본 보기
                            </a>
                            {image.path && (
                              <span className="text-xs text-gray-500">
                                저장됨
                              </span>
                            )}
                          </div>
                        </div>
                        {image.product && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                            <span className="font-semibold">합성 제품:</span> {image.product.displayName}
                          </div>
                        )}
                        {image.compositionError && (
                          <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                            오류: {image.compositionError}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 안내 섹션 */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">💡 사용 팁</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 한국 골퍼 스펙(50-70세, 한국인 외모)이 자동으로 적용됩니다</li>
              <li>• 계절/요일에 구애받지 않는 범용 이미지로 생성됩니다</li>
              <li>• 선택한 브랜딩 톤에 맞는 색상과 분위기가 자동 적용됩니다</li>
              <li>• MASSGOO 브랜딩은 선택한 옵션에 따라 자동으로 포함됩니다</li>
              <li>• 생성된 이미지는 Supabase에 자동 저장됩니다</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

