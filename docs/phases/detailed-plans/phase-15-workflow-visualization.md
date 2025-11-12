# Phase 15: 워크플로우 시각화 시스템 (React Flow)

## 📋 개요

모든 메뉴에 통합 가능한 워크플로우 시각화 시스템입니다. 개발 중 디버깅 및 최적화를 지원하며, 프로덕션에서는 토글로 숨길 수 있습니다.

## 🎯 목적

1. **개발 중 실시간 디버깅**
   - 각 노드 상태를 시각적으로 확인
   - 오류 발생 노드 즉시 파악

2. **프롬프트 미세 조정**
   - 노드 클릭으로 프롬프트 즉시 수정
   - 설정 변경 즉시 반영

3. **오류 추적**
   - 에러 노드를 빨간색으로 표시
   - 오류 로그 확인

4. **최적화**
   - 병목 구간 시각적 확인
   - 성능 개선 포인트 파악

## 📁 파일 구조

```
components/admin/workflow/
├── WorkflowVisualizer.tsx        # 메인 시각화 컴포넌트
├── WorkflowPanel.tsx             # 토글이 가능한 패널
├── NodeDetailPanel.tsx           # 노드 상세 정보 패널
└── nodes/                        # 커스텀 노드 타입
    ├── InputNode.tsx             # 입력 노드
    ├── ProcessNode.tsx          # 처리 노드
    ├── AgentNode.tsx            # 에이전트 노드
    └── OutputNode.tsx           # 출력 노드

docs/workflows/
├── kakao-content-generation.json    # 카카오 콘텐츠 생성 워크플로우
├── hub-content-generation.json       # 허브 콘텐츠 생성 워크플로우
└── blog-post-generation.json        # 블로그 포스트 생성 워크플로우
```

## 🚀 구현 단계

### Phase 1: React Flow 설치 및 기본 컴포넌트 (3일)

1. **React Flow 설치**
   ```bash
   npm install reactflow
   ```

2. **기본 컴포넌트 개발**
   - `WorkflowVisualizer.tsx` - 메인 시각화 컴포넌트
   - `WorkflowPanel.tsx` - 토글이 가능한 패널

3. **기본 노드 타입**
   - InputNode, ProcessNode, OutputNode

### Phase 2: 커스텀 노드 타입 개발 (2일)

1. **AgentNode 개발**
   - AI 이미지 생성 노드
   - 프롬프트 수정 가능

2. **노드 상세 패널**
   - `NodeDetailPanel.tsx`
   - 프롬프트 수정 UI

3. **상태 관리**
   - 노드 상태 업데이트 (pending/running/completed/error)
   - 실시간 애니메이션

### Phase 2.5: 프롬프트 설정 슬롯 통합 (3일)

1. **프롬프트 설정 슬롯 노드**
   - `PromptSlotNode.tsx` - 슬롯 형태로 표시
   - 블로그 전용 API 슬롯
   - 카카오톡 전용 API 슬롯
   - 버전 관리 표시

2. **슬롯 연결 시각화**
   ```
   [프롬프트 설정 슬롯 v1.2]
        ↓
   ┌─────────────┬─────────────┐
   │ 블로그 API  │ 카카오 API  │
   │ 슬롯 v1.0   │ 슬롯 v1.1   │
   └─────────────┴─────────────┘
        ↓              ↓
   [이미지 생성]  [이미지 생성]
   ```

3. **슬롯 편집 기능**
   - 노드 클릭 시 프롬프트 설정 편집
   - API 슬롯 활성화/비활성화
   - 버전 선택 및 롤백
   - 스케줄별 변형 설정

4. **실시간 연동**
   - 프롬프트 설정 변경 시 워크플로우 자동 업데이트
   - API 슬롯 변경 시 즉시 반영

### Phase 3: 카카오톡 페이지에 통합 (2일)

1. **워크플로우 정의**
   - `docs/workflows/kakao-content-generation.json` 생성

2. **카카오톡 페이지 통합**
   - `pages/admin/kakao-content.tsx`에 `WorkflowPanel` 추가

3. **실시간 상태 연동**
   - 자동화 스크립트와 워크플로우 상태 동기화

### Phase 4: 다른 메뉴로 확장 (3일)

1. **허브 콘텐츠 페이지**
   - `pages/admin/content-calendar-hub.tsx`에 통합

2. **블로그 편집 페이지**
   - `pages/admin/blog.tsx`에 통합

3. **워크플로우 정의 추가**
   - `hub-content-generation.json`
   - `blog-post-generation.json`

## 📦 설치

```bash
npm install reactflow
```

## 💻 사용 방법

### 기본 사용

```typescript
import WorkflowPanel from '@/components/admin/workflow/WorkflowPanel';

export default function MyPage() {
  return (
    <div>
      <WorkflowPanel
        workflowId="my-workflow"
        title="내 워크플로우"
      />
    </div>
  );
}
```

### 프롬프트 설정 슬롯 사용

