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

// 카카오맵 API를 사용한 주소 → 좌표 변환
async function getCoordinatesFromAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!KAKAO_MAP_API_KEY) {
    console.warn('카카오맵 API 키가 설정되지 않았습니다.');
    return null;
  }
  
  // 플레이스홀더는 지오코딩 불가
  if (!isGeocodableAddress(address)) {
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

      // 위치 정보 관리: 주소가 있는 고객과 주소가 없는 고객 모두 조회
      // 1. surveys 테이블의 모든 설문 (주소 유무와 관계없이)
      // 2. 설문 주소가 플레이스홀더면 고객 정보의 주소를 우선 사용
      // 3. customer_address_cache에 없거나 실패한 경우
      let query = `
        SELECT DISTINCT
          s.id as survey_id,
          s.name,
          s.phone,
          s.address as survey_address,
          c.id as customer_id,
          c.name as customer_name,
          c.address as customer_address,
          CASE 
            WHEN s.address IS NULL OR s.address = '' THEN
              COALESCE(NULLIF(c.address, ''), NULL)
            WHEN s.address LIKE '[%' OR s.address IN ('[주소 미제공]', '[직접방문]', '[온라인 전용]', 'N/A') THEN
              COALESCE(NULLIF(c.address, ''), s.address)
            ELSE s.address
          END as effective_address,
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
          AND cache.address = CASE 
            WHEN s.address IS NULL OR s.address = '' THEN
              COALESCE(NULLIF(c.address, ''), NULL)
            WHEN s.address LIKE '[%' OR s.address IN ('[주소 미제공]', '[직접방문]', '[온라인 전용]', 'N/A') THEN
              COALESCE(NULLIF(c.address, ''), s.address)
            ELSE s.address
          END
        )
        WHERE 1=1
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
        // RPC가 없으면 최적화된 배치 쿼리 사용
        // 1. 모든 설문 조회 (한 번에)
        const { data: surveys } = await supabase
          .from('surveys')
          .select('id, name, phone, address, created_at')
          .order('created_at', { ascending: false })
          .limit(Number(limit))
          .range(Number(offset), Number(offset) + Number(limit) - 1);
        
        if (!surveys || surveys.length === 0) {
          return res.status(200).json({ success: true, data: { customers: [], total: 0 } });
        }

        // 2. 모든 고유 전화번호 추출
        const uniquePhones = [...new Set(surveys.map(s => s.phone).filter(Boolean))];
        
        // 3. 모든 고객 정보를 한 번에 조회 (전화번호로)
        let allCustomers: any[] = [];
        if (uniquePhones.length > 0) {
          const { data } = await supabase
              .from('customers')
            .select('id, name, address, phone')
            .in('phone', uniquePhones);
          allCustomers = data || [];
        }

        // 4. 고객 정보를 전화번호로 매핑
        const customerMap = new Map<string, any>();
        allCustomers?.forEach(c => {
          const normalizedPhone = c.phone?.replace(/[^0-9]/g, '') || '';
          if (!customerMap.has(normalizedPhone)) {
            customerMap.set(normalizedPhone, c);
          }
        });

        // 5. 모든 설문 ID와 고객 ID 수집
        const surveyIds = surveys.map(s => s.id).filter(Boolean);
        const customerIds = Array.from(customerMap.values()).map(c => c.id).filter(Boolean);

        // 6. 모든 캐시 정보를 한 번에 조회
        let allCaches: any[] = [];
        if (customerIds.length > 0 || surveyIds.length > 0) {
          // customer_id와 survey_id 모두 조회
          const cacheQueries: Promise<any>[] = [];
          
          if (customerIds.length > 0) {
            cacheQueries.push(
              supabase
                .from('customer_address_cache')
                .select('*')
                .in('customer_id', customerIds)
                .then(({ data }) => data || [])
            );
          }
          
          if (surveyIds.length > 0) {
            cacheQueries.push(
              supabase
                .from('customer_address_cache')
                .select('*')
                .in('survey_id', surveyIds)
                .then(({ data }) => data || [])
            );
          }
          
          // 두 쿼리 결과를 합치고 중복 제거
          const cacheResults = await Promise.all(cacheQueries);
          const cacheSet = new Set<string>();
          cacheResults.flat().forEach((cache: any) => {
            const key = `${cache.customer_id || ''}_${cache.survey_id || ''}_${cache.address || ''}`;
            if (!cacheSet.has(key)) {
              cacheSet.add(key);
              allCaches.push(cache);
            }
          });
        }

        // 7. 캐시 정보를 키로 매핑 (customer_id + address 또는 survey_id + address)
        const cacheMap = new Map<string, any>();
        allCaches?.forEach(cache => {
          const key1 = cache.customer_id ? `c_${cache.customer_id}_${cache.address}` : null;
          const key2 = cache.survey_id ? `s_${cache.survey_id}_${cache.address}` : null;
          if (key1) cacheMap.set(key1, cache);
          if (key2) cacheMap.set(key2, cache);
        });

        // 8. 메모리에서 JOIN 처리
        const customers = surveys.map((survey) => {
          const normalizedPhone = survey.phone?.replace(/[^0-9]/g, '') || '';
          const customer = customerMap.get(normalizedPhone);

            // 설문 주소가 플레이스홀더면 고객 정보의 주소를 우선 사용
            const placeholders = ['[주소 미제공]', '[직접방문]', '[온라인 전용]', 'N/A'];
            const isSurveyPlaceholder = survey.address && placeholders.includes(survey.address);
            const isSurveyEmpty = !survey.address || survey.address.trim() === '';
            
            let effectiveAddress: string | null = null;
            if (isSurveyEmpty) {
              effectiveAddress = customer?.address || null;
            } else if (isSurveyPlaceholder && customer?.address && isGeocodableAddress(customer.address)) {
              effectiveAddress = customer.address;
            } else {
              effectiveAddress = survey.address;
            }

          // 캐시 정보 찾기
          const cacheKey1 = customer?.id ? `c_${customer.id}_${effectiveAddress}` : null;
          const cacheKey2 = survey.id ? `s_${survey.id}_${effectiveAddress}` : null;
          const cache = (cacheKey1 && cacheMap.get(cacheKey1)) || (cacheKey2 && cacheMap.get(cacheKey2)) || null;

            return {
              survey_id: survey.id,
              name: survey.name,
              phone: survey.phone,
            address: effectiveAddress,
            original_survey_address: survey.address,
            customer_address: customer?.address || null,
              customer_id: customer?.id || null,
              customer_name: customer?.name || null,
              geocoding_status: cache?.geocoding_status || null,
              geocoding_error: cache?.geocoding_error || null,
              latitude: cache?.latitude || null,
              longitude: cache?.longitude || null,
              distance_km: cache?.distance_km || null,
              cache_updated_at: cache?.updated_at || null,
            };
        });

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

      if (!address || !address.trim()) {
        return res.status(400).json({ success: false, message: '주소를 입력해주세요.' });
      }

      // 주소 정규화
      const normalizedAddress = normalizeAddress(address);
      if (!normalizedAddress) {
        return res.status(400).json({ success: false, message: '주소를 입력해주세요.' });
      }

      // 플레이스홀더 주소인 경우 지오코딩 없이 저장만
      const placeholders = ['[주소 미제공]', '[직접방문]', '[온라인 전용]', 'N/A'];
      const isPlaceholder = placeholders.includes(normalizedAddress);
      
      if (isPlaceholder) {
        // 플레이스홀더 주소는 지오코딩 없이 저장만
        // 기존 캐시 삭제
        await supabase
          .from('customer_address_cache')
          .delete()
          .or(`customer_id.eq.${customerId || -1},survey_id.eq.${surveyId || 'null'}`);

        // 설문 주소도 동기화
        if (surveyId) {
          try {
            await supabase
              .from('surveys')
              .update({ address: normalizedAddress })
              .eq('id', surveyId);
          } catch (surveyError) {
            console.error('설문 주소 동기화 오류:', surveyError);
          }
        }

        // 고객 주소도 동기화
        if (customerId) {
          try {
            await supabase
              .from('customers')
              .update({ address: normalizedAddress })
              .eq('id', customerId);
          } catch (customerError) {
            console.error('고객 주소 동기화 오류:', customerError);
          }
        }

        return res.status(200).json({
          success: true,
          data: {
            latitude: null,
            longitude: null,
            distance_km: null,
          },
          message: '플레이스홀더 주소로 저장되었습니다. (지오코딩 없음)',
        });
      }

      // 실제 주소인 경우 지오코딩 수행
      if (!isGeocodableAddress(normalizedAddress)) {
        return res.status(400).json({ 
          success: false, 
          message: '지오코딩 가능한 주소를 입력해주세요.' 
        });
      }

      // 주소를 좌표로 변환
      const coords = await getCoordinatesFromAddress(normalizedAddress);
      if (!coords) {
        // 실패한 경우 캐시에 실패 상태 저장
        await supabase.from('customer_address_cache').upsert(
          {
            customer_id: customerId || null,
            survey_id: surveyId || null,
            address: normalizedAddress,
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
          address: normalizedAddress,
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

      // 설문 주소도 동기화
      if (surveyId) {
        try {
          await supabase
            .from('surveys')
            .update({ address: normalizedAddress })
            .eq('id', surveyId);
        } catch (surveyError) {
          console.error('설문 주소 동기화 오류:', surveyError);
          // 설문 업데이트 실패해도 위치 정보 저장은 성공으로 처리
        }
      }

      // 고객 주소도 동기화
      if (customerId) {
        try {
          await supabase
            .from('customers')
            .update({ address: normalizedAddress })
            .eq('id', customerId);
        } catch (customerError) {
          console.error('고객 주소 동기화 오류:', customerError);
          // 고객 업데이트 실패해도 위치 정보 저장은 성공으로 처리
        }
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

