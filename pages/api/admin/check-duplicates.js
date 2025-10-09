import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 중복 이미지 확인 시작...');

    // 1. 모든 이미지 파일 목록 가져오기
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

    console.log(`📁 총 ${files.length}개 파일 발견`);

    // 2. generated- 패턴 파일들 분석
    const generatedFiles = files.filter(file => file.name.startsWith('generated-'));
    console.log(`🎨 AI 생성 파일: ${generatedFiles.length}개`);

    // 3. 패턴별 그룹화
    const patternGroups = {};
    generatedFiles.forEach(file => {
      const parts = file.name.split('-');
      if (parts.length >= 4) {
        const basePattern = parts.slice(0, 4).join('-'); // generated-{timestamp}-fal-ai
        if (!patternGroups[basePattern]) {
          patternGroups[basePattern] = [];
        }
        patternGroups[basePattern].push(file);
      }
    });

    // 4. 중복 그룹 식별
    const duplicateGroups = Object.entries(patternGroups)
      .filter(([pattern, files]) => files.length > 1)
      .map(([pattern, files]) => ({
        pattern,
        count: files.length,
        files: files.map(f => ({
          name: f.name,
          size: f.metadata?.size,
          created_at: f.created_at
        }))
      }));

    // 5. 결과 정리
    const result = {
      totalFiles: files.length,
      generatedFiles: generatedFiles.length,
      duplicateGroups: duplicateGroups,
      duplicateCount: duplicateGroups.reduce((sum, group) => sum + group.count, 0),
      uniquePatterns: Object.keys(patternGroups).length
    };

    console.log(`✅ 중복 확인 완료: ${duplicateGroups.length}개 그룹, ${result.duplicateCount}개 중복 파일`);

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ 중복 확인 오류:', error);
    res.status(500).json({ 
      error: '중복 확인 실패',
      details: error.message 
    });
  }
}
