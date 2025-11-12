# 📚 MASGOLF 프로젝트 문서

## 📋 문서 구조 개요

### 1. 공통 시스템 (`shared-systems/`)
**목적**: 여러 메뉴에서 재사용 가능한 시스템들의 사용 가이드

- [브랜드 전략 시스템](./shared-systems/brand-strategy-system.md)
- [AI 이미지 생성 시스템](./shared-systems/ai-image-generation-system.md)
- [프롬프트 설정 관리](./shared-systems/prompt-settings-manager.md)
- [Self-Adaptive Automation](./shared-systems/self-adaptive-automation.md)
- [갤러리 이미지 자산 관리](./shared-systems/gallery-asset-management.md)

### 2. Phase별 계획 (`phases/`)
**목적**: 특정 Phase의 구현 계획과 단계

- [Phase 문서 인덱스](./phases/DOCUMENTATION-INDEX.md)
- [Phase 14: 카카오톡 콘텐츠 자동화 시스템](./phases/detailed-plans/phase-14-kakao-content-system.md)
- [Phase 15: 워크플로우 시각화 시스템](./phases/detailed-plans/phase-15-workflow-visualization.md)

### 3. 독립 시스템 문서
**목적**: 특정 시스템의 상세 가이드

- [워크플로우 시각화 시스템 (React Flow)](./workflow-visualization-system.md)
- [콘텐츠 캘린더 시스템](./content-calendar/README.md)

### 4. 프로젝트 계획
- [프로젝트 계획](./project_plan.md) - 전체 Phase 현황 및 진행 상황

## 🎯 빠른 참조

### 카카오톡 콘텐츠 개발
1. [Phase 14 상세 계획](./phases/detailed-plans/phase-14-kakao-content-system.md) - 구현 계획
2. [공통 시스템 재사용 가이드](./shared-systems/README.md) - 사용할 컴포넌트/함수
3. [워크플로우 시각화 시스템](./workflow-visualization-system.md) - React Flow 통합

### 공통 시스템 사용
- [공통 시스템 재사용 가이드](./shared-systems/README.md) - 전체 목차
- 각 시스템별 상세 문서 참조

## 📊 문서 구조 점검 결과

✅ **중복 없음**: Shared-systems와 Phases는 역할이 다름
- Shared-systems: "어떻게 사용하는가" (How to use)
- Phases: "무엇을 구현하는가" (What to build)

✅ **React Flow 위치**: `docs/workflow-visualization-system.md`
- Phase 15에서 독립적으로 개발
- Phase 14에서 참조하여 통합

✅ **효율적인 구조**: 참조 기반으로 중복 최소화

## 📝 문서 구조 상세

자세한 내용은 [문서 구조 점검](./DOCUMENTATION-STRUCTURE.md) 참조
