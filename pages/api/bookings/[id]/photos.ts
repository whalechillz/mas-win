import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Next.js API route config
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * 예약 사진 관리 API
 * GET /api/bookings/[id]/photos - 사진 목록 조회
 * POST /api/bookings/[id]/photos - 사진 업로드
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: '예약 ID가 필요합니다.' });
  }

  const bookingId = parseInt(id);

  try {
    switch (req.method) {
      case 'GET':
        // 사진 목록 조회
        const { data: photos, error: getError } = await supabase
          .from('booking_photos')
          .select('*')
          .eq('booking_id', bookingId)
          .order('created_at', { ascending: false });

        if (getError) throw getError;

        return res.status(200).json({ photos: photos || [] });

      case 'POST':
        // 사진 업로드
        const form = formidable({
          maxFileSize: 10 * 1024 * 1024, // 10MB
          keepExtensions: true,
        });

        const [fields, files] = await form.parse(req);
        const file = Array.isArray(files.file) ? files.file[0] : files.file;

        if (!file) {
          return res.status(400).json({ error: '파일이 필요합니다.' });
        }

        // 예약 정보 조회 (고객 ID 확인)
        const { data: booking, error: bookingError } = await supabase
          .from('bookings')
          .select('id, customer_profile_id, phone')
          .eq('id', bookingId)
          .single();

        if (bookingError || !booking) {
          return res.status(404).json({ error: '예약을 찾을 수 없습니다.' });
        }

        // 파일 읽기
        const fileBuffer = fs.readFileSync(file.filepath);
        const fileExt = path.extname(file.originalFilename || '');
        const fileName = `booking-${bookingId}-${Date.now()}${fileExt}`;
        
        // Supabase Storage에 업로드
        const storagePath = `originals/customers/${booking.customer_profile_id || 'unknown'}/${fileName}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('blog-images')
          .upload(storagePath, fileBuffer, {
            contentType: file.mimetype || 'image/jpeg',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Public URL 생성
        const { data: { publicUrl } } = supabase.storage
          .from('blog-images')
          .getPublicUrl(storagePath);

        // 이미지 메타데이터 추출 (선택사항)
        const stats = fs.statSync(file.filepath);
        const fileSize = stats.size;

        // DB에 사진 정보 저장
        const photoData = {
          booking_id: bookingId,
          customer_profile_id: booking.customer_profile_id,
          image_url: publicUrl,
          storage_path: storagePath,
          file_name: file.originalFilename || fileName,
          file_size: fileSize,
          photo_type: fields.photo_type?.[0] || 'general',
          description: fields.description?.[0] || null,
          taken_at: fields.taken_at?.[0] || new Date().toISOString()
        };

        const { data: savedPhoto, error: saveError } = await supabase
          .from('booking_photos')
          .insert(photoData)
          .select()
          .single();

        if (saveError) throw saveError;

        // 임시 파일 삭제
        fs.unlinkSync(file.filepath);

        return res.status(201).json({ photo: savedPhoto });

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Booking photos API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}


