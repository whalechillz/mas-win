# 이미지 메타데이터 저장 문제 해결 가이드

## 🚨 자주 발생하는 문제들

### 1. 존재하지 않는 컬럼 사용
**문제**: `메타데이터 업데이트 실패 - 500 오류`
**원인**: `image_metadata` 테이블에 존재하지 않는 `file_name`, `category` 컬럼 사용 시도
**해결**: 테이블 스키마에 맞는 컬럼만 사용

```javascript
// ❌ 잘못된 방법 (존재하지 않는 컬럼)
const metadataData = {
  file_name: fileName,      // 테이블에 없음
  category: categoryString, // 테이블에 없음
  image_url: imageUrl,
  // ...
};

// ✅ 올바른 방법 (실제 스키마 기반)
const metadataData = {
  image_url: imageUrl,  // UNIQUE 컬럼
  alt_text: alt_text || '',
  title: title || '',
  description: description || '',
  tags: Array.isArray(keywords) ? keywords : [],
  category_id: categoryId || null,  // 외래키 (NULL 허용)
  updated_at: new Date().toISOString()
};
```

### 2. 외래키 제약 조건 위반 (category_id)
**문제**: `foreign key constraint violation`
**원인**: `category_id`가 `image_categories` 테이블에 존재하지 않는 ID를 참조
**해결**: 
- 존재하는 카테고리 ID만 사용 (1-5)
- 카테고리가 없으면 NULL로 설정

```javascript
// ✅ 올바른 방법
let categoryId = null;

// 카테고리 매핑 (실제 DB의 image_categories 테이블 ID와 일치해야 함)
// 1: 'golf', 2: 'equipment', 3: 'course', 4: 'instruction', 5: 'general'
const categoryMap = {
  '골프': 2,      // golf → ID 확인 필요
  '장비': 3,      // equipment → ID 확인 필요
  '코스': 4,      // course → ID 확인 필요
  '이벤트': null, // 존재하지 않으면 NULL
  '기타': 5,      // general → ID 확인 필요
};

if (categoryString && categoryString !== '') {
  const firstCategory = categoriesArray[0];
  categoryId = categoryMap[firstCategory] || null;
}

// category_id는 NULL일 수 있으므로 있을 때만 추가
if (categoryId !== null && categoryId !== undefined) {
  metadataData.category_id = categoryId;
}
```

### 3. 테이블 스키마 불일치
**문제**: `column "file_name" does not exist`
**원인**: API 코드에서 테이블에 없는 컬럼 사용
**해결**: 실제 `image_metadata` 테이블 스키마 확인 후 일치시킴

**실제 스키마** (`supabase-setup.sql`):
```sql
CREATE TABLE image_metadata (
  id SERIAL PRIMARY KEY,
  image_url TEXT NOT NULL UNIQUE,  -- ← UNIQUE 컬럼
  alt_text TEXT,
  title TEXT,
  description TEXT,
  category_id INTEGER REFERENCES image_categories(id),  -- ← 외래키
  tags TEXT[],  -- ← 배열 타입
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  format VARCHAR(20),
  upload_source VARCHAR(50) DEFAULT 'manual',
  status VARCHAR(20) DEFAULT 'active',
  hash_md5 VARCHAR(32),
  hash_sha256 VARCHAR(64),
  optimized_versions JSONB DEFAULT '{}',
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**주의사항**:
- `file_name` 컬럼 없음 (URL로만 관리)
- `category` 컬럼 없음 (`category_id`만 사용)
- `image_url`이 UNIQUE이므로 조회/업데이트 기준으로 사용

### 4. 카테고리 ID 매핑 불일치
**문제**: 카테고리 이름을 ID로 변환할 때 실제 DB ID와 불일치
**원인**: 코드의 하드코딩된 매핑이 실제 DB 카테고리 ID와 다름
**해결**: 동적으로 카테고리 ID 조회하거나 NULL 허용

```javascript
// 방법 1: 동적 조회 (권장)
const { data: categories } = await supabase
  .from('image_categories')
  .select('id, name');

const categoryMap = {};
categories.forEach(cat => {
  categoryMap[cat.name.toLowerCase()] = cat.id;
});

