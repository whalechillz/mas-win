// 중복 이미지 제거 API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  console.log('🔍 중복 이미지 제거 API 요청:', req.method, req.url);
  
  try {
    if (req.method === 'POST') {
      const { action, duplicateGroups } = req.body;
      
      if (action === 'analyze') {
        // 중복 분석
        const { data: files, error } = await supabase.storage
          .from('blog-images')
          .list('', {
            limit: 1000,
            offset: 0,
            sortBy: { column: 'created_at', order: 'desc' }
          });

        if (error) {
          console.error('❌ 파일 조회 에러:', error);
          return res.status(500).json({
            error: '파일 목록을 불러올 수 없습니다.',
            details: error.message
          });
        }

        // URL별 그룹핑 (같은 URL을 가진 파일들)
        const urlGroups = {};
        
        files.forEach(file => {
          const { data: urlData } = supabase.storage
            .from('blog-images')
            .getPublicUrl(file.name);
          
          if (!urlGroups[urlData.publicUrl]) {
            urlGroups[urlData.publicUrl] = [];
          }
          urlGroups[urlData.publicUrl].push({
            id: file.id,
            name: file.name,
            url: urlData.publicUrl,
            created_at: file.created_at,
            size: file.metadata?.size || 0
          });
        });

        // 중복 URL 찾기
        const duplicateUrls = Object.entries(urlGroups)
          .filter(([url, files]) => files.length > 1)
          .map(([url, files]) => {
            // 가장 오래된 파일을 유지하고 나머지는 삭제 대상으로 표시
            const sortedFiles = files.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            const keepFile = sortedFiles[0];
            const deleteFiles = sortedFiles.slice(1);
            
            return {
              url,
              files: files,
              count: files.length,
              keep: keepFile,
              delete: deleteFiles
            };
          });

        console.log('✅ 중복 분석 완료:', duplicateUrls.length, '개 그룹');
        
        return res.status(200).json({
          totalFiles: files.length,
          duplicateGroups: duplicateUrls,
          summary: {
            duplicateGroups: duplicateUrls.length,
            filesToDelete: duplicateUrls.reduce((sum, group) => sum + group.delete.length, 0)
          }
        });
        
      } else if (action === 'remove') {
        // 중복 제거 실행
        const { duplicateGroups } = req.body;
        
        if (!duplicateGroups || !Array.isArray(duplicateGroups)) {
          return res.status(400).json({
            error: 'duplicateGroups 배열이 필요합니다.'
          });
        }

        let deletedCount = 0;
        let errorCount = 0;
        const errors = [];

        for (const group of duplicateGroups) {
          for (const file of group.delete) {
            try {
              // 스토리지에서 파일 삭제
              const { error: storageError } = await supabase.storage
                .from('blog-images')
                .remove([file.name]);

              if (storageError) {
                console.error('❌ 스토리지 삭제 오류:', storageError);
                errors.push(`파일 ${file.name} 삭제 실패: ${storageError.message}`);
                errorCount++;
                continue;
              }

              // 메타데이터에서도 삭제
              const { error: metadataError } = await supabase
                .from('image_metadata')
                .delete()
                .eq('image_url', file.url);

              if (metadataError) {
                console.error('❌ 메타데이터 삭제 오류:', metadataError);
                errors.push(`메타데이터 ${file.name} 삭제 실패: ${metadataError.message}`);
              }

              deletedCount++;
              console.log('✅ 삭제 완료:', file.name);
              
            } catch (error) {
              console.error('❌ 삭제 오류:', error);
              errors.push(`파일 ${file.name} 삭제 실패: ${error.message}`);
              errorCount++;
            }
          }
        }

        console.log('✅ 중복 제거 완료:', deletedCount, '개 삭제,', errorCount, '개 오류');
        
        return res.status(200).json({
          success: true,
          deleted: deletedCount,
          errors: errorCount,
          errorDetails: errors
        });
        
      } else {
        return res.status(400).json({
          error: '지원하지 않는 액션입니다. (analyze 또는 remove)'
        });
      }
      
    } else {
      return res.status(405).json({
        error: '지원하지 않는 HTTP 메서드입니다.'
      });
    }
    
  } catch (error) {
    console.error('❌ 중복 제거 API 오류:', error);
    return res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      details: error.message
    });
  }
}
