const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const bucketName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'blog-images';

// HTML 파일 경로
const VERSIONS_DIR = path.join(process.cwd(), 'public', 'versions');

// HTML 파일에서 이미지 경로 추출
function extractImagePathsFromHTML(htmlContent, htmlFileName) {
  const imagePaths = new Set();
  
  // <img src="..."> 태그 추출
  const imgTagRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = imgTagRegex.exec(htmlContent)) !== null) {
    const src = match[1];
    if (src && !src.startsWith('data:')) {
      imagePaths.add(src);
    }
  }
  
  // CSS background-image 추출
  const bgImageRegex = /background-image:\s*url\(["']?([^"')]+)["']?\)/gi;
  while ((match = bgImageRegex.exec(htmlContent)) !== null) {
    const url = match[1];
    if (url && !url.startsWith('data:')) {
      imagePaths.add(url);
    }
  }
  
  return Array.from(imagePaths);
}

// Storage URL을 파일 경로로 변환
function convertStorageUrlToPath(storageUrl) {
  try {
    const url = new URL(storageUrl);
    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
    if (pathMatch) {
      return pathMatch[1];
    }
  } catch (e) {
    // URL 파싱 실패 시 원본 반환
  }
  return storageUrl;
}

// 상대 경로를 절대 경로로 변환
function normalizeImagePath(imagePath, htmlFileName) {
  // 이미 절대 경로인 경우
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return convertStorageUrlToPath(imagePath);
  }
  
  // Storage 경로인 경우
  if (imagePath.startsWith('originals/')) {
    return imagePath;
  }
  
  // 상대 경로인 경우 (/campaigns/...)
  if (imagePath.startsWith('/campaigns/')) {
    return `originals${imagePath}`;
  }
  
  // campaigns/... (상대 경로)
  if (imagePath.startsWith('campaigns/')) {
    return `originals/${imagePath}`;
  }
  
  return imagePath;
}

// 파일명에서 UUID 제거
function extractBaseFileName(fileName) {
  const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}-(.+)$/;
  const match = fileName.match(uuidPattern);
  if (match) {
    return match[1];
  }
  return fileName;
}

// 파일명 정규화 (확장자 제거, 소문자 변환, 특수문자 제거)
function normalizeFileName(fileName) {
  const baseName = extractBaseFileName(fileName);
  const withoutExt = baseName.replace(/\.[^/.]+$/, '');
  return withoutExt.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
}

