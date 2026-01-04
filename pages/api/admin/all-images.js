// 전체 이미지 조회 API
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 전체 개수 캐싱 (15분간 유효)
let totalCountCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15분

// 이미지 목록 캐싱 (10분간 유효) - 폴더별 캐싱
let imagesCache = new Map();
let imagesCacheTimestamp = 0;
const IMAGES_CACHE_DURATION = 10 * 60 * 1000; // 10분

// 폴더별 캐싱 추가
const folderCache = new Map(); // 폴더별 캐시
const folderCacheTimestamps = new Map(); // 폴더별 캐시 타임스탬프

// 캐시 무효화 함수 (외부에서 호출 가능)
export function invalidateCache() {
  totalCountCache = null;
  cacheTimestamp = 0;
  imagesCache.clear();
  imagesCacheTimestamp = 0;
  // 🔧 폴더별 캐시도 무효화
  folderCache.clear();
  folderCacheTimestamps.clear();
  console.log('🗑️ 이미지 목록 캐시 무효화 완료 (폴더별 캐시 포함)');
}

// ✅ 메타데이터 품질 검증 함수
const hasQualityMetadata = (metadata) => {
  if (!metadata) return false;
  
  // 의미 있는 메타데이터가 하나 이상 있는지 확인
  const hasAltText = metadata.alt_text && metadata.alt_text.trim().length > 0;
  const hasTitle = metadata.title && metadata.title.trim().length > 0;
  const hasDescription = metadata.description && metadata.description.trim().length > 0;
  const hasKeywords = metadata.tags && (
    Array.isArray(metadata.tags) ? metadata.tags.length > 0 : (typeof metadata.tags === 'string' && metadata.tags.trim().length > 0)
  );
  
  return hasAltText || hasTitle || hasDescription || hasKeywords;
};

// ✅ 메타데이터 품질 점수 계산 함수 (0-100점)
const calculateMetadataQualityScore = (metadata) => {
  if (!metadata) return 0;
  
  let score = 0;
  
  if (metadata.alt_text && metadata.alt_text.trim().length > 0) {
    score += 25; // ALT 텍스트 있음
  }
  
  if (metadata.title && metadata.title.trim().length > 0) {
    score += 25; // 제목 있음
  }
  
  if (metadata.description && metadata.description.trim().length > 0) {
    score += 25; // 설명 있음
  }
  
  const hasKeywords = metadata.tags && (
    Array.isArray(metadata.tags) ? metadata.tags.length > 0 : (typeof metadata.tags === 'string' && metadata.tags.trim().length > 0)
  );
  if (hasKeywords) {
    score += 25; // 키워드 있음
  }
  
  return score;
};

// 파일명 정규화 (UUID 제거, 언더스코어 제거, 소문자 변환, 확장자 제거)
function normalizeFileName(fileName) {
  if (!fileName) return '';
  // UUID 패턴 제거: 842b4045-55b3-4e81-940d-245b51e0801b-golferavatar512x51202.jpg
  const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}-(.+)$/;
  let baseName = fileName;
  const match = fileName.match(uuidPattern);
  if (match) {
    baseName = match[1];
  }
  const withoutExt = baseName.replace(/\.[^/.]+$/, '');
  return withoutExt.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
}

// 폴더 경로(월)를 고려한 이미지 매칭 (campaigns 폴더용)
function matchesImageWithMonth(imagePath, filePath, fileName) {
  if (!imagePath || !filePath) return false;
  
  // filePath에서 월 추출 (예: originals/campaigns/2025-05/xxx.jpg)
  const storageMonthMatch = filePath.match(/campaigns\/(\d{4}-\d{2})/);
  if (!storageMonthMatch) {
    // campaigns 폴더가 아니면 기존 로직 사용
    return matchesImage(imagePath, filePath, fileName);
  }
  const storageMonth = storageMonthMatch[1];
  
  // imagePath에서 월 추출 (예: /campaigns/2025-05/golfer_avatar_512x512_02.jpg)
  const imagePathMatch = imagePath.match(/\/campaigns\/(\d{4}-\d{2})\/(.+)$/);
  if (!imagePathMatch) {
    // campaigns 경로가 아니면 기존 로직 사용
    return matchesImage(imagePath, filePath, fileName);
  }
  
  const imageMonth = imagePathMatch[1];
  const imageFileName = imagePathMatch[2];
  
  // 월이 일치해야 함
  if (imageMonth !== storageMonth) {
    return false;
  }
  
  // 파일명 정규화 비교
  const normalizedImage = normalizeFileName(imageFileName);
  const normalizedStorage = normalizeFileName(fileName);
  
  if (normalizedImage && normalizedStorage && normalizedImage === normalizedStorage) {
    return true;
  }
  
  return false;
}

// 이미지 URL이 특정 파일과 일치하는지 확인
function matchesImage(imageUrl, filePath, fileName) {
  if (!imageUrl) return false;
  
  // 1. Supabase Storage URL에서 파일 경로 추출
  const storageUrlMatch = imageUrl.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
  if (storageUrlMatch) {
    const storagePath = decodeURIComponent(storageUrlMatch[1]);
    if (storagePath === filePath) return true;
    const storageFileName = storagePath.split('/').pop();
    if (storageFileName === fileName) return true;
    const normalizedStorage = normalizeFileName(storageFileName);
    const normalizedFile = normalizeFileName(fileName);
    if (normalizedStorage && normalizedFile && normalizedStorage === normalizedFile) return true;
  }
  
  // 2. 상대 경로 처리
  if (imageUrl.startsWith('/campaigns/') || imageUrl.startsWith('/originals/')) {
    const relativePath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
    if (filePath.includes(relativePath) || relativePath.includes(filePath)) return true;
    const relativeFileName = relativePath.split('/').pop().split('?')[0];
    if (relativeFileName === fileName) return true;
    const normalizedRelative = normalizeFileName(relativeFileName);
    const normalizedFile = normalizeFileName(fileName);
    if (normalizedRelative && normalizedFile && normalizedRelative === normalizedFile) return true;
  }
  
  // 3. 직접 파일명 비교
  const urlFileName = imageUrl.split('/').pop().split('?')[0];
  if (urlFileName === fileName) return true;
  if (imageUrl.includes(filePath)) return true;
  const normalizedUrl = normalizeFileName(urlFileName);
  const normalizedFile = normalizeFileName(fileName);
  if (normalizedUrl && normalizedFile && normalizedUrl === normalizedFile) return true;
  
  // 4. UUID 제거 후 파일명 비교
  const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}-(.+)$/;
  const urlMatch = urlFileName.match(uuidPattern);
  const fileMatch = fileName.match(uuidPattern);
  
  if (urlMatch && fileMatch) {
    if (urlMatch[1] === fileMatch[1]) return true;
    const normalizedUrlBase = normalizeFileName(urlMatch[1]);
    const normalizedFileBase = normalizeFileName(fileMatch[1]);
    if (normalizedUrlBase && normalizedFileBase && normalizedUrlBase === normalizedFileBase) return true;
  }
  
  if (urlMatch) {
    const urlBaseName = urlMatch[1];
    const fileBaseName = fileName.replace(uuidPattern, '$1');
    if (urlBaseName === fileBaseName) return true;
    const normalizedUrlBase = normalizeFileName(urlBaseName);
    const normalizedFileBase = normalizeFileName(fileBaseName);
    if (normalizedUrlBase && normalizedFileBase && normalizedUrlBase === normalizedFileBase) return true;
  }
  
  if (fileMatch) {
    const fileBaseName = fileMatch[1];
    const normalizedUrlBase = normalizeFileName(urlFileName);
    const normalizedFileBase = normalizeFileName(fileBaseName);
    if (normalizedUrlBase && normalizedFileBase && normalizedUrlBase === normalizedFileBase) return true;
  }
  
  return false;
}

// HTML 파일에서 이미지 경로 추출
function extractImagePathsFromHTML(htmlContent) {
  const imagePaths = [];
  const imgTagRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = imgTagRegex.exec(htmlContent)) !== null) {
    imagePaths.push(match[1]);
  }
  const bgImageRegex = /background-image:\s*url\(["']?([^"')]+)["']?\)/gi;
  while ((match = bgImageRegex.exec(htmlContent)) !== null) {
    imagePaths.push(match[1]);
  }
  return imagePaths;
}

// 블로그 본문에서 이미지 URL 추출
function extractImageUrlsFromMarkdown(markdownContent) {
  const imageUrls = [];
  const markdownImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  while ((match = markdownImageRegex.exec(markdownContent)) !== null) {
    imageUrls.push(match[2]);
  }
  const htmlImageRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  while ((match = htmlImageRegex.exec(markdownContent)) !== null) {
    imageUrls.push(match[1]);
  }
  return imageUrls;
}

