/**
 * 129번 메시지 분할 전송 계획 분석 스크립트
 * 
 * 1. 11월 28일 발송된 메시지 128, 130, 132, 131, 133, 134, 135, 136번의 내용과 이미지 분석
 * 2. 129번 메시지 확인
 * 3. 2025년 11월 28일~12월 4일 연락한 VIP1399~VIP5822 고객들의 메시지 수신 이력 분석
 * 4. 전화 응답률이 가장 높은 메시지 이미지/내용 파악
 * 5. 129번 메시지 200명씩 분할 전송 계획 수립
 * 
 * 사용법:
 * node scripts/analyze-message-129-split-plan.js
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

async function analyzeMessage129SplitPlan() {
  console.log('='.repeat(80));
  console.log('📊 129번 메시지 분할 전송 계획 분석');
  console.log('='.repeat(80));
  console.log('');

  // 1. 11월 28일 발송된 메시지들 확인 (128, 130, 132, 131, 133, 134, 135, 136)
  console.log('📨 1단계: 11월 28일 발송 메시지 분석');
  console.log('-'.repeat(80));
  
  const messageIds = [128, 130, 132, 131, 133, 134, 135, 136];
  const { data: messages, error: messagesError } = await supabase
    .from('channel_sms')
    .select('id, message_text, message_type, status, sent_at, image_url, note, recipient_numbers, success_count, fail_count')
    .in('id', messageIds)
    .order('id', { ascending: true });

  if (messagesError) {
    console.error('❌ 메시지 조회 오류:', messagesError);
    return;
  }

  console.log(`✅ ${messages.length}개 메시지 발견\n`);

  // 메시지 내용과 이미지 그룹핑
  const messageGroups = {};
  
  messages.forEach(msg => {
    const key = `${msg.image_url || 'no-image'}_${msg.message_text?.substring(0, 50) || 'no-text'}`;
    if (!messageGroups[key]) {
      messageGroups[key] = {
        imageUrl: msg.image_url,
        messageText: msg.message_text,
        messageIds: [],
        totalRecipients: 0,
        totalSuccess: 0,
        totalFail: 0
      };
    }
    messageGroups[key].messageIds.push(msg.id);
    
    // recipient_numbers 계산
    if (msg.recipient_numbers) {
      const recipients = Array.isArray(msg.recipient_numbers) 
        ? msg.recipient_numbers 
        : (typeof msg.recipient_numbers === 'string' 
            ? JSON.parse(msg.recipient_numbers) 
            : []);
      messageGroups[key].totalRecipients += recipients.length;
    }
    
    messageGroups[key].totalSuccess += msg.success_count || 0;
    messageGroups[key].totalFail += msg.fail_count || 0;
  });

  console.log('📋 메시지 그룹 (이미지+내용 기준):');
  Object.entries(messageGroups).forEach(([key, group], idx) => {
    console.log(`\n   그룹 ${idx + 1}:`);
    console.log(`   - 메시지 ID: ${group.messageIds.join(', ')}`);
    console.log(`   - 이미지: ${group.imageUrl || '없음'}`);
    console.log(`   - 내용: ${(group.messageText || '').substring(0, 100)}...`);
    console.log(`   - 총 수신자: ${group.totalRecipients}명`);
    console.log(`   - 성공: ${group.totalSuccess}건 / 실패: ${group.totalFail}건`);
  });

  // 2. 129번 메시지 확인
  console.log('\n\n📨 2단계: 129번 메시지 확인');
  console.log('-'.repeat(80));
  
  const { data: message129, error: msg129Error } = await supabase
    .from('channel_sms')
    .select('id, message_text, message_type, status, sent_at, image_url, note, recipient_numbers, success_count, fail_count')
    .eq('id', 129)
    .single();

  if (msg129Error) {
    console.error('❌ 129번 메시지 조회 오류:', msg129Error);
  } else if (message129) {
    console.log('✅ 129번 메시지 발견:');
    console.log(`   - 상태: ${message129.status}`);
    console.log(`   - 이미지: ${message129.image_url || '없음'}`);
    console.log(`   - 내용: ${(message129.message_text || '').substring(0, 200)}...`);
    console.log(`   - 메모: ${message129.note || '없음'}`);
    
    if (message129.recipient_numbers) {
      const recipients = Array.isArray(message129.recipient_numbers) 
        ? message129.recipient_numbers 
        : (typeof message129.recipient_numbers === 'string' 
            ? JSON.parse(message129.recipient_numbers) 
            : []);
      console.log(`   - 수신자 수: ${recipients.length}명`);
    }
  } else {
    console.log('⚠️  129번 메시지를 찾을 수 없습니다.');
  }

  // 3. 11월 28일 메시지를 받은 고객 중 11월 28일~12월 4일 사이에 연락한 고객 확인
  console.log('\n\n👥 3단계: 최근 연락 고객 확인 (VIP1399~VIP5822)');
  console.log('-'.repeat(80));
  
  const targetDates = [];
  for (let date = new Date('2025-11-28'); date <= new Date('2025-12-04'); date.setDate(date.getDate() + 1)) {
    targetDates.push(date.toISOString().slice(0, 10));
  }

  console.log(`📅 대상 날짜: ${targetDates.join(', ')}\n`);

  // 11월 28일 메시지를 받은 고객들의 전화번호 수집
  const messageRecipients = new Set();
  messages.forEach(msg => {
    if (msg.recipient_numbers) {
      const recipients = Array.isArray(msg.recipient_numbers) 
        ? msg.recipient_numbers 
        : (typeof msg.recipient_numbers === 'string' 
            ? JSON.parse(msg.recipient_numbers) 
            : []);
      recipients.forEach(r => {
        const normalized = normalizePhone(String(r));
        if (normalized) messageRecipients.add(normalized);
      });
    }
  });

  console.log(`📱 11월 28일 메시지 수신자: ${messageRecipients.size}명\n`);

  // 날짜 범위로 고객 검색 (last_contact_date가 11월 28일~12월 4일 사이)
  let allCustomers = [];
  
  for (const date of targetDates) {
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, name, phone, last_contact_date, vip_level')
      .eq('last_contact_date', date);
    
    if (!customersError && customers) {
      allCustomers.push(...customers);
    }
  }

  // 11월 28일 메시지를 받은 고객이면서, VIP 이름이 VIP1399~VIP5822 범위인 고객 필터링
  const targetCustomers = allCustomers.filter(c => {
    if (!c.phone) return false;
    const normalized = normalizePhone(c.phone);
    
    // 11월 28일 메시지를 받은 고객인지 확인
    if (!messageRecipients.has(normalized)) return false;
    
    // VIP 이름으로 필터링 (VIP1399~VIP5822)
    const name = (c.name || '').toUpperCase();
    const vipMatch = name.match(/VIP(\d+)/);
    if (vipMatch) {
      const vipNumber = parseInt(vipMatch[1], 10);
      return vipNumber >= 1399 && vipNumber <= 5822;
    }
    return false;
  });

  // 중복 제거
  const uniqueCustomers = [];
  const phoneSet = new Set();
  
  for (const customer of targetCustomers) {
    if (!customer.phone) continue;
    const normalized = normalizePhone(customer.phone);
    if (!phoneSet.has(normalized)) {
      phoneSet.add(normalized);
      uniqueCustomers.push(customer);
    }
  }

  console.log(`✅ 총 ${uniqueCustomers.length}명의 고객 발견\n`);

  // 4. 각 고객이 받은 메시지와 전화 응답 분석
  console.log('\n\n📞 4단계: 고객별 메시지 수신 이력 및 전화 응답 분석');
  console.log('-'.repeat(80));

  const customerAnalysis = [];

  for (const customer of uniqueCustomers) {
    const phone = customer.phone;
    const normalized = normalizePhone(phone);
    const formatted = formatPhone(normalized);

    // message_logs에서 검색
    const { data: logs, error: logsError } = await supabase
      .from('message_logs')
      .select('id, content_id, customer_phone, sent_at, status, message_type')
      .or(`customer_phone.eq.${normalized},customer_phone.eq.${formatted}`)
      .order('sent_at', { ascending: false });

    let receivedMessages = [];
    
    if (!logsError && logs && logs.length > 0) {
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

      if (messageIds.length > 0) {
        const { data: smsDetails, error: smsError } = await supabase
          .from('channel_sms')
          .select('id, message_text, message_type, status, note, solapi_group_id, sent_at, success_count, fail_count, image_url')
          .in('id', messageIds);

        if (!smsError && smsDetails) {
          receivedMessages = logs.map(log => {
            const contentIdNumber = Number(log.content_id);
            const detail = smsDetails.find(s => s.id === contentIdNumber);
            
            return {
              messageId: contentIdNumber,
              messageText: detail?.message_text || null,
              imageUrl: detail?.image_url || null,
              sentAt: log.sent_at || detail?.sent_at || null,
              note: detail?.note || null
            };
          });
        }
      }
    }

    // 11월 28일 발송 메시지 중 받은 것만 필터링
    const nov28Messages = receivedMessages.filter(msg => 
      messageIds.includes(msg.messageId) && 
      msg.sentAt && 
      msg.sentAt.startsWith('2025-11-28')
    );

    customerAnalysis.push({
      name: customer.name,
      phone: phone,
      lastContactDate: customer.last_contact_date,
      vipLevel: customer.vip_level,
      receivedMessages: nov28Messages,
      totalMessages: receivedMessages.length
    });
  }

  // 메시지 그룹별 전화 응답률 계산
  console.log('\n📊 메시지 그룹별 전화 응답 분석:');
  
  const groupResponseRate = {};
  
  Object.entries(messageGroups).forEach(([key, group]) => {
    const customersWhoReceived = customerAnalysis.filter(c => 
      c.receivedMessages.some(msg => group.messageIds.includes(msg.messageId))
    );
    
    groupResponseRate[key] = {
      groupInfo: group,
      customersReceived: customersWhoReceived.length,
      responseRate: group.totalRecipients > 0
        ? ((customersWhoReceived.length / group.totalRecipients) * 100).toFixed(2)
        : 0
    };
  });

  // 응답률 순으로 정렬
  const sortedGroups = Object.entries(groupResponseRate)
    .sort((a, b) => b[1].customersReceived - a[1].customersReceived);

  console.log('\n   전화 응답률 순위:');
  sortedGroups.forEach(([key, data], idx) => {
    console.log(`\n   ${idx + 1}위:`);
    console.log(`   - 메시지 ID: ${data.groupInfo.messageIds.join(', ')}`);
    console.log(`   - 이미지: ${data.groupInfo.imageUrl || '없음'}`);
    console.log(`   - 내용: ${(data.groupInfo.messageText || '').substring(0, 80)}...`);
    console.log(`   - 총 수신자: ${data.groupInfo.totalRecipients}명`);
    console.log(`   - 전화 응답 고객: ${data.customersReceived}명`);
    console.log(`   - 응답률: ${data.responseRate}%`);
  });

  // 최고 응답률 메시지
  const bestMessage = sortedGroups[0];
  console.log('\n\n🏆 최고 전화 응답률 메시지:');
  console.log('-'.repeat(80));
  if (bestMessage) {
    console.log(`   메시지 ID: ${bestMessage[1].groupInfo.messageIds.join(', ')}`);
    console.log(`   이미지: ${bestMessage[1].groupInfo.imageUrl || '없음'}`);
    console.log(`   내용: ${bestMessage[1].groupInfo.messageText || '없음'}`);
    console.log(`   전화 응답 고객: ${bestMessage[1].customersReceived}명`);
    console.log(`   응답률: ${bestMessage[1].responseRate}%`);
  }

  // 5. 고객별 상세 정보 출력
  console.log('\n\n👥 5단계: 고객별 상세 정보');
  console.log('-'.repeat(80));
  
  customerAnalysis.forEach((customer, idx) => {
    console.log(`\n   ${idx + 1}. ${customer.name} (${customer.phone})`);
    console.log(`      - 최근 연락일: ${customer.last_contact_date}`);
    console.log(`      - VIP 레벨: ${customer.vipLevel || 'NONE'}`);
    console.log(`      - 받은 메시지 수: ${customer.totalMessages}개`);
    
    if (customer.receivedMessages.length > 0) {
      console.log(`      - 11월 28일 발송 메시지:`);
      customer.receivedMessages.forEach((msg, msgIdx) => {
        console.log(`         ${msgIdx + 1}. 메시지 ID: ${msg.messageId}`);
        console.log(`            이미지: ${msg.imageUrl || '없음'}`);
        console.log(`            내용: ${(msg.messageText || '').substring(0, 60)}...`);
        console.log(`            발송 시간: ${msg.sentAt ? new Date(msg.sentAt).toLocaleString('ko-KR') : 'N/A'}`);
      });
    } else {
      console.log(`      - 11월 28일 발송 메시지: 없음`);
    }
  });

  // 6. 129번 메시지 200명씩 분할 전송 계획
  console.log('\n\n📋 6단계: 129번 메시지 200명씩 분할 전송 계획');
  console.log('-'.repeat(80));

  if (message129 && message129.recipient_numbers) {
    const recipients = Array.isArray(message129.recipient_numbers) 
      ? message129.recipient_numbers 
      : (typeof message129.recipient_numbers === 'string' 
          ? JSON.parse(message129.recipient_numbers) 
          : []);
    
    const totalRecipients = recipients.length;
    const batchSize = 200;
    const batches = Math.ceil(totalRecipients / batchSize);

    console.log(`\n   총 수신자: ${totalRecipients}명`);
    console.log(`   배치 크기: ${batchSize}명`);
    console.log(`   총 배치 수: ${batches}개\n`);

    console.log('   📅 분할 전송 계획:');
    for (let i = 0; i < batches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, totalRecipients);
      const batchRecipients = recipients.slice(start, end);
      
      console.log(`\n   배치 ${i + 1}/${batches}:`);
      console.log(`   - 수신자 수: ${batchRecipients.length}명`);
      console.log(`   - 수신자 범위: ${start + 1}번째 ~ ${end}번째`);
      console.log(`   - 권장 이미지: ${bestMessage ? (bestMessage[1].groupInfo.imageUrl || '없음') : '없음'}`);
      console.log(`   - 권장 내용: ${bestMessage ? (bestMessage[1].groupInfo.messageText || '없음') : '없음'}`);
    }

    console.log('\n\n   💡 권장사항:');
    console.log('   - 최고 전화 응답률 메시지의 이미지와 내용을 129번 메시지에 적용');
    if (bestMessage) {
      console.log(`   - 이미지 URL: ${bestMessage[1].groupInfo.imageUrl || '없음'}`);
      console.log(`   - 메시지 내용: ${bestMessage[1].groupInfo.messageText || '없음'}`);
    }
    console.log(`   - 200명씩 분할하여 발송 (총 ${batches}개 배치)`);
    console.log(`   - 각 배치 간격: 최소 1시간 이상 권장`);
  } else {
    console.log('   ⚠️  129번 메시지의 수신자 정보를 찾을 수 없습니다.');
  }

  // 최종 요약
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 최종 요약');
  console.log('='.repeat(80));
  console.log(`✅ 분석 완료`);
  console.log(`   - 11월 28일 발송 메시지: ${messages.length}개`);
  console.log(`   - 메시지 그룹 수: ${Object.keys(messageGroups).length}개`);
  console.log(`   - 최근 연락 고객: ${uniqueCustomers.length}명`);
  console.log(`   - 최고 응답률 메시지: ${bestMessage ? `메시지 ID ${bestMessage[1].groupInfo.messageIds.join(', ')}` : '없음'}`);
  if (message129 && message129.recipient_numbers) {
    const recipients = Array.isArray(message129.recipient_numbers) 
      ? message129.recipient_numbers 
      : (typeof message129.recipient_numbers === 'string' 
          ? JSON.parse(message129.recipient_numbers) 
          : []);
    console.log(`   - 129번 메시지 수신자: ${recipients.length}명`);
    console.log(`   - 권장 분할 배치 수: ${Math.ceil(recipients.length / 200)}개`);
  }
  console.log('='.repeat(80));
}

analyzeMessage129SplitPlan().catch(console.error);

