import { CHANNEL_PRESETS, SourceType } from './channel-presets';

// 파일명을 스토리지 안전하게 변환 (영문/숫자/.-만 허용)
export const sanitizeFileName = (name: string) => {
  const trimmed = name.trim();
  const hasExt = /\.[A-Za-z0-9]+$/.test(trimmed);
  const base = trimmed.replace(/[^A-Za-z0-9._-]/g, '_');
  if (hasExt) return base;
  return `${base}.jpg`;
};

// WxH 포맷 문자열을 생성 (height가 0이면 W 가로 전용)
export const toSizeKey = (width: number, height: number) => {
  if (!height || height === 0) return `${width}w`;
  return `${width}x${height}`;
};

export const buildStoragePath = (params: {
  source: SourceType; // scraped|uploaded|generated|derived
  channel: keyof typeof CHANNEL_PRESETS; // blog|instagram|...
  date: string; // YYYY-MM-DD
  sizeKey: string; // presets의 key 또는 "WxH"/"Ww"
  fileName: string; // 확장자 포함, sanitize 권장
}) => {
  const { source, channel, date, sizeKey, fileName } = params;
  const safe = sanitizeFileName(fileName);
  return `${source}/${String(channel)}/${date}/${sizeKey}/${safe}`;
};

// 채널 프리셋으로부터 sizeKey 리스트를 빌드
export const getPresetSizeKeys = (channel: keyof typeof CHANNEL_PRESETS) => {
  const def = CHANNEL_PRESETS[channel];
  if (!def) return [] as string[];
  return def.sizes.map((s) => (s.height ? `${s.width}x${s.height}` : `${s.width}w`));
};


