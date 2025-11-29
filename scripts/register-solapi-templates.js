/**
 * 솔라피 템플릿 자동 등록 스크립트
 * 
 * 사용법:
 * node scripts/register-solapi-templates.js
 * 
 * 등록할 템플릿:
 * 1. 기본안내 (TI_8967)
 * 2. 시타사이트&약도안내 최신 (TV_5953)
 * 3. 당일시타예약최신
 */

require('dotenv').config({ path: '.env.local' });
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SOLAPI_URL = 'https://console.solapi.com';
const SOLAPI_USERNAME = process.env.SOLAPI_USERNAME || '';
const SOLAPI_PASSWORD = process.env.SOLAPI_PASSWORD || '';

// 등록할 템플릿 정보
const TEMPLATES = [
  {
    name: '기본안내',
    aligoCode: 'TI_8967',
    content: `#{고객명}님, 안녕하세요! 마쓰구골프입니다.

요청하신 마쓰구 고반발 드라이버 상세정보입니다.

[제품 정보]
• 내용: #{내용}`,
    additionalInfo: `☎ 마쓰구 수원본점
MASGOLF Suwon Main Branch
수원시 영통구 법조로149번길 200
TEL 031-215-0013
(무료) 080-028-8888 비거리 상담
(OPEN) 09:00~18:00(월~금)`,
    variables: ['#{고객명}', '#{내용}'],
    buttons: [
      {
        type: 'WL', // 웹 링크
        name: '마쓰구 공식 홈페이지 >',
        mobileUrl: 'https://www.masgolf.co.kr/',
        pcUrl: 'https://www.masgolf.co.kr/'
      }
    ],
    reviewerNote: '고객이 요청한 제품 상세정보를 안내하는 기본 템플릿입니다. 고반발 드라이버 등 제품 정보를 제공할 때 사용합니다.'
  },
  {
    name: '시타사이트&약도안내 최신',
    aligoCode: 'TV_5953',
    content: `#{고객명}님, 안녕하세요! 마쓰구골프입니다.

요청하신 고반발 드라이버 시타 예약과 관련하여 마쓰구 수원 본점 방문 안내를 드립니다. 고객님께서 편하게 방문하실 수 있도록 최선을 다해 준비하겠습니다.

[안내사항]
• 궁금하신 사항이 있으시면 언제든지 연락 주세요.
• 예약 일정 변경이 필요하시면 사전에 연락 부탁드립니다.`,
    additionalInfo: `☎ 마쓰구 수원본점
MASGOLF Suwon Main Branch
수원시 영통구 법조로149번길 200
TEL 031-215-0013
(무료) 080-028-8888 비거리 상담
(OPEN) 09:00~18:00(월~금)`,
    variables: ['#{고객명}'],
    buttons: [
      {
        type: 'WL',
        name: '지금 시타 예약하기 >',
        mobileUrl: 'https://www.masgolf.co.kr/booking',
        pcUrl: 'https://www.masgolf.co.kr/booking'
      },
      {
        type: 'WL',
        name: '찾아오시는 길 안내 >',
        mobileUrl: 'https://www.masgolf.co.kr/contact',
        pcUrl: 'https://www.masgolf.co.kr/contact'
      }
    ],
    reviewerNote: '고객이 시타 예약을 요청했을 때 방문 안내 및 약도를 제공하는 템플릿입니다. 시타 예약 페이지와 약도 페이지 링크를 제공합니다.'
  },
  {
    name: '당일시타예약최신',
    aligoCode: 'TBD',
    content: `#{고객명}님, 안녕하세요! 마쓰구골프입니다.

오늘은 고객님의 고반발 드라이버 시타 서비스 예약일입니다. 고객님만을 위해 특별히 준비한 맞춤형 분석과 시타 체험을 통해 최상의 경험을 선사해 드리겠습니다.

[예약 정보]
• 예약시간: #{예약시간}

[안내사항]
• 일정 조정이 필요하시다면 언제든지 편하게 연락 주세요.
• 고객님의 편의를 위해 최선을 다하겠습니다.`,
    additionalInfo: `☎ 마쓰구 수원본점
MASGOLF Suwon Main Branch
수원시 영통구 법조로149번길 200
TEL 031-215-0013
(무료) 080-028-8888 비거리 상담
(OPEN) 09:00~18:00(월~금)`,
    variables: ['#{고객명}', '#{예약시간}'],
    buttons: [
      {
        type: 'WL',
        name: '찾아오시는 길 안내 >',
        mobileUrl: 'https://www.masgolf.co.kr/contact',
        pcUrl: 'https://www.masgolf.co.kr/contact'
      }
    ],
    reviewerNote: '당일 시타 예약일을 고객에게 알리는 리마인더 템플릿입니다. 예약 시간을 명확히 안내하고, 일정 조정이 필요할 경우 연락을 요청합니다.'
  }
];

