/**
 * 고급 프리셋 시스템
 * 시간대, 계절, 분위기별 프리셋 관리
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
    const { action, preset } = req.body;

    switch (action) {
      case 'get-presets':
        return await getPresets(res);
      
      case 'create-preset':
        return await createPreset(preset, res);
      
      case 'update-preset':
        return await updatePreset(preset, res);
      
      case 'delete-preset':
        return await deletePreset(preset.id, res);
      
      case 'get-recommended-preset':
        return await getRecommendedPreset(preset, res);
      
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error('고급 프리셋 시스템 오류:', error);
    return res.status(500).json({ error: error.message });
  }
}

// 프리셋 목록 조회
async function getPresets(res) {
  try {
    const { data, error } = await supabase
      .from('advanced_presets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      presets: data || []
    });

  } catch (error) {
    throw error;
  }
}

// 프리셋 생성
async function createPreset(presetData, res) {
  try {
    const preset = {
      id: presetData.id || `preset_${Date.now()}`,
      name: presetData.name,
      description: presetData.description,
      category: presetData.category, // golf, restaurant, travel, etc.
      time_of_day: presetData.timeOfDay, // morning, afternoon, evening, night
      season: presetData.season, // spring, summer, autumn, winter
      mood: presetData.mood, // professional, casual, elegant, cozy, energetic
      lighting: presetData.lighting, // natural, warm, cool, dramatic, soft
      color_scheme: presetData.colorScheme, // warm, cool, neutral, vibrant
      style: presetData.style, // modern, classic, minimalist, luxurious
      brand_strategy: presetData.brandStrategy,
      ai_settings: presetData.aiSettings,
      is_default: presetData.isDefault || false,
      usage_count: 0,
      success_rate: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('advanced_presets')
      .insert(preset)
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

// 프리셋 업데이트
async function updatePreset(presetData, res) {
  try {
    const updateData = {
      ...presetData,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('advanced_presets')
      .update(updateData)
      .eq('id', presetData.id)
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
      .from('advanced_presets')
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

// 추천 프리셋 조회
async function getRecommendedPreset(context, res) {
  try {
    const { contentType, timeOfDay, season, mood } = context;

    // 기본 프리셋들
    const defaultPresets = {
      golf: {
        morning: {
          name: '골프 아침 라운드',
          mood: 'energetic',
          lighting: 'natural',
          colorScheme: 'warm',
          style: 'professional',
          brandStrategy: {
            customerPersona: 'early_bird_golfer',
            brandWeight: 'medium',
            audienceTemperature: 'warm'
          }
        },
        afternoon: {
          name: '골프 오후 라운드',
          mood: 'professional',
          lighting: 'natural',
          colorScheme: 'neutral',
          style: 'classic',
          brandStrategy: {
            customerPersona: 'competitive_maintainer',
            brandWeight: 'high',
            audienceTemperature: 'neutral'
          }
        },
        evening: {
          name: '골프 저녁 라운드',
          mood: 'elegant',
          lighting: 'warm',
          colorScheme: 'warm',
          style: 'luxurious',
          brandStrategy: {
            customerPersona: 'premium_golfer',
            brandWeight: 'high',
            audienceTemperature: 'warm'
          }
        }
      },
      restaurant: {
        morning: {
          name: '아침 식사',
          mood: 'cozy',
          lighting: 'soft',
          colorScheme: 'warm',
          style: 'casual',
          brandStrategy: {
            customerPersona: 'food_lover',
            brandWeight: 'low',
            audienceTemperature: 'warm'
          }
        },
        afternoon: {
          name: '점심 식사',
          mood: 'professional',
          lighting: 'natural',
          colorScheme: 'neutral',
          style: 'modern',
          brandStrategy: {
            customerPersona: 'business_diner',
            brandWeight: 'medium',
            audienceTemperature: 'neutral'
          }
        },
        evening: {
          name: '저녁 식사',
          mood: 'elegant',
          lighting: 'dramatic',
          colorScheme: 'warm',
          style: 'luxurious',
          brandStrategy: {
            customerPersona: 'fine_dining_lover',
            brandWeight: 'high',
            audienceTemperature: 'warm'
          }
        }
      }
    };

    // 추천 프리셋 선택
    let recommendedPreset = defaultPresets[contentType]?.[timeOfDay] || defaultPresets[contentType]?.afternoon || {
      name: '기본 프리셋',
      mood: 'professional',
      lighting: 'natural',
      colorScheme: 'neutral',
      style: 'modern',
      brandStrategy: {
        customerPersona: 'general_audience',
        brandWeight: 'medium',
        audienceTemperature: 'neutral'
      }
    };

    // 계절별 조정
    if (season) {
      recommendedPreset = adjustForSeason(recommendedPreset, season);
    }

    // 분위기별 조정
    if (mood) {
      recommendedPreset = adjustForMood(recommendedPreset, mood);
    }

    return res.status(200).json({
      success: true,
      recommendedPreset,
      context: { contentType, timeOfDay, season, mood }
    });

  } catch (error) {
    throw error;
  }
}

// 계절별 조정
function adjustForSeason(preset, season) {
  const seasonAdjustments = {
    spring: {
      colorScheme: 'vibrant',
      mood: 'energetic',
      lighting: 'natural'
    },
    summer: {
      colorScheme: 'warm',
      mood: 'energetic',
      lighting: 'bright'
    },
    autumn: {
      colorScheme: 'warm',
      mood: 'cozy',
      lighting: 'soft'
    },
    winter: {
      colorScheme: 'cool',
      mood: 'elegant',
      lighting: 'dramatic'
    }
  };

  return {
    ...preset,
    ...seasonAdjustments[season],
    name: `${preset.name} (${season})`
  };
}

// 분위기별 조정
function adjustForMood(preset, mood) {
  const moodAdjustments = {
    professional: {
      style: 'modern',
      lighting: 'natural',
      colorScheme: 'neutral'
    },
    casual: {
      style: 'casual',
      lighting: 'soft',
      colorScheme: 'warm'
    },
    elegant: {
      style: 'luxurious',
      lighting: 'dramatic',
      colorScheme: 'cool'
    },
    cozy: {
      style: 'classic',
      lighting: 'warm',
      colorScheme: 'warm'
    },
    energetic: {
      style: 'modern',
      lighting: 'bright',
      colorScheme: 'vibrant'
    }
  };

  return {
    ...preset,
    ...moodAdjustments[mood],
    name: `${preset.name} (${mood})`
  };
}
