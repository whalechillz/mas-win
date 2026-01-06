import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

// 매장 정보
const STORE_LAT = 37.2808;
const STORE_LNG = 127.0498;

// 카카오맵 API 키
const KAKAO_MAP_API_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY;

// 하버사인 공식을 사용한 거리 계산 (km)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // 지구 반지름 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 카카오맵 API를 사용한 주소 → 좌표 변환
async function getCoordinatesFromAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!KAKAO_MAP_API_KEY) {
    console.warn('카카오맵 API 키가 설정되지 않았습니다.');
    return null;
  }

  try {
    const response = await fetch(
      `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
      {
        headers: {
          Authorization: `KakaoAK ${KAKAO_MAP_API_KEY}`,
        },
      },
    );

    if (!response.ok) {
      console.error('카카오맵 API 오류:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    if (data.documents && data.documents.length > 0) {
      const doc = data.documents[0];
      return {
        lat: parseFloat(doc.y),
        lng: parseFloat(doc.x),
      };
    }

    return null;
  } catch (error) {
    console.error('주소 변환 오류:', error);
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // 위치 미확인 고객 조회
    try {
      const { status, limit = 100, offset = 0 } = req.query;

      // 주소는 있지만 위치 정보가 없는 고객 조회
      // 1. surveys 테이블에서 주소가 있는 설문
      // 2. customer_address_cache에 없거나 실패한 경우
      let query = `
        SELECT DISTINCT
          s.id as survey_id,
          s.name,
          s.phone,
          s.address,
          c.id as customer_id,
          c.name as customer_name,
          cache.geocoding_status,
          cache.geocoding_error,
          cache.latitude,
          cache.longitude,
          cache.distance_km,
          cache.updated_at as cache_updated_at
        FROM surveys s
        LEFT JOIN customers c ON c.phone = s.phone
        LEFT JOIN customer_address_cache cache ON (
          (cache.customer_id = c.id OR cache.survey_id = s.id)
          AND cache.address = s.address
        )
        WHERE s.address IS NOT NULL 
          AND s.address != ''
      `;

      // 상태 필터
      if (status === 'failed') {
        query += ` AND (cache.geocoding_status = 'failed' OR cache.geocoding_status IS NULL)`;
      } else if (status === 'missing') {
        query += ` AND cache.id IS NULL`;
      } else if (status === 'success') {
        query += ` AND cache.geocoding_status = 'success'`;
      }

      query += ` ORDER BY s.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

      const { data, error } = await supabase.rpc('exec_sql', { sql_query: query });

      if (error) {
        // RPC가 없으면 직접 쿼리
        const { data: surveys } = await supabase
          .from('surveys')
          .select('id, name, phone, address, created_at')
          .not('address', 'is', null)
          .neq('address', '')
          .order('created_at', { ascending: false })
          .limit(Number(limit))
          .range(Number(offset), Number(offset) + Number(limit) - 1);

        if (!surveys) {
          return res.status(200).json({ success: true, data: { customers: [], total: 0 } });
        }

        // 각 설문에 대해 캐시 정보 조회
        const customers = await Promise.all(
          surveys.map(async (survey) => {
            // 고객 정보 조회
            const { data: customer } = await supabase
              .from('customers')
              .select('id, name')
              .eq('phone', survey.phone)
              .maybeSingle();

            // 캐시 정보 조회
            const { data: cache } = await supabase
              .from('customer_address_cache')
              .select('*')
              .or(
                `customer_id.eq.${customer?.id || -1},survey_id.eq.${survey.id}`,
              )
              .eq('address', survey.address)
              .maybeSingle();

            return {
              survey_id: survey.id,
              name: survey.name,
              phone: survey.phone,
              address: survey.address,
              customer_id: customer?.id || null,
              customer_name: customer?.name || null,
              geocoding_status: cache?.geocoding_status || null,
              geocoding_error: cache?.geocoding_error || null,
              latitude: cache?.latitude || null,
              longitude: cache?.longitude || null,
              distance_km: cache?.distance_km || null,
              cache_updated_at: cache?.updated_at || null,
            };
          }),
        );

        // 상태 필터 적용
        let filteredCustomers = customers;
        if (status === 'failed') {
          filteredCustomers = customers.filter(
            (c) => c.geocoding_status === 'failed' || c.geocoding_status === null,
          );
        } else if (status === 'missing') {
          filteredCustomers = customers.filter((c) => c.geocoding_status === null);
        } else if (status === 'success') {
          filteredCustomers = customers.filter((c) => c.geocoding_status === 'success');
        }

        return res.status(200).json({
          success: true,
          data: {
            customers: filteredCustomers,
            total: filteredCustomers.length,
          },
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          customers: data || [],
          total: data?.length || 0,
        },
      });
    } catch (error: any) {
      console.error('위치 미확인 고객 조회 오류:', error);
      return res.status(500).json({ success: false, message: error.message || '조회 중 오류가 발생했습니다.' });
    }
  } else if (req.method === 'POST') {
    // 위치 정보 수동 업데이트
    try {
      const { customerId, surveyId, address } = req.body;

      if (!address) {
        return res.status(400).json({ success: false, message: '주소를 입력해주세요.' });
      }

      // 주소를 좌표로 변환
      const coords = await getCoordinatesFromAddress(address);
      if (!coords) {
        // 실패한 경우 캐시에 실패 상태 저장
        await supabase.from('customer_address_cache').upsert(
          {
            customer_id: customerId || null,
            survey_id: surveyId || null,
            address: address,
            geocoding_status: 'failed',
            geocoding_error: '주소 변환 실패',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'customer_id,address' },
        );

        return res.status(400).json({ success: false, message: '주소를 좌표로 변환할 수 없습니다.' });
      }

      // 거리 계산
      const distance = calculateDistance(STORE_LAT, STORE_LNG, coords.lat, coords.lng);

      // 캐시에 저장
      const { data, error } = await supabase.from('customer_address_cache').upsert(
        {
          customer_id: customerId || null,
          survey_id: surveyId || null,
          address: address,
          latitude: coords.lat,
          longitude: coords.lng,
          distance_km: distance,
          geocoding_status: 'success',
          last_verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'customer_id,address' },
      );

      if (error) {
        console.error('위치 정보 저장 오류:', error);
        return res.status(500).json({ success: false, message: '위치 정보 저장에 실패했습니다.' });
      }

      return res.status(200).json({
        success: true,
        data: {
          latitude: coords.lat,
          longitude: coords.lng,
          distance_km: distance,
        },
        message: '위치 정보가 업데이트되었습니다.',
      });
    } catch (error: any) {
      console.error('위치 정보 업데이트 오류:', error);
      return res.status(500).json({ success: false, message: error.message || '업데이트 중 오류가 발생했습니다.' });
    }
  } else {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}

