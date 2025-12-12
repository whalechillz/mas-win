import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const {
      id,
      name,
      phone,
      age,
      age_group,
      selected_model,
      important_factors,
      additional_feedback,
      address,
    } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: '설문 ID가 필요합니다.' });
    }

    // 업데이트할 데이터 구성
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) {
      // 전화번호 정규화
      const normalizePhoneNumber = (phone: string) => {
        if (!phone) return '';
        const numbers = phone.replace(/[^0-9]/g, '');
        if (numbers.startsWith('82')) {
          return '0' + numbers.substring(2);
        }
        return numbers;
      };
      updateData.phone = normalizePhoneNumber(phone);
    }
    if (age !== undefined) {
      updateData.age = age ? parseInt(age) : null;
      // 나이를 연령대 그룹으로 변환
      if (age) {
        const ageNum = parseInt(age);
        const convertAgeToAgeGroup = (age: number): string => {
          if (isNaN(age)) return '';
          if (age < 20) return '10대';
          if (age < 30) return '20대';
          if (age < 40) return '30대';
          if (age < 50) return '40대';
          if (age < 60) return '50대';
          if (age < 70) return '60대';
          if (age < 80) return '70대';
          return '80대 이상';
        };
        updateData.age_group = convertAgeToAgeGroup(ageNum);
      }
    }
    if (age_group !== undefined) updateData.age_group = age_group;
    if (selected_model !== undefined) updateData.selected_model = selected_model;
    if (important_factors !== undefined) updateData.important_factors = important_factors;
    if (additional_feedback !== undefined) updateData.additional_feedback = additional_feedback;
    if (address !== undefined) updateData.address = address;

    // 설문 업데이트
    const { data: updatedSurvey, error } = await supabase
      .from('surveys')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('설문 수정 오류:', error);
      return res.status(500).json({
        success: false,
        message: '설문 수정 중 오류가 발생했습니다.',
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: '설문이 수정되었습니다.',
      data: updatedSurvey,
    });
  } catch (error: any) {
    console.error('서버 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message,
    });
  }
}

