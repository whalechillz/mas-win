import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { imageId, imagePath } = req.query;

    if (!imageId && !imagePath) {
      return res.status(400).json({ 
        error: 'imageId 또는 imagePath가 필요합니다.' 
      });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Supabase environment variables are not set.');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    console.log('🔍 이미지 상태 디버깅:', { imageId, imagePath });

    const result = {
      imageId,
      imagePath,
      metadata: null,
      storage: null,
      publicUrl: null
    };

    // 1. 메타데이터 조회
    if (imageId) {
      console.log('🔍 메타데이터 조회:', imageId);
      const { data: metadata, error: metadataError } = await supabase
        .from('image_metadata')
        .select('*')
        .eq('id', imageId)
        .single();

      result.metadata = {
        found: !!metadata,
        error: metadataError?.message,
        data: metadata
      };

      console.log('📊 메타데이터 결과:', result.metadata);
    }

    // 2. 스토리지 파일 확인
    const testPath = imagePath || (result.metadata?.data?.file_name);
    if (testPath) {
      console.log('🔍 스토리지 파일 확인:', testPath);
      
      // 파일 다운로드 시도
      const { data: downloadData, error: downloadError } = await supabase.storage
        .from('blog-images')
        .download(testPath);

      result.storage = {
        path: testPath,
        found: !!downloadData,
        error: downloadError?.message,
        size: downloadData?.size
      };

      // 공개 URL 생성
      const { data: urlData } = supabase.storage
        .from('blog-images')
        .getPublicUrl(testPath);

      result.publicUrl = {
        url: urlData.publicUrl,
        accessible: false
      };

      // URL 접근 가능 여부 확인
      try {
        const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
        result.publicUrl.accessible = response.ok;
        result.publicUrl.status = response.status;
      } catch (error) {
        result.publicUrl.error = error.message;
      }

      console.log('📊 스토리지 결과:', result.storage);
      console.log('📊 공개 URL 결과:', result.publicUrl);
    }

    return res.status(200).json({
      success: true,
      debug: result
    });

  } catch (error) {
    console.error('Debug Image Status API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      details: error.stack
    });
  }
}
