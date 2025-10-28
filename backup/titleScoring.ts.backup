export type Persona =
  | 'distance_seeker'
  | 'competitive_maintainer'
  | 'beginner_senior'
  | 'local_customers'
  | 'unknown';

export type BrandWeight = 'low' | 'medium' | 'high';
export type ConversionGoal =
  | 'homepage_visit'
  | 'phone_consultation'
  | 'sita_booking'
  | 'purchase'
  | 'repurchase'
  | 'accessory_purchase';

export interface ScoreInput {
  title: string;
  persona: Persona;
  contentType: string;
  targetProduct: string;
  brandWeight: BrandWeight;
  conversionGoal: ConversionGoal;
}

export interface ScoreBreakdown {
  audienceMatch: number; // 0-100
  psychEffect: number; // 0-100
  brandFit: number; // 0-100
  conversionPotential: number; // 0-100
  total: number; // weighted sum
}

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

const POWER_WORDS = ['비밀', '방법', '단계', '리스트', '최대', '실제', '검증', '전문가', '후기', '지금', '한정', '업그레이드'];
const SOCIAL_PROOF = ['후기', '리뷰', '추천', '인기', '실제 고객', '데이터'];
const URGENCY = ['지금', '오늘', '마감', '한정', '마지막'];
const AUTHORITY = ['전문가', '연구', '데이터', '공식'];

function scoreAudienceMatch(title: string, persona: Persona, contentType: string): number {
  let s = 60;
  if (persona === 'competitive_maintainer' && /기록|성능|비거리|정확/.test(title)) s += 20;
  if (/후기|실제|경험/.test(title) && contentType.includes('후기')) s += 10;
  if (/초보|입문|처음/.test(title) && persona === 'beginner_senior') s += 15;
  return clamp(s);
}

function scorePsychEffect(title: string): number {
  let s = 40;
  if (/\d+/.test(title)) s += 15; // 숫자
  if (POWER_WORDS.some((w) => title.includes(w))) s += 15;
  if (SOCIAL_PROOF.some((w) => title.includes(w))) s += 10;
  if (URGENCY.some((w) => title.includes(w))) s += 10;
  if (AUTHORITY.some((w) => title.includes(w))) s += 10;
  return clamp(s);
}

function scoreBrandFit(title: string, brandWeight: BrandWeight): number {
  let s = 50;
  const hasProof = SOCIAL_PROOF.some((w) => title.includes(w)) || /\d+/.test(title);
  if (brandWeight === 'low' && hasProof) s += 25;
  if (brandWeight === 'high' && /공식|프리미엄|플래그십/.test(title)) s += 15;
  return clamp(s);
}

function scoreConversionPotential(title: string, goal: ConversionGoal): number {
  let s = 50;
  if (goal === 'phone_consultation' && /상담|문의|전화/.test(title)) s += 20;
  if (goal === 'sita_booking' && /시타|예약|체험/.test(title)) s += 25;
  if (goal === 'purchase' && /구매|특가|프로모션|한정/.test(title)) s += 25;
  return clamp(s);
}

export function scoreTitle(input: ScoreInput): ScoreBreakdown {
  const a = scoreAudienceMatch(input.title, input.persona, input.contentType);
  const p = scorePsychEffect(input.title);
  const b = scoreBrandFit(input.title, input.brandWeight);
  const c = scoreConversionPotential(input.title, input.conversionGoal);
  const total = Math.round(a * 0.4 + p * 0.3 + b * 0.2 + c * 0.1);
  return { audienceMatch: a, psychEffect: p, brandFit: b, conversionPotential: c, total };
}



