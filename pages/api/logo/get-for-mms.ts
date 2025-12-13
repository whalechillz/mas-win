/**
 * MMS 발송용 로고 가져오기 API
 * - 갤러리에서 로고 선택
 * - 색상 변경 지원 (SVG → PNG 변환)
 * - Solapi imageId 반환
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { createSolapiSignature } from '../../../utils/solapiSignature.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || '';
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || '';
const SOLAPI_STORAGE_URL = 'https://api.solapi.com/storage/v1/files';

// Solapi에 이미지 업로드
async function uploadToSolapi(imageBuffer: Buffer, filename: string): Promise<string | null> {
  try {
    const base64Data = imageBuffer.toString('base64');
    const authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);

    const response = await fetch(SOLAPI_STORAGE_URL, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file: base64Data,
        name: filename,
        type: 'MMS'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Solapi 업로드 실패');
    }

    const result = await response.json();
    const imageId = result.fileId || result.id || null;
    
    console.log('📦 Solapi 업로드 응답:', {
      status: response.status,
      fileId: result.fileId,
      id: result.id,
      finalImageId: imageId,
      fullResponse: result
    });
    
    return imageId;
  } catch (error) {
    console.error('Solapi 업로드 오류:', error);
    return null;
  }
}

// SVG 색상 변경 (SVG → PNG 변환)
async function changeSvgColor(svgBuffer: Buffer, color: string): Promise<Buffer> {
  try {
    let svgContent = svgBuffer.toString('utf-8');
    
    // SVG의 fill 속성을 색상으로 변경
    // 기본적으로 fill="currentColor" 또는 fill 속성이 없는 경우 처리
    if (svgContent.includes('fill=')) {
      // 기존 fill 속성 교체
      svgContent = svgContent.replace(/fill="[^"]*"/g, `fill="${color}"`);
      svgContent = svgContent.replace(/fill='[^']*'/g, `fill="${color}"`);
    } else {
      // fill 속성이 없으면 추가 (루트 요소에)
      svgContent = svgContent.replace(/<svg([^>]*)>/, `<svg$1 fill="${color}">`);
    }

    // SVG를 PNG로 변환
    const pngBuffer = await sharp(Buffer.from(svgContent))
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer();

    return pngBuffer;
  } catch (error) {
    console.error('SVG 색상 변경 오류:', error);
    // 실패 시 원본 반환
    return svgBuffer;
  }
}

// 이미지 색상 변경 (PNG/JPG)
async function changeImageColor(imageBuffer: Buffer, color: string): Promise<Buffer> {
  try {
    // 이미지를 색상으로 변경 (그레이스케일 후 색상 적용)
    const colored = await sharp(imageBuffer)
      .greyscale()
      .tint({ r: parseInt(color.slice(1, 3), 16), g: parseInt(color.slice(3, 5), 16), b: parseInt(color.slice(5, 7), 16) })
      .png()
      .toBuffer();

    return colored;
  } catch (error) {
    console.error('이미지 색상 변경 오류:', error);
    return imageBuffer;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { logoId, color, size = 'medium' } = req.body;

    if (!logoId) {
      return res.status(400).json({ error: 'logoId는 필수입니다.' });
    }

    // 로고 메타데이터 조회
    const { data: logoMetadata, error: fetchError } = await supabase
      .from('image_metadata')
      .select('*')
      .eq('id', logoId)
      .eq('is_logo', true)
      .single();

    if (fetchError || !logoMetadata) {
      return res.status(404).json({ error: '로고를 찾을 수 없습니다.' });
    }

    // 이미지 다운로드
    const imageResponse = await fetch(logoMetadata.image_url);
    if (!imageResponse.ok) {
      throw new Error(`이미지 다운로드 실패: ${imageResponse.status}`);
    }

    let imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // 색상 변경 (색상이 제공된 경우)
    if (color && color !== '#000000') {
      const isSvg = logoMetadata.mime_type === 'image/svg+xml' || logoMetadata.image_url.endsWith('.svg');
      
      if (isSvg) {
        imageBuffer = await changeSvgColor(imageBuffer, color);
      } else {
        imageBuffer = await changeImageColor(imageBuffer, color);
      }
    }

    // 크기 조정
    const sizeMap = {
      small: { width: 400, height: 400 }, // 정사각형 작은 크기
      'small-landscape': { width: 600, height: 200 }, // 가로형 작은 크기 (예약 문자용)
      medium: { width: 800, height: 800 }, // 정사각형 중간 크기
      large: { width: 1200, height: 1200 } // 정사각형 큰 크기
    };
    
    const targetSize = sizeMap[size as keyof typeof sizeMap] || sizeMap.medium;

    imageBuffer = await sharp(imageBuffer)
      .resize(targetSize.width, targetSize.height, { 
        fit: 'inside', 
        withoutEnlargement: true 
      })
      .png()
      .toBuffer();

    // Solapi에 업로드
    const filename = `logo-${logoId}-${Date.now()}.png`;
    const solapiImageId = await uploadToSolapi(imageBuffer, filename);

    if (!solapiImageId) {
      return res.status(500).json({ error: 'Solapi 업로드 실패' });
    }

    return res.status(200).json({
      success: true,
      imageId: solapiImageId,
      logoMetadata: {
        id: logoMetadata.id,
        brand: logoMetadata.logo_brand,
        type: logoMetadata.logo_type,
        color: logoMetadata.logo_color_variant
      }
    });
  } catch (error: any) {
    console.error('로고 가져오기 오류:', error);
    return res.status(500).json({
      error: error.message || '로고 가져오기 중 오류가 발생했습니다.'
    });
  }
}

