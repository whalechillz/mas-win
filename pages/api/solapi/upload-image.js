import { createSolapiSignature } from '../../../utils/solapiSignature.js';

const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || "";
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || "";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // 환경 변수 검증
    if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
      return res.status(500).json({ 
        success: false, 
        message: 'Solapi 환경 변수가 설정되지 않았습니다.' 
      });
    }

    // FormData에서 파일 추출
    const formData = new FormData();
    const file = req.body.file;
    
    if (!file) {
      return res.status(400).json({ success: false, message: '파일이 필요합니다.' });
    }

    // 파일 크기 검증 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ 
        success: false, 
        message: '파일 크기는 5MB를 초과할 수 없습니다.' 
      });
    }

    // 파일 타입 검증 (이미지만 허용)
    if (!file.type.startsWith('image/')) {
      return res.status(400).json({ 
        success: false, 
        message: '이미지 파일만 업로드할 수 있습니다.' 
      });
    }

    // Solapi에 이미지 업로드
    const authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);
    
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    const response = await fetch('https://api.solapi.com/storage/v1/files', {
      method: 'POST',
      headers: authHeaders,
      body: uploadFormData
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`이미지 업로드 실패: ${JSON.stringify(result)}`);
    }

    return res.status(200).json({
      success: true,
      imageId: result.fileId,
      message: '이미지가 성공적으로 업로드되었습니다.',
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

  } catch (error) {
    console.error('이미지 업로드 오류:', error);
    return res.status(500).json({
      success: false,
      message: '이미지 업로드 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}
