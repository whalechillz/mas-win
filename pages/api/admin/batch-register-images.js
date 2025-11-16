/**
 * 이미지 일괄 등록 API
 * 
 * Storage에 있지만 image_assets 테이블에 등록되지 않은 이미지를
 * 일괄로 등록합니다.
 */

import { createClient } from '@supabase/supabase-js';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Storage에서 특정 폴더의 이미지 파일 조회
async function getImagesFromStorage(folderPath = '', limit = 1000) {
  const allFiles = [];
  
  async function listFolderRecursive(currentPath = '') {
    try {
      const { data: items, error } = await supabase.storage
        .from('blog-images')
        .list(currentPath, {
          limit: 1000,
          sortBy: { column: 'name', order: 'asc' }
        });
      
      if (error) {
        console.error(`❌ 폴더 조회 오류 (${currentPath}):`, error.message);
        return;
      }
      
      if (!items || items.length === 0) return;
      
      for (const item of items) {
        const fullPath = currentPath ? `${currentPath}/${item.name}` : item.name;
        
        // .keep 파일 제외
        if (item.name === '.keep.png' || item.name.startsWith('.')) {
          continue;
        }
        
        if (item.id === null) {
          // 폴더인 경우 재귀 탐색
          await listFolderRecursive(fullPath);
        } else {
          // 파일인 경우 - 이미지 확장자 확인
          const ext = item.name.split('.').pop()?.toLowerCase();
          if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'heic', 'heif'].includes(ext)) {
            // 공개 URL 생성
            const { data: { publicUrl } } = supabase.storage
              .from('blog-images')
              .getPublicUrl(fullPath);
            
            allFiles.push({
              name: item.name,
              path: fullPath,
              url: publicUrl,
              size: item.metadata?.size || 0,
              created_at: item.created_at,
              mime_type: item.metadata?.mimetype || `image/${ext}`
            });
            
            if (allFiles.length >= limit) {
              return;
            }
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

// image_assets에 이미지 등록
async function registerImageToAssets(image) {
  const fileName = image.name;
  const fileExt = path.extname(fileName).slice(1).toLowerCase() || 'jpg';
  
  // image_assets에 이미 등록되어 있는지 확인
  const { data: existing } = await supabase
    .from('image_assets')
    .select('id')
    .eq('cdn_url', image.url)
    .single();
  
  if (existing) {
    return { success: true, alreadyExists: true, id: existing.id };
  }
  
  // 등록
  const { data: newAsset, error: insertError } = await supabase
    .from('image_assets')
    .insert({
      filename: fileName,
      original_filename: fileName,
      file_path: image.path,
      file_size: image.size,
      mime_type: image.mime_type || `image/${fileExt}`,
      format: fileExt,
      cdn_url: image.url,
      upload_source: 'batch_registered',
      status: 'active',
      alt_text: '',
      title: fileName.replace(/\.[^/.]+$/, ''),
      description: '',
    })
    .select('id')
    .single();
  
  if (insertError) {
    throw new Error(insertError.message);
  }
  
  return { success: true, alreadyExists: false, id: newAsset.id };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { folderPath = '', limit = 100, dryRun = false } = req.body;
    
    console.log(`🔄 이미지 일괄 등록 시작... (폴더: ${folderPath || '전체'}, 제한: ${limit}, Dry Run: ${dryRun})`);
    
    // 1. Storage에서 이미지 파일 목록 가져오기
    const storageImages = await getImagesFromStorage(folderPath, parseInt(limit) * 2); // 여유있게 가져오기
    
    if (!storageImages || storageImages.length === 0) {
      return res.status(200).json({
        success: true,
        message: '등록할 이미지가 없습니다.',
        results: {
          total: 0,
          registered: 0,
          alreadyExists: 0,
          failed: 0
        }
      });
    }
    
    // 2. image_assets에 등록된 이미지 URL 확인
    const imageUrls = storageImages.map(img => img.url);
    const { data: registeredImages } = await supabase
      .from('image_assets')
      .select('cdn_url')
      .in('cdn_url', imageUrls);
    
    const registeredUrls = new Set((registeredImages || []).map(img => img.cdn_url));
    
    // 3. 등록되지 않은 이미지만 필터링
    const missingImages = storageImages
      .filter(img => !registeredUrls.has(img.url))
      .slice(0, parseInt(limit));
    
    if (missingImages.length === 0) {
      return res.status(200).json({
        success: true,
        message: '모든 이미지가 이미 등록되어 있습니다.',
        results: {
          total: storageImages.length,
          registered: 0,
          alreadyExists: storageImages.length,
          failed: 0
        }
      });
    }
    
    // 4. Dry Run 모드인 경우
    if (dryRun) {
      return res.status(200).json({
        success: true,
        dryRun: true,
        message: `Dry Run: ${missingImages.length}개 이미지를 등록할 예정입니다.`,
        results: {
          total: storageImages.length,
          toRegister: missingImages.length,
          alreadyExists: storageImages.length - missingImages.length
        },
        images: missingImages.map(img => ({
          name: img.name,
          path: img.path,
          url: img.url,
          size: img.size
        }))
      });
    }
    
    // 5. 일괄 등록
    const results = {
      total: storageImages.length,
      registered: 0,
      alreadyExists: storageImages.length - missingImages.length,
      failed: 0,
      details: []
    };
    
    for (const img of missingImages) {
      try {
        const result = await registerImageToAssets(img);
        if (result.success) {
          if (result.alreadyExists) {
            results.alreadyExists++;
          } else {
            results.registered++;
          }
          results.details.push({
            success: true,
            path: img.path,
            id: result.id,
            alreadyExists: result.alreadyExists
          });
        }
      } catch (error) {
        results.failed++;
        results.details.push({
          success: false,
          path: img.path,
          error: error.message
        });
        console.error(`❌ 등록 실패 (${img.path}):`, error.message);
      }
      
      // API 호출 제한 방지 (100ms 대기)
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`✅ 일괄 등록 완료: 등록 ${results.registered}개, 실패 ${results.failed}개`);
    
    return res.status(200).json({
      success: true,
      message: `${results.registered}개 이미지 등록 완료`,
      results
    });
    
  } catch (error) {
    console.error('❌ 이미지 일괄 등록 오류:', error);
    return res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.',
      details: error.message
    });
  }
}

