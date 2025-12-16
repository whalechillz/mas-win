import { createClient } from '@supabase/supabase-js';
import { createSolapiSignature } from '../../../utils/solapiSignature.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || "";
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || "";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '2mb'
    }
  }
};

export default async function handler(req, res) {
  // CORS 헤더 설정 (Solapi 요청 허용)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Solapi-Secret');

  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET 핑(헬스체크/브라우저 확인용) 지원 -> 200 반환
  if (req.method === 'GET') {
    return res.status(200).json({ success: true, message: 'solapi webhook ok' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // 선택적 Secret 헤더 검증 (대시보드에서 설정한 값과 비교)
    const expectedSecret = process.env.SOLAPI_WEBHOOK_SECRET;
    const providedSecret = req.headers['x-solapi-secret'] || req.headers['X-Solapi-Secret'];
    
    // Secret이 환경변수에 설정되어 있으면 반드시 검증
    if (expectedSecret && expectedSecret.length > 0) {
      const expectedTrimmed = String(expectedSecret).trim();
      const providedTrimmed = providedSecret ? String(providedSecret).trim() : '';
      
      if (!providedSecret || providedTrimmed !== expectedTrimmed) {
        console.error('웹훅 Secret 검증 실패:', {
          expectedLength: expectedTrimmed.length,
          expectedPreview: expectedTrimmed.substring(0, 10) + '...',
          providedLength: providedTrimmed.length,
          providedPreview: providedTrimmed.substring(0, 10) + '...',
          match: providedTrimmed === expectedTrimmed
        });
        return res.status(401).json({ success: false, message: 'invalid webhook secret' });
      }
      console.log('웹훅 Secret 검증 성공');
    } else {
      // Secret이 설정되지 않았으면 경고만 로그 (운영 환경에서는 권장하지 않음)
      console.warn('SOLAPI_WEBHOOK_SECRET 환경변수가 설정되지 않아 Secret 검증을 건너뜁니다.');
    }

    const payload = req.body || {};
    // Solapi의 콜백은 다양한 포맷이 가능하므로, 우선 원본을 기록
    console.log('Solapi webhook payload 수신:', JSON.stringify(payload).substring(0, 500));

    // 그룹 ID 추출 (payload에서 groupId 또는 groupId 필드 확인)
    const groupId = payload.groupId || payload.group_id || payload.groupInfo?.groupId || payload.message?.groupId || null;

    // 솔라피 Webhook은 다양한 형태로 올 수 있으므로, 그룹 통계를 직접 조회
    let successCnt = 0;
    let failCnt = 0;
    let totalCount = 0;
    let sendingCount = 0;

    // 1. payload에서 직접 통계 추출 시도
    if (payload.count) {
      successCnt = payload.count.successful || payload.count.success || 0;
      failCnt = payload.count.failed || payload.count.fail || 0;
      totalCount = payload.count.total || 0;
      sendingCount = payload.count.sending || (totalCount - successCnt - failCnt);
    } else if (payload.groupInfo?.count) {
      successCnt = payload.groupInfo.count.successful || payload.groupInfo.count.success || 0;
      failCnt = payload.groupInfo.count.failed || payload.groupInfo.count.fail || 0;
      totalCount = payload.groupInfo.count.total || 0;
      sendingCount = payload.groupInfo.count.sending || (totalCount - successCnt - failCnt);
    } else if (Array.isArray(payload.messages)) {
      // 개별 메시지 배열인 경우
      const events = payload.messages;
      successCnt = events.filter(e => String(e.status || '').toLowerCase() === 'delivered' || String(e.status || '').toLowerCase() === 'success').length;
      failCnt = events.filter(e => String(e.status || '').toLowerCase() === 'failed' || String(e.status || '').toLowerCase() === 'fail').length;
      totalCount = events.length;
      sendingCount = events.filter(e => String(e.status || '').toLowerCase() === 'sending' || String(e.status || '').toLowerCase() === 'pending').length;
    } else {
      // 단일 메시지인 경우
      const status = String(payload.status || '').toLowerCase();
      if (status === 'delivered' || status === 'success') {
        successCnt = 1;
        totalCount = 1;
      } else if (status === 'failed' || status === 'fail') {
        failCnt = 1;
        totalCount = 1;
      } else {
        sendingCount = 1;
        totalCount = 1;
      }
    }

    const note = `Solapi 웹훅 수신 - 성공:${successCnt}, 실패:${failCnt}, 발송중:${sendingCount}, 총:${totalCount}${groupId ? `, groupId:${groupId}` : ''}`;
    
    // 1. contact_events에 기록
    try {
      const { error: ceErr } = await supabase.from('contact_events').insert([
        {
          customer_id: null,
          occurred_at: new Date().toISOString(),
          direction: 'outbound',
          channel: 'sms',
          note,
          source: 'solapi'
        }
      ]);
      if (ceErr) {
        console.error('webhook contact_events 적재 오류:', ceErr);
      } else {
        console.log('웹훅 contact_events 적재 성공:', note);
      }
    } catch (dbErr) {
      console.error('웹훅 DB 적재 예외:', dbErr);
    }

    // 2. groupId가 있으면 channel_sms 상태 업데이트
    if (groupId) {
      try {
        console.log(`🔄 그룹 ID로 메시지 찾기: ${groupId}`);
        
        // solapi_group_id로 메시지 찾기
        const { data: messages, error: findError } = await supabase
          .from('channel_sms')
          .select('id, status, success_count, fail_count, sent_count, recipient_numbers')
          .eq('solapi_group_id', groupId);

        if (findError) {
          console.error('메시지 조회 오류:', findError);
        } else if (messages && messages.length > 0) {
          // 각 메시지에 대해 상태 업데이트
          for (const msg of messages) {
            // 현재 상태와 웹훅에서 받은 정보를 종합하여 업데이트
            const currentSuccess = msg.success_count || 0;
            const currentFail = msg.fail_count || 0;
            
            // 웹훅에서 받은 정보로 카운트 업데이트 (더 큰 값 사용 - 누적)
            const newSuccessCount = Math.max(currentSuccess, successCnt);
            const newFailCount = Math.max(currentFail, failCnt);
            const newTotalCount = totalCount > 0 ? totalCount : (newSuccessCount + newFailCount + sendingCount);

            // 상태 결정
            let newStatus = msg.status;
            if (sendingCount > 0) {
              newStatus = 'partial'; // 아직 발송 중
            } else if (failCnt === 0 && successCnt > 0) {
              newStatus = 'sent'; // 모두 성공
            } else if (successCnt === 0 && failCnt > 0) {
              newStatus = 'failed'; // 모두 실패
            } else if (successCnt > 0 && failCnt > 0) {
              newStatus = 'partial'; // 부분 성공
            } else if (newSuccessCount > 0 && newFailCount === 0) {
              newStatus = 'sent'; // 성공 카운트가 있으면 sent
            }

            const { error: updateError } = await supabase
              .from('channel_sms')
              .update({
                status: newStatus,
                success_count: newSuccessCount,
                fail_count: newFailCount,
                sent_count: newTotalCount,
                updated_at: new Date().toISOString()
              })
              .eq('id', msg.id);

            if (updateError) {
              console.error(`메시지 ID ${msg.id} 업데이트 오류:`, updateError);
            } else {
              console.log(`✅ 메시지 ID ${msg.id} 상태 업데이트: ${newStatus} (성공:${newSuccessCount}, 실패:${newFailCount}, 총:${newTotalCount})`);
            }
          }
        } else {
          console.log(`⚠️ 그룹 ID ${groupId}에 해당하는 메시지를 찾을 수 없습니다.`);
          
          // 그룹 ID로 찾지 못한 경우, 솔라피 API로 그룹 정보 조회 후 시간 기반 매칭
          let groupTime = payload.dateCreated || payload.dateSent || payload.groupInfo?.dateCreated || payload.groupInfo?.dateSent;
          
          // 웹훅에 시간 정보가 없으면 솔라피 API로 직접 조회
          if (!groupTime) {
            try {
              if (SOLAPI_API_KEY && SOLAPI_API_SECRET) {
                const authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);
                
                const groupInfoResponse = await fetch(
                  `https://api.solapi.com/messages/v4/groups/${groupId}`,
                  { method: 'GET', headers: authHeaders }
                );
                
                if (groupInfoResponse.ok) {
                  const groupInfoData = await groupInfoResponse.json();
                  const groupInfo = groupInfoData.groupInfo || groupInfoData;
                  groupTime = groupInfo.dateCreated || groupInfo.date_created || groupInfo.createdAt || groupInfo.created_at;
                  
                  if (groupTime) {
                    console.log(`✅ 솔라피 API로 그룹 생성 시간 조회: ${groupTime}`);
                  }
                }
              }
            } catch (apiError) {
              console.warn(`솔라피 API 조회 실패 (무시하고 계속):`, apiError.message);
            }
          }
          
          // 시간 기반으로 메시지 찾기
          if (groupTime) {
            try {
              const searchTime = new Date(groupTime);
              const startTime = new Date(searchTime.getTime() - 10 * 60 * 1000); // 10분 전 (범위 확대)
              const endTime = new Date(searchTime.getTime() + 10 * 60 * 1000); // 10분 후
              
              console.log(`🔍 시간 기반 메시지 검색: ${startTime.toISOString()} ~ ${endTime.toISOString()}`);
              
              // sent_at 시간 기준으로 메시지 찾기 (solapi_group_id가 null이거나 다른 그룹 ID를 가진 메시지)
              const { data: timeBasedMessages, error: timeFindError } = await supabase
                .from('channel_sms')
                .select('id, status, success_count, fail_count, sent_count, recipient_numbers, solapi_group_id')
                .gte('sent_at', startTime.toISOString())
                .lte('sent_at', endTime.toISOString())
                .order('sent_at', { ascending: false })
                .limit(10);
              
              if (timeFindError) {
                console.error('시간 기반 메시지 검색 오류:', timeFindError);
              } else if (timeBasedMessages && timeBasedMessages.length > 0) {
                // 가장 가까운 메시지에 그룹 ID 추가/업데이트
                const targetMessage = timeBasedMessages[0];
                const existingGroupIds = targetMessage.solapi_group_id 
                  ? targetMessage.solapi_group_id.split(',').map(g => g.trim()).filter(Boolean)
                  : [];
                
                // 새 그룹 ID가 없으면 추가
                if (!existingGroupIds.includes(groupId)) {
                  existingGroupIds.push(groupId);
                  const newGroupIdsString = existingGroupIds.join(',');
                  
                  console.log(`✅ 시간 기반으로 메시지 찾음: ID ${targetMessage.id}`);
                  console.log(`   기존 그룹 ID: ${targetMessage.solapi_group_id || '없음'}`);
                  console.log(`   새 그룹 ID 추가: ${newGroupIdsString}`);
                  
                  // 현재 상태와 웹훅에서 받은 정보를 종합하여 업데이트
                  const currentSuccess = targetMessage.success_count || 0;
                  const currentFail = targetMessage.fail_count || 0;
                  
                  const newSuccessCount = Math.max(currentSuccess, successCnt);
                  const newFailCount = Math.max(currentFail, failCnt);
                  const newTotalCount = totalCount > 0 ? totalCount : (newSuccessCount + newFailCount + sendingCount);
                  
                  // 상태 결정
                  let newStatus = targetMessage.status;
                  if (sendingCount > 0) {
                    newStatus = 'partial';
                  } else if (failCnt === 0 && successCnt > 0) {
                    newStatus = 'sent';
                  } else if (successCnt === 0 && failCnt > 0) {
                    newStatus = 'failed';
                  } else if (successCnt > 0 && failCnt > 0) {
                    newStatus = 'partial';
                  } else if (newSuccessCount > 0 && newFailCount === 0) {
                    newStatus = 'sent';
                  }
                  
                  const { error: updateError } = await supabase
                    .from('channel_sms')
                    .update({
                      solapi_group_id: newGroupIdsString,
                      status: newStatus,
                      success_count: newSuccessCount,
                      fail_count: newFailCount,
                      sent_count: newTotalCount,
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', targetMessage.id);
                  
                  if (updateError) {
                    console.error(`메시지 ID ${targetMessage.id} 업데이트 오류:`, updateError);
                  } else {
                    console.log(`✅ 메시지 ID ${targetMessage.id} 그룹 ID 추가 및 상태 업데이트: ${newStatus} (성공:${newSuccessCount}, 실패:${newFailCount}, 총:${newTotalCount})`);
                  }
                } else {
                  console.log(`ℹ️ 메시지 ID ${targetMessage.id}에 이미 그룹 ID ${groupId}가 포함되어 있습니다.`);
                }
              } else {
                console.log(`⚠️ 시간 기반 검색으로도 메시지를 찾을 수 없습니다.`);
              }
            } catch (timeSearchError) {
              console.error('시간 기반 메시지 검색 예외:', timeSearchError);
            }
          } else {
            console.log(`⚠️ 웹훅 payload에 시간 정보가 없고 솔라피 API로도 조회할 수 없어 시간 기반 검색을 할 수 없습니다.`);
          }
        }
      } catch (updateErr) {
        // 업데이트 오류는 로그만 남기고 웹훅은 성공으로 처리
        console.error('channel_sms 업데이트 예외:', updateErr);
      }
    } else {
      console.log('⚠️ 웹훅 payload에 groupId가 없어 channel_sms 업데이트를 건너뜁니다.');
      console.log('Payload 구조:', JSON.stringify(payload).substring(0, 500));
    }

    // 항상 200 응답 반환 (Solapi가 재시도하지 않도록)
    return res.status(200).json({ success: true, message: 'webhook processed' });
  } catch (e) {
    console.error('Solapi webhook 처리 예외:', e);
    // 예외 발생 시에도 200 응답 반환 (재시도 방지)
    return res.status(200).json({ success: false, message: 'webhook 처리 오류', error: e.message });
  }
}


