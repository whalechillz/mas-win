// Formidable은 동적 import로 로드 (Vercel 환경 호환성)
import { createClient } from '@supabase/supabase-js';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Supabase 클라이언트 초기화
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ 
        message: 'Supabase 설정이 올바르지 않습니다.',
        error: 'Missing Supabase credentials'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Formidable 동적 import (Vercel 환경 호환성)
    const formidable = (await import('formidable')).default;
    // formidable 설정 (메모리에 저장)
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      filter: function ({ name, originalFilename, mimetype }) {
        // 이미지 파일만 허용
        return mimetype && mimetype.includes('image');
      },
    });

    // Promise 래퍼로 변환 (formidable 버전 호환성)
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });
    
    if (!files.image || files.image.length === 0) {
      return res.status(400).json({ message: '이미지 파일이 필요합니다.' });
    }

    const file = files.image[0];
    const fileName = `blog-upload-${Date.now()}-${file.originalFilename}`;
    
    // 파일을 Buffer로 읽기
    const fs = require('fs');
    const fileBuffer = fs.readFileSync(file.filepath);
    
    // Supabase Storage에 업로드
    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(fileName, fileBuffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      console.error('Supabase 업로드 오류:', error);
      return res.status(500).json({ 
        message: '이미지 업로드에 실패했습니다.',
        error: error.message 
      });
    }

    // 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(fileName);
    
    res.status(200).json({
      success: true,
      imageUrl: urlData.publicUrl,
      fileName: fileName
    });

  } catch (error) {
    console.error('이미지 업로드 오류:', error);
    res.status(500).json({ 
      message: '이미지 업로드에 실패했습니다.',
      error: error.message 
    });
  }
}