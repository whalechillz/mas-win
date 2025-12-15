/**
 * Solapi에 업로드된 이미지 목록 조회 API
 * channel_sms 테이블에서 Solapi imageId 목록을 조회
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { limit = 50, offset = 0, search } = req.query;

    // channel_sms에서 Solapi imageId 목록 조회 (ST01FZ로 시작하는 것들)
    let query = supabase
      .from('channel_sms')
      .select('id, image_url, message_text, created_at, message_type')
      .not('image_url', 'is', null)
      .like('image_url', 'ST01FZ%')
      .order('created_at', { ascending: false });

    // 검색어가 있으면 메시지 텍스트에서 검색
    if (search) {
      query = query.ilike('message_text', `%${search}%`);
    }

    // 페이지네이션
    const from = parseInt(offset);
    const to = from + parseInt(limit) - 1;
    query = query.range(from, to);

    const { data: messages, error } = await query;

    if (error) {
      console.error('❌ Solapi 이미지 목록 조회 오류:', error);
      return res.status(500).json({
        success: false,
        message: 'Solapi 이미지 목록 조회 중 오류가 발생했습니다.',
        error: error.message
      });
    }

    // 전체 개수 조회 (검색어 포함)
    let countQuery = supabase
      .from('channel_sms')
      .select('id', { count: 'exact', head: true })
      .not('image_url', 'is', null)
      .like('image_url', 'ST01FZ%');

    if (search) {
      countQuery = countQuery.ilike('message_text', `%${search}%`);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('❌ 전체 개수 조회 오류:', countError);
    }

    // 이미지 정보 변환
    const images = (messages || []).map(msg => ({
      id: msg.id,
      imageId: msg.image_url, // Solapi imageId
      url: `/api/solapi/get-image-preview?imageId=${msg.image_url}`, // 프리뷰 URL
      name: `메시지 #${msg.id} - ${msg.message_text?.substring(0, 30) || '이미지'}...`,
      folder_path: 'solapi',
      message_id: msg.id,
      message_text: msg.message_text,
      message_type: msg.message_type,
      created_at: msg.created_at,
      is_solapi: true // Solapi 이미지 표시
    }));

    return res.status(200).json({
      success: true,
      images,
      total: count || 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('❌ Solapi 이미지 목록 조회 중 오류:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Solapi 이미지 목록 조회 중 오류가 발생했습니다.'
    });
  }
}

