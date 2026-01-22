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
    // 고객 중심 위치 정보 조회 (서버 사이드 페이지네이션 방식)
    try {
      const { 
        status, 
        province, 
        hasAddress, 
        distanceMin, 
        distanceMax,
        q = '', // 검색어 (이름, 전화번호, 주소)
        limit = 100, 
        offset = 0,
        sortBy = 'updated_at',
        sortOrder = 'desc'
      } = req.query;
      
      const limitNum = Math.min(Number(limit) || 100, 1000); // 최대 1000개
      const offsetNum = Math.max(Number(offset) || 0, 0);
      const searchTerm = (q as string)?.trim() || '';

      // 디버깅 로그
      console.log('[geocoding.ts] 요청 파라미터:', {
        status,
        province,
        hasAddress,
        distanceMin,
        distanceMax,
        searchTerm,
        limit: limitNum,
        offset: offsetNum,
        sortBy,
        sortOrder
      });

      // ============================================
      // 서버 사이드 페이지네이션 방식
      // ============================================
      
      // 1단계: 전체 고객 수 조회 (검색어 필터 없이)
      const { count: totalAllCustomers } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });
      
      console.log('[geocoding.ts] 전체 고객 수:', totalAllCustomers);
      
      // 2단계: 필터 조건에 맞는 customer_id 목록 구하기
      // (geocoding_status, distance_km, province는 cache 테이블에 있음)
      let filteredCustomerIds: number[] | null = null;
      
      // status가 'all'이거나 없으면 필터 조건 적용 안 함
      const hasStatusFilter = status && status !== 'all';
      const hasOtherFilters = (province && province !== 'all') || hasAddress || distanceMin || distanceMax;
      
      if (hasStatusFilter || hasOtherFilters) {
        console.log('[geocoding.ts] 필터 조건 적용 시작');
        
        // "거리 없는 고객" 필터는 특별 처리 필요
        // cache에 레코드가 없는 고객도 포함해야 함
        if (status === 'without_distance') {
          // 방법: 모든 고객 ID를 가져온 후, cache에서 성공한 고객을 제외
          const { data: allCustomerIds } = await supabase
            .from('customers')
            .select('id');
          
          const allIds = allCustomerIds?.map(c => c.id) || [];
          console.log('[geocoding.ts] 전체 고객 ID 수:', allIds.length);
          
          // cache에서 성공한 고객 ID 조회 (추가 필터 적용)
          let successCacheQuery = supabase
            .from('customer_address_cache')
            .select('customer_id')
            .eq('geocoding_status', 'success')
            .not('distance_km', 'is', null);
          
          // province 필터 적용
          if (province && province !== 'all') {
            successCacheQuery = successCacheQuery.eq('province', province);
          }
          
          // distance 필터 적용
          if (distanceMin !== undefined && distanceMin !== '') {
            successCacheQuery = successCacheQuery.gte('distance_km', Number(distanceMin));
          }
          if (distanceMax !== undefined && distanceMax !== '') {
            successCacheQuery = successCacheQuery.lte('distance_km', Number(distanceMax));
          }
          
          const { data: successCacheData } = await successCacheQuery;
          const successIds = new Set(successCacheData?.map(c => c.customer_id).filter(Boolean) || []);
          console.log('[geocoding.ts] 거리 있는 고객 ID 수:', successIds.size);
          
          // 전체 고객에서 거리 있는 고객 제외
          filteredCustomerIds = allIds.filter(id => !successIds.has(id));
          console.log('[geocoding.ts] 거리 없는 고객 ID 수 (필터 전):', filteredCustomerIds.length);
          
          // province 필터가 있으면 추가 필터링
          if (province && province !== 'all') {
            // cache에서 province가 일치하거나 null인 고객 ID 조회
            const { data: provinceCacheData } = await supabase
              .from('customer_address_cache')
              .select('customer_id, province')
              .in('customer_id', filteredCustomerIds);
            
            const provinceMatchIds = new Set(
              provinceCacheData
                ?.filter(c => !c.province || c.province === province)
                .map(c => c.customer_id)
                .filter(Boolean) || []
            );
            
            // cache에 레코드가 없는 고객도 포함 (province 필터와 무관)
            // cache에 레코드가 있지만 province가 null이거나 일치하는 고객만 포함
            filteredCustomerIds = filteredCustomerIds.filter(id => 
              !provinceMatchIds.has(id) || provinceMatchIds.has(id)
            );
            console.log('[geocoding.ts] 거리 없는 고객 ID 수 (province 필터 후):', filteredCustomerIds.length);
          }
        } else {
          // 다른 필터 조건은 cache 테이블에서 조회
          let cacheQuery = supabase
            .from('customer_address_cache')
            .select('customer_id');
          
          // status 필터
          if (status === 'with_distance') {
            cacheQuery = cacheQuery
              .eq('geocoding_status', 'success')
              .not('distance_km', 'is', null);
          } else if (status === 'success') {
            cacheQuery = cacheQuery.eq('geocoding_status', 'success');
          } else if (status === 'failed') {
            cacheQuery = cacheQuery.eq('geocoding_status', 'failed');
          } else if (status === 'unconfirmed' || status === 'missing') {
            cacheQuery = cacheQuery.or('geocoding_status.is.null,geocoding_status.eq.missing');
          }
          
          // hasAddress 필터 (하위 호환성)
          if (hasAddress === 'with') {
            cacheQuery = cacheQuery.eq('geocoding_status', 'success');
          } else if (hasAddress === 'without') {
            cacheQuery = cacheQuery.or('geocoding_status.is.null,geocoding_status.neq.success');
          }
          
          // province 필터
          if (province && province !== 'all') {
            cacheQuery = cacheQuery.eq('province', province);
          }
          
          // distance 필터
          if (distanceMin !== undefined && distanceMin !== '') {
            cacheQuery = cacheQuery.gte('distance_km', Number(distanceMin));
          }
          if (distanceMax !== undefined && distanceMax !== '') {
            cacheQuery = cacheQuery.lte('distance_km', Number(distanceMax));
          }
          
          // 배치 처리로 모든 customer_id 조회 (1000개씩)
          filteredCustomerIds = [];
          let hasMore = true;
          let batchOffset = 0;
          const batchSize = 1000;
          
          while (hasMore) {
            const batchQuery = cacheQuery.range(batchOffset, batchOffset + batchSize - 1);
            const { data: batchCacheData } = await batchQuery;
            
            if (batchCacheData && batchCacheData.length > 0) {
              const batchIds = batchCacheData.map(c => c.customer_id).filter(Boolean);
              filteredCustomerIds.push(...batchIds);
              batchOffset += batchSize;
              hasMore = batchCacheData.length === batchSize;
            } else {
              hasMore = false;
            }
          }
          
          // 중복 제거
          filteredCustomerIds = Array.from(new Set(filteredCustomerIds));
          
          if (filteredCustomerIds.length === 0) {
            // 필터 조건에 맞는 고객이 없으면 빈 결과 반환
            return res.status(200).json({
              success: true,
              data: {
                customers: [],
                total: 0,
                totalAll: totalAllCustomers || 0
              }
            });
          }
        }
      }
      
      // 3단계: 고객 조회 (검색어 필터 + 필터된 customer_id 적용)
      let customersQuery = supabase
        .from('customers')
        .select('id, name, phone, address, updated_at', { count: 'exact' });
      
      // 검색어 필터 적용
      if (searchTerm) {
        const cleanSearchTerm = searchTerm.replace(/[^0-9]/g, '');
        if (cleanSearchTerm.length > 0) {
          customersQuery = customersQuery.or(`name.ilike.%${searchTerm}%,phone.ilike.%${cleanSearchTerm}%,address.ilike.%${searchTerm}%`);
        } else {
          customersQuery = customersQuery.or(`name.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`);
        }
      }
      
      // 필터된 customer_id 적용 및 고객 조회
      let allCustomers: any[] = [];
      let totalWithFilters = 0;
      
      if (filteredCustomerIds && filteredCustomerIds.length > 0) {
        // 1000개씩 나눠서 처리 (Supabase .in() 제한 회피)
        const allFilteredCustomers: any[] = [];
        
        for (let i = 0; i < filteredCustomerIds.length; i += 1000) {
          const batch = filteredCustomerIds.slice(i, i + 1000);
          let batchQuery = supabase
            .from('customers')
            .select('id, name, phone, address, updated_at', { count: i === 0 ? 'exact' : undefined });
          
          // 검색어 필터 적용
          if (searchTerm) {
            const cleanSearchTerm = searchTerm.replace(/[^0-9]/g, '');
            if (cleanSearchTerm.length > 0) {
              batchQuery = batchQuery.or(`name.ilike.%${searchTerm}%,phone.ilike.%${cleanSearchTerm}%,address.ilike.%${searchTerm}%`);
            } else {
              batchQuery = batchQuery.or(`name.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`);
            }
          }
          
          batchQuery = batchQuery.in('id', batch);
          
          // 정렬 적용
          const sortColumn = ['name', 'address', 'updated_at'].includes(sortBy as string) 
            ? (sortBy as string) 
            : 'updated_at';
          const ascending = sortOrder === 'asc';
          batchQuery = batchQuery.order(sortColumn, { ascending });
          
          // 모든 데이터 조회 (페이지네이션은 나중에)
          const { data: batchCustomers } = await batchQuery;
          if (batchCustomers) {
            allFilteredCustomers.push(...batchCustomers);
          }
        }
        
        // 메모리에서 정렬 (배치별로 조회했으므로 다시 정렬 필요)
        const sortColumn = ['name', 'address', 'updated_at'].includes(sortBy as string) 
          ? (sortBy as string) 
          : 'updated_at';
        const ascending = sortOrder === 'asc';
        allFilteredCustomers.sort((a, b) => {
          let aValue: any = a[sortColumn] || '';
          let bValue: any = b[sortColumn] || '';
          
          if (sortColumn === 'updated_at') {
            aValue = aValue ? new Date(aValue).getTime() : 0;
            bValue = bValue ? new Date(bValue).getTime() : 0;
          }
          
          if (typeof aValue === 'string' && typeof bValue === 'string') {
            const comparison = aValue.localeCompare(bValue, 'ko');
            return ascending ? comparison : -comparison;
          } else {
            const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            return ascending ? comparison : -comparison;
          }
        });
        
        // 전체 개수 (검색어 필터는 배치 쿼리에서 이미 적용됨)
        totalWithFilters = allFilteredCustomers.length;
        console.log('[geocoding.ts] 필터 적용 후 전체 개수:', totalWithFilters);
        
        // 페이지네이션 적용
        allCustomers = allFilteredCustomers.slice(offsetNum, offsetNum + limitNum);
        console.log('[geocoding.ts] 페이지네이션 적용 후 개수:', allCustomers.length, `(offset: ${offsetNum}, limit: ${limitNum})`);
      } else {
        // 필터 조건이 없을 때는 기존 방식 사용
        // 검색어 필터 적용
        if (searchTerm) {
          const cleanSearchTerm = searchTerm.replace(/[^0-9]/g, '');
          if (cleanSearchTerm.length > 0) {
            customersQuery = customersQuery.or(`name.ilike.%${searchTerm}%,phone.ilike.%${cleanSearchTerm}%,address.ilike.%${searchTerm}%`);
          } else {
            customersQuery = customersQuery.or(`name.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`);
          }
        }
        
        // 정렬 적용
        const sortColumn = ['name', 'address', 'updated_at'].includes(sortBy as string) 
          ? (sortBy as string) 
          : 'updated_at';
        const ascending = sortOrder === 'asc';
        customersQuery = customersQuery.order(sortColumn, { ascending });
        
        // 전체 개수 조회 (필터 조건에 맞는)
        const { count } = await customersQuery;
        totalWithFilters = count || 0;
        console.log('[geocoding.ts] 필터 없을 때 전체 개수:', totalWithFilters);
        
        // 페이지네이션 적용
        const from = offsetNum;
        const to = offsetNum + limitNum - 1;
        customersQuery = customersQuery.range(from, to);
        
        // 고객 데이터 조회
        const { data, error: customersError } = await customersQuery;
        console.log('[geocoding.ts] 페이지네이션 적용 후 개수:', data?.length || 0, `(offset: ${offsetNum}, limit: ${limitNum})`);
        
        if (customersError) {
          throw new Error(`고객 조회 실패: ${customersError.message}`);
        }
        
        allCustomers = data || [];
      }
      
      if (!allCustomers || allCustomers.length === 0) {
        return res.status(200).json({
          success: true,
          data: {
            customers: [],
            total: totalWithFilters || 0,
            totalAll: totalAllCustomers || 0
          }
        });
      }
      
      // 4단계: 설문 주소 조회 (현재 페이지 고객만)
      const customerPhones = allCustomers.map(c => c.phone?.replace(/[^0-9]/g, '')).filter(Boolean);
      const surveyMap = new Map<string, string>();
      
      // 1000개씩 나눠서 처리 (Supabase .in() 제한 회피)
      for (let i = 0; i < customerPhones.length; i += 1000) {
        const batch = customerPhones.slice(i, i + 1000);
        if (batch.length === 0) continue;
        
        const { data: surveyData } = await supabase
          .from('surveys')
          .select('phone, address')
          .in('phone', batch);
        
        surveyData?.forEach(s => {
          const phone = s.phone?.replace(/[^0-9]/g, '') || '';
          if (phone && s.address && isGeocodableAddress(s.address)) {
            surveyMap.set(phone, s.address);
          }
        });
      }
      
      // 5단계: Cache 정보 조회 (현재 페이지 고객만)
      const customerIds = allCustomers.map(c => c.id).filter(Boolean);
      const cacheMap = new Map<string, any>();
      
      // 1000개씩 나눠서 처리 (Supabase .in() 제한 회피)
      for (let i = 0; i < customerIds.length; i += 1000) {
        const batch = customerIds.slice(i, i + 1000);
        if (batch.length === 0) continue;
        
        const { data: cacheData } = await supabase
          .from('customer_address_cache')
          .select('*')
          .in('customer_id', batch);
        
        cacheData?.forEach(cache => {
          const key = `${cache.customer_id}_${cache.address || ''}`;
          cacheMap.set(key, cache);
        });
      }
      
      // 6단계: 고객 데이터와 cache 정보 병합
      const customersWithCache = allCustomers.map(customer => {
        const phone = customer.phone?.replace(/[^0-9]/g, '') || '';
        const surveyAddress = surveyMap.get(phone);
        const effectiveAddress = surveyAddress || customer.address || '';
        
        // Cache 정보 찾기 (customer_id와 effective_address로 매칭)
        const cacheKey = `${customer.id}_${effectiveAddress}`;
        const cache = cacheMap.get(cacheKey);
        
        // province 추출: cache → effective_address → customer_address 순서로 시도
        let province = cache?.province || null;
        if (!province && effectiveAddress) {
          province = extractProvince(effectiveAddress);
        }
        if (!province && customer.address) {
          province = extractProvince(customer.address);
        }
        
        return {
          customer_id: customer.id,
          name: customer.name,
          phone: customer.phone,
          customer_address: customer.address,
          survey_address: surveyAddress || null,
          effective_address: effectiveAddress,
          geocoding_status: cache?.geocoding_status || null,
          geocoding_error: cache?.geocoding_error || null,
          latitude: cache?.latitude || null,
          longitude: cache?.longitude || null,
          distance_km: cache?.distance_km || null,
          province: province,
          cache_updated_at: cache?.updated_at || null,
          updated_at: customer.updated_at
        };
      });
      
      // 7단계: 설문 주소 검색 (검색어가 있고 설문 주소에 포함된 경우)
      // 현재 페이지 고객만 처리하므로 추가 처리 불필요
      
      // 8단계: 정렬 (메모리에서 - distance, status 등은 cache에서 가져온 값)
      if (sortBy === 'distance' || sortBy === 'status') {
        customersWithCache.sort((a, b) => {
          let aValue: any;
          let bValue: any;
          
          if (sortBy === 'status') {
            const statusOrder: any = { 'success': 1, 'failed': 2, null: 3, undefined: 3, 'missing': 3 };
            aValue = statusOrder[a.geocoding_status] || 4;
            bValue = statusOrder[b.geocoding_status] || 4;
          } else if (sortBy === 'distance') {
            aValue = a.distance_km ?? Infinity;
            bValue = b.distance_km ?? Infinity;
          }
          
          const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
          return sortOrder === 'asc' ? comparison : -comparison;
        });
      }
      
      // 9단계: province가 null인 경우 주소에서 추출
      const processedData = customersWithCache.map((customer: any) => {
        if (!customer.province) {
          // effective_address에서 추출 시도
          let province = customer.effective_address ? extractProvince(customer.effective_address) : null;
          
          // effective_address에서 추출 실패한 경우 customer_address에서도 시도
          if (!province && customer.customer_address) {
            province = extractProvince(customer.customer_address);
          }
          
          if (province) {
            return {
              ...customer,
              province: province
            };
          }
        }
        return customer;
      });
      
      console.log('[geocoding.ts] 최종 응답:', {
        customersCount: processedData.length,
        total: totalWithFilters || 0,
        totalAll: totalAllCustomers || 0
      });
      
      return res.status(200).json({
        success: true,
        data: {
          customers: processedData,
          total: totalWithFilters || 0,
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

        return res.status(200).json({
          success: true,
          data: {
            geocoding_status: null,
            province: null,
            distance_km: null,
          },
          message: '플레이스홀더 주소가 저장되었습니다.',
        });
      }

      // 지오코딩 가능한 주소인지 확인
      if (!isGeocodableAddress(normalizedAddress)) {
        return res.status(400).json({ 
          success: false, 
          message: '지오코딩할 수 없는 주소입니다.' 
        });
      }

      // 고객 정보 조회 (전화번호로 설문 찾기)
      let customerPhone: string | null = null;
      let effectiveAddress = normalizedAddress;
      
      if (customerId) {
        const { data: customer } = await supabase
          .from('customers')
          .select('phone, address')
          .eq('id', customerId)
          .maybeSingle();
        customerPhone = customer?.phone || null;
        
        // 설문 주소 확인
        if (customerPhone) {
          const normalizedPhone = customerPhone.replace(/[^0-9]/g, '');
          const { data: survey } = await supabase
            .from('surveys')
            .select('address')
            .ilike('phone', `%${normalizedPhone}%`)
            .maybeSingle();
          
          if (survey?.address && isGeocodableAddress(survey.address)) {
            effectiveAddress = survey.address;
          }
        }
      }

      // 기존 캐시 확인
      const { data: existingCache } = await supabase
        .from('customer_address_cache')
        .select('*')
        .eq('customer_id', customerId)
        .eq('address', effectiveAddress)
        .maybeSingle();

      // 지오코딩 수행
      const coords = await getCoordinatesFromAddress(effectiveAddress);
      
      if (!coords) {
        // 지오코딩 실패
        const cacheData = {
          customer_id: customerId,
          address: effectiveAddress,
          geocoding_status: 'failed',
          geocoding_error: '주소를 찾을 수 없습니다.',
          latitude: null,
          longitude: null,
          distance_km: null,
          province: extractProvince(effectiveAddress),
        };

        if (existingCache) {
          await supabase
            .from('customer_address_cache')
            .update(cacheData)
            .eq('id', existingCache.id);
        } else {
          await supabase
            .from('customer_address_cache')
            .insert(cacheData);
        }

        return res.status(200).json({
          success: false,
          message: '주소를 찾을 수 없습니다.',
          data: cacheData,
        });
      }

      // 거리 계산
      const distance = calculateDistance(STORE_LAT, STORE_LNG, coords.lat, coords.lng);
      const province = extractProvince(effectiveAddress);

      // 캐시 저장 또는 업데이트
      const cacheData = {
        customer_id: customerId,
        address: effectiveAddress,
        geocoding_status: 'success',
        geocoding_error: null,
        latitude: coords.lat,
        longitude: coords.lng,
        distance_km: distance,
        province: province,
      };

      if (existingCache) {
        await supabase
          .from('customer_address_cache')
          .update(cacheData)
          .eq('id', existingCache.id);
      } else {
        await supabase
          .from('customer_address_cache')
          .insert(cacheData);
      }

      // 설문 주소도 동기화
      if (customerPhone) {
        const normalizedPhone = customerPhone.replace(/[^0-9]/g, '');
        try {
          await supabase
            .from('surveys')
            .update({ address: effectiveAddress })
            .ilike('phone', `%${normalizedPhone}%`);
        } catch (surveyError) {
          console.error('설문 주소 동기화 오류:', surveyError);
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          geocoding_status: 'success',
          latitude: coords.lat,
          longitude: coords.lng,
          distance_km: distance,
          province: province,
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
