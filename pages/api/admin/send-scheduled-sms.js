import { createClient } from '@supabase/supabase-js';
import { createSolapiSignature } from '../../../utils/solapiSignature.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || "";
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || "";
const SOLAPI_SENDER = process.env.SOLAPI_SENDER || "";

export default async function handler(req, res) {
  // Vercel Cron Job에서 호출하는 경우 Authorization 헤더 확인
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  // Vercel Cron Job인지 확인 (x-vercel-cron 헤더가 있으면 Vercel에서 호출)
  const vercelCronHeader = req.headers['x-vercel-cron'];
  const isVercelCron = vercelCronHeader === '1';
  // Dry-run 모드 확인 (실제 발송 없이 테스트)
  const isDryRun = req.query.dryRun === 'true' || req.query['dry-run'] === 'true';
  
  // 크론 실행 여부 로깅 (디버깅용)
  const requestSource = isVercelCron ? '🔄 Vercel Cron (자동 실행)' : '👤 수동 호출';
  const runMode = isDryRun ? '🧪 DRY-RUN 모드 (실제 발송 안 함)' : '📤 실제 발송 모드';
  console.log(`\n${requestSource} - ${runMode} - ${new Date().toISOString()}`);
    if (isDryRun) {
      console.log(`   ⚠️ DRY-RUN 모드: 실제 Solapi API 호출을 건너뜁니다.`);
    }
  console.log(`   x-vercel-cron 헤더: ${vercelCronHeader || '없음'}`);
  console.log(`   요청 메서드: ${req.method}`);
  console.log(`   요청 호스트: ${req.headers.host || '알 수 없음'}`);
  
  // Vercel Cron은 자동으로 x-vercel-cron 헤더를 추가하므로 인증 불필요
  // 수동 호출 시에도 우선 작동하도록 허용 (긴급 상황 대응)
  // TODO: 프로덕션에서는 CRON_SECRET 검증 강화 필요
  if (!isVercelCron && cronSecret) {
    // CRON_SECRET이 설정되어 있고, Authorization 헤더가 있으면 검증
    if (authHeader && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
    }
    // CRON_SECRET이 설정되어 있지만 Authorization 헤더가 없으면 허용 (Vercel Cron 대응)
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 환경 변수 검증
    if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET || !SOLAPI_SENDER) {
      console.error('솔라피 환경 변수 누락');
      return res.status(500).json({ 
        success: false, 
        message: 'SMS 서비스 설정이 완료되지 않았습니다.' 
      });
    }

    // 현재 시간 (UTC)
    const now = new Date();
    const nowISO = now.toISOString();

    // 예약 시간이 있는 draft 메시지 조회
    // scheduled_at은 UTC로 저장되어야 하므로 ISO 문자열로 비교
    // Supabase가 'Z'를 제거하여 저장할 수 있으므로, 클라이언트 측에서 필터링
    const { data: allDraftMessages, error: fetchError } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('status', 'draft')
      .not('scheduled_at', 'is', null);
    
    // 클라이언트 측에서 시간 비교 (scheduled_at이 현재 시간 이하인 메시지만 필터링)
    const scheduledMessages = (allDraftMessages || []).filter(msg => {
      if (!msg.scheduled_at) return false;
      // scheduled_at을 Date 객체로 변환 (Supabase가 'Z'를 제거했을 수 있으므로 명시적으로 UTC로 해석)
      const scheduledAtStr = msg.scheduled_at.endsWith('Z') ? msg.scheduled_at : msg.scheduled_at + 'Z';
      const scheduledDate = new Date(scheduledAtStr);
      return !isNaN(scheduledDate.getTime()) && scheduledDate <= now;
    });
    
    // 디버깅: 현재 시간과 조회된 메시지 로그
    console.log(`📅 예약 발송 체크 (${nowISO}):`);
    if (scheduledMessages && scheduledMessages.length > 0) {
      console.log(`   발견된 예약 메시지: ${scheduledMessages.length}건`);
      scheduledMessages.forEach(msg => {
        console.log(`   - 메시지 ID ${msg.id}: 예약 시간 ${msg.scheduled_at} (현재: ${nowISO})`);
      });
    } else {
      console.log(`   발송할 예약 메시지 없음`);
    }

    if (fetchError) {
      console.error('예약 메시지 조회 오류:', fetchError);
      return res.status(500).json({ 
        success: false, 
        message: '예약 메시지 조회 실패',
        error: fetchError.message 
      });
    }

    if (!scheduledMessages || scheduledMessages.length === 0) {
      return res.status(200).json({ 
        success: true,
        message: '발송할 예약 메시지가 없습니다.',
        sent: 0,
        messages: []
      });
    }

    console.log(`📅 예약 발송 처리 시작: ${scheduledMessages.length}건`);

    const results = [];
    const authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);
    const fromNumber = SOLAPI_SENDER.replace(/[\-\s]/g, '');

    // 각 예약 메시지 처리
    for (const sms of scheduledMessages) {
      try {
        // 수신자 번호 파싱
        let recipientNumbers = [];
        if (sms.recipient_numbers) {
          if (Array.isArray(sms.recipient_numbers)) {
            recipientNumbers = sms.recipient_numbers;
          } else if (typeof sms.recipient_numbers === 'string') {
            try {
              recipientNumbers = JSON.parse(sms.recipient_numbers);
            } catch {
              recipientNumbers = [sms.recipient_numbers];
            }
          }
        }
        if (!recipientNumbers || recipientNumbers.length === 0) {
          console.warn(`⚠️ 메시지 ID ${sms.id}: 수신자 번호가 없습니다.`);
          // 수신자가 없으면 상태를 failed로 업데이트
          await supabase
            .from('channel_sms')
            .update({
              status: 'failed',
              scheduled_at: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', sms.id);
          results.push({
            id: sms.id,
            success: false,
            message: '수신자 번호가 없습니다.'
          });
          continue;
        }

        // 수신자 번호 형식 검증
        const validNumbers = recipientNumbers.filter(num => 
          /^010-\d{4}-\d{4}$/.test(num) || /^010\d{8}$/.test(num)
        );

        if (validNumbers.length === 0) {
          console.warn(`⚠️ 메시지 ID ${sms.id}: 유효한 수신자 번호가 없습니다.`);
          await supabase
            .from('channel_sms')
            .update({
              status: 'failed',
              scheduled_at: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', sms.id);
          results.push({
            id: sms.id,
            success: false,
            message: '유효한 수신자 번호가 없습니다.'
          });
          continue;
        }

        // 메시지 내용 구성
        let finalMessage = sms.message_text || '';
        if (sms.short_link) {
          finalMessage += `\n\n링크: ${sms.short_link}`;
        }

        // 메시지 타입 매핑
        const messageType = sms.message_type || 'SMS300';
        const solapiType = messageType === 'SMS300' ? 'LMS' : messageType;

        // 수신거부(Opt-out) 고객 제외
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
          console.warn(`⚠️ 메시지 ID ${sms.id}: 수신거부 제외 후 발송 가능한 수신자가 없습니다.`);
          await supabase
            .from('channel_sms')
            .update({
              status: 'failed',
              scheduled_at: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', sms.id);
          results.push({
            id: sms.id,
            success: false,
            message: '수신거부 제외 후 발송 가능한 수신자가 없습니다.'
          });
          continue;
        }

        // 동일 content_id로 이미 보낸 번호 제외
        let uniqueToSend = candidates;
        try {
          const { data: already } = await supabase
            .from('message_logs')
            .select('customer_phone')
            .eq('content_id', String(sms.id));
          if (already && already.length) {
            const sentSet = new Set(already.map(a => String(a.customer_phone)));
            uniqueToSend = candidates.filter(p => !sentSet.has(p));
          }
        } catch (e) {
          console.error('중복 체크 오류(무시하고 진행):', e);
        }

        if (uniqueToSend.length === 0) {
          console.warn(`⚠️ 메시지 ID ${sms.id}: 이미 모든 대상에게 발송되었습니다.`);
          await supabase
            .from('channel_sms')
            .update({
              status: 'sent',
              scheduled_at: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', sms.id);
          results.push({
            id: sms.id,
            success: true,
            message: '이미 모든 대상에게 발송되었습니다.',
            sentCount: 0
          });
          continue;
        }

        // ⭐ 이미지 URL 처리: HTTP URL이면 Solapi에 재업로드하여 imageId 획득
        let solapiImageId = sms.image_url || null;
        if (solapiType === 'MMS' && sms.image_url) {
          // HTTP URL인지 확인 (https:// 또는 http://로 시작)
          const isHttpUrl = /^https?:\/\//i.test(sms.image_url);
          
          if (isHttpUrl) {
            // HTTP URL이면 Solapi에 재업로드
            try {
              console.log(`🔄 메시지 ID ${sms.id}: HTTP URL 감지, Solapi에 재업로드 중:`, sms.image_url);
              const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://win.masgolf.co.kr';
              const reuploadResponse = await fetch(`${baseUrl}/api/solapi/reupload-image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  imageUrl: sms.image_url,
                  messageId: sms.id
                })
              });
              
              if (reuploadResponse.ok) {
                const reuploadResult = await reuploadResponse.json();
                if (reuploadResult.success && reuploadResult.imageId) {
                  solapiImageId = reuploadResult.imageId;
                  console.log(`✅ 메시지 ID ${sms.id}: Solapi 재업로드 성공, imageId:`, solapiImageId);
                } else {
                  console.warn(`⚠️ 메시지 ID ${sms.id}: Solapi 재업로드 실패, 원본 URL 사용:`, reuploadResult.message);
                }
              } else {
                console.warn(`⚠️ 메시지 ID ${sms.id}: Solapi 재업로드 API 오류, 원본 URL 사용`);
              }
            } catch (reuploadError) {
              console.error(`❌ 메시지 ID ${sms.id}: Solapi 재업로드 중 오류:`, reuploadError);
              // 재업로드 실패해도 계속 진행 (이미지 없이 발송 시도)
            }
          } else {
            // 이미 Solapi imageId인 경우 그대로 사용
            solapiImageId = sms.image_url;
          }
        }

        // Solapi 발송 메시지 구성
        const allMessages = uniqueToSend.map(num => ({
          to: num,
          from: fromNumber,
          text: finalMessage,
          type: solapiType,
          ...(solapiType === 'MMS' && solapiImageId ? { imageId: solapiImageId } : {})
        }));

        // MMS인데 이미지가 없으면 LMS로 변경
        if (solapiType === 'MMS' && !solapiImageId) {
          console.warn(`⚠️ 메시지 ID ${sms.id}: MMS인데 이미지가 없어 LMS로 변경`);
          for (const m of allMessages) m.type = 'LMS';
        }

        // 200건씩 청크 전송
        const chunkSize = 200;
        let aggregated = { groupIds: [], messageResults: [], successCount: 0, failCount: 0 };
        const totalChunks = Math.ceil(allMessages.length / chunkSize);

        for (let i = 0; i < allMessages.length; i += chunkSize) {
          const chunk = allMessages.slice(i, i + chunkSize);
          const chunkIndex = Math.floor(i / chunkSize) + 1;

          if (isDryRun) {
            // Dry-run 모드: 실제 API 호출 없이 시뮬레이션
            console.log(`🧪 [DRY-RUN] 메시지 ID ${sms.id} 청크 ${chunkIndex}/${totalChunks}: ${chunk.length}건 시뮬레이션`);
            // 시뮬레이션된 성공 응답
            aggregated.groupIds.push(`DRY-RUN-GROUP-${sms.id}-${chunkIndex}`);
            chunk.forEach((msg) => {
              aggregated.messageResults.push({
                to: msg.to,
                status: 'success',
                statusCode: '2000',
                messageId: `DRY-RUN-MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
              });
            });
            aggregated.successCount += chunk.length;
          } else {
            try {
              const solapiResponse = await fetch('https://api.solapi.com/messages/v4/send-many', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...authHeaders
                },
                body: JSON.stringify({
                  messages: chunk,
                  allowDuplicates: false
                })
              });

              const solapiResult = await solapiResponse.json();

              if (!solapiResponse.ok) {
                throw new Error(`Solapi API 오류: ${solapiResponse.status} - ${JSON.stringify(solapiResult)}`);
              }

              // 성공 처리
              if (solapiResult.groupId) {
                aggregated.groupIds.push(solapiResult.groupId);
              }
              if (solapiResult.results) {
                aggregated.messageResults.push(...solapiResult.results);
                aggregated.successCount += solapiResult.results.filter(r => 
                  r.statusCode === '2000' || r.status === 'success'
                ).length;
                aggregated.failCount += solapiResult.results.filter(r => 
                  r.statusCode !== '2000' && r.status !== 'success'
                ).length;
              } else {
                aggregated.successCount += chunk.length;
              }
            } catch (chunkError) {
            console.error(`❌ 메시지 ID ${sms.id} 청크 ${chunkIndex} 발송 실패:`, chunkError);
            aggregated.failCount += chunk.length;
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

        // 발송 로그 기록 (dry-run 모드에서는 건너뜀)
        const nowIso = new Date().toISOString();
        if (!isDryRun) {
          try {
          const logsToInsert = aggregated.messageResults.map((r, idx) => ({
            content_id: String(sms.id),
            customer_phone: uniqueToSend[idx] || null,
            customer_id: null,
            message_type: (solapiType || 'SMS').toLowerCase(),
            status: (r.status || 'sent'),
            channel: 'solapi',
            sent_at: nowIso
          }));
          if (logsToInsert.length) {
            await supabase
              .from('message_logs')
              .upsert(logsToInsert, { onConflict: 'content_id,customer_phone' });
          }
        } catch (e) {
          console.error('발송 로그 기록 오류:', e);
        }
        }

        // 상태 업데이트 (dry-run 모드에서는 건너뜀)
        const finalStatus = aggregated.failCount === 0 ? 'sent' : 
                          (aggregated.successCount > 0 ? 'partial' : 'failed');
        
        // 모든 그룹 ID를 콤마로 구분하여 저장
        const allGroupIds = aggregated.groupIds.filter(Boolean);
        const groupIdsString = allGroupIds.length > 0 ? allGroupIds.join(',') : null;
        
        if (!isDryRun) {
        
        await supabase
          .from('channel_sms')
          .update({
            status: finalStatus,
            solapi_group_id: groupIdsString, // 모든 그룹 ID 저장 (콤마 구분)
            sent_at: nowIso,
            sent_count: uniqueToSend.length,
            success_count: aggregated.successCount,
            fail_count: aggregated.failCount,
            // scheduled_at은 히스토리 보존을 위해 유지 (예약 시간 초기화하지 않음)
            updated_at: nowIso
          })
          .eq('id', sms.id);
        }

        results.push({
          id: sms.id,
          success: aggregated.successCount > 0,
          sentCount: aggregated.successCount,
          failCount: aggregated.failCount,
          groupId: groupIdsString // 모든 그룹 ID 반환
        });

        console.log(`✅ 메시지 ID ${sms.id} 발송 완료: 성공 ${aggregated.successCount}건, 실패 ${aggregated.failCount}건`);

      } catch (error) {
        console.error(`❌ 메시지 ID ${sms.id} 처리 오류:`, error);
        // 오류 발생 시 상태 업데이트
        await supabase
          .from('channel_sms')
          .update({
            status: 'failed',
            scheduled_at: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', sms.id);
        results.push({
          id: sms.id,
          success: false,
          message: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalSent = results.reduce((sum, r) => sum + (r.sentCount || 0), 0);

    return res.status(200).json({
      success: true,
      message: `${scheduledMessages.length}건 중 ${successCount}건 발송 완료`,
      sent: totalSent,
      results: results
    });

  } catch (error) {
    console.error('예약 발송 처리 오류:', error);
    return res.status(500).json({
      success: false,
      message: '예약 발송 처리 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}





