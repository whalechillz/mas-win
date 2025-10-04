// MASSGOO Content Calendar System - Type Definitions
// /types/index.ts

// =====================================================
// Core Types
// =====================================================

export type ContentType = 'blog' | 'social' | 'email' | 'funnel' | 'video';
export type ContentStatus = 'planned' | 'draft' | 'review' | 'approved' | 'published' | 'archived';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type Channel = 'blog' | 'instagram' | 'facebook' | 'youtube' | 'naver_blog' | 'email' | 'tiktok';

// =====================================================
// Content Calendar Types
// =====================================================

export interface ContentCalendarItem {
  id?: string;
  year: number;
  month: number;
  week: number;
  contentDate: Date;
  season: Season;
  theme: string;
  campaignId?: string;
  contentType: ContentType;
  title: string;
  subtitle?: string;
  description?: string;
  targetAudience: TargetAudience;
  keywords: string[];
  hashtags: string[];
  toneAndManner: ToneAndManner;
  contentBody?: string;
  contentHtml?: string;
  thumbnailUrl?: string;
  status: ContentStatus;
  priority: 1 | 2 | 3 | 4 | 5;
  assignedTo?: string;
  reviewedBy?: string;
  approvedBy?: string;
  publishedAt?: Date;
  publishedChannels: PublishedChannel[];
  performanceMetrics: PerformanceMetrics;
  seoMeta: SEOMeta;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TargetAudience {
  primary: string;
  secondary?: string;
  ageRange: string;
  interests: string[];
  painPoints: string[];
  goals: string[];
}

export interface ToneAndManner {
  tone: 'professional' | 'casual' | 'encouraging' | 'educational' | 'inspirational';
  voice: 'authoritative' | 'friendly' | 'supportive' | 'expert' | 'peer';
  style: string[];
  emotions: string[];
}

export interface PublishedChannel {
  channel: Channel;
  url?: string;
  publishedAt: Date;
  scheduledAt?: Date;
}

export interface PerformanceMetrics {
  views?: number;
  uniqueViews?: number;
  engagementRate?: number;
  clickThroughRate?: number;
  conversionRate?: number;
  revenue?: number;
  roi?: number;
}

export interface SEOMeta {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  canonicalUrl?: string;
}

// =====================================================
// Content Template Types
// =====================================================

export interface ContentTemplate {
  id?: string;
  templateName: string;
  contentType: ContentType;
  category?: string;
  structure: TemplateStructure;
  placeholders: Record<string, string>;
  toneKeywords: string[];
  sampleContent?: string;
  previewHtml?: string;
  usageCount: number;
  performanceScore?: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TemplateStructure {
  sections: TemplateSection[];
  metadata: TemplateMeta;
}

export interface TemplateSection {
  id: string;
  type: 'heading' | 'paragraph' | 'list' | 'image' | 'video' | 'cta' | 'quote';
  content?: string;
  placeholder?: string;
  required: boolean;
  order: number;
  options?: Record<string, any>;
}

export interface TemplateMeta {
  idealLength?: number;
  visualRatio?: number;
  readingTime?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

// =====================================================
// Brand Guidelines Types
// =====================================================

export interface BrandGuidelines {
  id?: string;
  category: string;
  guidelineType: 'tone' | 'visual' | 'content' | 'legal';
  doGuidelines: string[];
  dontGuidelines: string[];
  voiceAttributes: VoiceAttributes;
  visualGuidelines: VisualGuidelines;
  samplePhrases: string[];
  forbiddenWords: string[];
  powerWords: string[];
  colorPalette?: ColorPalette;
  fontGuidelines?: FontGuidelines;
  imageGuidelines?: ImageGuidelines;
  priority: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface VoiceAttributes {
  personality: string[];
  tone: string[];
  style: string[];
  values: string[];
}

export interface VisualGuidelines {
  layout: string;
  spacing: string;
  imagery: string;
  iconography: string;
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  neutral: string[];
  semantic: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

export interface FontGuidelines {
  heading: FontSpec;
  body: FontSpec;
  accent?: FontSpec;
}

export interface FontSpec {
  family: string;
  size: string;
  weight: string;
  lineHeight: string;
  letterSpacing?: string;
}

export interface ImageGuidelines {
  aspectRatios: string[];
  minResolution: string;
  maxFileSize: string;
  formats: string[];
  style: string;
}

// =====================================================
// Campaign Types
// =====================================================

export interface AnnualCampaign {
  id?: string;
  campaignId: string;
  campaignName: string;
  year: number;
  quarter?: 1 | 2 | 3 | 4;
  month?: number;
  startDate: Date;
  endDate: Date;
  theme: string;
  objectives: string[];
  targetMetrics: CampaignTargetMetrics;
  budget?: number;
  channels: Channel[];
  keyMessages: string[];
  contentPillars: ContentPillar[];
  status: 'planned' | 'active' | 'paused' | 'completed' | 'cancelled';
  actualMetrics?: CampaignActualMetrics;
  roi?: number;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CampaignTargetMetrics {
  reach: number;
  engagement: number;
  leads: number;
  conversions: number;
  revenue: number;
}

export interface CampaignActualMetrics extends CampaignTargetMetrics {
  achievementRate: number;
}

export interface ContentPillar {
  name: string;
  description: string;
  topics: string[];
  percentage: number;
}

// =====================================================
// Performance Analysis Types
// =====================================================

export interface ContentPerformance {
  id?: string;
  contentId: string;
  channel: Channel;
  measurementDate: Date;
  views: number;
  uniqueViews: number;
  engagementCount: number;
  engagementRate: number;
  clicks: number;
  clickThroughRate: number;
  conversions: number;
  conversionRate: number;
  revenueImpact: number;
  bounceRate?: number;
  avgTimeOnPage?: number;
  socialShares?: number;
  comments?: number;
  sentimentScore?: number;
  analyzedAt?: Date;
}

export interface PerformanceAnalysis {
  contentId: string;
  period: string;
  metrics: PerformanceMetrics;
  insights: PerformanceInsight[];
  recommendations: string[];
  score: number;
}

export interface PerformanceInsight {
  type: 'positive' | 'negative' | 'neutral';
  category: string;
  message: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
}

// =====================================================
// AI Generation Types
// =====================================================

export interface AIGenerationRequest {
  contentType: ContentType;
  topic: string;
  keywords?: string[];
  tone?: ToneAndManner;
  length?: number;
  template?: string;
  additionalContext?: string;
}

export interface AIGenerationLog {
  id?: string;
  contentId?: string;
  generationType: 'full' | 'outline' | 'headline' | 'image' | 'revision';
  prompt: string;
  modelUsed: string;
  parameters: Record<string, any>;
  generatedContent?: string;
  qualityScore?: number;
  tokensUsed?: number;
  cost?: number;
  errorMessage?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt?: Date;
}

// =====================================================
// Collaboration Types
// =====================================================

export interface ContentCollaboration {
  id?: string;
  contentId: string;
  userEmail: string;
  userName?: string;
  action: CollaborationAction;
  comment?: string;
  attachments?: Attachment[];
  createdAt?: Date;
}

export type CollaborationAction = 
  | 'created' 
  | 'edited' 
  | 'commented' 
  | 'approved' 
  | 'rejected' 
  | 'published' 
  | 'archived'
  | 'assigned'
  | 'unassigned';

export interface Attachment {
  filename: string;
  url: string;
  size: number;
  mimeType: string;
}

// =====================================================
// Workflow Types
// =====================================================

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'manual' | 'automated';
  assignee?: string;
  deadline?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  completedAt?: Date;
  completedBy?: string;
}

export interface ContentWorkflow {
  contentId: string;
  steps: WorkflowStep[];
  currentStep: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'active' | 'completed' | 'cancelled';
}

// =====================================================
// Dashboard Types
// =====================================================

export interface DashboardData {
  summary: DashboardSummary;
  calendar: CalendarData;
  performance: PerformanceData;
  tasks: TaskData[];
}

export interface DashboardSummary {
  totalContent: number;
  publishedThisMonth: number;
  scheduledContent: number;
  pendingReview: number;
  averageEngagement: number;
  totalReach: number;
  conversionRate: number;
  revenue: number;
}

export interface CalendarData {
  events: CalendarEvent[];
  view: 'month' | 'week' | 'day' | 'list';
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: ContentType;
  status: ContentStatus;
  channel?: Channel;
  color?: string;
}

export interface PerformanceData {
  timeRange: string;
  metrics: PerformanceMetrics;
  trends: TrendData[];
  topContent: ContentCalendarItem[];
}

export interface TrendData {
  date: Date;
  value: number;
  label: string;
}

export interface TaskData {
  id: string;
  title: string;
  type: 'review' | 'create' | 'publish' | 'analyze';
  priority: 'high' | 'medium' | 'low';
  dueDate?: Date;
  assignee?: string;
  status: 'pending' | 'in_progress' | 'completed';
  relatedContent?: string;
}

// =====================================================
// Settings Types
// =====================================================

export interface ChannelSettings {
  id?: string;
  channelName: string;
  channelType: string;
  apiCredentials: Record<string, string>;
  postingSchedule: PostingSchedule;
  autoPublish: boolean;
  defaultHashtags: string[];
  characterLimit?: number;
  imageRequirements?: ImageRequirements;
  isActive: boolean;
  lastSyncAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PostingSchedule {
  timezone: string;
  days: string[];
  times: string[];
  frequency: 'daily' | 'weekly' | 'custom';
}

export interface ImageRequirements {
  dimensions: {
    width: number;
    height: number;
  };
  maxSize: number;
  formats: string[];
}

// =====================================================
// Utility Types
// =====================================================

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  contentType?: ContentType[];
  status?: ContentStatus[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  channels?: Channel[];
  tags?: string[];
  search?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
