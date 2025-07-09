import { useEffect } from 'react';

interface ConversionTrackerProps {
  type: 'booking' | 'inquiry' | 'purchase';
  campaignId?: string;
  value?: number;
  supabase: any;
}

export function ConversionTracker({ type, campaignId, value, supabase }: ConversionTrackerProps) {
  useEffect(() => {
    if (!supabase) return;
    
    const trackConversion = async () => {
      try {
        // 세션 ID 가져오기
        const sessionId = sessionStorage.getItem('session_id') || 'unknown';
        
        // UTM 파라미터 가져오기 (저장해둔 것)
        const savedUTM = JSON.parse(sessionStorage.getItem('utm_params') || '{}');
        
        // 전환 데이터
        const conversionData = {
          conversion_type: type,
          campaign_id: campaignId || savedUTM.utm_campaign || 'direct',
          session_id: sessionId,
          conversion_value: value || 0,
          utm_source: savedUTM.utm_source || '',
          utm_medium: savedUTM.utm_medium || '',
          utm_campaign: savedUTM.utm_campaign || '',
          page_url: window.location.pathname
        };
        
        // Supabase에 저장
        const { error } = await supabase
          .from('conversions')
          .insert(conversionData);
          
        if (error) {
          console.error('전환 추적 오류:', error);
        } else {
          console.log(`${type} 전환 추적 성공`);
        }
        
        // Google Analytics 전환 이벤트
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'conversion', {
            send_to: 'AW-YOUR_CONVERSION_ID/YOUR_CONVERSION_LABEL',
            value: value || 0,
            currency: 'KRW',
            transaction_id: sessionId,
            conversion_type: type
          });
        }
        
        // Facebook Pixel 이벤트 (선택사항)
        if (typeof window !== 'undefined' && (window as any).fbq) {
          const eventName = type === 'booking' ? 'Schedule' : 
                          type === 'inquiry' ? 'Contact' : 
                          'Purchase';
          (window as any).fbq('track', eventName, {
            value: value || 0,
            currency: 'KRW',
            content_type: 'product',
            content_ids: [campaignId]
          });
        }
        
      } catch (error) {
        console.error('전환 추적 중 오류:', error);
      }
    };
    
    trackConversion();
  }, [type, campaignId, value, supabase]);
  
  return null;
}