// 이미지 사용 횟수 계산 (캐싱 포함)
let usageCountCache = new Map();
let usageCountCacheTimestamp = 0;
const USAGE_COUNT_CACHE_DURATION = 5 * 60 * 1000; // 5분

async function calculateUsageCount(filePath, fileName) {
  // 캐시 확인
  const cacheKey = `${filePath}/${fileName}`;
  const now = Date.now();
  if (usageCountCache.has(cacheKey) && (now - usageCountCacheTimestamp) < USAGE_COUNT_CACHE_DURATION) {
    return usageCountCache.get(cacheKey);
  }

  let count = 0;

  try {
    // HTML 파일 확인
    const versionsDir = path.join(process.cwd(), 'public', 'versions');
    if (fs.existsSync(versionsDir)) {
      const htmlFiles = fs.readdirSync(versionsDir).filter(f => f.endsWith('.html'));
      for (const htmlFile of htmlFiles) {
        const htmlPath = path.join(versionsDir, htmlFile);
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');
        const imagePaths = extractImagePathsFromHTML(htmlContent);
        for (const imagePath of imagePaths) {
          // campaigns 폴더인 경우 폴더 경로도 확인
          if (filePath.includes('campaigns/')) {
            if (matchesImageWithMonth(imagePath, filePath, fileName)) {
              count++;
            }
          } else {
            if (matchesImage(imagePath, filePath, fileName)) {
              count++;
            }
          }
        }
      }
    }

    // 블로그 본문 확인
    const { data: blogPosts } = await supabase
      .from('blog_posts')
      .select('id, title, content')
      .not('content', 'is', null);

    if (blogPosts) {
      for (const post of blogPosts) {
        if (!post.content) continue;
        const imageUrls = extractImageUrlsFromMarkdown(post.content);
        for (const imageUrl of imageUrls) {
          if (matchesImage(imageUrl, filePath, fileName)) {
            count++;
          }
        }
      }
    }
  } catch (error) {
    console.warn(`⚠️ 사용 횟수 계산 오류 (${filePath}):`, error.message);
  }

  // 캐시 저장
  usageCountCache.set(cacheKey, count);
  if (now - usageCountCacheTimestamp > USAGE_COUNT_CACHE_DURATION) {
    usageCountCacheTimestamp = now;
  }

  return count;
}

// ✅ 메타데이터 품질 이슈 목록 생성
const getMetadataQualityIssues = (metadata) => {
  const issues = [];
  
  if (!metadata) {
    return ['메타데이터 없음'];
  }
  
  if (!metadata.alt_text || metadata.alt_text.trim().length === 0) {
    issues.push('ALT 텍스트 없음');
  }
  
  if (!metadata.title || metadata.title.trim().length === 0) {
    issues.push('제목 없음');
  }
  
  if (!metadata.description || metadata.description.trim().length === 0) {
    issues.push('설명 없음');
  }
  
  const hasKeywords = metadata.tags && (
    Array.isArray(metadata.tags) ? metadata.tags.length > 0 : (typeof metadata.tags === 'string' && metadata.tags.trim().length > 0)
  );
  if (!hasKeywords) {
    issues.push('키워드 없음');
  }
  
  return issues.length > 0 ? issues : ['품질 양호'];
};

