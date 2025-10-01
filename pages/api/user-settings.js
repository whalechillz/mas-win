/**
 * 사용자 설정 관리 API
 * 콘텐츠 유형, 브랜드 전략, AI 모델 설정 등을 관리
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // CORS 헤더 추가
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action, settings } = req.body;

    switch (action) {
      case 'get':
        return await getSettings(res);
      
      case 'update':
        return await updateSettings(settings, res);
      
      case 'get-presets':
        return await getPresets(res);
      
      case 'save-preset':
        return await savePreset(settings, res);
      
      case 'delete-preset':
        return await deletePreset(settings.presetId, res);
      
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error('사용자 설정 오류:', error);
    return res.status(500).json({ error: error.message });
  }
}

// 기본 설정 조회
async function getSettings(res) {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('id', 'default')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw error;
    }

    // 기본값 설정
    const defaultSettings = {
      id: 'default',
      autoDetectContentType: true,
      defaultContentType: 'golf',
      brandStrategy: {
        customerPersona: 'competitive_maintainer',
        customerChannel: 'local_customers',
        brandWeight: 'medium',
        audienceTemperature: 'warm'
      },
      aiSettings: {
        defaultModel: 'fal',
        imageCount: 1,
        quality: 'high'
      },
      contentTypeOverrides: {
        restaurant: {
          customerPersona: 'food_lover',
          brandWeight: 'low',
          audienceTemperature: 'neutral'
        },
        travel: {
          customerPersona: 'leisure_seeker',
          brandWeight: 'low',
          audienceTemperature: 'warm'
        },
        shopping: {
          customerPersona: 'value_seeker',
          brandWeight: 'high',
          audienceTemperature: 'neutral'
        }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const settings = data || defaultSettings;

    return res.status(200).json({
      success: true,
      settings
    });

  } catch (error) {
    throw error;
  }
}

// 설정 업데이트
async function updateSettings(newSettings, res) {
  try {
    const settings = {
      ...newSettings,
      id: 'default',
      updatedAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('user_settings')
      .upsert(settings)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      settings: data
    });

  } catch (error) {
    throw error;
  }
}

// 프리셋 목록 조회
async function getPresets(res) {
  try {
    const { data, error } = await supabase
      .from('user_presets')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      presets: data || []
    });

  } catch (error) {
    throw error;
  }
}

// 프리셋 저장
async function savePreset(presetData, res) {
  try {
    const preset = {
      ...presetData,
      id: presetData.id || `preset_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('user_presets')
      .upsert(preset)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      preset: data
    });

  } catch (error) {
    throw error;
  }
}

// 프리셋 삭제
async function deletePreset(presetId, res) {
  try {
    const { error } = await supabase
      .from('user_presets')
      .delete()
      .eq('id', presetId);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: '프리셋이 삭제되었습니다.'
    });

  } catch (error) {
    throw error;
  }
}
