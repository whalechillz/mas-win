// 중복 파일 디버깅 API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  console.log('🔍 중복 파일 디버깅 API 요청:', req.method, req.url);
  
  try {
    if (req.method === 'GET') {
      // 모든 파일 조회
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

      // 파일명별 그룹핑
      const nameGroups = {};
      const urlGroups = {};
      
      files.forEach(file => {
        const { data: urlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(file.name);
        
        // 파일명별 그룹핑
        if (!nameGroups[file.name]) {
          nameGroups[file.name] = [];
        }
        nameGroups[file.name].push({
          id: file.id,
          name: file.name,
          url: urlData.publicUrl,
          created_at: file.created_at,
          size: file.metadata?.size || 0
        });
        
        // URL별 그룹핑 (같은 URL을 가진 파일들)
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

      // 중복 파일 찾기
      const duplicateNames = Object.entries(nameGroups)
        .filter(([name, files]) => files.length > 1)
        .map(([name, files]) => ({ name, files, count: files.length }));

      const duplicateUrls = Object.entries(urlGroups)
        .filter(([url, files]) => files.length > 1)
        .map(([url, files]) => ({ url, files, count: files.length }));

      // 패턴별 분석
      const patterns = {};
      files.forEach(file => {
        const pattern = file.name.split('-')[0]; // 첫 번째 부분을 패턴으로 사용
        if (!patterns[pattern]) {
          patterns[pattern] = [];
        }
        patterns[pattern].push(file.name);
      });

      const duplicatePatterns = Object.entries(patterns)
        .filter(([pattern, names]) => names.length > 1)
        .map(([pattern, names]) => ({ pattern, names, count: names.length }));

      console.log('✅ 중복 파일 분석 완료');
      console.log('📊 파일명 중복:', duplicateNames.length, '개');
      console.log('📊 URL 중복:', duplicateUrls.length, '개');
      console.log('📊 패턴 중복:', duplicatePatterns.length, '개');

      return res.status(200).json({
        totalFiles: files.length,
        duplicateNames: duplicateNames.slice(0, 10), // 처음 10개만
        duplicateUrls: duplicateUrls.slice(0, 10), // 처음 10개만
        duplicatePatterns: duplicatePatterns.slice(0, 10), // 처음 10개만
        summary: {
          nameDuplicates: duplicateNames.length,
          urlDuplicates: duplicateUrls.length,
          patternDuplicates: duplicatePatterns.length
        }
      });
      
    } else {
      return res.status(405).json({
        error: '지원하지 않는 HTTP 메서드입니다.'
      });
    }
    
  } catch (error) {
    console.error('❌ 중복 파일 디버깅 API 오류:', error);
    return res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      details: error.message
    });
  }
}
