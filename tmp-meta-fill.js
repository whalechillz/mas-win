(async () => {
  const urls = [
    'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/massgoo-golf-swing-driver-497',
    'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/massgoo-golf-course-smile-driver-316',
    'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/massgoo-golf-course-fun-driver-516',
    'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/massgoo-golf-male-618',
    'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/massgoo-mountain-golf-course-driver-645',
    'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/massgoo-golf-course-fun-driver-703',
    'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/massgoo-golf-swing-driver-946',
    'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/massgoo-golf-swing-rain-driver-696',
    'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/massgoo-golf-male-805',
    'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/massgoo-golf-swing-driver-696',
    'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/massgoo-golf-swing-rain-driver-658',
    'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/massgoo-golf-swing-rain-driver-158',
    'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/massgoo-golf-course-driver-029',
    'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/massgoo-golf-swing-driver-843',
    'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/massgoo-golf-swing-rain-driver-282',
    'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/massgoo-golf-swing-beautiful-driver-590',
    'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/massgoo-golf-swing-driver-604',
    'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/massgoo-golf-player-male-023',
    'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/massgoo-golf-course-relaxed-driver-858',
    'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/massgoo-golf-course-relaxed-male-437'
  ];
  const res = await fetch('https://www.masgolf.co.kr/api/admin/image-metadata-batch/', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageUrls: urls })
  });
  const json = await res.json();
  const meta = json.metadata || {};
  const missing = urls.filter(u => !meta[u]);
  const pick = missing.slice(0, 10);
  function baseName(u) { const p = u.split('/').pop() || ''; return p; }
  function mkText(u) { return baseName(u).replace(/[-_]/g, ' ').replace(/\.[a-zA-Z0-9]+$/, '').trim(); }
  const saved = [];
  for (const url of pick) {
    const name = baseName(url);
    const text = mkText(url);
    const body = {
      imageName: name,
      imageUrl: url,
      alt_text: `${text} 이미지`,
      keywords: text.split(' ').filter(Boolean).slice(0, 8),
      title: text.split(' ').slice(0, 5).join(' '),
      description: `${text} 관련 사진입니다.`,
      category: '골프'
    };
    const r = await fetch('https://www.masgolf.co.kr/api/admin/image-metadata/', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    let j = {};
    try { j = await r.json(); } catch {}
    saved.push({ url, status: r.status, ok: r.ok, id: j?.metadata?.id });
  }
  // Duplicate-like check (same base without trailing digits)
  function stem(u) { return mkText(u).replace(/[-_]?\d+$/, ''); }
  const stems = urls.map(u => ({ u, s: stem(u) }));
  const groups = {};
  for (const { u, s } of stems) { groups[s] = groups[s] || []; groups[s].push(u); }
  const dupGroups = Object.entries(groups).filter(([, arr]) => arr.length > 1);
  console.log(JSON.stringify({ total: urls.length, alreadyHave: urls.length - missing.length, toSave: pick.length, saved, duplicateGroups: dupGroups.slice(0,5) }, null, 2));
})();
