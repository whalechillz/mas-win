import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { month } = req.query;
    
    if (!month) {
      return res.status(400).json({ success: false, message: 'month 파라미터가 필요합니다' });
    }

    // JSON 파일 경로
    const filePath = path.join(process.cwd(), 'docs', 'content-calendar', `${month}.json`);
    
    // 파일 존재 확인
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false, 
        message: `${month}.json 파일을 찾을 수 없습니다` 
      });
    }

    // 파일 읽기
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const calendar = JSON.parse(fileContent);

    return res.status(200).json({
      success: true,
      calendar,
      month
    });
  } catch (error) {
    console.error('캘린더 로드 오류:', error);
    return res.status(500).json({
      success: false,
      message: '캘린더 로드 실패',
      error: error.message
    });
  }
}


