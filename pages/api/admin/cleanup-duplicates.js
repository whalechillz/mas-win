import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, duplicateGroups } = req.body;
    
    if (action === 'analyze') {
      // 1. 중복 분석
      console.log('🔍 중복 이미지 분석 시작...');

      const { data: files, error: filesError } = await supabase.storage
        .from('blog-images')
        .list('', {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (filesError) {
        console.error('❌ 파일 목록 조회 오류:', filesError);
        return res.status(500).json({ error: '파일 목록 조회 실패' });
      }

      // generated- 패턴 파일들 분석
      const generatedFiles = files.filter(file => file.name.startsWith('generated-'));
      
      // 패턴별 그룹화
      const patternGroups = {};
      generatedFiles.forEach(file => {
        const parts = file.name.split('-');
        if (parts.length >= 4) {
          const basePattern = parts.slice(0, 4).join('-');
          if (!patternGroups[basePattern]) {
            patternGroups[basePattern] = [];
          }
          patternGroups[basePattern].push(file);
        }
      });

      // 중복 그룹 식별
      const duplicateGroups = Object.entries(patternGroups)
        .filter(([pattern, files]) => files.length > 1)
        .map(([pattern, files]) => ({
          pattern,
          count: files.length,
          files: files
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) // 오래된 것부터
            .map((f, index) => ({
              name: f.name,
              size: f.metadata?.size,
              created_at: f.created_at,
              url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/blog-images/${f.name}`,
              keep: index === 0 // 첫 번째(가장 오래된) 파일만 유지
            }))
        }));

      return res.status(200).json({
        success: true,
        data: {
          totalFiles: files.length,
          generatedFiles: generatedFiles.length,
          duplicateGroups: duplicateGroups,
          totalDuplicates: duplicateGroups.reduce((sum, group) => sum + group.count, 0),
          filesToDelete: duplicateGroups.reduce((sum, group) => sum + group.count - 1, 0)
        }
      });

    } else if (action === 'cleanup') {
      // 2. 중복 정리
      console.log('🗑️ 중복 이미지 정리 시작...');

      if (!duplicateGroups || !Array.isArray(duplicateGroups)) {
        return res.status(400).json({ error: '정리할 중복 그룹이 필요합니다' });
      }

      const results = {
        deleted: 0,
        errors: 0,
        details: []
      };

      // 각 중복 그룹에서 첫 번째 파일을 제외하고 나머지 삭제
      for (const group of duplicateGroups) {
        const filesToDelete = group.files.filter(file => !file.keep);
        
        for (const file of filesToDelete) {
          try {
            // 1. 스토리지에서 파일 삭제
            const { error: deleteError } = await supabase.storage
              .from('blog-images')
              .remove([file.name]);

            if (deleteError) {
              console.error(`❌ 파일 삭제 실패: ${file.name}`, deleteError);
              results.errors++;
              results.details.push({
                file: file.name,
                action: 'delete',
                status: 'error',
                error: deleteError.message
              });
            } else {
              console.log(`✅ 파일 삭제 성공: ${file.name}`);
              results.deleted++;
              results.details.push({
                file: file.name,
                action: 'delete',
                status: 'success'
              });
            }

            // 2. 메타데이터에서도 삭제
            const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/blog-images/${file.name}`;
            const { error: metadataError } = await supabase
              .from('image_metadata')
              .delete()
              .eq('image_url', imageUrl);

            if (metadataError) {
              console.error(`❌ 메타데이터 삭제 실패: ${file.name}`, metadataError);
            } else {
              console.log(`✅ 메타데이터 삭제 성공: ${file.name}`);
            }

          } catch (error) {
            console.error(`❌ 처리 중 오류: ${file.name}`, error);
            results.errors++;
            results.details.push({
              file: file.name,
              action: 'delete',
              status: 'error',
              error: error.message
            });
          }
        }
      }

      console.log(`✅ 중복 정리 완료: ${results.deleted}개 삭제, ${results.errors}개 오류`);

      return res.status(200).json({
        success: true,
        data: results
      });

    } else {
      return res.status(400).json({ error: '잘못된 액션입니다' });
    }

  } catch (error) {
    console.error('❌ 중복 정리 오류:', error);
    res.status(500).json({ 
      error: '중복 정리 실패',
      details: error.message 
    });
  }
}