async function loginToSolapi(page) {
  console.log('\n🔐 솔라피 로그인 중...');
  
  if (!SOLAPI_USERNAME || !SOLAPI_PASSWORD) {
    throw new Error('❌ 솔라피 로그인 정보가 없습니다. .env.local에 SOLAPI_USERNAME과 SOLAPI_PASSWORD를 설정해주세요.');
  }

  await page.goto(`${SOLAPI_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);

  // 로그인 필드 찾기
  const emailInputSelectors = [
    'input[type="email"]',
    'input[name="email"]',
    'input[name="username"]',
    'input[placeholder*="아이디"]',
    'input[placeholder*="이메일"]',
    'input[placeholder*="전화번호"]',
    'input[placeholder*="ID"]',
    'input[placeholder*="Email"]',
  ];
  
  let emailInput = null;
  for (const selector of emailInputSelectors) {
    const input = await page.locator(selector).first();
    if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
      emailInput = input;
      console.log(`  ✅ 로그인 ID 필드 발견: ${selector}`);
      break;
    }
  }
  
  const passwordInput = await page.locator('input[type="password"]').first();
  const loginButton = await page.locator('button[type="submit"], button:has-text("로그인"), button:has-text("Login")').first();

  if (emailInput && await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await emailInput.fill(SOLAPI_USERNAME);
    console.log('  ✅ ID 입력 완료');
  } else {
    throw new Error('❌ 로그인 ID 필드를 찾을 수 없습니다.');
  }

  if (await passwordInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await passwordInput.fill(SOLAPI_PASSWORD);
    console.log('  ✅ 비밀번호 입력 완료');
  } else {
    throw new Error('❌ 비밀번호 필드를 찾을 수 없습니다.');
  }

  if (await loginButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await loginButton.click();
    console.log('  ✅ 로그인 버튼 클릭');
  } else {
    throw new Error('❌ 로그인 버튼을 찾을 수 없습니다.');
  }

  // 로그인 완료 대기 (최대 60초)
  console.log('  ⏳ 로그인 완료 대기 중... (최대 60초)');
  console.log('  💡 로그인이 필요하면 브라우저에서 직접 로그인해주세요.');
  
  let loginSuccess = false;
  const maxWaitTime = 60000; // 60초
  const checkInterval = 2000; // 2초마다 확인
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    const currentUrl = page.url();
    // 로그인 페이지가 아니면 로그인 성공으로 간주
    if (!currentUrl.includes('/login') && !currentUrl.includes('/oauth2/login')) {
      loginSuccess = true;
      console.log('\n  ✅ 로그인 완료 확인됨');
      break;
    }
    await page.waitForTimeout(checkInterval);
    process.stdout.write('.'); // 진행 표시
  }
  
  if (!loginSuccess) {
    console.log('\n  ⚠️  로그인 시간 초과 (60초)');
    console.log('  💡 브라우저에서 수동으로 로그인한 후 계속 진행됩니다.');
    console.log('  ⏳ 추가로 10초 대기 중...');
    await page.waitForTimeout(10000);
  }
}

async function navigateToTemplatePage(page) {
  console.log('\n📋 템플릿 관리 페이지로 이동 중...');
  
  // 현재 URL 확인
  const currentUrl = page.url();
  console.log(`  📍 현재 URL: ${currentUrl}`);
  
  // 카카오톡 템플릿 페이지로 이동 시도
  try {
    await page.goto(`${SOLAPI_URL}/kakao/templates`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    console.log('  ✅ 템플릿 페이지 이동 완료');
  } catch (error) {
    console.log('  ⚠️  직접 이동 실패, 메뉴를 통해 이동 시도...');
    
    // 메뉴를 통해 이동 시도
    const kakaoMenu = await page.locator('text=카카오, a:has-text("카카오")').first();
    if (await kakaoMenu.isVisible({ timeout: 5000 }).catch(() => false)) {
      await kakaoMenu.click();
      await page.waitForTimeout(2000);
      console.log('  ✅ 카카오 메뉴 클릭');
    }
    
    // 템플릿 메뉴 클릭
    const templateMenu = await page.locator('text=템플릿, a:has-text("템플릿"), text=알림톡 템플릿').first();
    if (await templateMenu.isVisible({ timeout: 5000 }).catch(() => false)) {
      await templateMenu.click();
      await page.waitForTimeout(3000);
      console.log('  ✅ 템플릿 메뉴 클릭');
    }
  }
  
  // "알림톡 템플릿" 탭이 활성화되어 있는지 확인
  const templateTab = await page.locator('text=알림톡 템플릿, button:has-text("알림톡 템플릿")').first();
  if (await templateTab.isVisible({ timeout: 5000 }).catch(() => false)) {
    await templateTab.click();
    await page.waitForTimeout(2000);
    console.log('  ✅ 알림톡 템플릿 탭 클릭');
  }
  
  console.log('  ✅ 템플릿 관리 페이지 도착');
}

async function registerTemplate(page, template, index) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[${index + 1}/${TEMPLATES.length}] "${template.name}" 템플릿 등록 시작`);
  console.log(`${'='.repeat(60)}`);
  console.log(`\n📋 등록할 템플릿 정보:`);
  console.log(`   이름: ${template.name}`);
  console.log(`   알리고 코드: ${template.aligoCode}`);
  console.log(`   변수: ${template.variables.join(', ')}`);
  console.log(`   버튼 개수: ${template.buttons.length}개`);
  template.buttons.forEach((btn, i) => {
    console.log(`     버튼 ${i + 1}: ${btn.name} (${btn.mobileUrl})`);
  });
  console.log(`\n📝 템플릿 내용 (본문):`);
  console.log(`   ${template.content.split('\n').join('\n   ')}`);
  
  if (template.additionalInfo) {
    console.log(`\n  📋 부가정보 (회사 정보):`);
    console.log(`   ${template.additionalInfo.split('\n').join('\n   ')}`);
  }
  
  console.log(`\n💬 검수자 참고 의견:`);
  console.log(`   ${template.reviewerNote}`);
  console.log(`\n${'='.repeat(60)}\n`);
  
  try {
    // 현재 페이지 상태 확인
    const currentUrl = page.url();
    console.log(`📍 현재 URL: ${currentUrl}`);
    
    // 템플릿 등록 버튼 찾기 (다양한 선택자 시도)
    const registerButtonSelectors = [
      'button:has-text("템플릿 등록")',
      'button:has-text("+ 템플릿 등록")',
      'button:has-text("등록")',
      'a:has-text("템플릿 등록")',
      'a:has-text("+ 템플릿 등록")',
      '[class*="register"]',
      '[class*="add"]',
      '[id*="register"]',
      '[id*="add"]',
      'button[type="button"]:has-text("+")',
      '.btn-primary:has-text("등록")',
      '.btn:has-text("등록")'
    ];
    
    let registerButton = null;
    for (const selector of registerButtonSelectors) {
      try {
        const btn = await page.locator(selector).first();
        if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
          registerButton = btn;
          console.log(`  ✅ 템플릿 등록 버튼 발견: ${selector}`);
          break;
        }
      } catch (e) {
        // 다음 선택자 시도
        continue;
      }
    }
    
    if (registerButton) {
      await registerButton.click();
      console.log('  ✅ 템플릿 등록 버튼 클릭');
      await page.waitForTimeout(3000);
    } else {
      console.log('  ⚠️  템플릿 등록 버튼을 자동으로 찾을 수 없습니다.');
      console.log('  💡 브라우저에서 수동으로 "템플릿 등록" 또는 "+ 템플릿 등록" 버튼을 클릭해주세요.');
      console.log('  ⏳ 15초 대기 중... (버튼 클릭 후 자동으로 진행됩니다)');
      
      // 수동 클릭 대기
      await page.waitForTimeout(15000);
      
      // 모달이나 폼이 열렸는지 확인
      const modalVisible = await page.locator('input[placeholder*="템플릿"], textarea[placeholder*="내용"], input[name*="name"]').first().isVisible({ timeout: 3000 }).catch(() => false);
      if (!modalVisible) {
        throw new Error('템플릿 등록 폼이 열리지 않았습니다. 수동으로 버튼을 클릭해주세요.');
      }
      console.log('  ✅ 템플릿 등록 폼 확인됨');
    }

    // 템플릿 이름 입력 (여러 선택자 시도)
    const nameInputSelectors = [
      'input[placeholder*="템플릿 이름"]',
      'input[name*="name"]',
      'input[id*="name"]',
      'input[type="text"]',
      'input'
    ];
    
    let nameInput = null;
    for (const selector of nameInputSelectors) {
      try {
        const input = await page.locator(selector).first();
        if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
          const placeholder = await input.getAttribute('placeholder').catch(() => '');
          if (placeholder.includes('템플릿') || placeholder.includes('이름') || !placeholder) {
            nameInput = input;
            console.log(`  ✅ 템플릿 이름 필드 발견: ${selector}`);
            break;
          }
        }
      } catch (e) {
        continue;
      }
    }
    
    if (nameInput) {
      await nameInput.fill(template.name);
      console.log(`  ✅ 템플릿 이름 입력: "${template.name}"`);
      await page.waitForTimeout(1000);
    } else {
      console.log('  ⚠️  템플릿 이름 필드를 찾을 수 없습니다. 수동으로 입력해주세요.');
    }

    // 템플릿 내용 입력 (여러 선택자 시도)
    const contentInputSelectors = [
      'textarea[placeholder*="내용"]',
      'textarea[name*="content"]',
      'textarea[id*="content"]',
      'textarea[placeholder*="메시지"]',
      'textarea[placeholder*="알림톡"]',
      'textarea',
      '[contenteditable="true"]'
    ];
    
    let contentInput = null;
    for (const selector of contentInputSelectors) {
      try {
        const input = await page.locator(selector).first();
        if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
          contentInput = input;
          console.log(`  ✅ 템플릿 내용 필드 발견: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (contentInput) {
      await contentInput.fill(template.content);
      console.log('  ✅ 템플릿 내용 입력 완료');
      await page.waitForTimeout(2000);
    } else {
      console.log('  ⚠️  템플릿 내용 필드를 찾을 수 없습니다. 수동으로 입력해주세요.');
    }

    // 변수 등록 (있는 경우)
    if (template.variables && template.variables.length > 0) {
      console.log(`  📝 변수 등록: ${template.variables.join(', ')}`);
      // 변수는 템플릿 내용에 포함되어 있으므로 자동으로 인식될 수 있음
    }

    // 버튼 추가
    if (template.buttons && template.buttons.length > 0) {
      console.log(`\n  🔘 버튼 ${template.buttons.length}개 추가 시작...`);
      
      for (let i = 0; i < template.buttons.length; i++) {
        const button = template.buttons[i];
        console.log(`\n    [버튼 ${i + 1}/${template.buttons.length}] ${button.name}`);
        
        // 버튼 추가 버튼 찾기 (여러 선택자 시도)
        const addButtonSelectors = [
          'button:has-text("바로연결 버튼추가")',
          'button:has-text("버튼 추가")',
          'button:has-text("+ 버튼")',
          'button:has-text("+")',
          '[class*="add-button"]',
          '[class*="button-add"]'
        ];
        
        let addButton = null;
        for (const selector of addButtonSelectors) {
          try {
            const btn = await page.locator(selector).first();
            if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
              addButton = btn;
              console.log(`      ✅ 버튼 추가 버튼 발견: ${selector}`);
              break;
            }
          } catch (e) {
            continue;
          }
        }
        
        if (addButton) {
          await addButton.click();
          console.log('      ✅ 버튼 추가 버튼 클릭');
          await page.waitForTimeout(2000);
        } else {
          console.log('      ⚠️  버튼 추가 버튼을 찾을 수 없습니다. 수동으로 추가해주세요.');
          await page.waitForTimeout(3000);
        }

        // 버튼 유형 선택 (웹 링크) - 여러 선택자 시도
        const buttonTypeSelectors = [
          'select[name*="type"]',
          'select[id*="type"]',
          'select'
        ];
        
        let buttonTypeSelect = null;
        for (const selector of buttonTypeSelectors) {
          try {
            const select = await page.locator(selector).nth(i);
            if (await select.isVisible({ timeout: 2000 }).catch(() => false)) {
              buttonTypeSelect = select;
              break;
            }
          } catch (e) {
            continue;
          }
        }
        
        if (buttonTypeSelect) {
          await buttonTypeSelect.selectOption({ value: 'WL' });
          console.log('      ✅ 버튼 유형 선택: 웹 링크 (WL)');
          await page.waitForTimeout(1000);
        }

        // 버튼 이름 입력
        const buttonNameSelectors = [
          'input[placeholder*="버튼 이름"]',
          'input[placeholder*="버튼명"]',
          'input[name*="buttonName"]',
          'input[name*="name"]',
          'input[type="text"]'
        ];
        
        let buttonNameInput = null;
        for (const selector of buttonNameSelectors) {
          try {
            const input = await page.locator(selector).nth(i);
            if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
              buttonNameInput = input;
              break;
            }
          } catch (e) {
            continue;
          }
        }
        
        if (buttonNameInput) {
          await buttonNameInput.fill(button.name);
          console.log(`      ✅ 버튼 이름 입력: "${button.name}"`);
          await page.waitForTimeout(500);
        }

        // 모바일 URL 입력
        const mobileUrlSelectors = [
          'input[placeholder*="모바일"]',
          'input[placeholder*="Mobile"]',
          'input[name*="mobileUrl"]',
          'input[name*="mobile"]',
          'input[type="url"]'
        ];
        
        let mobileUrlInput = null;
        for (const selector of mobileUrlSelectors) {
          try {
            const input = await page.locator(selector).nth(i);
            if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
              mobileUrlInput = input;
              break;
            }
          } catch (e) {
            continue;
          }
        }
        
        if (mobileUrlInput) {
          await mobileUrlInput.fill(button.mobileUrl);
          console.log(`      ✅ 모바일 URL 입력: ${button.mobileUrl}`);
          await page.waitForTimeout(500);
        }

        // PC URL 입력
        const pcUrlSelectors = [
          'input[placeholder*="PC"]',
          'input[placeholder*="Desktop"]',
          'input[name*="pcUrl"]',
          'input[name*="pc"]'
        ];
        
        let pcUrlInput = null;
        for (const selector of pcUrlSelectors) {
          try {
            const input = await page.locator(selector).nth(i);
            if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
              pcUrlInput = input;
              break;
            }
          } catch (e) {
            continue;
          }
        }
        
        if (pcUrlInput) {
          await pcUrlInput.fill(button.pcUrl);
          console.log(`      ✅ PC URL 입력: ${button.pcUrl}`);
          await page.waitForTimeout(500);
        }
        
        console.log(`    ✅ 버튼 ${i + 1} 설정 완료`);
      }
    }

    // 부가정보 입력 (회사 정보)
    if (template.additionalInfo) {
      console.log('\n  📋 부가정보(회사 정보) 입력 중...');
      const additionalInfoSelectors = [
        'textarea[placeholder*="부가정보"]',
        'textarea[placeholder*="선택사항"]',
        'textarea[name*="additional"]',
        'textarea[id*="additional"]',
        'textarea[placeholder*="변수 사용 불가"]',
        'textarea'
      ];
      
      let additionalInfoInput = null;
      for (const selector of additionalInfoSelectors) {
        try {
          const inputs = await page.locator(selector).all();
          for (const input of inputs) {
            if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
              const placeholder = await input.getAttribute('placeholder').catch(() => '');
              const label = await input.evaluate(el => {
                const label = el.closest('div')?.querySelector('label');
                return label?.textContent || '';
              }).catch(() => '');
              
              // 부가정보 필드 확인 (변수 사용 불가, 선택사항 등의 힌트)
              if (placeholder.includes('부가정보') || 
                  placeholder.includes('선택사항') || 
                  placeholder.includes('변수 사용 불가') ||
                  label.includes('부가정보') ||
                  label.includes('선택사항')) {
                additionalInfoInput = input;
                console.log(`  ✅ 부가정보 필드 발견: ${selector}`);
                break;
              }
            }
          }
          if (additionalInfoInput) break;
        } catch (e) {
          continue;
        }
      }
      
      if (additionalInfoInput) {
        await additionalInfoInput.fill(template.additionalInfo);
        console.log('  ✅ 부가정보 입력 완료');
        await page.waitForTimeout(1000);
      } else {
        console.log('  ⚠️  부가정보 필드를 찾을 수 없습니다. 수동으로 입력해주세요.');
        console.log('  💡 부가정보(선택사항) 섹션에 다음 내용을 입력해주세요:');
        console.log(`     ${template.additionalInfo.split('\n').join('\n     ')}`);
      }
    }

    // 검수자 참고 의견 입력
    if (template.reviewerNote) {
      console.log('\n  💬 검수자 참고 의견 입력 중...');
      const noteInputSelectors = [
        'textarea[placeholder*="참고"]',
        'textarea[placeholder*="검수자"]',
        'textarea[name*="note"]',
        'textarea[id*="note"]',
        'textarea'
      ];
      
      let noteInput = null;
      for (const selector of noteInputSelectors) {
        try {
          const inputs = await page.locator(selector).all();
          for (const input of inputs) {
            if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
              const placeholder = await input.getAttribute('placeholder').catch(() => '');
              if (placeholder.includes('참고') || placeholder.includes('검수자')) {
                noteInput = input;
                console.log(`  ✅ 검수자 참고 의견 필드 발견: ${selector}`);
                break;
              }
            }
          }
          if (noteInput) break;
        } catch (e) {
          continue;
        }
      }
      
      if (noteInput) {
        await noteInput.fill(template.reviewerNote);
        console.log('  ✅ 검수자 참고 의견 입력 완료');
        await page.waitForTimeout(1000);
      } else {
        console.log('  ⚠️  검수자 참고 의견 필드를 찾을 수 없습니다. 수동으로 입력해주세요.');
      }
    }
    
    // 체크박스 확인 (필수 확인 체크박스)
    console.log('\n  ☑️  필수 확인 체크박스 체크 중...');
    const checkboxSelectors = [
      'input[type="checkbox"]',
      'input[type="checkbox"]:near(text="모두 확인")',
      'input[type="checkbox"]:near(text="해당 사항 없습니다")'
    ];
    
    for (const selector of checkboxSelectors) {
      try {
        const checkbox = await page.locator(selector).first();
        if (await checkbox.isVisible({ timeout: 2000 }).catch(() => false)) {
          const isChecked = await checkbox.isChecked().catch(() => false);
          if (!isChecked) {
            await checkbox.check();
            console.log('  ✅ 필수 확인 체크박스 체크 완료');
            await page.waitForTimeout(500);
            break;
          }
        }
      } catch (e) {
        continue;
      }
    }

    // 등록 전 최종 확인
    console.log('\n  📋 템플릿 정보 입력 완료!');
    console.log('  ⚠️  등록 전 수동 확인이 필요합니다.');
    console.log('  💡 브라우저에서 다음 사항을 확인해주세요:');
    console.log('     1. 템플릿 이름이 정확한지');
    console.log('     2. 템플릿 내용이 올바른지');
    console.log('     3. 버튼 설정이 정확한지');
    console.log('     4. 변수가 올바르게 인식되었는지');
    console.log('  ⏳ 30초 대기 중... (확인 후 등록 버튼을 클릭해주세요)');
    
    // 스크린샷 저장 (등록 전)
    const screenshotPath = path.join(__dirname, '..', 'backup', `solapi-template-${template.name.replace(/\s+/g, '-')}-before-submit.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`  💾 등록 전 스크린샷 저장: ${screenshotPath}`);
    
    // 수동 확인 대기
    await page.waitForTimeout(30000);
    
    // 등록/저장 버튼 찾기
    const submitButtonSelectors = [
      'button:has-text("등록")',
      'button:has-text("저장")',
      'button:has-text("검수 요청")',
      'button[type="submit"]',
      'button.btn-primary:has-text("등록")',
      'button.btn:has-text("등록")'
    ];
    
    let submitButton = null;
    for (const selector of submitButtonSelectors) {
      try {
        const btn = await page.locator(selector).first();
        if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
          submitButton = btn;
          console.log(`  ✅ 등록 버튼 발견: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (submitButton) {
      console.log('  ⚠️  등록 버튼을 찾았습니다. 수동으로 클릭해주세요.');
      console.log('  💡 브라우저에서 템플릿 정보를 최종 확인하고 등록 버튼을 클릭해주세요.');
      await page.waitForTimeout(10000); // 추가 대기
    } else {
      console.log('  ⚠️  등록 버튼을 자동으로 찾을 수 없습니다.');
      console.log('  💡 브라우저에서 수동으로 등록 버튼을 클릭해주세요.');
      await page.waitForTimeout(10000);
    }

    // 등록 완료 확인
    await page.waitForTimeout(3000);
    const successMessage = await page.locator('text=등록, text=완료, text=성공').first();
    if (await successMessage.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('  ✅ 템플릿 등록 완료');
    } else {
      console.log('  ⚠️  등록 상태 확인 필요');
    }

    return { success: true, template: template.name };

  } catch (error) {
    console.error(`  ❌ 템플릿 등록 실패: ${error.message}`);
    
    // 에러 스크린샷 저장
    const errorScreenshotPath = path.join(__dirname, '..', 'backup', `solapi-template-${template.name.replace(/\s+/g, '-')}-error.png`);
    await page.screenshot({ path: errorScreenshotPath, fullPage: true });
    console.log(`  💾 에러 스크린샷 저장: ${errorScreenshotPath}`);
    
    return { success: false, template: template.name, error: error.message };
  }
}

async function main() {
  console.log('🚀 솔라피 템플릿 자동 등록 시작...\n');
  console.log(`📋 등록할 템플릿: ${TEMPLATES.length}개`);
  TEMPLATES.forEach((t, i) => {
    console.log(`  ${i + 1}. ${t.name} (${t.aligoCode})`);
  });

  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 500,
    args: ['--start-maximized']
  });
  
  const context = await browser.newContext({ 
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();

  const results = [];

  try {
    // 로그인
    await loginToSolapi(page);

    // 템플릿 페이지로 이동
    await navigateToTemplatePage(page);

    // 각 템플릿 등록
    for (let i = 0; i < TEMPLATES.length; i++) {
      const result = await registerTemplate(page, TEMPLATES[i], i);
      results.push(result);
      
      // 다음 템플릿 등록 전 대기
      if (i < TEMPLATES.length - 1) {
        console.log('\n⏳ 다음 템플릿 등록을 위해 3초 대기...');
        await page.waitForTimeout(3000);
      }
    }

    // 결과 요약
    console.log('\n\n📊 등록 결과 요약:');
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    console.log(`  ✅ 성공: ${successCount}개`);
    console.log(`  ❌ 실패: ${failCount}개`);
    
    results.forEach((result, i) => {
      if (result.success) {
        console.log(`  ✅ ${i + 1}. ${result.template}`);
      } else {
        console.log(`  ❌ ${i + 1}. ${result.template}: ${result.error}`);
      }
    });

    // 결과 저장
    const timestamp = Date.now();
    const resultPath = path.join(__dirname, '..', 'backup', `solapi-template-registration-${timestamp}.json`);
    fs.mkdirSync(path.dirname(resultPath), { recursive: true });
    fs.writeFileSync(resultPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      total: TEMPLATES.length,
      success: successCount,
      failed: failCount,
      results: results
    }, null, 2), 'utf8');
    
    console.log(`\n💾 결과 저장: ${resultPath}`);

    console.log('\n✅ 작업 완료!');
    console.log('💡 브라우저는 열려있습니다. 수동으로 확인하실 수 있습니다.');
    console.log('   브라우저를 닫으려면 Enter를 눌러주세요...');
    
    // 사용자 입력 대기 (비대화형 모드에서는 자동 종료)
    if (process.stdin.isTTY) {
      await new Promise(resolve => {
        process.stdin.once('data', () => resolve());
      });
    } else {
      await page.waitForTimeout(10000);
    }

  } catch (error) {
    console.error('\n❌ 작업 실패:', error.message);
    console.error('   스택:', error.stack);
    
    // 에러 스크린샷 저장
    const errorScreenshotPath = path.join(__dirname, '..', 'backup', `solapi-template-registration-error-${Date.now()}.png`);
    await page.screenshot({ path: errorScreenshotPath, fullPage: true });
    console.log(`  💾 에러 스크린샷 저장: ${errorScreenshotPath}`);
  } finally {
    await browser.close();
  }
}

// 실행
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { registerTemplate, TEMPLATES };

