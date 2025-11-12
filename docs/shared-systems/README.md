# 공통 시스템 재사용 가이드

MASGOLF 프로젝트에서 여러 메뉴에서 재사용 가능한 공통 시스템들을 정리한 문서입니다.

## 📋 목차

1. [브랜드 전략 시스템](./brand-strategy-system.md)
   - 페르소나와 오디언스 온도 기반 맞춤형 콘텐츠 생성
   - `components/admin/BrandStrategySelector.tsx`

2. [AI 이미지 생성 시스템](./ai-image-generation-system.md)
   - 골드톤 시니어 매너 / 블랙톤 젊은 매너 이미지 생성
   - 단락별 프롬프트 미리보기
   - 10월 8일 버전 안정적 생성

3. [프롬프트 설정 관리](./prompt-settings-manager.md)
   - 프롬프트 설정 저장/불러오기
   - JSON 내보내기/가져오기
   - 로컬 스토리지 기반 관리

4. [Self-Adaptive Automation](./self-adaptive-automation.md)
   - Playwright 기반 자동 오류 수정
   - 다중 선택자 시도
   - 재시도 로직

5. [갤러리 이미지 자산 관리](./gallery-asset-management.md)
   - 이미지 업로드/관리
   - 메타데이터 관리
   - 사용 위치 추적

## 🎯 사용 예시

### 카카오톡 콘텐츠 생성 페이지

```typescript
import BrandStrategySelector from '@/components/admin/BrandStrategySelector';
import { generateGoldToneImages, generateBlackToneImages } from '@/lib/ai-image-generation';
import { promptConfigManager } from '@/lib/prompt-config-manager';
import ImageSelector from '@/components/admin/gallery/ImageSelector';

export default function KakaoContentPage() {
  // 1. 브랜드 전략
  const [brandStrategy, setBrandStrategy] = useState(null);
  
  // 2. 프롬프트 설정
  const [savedConfigs, setSavedConfigs] = useState(
    promptConfigManager.getConfigs()
  );
  
  // 3. AI 이미지 생성
  const handleGenerateGoldTone = async () => {
    const images = await generateGoldToneImages(prompts, brandStrategy);
  };
  
  // 4. 갤러리 이미지 선택
  const [selectedImages, setSelectedImages] = useState([]);
  
  return (
    <div>
      <BrandStrategySelector onStrategyChange={setBrandStrategy} />
      <button onClick={handleGenerateGoldTone}>골드톤 생성</button>
      <ImageSelector onSelect={setSelectedImages} />
    </div>
  );
}
```

## 📚 관련 문서

- [카카오톡 콘텐츠 시스템 개발 계획](../phases/detailed-plans/phase-14-kakao-content-system.md)
- [워크플로우 시각화 시스템](../workflow-visualization-system.md)
- [갤러리 관리 시스템 완전 가이드](../gallery-complete-system-guide.md)


