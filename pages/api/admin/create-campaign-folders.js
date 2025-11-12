/**
 * Phase 8: 퍼널 이미지 Storage 폴더 구조 생성 API
 * 
 * originals/campaigns/YYYY-MM/ 폴더 구조 생성
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'blog-images';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 생성할 폴더 목록
    const folders = [
      'originals/campaigns/2025-05',
      'originals/campaigns/2025-06',
      'originals/campaigns/2025-07',
      'originals/campaigns/2025-08',
      'originals/campaigns/2025-09',
    ];

    const results = [];
    const errors = [];

    for (const folder of folders) {
      try {
        // Supabase Storage는 폴더를 직접 생성할 수 없으므로,
        // 빈 파일을 업로드하여 폴더를 생성합니다.
        const folderPath = `${folder}/.keep`;
        
        // 이미 존재하는지 확인
        const { data: existing } = await supabase.storage
          .from(bucketName)
          .list(folder, { limit: 1 });

        if (existing && existing.length > 0) {
          // 폴더가 이미 존재함
          results.push({
            folder,
            status: 'exists',
            message: '폴더가 이미 존재합니다.',
          });
          continue;
        }

        // 빈 파일 업로드로 폴더 생성 (1x1 투명 PNG 사용)
        const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2e+8kAAAAASUVORK5CYII=';
        const content = Buffer.from(pngBase64, 'base64');
        const markerPath = `${folder}/.keep.png`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(markerPath, content, {
            contentType: 'image/png',
            upsert: true,
          });

        if (uploadError) {
          // 폴더가 이미 존재하는 경우 무시
          if (uploadError.message.includes('already exists') || uploadError.statusCode === '409') {
            results.push({
              folder,
              status: 'exists',
              message: '폴더가 이미 존재합니다.',
            });
          } else {
            throw uploadError;
          }
        } else {
          results.push({
            folder,
            status: 'created',
            message: '폴더가 생성되었습니다.',
          });
        }
      } catch (error) {
        errors.push({
          folder,
          error: error.message,
        });
      }
    }

    // 생성된 폴더 목록 확인
    const { data: listData, error: listError } = await supabase.storage
      .from(bucketName)
      .list('originals/campaigns', { limit: 100 });

    const createdFolders = listData
      ? listData
          .filter((item) => item.name.match(/^\d{4}-\d{2}$/))
          .map((item) => `originals/campaigns/${item.name}`)
      : [];

    return res.status(200).json({
      success: true,
      message: '폴더 구조 생성 완료',
      results,
      errors: errors.length > 0 ? errors : undefined,
      createdFolders,
      summary: {
        total: folders.length,
        created: results.filter((r) => r.status === 'created').length,
        exists: results.filter((r) => r.status === 'exists').length,
        errors: errors.length,
      },
    });
  } catch (error) {
    console.error('폴더 생성 오류:', error);
    return res.status(500).json({
      error: '폴더 생성 중 오류가 발생했습니다.',
      message: error.message,
    });
  }
}








