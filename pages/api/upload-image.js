import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

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
    // 업로드 디렉토리 생성
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // formidable 설정
    const form = formidable({
      uploadDir: uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      filter: function ({ name, originalFilename, mimetype }) {
        // 이미지 파일만 허용
        return mimetype && mimetype.includes('image');
      },
    });

    const [fields, files] = await form.parse(req);
    
    if (!files.image || files.image.length === 0) {
      return res.status(400).json({ message: '이미지 파일이 필요합니다.' });
    }

    const file = files.image[0];
    const fileName = `${Date.now()}-${file.originalFilename}`;
    const newPath = path.join(uploadDir, fileName);
    
    // 파일 이동
    fs.renameSync(file.filepath, newPath);
    
    // URL 생성
    const imageUrl = `/uploads/${fileName}`;
    
    res.status(200).json({
      success: true,
      imageUrl: imageUrl,
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