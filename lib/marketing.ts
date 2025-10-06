import { createClient } from '@supabase/supabase-js';

export const createServiceSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  if (!url || !serviceKey) {
    throw new Error('Supabase 환경변수가 누락되었습니다. (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
  }
  return createClient(url, serviceKey);
};

export type DateRange = { start: Date; end: Date };

export const getDateRange = (period: string | string[] | undefined): DateRange => {
  const end = new Date();
  const start = new Date();
  const p = Array.isArray(period) ? period[0] : period;
  switch (p) {
    case '1d':
      start.setDate(end.getDate() - 1); break;
    case '7d':
    default:
      start.setDate(end.getDate() - 7); break;
    case '30d':
      start.setDate(end.getDate() - 30); break;
    case '90d':
      start.setDate(end.getDate() - 90); break;
  }
  return { start, end };
};


