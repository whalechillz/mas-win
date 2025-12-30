/**
 * 카카오 채널 설문 참여 메시지 완전 자동 준비 스크립트
 * 
 * 전체 프로세스:
 * 1. 관리자 로그인
 * 2. AI 이미지 생성 (젊은 톤)
 * 3. 이미지 갤러리 저장 확인
 * 4. 카카오 채널 에디터 접속
 * 5. 메시지 내용 입력
 * 6. 이미지 첨부
 * 7. 수신자 선택 (중복 제외)
 * 8. 초안 저장
 * 
 * 사용법:
 * node scripts/prepare-kakao-survey-message-complete.js
 */

require('dotenv').config({ path: '.env.local' });
const { chromium } = require('playwright');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.PRODUCTION_URL || 'https://win.masgolf.co.kr';
const ADMIN_LOGIN = process.env.ADMIN_EMAIL || process.env.ADMIN_LOGIN || '010-6669-9000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '66699000';

// 메시지 내용 (젊은 톤)
const MESSAGE_CONTENT = `[MASSGOO X MUZIIK] 설문 참여하고 특별 선물 받자! 🎁

안녕하세요! 마쓰구골프입니다.

선호하는 샤프트 설문에 참여해주시면
다음 특별 선물을 드립니다! ✨

• 스타일리시한 버킷햇
• 콜라보 골프모자
• 여권 파우치
• 티셔츠

참여하기: https://www.masgolf.co.kr/survey

전화 상담만 해도 특별 선물!
080-028-8888 (무료)

마쓰구골프`;

// AI 이미지 생성 프롬프트 (젊은 톤)
const AI_IMAGE_PROMPT = `젊은 한국 골퍼(30-50대)가 현대적인 골프 스튜디오에서 MASSGOO 드라이버를 테스트하는 장면. 스타일리시한 골프 모자를 착용하고, 하이테크 장비와 함께 프리미엄한 분위기. 쿨 블루 톤, LED 조명, 현대적 인테리어, 자연스러운 포즈, 전신 풀샷`;

// 예약 발송 시간 (12월 30일 10:00-11:00 사이)
const SCHEDULE_DATE = '2025-12-30';
const SCHEDULE_HOUR = 10;
const SCHEDULE_MINUTE = 0;

let generatedImageUrl = null;

