/**
 * 스캔 서류 분류 API
 * 이미지를 스캔 서류로 분류하고 타입을 지정
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { detectScannedDocument } from '../../../lib/scanned-document-detector';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * file_path에서 고객 ID 추출
 */
async function extractCustomerIdFromPath(filePath: string): Promise<number | null> {
  if (!filePath) return null;
  
  // originals/customers/{folder_name}/... 패턴에서 폴더명 추출
  const match = filePath.match(/originals\/customers\/([^\/]+)/);
  if (!match) return null;
  
  const folderName = match[1];
  
  // folder_name으로 고객 찾기
  const { data: customer, error } = await supabase
    .from('customers')
    .select('id')
    .eq('folder_name', folderName)
    .maybeSingle();
  
  if (error || !customer) {
    // ai_tags에서 customer-{id} 추출 시도
    const { data: images } = await supabase
      .from('image_assets')
      .select('ai_tags')
      .ilike('file_path', `%${folderName}%`)
      .limit(1)
      .maybeSingle();
    
    if (images?.ai_tags && Array.isArray(images.ai_tags)) {
      for (const tag of images.ai_tags) {
        if (typeof tag === 'string' && tag.startsWith('customer-')) {
          const customerId = parseInt(tag.replace('customer-', ''), 10);
          if (!isNaN(customerId)) {
            return customerId;
          }
        }
      }
    }
    
    return null;
  }
  
  return customer.id;
}

/**
 * file_path에서 날짜 추출
 */
function extractDateFromPath(filePath: string): string | null {
  if (!filePath) return null;
  
  // YYYY-MM-DD 형식 날짜 추출
  const match = filePath.match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { imageAssetId, documentType, forceReclassify } = req.body;
  
  if (!imageAssetId) {
    return res.status(400).json({ error: 'imageAssetId is required' });
  }
  
  try {
    // 이미지 메타데이터 조회
    const { data: imageAsset, error: assetError } = await supabase
      .from('image_assets')
      .select('*')
      .eq('id', imageAssetId)
      .single();
    
    if (assetError || !imageAsset) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // 이미 분류된 경우 확인
    if (imageAsset.is_scanned_document && !forceReclassify) {
      // 기존 문서 레코드 조회
      const { data: existingDoc } = await supabase
        .from('scanned_documents')
        .select('id, document_type')
        .eq('image_asset_id', imageAssetId)
        .maybeSingle();
      
      return res.status(200).json({
        success: true,
        alreadyClassified: true,
        documentId: existingDoc?.id,
        documentType: imageAsset.document_type || existingDoc?.document_type
      });
    }
    
    // 문서 감지 (수동 지정이 없으면 자동 감지)
    let detectedType = documentType;
    if (!detectedType) {
      const detection = detectScannedDocument(
        imageAsset.filename || '',
        imageAsset.file_path || ''
      );
      
      if (!detection.isDocument) {
        return res.status(400).json({ 
          error: 'Not a scanned document',
          detection
        });
      }
      detectedType = detection.documentType;
    }
    
    // 고객 ID 추출
    const customerId = await extractCustomerIdFromPath(imageAsset.file_path || '');
    
    // 날짜 추출
    const visitDate = extractDateFromPath(imageAsset.file_path || '');
    
    // image_assets 업데이트
    const { error: updateError } = await supabase
      .from('image_assets')
      .update({
        is_scanned_document: true,
        document_type: detectedType,
        updated_at: new Date().toISOString()
      })
      .eq('id', imageAssetId);
    
    if (updateError) {
      console.error('image_assets 업데이트 오류:', updateError);
      return res.status(500).json({ error: updateError.message });
    }
    
    // scanned_documents 레코드 생성/업데이트
    const documentData = {
      customer_id: customerId,
      image_asset_id: imageAssetId,
      document_type: detectedType,
      file_path: imageAsset.file_path,
      file_name: imageAsset.filename,
      original_url: imageAsset.cdn_url,
      visit_date: visitDate,
      detected_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // 기존 레코드 확인
    const { data: existingDoc } = await supabase
      .from('scanned_documents')
      .select('id')
      .eq('image_asset_id', imageAssetId)
      .maybeSingle();
    
    let documentId;
    if (existingDoc) {
      const { data: updated, error: updateDocError } = await supabase
        .from('scanned_documents')
        .update(documentData)
        .eq('id', existingDoc.id)
        .select('id')
        .single();
      
      if (updateDocError) {
        console.error('scanned_documents 업데이트 오류:', updateDocError);
        return res.status(500).json({ error: updateDocError.message });
      }
      
      documentId = updated?.id;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('scanned_documents')
        .insert(documentData)
        .select('id')
        .single();
      
      if (insertError) {
        console.error('scanned_documents 생성 오류:', insertError);
        return res.status(500).json({ error: insertError.message });
      }
      
      documentId = inserted?.id;
    }
    
    return res.status(200).json({
      success: true,
      documentId,
      documentType: detectedType,
      isScannedDocument: true,
      customerId,
      visitDate
    });
    
  } catch (error: any) {
    console.error('문서 분류 오류:', error);
    return res.status(500).json({ 
      error: error.message || 'Document classification failed' 
    });
  }
}
