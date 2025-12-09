import { createClient } from '@supabase/supabase-js';
import { createSolapiSignature } from '../../../utils/solapiSignature.js';
import { compressImageForSolapi } from '../../../lib/server/compressImageForSolapi.js';
import fs from 'fs';
import crypto from 'crypto';

const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || '';
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_BUCKET = process.env.NEXT_PUBLIC_IMAGE_BUCKET || 'blog-images';

export const config = {
  api: {
    bodyParser: false
  }
};

const getFirstFieldValue = (value) => {
  if (Array.isArray(value)) return value[0];
  return value;
};

const buildStoragePaths = (messageId) => {
  const now = new Date();
  const dateFolder = now.toISOString().slice(0, 10);
  const safeId = messageId?.toString().trim() || `temp-${now.getTime()}`;
  const folderPath = `originals/mms/${dateFolder}/${safeId}`;
  const fileName = `mms-${safeId}-${now.getTime()}.jpg`;
  const storagePath = `${folderPath}/${fileName}`;
  return { folderPath, storagePath, fileName, dateFolder, safeId };
};

// 이미지 해시 계산 (중복 체크용)
const calculateImageHash = (buffer) => {
  const md5 = crypto.createHash('md5').update(buffer).digest('hex');
  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
  return { md5, sha256 };
};

// 중복 이미지 체크
const checkDuplicateImage = async (supabase, hashMd5, hashSha256) => {
  // hash_md5로 먼저 체크
  const { data: md5Matches } = await supabase
    .from('image_metadata')
    .select('*')
    .eq('hash_md5', hashMd5)
    .limit(1);

  if (md5Matches && md5Matches.length > 0) {
    return md5Matches[0];
  }

  // hash_sha256으로 체크
  const { data: sha256Matches } = await supabase
    .from('image_metadata')
    .select('*')
    .eq('hash_sha256', hashSha256)
    .limit(1);

  if (sha256Matches && sha256Matches.length > 0) {
    return sha256Matches[0];
  }

  return null;
};

