import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = {
  api: {
    bodyParser: false, // FormData를 위해 bodyParser 비활성화
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // FormData 파싱 (formidable 동적 import)
    const formidable = (await import('formidable')).default;
    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB 제한
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const file = files.image?.[0];
    const folderPath = fields.folderPath?.[0] || '';
    const fileName = fields.fileName?.[0] || `processed-${Date.now()}.png`;

    if (!file) {
      return res.status(400).json({ error: '이미지 파일이 필요합니다.' });
    }

    // 파일을 Buffer로 읽기
    const fileBuffer = fs.readFileSync(file.filepath);
    const contentType = file.mimetype || 'image/png';

    // Supabase Storage에 업로드
    const bucket = 'blog-images';
    const uploadPath = folderPath ? `${folderPath}/${fileName}` : fileName;

    console.log('💾 처리된 이미지 Supabase Storage에 업로드 중:', uploadPath);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(uploadPath, fileBuffer, {
        contentType,
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Supabase 업로드 오류:', uploadError);
      throw uploadError;
    }

    // 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(uploadPath);

    // 임시 파일 삭제
    try {
      fs.unlinkSync(file.filepath);
    } catch (unlinkError) {
      console.warn('⚠️ 임시 파일 삭제 실패:', unlinkError);
    }

    console.log('✅ 처리된 이미지 업로드 완료:', urlData.publicUrl);

    res.json({
      success: true,
      imageUrl: urlData.publicUrl,
      fileName: fileName,
      size: fileBuffer.length
    });

  } catch (error) {
    console.error('❌ 처리된 이미지 업로드 오류:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false,
        error: error.message || '이미지 업로드 중 오류가 발생했습니다.' 
      });
    }
  }
}

