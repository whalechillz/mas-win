# 프롬프트 설정 관리 시스템

## 📋 개요

프롬프트 설정을 저장하고 불러와서 일관성 있게 재사용할 수 있는 시스템입니다. 로컬 스토리지 기반으로 동작하며, JSON 파일로 내보내기/가져오기가 가능합니다.

## 📍 위치

- **소스 코드**: `pages/admin/blog.tsx` (2180-2348번째 줄)
- **저장소**: 브라우저 로컬 스토리지 (`localStorage.promptConfigs`)

## 🎯 주요 기능

1. **설정 저장**
   - 이름, 설명, 브랜드 전략 저장
   - 자동 타임스탬프 추가

2. **설정 불러오기**
   - 저장된 설정 목록 조회
   - 특정 설정 불러오기

3. **설정 삭제**
   - 불필요한 설정 제거

4. **JSON 내보내기/가져오기**
   - 설정 백업 및 공유

## 💻 사용 방법

### 기본 사용

```typescript
// 프롬프트 설정 관리자 객체
const promptConfigManager = {
  configs: {},
  
  init() {
    this.configs = this.loadConfigs();
  },
  
  saveConfig(name, config) {
    this.configs[name] = {
      ...config,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.saveToStorage();
    return this.configs[name];
  },
  
  getConfig(name) {
    return this.configs[name];
  },
  
  getAllConfigs() {
    return Object.keys(this.configs).map(name => ({
      name,
      ...this.configs[name]
    }));
  },
  
  deleteConfig(name) {
    delete this.configs[name];
    this.saveToStorage();
  },
  
  saveToStorage() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('promptConfigs', JSON.stringify(this.configs));
      }
    } catch (error) {
      console.error('설정 저장 실패:', error);
    }
  },
  
  loadConfigs() {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('promptConfigs');
        return stored ? JSON.parse(stored) : {};
      }
      return {};
    } catch (error) {
      console.error('설정 불러오기 실패:', error);
      return {};
    }
  },
  
  exportConfigs() {
    try {
      const dataStr = JSON.stringify(this.configs, null, 2);
      const dataBlob = new Blob([dataStr], {type: 'application/json'});
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `prompt-configs-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('설정 내보내기 실패:', error);
    }
  },
  
  importConfigs(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const result = e.target?.result;
          if (typeof result === 'string') {
            const importedConfigs = JSON.parse(result);
            this.configs = { ...this.configs, ...importedConfigs };
            this.saveToStorage();
            resolve(importedConfigs);
          } else {
            reject(new Error('파일 읽기 실패'));
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  },
  
  getConfigs() {
    return this.configs;
  }
};

// 초기화
promptConfigManager.init();
```

### 설정 저장

```typescript
const savePromptConfig = (name, description, brandStrategy) => {
  try {
    const config = promptConfigManager.saveConfig(name, {
      name,
      description,
      brandStrategy
    });
    alert(`설정 "${name}"이 성공적으로 저장되었습니다!`);
    return config;
  } catch (error) {
    console.error('설정 저장 실패:', error);
    alert('설정 저장에 실패했습니다.');
  }
};

// 사용 예시
savePromptConfig(
  '골드톤 시니어 매너',
  '시니어 타겟 골드톤 이미지 생성용 설정',
  {
    customerpersona: 'senior_fitting',
    customerChannel: 'local_customers',
    brandWeight: '높음',
    audienceTemperature: 'warm',
    audienceWeight: '높음'
  }
);
```

### 설정 불러오기

```typescript
const loadPromptConfig = (configName) => {
  return promptConfigManager.getConfig(configName);
};

// 사용 예시
const config = loadPromptConfig('골드톤 시니어 매너');
if (config) {
  console.log('브랜드 전략:', config.brandStrategy);
}
```

### 설정 삭제

```typescript
const deletePromptConfig = (configName) => {
  if (confirm(`설정 "${configName}"을 삭제하시겠습니까?`)) {
    promptConfigManager.deleteConfig(configName);
    alert(`설정 "${configName}"이 삭제되었습니다.`);
  }
};
```

### JSON 내보내기/가져오기

```typescript
// 내보내기
const exportPromptConfigs = () => {
  promptConfigManager.exportConfigs();
};

