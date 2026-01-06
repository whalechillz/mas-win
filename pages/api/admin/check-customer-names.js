/**
 * 고객 폴더의 이미지 메타데이터에서 고객명 확인 API
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Supabase 환경 변수가 설정되지 않았습니다' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // 확인할 고객 ID 목록
  const customerIds = ['13528', '15203', '2213', '602'];

  try {
    const results = [];

    // 1. customers 테이블에서 직접 조회
    const { data: customersData, error: customersError } = await supabase
      .from('customers')
      .select('id, name, phone, created_at')
      .in('id', customerIds.map(id => parseInt(id)));

    const customersMap = {};
    if (!customersError && customersData) {
      customersData.forEach(customer => {
        customersMap[customer.id] = customer;
      });
    }

    // 2. image_metadata 테이블에서도 조회 (폴더 경로 기반)
    for (const customerId of customerIds) {
      const customerIdNum = parseInt(customerId);
      const customerFromDb = customersMap[customerIdNum];

      // image_metadata에서 폴더 경로로 조회
      const { data: metadataData, error: metadataError } = await supabase
        .from('image_metadata')
        .select('title, alt_text, folder_path, tags, created_at, usage_count')
        .ilike('folder_path', `originals/customers/customer-${customerId}%`)
        .order('created_at', { ascending: false })
        .limit(1);

      let customerName = '알 수 없음';
      let visitDate = '알 수 없음';
      let usageCount = 0;

      // customers 테이블에서 찾은 경우
      if (customerFromDb) {
        customerName = customerFromDb.name || '이름 없음';
      } else if (metadataData && metadataData.length > 0) {
        // image_metadata에서 추출
        const metadata = metadataData[0];
        usageCount = metadata.usage_count || 0;

        if (metadata.title) {
          const match = metadata.title.match(/^(.+?)\s*-\s*\d{4}-\d{2}-\d{2}/);
          if (match) {
            customerName = match[1].trim();
          } else {
            customerName = metadata.title;
          }
        } else if (metadata.alt_text) {
          const match = metadata.alt_text.match(/^(.+?)\s+고객 방문 이미지/);
          if (match) {
            customerName = match[1].trim();
          }
        }

        visitDate = metadata.folder_path?.split('/').pop() || '알 수 없음';
      } else {
        // Storage에서 폴더 확인
        const { data: storageData, error: storageError } = await supabase.storage
          .from('blog-images')
          .list(`originals/customers/customer-${customerId}`, { limit: 1 });

        if (!storageError && storageData && storageData.length > 0) {
          // 폴더는 존재하지만 메타데이터가 없음
          visitDate = storageData[0].name || '알 수 없음';
        }
      }

      results.push({
        customerId,
        customerName,
        phone: customerFromDb?.phone || null,
        folderPath: `originals/customers/customer-${customerId}`,
        visitDate,
        usageCount,
        hasMetadata: !!(metadataData && metadataData.length > 0),
        hasCustomerRecord: !!customerFromDb
      });
    }

    return res.status(200).json({
      success: true,
      customers: results
    });

  } catch (error) {
    console.error('❌ 고객명 확인 오류:', error);
    return res.status(500).json({
      error: '고객명 확인 중 오류가 발생했습니다',
      details: error.message
    });
  }
}
