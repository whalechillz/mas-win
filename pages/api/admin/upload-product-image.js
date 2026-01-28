// 제품 이미지 업로드 API
// 로컬 파일 시스템에 main/products/{category}/{product-slug}/ 구조로 저장

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { generateProductImageFileName } from '../../../lib/filename-generator';

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
 * 폴더 경로에서 폴더명 추출 (영어로)
 * @param {string} category - 제품 카테고리
 * @returns {string} 폴더명 prefix (예: 'goods', 'product')
 */
function extractFolderPrefix(category) {
  // 굿즈/액세서리: goods (cap = 모자)
  // ✅ 'hat'도 'cap'과 동일하게 처리 (product_composition 테이블 호환성)
  if (category === 'cap' || category === 'hat' || category === 'accessory' || category === 'goods') {
    return 'goods';
  }
  // ✅ 부품: component
  if (category === 'component') {
    return 'component';
  }
  // 드라이버 제품: product
  return 'product';
}

/**
 * 제품 slug를 기반으로 Storage 경로 결정
 * @param {string} productSlug - 제품 slug
 * @param {string} category - 제품 카테고리 (cap, driver, accessory)
 * @param {string} imageType - 이미지 타입 (detail, composition, gallery)
 * @returns {string} Storage 폴더 경로
 */
