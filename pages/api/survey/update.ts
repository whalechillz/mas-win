import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

// 주소 정규화 함수: 주소 미제공 고객을 표준 플레이스홀더로 변환
function normalizeAddress(address: string | null | undefined): string | null {
  if (!address || !address.trim()) {
    return null;
  }
  
  const trimmed = address.trim();
  
  // 이미 표준 플레이스홀더인 경우 그대로 사용
  const placeholders = ['[주소 미제공]', '[직접방문]', '[온라인 전용]', 'N/A'];
  if (placeholders.includes(trimmed)) {
    return trimmed;
  }
  
  // "직접방문", "직접 방문" 등 다양한 표현을 표준화
  const lowerTrimmed = trimmed.toLowerCase();
  if ((lowerTrimmed.includes('직접') && lowerTrimmed.includes('방문')) ||
      lowerTrimmed === '직접방문' ||
      lowerTrimmed === '직접 방문') {
    return '[직접방문]';
  }
  
  return trimmed;
}

// 주소가 지오코딩 가능한지 확인 (플레이스홀더 제외)
function isGeocodableAddress(address: string | null | undefined): boolean {
  if (!address || !address.trim()) return false;
  
  const normalized = normalizeAddress(address);
  if (!normalized) return false;
  
  // 플레이스홀더는 지오코딩 불가
  const placeholders = ['[주소 미제공]', '[직접방문]', '[온라인 전용]', 'N/A'];
  return !placeholders.includes(normalized);
}

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
      gift_product_id,
      gift_text,
      event_candidate,
      event_winner,
      gift_delivered,
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
    if (address !== undefined) updateData.address = normalizeAddress(address);
    if (gift_product_id !== undefined) {
      updateData.gift_product_id = gift_product_id === null ? null : gift_product_id;
    }
    if (gift_text !== undefined) {
      updateData.gift_text = gift_text === null ? null : gift_text;
    }
    if (event_candidate !== undefined) {
      updateData.event_candidate = Boolean(event_candidate);
    }
    if (event_winner !== undefined) {
      updateData.event_winner = Boolean(event_winner);
    }
    if (gift_delivered !== undefined) {
      updateData.gift_delivered = Boolean(gift_delivered);
    }

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

    // 주소가 변경된 경우 위치 정보 캐시 무효화
    if (address !== undefined && updatedSurvey) {
      try {
        // 기존 위치 정보 캐시 삭제 (주소가 변경되었으므로)
        await supabase
          .from('customer_address_cache')
          .delete()
          .eq('survey_id', id);

        // 고객 ID가 있으면 고객별 캐시도 삭제
        const normalizedPhone = (updateData.phone || phone || '').replace(/[^0-9]/g, '');
        if (normalizedPhone) {
          const { data: customer } = await supabase
            .from('customers')
            .select('id')
            .ilike('phone', `%${normalizedPhone}%`)
            .limit(1)
            .maybeSingle();

          if (customer?.id) {
            // 같은 주소를 가진 고객의 캐시도 삭제 (주소가 변경되었으므로)
            await supabase
              .from('customer_address_cache')
              .delete()
              .eq('customer_id', customer.id)
              .eq('address', updatedSurvey.address || '');
          }
        }
      } catch (cacheError) {
        console.error('위치 정보 캐시 무효화 오류:', cacheError);
        // 캐시 무효화 실패해도 설문 업데이트는 성공으로 처리
      }
    }

    // 선물 지급 완료가 체크되었고, 사은품 정보가 있으면 customer_gifts 처리
    if (gift_delivered && (gift_product_id || gift_text)) {
      try {
        // 1. 고객 검색 또는 생성
        const normalizedPhone = (updateData.phone || phone || '').replace(/[^0-9]/g, '');
        if (!normalizedPhone) {
          console.warn('전화번호가 없어 선물 지급 처리를 건너뜁니다.');
        } else {
          const customerSearchRes = await supabase
            .from('customers')
            .select('id')
            .ilike('phone', `%${normalizedPhone}%`)
            .limit(1)
            .maybeSingle();

          let customerId = customerSearchRes.data?.id;

          if (!customerId) {
            // 고객이 없으면 생성
            const createCustomerRes = await supabase
              .from('customers')
              .insert({
                name: updateData.name || name,
                phone: normalizedPhone,
                address: updateData.address || address || null,
              })
              .select('id')
              .single();

            if (createCustomerRes.data) {
              customerId = createCustomerRes.data.id;
            }
          }

            if (customerId) {
              // 2. 기존 선물 기록 확인
              const existingGiftRes = await supabase
                .from('customer_gifts')
                .select('id, delivery_status, product_id')
                .eq('survey_id', id)
                .limit(1)
                .maybeSingle();

              const existingGift = existingGiftRes.data;

              if (existingGift) {
                // 기존 기록이 있으면 delivery_status를 'sent'로 업데이트
                await supabase
                  .from('customer_gifts')
                  .update({
                    delivery_status: 'sent',
                    delivery_date: new Date().toISOString().split('T')[0],
                  })
                  .eq('id', existingGift.id);

                // 재고 차감 (이전에 차감되지 않았고, product_id가 있는 경우)
                if (existingGift.delivery_status !== 'sent' && (existingGift.product_id || gift_product_id)) {
                  const productIdToUse = existingGift.product_id || gift_product_id;
                  await supabase.from('inventory_transactions').insert({
                    product_id: productIdToUse,
                    tx_type: 'outbound',
                    quantity: -1,
                    tx_date: new Date().toISOString().split('T')[0],
                    note: `선물: ${updateData.name || name}`,
                    related_gift_id: existingGift.id,
                  });
                }
              } else {
                // 3. 새로운 선물 기록 생성
                const newGiftRes = await supabase
                  .from('customer_gifts')
                  .insert({
                    customer_id: customerId,
                    survey_id: id,
                    product_id: gift_product_id || null,
                    gift_text: gift_text || null,
                    quantity: 1,
                    delivery_type: 'in_person',
                    delivery_status: 'sent',
                    delivery_date: new Date().toISOString().split('T')[0],
                    note: '설문 편집 화면에서 선물 지급 완료로 생성',
                  })
                  .select('id')
                  .single();

                // 4. 재고 차감 (product_id가 있는 경우)
                if (newGiftRes.data && gift_product_id) {
                  await supabase.from('inventory_transactions').insert({
                    product_id: gift_product_id,
                    tx_type: 'outbound',
                    quantity: -1,
                    tx_date: new Date().toISOString().split('T')[0],
                    note: `선물: ${updateData.name || name}`,
                    related_gift_id: newGiftRes.data.id,
                  });
                }
              }
            }
          }
      } catch (giftError: any) {
        console.error('선물 지급 처리 오류:', giftError);
        // 선물 처리 오류는 설문 업데이트는 성공했으므로 경고만
      }
    } else if (gift_delivered === false) {
      // 선물 지급 완료가 해제되면 customer_gifts의 delivery_status를 'canceled'로 변경
      try {
        const existingGiftRes = await supabase
          .from('customer_gifts')
          .select('id, delivery_status, product_id')
          .eq('survey_id', id)
          .eq('delivery_status', 'sent')
          .limit(1)
          .single();

        if (existingGiftRes.data) {
          await supabase
            .from('customer_gifts')
            .update({
              delivery_status: 'canceled',
            })
            .eq('id', existingGiftRes.data.id);

          // 재고 복구 (product_id가 있는 경우)
          if (existingGiftRes.data.product_id) {
            await supabase.from('inventory_transactions').insert({
              product_id: existingGiftRes.data.product_id,
              tx_type: 'inbound',
              quantity: 1,
              tx_date: new Date().toISOString().split('T')[0],
              note: `선물 취소: ${updateData.name || name}`,
              related_gift_id: existingGiftRes.data.id,
            });
          }
        }
      } catch (cancelError: any) {
        console.error('선물 취소 처리 오류:', cancelError);
      }
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


