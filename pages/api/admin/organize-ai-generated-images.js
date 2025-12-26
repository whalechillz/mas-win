// AI 생성 이미지를 ai-generated 폴더로 날짜별 정리 API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const IMAGE_BUCKET = process.env.IMAGE_BUCKET || 'blog-images';

// AI 생성 이미지 패턴 확인
const isAIGeneratedImage = (fileName) => {
  if (!fileName) return false;
  
  const lowerName = fileName.toLowerCase();
  
  // 명확한 AI 생성 이미지 패턴
  const aiPatterns = [
    /^golf-driver/,
    /^golf-swing/,
    /^paragraph-image/,
    /^ai-generated/,
    /^composed-/,
    /^generated-/
  ];
  
  return aiPatterns.some(pattern => pattern.test(lowerName));
};

// 폴더 존재 확인 및 생성
const ensureFolderExists = async (folderPath) => {
  try {
    // 폴더 존재 확인 (빈 폴더 리스트로 확인)
    const { data: existing, error: listError } = await supabase.storage
      .from(IMAGE_BUCKET)
      .list(folderPath, { limit: 1 });
    
    // 폴더가 없으면 생성 (더미 파일 업로드 후 삭제)
    if (listError || !existing) {
      // 폴더 생성은 자동으로 되므로, 더미 파일을 업로드했다가 삭제하는 방식 사용
      const dummyPath = `${folderPath}/.folder`;
      const { error: uploadError } = await supabase.storage
        .from(IMAGE_BUCKET)
        .upload(dummyPath, new Blob([''], { type: 'text/plain' }), {
          upsert: true
        });
      
      if (!uploadError) {
        // 더미 파일 삭제
        await supabase.storage
          .from(IMAGE_BUCKET)
          .remove([dummyPath]);
      }
    }
    
    return true;
  } catch (error) {
    console.error(`❌ 폴더 생성 오류 (${folderPath}):`, error);
    return false;
  }
};

// 이미지를 폴더로 이동
const moveImageToFolder = async (imagePath, targetFolder) => {
  try {
    // 폴더 존재 확인 및 생성
    await ensureFolderExists(targetFolder);
    
    // 현재 경로에서 파일명 추출
    const pathParts = imagePath.split('/');
    const fileName = pathParts[pathParts.length - 1];
    
    // 목표 폴더 경로 생성
    const targetPath = `${targetFolder}/${fileName}`;
    
    // 같은 위치면 이동 불필요
    if (imagePath === targetPath) {
      return { moved: false, message: '이미 해당 폴더에 있습니다.' };
    }
    
    // Storage에서 이미지 이동
    const { data, error } = await supabase.storage
      .from(IMAGE_BUCKET)
      .move(imagePath, targetPath);
    
    if (error) {
      // 이미 대상 폴더에 파일이 있을 수 있음
      if (error.message.includes('duplicate') || error.message.includes('already exists')) {
        return { moved: false, message: '대상 폴더에 이미 같은 파일이 있습니다.' };
      }
      
      throw error;
    }
    
    return { moved: true, newPath: targetPath };
    
  } catch (error) {
    console.error('❌ 이미지 이동 오류:', error);
    throw error;
  }
};

