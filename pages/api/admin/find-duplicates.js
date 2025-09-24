// 중복 이미지 찾기 API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 이미지 해시 계산 (간단한 파일명 기반)
const calculateImageHash = (filename) => {
  // 파일명에서 실제 이미지 이름 부분만 추출
  // blog-upload-1758725641002-waterproof-p.jpg -> waterproof-p
  const match = filename.match(/blog-upload-\d+-(.+?)\./);
  if (match) {
    return match[1]; // 실제 이미지 이름 부분
  }
  return filename;
};

// 중복 이미지 찾기
const findDuplicateImages = (images) => {
  const hashMap = new Map();
  const duplicates = [];
  
  images.forEach(image => {
    const hash = calculateImageHash(image.name);
    
    if (hashMap.has(hash)) {
      // 중복 발견
      const existingGroup = hashMap.get(hash);
      existingGroup.push(image);
    } else {
      // 새로운 그룹 생성
      hashMap.set(hash, [image]);
    }
  });
  
  // 중복이 있는 그룹만 반환
  hashMap.forEach((group, hash) => {
    if (group.length > 1) {
      duplicates.push({
        hash,
        count: group.length,
        images: group
      });
    }
  });
  
  return duplicates.sort((a, b) => b.count - a.count);
};

export default async function handler(req, res) {
  console.log('🔍 중복 이미지 찾기 API 요청:', req.method, req.url);
  
  try {
    if (req.method === 'GET') {
      // 모든 이미지 조회
      const { data: files, error } = await supabase.storage
        .from('blog-images')
        .list('', {
          limit: 1000,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error('❌ 이미지 조회 에러:', error);
        return res.status(500).json({
          error: '이미지 목록을 불러올 수 없습니다.',
          details: error.message
        });
      }

      // 이미지 URL 생성
      const imagesWithUrl = files.map(file => {
        const { data: urlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(file.name);
        
        return {
          id: file.id,
          name: file.name,
          size: file.metadata?.size || 0,
          created_at: file.created_at,
          updated_at: file.updated_at,
          url: urlData.publicUrl,
          hash: calculateImageHash(file.name)
        };
      });

      // 중복 이미지 찾기
      const duplicates = findDuplicateImages(imagesWithUrl);
      
      console.log('✅ 중복 이미지 분석 완료:', duplicates.length, '개 그룹');
      
      return res.status(200).json({ 
        duplicates,
        totalImages: imagesWithUrl.length,
        duplicateGroups: duplicates.length,
        duplicateCount: duplicates.reduce((sum, group) => sum + group.count, 0)
      });
      
    } else if (req.method === 'DELETE') {
      // 중복 이미지 삭제
      const { imageNames } = req.body;
      
      if (!imageNames || !Array.isArray(imageNames)) {
        return res.status(400).json({
          error: '삭제할 이미지 이름 배열이 필요합니다.'
        });
      }

      console.log('🗑️ 중복 이미지 삭제 중...', imageNames.length, '개');
      
      const { error } = await supabase.storage
        .from('blog-images')
        .remove(imageNames);

      if (error) {
        console.error('❌ 이미지 삭제 에러:', error);
        return res.status(500).json({
          error: '이미지 삭제에 실패했습니다.',
          details: error.message
        });
      }

      console.log('✅ 중복 이미지 삭제 성공:', imageNames.length, '개');
      
      return res.status(200).json({
        success: true,
        message: `${imageNames.length}개의 중복 이미지가 삭제되었습니다.`,
        deletedImages: imageNames
      });
      
    } else {
      return res.status(405).json({
        error: '지원하지 않는 HTTP 메서드입니다.'
      });
    }
    
  } catch (error) {
    console.error('❌ 중복 이미지 API 오류:', error);
    return res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      details: error.message
    });
  }
}
