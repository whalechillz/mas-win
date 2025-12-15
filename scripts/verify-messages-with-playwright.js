/**
 * Playwright로 생성된 메시지 검증
 */

const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://masgolf.co.kr';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyMessages() {
  console.log('='.repeat(100));
  console.log('🔍 Playwright 메시지 검증');
  console.log('='.repeat(100));
  console.log('');

  // 1. 생성된 메시지 조회
  const { data: messages, error } = await supabase
    .from('channel_sms')
    .select('id, message_type, status, note, recipient_numbers, image_url')
    .like('note', '%A/B/C 테스트%')
    .order('id', { ascending: true });

  if (error) {
    console.error('❌ 메시지 조회 실패:', error.message);
    process.exit(1);
  }

  console.log(`📋 생성된 메시지: ${messages.length}개\n`);

  // 2. 브라우저 시작
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🌐 브라우저 시작...');
    console.log('💡 로그인이 필요하면 수동으로 로그인해주세요.\n');

    // 샘플 메시지 확인 (첫 번째, 중간, 마지막)
    const sampleMessages = [
      messages[0],
      messages[Math.floor(messages.length / 2)],
      messages[messages.length - 1]
    ].filter(Boolean);

    for (const msg of sampleMessages) {
      const messageUrl = `${SITE_URL}/admin/sms?id=${msg.id}`;
      
      console.log(`📨 메시지 확인: ID=${msg.id} (${msg.recipient_numbers?.length || 0}명)`);
      console.log(`   URL: ${messageUrl}`);
      
      await page.goto(messageUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);

      // 이미지 표시 확인
      const imageSelectors = [
        'img[src*="bucket-hat"]',
        'img[src*="ST01FZ"]',
        'img[src*="supabase"]',
        'img[alt*="버킷"]',
        'img[alt*="MMS"]'
      ];
      
      let imageFound = false;
      for (const selector of imageSelectors) {
        const visible = await page.locator(selector).first().isVisible({ timeout: 2000 }).catch(() => false);
        if (visible) {
          imageFound = true;
          break;
        }
      }
      
      if (imageFound) {
        console.log('   ✅ 이미지 표시 확인');
      } else {
        console.log('   ⚠️ 이미지 표시 안됨');
      }

      // 메시지 내용 확인
      const messageText = await page.locator('textarea, [contenteditable="true"]').first().inputValue().catch(() => '');
      if (messageText.includes('MASSGOO X MUZIIK')) {
        console.log('   ✅ 메시지 내용 확인');
      } else {
        console.log('   ⚠️ 메시지 내용 확인 필요');
      }

      // 수신자 수 확인
      const recipientText = await page.textContent('body').catch(() => '');
      const recipientMatch = recipientText.match(/(\d+)명.*선택/);
      if (recipientMatch) {
        console.log(`   ✅ 수신자 수: ${recipientMatch[1]}명`);
      }
      
      console.log('');
    }

    console.log('\n' + '='.repeat(100));
    console.log('📊 메시지 요약');
    console.log('='.repeat(100));
    console.log('');

    let totalRecipients = 0;
    messages.forEach(msg => {
      const count = msg.recipient_numbers?.length || 0;
      totalRecipients += count;
      const hasImage = msg.image_url && msg.image_url.startsWith('ST01FZ');
      console.log(`ID ${msg.id}: ${msg.note}`);
      console.log(`   수신자: ${count}명`);
      console.log(`   이미지: ${hasImage ? '✅' : '❌'}`);
      console.log(`   상태: ${msg.status}`);
      console.log('');
    });

    console.log(`총 수신자: ${totalRecipients}명`);
    console.log(`총 메시지: ${messages.length}개\n`);

    console.log('='.repeat(100));
    console.log('✅ 검증 완료!');
    console.log('='.repeat(100));
    console.log('\n💡 브라우저를 닫으려면 Enter를 누르세요...');

    // 사용자 입력 대기
    await new Promise(resolve => {
      process.stdin.once('data', () => resolve());
    });

  } catch (error) {
    console.error('❌ 검증 중 오류:', error.message);
  } finally {
    await browser.close();
  }
}

verifyMessages()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });


