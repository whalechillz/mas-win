import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { extractProvince } from '../../../../lib/address-utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

// 매장 정보
const STORE_LAT = 37.2808;
const STORE_LNG = 127.0498;

// 카카오맵 API 키
const KAKAO_MAP_API_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY;

// 주소 정규화 함수
function normalizeAddress(address: string | null | undefined): string | null {
  if (!address) return null;
  const trimmed = address.trim().replace(/\s+/g, ' ').trim();
  if (!trimmed || trimmed.length === 0) return null;
  
  const placeholders = ['[주소 미제공]', '[직접방문]', '[온라인 전용]', 'N/A'];
  if (placeholders.includes(trimmed)) {
    return trimmed;
  }
  
  const lowerTrimmed = trimmed.toLowerCase();
  if ((lowerTrimmed.includes('직접') && lowerTrimmed.includes('방문')) ||
      lowerTrimmed === '직접방문' ||
      lowerTrimmed === '직접 방문') {
    return '[직접방문]';
  }
  
  return trimmed;
}

// 주소가 지오코딩 가능한지 확인
function isGeocodableAddress(address: string | null | undefined): boolean {
  const normalized = normalizeAddress(address);
  if (!normalized) return false;
  if (normalized.startsWith('[') || normalized === 'N/A') return false;
  return normalized.length > 0;
}

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
    console.error('[지오코딩] 카카오맵 API 키가 설정되지 않았습니다.');
    return null;
  }

  try {
    const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`;
    console.log(`[지오코딩] API 호출: ${address.substring(0, 50)}...`);
    
    const response = await fetch(url, {
      headers: {
        Authorization: `KakaoAK ${KAKAO_MAP_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '응답 읽기 실패');
      console.error(`[지오코딩] 카카오맵 API 오류: ${response.status} ${response.statusText}`);
      console.error(`[지오코딩] 응답 내용: ${errorText.substring(0, 200)}`);
      return null;
    }

    const data = await response.json();
    
    // API 응답 구조 확인
    if (data.error) {
      console.error(`[지오코딩] 카카오맵 API 에러 응답:`, data.error);
      return null;
    }
    
    if (data.documents && data.documents.length > 0) {
      const doc = data.documents[0];
      const coords = {
        lat: parseFloat(doc.y),
        lng: parseFloat(doc.x),
      };
      console.log(`[지오코딩] API 성공: 좌표 (${coords.lat}, ${coords.lng})`);
      return coords;
    }

    console.warn(`[지오코딩] 주소 검색 결과 없음: ${address.substring(0, 50)}...`);
    return null;
  } catch (error: any) {
    console.error(`[지오코딩] 주소 좌표 변환 예외:`, error);
    console.error(`[지오코딩] 에러 메시지:`, error.message);
    console.error(`[지오코딩] 에러 스택:`, error.stack);
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  console.log('[지오코딩 일괄 실행] 시작');
  console.log('[지오코딩 일괄 실행] API 키 확인:', KAKAO_MAP_API_KEY ? '설정됨' : '없음');

  try {
    const { surveyIds, limit = 100 } = req.body;
    console.log('[지오코딩 일괄 실행] 요청 파라미터:', { 
      surveyIds: surveyIds?.length || 0, 
      limit,
      isSelected: !!surveyIds 
    });

    // 지오코딩이 안 된 설문 조회 (고객 정보도 함께)
    let query = supabase
      .from('surveys')
      .select('id, name, phone, address, created_at, customers(id, address)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (surveyIds && surveyIds.length > 0) {
      query = query.in('id', surveyIds);
    } else {
      query = query.limit(Number(limit));
    }

    const { data: surveys, error: surveysError } = await query;

    if (surveysError) {
      console.error('설문 조회 오류:', surveysError);
      return res.status(500).json({ success: false, message: '설문 조회에 실패했습니다.' });
    }

    if (!surveys || surveys.length === 0) {
      return res.status(200).json({
        success: true,
        message: '지오코딩할 설문이 없습니다.',
        data: { processed: 0, success: 0, failed: 0 },
      });
    }

    // 각 설문에 대해 지오코딩 수행
    let processed = 0;
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const survey of surveys) {
      // 고객 정보 조회 (주소 확인용)
      const customer = Array.isArray(survey.customers) ? survey.customers[0] : survey.customers;
      
      // 주소 결정: 설문 주소 → 고객 주소 (fallback)
      let addressToUse = survey.address || survey.survey_address;
      if (!addressToUse || !isGeocodableAddress(addressToUse)) {
        if (customer?.address && isGeocodableAddress(customer.address)) {
          addressToUse = customer.address;
        } else {
          // 둘 다 없거나 플레이스홀더면 건너뛰기
          continue;
        }
      }
      
      const normalizedAddress = normalizeAddress(addressToUse);
      
      // 정규화 후에도 지오코딩 불가능하면 건너뛰기
      if (!normalizedAddress || !isGeocodableAddress(normalizedAddress)) {
        continue;
      }

      // surveyIds가 전달된 경우 (선택된 항목만)는 재실행 가능하도록 캐시 확인 생략
      // surveyIds가 없으면 (전체 실행) 이미 지오코딩된 것은 건너뛰기
      if (!surveyIds || surveyIds.length === 0) {
        // 이미 지오코딩된 주소인지 확인
        let existingCache = null;
        if (survey.id || survey.survey_id) {
          const { data } = await supabase
            .from('customer_address_cache')
            .select('*')
            .eq('survey_id', survey.id || survey.survey_id)
            .eq('address', normalizedAddress)
            .eq('geocoding_status', 'success')
            .maybeSingle();
          existingCache = data;
        }
        if (!existingCache && (customer?.id || survey.customer_id)) {
          const { data } = await supabase
            .from('customer_address_cache')
            .select('*')
            .eq('customer_id', customer?.id || survey.customer_id)
            .eq('address', normalizedAddress)
            .eq('geocoding_status', 'success')
            .maybeSingle();
          existingCache = data;
        }

        if (existingCache) {
          // 이미 지오코딩 완료
          continue;
        }
      }

      processed++;

      try {
        const surveyId = survey.id || survey.survey_id || 'unknown';
        console.log(`[지오코딩] 시작: ${survey.name} (${surveyId}) - 주소: ${normalizedAddress.substring(0, 50)}...`);
        
        // 카카오맵 API 호출
        const coords = await getCoordinatesFromAddress(normalizedAddress);
        
        if (coords) {
          // 거리 계산
          const distance = calculateDistance(STORE_LAT, STORE_LNG, coords.lat, coords.lng);
          
          // 도 단위 추출
          const province = extractProvince(normalizedAddress);
          
          console.log(`[지오코딩] API 성공: ${survey.name} - 좌표: (${coords.lat}, ${coords.lng}), 거리: ${distance.toFixed(2)}km, 도: ${province || '없음'}`);
          
          // 캐시에 저장
          const cacheData: any = {
            address: normalizedAddress,
            latitude: coords.lat,
            longitude: coords.lng,
            distance_km: distance,
            province: province,
            geocoding_status: 'success',
            last_verified_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          if (survey.id || survey.survey_id) {
            cacheData.survey_id = survey.id || survey.survey_id;
          }
          if (customer?.id || survey.customer_id) {
            cacheData.customer_id = customer?.id || survey.customer_id;
          }

          // 기존 캐시 확인
          let existingCache = null;
          if (cacheData.survey_id) {
            const { data } = await supabase
              .from('customer_address_cache')
              .select('id')
              .eq('survey_id', cacheData.survey_id)
              .eq('address', normalizedAddress)
              .maybeSingle();
            existingCache = data;
          } else if (cacheData.customer_id) {
            const { data } = await supabase
              .from('customer_address_cache')
              .select('id')
              .eq('customer_id', cacheData.customer_id)
              .eq('address', normalizedAddress)
              .maybeSingle();
            existingCache = data;
          }

          let saveError = null;
          if (existingCache) {
            // 기존 레코드 업데이트
            const { error } = await supabase
              .from('customer_address_cache')
              .update(cacheData)
              .eq('id', existingCache.id);
            saveError = error;
          } else {
            // 새 레코드 삽입
            const { error } = await supabase
              .from('customer_address_cache')
              .insert(cacheData);
            saveError = error;
          }

          if (saveError) {
            console.error(`[지오코딩] 캐시 저장 오류 (설문 ${surveyId}):`, saveError);
            failed++;
            errors.push(`설문 ${surveyId} (${survey.name}): 캐시 저장 실패 - ${saveError.message}`);
          } else {
            success++;
            console.log(`[지오코딩] 완료: ${survey.name} - ${normalizedAddress.substring(0, 30)}... (거리: ${distance.toFixed(2)}km)`);
          }

          // API 호출 제한을 고려한 딜레이 (초당 2회 제한)
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          // 지오코딩 실패 - 원인 파악
          console.warn(`[지오코딩] API 실패: ${survey.name} (${surveyId}) - 주소: ${normalizedAddress.substring(0, 50)}...`);
          
          // 실패 원인 확인을 위해 API 키 확인
          if (!KAKAO_MAP_API_KEY) {
            console.error(`[지오코딩] API 키 없음: ${survey.name} (${surveyId})`);
          }
          
          // 도 단위 추출 (실패해도 저장)
          const province = extractProvince(normalizedAddress);
          
          const cacheData: any = {
            address: normalizedAddress,
            province: province,
            geocoding_status: 'failed',
            geocoding_error: '주소 변환 실패',
            updated_at: new Date().toISOString(),
          };

          if (survey.id || survey.survey_id) {
            cacheData.survey_id = survey.id || survey.survey_id;
          }
          if (customer?.id || survey.customer_id) {
            cacheData.customer_id = customer?.id || survey.customer_id;
          }

          // 기존 캐시 확인
          let existingCache = null;
          if (cacheData.survey_id) {
            const { data } = await supabase
              .from('customer_address_cache')
              .select('id')
              .eq('survey_id', cacheData.survey_id)
              .eq('address', normalizedAddress)
              .maybeSingle();
            existingCache = data;
          } else if (cacheData.customer_id) {
            const { data } = await supabase
              .from('customer_address_cache')
              .select('id')
              .eq('customer_id', cacheData.customer_id)
              .eq('address', normalizedAddress)
              .maybeSingle();
            existingCache = data;
          }

          if (existingCache) {
            // 기존 레코드 업데이트
            const { error } = await supabase
              .from('customer_address_cache')
              .update(cacheData)
              .eq('id', existingCache.id);
            if (error) {
              console.error(`[지오코딩] 실패 상태 저장 오류 (설문 ${surveyId}):`, error);
            }
          } else {
            // 새 레코드 삽입
            const { error } = await supabase
              .from('customer_address_cache')
              .insert(cacheData);
            if (error) {
              console.error(`[지오코딩] 실패 상태 저장 오류 (설문 ${surveyId}):`, error);
            }
          }

          failed++;
          errors.push(`설문 ${surveyId} (${survey.name}): 주소 변환 실패 - ${normalizedAddress.substring(0, 30)}...`);
        }
      } catch (error: any) {
        const surveyId = survey.id || survey.survey_id || 'unknown';
        console.error(`[지오코딩] 예외 발생 (설문 ${surveyId}):`, error);
        console.error(`[지오코딩] 에러 스택:`, error.stack);
        failed++;
        errors.push(`설문 ${surveyId} (${survey.name}): ${error.message || '알 수 없는 오류'}`);
      }
    }

    console.log(`[지오코딩 일괄 실행] 완료: 처리 ${processed}건, 성공 ${success}건, 실패 ${failed}건`);
    if (errors.length > 0) {
      console.error(`[지오코딩 일괄 실행] 실패 목록 (최대 10개):`, errors.slice(0, 10));
    }
    
    return res.status(200).json({
      success: true,
      message: `지오코딩 완료: ${success}건 성공, ${failed}건 실패 (총 ${processed}건 처리)`,
      data: {
        processed,
        success,
        failed,
        total: surveys.length,
        errors: errors.length > 0 ? errors.slice(0, 20) : undefined, // 최대 20개까지 반환
      },
    });
  } catch (error: any) {
    console.error('일괄 지오코딩 오류:', error);
    return res.status(500).json({
      success: false,
      message: error.message || '일괄 지오코딩 중 오류가 발생했습니다.',
    });
  }
}
