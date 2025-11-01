// 중복 이미지 찾기 API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 이미지 해시 계산 (개선된 버전 - 더 정확한 중복 감지)
const calculateImageHash = (filename) => {
  // 1. blog-upload 패턴: 타임스탬프까지 포함하여 더 정확한 구분
  // blog-upload-1758725641002-waterproof-p.jpg -> blog-upload-waterproof-p
  const blogUploadMatch = filename.match(/blog-upload-\d+-(.+?)\./);
  if (blogUploadMatch) {
    return `blog-upload-${blogUploadMatch[1]}`;
  }
  
  // 2. august-funnel 패턴: 타임스탬프까지 포함
  // august-funnel-1757852476987-hero-image-1-face.webp -> august-funnel-hero-image-1-face
  const funnelMatch = filename.match(/august-funnel-\d+-(.+?)\./);
  if (funnelMatch) {
    return `august-funnel-${funnelMatch[1]}`;
  }
  
  // 3. complete-migration 패턴: 타임스탬프까지 포함하여 정확한 구분
  // complete-migration-1757776491130-9.webp -> complete-migration-1757776491130-9
  const migrationMatch = filename.match(/complete-migration-(\d+)-(.+?)\./);
  if (migrationMatch) {
    return `complete-migration-${migrationMatch[1]}-${migrationMatch[2]}`;
  }
  
  // 4. 기타 패턴들: 전체 파일명을 해시로 사용
  const otherMatch = filename.match(/([a-zA-Z0-9-_]+)\.(jpg|jpeg|png|gif|webp)$/i);
  if (otherMatch) {
    return otherMatch[1];
  }
  
  return filename;
};

// 전체 사이트에서 이미지 사용 현황을 확인하는 함수
const checkImageUsageAcrossSite = async (imageUrl) => {
  try {
    // 새로운 사용 현황 추적 API 호출
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/image-usage-tracker?imageUrl=${encodeURIComponent(imageUrl)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.usage || { blogPosts: [], funnelPages: [], staticPages: [], totalUsage: 0 };
    
  } catch (error) {
    console.error('이미지 사용 현황 추적 오류:', error);
    
    // 폴백: 기존 방식으로 블로그 게시물만 확인
    try {
      const { data: posts, error } = await supabase
        .from('blog_posts')
        .select('id, title, content, featured_image')
        .or(`content.ilike.%${imageUrl}%,featured_image.eq.${imageUrl}`);
      
      if (error) {
        console.error('이미지 사용 확인 오류:', error);
        return { blogPosts: [], funnelPages: [], staticPages: [], totalUsage: 0 };
      }
      
      return {
        blogPosts: posts || [],
        funnelPages: [],
        staticPages: [],
        totalUsage: (posts || []).length
      };
    } catch (fallbackError) {
      console.error('폴백 이미지 사용 확인 에러:', fallbackError);
      return { blogPosts: [], funnelPages: [], staticPages: [], totalUsage: 0 };
    }
  }
};

// 중복 이미지 찾기 (안정적인 버전)
const findDuplicateImages = (images) => {
  const hashMap = new Map();
  const duplicates = [];
  
  // 이미지들을 해시별로 그룹화
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
      // ✅ 개선: 모든 이미지 조회 (배치 조회로 1,166개 모두 조회)
      const allFiles = [];
      let offset = 0;
      const batchSize = 1000;
      
      // 재귀적으로 모든 폴더의 이미지 조회
      const getAllImagesRecursively = async (folderPath = '') => {
        let folderOffset = 0;
        
        while (true) {
          const { data: files, error } = await supabase.storage
            .from('blog-images')
            .list(folderPath, {
              limit: batchSize,
              offset: folderOffset,
              sortBy: { column: 'created_at', order: 'desc' }
            });

          if (error) {
            console.error(`❌ 폴더 조회 에러 (${folderPath}, offset: ${folderOffset}):`, error);
            break;
          }

          if (!files || files.length === 0) {
            break;
          }

          for (const file of files) {
            if (!file.id) {
              // 폴더인 경우 재귀적으로 조회
              const subFolderPath = folderPath ? `${folderPath}/${file.name}` : file.name;
              await getAllImagesRecursively(subFolderPath);
            } else {
              // 이미지 파일인 경우
              const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
              const isImage = imageExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
              
              if (isImage) {
                const fullPath = folderPath ? `${folderPath}/${file.name}` : file.name;
                allFiles.push({
                  ...file,
                  folderPath: folderPath,
                  fullPath: fullPath
                });
              }
            }
          }
          
          folderOffset += batchSize;
          
          if (files.length < batchSize) {
            break;
          }
        }
      };
      
      await getAllImagesRecursively('');
      console.log(`📊 총 이미지 조회: ${allFiles.length}개`);

      // 이미지 URL 생성 및 해시 계산
      const imagesWithUrl = allFiles.map(file => {
        const fullPath = file.fullPath || (file.folderPath ? `${file.folderPath}/${file.name}` : file.name);
        const { data: urlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(fullPath);
        
        return {
          id: file.id,
          name: file.name,
          size: file.metadata?.size || 0,
          created_at: file.created_at,
          updated_at: file.updated_at,
          url: urlData.publicUrl,
          folder_path: file.folderPath || '',
          full_path: fullPath,
          hash: calculateImageHash(file.name)
        };
      });

      // ✅ 중복 이미지 찾기 (파일명 기준 - 폴더 경로 무시)
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
