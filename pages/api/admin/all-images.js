// 전체 이미지 조회 API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 전체 개수 캐싱 (10분간 유효)
let totalCountCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10분

// 이미지 목록 캐싱 (5분간 유효)
let imagesCache = new Map();
let imagesCacheTimestamp = 0;
const IMAGES_CACHE_DURATION = 5 * 60 * 1000; // 5분

export default async function handler(req, res) {
  console.log('🔍 전체 이미지 조회 API 요청:', req.method, req.url);
  
  try {
    if (req.method === 'GET') {
      const { limit = 1000, offset = 0, page = 1, prefix = '', includeChildren = 'true' } = req.query;
      const pageSize = parseInt(limit);
      const currentPage = parseInt(page);
      const currentOffset = parseInt(offset) || (currentPage - 1) * pageSize;
      
      console.log('📝 전체 이미지 목록 조회 중...', { limit: pageSize, offset: currentOffset, page: currentPage });
      
      // 전체 개수 조회 (캐싱 적용) - 폴더 포함
      let totalCount = totalCountCache;
      const now = Date.now();
      
      if (!totalCountCache || (now - cacheTimestamp) > CACHE_DURATION) {
        console.log('📊 전체 이미지 개수 조회 중 (폴더 포함)...');
        let allFiles = [];
        
        // 재귀적으로 모든 폴더의 이미지 조회
      const getAllImagesRecursively = async (folderPath = '') => {
          console.log(`📁 폴더 조회 중: ${folderPath || '루트'}`);
          
          const { data: files, error } = await supabase.storage
            .from('blog-images')
            .list(folderPath, {
              sortBy: { column: 'created_at', order: 'desc' }
            });

          if (error) {
            console.error(`❌ 폴더 조회 에러 (${folderPath}):`, error);
            return;
          }

          if (!files) return;

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
                allFiles.push({
                  ...file,
                  folderPath: folderPath // 폴더 경로 추가
                });
              }
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
      const totalPages = Math.ceil(totalCount / pageSize);
      
      // 캐시된 이미지 목록 확인
      const cacheKey = `${prefix || 'root'}_${includeChildren}`;
      const currentTime = Date.now();
      let allFilesForPagination = [];
      
      if (imagesCache.has(cacheKey) && (currentTime - imagesCacheTimestamp) < IMAGES_CACHE_DURATION) {
        console.log('📊 캐시된 이미지 목록 사용:', cacheKey);
        allFilesForPagination = imagesCache.get(cacheKey);
      } else {
        console.log('📊 이미지 목록 새로 조회:', cacheKey);
        
        // 재귀적으로 모든 폴더의 이미지 조회 (페이지네이션용)
        const getAllImagesForPagination = async (folderPath = '') => {
          const { data: files, error } = await supabase.storage
            .from('blog-images')
            .list(folderPath, {
              sortBy: { column: 'created_at', order: 'desc' }
            });

          if (error) {
            console.error(`❌ 폴더 조회 에러 (${folderPath}):`, error);
            return;
          }

          if (!files) return;

          for (const file of files) {
            if (!file.id) {
              // 폴더인 경우 재귀적으로 조회
              const subFolderPath = folderPath ? `${folderPath}/${file.name}` : file.name;
              await getAllImagesForPagination(subFolderPath);
            } else {
              // 이미지 파일인 경우
              const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
              const isImage = imageExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
              
              if (isImage) {
                allFilesForPagination.push({
                  ...file,
                  folderPath: folderPath // 폴더 경로 추가
                });
              }
            }
          }
        };

        // includeChildren 파라미터 처리 (boolean 또는 문자열 모두 지원)
        const shouldIncludeChildren = includeChildren === 'true' || includeChildren === true || includeChildren === '1';
        if (shouldIncludeChildren) {
          await getAllImagesForPagination(prefix || '');
        } else {
          // 현재 폴더만(하위 미포함)
          const { data: files, error } = await supabase.storage
            .from('blog-images')
            .list(prefix || '', { sortBy: { column: 'created_at', order: 'desc' } });
          if (!error && files) {
            for (const file of files) {
              if (file.id) {
                const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
                const isImage = imageExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
                if (isImage) {
                  allFilesForPagination.push({ ...file, folderPath: prefix || '' });
                }
              }
            }
          }
        }
        
        // 생성일 기준으로 정렬
        allFilesForPagination.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // 캐시에 저장
        imagesCache.set(cacheKey, allFilesForPagination);
        imagesCacheTimestamp = currentTime;
        console.log('✅ 이미지 목록 캐시 저장:', allFilesForPagination.length, '개');
      }
      
      // 페이지네이션 적용
      const imageFiles = allFilesForPagination.slice(currentOffset, currentOffset + pageSize);
      
      console.log(`📁 폴더 포함 조회: 총 ${allFilesForPagination.length}개 → 페이지 ${imageFiles.length}개 이미지 파일`);

      // 이미지 URL 생성 및 메타데이터 일괄 조회
      const imageUrls = imageFiles.map(file => {
        const fullPath = file.folderPath ? `${file.folderPath}/${file.name}` : file.name;
        const { data: urlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(fullPath);
        return {
          file,
          url: urlData.publicUrl,
          fullPath
        };
      });

      // URL 정규화 함수 (도메인 제거, 경로만 비교)
      const normalizeUrl = (url) => {
        if (!url) return '';
        try {
          const urlObj = new URL(url);
          return urlObj.pathname;
        } catch {
          return url;
        }
      };

      // 모든 URL을 한 번에 조회하여 메타데이터 가져오기
      // 주의: image_metadata 테이블 스키마에 맞춰 컬럼 조회
      const urls = imageUrls.map(item => item.url);
      const fileNames = imageUrls.map(item => item.file.name);
      
      // URL과 file_name 기준으로 메타데이터 조회 (필터링하여 효율성 향상)
      // 1. URL 기준 조회
      const { data: metadataByUrl } = await supabase
        .from('image_metadata')
        .select('id, alt_text, title, description, tags, category_id, image_url, file_name, usage_count, upload_source, status')
        .in('image_url', urls);
      
      // 2. file_name 기준 조회 (URL로 찾지 못한 경우)
      const { data: metadataByFileNameFromDb } = await supabase
        .from('image_metadata')
        .select('id, alt_text, title, description, tags, category_id, image_url, file_name, usage_count, upload_source, status')
        .in('file_name', fileNames);
      
      // 두 결과 병합 (중복 제거)
      const allMetadataMap = new Map();
      if (metadataByUrl) {
        metadataByUrl.forEach(meta => {
          const key = meta.image_url || meta.file_name || '';
          if (key) allMetadataMap.set(key, meta);
        });
      }
      if (metadataByFileNameFromDb) {
        metadataByFileNameFromDb.forEach(meta => {
          const key = meta.image_url || meta.file_name || '';
          if (key && !allMetadataMap.has(key)) {
            allMetadataMap.set(key, meta);
          }
        });
      }
      
      // Map을 배열로 변환
      const allMetadata = Array.from(allMetadataMap.values());

      // 카테고리 매핑 (category_id -> 카테고리 이름)
      const categoryIdMap = new Map();
      if (allMetadata && allMetadata.length > 0) {
        const categoryIds = [...new Set(allMetadata.map(m => m.category_id).filter(Boolean))];
        if (categoryIds.length > 0) {
          const { data: categories } = await supabase
            .from('image_categories')
            .select('id, name')
            .in('id', categoryIds);
          if (categories) {
            categories.forEach(cat => {
              categoryIdMap.set(cat.id, cat.name);
            });
          }
        }
      }

      // 메타데이터를 URL 및 file_name 기준으로 매핑
      const metadataMap = new Map(); // URL -> metadata
      const metadataByFileName = new Map(); // file_name -> metadata
      const metadataByNormalizedUrl = new Map(); // normalized URL -> metadata
      
      if (allMetadata && allMetadata.length > 0) {
        allMetadata.forEach(meta => {
          // URL 기준 매핑 (정확한 URL)
          if (meta.image_url) {
            metadataMap.set(meta.image_url, meta);
            
            // 정규화된 URL로도 매핑
            const normalizedMetaUrl = normalizeUrl(meta.image_url);
            if (normalizedMetaUrl) {
              metadataByNormalizedUrl.set(normalizedMetaUrl, meta);
            }
            
            // URL에서 파일명 추출하여 매핑 (예: /blog-images/file.png -> file.png)
            try {
              const urlObj = new URL(meta.image_url);
              const pathParts = urlObj.pathname.split('/');
              const fileName = pathParts[pathParts.length - 1];
              if (fileName) {
                // 파일명 정규화 (.png.png 같은 중복 확장자 제거)
                // 예: golf-driver-male-massgoo-395.png.png -> golf-driver-male-massgoo-395.png
                const normalizedFileName = fileName.replace(/(\.(png|jpg|jpeg|gif|webp))\1+$/i, '$1');
                if (!metadataByFileName.has(fileName)) {
                  metadataByFileName.set(fileName, meta);
                }
                if (normalizedFileName !== fileName && !metadataByFileName.has(normalizedFileName)) {
                  metadataByFileName.set(normalizedFileName, meta);
                }
              }
            } catch (e) {
              // URL 파싱 실패 시 무시
            }
          }
          
          // file_name 기준 매핑 (직접 매칭)
          if (meta.file_name) {
            // 파일명 정규화 (.png.png 같은 중복 확장자 제거)
            const normalizedFileName = meta.file_name.replace(/(\.(png|jpg|jpeg|gif|webp))\1+$/i, '$1');
            if (!metadataByFileName.has(meta.file_name)) {
              metadataByFileName.set(meta.file_name, meta);
            }
            if (normalizedFileName !== meta.file_name && !metadataByFileName.has(normalizedFileName)) {
              metadataByFileName.set(normalizedFileName, meta);
            }
          }
        });
      }
      
      console.log(`📊 메타데이터 매핑 완료: ${allMetadata.length}개 메타데이터, ${metadataMap.size}개 URL 매핑, ${metadataByFileName.size}개 파일명 매핑, ${metadataByNormalizedUrl.size}개 정규화 URL 매핑`);

      // 이미지 데이터 생성 (URL 매칭 개선: 정규화된 URL 및 file_name 폴백)
      const imagesWithUrl = imageUrls.map(({ file, url, fullPath }) => {
        // 1차: 정확한 URL 매칭
        let metadata = metadataMap.get(url);
        
        // 2차: 정규화된 URL 매칭 (도메인 제거, 경로만 비교)
        if (!metadata) {
          const normalizedUrl = normalizeUrl(url);
          if (normalizedUrl) {
            metadata = metadataByNormalizedUrl.get(normalizedUrl);
          }
        }
        
        // 3차: URL에서 파일명 추출하여 매칭
        if (!metadata) {
          try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/');
            const fileName = pathParts[pathParts.length - 1];
            if (fileName) {
              // 파일명 정규화 (.png.png 같은 중복 확장자 제거)
              const normalizedFileName = fileName.replace(/(\.(png|jpg|jpeg|gif|webp))\1+$/i, '$1');
              metadata = metadataByFileName.get(fileName) || metadataByFileName.get(normalizedFileName);
            }
          } catch (e) {
            // URL 파싱 실패 시 무시
          }
        }
        
        // 4차: file_name 기반 직접 매칭 (파일명 정규화 포함)
        if (!metadata) {
          const normalizedFileFileName = file.name.replace(/(\.(png|jpg|jpeg|gif|webp))\1+$/i, '$1');
          metadata = metadataByFileName.get(file.name) || metadataByFileName.get(normalizedFileFileName);
        }
        
        // 메타데이터가 없을 경우 기본값 설정
        const defaultTitle = metadata?.title || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        
        return {
          id: file.id,
          name: file.name,
          size: file.metadata?.size || 0,
          created_at: file.created_at,
          updated_at: file.updated_at,
          url: url,
          folder_path: file.folderPath || '',
          alt_text: metadata?.alt_text || defaultTitle,
          title: defaultTitle,
          description: metadata?.description || '',
          keywords: Array.isArray(metadata?.tags) ? metadata.tags : (metadata?.tags ? [metadata.tags] : []),
          // category는 category_id를 기반으로 카테고리 이름 반환 (하위 호환성)
          // 실제로는 카테고리 체크박스에서 categories 배열을 사용하므로, category_id가 있으면 해당 카테고리 이름을 배열로 반환
          category: metadata?.category_id ? categoryIdMap.get(metadata.category_id) || '' : '',
          // categories는 배열 형태로 반환 (카테고리 체크박스용)
          categories: metadata?.category_id ? [categoryIdMap.get(metadata.category_id)].filter(Boolean) : [],
          usage_count: metadata?.usage_count || 0,
          upload_source: metadata?.upload_source || 'manual',
          status: metadata?.status || 'active',
          // 메타데이터 존재 여부 표시 (UI에서 "메타데이터 없음" 표시용)
          has_metadata: !!metadata
        };
      });

      console.log('✅ 전체 이미지 조회 성공:', imagesWithUrl.length, '개 (총', totalCount, '개 중)');
      return res.status(200).json({ 
        images: imagesWithUrl,
        count: imagesWithUrl.length,
        total: totalCount,
        pagination: {
          currentPage,
          totalPages,
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
    
  } catch (error) {
    console.error('❌ 전체 이미지 조회 API 오류:', error);
    return res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      details: error.message
    });
  }
}
