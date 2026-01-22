import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // ✅ 인증 체크 추가 (고객 관리 카테고리 권한 필요)
  try {
    // 동적 import로 빌드 에러 방지 (경로 수정: pages/api/admin/customers/ -> lib/ = ../../../../lib)
    const { requireCategoryPermission } = await import('../../../../lib/api-auth');
    await requireCategoryPermission(req, res, 'customer');
  } catch (error: any) {
    // 모듈을 찾을 수 없는 경우 fallback 처리
    if (error?.message?.includes('Cannot find module') || error?.code === 'MODULE_NOT_FOUND') {
      console.error('api-auth 모듈을 찾을 수 없습니다. 기본 인증 체크를 수행합니다.');
      // 기본 인증 체크 (getServerSession 사용) (경로 수정: pages/api/admin/customers/ -> pages/api/auth/ = ../../auth)
      const { getServerSession } = await import('next-auth/next');
      const { authOptions } = await import('../../auth/[...nextauth]');
      const session = await getServerSession(req, res, authOptions);
      
      if (!session?.user) {
        return res.status(401).json({
          success: false,
          message: '인증이 필요합니다. 로그인해주세요.'
        });
      }
      
      // 에디터 이상 권한 체크
      const userRole = session.user.role;
      if (userRole !== 'admin' && userRole !== 'editor') {
        return res.status(403).json({
          success: false,
          message: '에디터 이상의 권한이 필요합니다.'
        });
      }
    } else {
      return; // requireCategoryPermission에서 이미 응답을 보냄
    }
  }

  try {
    // VIP 레벨 자동 업데이트 요청
    if (req.method === 'POST' && req.query.action === 'update-vip-levels') {
      // VIP 레벨 업데이트는 별도 API로 처리
      const updateRes = await fetch(`${req.headers.host ? `http://${req.headers.host}` : 'http://localhost:3000'}/api/admin/customers/update-vip-levels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const updateJson = await updateRes.json();
      return res.status(updateRes.status).json(updateJson);
    }

    if (req.method === 'GET') {
      const { 
        q = '', 
        page = '1', 
        pageSize = '100', 
        optout, 
        sortBy = 'updated_at', 
        sortOrder = 'desc',
        purchased, // 'true' = 구매자만, 'false' = 비구매자만, 없으면 전체
        purchaseYears, // '0-1', '1-3', '3-5', '5+' = 구매 경과 기간 (구매자용)
        contactYears, // '0-1', '1-3', '3-5', '5+' = 최근 연락/저장 내역 기간 (비구매자용)
        vipLevel, // 'bronze', 'silver', 'gold', 'platinum' = VIP 레벨
        contactDays // 최근 연락 일수(정수). 예: 7, 14, 30, 90
      } = req.query as Record<string, string>;
      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const sizeNum = Math.min(1000, Math.max(1, parseInt(pageSize as string, 10) || 100)); // 최대 1000개, 기본값 100개
      const from = (pageNum - 1) * sizeNum;
      const to = from + sizeNum - 1;

      // 정렬 컬럼 검증
      const allowedSortColumns = [
        'name', 'phone', 'updated_at', 'created_at', 
        'last_contact_date', 'last_purchase_date', 'first_purchase_date', 
        'last_service_date', 'vip_level',
        'latest_survey_date', 'latest_booking_date', 
        'survey_count', 'booking_count'
      ];
      const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'updated_at';
      const ascending = sortOrder === 'asc';

      let query = supabase.from('customers')
        .select('*', { count: 'exact' })
        .order(sortColumn, { ascending })
        .range(from, to);

      if (q && q.trim().length > 0) {
        // 검색어에서 전화번호 형식 정규화 (하이픈 제거)
        const searchTerm = q.trim();
        const cleanSearchTerm = searchTerm.replace(/[^0-9]/g, '');
        
        // Supabase의 or()는 여러 조건을 OR로 묶을 때 사용
        // 이름, 주소, 전화번호 중 하나라도 매치되면 검색
        if (cleanSearchTerm.length > 0) {
          // 숫자가 포함된 경우: 이름, 주소(원본), 전화번호(하이픈 제거)
          query = query.or(`name.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%,phone.ilike.%${cleanSearchTerm}%`);
        } else {
          // 숫자가 없는 경우: 이름, 주소만 검색
          query = query.or(`name.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`);
        }
      }
      
      // 구매자/비구매자 필터
      if (purchased === 'true') {
        // 구매자만: first_purchase_date 또는 last_purchase_date가 있으면
        query = query.or('first_purchase_date.not.is.null,last_purchase_date.not.is.null');
      } else if (purchased === 'false') {
        // 비구매자만: first_purchase_date와 last_purchase_date 모두 null
        query = query.is('first_purchase_date', null).is('last_purchase_date', null);
      }
      
      // 구매 경과 기간 필터 (last_purchase_date 기준)
      if (purchaseYears) {
        const now = new Date();
        
        if (purchaseYears === '0-1') {
          // 1년 미만: last_purchase_date >= 1년 전
          const oneYearAgo = new Date(now);
          oneYearAgo.setFullYear(now.getFullYear() - 1);
          const oneYearAgoStr = oneYearAgo.toISOString().slice(0, 10);
          query = query.gte('last_purchase_date', oneYearAgoStr);
        } else if (purchaseYears === '1-3') {
          // 1-3년: last_purchase_date >= 3년 전 AND < 1년 전
          const threeYearsAgo = new Date(now);
          threeYearsAgo.setFullYear(now.getFullYear() - 3);
          const oneYearAgo = new Date(now);
          oneYearAgo.setFullYear(now.getFullYear() - 1);
          query = query.gte('last_purchase_date', threeYearsAgo.toISOString().slice(0, 10))
                      .lt('last_purchase_date', oneYearAgo.toISOString().slice(0, 10));
        } else if (purchaseYears === '3-5') {
          // 3-5년: last_purchase_date >= 5년 전 AND < 3년 전
          const fiveYearsAgo = new Date(now);
          fiveYearsAgo.setFullYear(now.getFullYear() - 5);
          const threeYearsAgo = new Date(now);
          threeYearsAgo.setFullYear(now.getFullYear() - 3);
          query = query.gte('last_purchase_date', fiveYearsAgo.toISOString().slice(0, 10))
                      .lt('last_purchase_date', threeYearsAgo.toISOString().slice(0, 10));
        } else if (purchaseYears === '5+') {
          // 5년 이상: last_purchase_date < 5년 전
          const fiveYearsAgo = new Date(now);
          fiveYearsAgo.setFullYear(now.getFullYear() - 5);
          query = query.lt('last_purchase_date', fiveYearsAgo.toISOString().slice(0, 10));
        }
      }
      
      // 최근 연락/저장 내역 기간 필터 (비구매자용: last_contact_date 또는 first_inquiry_date 기준)
      if (contactYears) {
        const now = new Date();
        
        if (contactYears === '0-1') {
          // 1년 미만: last_contact_date 또는 first_inquiry_date >= 1년 전
          const oneYearAgo = new Date(now);
          oneYearAgo.setFullYear(now.getFullYear() - 1);
          const oneYearAgoStr = oneYearAgo.toISOString().slice(0, 10);
          // OR 조건: last_contact_date >= 1년 전 OR first_inquiry_date >= 1년 전
          query = query.or(`last_contact_date.gte.${oneYearAgoStr},first_inquiry_date.gte.${oneYearAgoStr}`);
        } else if (contactYears === '1-3') {
          // 1-3년: >= 3년 전 AND < 1년 전
          const threeYearsAgo = new Date(now);
          threeYearsAgo.setFullYear(now.getFullYear() - 3);
          const oneYearAgo = new Date(now);
          oneYearAgo.setFullYear(now.getFullYear() - 1);
          const threeYearsAgoStr = threeYearsAgo.toISOString().slice(0, 10);
          const oneYearAgoStr = oneYearAgo.toISOString().slice(0, 10);
          // (last_contact_date >= 3년 전 AND < 1년 전) OR (first_inquiry_date >= 3년 전 AND < 1년 전)
          // Supabase에서는 복잡한 OR 조건을 직접 지원하지 않으므로, 두 조건을 별도로 처리
          query = query.or(`last_contact_date.gte.${threeYearsAgoStr},first_inquiry_date.gte.${threeYearsAgoStr}`)
                      .lt('last_contact_date', oneYearAgoStr)
                      .lt('first_inquiry_date', oneYearAgoStr);
        } else if (contactYears === '3-5') {
          // 3-5년: >= 5년 전 AND < 3년 전
          const fiveYearsAgo = new Date(now);
          fiveYearsAgo.setFullYear(now.getFullYear() - 5);
          const threeYearsAgo = new Date(now);
          threeYearsAgo.setFullYear(now.getFullYear() - 3);
          const fiveYearsAgoStr = fiveYearsAgo.toISOString().slice(0, 10);
          const threeYearsAgoStr = threeYearsAgo.toISOString().slice(0, 10);
          query = query.or(`last_contact_date.gte.${fiveYearsAgoStr},first_inquiry_date.gte.${fiveYearsAgoStr}`)
                      .lt('last_contact_date', threeYearsAgoStr)
                      .lt('first_inquiry_date', threeYearsAgoStr);
        } else if (contactYears === '5+') {
          // 5년 이상: < 5년 전
          const fiveYearsAgo = new Date(now);
          fiveYearsAgo.setFullYear(now.getFullYear() - 5);
          const fiveYearsAgoStr = fiveYearsAgo.toISOString().slice(0, 10);
          // last_contact_date < 5년 전 OR first_inquiry_date < 5년 전
          query = query.or(`last_contact_date.lt.${fiveYearsAgoStr},first_inquiry_date.lt.${fiveYearsAgoStr}`);
        }
      }

      // 최근 연락 일수(contactDays) 필터: last_contact_date 또는 first_inquiry_date가 N일 이내
      if (contactDays) {
        const daysNum = Math.max(1, parseInt(contactDays as string, 10) || 0);
        if (daysNum > 0) {
          const now = new Date();
          const since = new Date(now.getTime() - daysNum * 24 * 60 * 60 * 1000);
          const sinceStr = since.toISOString().slice(0, 10);
          // OR 조건으로 최근 연락 또는 최초 문의 기준
          query = query.or(`last_contact_date.gte.${sinceStr},first_inquiry_date.gte.${sinceStr}`);
        }
      }
      
      // VIP 레벨 필터
      if (vipLevel) {
        query = query.eq('vip_level', vipLevel);
      }
      
      if (typeof optout !== 'undefined') {
        query = query.eq('opt_out', optout === 'true');
      }

      // 이미지가 있는 고객만 필터링
      if (req.query.hasImages === 'true') {
        // tags 배열에서 customer-{id} 패턴을 찾아서 고객 ID 추출
        const { data: allImages, error: imagesError } = await supabase
          .from('image_metadata')
          .select('tags')
          .not('tags', 'is', null);
        
        if (!imagesError && allImages && allImages.length > 0) {
          // tags 배열에서 customer-{id} 패턴 추출
          const customerIds = new Set<number>();
          
          allImages.forEach((img: any) => {
            if (img.tags && Array.isArray(img.tags)) {
              img.tags.forEach((tag: string) => {
                if (typeof tag === 'string' && tag.startsWith('customer-')) {
                  const customerId = parseInt(tag.replace('customer-', ''), 10);
                  if (!isNaN(customerId)) {
                    customerIds.add(customerId);
                  }
                }
              });
            }
          });
          
          const customerIdArray = Array.from(customerIds);
          
          if (customerIdArray.length > 0) {
            query = query.in('id', customerIdArray);
          } else {
            // 이미지가 있는 고객이 없으면 빈 결과 반환
            return res.status(200).json({ 
              success: true, 
              data: [], 
              count: 0, 
              page: pageNum, 
              pageSize: sizeNum 
            });
          }
        } else {
          // 이미지가 없으면 빈 결과 반환
          return res.status(200).json({ 
            success: true, 
            data: [], 
            count: 0, 
            page: pageNum, 
            pageSize: sizeNum 
          });
        }
      }

      const { data, error, count } = await query;
      if (error) return res.status(500).json({ success: false, message: error.message });
      
      // 전화번호 목록만 필요할 때 (compare=true 파라미터)
      if (req.query.compare === 'true') {
        const phones = (data || []).map(c => c.phone);
        return res.status(200).json({ success: true, phones, count: phones.length });
      }
      
      // 각 고객의 썸네일 이미지 조회 (대표 이미지 우선)
      if (data && data.length > 0) {
        const customerIds = data.map(c => c.id);
        
        // 고객별 썸네일 조회 (대표 이미지 우선, 없으면 최신 이미지)
        // 각 고객의 folder_name도 함께 조회하여 정확한 필터링
        const customerInfoMap = new Map();
        const { data: customerInfos } = await supabase
          .from('customers')
          .select('id, folder_name')
          .in('id', customerIds);
        
        customerInfos?.forEach((c: any) => {
          customerInfoMap.set(c.id, c.folder_name);
        });

        // 동영상 확장자 목록
        const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif', '.bmp'];
        
        // 이미지 URL이 이미지인지 확인하는 함수
        const isImage = (url: string): boolean => {
          if (!url) return false;
          const lowerUrl = url.toLowerCase();
          // 동영상 확장자 체크
          if (videoExtensions.some(ext => lowerUrl.includes(ext))) {
            return false;
          }
          // 이미지 확장자 체크
          const extMatch = lowerUrl.match(/\.([a-z0-9]+)(\?|$)/i);
          if (extMatch) {
            const ext = `.${extMatch[1]}`;
            return imageExtensions.includes(ext);
          }
          // 확장자가 없거나 확인 불가능한 경우, 동영상 확장자가 없으면 이미지로 간주
          return !videoExtensions.some(ext => lowerUrl.includes(ext));
        };

        const thumbnailPromises = customerIds.map(async (customerId) => {
          const folderName = customerInfoMap.get(customerId);
          
          // 고객별 이미지 조회 쿼리 생성 (tags 또는 folder_path로 필터링)
          let query = supabase
            .from('image_metadata')
            .select('image_url');
          
          // tags와 folder_path 모두 확인
          if (folderName) {
            query = query.or(`tags.cs.{customer-${customerId}},folder_path.ilike.%customers/${folderName}%`);
          } else {
            query = query.contains('tags', [`customer-${customerId}`]);
          }
          
          // 동영상 제외: NOT LIKE로 동영상 확장자 제외
          query = query.not('image_url', 'ilike', '%.mp4%')
            .not('image_url', 'ilike', '%.mov%')
            .not('image_url', 'ilike', '%.avi%')
            .not('image_url', 'ilike', '%.webm%')
            .not('image_url', 'ilike', '%.mkv%');
          
          // 1순위: 대표 이미지 조회 (is_scene_representative = true)
          const { data: representativeImages } = await query
            .eq('is_scene_representative', true)
            .order('created_at', { ascending: false })
            .limit(10); // 여러 개 가져와서 필터링
          
          if (representativeImages && representativeImages.length > 0) {
            // 확장자로 이미지만 필터링
            const imageOnly = representativeImages.filter(img => isImage(img.image_url));
            if (imageOnly.length > 0) {
              return {
                customerId,
                thumbnailUrl: imageOnly[0].image_url
              };
            }
          }
          
          // 2순위: 최신 이미지 조회 (대표 이미지가 없는 경우)
          // 쿼리 다시 생성 (이전 쿼리가 이미 실행됨)
          let latestQuery = supabase
            .from('image_metadata')
            .select('image_url');
          
          if (folderName) {
            latestQuery = latestQuery.or(`tags.cs.{customer-${customerId}},folder_path.ilike.%customers/${folderName}%`);
          } else {
            latestQuery = latestQuery.contains('tags', [`customer-${customerId}`]);
          }
          
          // 동영상 제외
          latestQuery = latestQuery.not('image_url', 'ilike', '%.mp4%')
            .not('image_url', 'ilike', '%.mov%')
            .not('image_url', 'ilike', '%.avi%')
            .not('image_url', 'ilike', '%.webm%')
            .not('image_url', 'ilike', '%.mkv%');
          
          const { data: latestImages } = await latestQuery
            .order('created_at', { ascending: false })
            .limit(10); // 여러 개 가져와서 필터링
          
          if (latestImages && latestImages.length > 0) {
            // 확장자로 이미지만 필터링
            const imageOnly = latestImages.filter(img => isImage(img.image_url));
            return {
              customerId,
              thumbnailUrl: imageOnly.length > 0 ? imageOnly[0].image_url : null
            };
          }
          
          return {
            customerId,
            thumbnailUrl: null
          };
        });
        
        const thumbnails = await Promise.all(thumbnailPromises);
        const thumbnailMap = new Map(thumbnails.map(t => [t.customerId, t.thumbnailUrl]));
        
        // 고객 데이터에 썸네일 추가
        const customersWithThumbnails = data.map(customer => ({
          ...customer,
          thumbnailUrl: thumbnailMap.get(customer.id) || null
        }));
        
        // 예약 및 설문 정보 조회 (실시간 계산 - 최적화: 한 번에 조회 후 메모리에서 처리)
        // customerIds는 이미 위에서 선언되었으므로 재사용 (필터링만 추가)
        const customerPhones = customersWithThumbnails.map(c => c.phone?.replace(/[^0-9]/g, '')).filter(Boolean);
        const customerIdsFiltered = customerIds.filter(Boolean);
        
        // 전화번호 → 고객 ID 매핑
        const phoneToCustomerMap = new Map<string, number>();
        customersWithThumbnails.forEach(c => {
          const phone = c.phone?.replace(/[^0-9]/g, '');
          if (phone) phoneToCustomerMap.set(phone, c.id);
        });
        
        // 오늘 날짜 (한국 시간 기준)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];
        
        // 예약 정보 조회: customer_profile_id와 phone 모두로 한 번에 조회
        const bookingMap = new Map<number, { nextBookingDate: string | null; latestBookingDate: string | null }>();
        
        if (customerIdsFiltered.length > 0 || customerPhones.length > 0) {
          // customer_profile_id로 조회 (배치 처리)
          const allBookings: any[] = [];
          
          if (customerIdsFiltered.length > 0) {
            for (let i = 0; i < customerIdsFiltered.length; i += 1000) {
              const batch = customerIdsFiltered.slice(i, i + 1000);
              const { data: bookings } = await supabase
                .from('bookings')
                .select('date, customer_profile_id, phone')
                .in('customer_profile_id', batch);
              
              if (bookings) allBookings.push(...bookings);
            }
          }
          
          // 전화번호로도 조회 (customer_profile_id가 없는 예약 포함)
          if (customerPhones.length > 0) {
            for (let i = 0; i < customerPhones.length; i += 1000) {
              const batch = customerPhones.slice(i, i + 1000);
              const { data: bookingsByPhone } = await supabase
                .from('bookings')
                .select('date, phone, customer_profile_id')
                .in('phone', batch);
              
              if (bookingsByPhone) {
                // 중복 제거: customer_profile_id가 있는 것은 이미 조회했으므로 제외
                const newBookings = bookingsByPhone.filter(b => !b.customer_profile_id || !customerIds.includes(b.customer_profile_id));
                allBookings.push(...newBookings);
              }
            }
          }
          
          // 메모리에서 고객별로 그룹화 및 계산
          const bookingsByCustomer = new Map<number, string[]>();
          allBookings.forEach(b => {
            let customerId: number | null = null;
            
            // customer_profile_id 우선
            if (b.customer_profile_id && customerIdsFiltered.includes(b.customer_profile_id)) {
              customerId = b.customer_profile_id;
            } else {
              // 전화번호로 매칭
              const phone = b.phone?.replace(/[^0-9]/g, '') || '';
              if (phone) {
                customerId = phoneToCustomerMap.get(phone) || null;
              }
            }
            
            if (customerId) {
              if (!bookingsByCustomer.has(customerId)) {
                bookingsByCustomer.set(customerId, []);
              }
              bookingsByCustomer.get(customerId)!.push(b.date);
            }
          });
          
          // 각 고객의 미래 예약과 최신 예약 계산
          bookingsByCustomer.forEach((dates, customerId) => {
            // 중복 제거 및 정렬
            const uniqueDates = Array.from(new Set(dates));
            const sortedDates = uniqueDates.sort((a, b) => b.localeCompare(a)); // 내림차순
            const futureDates = sortedDates.filter(d => d >= todayStr);
            const nextBookingDate = futureDates.length > 0 
              ? futureDates.sort((a, b) => a.localeCompare(b))[0] // 오름차순으로 정렬하여 가장 가까운 날짜
              : null;
            const latestBookingDate = sortedDates[0] || null;
            
            bookingMap.set(customerId, { nextBookingDate, latestBookingDate });
          });
        }
        
        // 설문 정보 조회: 배치로 조회 (1000개씩)
        const surveyMap = new Map<string, string | null>();
        
        if (customerPhones.length > 0) {
          for (let i = 0; i < customerPhones.length; i += 1000) {
            const batch = customerPhones.slice(i, i + 1000);
            const { data: surveys } = await supabase
              .from('surveys')
              .select('created_at, phone')
              .in('phone', batch);
            
            if (surveys) {
              // 전화번호별로 최신 설문 날짜 찾기
              surveys.forEach(s => {
                const phone = s.phone?.replace(/[^0-9]/g, '') || '';
                if (phone && s.created_at) {
                  const surveyDate = s.created_at.split('T')[0];
                  const existing = surveyMap.get(phone);
                  if (!existing || surveyDate > existing) {
                    surveyMap.set(phone, surveyDate);
                  }
                }
              });
            }
          }
        }
        
        // 고객 데이터에 예약 및 설문 정보 추가
        const customersWithBookingAndSurvey = customersWithThumbnails.map(customer => {
          const bookingInfo = bookingMap.get(customer.id);
          const phone = customer.phone?.replace(/[^0-9]/g, '') || '';
          const latestSurveyDate = surveyMap.get(phone) || null;
          
          // 기존 latest_booking_date와 비교하여 더 최신인 것 사용
          const existingLatestBookingDate = customer.latest_booking_date;
          const computedLatestBookingDate = bookingInfo?.latestBookingDate || null;
          const finalLatestBookingDate = (existingLatestBookingDate && computedLatestBookingDate)
            ? (existingLatestBookingDate > computedLatestBookingDate ? existingLatestBookingDate : computedLatestBookingDate)
            : (computedLatestBookingDate || existingLatestBookingDate);
          
          return {
            ...customer,
            next_booking_date: bookingInfo?.nextBookingDate || null,
            latest_booking_date: finalLatestBookingDate,
            latest_survey_date: latestSurveyDate || customer.latest_survey_date || null
          };
        });
        
        return res.status(200).json({ 
          success: true, 
          data: customersWithBookingAndSurvey, 
          count, 
          page: pageNum, 
          pageSize: sizeNum 
        });
      }
      
      return res.status(200).json({ success: true, data, count, page: pageNum, pageSize: sizeNum });
    }

    if (req.method === 'POST') {
      // Create - 개별 고객 추가
      const { name, phone, address, first_inquiry_date, first_purchase_date, last_purchase_date, last_service_date, last_contact_date } = req.body || {};
      
      if (!name || !phone) {
        return res.status(400).json({ success: false, message: '이름과 전화번호는 필수입니다.' });
      }

      // 전화번호 정규화
      const cleanPhone = String(phone).replace(/[^0-9]/g, '');
      if (cleanPhone.length < 10 || cleanPhone.length > 11) {
        return res.status(400).json({ success: false, message: '전화번호는 10-11자리 숫자여야 합니다.' });
      }

      // 신규 고객 등록 시 최근 연락일을 현재 시간으로 자동 설정
      const now = new Date().toISOString();

      // 날짜 필드 처리: 날짜만 있는 경우 시간을 00:00:00으로 설정 (한국 시간 기준)
      const dateFields = {
        first_inquiry_date,
        first_purchase_date,
        last_purchase_date,
        last_service_date,
        last_contact_date: last_contact_date || null
      };

      const processedDates: any = {};
      for (const [field, value] of Object.entries(dateFields)) {
        if (value && typeof value === 'string') {
          // 날짜만 있는 경우 (YYYY-MM-DD 형식)
          if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            // 한국 시간대 기준으로 00:00:00으로 설정
            processedDates[field] = `${value}T00:00:00+09:00`;
          } else {
            processedDates[field] = value;
          }
        } else {
          processedDates[field] = value;
        }
      }

      // last_contact_date가 없으면 현재 시간으로 설정
      if (!processedDates.last_contact_date) {
        processedDates.last_contact_date = now;
      }

      const { data, error } = await supabase
        .from('customers')
        .insert({
          name,
          phone: cleanPhone,
          address: address || null,
          first_inquiry_date: processedDates.first_inquiry_date || null,
          first_purchase_date: processedDates.first_purchase_date || null,
          last_purchase_date: processedDates.last_purchase_date || null,
          last_service_date: processedDates.last_service_date || null,
          last_contact_date: processedDates.last_contact_date,
          opt_out: false,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          return res.status(400).json({ success: false, message: '이미 존재하는 전화번호입니다.' });
        }
        return res.status(500).json({ success: false, message: error.message });
      }
      return res.status(200).json({ success: true, data });
    }

    if (req.method === 'PATCH') {
      // Update - 고객 정보 수정
      const { id, update } = req.body || {};
      if (!id || !update) return res.status(400).json({ success: false, message: 'id와 update가 필요합니다.' });
      
      // 전화번호 정규화
      if (update.phone) {
        const cleanPhone = String(update.phone).replace(/[^0-9]/g, '');
        if (cleanPhone.length < 10 || cleanPhone.length > 11) {
          return res.status(400).json({ success: false, message: '전화번호는 10-11자리 숫자여야 합니다.' });
        }
        update.phone = cleanPhone;
      }

      // 날짜 필드 처리: 날짜만 있는 경우 시간을 00:00:00으로 설정 (한국 시간 기준)
      const dateFields = ['first_inquiry_date', 'first_purchase_date', 'last_purchase_date', 'last_service_date', 'last_contact_date'];
      for (const field of dateFields) {
        if (update[field] && typeof update[field] === 'string') {
          // 날짜만 있는 경우 (YYYY-MM-DD 형식)
          if (/^\d{4}-\d{2}-\d{2}$/.test(update[field])) {
            // 한국 시간대 기준으로 00:00:00으로 설정
            update[field] = `${update[field]}T00:00:00+09:00`;
          }
        }
      }

      // TODO: 나중에 판매 히스토리/서비스 히스토리 추가 시 
      // 해당 히스토리 생성 시 last_contact_date를 자동으로 현재 시간으로 업데이트하도록 구현
      // 예: purchase_events 테이블에 INSERT 시 trigger로 자동 업데이트
      // 예: service_events 테이블에 INSERT 시 trigger로 자동 업데이트

      update.updated_at = new Date().toISOString();
      
      // 고객 이름이 변경된 경우, 같은 전화번호를 가진 모든 예약의 이름도 자동 업데이트
      if (update.name) {
        // 먼저 현재 고객 정보 조회 (전화번호 확인용)
        const { data: currentCustomer } = await supabase
          .from('customers')
          .select('phone')
          .eq('id', id)
          .single();
        
        if (currentCustomer && currentCustomer.phone) {
          // 같은 전화번호를 가진 모든 예약의 이름 업데이트
          const { error: bookingUpdateError } = await supabase
            .from('bookings')
            .update({ name: update.name })
            .eq('phone', currentCustomer.phone);
          
          if (bookingUpdateError) {
            console.error('예약 이름 동기화 오류:', bookingUpdateError);
            // 예약 업데이트 실패해도 고객 업데이트는 계속 진행
          }
        }
      }

      // 주소가 변경된 경우, 같은 전화번호를 가진 설문의 주소도 자동 업데이트
      if (update.address !== undefined) {
        // 먼저 현재 고객 정보 조회 (전화번호 확인용)
        const { data: currentCustomer } = await supabase
          .from('customers')
          .select('phone')
          .eq('id', id)
          .single();
        
        if (currentCustomer && currentCustomer.phone) {
          // 같은 전화번호를 가진 모든 설문의 주소 업데이트
          const { error: surveyUpdateError } = await supabase
            .from('surveys')
            .update({ address: update.address || null })
            .eq('phone', currentCustomer.phone);
          
          if (surveyUpdateError) {
            console.error('설문 주소 동기화 오류:', surveyUpdateError);
            // 설문 업데이트 실패해도 고객 업데이트는 계속 진행
          }
        }
      }
      
      const { data, error } = await supabase.from('customers').update(update).eq('id', id).select().single();
      if (error) return res.status(500).json({ success: false, message: error.message });
      return res.status(200).json({ success: true, data });
    }

    if (req.method === 'DELETE') {
      // Delete - 고객 삭제
      const { id } = req.query as Record<string, string>;
      if (!id) return res.status(400).json({ success: false, message: 'id가 필요합니다.' });
      
      const hardDelete = req.headers['x-hard-delete'] === 'true';
      
      // 하드 삭제인 경우: bookings의 customer_profile_id를 null로 설정 후 삭제
      if (hardDelete) {
        // bookings의 customer_profile_id를 null로 설정
        const { error: updateBookingsError } = await supabase
          .from('bookings')
          .update({ customer_profile_id: null })
          .eq('customer_profile_id', id);
        
        if (updateBookingsError) {
          console.error('❌ bookings 업데이트 오류:', updateBookingsError);
          return res.status(500).json({ 
            success: false, 
            message: '예약 정보 업데이트 실패: ' + updateBookingsError.message 
          });
        }
        
        // 고객 삭제
        const { error: deleteError } = await supabase
          .from('customers')
          .delete()
          .eq('id', id);
        
        if (deleteError) {
          return res.status(500).json({ 
            success: false, 
            message: deleteError.message 
          });
        }
        
        return res.status(200).json({ 
          success: true, 
          message: '고객이 완전히 삭제되었습니다. (예약 이력은 유지됩니다.)' 
        });
      } else {
        // 소프트 삭제: is_deleted 플래그 설정 (컬럼이 있는 경우)
        // 먼저 일반 삭제 시도
        const { error: deleteError } = await supabase
          .from('customers')
          .delete()
          .eq('id', id);
        
        if (deleteError) {
          // 외래키 제약조건 오류인 경우 안내 메시지
          if (deleteError.message.includes('foreign key') || deleteError.message.includes('bookings')) {
            return res.status(400).json({ 
              success: false, 
              message: '시타 이력이 있는 고객은 삭제할 수 없습니다. 고객 병합 기능을 사용하거나 하드 삭제를 시도하세요.',
              hasBookings: true,
              suggestion: '고객 병합 API를 사용하거나 X-Hard-Delete: true 헤더를 추가하여 삭제하세요.'
            });
          }
          
          return res.status(500).json({ 
            success: false, 
            message: deleteError.message 
          });
        }
        
        return res.status(200).json({ 
          success: true, 
          message: '고객이 삭제되었습니다.' 
        });
      }
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
}
