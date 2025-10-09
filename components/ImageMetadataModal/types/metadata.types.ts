// 이미지 메타데이터 타입 정의
export interface ImageMetadata {
  id?: string;
  name: string;
  url: string;
  alt_text?: string;
  keywords?: string[];
  title?: string;
  description?: string;
  category?: string;
  category_id?: number;
  is_featured?: boolean;
  usage_count?: number;
  used_in_posts?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface MetadataForm {
  alt_text: string;
  keywords: string;
  title: string;
  description: string;
  category: string;
  filename: string;
}

export interface ValidationRule {
  field: keyof MetadataForm;
  maxLength?: number;
  required?: boolean;
  pattern?: RegExp;
  message?: string;
}

export interface SEORecommendation {
  field: keyof MetadataForm;
  current: number;
  recommended: {
    min: number;
    max: number;
  };
  score: number; // 0-100
  suggestions: string[];
}

export interface AIGenerationOptions {
  language: 'korean' | 'english';
  fields: (keyof MetadataForm)[];
  context?: string;
}

export interface FieldConfig {
  label: string;
  placeholder: string;
  type: 'text' | 'textarea' | 'select';
  maxLength?: number;
  required?: boolean;
  aiEnabled?: boolean;
  seoOptimized?: boolean;
}

export interface ModalState {
  isOpen: boolean;
  isLoading: boolean;
  hasChanges: boolean;
  validationErrors: Record<string, string>;
  seoScore: number;
}
