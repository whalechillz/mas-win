// Killer Content Series Stats API
// /pages/api/content-calendar/killer-series/stats.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 임시 통계 데이터 (실제 구현에서는 DB에서 조회)
    const stats = {
      totalLeads: 1234,
      pdfDownloads: 456,
      emailSubscribers: 789,
      conversionRate: 18.5,
      
      byCategory: {
        distance: {
          leads: 456,
          conversionRate: 22.3,
          topContent: '비거리 향상 가이드 PDF'
        },
        health: {
          leads: 234,
          conversionRate: 15.2,
          topContent: '스트레칭 7선'
        },
        insurance: {
          leads: 345,
          conversionRate: 25.1,
          topContent: '드라이버 보험 가이드'
        },
        prestige: {
          leads: 199,
          conversionRate: 12.4,
          topContent: '골프 에티켓'
        }
      },
      
      recentLeads: [
        {
          id: '1',
          name: '김OO',
          email: 'kim**@gmail.com',
          phone: '010-****-5678',
          source: '비거리 향상 PDF',
          date: new Date().toISOString(),
          score: 85
        },
        {
          id: '2',
          name: '이OO',
          email: 'lee**@naver.com',
          phone: '010-****-1234',
          source: '드라이버 보험 가이드',
          date: new Date().toISOString(),
          score: 92
        }
      ],
      
      trends: {
        daily: [
          { date: '2024-01-15', leads: 45 },
          { date: '2024-01-16', leads: 52 },
          { date: '2024-01-17', leads: 48 },
          { date: '2024-01-18', leads: 61 },
          { date: '2024-01-19', leads: 57 },
          { date: '2024-01-20', leads: 63 }
        ]
      }
    };

    return res.status(200).json(stats);

  } catch (error: any) {
    console.error('Stats fetch error:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to fetch stats' 
    });
  }
}