export default async function handler(req, res) {
  console.log('🔍 전체 이미지 조회 API 요청:', req.method, req.url);
  
  // ✅ 타임아웃 방지: Vercel Pro 60초 제한 고려하여 60초로 설정
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('요청 시간 초과 (60초 제한)')), 60000);
  });
  
  try {
    // ✅ 타임아웃과 함께 실행
    await Promise.race([
      (async () => {
        // 캐시 무효화 요청 처리 (forceRefresh 파라미터)
        const { forceRefresh } = req.query;
        if (forceRefresh === 'true' || forceRefresh === '1') {
          invalidateCache();
          console.log('🔄 캐시 강제 무효화 요청 처리');
        }
        
        if (req.method === 'GET') {
      // 기본 limit을 12로 줄여서 빠른 응답 (갤러리에서 사용)
      const { limit = 12, offset = 0, page = 1, prefix = '', includeChildren = 'true', searchQuery = '', source, channel, includeUsageInfo = 'false' } = req.query;
      const pageSize = parseInt(limit);
      const currentPage = parseInt(page);
      const currentOffset = parseInt(offset) || (currentPage - 1) * pageSize;
      const searchTerm = (searchQuery || '').trim();
      
      // 🔧 개선: prefix가 있을 때는 Storage 파일을 우선 조회
      // source/channel 필터는 메타데이터 보강용으로만 사용 (필터링 제외)
      // 이렇게 하면 image_metadata에 등록되지 않은 이미지도 표시됨
      let filteredImageUrls = null;
      const hasPrefix = prefix && prefix.trim() !== '';
      
      // prefix가 없을 때만 source/channel 필터로 image_metadata에서 필터링
      if (!hasPrefix && (source || channel)) {
        try {
          let metadataQuery = supabase
            .from('image_metadata')
            .select('image_url');
          
          if (source) {
            metadataQuery = metadataQuery.eq('source', source);
          }
          if (channel) {
            metadataQuery = metadataQuery.eq('channel', channel);
          }
          
          const { data: metadataResults, error: metadataError } = await metadataQuery;
          
          if (metadataError) {
            console.error('❌ image_metadata 필터링 오류:', metadataError);
          } else if (metadataResults && metadataResults.length > 0) {
            filteredImageUrls = new Set(metadataResults.map(m => m.image_url));
            console.log(`✅ image_metadata 필터링 결과: ${filteredImageUrls.size}개 이미지 (source: ${source || 'all'}, channel: ${channel || 'all'})`);
          } else {
            // 필터링 결과가 없으면 빈 결과 반환 (prefix가 없을 때만)
            console.log(`⚠️ 필터링 결과 없음 (source: ${source || 'all'}, channel: ${channel || 'all'})`);
            return res.status(200).json({
              images: [],
              total: 0,
              count: 0,
              pagination: {
                currentPage: 1,
                totalPages: 0,
                pageSize,
                hasNextPage: false,
                hasPrevPage: false,
                nextPage: null,
                prevPage: null
              }
            });
          }
        } catch (filterError) {
          console.error('❌ 필터링 처리 오류:', filterError);
        }
      } else if (hasPrefix && (source || channel)) {
        // prefix가 있을 때는 source/channel 필터를 무시하고 Storage 파일을 모두 조회
        // 메타데이터는 보강용으로만 사용
        console.log(`📁 prefix가 있어서 source/channel 필터 무시: ${prefix} (source: ${source || 'all'}, channel: ${channel || 'all'})`);
      }
      
      console.log('📝 전체 이미지 목록 조회 중...', { limit: pageSize, offset: currentOffset, page: currentPage, searchQuery: searchTerm });
      
      // 🔍 검색어가 있을 때: TSVECTOR 서버 사이드 검색
      if (searchTerm) {
        console.log('🔍 서버 사이드 검색 시작:', searchTerm);
        
        try {
          // 1. RPC 함수로 검색 (더 빠름)
          const { data: matchingMetadata, error: rpcError } = await supabase.rpc('search_image_metadata', {
            p_search_terms: searchTerm,
            p_limit: 1000,
            p_offset: 0
          });
          
          let metadataResults = matchingMetadata;
          
          // RPC 함수가 없거나 에러가 있으면 직접 쿼리 (폴백)
          if (rpcError || !matchingMetadata) {
            console.log('⚠️ RPC 함수 사용 불가, 직접 쿼리로 폴백');
            
            // TSVECTOR 검색 시도
            const { data: tsResults, error: tsError } = await supabase
              .from('image_metadata')
              .select('image_url, alt_text, title, description, tags, category_id, usage_count, id')
              .or(`search_vector @@ plainto_tsquery('simple', '${searchTerm.replace(/'/g, "''")}'),alt_text.ilike.%${searchTerm.replace(/%/g, '\\%')}%,title.ilike.%${searchTerm.replace(/%/g, '\\%')}%,description.ilike.%${searchTerm.replace(/%/g, '\\%')}%`)
              .limit(1000);
            
            if (tsError) {
              console.log('⚠️ TSVECTOR 검색 실패, ILIKE 검색으로 폴백:', tsError.message);
              // ILIKE 검색만 사용 (폴백)
              const { data: likeResults, error: likeError } = await supabase
                .from('image_metadata')
                .select('image_url, alt_text, title, description, tags, category_id, usage_count, id')
                .or(`alt_text.ilike.%${searchTerm.replace(/%/g, '\\%')}%,title.ilike.%${searchTerm.replace(/%/g, '\\%')}%,description.ilike.%${searchTerm.replace(/%/g, '\\%')}%`)
                .limit(1000);
              
              if (likeError) {
                console.error('❌ 메타데이터 검색 오류:', likeError);
                return res.status(500).json({ error: '검색 중 오류 발생', details: likeError.message });
              }
              metadataResults = likeResults;
            } else {
              metadataResults = tsResults;
            }
          }
          
          if (!metadataResults || metadataResults.length === 0) {
            console.log('🔍 검색 결과 없음');
            return res.status(200).json({
              images: [],
              count: 0,
              total: 0,
              pagination: {
                currentPage: 1,
                totalPages: 0,
                pageSize,
                hasNextPage: false,
                hasPrevPage: false,
                nextPage: null,
                prevPage: null
              }
            });
          }
          
          console.log(`🔍 검색 결과: ${metadataResults.length}개 메타데이터 발견`);
          
          // 2. 매칭된 URL만 추출
          const matchingUrls = new Set(metadataResults.map(m => m.image_url));
          
          // 3. Storage에서 해당 파일들 찾기 (prefix 필터 적용)
          let allFilesForSearch = [];
          const getAllFilesForSearch = async (folderPath = '') => {
            let offset = 0;
            const batchSize = 1000;
            let allFilesInFolder = [];
            
            while (true) {
              const { data: files, error } = await supabase.storage
                .from('blog-images')
                .list(folderPath, {
                  limit: batchSize,
                  offset: offset,
                  sortBy: { column: 'created_at', order: 'desc' }
                });
              
              if (error || !files || files.length === 0) break;
              
              allFilesInFolder = allFilesInFolder.concat(files);
              offset += batchSize;
              if (files.length < batchSize) break;
            }
            
            for (const file of allFilesInFolder) {
              if (!file.id) {
                const subFolderPath = folderPath ? `${folderPath}/${file.name}` : file.name;
                await getAllFilesForSearch(subFolderPath);
              } else {
                const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
                const isImage = imageExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
                // .keep.png 마커 파일 제외
                const isKeepFile = file.name.toLowerCase() === '.keep.png';
              if (isImage && !isKeepFile) {
                // temp 폴더 제외
                const fullPath = folderPath ? `${folderPath}/${file.name}` : file.name;
                const isTempFile = fullPath.startsWith('temp/');
                if (isTempFile) continue;
                
                const { data: urlData } = supabase.storage.from('blog-images').getPublicUrl(fullPath);
                const publicUrl = urlData.publicUrl;
                
                // URL이 매칭된 메타데이터에 있는지 확인
                if (matchingUrls.has(publicUrl)) {
                  allFilesForSearch.push({
                    ...file,
                    folderPath: folderPath,
                    url: publicUrl
                  });
                }
              }
              }
            }
          };
          
          const shouldIncludeChildren = includeChildren === 'true' || includeChildren === true || includeChildren === '1';
          const searchPrefix = prefix === 'all' ? '' : prefix;
          
          if (shouldIncludeChildren) {
            await getAllFilesForSearch(searchPrefix || '');
          } else {
            // 현재 폴더만
            let offset = 0;
            const batchSize = 1000;
            while (true) {
              const { data: files, error } = await supabase.storage
                .from('blog-images')
                .list(searchPrefix || '', { limit: batchSize, offset: offset });
              
              if (error || !files || files.length === 0) break;
              
              for (const file of files) {
                if (file.id) {
                  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
                  const isImage = imageExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
                  // .keep.png 마커 파일 제외
                  const isKeepFile = file.name.toLowerCase() === '.keep.png';
                  if (isImage && !isKeepFile) {
                    const fullPath = searchPrefix ? `${searchPrefix}/${file.name}` : file.name;
                    // temp 폴더 제외
                    const isTempFile = fullPath.startsWith('temp/');
                    if (isTempFile) continue;
                    
                    const { data: urlData } = supabase.storage.from('blog-images').getPublicUrl(fullPath);
                    const publicUrl = urlData.publicUrl;
                    
                    if (matchingUrls.has(publicUrl)) {
                      // source/channel 필터 추가 확인
                      if (filteredImageUrls && !filteredImageUrls.has(publicUrl)) {
                        continue;
                      }
                      
                      allFilesForSearch.push({ ...file, folderPath: searchPrefix || '', url: publicUrl });
                    }
                  }
                }
              }
              
              offset += batchSize;
              if (files.length < batchSize) break;
            }
          }
          
          console.log(`🔍 검색 결과 파일: ${allFilesForSearch.length}개`);
          
          // 4. 정렬 및 페이지네이션
          allFilesForSearch.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          const searchTotalCount = allFilesForSearch.length;
          const searchFiles = allFilesForSearch.slice(currentOffset, currentOffset + pageSize);
          
          // 5. 메타데이터 매핑
          const metadataMap = new Map();
          metadataResults.forEach(meta => {
            metadataMap.set(meta.image_url, meta);
          });
          
          // ✅ image_assets 테이블에서 메타데이터 조회 (검색 결과용 fallback)
          const searchUrls = searchFiles.map(f => f.url);
          const { data: searchAssets } = await supabase
            .from('image_assets')
            .select('id, cdn_url, alt_text, title, description, ai_tags')
            .in('cdn_url', searchUrls);
          
          const searchAssetsMap = new Map();
          if (searchAssets) {
            searchAssets.forEach(asset => {
              searchAssetsMap.set(asset.cdn_url, asset);
            });
          }
          
          // 6. 최종 이미지 데이터 생성 (사용 횟수 실시간 계산)
          const imagesWithUrl = await Promise.all(searchFiles.map(async (file) => {
            const metadata = metadataMap.get(file.url);
            
            const hasQualityMeta = hasQualityMetadata(metadata);
            const qualityScore = calculateMetadataQualityScore(metadata);
            const qualityIssues = getMetadataQualityIssues(metadata);
            
            // 사용 횟수 실시간 계산 (DB 값이 0이거나 없으면 계산)
            let usageCount = metadata?.usage_count || 0;
            let usedIn = [];
            let lastUsedAt = null;
            
            if (file.folderPath) {
              const fullPath = file.folderPath ? `${file.folderPath}/${file.name}` : file.name;
              // campaigns 폴더의 경우에만 실시간 계산 (성능 최적화)
              if (fullPath.includes('campaigns/')) {
                usageCount = await calculateUsageCount(fullPath, file.name);
              }
              
              // 사용 위치 상세 정보 수집 (usage_count > 0인 경우만)
              if (usageCount > 0) {
                try {
                  const usageResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/image-usage-tracker?imageUrl=${encodeURIComponent(file.url)}`);
                  if (usageResponse.ok) {
                    const usageData = await usageResponse.json();
                    const usage = usageData.usage || {};
                    
                    // 사용 위치 정보 수집
                    if (usage.blogPosts && usage.blogPosts.length > 0) {
                      usedIn.push(...usage.blogPosts.map(post => ({
                        type: 'blog',
                        title: post.title,
                        url: post.url,
                        isFeatured: post.isFeatured,
                        isInContent: post.isInContent,
                        created_at: post.created_at
                      })));
                    }
                    
                    if (usage.funnelPages && usage.funnelPages.length > 0) {
                      usedIn.push(...usage.funnelPages.map(page => ({
                        type: 'funnel',
                        title: page.title,
                        url: page.url,
                        isFeatured: page.isFeatured,
                        isInContent: page.isInContent,
                        created_at: page.created_at
                      })));
                    }
                    
                    if (usage.homepage && usage.homepage.length > 0) {
                      usedIn.push(...usage.homepage.map(item => ({
                        type: 'homepage',
                        title: item.title,
                        url: item.url,
                        location: item.location,
                        isFeatured: item.isFeatured,
                        isInContent: item.isInContent
                      })));
                    }
                    
                    if (usage.muziik && usage.muziik.length > 0) {
                      usedIn.push(...usage.muziik.map(item => ({
                        type: 'muziik',
                        title: item.title,
                        url: item.url,
                        location: item.location,
                        isFeatured: item.isFeatured,
                        isInContent: item.isInContent
                      })));
                    }
                    
                    // 최근 사용 날짜 계산
                    const allDates = usedIn
                      .filter(item => item.created_at)
                      .map(item => new Date(item.created_at))
                      .sort((a, b) => b - a);
                    if (allDates.length > 0) {
                      lastUsedAt = allDates[0].toISOString();
                    }
                  }
                } catch (error) {
                  console.warn(`⚠️ 사용 위치 정보 수집 오류 (${file.url}):`, error.message);
                }
              }
            }
            
            // image_assets 테이블에서 id 가져오기 (검색 결과용)
            const asset = searchAssetsMap.get(file.url);
            const imageAssetId = asset?.id || null;

            return {
              id: imageAssetId, // image_assets 테이블의 id 사용
              name: file.name,
              size: file.metadata?.size || 0,
              created_at: file.created_at,
              updated_at: file.updated_at,
              url: file.url,
              folder_path: file.folderPath || '',
              // ✅ image_metadata → image_assets 순서로 fallback
              alt_text: metadata?.alt_text || asset?.alt_text || '',
              title: metadata?.title || asset?.title || '',
              description: metadata?.description || asset?.description || '',
              // ✅ keywords: image_metadata.tags → image_assets.ai_tags 순서로 fallback
              keywords: (() => {
                // image_metadata의 tags 우선
                if (metadata?.tags) {
                  return Array.isArray(metadata.tags) ? metadata.tags : [metadata.tags];
                }
                // image_assets의 ai_tags fallback
                if (asset?.ai_tags && Array.isArray(asset.ai_tags)) {
                  return asset.ai_tags;
                }
                return [];
              })(),
              category: metadata?.category_id ? categoryIdMap.get(metadata.category_id) || '' : '',
              categories: metadata?.category_id ? [categoryIdMap.get(metadata.category_id)].filter(Boolean) : [],
              usage_count: usageCount,
              used_in: usedIn,
              last_used_at: lastUsedAt,
              upload_source: metadata?.upload_source || 'manual',
              status: metadata?.status || 'active',
              has_metadata: !!metadata,
              has_quality_metadata: hasQualityMeta,
              metadata_quality: {
                score: qualityScore,
                has_alt_text: !!(metadata?.alt_text && metadata.alt_text.trim().length > 0),
                has_title: !!(metadata?.title && metadata.title.trim().length > 0),
                has_description: !!(metadata?.description && metadata.description.trim().length > 0),
                has_keywords: !!(metadata?.tags && (
                  Array.isArray(metadata.tags) ? metadata.tags.length > 0 : (typeof metadata.tags === 'string' && metadata.tags.trim().length > 0)
                )),
                issues: qualityIssues
              }
            };
          }));
          
          const searchTotalPages = Math.ceil(searchTotalCount / pageSize);
          
          console.log(`✅ 서버 사이드 검색 완료: ${imagesWithUrl.length}개 (총 ${searchTotalCount}개 중)`);
          return res.status(200).json({
            images: imagesWithUrl,
            count: imagesWithUrl.length,
            total: searchTotalCount,
            pagination: {
              currentPage,
              totalPages: searchTotalPages,
              pageSize,
              hasNextPage: currentPage < searchTotalPages,
              hasPrevPage: currentPage > 1,
              nextPage: currentPage < searchTotalPages ? currentPage + 1 : null,
              prevPage: currentPage > 1 ? currentPage - 1 : null
            }
          });
          
        } catch (searchError) {
          console.error('❌ 서버 사이드 검색 오류:', searchError);
          return res.status(500).json({
            error: '검색 중 오류 발생',
            details: searchError.message
          });
        }
      }
      
      // 검색어가 없을 때는 기존 페이지네이션 로직 사용
      
      // 전체 개수 조회 (캐싱 적용) - 폴더 포함
      let totalCount = totalCountCache;
      const now = Date.now();
      
      if (!totalCountCache || (now - cacheTimestamp) > CACHE_DURATION) {
        console.log('📊 전체 이미지 개수 조회 중 (폴더 포함)...');
        let allFiles = [];
        
        // 재귀적으로 모든 폴더의 이미지 조회
      const getAllImagesRecursively = async (folderPath = '') => {
          console.log(`📁 폴더 조회 중: ${folderPath || '루트'}`);
          
          // Supabase Storage .list()는 기본적으로 한 번에 1000개까지만 반환
          // 모든 파일을 가져오기 위해 배치 조회 (offset 사용)
          let offset = 0;
          const batchSize = 1000;  // 한 번에 가져올 파일 수
          let allFilesInFolder = [];
          
          while (true) {
            const { data: files, error } = await supabase.storage
              .from('blog-images')
              .list(folderPath, {
                limit: batchSize,
                offset: offset,
                sortBy: { column: 'created_at', order: 'desc' }
              });

            if (error) {
              console.error(`❌ 폴더 조회 에러 (${folderPath}, offset: ${offset}):`, error);
              break;
            }

            if (!files || files.length === 0) {
              break;  // 더 이상 파일이 없음
            }

            allFilesInFolder = allFilesInFolder.concat(files);
            offset += batchSize;

            // 마지막 배치면 종료
            if (files.length < batchSize) {
              break;
            }
          }

          console.log(`✅ 폴더 조회 완료 (${folderPath || '루트'}): ${allFilesInFolder.length}개 파일/폴더`);

          // ✅ 성능 최적화: 폴더와 파일 분리 후 병렬 처리
          const folders = [];
          const files = [];

          for (const file of allFilesInFolder) {
            if (!file.id) {
              folders.push(file);
            } else {
              files.push(file);
            }
          }
          
          // ✅ 폴더들을 병렬로 조회 (최대 10개씩 동시 처리)
          if (folders.length > 0) {
            const folderPromises = folders.map(file => {
              const subFolderPath = folderPath ? `${folderPath}/${file.name}` : file.name;
              return getAllImagesRecursively(subFolderPath);
            });
            
            // 최대 10개씩 배치로 병렬 처리 (Supabase 부하 방지)
            const batchSize = 10;
            for (let i = 0; i < folderPromises.length; i += batchSize) {
              const batch = folderPromises.slice(i, i + batchSize);
              await Promise.all(batch);
            }
          }
          
          // 이미지 파일 처리
          for (const file of files) {
              const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
              const isImage = imageExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
              // .keep.png 마커 파일 제외
              const isKeepFile = file.name.toLowerCase() === '.keep.png';
              
              if (isImage && !isKeepFile) {
                // temp 폴더 제외
                const fullPath = folderPath ? `${folderPath}/${file.name}` : file.name;
                const isTempFile = fullPath.startsWith('temp/');
                if (isTempFile) continue;
                
                allFiles.push({
                  ...file,
                  folderPath: folderPath // 폴더 경로 추가
                });
            }
          }
        };

        // prefix 기반 시작 폴더만 조회(하위 포함)
        await getAllImagesRecursively(prefix || '');
        
        totalCount = allFiles.length;
        totalCountCache = totalCount;
        cacheTimestamp = now;
        console.log('✅ 전체 이미지 개수 조회 완료 (폴더 포함):', totalCount, '개');
      } else {
        console.log('📊 캐시된 전체 이미지 개수 사용:', totalCount, '개');
      }
      
      // includeChildren 파라미터 처리 (boolean 또는 문자열 모두 지원)
      const shouldIncludeChildren = includeChildren === 'true' || includeChildren === true || includeChildren === '1';
      
      // ✅ includeChildren='false'일 때는 현재 폴더의 이미지 개수만 사용
      // 전체 이미지 개수(totalCount)는 includeChildren='true'일 때만 사용
      // allFilesForPagination은 아직 조회되지 않았을 수 있으므로, 일단 totalCount 사용 (나중에 실제 조회 후 업데이트)
      const totalPages = Math.ceil(totalCount / pageSize);
      
      // 🔧 캐시 키 생성 (폴더 + 필터 조합)
      const getCacheKey = (prefix, includeChildren, searchQuery, includeUsageInfo) => {
        return `${prefix || 'all'}_${includeChildren}_${searchQuery || ''}_${includeUsageInfo || 'false'}`;
      };
      
      const cacheKey = getCacheKey(prefix, includeChildren, searchTerm, includeUsageInfo);
      const currentTime = Date.now();
      let allFilesForPagination = [];
      
      // 🔧 폴더별 캐시 확인
      if (folderCache.has(cacheKey) && 
          folderCacheTimestamps.has(cacheKey) &&
          (currentTime - folderCacheTimestamps.get(cacheKey)) < IMAGES_CACHE_DURATION) {
        console.log('📊 폴더별 캐시 사용:', cacheKey);
        allFilesForPagination = folderCache.get(cacheKey);
      } else {
        console.log('📊 이미지 목록 새로 조회:', cacheKey);
        
        // 재귀적으로 모든 폴더의 이미지 조회 (페이지네이션용)
        const getAllImagesForPagination = async (folderPath = '', startTime = Date.now()) => {
          // ✅ 타임아웃 체크 (55초 경과 시 조기 반환)
          if (Date.now() - startTime > 55000) {
            console.log(`⚠️ [getAllImagesForPagination] 타임아웃 방지를 위해 조회 중단: "${folderPath}"`);
            return;
          }
          
          console.log(`📁 [getAllImagesForPagination] 시작: "${folderPath || '루트'}"`);
          
          // ✅ 최적화: originals/products/ 또는 originals/goods/ 폴더는 하위 폴더를 직접 지정하여 조회 (재귀 탐색 최소화)
          const isProductsRoot = folderPath.startsWith('originals/products/') && 
                                 !folderPath.includes('/composition') && 
                                 !folderPath.includes('/detail') && 
                                 !folderPath.includes('/gallery');
          
          const isGoodsRoot = folderPath.startsWith('originals/goods/') &&
                             !folderPath.includes('/composition') && 
                             !folderPath.includes('/detail') && 
                             !folderPath.includes('/gallery');
          
          if (isProductsRoot || isGoodsRoot) {
            // 하위 폴더를 직접 조회 (재귀 탐색 대신)
            const subFolders = ['composition', 'detail', 'gallery'];
            console.log(`⚡ [getAllImagesForPagination] 최적화: "${folderPath}" 하위 폴더 직접 조회`);
            const folderPromises = subFolders.map(subFolder => {
              const subFolderPath = `${folderPath}/${subFolder}`;
              return getAllImagesForPagination(subFolderPath, startTime);
            });
            await Promise.all(folderPromises);
            return; // 현재 폴더는 파일이 없으므로 조기 반환
          }
          
          // Supabase Storage .list()는 기본적으로 한 번에 1000개까지만 반환
          // 모든 파일을 가져오기 위해 배치 조회 (offset 사용)
          let offset = 0;
          const batchSize = 1000;  // 한 번에 가져올 파일 수
          let allFilesInFolder = [];
          
          while (true) {
            const { data: files, error } = await supabase.storage
              .from('blog-images')
              .list(folderPath, {
                limit: batchSize,
                offset: offset,
                sortBy: { column: 'created_at', order: 'desc' }
              });

            if (error) {
              console.error(`❌ [getAllImagesForPagination] 폴더 조회 에러 (${folderPath}, offset: ${offset}):`, error);
              break;
            }

            if (!files || files.length === 0) {
              console.log(`📁 [getAllImagesForPagination] 파일 없음: "${folderPath}" (offset: ${offset})`);
              break;  // 더 이상 파일이 없음
            }

            console.log(`📁 [getAllImagesForPagination] 조회 성공: "${folderPath}" - ${files.length}개 항목 (offset: ${offset})`);
            allFilesInFolder = allFilesInFolder.concat(files);
            offset += batchSize;

            // 마지막 배치면 종료
            if (files.length < batchSize) {
              break;
            }
          }

          // ✅ 성능 최적화: 폴더와 파일 분리 후 병렬 처리
          const folders = [];
          const files = [];

          for (const file of allFilesInFolder) {
            if (!file.id) {
              folders.push(file);
            } else {
              files.push(file);
            }
          }
          
          console.log(`📁 [getAllImagesForPagination] 폴더/파일 분리: "${folderPath}" - 폴더 ${folders.length}개, 파일 ${files.length}개`);
          
          // ✅ 폴더들을 병렬로 조회 (최대 10개씩 동시 처리)
          if (folders.length > 0) {
            const folderPromises = folders.map(file => {
              const subFolderPath = folderPath ? `${folderPath}/${file.name}` : file.name;
              return getAllImagesForPagination(subFolderPath, startTime);
            });
            
            // 최대 10개씩 배치로 병렬 처리 (Supabase 부하 방지)
            const batchSize = 10;
            for (let i = 0; i < folderPromises.length; i += batchSize) {
              // ✅ 타임아웃 체크 (각 배치 전에 확인)
              if (Date.now() - startTime > 55000) {
                console.log(`⚠️ [getAllImagesForPagination] 타임아웃 방지를 위해 배치 처리 중단`);
                break;
              }
              const batch = folderPromises.slice(i, i + batchSize);
              await Promise.all(batch);
            }
          }
          
          // 이미지 파일 처리
          let imageCount = 0;
          for (const file of files) {
              const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
              const isImage = imageExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
              // .keep.png 마커 파일 제외
              const isKeepFile = file.name.toLowerCase() === '.keep.png';
              
              if (isImage && !isKeepFile) {
                imageCount++;
                allFilesForPagination.push({
                  ...file,
                  folderPath: folderPath // 폴더 경로 추가
                });
            }
          }
          if (imageCount > 0) {
            console.log(`✅ [getAllImagesForPagination] 이미지 ${imageCount}개 추가: "${folderPath}"`);
          }
          console.log(`📁 [getAllImagesForPagination] 완료: "${folderPath}" - 총 ${allFilesForPagination.length}개 이미지 수집됨`);
        };

        // includeChildren 파라미터 처리 (boolean 또는 문자열 모두 지원)
        const shouldIncludeChildren = includeChildren === 'true' || includeChildren === true || includeChildren === '1';
        console.log(`📊 [all-images] 조회 설정: prefix="${prefix}", includeChildren=${shouldIncludeChildren}, source=${source || 'none'}, channel=${channel || 'none'}`);
        if (shouldIncludeChildren) {
          const paginationStartTime = Date.now();
          await getAllImagesForPagination(prefix || '', paginationStartTime);
          console.log(`✅ [all-images] getAllImagesForPagination 완료: ${allFilesForPagination.length}개 파일 수집됨 (소요 시간: ${Date.now() - paginationStartTime}ms)`);
        } else {
          // 현재 폴더만(하위 미포함) - 배치 조회로 모든 파일 가져오기
          let offset = 0;
          const batchSize = 1000;
          
          while (true) {
            const { data: files, error } = await supabase.storage
              .from('blog-images')
              .list(prefix || '', { 
                limit: batchSize,
                offset: offset,
                sortBy: { column: 'created_at', order: 'desc' } 
              });
            
            if (error) {
              console.error(`❌ 폴더 조회 에러 (${prefix || '루트'}, offset: ${offset}):`, error);
              break;
            }
            
            if (!files || files.length === 0) {
              break;  // 더 이상 파일이 없음
            }
            
            for (const file of files) {
              if (file.id) {
                const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
                const isImage = imageExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
                // .keep.png 마커 파일 제외
                const isKeepFile = file.name.toLowerCase() === '.keep.png';
                if (isImage && !isKeepFile) {
                  // temp 폴더 제외
                  const fullPath = prefix ? `${prefix}/${file.name}` : file.name;
                  const isTempFile = fullPath.startsWith('temp/');
                  if (isTempFile) continue;
                  
                  allFilesForPagination.push({ ...file, folderPath: prefix || '' });
                }
              }
            }
            
            offset += batchSize;
            
            // 마지막 배치면 종료
            if (files.length < batchSize) {
              break;
            }
          }
        }
        
        // 생성일 기준으로 정렬
        allFilesForPagination.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // 캐시에 저장
        // 🔧 폴더별 캐시 저장
        folderCache.set(cacheKey, allFilesForPagination);
        folderCacheTimestamps.set(cacheKey, currentTime);
        // 기존 캐시도 유지 (하위 호환성)
        imagesCache.set(cacheKey, allFilesForPagination);
        imagesCacheTimestamp = currentTime;
        console.log('✅ 이미지 목록 캐시 저장:', allFilesForPagination.length, '개 (캐시 키:', cacheKey, ')');
      }
      
      // 페이지네이션 적용
      const imageFiles = allFilesForPagination.slice(currentOffset, currentOffset + pageSize);
      
      console.log(`📁 폴더 포함 조회: 총 ${allFilesForPagination.length}개 → 페이지 ${imageFiles.length}개 이미지 파일`);

      // 🔗 링크된 이미지 조회
      let linkedImages = [];
      if (prefix) {
        // 케이스 1: originals/mms/YYYY-MM-DD/메시지ID 형식 (특정 메시지 폴더)
        if (prefix.match(/^originals\/mms\/\d{4}-\d{2}-\d{2}\/\d+$/)) {
          const messageId = prefix.split('/').pop();
          const tag = `sms-${messageId}`;
          
          // ⚠️ 중요: 리얼 이미지가 있으면 링크 이미지는 조회하지 않음
          const hasRealImages = allFilesForPagination.length > 0;
          
          if (!hasRealImages) {
            console.log(`🔗 링크된 이미지 조회: 메시지 ID ${messageId}, 태그 ${tag} (리얼 이미지 없음)`);
            
            // tags에 해당 메시지 ID가 포함된 다른 폴더의 이미지 조회
            const { data: linkedMetadata, error: linkedError } = await supabase
              .from('image_metadata')
              .select('id, alt_text, title, description, tags, category_id, image_url, usage_count, upload_source, status, folder_path')
              .contains('tags', [tag])
              .eq('source', 'mms')
              .eq('channel', 'sms')
              .neq('folder_path', prefix); // 실제 폴더 제외
            
            if (linkedError) {
              console.error('❌ 링크된 이미지 조회 실패:', linkedError);
            } else if (linkedMetadata && linkedMetadata.length > 0) {
              console.log(`✅ 링크된 이미지 ${linkedMetadata.length}개 발견`);
              
              // 링크된 이미지를 imageUrls 형식으로 변환
              linkedImages = linkedMetadata.map(meta => {
                // ⭐ image_url이 Solapi imageId인 경우 처리
                let displayUrl = meta.image_url;
                let fileName = 'solapi-image.jpg';
                
                if (meta.image_url && meta.image_url.startsWith('ST01FZ')) {
                  // Solapi imageId인 경우
                  displayUrl = `/api/solapi/get-image-preview?imageId=${meta.image_url}`;
                  fileName = `solapi-${meta.image_url.substring(0, 20)}.jpg`;
                } else {
                  // Supabase URL인 경우 파일명 추출
                  const urlParts = meta.image_url.split('/');
                  fileName = urlParts[urlParts.length - 1];
                }
                
                const folderPath = meta.folder_path || '';
                
                return {
                  file: {
                    name: fileName,
                    folderPath: folderPath,
                    created_at: meta.created_at || new Date().toISOString(),
                    id: null, // 링크된 이미지는 파일 ID가 없음
                    isLinked: true // 링크된 이미지 플래그
                  },
                  url: displayUrl, // ⭐ 프리뷰 API URL 또는 Supabase URL
                  original_url: meta.image_url, // ⭐ 원본 URL (Solapi imageId 또는 Supabase URL)
                  fullPath: folderPath ? `${folderPath}/${fileName}` : fileName,
                  isLinked: true, // 링크된 이미지 플래그
                  originalFolder: folderPath // 원본 폴더 경로
                };
              });
            }
          } else {
            console.log(`ℹ️  리얼 이미지가 있어서 링크 이미지 조회 스킵: ${allFilesForPagination.length}개`);
          }
        }
        // 케이스 2: originals/mms/YYYY-MM-DD 형식 (날짜 폴더만)
        else if (prefix.match(/^originals\/mms\/\d{4}-\d{2}-\d{2}$/)) {
          const dateFolder = prefix;
          console.log(`🔗 날짜 폴더 링크 이미지 조회: ${dateFolder}`);
          
          // 해당 날짜 폴더의 하위 폴더(메시지 ID) 목록 조회
          const { data: subfolders, error: subfolderError } = await supabase.storage
            .from('blog-images')
            .list(dateFolder, {
              limit: 1000,
              sortBy: { column: 'name', order: 'asc' }
            });
          
          if (subfolderError) {
            console.error('❌ 하위 폴더 조회 실패:', subfolderError);
          } else if (subfolders && subfolders.length > 0) {
            // 각 하위 폴더(메시지 ID)에 대한 링크 이미지 태그 수집
            const messageIds = subfolders
              .filter(item => item.id === null && item.name.match(/^\d+$/)) // 폴더만, 숫자 이름만
              .map(item => item.name);
            
            if (messageIds.length > 0) {
              console.log(`🔍 발견된 메시지 ID: ${messageIds.join(', ')}`);
              
              // 각 메시지 ID에 대한 링크 이미지 조회
              const allLinkedMetadata = [];
              for (const messageId of messageIds) {
                const tag = `sms-${messageId}`;
                const { data: linkedMetadata, error: linkedError } = await supabase
                  .from('image_metadata')
                  .select('id, alt_text, title, description, tags, category_id, image_url, usage_count, upload_source, status, folder_path')
                  .contains('tags', [tag])
                  .eq('source', 'mms')
                  .eq('channel', 'sms')
                  .not('folder_path', 'like', `${dateFolder}%`); // 해당 날짜 폴더 제외
                
                if (!linkedError && linkedMetadata && linkedMetadata.length > 0) {
                  allLinkedMetadata.push(...linkedMetadata);
                }
              }
              
              if (allLinkedMetadata.length > 0) {
                console.log(`✅ 날짜 폴더 링크 이미지 ${allLinkedMetadata.length}개 발견`);
                
                // 중복 제거 (같은 이미지가 여러 메시지 ID에 링크될 수 있음)
                const uniqueLinkedMetadata = Array.from(
                  new Map(allLinkedMetadata.map(meta => [meta.image_url, meta])).values()
                );
                
                // 링크된 이미지를 imageUrls 형식으로 변환
                linkedImages = uniqueLinkedMetadata.map(meta => {
                  const urlParts = meta.image_url.split('/');
                  const fileName = urlParts[urlParts.length - 1];
                  const folderPath = meta.folder_path || '';
                  
                  return {
                    file: {
                      name: fileName,
                      folderPath: folderPath,
                      created_at: meta.created_at || new Date().toISOString(),
                      id: null,
                      isLinked: true
                    },
                    url: meta.image_url,
                    fullPath: folderPath ? `${folderPath}/${fileName}` : fileName,
                    isLinked: true,
                    originalFolder: folderPath
                  };
                });
              }
            }
          }
        }
        // 케이스 3: originals/mms 형식 (mms 전체 폴더)
        else if (prefix === 'originals/mms') {
          console.log(`🔗 mms 전체 폴더 링크 이미지 조회: ${prefix}`);
          
          // ⚠️ 성능 최적화: 리얼 이미지가 많거나 페이지네이션 중이면 링크 이미지 조회 스킵
          if (allFilesForPagination.length > 20 || currentOffset > 0) {
            console.log(`ℹ️  리얼 이미지가 많거나 페이지네이션 중이어서 링크 이미지 조회 스킵: ${allFilesForPagination.length}개, offset: ${currentOffset}`);
          } else {
            // ⚠️ 제한된 수만 조회 (성능 최적화)
            const { data: linkedMetadata, error: linkedError } = await supabase
              .from('image_metadata')
              .select('id, alt_text, title, description, tags, category_id, image_url, usage_count, upload_source, status, folder_path')
              .eq('source', 'mms')
              .eq('channel', 'sms')
              .not('folder_path', 'like', 'originals/mms%') // mms 폴더 제외
              .limit(50); // ⭐ 최대 50개만 조회 (타임아웃 방지)
            
            if (linkedError) {
              console.error('❌ 링크된 이미지 조회 실패:', linkedError);
            } else if (linkedMetadata && linkedMetadata.length > 0) {
              console.log(`✅ mms 전체 폴더 링크 이미지 ${linkedMetadata.length}개 발견`);
              
              // tags에 'sms-'가 포함된 이미지만 필터링 (실제 링크 이미지)
              const filteredLinkedMetadata = linkedMetadata.filter(meta => {
                if (!meta.tags || !Array.isArray(meta.tags)) return false;
                return meta.tags.some(tag => typeof tag === 'string' && tag.startsWith('sms-'));
              });
              
              if (filteredLinkedMetadata.length > 0) {
                // 중복 제거
                const uniqueLinkedMetadata = Array.from(
                  new Map(filteredLinkedMetadata.map(meta => [meta.image_url, meta])).values()
                );
                
                // 링크된 이미지를 imageUrls 형식으로 변환
                linkedImages = uniqueLinkedMetadata.map(meta => {
                  const urlParts = meta.image_url.split('/');
                  const fileName = urlParts[urlParts.length - 1];
                  const folderPath = meta.folder_path || '';
                  
                  return {
                    file: {
                      name: fileName,
                      folderPath: folderPath,
                      created_at: meta.created_at || new Date().toISOString(),
                      id: null,
                      isLinked: true
                    },
                    url: meta.image_url,
                    fullPath: folderPath ? `${folderPath}/${fileName}` : fileName,
                    isLinked: true,
                    originalFolder: folderPath
                  };
                });
              }
            }
          }
        }
        // 케이스 4: originals 형식 (originals 전체 폴더)
        else if (prefix === 'originals') {
          console.log(`🔗 originals 전체 폴더 링크 이미지 조회: ${prefix}`);
          
          // ⚠️ 성능 최적화: 리얼 이미지가 많거나 페이지네이션 중이면 링크 이미지 조회 스킵
          if (allFilesForPagination.length > 20 || currentOffset > 0) {
            console.log(`ℹ️  리얼 이미지가 많거나 페이지네이션 중이어서 링크 이미지 조회 스킵: ${allFilesForPagination.length}개, offset: ${currentOffset}`);
          } else {
              // ⚠️ 제한된 수만 조회 (성능 최적화)
            const { data: linkedMetadata, error: linkedError } = await supabase
              .from('image_metadata')
              .select('id, alt_text, title, description, tags, category_id, image_url, usage_count, upload_source, status, folder_path')
              .eq('source', 'mms')
              .eq('channel', 'sms')
              .not('folder_path', 'like', 'originals%') // originals 폴더 제외
              .limit(50); // ⭐ 최대 50개만 조회 (타임아웃 방지)
            
            if (linkedError) {
              console.error('❌ 링크된 이미지 조회 실패:', linkedError);
            } else if (linkedMetadata && linkedMetadata.length > 0) {
              console.log(`✅ originals 전체 폴더 링크 이미지 ${linkedMetadata.length}개 발견`);
              
              // tags에 'sms-'가 포함된 이미지만 필터링 (실제 링크 이미지)
              const filteredLinkedMetadata = linkedMetadata.filter(meta => {
                if (!meta.tags || !Array.isArray(meta.tags)) return false;
                return meta.tags.some(tag => typeof tag === 'string' && tag.startsWith('sms-'));
              });
              
              if (filteredLinkedMetadata.length > 0) {
                // 중복 제거
                const uniqueLinkedMetadata = Array.from(
                  new Map(filteredLinkedMetadata.map(meta => [meta.image_url, meta])).values()
                );
                
                // 링크된 이미지를 imageUrls 형식으로 변환
                linkedImages = uniqueLinkedMetadata.map(meta => {
                  const urlParts = meta.image_url.split('/');
                  const fileName = urlParts[urlParts.length - 1];
                  const folderPath = meta.folder_path || '';
                  
                  return {
                    file: {
                      name: fileName,
                      folderPath: folderPath,
                      created_at: meta.created_at || new Date().toISOString(),
                      id: null,
                      isLinked: true
                    },
                    url: meta.image_url,
                    fullPath: folderPath ? `${folderPath}/${fileName}` : fileName,
                    isLinked: true,
                    originalFolder: folderPath
                  };
                });
              }
            }
          }
        }
      }

      // 이미지 URL 생성 및 메타데이터 일괄 조회
      const imageUrls = imageFiles.map(file => {
        const fullPath = file.folderPath ? `${file.folderPath}/${file.name}` : file.name;
        const { data: urlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(fullPath);
        return {
          file,
          url: urlData.publicUrl,
          fullPath,
          isLinked: false // 실제 저장된 이미지
        };
      });
      
      // 링크된 이미지를 imageUrls에 추가 (페이지네이션 고려하여 현재 페이지 범위 내만)
      // 링크된 이미지는 항상 마지막에 표시
      if (linkedImages.length > 0) {
        imageUrls.push(...linkedImages);
        console.log(`🔗 링크된 이미지 ${linkedImages.length}개 추가됨`);
      }

      // ✅ 빠른 반환 경로: 실제 파일이 없고 링크된 이미지만 있는 경우
      //    메타데이터 조회/사용위치 계산 등을 생략하여 504 타임아웃 방지
      if (imageFiles.length === 0 && linkedImages.length > 0) {
        const images = linkedImages.map(li => ({
          id: null,
          name: li.file.name,
          size: 0,
          created_at: li.file.created_at || new Date().toISOString(),
          updated_at: li.file.created_at || new Date().toISOString(),
          url: li.url,
          folder_path: prefix || '',
          is_linked: true,
          original_folder: li.originalFolder || null,
          alt_text: '',
          title: '',
          description: '',
          keywords: [],
          category: '',
          categories: [],
          usage_count: 0,
          used_in: [],
          last_used_at: null,
          upload_source: 'linked',
          status: 'active',
          has_metadata: false,
          has_quality_metadata: false,
          quality_score: 0,
          quality_issues: ['메타데이터 없음'],
          file_path: li.fullPath || '',
          file_size: 0,
          width: null,
          height: null,
          is_featured: false,
          optimized_versions: null,
        }));
        
        return res.status(200).json({
          total: images.length,
          images,
          page,
          limit,
          offset,
          has_more: false,
        });
      }

      // 모든 URL을 한 번에 조회하여 메타데이터 가져오기
      // 주의: image_metadata 테이블 스키마에 맞춰 컬럼 조회
      const urls = imageUrls.map(item => item.url);
      
      // 🔧 병렬 처리로 성능 개선: 메타데이터와 assets를 동시에 조회
      // 🔧 메타데이터 필드 최소화: 리스트용 필드만 조회 (description, tags 제거)
      const [metadataResult, assetsResult] = await Promise.all([
        supabase
          .from('image_metadata')
          .select('id, alt_text, title, image_url, usage_count, upload_source, status')
          .in('image_url', urls),
        supabase
          .from('image_assets')
          .select('id, cdn_url, file_path, alt_text, title, description, ai_tags')
          .in('cdn_url', urls)
      ]);

      const { data: allMetadata } = metadataResult;
      const { data: allAssets } = assetsResult;

      // image_assets를 URL 기준으로 매핑
      const assetsMap = new Map();
      if (allAssets) {
        allAssets.forEach(asset => {
          assetsMap.set(asset.cdn_url, asset);
        });
      }

      // 메타데이터를 URL 기준으로 매핑
      const metadataMap = new Map();
      if (allMetadata) {
        allMetadata.forEach(meta => {
          metadataMap.set(meta.image_url, meta);
        });
      }

      // 🔧 배치 사용 위치 조회: 사용 위치가 필요한 이미지 URL 수집 (includeUsageInfo가 true일 때만)
      const urlsNeedingUsageInfo = [];
      const imageUrlToIndexMap = new Map();
      const shouldIncludeUsageInfo = includeUsageInfo === 'true' || includeUsageInfo === true;
      
      if (shouldIncludeUsageInfo) {
        imageUrls.forEach(({ file, url, fullPath }, index) => {
          const metadata = metadataMap.get(url);
          let usageCount = metadata?.usage_count || 0;
          
          // 모든 폴더를 배치 조회로 통일 (정확도 향상)
          // campaigns 폴더도 배치 조회로 처리하여 모든 사용 위치 확인
          if (fullPath) {
            // 모든 이미지를 배치 조회 대상에 포함 (usage_count와 관계없이)
            urlsNeedingUsageInfo.push(url);
            imageUrlToIndexMap.set(url, index);
          } else if (usageCount > 0) {
            // fullPath가 없어도 usage_count > 0이면 배치 조회 대상
            urlsNeedingUsageInfo.push(url);
            imageUrlToIndexMap.set(url, index);
          }
        });
      }
      
      // 🔧 배치로 사용 위치 정보 조회 (한 번의 API 호출) - includeUsageInfo가 true일 때만
      const usageInfoMap = new Map();
      if (shouldIncludeUsageInfo && urlsNeedingUsageInfo.length > 0) {
        try {
          const batchStartTime = Date.now();
          const usageResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/image-usage-tracker`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrls: urlsNeedingUsageInfo })
          });
          
          if (usageResponse.ok) {
            const batchData = await usageResponse.json();
            if (batchData.results && Array.isArray(batchData.results)) {
              batchData.results.forEach(result => {
                if (result.imageUrl && result.usage) {
                  const usage = result.usage;
                  const usedIn = [];
                  
                  // 사용 위치 정보 수집
                  if (usage.blogPosts && usage.blogPosts.length > 0) {
                    usedIn.push(...usage.blogPosts.map(post => ({
                      type: 'blog',
                      title: post.title,
                      url: post.url,
                      isFeatured: post.isFeatured,
                      isInContent: post.isInContent,
                      created_at: post.created_at
                    })));
                  }
                  
                  if (usage.funnelPages && usage.funnelPages.length > 0) {
                    usedIn.push(...usage.funnelPages.map(page => ({
                      type: 'funnel',
                      title: page.title,
                      url: page.url,
                      isFeatured: page.isFeatured,
                      isInContent: page.isInContent,
                      created_at: page.created_at
                    })));
                  }
                  
                  if (usage.homepage && usage.homepage.length > 0) {
                    usedIn.push(...usage.homepage.map(item => ({
                      type: 'homepage',
                      title: item.title,
                      url: item.url,
                      location: item.location,
                      isFeatured: item.isFeatured,
                      isInContent: item.isInContent
                    })));
                  }
                  
                  if (usage.muziik && usage.muziik.length > 0) {
                    usedIn.push(...usage.muziik.map(item => ({
                      type: 'muziik',
                      title: item.title,
                      url: item.url,
                      location: item.location,
                      isFeatured: item.isFeatured,
                      isInContent: item.isInContent
                    })));
                  }
                  
                  if (usage.kakaoProfile && usage.kakaoProfile.length > 0) {
                    usedIn.push(...usage.kakaoProfile.map(item => ({
                      type: 'kakao_profile',
                      title: item.title,
                      url: item.url,
                      date: item.date,
                      account: item.account,
                      isBackground: item.isBackground,
                      isProfile: item.isProfile,
                      created_at: item.created_at
                    })));
                  }
                  
                  if (usage.kakaoFeed && usage.kakaoFeed.length > 0) {
                    usedIn.push(...usage.kakaoFeed.map(item => ({
                      type: 'kakao_feed',
                      title: item.title,
                      url: item.url,
                      date: item.date,
                      account: item.account,
                      created_at: item.created_at
                    })));
                  }
                  
                  // 최근 사용 날짜 계산
                  const allDates = usedIn
                    .filter(item => item.created_at)
                    .map(item => new Date(item.created_at))
                    .sort((a, b) => b - a);
                  const lastUsedAt = allDates.length > 0 ? allDates[0].toISOString() : null;
                  
                  // 총 사용 횟수 계산 (배치 조회 결과 사용)
                  const totalUsage = usage.totalUsage || usedIn.length;
                  
                  usageInfoMap.set(result.imageUrl, {
                    usedIn,
                    lastUsedAt,
                    totalUsage
                  });
                }
              });
              
              const batchElapsed = ((Date.now() - batchStartTime) / 1000).toFixed(2);
              console.log(`✅ 배치 사용 위치 조회 완료: ${urlsNeedingUsageInfo.length}개 이미지 (${batchElapsed}초)`);
            }
          } else {
            console.warn('⚠️ 배치 사용 위치 조회 실패:', usageResponse.status);
          }
        } catch (error) {
          console.warn('⚠️ 배치 사용 위치 조회 오류:', error.message);
        }
      }
      
      // 이미지 데이터 생성 (사용 횟수 실시간 계산)
      const imagesWithUrl = await Promise.all(imageUrls.map(async ({ file, url, fullPath, isLinked, originalFolder }) => {
        const metadata = metadataMap.get(url);
        
        // ✅ 메타데이터 품질 검증
        const hasQualityMeta = hasQualityMetadata(metadata);
        const qualityScore = calculateMetadataQualityScore(metadata);
        const qualityIssues = getMetadataQualityIssues(metadata);
        
        // 사용 횟수 실시간 계산 (DB 값이 0이거나 없으면 계산)
        let usageCount = metadata?.usage_count || 0;
        let usedIn = [];
        let lastUsedAt = null;
        
        if (shouldIncludeUsageInfo && fullPath) {
          // 🔧 배치로 조회한 사용 위치 정보 사용 (모든 폴더 통일) - includeUsageInfo가 true일 때만
          const usageInfo = usageInfoMap.get(url);
          if (usageInfo) {
            usedIn = usageInfo.usedIn;
            lastUsedAt = usageInfo.lastUsedAt;
            // 배치 조회 결과로 사용 횟수 업데이트 (모든 폴더)
            usageCount = usageInfo.totalUsage || usedIn.length;
          }
        }
        
        // ✅ 성능 최적화: 이미 조회한 assetsMap에서 id 가져오기 (중복 쿼리 제거)
        const asset = assetsMap.get(url);
        let imageAssetId = asset?.id || null;

        // image_assets에 없으면 자동으로 등록
        if (!imageAssetId && url) {
          try {
            // 파일 정보 추출
            const fileName = file.name || path.basename(url);
            const fileExt = path.extname(fileName).slice(1).toLowerCase() || 'jpg';
            const folderPath = file.folderPath || url;
            
            // image_assets에 자동 등록
            const { data: newAsset, error: insertError } = await supabase
              .from('image_assets')
              .insert({
                filename: fileName,
                original_filename: fileName,
                file_path: folderPath,
                file_size: file.metadata?.size || 0,
                mime_type: `image/${fileExt}`,
                format: fileExt,
                cdn_url: url,
                upload_source: 'auto_registered',
                status: 'active',
                alt_text: metadata?.alt_text || '',
                title: metadata?.title || fileName.replace(/\.[^/.]+$/, ''),
                description: metadata?.description || '',
              })
              .select('id')
              .single();
            
            if (!insertError && newAsset) {
              imageAssetId = newAsset.id;
              console.log(`✅ 자동 등록 완료: ${fileName} (${imageAssetId})`);
            } else if (insertError) {
              console.error(`❌ 자동 등록 실패 (${fileName}):`, insertError.message);
            }
          } catch (error) {
            console.error('❌ 자동 등록 중 오류:', error);
          }
        }

        // ⭐ Solapi imageId인 경우 프리뷰 API URL로 변환
        let displayUrl = url;
        if (metadata?.image_url && metadata.image_url.startsWith('ST01FZ')) {
          // image_metadata의 image_url이 Solapi imageId인 경우
          displayUrl = `/api/solapi/get-image-preview?imageId=${metadata.image_url}`;
        } else if (url && url.startsWith('ST01FZ')) {
          // url 자체가 Solapi imageId인 경우 (링크된 이미지)
          displayUrl = `/api/solapi/get-image-preview?imageId=${url}`;
        }

        return {
          id: imageAssetId, // image_assets 테이블의 id 사용
          name: file.name,
          size: file.metadata?.size || 0,
          created_at: file.created_at,
          updated_at: file.updated_at,
          url: displayUrl, // ⭐ Solapi imageId인 경우 프리뷰 API URL
          original_url: url, // ⭐ 원본 URL 저장 (Solapi imageId 또는 Supabase URL)
          folder_path: file.folderPath || '',
          // 🔗 링크된 이미지 정보
          is_linked: isLinked || false,
          original_folder: originalFolder || null,
          // ✅ image_metadata → image_assets 순서로 fallback
          alt_text: metadata?.alt_text || asset?.alt_text || '',
          title: metadata?.title || asset?.title || '',
          description: metadata?.description || asset?.description || '',
          // ✅ keywords: image_metadata.tags → image_assets.ai_tags 순서로 fallback
          keywords: (() => {
            // image_metadata의 tags 우선
            if (metadata?.tags) {
              return Array.isArray(metadata.tags) ? metadata.tags : [metadata.tags];
            }
            // image_assets의 ai_tags fallback
            if (asset?.ai_tags && Array.isArray(asset.ai_tags)) {
              return asset.ai_tags;
            }
            return [];
          })(),
          // category는 제거됨 (메타태그로 대체)
          category: '',
          // categories는 빈 배열로 반환 (카테고리 기능 제거)
          categories: [],
          usage_count: usageCount,
          used_in: usedIn,
          last_used_at: lastUsedAt,
          upload_source: metadata?.upload_source || 'manual',
          status: metadata?.status || 'active',
          is_liked: metadata?.is_liked || false, // 좋아요 상태
          // ✅ 메타데이터 품질 정보 추가
          has_metadata: !!metadata,
          has_quality_metadata: hasQualityMeta,  // 의미 있는 메타데이터 존재 여부
          metadata_quality: {
            score: qualityScore,  // 0-100점
            has_alt_text: !!(metadata?.alt_text && metadata.alt_text.trim().length > 0),
            has_title: !!(metadata?.title && metadata.title.trim().length > 0),
            has_description: !!(metadata?.description && metadata.description.trim().length > 0),
            has_keywords: !!(metadata?.tags && (
              Array.isArray(metadata.tags) ? metadata.tags.length > 0 : (typeof metadata.tags === 'string' && metadata.tags.trim().length > 0)
            )),
            issues: qualityIssues  // 품질 이슈 목록
          }
        };
      }));

      // ✅ includeChildren='false'일 때는 현재 폴더의 이미지 개수만 반환
      // 전체 이미지 개수(totalCountCache)가 아닌 실제 조회된 이미지 개수 사용
      const actualTotal = shouldIncludeChildren ? totalCount : allFilesForPagination.length;
      
      console.log('✅ 전체 이미지 조회 성공:', imagesWithUrl.length, '개 (총', actualTotal, '개 중)', shouldIncludeChildren ? '(하위 폴더 포함)' : '(현재 폴더만)');
      return res.status(200).json({ 
        images: imagesWithUrl,
        count: imagesWithUrl.length,
        total: actualTotal,
        pagination: {
          currentPage,
          totalPages: Math.ceil(actualTotal / pageSize),
          pageSize,
          hasNextPage: currentPage < totalPages,
          hasPrevPage: currentPage > 1,
          nextPage: currentPage < totalPages ? currentPage + 1 : null,
          prevPage: currentPage > 1 ? currentPage - 1 : null
        }
      });
      
    } else {
      return res.status(405).json({
        error: '지원하지 않는 HTTP 메서드입니다.'
      });
    }
      })(),
      timeoutPromise
    ]);
    
  } catch (error) {
    console.error('❌ 전체 이미지 조회 API 오류:', error);
    
    // ✅ 타임아웃 오류 구분
    if (error.message && (error.message.includes('시간 초과') || error.message.includes('초과'))) {
      return res.status(504).json({
        error: '요청 시간 초과',
        details: '이미지 목록 조회가 너무 오래 걸려 시간 초과되었습니다.',
        suggestion: '캐시가 생성될 때까지 잠시 후 다시 시도해주세요.'
      });
    }
    
    return res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      details: error.message
    });
  }
}
