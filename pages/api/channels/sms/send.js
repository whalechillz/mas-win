import { createClient } from '@supabase/supabase-js';
import { createSolapiSignature } from '../../../../utils/solapiSignature.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || "";
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || "";
const SOLAPI_SENDER = process.env.SOLAPI_SENDER || "";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const {
      channelPostId,
      messageType,
      messageText,
      content, // formData에서 오는 필드명
      imageUrl,
      recipientNumbers,
      shortLink,
      honorific = '고객님', // 기본값: 고객님
      messageCategory, // 메시지 카테고리: 'booking' | 'promotion' | 'prize' | 'order' | null
      messageSubcategory // 메시지 서브 카테고리: 'prize_winner' | 'booking_received' | 등
    } = req.body;

    // 환경 변수 검증
    if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET || !SOLAPI_SENDER) {
      console.error('솔라피 환경 변수 누락:', {
        hasApiKey: !!SOLAPI_API_KEY,
        hasApiSecret: !!SOLAPI_API_SECRET,
        hasSender: !!SOLAPI_SENDER
      });
      return res.status(500).json({ 
        success: false, 
        message: 'SMS 서비스 설정이 완료되지 않았습니다.' 
      });
    }

    // 필수 필드 검증
    const messageContent = messageText || content;
    if (!channelPostId || !messageType || !messageContent || !recipientNumbers?.length) {
      return res.status(400).json({ 
        success: false, 
        message: '필수 필드가 누락되었습니다.' 
      });
    }

    // 수신자 번호 형식 검증
    const validNumbers = recipientNumbers.filter(num => 
      /^010-\d{4}-\d{4}$/.test(num) || /^010\d{8}$/.test(num)
    );

    if (validNumbers.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: '유효한 수신자 번호가 없습니다.' 
      });
    }

    // 솔라피 발송 메시지 구성
    let finalMessage = messageContent;
    if (shortLink) {
      finalMessage += `\n\n링크: ${shortLink}`;
    }

    // 메시지 타입 매핑 (SMS300은 지원하지 않으므로 LMS로 변환)
    const solapiType = messageType === 'SMS300' ? 'LMS' : messageType;
    const fromNumber = SOLAPI_SENDER.replace(/[\-\s]/g, '');

    // ⭐ 이미지 URL 처리: HTTP URL이면 Solapi에 재업로드하여 imageId 획득
    let solapiImageId = imageUrl || null;
    if (solapiType === 'MMS' && imageUrl) {
      // HTTP URL인지 확인 (https:// 또는 http://로 시작)
      const isHttpUrl = /^https?:\/\//i.test(imageUrl);
      
      if (isHttpUrl) {
        // HTTP URL이면 Solapi에 재업로드
        try {
          console.log('🔄 HTTP URL 감지, Solapi에 재업로드 중:', imageUrl);
          const reuploadResponse = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/solapi/reupload-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageUrl: imageUrl,
              messageId: channelPostId
            })
          });
          
          if (reuploadResponse.ok) {
            const reuploadResult = await reuploadResponse.json();
            if (reuploadResult.success && reuploadResult.imageId) {
              solapiImageId = reuploadResult.imageId;
              console.log('✅ Solapi 재업로드 성공, imageId:', solapiImageId);
            } else {
              console.warn('⚠️ Solapi 재업로드 실패, 원본 URL 사용:', reuploadResult.message);
            }
          } else {
            console.warn('⚠️ Solapi 재업로드 API 오류, 원본 URL 사용');
          }
        } catch (reuploadError) {
          console.error('❌ Solapi 재업로드 중 오류:', reuploadError);
          // 재업로드 실패해도 계속 진행 (이미지 없이 발송 시도)
        }
      } else {
        // 이미 Solapi imageId인 경우 그대로 사용
        solapiImageId = imageUrl;
      }
    }

    // 1) 수신거부(Opt-out) 고객 제외 처리
    let candidates = validNumbers.map(n => n.replace(/[\-\s]/g, ''));
    try {
      const { data: optedOut, error: optErr } = await supabase
        .from('customers')
        .select('phone')
        .in('phone', candidates)
        .eq('opt_out', true);
      if (optErr) {
        console.error('opt-out 조회 오류(무시하고 진행):', optErr);
      } else if (optedOut && optedOut.length) {
        const blocked = new Set(optedOut.map(o => String(o.phone)));
        candidates = candidates.filter(p => !blocked.has(p));
      }
    } catch (e) {
      console.error('opt-out 필터링 예외(무시하고 진행):', e);
    }

    if (candidates.length === 0) {
      return res.status(400).json({
        success: false,
        message: '수신거부 제외 후 발송 가능한 수신자가 없습니다.'
      });
    }

    // [신규] 동일 허브콘텐츠(content_id)로 이미 보낸 번호는 제외 (내용과 무관하게 1회 원칙)
    let uniqueToSend = candidates;
    try {
      const { data: already } = await supabase
        .from('message_logs')
        .select('customer_phone')
        .eq('content_id', String(channelPostId))
        .in('customer_phone', candidates);
      if (already && already.length) {
        const sentSet = new Set(already.map(r => String(r.customer_phone)));
        uniqueToSend = candidates.filter(p => !sentSet.has(p));
      }
    } catch (e) {
      console.error('중복 발송 필터링 오류(무시하고 진행):', e);
    }

    if (uniqueToSend.length === 0) {
      return res.status(200).json({
        success: true,
        message: '동일 허브콘텐츠로 이미 모든 대상에게 발송되어 중복 제외되었습니다.',
        result: { groupIds: [], sentCount: 0, successCount: 0, failCount: 0 },
        duplicates: candidates.length
      });
    }

    // Solapi v4 API로 발송 (성공한 test-sms 방식 사용)
    const authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);

    // ⭐ 전화번호 정규화 및 포맷팅 헬퍼 함수
    const normalizePhone = (phone = '') => phone.replace(/[^0-9]/g, '');
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

    // ⭐ 고객 이름 조회 (개인화용)
    let customerNameMap = new Map();
    const hasNameVariable = finalMessage.includes('{name}') || 
                            finalMessage.includes('{고객명}') || 
                            finalMessage.includes('{{name}}');
    
    if (hasNameVariable) {
      try {
        const normalizedPhones = uniqueToSend.map(num => {
          const normalized = normalizePhone(num);
          const formatted = formatPhone(normalized);
          return { normalized, formatted, original: num };
        });
        
        const allPhones = [
          ...normalizedPhones.map(p => p.normalized),
          ...normalizedPhones.map(p => p.formatted),
          ...normalizedPhones.map(p => p.original)
        ];
        
        const { data: customers, error: customerError } = await supabase
          .from('customers')
          .select('phone, name')
          .in('phone', allPhones);
        
        if (!customerError && customers) {
          customers.forEach(c => {
            const normalized = normalizePhone(c.phone);
            customerNameMap.set(normalized, c.name || '');
            // 포맷된 번호로도 매핑
            const formatted = formatPhone(normalized);
            customerNameMap.set(formatted, c.name || '');
            // 원본 번호로도 매핑
            customerNameMap.set(c.phone, c.name || '');
          });
        }
      } catch (e) {
        console.error('고객 이름 조회 오류(무시하고 진행):', e);
      }
    }

    // ⭐ 이름 처리 함수 (VIP 형식도 그대로 사용)
    const formatCustomerName = (name) => {
      if (!name) return '';
      return name.trim(); // VIP 형식이어도 그대로 반환
    };

    // 전체 수신자 messages 구성 (개인화 적용)
    const allMessages = uniqueToSend.map(num => {
      let personalizedMessage = finalMessage;
      
      // 이름 변수 치환
      if (hasNameVariable) {
        const normalized = normalizePhone(num);
        const formatted = formatPhone(normalized);
        const customerName = customerNameMap.get(normalized) || 
                             customerNameMap.get(formatted) || 
                             customerNameMap.get(num) || 
                             '';
        
        // 이름 처리 (VIP 형식도 그대로 사용)
        const formattedName = formatCustomerName(customerName);
        
        // 변수 치환: {name} → "이름+호칭" 또는 "호칭만"
        const nameWithHonorific = formattedName 
          ? `${formattedName}${honorific}` 
          : honorific;
        
        personalizedMessage = personalizedMessage
          .replace(/\{name\}/g, nameWithHonorific)
          .replace(/\{고객명\}/g, nameWithHonorific)
          .replace(/\{\{name\}\}/g, nameWithHonorific);
      }
      
      return {
        to: num,
        from: fromNumber,
        text: personalizedMessage,
        type: solapiType,
        ...(solapiType === 'MMS' && solapiImageId ? { imageId: solapiImageId } : {})
      };
    });

    // MMS인데 이미지가 없으면 LMS로 변경
    if (solapiType === 'MMS' && !solapiImageId) {
      for (const m of allMessages) m.type = 'LMS';
    }

    // 200건씩 청크 전송 및 응답 집계 (부분 성공 처리)
    const chunkSize = 200;
    let aggregated = { groupIds: [], messageResults: [], successCount: 0, failCount: 0 };
    const chunkErrors = []; // 실패한 청크 정보 저장
    const totalChunks = Math.ceil(allMessages.length / chunkSize);
    
    for (let i = 0; i < allMessages.length; i += chunkSize) {
      const chunkIndex = Math.floor(i / chunkSize) + 1;
      const chunk = allMessages.slice(i, i + chunkSize);
      const payload = { messages: chunk };
      
      try {
        const resp = await fetch('https://api.solapi.com/messages/v4/send-many/detail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify(payload)
        });
        const json = await resp.json();
        console.log(`Solapi chunk ${chunkIndex}/${totalChunks} 응답:`, json);
        
        // ⭐ 추가: Solapi API 응답에서 errorMessage 확인 (HTTP 200이어도 errorMessage가 있을 수 있음)
        if (json.errorMessage || json.error || (json.statusCode && json.statusCode !== '2000')) {
          const errorMessage = json.errorMessage || json.error || `Solapi API 오류: ${json.statusCode || 'UNKNOWN'}`;
          console.error(`❌ Solapi API 오류 (청크 ${chunkIndex}):`, {
            errorMessage,
            statusCode: json.statusCode,
            errorCode: json.errorCode,
            fullResponse: json
          });
          
          // "No valid session" 오류는 인증 문제이므로 모든 청크 실패 처리
          if (errorMessage.includes('No valid session') || 
              errorMessage.includes('인증') || 
              errorMessage.includes('authentication') ||
              errorMessage.includes('session')) {
            console.error('🔴 인증 오류 감지: Solapi API 키/시크릿을 확인해주세요.');
            // 인증 오류는 모든 청크를 실패 처리
            chunkErrors.push({
              chunkIndex,
              status: resp.status,
              error: { errorMessage, statusCode: json.statusCode, errorCode: json.errorCode },
              messageCount: chunk.length,
              range: `${i + 1}-${Math.min(i + chunkSize, allMessages.length)}`,
              isAuthError: true
            });
            
            // 실패한 청크의 메시지들을 failCount에 추가
            aggregated.failCount += chunk.length;
            chunk.forEach((msg, idx) => {
              aggregated.messageResults.push({
                to: msg.to,
                status: 'failed',
                errorCode: json.errorCode || 'AUTH_ERROR',
                errorMessage: errorMessage
              });
            });
            
            continue; // 다음 청크 계속 진행 (하지만 인증 오류는 모든 청크가 실패할 것)
          }
          
          // 일반 오류 처리 (기존 로직)
          const failedGroupId = json.groupInfo?.groupId || json.groupId || json.group_id || null;
          if (failedGroupId) {
            console.log(`⚠️ 청크 ${chunkIndex} 실패했지만 그룹 ID 발견: ${failedGroupId}`);
            aggregated.groupIds.push(failedGroupId);
          }
          
          const errorInfo = {
            chunkIndex,
            status: resp.status,
            error: { errorMessage, statusCode: json.statusCode, errorCode: json.errorCode },
            messageCount: chunk.length,
            range: `${i + 1}-${Math.min(i + chunkSize, allMessages.length)}`,
            groupId: failedGroupId || undefined
          };
          chunkErrors.push(errorInfo);
          console.error(`❌ 청크 ${chunkIndex} 발송 실패:`, errorInfo);
          
          aggregated.failCount += chunk.length;
          chunk.forEach((msg, idx) => {
            aggregated.messageResults.push({
              to: msg.to,
              status: 'failed',
              errorCode: json.errorCode || 'CHUNK_ERROR',
              errorMessage: errorMessage
            });
          });
          
          continue;
        }
        
        if (!resp.ok) {
          // ⭐ 실패 응답에서도 그룹 ID 추출 시도 (잔액 부족 등으로 실패해도 그룹 ID가 생성될 수 있음)
          const failedGroupId = json.groupInfo?.groupId || json.groupId || json.group_id || null;
          if (failedGroupId) {
            console.log(`⚠️ 청크 ${chunkIndex} 실패했지만 그룹 ID 발견: ${failedGroupId}`);
            aggregated.groupIds.push(failedGroupId);
          }
          
          // 청크 실패 시 오류 기록하지만 계속 진행
          const errorInfo = {
            chunkIndex,
            status: resp.status,
            error: json,
            messageCount: chunk.length,
            range: `${i + 1}-${Math.min(i + chunkSize, allMessages.length)}`,
            groupId: failedGroupId || undefined
          };
          chunkErrors.push(errorInfo);
          console.error(`❌ 청크 ${chunkIndex} 발송 실패:`, errorInfo);
          
          // 실패한 청크의 메시지들을 failCount에 추가
          aggregated.failCount += chunk.length;
          
          // 실패한 메시지들을 messageResults에 추가 (status: 'failed')
          chunk.forEach((msg, idx) => {
            aggregated.messageResults.push({
              to: msg.to,
              status: 'failed',
              errorCode: json.errorCode || 'CHUNK_ERROR',
              errorMessage: json.errorMessage || `청크 ${chunkIndex} 발송 실패`
            });
          });
          
          continue; // 다음 청크 계속 진행
        }
        
        // 성공한 청크 처리
        // 다양한 응답 형식에서 그룹 ID 추출
        const groupId = json.groupInfo?.groupId || 
                        json.groupId || 
                        json.group_id || 
                        json.data?.groupId ||
                        null;
        
        if (groupId) {
          aggregated.groupIds.push(groupId);
          console.log(`✅ 청크 ${chunkIndex} 그룹 ID 추출 성공: ${groupId}`);
        } else {
          console.warn(`⚠️ 청크 ${chunkIndex} 그룹 ID를 찾을 수 없음. 응답 구조:`, JSON.stringify(json).substring(0, 300));
        }
        
        aggregated.messageResults.push(...(json.messages || []));
        
        // groupInfo의 카운트가 없으면 messages 배열의 개수로 추정
        const chunkSuccessCount = json.groupInfo?.successCount || 
          (json.messages?.filter(m => (m.status || '').toLowerCase() !== 'failed').length || 0);
        const chunkFailCount = json.groupInfo?.failCount || 
          (json.messages?.filter(m => (m.status || '').toLowerCase() === 'failed').length || 0);
        
        aggregated.successCount += chunkSuccessCount;
        aggregated.failCount += chunkFailCount;
        
        console.log(`✅ 청크 ${chunkIndex} 발송 성공: ${chunkSuccessCount}건 성공, ${chunkFailCount}건 실패`);
        
      } catch (chunkError) {
        // 네트워크 오류 등 예외 처리
        const errorInfo = {
          chunkIndex,
          error: chunkError.message,
          messageCount: chunk.length,
          range: `${i + 1}-${Math.min(i + chunkSize, allMessages.length)}`
        };
        chunkErrors.push(errorInfo);
        console.error(`❌ 청크 ${chunkIndex} 예외 발생:`, errorInfo);
        
        // 실패한 청크의 메시지들을 failCount에 추가
        aggregated.failCount += chunk.length;
        
        // 실패한 메시지들을 messageResults에 추가
        chunk.forEach((msg) => {
          aggregated.messageResults.push({
            to: msg.to,
            status: 'failed',
            errorCode: 'NETWORK_ERROR',
            errorMessage: chunkError.message
          });
        });
      }
    }
    
    // 부분 성공 여부 확인
    const hasPartialSuccess = aggregated.successCount > 0 && aggregated.failCount > 0;
    const allFailed = aggregated.successCount === 0 && aggregated.failCount > 0;
    const allSuccess = aggregated.failCount === 0 && aggregated.successCount > 0;

    // per-recipient 로그 및 연락 이벤트 기록 (고객 매핑은 후속 단계에서 강화)
    try {
      const nowIso = new Date().toISOString();
      
      // ⭐ recipient_numbers를 직접 사용하여 모든 수신자에 대해 로그 생성
      // messageResults와 매칭하여 정확한 상태 사용
      const messageResultMap = new Map();
      aggregated.messageResults.forEach(r => {
        if (r.to) {
          const normalized = r.to.replace(/[\-\s]/g, '');
          messageResultMap.set(normalized, r);
        }
      });
      
      // ⭐ 모든 수신자에 대해 로그 생성 (messageResults에 없는 경우도 포함)
      const logsToInsert = uniqueToSend.map(phone => {
        const normalized = phone.replace(/[\-\s]/g, '');
        const result = messageResultMap.get(normalized);
        
        return {
          content_id: String(channelPostId),
          customer_phone: normalized,
          customer_id: null,
          message_type: (solapiType || 'SMS').toLowerCase(),
          status: result?.status || 'sent', // messageResults에 있으면 정확한 상태, 없으면 기본값
          channel: 'solapi',
          sent_at: nowIso
        };
      });
      
      if (logsToInsert.length) {
        // 동일 content_id+phone은 1회만 기록(재시도 시 갱신)
        const { error: logErr } = await supabase
          .from('message_logs')
          .upsert(logsToInsert, { onConflict: 'content_id,customer_phone' });
        if (logErr) {
          console.error('message_logs 적재 오류:', logErr);
        } else {
          console.log(`✅ message_logs 저장 완료: ${logsToInsert.length}건 (수신자: ${uniqueToSend.length}명)`);
        }
      }
      const successCount = aggregated.messageResults.filter(r => (r.status || '').toLowerCase() !== 'failed').length;
      if (successCount > 0) {
        const { error: ceErr } = await supabase.from('contact_events').insert([
          {
            customer_id: null,
            occurred_at: nowIso,
            direction: 'outbound',
            channel: 'sms',
            note: `발송 ${successCount}건 (groupIds: ${aggregated.groupIds.filter(Boolean).join(',')})`,
            source: 'system'
          }
        ]);
        if (ceErr) console.error('contact_events 적재 오류:', ceErr);
      }
    } catch (e) {
      console.error('per-recipient 로깅 오류:', e);
    }

    // 발송 결과를 데이터베이스에 저장/업데이트 (부분 성공도 처리)
    // 그룹 ID가 있고 성공 건수가 있으면 성공으로 간주
    const hasGroupIds = aggregated.groupIds.length > 0;
    const finalStatus = hasGroupIds && aggregated.successCount > 0 
      ? 'sent' 
      : (hasPartialSuccess ? 'partial' : (hasGroupIds ? 'sent' : 'failed'));
    
    console.log('[send] 상태 결정:', {
      allSuccess,
      hasPartialSuccess,
      hasGroupIds,
      groupIdsCount: aggregated.groupIds.length,
      successCount: aggregated.successCount,
      failCount: aggregated.failCount,
      finalStatus,
    });
    
    // ⭐ 수정: channelPostId가 UUID인지 확인 (UUID 형식: 8-4-4-4-12)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(channelPostId);
    
    // ⭐ 기존 레코드 조회 (재전송 시 기존 그룹 ID 유지)
    let existingMessage = null;
    let existingGroupIds = [];
    
    if (isUUID) {
      // UUID인 경우: solapi_group_id로 기존 메시지 찾기 (나중에 그룹 ID가 연결되면)
      // 또는 새로 생성 (id는 자동 생성)
      console.log('[send] channelPostId가 UUID 형식입니다. 새 메시지로 생성합니다:', channelPostId);
    } else {
      // UUID가 아닌 경우: id로 기존 메시지 찾기
    try {
        const { data: existing, error: checkError } = await supabase
        .from('channel_sms')
          .select('id, solapi_group_id, created_at')
        .eq('id', channelPostId)
          .maybeSingle();
      
        if (!checkError && existing) {
          existingMessage = existing;
          if (existing.solapi_group_id) {
            existingGroupIds = existing.solapi_group_id
          .split(',')
          .map(g => g.trim())
          .filter(Boolean);
        console.log(`📋 기존 그룹 ID 발견: ${existingGroupIds.length}개`);
          }
      }
    } catch (e) {
        console.error('기존 레코드 조회 오류 (무시하고 진행):', e);
      }
    }
    
    // ⭐ 새 그룹 ID와 기존 그룹 ID 병합 (중복 제거)
    const newGroupIds = aggregated.groupIds.filter(Boolean);
    const allGroupIds = [...new Set([...existingGroupIds, ...newGroupIds])]; // 중복 제거
    const groupIdsString = allGroupIds.length > 0 ? allGroupIds.join(',') : null;
    
    if (existingGroupIds.length > 0 && newGroupIds.length > 0) {
      console.log(`✅ 재전송 감지: 기존 ${existingGroupIds.length}개 + 새 ${newGroupIds.length}개 = 총 ${allGroupIds.length}개 그룹 ID`);
    }
    
    // ⭐ 그룹별 상세 정보 수집 (발송 직후 가능한 정보만)
    const groupStatuses = [];
    for (let i = 0; i < allGroupIds.length; i++) {
      const groupId = allGroupIds[i];
      // 청크별로 발송된 메시지 수 계산 (대략적인 추정)
      const chunkSize = 200; // 기본 청크 크기
      const startIndex = i * chunkSize;
      const endIndex = Math.min((i + 1) * chunkSize, uniqueToSend.length);
      const estimatedCount = endIndex - startIndex;
      
      // 발송 직후에는 정확한 성공/실패 건수를 알 수 없으므로, 나중에 업데이트될 수 있도록 기본값 설정
      groupStatuses.push({
        groupId: groupId,
        successCount: 0, // 나중에 업데이트됨
        failCount: 0, // 나중에 업데이트됨
        totalCount: estimatedCount,
        sendingCount: estimatedCount, // 발송 직후에는 모두 발송중으로 간주
        lastSyncedAt: new Date().toISOString()
      });
    }
    
    // ⭐ UPSERT 사용 (레코드가 없으면 INSERT, 있으면 UPDATE)
    const now = new Date().toISOString();
    const upsertData = {
      message_type: solapiType || 'MMS',
      message_text: messageContent,
      recipient_numbers: uniqueToSend,
        status: finalStatus,
        solapi_group_id: groupIdsString, // 모든 그룹 ID 저장 (콤마 구분)
        solapi_message_id: null,
      sent_at: now,
        sent_count: uniqueToSend.length,
        success_count: aggregated.successCount,
        fail_count: aggregated.failCount,
      group_statuses: groupStatuses, // ⭐ 그룹별 상세 정보 저장 (초기값)
      message_category: messageCategory || null, // 메시지 카테고리 저장
      message_subcategory: messageSubcategory || null, // 메시지 서브 카테고리 저장
      updated_at: now,
    };
    
    // ⭐ 수정: channelPostId가 UUID인 경우 id를 지정하지 않고 자동 생성
    // UUID가 아닌 경우에만 id 지정
    if (!isUUID && existingMessage && existingMessage.id) {
      // 기존 메시지가 있고 UUID가 아닌 경우: id로 업데이트
      upsertData.id = existingMessage.id;
    }
    
    // 새 레코드인 경우에만 created_at 설정
    if (!existingMessage) {
      upsertData.created_at = now;
    }
    
    // ⭐ 수정: UPSERT 로직
    let upsertResult;
    let upsertError;
    
    if (!isUUID && existingMessage && existingMessage.id) {
      // 기존 메시지가 있고 UUID가 아닌 경우: id로 업데이트
      const { data, error } = await supabase
        .from('channel_sms')
        .update(upsertData)
        .eq('id', existingMessage.id)
        .select();
      upsertResult = data;
      upsertError = error;
    } else {
      // 새 메시지 생성 (id는 자동 생성, UUID인 경우도 여기서 처리)
      const { data, error } = await supabase
        .from('channel_sms')
        .insert(upsertData)
        .select();
      upsertResult = data;
      upsertError = error;
    }

    if (upsertError) {
      console.error('[send] channel_sms UPSERT 오류:', {
        error: upsertError,
        errorCode: upsertError.code,
        errorMessage: upsertError.message,
        errorDetails: upsertError.details,
        errorHint: upsertError.hint,
        channelPostId,
        isUUID,
        existingMessage: existingMessage ? { id: existingMessage.id } : null,
        upsertData: {
          ...upsertData,
          message_text: upsertData.message_text?.substring(0, 50) + '...',
          id: upsertData.id || '(자동 생성)',
        },
      });
      
      // 에러 응답에 포함 (발송은 성공했을 수 있으므로)
      return res.status(500).json({
        success: false,
        message: '메시지 발송은 성공했지만 데이터베이스 저장에 실패했습니다.',
        error: upsertError.message,
        errorCode: upsertError.code,
        errorDetails: upsertError.details,
        result: {
          groupIds: aggregated.groupIds,
          sentCount: uniqueToSend.length,
          successCount: aggregated.successCount,
          failCount: aggregated.failCount,
        },
      });
    } else {
      console.log(`✅ channel_sms ${existingMessage ? '업데이트' : '생성'} 완료:`, {
        id: channelPostId,
        status: finalStatus,
        solapi_group_id: groupIdsString,
        successCount: aggregated.successCount,
        failCount: aggregated.failCount,
      });
    }

    // 발송 후 자동 검증: 그룹 ID가 누락되었는지 확인 (비동기로 실행, 응답은 기다리지 않음)
    if (groupIdsString && allGroupIds.length > 0) {
      // 백그라운드에서 실행 (응답을 기다리지 않음)
      setTimeout(async () => {
        try {
          // 발송된 수신자 수와 그룹 ID 개수 비교
          const expectedGroups = Math.ceil(uniqueToSend.length / 200); // 200명당 1개 그룹
          const actualGroups = allGroupIds.length;
          
          if (actualGroups < expectedGroups && uniqueToSend.length > 200) {
            console.warn(`⚠️ 그룹 ID 누락 가능성 감지:`);
            console.warn(`   수신자: ${uniqueToSend.length}명`);
            console.warn(`   예상 그룹 수: ${expectedGroups}개`);
            console.warn(`   실제 그룹 수: ${actualGroups}개`);
            console.warn(`   저장된 그룹 IDs: ${groupIdsString}`);
            console.warn(`   💡 솔라피 콘솔에서 확인하거나 수동 동기화를 권장합니다.`);
          } else {
            console.log(`✅ 그룹 ID 검증 완료: ${actualGroups}개 그룹 (예상: ${expectedGroups}개)`);
          }
        } catch (verifyError) {
          console.error('그룹 ID 자동 검증 오류:', verifyError);
        }
      }, 5000); // 5초 후 실행 (발송 완료 대기)
    }

    // AI 사용량 로그에도 SMS 발송 기록 추가
    try {
      const smsCost = validNumbers.length * 0.02; // SMS 1건당 0.02달러 가정
      const { error: aiLogError } = await supabase
        .from('ai_usage_logs')
        .insert([{
          api_endpoint: 'solapi-sms',
          model: 'SMS',
          input_tokens: 0,
          output_tokens: 0,
          total_tokens: 0,
          cost: smsCost,
          improvement_type: 'sms-send-success',
          content_type: 'sms',
          user_agent: 'sms-sender',
          ip_address: null,
          created_at: new Date().toISOString()
        }]);

      if (aiLogError) {
        console.error('AI 사용량 로그 저장 오류:', aiLogError);
      }
    } catch (logError) {
      console.error('AI 사용량 로깅 중 예외:', logError);
    }

    // ⭐ 인증 오류 확인
    const hasAuthError = chunkErrors.some(e => e.isAuthError);
    
    if (hasAuthError) {
      console.error('🔴 Solapi 인증 오류가 발생했습니다. API 키/시크릿을 확인해주세요.');
      return res.status(500).json({
        success: false,
        message: 'Solapi 인증 오류: API 키/시크릿을 확인해주세요. (No valid session)',
        result: {
          groupIds: aggregated.groupIds,
          sentCount: uniqueToSend.length,
          successCount: aggregated.successCount,
          failCount: aggregated.failCount,
          totalChunks: totalChunks,
          failedChunks: chunkErrors.length,
          chunkErrors: chunkErrors.filter(e => e.isAuthError).map(e => ({
            chunkIndex: e.chunkIndex,
            errorMessage: e.error?.errorMessage || '인증 오류',
            statusCode: e.error?.statusCode,
            errorCode: e.error?.errorCode
          }))
        },
        authError: true,
        hint: '환경 변수 SOLAPI_API_KEY와 SOLAPI_API_SECRET을 확인해주세요.'
      });
    }

    // 응답 메시지 결정
    let responseMessage = 'SMS가 성공적으로 발송되었습니다.';
    let responseStatus = 200;
    
    if (hasPartialSuccess) {
      responseMessage = `부분 성공: ${aggregated.successCount}건 발송 성공, ${aggregated.failCount}건 실패`;
      responseStatus = 207; // Multi-Status (부분 성공)
    } else if (allFailed) {
      responseMessage = `발송 실패: 모든 메시지 발송에 실패했습니다.`;
      responseStatus = 500;
    }
    
    return res.status(responseStatus).json({
      success: !allFailed, // 부분 성공도 success: true
      result: {
        groupIds: aggregated.groupIds,
        sentCount: uniqueToSend.length,
        successCount: aggregated.successCount,
        failCount: aggregated.failCount,
        totalChunks: totalChunks,
        failedChunks: chunkErrors.length,
        chunkErrors: chunkErrors.length > 0 ? chunkErrors : undefined
      },
      duplicates: candidates.length - uniqueToSend.length,
      message: responseMessage,
      solapiResponse: aggregated,
      warnings: chunkErrors.length > 0 ? `일부 청크 발송 실패: ${chunkErrors.length}개 청크` : undefined
    });

  } catch (error) {
    console.error('SMS 발송 오류:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      requestData: {
        channelPostId: req.body.channelPostId,
        messageType: req.body.messageType,
        recipientCount: req.body.recipientNumbers?.length
      }
    });

    // 발송 실패 시 상태 저장/업데이트 (UPSERT 사용)
    if (req.body.channelPostId) {
      try {
        // ⭐ 수정: channelPostId가 UUID인지 확인
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.body.channelPostId);
        
        const now = new Date().toISOString();
        const failData = {
          message_type: req.body.messageType || 'MMS',
          message_text: req.body.messageText || req.body.content || '',
          recipient_numbers: req.body.recipientNumbers || [],
          status: 'failed',
          sent_at: now,
          fail_count: req.body.recipientNumbers?.length || 0,
          success_count: 0,
          message_category: req.body.messageCategory || null,
          message_subcategory: req.body.messageSubcategory || null,
          updated_at: now,
        };
        
        let existing = null;
        if (!isUUID) {
          // UUID가 아닌 경우에만 기존 레코드 확인
          const { data } = await supabase
            .from('channel_sms')
            .select('id, created_at')
            .eq('id', req.body.channelPostId)
            .maybeSingle();
          existing = data;
        }
        
        // ⭐ 수정: UUID가 아닌 경우에만 id 지정
        if (!isUUID && existing && existing.id) {
          failData.id = existing.id;
        }
        
        if (!existing) {
          failData.created_at = now;
        }
        
        // ⭐ 수정: UUID 처리
        let upsertFailError;
        if (!isUUID && existing && existing.id) {
          // 기존 메시지가 있고 UUID가 아닌 경우: id로 업데이트
          const { error } = await supabase
            .from('channel_sms')
            .update(failData)
            .eq('id', existing.id);
          upsertFailError = error;
        } else {
          // 새 메시지 생성 (id는 자동 생성, UUID인 경우도 여기서 처리)
          const { error } = await supabase
          .from('channel_sms')
            .insert(failData);
          upsertFailError = error;
        }
        
        if (upsertFailError) {
          console.error('SMS 실패 상태 저장/업데이트 오류:', upsertFailError);
        } else {
          console.log(`✅ channel_sms 실패 레코드 ${existing ? '업데이트' : '생성'} 완료: ${req.body.channelPostId}`);
        }
      } catch (updateError) {
        console.error('SMS 실패 상태 저장/업데이트 오류:', updateError);
      }
    }

    // SMS 발송 실패도 AI 사용량 로그에 기록
    try {
      const smsCost = (req.body.recipientNumbers?.length || 0) * 0.02;
      const { error: aiLogError } = await supabase
        .from('ai_usage_logs')
        .insert([{
          api_endpoint: 'solapi-sms',
          model: 'SMS',
          input_tokens: 0,
          output_tokens: 0,
          total_tokens: 0,
          cost: smsCost,
          improvement_type: 'sms-send-failed',
          content_type: 'sms',
          user_agent: 'sms-sender',
          ip_address: null,
          created_at: new Date().toISOString()
        }]);

      if (aiLogError) {
        console.error('AI 사용량 로그 저장 오류:', aiLogError);
      }
    } catch (logError) {
      console.error('AI 사용량 로깅 중 예외:', logError);
    }

    // 솔라피 API 오류인 경우 더 구체적인 메시지 제공
    let errorMessage = 'SMS 발송 중 오류가 발생했습니다.';
    if (error.message.includes('401')) {
      errorMessage = 'SMS 서비스 인증에 실패했습니다. API 키를 확인해주세요.';
    } else if (error.message.includes('400')) {
      errorMessage = 'SMS 요청 형식이 올바르지 않습니다.';
    } else if (error.message.includes('errorList')) {
      errorMessage = `SMS 발송 실패: ${error.message}`;
    }

    return res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message,
      details: error.response?.data
    });  }
}
