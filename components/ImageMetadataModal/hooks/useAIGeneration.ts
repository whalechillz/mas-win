import { useState, useCallback } from 'react';
import { AIGenerationOptions, MetadataForm } from '../types/metadata.types';

// 텍스트 자르기 함수
const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  
  // 단어 단위로 자르기 시도
  const words = text.split(' ');
  let result = '';
  
  for (const word of words) {
    const testResult = result + (result ? ' ' : '') + word;
    if (testResult.length <= maxLength - 3) {
      result = testResult;
    } else {
      break;
    }
  }
  
  // 단어 단위로 자르기가 불가능하면 문자 단위로 자르기
  if (!result) {
    result = text.substring(0, maxLength - 3);
  }
  
  return result + '...';
};

interface AIGenerationResult {
  success: boolean;
  data?: Partial<MetadataForm>;
  error?: string;
}

export const useAIGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationHistory, setGenerationHistory] = useState<AIGenerationResult[]>([]);

  // 전체 메타데이터 AI 생성
  const generateAllMetadata = useCallback(async (
    imageUrl: string,
    options: AIGenerationOptions
  ): Promise<AIGenerationResult> => {
    setIsGenerating(true);
    
    try {
      console.log('🤖 전체 AI 메타데이터 생성 시작:', { imageUrl, options });
      
      const isEnglish = options.language === 'english';
      const language = isEnglish ? 'English' : 'Korean';
      
      // 모든 AI 요청을 병렬로 실행
      const [altResponse, keywordResponse, titleResponse, descResponse] = await Promise.allSettled([
        fetch('/api/analyze-image-prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            imageUrl,
            title: isEnglish ? 'Detailed image description' : '이미지 상세 설명',
            excerpt: isEnglish ? 'Describe the specific content of the image in detail (for ALT text). Please respond in English only.' : '이미지의 구체적인 내용을 상세히 설명 (ALT 텍스트용)'
          })
        }),
        fetch('/api/admin/image-ai-analyzer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            imageUrl,
            imageId: null
          })
        }),
        fetch('/api/analyze-image-prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            imageUrl,
            title: isEnglish ? 'Image title' : '이미지 제목',
            excerpt: isEnglish 
              ? 'Generate a catchy, SEO-friendly image title in English only. The title must be between 25-60 characters. Make it descriptive and engaging. Do not use Korean.' 
              : '이미지 제목을 생성하세요. 제목은 25-60자 사이여야 합니다. 간결하고 매력적이며 설명적인 제목을 작성하세요.'
          })
        }),
        fetch('/api/analyze-image-prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            imageUrl,
            title: isEnglish ? 'General image description' : '이미지 일반 설명',
            excerpt: isEnglish ? 'Generate general description or background information about the image. Please respond in English only.' : '이미지에 대한 일반적인 설명이나 배경 정보 생성'
          })
        })
      ]);

      // 결과 처리
      let altText = '';
      let keywords = '';
      let title = '';
      let description = '';

      if (altResponse.status === 'fulfilled' && altResponse.value.ok) {
        const data = await altResponse.value.json();
        altText = cleanAIText(data.prompt || '');
      }

      if (keywordResponse.status === 'fulfilled' && keywordResponse.value.ok) {
        const data = await keywordResponse.value.json();
        const tagNames = data.seoOptimizedTags?.map((tag: any) => tag.name) || data.tags || [];
        // 키워드를 5개로 제한 (SEO 최적화)
        const limitedKeywords = tagNames.slice(0, 5);
        keywords = limitedKeywords.join(', ');
      }

      if (titleResponse.status === 'fulfilled' && titleResponse.value.ok) {
        const data = await titleResponse.value.json();
        title = cleanAIText(data.prompt || '');
      }

      if (descResponse.status === 'fulfilled' && descResponse.value.ok) {
        const data = await descResponse.value.json();
        description = cleanAIText(data.prompt || '');
      }

      // 카테고리 자동 선택 (다중 선택)
      const selectedCategories = determineCategory(altText, keywords, title, description);

      // 제목 길이 검증 및 보완 (25-60자 범위)
      let finalTitle = cleanAIText(title);
      
      // 제목이 너무 짧으면 강제로 보완 (최소 25자 목표)
      if (finalTitle.length < 25) {
        if (finalTitle.length === 0) {
          // 제목이 비어있으면 키워드와 설명에서 생성
          const keywordsList = keywords.split(',').map(k => k.trim()).filter(k => k);
          const firstKeywords = keywordsList.slice(0, 2).join(' ');
          const descSnippet = description ? description.substring(0, 40).trim() : '';
          finalTitle = firstKeywords && descSnippet 
            ? `${firstKeywords} ${descSnippet}`.trim()
            : (firstKeywords || descSnippet || '골프 이미지');
        } else {
          // 제목이 있지만 짧으면 설명이나 키워드로 보완
          const keywordsList = keywords.split(',').map(k => k.trim()).filter(k => k);
          const additionalKeywords = keywordsList.slice(0, 2).join(', ');
          const descSnippet = description ? description.substring(0, 30).trim() : '';
          
          if (additionalKeywords) {
            finalTitle = `${finalTitle} - ${additionalKeywords}`.trim();
          } else if (descSnippet) {
            finalTitle = `${finalTitle} ${descSnippet}`.trim();
          } else {
            finalTitle = `${finalTitle} - 골프 전문 매장 MASSGOO`.trim();
          }
        }
        
        // 여전히 짧으면 추가 보완
        if (finalTitle.length < 25) {
          finalTitle = `${finalTitle} - 골프 전문 매장`.trim();
        }
      }
      
      // 최대 60자로 제한 (권장 범위 초과 방지)
      const processedTitle = finalTitle.length > 60 
        ? truncateText(finalTitle, 60)
        : finalTitle;

      const result: AIGenerationResult = {
        success: true,
        data: {
          alt_text: truncateText(description, 125), // ALT 텍스트를 125자로 제한
          keywords,
          title: processedTitle, // 제목을 25-60자 범위로 처리
          description: truncateText(altText, 160), // 설명을 160자로 제한
          category: selectedCategories.join(','),  // 하위 호환성: 문자열로 변환
          categories: selectedCategories  // 다중 선택용: 배열로 저장
        }
      };

      setGenerationHistory(prev => [...prev, result]);
      console.log('✅ 전체 AI 메타데이터 생성 완료:', result);
      
      return result;

    } catch (error) {
      console.error('❌ AI 생성 오류:', error);
      const result: AIGenerationResult = {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
      };
      setGenerationHistory(prev => [...prev, result]);
      return result;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // 개별 필드 AI 생성
  const generateField = useCallback(async (
    imageUrl: string,
    field: keyof MetadataForm,
    language: 'korean' | 'english' = 'korean'
  ): Promise<AIGenerationResult> => {
    setIsGenerating(true);
    
    try {
      const isEnglish = language === 'english';
      const prompts = getFieldPrompts(field, isEnglish);
      
      const response = await fetch('/api/analyze-image-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageUrl,
          title: prompts.title,
          excerpt: prompts.excerpt
        })
      });

      if (response.ok) {
        const data = await response.json();
        const cleanedText = cleanAIText(data.prompt || '');
        
        // 필드별 처리
        let resultData: Partial<MetadataForm> = {};
        
        if (field === 'category') {
          // 카테고리 필드는 여러 메타데이터를 활용하여 결정
          // 단일 필드 생성에서는 현재 필드 값만 사용할 수 없으므로, 
          // 전체 메타데이터 생성을 권장하거나 기본값 사용
          const selectedCategories = determineCategory(cleanedText, cleanedText, cleanedText, cleanedText);
          resultData = {
            category: selectedCategories.join(','),
            categories: selectedCategories
          };
        } else {
          // 필드별 길이 제한 적용
          let processedText = cleanedText;
          if (field === 'title') {
            // 제목은 25-60자 범위로 처리
            let titleText = cleanedText;
            
            // 제목이 너무 짧으면 강제로 보완
            if (titleText.length < 25) {
              if (titleText.length === 0) {
                titleText = '골프 전문 매장 이미지';
              } else {
                // 키워드나 설명이 있는지 확인하여 보완
                titleText = `${titleText} - 골프 전문 매장 MASSGOO`.trim();
                
                // 여전히 짧으면 추가 보완
                if (titleText.length < 25) {
                  titleText = `${titleText} 이미지`.trim();
                }
              }
            }
            
            processedText = truncateText(titleText, 60); // 최대 60자로 제한
          } else if (field === 'alt_text') {
            processedText = truncateText(cleanedText, 125);
          } else if (field === 'description') {
            processedText = truncateText(cleanedText, 160);
          }
          resultData = { [field]: processedText };
        }
        
        const result: AIGenerationResult = {
          success: true,
          data: resultData
        };
        
        setGenerationHistory(prev => [...prev, result]);
        return result;
      } else {
        throw new Error('API 요청 실패');
      }

    } catch (error) {
      console.error('❌ 필드 AI 생성 오류:', error);
      const result: AIGenerationResult = {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
      };
      setGenerationHistory(prev => [...prev, result]);
      return result;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    isGenerating,
    generationHistory,
    generateAllMetadata,
    generateField
  };
};

