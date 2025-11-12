/**
 * Self-Adaptive Automation
 * Playwright 기반 자동 오류 수정 및 재시도
 */

export interface AdaptiveOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

export interface AdaptiveResult {
  success: boolean;
  error?: string;
  selector?: string;
  attempts?: number;
}

/**
 * 다중 선택자로 요소 찾기 및 액션 실행
 */
export async function adaptiveAction(
  page: any,
  selectors: string[],
  action: (element: any) => Promise<void>,
  options: AdaptiveOptions = {}
): Promise<AdaptiveResult> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    timeout = 5000
  } = options;

  let lastError: Error | null = null;
  let attempts = 0;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // 여러 선택자 시도
    for (const selector of selectors) {
      try {
        const element = await page.waitForSelector(selector, { timeout });
        await action(element);
        
        // 성공 시 로그
        console.log(`✅ 성공: 선택자 "${selector}" 사용 (시도 ${attempt + 1}/${maxRetries})`);
        return { 
          success: true, 
          selector,
          attempts: attempt + 1
        };
      } catch (error: any) {
        lastError = error;
        attempts++;
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
    selector: undefined,
    attempts
  };
}

/**
 * 선택자 자동 조정
 */
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


