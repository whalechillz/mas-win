import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🧹 고아 메타데이터 정리 시작...');

    // 1. image_assets 테이블에서 모든 레코드 조회
    const { data: allMetadata, error: metadataError } = await supabase
      .from('image_assets')
      .select('*');

    if (metadataError) {
      console.error('❌ 메타데이터 조회 에러:', metadataError);
      return res.status(500).json({
        error: '메타데이터를 조회할 수 없습니다.',
        details: metadataError.message
      });
    }

    console.log(`📊 총 ${allMetadata.length}개의 메타데이터 레코드 발견`);

    const orphanedRecords = [];
    const validRecords = [];

    // 2. 각 메타데이터에 대해 실제 파일 존재 여부 확인
    for (const metadata of allMetadata) {
      try {
        const imageUrl = metadata.image_url;
        if (!imageUrl) {
          console.log(`⚠️ URL이 없는 메타데이터: ${metadata.id}`);
          orphanedRecords.push(metadata);
          continue;
        }

        // Supabase Storage에서 파일 존재 여부 확인
        const fileName = imageUrl.split('/').pop();
        const { data: fileData, error: fileError } = await supabase.storage
          .from('blog-images')
          .list('', {
            search: fileName
          });

        if (fileError) {
          console.log(`⚠️ 파일 조회 에러 (${fileName}):`, fileError.message);
          orphanedRecords.push(metadata);
          continue;
        }

        // 파일이 존재하는지 확인
        const fileExists = fileData && fileData.length > 0 && 
          fileData.some(file => file.name === fileName);

        if (!fileExists) {
          console.log(`🗑️ 고아 메타데이터 발견: ${fileName}`);
          orphanedRecords.push(metadata);
        } else {
          validRecords.push(metadata);
        }

      } catch (error) {
        console.error(`❌ 파일 확인 중 에러 (${metadata.id}):`, error);
        orphanedRecords.push(metadata);
      }
    }

    console.log(`📈 결과: 유효한 레코드 ${validRecords.length}개, 고아 레코드 ${orphanedRecords.length}개`);

    // 3. 고아 레코드 삭제 (선택사항)
    let deletedCount = 0;
    if (orphanedRecords.length > 0) {
      const orphanedIds = orphanedRecords.map(record => record.id);
      
      const { error: deleteError } = await supabase
        .from('image_assets')
        .delete()
        .in('id', orphanedIds);

      if (deleteError) {
        console.error('❌ 고아 레코드 삭제 에러:', deleteError);
        return res.status(500).json({
          error: '고아 레코드를 삭제할 수 없습니다.',
          details: deleteError.message
        });
      }

      deletedCount = orphanedRecords.length;
      console.log(`✅ ${deletedCount}개의 고아 레코드 삭제 완료`);
    }

    return res.status(200).json({
      success: true,
      summary: {
        totalMetadata: allMetadata.length,
        validRecords: validRecords.length,
        orphanedRecords: orphanedRecords.length,
        deletedCount: deletedCount
      },
      orphanedFiles: orphanedRecords.map(record => ({
        id: record.id,
        fileName: record.file_path?.split('/').pop() || record.cdn_url?.split('/').pop(),
        imageUrl: record.cdn_url || record.image_url,
        createdAt: record.created_at
      }))
    });

  } catch (error) {
    console.error('❌ 고아 메타데이터 정리 중 에러:', error);
    return res.status(500).json({
      error: '고아 메타데이터 정리 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}
