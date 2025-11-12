# Self-Adaptive Automation 시스템

## 📋 개요

Playwright 기반 자동화 스크립트가 실행 중 오류 발생 시 스스로 수정하며 진행하는 시스템입니다. 다중 선택자 시도, 재시도 로직, 자동 오류 수정 기능을 제공합니다.

## 📍 위치

- **문서**: `docs/project_plan.md` (Phase 0: 738-787번째 줄)
- **구현 필요**: 공통 유틸리티 모듈로 추출 필요

## 🎯 주요 기능

1. **오류 감지 및 분류**
   - 타임아웃 오류
   - 요소 찾기 실패
   - 네트워크 오류
   - 인증 오류

2. **자동 수정 로직**
   - 선택자 자동 조정 (다중 선택자 시도)
   - 대기 시간 자동 조정
   - 재시도 로직

3. **수정 이력 로깅**
   - 수정 전/후 스크립트 비교
   - 수정 이유 기록
   - 성공/실패 통계

## 💻 구현 예시

### 기본 구조

```typescript
// lib/self-adaptive-automation.ts (신규 생성 필요)

interface AdaptiveOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  selectors?: string[];
}

export async function adaptiveAction(
  page: any,
  selectors: string[],
  action: (element: any) => Promise<void>,
  options: AdaptiveOptions = {}
): Promise<{ success: boolean; error?: string; selector?: string }> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    timeout = 5000
  } = options;

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // 여러 선택자 시도
    for (const selector of selectors) {
      try {
        const element = await page.waitForSelector(selector, { timeout });
        await action(element);
        
        // 성공 시 로그
        console.log(`✅ 성공: 선택자 "${selector}" 사용`);
        return { success: true, selector };
      } catch (error: any) {
        lastError = error;
        console.log(`⚠️ 선택자 "${selector}" 실패: ${error.message}`);
        continue; // 다음 선택자 시도
      }
    }
    
    // 모든 선택자 실패 시 재시도
    if (attempt < maxRetries - 1) {
      console.log(`🔄 재시도 ${attempt + 1}/${maxRetries}...`);
      await page.waitForTimeout(retryDelay * (attempt + 1));
    }
  }
  
  return {
    success: false,
    error: lastError?.message || '모든 선택자 시도 실패',
    selector: undefined
  };
}
```

### 사용 예시

```typescript
import { adaptiveAction } from '@/lib/self-adaptive-automation';

// 카카오톡 프로필 업데이트
async function updateKakaoProfile(page, profileData) {
  const selectors = [
    `button[data-account="${profileData.account}"]:has-text("프로필")`,
    `button:has-text("프로필 변경")`,
    `[data-testid="update-profile"]`,
    'button.profile-update',
    '.profile-settings button'
  ];
  
  const result = await adaptiveAction(
    page,
    selectors,
    async (element) => {
      await element.click();
      await page.waitForTimeout(1000);
      
      // 배경 이미지 업로드
      await uploadImage(page, profileData.background);
      
      // 프로필 이미지 업로드
      await uploadImage(page, profileData.profile);
      
      // 메시지 입력
      await fillMessage(page, profileData.message);
      
      // 저장
      await saveProfile(page);
    },
    {
      maxRetries: 3,
      retryDelay: 2000,
      timeout: 10000
    }
  );
  
  if (!result.success) {
    throw new Error(`프로필 업데이트 실패: ${result.error}`);
  }
  
  return result;
}
```

### 고급 기능: 선택자 자동 조정

```typescript
export async function adaptiveSelector(
  page: any,
  baseSelectors: string[],
  adjustStrategy: 'add-attributes' | 'remove-attributes' | 'add-classes' | 'remove-classes' = 'add-attributes'
): Promise<string[]> {
  const adjustedSelectors: string[] = [];
  
  for (const selector of baseSelectors) {
    adjustedSelectors.push(selector);
    
    // 전략에 따라 선택자 변형
    switch (adjustStrategy) {
      case 'add-attributes':
        // data-* 속성 추가
        adjustedSelectors.push(`${selector}[data-testid]`);
        adjustedSelectors.push(`${selector}[aria-label]`);
        break;
        
      case 'remove-attributes':
        // 속성 제거한 버전
        const base = selector.split('[')[0];
        adjustedSelectors.push(base);
        break;
        
      case 'add-classes':
        // 클래스 추가
        adjustedSelectors.push(`${selector}.active`);
        adjustedSelectors.push(`${selector}.enabled`);
        break;
    }
  }
  
  return adjustedSelectors;
}
```

### 카카오톡 자동화에 적용

```typescript
// scripts/auto-create-kakao-account-content.js

import { adaptiveAction, adaptiveSelector } from '@/lib/self-adaptive-automation';

async function processAccountContent(page, accountData) {
  // 프로필 업데이트
  const profileSelectors = await adaptiveSelector(
    page,
    [
      `button[data-account="${accountData.account}"]`,
      'button.profile-update'
    ],
    'add-attributes'
  );
  
  const profileResult = await adaptiveAction(
    page,
    profileSelectors,
    async (element) => {
      await element.click();
      // 프로필 업데이트 로직
    }
  );
  
  if (!profileResult.success) {
    console.error('프로필 업데이트 실패:', profileResult.error);
    // 수동 작업 안내
    return;
  }
  
  // 피드 생성
  const feedSelectors = await adaptiveSelector(
    page,
    [
      `button[data-account="${accountData.account}"]:has-text("피드")`,
      'button.create-feed'
    ],
    'add-attributes'
  );
  
  const feedResult = await adaptiveAction(
    page,
    feedSelectors,
    async (element) => {
      await element.click();
      // 피드 생성 로직
    }
  );
  
  return {
    profile: profileResult,
    feed: feedResult
  };
}
```

## 📊 로깅 시스템

```typescript
interface AdaptiveLog {
  timestamp: string;
  action: string;
  selectors: string[];
  attempts: number;
  success: boolean;
  usedSelector?: string;
  error?: string;
  duration: number;
}

const adaptiveLogs: AdaptiveLog[] = [];

export function logAdaptiveAction(log: Omit<AdaptiveLog, 'timestamp' | 'duration'>) {
  adaptiveLogs.push({
    ...log,
    timestamp: new Date().toISOString(),
    duration: Date.now() - (log as any).startTime || 0
  });
}

export function getAdaptiveLogs(): AdaptiveLog[] {
  return adaptiveLogs;
}

export function exportAdaptiveLogs(): string {
  return JSON.stringify(adaptiveLogs, null, 2);
}
```

## 🔗 관련 파일

- `docs/project_plan.md` - Phase 0 문서 (738-787번째 줄)
- `scripts/auto-create-hub-content.js` - 실제 사용 예시 (기본 구조만)

## 📚 참고 문서

- [프로젝트 계획](../project_plan.md) - Phase 0: Self-Adaptive Automation
- [카카오톡 콘텐츠 시스템](../phases/detailed-plans/phase-14-kakao-content-system.md) - 자동화 적용 예시

