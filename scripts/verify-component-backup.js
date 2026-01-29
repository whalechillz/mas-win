/**
 * 부품(component) 카테고리 백업 검증
 * product_composition에서 category=component 제품과 이미지 URL 수를 확인 후,
 * backup 폴더의 components/ 파일 수와 대조
 *
 * 사용: node scripts/verify-component-backup.js
 */

const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yyytjudftvpmcnppaymw.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseKey) {
  console.error('❌ .env.local 에 SUPABASE_SERVICE_ROLE_KEY 필요');
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, supabaseKey);

function toFullUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http')) return trimmed;
  const clean = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
  return `${supabaseUrl}/storage/v1/object/public/blog-images/${clean}`;
}

function collectImageUrls(product) {
  const urls = [];
  if (product.image_url) urls.push(toFullUrl(product.image_url));
  const refs = Array.isArray(product.reference_images) ? product.reference_images : [];
  refs.forEach((r) => { const u = toFullUrl(r); if (u) urls.push(u); });
  const parts = product.driver_parts || {};
  ['crown', 'sole', 'face'].forEach((key) => {
    const arr = parts[key];
    if (Array.isArray(arr)) arr.forEach((p) => { const u = toFullUrl(p); if (u) urls.push(u); });
  });
  if (product.shaft_image_url) urls.push(toFullUrl(product.shaft_image_url));
  if (product.badge_image_url) urls.push(toFullUrl(product.badge_image_url));
  if (product.shaft_logo_image_url) urls.push(toFullUrl(product.shaft_logo_image_url));
  return [...new Set(urls)].filter(Boolean);
}

async function main() {
  const backupBase = path.join(__dirname, '..', 'backup');
  const dirs = fs.existsSync(backupBase) ? fs.readdirSync(backupBase) : [];
  const foldersOnly = dirs.filter((d) => {
    const full = path.join(backupBase, d);
    return d.startsWith('product-composition-') && fs.existsSync(full) && fs.statSync(full).isDirectory();
  });
  const latest = foldersOnly.sort().pop();
  const componentsDir = latest ? path.join(backupBase, latest, 'components') : null;
  const backedFiles = componentsDir && fs.existsSync(componentsDir)
    ? fs.readdirSync(componentsDir).filter((f) => f.endsWith('.webp') || f.endsWith('.png') || f.endsWith('.jpg'))
    : [];

  const { data: products, error } = await supabase
    .from('product_composition')
    .select('id, name, category, slug, image_url, reference_images, driver_parts, shaft_image_url, badge_image_url, shaft_logo_image_url')
    .eq('category', 'component')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('❌ 조회 실패:', error);
    process.exit(1);
  }

  const componentProducts = products || [];
  console.log('=== 부품(component) 백업 검증 ===\n');
  console.log('DB 부품 제품 수:', componentProducts.length);
  console.log('백업 폴더(components) 파일 수:', backedFiles.length);
  if (latest) console.log('백업 경로:', path.join(backupBase, latest, 'components'));

  let totalExpected = 0;
  console.log('\n--- 부품 제품별 이미지 ---');
  for (const p of componentProducts) {
    const urls = collectImageUrls(p);
    totalExpected += urls.length;
    console.log(`  [${p.name}] slug=${p.slug} | image_url=${p.image_url ? 'O' : 'X'} | refs=${(p.reference_images || []).length} | 수집 URL=${urls.length}개`);
  }

  console.log('\n--- 요약 ---');
  console.log('  예상 이미지 수(중복 제외 전 제품 합계):', totalExpected);
  console.log('  실제 백업된 파일 수:', backedFiles.length);
  if (backedFiles.length < totalExpected) {
    console.log('  ⚠️ 백업이 부족할 수 있음. (동일 URL은 1회만 저장되므로 예상보다 적을 수 있음)');
  } else if (backedFiles.length >= componentProducts.length) {
    console.log('  ✅ 부품 제품 수 대비 백업 파일이 있음.');
  }
  console.log('\n백업된 파일 목록:');
  backedFiles.forEach((f) => console.log('  -', f));
}

main().catch((e) => { console.error(e); process.exit(1); });
