// 제품 이미지 업로드 API
// public/main/products/goods 폴더에 저장하고 WebP로 변환

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const formidable = (await import('formidable')).default;
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      filter: function ({ name, originalFilename, mimetype }) {
        return mimetype && mimetype.includes('image');
      },
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const file = files.file?.[0];
    if (!file) {
      return res.status(400).json({ error: '이미지 파일이 필요합니다.' });
    }

    // 파일 읽기
    const fileBuffer = fs.readFileSync(file.filepath);
    const originalName = file.originalFilename || `product-${Date.now()}.jpg`;
    const baseName = path.parse(originalName).name;
    
    // WebP로 변환
    const webpBuffer = await sharp(fileBuffer)
      .webp({ quality: 85 })
      .toBuffer();

    // public/main/products/goods 폴더에 저장
    const goodsDir = path.join(process.cwd(), 'public/main/products/goods');
    if (!fs.existsSync(goodsDir)) {
      fs.mkdirSync(goodsDir, { recursive: true });
    }

    const webpFileName = `${baseName}.webp`;
    const webpPath = path.join(goodsDir, webpFileName);
    fs.writeFileSync(webpPath, webpBuffer);

    // 상대 경로 반환
    const relativePath = `/main/products/goods/${webpFileName}`;

    // 임시 파일 삭제
    fs.unlinkSync(file.filepath);

    res.status(200).json({
      success: true,
      url: relativePath,
      fileName: webpFileName,
      message: '이미지가 업로드되고 WebP로 변환되었습니다.'
    });

  } catch (error) {
    console.error('❌ 제품 이미지 업로드 오류:', error);
    return res.status(500).json({
      error: error.message || '이미지 업로드 중 오류가 발생했습니다.'
    });
  }
}

