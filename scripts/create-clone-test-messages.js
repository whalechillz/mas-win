require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '설정됨' : '없음');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '설정됨' : '없음');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createCloneTestMessages() {
  try {
    console.log('📋 162번 메시지 정보 조회 중...\n');
    
    // 1. 162번 메시지 조회
    const { data: message162, error: fetchError } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('id', 162)
      .single();

    if (fetchError || !message162) {
      console.error('❌ 162번 메시지 조회 실패:', fetchError);
      process.exit(1);
    }

    console.log('✅ 162번 메시지 정보:');
    console.log(`   메시지 내용: ${message162.message_text?.substring(0, 50)}...`);
    console.log(`   이미지 URL: ${message162.image_url || '(없음)'}`);
    console.log(`   메시지 타입: ${message162.message_type || 'MMS'}`);
    console.log(`   수신자: ${message162.recipient_numbers || '(없음)'}`);
    console.log(`   상태: ${message162.status || 'draft'}\n`);

    // 2. 현재 시간 확인 (한국 시간 기준)
    const now = new Date();
    const kstOffset = 9 * 60; // KST는 UTC+9
    const kstNow = new Date(now.getTime() + (kstOffset * 60 * 1000));
    
    // 오늘 날짜로 11:10, 11:11, 11:12 설정
    const today = new Date(kstNow);
    today.setHours(11, 10, 0, 0);
    const scheduledTime1 = new Date(today.getTime() - (kstOffset * 60 * 1000)); // UTC로 변환
    
    today.setHours(11, 11, 0, 0);
    const scheduledTime2 = new Date(today.getTime() - (kstOffset * 60 * 1000));
    
    today.setHours(11, 12, 0, 0);
    const scheduledTime3 = new Date(today.getTime() - (kstOffset * 60 * 1000));

    console.log('⏰ 예약 시간 설정:');
    console.log(`   메시지 1: ${scheduledTime1.toISOString()} (한국시간 11:10)`);
    console.log(`   메시지 2: ${scheduledTime2.toISOString()} (한국시간 11:11)`);
    console.log(`   메시지 3: ${scheduledTime3.toISOString()} (한국시간 11:12)\n`);

    // 3. 수신자 번호 파싱
    let recipientNumbers = [];
    if (message162.recipient_numbers) {
      try {
        if (typeof message162.recipient_numbers === 'string') {
          recipientNumbers = JSON.parse(message162.recipient_numbers);
        } else {
          recipientNumbers = message162.recipient_numbers;
        }
      } catch (e) {
        console.warn('⚠️ 수신자 번호 파싱 실패, 빈 배열 사용');
        recipientNumbers = [];
      }
    }

    // 4. 3개의 새 메시지 생성
    const messagesToCreate = [
      {
        message_text: message162.message_text || '',
        image_url: message162.image_url || null,
        message_type: message162.message_type || 'MMS',
        recipient_numbers: recipientNumbers,
        status: 'draft',
        scheduled_at: scheduledTime1.toISOString()
      },
      {
        message_text: message162.message_text || '',
        image_url: message162.image_url || null,
        message_type: message162.message_type || 'MMS',
        recipient_numbers: recipientNumbers,
        status: 'draft',
        scheduled_at: scheduledTime2.toISOString()
      },
      {
        message_text: message162.message_text || '',
        image_url: message162.image_url || null,
        message_type: message162.message_type || 'MMS',
        recipient_numbers: recipientNumbers,
        status: 'draft',
        scheduled_at: scheduledTime3.toISOString()
      }
    ];

    console.log('💾 새 메시지 생성 중...\n');

    const createdMessages = [];
    for (let i = 0; i < messagesToCreate.length; i++) {
      const { data: newMessage, error: createError } = await supabase
        .from('channel_sms')
        .insert(messagesToCreate[i])
        .select()
        .single();

      if (createError) {
        console.error(`❌ 메시지 ${i + 1} 생성 실패:`, createError);
        continue;
      }

      createdMessages.push(newMessage);
      const timeStr = i === 0 ? '11:10' : i === 1 ? '11:11' : '11:12';
      console.log(`✅ 메시지 ${newMessage.id} 생성 완료 (예약: 한국시간 ${timeStr})`);
    }

    console.log(`\n🎉 총 ${createdMessages.length}개의 메시지가 생성되었습니다.`);
    console.log(`   메시지 ID: ${createdMessages.map(m => m.id).join(', ')}`);
    console.log(`   예약 시간: 한국시간 오전 11:10, 11:11, 11:12\n`);

    // 5. 생성된 메시지 상세 정보 출력
    for (const msg of createdMessages) {
      console.log(`📱 메시지 ${msg.id}:`);
      console.log(`   상태: ${msg.status}`);
      console.log(`   타입: ${msg.message_type}`);
      console.log(`   이미지: ${msg.image_url ? '있음' : '없음'}`);
      console.log(`   예약 시간: ${msg.scheduled_at}`);
      console.log(`   수신자 수: ${recipientNumbers.length}\n`);
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

createCloneTestMessages();
