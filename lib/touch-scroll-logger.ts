/**
 * 터치 스크롤 로깅 유틸리티
 * 개발자 콘솔에 터치 스크롤 관련 로그를 출력
 */

export interface TouchScrollEvent {
  type: 'touchstart' | 'touchmove' | 'touchend' | 'scroll' | 'wheel';
  timestamp: number;
  target: string;
  scrollY: number;
  scrollX: number;
  deltaY?: number;
  deltaX?: number;
  touchY?: number;
  touchX?: number;
  canScroll: boolean;
  scrollHeight: number;
  clientHeight: number;
}

class TouchScrollLogger {
  private logs: TouchScrollEvent[] = [];
  private isEnabled: boolean = false; // 기본적으로 비활성화 (필요시 수동 활성화)
  private logLimit: number = 100;
  private logLevel: 'none' | 'init' | 'error' | 'all' = 'init'; // 로그 레벨: none(없음), init(초기화만), error(에러만), all(전부)

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupEventListeners();
    }
  }

  enable() {
    this.isEnabled = true;
    console.log('[TOUCH-SCROLL] 로깅 활성화');
  }

  disable() {
    this.isEnabled = false;
    console.log('[TOUCH-SCROLL] 로깅 비활성화');
  }

  private log(event: TouchScrollEvent) {
    // 로그 레벨에 따라 필터링
    if (this.logLevel === 'none') return;
    // init 레벨에서는 초기화 체크만 수행 (이벤트 로그는 출력하지 않음)
    if (this.logLevel === 'init') return;

    this.logs.push(event);
    if (this.logs.length > this.logLimit) {
      this.logs.shift();
    }

    // 로그 레벨이 'all'일 때만 상세 로그 출력
    if (this.logLevel !== 'all') return;

    const prefix = '[TOUCH-SCROLL]';
    const timestamp = new Date(event.timestamp).toISOString();
    const scrollInfo = `scrollY: ${event.scrollY}px, scrollX: ${event.scrollX}px`;
    const sizeInfo = `scrollHeight: ${event.scrollHeight}px, clientHeight: ${event.clientHeight}px`;
    const canScroll = event.canScroll ? '✅ 스크롤 가능' : '❌ 스크롤 불가';

    switch (event.type) {
      case 'touchstart':
        console.log(
          `${prefix} [TOUCH-START] ${timestamp}\n` +
          `  타겟: ${event.target}\n` +
          `  터치 위치: (${event.touchX}, ${event.touchY})\n` +
          `  ${scrollInfo}\n` +
          `  ${sizeInfo}\n` +
          `  ${canScroll}`
        );
        break;
      case 'touchmove':
        console.log(
          `${prefix} [TOUCH-MOVE] ${timestamp}\n` +
          `  타겟: ${event.target}\n` +
          `  터치 위치: (${event.touchX}, ${event.touchY})\n` +
          `  ${scrollInfo}\n` +
          `  델타: (${event.deltaX || 0}, ${event.deltaY || 0})\n` +
          `  ${canScroll}`
        );
        break;
      case 'touchend':
        console.log(
          `${prefix} [TOUCH-END] ${timestamp}\n` +
          `  타겟: ${event.target}\n` +
          `  ${scrollInfo}\n` +
          `  ${sizeInfo}\n` +
          `  ${canScroll}`
        );
        break;
      case 'scroll':
        // scroll 이벤트는 로그 레벨이 'all'일 때만 출력 (너무 많음)
        if (this.logLevel === 'all') {
          console.log(
            `${prefix} [SCROLL] ${timestamp}\n` +
            `  타겟: ${event.target}\n` +
            `  ${scrollInfo}\n` +
            `  ${sizeInfo}\n` +
            `  ${canScroll}`
          );
        }
        break;
      case 'wheel':
        // wheel 이벤트는 로그 레벨이 'all'일 때만 출력 (너무 많음)
        if (this.logLevel === 'all') {
          console.log(
            `${prefix} [WHEEL] ${timestamp}\n` +
            `  타겟: ${event.target}\n` +
            `  ${scrollInfo}\n` +
            `  델타: (${event.deltaX || 0}, ${event.deltaY || 0})\n` +
            `  ${canScroll}`
          );
        }
        break;
    }
  }

  private setupEventListeners() {
    // 로그 레벨이 'none'이면 이벤트 리스너도 등록하지 않음
    if (this.logLevel === 'none') {
      // 초기화 체크만 수행
      this.checkScrollability();
      return;
    }

    // 반복되는 로그를 방지하기 위해 모든 이벤트 리스너 제거
    // 초기화 체크만 수행 (페이지 로드 시 1회)
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.checkScrollability();
      });
    } else {
      this.checkScrollability();
    }
  }

  private canScroll(): boolean {
    const html = document.documentElement;
    const body = document.body;
    const scrollHeight = Math.max(
      html.scrollHeight,
      body.scrollHeight,
      html.clientHeight,
      body.clientHeight
    );
    const clientHeight = window.innerHeight;
    return scrollHeight > clientHeight;
  }

  private checkScrollability() {
    const html = document.documentElement;
    const body = document.body;
    
    const styles = {
      htmlOverflow: window.getComputedStyle(html).overflow,
      htmlOverflowY: window.getComputedStyle(html).overflowY,
      htmlHeight: window.getComputedStyle(html).height,
      htmlMaxHeight: window.getComputedStyle(html).maxHeight,
      bodyOverflow: window.getComputedStyle(body).overflow,
      bodyOverflowY: window.getComputedStyle(body).overflowY,
      bodyHeight: window.getComputedStyle(body).height,
      bodyMaxHeight: window.getComputedStyle(body).maxHeight,
      webkitOverflowScrolling: window.getComputedStyle(html).webkitOverflowScrolling || 'N/A',
      touchAction: window.getComputedStyle(html).touchAction || 'N/A'
    };

    const canScroll = this.canScroll();
    const issues: string[] = [];

    if (styles.htmlOverflow === 'hidden' || styles.htmlOverflowY === 'hidden') {
      issues.push('html 요소에 overflow: hidden 적용됨');
    }
    if (styles.bodyOverflow === 'hidden' || styles.bodyOverflowY === 'hidden') {
      issues.push('body 요소에 overflow: hidden 적용됨');
    }
    if (styles.htmlHeight === '100%' && styles.bodyHeight === '100%') {
      issues.push('html/body 높이가 100%로 고정됨');
    }
    // -webkit-overflow-scrolling: touch는 globals.css에 이미 적용되어 있음
    // getComputedStyle로는 정확히 감지되지 않을 수 있어 경고 제거
    // if (styles.webkitOverflowScrolling === 'N/A' || styles.webkitOverflowScrolling === 'auto') {
    //   issues.push('-webkit-overflow-scrolling: touch 미적용');
    // }

    console.log('[TOUCH-SCROLL] [INIT] 페이지 스크롤 가능 여부 체크');
    console.log(`  스크롤 가능: ${canScroll ? '✅ 예' : '❌ 아니오'}`);
    console.log(`  문서 높이: ${document.documentElement.scrollHeight}px`);
    console.log(`  윈도우 높이: ${window.innerHeight}px`);
    console.log(`  CSS 스타일:`, styles);
    
    if (issues.length > 0) {
      console.warn('[TOUCH-SCROLL] [WARNING] 발견된 문제:');
      issues.forEach(issue => console.warn(`  - ${issue}`));
    } else if (canScroll) {
      console.log('[TOUCH-SCROLL] [SUCCESS] 스크롤 설정이 정상입니다.');
    }
  }

  private getTargetPath(element: Element | null): string {
    if (!element) return 'unknown';
    
    const path: string[] = [];
    let current: Element | null = element;
    
    while (current && current !== document.body) {
      const tagName = current.tagName.toLowerCase();
      const id = current.id ? `#${current.id}` : '';
      const className = current.className ? `.${String(current.className).split(' ').join('.')}` : '';
      path.unshift(`${tagName}${id}${className}`);
      current = current.parentElement;
    }
    
    return path.join(' > ') || 'body';
  }

  getLogs(): TouchScrollEvent[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
    console.log('[TOUCH-SCROLL] 로그 초기화됨');
  }
}

// 싱글톤 인스턴스
let loggerInstance: TouchScrollLogger | null = null;

export function initTouchScrollLogger(): TouchScrollLogger {
  if (typeof window === 'undefined') {
    return null as any;
  }
  
  if (!loggerInstance) {
    loggerInstance = new TouchScrollLogger();
  }
  return loggerInstance;
}

export function getTouchScrollLogger(): TouchScrollLogger | null {
  return loggerInstance;
}

// 전역에서 사용할 수 있도록
if (typeof window !== 'undefined') {
  (window as any).touchScrollLogger = initTouchScrollLogger();
}
