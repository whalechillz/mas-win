import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action = 'cleanup', dryRun = false } = req.body;
    
    console.log(`🔧 중복 메타데이터 정리 시작 (${dryRun ? '시뮬레이션' : '실제 실행'})...`);

    // 1. 모든 메타데이터 레코드 조회
    const { data: allMetadata, error: fetchError } = await supabase
      .from('image_assets')
      .select('id, cdn_url, title, created_at')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ 메타데이터 조회 오류:', fetchError);
      return res.status(500).json({ error: '메타데이터 조회 실패', details: fetchError.message });
    }

    // 2. cdn_url별로 그룹화
    const urlGroups = {};
    for (const record of allMetadata) {
      const url = record.cdn_url || record.image_url;
      if (!urlGroups[url]) {
        urlGroups[url] = [];
      }
      urlGroups[url].push(record);
    }

    // 3. 중복된 URL들 찾기
    const duplicateUrls = Object.entries(urlGroups)
      .filter(([url, records]) => records.length > 1)
      .map(([url, records]) => ({
        url,
        records: records.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) // 오래된 순으로 정렬
      }));

    console.log(`🔍 중복된 URL 그룹: ${duplicateUrls.length}개`);

    const cleanupResults = {
      totalGroups: duplicateUrls.length,
      totalRecordsToDelete: 0,
      deletedRecords: [],
      keptRecords: [],
      errors: []
    };

    // 4. 각 중복 그룹 처리
    for (const group of duplicateUrls) {
      const { url, records } = group;
      
      // 가장 오래된 레코드(첫 번째)는 유지, 나머지는 삭제 대상
      const keepRecord = records[0];
      const deleteRecords = records.slice(1);
      
      cleanupResults.totalRecordsToDelete += deleteRecords.length;
      cleanupResults.keptRecords.push({
        url,
        id: keepRecord.id,
        title: keepRecord.title,
        created_at: keepRecord.created_at
      });

      if (!dryRun) {
        // 실제 삭제 실행
        for (const record of deleteRecords) {
          try {
            const { error: deleteError } = await supabase
              .from('image_assets')
              .delete()
              .eq('id', record.id);

            if (deleteError) {
              console.error(`❌ 레코드 삭제 실패 (ID: ${record.id}):`, deleteError);
              cleanupResults.errors.push({
                id: record.id,
                url,
                error: deleteError.message
              });
            } else {
              console.log(`✅ 레코드 삭제 완료 (ID: ${record.id})`);
              cleanupResults.deletedRecords.push({
                id: record.id,
                url,
                title: record.title,
                created_at: record.created_at
              });
            }
          } catch (error) {
            console.error(`❌ 레코드 삭제 중 오류 (ID: ${record.id}):`, error);
            cleanupResults.errors.push({
              id: record.id,
              url,
              error: error.message
            });
          }
        }
      } else {
        // 시뮬레이션 모드
        cleanupResults.deletedRecords.push(...deleteRecords.map(record => ({
          id: record.id,
          url,
          title: record.title,
          created_at: record.created_at
        })));
      }
    }

    const result = {
      success: true,
      dryRun,
      summary: {
        totalGroups: cleanupResults.totalGroups,
        totalRecordsToDelete: cleanupResults.totalRecordsToDelete,
        actuallyDeleted: cleanupResults.deletedRecords.length,
        errors: cleanupResults.errors.length
      },
      details: {
        keptRecords: cleanupResults.keptRecords.slice(0, 10), // 상위 10개만 표시
        deletedRecords: cleanupResults.deletedRecords.slice(0, 10), // 상위 10개만 표시
        errors: cleanupResults.errors
      }
    };

    console.log('✅ 중복 정리 완료:', result.summary);

    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ 중복 정리 중 오류:', error);
    return res.status(500).json({ 
      error: '중복 정리 실패', 
      details: error.message 
    });
  }
}