async function analyzeFunnelDuplicates() {
  console.log('🔍 Phase 8: 퍼널 이미지 중복 분석 및 정리\n');
  console.log('='.repeat(60));

  // 1. HTML 파일에서 이미지 경로 추출
  console.log('\n📋 1단계: HTML 파일에서 이미지 경로 추출');
  const htmlFiles = [
    'funnel-2025-05-live.html',
    'funnel-2025-06-live.html',
    'funnel-2025-07-live.html',
    'funnel-2025-08-live-a.html',
    'funnel-2025-08-live-b.html',
    'funnel-2025-09-live.html',
  ];

  const htmlImageUsage = {};
  
  for (const htmlFile of htmlFiles) {
    const htmlPath = path.join(VERSIONS_DIR, htmlFile);
    if (!fs.existsSync(htmlPath)) {
      console.log(`  ⚠️  파일 없음: ${htmlFile}`);
      continue;
    }
    
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    const imagePaths = extractImagePathsFromHTML(htmlContent, htmlFile);
    
    htmlImageUsage[htmlFile] = imagePaths.map(p => normalizeImagePath(p, htmlFile));
    console.log(`  ✅ ${htmlFile}: ${imagePaths.length}개 이미지 경로`);
  }

  // 2. DB에서 campaigns 폴더의 모든 이미지 조회
  console.log('\n📦 2단계: DB에서 campaigns 폴더 이미지 조회');
  const { data: dbImages, error: dbError } = await supabase
    .from('image_assets')
    .select('id, filename, file_path, cdn_url, hash_md5, original_filename')
    .like('file_path', 'originals/campaigns/%')
    .order('file_path', { ascending: true });

  if (dbError) {
    console.error('❌ DB 조회 실패:', dbError.message);
    process.exit(1);
  }
  console.log(`✅ DB 이미지 조회: ${dbImages.length}개`);

  // 3. 각 이미지의 사용 현황 확인
  console.log('\n🔍 3단계: 각 이미지의 사용 현황 확인');
  const imageUsageMap = new Map();
  
  for (const image of dbImages) {
    const usage = {
      htmlFiles: [],
      blogPosts: [],
      isUsed: false,
    };
    
    // HTML 파일에서 사용 확인
    for (const [htmlFile, imagePaths] of Object.entries(htmlImageUsage)) {
      const imagePath = image.file_path;
      const cdnUrl = image.cdn_url;
      const filename = image.filename;
      const originalFilename = image.original_filename;
      
      // file_path로 매칭
      if (imagePaths.some(p => {
        const normalizedP = p.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
        const normalizedPath = imagePath.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
        return normalizedP.includes(normalizedPath) || normalizedPath.includes(normalizedP);
      })) {
        usage.htmlFiles.push(htmlFile);
        usage.isUsed = true;
      }
      
      // cdn_url로 매칭
      if (cdnUrl) {
        const cdnUrlPath = convertStorageUrlToPath(cdnUrl);
        if (imagePaths.some(p => {
          const normalizedP = p.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
          const normalizedCdn = cdnUrlPath.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
          return normalizedP.includes(normalizedCdn) || normalizedCdn.includes(normalizedP) || 
                 p.includes(cdnUrl) || cdnUrl.includes(p);
        })) {
          if (!usage.htmlFiles.includes(htmlFile)) {
            usage.htmlFiles.push(htmlFile);
            usage.isUsed = true;
          }
        }
      }
      
      // filename으로 매칭 (UUID 제거 후)
      const baseFileName = extractBaseFileName(filename || '');
      if (baseFileName && imagePaths.some(p => {
        const normalizedP = p.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
        const normalizedBase = baseFileName.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
        return normalizedP.includes(normalizedBase) || normalizedBase.includes(normalizedP);
      })) {
        if (!usage.htmlFiles.includes(htmlFile)) {
          usage.htmlFiles.push(htmlFile);
          usage.isUsed = true;
        }
      }
      
      // original_filename으로 매칭
      if (originalFilename && imagePaths.some(p => {
        const normalizedP = p.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
        const normalizedOrig = originalFilename.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
        return normalizedP.includes(normalizedOrig) || normalizedOrig.includes(normalizedP);
      })) {
        if (!usage.htmlFiles.includes(htmlFile)) {
          usage.htmlFiles.push(htmlFile);
          usage.isUsed = true;
        }
      }
    }
    
    imageUsageMap.set(image.id, {
      image,
      usage,
    });
  }

  const usedImages = Array.from(imageUsageMap.values()).filter(item => item.usage.isUsed);
  const unusedImages = Array.from(imageUsageMap.values()).filter(item => !item.usage.isUsed);
  
  console.log(`✅ 사용 중인 이미지: ${usedImages.length}개`);
  console.log(`⚠️  미사용 이미지: ${unusedImages.length}개`);

  // 4. 중복 이미지 감지
  console.log('\n🔄 4단계: 중복 이미지 감지');

  // 4-1. hash_md5 기반 중복 감지
  const hashMap = new Map();
  const hashDuplicates = [];
  
  dbImages.forEach(img => {
    if (!img.hash_md5) return;
    if (hashMap.has(img.hash_md5)) {
      hashMap.get(img.hash_md5).push(img);
    } else {
      hashMap.set(img.hash_md5, [img]);
    }
  });
  
  hashMap.forEach((group, hash) => {
    if (group.length > 1) {
      hashDuplicates.push({ hash, count: group.length, images: group });
    }
  });
  console.log(`  ✅ hash_md5 기반 중복: ${hashDuplicates.length}개 그룹`);

  // 4-2. 파일명 기반 중복 감지 (UUID 제거 후 비교)
  const fileNameMap = new Map();
  const fileNameDuplicates = [];
  
  dbImages.forEach(img => {
    const normalizedName = normalizeFileName(img.filename || '');
    if (!normalizedName) return;
    if (fileNameMap.has(normalizedName)) {
      fileNameMap.get(normalizedName).push(img);
    } else {
      fileNameMap.set(normalizedName, [img]);
    }
  });
  
  fileNameMap.forEach((group, normalizedName) => {
    if (group.length > 1) {
      fileNameDuplicates.push({ normalizedName, count: group.length, images: group });
    }
  });
  console.log(`  ✅ 파일명 기반 중복: ${fileNameDuplicates.length}개 그룹`);

  // 5. 중복 이미지 중 사용 현황 확인
  console.log('\n📊 5단계: 중복 이미지 사용 현황 확인');
  
  const duplicateGroupsWithUsage = [];
  
  // hash 기반 중복 그룹
  for (const dupGroup of hashDuplicates) {
    const groupWithUsage = {
      type: 'hash_md5',
      hash: dupGroup.hash,
      count: dupGroup.count,
      images: dupGroup.images.map(img => {
        const usageInfo = imageUsageMap.get(img.id);
        return {
          ...img,
          usage: usageInfo ? usageInfo.usage : { htmlFiles: [], blogPosts: [], isUsed: false },
        };
      }),
    };
    duplicateGroupsWithUsage.push(groupWithUsage);
  }
  
  // 파일명 기반 중복 그룹
  for (const dupGroup of fileNameDuplicates) {
    const groupWithUsage = {
      type: 'filename',
      normalizedName: dupGroup.normalizedName,
      count: dupGroup.count,
      images: dupGroup.images.map(img => {
        const usageInfo = imageUsageMap.get(img.id);
        return {
          ...img,
          usage: usageInfo ? usageInfo.usage : { htmlFiles: [], blogPosts: [], isUsed: false },
        };
      }),
    };
    duplicateGroupsWithUsage.push(groupWithUsage);
  }

  // 6. 안전하게 제거 가능한 중복 이미지 식별
  console.log('\n🗑️  6단계: 안전하게 제거 가능한 중복 이미지 식별');
  
  const safeToRemove = [];
  const keepImages = [];
  
  for (const group of duplicateGroupsWithUsage) {
    const usedInGroup = group.images.filter(img => img.usage.isUsed);
    const unusedInGroup = group.images.filter(img => !img.usage.isUsed);
    
    if (usedInGroup.length > 0 && unusedInGroup.length > 0) {
      // 사용 중인 이미지는 보존, 미사용 이미지는 제거 가능
      keepImages.push(...usedInGroup);
      safeToRemove.push(...unusedInGroup);
    } else if (usedInGroup.length === 0 && unusedInGroup.length > 1) {
      // 모두 미사용이지만 여러 개인 경우, 하나만 보존
      keepImages.push(unusedInGroup[0]);
      safeToRemove.push(...unusedInGroup.slice(1));
    }
  }
  
  console.log(`  ✅ 보존할 이미지: ${keepImages.length}개`);
  console.log(`  🗑️  제거 가능한 이미지: ${safeToRemove.length}개`);

  // 7. 결과 저장
  const result = {
    summary: {
      totalImages: dbImages.length,
      usedImages: usedImages.length,
      unusedImages: unusedImages.length,
      hashDuplicates: hashDuplicates.length,
      fileNameDuplicates: fileNameDuplicates.length,
      safeToRemove: safeToRemove.length,
      keepImages: keepImages.length,
    },
    htmlImageUsage,
    duplicateGroups: duplicateGroupsWithUsage,
    safeToRemove: safeToRemove.map(img => ({
      id: img.id,
      filename: img.filename,
      file_path: img.file_path,
      cdn_url: img.cdn_url,
      original_filename: img.original_filename,
    })),
    keepImages: keepImages.map(img => ({
      id: img.id,
      filename: img.filename,
      file_path: img.file_path,
      cdn_url: img.cdn_url,
      original_filename: img.original_filename,
      usage: img.usage,
    })),
  };

  const outputPath = path.join(process.cwd(), 'docs', 'phase8-funnel-duplicates-analysis.json');
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`\n📄 결과 저장: ${outputPath}`);

  // 8. 요약 출력
  console.log('\n' + '='.repeat(60));
  console.log('📊 퍼널 이미지 중복 분석 결과 요약\n');
  console.log(`1. 전체 이미지: ${dbImages.length}개`);
  console.log(`2. 사용 중인 이미지: ${usedImages.length}개`);
  console.log(`3. 미사용 이미지: ${unusedImages.length}개`);
  console.log(`4. hash_md5 기반 중복 그룹: ${hashDuplicates.length}개`);
  console.log(`5. 파일명 기반 중복 그룹: ${fileNameDuplicates.length}개`);
  console.log(`6. 보존할 이미지: ${keepImages.length}개`);
  console.log(`7. 제거 가능한 이미지: ${safeToRemove.length}개`);
  console.log('\n' + '='.repeat(60));
  console.log('💡 다음 단계\n');
  console.log('1. 결과 파일 확인: docs/phase8-funnel-duplicates-analysis.json');
  console.log('2. 제거 가능한 이미지 검토 후 안전하게 제거');
  console.log('3. HTML 파일 사용 현황 확인 및 검증');
}

if (require.main === module) {
  analyzeFunnelDuplicates().catch(console.error);
}

module.exports = { analyzeFunnelDuplicates };








