const { createClient } = require('@supabase/supabase-js');
const { chromium } = require('playwright');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const SOLAPI_URL = 'https://console.solapi.com';
const SOLAPI_USERNAME = process.env.SOLAPI_USERNAME || '';
const SOLAPI_PASSWORD = process.env.SOLAPI_PASSWORD || '';
const LOCAL_URL = process.env.LOCAL_URL || 'http://localhost:3000';

// 그룹 ID로 메시지 찾기
async function findMessageByGroupId(groupId) {
  console.log(`🔍 그룹 ID로 메시지 찾기: ${groupId}\n`);

  const { data: messages, error } = await supabase
    .from('channel_sms')
    .select('*')
    .eq('solapi_group_id', groupId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ 메시지 조회 실패:', error);
    return null;
  }

  if (!messages || messages.length === 0) {
    // 그룹 ID가 정확히 일치하지 않으면 부분 일치로 검색
    console.log('⚠️  정확한 그룹 ID를 찾을 수 없습니다. 부분 일치로 검색...');
    const { data: partialMessages } = await supabase
      .from('channel_sms')
      .select('*')
      .like('solapi_group_id', `${groupId.substring(0, 20)}%`)
      .order('created_at', { ascending: false });
    
    if (partialMessages && partialMessages.length > 0) {
      console.log(`✅ 부분 일치 메시지 발견: ${partialMessages.length}개`);
      return partialMessages[0];
    }
    
    // 수신자 수가 많은 메시지 찾기 (1300명 이상)
    console.log('⚠️  그룹 ID로 찾을 수 없습니다. 수신자 수가 많은 메시지 검색...');
    const { data: allMessages } = await supabase
      .from('channel_sms')
      .select('*')
      .not('recipient_numbers', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (allMessages && allMessages.length > 0) {
      // recipient_numbers 배열 길이로 필터링
      const messagesWithManyRecipients = allMessages
        .map(msg => ({
          ...msg,
          recipientCount: Array.isArray(msg.recipient_numbers) ? msg.recipient_numbers.length : 0
        }))
        .filter(msg => msg.recipientCount >= 1000)
        .sort((a, b) => b.recipientCount - a.recipientCount);
      
      if (messagesWithManyRecipients.length > 0) {
        console.log(`✅ 수신자 수가 많은 메시지 발견: ${messagesWithManyRecipients.length}개`);
        messagesWithManyRecipients.forEach((msg, idx) => {
          console.log(`   ${idx + 1}. ID: ${msg.id}, 수신자: ${msg.recipientCount}명, 발송: ${msg.sent_count || 0}건, 그룹ID: ${msg.solapi_group_id || '없음'}`);
        });
        return messagesWithManyRecipients[0];
      }
    }
    
    // sent_count가 200 근처인 메시지 찾기
    console.log('⚠️  수신자 수가 많은 메시지를 찾을 수 없습니다. sent_count가 200 근처인 메시지 검색...');
    const { data: countMessages } = await supabase
      .from('channel_sms')
      .select('*')
      .gte('sent_count', 150)
      .lte('sent_count', 250)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (countMessages && countMessages.length > 0) {
      console.log(`✅ sent_count 200 근처 메시지 발견: ${countMessages.length}개`);
      countMessages.forEach((msg, idx) => {
        console.log(`   ${idx + 1}. ID: ${msg.id}, 수신자: ${msg.recipient_numbers?.length || 0}명, 발송: ${msg.sent_count || 0}건, 그룹ID: ${msg.solapi_group_id || '없음'}`);
      });
      return countMessages[0];
    }
    
    return null;
  }

  return messages[0];
}

// Solapi에서 발송된 번호 추출
async function extractSentNumbersFromSolapi(groupId) {
  if (!SOLAPI_USERNAME || !SOLAPI_PASSWORD) {
    console.log('⚠️  Solapi 로그인 정보가 없습니다. message_logs 테이블만 사용합니다.');
    return new Set();
  }

  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  try {
    console.log('\n🔐 Solapi 로그인 중...');
    await page.goto(`${SOLAPI_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);

    const emailInput = await page.locator('input[type="email"], input[name="email"], input[name="username"], input[type="text"]').first();
    const passwordInput = await page.locator('input[type="password"]').first();
    const loginButton = await page.locator('button[type="submit"], button:has-text("로그인"), button:has-text("Login")').first();

    if (await emailInput.isVisible({ timeout: 5000 })) {
      await emailInput.fill(SOLAPI_USERNAME);
      await passwordInput.fill(SOLAPI_PASSWORD);
      await page.waitForTimeout(1000);
      await loginButton.click();
      await page.waitForTimeout(5000);
      console.log('✅ Solapi 로그인 완료');
    }

    // 메시지 로그 페이지로 이동
    await page.goto(`${SOLAPI_URL}/message-log`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);

    // 그룹 ID로 검색
    const searchInput = await page.locator('input[type="search"], input[placeholder*="검색"], input[placeholder*="Search"], input[type="text"]').first();
    if (await searchInput.isVisible({ timeout: 10000 })) {
      await searchInput.fill(groupId);
      await page.waitForTimeout(1000);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(5000);
      console.log(`✅ 그룹 ID로 검색: ${groupId}`);
    }

    // 모달이 열렸는지 확인하고 메시지 목록 탭으로 이동
    const modalTitle = await page.locator('text=메시지 그룹 자세히, text=Message Group Details, [role="dialog"]').first();
    if (await modalTitle.isVisible({ timeout: 5000 })) {
      console.log('✅ 모달이 열렸습니다.');
      
      const messageListTab = await page.locator('button:has-text("메시지 목록"), button:has-text("Message List"), [role="tab"]:has-text("메시지 목록")').first();
      if (await messageListTab.isVisible({ timeout: 5000 })) {
        await messageListTab.click();
        await page.waitForTimeout(3000);
        console.log('✅ 메시지 목록 탭으로 이동');
      }
    }

    // 수신번호 추출
    const sentNumbers = new Set();
    const modalTable = await page.locator('[role="dialog"] table, .modal table').first();
    
    if (await modalTable.isVisible({ timeout: 3000 })) {
      const recipientCells = await modalTable.locator('td:nth-child(4), td:has-text("010"), td:has-text("011"), td:has-text("016"), td:has-text("017"), td:has-text("018"), td:has-text("019")').all();
      
      for (const cell of recipientCells) {
        const cellText = await cell.textContent();
        if (cellText) {
          const phoneMatches = cellText.match(/(010|011|016|017|018|019)[-\s]?\d{3,4}[-\s]?\d{4}/g);
          if (phoneMatches) {
            phoneMatches.forEach(phone => {
              const normalized = phone.replace(/[-\s]/g, '');
              if (normalized.length >= 10 && normalized.length <= 11) {
                sentNumbers.add(normalized);
              }
            });
          }
        }
      }
    }

    console.log(`✅ Solapi에서 발송된 번호 추출: ${sentNumbers.size}개`);
    await browser.close();
    return sentNumbers;

  } catch (error) {
    console.error('❌ Solapi 추출 오류:', error);
    await browser.close();
    return new Set();
  }
}

// 메인 함수
async function createDraftFromRemaining() {
  const GROUP_ID = process.argv[2] || 'G4V202511181317011LMZKTZGSYH56HC';
  
  console.log('🚀 미발송 수신자로 초안 생성 시작...\n');
  console.log(`📋 그룹 ID: ${GROUP_ID}\n`);

  // 1. 그룹 ID로 메시지 찾기
  const message = await findMessageByGroupId(GROUP_ID);
  
  if (!message) {
    console.error('❌ 메시지를 찾을 수 없습니다.');
    process.exit(1);
  }

  console.log(`✅ 메시지 발견: ID=${message.id}`);
  console.log(`   수신자 수: ${message.recipient_numbers?.length || 0}명`);
  console.log(`   발송 건수: ${message.sent_count || 0}건`);
  console.log(`   메시지 내용: ${(message.message_text || '').substring(0, 50)}...\n`);

  // 2. Solapi에서 발송된 번호 추출
  const sentNumbers = await extractSentNumbersFromSolapi(message.solapi_group_id || GROUP_ID);

  // 3. message_logs에서도 발송된 번호 확인
  const { data: logs } = await supabase
    .from('message_logs')
    .select('customer_phone')
    .eq('content_id', String(message.id))
    .not('customer_phone', 'is', null);

  const sentFromLogs = new Set((logs || []).map(log => String(log.customer_phone).replace(/[-\s]/g, '')));
  console.log(`✅ message_logs에서 발송된 번호: ${sentFromLogs.size}개`);

  // 4. 전체 발송된 번호 합치기
  const allSentNumbers = new Set([...sentNumbers, ...sentFromLogs]);
  console.log(`✅ 총 발송된 번호: ${allSentNumbers.size}개\n`);

  // 5. 미발송 수신자 필터링
  const allRecipients = (message.recipient_numbers || []).map(num => num.replace(/[-\s]/g, ''));
  const remainingRecipients = allRecipients.filter(num => !allSentNumbers.has(num));
  
  console.log(`📊 결과:`);
  console.log(`   전체 수신자: ${allRecipients.length}명`);
  console.log(`   발송 완료: ${allSentNumbers.size}명`);
  console.log(`   미발송: ${remainingRecipients.length}명\n`);

  if (remainingRecipients.length === 0) {
    console.log('✅ 모든 수신자에게 발송이 완료되었습니다!');
    process.exit(0);
  }

  // 6. 하이픈 형식으로 변환
  const formattedRecipients = remainingRecipients.map(num => {
    if (num.length === 11) {
      return `${num.slice(0, 3)}-${num.slice(3, 7)}-${num.slice(7)}`;
    }
    return num;
  });

  // 7. 새 초안 생성
  console.log('💾 미발송 수신자로 새 초안 생성 중...');
  const response = await fetch(`${LOCAL_URL}/api/channels/sms/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messageType: message.message_type || 'MMS',
      messageText: message.message_text || '',
      imageUrl: message.image_url || null,
      shortLink: message.short_link || null,
      recipientNumbers: formattedRecipients,
      status: 'draft'
    })
  });

  const result = await response.json();

  if (result.success) {
    console.log(`\n✅ 초안 생성 완료!`);
    console.log(`   새 메시지 ID: ${result.channelPostId}`);
    console.log(`   수신자 수: ${formattedRecipients.length}명`);
    console.log(`\n💡 다음 단계:`);
    console.log(`   SMS 편집 페이지: ${LOCAL_URL}/admin/sms?id=${result.channelPostId}`);
  } else {
    console.error('❌ 초안 생성 실패:', result.message);
    process.exit(1);
  }
}