const uploadOriginalToSupabase = async (supabase, path, buffer, contentType) => {
  const { error } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .upload(path, buffer, {
      contentType: contentType || 'image/jpeg',
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    throw new Error(`Supabase 업로드 실패: ${error.message}`);
  }

  const { data } = supabase.storage
    .from(SUPABASE_BUCKET)
    .getPublicUrl(path);

  return data?.publicUrl;
};

const upsertImageMetadata = async (supabase, payload) => {
  if (!payload.image_url) return;

  const metadataPayload = {
    image_url: payload.image_url,
    folder_path: payload.folder_path || null,
    date_folder: payload.date_folder || null,
    source: 'mms',
    channel: 'sms',
    file_size: payload.file_size || null,
    width: payload.width || null,
    height: payload.height || null,
    format: 'jpg',
    upload_source: 'mms-editor',
    tags: payload.tags || [],
    original_path: payload.original_path || null,
    hash_md5: payload.hash_md5 || null,
    hash_sha256: payload.hash_sha256 || null,
    updated_at: new Date().toISOString()
  };

  if (payload.file_name) {
    metadataPayload.file_name = payload.file_name;
  }

  let { error } = await supabase
    .from('image_metadata')
    .upsert(metadataPayload, { onConflict: 'image_url' });

  if (error && error.code === '42703') {
    const fallback = { ...metadataPayload };
    delete fallback.file_name;
    delete fallback.original_path;
    delete fallback.hash_md5;
    delete fallback.hash_sha256;
    ({ error } = await supabase
      .from('image_metadata')
      .upsert(fallback, { onConflict: 'image_url' }));
  }

  if (error) {
    console.error('⚠️ image_metadata upsert 실패:', error.message);
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'Solapi 환경 변수가 설정되지 않았습니다.'
      });
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Supabase 환경 변수가 설정되지 않았습니다.'
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const formidable = (await import('formidable')).default;
    const form = formidable({
      maxFileSize: 5 * 1024 * 1024,
      keepExtensions: true,
      filter: ({ mimetype }) => {
        if (!mimetype) return false;
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        return allowedTypes.includes(mimetype.toLowerCase());
      }
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, parsedFields, parsedFiles) => {
        if (err) reject(err);
        else resolve([parsedFields, parsedFiles]);
      });
    });

    if (!files.file || !Array.isArray(files.file) || files.file.length === 0) {
      return res.status(400).json({ success: false, message: '파일이 필요합니다.' });
    }

    const file = files.file[0];
    if (!file?.mimetype || !['image/jpeg', 'image/jpg'].includes(file.mimetype.toLowerCase())) {
      if (file?.filepath) {
        try { fs.unlinkSync(file.filepath); } catch (e) {}
      }
      return res.status(400).json({
        success: false,
        message: 'JPG 형식의 파일만 사용가능합니다.'
      });
    }

    if (!file.filepath || !fs.existsSync(file.filepath)) {
      return res.status(400).json({
        success: false,
        message: '파일 경로가 올바르지 않습니다.'
      });
    }

    const originalBuffer = fs.readFileSync(file.filepath);
    
    // Sharp 모듈 로드 시도 및 에러 핸들링
    let compressionInfo;
    try {
      compressionInfo = await compressImageForSolapi(originalBuffer);
    } catch (sharpError) {
      console.error('❌ Sharp 모듈 로드 실패:', sharpError.message);
      
      // Sharp 없이도 작동하도록 원본 이미지 사용 (200KB 이하인 경우)
      if (originalBuffer.length <= 200 * 1024) {
        console.warn('⚠️ Sharp 없이 원본 이미지 사용 (200KB 이하)');
        compressionInfo = {
          buffer: originalBuffer,
          quality: 100,
          width: null,
          height: null,
          originalWidth: null,
          originalHeight: null,
          originalSize: originalBuffer.length,
          compressedSize: originalBuffer.length
        };
      } else {
        // 200KB 초과 시 에러 반환
        return res.status(500).json({
          success: false,
          message: `이미지 처리 모듈을 로드할 수 없습니다. 이미지 크기가 ${(originalBuffer.length / 1024).toFixed(2)}KB로 200KB를 초과합니다. 더 작은 이미지를 사용하거나 관리자에게 문의하세요.`,
          error: 'SHARP_MODULE_LOAD_FAILED',
          imageSize: originalBuffer.length
        });
      }
    }
    
    const uploadBuffer = compressionInfo.buffer;

    const messageIdField =
      getFirstFieldValue(fields?.messageId) ||
      getFirstFieldValue(fields?.id) ||
      null;

    // 이미지 해시 계산 (중복 체크용)
    const { md5: hashMd5, sha256: hashSha256 } = calculateImageHash(originalBuffer);

    // 중복 이미지 체크
    const duplicateImage = await checkDuplicateImage(supabase, hashMd5, hashSha256);
    
    let supabaseUrl;
    let shouldUploadToSupabase = true;

    const { folderPath, storagePath, fileName, dateFolder, safeId } =
      buildStoragePaths(messageIdField);

    if (duplicateImage) {
      console.log('✅ 중복 이미지 발견, 기존 이미지 재사용:', duplicateImage.image_url);
      supabaseUrl = duplicateImage.image_url;
      
      // 중복 이미지인 경우 태그만 추가
      const existingTags = duplicateImage.tags || [];
      const newTag = `sms-${safeId}`;
      
      if (!existingTags.includes(newTag)) {
        await upsertImageMetadata(supabase, {
          image_url: supabaseUrl,
          tags: [...existingTags, newTag],
          hash_md5: hashMd5,
          hash_sha256: hashSha256
        });
      }
    } else {
      // 중복이 아닌 경우 Supabase에 업로드
      supabaseUrl = await uploadOriginalToSupabase(
        supabase,
        storagePath,
        originalBuffer,
        file.mimetype
      );

      await upsertImageMetadata(supabase, {
        image_url: supabaseUrl,
        folder_path: folderPath,
        date_folder: dateFolder,
        file_size: originalBuffer.length,
        width: compressionInfo.originalWidth,
        height: compressionInfo.originalHeight,
        file_name: fileName,
        original_path: storagePath,
        tags: [`sms-${safeId}`],
        hash_md5: hashMd5,
        hash_sha256: hashSha256
      });
    }

    const authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);
    const base64Data = uploadBuffer.toString('base64');

    const response = await fetch('https://api.solapi.com/storage/v1/files', {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file: base64Data,
        name: file.originalFilename || fileName,
        type: 'MMS'
      })
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result?.message || 'Solapi 업로드 중 오류가 발생했습니다.');
    }

    fs.unlinkSync(file.filepath);

    return res.status(200).json({
      success: true,
      imageId: result.fileId,
      message: '이미지가 성공적으로 업로드되었습니다.',
      fileName: file.originalFilename || fileName,
      fileSize: originalBuffer.length,
      fileType: file.mimetype,
      supabaseUrl,
      storagePath,
      compressionInfo
    });
  } catch (error) {
    console.error('이미지 업로드 오류:', error);

    return res.status(500).json({
      success: false,
      message: error.message || '이미지 업로드 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  } finally {
    // Formidable 임시 파일은 명시적으로 삭제 필요
    // try/catch 내부에서 처리됐지만 혹시 남아있다면 제거
  }
}
