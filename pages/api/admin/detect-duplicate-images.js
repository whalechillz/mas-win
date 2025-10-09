import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 중복 이미지 감지 시작...');

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

    // 2. 파일명 패턴 분석
    const namePatterns = {};
    const similarNames = [];
    
    files.forEach(file => {
      const name = file.name;
      
      // generated- 패턴 분석
      if (name.startsWith('generated-')) {
        const parts = name.split('-');
        if (parts.length >= 4) {
          const basePattern = parts.slice(0, 4).join('-'); // generated-{timestamp}-fal-ai
          if (!namePatterns[basePattern]) {
            namePatterns[basePattern] = [];
          }
          namePatterns[basePattern].push(file);
        }
      }
      
      // massgoo- 패턴 분석
      if (name.startsWith('massgoo-')) {
        const parts = name.split('-');
        if (parts.length >= 3) {
          const basePattern = parts.slice(0, 3).join('-'); // massgoo-{category}-{item}
          if (!namePatterns[basePattern]) {
            namePatterns[basePattern] = [];
          }
          namePatterns[basePattern].push(file);
        }
      }
    });

    // 3. 중복 패턴 식별
    const duplicateGroups = [];
    Object.entries(namePatterns).forEach(([pattern, files]) => {
      if (files.length > 1) {
        duplicateGroups.push({
          pattern,
          count: files.length,
          files: files.map(f => ({
            name: f.name,
            size: f.metadata?.size,
            created_at: f.created_at,
            url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/blog-images/${f.name}`
          }))
        });
      }
    });

    // 4. 메타데이터와 비교
    const imageUrls = files.map(f => 
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/blog-images/${f.name}`
    );

    const { data: metadata, error: metadataError } = await supabase
      .from('image_metadata')
      .select('*')
      .in('image_url', imageUrls);

    if (metadataError) {
      console.error('❌ 메타데이터 조회 오류:', metadataError);
    }

    // 5. 결과 정리
    const result = {
      totalFiles: files.length,
      totalMetadata: metadata?.length || 0,
      duplicateGroups: duplicateGroups,
      orphanedFiles: files.filter(f => {
        const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/blog-images/${f.name}`;
        return !metadata?.some(m => m.image_url === url);
      }),
      orphanedMetadata: metadata?.filter(m => {
        const fileName = m.image_url.split('/').pop();
        return !files.some(f => f.name === fileName);
      }) || []
    };

    console.log(`✅ 중복 감지 완료: ${duplicateGroups.length}개 그룹, ${result.orphanedFiles.length}개 고아 파일`);

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ 중복 감지 오류:', error);
    res.status(500).json({ 
      error: '중복 감지 실패',
      details: error.message 
    });
  }
}