async function login(page) {
  console.log('🔐 관리자 로그인 중...');
  
  try {
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // 이미 로그인되어 있는지 확인
    const currentUrl = page.url();
    if (!currentUrl.includes('/admin/login')) {
      console.log('✅ 이미 로그인되어 있습니다.\n');
      return;
    }

    // 로그인 정보 입력 (2단계 인증은 수동으로 진행)
    if (ADMIN_LOGIN && ADMIN_PASSWORD) {
      console.log('   이메일 입력 중...');
      const loginInput = page.locator('input#login').or(
        page.locator('input[name="login"]').or(
          page.locator('input[type="email"]').or(
            page.locator('input[type="text"]').first()
          )
        )
      ).first();
      await loginInput.waitFor({ timeout: 10000 });
      await loginInput.fill(ADMIN_LOGIN);
      await page.waitForTimeout(500);

      console.log('   비밀번호 입력 중...');
      const passwordInput = page.locator('input#password').or(
        page.locator('input[name="password"]').or(
          page.locator('input[type="password"]')
        )
      ).first();
      await passwordInput.fill(ADMIN_PASSWORD);
      await page.waitForTimeout(500);

      // 로그인 버튼 클릭
      console.log('   로그인 버튼 클릭 중...');
      const loginButton = page.locator('button:has-text("로그인")').or(
        page.locator('button[type="submit"]')
      ).first();
      await loginButton.click();
      await page.waitForTimeout(3000);

      // 2단계 인증 대기
      const currentUrl = page.url();
      const pageContent = await page.content();
      const hasTwoStep = pageContent.includes('2단계') || 
                         pageContent.includes('2-step') || 
                         pageContent.includes('인증번호') ||
                         currentUrl.includes('2단계') ||
                         currentUrl.includes('2-step');
      
      if (hasTwoStep) {
        console.log('   ⚠️ 2단계 인증이 필요합니다.');
        console.log('   💡 다음 중 하나의 방법으로 인증해주세요:');
        console.log('      1. 카카오톡으로 받은 인증 메시지에서 확인 버튼 클릭');
        console.log('      2. 네이버 메일 (johnnyutah@naver.com)에서 인증번호 확인');
        console.log('   💡 인증 완료까지 대기합니다... (최대 5분)\n');
        
        // 로그인 완료까지 대기 (최대 5분)
        let loginCompleted = false;
        for (let i = 0; i < 300; i++) {
          await page.waitForTimeout(1000);
          const url = page.url();
          const content = await page.content();
          
          // 로그인 완료 확인 (admin 페이지로 이동했는지)
          if (url.includes('/admin/') && !url.includes('/login') && !url.includes('accounts.kakao.com')) {
            loginCompleted = true;
            console.log('   ✅ 로그인 완료! (2단계 인증 성공)\n');
            break;
          }
          
          // 2단계 인증 페이지가 아닌 경우도 확인
          if (!content.includes('2단계') && !content.includes('2-step') && 
              !content.includes('인증번호') && 
              !url.includes('login') && 
              url.includes('/admin')) {
            loginCompleted = true;
            console.log('   ✅ 로그인 완료!\n');
            break;
          }
          
          // 10초마다 진행 상황 출력
          if (i % 10 === 0 && i > 0) {
            const remaining = 300 - i;
            console.log(`   ⏳ 인증 대기 중... (남은 시간: ${Math.floor(remaining / 60)}분 ${remaining % 60}초)`);
          }
        }
        
        if (!loginCompleted) {
          console.log('   ⚠️ 5분 내에 로그인이 완료되지 않았습니다.');
          console.log('   💡 수동으로 로그인을 완료해주세요.');
          console.log('   💡 로그인 완료 후 스크립트가 계속 진행됩니다.\n');
        }
      } else {
        // 2단계 인증이 필요 없는 경우
        await page.waitForTimeout(2000);
        const afterLoginUrl = page.url();
        if (afterLoginUrl.includes('/admin/') && !afterLoginUrl.includes('/login')) {
          console.log('✅ 로그인 성공!\n');
        } else {
          console.log('⚠️ 로그인 상태 확인 필요. 현재 URL:', afterLoginUrl);
        }
      }
    } else {
      console.log('   ⚠️ 로그인 정보가 없어 수동 로그인을 기다립니다.');
      console.log('   💡 브라우저에서 수동으로 로그인해주세요.');
      console.log('   💡 로그인 후 60초 대기합니다...\n');
      await page.waitForTimeout(60000); // 60초 대기
    }
  } catch (error) {
    console.error('❌ 로그인 실패:', error.message);
    throw error;
  }
}

