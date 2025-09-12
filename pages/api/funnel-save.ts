import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileName, content, modifiedDate } = req.body;

    if (!fileName || !content) {
      return res.status(400).json({ error: '파일명과 내용이 필요합니다.' });
    }

    const filePath = path.join(process.cwd(), 'public', 'versions', fileName);
    
    // 백업 생성
    const backupPath = path.join(process.cwd(), 'public', 'versions', 'backups', `${fileName}.backup.${Date.now()}`);
    if (fs.existsSync(filePath)) {
      // 백업 디렉토리 생성
      const backupDir = path.dirname(backupPath);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      // 기존 파일 백업
      fs.copyFileSync(filePath, backupPath);
    }

    // 메타데이터가 포함된 HTML 생성
    const htmlWithMetadata = content.replace(
      '<head>',
      `<head>
    <!-- 파일 메타데이터 -->
    <meta name="file-created" content="${modifiedDate || new Date().toISOString()}">
    <meta name="file-version" content="live">
    <meta name="file-status" content="live">
    <meta name="last-modified" content="${new Date().toISOString()}">`
    );

    // 파일 저장
    fs.writeFileSync(filePath, htmlWithMetadata, 'utf8');
    
    // 파일 정보
    const stats = fs.statSync(filePath);
    
    res.status(200).json({
      success: true,
      message: '퍼널이 성공적으로 저장되었습니다.',
      fileInfo: {
        name: fileName,
        size: stats.size,
        modifiedDate: stats.mtime.toISOString(),
        backupPath: backupPath
      }
    });

  } catch (error) {
    console.error('퍼널 저장 오류:', error);
    res.status(500).json({ 
      error: '파일 저장 실패',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
