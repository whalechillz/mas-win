import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 중복 메타데이터 진단 시작...');

    // 1. 모든 메타데이터 레코드 조회
    const { data: allMetadata, error: fetchError } = await supabase
        .from('image_assets')
      .select('id, image_url, title, created_at')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ 메타데이터 조회 오류:', fetchError);
      return res.status(500).json({ error: '메타데이터 조회 실패', details: fetchError.message });
    }

    console.log(`📊 총 메타데이터 레코드: ${allMetadata.length}개`);

    // 2. image_url별로 그룹화하여 중복 찾기
    const urlGroups = {};
    for (const record of allMetadata) {
      const url = record.image_url;
      if (!urlGroups[url]) {
        urlGroups[url] = [];
      }
      urlGroups[url].push(record);
    }

    // 3. 중복된 URL들 찾기 (2개 이상의 레코드를 가진 URL)
    const duplicateUrls = Object.entries(urlGroups)
      .filter(([url, records]) => records.length > 1)
      .map(([url, records]) => ({
        url,
        count: records.length,
        records: records.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) // 오래된 순으로 정렬
      }));

    console.log(`🔍 중복된 URL 그룹: ${duplicateUrls.length}개`);

    // 4. 통계 계산
    const totalDuplicates = duplicateUrls.reduce((sum, group) => sum + group.count, 0);
    const totalUniqueUrls = Object.keys(urlGroups).length;
    const totalRecords = allMetadata.length;
    const duplicateRecords = totalDuplicates - duplicateUrls.length; // 중복으로 인한 추가 레코드 수

    // 5. 상세 정보 생성
    const duplicateDetails = duplicateUrls.slice(0, 10).map(group => ({
      url: group.url,
      count: group.count,
      records: group.records.map(record => ({
        id: record.id,
        title: record.title,
        created_at: record.created_at
      }))
    }));

    const diagnosis = {
      summary: {
        totalRecords,
        totalUniqueUrls,
        duplicateGroups: duplicateUrls.length,
        duplicateRecords,
        duplicatePercentage: ((duplicateRecords / totalRecords) * 100).toFixed(2)
      },
      topDuplicates: duplicateDetails,
      allDuplicateUrls: duplicateUrls.map(group => ({
        url: group.url,
        count: group.count
      }))
    };

    console.log('✅ 중복 진단 완료:', diagnosis.summary);

    return res.status(200).json({
      success: true,
      diagnosis
    });

  } catch (error) {
    console.error('❌ 중복 진단 중 오류:', error);
    return res.status(500).json({ 
      error: '중복 진단 실패', 
      details: error.message 
    });
  }
}
