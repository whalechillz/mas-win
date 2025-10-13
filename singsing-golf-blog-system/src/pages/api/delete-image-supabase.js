import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: '이미지 URL이 필요합니다.' });
    }

    // URL에서 파일 경로 추출
    // 예: https://xxx.supabase.co/storage/v1/object/public/blog-images/filename.jpg
    // -> blog-images/filename.jpg
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `blog-images/${fileName}`;

    console.log('🗑️ 이미지 삭제 시도:', filePath);

    // Supabase Storage에서 파일 삭제
    const { data, error } = await supabase.storage
      .from('blog-images')
      .remove([fileName]);

    if (error) {
      console.error('❌ 이미지 삭제 오류:', error);
      return res.status(500).json({ 
        error: '이미지 삭제에 실패했습니다.',
        details: error.message 
      });
    }

    console.log('✅ 이미지 삭제 성공:', fileName);

    res.status(200).json({ 
      success: true, 
      message: '이미지가 성공적으로 삭제되었습니다.',
      deletedFile: fileName
    });

  } catch (error) {
    console.error('이미지 삭제 오류:', error);
    res.status(500).json({ 
      error: '이미지 삭제에 실패했습니다.',
      details: error.message 
    });
  }
}
