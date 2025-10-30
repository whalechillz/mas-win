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
    const providedSecret = req.headers['x-solapi-secret'];
    if (expectedSecret && expectedSecret.length > 0) {
      if (!providedSecret || String(providedSecret) !== String(expectedSecret)) {
        return res.status(401).json({ success: false, message: 'invalid webhook secret' });
      }
    }

    const payload = req.body || {};
    // Solapi의 콜백은 다양한 포맷이 가능하므로, 우선 원본을 기록
    console.log('Solapi webhook payload:', payload);

    // 간단 요약 정보 작성
    const events = Array.isArray(payload.messages) ? payload.messages : [payload];
    const successCnt = events.filter(e => String(e.status || '').toLowerCase() === 'delivered').length;
    const failCnt = events.filter(e => String(e.status || '').toLowerCase() === 'failed').length;

    const note = `Solapi 웹훅 수신 - delivered:${successCnt}, failed:${failCnt}`;
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
    if (ceErr) console.error('webhook contact_events 적재 오류:', ceErr);

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('Solapi webhook 처리 오류:', e);
    return res.status(500).json({ success: false, message: 'webhook 처리 오류', error: e.message });
  }
}


