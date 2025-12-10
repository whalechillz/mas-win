// 생성된 이미지를 Supabase Storage에 저장하는 API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageUrl, fileName, blogPostId, folderPath } = req.body;

    if (!imageUrl || !fileName) {
      return res.status(400).json({ error: 'imageUrl and fileName are required' });
    }

    console.log('🖼️ 이미지 저장 시작:', { imageUrl, fileName, blogPostId, folderPath });

    // 1. 외부 이미지 URL에서 이미지 데이터 다운로드
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const imageData = Buffer.from(imageBuffer);

    // 2. 파일명 생성 (타임스탬프 포함)
    const timestamp = Date.now();
    const fileExtension = fileName.split('.').pop() || 'jpg';
    const finalFileName = `generated-${timestamp}-${fileName}`;

    // 3. Supabase Storage에 업로드 (폴더 경로 포함)
    const uploadPath = folderPath && folderPath.trim() !== '' 
      ? `${folderPath.trim()}/${finalFileName}` 
      : finalFileName;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(uploadPath, imageData, {
        contentType: `image/${fileExtension}`,
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Supabase 업로드 에러:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // 4. 공개 URL 생성 (폴더 경로 포함)
    const { data: publicUrlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(uploadPath);

    const publicUrl = publicUrlData.publicUrl;

    console.log('✅ 이미지 저장 완료:', { finalFileName, publicUrl });

    // 5. 데이터베이스에 이미지 정보 저장 (선택사항)
    if (blogPostId) {
      const { error: dbError } = await supabase
        .from('blog_images')
        .insert({
          blog_post_id: blogPostId,
          original_url: imageUrl,
          stored_url: publicUrl,
          file_name: finalFileName,
          created_at: new Date().toISOString()
        });

      if (dbError) {
        console.warn('⚠️ 데이터베이스 저장 실패 (이미지는 저장됨):', dbError);
      }
    }

    return res.status(200).json({
      success: true,
      originalUrl: imageUrl,
      storedUrl: publicUrl,
      fileName: finalFileName,
      message: '이미지가 성공적으로 저장되었습니다.'
    });

  } catch (error) {
    console.error('❌ 이미지 저장 에러:', error);
    return res.status(500).json({
      error: '이미지 저장에 실패했습니다.',
      details: error.message
    });
  }
}
