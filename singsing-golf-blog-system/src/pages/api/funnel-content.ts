import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { file } = req.query;

    if (!file || typeof file !== 'string') {
      return res.status(400).json({ error: '파일명이 필요합니다.' });
    }

    const filePath = path.join(process.cwd(), 'public', 'versions', file);
    
    // 파일 존재 확인
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
    }

    // 파일 내용 읽기
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 파일 정보
    const stats = fs.statSync(filePath);
    
    res.status(200).json({
      success: true,
      content,
      fileInfo: {
        name: file,
        size: stats.size,
        modifiedDate: stats.mtime.toISOString(),
        createdDate: stats.birthtime.toISOString()
      }
    });

  } catch (error) {
    console.error('퍼널 내용 로드 오류:', error);
    res.status(500).json({ 
      error: '파일 로드 실패',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
