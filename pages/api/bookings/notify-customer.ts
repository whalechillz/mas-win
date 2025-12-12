import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { createSolapiSignature } from '../../../utils/solapiSignature';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Solapi API 설정
const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || '';
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || '';
const SOLAPI_API_URL = 'https://api.solapi.com/messages/v4/send';

// 카카오톡 템플릿 코드
const KAKAO_TEMPLATE_CODES = {
  booking_received: 'm3A9EGCj2y', // 예약 접수 확인
  booking_confirmed: '2LTydmPnZX', // 예약 확정 안내 (버튼 포함 - 재등록 필요)
  booking_confirmed_detailed: null, // 시타 예약 안내 (상세, 버튼 포함) - 등록 필요
  booking_completed: null, // 아직 등록되지 않음 (SMS로 대체)
};

// SMS 메시지 템플릿 (카카오톡 실패 시 대체)
const SMS_TEMPLATES = {
  booking_received: `[마쓰구골프] {고객명}님, 시타 예약 요청이 접수되었습니다!

예약 가능 여부 확인 후 연락드리겠습니다.

📅 예약일시: {날짜} {시간}
🏌️ 한 번의 시타로 30m 비거리 증가를 직접 체험하세요!

자세한 정보: https://www.masgolf.co.kr/
문의: 031-215-0013`,
  booking_confirmed: `[마쓰구골프] {고객명}님, 예약이 확정되었습니다! 🎉



고객님만을 위해 특별히 준비한 맞춤형 분석과 시타 체험을 통해 최상의 경험을 선사해 드리겠습니다.

- 예약일시: {날짜} {시간}

- 장소: 마쓰구골프 수원 본점

- 약도 안내: https://www.masgolf.co.kr/contact

🏌️ 한 번의 시타로 30m 비거리 증가를 직접 체험하세요!

편한 복장으로 방문해 주세요.



마쓰구 수원본점 

문의: 031-215-0013`,
  booking_reminder_2h: `[마쓰구골프] {고객명}님, 안녕하세요! 오늘 {시간} 시타 예약이 있습니다.

고객님만을 위해 특별히 준비한 맞춤형 분석과 시타 체험을 통해 최상의 경험을 선사해 드리겠습니다. 준비해주세요!

📍 약도: https://www.masgolf.co.kr/contact
문의: 031-215-0013`,
  booking_completed: `[마쓰구골프] {고객명}님, 시타 체험 감사합니다! 추가 문의사항이 있으시면 언제든 연락주세요. 다음 예약: https://masgolf.co.kr/try-a-massgoo 문의: 031-215-0013`,
};

// 로고 이미지 URL (환경변수 또는 기본값)
const LOGO_IMAGE_URL = process.env.BOOKING_LOGO_IMAGE_URL || '/main/brand/mas9golf-icon.svg';

// 날짜 포맷팅 (예: 2025-11-27 → 2025년 11월 27일)
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}년 ${month}월 ${day}일`;
  } catch {
    return dateStr;
  }
}

// 시간 포맷팅 (예: 14:00 → 오후 2시)
function formatTime(timeStr: string): string {
  try {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? '오후' : '오전';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${period} ${displayHour}시${minutes !== '00' ? ` ${minutes}분` : ''}`;
  } catch {
    return timeStr;
  }
}

// 메시지 템플릿 변수 치환
function replaceTemplateVariables(
  template: string,
  variables: {
    고객명: string;
    날짜: string;
    시간: string;
    서비스명: string;
  }
): string {
  let result = template;
  result = result.replace(/\{고객명\}/g, variables.고객명);
  result = result.replace(/\{날짜\}/g, variables.날짜);
  result = result.replace(/\{시간\}/g, variables.시간);
  result = result.replace(/\{서비스명\}/g, variables.서비스명);
  return result;
}

// 메시지 길이에 따라 자동으로 SMS/LMS/MMS 결정
function determineMessageType(text: string): 'SMS' | 'LMS' | 'MMS' {
  const estimatedBytes = Buffer.from(text, 'utf8').length;
  
  if (estimatedBytes <= 90) {
    return 'SMS';
  } else if (estimatedBytes <= 2000) {
    return 'LMS';
  } else {
    return 'MMS'; // 이미지 첨부 시
  }
}

