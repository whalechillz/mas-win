// 제품 이미지 업로드 API
// 로컬 파일 시스템에 main/products/{category}/{product-slug}/ 구조로 저장

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * 제품 slug를 기반으로 Storage 경로 결정
 * @param {string} productSlug - 제품 slug
 * @param {string} category - 제품 카테고리 (hat, driver, accessory)
 * @param {string} imageType - 이미지 타입 (detail, composition, gallery)
 * @returns {string} Storage 폴더 경로
 */
function getProductStoragePath(productSlug, category, imageType = 'detail') {
  // 굿즈/액세서리: originals/goods/{slug}/{imageType}
  if (category === 'hat' || category === 'accessory' || category === 'goods') {
    return `originals/goods/${productSlug}/${imageType}`;
  }

  // 드라이버 제품: originals/products/{slug}/{imageType}
  // 드라이버 제품 slug → 폴더 매핑
  const driverSlugToFolder = {
    'secret-weapon-black': 'black-weapon',
    'black-beryl': 'black-beryl',
    'secret-weapon-4-1': 'gold-weapon4',
    'secret-force-gold-2': 'gold2',
    'gold2-sapphire': 'gold2-sapphire',
    'secret-force-pro-3': 'pro3',
    'pro3-muziik': 'pro3-muziik',
    'secret-force-v3': 'v3',
  };

  const folderName = driverSlugToFolder[productSlug] || productSlug;
  return `originals/products/${folderName}/${imageType}`;
}

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

    // 제품 정보 가져오기 (slug, category, imageType)
    const productSlug = fields.productSlug?.[0] || '';
    const category = fields.category?.[0] || 'hat'; // 기본값: hat
    const imageType = fields.imageType?.[0] || 'detail'; // detail, composition, gallery

    // ✅ productSlug 검증 추가
    if (!productSlug || productSlug.trim() === '') {
      return res.status(400).json({
        error: '제품 Slug가 필요합니다.',
        details: '제품 수정 모달에서 Slug를 먼저 입력해주세요.'
      });
    }

    // 파일 읽기
    const fileBuffer = fs.readFileSync(file.filepath);
    const originalName = file.originalFilename || `product-${Date.now()}.jpg`;
    const baseName = path.parse(originalName).name;
    
    // WebP로 변환
    const webpBuffer = await sharp(fileBuffer)
      .webp({ quality: 85 })
      .toBuffer();

    // Storage 경로 결정 (새 구조 사용)
    const storageFolder = getProductStoragePath(productSlug, category, imageType);
    const timestamp = Date.now();
    const webpFileName = `${baseName}-${timestamp}.webp`;
    const storagePath = `${storageFolder}/${webpFileName}`;

    // Supabase Storage에 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(storagePath, webpBuffer, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Supabase Storage 업로드 오류:', uploadError);
      return res.status(500).json({
        error: '이미지 업로드에 실패했습니다.',
        details: uploadError.message
      });
    }

    // 공개 URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(storagePath);

    // 임시 파일 삭제
    fs.unlinkSync(file.filepath);

    // Storage 경로를 상대 경로로 변환 (기존 코드 호환)
    const relativePath = `/${storagePath}`;

    res.status(200).json({
      success: true,
      url: relativePath, // 상대 경로: /originals/products/{slug}/{type}/...
      storageUrl: publicUrl, // Supabase Storage 공개 URL (전체 URL)
      fileName: webpFileName,
      storagePath: storagePath,
      message: '이미지가 Supabase Storage에 업로드되고 WebP로 변환되었습니다.'
    });

  } catch (error) {
    console.error('❌ 제품 이미지 업로드 오류:', error);
    return res.status(500).json({
      error: error.message || '이미지 업로드 중 오류가 발생했습니다.'
    });
  }
}
