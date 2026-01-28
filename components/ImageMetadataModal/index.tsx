import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ImageMetadata, MetadataForm, FieldConfig } from './types/metadata.types';
import { FieldGroup } from './components/FieldGroup';
import { SEOScore } from './components/SEOScore';
import { useAIGeneration } from './hooks/useAIGeneration';
import { validateForm, calculateSEOScore, getSEORecommendations } from './utils/validation';
import { extractVideoMetadataClient } from '@/lib/video-utils';
import DocumentOCRViewer from '@/components/admin/DocumentOCRViewer';

interface ImageMetadataModalProps {
  isOpen: boolean;
  image: ImageMetadata | null;
  onClose: () => void;
  onSave: (metadata: MetadataForm, exifData?: {
    taken_at?: string;
    gps_lat?: number;
    gps_lng?: number;
    width?: number;
    height?: number;
    camera?: string;
    orientation?: number;
  } | null) => Promise<void>;
  onRename?: (newFilename: string) => Promise<void>;
  categories?: Array<{ id: number; name: string }>;
}

// 필드 설정
// 주의: category와 categories 필드는 제거되었으므로 Partial 타입 사용
const FIELD_CONFIGS: Partial<Record<keyof MetadataForm, FieldConfig>> = {
  alt_text: {
    label: 'ALT 텍스트',
    placeholder: '이미지를 설명하는 대체 텍스트를 입력하세요',
    type: 'text',
    maxLength: 200,
    aiEnabled: true,
    seoOptimized: true
  },
  keywords: {
    label: '키워드',
    placeholder: '쉼표로 구분하여 관련 키워드를 입력하세요',
    type: 'text',
    maxLength: 200,  // ✅ 키워드 길이 제한 증가 (50 → 200자, 카테고리 자동 추가 대응)
    aiEnabled: true,
    seoOptimized: true
  },
  title: {
    label: '제목',
    placeholder: '이미지의 제목을 입력하세요',
    type: 'text',
    maxLength: 100,
    aiEnabled: true,
    seoOptimized: true
  },
  description: {
    label: '설명',
    placeholder: '이미지 설명 (OCR 텍스트 포함 가능)',
    type: 'textarea',
    maxLength: 5000,  // ✅ OCR 텍스트 지원을 위해 최대 길이 증가 (300 → 5000자)
    aiEnabled: true,
    seoOptimized: true
  },
  // 카테고리 체크박스 제거 - 키워드 중심으로 전환
  // category: {
  //   label: '카테고리',
  //   placeholder: '카테고리 선택',
  //   type: 'checkbox',
  //   required: false,
  //   aiEnabled: true,
  //   options: [
  //     { value: '골프코스', label: '골프코스' },
  //     { value: '젊은 골퍼', label: '젊은 골퍼' },
  //     { value: '시니어 골퍼', label: '시니어 골퍼' },
  //     { value: '스윙', label: '스윙' },
  //     { value: '장비', label: '장비' },
  //     { value: '드라이버', label: '드라이버' },
  //     { value: '드라이버샷', label: '드라이버샷' }
  //   ]
  // },
  filename: {
    label: '파일명',
    placeholder: '파일명',
    type: 'text',
    maxLength: 100
  }
};

// 파일 타입 감지 함수 (이미지/동영상)
const getFileType = (fileName: string, url?: string): 'image' | 'video' => {
  const name = (fileName || '').toLowerCase();
  const urlPath = (url || '').toLowerCase();
  const videoExtensions = ['.mp4', '.avi', '.mov', '.webm', '.mkv', '.flv', '.m4v', '.3gp', '.wmv'];
  
  const isVideoByName = videoExtensions.some(ext => name.endsWith(ext));
  const isVideoByUrl = videoExtensions.some(ext => urlPath.includes(ext));
  
  return isVideoByName || isVideoByUrl ? 'video' : 'image';
};