// 이미지 URL을 Solapi imageId로 변환 (HTTP URL인 경우)
async function getSolapiImageId(imageUrl: string, baseUrl: string): Promise<string | null> {
  if (!imageUrl) return null;
  
  // 이미 Solapi imageId 형식인지 확인 (일반적으로 UUID 형식)
  if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
    return imageUrl; // 이미 imageId인 경우
  }
  
  try {
    // HTTP URL이면 Solapi에 재업로드
    const reuploadResponse = await fetch(`${baseUrl}/api/solapi/reupload-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: imageUrl,
        messageId: 'booking-confirmed-logo', // 임시 ID
      }),
    });
    
    if (reuploadResponse.ok) {
      const reuploadResult = await reuploadResponse.json();
      if (reuploadResult.success && reuploadResult.imageId) {
        return reuploadResult.imageId;
      }
    }
  } catch (error) {
    console.error('로고 이미지 Solapi 업로드 오류:', error);
  }
  
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { bookingId, notificationType, bookingData } = req.body;

    if (!bookingId || !notificationType) {
      return res.status(400).json({
        success: false,
        message: 'bookingId와 notificationType은 필수입니다.',
      });
    }

    if (!['booking_received', 'booking_confirmed', 'booking_completed'].includes(notificationType)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 notificationType입니다.',
      });
    }

    // 예약 정보 조회 (bookingData가 있으면 사용, 없으면 DB에서 조회)
    let booking;
    if (bookingData) {
      // 최신 예약 데이터를 직접 사용 (시간 변경 시 최신 정보 보장)
      booking = bookingData;
    } else {
      // 기존 방식: DB에서 조회
      const { data: bookingFromDb, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (bookingError || !bookingFromDb) {
        return res.status(404).json({
          success: false,
          message: '예약을 찾을 수 없습니다.',
        });
      }
      booking = bookingFromDb;
    }

    // 전화번호 정규화
    const phone = booking.phone?.replace(/[\s\-+]/g, '') || '';
    if (!phone || !/^010\d{8}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: '유효한 전화번호가 없습니다.',
      });
    }

    // 변수 준비
    const formattedDate = formatDate(booking.date);
    const formattedTime = formatTime(booking.time);
    const variables = {
      고객명: booking.name || '고객',
      날짜: formattedDate,
      시간: formattedTime,
      서비스명: booking.service_type || '마쓰구 드라이버 시타 서비스',
    };

    // 카카오톡 알림톡 발송 시도
    let kakaoSuccess = false;
    let kakaoError = null;
    const templateCode = KAKAO_TEMPLATE_CODES[notificationType as keyof typeof KAKAO_TEMPLATE_CODES];

    if (templateCode && SOLAPI_API_KEY && SOLAPI_API_SECRET) {
      try {
        // Solapi API 인증 헤더 생성
        const headers = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);

        // 카카오톡 알림톡 발송 요청
        const kakaoResponse = await fetch(SOLAPI_API_URL, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            message: {
              to: phone,
              from: '0312150013', // 발신번호
              text: '', // 템플릿 사용 시 빈 문자열
              type: 'ATA', // 알림톡 타입
              kakaoOptions: {
                pfId: '마쓰구골프', // 플러스친구 ID (채널명)
                templateId: templateCode,
                variables: {
                  '#{고객명}': variables.고객명,
                  '#{날짜}': variables.날짜,
                  '#{시간}': variables.시간,
                  '#{서비스명}': variables.서비스명,
                },
              },
            },
          }),
        });

        const kakaoResult = await kakaoResponse.json();
        if (kakaoResponse.ok && kakaoResult.statusCode === '2000') {
          kakaoSuccess = true;
        } else {
          kakaoError = kakaoResult.errorMessage || '카카오톡 발송 실패';
        }
      } catch (err: any) {
        kakaoError = err.message || '카카오톡 발송 중 오류 발생';
      }
    } else if (!templateCode) {
      kakaoError = '템플릿 코드가 등록되지 않았습니다.';
    } else {
      kakaoError = 'Solapi API 키가 설정되지 않았습니다.';
    }

    // 카카오톡 실패 시 SMS/LMS/MMS로 대체 발송
    let smsSuccess = false;
    let smsError = null;
    let messageType = 'SMS';
    let smsMessage = '';

    if (!kakaoSuccess) {
      try {
        const smsTemplate = SMS_TEMPLATES[notificationType as keyof typeof SMS_TEMPLATES];
        smsMessage = replaceTemplateVariables(smsTemplate, variables);

        // 메시지 타입 자동 결정
        messageType = determineMessageType(smsMessage);

        // 예약 확정 시 MMS로 로고 첨부
        let imageId: string | null = null;
        if (notificationType === 'booking_confirmed' && messageType === 'LMS') {
          // 예약 확정 시에는 MMS로 전환하여 로고 첨부
          messageType = 'MMS';
          const baseUrl = process.env.VERCEL_URL 
            ? `https://${process.env.VERCEL_URL}` 
            : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
          imageId = await getSolapiImageId(LOGO_IMAGE_URL, baseUrl);
        }

        // Solapi API 인증 헤더 생성
        const headers = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);

        // 메시지 발송 요청
        const messageData: any = {
          message: {
            to: phone,
            from: '0312150013', // 발신번호
            text: smsMessage,
            type: messageType,
          },
        };

        // MMS인 경우 이미지 첨부
        if (messageType === 'MMS' && imageId) {
          messageData.message.imageId = imageId;
        } else if (messageType === 'MMS' && !imageId) {
          // 이미지가 없으면 LMS로 변경
          messageType = 'LMS';
          messageData.message.type = 'LMS';
        }

        const smsResponse = await fetch(SOLAPI_API_URL, {
          method: 'POST',
          headers,
          body: JSON.stringify(messageData),
        });

        const smsResult = await smsResponse.json();
        if (smsResponse.ok && smsResult.statusCode === '2000') {
          smsSuccess = true;
          
          // channel_sms 테이블에 메시지 저장 (예약 관련 메시지 관리용)
          try {
            const insertData: any = {
              message_type: messageType,
              message_text: smsMessage,
              recipient_numbers: [phone],
              status: 'sent',
              sent_at: new Date().toISOString(),
              sent_count: 1,
              success_count: 1,
              fail_count: 0,
              solapi_group_id: smsResult.groupId || null,
              note: `예약 ${notificationType}: 예약 ID ${bookingId}, 고객 ${variables.고객명}`,
            };

            // metadata 컬럼이 있으면 예약 정보 저장
            try {
              insertData.metadata = {
                booking_id: bookingId,
                notification_type: notificationType,
                customer_id: booking.customer_id || null,
              };
            } catch (metaError) {
              // metadata 컬럼이 없으면 무시
              console.log('metadata 컬럼이 없거나 사용할 수 없습니다.');
            }

            const { error: saveError } = await supabase
              .from('channel_sms')
              .insert(insertData);
            
            if (saveError) {
              console.error('예약 메시지 channel_sms 저장 오류:', saveError);
              // 저장 실패해도 발송은 성공한 것으로 처리
            }
          } catch (saveErr: any) {
            console.error('예약 메시지 저장 중 오류:', saveErr);
            // 저장 실패해도 발송은 성공한 것으로 처리
          }
        } else {
          smsError = smsResult.errorMessage || `${messageType} 발송 실패`;
          
          // 실패한 메시지도 channel_sms에 저장 (이력 관리용)
          try {
            await supabase
              .from('channel_sms')
              .insert({
                message_type: messageType,
                message_text: smsMessage,
                recipient_numbers: [phone],
                status: 'failed',
                sent_at: new Date().toISOString(),
                sent_count: 1,
                success_count: 0,
                fail_count: 1,
                note: `예약 ${notificationType} 실패: 예약 ID ${bookingId}, 오류: ${smsError}`,
              });
          } catch (saveErr: any) {
            console.error('실패 메시지 저장 중 오류:', saveErr);
          }
        }
      } catch (err: any) {
        smsError = err.message || '메시지 발송 중 오류 발생';
        
        // 예외 발생 시에도 channel_sms에 저장
        try {
          await supabase
            .from('channel_sms')
            .insert({
              message_type: messageType,
              message_text: smsMessage,
              recipient_numbers: [phone],
              status: 'failed',
              sent_at: new Date().toISOString(),
              sent_count: 1,
              success_count: 0,
              fail_count: 1,
              note: `예약 ${notificationType} 예외: 예약 ID ${bookingId}, 오류: ${smsError}`,
            });
        } catch (saveErr: any) {
          console.error('예외 메시지 저장 중 오류:', saveErr);
        }
      }
    }

    // 결과 반환
    const finalSuccess = kakaoSuccess || smsSuccess;
    const channel = kakaoSuccess ? 'kakao' : smsSuccess ? 'sms' : 'none';

    return res.status(finalSuccess ? 200 : 500).json({
      success: finalSuccess,
      channel,
      kakao: {
        success: kakaoSuccess,
        error: kakaoError,
      },
      sms: {
        success: smsSuccess,
        error: smsError,
      },
      message: finalSuccess
        ? `${channel === 'kakao' ? '카카오톡' : messageType === 'MMS' ? 'MMS' : messageType === 'LMS' ? 'LMS' : 'SMS'} 알림이 발송되었습니다.`
        : '알림 발송에 실패했습니다.',
    });
  } catch (error: any) {
    console.error('예약 알림 발송 오류:', error);
    return res.status(500).json({
      success: false,
      message: error.message || '알림 발송 중 오류가 발생했습니다.',
    });
  }
}


