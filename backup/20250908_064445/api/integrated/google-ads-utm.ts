import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabase } from '../../../lib/supabase';

// UTM 태그 생성 헬퍼 함수
function generateUTMTags(campaign: any, channel: string = 'google_ads') {
  const baseUrl = campaign.landing_page_url || 'https://masgolf.co.kr';
  const campaignName = campaign.name.replace(/\s+/g, '_').toLowerCase();
  
  return {
    utm_source: 'google',
    utm_medium: 'cpc',
    utm_campaign: campaignName,
    utm_content: `${campaign.year}_${campaign.month}`,
    utm_term: campaign.theme?.replace(/\s+/g, '_').toLowerCase()
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerSupabase(req, res);

  // 인증 확인
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { method, query, body } = req;

  try {
    switch (method) {
      case 'GET':
        if (query.funnel_plan_id) {
          // 특정 퍼널 계획의 UTM 태그 조회
          const { data, error } = await supabase
            .from('google_ads_utm_tags')
            .select('*')
            .eq('funnel_plan_id', query.funnel_plan_id);

          if (error) throw error;

          return res.status(200).json({ data });
        } else if (query.campaign_id) {
          // 특정 캠페인의 UTM 태그 조회
          const { data, error } = await supabase
            .from('google_ads_utm_tags')
            .select('*')
            .eq('campaign_id', query.campaign_id);

          if (error) throw error;

          return res.status(200).json({ data });
        } else {
          // 전체 UTM 태그 목록
          const { data, error } = await supabase
            .from('google_ads_utm_tags')
            .select(`
              *,
              monthly_funnel_plans (
                year,
                month,
                theme
              ),
              campaigns (
                name,
                start_date,
                end_date
              )
            `)
            .order('created_at', { ascending: false });

          if (error) throw error;

          return res.status(200).json({ data });
        }

      case 'POST':
        // 새 UTM 태그 생성
        const { 
          funnel_plan_id,
          campaign_id,
          utm_source,
          utm_medium,
          utm_campaign,
          utm_content,
          utm_term,
          final_url,
          ad_creatives
        } = body;

        if (!final_url) {
          return res.status(400).json({ error: 'final_url은 필수입니다.' });
        }

        // 자동 UTM 태그 생성 옵션
        let utmTags = {
          utm_source: utm_source || 'google',
          utm_medium: utm_medium || 'cpc',
          utm_campaign: utm_campaign || '',
          utm_content: utm_content || '',
          utm_term: utm_term || ''
        };

        // 캠페인 정보로 UTM 태그 자동 생성
        if (campaign_id && !utm_campaign) {
          const { data: campaign } = await supabase
            .from('campaigns')
            .select(`
              *,
              monthly_themes (
                theme
              )
            `)
            .eq('id', campaign_id)
            .single();

          if (campaign) {
            const generatedTags = generateUTMTags({
              ...campaign,
              year: new Date(campaign.start_date).getFullYear(),
              month: new Date(campaign.start_date).getMonth() + 1,
              theme: campaign.monthly_themes?.theme
            });
            
            utmTags = {
              ...utmTags,
              ...generatedTags
            };
          }
        }

        const { data: newTag, error: createError } = await supabase
          .from('google_ads_utm_tags')
          .insert({
            funnel_plan_id,
            campaign_id,
            ...utmTags,
            final_url,
            ad_creatives: ad_creatives || []
          })
          .select()
          .single();

        if (createError) throw createError;

        return res.status(201).json({ data: newTag });

      case 'PUT':
        // UTM 태그 수정
        const { id } = query;
        if (!id) {
          return res.status(400).json({ error: 'ID가 필요합니다.' });
        }

        const updateData: any = {};
        
        // 업데이트할 필드만 추가
        if (body.utm_source !== undefined) updateData.utm_source = body.utm_source;
        if (body.utm_medium !== undefined) updateData.utm_medium = body.utm_medium;
        if (body.utm_campaign !== undefined) updateData.utm_campaign = body.utm_campaign;
        if (body.utm_content !== undefined) updateData.utm_content = body.utm_content;
        if (body.utm_term !== undefined) updateData.utm_term = body.utm_term;
        if (body.final_url !== undefined) updateData.final_url = body.final_url;
        if (body.ad_creatives !== undefined) updateData.ad_creatives = body.ad_creatives;

        const { data: updatedTag, error: updateError } = await supabase
          .from('google_ads_utm_tags')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;

        return res.status(200).json({ data: updatedTag });

      case 'DELETE':
        // UTM 태그 삭제
        const { id: deleteId } = query;
        if (!deleteId) {
          return res.status(400).json({ error: 'ID가 필요합니다.' });
        }

        const { error: deleteError } = await supabase
          .from('google_ads_utm_tags')
          .delete()
          .eq('id', deleteId);

        if (deleteError) throw deleteError;

        return res.status(200).json({ success: true });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error: any) {
    console.error('Google Ads UTM API Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal Server Error',
      details: error 
    });
  }
}