// 방법 2: NULL 허용 (간단)
if (categoryString && categoryString !== '') {
  // 카테고리 매핑 시도하되, 실패 시 NULL
  categoryId = categoryMap[firstCategory] || null;
} else {
  categoryId = null;
}
```

## 🔧 해결된 코드 구조

### pages/api/admin/image-metadata.js (POST 핸들러)

```javascript
export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { imageName, imageUrl, alt_text, keywords, title, description, category, categories } = req.body;
    
    // 1. 카테고리 처리 (배열 우선, 없으면 문자열)
    const categoriesArray = Array.isArray(categories) && categories.length > 0
      ? categories
      : (category ? category.split(',').map(c => c.trim()).filter(c => c) : []);
    
    // 2. 카테고리 ID 변환 (NULL 허용)
    let categoryId = null;
    if (categoriesArray.length > 0) {
      const firstCategory = categoriesArray[0];
      // 실제 DB 카테고리 ID 매핑 (확인 필요)
      const categoryMap = {
        '골프': 2, '장비': 3, '코스': 4, '기타': 5, // ID 확인 필요
      };
      categoryId = categoryMap[firstCategory.toLowerCase()] || null;
    }
    
    // 3. 메타데이터 구성 (스키마에 맞춤)
    const metadataData = {
      image_url: imageUrl,  // UNIQUE 기준
      alt_text: alt_text || '',
      tags: Array.isArray(keywords) ? keywords : (keywords ? keywords.split(',').map(k => k.trim()).filter(k => k) : []),
      title: title || '',
      description: description || '',
      updated_at: new Date().toISOString()
    };
    
    // category_id는 NULL 허용이므로 있을 때만 추가
    if (categoryId !== null && categoryId !== undefined) {
      metadataData.category_id = categoryId;
    }
    
    // 4. 기존 데이터 확인 및 업데이트/생성
    const { data: existingData } = await supabase
      .from('image_metadata')
      .select('id')
      .eq('image_url', imageUrl)
      .single();
    
    let result;
    if (existingData) {
      // 업데이트
      const { data, error } = await supabase
        .from('image_metadata')
        .update(metadataData)
        .eq('image_url', imageUrl)
        .select()
        .single();
      
      if (error) {
        console.error('❌ 메타데이터 업데이트 오류:', error);
        return res.status(500).json({ 
          error: '메타데이터 업데이트 실패',
          details: error.message,
          code: error.code,
          hint: error.hint
        });
      }
      result = data;
    } else {
      // 생성
      const { data, error } = await supabase
        .from('image_metadata')
        .insert([{ ...metadataData, created_at: new Date().toISOString() }])
        .select()
        .single();
      
      if (error) {
        console.error('❌ 메타데이터 생성 오류:', error);
        return res.status(500).json({ 
          error: '메타데이터 생성 실패',
          details: error.message,
          code: error.code,
          hint: error.hint
        });
      }
      result = data;
    }
    
    return res.status(200).json({ success: true, metadata: result });
  }
}
```

## 🧪 테스트 방법

### 1. 로컬 테스트
```bash
curl -X POST http://localhost:3000/api/admin/image-metadata \
  -H "Content-Type: application/json" \
  -d '{
    "imageName": "test-image.jpg",
    "imageUrl": "https://example.com/image.jpg",
    "alt_text": "테스트 이미지",
    "title": "테스트",
    "description": "테스트 설명",
    "keywords": ["테스트", "이미지"],
    "category": "골프"
  }'
```

### 2. 브라우저에서 테스트
1. `/admin/gallery` 접속
2. 이미지 편집 모달 열기
3. AI 생성 버튼 클릭
4. 카테고리 선택
5. 저장 버튼 클릭
6. 모달 닫고 다시 열어서 저장 확인

## 📋 체크리스트

### 이미지 메타데이터 저장 시:
- [ ] `image_url`이 유효한지 확인 (UNIQUE 제약)
- [ ] `file_name` 컬럼 사용 안 함
- [ ] `category` 컬럼 사용 안 함 (`category_id`만 사용)
- [ ] `category_id`는 NULL 허용이므로 확인
- [ ] `tags`는 배열 형식으로 전송
- [ ] 테이블 스키마와 일치하는 컬럼만 사용

### 에러 발생 시:
- [ ] Vercel 로그에서 상세 에러 메시지 확인
- [ ] `error.code`, `error.message`, `error.hint` 확인
- [ ] `image_url`이 실제로 존재하는지 확인
- [ ] `category_id`가 `image_categories` 테이블에 존재하는지 확인

## 🚀 성공 응답 예시
```json
{
  "success": true,
  "metadata": {
    "id": 123,
    "image_url": "https://example.com/image.jpg",
    "alt_text": "테스트 이미지",
    "title": "테스트",
    "description": "테스트 설명",
    "tags": ["테스트", "이미지"],
    "category_id": 2,
    "updated_at": "2025-11-01T12:00:00.000Z"
  }
}
```

## 📝 관련 파일
- `pages/api/admin/image-metadata.js` - 메인 API 엔드포인트
- `supabase-setup.sql` - 데이터베이스 스키마 정의
- `components/ImageMetadataModal/index.tsx` - 프론트엔드 컴포넌트

## 📞 지원 정보
- 개발자: AI Assistant
- 최종 업데이트: 2025-11-01
- 버전: 1.0

