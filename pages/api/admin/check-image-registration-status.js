/**
 * 이미지 등록 상태 검토 API
 * 
 * Storage에 있는 이미지와 image_assets 테이블에 등록된 이미지를 비교하여
 * 등록되지 않은 이미지의 수와 통계를 제공합니다.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Storage에서 특정 폴더의 이미지 파일 샘플 조회 (성능 최적화)
async function getImageSamplesFromStorage(folderPath = '', sampleSize = 1000) {
  const allFiles = [];
  
  async function listFolderRecursive(currentPath = '', depth = 0) {
    if (allFiles.length >= sampleSize) return;
    if (depth > 10) return; // 깊이 제한
    
    try {
      const { data: items, error } = await supabase.storage
        .from('blog-images')
        .list(currentPath, {
          limit: 1000,
          sortBy: { column: 'name', order: 'asc' }
        });
      
      if (error || !items) return;
      
      for (const item of items) {
        if (allFiles.length >= sampleSize) break;
        
        const fullPath = currentPath ? `${currentPath}/${item.name}` : item.name;
        
        // .keep 파일 제외
        if (item.name === '.keep.png' || item.name.startsWith('.')) {
          continue;
        }
        
        if (item.id === null) {
          // 폴더인 경우 재귀 탐색 (주요 폴더만)
          if (depth < 3 || fullPath.includes('blog') || fullPath.includes('daily-branding') || fullPath.includes('campaigns')) {
            await listFolderRecursive(fullPath, depth + 1);
          }
        } else {
          // 파일인 경우
          const ext = item.name.split('.').pop()?.toLowerCase();
          if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'heic', 'heif'].includes(ext)) {
            const { data: { publicUrl } } = supabase.storage
              .from('blog-images')
              .getPublicUrl(fullPath);
            
            allFiles.push({
              name: item.name,
              path: fullPath,
              url: publicUrl,
              size: item.metadata?.size || 0
            });
          }
        }
      }
    } catch (error) {
      console.error(`❌ 폴더 탐색 오류 (${currentPath}):`, error.message);
    }
  }
  
  await listFolderRecursive(folderPath);
  return allFiles;
}

// 폴더별 통계 계산
function calculateFolderStats(images, registeredUrls) {
  const stats = new Map();
  
  for (const img of images) {
    const pathParts = img.path.split('/');
    const rootFolder = pathParts[0] || 'root';
    const isRegistered = registeredUrls.has(img.url);
    
    if (!stats.has(rootFolder)) {
      stats.set(rootFolder, {
        total: 0,
        registered: 0,
        missing: 0,
        totalSize: 0,
        folders: new Map()
      });
    }
    
    const stat = stats.get(rootFolder);
    stat.total++;
    stat.totalSize += img.size;
    
    if (isRegistered) {
      stat.registered++;
    } else {
      stat.missing++;
      
      // 하위 폴더 통계
      if (pathParts.length > 1) {
        const subFolder = pathParts.slice(0, 2).join('/');
        if (!stat.folders.has(subFolder)) {
          stat.folders.set(subFolder, { total: 0, missing: 0 });
        }
        const subStat = stat.folders.get(subFolder);
        subStat.total++;
        subStat.missing++;
      }
    }
  }
  
  return stats;
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { folderPath = '', sampleSize = 1000 } = req.query || req.body || {};
    
    console.log(`🔍 이미지 등록 상태 검토 시작... (폴더: ${folderPath || '전체'})`);
    
    // 1. Storage에서 이미지 샘플 가져오기
    const storageImages = await getImageSamplesFromStorage(folderPath, parseInt(sampleSize));
    
    if (!storageImages || storageImages.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Storage에 이미지 파일이 없습니다.',
        results: {
          total: 0,
          registered: 0,
          missing: 0,
          registrationRate: 0
        }
      });
    }
    
    // 2. image_assets에 등록된 이미지 URL 확인
    const imageUrls = storageImages.map(img => img.url);
    const { data: registeredImages } = await supabase
      .from('image_assets')
      .select('cdn_url, upload_source')
      .in('cdn_url', imageUrls);
    
    const registeredUrls = new Set((registeredImages || []).map(img => img.cdn_url));
    const registeredCount = registeredUrls.size;
    const missingCount = storageImages.length - registeredCount;
    const registrationRate = (registeredCount / storageImages.length) * 100;
    
    // 3. 누락된 이미지 목록
    const missingImages = storageImages
      .filter(img => !registeredUrls.has(img.url))
      .slice(0, 50); // 최대 50개만 반환
    
    // 4. 폴더별 통계
    const folderStats = calculateFolderStats(storageImages, registeredUrls);
    
    // 5. upload_source별 통계
    const uploadSourceStats = {};
    (registeredImages || []).forEach(img => {
      const source = img.upload_source || 'unknown';
      uploadSourceStats[source] = (uploadSourceStats[source] || 0) + 1;
    });
    
    const results = {
      total: storageImages.length,
      registered: registeredCount,
      missing: missingCount,
      registrationRate: parseFloat(registrationRate.toFixed(2)),
      folderStats: Array.from(folderStats.entries()).map(([folder, stat]) => ({
        folder,
        total: stat.total,
        registered: stat.registered,
        missing: stat.missing,
        registrationRate: parseFloat(((stat.registered / stat.total) * 100).toFixed(2)),
        totalSizeMB: parseFloat((stat.totalSize / 1024 / 1024).toFixed(2)),
        subFolders: Array.from(stat.folders.entries()).map(([subFolder, subStat]) => ({
          folder: subFolder,
          total: subStat.total,
          missing: subStat.missing
        })).slice(0, 10) // 상위 10개만
      })),
      uploadSourceStats,
      missingImages: missingImages.map(img => ({
        name: img.name,
        path: img.path,
        url: img.url,
        sizeKB: parseFloat((img.size / 1024).toFixed(2))
      }))
    };
    
    console.log(`✅ 검토 완료: 전체 ${results.total}개, 등록 ${results.registered}개, 누락 ${results.missing}개 (${results.registrationRate}%)`);
    
    return res.status(200).json({
      success: true,
      message: `검토 완료: ${results.missing}개 이미지가 등록되지 않았습니다.`,
      results
    });
    
  } catch (error) {
    console.error('❌ 이미지 등록 상태 검토 오류:', error);
    return res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.',
      details: error.message
    });
  }
}

