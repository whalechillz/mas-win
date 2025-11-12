const fs = require('fs');
const path = require('path');

// 파일명 정규화 (UUID 제거, 언더스코어 제거, 소문자 변환)
function normalizeFileName(fileName) {
  if (!fileName) return '';
  // UUID 패턴 제거: 842b4045-55b3-4e81-940d-245b51e0801b-golferavatar512x51202.jpg
  const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}-(.+)$/;
  let baseName = fileName;
  const match = fileName.match(uuidPattern);
  if (match) {
    baseName = match[1];
  }
  // 확장자 제거
  const withoutExt = baseName.replace(/\.[^/.]+$/, '');
  // 소문자 변환, 특수문자 제거
  return withoutExt.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
}

// HTML 파일에서 이미지 경로 추출
function extractImagePathsFromHTML(htmlContent) {
  const imagePaths = [];
  
  // <img src="..."> 태그
  const imgTagRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = imgTagRegex.exec(htmlContent)) !== null) {
    const src = match[1];
    if (src && (src.startsWith('/campaigns/') || src.startsWith('/originals/'))) {
      imagePaths.push(src);
    }
  }
  
  // background-image: url(...)
  const bgImageRegex = /background-image:\s*url\(["']?([^"')]+)["']?\)/gi;
  while ((match = bgImageRegex.exec(htmlContent)) !== null) {
    const url = match[1];
    if (url && (url.startsWith('/campaigns/') || url.startsWith('/originals/'))) {
      imagePaths.push(url);
    }
  }
  
  return [...new Set(imagePaths)]; // 중복 제거
}

// 퍼널 페이지 스캔
function scanFunnelPages() {
  const versionsDir = path.join(process.cwd(), 'public', 'versions');
  const results = {};
  
  // 모든 funnel-*.html 파일 찾기
  const files = fs.readdirSync(versionsDir).filter(f => 
    f.startsWith('funnel-') && f.endsWith('.html') && !f.includes('backup')
  );
  
  console.log(`📂 발견된 퍼널 페이지: ${files.length}개\n`);
  
  for (const file of files) {
    const filePath = path.join(versionsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const imagePaths = extractImagePathsFromHTML(content);
    
    // 파일명에서 월 추출 (예: funnel-2025-05-live.html -> 2025-05)
    const monthMatch = file.match(/funnel-(\d{4}-\d{2})/);
    const month = monthMatch ? monthMatch[1] : 'unknown';
    
    results[file] = {
      month,
      imagePaths,
      count: imagePaths.length
    };
    
    console.log(`📄 ${file} (${month})`);
    console.log(`   이미지: ${imagePaths.length}개`);
    imagePaths.forEach(img => {
      const fileName = img.split('/').pop();
      const normalized = normalizeFileName(fileName);
      console.log(`   - ${img} (정규화: ${normalized})`);
    });
    console.log('');
  }
  
  // 통계
  const totalImages = Object.values(results).reduce((sum, r) => sum + r.count, 0);
  const uniqueImages = new Set();
  Object.values(results).forEach(r => {
    r.imagePaths.forEach(img => uniqueImages.add(img));
  });
  
  console.log(`\n📊 통계:`);
  console.log(`   총 퍼널 페이지: ${files.length}개`);
  console.log(`   총 이미지 참조: ${totalImages}개`);
  console.log(`   고유 이미지: ${uniqueImages.size}개`);
  
  // 결과 저장
  const outputPath = path.join(process.cwd(), 'docs', 'funnel-pages-scan-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 결과 저장: ${outputPath}`);
  
  return results;
}

// 실행
if (require.main === module) {
  scanFunnelPages();
}

module.exports = { scanFunnelPages, extractImagePathsFromHTML, normalizeFileName };



