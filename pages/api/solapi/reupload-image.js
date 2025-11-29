/**
 * HTTP URL 이미지를 Solapi에 재업로드하여 imageId 획득
 */

import { createSolapiSignature } from '../../../utils/solapiSignature.js';
import { compressImageForSolapi } from '../../../lib/server/compressImageForSolapi.js';

const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || '';
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || '';

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
    const compressionInfo = await compressImageForSolapi(imageBuffer);
    const uploadBuffer = compressionInfo.buffer;

    console.log('✅ 이미지 압축 완료:', {
      originalSize: compressionInfo.originalSize,
      compressedSize: compressionInfo.compressedSize
    });

    // 3. Solapi storage에 업로드
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


