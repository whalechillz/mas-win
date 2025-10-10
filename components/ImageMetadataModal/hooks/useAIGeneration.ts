import { useState, useCallback } from 'react';
import { AIGenerationOptions, MetadataForm } from '../types/metadata.types';

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
            excerpt: isEnglish ? 'Generate an image title. Please respond in English only.' : '이미지 제목 생성'
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
        keywords = tagNames.join(', ');
      }

      if (titleResponse.status === 'fulfilled' && titleResponse.value.ok) {
        const data = await titleResponse.value.json();
        title = cleanAIText(data.prompt || '');
      }

      if (descResponse.status === 'fulfilled' && descResponse.value.ok) {
        const data = await descResponse.value.json();
        description = cleanAIText(data.prompt || '');
      }

      // 카테고리 자동 선택
      const selectedCategory = determineCategory(altText, keywords, title, description);

      const result: AIGenerationResult = {
        success: true,
        data: {
          alt_text: description, // 설명을 ALT 텍스트로
          keywords,
          title,
          description: altText, // ALT 텍스트를 설명으로
          category: selectedCategory
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
        
        const result: AIGenerationResult = {
          success: true,
          data: { [field]: cleanedText }
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
    .replace(/^이\s*이미지는\s*/i, '')
    .replace(/^이\s*사진은\s*/i, '')
    .replace(/^사진은\s*/i, '')
    .replace(/\*\*설명\*\*:.*$/i, '')
    .trim();
};

// 카테고리 자동 결정
const determineCategory = (altText: string, keywords: string, title: string, description: string): string => {
  const combinedText = `${altText} ${keywords} ${title} ${description}`.toLowerCase();
  
  if (combinedText.includes('골프') || combinedText.includes('golf')) {
    return '골프';
  } else if (combinedText.includes('장비') || combinedText.includes('equipment') || combinedText.includes('클럽') || combinedText.includes('드라이버')) {
    return '장비';
  } else if (combinedText.includes('코스') || combinedText.includes('course') || combinedText.includes('골프장')) {
    return '코스';
  } else if (combinedText.includes('이벤트') || combinedText.includes('event') || combinedText.includes('대회')) {
    return '이벤트';
  } else {
    return '기타';
  }
};

// 필드별 프롬프트 생성
const getFieldPrompts = (field: keyof MetadataForm, isEnglish: boolean) => {
  const prompts = {
    alt_text: {
      title: isEnglish ? 'Detailed image description' : '이미지 상세 설명',
      excerpt: isEnglish ? 'Describe the specific content of the image in detail (for ALT text). Please respond in English only.' : '이미지의 구체적인 내용을 상세히 설명 (ALT 텍스트용)'
    },
    title: {
      title: isEnglish ? 'Image title' : '이미지 제목',
      excerpt: isEnglish ? 'Generate an image title. Please respond in English only.' : '이미지 제목 생성'
    },
    description: {
      title: isEnglish ? 'General image description' : '이미지 일반 설명',
      excerpt: isEnglish ? 'Generate general description or background information about the image. Please respond in English only.' : '이미지에 대한 일반적인 설명이나 배경 정보 생성'
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
