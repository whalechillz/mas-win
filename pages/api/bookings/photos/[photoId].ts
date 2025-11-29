import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * 사진 삭제 API
 * DELETE /api/bookings/photos/[photoId]
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { photoId } = req.query;

    if (!photoId || typeof photoId !== 'string') {
      return res.status(400).json({ error: '사진 ID가 필요합니다.' });
    }

    // 사진 정보 조회
    const { data: photo, error: getError } = await supabase
      .from('booking_photos')
      .select('storage_path')
      .eq('id', parseInt(photoId))
      .single();

    if (getError || !photo) {
      return res.status(404).json({ error: '사진을 찾을 수 없습니다.' });
    }

    // Storage에서 파일 삭제
    if (photo.storage_path) {
      const { error: deleteStorageError } = await supabase.storage
        .from('blog-images')
        .remove([photo.storage_path]);

      if (deleteStorageError) {
        console.error('Storage delete error:', deleteStorageError);
        // DB는 삭제하되 Storage 에러는 무시
      }
    }

    // DB에서 사진 정보 삭제
    const { error: deleteError } = await supabase
      .from('booking_photos')
      .delete()
      .eq('id', parseInt(photoId));

    if (deleteError) throw deleteError;

    return res.status(204).end();
  } catch (error) {
    console.error('Delete photo API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}


