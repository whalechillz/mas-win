# 워크플로우 시각화 시스템 (React Flow)

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

## 📦 설치

```bash
npm install reactflow
```

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

### 워크플로우 정의

```json
// docs/workflows/kakao-content-generation.json
{
  "id": "kakao-content-generation",
  "name": "카카오 콘텐츠 생성",
  "description": "계정별 프로필 및 피드 자동 생성",
  "nodes": [
    {
      "id": "1",
      "type": "input",
      "label": "캘린더 데이터 로드",
      "description": "오늘 날짜의 캘린더 데이터 조회",
      "status": "completed",
      "position": { "x": 100, "y": 100 },
      "config": {
        "endpoint": "/api/content-calendar/today"
      }
    },
    {
      "id": "2",
      "type": "process",
      "label": "브랜드 전략 분석",
      "description": "페르소나와 오디언스 온도 분석",
      "status": "completed",
      "position": { "x": 300, "y": 100 },
      "config": {
        "prompt": "계정별 페르소나 분석",
        "model": "gpt-4"
      }
    },
    {
      "id": "3",
      "type": "agent",
      "label": "골드톤 이미지 생성",
      "description": "시니어 타겟 골드톤 이미지 생성",
      "status": "running",
      "position": { "x": 500, "y": 50 },
      "config": {
        "prompt": "골드톤 시니어 매너 프롬프트",
        "model": "dall-e-3"
      }
    }
  ],
  "edges": [
    {
      "id": "e1-2",
      "source": "1",
      "target": "2"
    },
    {
      "id": "e2-3",
      "source": "2",
      "target": "3"
    }
  ]
}
```

## 🎨 커스텀 노드 타입

### ProcessNode 예시

```typescript
// components/admin/workflow/nodes/ProcessNode.tsx
import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Settings, CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface ProcessNodeData {
  label: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  config?: {
    prompt?: string;
    model?: string;
  };
}

export default function ProcessNode({ data }: NodeProps<ProcessNodeData>) {
  const getStatusColor = () => {
    switch (data.status) {
      case 'completed': return 'bg-green-500';
      case 'running': return 'bg-blue-500 animate-pulse';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="px-4 py-3 shadow-lg rounded-lg border-2 border-gray-300 bg-white dark:bg-gray-800 min-w-[180px]">
      <Handle type="target" position={Position.Left} />
      
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
        <div className="font-semibold text-sm text-gray-900 dark:text-white">
          {data.label}
        </div>
      </div>
      
      {data.description && (
        <div className="text-xs text-gray-600 dark:text-gray-400">
          {data.description}
        </div>
      )}
      
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
```

## 🔄 실시간 상태 업데이트

```typescript
// 워크플로우 상태 업데이트
const updateNodeStatus = (nodeId: string, status: 'pending' | 'running' | 'completed' | 'error') => {
  setNodes((nds) =>
    nds.map((node) =>
      node.id === nodeId
        ? { ...node, data: { ...node.data, status } }
        : node
    )
  );
};

// 사용 예시
updateNodeStatus('3', 'running'); // 골드톤 이미지 생성 시작
// ... 이미지 생성 중 ...
updateNodeStatus('3', 'completed'); // 완료
```

## 📝 카카오톡 콘텐츠에 적용

```typescript
// pages/admin/kakao-content.tsx
import WorkflowPanel from '@/components/admin/workflow/WorkflowPanel';

export default function KakaoContentPage() {
  const [workflowNodes, setWorkflowNodes] = useState(kakaoContentWorkflow.nodes);

  const handleNodeClick = (nodeId: string) => {
    // 노드 클릭 시 상세 정보 표시
    const node = workflowNodes.find(n => n.id === nodeId);
    console.log('노드 클릭:', node);
  };

  const handleNodeUpdate = (nodeId: string, config: any) => {
    // 노드 설정 업데이트 (프롬프트 수정 등)
    setWorkflowNodes(prev => 
      prev.map(node => 
        node.id === nodeId 
          ? { ...node, data: { ...node.data, config: { ...node.data.config, ...config } } }
          : node
      )
    );
  };

  return (
    <div>
      <WorkflowPanel
        workflowId="kakao-content-generation"
        title="카카오 콘텐츠 생성 워크플로우"
        nodes={workflowNodes}
        onNodeClick={handleNodeClick}
        onNodeUpdate={handleNodeUpdate}
      />
    </div>
  );
}
```

## 🔗 관련 문서

- [카카오톡 콘텐츠 시스템](../phases/detailed-plans/phase-14-kakao-content-system.md)
- [공통 시스템 재사용 가이드](../shared-systems/README.md)


