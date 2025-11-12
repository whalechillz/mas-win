/**
 * 카카오톡 프로필 업데이트 API
 * Playwright 스크립트를 서버에서 실행
 */

import { exec } from 'child_process';
import path from 'path';

function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { account, date } = req.body;

    if (!account || !date) {
      return res.status(400).json({
        success: false,
        message: '필수 파라미터가 누락되었습니다 (account, date)'
      });
    }

    // 스크립트 경로
    const scriptPath = path.join(process.cwd(), 'scripts', 'update-kakao-profile.js');
    
    log(`🚀 카카오톡 프로필 업데이트 시작: ${account} - ${date}`);
    
    // 비동기로 스크립트 실행 (응답은 즉시 반환)
    exec(
      `node ${scriptPath} ${account} ${date}`,
      {
        cwd: process.cwd(),
        maxBuffer: 10 * 1024 * 1024 // 10MB
      },
      (error, stdout, stderr) => {
        if (error) {
          console.error('❌ 스크립트 실행 오류:', error);
        }
        if (stdout) {
          console.log('📝 스크립트 출력:', stdout);
        }
        if (stderr) {
          console.error('⚠️ 스크립트 오류:', stderr);
        }
      }
    );

    // 즉시 응답 반환 (스크립트는 백그라운드에서 실행)
    return res.status(200).json({
      success: true,
      message: '카카오톡 프로필 업데이트가 시작되었습니다',
      account,
      date,
      note: '브라우저가 열리면 자동으로 진행됩니다. 수동 확인이 필요할 수 있습니다.'
    });

  } catch (error) {
    console.error('❌ 카카오톡 프로필 업데이트 API 오류:', error);
    return res.status(500).json({
      success: false,
      message: '프로필 업데이트 실패',
      error: error.message
    });
  }
}
