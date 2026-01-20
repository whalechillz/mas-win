import { requireAuth } from '../../../../lib/api-auth';

export default async function handler(req, res) {
  try {
    // ✅ NextAuth 방식으로 인증 체크
    await requireAuth(req, res, { requireEditor: true });
  } catch (error) {
    // requireAuth가 이미 401/403 응답을 보냈으므로 여기서는 아무것도 하지 않음
    return;
  }

  // 캠페인 ID 확인
  const { campaign } = req.query;
  
  // 정적 파일로 리다이렉트
  res.redirect(`/op-manual/${campaign}.html`);
}
