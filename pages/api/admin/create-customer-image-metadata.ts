/**
 * 고객 이미지 메타데이터 생성 API
 * 이미지 업로드 전에 메타데이터를 먼저 생성하고 저장
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { uploadImageToSupabase } from '../../../lib/image-upload-utils';
import { detectCustomerImageType } from '../../../lib/customer-image-type-detector';
import { sanitizeKoreanFileName } from '../../../lib/filename-sanitizer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = 'blog-images';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const config = {
  api: {
    bodyParser: false, // FormData 파싱을 위해 비활성화
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📥 [create-customer-image-metadata] 요청 수신');

    // FormData 파싱
    const formidable = (await import('formidable')).default;
    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB
      keepExtensions: true,
    });

    const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('❌ [create-customer-image-metadata] FormData 파싱 오류:', err);
          reject(err);
        } else {
          resolve([fields, files]);
        }
      });
    });

    const file = files.file?.[0];
    if (!file) {
      return res.status(400).json({ error: '이미지 파일이 필요합니다.' });
    }

    const customerId = parseInt(fields.customerId?.[0] || '0', 10);
    const customerName = fields.customerName?.[0] || '';
    const visitDate = fields.visitDate?.[0] || '';
    const metadataType = (fields.metadataType?.[0] || 'golf-ai') as 'golf-ai' | 'general' | 'ocr';

    if (!customerId || !customerName || !visitDate) {
      return res.status(400).json({
        error: 'customerId, customerName, visitDate가 필요합니다.'
      });
    }

    console.log('📦 [create-customer-image-metadata] 요청 본문:', {
      customerId,
      customerName,
      visitDate,
      metadataType,
      fileName: file.originalFilename || file.newFilename,
      fileSize: file.size
    });

    // 1. 임시 파일 업로드 (URL 확보)
    // ✅ 한글 파일명 sanitization 적용 (Supabase Storage key는 한글을 지원하지 않음)
    const originalFileName = file.originalFilename || file.newFilename;
    const sanitizedFileName = sanitizeKoreanFileName(originalFileName);
    const tempFileName = `temp_${Date.now()}_${sanitizedFileName}`;
    const tempFolderPath = `temp/customers/${customerId}`;
    
    console.log('📤 [create-customer-image-metadata] 임시 파일 업로드 시작:', {
      originalFileName,
      sanitizedFileName,
      tempFileName,
      tempFolderPath,
      mimetype: file.mimetype
    });

    // 파일을 Buffer로 읽기
    const fs = await import('fs');
    const fileBuffer = fs.readFileSync(file.filepath);
    
    // Supabase Storage에 직접 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(`${tempFolderPath}/${tempFileName}`, fileBuffer, {
        contentType: file.mimetype || 'image/jpeg',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ [create-customer-image-metadata] 임시 파일 업로드 실패:', uploadError);
      throw new Error(`임시 파일 업로드 실패: ${uploadError.message}`);
    }

    // 공개 URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(`${tempFolderPath}/${tempFileName}`);

    const tempUploadResult = {
      url: publicUrl,
      fileName: tempFileName
    };

    console.log('✅ [create-customer-image-metadata] 임시 파일 업로드 완료:', {
      url: tempUploadResult.url?.substring(0, 100)
    });

    // 2. 이미지 타입 감지
    const fileName = file.originalFilename || file.newFilename;
    const tempFilePath = `${tempFolderPath}/${tempFileName}`;
    
    console.log('🔍 [create-customer-image-metadata] 이미지 타입 감지 시작');
    console.log('📋 [메타데이터 생성] 입력 파라미터:', {
      customerId,
      customerName,
      visitDate,
      metadataType,
      fileName,
      tempFilePath
    });
    
    // 메타데이터 생성 전에 임시로 ALT 텍스트와 설명 추출 (타입 감지에 활용)
    let tempAltText: string | null = null;
    let tempDescription: string | null = null;
    
    // 먼저 간단한 AI 분석으로 기본 정보 추출 (타입 감지 개선을 위해)
    try {
      const quickAnalysisEndpoint = metadataType === 'golf-ai'
        ? '/api/analyze-image-prompt'
        : '/api/analyze-image-general';
      
      // baseUrl 자동 감지 (프로덕션 환경 고려)
      // 1. 환경 변수 우선 확인
      let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    process.env.NEXT_PUBLIC_SITE_URL;
      
      // 2. Vercel 환경 변수 확인
      if (!baseUrl && process.env.VERCEL_URL) {
        baseUrl = `https://${process.env.VERCEL_URL}`;
      }
      
      // 3. 요청 헤더에서 추출
      if (!baseUrl && req.headers.host) {
        const protocol = req.headers['x-forwarded-proto'] || 
                         (req.headers.referer?.startsWith('https://') ? 'https' : 'http');
        baseUrl = `${protocol}://${req.headers.host}`;
      }
      
      // 4. 최종 fallback (로컬 개발 환경)
      if (!baseUrl) {
        baseUrl = 'http://localhost:3000';
      }
      
      const quickAnalysisResponse = await fetch(`${baseUrl}${quickAnalysisEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: tempUploadResult.url,
          title: `${customerName} - ${visitDate}`,
          excerpt: ''
        })
      });
      
      if (quickAnalysisResponse.ok) {
        const quickAnalysis = await quickAnalysisResponse.json();
        tempAltText = quickAnalysis.alt_text || null;
        tempDescription = quickAnalysis.description || null;
      }
    } catch (error) {
      console.warn('⚠️ [create-customer-image-metadata] 빠른 분석 실패 (무시):', error);
    }
    
    console.log('🔍 [메타데이터 생성] detectCustomerImageType 호출 전:', {
      imageUrl: tempUploadResult.url?.substring(0, 100),
      fileName,
      tempFilePath,
      metadataType,
      tempAltText: tempAltText?.substring(0, 50),
      tempDescription: tempDescription?.substring(0, 50)
    });
    
    const typeDetection = await detectCustomerImageType(
      tempUploadResult.url,
      fileName,
      tempFilePath,
      metadataType,
      tempAltText,
      tempDescription
    );

    console.log('✅ [메타데이터 생성] 이미지 타입 감지 완료:', {
      scene: typeDetection.scene,
      type: typeDetection.type,
      confidence: typeDetection.confidence,
      detectionMethod: typeDetection.detectionMethod,
      keywords: typeDetection.keywords
    });

    // 3. 메타데이터 생성 (OCR 또는 일반 메타데이터)
    let metadata: any = {};
    let ocrText: string | null = null;

    // baseUrl 자동 감지 (프로덕션 환경 고려)
    // 1. 환경 변수 우선 확인
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                  process.env.NEXT_PUBLIC_SITE_URL;
    
    // 2. Vercel 환경 변수 확인
    if (!baseUrl && process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    }
    
    // 3. 요청 헤더에서 추출
    if (!baseUrl && req.headers.host) {
      const protocol = req.headers['x-forwarded-proto'] || 
                       (req.headers.referer?.startsWith('https://') ? 'https' : 'http');
      baseUrl = `${protocol}://${req.headers.host}`;
    }
    
    // 4. 최종 fallback (로컬 개발 환경)
    if (!baseUrl) {
      baseUrl = 'http://localhost:3000';
    }

    console.log('🌐 [create-customer-image-metadata] baseUrl:', {
      baseUrl,
      metadataType
    });

    // OCR인 경우 텍스트 추출
    if (metadataType === 'ocr') {
      console.log('📄 [create-customer-image-metadata] OCR 모드: 텍스트 추출 시작');
      
      const ocrResponse = await fetch(`${baseUrl}/api/admin/extract-document-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: tempUploadResult.url
        })
      });

      if (!ocrResponse.ok) {
        const errorText = await ocrResponse.text().catch(() => '');
        console.error('❌ [create-customer-image-metadata] OCR API 오류:', {
          status: ocrResponse.status,
          statusText: ocrResponse.statusText,
          errorText: errorText.substring(0, 200)
        });
        throw new Error(`OCR API 오류 (${ocrResponse.status}): ${ocrResponse.statusText}`);
      }

      const ocrResult = await ocrResponse.json();
      ocrText = ocrResult.text || '';
      
      console.log('✅ [create-customer-image-metadata] OCR 텍스트 추출 완료:', {
        textLength: ocrText.length,
        preview: ocrText.substring(0, 100)
      });

      // OCR 결과를 기반으로 기본 메타데이터 생성
      metadata = {
        alt_text: `문서 이미지: ${ocrText.substring(0, 150)}...`,
        title: `${customerName} - ${visitDate} 문서`,
        description: ocrText.substring(0, 500) || '문서 이미지',
        keywords: '문서, 서류, document, form'
      };
    } else {
      // 일반 메타데이터 생성 (골프 AI 또는 일반)
      const metadataEndpoint = metadataType === 'golf-ai'
        ? '/api/analyze-image-prompt'
        : '/api/analyze-image-general';
      
      console.log('📡 [create-customer-image-metadata] 메타데이터 생성 API 호출:', {
        endpoint: metadataEndpoint,
        imageUrl: tempUploadResult.url?.substring(0, 100),
        detectedScene: typeDetection.scene,
        detectedType: typeDetection.type
      });

      const metadataResponse = await fetch(`${baseUrl}${metadataEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: tempUploadResult.url,
          title: `${customerName} - ${visitDate}`,
          excerpt: '',
          // 타입 감지 결과를 프롬프트에 포함하여 더 정확한 메타데이터 생성
          sceneContext: {
            scene: typeDetection.scene,
            type: typeDetection.type,
            keywords: typeDetection.keywords
          }
        })
      });

      if (!metadataResponse.ok) {
        const errorText = await metadataResponse.text().catch(() => '');
        console.error('❌ [create-customer-image-metadata] 메타데이터 생성 API 오류:', {
          status: metadataResponse.status,
          statusText: metadataResponse.statusText,
          endpoint: `${baseUrl}${metadataEndpoint}`,
          errorText: errorText.substring(0, 200)
        });
        throw new Error(`메타데이터 생성 API 오류 (${metadataResponse.status}): ${metadataResponse.statusText}`);
      }

      metadata = await metadataResponse.json();
      console.log('✅ [create-customer-image-metadata] 메타데이터 생성 완료');
    }

    // 4. 메타데이터 저장 (image_assets 테이블)
    const filePathFromUrl = tempFilePath;
    const fileNameFromPath = tempFileName;
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'webp';
    
    const mimeTypeMap: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'heic': 'image/heic',
      'mp4': 'video/mp4',
      'mov': 'video/quicktime',
      'avi': 'video/x-msvideo',
      'webm': 'video/webm'
    };
    const detectedMimeType = mimeTypeMap[fileExtension] || file.mimetype || 'image/webp';
    const formatValue = fileExtension === 'jpg' ? 'jpeg' : fileExtension;

    // 고객 정보를 메타데이터에 저장 (정확한 장면 번호와 타입)
    const aiTags = [
      `customer-${customerId}`,
      `visit-${visitDate}`,
      `scene-${typeDetection.scene}`, // 정확한 장면 번호 (S1-S7)
      `type-${typeDetection.type}`, // 정확한 타입 (happy, problem, group 등)
      ...typeDetection.keywords
    ];
    
    console.log('🏷️ [메타데이터 생성] AI 태그 생성:', {
      scene: typeDetection.scene,
      type: typeDetection.type,
      aiTags
    });

    const metadataPayload: any = {
      // 필수 필드
      filename: fileNameFromPath,
      original_filename: fileName,
      file_path: filePathFromUrl,
      file_size: file.size || 0,
      mime_type: detectedMimeType,
      format: formatValue,
      // 선택 필드
      cdn_url: tempUploadResult.url,
      title: metadata.title || `${customerName} - ${visitDate}`,
      alt_text: metadata.alt_text || metadata.description || '',
      description: metadata.description || '',
      // 고객 정보를 메타데이터에 저장 (정확한 장면 번호와 타입)
      ai_tags: aiTags,
      // 타입 감지 결과 저장
      story_scene: typeDetection.scene > 0 ? typeDetection.scene : null,
      // 임시 파일임을 표시
      status: 'pending',
      updated_at: new Date().toISOString()
    };

    // OCR 결과가 있으면 추가
    if (ocrText) {
      metadataPayload.ocr_text = ocrText;
      metadataPayload.ocr_extracted = true;
      // OCR 텍스트를 description에도 포함 (검색 가능하도록)
      if (metadataPayload.description) {
        metadataPayload.description = `${metadataPayload.description}\n\n[OCR 추출 텍스트]\n${ocrText.substring(0, 1000)}`;
      } else {
        metadataPayload.description = `[OCR 추출 텍스트]\n${ocrText.substring(0, 1000)}`;
      }
    }

    console.log('📝 [create-customer-image-metadata] 메타데이터 저장 시도:', {
      filename: metadataPayload.filename,
      file_path: metadataPayload.file_path?.substring(0, 100),
      scene: metadataPayload.story_scene,
      ai_tags: metadataPayload.ai_tags
    });

    const { data: savedMetadata, error: saveError } = await supabase
      .from('image_assets')
      .insert(metadataPayload)
      .select()
      .single();

    if (saveError) {
      console.error('❌ [create-customer-image-metadata] 메타데이터 저장 실패:', saveError);
      throw new Error(`메타데이터 저장 실패: ${saveError.message}`);
    }

    console.log('✅ [create-customer-image-metadata] 메타데이터 저장 완료:', {
      metadataId: savedMetadata.id
    });

    return res.status(200).json({
      success: true,
      metadataId: savedMetadata.id,
      typeDetection,
      metadata,
      tempFileUrl: tempUploadResult.url,
      tempFilePath: filePathFromUrl,
      tempFileName: tempFileName
    });

  } catch (error: any) {
    console.error('❌ [create-customer-image-metadata] 오류:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    
    // OpenAI 크레딧 부족 오류 감지
    const errorCode = error.code || '';
    const errorMessage = error.message || '';
    const isCreditError = 
      errorCode === 'insufficient_quota' ||
      errorCode === 'billing_not_active' ||
      errorMessage.includes('insufficient_quota') ||
      errorMessage.includes('billing') ||
      errorMessage.includes('credit') ||
      errorMessage.includes('payment') ||
      errorMessage.includes('quota');
    
    if (isCreditError) {
      return res.status(402).json({
        success: false,
        error: '💰 OpenAI 계정에 크레딧이 부족합니다',
        details: 'OpenAI 계정에 크레딧을 충전해주세요.',
        type: 'insufficient_credit'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: error.message || '메타데이터 생성 중 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
