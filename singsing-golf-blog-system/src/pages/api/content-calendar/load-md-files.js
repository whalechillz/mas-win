// MD 파일 로드 API
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { data, error } = await supabase
      .from('md_reference_files')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('MD 파일 로드 오류:', error);
      return res.status(500).json({
        success: false,
        message: 'MD 파일 로드 실패',
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: `${data.length}개의 MD 파일을 로드했습니다.`,
      files: data
    });

  } catch (error) {
    console.error('MD 파일 로드 처리 오류:', error);
    res.status(500).json({
      success: false,
      message: 'MD 파일 로드 실패',
      error: error.message
    });
  }
}
