import React, { useState, useEffect } from 'react';
import { IntegratedBlogManager } from './IntegratedBlogManager';

// 실제 데이터베이스와 연동된 버전
export const IntegratedBlogManagerWithData = ({ supabase }) => {
  const [contentPool, setContentPool] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContentPool();
  }, []);

  const loadContentPool = async () => {
    try {
      // content_ideas와 발행 정보 조인
      const { data, error } = await supabase
        .from('content_ideas')
        .select(`
          *,
          naver_publishing(*),
          website_publishing(*)
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        // 데이터 형식 변환
        const formattedData = data.map(item => ({
          id: item.id,
          title: item.title,
          status: item.status,
          keywords: item.target_keywords || [],
          platforms: {
            naver: {
              status: item.naver_publishing?.[0] ? 'published' : 'pending',
              accounts: []
            },
            website: {
              status: item.website_publishing?.[0]?.status || 'pending',
              date: item.website_publishing?.[0]?.scheduled_at
            }
          }
        }));
        
        setContentPool(formattedData);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  return <IntegratedBlogManager supabase={supabase} initialData={contentPool} onReload={loadContentPool} />;
};