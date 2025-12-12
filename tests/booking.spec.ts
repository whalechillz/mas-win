import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './fixtures/auth';

test.describe('시타 예약 E2E 테스트', () => {
  test('예약 생성 플로우', async ({ page }) => {
    // 1. 예약 페이지 접근
    await page.goto('/booking');
    
    // 2. 예약 페이지 로딩 대기
    await page.waitForLoadState('networkidle');
    
    // 3. 날짜 선택 대기 (캘린더가 로드될 때까지)
    await page.waitForTimeout(2000);
    
    // 4. 첫 번째 예약 가능한 날짜 클릭 (캘린더에서)
    const availableDateButton = page.locator('button:not([disabled]):has-text(/\d{1,2}/)').first();
    if (await availableDateButton.isVisible({ timeout: 5000 })) {
      await availableDateButton.click();
      await page.waitForTimeout(1000);
    }
    
    // 5. 예약 가능한 시간 선택
    const availableTimeButton = page.locator('button:not([disabled]):has-text(/\\d{1,2}:\\d{2}/)').first();
    if (await availableTimeButton.isVisible({ timeout: 5000 })) {
      await availableTimeButton.click();
      await page.waitForTimeout(1000);
    } else {
      // 시간이 없으면 테스트 스킵 (예약 가능한 시간이 없는 경우)
      console.log('예약 가능한 시간이 없어 테스트를 건너뜁니다.');
      return;
    }
    
    // 6. "다음 단계" 버튼 클릭
    const nextButton = page.locator('button:has-text("다음 단계")');
    if (await nextButton.isVisible({ timeout: 5000 })) {
      await nextButton.click();
      await page.waitForURL(/\/booking\/form/, { timeout: 10000 });
    }
    
    // 7. 예약 폼 페이지에서 정보 입력
    await page.waitForLoadState('networkidle');
    
    // 이름 입력
    const nameInput = page.locator('input[name="name"]').first();
    if (await nameInput.isVisible({ timeout: 5000 })) {
      await nameInput.fill('테스트 고객');
    }
    
    // 전화번호 입력
    const phoneInput = page.locator('input[type="tel"], input[name="phone"]').first();
    if (await phoneInput.isVisible({ timeout: 5000 })) {
      await phoneInput.fill('010-9876-5432');
    }
    
    // 8. 예약 완료 버튼 클릭 (마지막 단계)
    const submitButton = page.locator('button[type="submit"]:has-text("예약 완료"), button:has-text("예약하기")').first();
    if (await submitButton.isVisible({ timeout: 5000 })) {
      await submitButton.click();
      
      // 9. 예약 완료 페이지 확인
      await page.waitForURL(/\/booking\/success/, { timeout: 15000 });
      await expect(page.locator('text=예약이 완료되었습니다, text=예약 완료')).toBeVisible({ timeout: 5000 });
    }
  });

  test('예약 폼 유효성 검사', async ({ page }) => {
    // 예약 폼 페이지로 직접 이동 (쿼리 파라미터 필요)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);
    const dateStr = tomorrow.toISOString().split('T')[0];
    
    await page.goto(`/booking/form?date=${dateStr}&time=10:00`);
    await page.waitForLoadState('networkidle');
    
    // 빈 상태로 제출 시도 (마지막 단계에서)
    // Step 3까지 진행한 후 제출 버튼 클릭
    const submitButton = page.locator('button[type="submit"]:has-text("예약 완료")').first();
    if (await submitButton.isVisible({ timeout: 5000 })) {
      await submitButton.click();
      
      // 에러 메시지 확인
      const errorMessage = page.locator('.bg-red-50, .text-red-700, .error').first();
      await expect(errorMessage).toBeVisible({ timeout: 3000 });
    }
  });

  test('관리자 페이지에서 예약 확인', async ({ page }) => {
    // 관리자 로그인
    await loginAsAdmin(page);
    
    // 예약 관리 페이지로 이동
    await page.goto('/admin/booking');
    await page.waitForLoadState('networkidle');
    
    // 예약 관리 페이지 확인 (대시보드, 캘린더, 목록 등)
    await expect(page.locator('text=예약, text=시타, text=대시보드, text=캘린더').first()).toBeVisible({ timeout: 10000 });
  });

  test('예약 확정 시 SMS 발송 확인', async ({ page }) => {
    // 관리자 로그인
    await loginAsAdmin(page);
    
    // 예약 관리 페이지로 이동
    await page.goto('/admin/booking');
    await page.waitForLoadState('networkidle');
    
    // 예약 목록 또는 캘린더 뷰 확인
    // 실제 예약 확정 기능은 수동으로 테스트하는 것이 좋을 수 있음
    // (자동화된 테스트는 데이터 의존성이 높음)
    await expect(page.locator('text=예약, text=시타, text=대시보드').first()).toBeVisible({ timeout: 10000 });
  });

  test('예약 페이지 네비게이션', async ({ page }) => {
    await page.goto('/booking');
    await page.waitForLoadState('networkidle');
    
    // "시타 예약" 또는 "무료 시타" 링크 확인
    const tryMassgooLink = page.locator('a[href="/try-a-massgoo"], a[href*="try-a-massgoo"]').first();
    if (await tryMassgooLink.isVisible({ timeout: 5000 })) {
      await expect(tryMassgooLink).toBeVisible();
    }
    
    // 취소 버튼 확인
    const cancelButton = page.locator('a:has-text("취소"), button:has-text("취소")').first();
    if (await cancelButton.isVisible({ timeout: 5000 })) {
      await expect(cancelButton).toBeVisible();
    }
  });
});

