import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Storage 파일 중복 진단 시작...');

    // 1. 모든 Storage 파일 조회
    let allFiles = [];
    let offset = 0;
    const batchSize = 1000;
    
    while (true) {
      const { data: batchFiles, error: batchError } = await supabase.storage
        .from('blog-images')
        .list('', {
          limit: batchSize,
          offset: offset,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (batchError) {
        console.error('❌ 배치 조회 에러:', batchError);
        return res.status(500).json({ error: 'Storage 조회 실패', details: batchError.message });
      }

      if (!batchFiles || batchFiles.length === 0) {
        break;
      }

      allFiles = allFiles.concat(batchFiles);
      offset += batchSize;

      if (batchFiles.length < batchSize) {
        break;
      }
    }
    
    console.log(`📊 총 Storage 파일: ${allFiles.length}개`);

    // 2. 파일명별 그룹화 (정확한 중복)
    const exactNameGroups = {};
    allFiles.forEach(file => {
      const name = file.name;
      if (!exactNameGroups[name]) {
        exactNameGroups[name] = [];
      }
      exactNameGroups[name].push(file);
    });
    
    const exactDuplicates = Object.entries(exactNameGroups)
      .filter(([name, files]) => files.length > 1)
      .map(([name, files]) => ({ name, count: files.length, files }));

    // 3. 유사한 파일명 패턴 찾기 (시각적 중복 가능성)
    const patternGroups = {};
    
    allFiles.forEach(file => {
      const name = file.name;
      // 숫자와 확장자 제거한 기본 패턴 추출
      const basePattern = name
        .replace(/[-_]?\d+\.(jpg|jpeg|png|webp|gif)$/i, '') // 확장자 앞 숫자 제거
        .replace(/[-_]?\d+$/, '') // 끝에 숫자 제거
        .replace(/\.(jpg|jpeg|png|webp|gif)$/i, ''); // 확장자 제거
      
      if (!patternGroups[basePattern]) {
        patternGroups[basePattern] = [];
      }
      patternGroups[basePattern].push(file);
    });
    
    const similarPatterns = Object.entries(patternGroups)
      .filter(([pattern, files]) => files.length > 1)
      .map(([pattern, files]) => ({ pattern, count: files.length, files }))
      .sort((a, b) => b.count - a.count);

    // 4. 메타데이터 테이블과 비교
    const { data: metadata, error: metaError } = await supabase
        .from('image_assets')
      .select('id, image_url, title, created_at')
      .order('created_at', { ascending: false });
    
    if (metaError) {
      console.error('❌ 메타데이터 조회 오류:', metaError);
    }

    // 5. Storage 파일과 메타데이터 매칭
    const storageUrls = allFiles.map(file => {
      const { data: urlData } = supabase.storage
        .from('blog-images')
        .getPublicUrl(file.name);
      return urlData.publicUrl;
    });

    const metadataUrls = metadata ? metadata.map(record => record.image_url) : [];
    const orphanedStorage = storageUrls.filter(url => !metadataUrls.includes(url));
    const orphanedMetadata = metadataUrls.filter(url => !storageUrls.includes(url));

    const result = {
      summary: {
        totalStorageFiles: allFiles.length,
        totalMetadataRecords: metadata ? metadata.length : 0,
        exactDuplicateNames: exactDuplicates.length,
        similarPatterns: similarPatterns.length,
        orphanedStorageFiles: orphanedStorage.length,
        orphanedMetadataRecords: orphanedMetadata.length
      },
      exactDuplicates: exactDuplicates.slice(0, 10),
      topSimilarPatterns: similarPatterns.slice(0, 10),
      orphanedStorage: orphanedStorage.slice(0, 10),
      orphanedMetadata: orphanedMetadata.slice(0, 10)
    };

    console.log('✅ Storage 중복 진단 완료:', result.summary);

    return res.status(200).json({
      success: true,
      diagnosis: result
    });

  } catch (error) {
    console.error('❌ Storage 중복 진단 중 오류:', error);
    return res.status(500).json({ 
      error: 'Storage 중복 진단 실패', 
      details: error.message 
    });
  }
}
