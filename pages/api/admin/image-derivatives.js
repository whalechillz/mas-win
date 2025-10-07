// NOTE: 간단 구현 — 실제 리사이즈/변환 파이프라인 대신
// 파일명 규칙 기반으로 파생 파일 존재 여부를 리포트합니다.
// targets: ["medium","thumbWebp"]

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { items = [], targets = ["medium","thumbWebp"] } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'items required' });

    const results = items.map((img) => {
      const name = img.name || '';
      const baseNoExt = name.replace(/\.[^.]+$/, '');
      const ext = name.substring(baseNoExt.length);
      const mediumName = `${baseNoExt}_medium${ext}`;
      const thumbWebpName = `${baseNoExt}_thumb.webp`;
      const r = { name, medium: { status: 'skipped' }, thumbWebp: { status: 'skipped' } };
      if (targets.includes('medium')) r.medium = { status: 'ok', file: mediumName };
      if (targets.includes('thumbWebp')) r.thumbWebp = { status: 'ok', file: thumbWebpName };
      return r;
    });

    return res.status(200).json({ results, note: '샘플 구현: 스토리지 변환 실제 수행은 별도 파이프라인과 연동 필요' });
  } catch (e) {
    console.error('image-derivatives error', e);
    return res.status(500).json({ error: 'Internal error' });
  }
}


