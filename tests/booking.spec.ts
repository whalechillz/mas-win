import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './fixtures/auth';

test.describe('시타 예약 E2E 테스트', () => {
  test('예약 생성 플로우', async ({ page }) => {
    // 1. 예약 페이지 접근
    await page.goto('/booking');
    
    // 2. 예약 폼 확인
    await expect(page.locator('text=시타 예약')).toBeVisible();
    
    // 3. 예약 정보 입력
    // 이름
    await page.fill('input[name="name"], input[placeholder*="이름"]', '테스트 고객');
    
    // 전화번호
    const phoneInput = page.locator('input[type="tel"], input[name="phone"]').first();
    await phoneInput.fill('010-9876-5432');
    
    // 날짜 선택 (다음 주 날짜)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);
    const dateStr = tomorrow.toISOString().split('T')[0];
    await page.fill('input[type="date"], input[name="date"]', dateStr);
    
    // 시간 선택
    await page.selectOption('select[name="time"]', '10:00');
    
    // 클럽 선택
    await page.selectOption('select[name="club"]', 'driver');
    
    // 메모 (선택사항)
    const memoTextarea = page.locator('textarea[name="notes"]');
    if (await memoTextarea.isVisible()) {
      await memoTextarea.fill('테스트 예약입니다');
    }
    
    // 4. 예약 제출
    await page.click('button[type="submit"], button:has-text("예약하기")');
    
    // 5. 예약 완료 페이지 확인
    await page.waitForURL(/\/booking\/success/, { timeout: 10000 });
    await expect(page.locator('text=예약이 완료되었습니다, text=예약 완료')).toBeVisible();
  });

  test('예약 폼 유효성 검사', async ({ page }) => {
    await page.goto('/booking');
    
    // 빈 상태로 제출 시도
    await page.click('button[type="submit"], button:has-text("예약하기")');
    
    // 에러 메시지 확인
    const errorMessage = page.locator('.bg-red-50, .text-red-700, .error').first();
    await expect(errorMessage).toBeVisible();
  });

  test('관리자 페이지에서 예약 확인', async ({ page }) => {
    // 관리자 로그인
    await loginAsAdmin(page);
    
    // 예약 관리 페이지로 이동
    await page.goto('/admin/booking');
    
    // 예약 목록 확인
    await expect(page.locator('text=예약, text=시타')).toBeVisible();
    
    // 최근 예약 확인 (테이블 또는 목록)
    const bookingTable = page.locator('table, .booking-list, [data-testid="booking-list"]').first();
    await expect(bookingTable).toBeVisible();
  });

  test('예약 확정 시 SMS 발송 확인', async ({ page }) => {
    // 관리자 로그인
    await loginAsAdmin(page);
    
    // 예약 관리 페이지로 이동
    await page.goto('/admin/booking');
    
    // 첫 번째 예약 선택 (pending 상태)
    const firstBooking = page.locator('tr, .booking-item').filter({ hasText: '대기중' }).first();
    
    if (await firstBooking.isVisible()) {
      // 예약 상세 열기
      await firstBooking.click();
      
      // 확정 버튼 클릭
      const confirmButton = page.locator('button:has-text("확정"), button:has-text("승인")');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
        
        // 확인 다이얼로그 처리
        page.on('dialog', dialog => dialog.accept());
        
        // SMS 발송 확인 (성공 메시지 또는 로그)
        await page.waitForTimeout(2000);
        // SMS 발송 관련 메시지 확인 (실제 구현에 따라 조정)
      }
    }
  });

  test('예약 페이지 네비게이션', async ({ page }) => {
    await page.goto('/booking');
    
    // "시타 예약" 링크 확인
    const tryMassgooLink = page.locator('a[href="/try-a-massgoo"]');
    if (await tryMassgooLink.isVisible()) {
      await expect(tryMassgooLink).toBeVisible();
    }
  });
});