createDraftFromRemaining();


require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const SOLAPI_URL = 'https://console.solapi.com';
const SOLAPI_USERNAME = process.env.SOLAPI_USERNAME || '';
const SOLAPI_PASSWORD = process.env.SOLAPI_PASSWORD || '';
const LOCAL_URL = process.env.LOCAL_URL || 'http://localhost:3000';

// 그룹 ID로 메시지 찾기
async function findMessageByGroupId(groupId) {
  console.log(`🔍 그룹 ID로 메시지 찾기: ${groupId}\n`);

  const { data: messages, error } = await supabase
    .from('channel_sms')
    .select('*')
    .eq('solapi_group_id', groupId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ 메시지 조회 실패:', error);
    return null;
  }

  if (!messages || messages.length === 0) {
    // 그룹 ID가 정확히 일치하지 않으면 부분 일치로 검색
    console.log('⚠️  정확한 그룹 ID를 찾을 수 없습니다. 부분 일치로 검색...');
    const { data: partialMessages } = await supabase
      .from('channel_sms')
      .select('*')
      .like('solapi_group_id', `${groupId.substring(0, 20)}%`)
      .order('created_at', { ascending: false });
    
    if (partialMessages && partialMessages.length > 0) {
      console.log(`✅ 부분 일치 메시지 발견: ${partialMessages.length}개`);
      return partialMessages[0];
    }
    
    // 수신자 수가 많은 메시지 찾기 (1300명 이상)
    console.log('⚠️  그룹 ID로 찾을 수 없습니다. 수신자 수가 많은 메시지 검색...');
    const { data: allMessages } = await supabase
      .from('channel_sms')
      .select('*')
      .not('recipient_numbers', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (allMessages && allMessages.length > 0) {
      // recipient_numbers 배열 길이로 필터링
      const messagesWithManyRecipients = allMessages
        .map(msg => ({
          ...msg,
          recipientCount: Array.isArray(msg.recipient_numbers) ? msg.recipient_numbers.length : 0
        }))
        .filter(msg => msg.recipientCount >= 1000)
        .sort((a, b) => b.recipientCount - a.recipientCount);
      
      if (messagesWithManyRecipients.length > 0) {
        console.log(`✅ 수신자 수가 많은 메시지 발견: ${messagesWithManyRecipients.length}개`);
        messagesWithManyRecipients.forEach((msg, idx) => {
          console.log(`   ${idx + 1}. ID: ${msg.id}, 수신자: ${msg.recipientCount}명, 발송: ${msg.sent_count || 0}건, 그룹ID: ${msg.solapi_group_id || '없음'}`);
        });
        return messagesWithManyRecipients[0];
      }
    }
    
    // sent_count가 200 근처인 메시지 찾기
    console.log('⚠️  수신자 수가 많은 메시지를 찾을 수 없습니다. sent_count가 200 근처인 메시지 검색...');
    const { data: countMessages } = await supabase
      .from('channel_sms')
      .select('*')
      .gte('sent_count', 150)
      .lte('sent_count', 250)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (countMessages && countMessages.length > 0) {
      console.log(`✅ sent_count 200 근처 메시지 발견: ${countMessages.length}개`);
      countMessages.forEach((msg, idx) => {
        console.log(`   ${idx + 1}. ID: ${msg.id}, 수신자: ${msg.recipient_numbers?.length || 0}명, 발송: ${msg.sent_count || 0}건, 그룹ID: ${msg.solapi_group_id || '없음'}`);
      });
      return countMessages[0];
    }
    
    return null;
  }

  return messages[0];
}

// Solapi에서 발송된 번호 추출
async function extractSentNumbersFromSolapi(groupId) {
  if (!SOLAPI_USERNAME || !SOLAPI_PASSWORD) {
    console.log('⚠️  Solapi 로그인 정보가 없습니다. message_logs 테이블만 사용합니다.');
    return new Set();
  }

  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  try {
    console.log('\n🔐 Solapi 로그인 중...');
    await page.goto(`${SOLAPI_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);

    const emailInput = await page.locator('input[type="email"], input[name="email"], input[name="username"], input[type="text"]').first();
    const passwordInput = await page.locator('input[type="password"]').first();
    const loginButton = await page.locator('button[type="submit"], button:has-text("로그인"), button:has-text("Login")').first();

    if (await emailInput.isVisible({ timeout: 5000 })) {
      await emailInput.fill(SOLAPI_USERNAME);
      await passwordInput.fill(SOLAPI_PASSWORD);
      await page.waitForTimeout(1000);
      await loginButton.click();
      await page.waitForTimeout(5000);
      console.log('✅ Solapi 로그인 완료');
    }

    // 메시지 로그 페이지로 이동
    await page.goto(`${SOLAPI_URL}/message-log`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);

    // 그룹 ID로 검색
    const searchInput = await page.locator('input[type="search"], input[placeholder*="검색"], input[placeholder*="Search"], input[type="text"]').first();
    if (await searchInput.isVisible({ timeout: 10000 })) {
      await searchInput.fill(groupId);
      await page.waitForTimeout(1000);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(5000);
      console.log(`✅ 그룹 ID로 검색: ${groupId}`);
    }

    // 모달이 열렸는지 확인하고 메시지 목록 탭으로 이동
    const modalTitle = await page.locator('text=메시지 그룹 자세히, text=Message Group Details, [role="dialog"]').first();
    if (await modalTitle.isVisible({ timeout: 5000 })) {
      console.log('✅ 모달이 열렸습니다.');
      
      const messageListTab = await page.locator('button:has-text("메시지 목록"), button:has-text("Message List"), [role="tab"]:has-text("메시지 목록")').first();
      if (await messageListTab.isVisible({ timeout: 5000 })) {
        await messageListTab.click();
        await page.waitForTimeout(3000);
        console.log('✅ 메시지 목록 탭으로 이동');
      }
    }

    // 수신번호 추출
    const sentNumbers = new Set();
    const modalTable = await page.locator('[role="dialog"] table, .modal table').first();
    
    if (await modalTable.isVisible({ timeout: 3000 })) {
      const recipientCells = await modalTable.locator('td:nth-child(4), td:has-text("010"), td:has-text("011"), td:has-text("016"), td:has-text("017"), td:has-text("018"), td:has-text("019")').all();
      
      for (const cell of recipientCells) {
        const cellText = await cell.textContent();
        if (cellText) {
          const phoneMatches = cellText.match(/(010|011|016|017|018|019)[-\s]?\d{3,4}[-\s]?\d{4}/g);
          if (phoneMatches) {
            phoneMatches.forEach(phone => {
              const normalized = phone.replace(/[-\s]/g, '');
              if (normalized.length >= 10 && normalized.length <= 11) {
                sentNumbers.add(normalized);
              }
            });
          }
        }
      }
    }

    console.log(`✅ Solapi에서 발송된 번호 추출: ${sentNumbers.size}개`);
    await browser.close();
    return sentNumbers;

  } catch (error) {
    console.error('❌ Solapi 추출 오류:', error);
    await browser.close();
    return new Set();
  }
}

// 메인 함수
async function createDraftFromRemaining() {
  const GROUP_ID = process.argv[2] || 'G4V202511181317011LMZKTZGSYH56HC';
  
  console.log('🚀 미발송 수신자로 초안 생성 시작...\n');
  console.log(`📋 그룹 ID: ${GROUP_ID}\n`);

  // 1. 그룹 ID로 메시지 찾기
  const message = await findMessageByGroupId(GROUP_ID);
  
  if (!message) {
    console.error('❌ 메시지를 찾을 수 없습니다.');
    process.exit(1);
  }

  console.log(`✅ 메시지 발견: ID=${message.id}`);
  console.log(`   수신자 수: ${message.recipient_numbers?.length || 0}명`);
  console.log(`   발송 건수: ${message.sent_count || 0}건`);
  console.log(`   메시지 내용: ${(message.message_text || '').substring(0, 50)}...\n`);

  // 2. Solapi에서 발송된 번호 추출
  const sentNumbers = await extractSentNumbersFromSolapi(message.solapi_group_id || GROUP_ID);

  // 3. message_logs에서도 발송된 번호 확인
  const { data: logs } = await supabase
    .from('message_logs')
    .select('customer_phone')
    .eq('content_id', String(message.id))
    .not('customer_phone', 'is', null);

  const sentFromLogs = new Set((logs || []).map(log => String(log.customer_phone).replace(/[-\s]/g, '')));
  console.log(`✅ message_logs에서 발송된 번호: ${sentFromLogs.size}개`);

  // 4. 전체 발송된 번호 합치기
  const allSentNumbers = new Set([...sentNumbers, ...sentFromLogs]);
  console.log(`✅ 총 발송된 번호: ${allSentNumbers.size}개\n`);

  // 5. 미발송 수신자 필터링
  const allRecipients = (message.recipient_numbers || []).map(num => num.replace(/[-\s]/g, ''));
  const remainingRecipients = allRecipients.filter(num => !allSentNumbers.has(num));
  
  console.log(`📊 결과:`);
  console.log(`   전체 수신자: ${allRecipients.length}명`);
  console.log(`   발송 완료: ${allSentNumbers.size}명`);
  console.log(`   미발송: ${remainingRecipients.length}명\n`);

  if (remainingRecipients.length === 0) {
    console.log('✅ 모든 수신자에게 발송이 완료되었습니다!');
    process.exit(0);
  }

  // 6. 하이픈 형식으로 변환
  const formattedRecipients = remainingRecipients.map(num => {
    if (num.length === 11) {
      return `${num.slice(0, 3)}-${num.slice(3, 7)}-${num.slice(7)}`;
    }
    return num;
  });

  // 7. 새 초안 생성
  console.log('💾 미발송 수신자로 새 초안 생성 중...');
  const response = await fetch(`${LOCAL_URL}/api/channels/sms/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messageType: message.message_type || 'MMS',
      messageText: message.message_text || '',
      imageUrl: message.image_url || null,
      shortLink: message.short_link || null,
      recipientNumbers: formattedRecipients,
      status: 'draft'
    })
  });

  const result = await response.json();

  if (result.success) {
    console.log(`\n✅ 초안 생성 완료!`);
    console.log(`   새 메시지 ID: ${result.channelPostId}`);
    console.log(`   수신자 수: ${formattedRecipients.length}명`);
    console.log(`\n💡 다음 단계:`);
    console.log(`   SMS 편집 페이지: ${LOCAL_URL}/admin/sms?id=${result.channelPostId}`);
  } else {
    console.error('❌ 초안 생성 실패:', result.message);
    process.exit(1);
  }
}

