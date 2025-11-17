import { createSolapiSignature } from '../../../utils/solapiSignature.js';
// Formidable은 동적 import로 로드 (Vercel 환경 호환성)
import fs from 'fs';

const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || "";
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || "";

// Next.js API에서 파일 업로드를 위한 설정
export const config = {
  api: {
    bodyParser: false, // multipart/form-data를 위해 비활성화
  },
};

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

    // Formidable 동적 import (Vercel 환경 호환성)
    const formidable = (await import('formidable')).default;
    // formidable을 사용하여 multipart/form-data 파싱
    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5MB 제한
      keepExtensions: true,
      filter: ({ mimetype }) => {
        // 이미지 파일만 허용 (JPG, PNG, GIF)
        if (!mimetype) return false;
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        return allowedTypes.includes(mimetype.toLowerCase());
      }
    });

    // Promise 래퍼로 변환 (formidable 버전 호환성)
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });
    
    // 파일이 업로드되었는지 확인
    if (!files.file || !Array.isArray(files.file) || files.file.length === 0) {
      return res.status(400).json({ success: false, message: '파일이 필요합니다.' });
    }

    const file = files.file[0];
    
    // JPG 파일만 허용 (Solapi MMS 요구사항)
    if (!file.mimetype || !['image/jpeg', 'image/jpg'].includes(file.mimetype.toLowerCase())) {
      if (file.filepath) {
        try { fs.unlinkSync(file.filepath); } catch (e) {}
      }
      return res.status(400).json({ 
        success: false, 
        message: 'JPG 형식의 파일만 사용가능합니다.' 
      });
    }

    console.log('업로드된 파일 정보:', {
      originalFilename: file.originalFilename,
      mimetype: file.mimetype,
      size: file.size,
      filepath: file.filepath
    });

    // Solapi에 이미지 업로드
    const authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);
    
    // 파일을 Buffer로 읽어서 base64로 인코딩
    const fileBuffer = fs.readFileSync(file.filepath);
    const base64Data = fileBuffer.toString('base64');
    
    console.log('Solapi 업로드 시작...');
    console.log('Auth headers:', authHeaders);
    console.log('File size:', file.size, 'bytes');
    
    // Solapi storage API에 base64 데이터로 업로드
    const response = await fetch('https://api.solapi.com/storage/v1/files', {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file: base64Data,
        name: file.originalFilename,
        type: 'MMS' // Solapi에서 요구하는 타입
      })
    });

    const result = await response.json();
    console.log('Solapi 업로드 응답:', result);

    if (!response.ok) {
      throw new Error(`이미지 업로드 실패: ${JSON.stringify(result)}`);
    }

    // 임시 파일 삭제
    fs.unlinkSync(file.filepath);

    return res.status(200).json({
      success: true,
      imageId: result.fileId,
      message: '이미지가 성공적으로 업로드되었습니다.',
      fileName: file.originalFilename,
      fileSize: file.size,
      fileType: file.mimetype
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