// 가져오기
const importPromptConfigs = (file) => {
  promptConfigManager.importConfigs(file)
    .then(() => {
      alert('설정이 성공적으로 가져와졌습니다!');
    })
    .catch((error) => {
      console.error('설정 가져오기 실패:', error);
      alert('설정 가져오기에 실패했습니다.');
    });
};
```

## 🔄 재사용 가능한 모듈로 추출 (권장)

### `lib/prompt-config-manager.ts` (신규 생성 필요)

```typescript
interface PromptConfig {
  name: string;
  description: string;
  brandStrategy: {
    customerpersona: string;
    customerChannel: string;
    brandWeight: string;
    audienceTemperature: string;
    audienceWeight?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

class PromptConfigManager {
  private configs: Record<string, PromptConfig> = {};
  private storageKey = 'promptConfigs';

  constructor() {
    this.loadConfigs();
  }

  saveConfig(name: string, config: Omit<PromptConfig, 'createdAt' | 'updatedAt'>): PromptConfig {
    this.configs[name] = {
      ...config,
      createdAt: this.configs[name]?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.saveToStorage();
    return this.configs[name];
  }

  getConfig(name: string): PromptConfig | undefined {
    return this.configs[name];
  }

  getAllConfigs(): PromptConfig[] {
    return Object.keys(this.configs).map(name => ({
      name,
      ...this.configs[name]
    }));
  }

  deleteConfig(name: string): void {
    delete this.configs[name];
    this.saveToStorage();
  }

  private saveToStorage(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(this.configs));
      }
    } catch (error) {
      console.error('설정 저장 실패:', error);
    }
  }

