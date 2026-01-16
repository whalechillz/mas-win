/**
 * 고객 이미지 업로드 API
 * 
 * originals/customers/customer-{id}/YYYY-MM-DD/ 폴더에 저장
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = 'blog-images';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // 이미지 업로드 및 메타데이터 저장
    try {
      const { 
        customerId, 
        customerName, 
        customerNameEn,
        customerInitials,
        visitDate, 
        imageUrl, 
        filePath, 
        fileName, 
        originalFileName,
        fileSize,
        storyScene,
        imageType,
        folderName
      } = req.body;

      if (!customerId || !visitDate || !imageUrl) {
        return res.status(400).json({
          success: false,
          error: 'customerId, visitDate, imageUrl이 필요합니다.'
        });
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // image_metadata 테이블에 저장 (upsert 사용 - image_url 기준)
      const metadataPayload = {
        image_url: imageUrl,  // UNIQUE 컬럼
        folder_path: filePath.substring(0, filePath.lastIndexOf('/')),
        date_folder: visitDate,
        source: 'customer',
        channel: 'customer',
        title: `${customerName} - ${visitDate}`,
        alt_text: `${customerName} 고객 방문 이미지 (${visitDate})`,
        file_size: fileSize || null,
        // 고객 정보를 메타데이터에 저장 (JSON 필드 활용)
        tags: [`customer-${customerId}`, `visit-${visitDate}`],
        // 스토리 기반 분류 추가
        story_scene: storyScene || null,
        image_type: imageType || null,
        original_filename: originalFileName || null,
        english_filename: fileName || null,
        customer_name_en: customerNameEn || null,
        customer_initials: customerInitials || null,
        image_quality: 'final',
        metadata: {
          visitDate: visitDate,
          customerName: customerName,
          folderName: folderName
        },
        updated_at: new Date().toISOString()
      };

      // upsert 사용: image_url이 있으면 업데이트, 없으면 생성
      const { data, error } = await supabase
        .from('image_metadata')
        .upsert(metadataPayload, {
          onConflict: 'image_url',
          ignoreDuplicates: false
        })
        .select();

      if (error) {
        console.error('❌ 메타데이터 저장 실패:', error);
        console.error('저장 시도한 데이터:', metadataPayload);
        return res.status(500).json({
          success: false,
          error: '메타데이터 저장 실패',
          details: error.message
        });
      }

      // customers 테이블 업데이트 (영문 이름, 이니셜, 폴더명)
      if (customerNameEn || customerInitials || folderName) {
        const customerUpdateData = {};
        if (customerNameEn) customerUpdateData.name_en = customerNameEn;
        if (customerInitials) customerUpdateData.initials = customerInitials;
        if (folderName) customerUpdateData.folder_name = folderName;
        
        const { error: customerUpdateError } = await supabase
          .from('customers')
          .update(customerUpdateData)
          .eq('id', customerId);
        
        if (customerUpdateError) {
          console.warn('⚠️ 고객 정보 업데이트 실패 (계속 진행):', customerUpdateError.message);
        } else {
          console.log('✅ 고객 정보 업데이트 완료:', customerUpdateData);
        }
      }

      return res.status(200).json({
        success: true,
        message: '고객 이미지가 저장되었습니다.',
        image: data[0]
      });

    } catch (error) {
      console.error('❌ 고객 이미지 업로드 오류:', error);
      return res.status(500).json({
        success: false,
        error: '고객 이미지 업로드 중 오류가 발생했습니다.',
        details: error.message
      });
    }
  } else if (req.method === 'GET') {
    // 고객 이미지 목록 조회
    try {
      const { customerId, dateFilter } = req.query;

      if (!customerId) {
        return res.status(400).json({
          success: false,
          error: 'customerId가 필요합니다.'
        });
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // 1. customers 테이블에서 폴더명 조회
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('folder_name, name')
        .eq('id', customerId)
        .single();

      if (customerError || !customerData) {
        console.warn('⚠️ 고객 정보 조회 실패 (계속 진행):', customerError?.message);
      }

      // 2. image_metadata에서 조회 (개선: tags 필터 + folder_path 필터 OR 조건)
      // tags가 없어도 folder_path로 이미지를 로드할 수 있도록 개선
      let metadataQuery = supabase
        .from('image_metadata')
        .select('*');
      
      // tags 또는 folder_path로 필터링 (OR 조건)
      if (customerData?.folder_name) {
        metadataQuery = metadataQuery.or(`tags.cs.{customer-${customerId}},folder_path.ilike.%customers/${customerData.folder_name}%`);
      } else {
        // folder_name이 없으면 tags만 사용
        metadataQuery = metadataQuery.contains('tags', [`customer-${customerId}`]);
      }

      // 날짜 필터 적용
      if (dateFilter) {
        metadataQuery = metadataQuery.eq('date_folder', dateFilter);
      }

      const { data: metadataImages, error: metadataError } = await metadataQuery
        .order('date_folder', { ascending: false })
        .order('created_at', { ascending: false });

      if (metadataError) {
        console.error('❌ 메타데이터 조회 실패:', metadataError);
      }

      let allImages = metadataImages || [];
      let storageImages = [];

      // 3. Storage에서 실제 파일 조회 (폴더명이 있는 경우)
      if (customerData?.folder_name) {
        const baseFolderPath = `originals/customers/${customerData.folder_name}`;
        
        // 날짜 필터가 있으면 해당 날짜 폴더만, 없으면 모든 하위 폴더 조회
        const folderPath = dateFilter 
          ? `${baseFolderPath}/${dateFilter}`
          : baseFolderPath;

        try {
          // Storage에서 파일 목록 조회
          // 날짜 필터가 있으면 해당 날짜 폴더만, 없으면 재귀적으로 모든 하위 폴더 조회
          let storageFiles = [];
          
          if (dateFilter) {
            // 특정 날짜 폴더만 조회
            const { data: files, error: storageError } = await supabase.storage
              .from(bucketName)
              .list(folderPath, {
                limit: 1000,
                offset: 0,
                sortBy: { column: 'name', order: 'asc' }
              });
            
            if (!storageError && files) {
              storageFiles = files.filter(file => !file.name.endsWith('/'));
            }
          } else {
            // 모든 날짜 폴더 조회 (재귀적)
            const { data: dateFolders, error: foldersError } = await supabase.storage
              .from(bucketName)
              .list(baseFolderPath, {
                limit: 1000,
                offset: 0
              });
            
            if (!foldersError && dateFolders) {
              // 날짜 형식 폴더만 필터링 (YYYY-MM-DD)
              const dateFolderPattern = /^\d{4}-\d{2}-\d{2}$/;
              const validDateFolders = dateFolders.filter(folder => 
                !folder.name.endsWith('/') && dateFolderPattern.test(folder.name)
              );
              
              // 각 날짜 폴더의 파일 조회
              for (const dateFolder of validDateFolders) {
                const dateFolderPath = `${baseFolderPath}/${dateFolder.name}`;
                const { data: files, error: filesError } = await supabase.storage
                  .from(bucketName)
                  .list(dateFolderPath, {
                    limit: 1000,
                    offset: 0,
                    sortBy: { column: 'name', order: 'asc' }
                  });
                
                if (!filesError && files) {
                  const filesWithDate = files
                    .filter(file => !file.name.endsWith('/'))
                    .map(file => ({ ...file, dateFolder: dateFolder.name }));
                  storageFiles = [...storageFiles, ...filesWithDate];
                }
              }
            }
          }

          if (storageFiles.length > 0) {
            // 날짜 추출 함수
            const extractDateFromPath = (path) => {
              const dateMatch = path.match(/(\d{4}-\d{2}-\d{2})/);
              return dateMatch ? dateMatch[1] : null;
            };

            // 이미지 타입 추출 함수
            const extractImageTypeFromFileName = (fileName) => {
              const match = fileName.match(/_s\d+_(.+?)_\d+\./);
              return match ? match[1] : null;
            };

            // 파일명 정규화 함수 (확장자 포함)
            const normalizeFileName = (fileName) => {
              if (!fileName) return '';
              return fileName.toLowerCase().replace(/[^a-z0-9.-]/g, '');
            };

            // 확장자 제거 함수
            const getFileNameWithoutExt = (fileName) => {
              if (!fileName) return '';
              return fileName.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9.-]/g, '');
            };

            // URL에서 파일명 추출 함수
            const extractFileNameFromUrl = (url) => {
              try {
                const urlObj = new URL(url);
                const pathParts = urlObj.pathname.split('/');
                return pathParts[pathParts.length - 1].split('?')[0];
              } catch {
                return url.split('/').pop()?.split('?')[0] || '';
              }
            };

            // metadata 파일명 및 URL 맵 생성 (확장자 포함 및 제거 버전 모두)
            const metadataFileMap = new Map();
            (metadataImages || []).forEach(img => {
              const metaFileName = normalizeFileName(img.english_filename || img.original_filename || '');
              const metaFileNameWithoutExt = getFileNameWithoutExt(img.english_filename || img.original_filename || '');
              
              // 확장자 포함 버전
              if (metaFileName) {
                metadataFileMap.set(metaFileName, img);
              }
              
              // 확장자 제거 버전 (같은 이름의 다른 확장자 파일 매칭용)
              if (metaFileNameWithoutExt && metaFileNameWithoutExt !== metaFileName) {
                // 이미 같은 키가 있으면 기존 것 유지 (첫 번째 매칭 우선)
                if (!metadataFileMap.has(metaFileNameWithoutExt)) {
                  metadataFileMap.set(metaFileNameWithoutExt, img);
                }
              }
              
              // URL에서 파일명 추출하여도 맵에 추가
              const urlFileName = normalizeFileName(extractFileNameFromUrl(img.image_url || ''));
              const urlFileNameWithoutExt = getFileNameWithoutExt(extractFileNameFromUrl(img.image_url || ''));
              
              if (urlFileName && urlFileName !== metaFileName) {
                metadataFileMap.set(urlFileName, img);
              }
              
              if (urlFileNameWithoutExt && urlFileNameWithoutExt !== urlFileName && !metadataFileMap.has(urlFileNameWithoutExt)) {
                metadataFileMap.set(urlFileNameWithoutExt, img);
              }
            });
            
            storageImages = storageFiles.map(file => {
              const fileDate = dateFilter || file.dateFolder || 'unknown';
              const filePath = dateFilter 
                ? `${folderPath}/${file.name}`
                : `${baseFolderPath}/${fileDate}/${file.name}`;
              
              const { data: { publicUrl } } = supabase.storage
                .from(bucketName)
                .getPublicUrl(filePath);

              const normalizedFileName = normalizeFileName(file.name);
              const normalizedFileNameWithoutExt = getFileNameWithoutExt(file.name);
              
              // 확장자 포함 버전과 확장자 제거 버전 모두 확인
              const matchingMetadata = metadataFileMap.get(normalizedFileName) || 
                                      metadataFileMap.get(normalizedFileNameWithoutExt);
              
              // URL 정규화 (인코딩 문제 해결)
              let normalizedPublicUrl = publicUrl;
              try {
                const urlObj = new URL(publicUrl);
                normalizedPublicUrl = decodeURIComponent(urlObj.origin + urlObj.pathname);
              } catch {
                normalizedPublicUrl = decodeURIComponent(publicUrl.split('?')[0]);
              }
              
              // metadata 이미지 목록에서 URL로도 확인 (인코딩 차이 고려)
              let metadataByUrl = null;
              if (!matchingMetadata) {
                metadataByUrl = (metadataImages || []).find(meta => {
                  if (!meta.image_url) return false;
                  try {
                    const metaUrlObj = new URL(meta.image_url);
                    const normalizedMetaUrl = decodeURIComponent(metaUrlObj.origin + metaUrlObj.pathname);
                    return normalizedMetaUrl === normalizedPublicUrl || meta.image_url === publicUrl;
                  } catch {
                    return meta.image_url === publicUrl;
                  }
                });
              }
              
              const finalMetadata = matchingMetadata || metadataByUrl;
              
              return {
                id: finalMetadata?.id || null,
                image_url: publicUrl,
                english_filename: file.name,
                original_filename: file.name,
                date_folder: fileDate,
                story_scene: finalMetadata?.story_scene || null,
                image_type: extractImageTypeFromFileName(file.name) || finalMetadata?.image_type || null,
                isFromStorage: !finalMetadata, // metadata에 없으면 Storage에서 가져온 파일
                metadataMissing: !finalMetadata // metadata에 없는 파일
              };
            })
            .filter(img => {
              // metadata에 없는 파일만 필터링 (id가 null인 파일)
              // 단, 이미 metadata 목록에 있는 URL과 중복되지 않는 경우만
              const isDuplicate = (metadataImages || []).some(meta => {
                if (!meta.image_url || !img.image_url) return false;
                try {
                  const metaUrlObj = new URL(meta.image_url);
                  const imgUrlObj = new URL(img.image_url);
                  const normalizedMetaUrl = decodeURIComponent(metaUrlObj.origin + metaUrlObj.pathname);
                  const normalizedImgUrl = decodeURIComponent(imgUrlObj.origin + imgUrlObj.pathname);
                  return normalizedMetaUrl === normalizedImgUrl;
                } catch {
                  return meta.image_url === img.image_url;
                }
              });
              
              // metadata에 없고 중복도 아닌 파일만 반환
              return !img.id && !isDuplicate;
            });

            // metadata와 병합
            allImages = [...(metadataImages || []), ...storageImages];
          }
        } catch (storageErr) {
          console.warn('⚠️ Storage 조회 실패 (계속 진행):', storageErr);
        }
      }

      // date_folder가 없는 이미지에 대해 폴더 경로나 created_at에서 날짜 추출
      allImages = allImages.map(img => {
        if (!img.date_folder) {
          // folder_path에서 날짜 추출
          if (img.folder_path) {
            const dateMatch = img.folder_path.match(/(\d{4}-\d{2}-\d{2})/);
            if (dateMatch) {
              img.date_folder = dateMatch[1];
            }
          }
          // image_url에서 날짜 추출 시도
          if (!img.date_folder && img.image_url) {
            const urlDateMatch = img.image_url.match(/(\d{4}-\d{2}-\d{2})/);
            if (urlDateMatch) {
              img.date_folder = urlDateMatch[1];
            }
          }
          // created_at에서 날짜 추출
          if (!img.date_folder && img.created_at) {
            img.date_folder = img.created_at.slice(0, 10);
          }
          // 모두 실패하면 unknown
          if (!img.date_folder) {
            img.date_folder = 'unknown';
          }
        }
        return img;
      });

      // 날짜별로 그룹화
      const groupedByDate = allImages.reduce((acc, img) => {
        const date = img.date_folder || 'unknown';
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push({
          id: img.id,
          imageUrl: img.image_url,
          fileName: img.english_filename || img.original_filename || img.file_name,
          visitDate: date,
          createdAt: img.created_at
        });
        return acc;
      }, {});

      return res.status(200).json({
        success: true,
        images: allImages,
        groupedByDate,
        metadataCount: metadataImages?.length || 0,
        storageCount: storageImages.length,
        folderName: customerData?.folder_name || null
      });

    } catch (error) {
      console.error('❌ 고객 이미지 목록 조회 오류:', error);
      return res.status(500).json({
        success: false,
        error: '고객 이미지 목록 조회 중 오류가 발생했습니다.',
        details: error.message
      });
    }
  } else {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }
}









