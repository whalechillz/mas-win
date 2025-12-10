/**
 * HTTP URL 이미지를 Solapi에 재업로드하여 imageId 획득
 * ⭐ 수정: Supabase Storage에도 업로드하여 메타데이터 생성
 */

import { createSolapiSignature } from '../../../utils/solapiSignature.js';
import { compressImageForSolapi } from '../../../lib/server/compressImageForSolapi.js';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || '';
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Supabase Storage에 원본 이미지 업로드
const uploadOriginalToSupabase = async (supabase, folderPath, imageBuffer, contentType) => {
  const fileName = `mms-${Date.now()}.jpg`;
  const storagePath = `${folderPath}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('blog-images')
    .upload(storagePath, imageBuffer, {
      contentType: contentType || 'image/jpeg',
      upsert: false
    });

  if (error) {
    console.error('⚠️ Supabase Storage 업로드 실패:', error.message);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from('blog-images')
    .getPublicUrl(storagePath);

  return urlData?.publicUrl || null;
};

// image_metadata에 메타데이터 생성/업데이트
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
    upload_source: 'mms-gallery-select',
    tags: payload.tags || [],
    original_path: payload.original_path || null,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('image_metadata')
    .upsert(metadataPayload, { onConflict: 'image_url' });

  if (error) {
    console.error('⚠️ image_metadata upsert 실패:', error.message);
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { imageUrl, messageId } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'imageUrl이 필요합니다.'
      });
    }

    if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'Solapi API 키가 설정되지 않았습니다.'
      });
    }

    console.log('🔄 HTTP URL에서 이미지 다운로드 중:', imageUrl);

    // 1. HTTP URL에서 이미지 다운로드
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!imageResponse.ok) {
      throw new Error(`이미지 다운로드 실패: ${imageResponse.status} ${imageResponse.statusText}`);
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    console.log('✅ 이미지 다운로드 완료:', {
      size: imageBuffer.length,
      contentType
    });

    // 2. Solapi 요구사항에 맞게 이미지 압축
    let compressionInfo;
    try {
      compressionInfo = await compressImageForSolapi(imageBuffer);
    } catch (sharpError) {
      console.error('❌ Sharp 모듈 로드 실패:', sharpError.message);
      
      // ⭐ Fallback: 이미지가 200KB 이하인 경우 원본 사용
      if (imageBuffer.length <= 200 * 1024) {
        console.warn('⚠️ Sharp 없이 원본 이미지 사용 (200KB 이하)');
        compressionInfo = {
          buffer: imageBuffer,
          quality: 100,
          width: null,
          height: null,
          originalWidth: null,
          originalHeight: null,
          originalSize: imageBuffer.length,
          compressedSize: imageBuffer.length
        };
      } else {
        // 200KB 초과 시 에러 반환
        return res.status(500).json({
          success: false,
          message: `이미지 처리 모듈을 로드할 수 없습니다. 이미지 크기가 ${(imageBuffer.length / 1024).toFixed(2)}KB로 200KB를 초과합니다. 더 작은 이미지를 사용하거나 관리자에게 문의하세요.`,
          error: 'SHARP_MODULE_LOAD_FAILED',
          imageSize: imageBuffer.length
        });
      }
    }
    
    const uploadBuffer = compressionInfo.buffer;
    
    // ⭐ 최종 용량 체크 (200KB 제한)
    const MAX_SOLAPI_SIZE = 200 * 1024; // 200KB
    if (uploadBuffer.length > MAX_SOLAPI_SIZE) {
      console.error(`❌ 이미지 크기 초과: ${(uploadBuffer.length / 1024).toFixed(2)}KB (제한: ${(MAX_SOLAPI_SIZE / 1024).toFixed(2)}KB)`);
      return res.status(400).json({
        success: false,
        message: `이미지 크기가 ${(uploadBuffer.length / 1024).toFixed(2)}KB로 Solapi 제한(200KB)을 초과합니다. 더 작은 이미지를 사용해주세요.`,
        error: 'IMAGE_SIZE_EXCEEDED',
        imageSize: uploadBuffer.length,
        maxSize: MAX_SOLAPI_SIZE
      });
    }

    console.log('✅ 이미지 압축 완료:', {
      originalSize: compressionInfo.originalSize,
      compressedSize: compressionInfo.compressedSize
    });

    // 3. ⭐ Supabase Storage에 원본 이미지 업로드 (messageId가 있는 경우)
    let supabaseUrl = imageUrl; // 기본값: 원본 URL 사용
    if (messageId && SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        
        // ⭐ 수정: 이미지가 이미 Supabase Storage에 있는지 확인
        const { data: existingMetadata, error: checkError } = await supabase
          .from('image_metadata')
          .select('*')
          .eq('image_url', imageUrl)
          .maybeSingle();
        
        if (existingMetadata) {
          // ⭐ 이미 존재하는 이미지: 복사하지 않고 태그만 추가
          console.log('✅ 기존 이미지 발견, 링크로 사용:', imageUrl);
          
          const existingTags = existingMetadata.tags || [];
          const newTag = `sms-${messageId}`;
          
          // 태그가 없으면 추가
          if (!existingTags.includes(newTag)) {
            const updatedTags = [...existingTags, newTag];
            
            await upsertImageMetadata(supabase, {
              image_url: imageUrl,
              tags: updatedTags,
              folder_path: existingMetadata.folder_path, // 원본 폴더 유지
              date_folder: existingMetadata.date_folder
            });
            
            console.log(`✅ 태그 추가 완료: ${newTag}`);
          } else {
            console.log(`ℹ️  태그가 이미 존재합니다: ${newTag}`);
          }
          
          // 원본 URL 사용 (복사하지 않음)
          supabaseUrl = imageUrl;
        } else {
          // ⭐ 새 이미지: messageId 폴더에 업로드
          const dateFolder = new Date().toISOString().split('T')[0];
          const folderPath = `originals/mms/${dateFolder}/${messageId}`;
          
          console.log('📁 새 이미지 Supabase Storage 업로드 중:', folderPath);
          
          supabaseUrl = await uploadOriginalToSupabase(
            supabase,
            folderPath,
            imageBuffer,
            contentType
          );
          
          if (supabaseUrl) {
            console.log('✅ Supabase Storage 업로드 완료:', supabaseUrl);
            
            // 메타데이터 생성
            await upsertImageMetadata(supabase, {
              image_url: supabaseUrl,
              folder_path: folderPath,
              date_folder: dateFolder,
              file_size: imageBuffer.length,
              width: compressionInfo.originalWidth,
              height: compressionInfo.originalHeight,
              original_path: `${folderPath}/mms-${Date.now()}.jpg`,
              tags: [`sms-${messageId}`, 'mms']
            });
          } else {
            console.warn('⚠️ Supabase Storage 업로드 실패, 원본 URL 사용');
            supabaseUrl = imageUrl;
          }
        }
      } catch (supabaseError) {
        console.error('⚠️ Supabase 업로드 오류 (무시):', supabaseError.message);
        supabaseUrl = imageUrl;
      }
    }

    // 4. Solapi storage에 업로드
    const authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);
    const base64Data = uploadBuffer.toString('base64');

    // 파일명 생성
    const fileName = imageUrl.split('/').pop() || `mms-${Date.now()}.jpg`;
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');

    const solapiResponse = await fetch('https://api.solapi.com/storage/v1/files', {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file: base64Data,
        name: safeFileName,
        type: 'MMS'
      })
    });

    const solapiResult = await solapiResponse.json();

    if (!solapiResponse.ok) {
      throw new Error(solapiResult?.message || 'Solapi 업로드 실패');
    }

    const imageId = solapiResult.fileId || solapiResult.id;

    if (!imageId) {
      throw new Error('Solapi에서 imageId를 받지 못했습니다.');
    }

    console.log('✅ Solapi 업로드 성공, imageId:', imageId);

    return res.status(200).json({
      success: true,
      imageId: imageId,
      supabaseUrl: supabaseUrl, // ⭐ 추가: Supabase URL 반환
      message: '이미지가 Solapi에 성공적으로 업로드되었습니다.'
    });

  } catch (error) {
    console.error('❌ 이미지 재업로드 오류:', error);
    return res.status(500).json({
      success: false,
      message: error.message || '이미지 재업로드 중 오류가 발생했습니다.'
    });
  }
}

