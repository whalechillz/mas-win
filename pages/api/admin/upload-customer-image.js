/**
 * 고객 이미지 업로드 API
 * 
 * originals/customers/customer-{id}/YYYY-MM-DD/ 폴더에 저장
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = 'blog-images';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // 이미지 업로드 및 메타데이터 저장
    try {
      const { customerId, customerName, visitDate, imageUrl, filePath, fileName, fileSize } = req.body;

      if (!customerId || !visitDate || !imageUrl) {
        return res.status(400).json({
          success: false,
          error: 'customerId, visitDate, imageUrl이 필요합니다.'
        });
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // image_metadata 테이블에 저장
      const { data, error } = await supabase
        .from('image_metadata')
        .insert({
          file_name: fileName || filePath.split('/').pop(),
          image_url: imageUrl,
          folder_path: filePath.substring(0, filePath.lastIndexOf('/')),
          date_folder: visitDate,
          source: 'customer',
          channel: 'customer',
          title: `${customerName} - ${visitDate}`,
          alt_text: `${customerName} 고객 방문 이미지 (${visitDate})`,
          file_size: fileSize || null,
          // 고객 정보를 메타데이터에 저장 (JSON 필드 활용)
          tags: [`customer-${customerId}`, `visit-${visitDate}`],
        })
        .select();

      if (error) {
        console.error('❌ 메타데이터 저장 실패:', error);
        return res.status(500).json({
          success: false,
          error: '메타데이터 저장 실패',
          details: error.message
        });
      }

      // customers 테이블에 이미지 URL 연결 (선택적 - 별도 필드가 있다면)
      // 현재는 image_metadata 테이블의 tags 필드로 연결

      return res.status(200).json({
        success: true,
        message: '고객 이미지가 저장되었습니다.',
        image: data[0]
      });

    } catch (error) {
      console.error('❌ 고객 이미지 업로드 오류:', error);
      return res.status(500).json({
        success: false,
        error: '고객 이미지 업로드 중 오류가 발생했습니다.',
        details: error.message
      });
    }
  } else if (req.method === 'GET') {
    // 고객 이미지 목록 조회
    try {
      const { customerId } = req.query;

      if (!customerId) {
        return res.status(400).json({
          success: false,
          error: 'customerId가 필요합니다.'
        });
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // image_metadata 테이블에서 고객 이미지 조회
      const { data, error } = await supabase
        .from('image_metadata')
        .select('*')
        .contains('tags', [`customer-${customerId}`])
        .order('date_folder', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ 이미지 목록 조회 실패:', error);
        return res.status(500).json({
          success: false,
          error: '이미지 목록 조회 실패',
          details: error.message
        });
      }

      // 날짜별로 그룹화
      const groupedByDate = (data || []).reduce((acc, img) => {
        const date = img.date_folder || img.created_at?.slice(0, 10) || 'unknown';
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push({
          id: img.id,
          imageUrl: img.image_url,
          fileName: img.file_name,
          visitDate: date,
          createdAt: img.created_at
        });
        return acc;
      }, {});

      return res.status(200).json({
        success: true,
        images: data || [],
        groupedByDate
      });

    } catch (error) {
      console.error('❌ 고객 이미지 목록 조회 오류:', error);
      return res.status(500).json({
        success: false,
        error: '고객 이미지 목록 조회 중 오류가 발생했습니다.',
        details: error.message
      });
    }
  } else {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }
}









