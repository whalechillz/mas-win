export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { urls = [] } = req.body || {};
    if (!Array.isArray(urls) || urls.length === 0) return res.status(400).json({ error: 'urls required' });
    const checks = await Promise.all(urls.map(async (u) => {
      try {
        const r = await fetch(u, { method: 'HEAD' });
        return { url: u, ok: r.ok, status: r.status };
      } catch (e) {
        return { url: u, ok: false, status: 0 };
      }
    }));
    return res.status(200).json({ checks });
  } catch (e) {
    console.error('image-link-check error', e);
    return res.status(500).json({ error: 'Internal error' });
  }
}


