/**
 * Phase 7-3: 홈페이지/MUZIIK 이미지 갤러리 폴더 구조 생성
 * 
 * 생성할 폴더:
 * - originals/branding/massgoo/hero/ (MASSGOO 브랜드 히어로 이미지)
 * - originals/website/homepage/hero/ (홈페이지 히어로 이미지 - 대안)
 * - originals/branding/muziik/ (MUZIIK 브랜드 이미지)
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = 'blog-images';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase environment variables are not set.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 1x1 투명 PNG (Base64)
const transparentPNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2e+8kAAAAASUVORK5CYII=';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Phase 7-3에서 생성할 폴더 목록
    const folders = [
      'originals/branding/massgoo/hero',
      'originals/website/homepage/hero',
      'originals/branding/muziik',
    ];

    const results = [];
    const errors = [];

    for (const folder of folders) {
      try {
        // 폴더 경로를 슬래시로 분리하여 각 레벨 확인
        const pathParts = folder.split('/');
        let currentPath = '';

        // 각 경로 레벨을 순차적으로 확인하고 생성
        for (let i = 0; i < pathParts.length; i++) {
          const part = pathParts[i];
          currentPath = currentPath ? `${currentPath}/${part}` : part;

          // 현재 경로의 파일 목록 확인
          const { data: files, error: listError } = await supabase.storage
            .from(bucketName)
            .list(currentPath, { limit: 1 });

          if (listError) {
            // 폴더가 없으면 생성 시도
            const markerPath = `${currentPath}/.keep.png`;
            const content = Buffer.from(transparentPNG, 'base64');

            const { error: uploadError } = await supabase.storage
              .from(bucketName)
              .upload(markerPath, content, {
                contentType: 'image/png',
                upsert: true,
              });

            if (uploadError) {
              // 이미 존재하는 경우 무시
              if (uploadError.message.includes('already exists') || uploadError.statusCode === '409') {
                console.log(`✅ 폴더 이미 존재: ${currentPath}`);
              } else {
                throw uploadError;
              }
            } else {
              console.log(`✅ 폴더 생성 완료: ${currentPath}`);
            }
          } else {
            // 폴더가 이미 존재함
            console.log(`✅ 폴더 이미 존재: ${currentPath}`);
          }
        }

        // 최종 폴더에 .keep.png 마커 파일 확인/생성
        const markerPath = `${folder}/.keep.png`;
        const { data: markerExists } = await supabase.storage
          .from(bucketName)
          .list(folder, {
            limit: 100,
          });

        const hasMarker = markerExists?.some(file => file.name === '.keep.png');

        if (!hasMarker) {
          const content = Buffer.from(transparentPNG, 'base64');
          const { error: markerError } = await supabase.storage
            .from(bucketName)
            .upload(markerPath, content, {
              contentType: 'image/png',
              upsert: true,
            });

          if (markerError && !markerError.message.includes('already exists')) {
            throw markerError;
          }
        }

        results.push({
          folder,
          status: 'created',
          message: '폴더가 생성되었습니다.',
        });
      } catch (error) {
        console.error(`❌ 폴더 생성 실패 (${folder}):`, error);
        errors.push({
          folder,
          error: error.message,
        });
      }
    }

    // 생성된 폴더 목록 확인
    const verificationResults = [];
    for (const folder of folders) {
      try {
        const { data: files, error: listError } = await supabase.storage
          .from(bucketName)
          .list(folder, { limit: 1 });

        if (listError) {
          verificationResults.push({
            folder,
            exists: false,
            error: listError.message,
          });
        } else {
          verificationResults.push({
            folder,
            exists: true,
            fileCount: files?.length || 0,
          });
        }
      } catch (error) {
        verificationResults.push({
          folder,
          exists: false,
          error: error.message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Phase 7-3 폴더 구조 생성 완료',
      results,
      errors: errors.length > 0 ? errors : undefined,
      verification: verificationResults,
    });
  } catch (error) {
    console.error('Create Phase 7-3 Folders API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