async function generateAIImage(page) {
  console.log('🎨 AI 이미지 생성 중...');
  
  try {
    // AI 이미지 생성 페이지로 이동
    console.log('   1️⃣ AI 이미지 생성 페이지로 이동...');
    await page.goto(`${BASE_URL}/admin/ai-image-generator`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000); // 페이지 로드 대기
    console.log('   ✅ 페이지 로드 완료');

    // 하이테크 톤 선택 (드롭다운 또는 버튼)
    console.log('   2️⃣ 브랜딩 톤 선택 (하이테크 중심 혁신형)...');
    try {
      // "하이테크 중심 혁신형" 텍스트를 포함한 요소 찾기
      const hightechElements = page.locator('*').filter({ hasText: /하이테크.*혁신|high.tech.*innovative/i });
      const hightechCount = await hightechElements.count();
      
      if (hightechCount > 0) {
        // 부모 요소에서 클릭 가능한 버튼이나 라벨 찾기
        for (let i = 0; i < hightechCount; i++) {
          const element = hightechElements.nth(i);
          const parent = element.locator('..');
          const clickable = parent.locator('button, label, [role="button"]').first();
          
          if (await clickable.count() > 0) {
            await clickable.click();
            await page.waitForTimeout(2000);
            console.log('   ✅ 하이테크 톤 선택 완료');
            break;
          }
        }
      } else {
        // 대체 방법: 드롭다운에서 선택
        const toneDropdown = page.locator('select, [role="combobox"]').filter({ hasText: /톤|tone/i }).first();
        if (await toneDropdown.count() > 0) {
          await toneDropdown.selectOption({ label: /하이테크|high.tech/i });
          await page.waitForTimeout(1000);
          console.log('   ✅ 하이테크 톤 선택 완료 (드롭다운)');
        }
      }
    } catch (e) {
      console.log('   ⚠️ 브랜딩 톤 선택 건너뜀:', e.message);
    }

    // 장소 선택: 인도어 드라이버 연습장
    console.log('   3️⃣ 장소 선택 (인도어 드라이버 연습장)...');
    try {
      const locationButton = page.locator('button, div[role="button"]').filter({ 
        hasText: /인도어.*드라이버.*연습장|indoor.*driving.*range/i 
      }).first();
      
      if (await locationButton.count() > 0) {
        await locationButton.click();
        await page.waitForTimeout(2000);
        console.log('   ✅ 장소 선택 완료');
      } else {
        // 대체: "인도어"만 포함된 버튼
        const indoorButton = page.locator('button').filter({ hasText: /인도어|indoor/i }).first();
        if (await indoorButton.count() > 0) {
          await indoorButton.click();
          await page.waitForTimeout(2000);
          console.log('   ✅ 장소 선택 완료 (인도어)');
        }
      }
    } catch (e) {
      console.log('   ⚠️ 장소 선택 건너뜀:', e.message);
    }

    // 프롬프트 입력 필드 찾기
    console.log('   4️⃣ 이미지 프롬프트 입력...');
    const promptSelectors = [
      'textarea[placeholder*="프롬프트"]',
      'textarea[placeholder*="설명"]',
      'textarea[placeholder*="이미지"]',
      'textarea',
      'input[type="text"][placeholder*="프롬프트"]',
    ];
    
    let promptInput = null;
    for (const selector of promptSelectors) {
      const elements = page.locator(selector);
      if (await elements.count() > 0) {
        promptInput = elements.first();
        break;
      }
    }

    if (promptInput) {
      await promptInput.waitFor({ timeout: 10000 });
      await promptInput.click();
      await page.waitForTimeout(500);
      
      // 기존 내용 지우기
      await promptInput.fill('');
      await page.waitForTimeout(300);
      
      // 프롬프트 입력
      await promptInput.fill(AI_IMAGE_PROMPT);
      await page.waitForTimeout(1000);
      console.log('   ✅ 프롬프트 입력 완료');
    } else {
      console.log('   ⚠️ 프롬프트 입력 필드를 찾을 수 없습니다.');
    }

    // 이미지 생성 버튼 클릭
    console.log('   5️⃣ 이미지 생성 버튼 클릭...');
    const generateButtonSelectors = [
      'button:has-text("이미지 생성하기")',
      'button:has-text("생성하기")',
      'button:has-text("생성")',
      'button[type="submit"]',
    ];
    
    let generateButton = null;
    for (const selector of generateButtonSelectors) {
      const buttons = page.locator(selector);
      if (await buttons.count() > 0) {
        generateButton = buttons.first();
        break;
      }
    }

    if (generateButton) {
      await generateButton.waitFor({ timeout: 10000 });
      await generateButton.click();
      console.log('   ✅ 이미지 생성 시작...');
    } else {
      console.log('   ⚠️ 이미지 생성 버튼을 찾을 수 없습니다.');
      throw new Error('이미지 생성 버튼을 찾을 수 없습니다.');
    }

    // 이미지 생성 완료 대기 (최대 120초)
    console.log('   ⏳ 이미지 생성 대기 중... (최대 120초)');
    let imageGenerated = false;
    let lastLoadingState = true;
    
    for (let i = 0; i < 120; i++) {
      await page.waitForTimeout(2000);
      
      // 로딩 상태 확인
      const loadingIndicators = page.locator('[class*="loading"], [class*="spinner"], [class*="animate-spin"]');
      const isLoading = await loadingIndicators.count() > 0;
      
      if (isLoading !== lastLoadingState) {
        console.log(`   ${isLoading ? '⏳' : '✅'} 로딩 상태: ${isLoading ? '진행 중' : '완료'}`);
        lastLoadingState = isLoading;
      }
      
      // 생성된 이미지 찾기
      const images = page.locator('img').filter({ 
        hasNot: page.locator('[src*="placeholder"], [src*="data:image/svg"]')
      });
      
      const imageCount = await images.count();
      if (imageCount > 0) {
        for (let j = 0; j < imageCount; j++) {
          const img = images.nth(j);
          const src = await img.getAttribute('src');
          
          if (src && 
              !src.includes('placeholder') && 
              !src.includes('data:image/svg') &&
              (src.includes('http') || src.includes('/originals') || src.includes('/api'))) {
            generatedImageUrl = src.startsWith('http') ? src : `${BASE_URL}${src}`;
            imageGenerated = true;
            console.log(`   ✅ 이미지 생성 완료! (${i * 2}초 소요)`);
            console.log(`   📷 이미지 URL: ${generatedImageUrl}`);
            break;
          }
        }
        
        if (imageGenerated) break;
      }
      
      // 에러 메시지 확인
      const errorMessages = page.locator('*').filter({ hasText: /오류|에러|error|실패/i });
      if (await errorMessages.count() > 0) {
        const errorText = await errorMessages.first().textContent();
        console.log(`   ⚠️ 에러 감지: ${errorText}`);
        break;
      }
    }

    if (!imageGenerated) {
      console.log('   ⚠️ 이미지 생성이 완료되지 않았거나 이미지를 찾을 수 없습니다.');
      console.log('   💡 수동으로 이미지를 생성하고 갤러리에서 선택하세요.');
      console.log('   💡 또는 기존 갤러리 이미지를 사용하세요.\n');
    } else {
      console.log('   ✅ AI 이미지 생성 완료!\n');
    }

    await page.waitForTimeout(3000);
  } catch (error) {
    console.error('❌ AI 이미지 생성 실패:', error.message);
    console.log('   💡 수동으로 이미지를 생성하고 갤러리에서 선택하세요.\n');
  }
}

