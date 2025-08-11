// pages/api/generate-multichannel-content-simple.js
// 가장 단순한 버전 (테스트용)

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // 일단 성공 응답만 반환
  res.status(200).json({
    success: true,
    message: '콘텐츠가 생성되었습니다!',
    count: 5,
    data: []
  });
}