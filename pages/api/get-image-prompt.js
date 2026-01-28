import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: 'Image URL is required' });
    }

    console.log('🔍 이미지 프롬프트 조회 시작:', imageUrl);
    console.log('🔧 Supabase 설정 확인:', {
      url: supabaseUrl ? '설정됨' : '누락',
      key: supabaseServiceKey ? '설정됨' : '누락'
    });

    // image_assets 테이블에서 해당 이미지의 프롬프트 조회
    // ⚠️ image_assets에는 prompt 필드가 없을 수 있음
    const { data: metadata, error } = await supabase
      .from('image_assets')
      .select('prompt, ai_text_extracted')
      .eq('cdn_url', imageUrl)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116은 "no rows found" 에러
      console.error('❌ 프롬프트 조회 오류:', error);
      return res.status(500).json({ 
        message: '프롬프트 조회 중 오류가 발생했습니다.',
        error: error.message 
      });
    }

    // prompt 필드가 없으면 ai_text_extracted 사용
    const promptText = metadata?.prompt || metadata?.ai_text_extracted || '';
    
    if (promptText) {
      console.log('✅ 기존 프롬프트 발견:', promptText.substring(0, 100) + '...');
      return res.status(200).json({
        success: true,
        prompt: promptText,
        source: 'database'
      });
    } else {
      console.log('ℹ️ 기존 프롬프트 없음, AI 생성 필요');
      return res.status(200).json({
        success: true,
        prompt: '',
        source: 'none'
      });
    }

  } catch (error) {
    console.error('❌ 이미지 프롬프트 조회 에러:', error);
    res.status(500).json({
      error: '이미지 프롬프트 조회 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}
