import { useState, useEffect } from 'react';
import RichTextEditor from '../../components/RichTextEditor';
import Head from 'next/head';

export default function BlogAdmin() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image: '',
    publishedAt: new Date().toISOString(),
    category: '골프',
    tags: [],
    status: 'published',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    view_count: 0,
    is_featured: false,
    is_scheduled: false,
    scheduled_at: '',
    author: '마쓰구골프'
  });

  // 마쓰구 브랜드 전략 상태
  const [brandStrategy, setBrandStrategy] = useState({
    contentType: 'information',
    audienceTemp: 'warm',
    brandWeight: 'medium',
    customerChannel: 'local_customers',
    painPoint: '',
    customerPersona: 'competitive_maintainer'
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      // 관리자 API를 사용하여 데이터를 가져옴
      const response = await fetch('/api/admin/blog');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Admin API 응답 데이터:', data);
      // API 응답이 {posts: [...]} 형태인 경우 처리
      const postsArray = data.posts || data;
      setPosts(Array.isArray(postsArray) ? postsArray : []);
    } catch (error) {
      console.error('게시물 로드 실패:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPost) {
        // 수정
        const response = await fetch(`/api/admin/blog/${editingPost.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (response.ok) {
          alert('게시물이 수정되었습니다!');
          fetchPosts();
          resetForm();
        }
      } else {
        // 새 게시물 생성
        const response = await fetch('/api/admin/blog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (response.ok) {
          alert('새 게시물이 생성되었습니다!');
          fetchPosts();
          resetForm();
        }
      }
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장에 실패했습니다.');
    }
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      featured_image: post.featured_image,
      publishedAt: post.publishedAt,
      category: post.category,
      tags: post.tags || [],
      status: post.status || 'published',
      meta_title: post.meta_title || '',
      meta_description: post.meta_description || '',
      meta_keywords: post.meta_keywords || '',
      view_count: post.view_count || 0,
      is_featured: post.is_featured || false,
      is_scheduled: post.is_scheduled || false,
      scheduled_at: post.scheduled_at || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      try {
        const response = await fetch(`/api/admin/blog/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          alert('게시물이 삭제되었습니다!');
          fetchPosts();
        }
      } catch (error) {
        console.error('삭제 실패:', error);
        alert('삭제에 실패했습니다.');
      }
    }
  };

  const resetForm = () => {
    setEditingPost(null);
    setShowForm(false);
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      featured_image: '',
      publishedAt: new Date().toISOString(),
      category: '골프',
      tags: [],
      status: 'published',
      meta_title: '',
      meta_description: '',
      meta_keywords: '',
      view_count: 0,
      is_featured: false,
      is_scheduled: false,
      scheduled_at: '',
      author: '마쓰구골프'
    });
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 파일 크기 체크 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB를 초과할 수 없습니다.');
      return;
    }

    // 파일 타입 체크
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    try {
      // 임시로 Base64로 변환하여 미리보기
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData({ ...formData, featured_image: e.target.result });
      };
      reader.readAsDataURL(file);
      
      // TODO: 실제 서버 업로드 구현
      console.log('이미지 업로드:', file.name);
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      alert('이미지 업로드에 실패했습니다.');
    }
  };

  const handleImageDrop = (event) => {
    event.preventDefault();
    event.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const fakeEvent = { target: { files: [file] } };
      handleImageUpload(fakeEvent);
    }
  };

  const generateSlug = (title) => {
    if (!title) return '';
    
    // 한글을 영문으로 변환하는 매핑 테이블
    const koreanToEnglish = {
      '뜨거운': 'hot',
      '여름': 'summer',
      '완벽한': 'perfect',
      '스윙': 'swing',
      '로얄살루트': 'royal-salute',
      '증정': 'gift',
      '행사': 'event',
      '골프': 'golf',
      '드라이버': 'driver',
      '고반발': 'high-rebound',
      '비거리': 'distance',
      '증가': 'increase',
      '맞춤': 'custom',
      '제작': 'manufacturing',
      '서비스': 'service',
      '프리미엄': 'premium',
      '기술': 'technology',
      '디자인': 'design',
      '클럽': 'club',
      '헤드': 'head',
      '정밀한': 'precise',
      '세심하게': 'carefully',
      '설계된': 'designed',
      '최신': 'latest',
      '적용된': 'applied',
      '특별한': 'special',
      '경험': 'experience',
      '선사': 'provide',
      '품격': 'class',
      '있는': 'with',
      '퍼포먼스': 'performance',
      '준비': 'preparation',
      '한정': 'limited',
      '썸머': 'summer',
      '스페셜': 'special',
      '최대': 'maximum',
      '년': 'year',
      'ml': 'ml',
      '평균': 'average',
      'm': 'm',
      '대': 'age',
      '골퍼': 'golfer',
      '맞춤': 'custom',
      '설계': 'design',
      '전문적인': 'professional',
      '제작': 'manufacturing',
      '무료': 'free',
      '전문': 'professional',
      '상담': 'consultation',
      '선착순': 'first-come-first-served',
      '한정': 'limited',
      '예약': 'reservation',
      '카카오톡': 'kakao-talk',
      '갤러리': 'gallery',
      '제품': 'product',
      '이미지': 'image',
      '메인': 'main',
      '디테일': 'detail',
      '증정품': 'gift',
      '고반발': 'high-rebound',
      '드라이버': 'driver',
      '멀리': 'distance',
      '보낼수': 'send',
      '있을까': 'possible',
      '스윙': 'swing',
      '완벽한': 'perfect',
      '로얄살루트': 'royal-salute',
      '증정': 'gift',
      '행사': 'event'
    };

    let slug = title;
    
    // 한글을 영문으로 변환
    Object.keys(koreanToEnglish).forEach(korean => {
      const english = koreanToEnglish[korean];
      slug = slug.replace(new RegExp(korean, 'g'), english);
    });
    
    // SEO 최적화: 소문자 변환, 특수문자 제거, 공백을 하이픈으로 변환
    return slug
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // 영문, 숫자, 공백, 하이픈만 유지
      .replace(/\s+/g, '-') // 공백을 하이픈으로 변환
      .replace(/-+/g, '-') // 연속된 하이픈을 하나로 변환
      .replace(/^-|-$/g, '') // 앞뒤 하이픈 제거
      .trim();
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title)
    });
  };

  const generateAISlug = async () => {
    if (!formData.title) {
      alert('제목을 먼저 입력해주세요.');
      return;
    }

    try {
      const response = await fetch('/api/generate-slug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: formData.title })
      });

      if (response.ok) {
        const { slug } = await response.json();
        setFormData({
          ...formData,
          slug
        });
      } else {
        console.error('AI 슬러그 생성 실패');
        alert('AI 슬러그 생성에 실패했습니다. 기본 슬러그를 사용합니다.');
      }
    } catch (error) {
      console.error('AI 슬러그 생성 에러:', error);
      alert('AI 슬러그 생성 중 오류가 발생했습니다.');
    }
  };

  // 마쓰구 브랜드 전략 기반 AI 콘텐츠 생성
  const generateAIContent = async (type) => {
    if (!formData.title) {
      alert('제목을 먼저 입력해주세요.');
      return;
    }

    try {
      const response = await fetch('/api/generate-localized-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: formData.title,
          type: type,
          keywords: formData.tags.join(', '),
          contentType: brandStrategy.contentType,
          audienceTemp: brandStrategy.audienceTemp,
          brandWeight: brandStrategy.brandWeight,
          customerChannel: brandStrategy.customerChannel,
          painPoint: brandStrategy.painPoint || null,
          customerPersona: brandStrategy.customerPersona
        })
      });

      if (response.ok) {
        const { content, strategy } = await response.json();
        
        if (type === 'excerpt') {
          setFormData({ ...formData, excerpt: content });
        } else if (type === 'content') {
          setFormData({ ...formData, content: content });
        } else if (type === 'meta') {
          // 메타 설명은 별도 필드가 없으므로 excerpt에 추가
          setFormData({ ...formData, excerpt: content });
        }
        
        console.log('생성된 전략:', strategy);
      } else {
        console.error('AI 콘텐츠 생성 실패');
        alert('AI 콘텐츠 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('AI 콘텐츠 생성 에러:', error);
      alert('AI 콘텐츠 생성 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>블로그 관리자 - MAS Golf</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">블로그 관리</h1>
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                새 게시물 작성
              </button>
            </div>
          </div>

          {showForm && (
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold mb-4">
                {editingPost ? '게시물 수정' : '새 게시물 작성'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      제목
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={handleTitleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      슬러그
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      <button
                        type="button"
                        onClick={generateAISlug}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                        title="AI로 SEO 최적화된 슬러그 생성"
                      >
                        🤖 AI
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      제목 입력 시 자동 생성되며, AI 버튼으로 더 정교한 슬러그를 생성할 수 있습니다.
                    </p>
                  </div>
                </div>

                {/* 마쓰구 브랜드 전략 선택 */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4">🎯 마쓰구 브랜드 전략</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">콘텐츠 유형</label>
                      <select 
                        value={brandStrategy.contentType} 
                        onChange={(e) => setBrandStrategy({...brandStrategy, contentType: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="event">이벤트/프로모션</option>
                        <option value="tutorial">드라이버 비거리법</option>
                        <option value="testimonial">고객 후기</option>
                        <option value="customer_story">고객 스토리</option>
                        <option value="information">골프 정보</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">오디언스 온도</label>
                      <select 
                        value={brandStrategy.audienceTemp} 
                        onChange={(e) => setBrandStrategy({...brandStrategy, audienceTemp: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="cold">차가운 오디언스 (인지도 낮음)</option>
                        <option value="warm">따뜻한 오디언스 (관심 있음)</option>
                        <option value="hot">뜨거운 오디언스 (구매 의도 높음)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">브랜드 강도</label>
                      <select 
                        value={brandStrategy.brandWeight} 
                        onChange={(e) => setBrandStrategy({...brandStrategy, brandWeight: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="low">낮음 (정보 제공 중심)</option>
                        <option value="medium">중간 (비교 강조)</option>
                        <option value="high">높음 (강력한 홍보)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">고객 채널</label>
                      <select 
                        value={brandStrategy.customerChannel} 
                        onChange={(e) => setBrandStrategy({...brandStrategy, customerChannel: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="local_customers">내방고객 (경기 근방)</option>
                        <option value="online_customers">온라인고객 (전국 단위)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">고객 페르소나</label>
                      <select 
                        value={brandStrategy.customerPersona} 
                        onChange={(e) => setBrandStrategy({...brandStrategy, customerPersona: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="high_rebound_enthusiast">고반발 드라이버 선호 상급 골퍼</option>
                        <option value="health_conscious_senior">건강을 고려한 비거리 증가 시니어 골퍼</option>
                        <option value="competitive_maintainer">경기력을 유지하고 싶은 중상급 골퍼</option>
                        <option value="returning_60plus">최근 골프를 다시 시작한 60대 이상 골퍼</option>
                        <option value="distance_seeking_beginner">골프 입문자를 위한 비거리 향상 초급 골퍼</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">페인 포인트</label>
                      <select 
                        value={brandStrategy.painPoint} 
                        onChange={(e) => setBrandStrategy({...brandStrategy, painPoint: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">선택 안함</option>
                        <option value="distance">비거리 부족</option>
                        <option value="accuracy">방향성 불안정</option>
                        <option value="comfort">타구감 부족</option>
                        <option value="cost">비용 대비 효과 부족</option>
                        <option value="service">서비스 불만족</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button 
                      type="button"
                      onClick={() => generateAIContent('excerpt')} 
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      🤖 AI 요약
                    </button>
                    <button 
                      type="button"
                      onClick={() => generateAIContent('content')} 
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                    >
                      🤖 AI 본문
                    </button>
                    <button 
                      type="button"
                      onClick={() => generateAIContent('meta')} 
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                    >
                      🤖 AI 메타
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-600 mt-2">
                    선택한 전략에 따라 마쓰구 브랜드가 자연스럽게 통합된 콘텐츠를 생성합니다.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    요약
                  </label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    작성자
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="작성자명을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    대표 이미지
                  </label>
                  
                  {/* 드래그 앤 드롭 영역 */}
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                    }}
                    onDrop={handleImageDrop}
                  >
                    <div className="space-y-2">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="text-sm text-gray-600">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                          <span>이미지 파일을 선택하거나</span>
                          <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} />
                        </label>
                        <span className="pl-1">드래그 앤 드롭하세요</span>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF 최대 10MB</p>
                    </div>
                  </div>
                  
                  {/* 현재 이미지 미리보기 */}
                  {formData.featured_image && (
                    <div className="mt-4">
                      <img 
                        src={formData.featured_image} 
                        alt="미리보기" 
                        className="h-32 w-32 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, featured_image: '' })}
                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                      >
                        이미지 제거
                      </button>
                    </div>
                  )}
                  
                  {/* URL 직접 입력 */}
                  <div className="mt-4">
                    <label className="block text-xs text-gray-600 mb-1">또는 URL 직접 입력:</label>
                    <input
                      type="url"
                      value={formData.featured_image}
                      onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    내용
                  </label>
                  <RichTextEditor
                    content={formData.content}
                    onChange={(content) => setFormData({ ...formData, content })}
                    placeholder="블로그 내용을 입력하세요..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    서식, 링크, 이미지를 포함한 풍부한 콘텐츠를 작성할 수 있습니다.
                  </p>
                </div>

                {/* 추가 관리 필드들 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      카테고리
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="골프">골프</option>
                      <option value="고반발 드라이버">고반발 드라이버</option>
                      <option value="시니어 드라이버">시니어 드라이버</option>
                      <option value="고객 후기">고객 후기</option>
                      <option value="이벤트">이벤트</option>
                      <option value="튜토리얼">튜토리얼</option>
                      <option value="고객스토리">고객스토리</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      게시 상태
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="published">게시됨</option>
                      <option value="draft">초안</option>
                      <option value="archived">보관됨</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      게시일
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.publishedAt ? new Date(formData.publishedAt).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setFormData({ ...formData, publishedAt: new Date(e.target.value).toISOString() })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      발행 예약
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="is_scheduled"
                          checked={formData.is_scheduled}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            is_scheduled: e.target.checked,
                            status: e.target.checked ? 'draft' : formData.status
                          })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is_scheduled" className="ml-2 block text-sm text-gray-700">
                          예약 발행 사용
                        </label>
                      </div>
                      
                      {formData.is_scheduled && (
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            예약 발행 시간
                          </label>
                          <input
                            type="datetime-local"
                            value={formData.scheduled_at ? new Date(formData.scheduled_at).toISOString().slice(0, 16) : ''}
                            onChange={(e) => setFormData({ ...formData, scheduled_at: new Date(e.target.value).toISOString() })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            min={new Date().toISOString().slice(0, 16)}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            예약된 시간에 자동으로 게시됩니다.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      조회수
                    </label>
                    <input
                      type="number"
                      value={formData.view_count}
                      onChange={(e) => setFormData({ ...formData, view_count: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_featured" className="ml-2 block text-sm text-gray-700">
                    추천 게시물로 설정
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    메타 제목 (SEO)
                  </label>
                  <input
                    type="text"
                    value={formData.meta_title}
                    onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="검색 엔진 최적화를 위한 제목"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    메타 설명 (SEO)
                  </label>
                  <textarea
                    value={formData.meta_description}
                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="검색 결과에 표시될 설명"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    메타 키워드 (SEO)
                  </label>
                  <input
                    type="text"
                    value={formData.meta_keywords}
                    onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="쉼표로 구분된 키워드"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingPost ? '수정' : '저장'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">로딩 중...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {post.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-2">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>슬러그: {post.slug}</span>
                          <span>카테고리: {post.category}</span>
                          <span>상태: {post.status === 'published' ? '게시됨' : post.status === 'draft' ? '초안' : '보관됨'}</span>
                          <span>조회수: {post.view_count || 0}</span>
                          <span>작성일: {new Date(post.publishedAt).toLocaleDateString('ko-KR')}</span>
                          {post.is_featured && <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">추천</span>}
                          {post.is_scheduled && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                              예약: {new Date(post.scheduled_at).toLocaleDateString('ko-KR')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleEdit(post)}
                          className="px-3 py-1 text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="px-3 py-1 text-red-600 border border-red-600 rounded hover:bg-red-50"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
