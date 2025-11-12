/**
 * 캘린더 파일 저장 API
 * JSON 파일에 직접 저장
 */

import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { month, calendarData } = req.body;

    if (!month || !calendarData) {
      return res.status(400).json({ 
        success: false, 
        message: '필수 파라미터가 누락되었습니다' 
      });
    }

    // 파일 경로
    const filePath = path.join(process.cwd(), 'docs', 'content-calendar', `${month}.json`);

    // 파일 존재 확인
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false, 
        message: `${month}.json 파일을 찾을 수 없습니다` 
      });
    }

    // 파일 저장
    fs.writeFileSync(filePath, JSON.stringify(calendarData, null, 2), 'utf-8');

    return res.status(200).json({
      success: true,
      message: '캘린더 파일 저장 완료',
      filePath
    });

  } catch (error) {
    console.error('캘린더 파일 저장 오류:', error);
    return res.status(500).json({
      success: false,
      message: '저장 실패',
      error: error.message
    });
  }
}


