// 외부 이미지를 Supabase Storage에 저장하는 API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  console.log('🔍 외부 이미지 저장 API 요청:', req.method, req.url);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { imageUrl, fileName } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ error: '이미지 URL이 필요합니다' });
    }
    
    console.log('📥 외부 이미지 다운로드 중:', imageUrl);
    
    // 외부 이미지 다운로드
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`이미지 다운로드 실패: ${imageResponse.status}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageData = Buffer.from(imageBuffer);
    
    // 파일명 생성
    const timestamp = Date.now();
    const finalFileName = fileName || `external-image-${timestamp}.jpg`;
    
    console.log('💾 Supabase Storage에 업로드 중:', finalFileName);
    
    // Supabase Storage에 업로드
    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(finalFileName, imageData, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('❌ Supabase 업로드 에러:', error);
      throw new Error(`Supabase 업로드 실패: ${error.message}`);
    }
    
    // 공개 URL 생성
    const { data: publicUrlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(finalFileName);
    
    const supabaseUrl = publicUrlData.publicUrl;
    
    console.log('✅ 외부 이미지 저장 성공:', supabaseUrl);
    
    return res.status(200).json({
      success: true,
      supabaseUrl: supabaseUrl,
      fileName: finalFileName,
      originalUrl: imageUrl,
      message: '외부 이미지가 Supabase에 성공적으로 저장되었습니다'
    });
    
  } catch (error) {
    console.error('❌ 외부 이미지 저장 에러:', error);
    return res.status(500).json({
      error: '외부 이미지 저장에 실패했습니다',
      details: error.message
    });
  }
}
