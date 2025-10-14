import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  try {
    console.log('🔍 Supabase 연결 테스트 시작');
    console.log('🔍 Supabase URL:', supabaseUrl ? '설정됨' : '없음');
    console.log('🔍 Service Role Key:', supabaseKey ? '설정됨' : '없음');

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        error: 'Supabase 환경 변수가 설정되지 않았습니다.',
        supabaseUrl: !!supabaseUrl,
        supabaseKey: !!supabaseKey
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Storage 버킷 목록 확인
    console.log('🔍 Storage 버킷 목록 조회 중...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ 버킷 목록 조회 실패:', bucketsError);
      return res.status(500).json({
        error: 'Storage 버킷 목록 조회 실패',
        details: bucketsError.message
      });
    }

    console.log('✅ 버킷 목록:', buckets.map(b => b.name));

    // 2. blog-images 버킷에서 파일 목록 조회
    console.log('🔍 blog-images 버킷에서 파일 목록 조회 중...');
    const { data: files, error: filesError } = await supabase.storage
      .from('blog-images')
      .list('', {
        limit: 10,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (filesError) {
      console.error('❌ 파일 목록 조회 실패:', filesError);
      return res.status(500).json({
        error: 'blog-images 버킷 파일 목록 조회 실패',
        details: filesError.message
      });
    }

    console.log('✅ 파일 목록:', files.map(f => ({ name: f.name, id: f.id, size: f.size })));

    return res.status(200).json({
      success: true,
      buckets: buckets.map(b => b.name),
      files: files.map(f => ({
        name: f.name,
        id: f.id,
        size: f.size,
        created_at: f.created_at
      })),
      totalFiles: files.length
    });

  } catch (error) {
    console.error('❌ 디버깅 API 오류:', error);
    return res.status(500).json({
      error: '디버깅 API 오류',
      details: error.message
    });
  }
}
