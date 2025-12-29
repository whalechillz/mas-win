import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import AdminNav from '../../components/admin/AdminNav';
import ProductSelector from '../../components/admin/ProductSelector';
import Image from 'next/image';

// GalleryPicker는 동적 로드 (SSR 비활성화)
const GalleryPicker = dynamic(() => import('../../components/admin/GalleryPicker'), { ssr: false });

interface ImageGenerationRequest {
  prompt: string;
  brandTone: 'senior_emotional' | 'high_tech_innovative';
  imageType: 'background' | 'profile' | 'feed';
  logoOption: 'logo' | 'full-brand' | 'none';
  imageCount: number;
  sceneStep?: number; // 스토리 장면 번호 (1-7)
  selectedLocation?: string; // 선택된 장소 ID
  naturalStyle?: boolean; // 자연스러운 인물 사진 (no makeup, natural skin)
  useChatGPT?: boolean; // ChatGPT로 프롬프트 최적화
  enableProductComposition?: boolean; // 제품 합성 활성화
  compositionTarget?: 'hands' | 'head' | 'body' | 'accessory'; // 합성 타겟
  selectedProductId?: string; // 선택된 제품 ID
  driverPart?: 'crown' | 'sole' | 'face' | 'full'; // 드라이버 부위 (드라이버 전용)
  compositionMethod?: 'nano-banana-pro' | 'nano-banana'; // 합성 메서드
  baseImageMode?: 'generate' | 'gallery'; // 베이스 이미지 모드: 새 이미지 생성 / 갤러리에서 선택
  selectedBaseImageUrl?: string; // 갤러리에서 선택한 베이스 이미지 URL
  replaceLogo?: boolean; // 로고 자동 교체 옵션
  changeProductColor?: boolean; // 제품 색상 변경 활성화
  productColor?: string; // 변경할 제품 색상
  compositionBackground?: 'natural' | 'studio' | 'product-page'; // 배경 타입
  productOnlyMode?: boolean; // 제품컷 전용 모드 (사람 없이 제품만)
  improveHandQuality?: boolean; // 손 표현 개선 (손가락 개수, 비율, 자세 개선)
  enhanceFullShot?: boolean; // 전신 풀샷 강화 (카메라 각도 최적화)
  removeForegroundObstruction?: boolean; // 인물 앞 장애물 제거
}