async function prepareKakaoMessage(page) {
  console.log('📝 카카오 채널 메시지 준비 중...');
  
  try {
    // 카카오 채널 에디터 페이지로 이동
    console.log('   1️⃣ 카카오 채널 에디터 페이지로 이동...');
    await page.goto(`${BASE_URL}/admin/kakao`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    console.log('   ✅ 페이지 로드 완료');

    // 제목 입력
    console.log('   2️⃣ 제목 입력...');
    const titleInput = page.locator('input[type="text"]').first();
    await titleInput.waitFor({ timeout: 10000 });
    await titleInput.fill('[MASSGOO X MUZIIK] 설문 참여하고 특별 선물 받자!');
    await page.waitForTimeout(500);
    console.log('   ✅ 제목 입력 완료');

    // 메시지 내용 입력
    console.log('   3️⃣ 메시지 내용 입력...');
    const contentInput = page.locator('textarea').first();
    await contentInput.waitFor({ timeout: 10000 });
    await contentInput.click();
    await page.waitForTimeout(300);
    await contentInput.fill(MESSAGE_CONTENT);
    await page.waitForTimeout(1000);
    console.log('   ✅ 메시지 내용 입력 완료');

    // 친구톡 선택
    console.log('   4️⃣ 메시지 타입 선택 (친구톡)...');
    try {
      const friendtalkRadio = page.locator('input[type="radio"][value="FRIENDTALK"]').or(
        page.locator('label').filter({ hasText: /친구톡/i })
      ).first();
      if (await friendtalkRadio.count() > 0) {
        await friendtalkRadio.click();
        await page.waitForTimeout(500);
        console.log('   ✅ 친구톡 선택 완료');
      }
    } catch (e) {
      console.log('   ⚠️ 메시지 타입 선택 건너뜀');
    }

    // 수신자 선택 컴포넌트 활성화
    console.log('   5️⃣ 수신자 선택 설정...');
    await page.waitForTimeout(2000);
    
    // SMS 수신자 제외 체크박스
    try {
      const excludeSmsCheckbox = page.locator('input[type="checkbox"]').filter({ 
        has: page.locator('xpath=..').filter({ hasText: /SMS.*수신자/i })
      }).first();
      if (await excludeSmsCheckbox.count() > 0 && !(await excludeSmsCheckbox.isChecked())) {
        await excludeSmsCheckbox.check();
        await page.waitForTimeout(1000);
        console.log('   ✅ SMS 수신자 제외 체크');
      }
    } catch (e) {
      console.log('   ⚠️ SMS 수신자 제외 체크 건너뜀');
    }

    // 설문 참여자 제외 체크박스
    try {
      const excludeSurveyCheckbox = page.locator('input[type="checkbox"]').filter({ 
        has: page.locator('xpath=..').filter({ hasText: /설문.*참여자/i })
      }).first();
      if (await excludeSurveyCheckbox.count() > 0 && !(await excludeSurveyCheckbox.isChecked())) {
        await excludeSurveyCheckbox.check();
        await page.waitForTimeout(1000);
        console.log('   ✅ 설문 참여자 제외 체크');
      }
    } catch (e) {
      console.log('   ⚠️ 설문 참여자 제외 체크 건너뜀');
    }

    // 수신자 목록 새로고침 버튼 클릭
    try {
      const refreshButton = page.locator('button').filter({ hasText: /새로고침|refresh/i }).first();
      if (await refreshButton.count() > 0) {
        await refreshButton.click();
        await page.waitForTimeout(3000);
        console.log('   ✅ 수신자 목록 새로고침 완료');
      }
    } catch (e) {
      console.log('   ⚠️ 수신자 목록 새로고침 건너뜀');
    }

    // 이미지 선택
    console.log('   6️⃣ 이미지 선택...');
    try {
      const imageButtonSelectors = [
        'button:has-text("갤러리에서 선택")',
        'button:has-text("이미지 선택")',
        'button:has-text("이미지")',
      ];
      
      let imageButton = null;
      for (const selector of imageButtonSelectors) {
        const buttons = page.locator(selector);
        if (await buttons.count() > 0) {
          imageButton = buttons.first();
          break;
        }
      }

      if (imageButton) {
        await imageButton.waitFor({ timeout: 10000 });
        await imageButton.click();
        await page.waitForTimeout(3000); // 갤러리 모달 열림 대기

        if (generatedImageUrl) {
          // 생성된 이미지 URL로 검색
          console.log('      생성된 이미지 검색 중...');
          const searchInput = page.locator('input[type="search"], input[placeholder*="검색"]').first();
          if (await searchInput.count() > 0) {
            // URL에서 파일명 추출
            const fileName = generatedImageUrl.split('/').pop() || '';
            await searchInput.fill(fileName);
            await page.waitForTimeout(2000);
          }
        }

        // 갤러리에서 이미지 선택 (최근 이미지 또는 검색 결과)
        const galleryImages = page.locator('img').filter({ 
          hasNot: page.locator('[src*="placeholder"], [src*="data:image/svg"]')
        });
        
        const imageCount = await galleryImages.count();
        if (imageCount > 0) {
          // 첫 번째 이미지 클릭
          await galleryImages.first().click();
          await page.waitForTimeout(1000);
          
          // 선택 버튼 클릭
          const selectButtonSelectors = [
            'button:has-text("선택")',
            'button:has-text("확인")',
            'button[type="button"]:has-text("선택")',
          ];
          
          for (const selector of selectButtonSelectors) {
            const selectButton = page.locator(selector);
            if (await selectButton.count() > 0) {
              await selectButton.first().click();
              await page.waitForTimeout(2000);
              console.log('   ✅ 이미지 선택 완료');
              break;
            }
          }
        } else {
          console.log('   ⚠️ 갤러리에서 이미지를 찾을 수 없습니다.');
          // 갤러리 모달 닫기
          const closeButton = page.locator('button').filter({ hasText: /닫기|close|취소/i }).first();
          if (await closeButton.count() > 0) {
            await closeButton.click();
            await page.waitForTimeout(1000);
          }
        }
      } else {
        console.log('   ⚠️ 이미지 선택 버튼을 찾을 수 없습니다.');
      }
    } catch (e) {
      console.log('   ⚠️ 이미지 선택 건너뜀:', e.message);
    }

    // 짧은 링크 생성 (선택사항)
    console.log('   7️⃣ 짧은 링크 생성...');
    try {
      const linkInput = page.locator('input[type="url"]').or(
        page.locator('input').filter({ hasText: /링크|url/i })
      ).first();
      if (await linkInput.count() > 0) {
        await linkInput.fill('https://www.masgolf.co.kr/survey');
        await page.waitForTimeout(500);
        
        const generateLinkButton = page.locator('button').filter({ hasText: /링크.*생성|generate/i }).first();
        if (await generateLinkButton.count() > 0) {
          await generateLinkButton.click();
          await page.waitForTimeout(2000);
          console.log('   ✅ 짧은 링크 생성 완료');
        }
      }
    } catch (e) {
      console.log('   ⚠️ 짧은 링크 생성 건너뜀');
    }

    // 중복 수신 검증
    console.log('   8️⃣ 중복 수신 검증...');
    try {
      const validateButton = page.locator('button').filter({ hasText: /검증|validate/i }).first();
      if (await validateButton.count() > 0) {
        await validateButton.click();
        await page.waitForTimeout(2000);
        console.log('   ✅ 중복 수신 검증 완료');
      }
    } catch (e) {
      console.log('   ⚠️ 중복 수신 검증 건너뜀');
    }

    // 초안 저장
    console.log('   9️⃣ 초안 저장...');
    const saveButton = page.locator('button').filter({ hasText: /저장|save|초안/i }).first();
    await saveButton.waitFor({ timeout: 10000 });
    await saveButton.click();
    await page.waitForTimeout(3000);
    console.log('   ✅ 초안 저장 완료');

    console.log('\n✅ 카카오 채널 메시지 준비 완료!\n');
  } catch (error) {
    console.error('❌ 카카오 메시지 준비 실패:', error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 카카오 채널 설문 참여 메시지 완전 자동 준비 시작...\n');
  console.log(`📅 예약 날짜: ${SCHEDULE_DATE}`);
  console.log(`⏰ 예약 시간: ${String(SCHEDULE_HOUR).padStart(2, '0')}:${String(SCHEDULE_MINUTE).padStart(2, '0')}\n`);

  // 환경 변수가 없으면 경고만 출력하고 계속 진행 (이미 로그인되어 있을 수 있음)
  if (!ADMIN_LOGIN || !ADMIN_PASSWORD) {
    console.log('⚠️ ADMIN_EMAIL 또는 ADMIN_PASSWORD 환경 변수가 설정되지 않았습니다.');
    console.log('   이미 로그인되어 있다면 자동으로 진행됩니다.');
    console.log('   로그인이 필요하면 .env.local 파일에 다음을 추가해주세요:');
    console.log('   ADMIN_EMAIL=your_email@example.com');
    console.log('   ADMIN_PASSWORD=your_password\n');
  }

  // 크롬 베타 사용 (chromium 대신 chrome 사용)
  const browser = await chromium.launch({ 
    headless: false,
    channel: 'chrome-beta', // 크롬 베타 사용
    slowMo: 500, // 각 액션 사이 500ms 지연 (디버깅용)
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  
  const page = await context.newPage();

  try {
    // 1. 관리자 로그인
    await login(page);

    // 2. AI 이미지 생성
    await generateAIImage(page);

    // 3. 카카오 채널 메시지 준비
    await prepareKakaoMessage(page);

    console.log('✅ 모든 작업 완료!\n');
    console.log('📋 다음 단계:');
    console.log('   1. 카카오 채널 에디터에서 메시지 최종 확인');
    console.log('   2. 수신자 목록 확인');
    console.log('   3. 이미지 확인');
    console.log('   4. 예약 시간 확인 (필요시 수정)');
    console.log('   5. 발송 실행\n');

    // 브라우저를 열어둠 (수동 확인용)
    console.log('브라우저를 열어두었습니다. 수동으로 확인 후 닫아주세요.');
    await page.waitForTimeout(120000); // 2분 대기

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    console.log('\n브라우저를 열어두었습니다. 수동으로 확인해주세요.');
    await page.waitForTimeout(120000);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);

