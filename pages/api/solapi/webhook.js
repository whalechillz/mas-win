import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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

    // 간단 요약 정보 작성
    const events = Array.isArray(payload.messages) ? payload.messages : [payload];
    const successCnt = events.filter(e => String(e.status || '').toLowerCase() === 'delivered').length;
    const failCnt = events.filter(e => String(e.status || '').toLowerCase() === 'failed').length;

    const note = `Solapi 웹훅 수신 - delivered:${successCnt}, failed:${failCnt}`;
    
    // Supabase에 기록 (에러가 나도 웹훅은 성공으로 처리)
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
      // DB 에러는 로그만 남기고 웹훅은 성공으로 처리
      console.error('웹훅 DB 적재 예외:', dbErr);
    }

    // 항상 200 응답 반환 (Solapi가 재시도하지 않도록)
    return res.status(200).json({ success: true, message: 'webhook processed' });
  } catch (e) {
    console.error('Solapi webhook 처리 예외:', e);
    // 예외 발생 시에도 200 응답 반환 (재시도 방지)
    return res.status(200).json({ success: false, message: 'webhook 처리 오류', error: e.message });
  }
}