// AI 텍스트 정리 함수
const cleanAIText = (text: string): string => {
  return text
    .replace(/^\*\*Prompt:\*\*\s*/i, '')
    .replace(/^\*\*이미지 분석\*\*\s*/i, '')
    .replace(/^\*\*이미지 제목\*\*:\s*/i, '')
    .replace(/^\*\*제목\*\*:\s*/i, '')
    .replace(/^\*\*설명\*\*\s*/i, '')
    .replace(/^\*\*.*?\*\*\s*/i, '')
    .replace(/^이미지 분석\s*/i, '')
    .replace(/^분석\s*/i, '')
    .replace(/^이미지 제목\s*:\s*/i, '')
    .replace(/^제목\s*:\s*/i, '')
    .replace(/^이미지 설명\s*/i, '')
    .replace(/^설명\s*/i, '')
    .replace(/^이 이미지는\s*/i, '')
    .replace(/^이미지는\s*/i, '')
    .replace(/\*\*설명\*\*:.*$/i, '') // 제목에서 설명 부분 제거
    .replace(/설명:\s*.*$/i, '') // "설명:" 부분 제거
    .replace(/\s+/g, ' ') // 연속 공백 제거
    .replace(/^이\s*이미지는\s*/i, '')
    .replace(/^이\s*사진은\s*/i, '')
    .replace(/^사진은\s*/i, '')
    .replace(/\*\*설명\*\*:.*$/i, '')
    .trim();
};

