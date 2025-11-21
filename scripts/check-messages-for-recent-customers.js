/**
 * 11월 19일, 20일, 21일에 전화온 고객들이 받은 메시지 조사 스크립트
 * 
 * 사용법:
 * node scripts/check-messages-for-recent-customers.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 전화번호 정규화 함수
const normalizePhone = (phone = '') => phone.replace(/[^0-9]/g, '');

// 전화번호 포맷팅 함수
const formatPhone = (phone = '') => {
  if (!phone) return '';
  const normalized = normalizePhone(phone);
  if (normalized.length === 11) {
    return `${normalized.slice(0, 3)}-${normalized.slice(3, 7)}-${normalized.slice(7)}`;
  }
  if (normalized.length === 10) {
    return `${normalized.slice(0, 3)}-${normalized.slice(3, 6)}-${normalized.slice(6)}`;
  }
  return phone;
};

async function checkMessagesForRecentCustomers() {
  console.log('🔍 11월 19일, 20일, 21일에 전화온 고객들의 메시지 조사 시작...\n');
  
  // 1. customers 테이블에서 11월 19일, 20일, 21일에 전화온 고객 조회
  const targetDates = [
    '2025-11-19',
    '2025-11-20', 
    '2025-11-21'
  ];
  
  console.log('📅 대상 날짜:', targetDates.join(', '), '\n');
  
  // last_contact_date로 검색 (DATE 타입이므로 시간 없이 검색)
  let allCustomers = [];
  
  for (const date of targetDates) {
    // last_contact_date로 검색 (DATE 타입)
    const { data: customers1, error: error1 } = await supabase
      .from('customers')
      .select('id, name, phone, last_contact_date, created_at, updated_at')
      .eq('last_contact_date', date);
    
    if (!error1 && customers1) {
      allCustomers.push(...customers1.map(c => ({ ...c, source: 'last_contact_date' })));
    }
    
    // updated_at로도 검색 (날짜 부분만 비교)
    const startDate = `${date}T00:00:00.000Z`;
    const endDate = `${date}T23:59:59.999Z`;
    
    const { data: customers2, error: error2 } = await supabase
      .from('customers')
      .select('id, name, phone, last_contact_date, created_at, updated_at')
      .gte('updated_at', startDate)
      .lte('updated_at', endDate);
    
    if (!error2 && customers2) {
      // last_contact_date가 없거나 다른 날짜인 경우만 추가
      const newCustomers = customers2
        .filter(c => !c.last_contact_date || c.last_contact_date !== date)
        .map(c => ({ ...c, source: 'updated_at' }));
      allCustomers.push(...newCustomers);
    }
  }
  
  // 중복 제거 (같은 전화번호)
  const uniqueCustomers = [];
  const phoneSet = new Set();
  
  for (const customer of allCustomers) {
    if (!customer.phone) continue;
    const normalized = normalizePhone(customer.phone);
    if (!phoneSet.has(normalized)) {
      phoneSet.add(normalized);
      uniqueCustomers.push(customer);
    }
  }
  
  console.log(`✅ 총 ${uniqueCustomers.length}명의 고객 발견\n`);
  
  if (uniqueCustomers.length === 0) {
    console.log('❌ 해당 날짜에 전화온 고객이 없습니다.');
    return;
  }
  
  // 2. 각 고객이 받은 메시지 조회
  const results = [];
  
  for (const customer of uniqueCustomers) {
    const phone = customer.phone;
    const normalized = normalizePhone(phone);
    const formatted = formatPhone(normalized);
    
    console.log(`\n📱 고객: ${customer.name || '이름 없음'} (${phone})`);
    console.log(`   검색 기준: ${customer.source}`);
    
    // message_logs에서 검색
    const { data: logs, error: logsError } = await supabase
      .from('message_logs')
      .select('id, content_id, customer_phone, sent_at, status, message_type')
      .or(`customer_phone.eq.${normalized},customer_phone.eq.${formatted}`)
      .order('sent_at', { ascending: false });
    
    if (logsError) {
      console.error(`   ❌ message_logs 조회 오류:`, logsError);
      continue;
    }
    
    if (!logs || logs.length === 0) {
      // channel_sms의 recipient_numbers에서 검색
      const { data: smsMessages, error: smsError } = await supabase
        .from('channel_sms')
        .select('id, message_text, message_type, status, sent_at, recipient_numbers, note, solapi_group_id')
        .not('recipient_numbers', 'is', null)
        .order('created_at', { ascending: false })
        .limit(500);
      
      if (!smsError && smsMessages) {
        const foundInSms = smsMessages.filter(msg => {
          if (!msg.recipient_numbers) return false;
          const recipients = Array.isArray(msg.recipient_numbers) 
            ? msg.recipient_numbers 
            : (typeof msg.recipient_numbers === 'string' 
                ? JSON.parse(msg.recipient_numbers) 
                : []);
          return recipients.some(r => {
            const rStr = String(r);
            const rNormalized = normalizePhone(rStr);
            return rNormalized === normalized || rStr === phone || rStr === formatted;
          });
        });
        
        if (foundInSms.length > 0) {
          console.log(`   ✅ channel_sms에서 ${foundInSms.length}개 메시지 발견 (로그 없음)`);
          foundInSms.forEach((msg, idx) => {
            console.log(`      ${idx + 1}. 메시지 ID: ${msg.id}`);
            console.log(`         상태: ${msg.status}`);
            console.log(`         타입: ${msg.message_type}`);
            console.log(`         발송 시간: ${msg.sent_at ? new Date(msg.sent_at).toLocaleString('ko-KR') : '미발송'}`);
            console.log(`         내용: ${(msg.message_text || '').substring(0, 100)}...`);
            if (msg.note) {
              console.log(`         메모: ${msg.note}`);
            }
            if (msg.solapi_group_id) {
              console.log(`         솔라피 그룹 ID: ${msg.solapi_group_id}`);
            }
          });
          
          results.push({
            customer: customer.name || '이름 없음',
            phone: phone,
            messages: foundInSms.map(msg => ({
              messageId: msg.id,
              messageText: msg.message_text,
              messageType: msg.message_type,
              status: msg.status,
              sentAt: msg.sent_at,
              note: msg.note,
              source: 'channel_sms'
            }))
          });
        } else {
          console.log(`   ❌ 메시지 없음`);
        }
      }
      continue;
    }
    
    // message_logs에서 찾은 경우
    const messageIds = Array.from(
      new Set(
        logs
          .map(log => {
            const parsed = Number(log.content_id);
            return Number.isNaN(parsed) ? null : parsed;
          })
          .filter(id => id !== null)
      )
    );
    
    let smsDetailsMap = new Map();
    if (messageIds.length > 0) {
      const { data: smsDetails, error: smsError } = await supabase
        .from('channel_sms')
        .select('id, message_text, message_type, status, note, solapi_group_id, sent_at, success_count, fail_count, image_url')
        .in('id', messageIds);
      
      if (!smsError && smsDetails) {
        smsDetailsMap = new Map(smsDetails.map(item => [item.id, item]));
      }
    }
    
    const messages = logs.map(log => {
      const contentIdNumber = Number(log.content_id);
      const detail = !Number.isNaN(contentIdNumber) ? smsDetailsMap.get(contentIdNumber) : null;
      
      return {
        logId: log.id,
        messageId: Number.isNaN(contentIdNumber) ? null : contentIdNumber,
        messageText: detail?.message_text || null,
        messageType: detail?.message_type || log.message_type || null,
        sentAt: log.sent_at || detail?.sent_at || null,
        sendStatus: log.status || null,
        messageStatus: detail?.status || null,
        note: detail?.note || null,
        solapiGroupId: detail?.solapi_group_id || null,
        successCount: detail?.success_count !== undefined ? detail.success_count : null,
        failCount: detail?.fail_count !== undefined ? detail.fail_count : null,
        imageUrl: detail?.image_url || null
      };
    });
    
    console.log(`   ✅ ${messages.length}개 메시지 발견`);
    messages.forEach((msg, idx) => {
      console.log(`      ${idx + 1}. 메시지 ID: ${msg.messageId || 'N/A'}`);
      console.log(`         발송 시간: ${msg.sentAt ? new Date(msg.sentAt).toLocaleString('ko-KR') : 'N/A'}`);
      console.log(`         상태: ${msg.sendStatus || msg.messageStatus || 'N/A'}`);
      console.log(`         타입: ${msg.messageType || 'N/A'}`);
      console.log(`         내용: ${(msg.messageText || '').substring(0, 100)}...`);
      if (msg.note) {
        console.log(`         메모: ${msg.note}`);
      }
      if (msg.solapiGroupId) {
        console.log(`         솔라피 그룹 ID: ${msg.solapiGroupId}`);
      }
      if (msg.successCount !== null || msg.failCount !== null) {
        console.log(`         발송 결과: 성공 ${msg.successCount || 0}건 / 실패 ${msg.failCount || 0}건`);
      }
    });
    
    results.push({
      customer: customer.name || '이름 없음',
      phone: phone,
      messages: messages
    });
  }
  
  // 3. 요약 출력
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 조사 결과 요약');
  console.log('='.repeat(80));
  console.log(`총 고객 수: ${uniqueCustomers.length}명`);
  console.log(`메시지를 받은 고객: ${results.filter(r => r.messages.length > 0).length}명`);
  console.log(`메시지를 받지 않은 고객: ${results.filter(r => r.messages.length === 0).length}명`);
  console.log(`총 메시지 수: ${results.reduce((sum, r) => sum + r.messages.length, 0)}건\n`);
  
  // 메시지를 받지 않은 고객 목록
  const noMessageCustomers = results.filter(r => r.messages.length === 0);
  if (noMessageCustomers.length > 0) {
    console.log('❌ 메시지를 받지 않은 고객:');
    noMessageCustomers.forEach(c => {
      console.log(`   - ${c.customer} (${c.phone})`);
    });
    console.log('');
  }
  
  // 메시지를 받은 고객 목록
  const withMessageCustomers = results.filter(r => r.messages.length > 0);
  if (withMessageCustomers.length > 0) {
    console.log('✅ 메시지를 받은 고객:');
    withMessageCustomers.forEach(c => {
      console.log(`   - ${c.customer} (${c.phone}): ${c.messages.length}개 메시지`);
    });
  }
}

checkMessagesForRecentCustomers().catch(console.error);





