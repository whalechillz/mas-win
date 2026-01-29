/**
 * 제품 합성 관리(클럽/굿즈/부품) 이미지 전체 백업
 * Supabase product_composition 테이블에서 이미지 URL 수집 후 로컬로 다운로드
 *
 * 사용: node scripts/backup-product-composition-images.js
 * 환경: .env.local 에 NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 필요
 */

const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

// .env.local 로드
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yyytjudftvpmcnppaymw.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ .env.local 에 SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.');
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET = 'blog-images';
const BACKUP_DIR = path.join(__dirname, '..', 'backup', `product-composition-${new Date().toISOString().slice(0, 10)}`);

/** 상대 경로 → Supabase 공개 URL */
function toFullUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  const clean = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${clean}`;
}

/** URL에서 안전한 파일명 추출 */
function safeFilename(url, index = 0) {
  try {
    const u = new URL(url);
    const base = path.basename(u.pathname) || `image-${index}`;
    return base.replace(/[^a-zA-Z0-9._-]/g, '_');
  } catch {
    return `image-${index}.webp`;
  }
}

/** 카테고리 → 폴더명 (관리 페이지 탭과 동일) */
function categoryToFolder(category) {
  if (category === 'driver') return 'clubs';
  if (category === 'component') return 'components';
  return 'goods'; // hat, apparel, accessory
}

/** 이미지 다운로드 */
function downloadImage(url, filePath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const file = fs.createWriteStream(filePath);
    protocol.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => { file.close(); resolve(filePath); });
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        downloadImage(response.headers.location, filePath).then(resolve).catch(reject);
      } else {
        file.close();
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        reject(new Error(`HTTP ${response.statusCode}: ${url}`));
      }
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      reject(err);
    });
  });
}

/** 제품 하나에서 이미지 URL 배열 수집 */
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
  console.log('📦 제품 합성 이미지 백업 시작');
  console.log('   Supabase:', supabaseUrl);
  console.log('   저장 경로:', BACKUP_DIR);

  const { data: products, error } = await supabase
    .from('product_composition')
    .select('id, name, category, slug, image_url, reference_images, driver_parts, shaft_image_url, badge_image_url, shaft_logo_image_url')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('❌ product_composition 조회 실패:', error);
    process.exit(1);
  }

  const total = (products || []).length;
  console.log(`   제품 수: ${total} (클럽/굿즈/부품 전체)\n`);

  let downloaded = 0;
  let failed = 0;
  const seenUrls = new Set();

  for (const product of products || []) {
    const folder = categoryToFolder(product.category);
    const slug = (product.slug || product.id || 'unknown').replace(/[^a-z0-9-_]/gi, '_');
    const urls = collectImageUrls(product);
    const dir = path.join(BACKUP_DIR, folder);
    const isComponent = folder === 'components';
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      if (!isComponent && seenUrls.has(url)) continue;
      if (!isComponent) seenUrls.add(url);
      const baseName = safeFilename(url, i);
      const fileName = `${slug}_${i}_${baseName}`;
      const filePath = path.join(dir, fileName);
      try {
        await downloadImage(url, filePath);
        downloaded++;
        if (downloaded % 20 === 0) console.log(`   다운로드 ${downloaded}개...`);
      } catch (err) {
        failed++;
        console.warn(`   ⚠️ 실패: ${product.name} - ${baseName}`, err.message);
      }
    }
  }

  console.log('\n✅ 백업 완료');
  console.log(`   성공: ${downloaded}개`);
  if (failed > 0) console.log(`   실패: ${failed}개`);
  console.log(`   폴더: ${BACKUP_DIR}`);
  console.log('\n   클럽(드라이버):', path.join(BACKUP_DIR, 'clubs'));
  console.log('   굿즈:', path.join(BACKUP_DIR, 'goods'));
  console.log('   부품:', path.join(BACKUP_DIR, 'components'));
}

main().catch((err) => {
  console.error('❌', err);
  process.exit(1);
});