createDraftFromRemaining();

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const SOLAPI_URL = 'https://console.solapi.com';
const SOLAPI_USERNAME = process.env.SOLAPI_USERNAME || '';
const SOLAPI_PASSWORD = process.env.SOLAPI_PASSWORD || '';
const LOCAL_URL = process.env.LOCAL_URL || 'http://localhost:3000';

// 그룹 ID로 메시지 찾기
async function findMessageByGroupId(groupId) {
  console.log(`🔍 그룹 ID로 메시지 찾기: ${groupId}\n`);

  const { data: messages, error } = await supabase
    .from('channel_sms')
    .select('*')
    .eq('solapi_group_id', groupId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ 메시지 조회 실패:', error);
    return null;
  }

  if (!messages || messages.length === 0) {
    // 그룹 ID가 정확히 일치하지 않으면 부분 일치로 검색
    console.log('⚠️  정확한 그룹 ID를 찾을 수 없습니다. 부분 일치로 검색...');
    const { data: partialMessages } = await supabase
      .from('channel_sms')
      .select('*')
      .like('solapi_group_id', `${groupId.substring(0, 20)}%`)
      .order('created_at', { ascending: false });
    
    if (partialMessages && partialMessages.length > 0) {
      console.log(`✅ 부분 일치 메시지 발견: ${partialMessages.length}개`);
      return partialMessages[0];
    }
    
    // 수신자 수가 많은 메시지 찾기 (1300명 이상)
    console.log('⚠️  그룹 ID로 찾을 수 없습니다. 수신자 수가 많은 메시지 검색...');
    const { data: allMessages } = await supabase
      .from('channel_sms')
      .select('*')
      .not('recipient_numbers', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (allMessages && allMessages.length > 0) {
      // recipient_numbers 배열 길이로 필터링
      const messagesWithManyRecipients = allMessages
        .map(msg => ({
          ...msg,
          recipientCount: Array.isArray(msg.recipient_numbers) ? msg.recipient_numbers.length : 0
        }))
        .filter(msg => msg.recipientCount >= 1000)
        .sort((a, b) => b.recipientCount - a.recipientCount);
      
      if (messagesWithManyRecipients.length > 0) {
        console.log(`✅ 수신자 수가 많은 메시지 발견: ${messagesWithManyRecipients.length}개`);
        messagesWithManyRecipients.forEach((msg, idx) => {
          console.log(`   ${idx + 1}. ID: ${msg.id}, 수신자: ${msg.recipientCount}명, 발송: ${msg.sent_count || 0}건, 그룹ID: ${msg.solapi_group_id || '없음'}`);
        });
        return messagesWithManyRecipients[0];
      }
    }
    
    // sent_count가 200 근처인 메시지 찾기
    console.log('⚠️  수신자 수가 많은 메시지를 찾을 수 없습니다. sent_count가 200 근처인 메시지 검색...');
    const { data: countMessages } = await supabase
      .from('channel_sms')
      .select('*')
      .gte('sent_count', 150)
      .lte('sent_count', 250)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (countMessages && countMessages.length > 0) {
      console.log(`✅ sent_count 200 근처 메시지 발견: ${countMessages.length}개`);
      countMessages.forEach((msg, idx) => {
        console.log(`   ${idx + 1}. ID: ${msg.id}, 수신자: ${msg.recipient_numbers?.length || 0}명, 발송: ${msg.sent_count || 0}건, 그룹ID: ${msg.solapi_group_id || '없음'}`);
      });
      return countMessages[0];
    }
    
    return null;
  }

  return messages[0];
}

// Solapi에서 발송된 번호 추출
async function extractSentNumbersFromSolapi(groupId) {
  if (!SOLAPI_USERNAME || !SOLAPI_PASSWORD) {
    console.log('⚠️  Solapi 로그인 정보가 없습니다. message_logs 테이블만 사용합니다.');
    return new Set();
  }

  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  try {
    console.log('\n🔐 Solapi 로그인 중...');
    await page.goto(`${SOLAPI_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);

    const emailInput = await page.locator('input[type="email"], input[name="email"], input[name="username"], input[type="text"]').first();
    const passwordInput = await page.locator('input[type="password"]').first();
    const loginButton = await page.locator('button[type="submit"], button:has-text("로그인"), button:has-text("Login")').first();

    if (await emailInput.isVisible({ timeout: 5000 })) {
      await emailInput.fill(SOLAPI_USERNAME);
      await passwordInput.fill(SOLAPI_PASSWORD);
      await page.waitForTimeout(1000);
      await loginButton.click();
      await page.waitForTimeout(5000);
      console.log('✅ Solapi 로그인 완료');
    }

    // 메시지 로그 페이지로 이동
    await page.goto(`${SOLAPI_URL}/message-log`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);

    // 그룹 ID로 검색
    const searchInput = await page.locator('input[type="search"], input[placeholder*="검색"], input[placeholder*="Search"], input[type="text"]').first();
    if (await searchInput.isVisible({ timeout: 10000 })) {
      await searchInput.fill(groupId);
      await page.waitForTimeout(1000);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(5000);
      console.log(`✅ 그룹 ID로 검색: ${groupId}`);
    }

    // 모달이 열렸는지 확인하고 메시지 목록 탭으로 이동
    const modalTitle = await page.locator('text=메시지 그룹 자세히, text=Message Group Details, [role="dialog"]').first();
    if (await modalTitle.isVisible({ timeout: 5000 })) {
      console.log('✅ 모달이 열렸습니다.');
      
      const messageListTab = await page.locator('button:has-text("메시지 목록"), button:has-text("Message List"), [role="tab"]:has-text("메시지 목록")').first();
      if (await messageListTab.isVisible({ timeout: 5000 })) {
        await messageListTab.click();
        await page.waitForTimeout(3000);
        console.log('✅ 메시지 목록 탭으로 이동');
      }
    }

    // 수신번호 추출
    const sentNumbers = new Set();
    const modalTable = await page.locator('[role="dialog"] table, .modal table').first();
    
    if (await modalTable.isVisible({ timeout: 3000 })) {
      const recipientCells = await modalTable.locator('td:nth-child(4), td:has-text("010"), td:has-text("011"), td:has-text("016"), td:has-text("017"), td:has-text("018"), td:has-text("019")').all();
      
      for (const cell of recipientCells) {
        const cellText = await cell.textContent();
        if (cellText) {
          const phoneMatches = cellText.match(/(010|011|016|017|018|019)[-\s]?\d{3,4}[-\s]?\d{4}/g);
          if (phoneMatches) {
            phoneMatches.forEach(phone => {
              const normalized = phone.replace(/[-\s]/g, '');
              if (normalized.length >= 10 && normalized.length <= 11) {
                sentNumbers.add(normalized);
              }
            });
          }
        }
      }
    }

    console.log(`✅ Solapi에서 발송된 번호 추출: ${sentNumbers.size}개`);
    await browser.close();
    return sentNumbers;

  } catch (error) {
    console.error('❌ Solapi 추출 오류:', error);
    await browser.close();
    return new Set();
  }
}

// 메인 함수
async function createDraftFromRemaining() {
  const GROUP_ID = process.argv[2] || 'G4V202511181317011LMZKTZGSYH56HC';
  
  console.log('🚀 미발송 수신자로 초안 생성 시작...\n');
  console.log(`📋 그룹 ID: ${GROUP_ID}\n`);

  // 1. 그룹 ID로 메시지 찾기
  const message = await findMessageByGroupId(GROUP_ID);
  
  if (!message) {
    console.error('❌ 메시지를 찾을 수 없습니다.');
    process.exit(1);
  }

  console.log(`✅ 메시지 발견: ID=${message.id}`);
  console.log(`   수신자 수: ${message.recipient_numbers?.length || 0}명`);
  console.log(`   발송 건수: ${message.sent_count || 0}건`);
  console.log(`   메시지 내용: ${(message.message_text || '').substring(0, 50)}...\n`);

  // 2. Solapi에서 발송된 번호 추출
  const sentNumbers = await extractSentNumbersFromSolapi(message.solapi_group_id || GROUP_ID);

  // 3. message_logs에서도 발송된 번호 확인
  const { data: logs } = await supabase
    .from('message_logs')
    .select('customer_phone')
    .eq('content_id', String(message.id))
    .not('customer_phone', 'is', null);

  const sentFromLogs = new Set((logs || []).map(log => String(log.customer_phone).replace(/[-\s]/g, '')));
  console.log(`✅ message_logs에서 발송된 번호: ${sentFromLogs.size}개`);

  // 4. 전체 발송된 번호 합치기
  const allSentNumbers = new Set([...sentNumbers, ...sentFromLogs]);
  console.log(`✅ 총 발송된 번호: ${allSentNumbers.size}개\n`);

  // 5. 미발송 수신자 필터링
  const allRecipients = (message.recipient_numbers || []).map(num => num.replace(/[-\s]/g, ''));
  const remainingRecipients = allRecipients.filter(num => !allSentNumbers.has(num));
  
  console.log(`📊 결과:`);
  console.log(`   전체 수신자: ${allRecipients.length}명`);
  console.log(`   발송 완료: ${allSentNumbers.size}명`);
  console.log(`   미발송: ${remainingRecipients.length}명\n`);

  if (remainingRecipients.length === 0) {
    console.log('✅ 모든 수신자에게 발송이 완료되었습니다!');
    process.exit(0);
  }

  // 6. 하이픈 형식으로 변환
  const formattedRecipients = remainingRecipients.map(num => {
    if (num.length === 11) {
      return `${num.slice(0, 3)}-${num.slice(3, 7)}-${num.slice(7)}`;
    }
    return num;
  });

  // 7. 새 초안 생성
  console.log('💾 미발송 수신자로 새 초안 생성 중...');
  const response = await fetch(`${LOCAL_URL}/api/channels/sms/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messageType: message.message_type || 'MMS',
      messageText: message.message_text || '',
      imageUrl: message.image_url || null,
      shortLink: message.short_link || null,
      recipientNumbers: formattedRecipients,
      status: 'draft'
    })
  });

  const result = await response.json();

  if (result.success) {
    console.log(`\n✅ 초안 생성 완료!`);
    console.log(`   새 메시지 ID: ${result.channelPostId}`);
    console.log(`   수신자 수: ${formattedRecipients.length}명`);
    console.log(`\n💡 다음 단계:`);
    console.log(`   SMS 편집 페이지: ${LOCAL_URL}/admin/sms?id=${result.channelPostId}`);
  } else {
    console.error('❌ 초안 생성 실패:', result.message);
    process.exit(1);
  }
}

