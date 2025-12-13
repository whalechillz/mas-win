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
import { compressImageForSolapi } from '../../../lib/server/compressImageForSolapi.js';

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
    const imageSize = imageBuffer.length;
    console.log(`📤 Solapi 업로드 시작: ${filename}, 크기: ${(imageSize / 1024).toFixed(2)}KB`);
    
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

    // ⭐ 수정: 응답 본문을 안전하게 읽기
    let responseText = '';
    try {
      responseText = await response.text();
    } catch (textError: any) {
      console.error('❌ Solapi 응답 body 읽기 실패:', textError.message);
    }

    if (!response.ok) {
      let errorMessage = 'Solapi 업로드 실패';
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
        console.error('❌ Solapi 업로드 실패 상세:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          imageSize: `${(imageSize / 1024).toFixed(2)}KB`,
          filename
        });
      } catch {
        errorMessage = responseText || `HTTP ${response.status} ${response.statusText}`;
        console.error('❌ Solapi 업로드 실패 (텍스트):', {
          status: response.status,
          statusText: response.statusText,
          responseText: responseText.substring(0, 500), // 처음 500자만
          imageSize: `${(imageSize / 1024).toFixed(2)}KB`,
          filename
        });
      }
      throw new Error(errorMessage);
    }

    const result = JSON.parse(responseText);
    const imageId = result.fileId || result.id || null;
    
    console.log('📦 Solapi 업로드 성공:', {
      status: response.status,
      fileId: result.fileId,
      id: result.id,
      finalImageId: imageId,
      imageSize: `${(imageSize / 1024).toFixed(2)}KB`,
      filename
    });
    
    return imageId;
  } catch (error: any) {
    console.error('❌ Solapi 업로드 오류 상세:', {
      error: error.message,
      stack: error.stack,
      filename,
      imageSize: imageBuffer ? `${(imageBuffer.length / 1024).toFixed(2)}KB` : 'unknown'
    });
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
  // ⭐ 추가: 메서드 디버깅 로깅
  console.log('📡 get-for-mms API 호출:', {
    method: req.method,
    url: req.url,
    headers: {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent']?.substring(0, 100)
    },
    bodyKeys: req.body ? Object.keys(req.body) : [],
    body: req.body
  });

  if (req.method !== 'POST') {
    console.error('❌ 잘못된 메서드:', {
      received: req.method,
      expected: 'POST',
      url: req.url
    });
    return res.status(405).json({ 
      error: 'Method not allowed',
      receivedMethod: req.method,
      allowedMethod: 'POST'
    });
  }

  try {
    const { logoId, color, size = 'medium' } = req.body;

    if (!logoId) {
      return res.status(400).json({ error: 'logoId는 필수입니다.' });
    }

    // ⭐ 추가: 캐시된 솔라피 이미지 ID 확인 (booking_settings에서)
    const cacheKey = `${logoId}-${color || '#000000'}-${size}`;
    const { data: cachedSettings } = await supabase
      .from('booking_settings')
      .select('booking_logo_solapi_image_id, booking_logo_id, mms_logo_color, booking_logo_size')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single();

    // 캐시된 이미지 ID가 있고, 설정이 동일한 경우 재사용
    if (cachedSettings?.booking_logo_solapi_image_id && 
        cachedSettings.booking_logo_id === logoId &&
        cachedSettings.mms_logo_color === (color || '#000000') &&
        cachedSettings.booking_logo_size === size) {
      console.log('✅ 캐시된 솔라피 이미지 ID 재사용:', cachedSettings.booking_logo_solapi_image_id);
      return res.status(200).json({
        success: true,
        imageId: cachedSettings.booking_logo_solapi_image_id,
        cached: true,
        logoMetadata: {
          id: logoId,
          brand: null,
          type: null,
          color: null
        }
      });
    }

    // 로고 메타데이터 조회
    console.log('🔍 로고 메타데이터 조회:', { logoId });
    
    const { data: logoMetadata, error: fetchError } = await supabase
      .from('image_metadata')
      .select('*')
      .eq('id', logoId)
      .eq('is_logo', true)
      .single();

    if (fetchError || !logoMetadata) {
      console.error('❌ 로고 메타데이터 조회 실패:', {
        logoId: logoId,
        error: fetchError,
        found: !!logoMetadata
      });
      return res.status(404).json({ 
        error: '로고를 찾을 수 없습니다.',
        logoId: logoId,
        details: fetchError ? fetchError.message : '메타데이터가 없습니다.'
      });
    }
    
    console.log('✅ 로고 메타데이터 조회 성공:', {
      id: logoMetadata.id,
      imageUrl: logoMetadata.image_url,
      brand: logoMetadata.logo_brand,
      type: logoMetadata.logo_type
    });

    // 이미지 다운로드
    console.log('📥 이미지 다운로드 시작:', {
      imageUrl: logoMetadata.image_url,
      logoId: logoId
    });
    
    const imageResponse = await fetch(logoMetadata.image_url);
    
    if (!imageResponse.ok) {
      let errorText = '';
      try {
        errorText = await imageResponse.text();
      } catch {
        errorText = '응답 본문 읽기 실패';
      }
      
      console.error('❌ 이미지 다운로드 실패:', {
        status: imageResponse.status,
        statusText: imageResponse.statusText,
        imageUrl: logoMetadata.image_url,
        errorText: errorText.substring(0, 200), // 처음 200자만
        logoId: logoId
      });
      
      throw new Error(`이미지 다운로드 실패: ${imageResponse.status} ${imageResponse.statusText}`);
    }

    let imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    console.log(`✅ 이미지 다운로드 완료: ${(imageBuffer.length / 1024).toFixed(2)}KB`);

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

    // ⭐ 수정: 200KB 제한을 위한 압축 처리 (작은 이미지는 스킵)
    const MAX_SOLAPI_SIZE = 200 * 1024; // 200KB
    const SMALL_IMAGE_THRESHOLD = 50 * 1024; // 50KB
    const currentSize = imageBuffer.length;
    console.log(`📊 로고 이미지 크기: ${(currentSize / 1024).toFixed(2)}KB`);
    
    let finalImageBuffer = imageBuffer;
    let fileExtension = 'png';
    
    // ⭐ 최적화: 50KB 이하는 압축 없이 그대로 사용
    if (currentSize <= SMALL_IMAGE_THRESHOLD) {
      console.log(`✅ 로고 이미지가 작습니다 (${(currentSize / 1024).toFixed(2)}KB). 압축 불필요.`);
    } else if (currentSize > MAX_SOLAPI_SIZE) {
      // 200KB 초과: 압축 필요
      console.log('🔄 로고 이미지 압축 시작 (200KB 초과)...');
      try {
        // PNG를 JPEG로 변환하여 압축 (더 나은 압축률)
        const jpegBuffer = await sharp(imageBuffer)
          .jpeg({ quality: 85, progressive: true, mozjpeg: true })
          .toBuffer();
        
        console.log(`📊 JPEG 변환 후 크기: ${(jpegBuffer.length / 1024).toFixed(2)}KB`);
        
        // 여전히 200KB 초과하면 compressImageForSolapi 사용
        if (jpegBuffer.length > MAX_SOLAPI_SIZE) {
          console.log('🔄 추가 압축 필요, compressImageForSolapi 사용...');
          const compressionInfo = await compressImageForSolapi(jpegBuffer, MAX_SOLAPI_SIZE);
          finalImageBuffer = compressionInfo.buffer;
          fileExtension = 'jpg';
          console.log(`✅ 로고 압축 완료: ${(currentSize / 1024).toFixed(2)}KB → ${(finalImageBuffer.length / 1024).toFixed(2)}KB (품질: ${compressionInfo.quality}%)`);
        } else {
          finalImageBuffer = jpegBuffer;
          fileExtension = 'jpg';
          console.log(`✅ JPEG 변환으로 압축: ${(currentSize / 1024).toFixed(2)}KB → ${(jpegBuffer.length / 1024).toFixed(2)}KB`);
        }
      } catch (compressError: any) {
        console.error('❌ 로고 압축 실패:', {
          error: compressError.message,
          stack: compressError.stack,
          originalSize: `${(currentSize / 1024).toFixed(2)}KB`
        });
        // 압축 실패해도 계속 진행 (Solapi가 거부할 수 있음)
        console.warn('⚠️ 압축 실패, 원본 이미지 사용 (Solapi가 거부할 수 있음)');
      }
    } else {
      // 50KB ~ 200KB: 선택적 JPEG 변환 (크기 감소 시에만)
      console.log(`ℹ️ 로고 이미지가 ${(currentSize / 1024).toFixed(2)}KB입니다. 선택적 JPEG 변환 시도...`);
      try {
        const jpegBuffer = await sharp(imageBuffer)
          .jpeg({ quality: 90, progressive: true, mozjpeg: true })
          .toBuffer();
        
        // JPEG가 더 작으면 사용, 아니면 원본 PNG 사용
        if (jpegBuffer.length < currentSize) {
          finalImageBuffer = jpegBuffer;
          fileExtension = 'jpg';
          console.log(`✅ JPEG 변환으로 크기 감소: ${(currentSize / 1024).toFixed(2)}KB → ${(jpegBuffer.length / 1024).toFixed(2)}KB`);
        } else {
          console.log(`ℹ️ JPEG 변환 후 크기가 증가했습니다. 원본 PNG 사용.`);
        }
      } catch (convertError: any) {
        console.warn('⚠️ JPEG 변환 실패, 원본 PNG 사용:', convertError.message);
      }
    }

    // ⭐ 최종 크기 체크
    if (finalImageBuffer.length > MAX_SOLAPI_SIZE) {
      console.warn(`⚠️ 로고 이미지가 여전히 200KB를 초과합니다: ${(finalImageBuffer.length / 1024).toFixed(2)}KB`);
    }

    // Solapi에 업로드
    const filename = `logo-${logoId}-${Date.now()}.${fileExtension}`;
    const solapiImageId = await uploadToSolapi(finalImageBuffer, filename);

    if (!solapiImageId) {
      return res.status(500).json({ error: 'Solapi 업로드 실패' });
    }

    // ⭐ 추가: 솔라피 이미지 ID를 booking_settings에 캐시 저장
    try {
      await supabase
        .from('booking_settings')
        .update({
          booking_logo_solapi_image_id: solapiImageId
        })
        .eq('id', '00000000-0000-0000-0000-000000000001');
      console.log('✅ 솔라피 이미지 ID 캐시 저장 완료:', solapiImageId);
    } catch (cacheError: any) {
      console.warn('⚠️ 솔라피 이미지 ID 캐시 저장 실패 (계속 진행):', cacheError.message);
      // 캐시 저장 실패해도 이미지 ID는 반환
    }

    return res.status(200).json({
      success: true,
      imageId: solapiImageId,
      cached: false,
      logoMetadata: {
        id: logoMetadata.id,
        brand: logoMetadata.logo_brand,
        type: logoMetadata.logo_type,
        color: logoMetadata.logo_color_variant
      }
    });
  } catch (error: any) {
    console.error('❌ 로고 가져오기 오류 상세:', {
      error: error.message,
      stack: error.stack,
      logoId: req.body?.logoId,
      color: req.body?.color,
      size: req.body?.size
    });
    return res.status(500).json({
      error: error.message || '로고 가져오기 중 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