  private loadConfigs(): void {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(this.storageKey);
        this.configs = stored ? JSON.parse(stored) : {};
      }
    } catch (error) {
      console.error('설정 불러오기 실패:', error);
      this.configs = {};
    }
  }

  exportConfigs(): void {
    try {
      const dataStr = JSON.stringify(this.configs, null, 2);
      const dataBlob = new Blob([dataStr], {type: 'application/json'});
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `prompt-configs-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('설정 내보내기 실패:', error);
    }
  }

  async importConfigs(file: File): Promise<Record<string, PromptConfig>> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const result = e.target?.result;
          if (typeof result === 'string') {
            const importedConfigs = JSON.parse(result);
            this.configs = { ...this.configs, ...importedConfigs };
            this.saveToStorage();
            resolve(importedConfigs);
          } else {
            reject(new Error('파일 읽기 실패'));
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  }

  getConfigs(): Record<string, PromptConfig> {
    return this.configs;
  }
}

// 싱글톤 인스턴스
export const promptConfigManager = new PromptConfigManager();
```

## 📝 예시: 카카오톡 콘텐츠에 적용

```typescript
import { promptConfigManager } from '@/lib/prompt-config-manager';

export default function KakaoContentPage() {
  const [savedConfigs, setSavedConfigs] = useState(
    promptConfigManager.getConfigs()
  );
  const [selectedConfig, setSelectedConfig] = useState<string>('');

  // 설정 저장
  const handleSaveConfig = () => {
    promptConfigManager.saveConfig('카카오 골드톤', {
      name: '카카오 골드톤',
      description: '카카오톡 시니어 타겟 골드톤 설정',
      brandStrategy: {
        customerpersona: 'senior_fitting',
        customerChannel: 'local_customers',
        brandWeight: '높음',
        audienceTemperature: 'warm',
        audienceWeight: '높음'
      }
    });
    setSavedConfigs(promptConfigManager.getConfigs());
  };

  // 설정 불러오기
  const handleLoadConfig = (configName: string) => {
    const config = promptConfigManager.getConfig(configName);
    if (config) {
      setSelectedConfig(configName);
      // 브랜드 전략 적용
      applyBrandStrategy(config.brandStrategy);
    }
  };

  return (
    <div>
      <select 
        value={selectedConfig}
        onChange={(e) => handleLoadConfig(e.target.value)}
      >
        <option value="">기본 설정 사용</option>
        {Object.keys(savedConfigs).map(name => (
          <option key={name} value={name}>
            {savedConfigs[name].name} - {savedConfigs[name].description}
          </option>
        ))}
      </select>
      
      <button onClick={handleSaveConfig}>설정 저장</button>
      <button onClick={() => promptConfigManager.exportConfigs()}>
        내보내기
      </button>
    </div>
  );
}
```

## 🔌 슬롯 기반 API 연결 (향후 계획)

### 개념
프롬프트 설정을 **슬롯 형태**로 관리하여 블로그 전용 API와 카카오톡 전용 API에 연결하는 시스템입니다.

### 구조

```
┌─────────────────────────────────────┐
│  프롬프트 설정 관리 (슬롯)          │
├─────────────────────────────────────┤
│ [골드톤 시니어 v1.2] [블랙톤 v2.0] │
│                                     │
│ ┌─────────┐    ┌─────────┐         │
│ │ 블로그  │───▶│ API 슬롯 │         │
│ │ 전용 API│    │ v1.0     │         │
│ └─────────┘    └─────────┘         │
│   /api/generate-paragraph-prompts   │
│                                     │
│ ┌─────────┐    ┌─────────┐         │
│ │ 카카오  │───▶│ API 슬롯 │         │
│ │ 전용 API│    │ v1.1     │         │
│ └─────────┘    └─────────┘         │
│   /api/kakao-content/generate-prompt│
└─────────────────────────────────────┘
```

### 확장된 설정 구조

```typescript
interface PromptConfig {
  name: string;
  description: string;
  version: string;  // 버전 관리 추가
  brandStrategy: {
    customerpersona: string;
    customerChannel: string;
    brandWeight: string;
    audienceTemperature: string;
    audienceWeight?: string;
  };
  apiSlots: {  // API 슬롯 추가
    blog?: {
      apiEndpoint: '/api/generate-paragraph-prompts';
      version: '1.0';
      enabled: boolean;
    };
    kakao?: {
      apiEndpoint: '/api/kakao-content/generate-prompt';
      version: '1.1';
      enabled: boolean;
    };
  };
  scheduleVariations?: {  // 스케줄별 변형
    [date: string]: {
      brandStrategy?: Partial<BrandStrategy>;
      apiSlot?: 'blog' | 'kakao';
    };
  };
  createdAt?: string;
  updatedAt?: string;
}
```

### 사용 예시

```typescript
// 슬롯 기반 프롬프트 설정 저장
const savePromptConfigWithSlots = (name, description, brandStrategy, apiSlots) => {
  promptConfigManager.saveConfig(name, {
    name,
    description,
    version: '1.0',
    brandStrategy,
    apiSlots: {
      blog: {
        apiEndpoint: '/api/generate-paragraph-prompts',
        version: '1.0',
        enabled: true
      },
      kakao: {
        apiEndpoint: '/api/kakao-content/generate-prompt',
        version: '1.1',
        enabled: true
      }
    }
  });
};

// 스케줄별 변형 설정
const addScheduleVariation = (configName, date, variation) => {
  const config = promptConfigManager.getConfig(configName);
  if (config) {
    config.scheduleVariations = config.scheduleVariations || {};
    config.scheduleVariations[date] = variation;
    promptConfigManager.saveConfig(configName, config);
  }
};

// API 슬롯 선택하여 프롬프트 생성
const generatePromptWithSlot = async (configName, apiSlot, basePrompt, options) => {
  const config = promptConfigManager.getConfig(configName);
  if (!config || !config.apiSlots[apiSlot]?.enabled) {
    throw new Error(`API 슬롯 ${apiSlot}이 활성화되지 않았습니다.`);
  }
  
  const apiEndpoint = config.apiSlots[apiSlot].apiEndpoint;
  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: basePrompt,
      brandStrategy: config.brandStrategy,
      ...options
    })
  });
  
  return response.json();
};
```

### React Flow 통합 계획

Phase 15에서 React Flow 워크플로우 시각화에 프롬프트 설정 슬롯을 노드로 표시:

```
[프롬프트 설정 슬롯] → [블로그 API 노드] → [이미지 생성 노드]
                  → [카카오 API 노드] → [이미지 생성 노드]
```

- 노드 클릭 시 프롬프트 설정 수정 가능
- 버전 관리 및 롤백 기능
- 스케줄별 변형 시각화

## 📊 현재 사용 현황

### ✅ 구현 완료
- **블로그 페이지** (`pages/admin/blog.tsx`):
  - ✅ 프롬프트 설정 저장/불러오기/삭제
  - ✅ JSON 내보내기/가져오기
  - ✅ 브랜드 전략 통합

### ⚠️ 부분 구현
- **카카오 콘텐츠 페이지** (`pages/admin/kakao-content.tsx`):
  - ✅ 프롬프트 설정 선택 UI
  - ❌ 프롬프트 설정 저장 기능 없음
  - ❌ JSON 내보내기/가져오기 없음
  - ✅ 브랜드 전략 통합

### 🔄 우선순위 로직
현재 이미지 생성 시 프롬프트 설정 우선순위:
1. `selectedPromptConfig` (저장된 설정) - **최우선**
2. `brandStrategy` (현재 선택된 브랜드 전략)
3. 기본값 (하드코딩된 기본 설정)

### 🎯 개선 필요 사항
1. **카카오 콘텐츠 페이지에 저장 기능 추가**
   - 블로그 페이지와 동일한 저장/내보내기/가져오기 기능
   
2. **API 슬롯 연결**
   - 프롬프트 설정에 블로그/카카오 API 슬롯 정보 저장
   - 스케줄별 변형 관리
   
3. **버전 관리**
   - 프롬프트 설정 버전 관리
   - 롤백 기능
   
4. **React Flow 통합** (Phase 15)
   - 슬롯을 노드로 시각화
   - 실시간 프롬프트 수정

## 🔗 관련 파일

- `lib/prompt-config-manager.ts` - 재사용 가능한 모듈 ✅
- `pages/admin/blog.tsx` - 실제 구현 (2180-2348번째 줄) ✅
- `pages/admin/kakao-content.tsx` - 부분 구현 (선택 UI만) ⚠️
- `pages/api/generate-paragraph-prompts.js` - 블로그 전용 API ✅
- `pages/api/kakao-content/generate-prompt.js` - 카카오 전용 API ✅

## 📚 참고 문서

- [AI 이미지 생성 시스템](./ai-image-generation-system.md) - 프롬프트 기반 이미지 생성
- [브랜드 전략 시스템](./brand-strategy-system.md) - 브랜드 전략 설정
- [Phase 15: 워크플로우 시각화](../phases/detailed-plans/phase-15-workflow-visualization.md) - 슬롯 통합 계획

