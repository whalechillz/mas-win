import { createClient } from '@supabase/supabase-js';
import { createSolapiSignature } from '../../../utils/solapiSignature.js';
import { compressImageForSolapi } from '../../../lib/server/compressImageForSolapi.js';
import fs from 'fs';

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
    cdn_url: payload.image_url,
    file_path: payload.original_path || payload.folder_path || null,
    file_size: payload.file_size || null,
    width: payload.width || null,
    height: payload.height || null,
    format: 'jpg',
    upload_source: 'mms-editor',
    ai_tags: payload.tags || [],
    updated_at: new Date().toISOString()
    // ⚠️ image_assets에는 다음 필드들이 없음: folder_path, date_folder, source, channel, original_path, file_name
  };

  let { error } = await supabase
    .from('image_assets')
    .upsert(metadataPayload, { onConflict: 'cdn_url' });

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

    const { folderPath, storagePath, fileName, dateFolder, safeId } =
      buildStoragePaths(messageIdField);

    const supabaseUrl = await uploadOriginalToSupabase(
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
      tags: [`sms-${safeId}`]
    });

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
