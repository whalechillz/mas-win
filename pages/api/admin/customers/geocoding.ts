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
    console.error('카카오맵 API 키가 설정되지 않았습니다.');
    return null;
  }

  try {
    const response = await fetch(
      `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
      {
        headers: {
          Authorization: `KakaoAK ${KAKAO_MAP_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      console.error(`카카오맵 API 오류: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    if (data.documents && data.documents.length > 0) {
      const firstResult = data.documents[0];
      return {
        lat: parseFloat(firstResult.y),
        lng: parseFloat(firstResult.x),
      };
    }

    return null;
  } catch (error: any) {
    console.error('주소 변환 오류:', error);
    return null;
  }
}

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // 고객 중심 위치 정보 조회
    try {
      const { 
        status, 
        province, 
        hasAddress, 
        distanceMin, 
        distanceMax,
        q = '', // 검색어 (이름, 전화번호, 주소)
        limit = 10000, 
        offset = 0,
        sortBy = 'updated_at',
        sortOrder = 'desc'
      } = req.query;

      // WHERE 조건 구성
      // 단순화: status 필터 하나로 통합
      // - 'with_distance': 지오코딩 성공 + 거리 정보 있음
      // - 'without_distance': 지오코딩 실패/미처리/거리 정보 없음
      // - 'all': 전체
      let whereCondition = '';
      
      if (status === 'with_distance') {
        // 거리 있는 고객: 지오코딩 성공 + 거리 정보 있음
        whereCondition = `WHERE cache.geocoding_status = 'success' AND cache.distance_km IS NOT NULL`;
      } else if (status === 'without_distance') {
        // 거리 없는 고객: 지오코딩 실패 또는 미처리 또는 거리 정보 없음
        whereCondition = `WHERE (cache.geocoding_status IS NULL OR cache.geocoding_status != 'success' OR cache.distance_km IS NULL OR cache.id IS NULL)`;
      } else {
        // status === 'all' 또는 기존 값들 (하위 호환성)
        // 기존 status 값들도 처리 (success, failed, unconfirmed, missing)
        if (status === 'success') {
          whereCondition = `WHERE cache.geocoding_status = 'success'`;
        } else if (status === 'unconfirmed') {
          whereCondition = `WHERE (cache.geocoding_status IS NULL OR cache.geocoding_status = 'missing')`;
        } else if (status === 'failed') {
          whereCondition = `WHERE cache.geocoding_status = 'failed'`;
        } else if (status === 'missing') {
          whereCondition = `WHERE cache.id IS NULL`;
        } else {
          // status === 'all'일 때
          whereCondition = `WHERE 1=1`;
        }
      }
      
      // 하위 호환성: hasAddress 파라미터가 있으면 우선 적용 (기존 API 호출 지원)
      if (hasAddress === 'with') {
        // 주소 있는 고객만 (지오코딩 성공한 고객만)
        whereCondition = `WHERE cache.geocoding_status = 'success'`;
      } else if (hasAddress === 'without') {
        // 주소 없는 고객만 (지오코딩이 없거나 실패한 고객)
        whereCondition = `WHERE (cache.geocoding_status IS NULL OR cache.geocoding_status != 'success' OR cache.id IS NULL)`;
      }

      // 도 단위 필터 (LEFT JOIN이므로 NULL 체크 필요)
      if (province && province !== 'all') {
        whereCondition += ` AND cache.province = '${province}'`;
      }

      // 거리 필터 (LEFT JOIN이므로 NULL 체크 필요)
      if (distanceMin !== undefined && distanceMin !== '') {
        whereCondition += ` AND cache.distance_km >= ${Number(distanceMin)}`;
      }
      if (distanceMax !== undefined && distanceMax !== '') {
        whereCondition += ` AND cache.distance_km <= ${Number(distanceMax)}`;
      }

      // 검색어 필터 (이름, 전화번호, 주소)
      const searchTerm = (q as string)?.trim() || '';
      if (searchTerm) {
        const cleanSearchTerm = searchTerm.replace(/[^0-9]/g, ''); // 숫자만 추출
        if (cleanSearchTerm.length > 0) {
          // 전화번호 검색 (숫자만)
          whereCondition += ` AND (c.name ILIKE '%${searchTerm}%' OR c.phone ILIKE '%${cleanSearchTerm}%' OR c.address ILIKE '%${searchTerm}%' OR s.address ILIKE '%${searchTerm}%')`;
        } else {
          // 이름 또는 주소 검색 (숫자 없음)
          whereCondition += ` AND (c.name ILIKE '%${searchTerm}%' OR c.address ILIKE '%${searchTerm}%' OR s.address ILIKE '%${searchTerm}%')`;
        }
      }

      // 전체 개수 조회 쿼리
      // 주의: LEFT JOIN에서 cache.address와 effective_address가 정확히 일치해야 함
      // 하지만 CASE 문이 복잡하므로, EXISTS 서브쿼리를 사용하는 것이 더 정확함
      // 단, exec_sql RPC가 없으면 fallback 로직 사용
      
      // 더 정확한 카운트를 위해 EXISTS 서브쿼리 방식 사용
      let countQuery = '';
      
      // 검색 조건을 countQuery에도 추가
      let countSearchCondition = '';
      if (searchTerm) {
        const cleanSearchTerm = searchTerm.replace(/[^0-9]/g, '');
        if (cleanSearchTerm.length > 0) {
          countSearchCondition = ` AND (c.name ILIKE '%${searchTerm}%' OR c.phone ILIKE '%${cleanSearchTerm}%' OR c.address ILIKE '%${searchTerm}%' OR s.address ILIKE '%${searchTerm}%')`;
        } else {
          countSearchCondition = ` AND (c.name ILIKE '%${searchTerm}%' OR c.address ILIKE '%${searchTerm}%' OR s.address ILIKE '%${searchTerm}%')`;
        }
      }
      
      if (hasAddress === 'with' && status === 'success') {
        // 지오코딩 성공한 고객만 (가장 일반적인 케이스)
        countQuery = `
          SELECT COUNT(DISTINCT c.id) as total
          FROM customers c
          LEFT JOIN surveys s ON s.phone = c.phone
          WHERE EXISTS (
            SELECT 1
            FROM customer_address_cache cache
            WHERE cache.customer_id = c.id
            AND cache.geocoding_status = 'success'
            AND (
              cache.address = c.address
              OR EXISTS (
                SELECT 1
                FROM surveys s2
                WHERE s2.phone = c.phone
                AND s2.address IS NOT NULL 
                AND s2.address != '' 
                AND s2.address NOT LIKE '[%' 
                AND s2.address != 'N/A'
                AND cache.address = s2.address
              )
            )
          )
          ${countSearchCondition}
        `;
      } else {
        // 기존 LEFT JOIN 방식 (다른 필터 조합)
        countQuery = `
          SELECT COUNT(DISTINCT c.id) as total
          FROM customers c
          LEFT JOIN surveys s ON s.phone = c.phone
          LEFT JOIN customer_address_cache cache ON (
            cache.customer_id = c.id 
            AND cache.address = CASE 
              WHEN s.address IS NOT NULL AND s.address != '' AND s.address NOT LIKE '[%' AND s.address != 'N/A' THEN s.address
              ELSE c.address
            END
          )
          ${whereCondition}
        `;
      }

      // 데이터 조회 쿼리
      let dataQuery = `
        SELECT DISTINCT
          c.id as customer_id,
          c.name,
          c.phone,
          c.address as customer_address,
          s.address as survey_address,
          CASE 
            WHEN s.address IS NOT NULL AND s.address != '' AND s.address NOT LIKE '[%' AND s.address != 'N/A' THEN s.address
            ELSE c.address
          END as effective_address,
          cache.geocoding_status,
          cache.geocoding_error,
          cache.latitude,
          cache.longitude,
          cache.distance_km,
          cache.province,
          cache.updated_at as cache_updated_at
        FROM customers c
        LEFT JOIN surveys s ON s.phone = c.phone
        LEFT JOIN customer_address_cache cache ON (
          cache.customer_id = c.id 
          AND cache.address = CASE 
            WHEN s.address IS NOT NULL AND s.address != '' AND s.address NOT LIKE '[%' AND s.address != 'N/A' THEN s.address
            ELSE c.address
          END
        )
        ${whereCondition}
        ${(() => {
          // 정렬 컬럼 결정
          let orderByColumn = 'c.updated_at';
          if (sortBy === 'name') {
            orderByColumn = 'c.name';
          } else if (sortBy === 'address') {
            orderByColumn = `CASE 
              WHEN s.address IS NOT NULL AND s.address != '' AND s.address NOT LIKE '[%' AND s.address != 'N/A' THEN s.address
              ELSE c.address
            END`;
          } else if (sortBy === 'status') {
            orderByColumn = `CASE 
              WHEN cache.geocoding_status = 'success' THEN 1
              WHEN cache.geocoding_status = 'failed' THEN 2
              WHEN cache.geocoding_status IS NULL THEN 3
              ELSE 4
            END`;
          } else if (sortBy === 'distance') {
            orderByColumn = 'cache.distance_km';
          } else {
            orderByColumn = 'c.updated_at';
          }
          
          const orderDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';
          // NULL 값 처리 (distance의 경우 NULL을 마지막으로)
          if (sortBy === 'distance') {
            return `ORDER BY ${orderByColumn} ${orderDirection} NULLS LAST`;
          }
          return `ORDER BY ${orderByColumn} ${orderDirection}`;
        })()}
        LIMIT ${limit} OFFSET ${offset}
      `;

      // 전체 고객 수 조회 (주소 유무와 관계없이)
      const { count: totalAllCustomers } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      // 필터링된 고객 수 조회
      const { data: countData, error: countError } = await supabase.rpc('exec_sql', { sql_query: countQuery });
      let totalWithAddress = countError ? 0 : (countData?.[0]?.total || 0);
      
      // exec_sql이 실패하거나 결과가 0인 경우, 직접 조회로 fallback
      if (countError || totalWithAddress === 0) {
        // 단순화된 필터에 대한 직접 조회
        if (status === 'with_distance') {
          // 거리 있는 고객: 지오코딩 성공 + 거리 정보 있음
          const { data: withDistanceData } = await supabase
            .from('customer_address_cache')
            .select('customer_id')
            .eq('geocoding_status', 'success')
            .not('distance_km', 'is', null);
          const uniqueCustomers = new Set(withDistanceData?.map(c => c.customer_id).filter(Boolean) || []);
          totalWithAddress = uniqueCustomers.size;
        } else if (status === 'without_distance') {
          // 거리 없는 고객: 전체 - 거리 있는 고객
          const { data: withDistanceData } = await supabase
            .from('customer_address_cache')
            .select('customer_id')
            .eq('geocoding_status', 'success')
            .not('distance_km', 'is', null);
          const customersWithDistance = new Set(withDistanceData?.map(c => c.customer_id).filter(Boolean) || []);
          totalWithAddress = (totalAllCustomers || 0) - customersWithDistance.size;
        } else if (hasAddress === 'with' && (status === 'success' || status === 'all')) {
          // 하위 호환성: 기존 hasAddress 파라미터 처리
          const { data: successCacheData } = await supabase
            .from('customer_address_cache')
            .select('customer_id')
            .eq('geocoding_status', 'success');
          
          const uniqueSuccessCustomers = new Set(successCacheData?.map(c => c.customer_id).filter(Boolean) || []);
          totalWithAddress = uniqueSuccessCustomers.size;
        }
      }

      // 데이터 조회
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: dataQuery });

      if (error) {
        // RPC가 없으면 최적화된 배치 쿼리 사용
        // 주의: 필터를 먼저 적용한 후 limit/offset을 적용해야 정확한 페이지네이션이 가능함
        // 하지만 Supabase의 제약으로 인해, 먼저 필터링된 고객 ID를 가져온 후 limit/offset 적용
        
        // 1단계: 필터 조건에 맞는 고객 ID 목록 가져오기
        let filteredCustomerIds: number[] = [];
        
        if (status === 'with_distance') {
          // 거리 있는 고객: 지오코딩 성공 + 거리 정보 있음
          const { data: withDistanceData } = await supabase
            .from('customer_address_cache')
            .select('customer_id')
            .eq('geocoding_status', 'success')
            .not('distance_km', 'is', null);
          const uniqueIds = new Set(withDistanceData?.map(c => c.customer_id).filter(Boolean) || []);
          filteredCustomerIds = Array.from(uniqueIds);
        } else if (status === 'without_distance') {
          // 거리 없는 고객: 전체 고객 - 거리 있는 고객
          const { data: withDistanceData } = await supabase
            .from('customer_address_cache')
            .select('customer_id')
            .eq('geocoding_status', 'success')
            .not('distance_km', 'is', null);
          const customersWithDistanceArray = withDistanceData?.map(c => c.customer_id).filter(Boolean) || [];
          const customersWithDistanceSet = new Set(customersWithDistanceArray);
          const { data: allCustomers } = await supabase
            .from('customers')
            .select('id');
          filteredCustomerIds = allCustomers?.filter(c => c.id && !customersWithDistanceSet.has(c.id)).map(c => c.id).filter(Boolean) || [];
        } else {
          // status === 'all' 또는 기타: 모든 고객
          const { data: allCustomers } = await supabase
            .from('customers')
            .select('id');
          filteredCustomerIds = allCustomers?.map(c => c.id).filter(Boolean) || [];
        }
        
        // 검색어 필터 적용
        if (searchTerm && filteredCustomerIds.length > 0) {
          const cleanSearchTerm = searchTerm.replace(/[^0-9]/g, '');
          let searchQuery = supabase
            .from('customers')
            .select('id')
            .in('id', filteredCustomerIds);
          
          if (cleanSearchTerm.length > 0) {
            // 전화번호 검색 포함
            searchQuery = searchQuery.or(`name.ilike.%${searchTerm}%,phone.ilike.%${cleanSearchTerm}%,address.ilike.%${searchTerm}%`);
          } else {
            // 이름 또는 주소 검색만
            searchQuery = searchQuery.or(`name.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`);
          }
          
          const { data: searchData } = await searchQuery;
          const searchCustomerIdsArray = searchData?.map(c => c.id).filter(Boolean) || [];
          filteredCustomerIds = filteredCustomerIds.filter(id => searchCustomerIdsArray.includes(id));
          
          // 설문 주소도 검색
          if (filteredCustomerIds.length > 0) {
            const { data: customersForSurveySearch } = await supabase
              .from('customers')
              .select('phone')
              .in('id', filteredCustomerIds);
            const customerPhonesForSurvey = customersForSurveySearch?.map(c => c.phone?.replace(/[^0-9]/g, '')).filter(Boolean) || [];
            
            if (customerPhonesForSurvey.length > 0) {
              const { data: surveysForSearch } = await supabase
                .from('surveys')
                .select('phone')
                .in('phone', customerPhonesForSurvey)
                .ilike('address', `%${searchTerm}%`);
              const surveyPhonesForSearch = surveysForSearch?.map(s => s.phone?.replace(/[^0-9]/g, '')).filter(Boolean) || [];
              
              if (surveyPhonesForSearch.length > 0) {
                const { data: customersWithSurveyAddress } = await supabase
                  .from('customers')
                  .select('id')
                  .in('phone', surveyPhonesForSearch);
                const surveyCustomerIds = customersWithSurveyAddress?.map(c => c.id).filter(Boolean) || [];
                filteredCustomerIds = [...new Set([...filteredCustomerIds, ...surveyCustomerIds])];
              }
            }
          }
        }

        // 도 단위 필터 적용 (배치 처리로 .in() 제한 우회)
        if (province && province !== 'all' && filteredCustomerIds.length > 0) {
          const BATCH_SIZE = 1000; // Supabase .in() 제한
          const provinceCustomerIdsArray: number[] = [];
          
          // 배치로 나눠서 처리
          for (let i = 0; i < filteredCustomerIds.length; i += BATCH_SIZE) {
            const batch = filteredCustomerIds.slice(i, i + BATCH_SIZE);
            const { data: provinceData } = await supabase
              .from('customer_address_cache')
              .select('customer_id')
              .in('customer_id', batch)
              .eq('province', province);
            const batchIds = provinceData?.map(c => c.customer_id).filter(Boolean) || [];
            provinceCustomerIdsArray.push(...batchIds);
          }
          
          filteredCustomerIds = filteredCustomerIds.filter(id => provinceCustomerIdsArray.includes(id));
        }
        
        // 거리 필터 적용 (배치 처리로 .in() 제한 우회)
        if ((distanceMin !== undefined && distanceMin !== '') || (distanceMax !== undefined && distanceMax !== '') && filteredCustomerIds.length > 0) {
          const BATCH_SIZE = 1000; // Supabase .in() 제한
          const distanceCustomerIdsArray: number[] = [];
          
          // 배치로 나눠서 처리
          for (let i = 0; i < filteredCustomerIds.length; i += BATCH_SIZE) {
            const batch = filteredCustomerIds.slice(i, i + BATCH_SIZE);
            let distanceQuery = supabase
              .from('customer_address_cache')
              .select('customer_id')
              .in('customer_id', batch);
            
            if (distanceMin !== undefined && distanceMin !== '') {
              distanceQuery = distanceQuery.gte('distance_km', Number(distanceMin));
            }
            if (distanceMax !== undefined && distanceMax !== '') {
              distanceQuery = distanceQuery.lte('distance_km', Number(distanceMax));
            }
            
            const { data: distanceData } = await distanceQuery;
            const batchIds = distanceData?.map(c => c.customer_id).filter(Boolean) || [];
            distanceCustomerIdsArray.push(...batchIds);
          }
          
          filteredCustomerIds = filteredCustomerIds.filter(id => distanceCustomerIdsArray.includes(id));
        }
        
        // 2단계: 정렬 적용 (필터링된 고객 ID 목록을 정렬 기준에 따라 정렬)
        let sortedCustomerIds = filteredCustomerIds;
        
        if (filteredCustomerIds.length > 0) {
          // 정렬 정보 가져오기
          const { data: customersForSort } = await supabase
            .from('customers')
            .select('id, name, phone, address, updated_at')
            .in('id', filteredCustomerIds);
          
          // 설문 주소 조회 (address 정렬용)
          const customerPhonesForSort = customersForSort?.map(c => c.phone?.replace(/[^0-9]/g, '')).filter(Boolean) || [];
          const { data: surveysForSort } = await supabase
            .from('surveys')
            .select('phone, address')
            .in('phone', customerPhonesForSort);
          
          const surveyMapForSort = new Map<string, any>();
          surveysForSort?.forEach(s => {
            const phone = s.phone?.replace(/[^0-9]/g, '') || '';
            if (!surveyMapForSort.has(phone)) {
              surveyMapForSort.set(phone, s);
            }
          });
          
          // 캐시 정보 조회 (status, distance 정렬용)
          const { data: cacheForSort } = await supabase
            .from('customer_address_cache')
            .select('customer_id, geocoding_status, distance_km')
            .in('customer_id', filteredCustomerIds);
          
          const cacheMapForSort = new Map<number, any>();
          cacheForSort?.forEach(cache => {
            if (cache.customer_id && !cacheMapForSort.has(cache.customer_id)) {
              cacheMapForSort.set(cache.customer_id, cache);
            }
          });
          
          // 정렬 기준에 따라 정렬
          const customerDataForSort = customersForSort?.map(c => {
            const phone = c.phone?.replace(/[^0-9]/g, '') || '';
            const survey = surveyMapForSort.get(phone);
            const effectiveAddress = (survey?.address && 
              survey.address !== '' && 
              !survey.address.startsWith('[') && 
              survey.address !== 'N/A') 
              ? survey.address 
              : c.address;
            const cache = cacheMapForSort.get(c.id);
            
            return {
              id: c.id,
              name: c.name || '',
              address: effectiveAddress || '',
              status: cache?.geocoding_status || null,
              distance: cache?.distance_km ?? Infinity,
              updated_at: c.updated_at || '',
            };
          }) || [];
          
          // 정렬 적용
          customerDataForSort.sort((a, b) => {
            let aValue: any;
            let bValue: any;
            
            if (sortBy === 'name') {
              aValue = a.name;
              bValue = b.name;
            } else if (sortBy === 'address') {
              aValue = a.address;
              bValue = b.address;
            } else if (sortBy === 'status') {
              const statusOrder: any = { 'success': 1, null: 2, undefined: 2, 'failed': 3 };
              aValue = statusOrder[a.status] || 4;
              bValue = statusOrder[b.status] || 4;
            } else if (sortBy === 'distance') {
              aValue = a.distance;
              bValue = b.distance;
            } else {
              aValue = a.updated_at;
              bValue = b.updated_at;
            }
            
            if (typeof aValue === 'string' && typeof bValue === 'string') {
              const comparison = aValue.localeCompare(bValue, 'ko');
              return sortOrder === 'asc' ? comparison : -comparison;
            } else {
              const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
              return sortOrder === 'asc' ? comparison : -comparison;
            }
          });
          
          sortedCustomerIds = customerDataForSort.map(c => c.id);
        }
        
        // 3단계: 정렬된 고객 ID 목록에서 limit/offset 적용
        const paginatedCustomerIds = sortedCustomerIds.slice(Number(offset), Number(offset) + Number(limit));
        
        if (paginatedCustomerIds.length === 0) {
          return res.status(200).json({ 
            success: true, 
            data: { customers: [], total: filteredCustomerIds.length, totalAll: totalAllCustomers || 0 } 
          });
        }
        
        // 4단계: 페이지네이션된 고객 정보 조회
        let customersQuery = supabase
          .from('customers')
          .select('id, name, phone, address, updated_at')
          .in('id', paginatedCustomerIds);
        
        // 정렬 순서는 이미 sortedCustomerIds에서 적용되었으므로 그대로 사용
        customersQuery = customersQuery.order('id', { ascending: true });

        const { data: customers } = await customersQuery;
        
        if (!customers || customers.length === 0) {
          return res.status(200).json({ 
            success: true, 
            data: { customers: [], total: filteredCustomerIds.length, totalAll: totalAllCustomers || 0 } 
          });
        }
        
        // 정렬된 순서로 재정렬 (in()은 순서를 보장하지 않으므로)
        const customerIdOrder = new Map(paginatedCustomerIds.map((id, index) => [id, index]));
        customers.sort((a, b) => {
          const aIndex = customerIdOrder.get(a.id) ?? Infinity;
          const bIndex = customerIdOrder.get(b.id) ?? Infinity;
          return aIndex - bIndex;
        });

        // 설문 주소 조회
        const customerIds = customers.map(c => c.id).filter(Boolean);
        const customerPhones = customers.map(c => c.phone?.replace(/[^0-9]/g, '')).filter(Boolean);
        
        const { data: surveys } = await supabase
          .from('surveys')
          .select('id, phone, address')
          .in('phone', customerPhones);

        const surveyMap = new Map<string, any>();
        surveys?.forEach(s => {
          const phone = s.phone?.replace(/[^0-9]/g, '') || '';
          if (!surveyMap.has(phone)) {
            surveyMap.set(phone, s);
          }
        });

        // 캐시 조회
        const { data: cacheData } = await supabase
          .from('customer_address_cache')
          .select('*')
          .in('customer_id', customerIds);

        const cacheMap = new Map<number, any>();
        cacheData?.forEach(cache => {
          if (cache.customer_id) {
            const key = `${cache.customer_id}_${cache.address}`;
            cacheMap.set(key as any, cache);
          }
        });

        // 결과 조합 (이미 필터링된 고객 ID 목록에서 가져온 것이므로 추가 필터링 불필요)
        let result = customers.map(customer => {
          const phone = customer.phone?.replace(/[^0-9]/g, '') || '';
          const survey = surveyMap.get(phone);
          const effectiveAddress = (survey?.address && 
            survey.address !== '' && 
            !survey.address.startsWith('[') && 
            survey.address !== 'N/A') 
            ? survey.address 
            : customer.address;
          
          const cacheKey = `${customer.id}_${effectiveAddress}`;
          const cache = cacheMap.get(cacheKey as any);

          return {
            customer_id: customer.id,
            name: customer.name,
            phone: customer.phone,
            customer_address: customer.address,
            survey_address: survey?.address || null,
            effective_address: effectiveAddress,
            geocoding_status: cache?.geocoding_status || null,
            geocoding_error: cache?.geocoding_error || null,
            latitude: cache?.latitude || null,
            longitude: cache?.longitude || null,
            distance_km: cache?.distance_km || null,
            province: cache?.province || (effectiveAddress ? extractProvince(effectiveAddress) : null),
            cache_updated_at: cache?.updated_at || null,
          };
        });

        // 주의: 이미 필터링된 고객 ID 목록에서 가져온 것이므로 추가 필터링은 불필요
        // 하지만 하위 호환성을 위해 hasAddress 파라미터는 확인
        if (hasAddress === 'with') {
          result = result.filter(r => r.geocoding_status === 'success');
        } else if (hasAddress === 'without') {
          result = result.filter(r => !r.geocoding_status || r.geocoding_status !== 'success');
        }

        // 필터 적용 후 정확한 total count 계산 (모든 필터 조건 반영)
        // 주의: result는 이미 limit으로 제한된 데이터이므로, 전체 count를 별도로 계산해야 함

        // 전체 고객 수 조회 (fallback 방식)
        const { count: totalAllCustomersFallback } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true });

        // 정확한 total count 계산 (이미 필터링된 고객 ID 목록의 길이 사용)
        // 이 값은 모든 필터(상태, 도 단위, 거리, 검색어)가 적용된 후의 정확한 개수
        let totalWithAddressFallback = filteredCustomerIds.length;
        
        // 지오코딩 캐시 데이터 조회 (필터 조건에 맞는)
        let cacheQuery = supabase
          .from('customer_address_cache')
          .select('customer_id, geocoding_status, province, distance_km');

        // 상태 필터 적용 (단순화된 필터)
        if (status === 'with_distance') {
          // 거리 있는 고객: 지오코딩 성공 + 거리 정보 있음
          cacheQuery = cacheQuery.eq('geocoding_status', 'success').not('distance_km', 'is', null);
        } else if (status === 'without_distance') {
          // 거리 없는 고객: 지오코딩 실패 또는 미처리 또는 거리 정보 없음
          cacheQuery = cacheQuery.or('geocoding_status.is.null,geocoding_status.neq.success,distance_km.is.null');
        } else if (status === 'success') {
          cacheQuery = cacheQuery.eq('geocoding_status', 'success');
        } else if (status === 'unconfirmed') {
          cacheQuery = cacheQuery.or('geocoding_status.is.null,geocoding_status.eq.missing');
        } else if (status === 'failed') {
          cacheQuery = cacheQuery.eq('geocoding_status', 'failed');
        } else if (status === 'missing') {
          // missing은 cache가 없는 경우이므로 별도 처리
        }
        
        // 하위 호환성: hasAddress 파라미터가 있으면 추가 필터링
        if (hasAddress === 'with') {
          cacheQuery = cacheQuery.eq('geocoding_status', 'success');
        } else if (hasAddress === 'without') {
          // 주소 없는 고객은 나중에 계산
        }

        // 도 단위 필터 적용
        if (province && province !== 'all') {
          cacheQuery = cacheQuery.eq('province', province);
        }

        // 거리 필터 적용
        if (distanceMin !== undefined && distanceMin !== '') {
          cacheQuery = cacheQuery.gte('distance_km', Number(distanceMin));
        }
        if (distanceMax !== undefined && distanceMax !== '') {
          cacheQuery = cacheQuery.lte('distance_km', Number(distanceMax));
        }

        const { data: filteredCacheData } = await cacheQuery;

        // 단순화된 필터 로직
        if (status === 'with_distance') {
          // 거리 있는 고객: 지오코딩 성공 + 거리 정보 있음
          const uniqueCustomers = new Set(filteredCacheData?.map(c => c.customer_id).filter(Boolean) || []);
          totalWithAddressFallback = uniqueCustomers.size;
        } else if (status === 'without_distance') {
          // 거리 없는 고객: 전체 - 거리 있는 고객
          const { data: withDistanceData } = await supabase
            .from('customer_address_cache')
            .select('customer_id')
            .eq('geocoding_status', 'success')
            .not('distance_km', 'is', null);
          const customersWithDistance = new Set(withDistanceData?.map(c => c.customer_id).filter(Boolean) || []);
          totalWithAddressFallback = (totalAllCustomersFallback || 0) - customersWithDistance.size;
        } else if (hasAddress === 'all' || !hasAddress) {
          // 전체인 경우
          if (status === 'missing') {
            // missing은 cache가 없는 고객이므로 전체 고객 수에서 cache 있는 고객 수를 빼야 함
            const { data: allCacheData } = await supabase
              .from('customer_address_cache')
              .select('customer_id');
            const customersWithCache = new Set(allCacheData?.map(c => c.customer_id).filter(Boolean) || []);
            totalWithAddressFallback = (totalAllCustomersFallback || 0) - customersWithCache.size;
          } else {
            // 다른 상태 필터는 cache 데이터로 계산
            const uniqueCustomers = new Set(filteredCacheData?.map(c => c.customer_id).filter(Boolean) || []);
            totalWithAddressFallback = uniqueCustomers.size;
          }
        } else if (hasAddress === 'with') {
          // 주소 있는 고객: 지오코딩 성공한 고객만 (이미 cacheQuery에서 필터링됨)
          const uniqueCustomers = new Set(filteredCacheData?.map(c => c.customer_id).filter(Boolean) || []);
          totalWithAddressFallback = uniqueCustomers.size;
        } else if (hasAddress === 'without') {
          // 주소 없는 고객: 전체 - 지오코딩 성공한 고객
          const { data: successCacheData } = await supabase
            .from('customer_address_cache')
            .select('customer_id')
            .eq('geocoding_status', 'success');
          const customersWithSuccess = new Set(successCacheData?.map(c => c.customer_id).filter(Boolean) || []);
          
          // 상태 필터가 있으면 추가 필터링
          if (status === 'all') {
            totalWithAddressFallback = (totalAllCustomersFallback || 0) - customersWithSuccess.size;
          } else {
            // 상태 필터가 있으면 해당 상태의 고객만 카운트
            const uniqueCustomers = new Set(filteredCacheData?.map(c => c.customer_id).filter(Boolean) || []);
            totalWithAddressFallback = uniqueCustomers.size;
          }
        }

        // 상태, 도 단위, 거리 필터 적용 후 count 재계산
        // (이미 result에 필터가 적용되어 있으므로, 전체 데이터에 같은 필터를 적용한 count 필요)
        // 하지만 이는 복잡하므로, 일단 result.length를 사용하되 주석으로 설명
        // 실제로는 전체 데이터를 다시 필터링해야 정확한 count를 얻을 수 있음
        // 성능을 위해 현재는 result.length를 사용하되, 정확한 count는 별도 계산

        return res.status(200).json({ 
          success: true, 
          data: { 
            customers: result, 
            total: totalWithAddressFallback || result.length, // 정확한 count 사용
            totalAll: totalAllCustomersFallback || 0
          } 
        });
      }

      // SQL 쿼리 결과에서 province가 null인 경우 주소에서 추출
      const processedData = (data || []).map((customer: any) => {
        if (!customer.province && customer.effective_address) {
          return {
            ...customer,
            province: extractProvince(customer.effective_address)
          };
        }
        return customer;
      });

      return res.status(200).json({ 
        success: true, 
        data: { 
          customers: processedData, 
          total: totalWithAddress,
          totalAll: totalAllCustomers || 0
        } 
      });

    } catch (error: any) {
      console.error('위치 정보 조회 오류:', error);
      return res.status(500).json({ 
        success: false, 
        message: '위치 정보 조회에 실패했습니다.',
        error: error.message 
      });
    }
  } else if (req.method === 'POST') {
    // 위치 정보 수동 업데이트
    try {
      const { customerId, address } = req.body;

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
          .eq('customer_id', customerId);

        // 고객 정보 조회 (전화번호로 설문 찾기)
        let customerPhone: string | null = null;
        if (customerId) {
          const { data: customer } = await supabase
            .from('customers')
            .select('phone')
            .eq('id', customerId)
            .maybeSingle();
          customerPhone = customer?.phone || null;
        }

        // 설문 주소도 동기화
        if (customerPhone) {
          const normalizedPhone = customerPhone.replace(/[^0-9]/g, '');
          try {
            await supabase
              .from('surveys')
              .update({ address: normalizedAddress })
              .ilike('phone', `%${normalizedPhone}%`);
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
        // 도 단위 추출 (실패해도 저장)
        const province = extractProvince(normalizedAddress);
        
        // 실패한 경우 캐시에 실패 상태 저장
        await supabase.from('customer_address_cache').upsert(
          {
            customer_id: customerId || null,
            address: normalizedAddress,
            province: province,
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

      // 도 단위 추출
      const province = extractProvince(normalizedAddress);

      // 고객 정보 조회 (전화번호로 설문 찾기)
      let customerPhone: string | null = null;
      if (customerId) {
        const { data: customer } = await supabase
          .from('customers')
          .select('phone')
          .eq('id', customerId)
          .maybeSingle();
        customerPhone = customer?.phone || null;
      }

      // 캐시에 저장
      const { data, error } = await supabase.from('customer_address_cache').upsert(
        {
          customer_id: customerId || null,
          address: normalizedAddress,
          latitude: coords.lat,
          longitude: coords.lng,
          distance_km: distance,
          province: province,
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
      if (customerPhone) {
        const normalizedPhone = customerPhone.replace(/[^0-9]/g, '');
        try {
          await supabase
            .from('surveys')
            .update({ address: normalizedAddress })
            .ilike('phone', `%${normalizedPhone}%`);
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
        message: `위치 정보가 업데이트되었습니다. (거리: ${distance.toFixed(2)}km)`,
      });

    } catch (error: any) {
      console.error('위치 정보 업데이트 오류:', error);
      return res.status(500).json({ 
        success: false, 
        message: '위치 정보 업데이트에 실패했습니다.',
        error: error.message 
      });
    }
  } else {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}