export default function AIImageGenerator() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<any[]>([]);
  const [optimizedPrompt, setOptimizedPrompt] = useState<string | null>(null); // 최적화된 프롬프트 저장
  const [compositionStatus, setCompositionStatus] = useState<string>(''); // 제품 합성 진행 상태
  const [showBaseImageGallery, setShowBaseImageGallery] = useState(false); // 베이스 이미지 갤러리 모달 표시
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null); // 선택된 프리셋
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false); // 고급 설정 토글
  const [expandedTone, setExpandedTone] = useState<'senior' | 'hightech' | 'both' | 'none'>('none'); // 펼쳐진 톤 카드
  const [recentUploadFolder, setRecentUploadFolder] = useState<string | null>(null); // 최근 업로드/선택한 이미지 폴더
  const [recentFolders, setRecentFolders] = useState<string[]>([]); // 최근 사용 폴더 목록
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null); // 선택된 폴더
  const [formData, setFormData] = useState<ImageGenerationRequest>({
    prompt: '',
    brandTone: 'senior_emotional',
    imageType: 'feed',
    logoOption: 'full-brand',
    imageCount: 1,
    naturalStyle: true, // 기본값: 자연스러운 스타일
    useChatGPT: false, // 기본값: 직접 프롬프트 사용
    enableProductComposition: false, // 기본값: 제품 합성 비활성화
    compositionTarget: 'hands', // 기본값: 손에 드라이버 합성
    selectedProductId: undefined,
    driverPart: 'full', // 기본값: 전체 헤드 합성
    compositionMethod: 'nano-banana-pro', // 기본값: 나노바나나 프로
    baseImageMode: 'generate', // 기본값: 새 이미지 생성
    selectedBaseImageUrl: undefined,
    replaceLogo: false, // 기본값: 로고 교체 비활성화
    changeProductColor: false, // 기본값: 색상 변경 비활성화
    productColor: undefined, // 기본값: 색상 미선택
    compositionBackground: 'natural', // 기본값: 자연 배경
    productOnlyMode: false, // 기본값: 인물 합성 (제품컷 모드 아님)
    improveHandQuality: false, // 기본값: 손 표현 개선 비활성화
    enhanceFullShot: false, // 기본값: 전신 풀샷 강화 비활성화
    removeForegroundObstruction: false, // 기본값: 인물 앞 장애물 제거 비활성화
  });

  // 폴더 경로 추출 함수
  const extractFolderPathFromUrl = (url: string): string | null => {
    try {
      // Supabase Storage URL에서 경로 추출
      // 예: https://.../storage/v1/object/public/blog-images/originals/blog/2025-12/487/image.jpg
      const match = url.match(/blog-images\/([^?]+)/);
      if (match) {
        const fullPath = decodeURIComponent(match[1]);
        const pathParts = fullPath.split('/');
        // 파일명 제외하고 폴더 경로만 반환
        if (pathParts.length > 1) {
          return pathParts.slice(0, -1).join('/');
        }
      }
      return null;
    } catch (error) {
      console.error('폴더 경로 추출 실패:', error);
      return null;
    }
  };

  // localStorage에서 ChatGPT 최적화 설정 불러오기
  useEffect(() => {
    const savedUseChatGPT = localStorage.getItem('ai-image-generator-useChatGPT');
    if (savedUseChatGPT !== null) {
      setFormData(prev => ({
        ...prev,
        useChatGPT: savedUseChatGPT === 'true'
      }));
    }
  }, []);

  // 최근 폴더 목록 로드
  const loadRecentFolders = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ai-image-generator-recent-folders');
      if (saved) {
        try {
          const folders = JSON.parse(saved);
          setRecentFolders(folders);
          // 가장 최근 폴더를 기본 선택 폴더로 설정
          if (folders.length > 0 && !recentUploadFolder) {
            setRecentUploadFolder(folders[0]);
          }
        } catch (e) {
          console.error('최근 폴더 로드 실패:', e);
        }
      }
    }
  };

  // 최근 폴더에 추가
  const addRecentFolder = (folderPath: string) => {
    if (!folderPath) return;
    const updated = [folderPath, ...recentFolders.filter(f => f !== folderPath)].slice(0, 6);
    setRecentFolders(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ai-image-generator-recent-folders', JSON.stringify(updated));
    }
  };

  // 최근 폴더 삭제
  const removeRecentFolder = (folderPath: string) => {
    const updated = recentFolders.filter(f => f !== folderPath);
    setRecentFolders(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ai-image-generator-recent-folders', JSON.stringify(updated));
    }
    // 선택된 폴더가 삭제되면 선택 해제
    if (selectedFolder === folderPath) {
      setSelectedFolder(null);
      setRecentUploadFolder(null);
    }
  };

  // 컴포넌트 마운트 시 최근 폴더 목록 로드
  useEffect(() => {
    loadRecentFolders();
    // 기존 lastSelectedImageFolder도 복원 (하위 호환성)
    const lastFolder = localStorage.getItem('lastSelectedImageFolder');
    if (lastFolder && !recentUploadFolder) {
      setRecentUploadFolder(lastFolder);
    }
  }, []);

  // localStorage에서 손 표현 개선 설정 불러오기
  useEffect(() => {
    const savedImproveHandQuality = localStorage.getItem('ai-image-generator-improveHandQuality');
    if (savedImproveHandQuality !== null) {
      setFormData(prev => ({
        ...prev,
        improveHandQuality: savedImproveHandQuality === 'true'
      }));
    }
  }, []);

  // localStorage에서 전신 풀샷 강화 설정 불러오기
  useEffect(() => {
    const savedEnhanceFullShot = localStorage.getItem('ai-image-generator-enhanceFullShot');
    if (savedEnhanceFullShot !== null) {
      setFormData(prev => ({
        ...prev,
        enhanceFullShot: savedEnhanceFullShot === 'true'
      }));
    }
  }, []);

  // localStorage에서 인물 앞 장애물 제거 설정 불러오기
  useEffect(() => {
    const savedRemoveForegroundObstruction = localStorage.getItem('ai-image-generator-removeForegroundObstruction');
    if (savedRemoveForegroundObstruction !== null) {
      setFormData(prev => ({
        ...prev,
        removeForegroundObstruction: savedRemoveForegroundObstruction === 'true'
      }));
    }
  }, []);

  // ChatGPT 최적화 설정 변경 핸들러 (localStorage에 저장)
  const handleUseChatGPTChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, useChatGPT: checked }));
    localStorage.setItem('ai-image-generator-useChatGPT', String(checked));
  };

  // 손 표현 개선 설정 변경 핸들러 (localStorage에 저장)
  const handleImproveHandQualityChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, improveHandQuality: checked }));
    localStorage.setItem('ai-image-generator-improveHandQuality', String(checked));
  };

  // 전신 풀샷 강화 설정 변경 핸들러 (localStorage에 저장)
  const handleEnhanceFullShotChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, enhanceFullShot: checked }));
    localStorage.setItem('ai-image-generator-enhanceFullShot', String(checked));
  };

  // 인물 앞 장애물 제거 설정 변경 핸들러 (localStorage에 저장)
  const handleRemoveForegroundObstructionChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, removeForegroundObstruction: checked }));
    localStorage.setItem('ai-image-generator-removeForegroundObstruction', String(checked));
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 세션 체크 (프로덕션에서 활성화)
  // 프로덕션에서는 디버깅 모드 비활성화 (환경 변수로만 제어)
  const DEBUG_MODE = false;
  
  if (!DEBUG_MODE && !session) {
    router.push('/admin/login');
    return null;
  }

  // 한국 골퍼 스펙 (계절/요일 무관) - 강화된 한국인 외모 명시
  const koreanGolferSpec = `Korean professional fitter (Korean ethnicity, East Asian features, Korean facial structure, Korean skin tone, Korean hair, Korean eyes, Korean nose, Korean facial characteristics, 50-70 years old for senior emotional, 40-60 years old for high-tech innovative), authentic Korean appearance, natural Korean complexion, realistic Korean facial features, Korean professional golf attire appropriate for the brand tone, clearly Korean person, not Western or Caucasian, distinctly Asian Korean features`;

  // 브랜딩 톤별 프롬프트 가이드 (색감 강화)
  const brandToneGuides = {
    senior_emotional: {
      name: '시니어 중심 감성적 브랜딩',
      description: '골드 톤, 따뜻한 분위기, 감성적 메시지',
      colorScheme: 'warm golden lighting, gold-tinted atmosphere, warm color palette, soft golden glow, golden hour lighting, warm amber tones, luxurious gold accents, warm and inviting color scheme, golden highlights, warm golden shadows, rich gold tones, elegant gold finishes',
      mood: 'comfortable, warm, nostalgic, achievement, gratitude',
    },
    high_tech_innovative: {
      name: '하이테크 중심 혁신형 브랜딩',
      description: '쿨 블루 톤, 현대적 분위기, 기술적 감성',
      colorScheme: 'cool blue tones, bright blue lighting, metallic surfaces with blue accents, LED lighting, modern tech aesthetic, sleek finishes with blue highlights, bright blue neon accents, contemporary industrial design, cool blue highlights, bright blue lighting, well-lit high-tech surfaces, modern bright blue-gray palette, bright and airy atmosphere, professional bright lighting',
      mood: 'innovative, cutting-edge, professional, precision, excellence',
    },
  };

  // 스토리 기반 7×2 프리셋 (장면 × 톤)
  const storyPresets: Array<{
    id: string;
    label: string;
    sceneStep: number;
    tone: 'senior_emotional' | 'high_tech_innovative';
    imageType: 'background' | 'profile' | 'feed';
    logoOption: 'full-brand' | 'logo' | 'none';
    prompt: string;
  }> = [
    // 시니어 톤
    { id: 'scene1-senior', label: '장면1 행복한 주인공 (시니어)', sceneStep: 1, tone: 'senior_emotional', imageType: 'feed', logoOption: 'full-brand', prompt: '골드 톤, 60대 한국인 시니어 골퍼가 골프장 코스나 티샷 장소에서 미소 짓는 장면, 전신 풀샷, 자연스러운 포즈, 모자·상의·배경에 MASSGOO 로고 자연스럽게 2~3곳 노출, 프리미엄 골프 장비와 조명, 자연스러운 즐거운 분위기' },
    { id: 'scene2-senior', label: '장면2 행복+불안 전조 (시니어)', sceneStep: 2, tone: 'senior_emotional', imageType: 'feed', logoOption: 'full-brand', prompt: '골드 톤, 50~70대 한국인 골퍼 2~4명이 클럽하우스 라운지에서 웃으며 대화하지만 살짝 걱정 섞인 표정, 자연스러운 그룹 포즈, 따뜻한 조명, 배경에 MASSGOO 브랜딩, 자연스러운 일상 분위기' },
    { id: 'scene3-senior', label: '장면3 문제 발생 (시니어)', sceneStep: 3, tone: 'senior_emotional', imageType: 'feed', logoOption: 'full-brand', prompt: '웜톤이지만 조명을 낮춘 연습장 그린, 60대 한국인 골퍼가 퍼팅 연습하며 깊이 고민하는 전신 풀샷, 허리·어깨 통증과 비거리 문제를 암시, MASSGOO 브랜딩은 은은히' },
    { id: 'scene4-senior', label: '장면4 가이드 만남 (시니어)', sceneStep: 4, tone: 'senior_emotional', imageType: 'feed', logoOption: 'full-brand', prompt: '골드 톤, 50~60대 한국인 피터가 시니어 골퍼에게 태블릿 스윙 데이터를 설명하는 장면, 자연스러운 대화 포즈, 모자·상의·배경에 MASSGOO 로고 명확, 따뜻한 피팅 스튜디오' },
    { id: 'scene5-senior', label: '장면5 가이드 장소 (시니어)', sceneStep: 5, tone: 'senior_emotional', imageType: 'background', logoOption: 'full-brand', prompt: '사람 없이, 골드 톤 프리미엄 시타룸, 대형 스크린과 고급 인테리어, 벽·선반·장비에 MASSGOO 로고 다중 노출, 따뜻한 조명, 가로형 배경' },
    { id: 'scene6-senior', label: '장면6 성공 회복 (시니어)', sceneStep: 6, tone: 'senior_emotional', imageType: 'feed', logoOption: 'full-brand', prompt: '골드 톤, 60대 한국인 골퍼 2~4명이 골프장 코스에서 성취감과 만족감을 표현하는 전신 풀샷, 자연스러운 상호작용과 긍정적인 분위기, 성공을 함께 나누는 모습, 밝은 미소, MASSGOO 로고 명확' },
    { id: 'scene7-senior', label: '장면7 여운 정적 (시니어)', sceneStep: 7, tone: 'senior_emotional', imageType: 'background', logoOption: 'full-brand', prompt: '골드/웜톤 시타룸 정적 컷, 트로피와 드라이버가 조명 아래, 배경에 MASSGOO 로고가 은은히 보이는 고급 라운지 느낌, 사람 없음, 가로형' },
    // 하이테크 톤
    { id: 'scene1-hightech', label: '장면1 행복한 주인공 (하이테크)', sceneStep: 1, tone: 'high_tech_innovative', imageType: 'feed', logoOption: 'full-brand', prompt: '쿨 블루 톤, 밝은 조명, 30~40대 한국인 골퍼가 골프장 코스나 티샷 장소에서 자신감 있게 미소 짓는 전신 풀샷, 자연스러운 포즈, 밝은 네온/LED 라인, 모자·상의·배경에 MASSGOO 로고 2~3곳, 자연스러운 즐거운 분위기' },
    { id: 'scene2-hightech', label: '장면2 행복+불안 전조 (하이테크)', sceneStep: 2, tone: 'high_tech_innovative', imageType: 'feed', logoOption: 'full-brand', prompt: '밝은 블루 톤, 30~40대 한국인 골퍼 2~4명이 클럽하우스 라운지에서 시뮬레이터 화면을 보며 웃지만 약간 긴장한 표정, 자연스러운 그룹 포즈, 테크 장비와 데이터 화면, 밝은 조명, MASSGOO 브랜딩, 자연스러운 일상 분위기' },
    { id: 'scene3-hightech', label: '장면3 문제 발생 (하이테크)', sceneStep: 3, tone: 'high_tech_innovative', imageType: 'feed', logoOption: 'full-brand', prompt: '쿨톤, 30~40대 한국인 골퍼가 연습장 그린에서 퍼포먼스 하락 그래프를 보며 심각한 표정의 전신 풀샷, 하이테크 장비와 모니터, MASSGOO 로고는 배경 장비에 명확' },
    { id: 'scene4-hightech', label: '장면4 가이드 만남 (하이테크)', sceneStep: 4, tone: 'high_tech_innovative', imageType: 'feed', logoOption: 'full-brand', prompt: '쿨 블루 톤, 밝은 조명, 젊은 한국인 피터가 고해상도 스윙 데이터/3D 모델을 태블릿으로 설명하는 자연스러운 대화 포즈, 밝은 하이테크 시타룸, 모자·상의·배경에 MASSGOO 로고 명확' },
    { id: 'scene5-hightech', label: '장면5 가이드 장소 (하이테크)', sceneStep: 5, tone: 'high_tech_innovative', imageType: 'background', logoOption: 'full-brand', prompt: '사람 없이, 쿨 블루 톤 밝은 하이테크 시타룸, 밝은 LED 라인/메탈릭 인테리어, 대형 스크린과 장비, 밝은 조명, 벽·장비에 MASSGOO 로고 다중 노출, 가로형' },
    { id: 'scene6-hightech', label: '장면6 성공 회복 (하이테크)', sceneStep: 6, tone: 'high_tech_innovative', imageType: 'feed', logoOption: 'full-brand', prompt: '밝은 블루 톤, 30~40대 한국인 골퍼 2~4명이 골프장 코스에서 기술적 성취와 자신감을 표현하는 전신 풀샷, 자연스러운 상호작용과 혁신적인 분위기, 데이터 개선의 기쁨을 공유하는 모습, 하이테크 장비와 MASSGOO 로고 배경, 밝고 선명한 조명' },
    { id: 'scene7-hightech', label: '장면7 여운 정적 (하이테크)', sceneStep: 7, tone: 'high_tech_innovative', imageType: 'background', logoOption: 'full-brand', prompt: '밝은 쿨 블루 톤 테크 룸 정적 컷, 밝게 켜진 스크린과 장비가 보이는 장면, 밝은 조명, MASSGOO 네온 사인이 밝게 켜져 있음, 사람 없음, 가로형' },
  ];

  const selectedPresetObj = storyPresets.find((p) => p.id === selectedPreset) || null;

  // 장소 옵션 정의 (8개) - 컴포지션 타입 추가
  const locationOptions = [
    { 
      id: 'fitting-studio', 
      label: '피팅 스튜디오', 
      prompt: 'premium golf fitting studio with swing analysis equipment, professional fitting room, bright well-lit interior, bright LED lighting, MASSGOO branding visible',
      compositionType: 'portrait', // 포트레이트 (상반신)
      actionType: 'conversation', // 대화
      peopleCount: '1-2', // 1-2명
      defaultScenes: [4, 5, 7] // 장면4, 5, 7 기본값
    },
    { 
      id: 'golf-course', 
      label: '골프장 코스', 
      prompt: 'golf course fairway with lush green grass, trees in background, blue sky with white clouds, natural outdoor lighting, professional golf course setting',
      compositionType: 'full-shot-group', // 풀샷 + 여러 명
      actionType: 'natural-activity', // 자연스러운 활동
      peopleCount: '2-4', // 2-4명
      defaultScenes: [1, 6] // 장면1, 6 기본값
    },
    { 
      id: 'tee-box', 
      label: '골프장 티샷 장소', 
      prompt: 'golf course tee box area with tee markers, professional golf course setting, tee markers visible, golf course background',
      compositionType: 'full-shot-action', // 풀샷 + 티샷 동작
      actionType: 'swinging', // 스윙 동작
      peopleCount: '1-3', // 1-3명
      defaultScenes: [1, 6] // 장면1, 6 기본값
    },
    { 
      id: 'clubhouse-lounge', 
      label: '골프 클럽하우스 라운지', 
      prompt: 'golf clubhouse lounge with elegant interior, trophy displays, comfortable seating, sophisticated atmosphere, warm lighting, MASSGOO branding visible',
      compositionType: 'group', // 그룹
      actionType: 'conversation', // 대화
      peopleCount: '2-4', // 2-4명
      defaultScenes: [2, 7] // 장면2, 7 기본값
    },
    { 
      id: 'practice-green', 
      label: '골프 연습장 그린', 
      prompt: 'golf practice putting green with flag, professional practice facility, putting green surface, practice area, focused atmosphere',
      compositionType: 'full-shot', // 풀샷
      actionType: 'putting', // 퍼팅
      peopleCount: '1-2', // 1-2명
      defaultScenes: [3] // 장면3 기본값
    },
    { 
      id: 'indoor-driving-range', 
      label: '인도어 드라이버 연습장', 
      prompt: 'indoor driving range practice facility with hitting bays and targets, practice range setting, indoor golf practice area, bright well-lit interior, bright professional lighting',
      compositionType: 'full-shot-action', // 풀샷 + 동작
      actionType: 'swinging', // 스윙
      peopleCount: '1-2', // 1-2명
      defaultScenes: []
    },
    { 
      id: 'sports-center', 
      label: '실내 스포츠 센터', 
      prompt: 'indoor sports center practice area with modern facilities, contemporary sports facility, clean modern interior, bright well-lit space, bright professional lighting',
      compositionType: 'full-shot', // 풀샷
      actionType: 'natural-activity', // 자연스러운 활동
      peopleCount: '1-3', // 1-3명
      defaultScenes: []
    },
    { 
      id: 'screen-golf', 
      label: '실내 스크린 골프장', 
      prompt: 'indoor screen golf simulator room with large projection screen displaying golf course simulation, modern simulator technology, immersive golf experience, bright well-lit interior, bright LED lighting',
      compositionType: 'full-shot', // 풀샷
      actionType: 'swinging', // 스윙
      peopleCount: '1-3', // 1-3명
      defaultScenes: []
    },
  ];

  // 프리셋 선택 시 기본 장소 자동 설정
  const getDefaultLocation = (sceneStep?: number): string | undefined => {
    if (!sceneStep) return undefined;
    const location = locationOptions.find(loc => loc.defaultScenes.includes(sceneStep));
    return location?.id;
  };

  // 계절/요일 무관 프롬프트 생성 (장소별 컴포지션 추가)
  const buildUniversalPrompt = (userPrompt: string, tone: 'senior_emotional' | 'high_tech_innovative', selectedLocation?: string, improveHandQuality?: boolean, enhanceFullShot?: boolean, removeForegroundObstruction?: boolean) => {
    const toneGuide = brandToneGuides[tone];
    
    // 장소별 컴포지션 지시 생성
    let compositionSpec = '';
    if (selectedLocation) {
      const locationObj = locationOptions.find(loc => loc.id === selectedLocation);
      if (locationObj) {
        if (locationObj.compositionType === 'full-shot-group') {
          compositionSpec = `
**Composition Requirements (Full Body Shot with Group):**
- Full body shot (full-length portrait), showing the entire person from head to toe, NOT a close-up or portrait shot
- Natural, candid photography style, NOT a formal portrait or ID photo style
- ${locationObj.peopleCount} Korean golfers of various ages (men and women, different generations) naturally interacting
- People should be engaged in natural activities through various expressions: celebrating success, sharing achievements, congratulating each other, enjoying the moment together, expressing joy and satisfaction through natural gestures and expressions (NOT limited to a single specific action, but including diverse celebratory interactions)
- Dynamic, lively atmosphere with genuine smiles and joyful expressions
- Natural poses, NOT standing still facing the camera directly
- People should be positioned naturally in the scene, NOT in a line or formal arrangement
- Candid moment captured, NOT a posed group photo
- Vary the specific interactions and poses to create unique compositions each time`;
        } else if (locationObj.compositionType === 'full-shot-action') {
          compositionSpec = `
**Composition Requirements (Full Body Shot with Action):**
- Full body shot (full-length portrait), showing the entire person from head to toe, NOT a close-up or portrait shot
- Action shot: golfer in mid-swing or preparing to swing at tee box, dynamic movement captured
- Natural golf swing motion, ${locationObj.peopleCount === '1-3' ? '1-3 Korean golfers' : 'Korean golfer'}, can include caddies or fellow golfers
- Natural, candid photography style, capturing the moment, NOT a posed action shot
- Dynamic, energetic atmosphere with focused expressions
- NOT a static pose, but a moment of action captured`;
          
          // 전신 풀샷 강화 옵션이 켜져 있을 때만 추가 스펙 적용
          if (enhanceFullShot) {
            compositionSpec += `
**CRITICAL - Enhanced Full Body Shot (Camera Angle Optimization):**
- Camera angle: Eye-level or slightly elevated angle, NOT low angle that would show grass blocking the person
- Camera distance: Far enough to capture the entire body from head to toe, ensuring the person's full body is clearly visible
- Ground surface: Flat, level surface (tee box, fairway, or putting green), NOT uneven terrain
- The golfer's entire body must be clearly visible from head to toe, with no foreground elements blocking the view
- Professional photography angle that shows the full body without obstruction
- Ensure the person is positioned so that their full body is visible, not cut off by foreground elements`;
          }
        } else if (locationObj.compositionType === 'full-shot') {
          compositionSpec = `
**Composition Requirements (Full Body Shot):**
- Full body shot (full-length portrait), showing the entire person from head to toe, NOT a close-up or portrait shot
- Natural, candid photography style, NOT a formal portrait or ID photo style
- ${locationObj.peopleCount === '1-2' ? '1-2 Korean golfers' : locationObj.peopleCount === '1-3' ? '1-3 Korean golfers' : 'Korean golfer'} naturally engaged in ${locationObj.actionType === 'swinging' ? 'golf swing action' : locationObj.actionType === 'putting' ? 'putting practice' : 'natural activity'}
- Natural poses, NOT standing still facing the camera directly
- Dynamic, lively atmosphere`;
          
          // 전신 풀샷 강화 옵션이 켜져 있을 때만 추가 스펙 적용
          if (enhanceFullShot) {
            compositionSpec += `
**CRITICAL - Enhanced Full Body Shot (Camera Angle Optimization):**
- Camera angle: Eye-level or slightly elevated angle, NOT low angle that would show grass blocking the person
- Camera distance: Far enough to capture the entire body from head to toe, ensuring the person's full body is clearly visible
- Ground surface: Flat, level surface, NOT uneven terrain
- The person's entire body must be clearly visible from head to toe, with no foreground elements blocking the view
- Professional photography angle that shows the full body without obstruction`;
          }
        } else if (locationObj.compositionType === 'group') {
          compositionSpec = `
**Composition Requirements (Group Shot):**
- Natural group composition with ${locationObj.peopleCount} Korean golfers of various ages
- People engaged in ${locationObj.actionType === 'conversation' ? 'natural conversation, chatting, laughing together' : 'natural activities'}
- Natural, candid photography style, NOT a formal group photo
- People positioned naturally, NOT in a line or formal arrangement
- Dynamic, lively atmosphere with genuine interactions`;
        }
        
        // 하이테크 톤이고 실내 장소일 때 밝은 조명 지시 추가
        if (tone === 'high_tech_innovative' && 
            ['fitting-studio', 'sports-center', 'screen-golf', 'indoor-driving-range'].includes(selectedLocation)) {
          compositionSpec += `
**CRITICAL - Bright Indoor Lighting (High-tech Tone):**
- Bright, well-lit interior space, NOT dark or dim
- Professional bright LED lighting, bright blue lighting accents
- Bright and airy atmosphere, bright cool blue tones
- Well-lit surfaces, bright lighting throughout the scene
- Bright, cheerful, and professional atmosphere
- The scene must be bright and well-lit, similar to KakaoTalk content (bright blue tone, not dark)`;
        }
      }
    }
    
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
${compositionSpec}${improveHandQuality ? `
**Natural Hand Positioning and Quality:**
- Hands should be in natural, relaxed positions with correct anatomy
- If hands are visible, they should have 5 fingers, proper proportions, natural hand structure
- Hands should be fully visible, not cut off or partially hidden
- Natural hand gestures that convey the intended emotion or action
- Professional hand positioning, not awkward or unnatural poses
- If holding objects (tablet, golf club, etc.), hands should grip naturally with all fingers visible and properly proportioned` : ''}
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
    const promptText = (formData.prompt || '').trim() || 'product-only, no people, natural light, high detail, 4k';

    // 베이스 이미지 모드 확인
    if (formData.productOnlyMode) {
      // 제품컷 전용 모드: 모델 이미지 없이 제품만 생성
      if (!formData.selectedProductId) {
        alert('제품을 선택해주세요.');
        return;
      }

      setLoading(true);
      setGeneratedImages([]);
      setCompositionStatus('제품컷 생성 중...');

      try {
        const composeResponse = await fetch('/api/compose-product-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId: formData.selectedProductId,
            productOnlyMode: true,
            compositionBackground: formData.compositionBackground || 'natural',
            prompt: promptText,
            numImages: 1,
            resolution: '1K',
            aspectRatio: 'auto',
            outputFormat: 'png',
          }),
        });

        if (!composeResponse.ok) {
          const error = await composeResponse.json();
          console.error('제품컷 생성 실패:', error);
          alert(error.error || '제품컷 생성에 실패했습니다.');
          setLoading(false);
          return;
        }

        const composeResult = await composeResponse.json();
        if (composeResult.success && composeResult.images && composeResult.images.length > 0) {
          const mapped = composeResult.images
            .map((img: any) => ({
              url: img.imageUrl || img.url || img.originalUrl,
              path: img.path,
              originalUrl: img.originalUrl || img.url || img.imageUrl,
              product: composeResult.product,
              metadata: composeResult.metadata,
              isComposed: true,
            }))
            .filter((img: any) => !!img.url);

          if (mapped.length === 0) {
            alert('제품컷 결과가 없습니다. (이미지 URL 없음)');
          } else {
            setGeneratedImages(mapped);
          }
        } else {
          alert('제품컷 결과가 없습니다.');
        }
      } catch (error: any) {
        console.error('제품컷 생성 오류:', error);
        alert(error.message || '제품컷 생성 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
        setCompositionStatus('');
      }
      return;
    }

    if (formData.baseImageMode === 'gallery') {
      // 갤러리에서 선택한 경우: AI 생성 스킵하고 바로 제품 합성
      if (!formData.selectedBaseImageUrl) {
        alert('갤러리에서 베이스 이미지를 선택해주세요.');
        return;
      }

      if (!formData.enableProductComposition || !formData.selectedProductId) {
        alert('제품 합성을 활성화하고 제품을 선택해주세요.');
        return;
      }

      setLoading(true);
      setGeneratedImages([]);
      setCompositionStatus('제품 합성 준비 중...');

      try {
        // 갤러리에서 선택한 이미지로 바로 제품 합성
        const composeResponse = await fetch('/api/compose-product-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            modelImageUrl: formData.selectedBaseImageUrl,
            productId: formData.selectedProductId,
            compositionMethod: formData.compositionMethod || 'nano-banana-pro',
            replaceLogo: formData.replaceLogo || false,
            numImages: 1,
            resolution: '1K',
            aspectRatio: 'auto',
            outputFormat: 'png',
            compositionBackground: formData.compositionTarget === 'head'
              ? formData.compositionBackground || 'natural'
              : undefined,
            baseImageUrl: formData.selectedBaseImageUrl, // 베이스 이미지 URL 전달 (저장 위치 결정용)
          }),
        });

        if (!composeResponse.ok) {
          const error = await composeResponse.json();
          throw new Error(error.error || '제품 합성에 실패했습니다.');
        }

        const composeResult = await composeResponse.json();
        
        if (composeResult.success && composeResult.images && composeResult.images.length > 0) {
          setGeneratedImages([{
            url: composeResult.images[0].imageUrl,
            path: composeResult.images[0].path,
            originalUrl: composeResult.images[0].originalUrl,
            product: composeResult.product,
            metadata: composeResult.metadata,
            isComposed: true,
          }]);
          console.log('✅ 갤러리 이미지 제품 합성 완료:', composeResult.product.name);
        } else {
          throw new Error('제품 합성 결과가 없습니다.');
        }

        setCompositionStatus('');
      } catch (error: any) {
        console.error('❌ 제품 합성 오류:', error);
        alert(`제품 합성 중 오류가 발생했습니다: ${error.message}`);
      } finally {
        setLoading(false);
      }
      return; // 갤러리 모드에서는 여기서 종료
    }

    // 새 이미지 생성 모드 (기존 로직)
    setLoading(true);
    setGeneratedImages([]);
    setOptimizedPrompt(null); // 최적화된 프롬프트 초기화

    try {
      let userPrompt = (formData.prompt || '').trim() || 'product-only, no people, natural light, high detail, 4k';
      let optimizedByChatGPT = false;

      // 로고 옵션이 활성화된 경우, 사용자 프롬프트에 로고 관련 내용이 없으면 추가
      if ((formData.logoOption === 'logo' || formData.logoOption === 'full-brand') && 
          !userPrompt.includes('MASSGOO') && 
          !userPrompt.includes('로고') && 
          !userPrompt.includes('브랜딩')) {
        userPrompt = `${userPrompt}, 피터가 모자를 쓰고 있고 모자와 옷에 MASSGOO 로고가 명확하게 보임, 스튜디오 벽면이나 아트월에 MASSGOO 브랜딩이 표시됨`;
      }

      // 선택한 장소를 프롬프트에 추가 및 컴포지션 지시 추가
      if (formData.selectedLocation) {
        const selectedLocationObj = locationOptions.find(loc => loc.id === formData.selectedLocation);
        if (selectedLocationObj) {
          // 장소 프롬프트 추가
          if (!userPrompt.includes(selectedLocationObj.prompt.split(',')[0])) {
            userPrompt = `${userPrompt}, ${selectedLocationObj.prompt}`;
          }
          
          // 장소별 컴포지션 지시 추가 (프롬프트에 명시적으로 포함)
          if (selectedLocationObj.compositionType === 'full-shot-group') {
            userPrompt = `${userPrompt}, full body shot showing entire person from head to toe, ${selectedLocationObj.peopleCount} Korean golfers of various ages (men and women, different generations) naturally interacting through various expressions: celebrating success, sharing achievements, congratulating each other, enjoying the moment together, expressing joy and satisfaction through natural gestures (NOT limited to a single specific action), natural poses not facing camera directly, dynamic lively atmosphere with genuine smiles, candid moment captured not a posed group photo`;
          } else if (selectedLocationObj.compositionType === 'full-shot-action') {
            userPrompt = `${userPrompt}, full body shot showing entire person from head to toe, golfer in mid-swing or preparing to swing at tee box, natural golf swing motion, dynamic movement captured, ${selectedLocationObj.peopleCount === '1-3' ? '1-3 Korean golfers' : 'Korean golfer'}, natural candid photography style capturing the moment, not a static pose`;
          } else if (selectedLocationObj.compositionType === 'full-shot') {
            userPrompt = `${userPrompt}, full body shot showing entire person from head to toe, not a close-up or portrait shot, ${selectedLocationObj.peopleCount === '1-2' ? '1-2 Korean golfers' : selectedLocationObj.peopleCount === '1-3' ? '1-3 Korean golfers' : 'Korean golfer'} naturally engaged in activity, natural poses not facing camera directly`;
          } else if (selectedLocationObj.compositionType === 'group') {
            userPrompt = `${userPrompt}, natural group composition with ${selectedLocationObj.peopleCount} Korean golfers of various ages, people engaged in natural conversation and activities, natural candid photography style, people positioned naturally not in a line`;
          }
        }
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

      // 프롬프트 최적화 (장소 정보 전달)
      const optimizedPrompt = buildUniversalPrompt(userPrompt, formData.brandTone, formData.selectedLocation, formData.improveHandQuality, formData.enhanceFullShot, formData.removeForegroundObstruction);

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
            sceneStep: formData.sceneStep, // 장면 번호 전달
            improveHandQuality: formData.improveHandQuality || false, // 손 표현 개선 옵션
            enhanceFullShot: formData.enhanceFullShot || false, // 전신 풀샷 강화 옵션
            removeForegroundObstruction: formData.removeForegroundObstruction || false, // 인물 앞 장애물 제거 옵션
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
        return;
      }

      // 제품 합성 활성화 시
      let composedImages: any[] = [];
      if (formData.enableProductComposition && formData.selectedProductId) {
        setCompositionStatus('제품 합성 준비 중...');
        
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
                compositionTarget: formData.compositionTarget || 'hands',
                driverPart: formData.driverPart || 'full',
                compositionMethod: formData.compositionMethod || 'nano-banana-pro',
                replaceLogo: formData.replaceLogo || false,
                changeProductColor: formData.changeProductColor || false,
                productColor: formData.productColor,
                numImages: 1,
                resolution: '1K',
                aspectRatio: 'auto',
                outputFormat: 'png',
                compositionBackground: (formData.compositionTarget === 'head' || formData.compositionTarget === 'accessory')
                  ? formData.compositionBackground || 'natural'
                  : undefined,
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
      
      console.log('🎉 최종 generatedImages 상태:', modelImages.length > 0 || (formData.enableProductComposition && formData.selectedProductId && composedImages.length > 0) ? '이미지 있음' : '이미지 없음');
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
                {/* 기본 생성 설정 */}
                <div className="space-y-6">
                {/* 프리셋 카드: 시니어/하이테크 분리 + 토글 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    스토리 기반 프리셋 (장면 1~7 × 시니어/하이테크)
                  </label>
                  
                  {/* 시니어 톤 카드 */}
                  <div className="mb-4 border-2 border-yellow-300 rounded-lg overflow-hidden bg-gradient-to-br from-yellow-50 to-amber-50">
                    <button
                      type="button"
                      onClick={() => {
                        setExpandedTone(expandedTone === 'senior' || expandedTone === 'both' ? (expandedTone === 'both' ? 'hightech' : 'none') : (expandedTone === 'hightech' ? 'both' : 'senior'));
                      }}
                      className="w-full p-4 flex items-center justify-between hover:bg-yellow-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div>
                          <div className="font-semibold text-gray-900">시니어 톤</div>
                          <div className="text-xs text-gray-600">골드 톤, 따뜻한 분위기</div>
                        </div>
                      </div>
                      <div className="text-gray-500">
                        {expandedTone === 'senior' || expandedTone === 'both' ? '▲' : '▼'}
                      </div>
                    </button>
                    
                    {(expandedTone === 'senior' || expandedTone === 'both') && (
                      <div className="p-4 bg-white border-t border-yellow-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {storyPresets.filter(p => p.tone === 'senior_emotional').map((preset) => {
                            const isSelected = preset.id === selectedPreset;
                            return (
                              <button
                                key={preset.id}
                                type="button"
                                onClick={() => {
                                  setSelectedPreset(preset.id);
                                  const defaultLocation = getDefaultLocation(preset.sceneStep);
                                  setFormData((prev) => ({
                                    ...prev,
                                    prompt: preset.prompt,
                                    brandTone: preset.tone,
                                    imageType: preset.imageType,
                                    logoOption: preset.logoOption,
                                    imageCount: 1,
                                    sceneStep: preset.sceneStep,
                                    selectedLocation: defaultLocation, // 기본 장소 자동 설정
                                    naturalStyle: true,
                                    // useChatGPT는 사용자 설정 유지 (localStorage에서 불러온 값 유지)
                                  }));
                                }}
                                className={`w-full p-3 border-2 rounded-lg text-left transition-all ${
                                  isSelected
                                    ? 'border-yellow-500 bg-yellow-50 ring-2 ring-yellow-200'
                                    : 'border-gray-200 bg-white hover:border-yellow-300'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <div className="text-xs font-semibold text-gray-600">장면 {preset.sceneStep}</div>
                                  {isSelected && <span className="text-sm font-bold text-yellow-700">✓</span>}
                                </div>
                                <div className="font-semibold text-gray-900 text-sm leading-snug">
                                  {preset.label.replace(' (시니어)', '')}
                                </div>
                                <div className="mt-1 text-xs text-gray-600 flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                                    시니어 톤
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                    {preset.imageType === 'background' ? '배경' : preset.imageType === 'profile' ? '프로필' : '피드'}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-gray-500 line-clamp-2">{preset.prompt}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 하이테크 톤 카드 */}
                  <div className="border-2 border-blue-300 rounded-lg overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50">
                    <button
                      type="button"
                      onClick={() => {
                        setExpandedTone(expandedTone === 'hightech' || expandedTone === 'both' ? (expandedTone === 'both' ? 'senior' : 'none') : (expandedTone === 'senior' ? 'both' : 'hightech'));
                      }}
                      className="w-full p-4 flex items-center justify-between hover:bg-blue-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <div>
                          <div className="font-semibold text-gray-900">하이테크 톤</div>
                          <div className="text-xs text-gray-600">블랙 톤, 현대적 분위기</div>
                        </div>
                      </div>
                      <div className="text-gray-500">
                        {expandedTone === 'hightech' || expandedTone === 'both' ? '▲' : '▼'}
                      </div>
                    </button>
                    
                    {(expandedTone === 'hightech' || expandedTone === 'both') && (
                      <div className="p-4 bg-white border-t border-blue-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {storyPresets.filter(p => p.tone === 'high_tech_innovative').map((preset) => {
                            const isSelected = preset.id === selectedPreset;
                            return (
                              <button
                                key={preset.id}
                                type="button"
                                onClick={() => {
                                  setSelectedPreset(preset.id);
                                  const defaultLocation = getDefaultLocation(preset.sceneStep);
                                  setFormData((prev) => ({
                                    ...prev,
                                    prompt: preset.prompt,
                                    brandTone: preset.tone,
                                    imageType: preset.imageType,
                                    logoOption: preset.logoOption,
                                    imageCount: 1,
                                    sceneStep: preset.sceneStep,
                                    selectedLocation: defaultLocation, // 기본 장소 자동 설정
                                    naturalStyle: true,
                                    // useChatGPT는 사용자 설정 유지 (localStorage에서 불러온 값 유지)
                                  }));
                                }}
                                className={`w-full p-3 border-2 rounded-lg text-left transition-all ${
                                  isSelected
                                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                    : 'border-gray-200 bg-white hover:border-blue-300'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <div className="text-xs font-semibold text-gray-600">장면 {preset.sceneStep}</div>
                                  {isSelected && <span className="text-sm font-bold text-blue-700">✓</span>}
                                </div>
                                <div className="font-semibold text-gray-900 text-sm leading-snug">
                                  {preset.label.replace(' (하이테크)', '')}
                                </div>
                                <div className="mt-1 text-xs text-gray-600 flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                    하이테크 톤
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                    {preset.imageType === 'background' ? '배경' : preset.imageType === 'profile' ? '프로필' : '피드'}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-gray-500 line-clamp-2">{preset.prompt}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 프리셋 적용 표시 */}
                {selectedPreset && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-green-800 mb-1">
                          ✓ 프리셋 적용됨: {selectedPresetObj ? selectedPresetObj.label : selectedPreset}
                        </p>
                        <p className="text-xs text-green-700">
                          브랜딩 톤: {formData.brandTone === 'senior_emotional' ? '시니어 감성적' : '하이테크 혁신형'} | 
                          이미지 타입: {formData.imageType === 'feed' ? '피드' : formData.imageType === 'background' ? '배경' : '프로필'} | 
                          로고: {formData.logoOption === 'full-brand' ? '전체 브랜딩' : formData.logoOption === 'logo' ? '로고만' : '없음'} | 
                          개수: {formData.imageCount}개
                          {formData.sceneStep && ` | 장면: ${formData.sceneStep}`}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedPreset(null);
                          setFormData({
                            ...formData,
                            prompt: '',
                            sceneStep: undefined, // 장면 번호 초기화
                            selectedLocation: undefined, // 장소 초기화
                          });
                        }}
                        className="text-xs text-green-600 hover:text-green-800 px-2 py-1 border border-green-300 rounded hover:bg-green-100"
                      >
                        초기화
                      </button>
                    </div>
                  </div>
                )}

                {/* 장소 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    장소 선택 {selectedPreset && <span className="text-xs text-gray-500">(프리셋 기본값 자동 설정됨)</span>}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {locationOptions.map((location) => {
                      const isSelected = formData.selectedLocation === location.id;
                      const isDefault = selectedPresetObj && location.defaultScenes.includes(selectedPresetObj.sceneStep);
                      return (
                        <button
                          key={location.id}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              selectedLocation: location.id,
                            }));
                          }}
                          className={`p-3 border-2 rounded-lg text-center text-xs transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                              : isDefault
                              ? 'border-yellow-300 bg-yellow-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="font-semibold text-gray-900">{location.label}</div>
                          {isDefault && !isSelected && (
                            <div className="text-xs text-yellow-600 mt-1">기본값</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 브랜딩 톤 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    브랜딩 톤 *
                    <span className="text-xs text-gray-500 font-normal ml-2">(프리셋 미선택 시에도 적용됩니다)</span>
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

                {/* 고급 설정 토글 */}
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="text-sm font-medium text-gray-800">고급 설정 (이미지 타입, 브랜딩 옵션, 개수, 스타일)</div>
                  <button
                    type="button"
                    onClick={() => setShowAdvanced((v) => !v)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {showAdvanced ? '숨기기' : '펼치기'}
                  </button>
                </div>

                {showAdvanced && (
                  <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-white">
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
                          onChange={(e) => handleUseChatGPTChange(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {/* 손 표현 개선 옵션 */}
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex-1">
                        <label htmlFor="improveHandQuality" className="block text-sm font-medium text-gray-700 mb-1">
                          손 표현 개선
                        </label>
                        <p className="text-xs text-gray-500">
                          손이 어색하게 나올 때만 활성화 (손가락 개수, 비율, 자세 개선)
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input
                          type="checkbox"
                          id="improveHandQuality"
                          checked={formData.improveHandQuality || false}
                          onChange={(e) => handleImproveHandQualityChange(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {/* 전신 풀샷 강화 옵션 */}
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex-1">
                        <label htmlFor="enhanceFullShot" className="block text-sm font-medium text-gray-700 mb-1">
                          전신 풀샷 강화 (카메라 각도 최적화)
                        </label>
                        <p className="text-xs text-gray-500">
                          전신이 명확히 보이도록 카메라 각도와 거리를 최적화 (티샷 장소 등에서 유용)
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input
                          type="checkbox"
                          id="enhanceFullShot"
                          checked={formData.enhanceFullShot || false}
                          onChange={(e) => handleEnhanceFullShotChange(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {/* 인물 앞 장애물 제거 옵션 */}
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex-1">
                        <label htmlFor="removeForegroundObstruction" className="block text-sm font-medium text-gray-700 mb-1">
                          인물 앞 장애물 제거
                        </label>
                        <p className="text-xs text-gray-500">
                          인물 앞에 아웃포커싱된 잔디나 장애물 제거 (벙커 등 특수 장소에서는 비활성화 권장)
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input
                          type="checkbox"
                          id="removeForegroundObstruction"
                          checked={formData.removeForegroundObstruction || false}
                          onChange={(e) => handleRemoveForegroundObstructionChange(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                )}
                </div>

                {/* 제품 합성 & 베이스 이미지 & 프롬프트 */}
                <div className="space-y-6">
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

                {/* 합성 타겟 선택 (제품 합성 활성화 시 표시) */}
                {formData.enableProductComposition && (
                  <div className="p-4 border border-blue-200 rounded-lg bg-blue-50 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        합성 타겟 선택 *
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setFormData({ 
                            ...formData, 
                            compositionTarget: 'hands',
                            selectedProductId: undefined // 타겟 변경 시 제품 선택 초기화
                          })}
                          className={`px-4 py-3 rounded-lg border-2 transition-all ${
                            formData.compositionTarget === 'hands'
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-semibold">손에 드라이버 합성</div>
                          <div className="text-xs mt-1 text-gray-500">골프 드라이버를 손에 합성</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ 
                            ...formData, 
                            compositionTarget: 'head',
                            selectedProductId: undefined // 타겟 변경 시 제품 선택 초기화
                          })}
                          className={`px-4 py-3 rounded-lg border-2 transition-all ${
                            formData.compositionTarget === 'head'
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-semibold">머리에 모자 합성</div>
                          <div className="text-xs mt-1 text-gray-500">모자를 머리에 합성</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ 
                            ...formData, 
                            compositionTarget: 'accessory',
                            selectedProductId: undefined // 타겟 변경 시 제품 선택 초기화
                          })}
                          className={`px-4 py-3 rounded-lg border-2 transition-all ${
                            formData.compositionTarget === 'accessory'
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-semibold">액세서리 합성</div>
                          <div className="text-xs mt-1 text-gray-500">가방, 클러치백 등을 합성</div>
                        </button>
                      </div>
                    </div>

                    {/* 제품 선택 UI */}
                    <div>
                      <ProductSelector
                      selectedProductId={formData.selectedProductId}
                      onSelect={(productId) => setFormData({ ...formData, selectedProductId: productId })}
                      compositionTarget={formData.compositionTarget || 'hands'}
                      showDescription={false}
                      layout="grid"
                    />
                    
                    {/* 드라이버 부위별 합성 옵션 (드라이버 선택 시) */}
                    {formData.compositionTarget === 'hands' && formData.selectedProductId && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          드라이버 부위별 합성 (고급 옵션)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {(['full', 'crown', 'sole', 'face'] as const).map((part) => (
                            <button
                              key={part}
                              type="button"
                              onClick={() => setFormData({ ...formData, driverPart: part })}
                              className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                                formData.driverPart === part
                                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              {part === 'full' ? '전체 헤드' : 
                               part === 'crown' ? '헤드 크라운' :
                               part === 'sole' ? '헤드 솔' : '헤드 페이스'}
                            </button>
                          ))}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          💡 기본값은 "전체 헤드"입니다. 특정 부위만 합성하려면 선택하세요.
                        </p>
                      </div>
                    )}

                    {/* 배경 타입 선택 (모자 합성 시) */}
                    {formData.compositionTarget === 'head' && formData.selectedProductId && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          배경 스타일
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {([
                            { value: 'natural', label: '자연 배경' },
                            { value: 'studio', label: '스튜디오(백화점/골프샵 DP)' },
                            { value: 'product-page', label: '상품페이지(단색 배경)' },
                          ] as const).map(option => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setFormData({ ...formData, compositionBackground: option.value })}
                              className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                                formData.compositionBackground === option.value
                                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          자연: 야외/자연광 / 스튜디오: 백화점·골프샵 DP 스타일 / 상품페이지: 화이트·라이트그레이 단색 e-commerce 스타일
                        </p>
                      </div>
                    )}

                    {/* 배경 타입 선택 (액세서리 합성 시) */}
                    {formData.compositionTarget === 'accessory' && formData.selectedProductId && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          배경 스타일
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {([
                            { value: 'natural', label: '자연 배경' },
                            { value: 'studio', label: '스튜디오(백화점/골프샵 DP)' },
                            { value: 'product-page', label: '상품페이지(단색 배경)' },
                          ] as const).map(option => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setFormData({ ...formData, compositionBackground: option.value })}
                              className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                                formData.compositionBackground === option.value
                                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          자연: 야외/자연광 / 스튜디오: 백화점·골프샵 DP 스타일 / 상품페이지: 화이트·라이트그레이 단색 e-commerce 스타일
                        </p>
                      </div>
                    )}

                    {/* 제품컷 전용 모드 */}
                    <div className="mt-4 flex items-center justify-between p-4 border border-purple-200 rounded-lg bg-purple-50">
                      <div className="flex-1">
                        <label htmlFor="productOnlyMode" className="block text-sm font-medium text-gray-700 mb-1">
                          제품컷 전용 모드 (사람 없이 제품만)
                        </label>
                        <p className="text-xs text-gray-500">
                          사람 합성 없이 선택한 제품만 배경 옵션에 맞춰 생성합니다.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input
                          type="checkbox"
                          id="productOnlyMode"
                          checked={formData.productOnlyMode || false}
                          onChange={(e) => setFormData({
                            ...formData,
                            productOnlyMode: e.target.checked,
                            enableProductComposition: e.target.checked ? true : formData.enableProductComposition
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

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

                    {/* 제품 색상 변경 옵션 (제품 선택 시에만 표시) */}
                    {formData.selectedProductId && (
                      <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-2 mb-3">
                          <input
                            type="checkbox"
                            id="changeProductColor"
                            checked={formData.changeProductColor || false}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              changeProductColor: e.target.checked,
                              productColor: e.target.checked ? formData.productColor : undefined
                            })}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor="changeProductColor" className="text-sm font-medium text-gray-700 cursor-pointer">
                            제품 색상 변경
                          </label>
                        </div>
                        
                        {formData.changeProductColor && (
                          <div className="mt-3">
                            <label className="block text-xs text-gray-600 mb-2">색상 선택:</label>
                            <div className="grid grid-cols-6 gap-2">
                              {[
                                { name: 'black', label: '검정', color: '#000000' },
                                { name: 'white', label: '흰색', color: '#FFFFFF' },
                                { name: 'gray', label: '회색', color: '#808080' },
                                { name: 'navy', label: '네이비', color: '#001f3f' },
                                { name: 'beige', label: '베이지', color: '#f5f5dc' },
                                { name: 'brown', label: '갈색', color: '#8b4513' },
                                { name: 'red', label: '빨강', color: '#FF0000' },
                                { name: 'blue', label: '파랑', color: '#0000FF' },
                                { name: 'green', label: '초록', color: '#008000' },
                                { name: 'yellow', label: '노랑', color: '#FFFF00' },
                                { name: 'orange', label: '주황', color: '#FFA500' },
                                { name: 'purple', label: '보라', color: '#800080' }
                              ].map((colorOption) => (
                                <button
                                  key={colorOption.name}
                                  type="button"
                                  onClick={() => setFormData({ ...formData, productColor: colorOption.name })}
                                  className={`w-10 h-10 rounded border-2 transition-all ${
                                    formData.productColor === colorOption.name
                                      ? 'border-blue-500 ring-2 ring-blue-200 scale-110'
                                      : 'border-gray-200 hover:border-gray-300 hover:scale-105'
                                  }`}
                                  style={{
                                    backgroundColor: colorOption.color
                                  }}
                                  title={colorOption.label}
                                />
                              ))}
                            </div>
                            <p className="mt-2 text-xs text-gray-500">
                              💡 로고와 텍스트는 그대로 유지되고 제품 색상만 변경됩니다. 체크 해제 시 원본 제품 색상이 사용됩니다.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 로고 자동 교체 옵션 */}
                    <div className="mt-4 flex items-center justify-between p-4 border border-green-200 rounded-lg bg-green-50">
                      <div className="flex-1">
                        <label htmlFor="replaceLogo" className="block text-sm font-medium text-gray-700 mb-1">
                          로고 자동 교체
                        </label>
                        <p className="text-xs text-gray-500">
                          모자나 옷의 로고를 MASSGOO로 자동 변경 (SGOO, MASGOO 등 자동 감지)
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input
                          type="checkbox"
                          id="replaceLogo"
                          checked={formData.replaceLogo || false}
                          onChange={(e) => setFormData({ ...formData, replaceLogo: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                  </div>
                    </div>
                )}

                {/* 베이스 이미지 모드 선택 */}
                <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    베이스 이미지 모드 *
                  </label>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ 
                        ...formData, 
                        baseImageMode: 'generate',
                        selectedBaseImageUrl: undefined
                      })}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        formData.baseImageMode === 'generate'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold text-gray-900">✨ 새 이미지 생성</div>
                      <div className="text-xs text-gray-600 mt-1">
                        AI로 새로운 이미지 생성
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ 
                        ...formData, 
                        baseImageMode: 'gallery',
                        enableProductComposition: true // 갤러리 모드일 때 자동으로 제품 합성 활성화
                      })}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        formData.baseImageMode === 'gallery'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold text-gray-900">🖼️ 갤러리에서 선택</div>
                      <div className="text-xs text-gray-600 mt-1">
                        기존 이미지에 제품 합성
                      </div>
                    </button>
                  </div>

                  {/* 갤러리 모드일 때 베이스 이미지 선택 */}
                  {formData.baseImageMode === 'gallery' && (
                    <div className="mt-4">
                      {/* 최근 사용 폴더 섹션 */}
                      {recentFolders.length > 0 && (
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            📁 최근 사용 폴더
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {recentFolders.map((folder, index) => {
                              // 폴더 경로를 읽기 쉽게 표시 (originals/ 제거)
                              const displayPath = folder.replace(/^originals\//, '');
                              return (
                                <div
                                  key={index}
                                  className={`relative p-3 border-2 rounded-lg cursor-pointer transition-all group ${
                                    selectedFolder === folder
                                      ? 'border-blue-500 bg-blue-50'
                                      : 'border-gray-200 hover:border-gray-300 bg-white'
                                  }`}
                                  onClick={() => {
                                    setSelectedFolder(folder);
                                    setRecentUploadFolder(folder);
                                    // 하위 호환성을 위해 기존 키도 저장
                                    if (typeof window !== 'undefined') {
                                      localStorage.setItem('lastSelectedImageFolder', folder);
                                    }
                                  }}
                                  title={folder} // 전체 경로를 툴팁으로 표시
                                >
                                  <div className="text-xs font-medium text-gray-700 truncate pr-6">
                                    {displayPath}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeRecentFolder(folder);
                                    }}
                                    className="absolute top-1 right-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                                    title="폴더 삭제"
                                  >
                                    ✕
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        베이스 이미지 선택 *
                      </label>
                      {formData.selectedBaseImageUrl ? (
                        <div className="relative border-2 border-green-500 rounded-lg p-4 bg-green-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <img 
                                src={formData.selectedBaseImageUrl} 
                                alt="선택된 베이스 이미지" 
                                className="w-20 h-20 object-cover rounded-lg"
                              />
                              <div>
                                <div className="text-sm font-medium text-gray-900">✅ 이미지 선택됨</div>
                                <div className="text-xs text-gray-500 truncate max-w-xs">
                                  {formData.selectedBaseImageUrl.split('/').pop()}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, selectedBaseImageUrl: undefined })}
                              className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg"
                            >
                              변경
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowBaseImageGallery(true)}
                          className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-center"
                        >
                          <div className="text-gray-500">
                            <svg className="mx-auto h-12 w-12 mb-2" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                          <div className="text-sm font-medium text-gray-700">
                            갤러리에서 베이스 이미지 선택
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            클릭하여 갤러리 열기
                          </div>
                        </button>
                      )}
                      <p className="mt-2 text-xs text-gray-500">
                        💡 갤러리에서 선택한 이미지에 제품을 합성합니다. 제품 합성이 자동으로 활성화됩니다.
                      </p>
                    </div>
                  )}
                </div>

                {/* 프롬프트 입력 (새 이미지 생성 모드 또는 제품컷 모드일 때 표시) */}
                {(formData.baseImageMode === 'generate' || formData.productOnlyMode) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이미지 설명 (프롬프트)
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
                      <br />
                      현재 브랜딩 톤:{' '}
                      {formData.brandTone === 'senior_emotional'
                        ? '시니어 중심 감성적 (골드 톤, 따뜻한 분위기)'
                        : '하이테크 중심 혁신형 (블랙 톤, 현대적 분위기)'}.
                    </p>
                  </div>
                )}

                {/* 생성 버튼 */}
                <button
                  onClick={handleGenerate}
                  disabled={
                    loading || 
                    (!formData.productOnlyMode && formData.baseImageMode === 'gallery' && !formData.selectedBaseImageUrl) ||
                    (!formData.productOnlyMode && formData.baseImageMode === 'gallery' && (!formData.enableProductComposition || !formData.selectedProductId)) ||
                    (formData.productOnlyMode && !formData.selectedProductId)
                  }
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {loading 
                    ? (formData.baseImageMode === 'gallery' ? '제품 합성 중...' : '이미지 생성 중...')
                    : (formData.baseImageMode === 'gallery' ? '제품 합성하기' : '이미지 생성하기')
                  }
                </button>
                </div>
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

      {/* 베이스 이미지 갤러리 선택 모달 */}
      <GalleryPicker
        isOpen={showBaseImageGallery}
        onClose={() => setShowBaseImageGallery(false)}
        onSelect={(imageUrl) => {
          // URL에서 폴더 경로 추출
          const folderPath = extractFolderPathFromUrl(imageUrl);
          
          setFormData({ 
            ...formData, 
            selectedBaseImageUrl: imageUrl,
            enableProductComposition: true // 갤러리에서 선택 시 자동으로 제품 합성 활성화
          });
          
          // 최근 폴더에 추가 및 선택
          if (folderPath) {
            addRecentFolder(folderPath);
            setSelectedFolder(folderPath);
            setRecentUploadFolder(folderPath);
            // 하위 호환성을 위해 기존 키도 저장
            if (typeof window !== 'undefined') {
              localStorage.setItem('lastSelectedImageFolder', folderPath);
            }
            console.log('📁 선택한 이미지 폴더:', folderPath);
          }
          
          setShowBaseImageGallery(false);
        }}
        autoFilterFolder={selectedFolder || recentUploadFolder || undefined} // 동적 폴더 필터 (선택된 폴더 우선)
        showCompareMode={true}
        maxCompareCount={3}
      />
    </>
  );
}

