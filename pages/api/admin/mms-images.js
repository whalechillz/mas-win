import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  if (!supabase) {
    return res.status(500).json({
      success: false,
      message: 'Supabase 환경 변수가 설정되지 않았습니다.'
    });
  }

  const {
    messageId,
    date,
    folder,
    limit = 20,
    offset = 0
  } = req.query;

  try {
    let query = supabase
        .from('image_assets')
      .select('*')
      .eq('source', 'mms')
      .eq('channel', 'sms')
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (messageId) {
      const tag = `sms-${messageId}`;
      query = query.contains('tags', [tag]);
    }

    if (date) {
      query = query.eq('date_folder', date);
    }

    if (folder) {
      query = query.ilike('folder_path', `${folder}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      images: (data || []).map((item) => ({
        id: item.id,
        url: item.image_url,
        folderPath: item.folder_path,
        storagePath: item.original_path || item.folder_path,
        width: item.width,
        height: item.height,
        fileSize: item.file_size,
        dateFolder: item.date_folder,
        createdAt: item.created_at,
        tags: item.tags || []
      }))
    });
  } catch (error) {
    console.error('MMS 이미지 조회 오류:', error);
    return res.status(500).json({
      success: false,
      message: 'MMS 이미지 조회 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}