// AI 생성 이미지 찾기 및 정리
const organizeAIGeneratedImages = async (options = {}) => {
  const { dryRun = false, moveImages = false } = options;
  
  try {
    console.log('🔍 AI 생성 이미지 검색 중...');
    
    // 1. 전체 이미지 목록 조회 (루트 및 하위 폴더)
    let allImages = [];
    let offset = 0;
    const batchSize = 1000;
    
    while (true) {
      const { data: files, error } = await supabase.storage
        .from(IMAGE_BUCKET)
        .list('', {
          limit: batchSize,
          offset: offset,
          sortBy: { column: 'name', order: 'asc' }
        });
      
      if (error) {
        console.error('❌ 이미지 목록 조회 오류:', error);
        break;
      }
      
      if (!files || files.length === 0) {
        break;
      }
      
      // 파일만 필터링 (폴더 제외)
      const imageFiles = files.filter(file => file.id && !file.name.endsWith('/'));
      allImages = allImages.concat(imageFiles.map(file => ({
        name: file.name,
        path: file.name,
        created_at: file.created_at,
        metadata: file.metadata
      })));
      
      offset += batchSize;
      
      if (files.length < batchSize) {
        break;
      }
    }
    
    console.log(`📊 전체 이미지: ${allImages.length}개`);
    
    // 2. AI 생성 이미지 필터링
    const aiImages = allImages.filter(img => isAIGeneratedImage(img.name));
    console.log(`🤖 AI 생성 이미지 발견: ${aiImages.length}개`);
    
    // 3. 날짜별로 그룹화
    const imagesByDate = {};
    
    for (const img of aiImages) {
      // created_at에서 날짜 추출
      let dateStr = '';
      if (img.created_at) {
        const date = new Date(img.created_at);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        dateStr = `${year}-${month}-${day}`;
      } else {
        // created_at이 없으면 현재 날짜 사용
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        dateStr = `${year}-${month}-${day}`;
      }
      
      if (!imagesByDate[dateStr]) {
        imagesByDate[dateStr] = [];
      }
      
      imagesByDate[dateStr].push({
        ...img,
        targetFolder: `originals/ai-generated/${dateStr}`
      });
    }
    
    console.log(`📅 날짜별 그룹: ${Object.keys(imagesByDate).length}개`);
    
    // 4. 이미지 이동 (moveImages가 true일 때만)
    const results = {
      total: aiImages.length,
      byDate: {},
      moved: 0,
      skipped: 0,
      errors: 0
    };
    
    for (const [dateStr, images] of Object.entries(imagesByDate)) {
      const targetFolder = `originals/ai-generated/${dateStr}`;
      const dateResults = {
        date: dateStr,
        folder: targetFolder,
        total: images.length,
        moved: 0,
        skipped: 0,
        errors: 0,
        images: []
      };
      
      for (const img of images) {
        const result = {
          name: img.name,
          currentPath: img.path,
          targetPath: `${targetFolder}/${img.name}`,
          moved: false,
          skipped: false,
          error: null
        };
        
        // 이미 ai-generated 폴더에 있으면 스킵
        if (img.path.startsWith('originals/ai-generated/')) {
          result.skipped = true;
          dateResults.skipped++;
          results.skipped++;
        } else if (moveImages && !dryRun) {
          // 실제 이동
          try {
            const moveResult = await moveImageToFolder(img.path, targetFolder);
            if (moveResult.moved) {
            result.moved = true;
            result.targetPath = moveResult.newPath;
            dateResults.moved++;
            results.moved++;
          } else {
            result.skipped = true;
            dateResults.skipped++;
            results.skipped++;
          }
          } catch (error) {
            result.error = error.message;
            dateResults.errors++;
            results.errors++;
          }
        } else {
          // dryRun 모드: 이동하지 않고 정보만 수집
          result.skipped = true;
          dateResults.skipped++;
          results.skipped++;
        }
        
        dateResults.images.push(result);
      }
      
      results.byDate[dateStr] = dateResults;
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ AI 생성 이미지 정리 오류:', error);
    throw error;
  }
};

export default async function handler(req, res) {
  console.log('🔍 AI 생성 이미지 정리 API 요청:', req.method, req.url);
  
  try {
    if (req.method === 'GET') {
      // 상태 확인 (dryRun)
      const { dryRun = 'true' } = req.query;
      const results = await organizeAIGeneratedImages({
        dryRun: dryRun === 'true',
        moveImages: false
      });
      
      return res.status(200).json({
        success: true,
        dryRun: true,
        results
      });
      
    } else if (req.method === 'POST') {
      // 실제 이동
      const { dryRun = false, moveImages = true } = req.body;
      
      const results = await organizeAIGeneratedImages({
        dryRun,
        moveImages
      });
      
      return res.status(200).json({
        success: true,
        dryRun,
        results
      });
      
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('❌ AI 생성 이미지 정리 API 오류:', error);
    return res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      details: error.message || '알 수 없는 오류가 발생했습니다.'
    });
  }
}

























