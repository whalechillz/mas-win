import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

      const { data, error, count } = await query;
      if (error) return res.status(500).json({ success: false, message: error.message });
      
      // 전화번호 목록만 필요할 때 (compare=true 파라미터)
      if (req.query.compare === 'true') {
        const phones = (data || []).map(c => c.phone);
        return res.status(200).json({ success: true, phones, count: phones.length });
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
      
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) return res.status(500).json({ success: false, message: error.message });
      return res.status(200).json({ success: true, message: '고객이 삭제되었습니다.' });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
}
