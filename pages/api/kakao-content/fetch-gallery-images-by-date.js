/**
 * 특정 날짜의 갤러리 이미지 조회 API
 * 날짜, 계정, 타입(background/profile/feed)에 맞는 이미지를 반환
 */

import { createServerSupabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { date, account, type } = req.query;

    if (!date || !account || !type) {
      return res.status(400).json({
        success: false,
        message: 'date, account, type 파라미터가 필요합니다'
      });
    }

    const supabase = createServerSupabase();
    
    // 폴더 경로 구성
    // account1 -> account1, account2 -> account2
    const accountFolder = account === 'account1' ? 'account1' : 'account2';
    const folderPath = `originals/daily-branding/kakao/${date}/${accountFolder}/${type}`;

    // Supabase Storage에서 이미지 목록 조회
    const { data: files, error } = await supabase.storage
      .from('blog-images')
      .list(folderPath, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error('이미지 목록 조회 오류:', error);
      return res.status(500).json({
        success: false,
        message: '이미지 목록 조회 실패',
        error: error.message
      });
    }

    // 이미지 파일만 필터링
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const imageFiles = (files || []).filter(file => {
      const ext = file.name.toLowerCase();
      return imageExtensions.some(extName => ext.endsWith(extName)) && 
             !file.name.toLowerCase().includes('.keep');
    });

    // Public URL 생성
    const imageUrls = imageFiles.map(file => {
      const fullPath = `${folderPath}/${file.name}`;
      const { data: urlData } = supabase.storage
        .from('blog-images')
        .getPublicUrl(fullPath);
      return {
        url: urlData.publicUrl,
        name: file.name,
        createdAt: file.created_at
      };
    });

    return res.status(200).json({
      success: true,
      images: imageUrls,
      folderPath,
      count: imageUrls.length
    });

  } catch (error) {
    console.error('갤러리 이미지 조회 오류:', error);
    return res.status(500).json({
      success: false,
      message: '이미지 조회 실패',
      error: error.message
    });
  }
}