export const ImageMetadataModal: React.FC<ImageMetadataModalProps> = ({
  isOpen,
  image,
  onClose,
  onSave,
  onRename,
  categories = []
}) => {
  const [form, setForm] = useState<MetadataForm>({
    alt_text: '',
    keywords: '',
    title: '',
    description: '',
    category: '',
    categories: [],  // 다중 선택용
    filename: ''
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExtractingEXIF, setIsExtractingEXIF] = useState(false);
  const [isCorrectingOCR, setIsCorrectingOCR] = useState(false);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [exifData, setExifData] = useState<{
    taken_at?: string;
    gps_lat?: number;
    gps_lng?: number;
    width?: number;
    height?: number;
    camera?: string;
    orientation?: number;
    // 동영상 메타데이터 추가
    duration?: number;
    codec?: string;
    fps?: string;
    bitrate?: number;
  } | null>(null);

  const { isGenerating, generateGolfMetadata, generateGeneralMetadata, generateField } = useAIGeneration();
  
  // 파일 타입 확인
  const fileType = image ? getFileType(image.name, image.url) : 'image';

  // OCR 텍스트 교정 함수
  const handleCorrectOCR = useCallback(async () => {
    if (!form.description || form.description.trim().length === 0) {
      alert('교정할 OCR 텍스트가 없습니다.');
      return;
    }

    setIsCorrectingOCR(true);
    try {
      console.log('🤖 [OCR 교정] 시작:', {
        textLength: form.description.length,
        filename: image?.name
      });

      const response = await fetch('/api/admin/correct-ocr-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ocrText: form.description,
          documentType: image?.name?.includes('주문') || image?.name?.includes('사양서') ? 'order_spec' : 'general',
          originalFilename: image?.name || ''
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '알 수 없는 오류' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.correctedText) {
        console.log('✅ [OCR 교정] 완료:', {
          originalLength: result.changes.originalLength,
          correctedLength: result.changes.correctedLength,
          estimatedCost: `$${result.usage.estimatedCost.toFixed(4)}`
        });

        // 교정된 텍스트를 description 필드에 적용
        setForm(prev => ({
          ...prev,
          description: result.correctedText
        }));
        setHasChanges(true);

        // 성공 메시지
        alert(`OCR 텍스트 교정이 완료되었습니다.\n\n변경 사항:\n- 원본: ${result.changes.originalLength}자\n- 교정: ${result.changes.correctedLength}자\n\n예상 비용: $${result.usage.estimatedCost.toFixed(4)}`);
      } else {
        throw new Error(result.error || '교정에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('❌ [OCR 교정] 오류:', error);
      alert(`OCR 텍스트 교정에 실패했습니다: ${error.message}`);
    } finally {
      setIsCorrectingOCR(false);
    }
  }, [form.description, image]);

  // OCR 텍스트가 있는지 확인 (description에 OCR 텍스트가 포함되어 있는지)
  const hasOCRText = useMemo(() => {
    if (!form.description) return false;
    // OCR 텍스트는 보통 "[OCR 추출 텍스트]" 같은 마커가 있거나, description에 긴 텍스트가 포함됨
    return form.description.length > 100 || form.description.includes('[OCR') || form.description.includes('OCR');
  }, [form.description]);

  // SEO 파일명 자동 생성 (하이브리드: 규칙 기반 + AI)
  const handleGenerateSEOFileName = useCallback(async () => {
    if (!form.title && !form.keywords) {
      alert('제목이나 키워드를 먼저 입력해주세요.');
      return;
    }

    try {
      // 기존 파일의 확장자 추출
      const currentFilename = form.filename || image?.name || '';
      const extension = currentFilename.includes('.') 
        ? '.' + currentFilename.split('.').pop() 
        : '.jpg'; // 기본값

      // 1단계: 규칙 기반 기본 변환
      const basicFileName = generateBasicFileName(form.title, form.keywords);
      
      // 2단계: AI 최적화가 필요한지 판단
      const shouldUseAI = form.keywords.length > 50 || 
                         form.title.includes('추천') || 
                         form.title.includes('비교') ||
                         form.keywords.includes('고반발') ||
                         form.keywords.includes('비거리');

      let finalFileName = basicFileName;

      if (shouldUseAI && image?.url) {
        try {
          // AI 기반 최적화 시도
          const aiFileName = await generateAIFileName(image.url, form.title, form.keywords);
          if (aiFileName && aiFileName.length > 0) {
            finalFileName = aiFileName;
          }
        } catch (aiError) {
          console.warn('AI 파일명 생성 실패, 규칙 기반 사용:', aiError);
          // AI 실패 시 규칙 기반 결과 사용
        }
      }

      // ✅ 확장자 추가 (이미 확장자가 있으면 제거 후 추가, 중복 확장자 방지)
      let finalFileNameWithExtension = finalFileName;
      
      // finalFileName에 이미 확장자가 있는지 확인
      const hasExtension = /\.(jpg|jpeg|png|gif|webp)$/i.test(finalFileName);
      
      if (hasExtension) {
        // 이미 확장자가 있으면 그대로 사용
        finalFileNameWithExtension = finalFileName;
        console.log('📝 파일명에 이미 확장자가 포함되어 있음:', finalFileNameWithExtension);
      } else {
        // 확장자가 없으면 추가
        finalFileNameWithExtension = finalFileName + extension;
        console.log('📝 파일명에 확장자 추가:', finalFileNameWithExtension);
      }

      setForm(prev => ({ ...prev, filename: finalFileNameWithExtension }));
      setHasChanges(true);
    } catch (error) {
      console.error('SEO 파일명 생성 오류:', error);
      alert('SEO 파일명 생성 중 오류가 발생했습니다.');
    }
  }, [form.title, form.keywords, form.filename, image?.url, image?.name]);

  // 규칙 기반 파일명 생성
  const generateBasicFileName = (title: string, keywords: string) => {
    const titleWords = title.toLowerCase().replace(/[^a-z0-9가-힣\s]/g, '').split(/\s+/).filter(word => word.length > 0);
    const keywordWords = keywords.toLowerCase().replace(/[^a-z0-9가-힣\s,]/g, '').split(/[,\s]+/).filter(word => word.length > 0);
    
    // 골프 전문 키워드 매핑 (실제 검색량 기반)
    const koreanToEnglish: Record<string, string> = {
      // 골프 장비
      '골프': 'golf', '드라이버': 'driver', '아이언': 'iron', '퍼터': 'putter', '웨지': 'wedge',
      '우드': 'wood', '클럽': 'club', '공': 'ball', '티': 'tee', '백': 'bag',
      '장갑': 'glove', '신발': 'shoes', '모자': 'hat', '캡': 'cap',
      
      // 골프 기술/성능
      '고반발': 'high-rebound', '비거리': 'distance', '정확도': 'accuracy', '스핀': 'spin',
      '스윙': 'swing', '샷': 'shot', '퍼팅': 'putting', '칩': 'chip',
      '관용성': 'forgiving', '연습용': 'practice', '경기용': 'tournament',
      
      // 골프 코스/환경
      '코스': 'course', '페어웨이': 'fairway', '그린': 'green', '벙커': 'bunker',
      '러프': 'rough', '티박스': 'tee-box', '홀': 'hole',
      
      // 인물/성별
      '남성': 'male', '여성': 'female', '남자': 'men', '여자': 'women',
      '프로': 'pro', '아마추어': 'amateur', '시니어': 'senior', '초보자': 'beginner',
      
      // 브랜드/모델 (SEO 전략: 일반 키워드와 조합하여 상위 노출)
      '마쓰구': 'massgoo', '마쓰구골프': 'massgoo-golf', '마쓰구드라이버': 'massgoo-driver',
      '타이틀리스트': 'titleist', '테일러메이드': 'taylormade', '캘러웨이': 'callaway',
      '핑': 'ping', '미즈노': 'mizuno', '윌슨': 'wilson', '브리지스톤': 'bridgestone',
      
      // 일반 키워드
      '추천': 'recommended', '비교': 'comparison', '리뷰': 'review', '가격': 'price',
      '할인': 'discount', '세일': 'sale', '신제품': 'new', '베스트': 'best',
      '랭킹': 'ranking', '순위': 'ranking', '인기': 'popular', '화제': 'trending',
      '인기드라이버': 'popular-driver', '추천드라이버': 'recommended-driver'
    };

    const convertToEnglish = (word: string) => {
      return koreanToEnglish[word] || word.replace(/[가-힣]/g, '');
    };

    // SEO 전략: 일반 키워드 + 브랜드명 조합으로 상위 노출 목표
    const prioritizeKeywords = (words: string[]) => {
      // 1순위: 검색량 높은 일반 키워드 (우리 제품이 노출되어야 할 키워드)
      const highSearchVolumeKeywords = [
        // 드라이버 특화 키워드 (최고 우선순위)
        '비거리드라이버', '고반발드라이버', '골프드라이버', '관용성드라이버', '정확도드라이버',
        // 타겟 고객 키워드
        '남성드라이버', '여성드라이버', '시니어드라이버', '초보자드라이버', '프로드라이버',
        // 성능/용도 키워드
        '추천드라이버', '인기드라이버', '연습용드라이버', '경기용드라이버',
        // 일반 골프 키워드
        '골프스윙', '골프코스', '골프연습', '골프장', '골프클럽',
        // 검색 보조 키워드
        '추천', '비교', '리뷰', '랭킹'
      ];
      
      // 2순위: 우리 브랜드 키워드 (일반 키워드와 조합하여 상위 노출)
      const brandKeywords = [
        '마쓰구드라이버', '마쓰구골프', '마쓰구'
      ];
      
      const priorityKeywords = [...highSearchVolumeKeywords, ...brandKeywords];
      
      const result: string[] = [];
      const combinedText = words.join(' ');
      
      // 1단계: 복합 키워드 우선 매칭
      for (const priority of priorityKeywords) {
        if (combinedText.includes(priority)) {
          const converted = koreanToEnglish[priority] || priority.replace(/[가-힣]/g, '');
          result.push(converted);
        }
      }
      
      // 2단계: 나머지 단어들 처리
      const remainingWords = words.map(convertToEnglish);
      result.push(...remainingWords);
      
      return result;
    };

    // 제목과 키워드에서 영문 단어 추출 (우선순위 기반)
    const prioritizedWords = prioritizeKeywords([...titleWords, ...keywordWords])
      .filter(word => /^[a-z0-9-]+$/.test(word) && word.length > 2);
    
    // 중복 제거 (순서 유지)
    const uniqueWords = Array.from(new Set(prioritizedWords));
    
    // SEO 전략: 일반 키워드 + 브랜드명 조합
    let finalWords = uniqueWords.slice(0, 3); // 최대 3개 단어
    
    // 브랜드명이 없으면 추가
    if (!finalWords.some(word => word.includes('massgoo'))) {
      finalWords.push('massgoo');
    }
    
    const allWords = finalWords.slice(0, 4); // 최대 4개 단어

    if (allWords.length === 0) {
      return 'golf-image-' + Math.floor(Math.random() * 999 + 1);
    }

    return allWords.join('-') + '-' + Math.floor(Math.random() * 999 + 1);
  };

  // AI 기반 파일명 생성
  const generateAIFileName = async (imageUrl: string, title: string, keywords: string) => {
    const response = await fetch('/api/analyze-image-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl,
        title: 'SEO optimized filename',
        excerpt: `Generate a SEO-friendly filename for this golf image to help our brand (마쓰구/massgoo) rank higher in Korean search results.
                  Current title: ${title}, Keywords: ${keywords}
                  
                  SEO Strategy: Help our products appear when people search for popular golf terms
                  
                  Requirements:
                  - Use lowercase letters and hyphens only
                  - Prioritize high-search-volume Korean golf keywords that people actually search for:
                    * "distance-driver" (비거리드라이버) - people search this to find distance drivers
                    * "high-rebound-driver" (고반발드라이버) - people search this to find high-rebound drivers  
                    * "golf-driver" (골프드라이버) - general golf driver searches
                    * "male-driver" or "female-driver" - gender-specific searches
                    * "recommended-driver" (추천드라이버) - people looking for recommendations
                  - Include "massgoo" brand name to connect popular searches to our products
                  - Maximum 4-5 words
                  - Focus on keywords that will help our products rank higher
                  - Return only the filename without extension
                  
                  Examples:
                  - "distance-driver-massgoo-123" (비거리드라이버 검색 시 우리 제품 노출)
                  - "high-rebound-driver-massgoo-456" (고반발드라이버 검색 시 우리 제품 노출)
                  - "golf-driver-recommended-massgoo-789" (골프드라이버 추천 검색 시 노출)`
      })
    });

    if (!response.ok) {
      throw new Error('AI 파일명 생성 실패');
    }

    const data = await response.json();
    const aiFileName = data.prompt
      ?.replace(/[^a-z0-9-\s]/g, '')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return aiFileName ? aiFileName + '-' + Math.floor(Math.random() * 999 + 1) : null;
  };

  // 이미지 변경 시 폼 초기화
  useEffect(() => {
    if (image) {
      // 카테고리 처리: 문자열이면 배열로 변환, 이미 배열이면 그대로 사용
      const imageCategories = Array.isArray(image.category) 
        ? image.category 
        : (image.category ? image.category.split(',').map(c => c.trim()).filter(c => c) : []);
      
      // OCR 텍스트 추출 (description에서 [OCR 추출 텍스트] 마커 제거)
      let ocrTextFromDescription = '';
      if (image.description) {
        const ocrMarkerIndex = image.description.indexOf('[OCR 추출 텍스트]');
        if (ocrMarkerIndex !== -1) {
          ocrTextFromDescription = image.description.substring(ocrMarkerIndex + '[OCR 추출 텍스트]'.length).trim();
        } else if (image.description.length > 200) {
          // 마커가 없지만 긴 텍스트면 OCR 텍스트로 간주
          ocrTextFromDescription = image.description;
        }
      }
      
      const newForm: MetadataForm = {
        alt_text: image.alt_text || '',
        keywords: image.keywords?.join(', ') || '',
        title: image.title || '',
        description: image.description || '',
        category: image.category || '',  // 하위 호환성 유지
        categories: imageCategories,  // 다중 선택용
        filename: image.name || ''
      };
      
      // OCR 텍스트가 있으면 별도로 저장 (문서 뷰어용)
      if (ocrTextFromDescription || (image as any).ocr_text) {
        (newForm as any).ocrText = (image as any).ocr_text || ocrTextFromDescription;
        (newForm as any).fullTextAnnotation = (image as any).ocr_fulltextannotation || null;
      }
      
      setForm(newForm);
      setHasChanges(false);
      setValidationErrors({});
      
      // EXIF 정보 자동 로드 (이미지에 EXIF 정보가 있는 경우)
      if (image.gps_lat || image.taken_at || image.width || (image as any).gps_lng) {
        setExifData({
          taken_at: image.taken_at || (image as any).taken_at || undefined,
          gps_lat: image.gps_lat || (image as any).gps_lat || undefined,
          gps_lng: (image as any).gps_lng || undefined,
          width: image.width || (image as any).width || undefined,
          height: image.height || (image as any).height || undefined,
          camera: (image as any).camera || undefined,
          orientation: (image as any).orientation || undefined
        });
      } else {
        setExifData(null);
      }
    }
  }, [image]);

  // 폼 변경 감지 (string 또는 string[] 지원)
  const handleFormChange = useCallback((field: keyof MetadataForm, value: string | string[]) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      // 카테고리 필드는 category와 categories를 동기화
      if (field === 'categories' && Array.isArray(value)) {
        updated.category = value.join(',');  // 하위 호환성 유지
        
        // ✅ 카테고리 변경 시 키워드에 자동 추가
        const currentKeywords = (prev.keywords || '').split(',').map(k => k.trim()).filter(k => k);
        const categoryKeywords = value.map(c => c.trim()).filter(c => c);
        
        // 기존 키워드와 카테고리를 합쳐서 중복 제거
        const allKeywords = Array.from(new Set([...currentKeywords, ...categoryKeywords]));
        updated.keywords = allKeywords.join(', ');
        
        console.log('📝 카테고리 변경 → 키워드 자동 추가:', {
          categories: value,
          previousKeywords: currentKeywords,
          newKeywords: allKeywords
        });
      } else if (field === 'category' && typeof value === 'string') {
        updated.categories = value ? value.split(',').map(c => c.trim()).filter(c => c) : [];
        
        // ✅ 카테고리 변경 시 키워드에 자동 추가
        const currentKeywords = (prev.keywords || '').split(',').map(k => k.trim()).filter(k => k);
        const categoryKeywords = updated.categories;
        
        // 기존 키워드와 카테고리를 합쳐서 중복 제거
        const allKeywords = Array.from(new Set([...currentKeywords, ...categoryKeywords]));
        updated.keywords = allKeywords.join(', ');
        
        console.log('📝 카테고리 변경 → 키워드 자동 추가:', {
          category: value,
          categories: updated.categories,
          previousKeywords: currentKeywords,
          newKeywords: allKeywords
        });
      }
      
      // ✅ 실시간 유효성 검사 (업데이트된 폼으로 검증)
      const errors = validateForm(updated, hasOCRText);
      setValidationErrors(errors);
      
      return updated;
    });
    setHasChanges(true);
  }, []);

  // 골프 AI 생성
  const handleGenerateGolf = useCallback(async (language: 'korean' | 'english') => {
    if (!image) return;

    const result = await generateGolfMetadata(image.url, {
      language,
      fields: ['alt_text', 'keywords', 'title', 'description', 'category']
    });

    if (result.success && result.data) {
      // ✅ 제목이 파일명 형식인지 확인 및 처리
      let titleValue = result.data.title || '';
      const isFilenameFormat = /^[a-z0-9-]+\.(jpg|jpeg|png|gif|webp)$/i.test(titleValue);
      if (isFilenameFormat) {
        console.warn('⚠️ AI 생성된 제목이 파일명 형식입니다. 빈 문자열로 처리:', titleValue);
        titleValue = '';
      }
      
      setForm(prev => {
        const updated = { 
          ...prev, 
          ...result.data,
          title: titleValue  // 파일명 형식이면 빈 문자열로 덮어쓰기
        };
        // ✅ AI 생성 후 검증 오류 초기화
        const errors = validateForm(updated);
        setValidationErrors(errors);
        return updated;
      });
      setHasChanges(true);
    } else {
      alert(`골프 AI 생성에 실패했습니다: ${result.error}`);
    }
  }, [image, generateGolfMetadata]);

  // 범용 AI 생성
  const handleGenerateGeneral = useCallback(async (language: 'korean' | 'english') => {
    if (!image) return;

    const result = await generateGeneralMetadata(image.url, {
      language,
      fields: ['alt_text', 'keywords', 'title', 'description']
    });

    if (result.success && result.data) {
      // ✅ 제목이 파일명 형식인지 확인 및 처리
      let titleValue = result.data.title || '';
      const isFilenameFormat = /^[a-z0-9-]+\.(jpg|jpeg|png|gif|webp)$/i.test(titleValue);
      if (isFilenameFormat) {
        console.warn('⚠️ AI 생성된 제목이 파일명 형식입니다. 빈 문자열로 처리:', titleValue);
        titleValue = '';
      }
      
      setForm(prev => {
        const updated = { 
          ...prev, 
          ...result.data,
          title: titleValue  // 파일명 형식이면 빈 문자열로 덮어쓰기
        };
        // ✅ AI 생성 후 검증 오류 초기화
        const errors = validateForm(updated);
        setValidationErrors(errors);
        return updated;
      });
      setHasChanges(true);
    } else {
      alert(`일반 메타 생성에 실패했습니다: ${result.error}`);
    }
  }, [image, generateGeneralMetadata]);

  // 개별 필드 AI 생성
  const handleGenerateField = useCallback(async (field: keyof MetadataForm, language: 'korean' | 'english') => {
    if (!image) return;

    const result = await generateField(image.url, field, language);
    
    if (result.success && result.data) {
      setForm(prev => {
        const updated = { ...prev, ...result.data };
        // ✅ AI 생성 후 검증 오류 초기화
        const errors = validateForm(updated);
        setValidationErrors(errors);
        return updated;
      });
      setHasChanges(true);
    } else {
      alert(`AI 생성에 실패했습니다: ${result.error}`);
    }
  }, [image, generateField]);

  // EXIF/비디오 메타데이터 추출
  const handleExtractEXIF = useCallback(async () => {
    if (!image) return;

    setIsExtractingEXIF(true);
    try {
      const isVideo = fileType === 'video';
      
      if (isVideo) {
        // 동영상 메타데이터 추출 (클라이언트 사이드)
        console.log('🎬 클라이언트에서 동영상 메타데이터 추출 중...', image.url);
        const videoMeta = await extractVideoMetadataClient(image.url);
        
        const videoInfo: {
          width?: number;
          height?: number;
          duration?: number;
          codec?: string | null;
          fps?: string | null;
          bitrate?: number | null;
        } = {
          width: videoMeta.width,
          height: videoMeta.height,
          duration: videoMeta.duration,
          codec: videoMeta.codec || null,
          fps: videoMeta.fps || null,
          bitrate: videoMeta.bitrate || null,
        };

        setExifData(Object.keys(videoInfo).filter(k => videoInfo[k as keyof typeof videoInfo] !== null).length > 0 ? videoInfo : null);
        setHasChanges(true);

        const infoCount = Object.keys(videoInfo).filter(k => videoInfo[k as keyof typeof videoInfo] !== null).length;
        if (infoCount > 0) {
          const durationStr = videoMeta.duration 
            ? `${Math.floor(videoMeta.duration / 60)}:${(videoMeta.duration % 60).toFixed(0).padStart(2, '0')}`
            : '알 수 없음';
          alert(`✅ 동영상 메타데이터 추출 완료!\n\n해상도: ${videoMeta.width}×${videoMeta.height}px\n길이: ${durationStr}\n\n※ codec, fps, bitrate는 브라우저에서 추출할 수 없습니다.`);
        } else {
          alert('⚠️ 이 동영상에서 메타데이터를 추출할 수 없습니다.');
        }
      } else {
        // 이미지 EXIF 추출 (서버 API 사용)
        const response = await fetch('/api/admin/extract-exif', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicUrl: image.url })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'EXIF 추출 실패' }));
          throw new Error(errorData.error || 'EXIF 추출 실패');
        }

        const data = await response.json();
        // 이미지 EXIF 처리 (기존 로직)
        const extractedExif = data.meta || {};
        const exifRaw = data.exif || {};

        const exifInfo: {
          taken_at?: string;
          gps_lat?: number;
          gps_lng?: number;
          width?: number;
          height?: number;
          camera?: string;
          orientation?: number;
        } = {};

        if (extractedExif.taken_at) {
          exifInfo.taken_at = extractedExif.taken_at;
        }
        
        if (extractedExif.gps_lat && extractedExif.gps_lng) {
          exifInfo.gps_lat = extractedExif.gps_lat;
          exifInfo.gps_lng = extractedExif.gps_lng;
        }
        
        if (extractedExif.width && extractedExif.height) {
          exifInfo.width = extractedExif.width;
          exifInfo.height = extractedExif.height;
        }

        if (extractedExif.orientation) {
          exifInfo.orientation = extractedExif.orientation;
        }

        if (exifRaw.Make || exifRaw.Model) {
          exifInfo.camera = [exifRaw.Make, exifRaw.Model].filter(Boolean).join(' ');
        }

        setExifData(Object.keys(exifInfo).length > 0 ? exifInfo : null);
        setHasChanges(true);

        const infoCount = Object.keys(exifInfo).length;
        if (infoCount > 0) {
          alert(`✅ EXIF 정보 추출 완료!\n\n${infoCount}개의 정보를 추출했습니다.`);
        } else {
          alert('⚠️ 이 이미지에는 EXIF 정보가 없습니다.');
        }
      }
    } catch (error: any) {
      console.error(`${fileType === 'video' ? '동영상 메타데이터' : 'EXIF'} 추출 오류:`, error);
      alert(`${fileType === 'video' ? '동영상 메타데이터' : 'EXIF'} 추출에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setIsExtractingEXIF(false);
    }
  }, [image, fileType]);

  // 저장
  const handleSave = useCallback(async () => {
    // ✅ 저장 전에 카테고리를 키워드에 포함시킴
    const categoriesArray = Array.isArray(form.categories) && form.categories.length > 0
      ? form.categories
      : (form.category ? form.category.split(',').map(c => c.trim()).filter(c => c) : []);
    
    const currentKeywords = (form.keywords || '').split(',').map(k => k.trim()).filter(k => k);
    const allKeywords = Array.from(new Set([...currentKeywords, ...categoriesArray]));
    let updatedKeywords = allKeywords.join(', ');
    
    // ✅ 키워드 길이 제한 (200자 초과 시 자동으로 줄임)
    const MAX_KEYWORDS_LENGTH = 200;
    if (updatedKeywords.length > MAX_KEYWORDS_LENGTH) {
      console.warn('⚠️ 키워드가 너무 깁니다. 자동으로 줄입니다:', {
        originalLength: updatedKeywords.length,
        maxLength: MAX_KEYWORDS_LENGTH
      });
      
      // 키워드를 우선순위에 따라 정렬 후 앞에서부터 선택
      // 카테고리 키워드 우선 유지, 나머지는 자동 선택
      const categorySet = new Set(categoriesArray);
      const prioritizedKeywords = [
        ...allKeywords.filter(k => categorySet.has(k)),  // 카테고리 키워드 우선
        ...allKeywords.filter(k => !categorySet.has(k))  // 나머지 키워드
      ];
      
      let trimmedKeywords: string[] = [];
      let currentLength = 0;
      
      for (const keyword of prioritizedKeywords) {
        const keywordWithComma = trimmedKeywords.length > 0 ? `, ${keyword}` : keyword;
        if (currentLength + keywordWithComma.length <= MAX_KEYWORDS_LENGTH) {
          trimmedKeywords.push(keyword);
          currentLength += keywordWithComma.length;
        } else {
          break;
        }
      }
      
      updatedKeywords = trimmedKeywords.join(', ');
      
      console.log('✂️ 키워드 자동 줄임:', {
        original: allKeywords,
        trimmed: trimmedKeywords,
        originalLength: allKeywords.join(', ').length,
        trimmedLength: updatedKeywords.length
      });
    }
    
    const formWithKeywords = {
      ...form,
      keywords: updatedKeywords  // 카테고리를 포함한 키워드 (길이 제한 적용)
    };
    
    console.log('💾 저장 전 키워드 업데이트:', {
      categories: categoriesArray,
      previousKeywords: currentKeywords,
      updatedKeywords: allKeywords,
      finalKeywords: updatedKeywords,
      finalLength: updatedKeywords.length
    });
    
    const errors = validateForm(formWithKeywords, hasOCRText);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      console.error('❌ 검증 오류:', errors);
      return;
    }

    setIsSaving(true);
    try {
      // ✅ 파일명 변경 기능 비활성화 - SEO 파일명은 메타데이터에만 저장 (title 필드에 저장됨)
      // 실제 파일명은 변경하지 않음 (복잡성 감소 및 버그 방지)
      // formWithKeywords.filename은 메타데이터 저장용으로만 사용
      
      // 모든 메타데이터 저장 (카테고리가 키워드에 포함된 버전 + EXIF 정보)
      await onSave(formWithKeywords, exifData);
      setHasChanges(false);
      onClose();
    } catch (error) {
      console.error('저장 오류:', error);
      alert(`저장에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setIsSaving(false);
    }
  }, [form, image, onSave, onRename, onClose]);


  // SEO 점수 및 권장사항 계산
  const seoScore = calculateSEOScore(form);
  const seoRecommendations = getSEORecommendations(form);

  if (!isOpen || !image) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{fileType === 'video' ? '동영상 메타데이터 편집' : '이미지 메타데이터 편집'}</h2>
            <p className="text-sm text-gray-500 mt-1">{image.name}</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* AI 생성 및 EXIF 추출 버튼들 */}
            <button
              onClick={() => handleGenerateGolf('korean')}
              disabled={isGenerating}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isGenerating ? '⏳' : '⛳'} 골프 AI 생성
            </button>
            
            <button
              onClick={() => handleGenerateGeneral('korean')}
              disabled={isGenerating}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isGenerating ? '⏳' : '🌐'} 일반 메타 생성
            </button>
            
            <button
              onClick={handleExtractEXIF}
              disabled={isGenerating || isExtractingEXIF}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isExtractingEXIF ? '⏳' : fileType === 'video' ? '🎬' : '📷'} {fileType === 'video' ? '비디오 메타 추출' : 'EXIF 추출'}
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 컨텐츠 - 스크롤 가능한 영역 */}
        <div className="flex flex-1 overflow-hidden">
          {/* OCR 문서 뷰어 모드 */}
          {showDocumentViewer && hasOCRText && (form as any).ocrText && (
            <div className="flex-1 overflow-hidden">
              <DocumentOCRViewer
                imageUrl={image?.url || ''}
                ocrText={(form as any).ocrText || form.description}
                originalText={(form as any).ocrText || form.description}
                fullTextAnnotation={(form as any).fullTextAnnotation}
                onTextChange={(text) => {
                  setForm(prev => ({
                    ...prev,
                    description: text
                  }));
                  setHasChanges(true);
                }}
                onSave={async (text) => {
                  // 저장은 상위 onSave로 위임
                  await onSave({
                    ...form,
                    description: text
                  }, exifData);
                }}
              />
            </div>
          )}
          
          {/* 메인 폼 (기본 모드 또는 문서 뷰어가 아닐 때) */}
          {!showDocumentViewer && (
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-6">
              {Object.entries(FIELD_CONFIGS).map(([field, config]) => {
                // 카테고리 필드 제외 (키워드 중심으로 전환)
                if (field === 'category') {
                  return null;
                }
                
                const fieldValue = form[field as keyof MetadataForm];
                return (
                  <FieldGroup
                    key={field}
                    field={field as keyof MetadataForm}
                    config={config}
                    value={fieldValue as string | string[]}
                    onChange={(value) => {
                      handleFormChange(field as keyof MetadataForm, value);
                    }}
                    onAIGenerate={config.aiEnabled ? handleGenerateField : undefined}
                    onCorrectOCR={field === 'description' ? handleCorrectOCR : undefined}
                    error={validationErrors[field]}
                    seoScore={config.seoOptimized ? seoScore : undefined}
                    isGenerating={isGenerating}
                    isCorrectingOCR={isCorrectingOCR}
                    hasOCRText={field === 'description' ? hasOCRText : false}
                    categories={categories}
                  />
                );
              })}
              
              {/* OCR 문서 뷰어 전환 버튼 */}
              {hasOCRText && (form as any).ocrText && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 mb-1">
                        📄 OCR 문서 편집 모드
                      </h4>
                      <p className="text-xs text-blue-700">
                        원본 이미지와 텍스트를 나란히 보면서 편집할 수 있습니다.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowDocumentViewer(!showDocumentViewer)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                    >
                      {showDocumentViewer ? '메타데이터 편집으로' : '문서 뷰어로 보기'}
                    </button>
                  </div>
                </div>
              )}

              {/* EXIF/비디오 메타데이터 정보 표시 영역 */}
              {exifData && (
                <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">{fileType === 'video' ? '동영상 메타데이터' : 'EXIF 정보'}</h3>
                  <div className="grid grid-cols-2 gap-1.5 text-sm">
                    {fileType === 'video' ? (
                      // 동영상 메타데이터 표시
                      <>
                        {exifData.width && exifData.height && (
                          <div>
                            <span className="text-gray-500">해상도:</span>
                            <span className="ml-1.5 text-gray-900">
                              {exifData.width} × {exifData.height}px
                            </span>
                          </div>
                        )}
                        {exifData.duration && (
                          <div>
                            <span className="text-gray-500">길이:</span>
                            <span className="ml-1.5 text-gray-900">
                              {Math.floor(exifData.duration / 60)}:{(exifData.duration % 60).toFixed(0).padStart(2, '0')}
                            </span>
                          </div>
                        )}
                        {exifData.codec && (
                          <div>
                            <span className="text-gray-500">코덱:</span>
                            <span className="ml-1.5 text-gray-900">{exifData.codec}</span>
                          </div>
                        )}
                        {exifData.fps && (
                          <div>
                            <span className="text-gray-500">프레임레이트:</span>
                            <span className="ml-1.5 text-gray-900">{exifData.fps} fps</span>
                          </div>
                        )}
                        {exifData.bitrate && (
                          <div className="col-span-2">
                            <span className="text-gray-500">비트레이트:</span>
                            <span className="ml-1.5 text-gray-900">
                              {(exifData.bitrate / 1000).toFixed(0)} kbps
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      // 이미지 EXIF 정보 표시
                      <>
                        {exifData.taken_at && (
                          <div>
                            <span className="text-gray-500">촬영일:</span>
                            <span className="ml-1.5 text-gray-900">
                              {new Date(exifData.taken_at).toLocaleString('ko-KR')}
                            </span>
                          </div>
                        )}
                        {exifData.width && exifData.height && (
                          <div>
                            <span className="text-gray-500">크기:</span>
                            <span className="ml-1.5 text-gray-900">
                              {exifData.width} × {exifData.height}px
                            </span>
                          </div>
                        )}
                        {exifData.gps_lat && exifData.gps_lng && (
                          <div className="col-span-2">
                            <span className="text-gray-500">위치:</span>
                            <span className="ml-1.5 text-gray-900">
                              {exifData.gps_lat.toFixed(6)}, {exifData.gps_lng.toFixed(6)}
                            </span>
                            <a
                              href={`https://www.google.com/maps?q=${exifData.gps_lat},${exifData.gps_lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-1.5 text-blue-600 hover:text-blue-800 underline text-xs"
                            >
                              지도 보기
                            </a>
                          </div>
                        )}
                        {exifData.camera && (
                          <div className="col-span-2">
                            <span className="text-gray-500">카메라:</span>
                            <span className="ml-1.5 text-gray-900">{exifData.camera}</span>
                          </div>
                        )}
                        {exifData.orientation && (
                          <div>
                            <span className="text-gray-500">회전:</span>
                            <span className="ml-1.5 text-gray-900">
                              {exifData.orientation === 1 ? '정상' : 
                               exifData.orientation === 3 ? '180°' :
                               exifData.orientation === 6 ? '90° 시계방향' :
                               exifData.orientation === 8 ? '90° 반시계방향' :
                               `${exifData.orientation}`}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {/* 키워드 자동 완성 안내 */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  💡 <strong>키워드 입력 팁:</strong> 카테고리 정보(골프코스, 스윙, 드라이버 등)는 키워드 필드에 직접 입력하세요. 
                  AI 생성 시 자동으로 관련 키워드가 추가됩니다.
                </p>
              </div>
              
              {/* SEO 파일명 자동 생성 버튼 */}
              <div className="mt-6 p-4 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg border border-teal-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">🎯 SEO 파일명 생성 (참고용)</h3>
                <p className="text-xs text-gray-600 mb-2">
                  ⚠️ 참고: 실제 파일명은 변경되지 않습니다. SEO 최적화 파일명은 메타데이터에만 저장됩니다.
                </p>
                <button
                  onClick={handleGenerateSEOFileName}
                  disabled={isGenerating}
                  className="w-full px-4 py-2 bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-lg hover:from-teal-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGenerating ? '⏳' : '🎯'} 하이브리드 SEO 파일명 생성
                </button>
              </div>
              </div>
            </div>
          )}

          {/* SEO 사이드바 */}
          {!showDocumentViewer && (
            <div className="w-80 border-l border-gray-200 p-6 overflow-y-auto">
              <SEOScore
                score={seoScore}
                recommendations={seoRecommendations}
                onRecommendationClick={(field) => {
                  // 해당 필드로 스크롤
                  const element = document.querySelector(`[data-field="${field}"]`);
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
              />
            </div>
          )}
        </div>

        {/* 푸터 - 항상 하단에 고정 */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-4">
            {hasChanges && (
              <span className="text-sm text-orange-600 flex items-center gap-1">
                <span>⚠️</span>
                저장되지 않은 변경사항이 있습니다
              </span>
            )}
            {seoScore < 60 && (
              <span className="text-sm text-red-600 flex items-center gap-1">
                <span>📈</span>
                개선이 필요합니다
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              취소
            </button>
            
            
            <button
              onClick={handleSave}
              disabled={isSaving || Object.keys(validationErrors).length > 0}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? '⏳' : '💾'} 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
