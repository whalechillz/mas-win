export default function handler(req, res) {
  // 관리자 인증 확인
  const { admin_auth } = req.cookies;
  
  if (!admin_auth || admin_auth !== '1') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 캠페인 ID 확인
  const { campaign } = req.query;
  
  // 정적 파일로 리다이렉트
  res.redirect(`/op-manual/${campaign}.html`);
}