function getProductStoragePath(productSlug, category, imageType = 'detail') {
  // 굿즈/액세서리: originals/goods/{slug}/{imageType} (cap = 모자)
  // ✅ 'hat'도 'cap'과 동일하게 처리 (product_composition 테이블 호환성)
  if (category === 'cap' || category === 'hat' || category === 'accessory' || category === 'goods') {
    return `originals/goods/${productSlug}/${imageType}`;
  }

  // ✅ 부품: originals/components/{slug}/{imageType}
  if (category === 'component') {
    return `originals/components/${productSlug}/${imageType}`;
  }

  // 드라이버 제품: originals/products/{slug}/{imageType}
  // slug와 폴더명이 일치하므로 직접 사용
  return `originals/products/${productSlug}/${imageType}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[upload-product-image] 요청 시작');
    
    const formidable = (await import('formidable')).default;
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      filter: function ({ name, originalFilename, mimetype }) {
        return mimetype && mimetype.includes('image');
      },
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('[upload-product-image] form 파싱 오류:', err);
          reject(err);
        } else {
          resolve([fields, files]);
        }
      });
    });

    console.log('[upload-product-image] form 파싱 완료:', {
      fields: Object.keys(fields),
      hasFile: !!files.file,
    });

    const file = files.file?.[0];
    if (!file) {
      console.error('[upload-product-image] 파일 없음');
      return res.status(400).json({ error: '이미지 파일이 필요합니다.' });
    }

    // 제품 정보 가져오기 (slug, category, imageType)
    const productSlug = fields.productSlug?.[0] || '';
    const category = fields.category?.[0] || 'cap'; // 기본값: cap (모자)
    const imageType = fields.imageType?.[0] || 'detail'; // detail, composition, gallery
    const preserveFilename = fields.preserveFilename?.[0] === 'true'; // 원본 파일명 유지 옵션
    const customFileName = fields.customFileName?.[0]; // ✅ 커스텀 파일명 (shaft, badge 등)

    console.log('[upload-product-image] 제품 정보:', {
      productSlug,
      category,
      imageType,
      fileName: file.originalFilename,
    });

    // ✅ productSlug 검증 추가
    if (!productSlug || productSlug.trim() === '') {
      console.error('[upload-product-image] productSlug 없음');
      return res.status(400).json({
        error: '제품 Slug가 필요합니다.',
        details: '제품 수정 모달에서 Slug 또는 SKU를 먼저 입력해주세요.'
      });
    }

    // 파일 읽기
    console.log('[upload-product-image] 파일 읽기 시작:', file.filepath);
    const fileBuffer = fs.readFileSync(file.filepath);
    console.log('[upload-product-image] 파일 읽기 완료, 크기:', fileBuffer.length);

    const originalName = file.originalFilename || `product-${Date.now()}.jpg`;
    
    // ✅ 한글 파일명 감지 및 자동 변환
    const hasKoreanInFileName = /[가-힣]/.test(originalName);
    let effectivePreserveFilename = preserveFilename;
    if (hasKoreanInFileName && preserveFilename) {
      console.warn('⚠️ 한글 파일명 감지, 자동으로 최적화 모드로 전환:', originalName);
      effectivePreserveFilename = false; // optimize-filename으로 전환
      console.log('✅ 업로드 모드 자동 변경: preserve-filename → optimize-filename');
    }
    
    // WebP로 변환
    console.log('[upload-product-image] WebP 변환 시작');
    const webpBuffer = await sharp(fileBuffer)
      .webp({ quality: 85 })
      .toBuffer();
    console.log('[upload-product-image] WebP 변환 완료, 크기:', webpBuffer.length);

    // Storage 경로 결정 (새 구조 사용)
    const storageFolder = getProductStoragePath(productSlug, category, imageType);
    console.log('[upload-product-image] Storage 경로:', storageFolder);
    
    // 파일명 생성
    let webpFileName;
    if (customFileName) {
      // ✅ 커스텀 파일명 사용 (shaft, badge 등) - 기존 방식 유지
      webpFileName = `${customFileName}.webp`;
    } else if (effectivePreserveFilename) {
      // 원본 파일명 유지 (확장자만 .webp로 변경) - 기존 방식 유지
      const baseName = path.parse(originalName).name;
      webpFileName = `${baseName}.webp`;
    } else {
      // ✅ 새로운 표준 파일명 형식 사용: massgoo-{제품명}-{날짜}-{순번}.webp
      webpFileName = await generateProductImageFileName(
        productSlug,
        new Date()
      );
      console.log('[upload-product-image] 표준 파일명 생성:', webpFileName);
    }
    
    let storagePath = `${storageFolder}/${webpFileName}`;
    console.log('[upload-product-image] 업로드 시작:', storagePath);
    
    // 원본 파일명 유지 옵션일 때 중복 체크
    if (effectivePreserveFilename) {
      let counter = 0;
      let finalPath = storagePath;
      
      // 중복 체크 (최대 10번 시도)
      while (counter < 10) {
        const folderPath = finalPath.split('/').slice(0, -1).join('/');
        const fileName = finalPath.split('/').pop();
        
        const { data: existingFiles, error: listError } = await supabase.storage
          .from('blog-images')
          .list(folderPath || '', {
            search: fileName
          });
        
        if (listError || !existingFiles || existingFiles.length === 0) {
          break; // 중복 없음
        }
        
        // 중복이면 번호 추가
        counter++;
        const pathParts = finalPath.split('/');
        const currentFileName = pathParts.pop();
        const nameWithoutExt = currentFileName.replace(/\.[^/.]+$/, '');
        const ext = currentFileName.match(/\.[^/.]+$/)?.[0] || '';
        pathParts.push(`${nameWithoutExt}-${counter}${ext}`);
        finalPath = pathParts.join('/');
      }
      
      storagePath = finalPath;
    }

    // Supabase Storage에 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(storagePath, webpBuffer, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('[upload-product-image] ❌ Supabase Storage 업로드 오류:', uploadError);
      return res.status(500).json({
        error: '이미지 업로드에 실패했습니다.',
        details: uploadError.message
      });
    }

    console.log('[upload-product-image] ✅ 업로드 성공');

    // 공개 URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(storagePath);

    // 임시 파일 삭제
    try {
      fs.unlinkSync(file.filepath);
    } catch (unlinkError) {
      console.warn('[upload-product-image] 임시 파일 삭제 실패:', unlinkError);
    }

    // ✅ 전체 Supabase URL로 반환 (DB에 저장 시 일관성 유지)
    res.status(200).json({
      success: true,
      url: publicUrl, // ✅ 전체 URL로 변경: https://yyytjudftvpmcnppaymw.supabase.co/...
      storageUrl: publicUrl, // 동일 (호환성 유지)
      fileName: webpFileName,
      storagePath: storagePath,
      message: '이미지가 Supabase Storage에 업로드되고 WebP로 변환되었습니다.'
    });

  } catch (error) {
    console.error('[upload-product-image] ❌ 예외 발생:', error);
    return res.status(500).json({
      error: error.message || '이미지 업로드 중 오류가 발생했습니다.',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
