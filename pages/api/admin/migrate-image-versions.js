// 기존 이미지 파일들을 버전 관리 시스템으로 마이그레이션
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  console.log('🔍 이미지 버전 마이그레이션 API 요청:', req.method, req.url);
  
  try {
    if (req.method === 'POST') {
      const { action } = req.body;
      
      if (action === 'analyze') {
        // 기존 파일들 분석
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

        // 파일 그룹핑 분석
        const fileGroups = {};
        const orphanedFiles = [];
        const versionPatterns = {
          '_thumb.webp': 'thumbnail',
          '_medium.': 'medium',
          'thumb_': 'thumbnail',
          'medium_': 'medium'
        };

        files.forEach(file => {
          const fileName = file.name;
          let baseName = fileName;
          let versionType = 'original';

          // 버전 패턴 확인
          for (const [pattern, type] of Object.entries(versionPatterns)) {
            if (fileName.includes(pattern)) {
              versionType = type;
              // 기본 파일명 추출
              if (pattern.startsWith('_')) {
                baseName = fileName.replace(pattern, '');
              } else {
                baseName = fileName.replace(pattern, '');
              }
              break;
            }
          }

          if (!fileGroups[baseName]) {
            fileGroups[baseName] = {
              baseName,
              versions: {},
              hasMetadata: false
            };
          }

          fileGroups[baseName].versions[versionType] = {
            fileName,
            url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/blog-images/${fileName}`,
            created_at: file.created_at,
            size: file.metadata?.size || 0
          };
        });

        // 메타데이터 존재 여부 확인
        const { data: metadata, error: metadataError } = await supabase
          .from('image_assets')
          .select('image_url');

        if (!metadataError && metadata) {
          const metadataUrls = new Set(metadata.map(m => m.image_url));
          
          Object.values(fileGroups).forEach(group => {
            const hasMetadata = Object.values(group.versions).some(version => 
              metadataUrls.has(version.url)
            );
            group.hasMetadata = hasMetadata;
          });
        }

        // 통계 계산
        const stats = {
          totalFiles: files.length,
          totalGroups: Object.keys(fileGroups).length,
          groupsWithMetadata: Object.values(fileGroups).filter(g => g.hasMetadata).length,
          groupsWithoutMetadata: Object.values(fileGroups).filter(g => !g.hasMetadata).length,
          multiVersionGroups: Object.values(fileGroups).filter(g => Object.keys(g.versions).length > 1).length,
          singleVersionGroups: Object.values(fileGroups).filter(g => Object.keys(g.versions).length === 1).length
        };

        console.log('✅ 파일 분석 완료:', stats);
        
        return res.status(200).json({
          stats,
          fileGroups: Object.values(fileGroups).slice(0, 50), // 처음 50개만 반환
          totalGroups: Object.keys(fileGroups).length
        });
        
      } else if (action === 'migrate') {
        // 마이그레이션 실행
        const { groupLimit = 10 } = req.body;
        
        // 분석 먼저 실행
        const analyzeResponse = await fetch(`${req.headers.origin}/api/admin/migrate-image-versions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'analyze' })
        });
        
        const analyzeData = await analyzeResponse.json();
        if (!analyzeResponse.ok) {
          return res.status(500).json({
            error: '분석에 실패했습니다.',
            details: analyzeData.error
          });
        }

        const fileGroups = analyzeData.fileGroups;
        const groupsToMigrate = fileGroups
          .filter(g => g.hasMetadata && Object.keys(g.versions).length > 1)
          .slice(0, groupLimit);

        let migratedCount = 0;
        let errorCount = 0;
        const errors = [];

        for (const group of groupsToMigrate) {
          try {
            // 메타데이터 찾기
            const { data: metadata, error: metadataError } = await supabase
              .from('image_assets')
              .select('*')
              .or(
                Object.values(group.versions)
                  .map(v => `image_url.eq.${v.url}`)
                  .join(',')
              )
              .limit(1)
              .single();

            if (metadataError || !metadata) {
              console.warn('⚠️ 메타데이터를 찾을 수 없음:', group.baseName);
              continue;
            }

            // 버전 정보 업데이트
            const { error: updateError } = await supabase
              .from('image_assets')
              .update({
                versions: JSON.stringify(group.versions),
                updated_at: new Date().toISOString()
              })
              .eq('id', metadata.id);

            if (updateError) {
              console.error('❌ 메타데이터 업데이트 에러:', updateError);
              errors.push(`${group.baseName}: ${updateError.message}`);
              errorCount++;
              continue;
            }

            migratedCount++;
            console.log('✅ 마이그레이션 완료:', group.baseName);
            
          } catch (error) {
            console.error('❌ 마이그레이션 오류:', error);
            errors.push(`${group.baseName}: ${error.message}`);
            errorCount++;
          }
        }

        return res.status(200).json({
          success: true,
          migrated: migratedCount,
          errors: errorCount,
          errorDetails: errors,
          totalProcessed: groupsToMigrate.length
        });
        
      } else {
        return res.status(400).json({
          error: '지원하지 않는 액션입니다. (analyze 또는 migrate)'
        });
      }
      
    } else {
      return res.status(405).json({
        error: '지원하지 않는 HTTP 메서드입니다.'
      });
    }
    
  } catch (error) {
    console.error('❌ 이미지 버전 마이그레이션 API 오류:', error);
    return res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      details: error.message
    });
  }
}