createDraftFromRemaining();


require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const SOLAPI_URL = 'https://console.solapi.com';
const SOLAPI_USERNAME = process.env.SOLAPI_USERNAME || '';
const SOLAPI_PASSWORD = process.env.SOLAPI_PASSWORD || '';
const LOCAL_URL = process.env.LOCAL_URL || 'http://localhost:3000';

// 그룹 ID로 메시지 찾기
async function findMessageByGroupId(groupId) {
  console.log(`🔍 그룹 ID로 메시지 찾기: ${groupId}\n`);

  const { data: messages, error } = await supabase
    .from('channel_sms')
    .select('*')
    .eq('solapi_group_id', groupId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ 메시지 조회 실패:', error);
    return null;
  }

  if (!messages || messages.length === 0) {
    // 그룹 ID가 정확히 일치하지 않으면 부분 일치로 검색
    console.log('⚠️  정확한 그룹 ID를 찾을 수 없습니다. 부분 일치로 검색...');
    const { data: partialMessages } = await supabase
      .from('channel_sms')
      .select('*')
      .like('solapi_group_id', `${groupId.substring(0, 20)}%`)
      .order('created_at', { ascending: false });
    
    if (partialMessages && partialMessages.length > 0) {
      console.log(`✅ 부분 일치 메시지 발견: ${partialMessages.length}개`);
      return partialMessages[0];
    }
    
    // 수신자 수가 많은 메시지 찾기 (1300명 이상)
    console.log('⚠️  그룹 ID로 찾을 수 없습니다. 수신자 수가 많은 메시지 검색...');
    const { data: allMessages } = await supabase
      .from('channel_sms')
      .select('*')
      .not('recipient_numbers', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (allMessages && allMessages.length > 0) {
      // recipient_numbers 배열 길이로 필터링
      const messagesWithManyRecipients = allMessages
        .map(msg => ({
          ...msg,
          recipientCount: Array.isArray(msg.recipient_numbers) ? msg.recipient_numbers.length : 0
        }))
        .filter(msg => msg.recipientCount >= 1000)
        .sort((a, b) => b.recipientCount - a.recipientCount);
      
      if (messagesWithManyRecipients.length > 0) {
        console.log(`✅ 수신자 수가 많은 메시지 발견: ${messagesWithManyRecipients.length}개`);
        messagesWithManyRecipients.forEach((msg, idx) => {
          console.log(`   ${idx + 1}. ID: ${msg.id}, 수신자: ${msg.recipientCount}명, 발송: ${msg.sent_count || 0}건, 그룹ID: ${msg.solapi_group_id || '없음'}`);
        });
        return messagesWithManyRecipients[0];
      }
    }
    
    // sent_count가 200 근처인 메시지 찾기
    console.log('⚠️  수신자 수가 많은 메시지를 찾을 수 없습니다. sent_count가 200 근처인 메시지 검색...');
    const { data: countMessages } = await supabase
      .from('channel_sms')
      .select('*')
      .gte('sent_count', 150)
      .lte('sent_count', 250)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (countMessages && countMessages.length > 0) {
      console.log(`✅ sent_count 200 근처 메시지 발견: ${countMessages.length}개`);
      countMessages.forEach((msg, idx) => {
        console.log(`   ${idx + 1}. ID: ${msg.id}, 수신자: ${msg.recipient_numbers?.length || 0}명, 발송: ${msg.sent_count || 0}건, 그룹ID: ${msg.solapi_group_id || '없음'}`);
      });
      return countMessages[0];
    }
    
    return null;
  }

  return messages[0];
}

// Solapi에서 발송된 번호 추출
async function extractSentNumbersFromSolapi(groupId) {
  if (!SOLAPI_USERNAME || !SOLAPI_PASSWORD) {
    console.log('⚠️  Solapi 로그인 정보가 없습니다. message_logs 테이블만 사용합니다.');
    return new Set();
  }

  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  try {
    console.log('\n🔐 Solapi 로그인 중...');
    await page.goto(`${SOLAPI_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);

    const emailInput = await page.locator('input[type="email"], input[name="email"], input[name="username"], input[type="text"]').first();
    const passwordInput = await page.locator('input[type="password"]').first();
    const loginButton = await page.locator('button[type="submit"], button:has-text("로그인"), button:has-text("Login")').first();

    if (await emailInput.isVisible({ timeout: 5000 })) {
      await emailInput.fill(SOLAPI_USERNAME);
      await passwordInput.fill(SOLAPI_PASSWORD);
      await page.waitForTimeout(1000);
      await loginButton.click();
      await page.waitForTimeout(5000);
      console.log('✅ Solapi 로그인 완료');
    }

    // 메시지 로그 페이지로 이동
    await page.goto(`${SOLAPI_URL}/message-log`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);

    // 그룹 ID로 검색
    const searchInput = await page.locator('input[type="search"], input[placeholder*="검색"], input[placeholder*="Search"], input[type="text"]').first();
    if (await searchInput.isVisible({ timeout: 10000 })) {
      await searchInput.fill(groupId);
      await page.waitForTimeout(1000);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(5000);
      console.log(`✅ 그룹 ID로 검색: ${groupId}`);
    }

    // 모달이 열렸는지 확인하고 메시지 목록 탭으로 이동
    const modalTitle = await page.locator('text=메시지 그룹 자세히, text=Message Group Details, [role="dialog"]').first();
    if (await modalTitle.isVisible({ timeout: 5000 })) {
      console.log('✅ 모달이 열렸습니다.');
      
      const messageListTab = await page.locator('button:has-text("메시지 목록"), button:has-text("Message List"), [role="tab"]:has-text("메시지 목록")').first();
      if (await messageListTab.isVisible({ timeout: 5000 })) {
        await messageListTab.click();
        await page.waitForTimeout(3000);
        console.log('✅ 메시지 목록 탭으로 이동');
      }
    }

    // 수신번호 추출
    const sentNumbers = new Set();
    const modalTable = await page.locator('[role="dialog"] table, .modal table').first();
    
    if (await modalTable.isVisible({ timeout: 3000 })) {
      const recipientCells = await modalTable.locator('td:nth-child(4), td:has-text("010"), td:has-text("011"), td:has-text("016"), td:has-text("017"), td:has-text("018"), td:has-text("019")').all();
      
      for (const cell of recipientCells) {
        const cellText = await cell.textContent();
        if (cellText) {
          const phoneMatches = cellText.match(/(010|011|016|017|018|019)[-\s]?\d{3,4}[-\s]?\d{4}/g);
          if (phoneMatches) {
            phoneMatches.forEach(phone => {
              const normalized = phone.replace(/[-\s]/g, '');
              if (normalized.length >= 10 && normalized.length <= 11) {
                sentNumbers.add(normalized);
              }
            });
          }
        }
      }
    }

    console.log(`✅ Solapi에서 발송된 번호 추출: ${sentNumbers.size}개`);
    await browser.close();
    return sentNumbers;

  } catch (error) {
    console.error('❌ Solapi 추출 오류:', error);
    await browser.close();
    return new Set();
  }
}

// 메인 함수
async function createDraftFromRemaining() {
  const GROUP_ID = process.argv[2] || 'G4V202511181317011LMZKTZGSYH56HC';
  
  console.log('🚀 미발송 수신자로 초안 생성 시작...\n');
  console.log(`📋 그룹 ID: ${GROUP_ID}\n`);

  // 1. 그룹 ID로 메시지 찾기
  const message = await findMessageByGroupId(GROUP_ID);
  
  if (!message) {
    console.error('❌ 메시지를 찾을 수 없습니다.');
    process.exit(1);
  }

  console.log(`✅ 메시지 발견: ID=${message.id}`);
  console.log(`   수신자 수: ${message.recipient_numbers?.length || 0}명`);
  console.log(`   발송 건수: ${message.sent_count || 0}건`);
  console.log(`   메시지 내용: ${(message.message_text || '').substring(0, 50)}...\n`);

  // 2. Solapi에서 발송된 번호 추출
  const sentNumbers = await extractSentNumbersFromSolapi(message.solapi_group_id || GROUP_ID);

  // 3. message_logs에서도 발송된 번호 확인
  const { data: logs } = await supabase
    .from('message_logs')
    .select('customer_phone')
    .eq('content_id', String(message.id))
    .not('customer_phone', 'is', null);

  const sentFromLogs = new Set((logs || []).map(log => String(log.customer_phone).replace(/[-\s]/g, '')));
  console.log(`✅ message_logs에서 발송된 번호: ${sentFromLogs.size}개`);

  // 4. 전체 발송된 번호 합치기
  const allSentNumbers = new Set([...sentNumbers, ...sentFromLogs]);
  console.log(`✅ 총 발송된 번호: ${allSentNumbers.size}개\n`);

  // 5. 미발송 수신자 필터링
  const allRecipients = (message.recipient_numbers || []).map(num => num.replace(/[-\s]/g, ''));
  const remainingRecipients = allRecipients.filter(num => !allSentNumbers.has(num));
  
  console.log(`📊 결과:`);
  console.log(`   전체 수신자: ${allRecipients.length}명`);
  console.log(`   발송 완료: ${allSentNumbers.size}명`);
  console.log(`   미발송: ${remainingRecipients.length}명\n`);

  if (remainingRecipients.length === 0) {
    console.log('✅ 모든 수신자에게 발송이 완료되었습니다!');
    process.exit(0);
  }

  // 6. 하이픈 형식으로 변환
  const formattedRecipients = remainingRecipients.map(num => {
    if (num.length === 11) {
      return `${num.slice(0, 3)}-${num.slice(3, 7)}-${num.slice(7)}`;
    }
    return num;
  });

  // 7. 새 초안 생성
  console.log('💾 미발송 수신자로 새 초안 생성 중...');
  const response = await fetch(`${LOCAL_URL}/api/channels/sms/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messageType: message.message_type || 'MMS',
      messageText: message.message_text || '',
      imageUrl: message.image_url || null,
      shortLink: message.short_link || null,
      recipientNumbers: formattedRecipients,
      status: 'draft'
    })
  });

  const result = await response.json();

  if (result.success) {
    console.log(`\n✅ 초안 생성 완료!`);
    console.log(`   새 메시지 ID: ${result.channelPostId}`);
    console.log(`   수신자 수: ${formattedRecipients.length}명`);
    console.log(`\n💡 다음 단계:`);
    console.log(`   SMS 편집 페이지: ${LOCAL_URL}/admin/sms?id=${result.channelPostId}`);
  } else {
    console.error('❌ 초안 생성 실패:', result.message);
    process.exit(1);
  }
}

createDraftFromRemaining();

