/**
 * 고객 후기 관리 API
 * GET: 후기 목록 조회
 * POST: 후기 생성
 * PUT: 후기 수정
 * DELETE: 후기 삭제
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // 후기 목록 조회
    const { customerId } = req.query;

    if (!customerId) {
      return res.status(400).json({ error: 'customerId가 필요합니다.' });
    }

    try {
      // customer_consultations에서 모든 글 조회 (후기, 통화 내역, 블로그 초안 등)
      // blog_draft_content가 있거나 review_type이 있거나 consultation_type이 review/phone/visit인 항목
      const { data: directData, error: directError } = await supabase
        .from('customer_consultations')
        .select('*')
        .eq('customer_id', customerId)
        .or('blog_draft_content.not.is.null,review_type.not.is.null,consultation_type.in.(phone,visit,review)')
        .order('consultation_date', { ascending: false });

      if (directError) {
        throw directError;
      }

      const data = (directData || []).map((r: any) => ({
        ...r,
        image_count: r.review_images ? r.review_images.length : 0
      }));

      return res.status(200).json({
        success: true,
        reviews: data || []
      });
    } catch (error: any) {
      console.error('후기 조회 오류:', error);
      return res.status(500).json({
        success: false,
        error: error.message || '후기 조회 실패'
      });
    }
  }

  if (req.method === 'POST') {
    // 후기 생성
    const { customerId, consultationDate, consultationType, reviewType, topic, content, reviewRating, reviewImages } = req.body;

    if (!customerId || !content) {
      return res.status(400).json({ error: 'customerId와 content가 필요합니다.' });
    }

    try {
      // consultation_type에 따른 기본 태그 설정
      const getDefaultTags = (type: string, reviewType?: string | null) => {
        const tags: string[] = [];
        switch (type) {
          case 'review':
            tags.push('후기');
            if (reviewType) tags.push(reviewType);
            break;
          case 'phone':
            tags.push('전화', '통화');
            break;
          case 'visit':
            tags.push('방문', '상담');
            break;
          case 'fitting':
            tags.push('피팅', '데이터');
            break;
          case 'online':
            tags.push('온라인', '상담');
            break;
          case 'survey':
            tags.push('설문', '조사');
            break;
          case 'booking':
            tags.push('예약', '내역');
            break;
          case 'blog_draft':
            tags.push('블로그', '초안');
            break;
          default:
            tags.push('기타');
        }
        return tags;
      };

      const { data, error } = await supabase
        .from('customer_consultations')
        .insert({
          customer_id: customerId,
          consultation_type: consultationType || 'review',
          consultation_date: consultationDate || new Date().toISOString(),
          consultant_name: '시스템',
          topic: topic || '후기',
          content: content,
          review_type: reviewType || null,
          review_rating: reviewRating || null,
          review_images: reviewImages || null,
          tags: getDefaultTags(consultationType || 'review', reviewType),
          follow_up_required: false
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        review: data
      });
    } catch (error: any) {
      console.error('후기 생성 오류:', error);
      return res.status(500).json({
        success: false,
        error: error.message || '후기 생성 실패'
      });
    }
  }

  if (req.method === 'PUT') {
    // 후기 수정 (블로그 초안 포함)
    const { 
      reviewId, 
      content, 
      topic,  // ✅ 제목 추가
      consultationType,  // ✅ 분류 추가
      reviewType,  // ✅ 후기 유형 추가
      reviewRating, 
      reviewImages, 
      isBlogReady, 
      blogDraftContent,
      blogDraftTitle  // ✅ 블로그 초안 제목 추가
    } = req.body;

    if (!reviewId || !content) {
      return res.status(400).json({ error: 'reviewId와 content가 필요합니다.' });
    }

    try {
      const updateData: any = {
        content: content,
        updated_at: new Date().toISOString()
      };

      // 제목 업데이트 (topic으로 통합)
      if (topic !== undefined) {
        updateData.topic = topic;
      }

      // 분류 업데이트
      if (consultationType !== undefined) {
        updateData.consultation_type = consultationType;
      }
      
      if (reviewType !== undefined) {
        updateData.review_type = reviewType;
      }

      if (reviewRating !== undefined) updateData.review_rating = reviewRating;
      if (reviewImages !== undefined) updateData.review_images = reviewImages;
      if (isBlogReady !== undefined) updateData.is_blog_ready = isBlogReady;
      
      // 블로그 초안 내용도 함께 업데이트 (있는 경우)
      if (blogDraftContent !== undefined) {
        updateData.blog_draft_content = blogDraftContent;
      }
      
      // 블로그 초안 제목 업데이트 (topic과 동기화)
      if (blogDraftTitle !== undefined) {
        updateData.blog_draft_title = blogDraftTitle;
        // topic도 동기화 (없으면 blog_draft_title로 설정)
        if (!updateData.topic) {
          updateData.topic = blogDraftTitle;
        }
      }

      const { data, error } = await supabase
        .from('customer_consultations')
        .update(updateData)
        .eq('id', reviewId)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        review: data
      });
    } catch (error: any) {
      console.error('후기 수정 오류:', error);
      return res.status(500).json({
        success: false,
        error: error.message || '후기 수정 실패'
      });
    }
  }

  if (req.method === 'DELETE') {
    // 후기 삭제
    const { reviewId } = req.query;

    if (!reviewId) {
      return res.status(400).json({ error: 'reviewId가 필요합니다.' });
    }

    try {
      const { error } = await supabase
        .from('customer_consultations')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      return res.status(200).json({
        success: true
      });
    } catch (error: any) {
      console.error('후기 삭제 오류:', error);
      return res.status(500).json({
        success: false,
        error: error.message || '후기 삭제 실패'
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