// 카테고리 자동 결정 (다중 선택 지원)
const determineCategory = (altText: string, keywords: string, title: string, description: string): string[] => {
  const combinedText = `${altText} ${keywords} ${title} ${description}`.toLowerCase();
  const selectedCategories: string[] = [];
  
  // 골프코스 관련
  if (combinedText.includes('코스') || combinedText.includes('course') || combinedText.includes('골프장')) {
    selectedCategories.push('골프코스');
  }
  
  // 골퍼 연령대
  if (combinedText.includes('젊은') || combinedText.includes('young') || combinedText.includes('청년') || combinedText.includes('20대') || combinedText.includes('30대')) {
    selectedCategories.push('젊은 골퍼');
  }
  if (combinedText.includes('시니어') || combinedText.includes('senior') || combinedText.includes('50대') || combinedText.includes('60대') || combinedText.includes('중년')) {
    selectedCategories.push('시니어 골퍼');
  }
  
  // 스윙
  if (combinedText.includes('스윙') || combinedText.includes('swing') || combinedText.includes('타격') || combinedText.includes('연습')) {
    selectedCategories.push('스윙');
  }
  
  // 장비
  if (combinedText.includes('장비') || combinedText.includes('equipment') || combinedText.includes('클럽') || combinedText.includes('아이언')) {
    selectedCategories.push('장비');
  }
  
  // 드라이버
  if (combinedText.includes('드라이버') || combinedText.includes('driver')) {
    selectedCategories.push('드라이버');
  }
  
  // 드라이버샷 (드라이버 타격 장면)
  if ((combinedText.includes('드라이버') || combinedText.includes('driver')) && 
      (combinedText.includes('타격') || combinedText.includes('샷') || combinedText.includes('shot') || combinedText.includes('타구'))) {
    selectedCategories.push('드라이버샷');
  }
  
  // 기본값: 아무것도 매칭되지 않으면 빈 배열 반환 (또는 '기타' 추가 가능)
  return selectedCategories.length > 0 ? selectedCategories : [];
};

// 필드별 프롬프트 생성
const getFieldPrompts = (field: keyof MetadataForm, isEnglish: boolean) => {
  const prompts = {
    alt_text: {
      title: isEnglish ? 'Concise image description' : '이미지 간결 설명',
      excerpt: isEnglish ? 'Describe the image content concisely in 1-2 sentences (max 125 characters) for ALT text. Please respond in English only.' : '이미지 내용을 1-2문장으로 간결하게 설명 (최대 125자, ALT 텍스트용)'
    },
    title: {
      title: isEnglish ? 'Image title' : '이미지 제목',
      excerpt: isEnglish 
        ? 'Generate a catchy, SEO-friendly image title in English only. The title must be between 25-60 characters. Make it descriptive and engaging. Do not use Korean.' 
        : '이미지 제목을 생성하세요. 제목은 25-60자 사이여야 합니다. 간결하고 매력적이며 설명적인 제목을 작성하세요.'
    },
    description: {
      title: isEnglish ? 'General image description' : '이미지 일반 설명',
      excerpt: isEnglish ? 'Generate a detailed description of the image in English only. Maximum 160 characters. Do not use Korean.' : '이미지에 대한 일반적인 설명이나 배경 정보 생성'
    },
    keywords: {
      title: isEnglish ? 'Image keywords' : '이미지 키워드',
      excerpt: isEnglish ? 'Generate relevant keywords for the image. Please respond in English only.' : '이미지에 대한 관련 키워드 생성'
    },
    category: {
      title: isEnglish ? 'Image category' : '이미지 카테고리',
      excerpt: isEnglish ? 'Determine the appropriate category for the image. Please respond in English only.' : '이미지에 적합한 카테고리 결정'
    }
  };

  return prompts[field] || prompts.alt_text;
};