```typescript
import WorkflowPanel from '@/components/admin/workflow/WorkflowPanel';
import { promptConfigManager } from '@/lib/prompt-config-manager';

export default function KakaoContentPage() {
  const [selectedConfig, setSelectedConfig] = useState('골드톤 시니어 v1.2');
  
  return (
    <div>
      {/* 프롬프트 설정 슬롯 선택 */}
      <select 
        value={selectedConfig}
        onChange={(e) => setSelectedConfig(e.target.value)}
      >
        {Object.keys(promptConfigManager.getConfigs()).map(name => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>
      
      {/* 워크플로우 시각화 */}
      <WorkflowPanel
        workflowId="kakao-content-generation"
        title="카카오 콘텐츠 생성 워크플로우"
        promptConfig={selectedConfig}
        apiSlots={{
          blog: '/api/generate-paragraph-prompts',
          kakao: '/api/kakao-content/generate-prompt'
        }}
      />
    </div>
  );
}
```

### 워크플로우 구조 예시

```json
{
  "id": "kakao-content-generation",
  "nodes": [
    {
      "id": "prompt-slot",
      "type": "promptSlot",
      "data": {
        "configName": "골드톤 시니어 v1.2",
        "version": "1.2",
        "apiSlots": {
          "blog": { "endpoint": "/api/generate-paragraph-prompts", "version": "1.0", "enabled": true },
          "kakao": { "endpoint": "/api/kakao-content/generate-prompt", "version": "1.1", "enabled": true }
        }
      },
      "position": { "x": 100, "y": 100 }
    },
    {
      "id": "kakao-api",
      "type": "apiSlot",
      "data": {
        "endpoint": "/api/kakao-content/generate-prompt",
        "version": "1.1",
        "status": "active"
      },
      "position": { "x": 300, "y": 100 }
    },
    {
      "id": "image-generation",
      "type": "imageGeneration",
      "data": {
        "model": "dall-e-3",
        "status": "pending"
      },
      "position": { "x": 500, "y": 100 }
    }
  ],
  "edges": [
    { "id": "e1", "source": "prompt-slot", "target": "kakao-api" },
    { "id": "e2", "source": "kakao-api", "target": "image-generation" }
  ]
}
```

## 🎯 프롬프트 설정 슬롯 통합 계획

### 목적
- 스케줄에 따라 프롬프트 변형 관리
- 블로그 전용 API와 카카오톡 전용 API를 슬롯 형태로 연결
- 버전 관리 및 롤백 기능
- React Flow에서 시각적으로 관리

### 구조

```
┌─────────────────────────────────────┐
│  프롬프트 설정 슬롯 (노드)          │
├─────────────────────────────────────┤
│ [골드톤 시니어 v1.2]                │
│                                      │
│ API 슬롯:                            │
│  ✓ 블로그 API v1.0                   │
│  ✓ 카카오 API v1.1                   │
│                                      │
│ 스케줄 변형:                         │
│  - 2025-11-12: 블랙톤 적용          │
│  - 2025-11-15: 골드톤 강화          │
└─────────────────────────────────────┘
        ↓              ↓
   [블로그 API]    [카카오 API]
        ↓              ↓
   [이미지 생성]  [이미지 생성]
```

### 구현 단계

1. **프롬프트 설정 슬롯 노드 개발**
   - `components/admin/workflow/nodes/PromptSlotNode.tsx`
   - 슬롯 형태 UI
   - API 연결 표시
   - 버전 표시

2. **API 슬롯 노드 개발**
   - `components/admin/workflow/nodes/ApiSlotNode.tsx`
   - 블로그/카카오 API 구분
   - 활성화/비활성화 토글
   - 버전 표시

3. **슬롯 편집 패널**
   - 프롬프트 설정 편집
   - API 슬롯 추가/제거
   - 스케줄별 변형 설정
   - 버전 관리

4. **실시간 연동**
   - 프롬프트 설정 변경 시 워크플로우 업데이트
   - API 슬롯 변경 시 즉시 반영
   - 이미지 생성 시 슬롯 정보 전달

### 사용 시나리오

1. **스케줄별 변형**
   - 월요일: 골드톤 시니어 설정
   - 화요일: 블랙톤 젊은 골퍼 설정
   - 수요일: 골드톤 시니어 설정 (다시)
   - → 스케줄에 따라 자동으로 프롬프트 설정 변경

2. **API 슬롯 전환**
   - 블로그 콘텐츠 생성 시: 블로그 API 슬롯 사용
   - 카카오 콘텐츠 생성 시: 카카오 API 슬롯 사용
   - → 같은 프롬프트 설정, 다른 API로 처리

3. **버전 관리**
   - v1.0: 초기 버전
   - v1.1: 한국 골퍼 명시 강화
   - v1.2: 아시아 골퍼 강제 명시
   - → 이전 버전으로 롤백 가능

## 🔗 관련 문서

- [워크플로우 시각화 시스템 상세 가이드](../../workflow-visualization-system.md)
- [프롬프트 설정 관리 시스템](../../shared-systems/prompt-settings-manager.md) - 슬롯 기반 API 연결
- [카카오톡 콘텐츠 시스템](./phase-14-kakao-content-system.md) - Phase 2에서 통합
- [공통 시스템 재사용 가이드](../../shared-systems/README.md)

