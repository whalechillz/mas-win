import { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminNav from '../../components/admin/AdminNav';
import Link from 'next/link';

interface ImageMetadata {
  id?: string;
  name: string;
  url: string;
  size: number;
  created_at: string;
  updated_at: string;
  alt_text?: string;
  keywords?: string[];
  title?: string;
  description?: string;
  category?: string;
  is_featured?: boolean;
  usage_count?: number;
  used_in_posts?: string[];
}

export default function GalleryAdmin() {
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [filteredImages, setFilteredImages] = useState<ImageMetadata[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [imagesPerPage] = useState(24);
  const [hasMoreImages, setHasMoreImages] = useState(true);
  
  // 한국어 텍스트에서 키워드 추출 함수
  const extractKoreanKeywords = (text) => {
    const golfKeywords = [
      '골프', '드라이버', '아이언', '퍼터', '웨지', '우드', '골프장', '골프공', '골프백', '골프장갑', '골프화',
      '그린', '페어웨이', '벙커', '러프', '티', '스윙', '그립', '스탠스', '샷', '라운드',
      '남성', '여성', '성인', '젊은', '나이든', '미소', '행복한', '웃음',
      '야외', '스포츠', '자연', '하늘', '구름', '일몰', '일출', '잔디', '나무', '호수', '산', '언덕',
      '흰색', '검은색', '파란색', '초록색', '빨간색', '노란색', '갈색', '회색',
      '폴로셔츠', '바지', '모자', '캡', '바이저', '장갑', '신발',
      '아디다스', '나이키', '푸마', '타이틀리스트', '캘러웨이', '테일러메이드', '핑', '미즈노'
    ];
    
    const foundKeywords = [];
    const words = text.split(/[\s,.\-!?]+/);
    
    words.forEach(word => {
      const cleanWord = word.trim();
      if (cleanWord.length > 1 && golfKeywords.includes(cleanWord)) {
        if (!foundKeywords.includes(cleanWord)) {
          foundKeywords.push(cleanWord);
        }
      }
    });
    
    return foundKeywords.slice(0, 8); // 최대 8개 키워드
  };
  
  // 검색 및 필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'featured' | 'unused' | 'duplicates'>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'name' | 'size' | 'usage_count'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  // 카테고리/태그 관리 UI 상태
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [editingTag, setEditingTag] = useState<any | null>(null);
  
  // 편집 상태
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    alt_text: '',
    keywords: '',
    title: '',
    description: '',
    category: ''
  });

  // 확대 모달 상태
  const [selectedImageForZoom, setSelectedImageForZoom] = useState<ImageMetadata | null>(null);

  // 일괄 편집/삭제 상태
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [bulkEditForm, setBulkEditForm] = useState({
    alt_text: '',
    keywords: '', // 쉼표 구분, 추가 모드
    replaceAlt: false,
    appendKeywords: true,
    removeKeywordsOnly: false,
    category: '',
  });
  const [isBulkWorking, setIsBulkWorking] = useState(false);
  const [seoPreview, setSeoPreview] = useState<any[] | null>(null);

  // 이미지 로드
  const fetchImages = async (page = 1, reset = false) => {
    try {
      if (reset || page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      
      const offset = (page - 1) * imagesPerPage;
      const response = await fetch(`/api/admin/all-images?limit=${imagesPerPage}&offset=${offset}`);
      const data = await response.json();
      
      if (response.ok) {
        const list = data.images || [];
        
        // 더 이상 로드할 이미지가 없는지 확인
        if (list.length < imagesPerPage) {
          setHasMoreImages(false);
        } else {
          setHasMoreImages(true);
        }
        
        const metaRes = await fetch('/api/admin/image-metadata-batch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageUrls: list.map((i: any)=> i.url) }) });
        const metaJson = metaRes.ok ? await metaRes.json() : { metadata: {} };
        const metaMap = metaJson.metadata || {};
        const imagesWithMetadata = list.map((img: any) => ({
          ...img,
          alt_text: metaMap[img.url]?.alt_text || '',
          keywords: metaMap[img.url]?.tags || [],
          title: metaMap[img.url]?.title || '',
          description: metaMap[img.url]?.description || '',
          category: metaMap[img.url]?.category_id || '',
          is_featured: false,
          usage_count: metaMap[img.url]?.usage_count || 0,
          used_in_posts: []
        }));
        
        if (reset || page === 1) {
          setImages(imagesWithMetadata);
          setCurrentPage(1);
        } else {
          setImages(prev => [...prev, ...imagesWithMetadata]);
          setCurrentPage(page);
        }
        setTotalCount(data.total || 0);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('❌ 이미지 로드 에러:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // 무한 스크롤 로드
  useEffect(() => {
    const onScroll = () => {
      if (isLoading || isLoadingMore || !hasMoreImages) return;
      
      const remaining = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
      if (remaining < 200) {
        fetchImages(currentPage + 1);
      }
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [isLoading, images.length, totalCount, currentPage]);

  // 필터링 및 검색
  useEffect(() => {
    let filtered = [...images];
    
    // 검색어 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(img => 
        img.name.toLowerCase().includes(query) ||
        img.alt_text?.toLowerCase().includes(query) ||
        img.keywords?.some(keyword => keyword.toLowerCase().includes(query)) ||
        img.title?.toLowerCase().includes(query)
      );
    }
    
    // 타입 필터
    switch (filterType) {
      case 'featured':
        filtered = filtered.filter(img => img.is_featured);
        break;
      case 'unused':
        filtered = filtered.filter(img => img.usage_count === 0);
        break;
      case 'duplicates':
        // TODO: 중복 이미지 로직 구현
        break;
    }
    
    // 정렬
    filtered.sort((a, b) => {
      const aValue: any = a[sortBy];
      const bValue: any = b[sortBy];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });
    
    setFilteredImages(filtered);
  }, [images, searchQuery, filterType, sortBy, sortOrder]);

  // 초기 로드
  useEffect(() => {
    fetchImages(1, true);
    // 카테고리/태그 로드
    (async()=>{
      try { const c = await (await fetch('/api/admin/image-categories')).json(); setCategories(c.categories||[]); } catch {}
      try { const t = await (await fetch('/api/admin/image-tags')).json(); setTags(t.tags||[]); } catch {}
    })();
  }, []);

  // 이미지 선택/해제
  const toggleImageSelection = (imageName: string) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageName)) {
        newSet.delete(imageName);
      } else {
        newSet.add(imageName);
      }
      return newSet;
    });
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedImages.size === filteredImages.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(filteredImages.map(img => img.name)));
    }
  };

  // 편집 시작
  const startEditing = (image: ImageMetadata) => {
    setEditingImage(image.name);
    setEditForm({
      alt_text: image.alt_text || '',
      keywords: image.keywords?.join(', ') || '',
      title: image.title || '',
      description: image.description || '',
      category: image.category || ''
    });
  };

  // 편집 저장
  const saveEdit = async () => {
    if (!editingImage) return;
    
    try {
      console.log('💾 메타데이터 저장 시작:', editingImage);
      const keywords = editForm.keywords.split(',').map(k => k.trim()).filter(k => k);
      
      const image = images.find(img => img.name === editingImage);
      if (!image) {
        alert('이미지 정보를 찾을 수 없습니다.');
        return;
      }

      const response = await fetch('/api/admin/image-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageName: editingImage,
          imageUrl: image.url,
          alt_text: editForm.alt_text,
          keywords: keywords,
          title: editForm.title,
          description: editForm.description,
          category: editForm.category
        })
      });
      
      console.log('📡 저장 API 응답 상태:', response.status);
      
      if (response.ok) {
        // 로컬 상태 업데이트
        setImages(prev => prev.map(img => 
          img.name === editingImage 
            ? { ...img, ...editForm, keywords }
            : img
        ));
        setEditingImage(null);
        alert('메타데이터가 저장되었습니다!');
        console.log('✅ 메타데이터 저장 완료');
      } else {
        const errorData = await response.json();
        console.error('❌ 저장 API 오류 응답:', errorData);
        alert(`저장에 실패했습니다.\n오류: ${errorData.error || errorData.message || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('❌ 메타데이터 저장 에러:', error);
      alert(`저장에 실패했습니다.\n오류: ${error.message}`);
    }
  };

  // 편집 취소
  const cancelEdit = () => {
    setEditingImage(null);
    setEditForm({
      alt_text: '',
      keywords: '',
      title: '',
      description: '',
      category: ''
    });
  };

  // 일괄 편집 실행
  const handleBulkEdit = async () => {
    if (selectedImages.size === 0) return;
    setIsBulkWorking(true);
    try {
      const names = Array.from(selectedImages);
      const keywordList = bulkEditForm.keywords
        .split(',')
        .map(k => k.trim())
        .filter(Boolean);

      for (const name of names) {
        const target = images.find(i => i.name === name);
        const updatedAlt = bulkEditForm.replaceAlt
          ? bulkEditForm.alt_text
          : (bulkEditForm.alt_text ? (target?.alt_text ? `${target?.alt_text} ${bulkEditForm.alt_text}` : bulkEditForm.alt_text) : (target?.alt_text || ''));

        const updatedKeywords = (() => {
          const current = target?.keywords || [];
          if (bulkEditForm.removeKeywordsOnly) {
            if (keywordList.length === 0) return current;
            return current.filter(k => !keywordList.includes(k));
          }
          if (keywordList.length === 0) return current;
          if (bulkEditForm.appendKeywords) {
            const merged = Array.from(new Set([...current, ...keywordList]));
            return merged;
          }
          return keywordList;
        })();

        await fetch('/api/admin/image-metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageName: name,
            alt_text: updatedAlt,
            keywords: updatedKeywords,
            category: bulkEditForm.category || (target?.category ?? ''),
          })
        });
      }

      // 로컬 상태 업데이트
      setImages(prev => prev.map(img => {
        if (!selectedImages.has(img.name)) return img;
        const newAlt = bulkEditForm.replaceAlt
          ? bulkEditForm.alt_text || img.alt_text || ''
          : (bulkEditForm.alt_text ? `${img.alt_text ? img.alt_text + ' ' : ''}${bulkEditForm.alt_text}` : (img.alt_text || ''));

        const newKeywords = (() => {
          const current = img.keywords || [];
          if (bulkEditForm.removeKeywordsOnly) {
            if (keywordList.length === 0) return current;
            return current.filter(k => !keywordList.includes(k));
          }
          if (keywordList.length === 0) return current;
          if (bulkEditForm.appendKeywords) return Array.from(new Set([...(current), ...keywordList]));
          return keywordList;
        })();

        const newCategory = bulkEditForm.category ? bulkEditForm.category : (img.category || '');

        return { ...img, alt_text: newAlt, keywords: newKeywords, category: newCategory };
      }));

      setShowBulkEdit(false);
      setBulkEditForm({ alt_text: '', keywords: '', replaceAlt: false, appendKeywords: true, removeKeywordsOnly: false, category: '' });
      alert('일괄 편집이 완료되었습니다!');
    } catch (e) {
      console.error('❌ 일괄 편집 오류:', e);
      alert('일괄 편집에 실패했습니다.');
    } finally {
      setIsBulkWorking(false);
    }
  };

  // 일괄 삭제 실행
  const handleBulkDelete = async () => {
    if (selectedImages.size === 0) return;
    setIsBulkWorking(true);
    try {
      const names = Array.from(selectedImages);
      let success = 0;
      for (const name of names) {
        const res = await fetch('/api/admin/delete-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageName: name })
        });
        if (res.ok) success++;
      }
      setImages(prev => prev.filter(img => !selectedImages.has(img.name)));
      setSelectedImages(new Set());
      setShowBulkDeleteConfirm(false);
      alert(`일괄 삭제 완료: ${success}/${names.length}개`);
    } catch (e) {
      console.error('❌ 일괄 삭제 오류:', e);
      alert('일괄 삭제에 실패했습니다.');
    } finally {
      setIsBulkWorking(false);
    }
  };

  return (
    <>
      <AdminNav />
      <Head>
        <title>이미지 갤러리 관리 - MAS Golf</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">🖼️ 이미지 갤러리 관리</h1>
                <p className="text-sm text-gray-600 mt-1">이미지 메타데이터 관리 및 최적화</p>
              </div>
              <div className="flex items-center space-x-4">
                <Link 
                  href="/admin/blog"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                >
                  📝 블로그 관리로 돌아가기
                </Link>
              <button onClick={()=>{setCategoryModalOpen(true)}} className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 text-sm">📂 카테고리 관리</button>
              <button onClick={()=>{setTagModalOpen(true)}} className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 text-sm">🏷️ 태그 관리</button>
                <button
                  onClick={() => fetchImages(1, true)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
                >
                  🔄 새로고침
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 검색 및 필터 */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* 검색 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="파일명, ALT 텍스트, 키워드로 검색..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* 필터 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">필터</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">전체</option>
                  <option value="featured">⭐ 대표 이미지</option>
                  <option value="unused">사용되지 않음</option>
                  <option value="duplicates">중복 이미지</option>
                </select>
              </div>
              
              {/* 정렬 기준 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">정렬 기준</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="created_at">생성일</option>
                  <option value="name">파일명</option>
                  <option value="size">파일 크기</option>
                  <option value="usage_count">사용 횟수</option>
                </select>
              </div>
              
              {/* 정렬 순서 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">정렬 순서</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="desc">내림차순</option>
                  <option value="asc">오름차순</option>
                </select>
              </div>
            </div>
          </div>

          {/* 선택된 이미지 액션 */}
          {selectedImages.size > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  {selectedImages.size}개 이미지 선택됨
                </span>
              <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowBulkEdit(true)}
                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                  >
                    📝 일괄 편집
                  </button>
                <button
                  type="button"
                  onClick={async()=>{
                    const names = Array.from(selectedImages);
                    const payload = names.map(n=> images.find(i=>i.name===n)).filter(Boolean);
                    const res = await fetch('/api/admin/generate-alt-batch',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ items: payload, mode:'preview' })});
                    if (res.ok){ const data = await res.json(); setSeoPreview(data.suggestions||[]);} else { alert('SEO 미리보기 실패'); }
                  }}
                  className="px-3 py-1 bg-teal-600 text-white text-sm rounded hover:bg-teal-700"
                >
                  🔎 SEO/ALT 미리보기
                </button>
                <button
                  type="button"
                  onClick={async()=>{
                    if (!confirm(`선택된 ${selectedImages.size}개 이미지에 대해 AI 메타데이터를 일괄 생성하시겠습니까?\n\n이 작업은 시간이 걸릴 수 있습니다.`)) return;
                    
                    const selectedImageList = Array.from(selectedImages).map(name => images.find(img => img.name === name)).filter(Boolean);
                    let completed = 0;
                    let failed = 0;
                    
                    for (const image of selectedImageList) {
                      try {
                        // OpenAI Vision API로 ALT 텍스트와 설명 생성
                        const openaiResponse = await fetch('/api/analyze-image-prompt', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            imageUrl: image.url,
                            title: image.title || '이미지',
                            excerpt: image.description || 'AI 메타데이터 생성'
                          })
                        });

                        let altText = '';
                        let description = '';
                        if (openaiResponse.ok) {
                          const openaiData = await openaiResponse.json();
                          altText = openaiData.prompt || '';
                          description = openaiData.prompt || '';
                        }

                        // Google Vision API로 태그 생성
                        const googleResponse = await fetch('/api/admin/image-ai-analyzer', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            imageUrl: image.url,
                            imageId: image.name
                          })
                        });

                        let tags = [];
                        if (googleResponse.ok) {
                          const googleData = await googleResponse.json();
                          // seoOptimizedTags에서 키워드 추출
                          tags = googleData.seoOptimizedTags?.map(tag => tag.name) || googleData.tags || [];
                        }

                        // 메타데이터 업데이트
                        const updateResponse = await fetch('/api/admin/image-metadata-batch', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            imageUrls: [image.url],
                            updates: {
                              alt_text: altText,
                              description: description,
                              tags: tags
                            }
                          })
                        });

                        if (updateResponse.ok) {
                          completed++;
                        } else {
                          failed++;
                        }

                        // 진행 상태 표시
                        console.log(`AI 분석 진행: ${completed + failed}/${selectedImageList.length}`);
                        
                      } catch (error) {
                        console.error('AI 분석 오류:', error);
                        failed++;
                      }
                    }
                    
                    alert(`AI 메타데이터 일괄 생성 완료!\n\n✅ 성공: ${completed}개\n❌ 실패: ${failed}개`);
                    
                    // 갤러리 새로고침
                    fetchImages(1, true);
                  }}
                  className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                >
                  🤖 AI 일괄 분석
                </button>
                {seoPreview && (
                  <button
                    type="button"
                    onClick={async()=>{
                      const names = Array.from(selectedImages);
                      const payload = names.map(n=> images.find(i=>i.name===n)).filter(Boolean);
                      const res = await fetch('/api/admin/generate-alt-batch',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ items: payload, mode:'apply' })});
                      if (res.ok){
                        // 로컬 반영
                        const data = await res.json();
                        setImages(prev=> prev.map((img)=>{
                          const idx = names.indexOf(img.name);
                          if (idx>=0){ const s = (seoPreview||[])[idx]||{}; return { ...img, alt_text: s.alt||img.alt_text, title: s.title||img.title, description: s.description||img.description } }
                          return img;
                        }));
                        setSeoPreview(null);
                        alert('SEO/ALT 적용 완료');
                      } else { alert('적용 실패'); }
                    }}
                    className="px-3 py-1 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700"
                  >
                    ✅ 적용
                  </button>
                )}

                <button
                  type="button"
                  onClick={async()=>{
                    const names = Array.from(selectedImages);
                    const payload = names.map(n=> images.find(i=>i.name===n)).filter(Boolean);
                    const res = await fetch('/api/admin/image-derivatives',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ items: payload, targets:["medium","thumbWebp"] })});
                    const data = await res.json();
                    if (res.ok){
                      alert('파생 파일 생성(가상) 결과가 준비되었습니다. 실제 스토리지 변환 파이프라인 연동 예정.');
                      console.log('derivatives', data);
                    } else { alert('파생 파일 생성 실패'); }
                  }}
                  className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
                >
                  🧩 파생 파일 생성
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const names = Array.from(selectedImages);
                    for (const n of names) {
                      const img = images.find(i=>i.name===n);
                      if (!img) continue;
                      const a = document.createElement('a');
                      a.href = img.url;
                      a.download = img.name;
                      a.target = '_blank';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }
                  }}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  ⬇️ 일괄 다운로드
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const cat = prompt('이동할 카테고리 입력(예: golf/equipment/...)', '');
                    if (cat === null) return;
                    const names = Array.from(selectedImages);
                    for (const n of names) {
                      await fetch('/api/admin/image-metadata', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageName: n, category: cat }) });
                    }
                    setImages(prev=> prev.map(img => selectedImages.has(img.name) ? { ...img, category: cat || '' } : img));
                    alert('이동(카테고리 변경) 완료');
                  }}
                  className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                >
                  📁 카테고리 이동
                </button>
                  <button
                    type="button"
                    onClick={() => setShowBulkDeleteConfirm(true)}
                    className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                  >
                    🗑️ 일괄 삭제
                  </button>
                <button
                  type="button"
                  onClick={async()=>{
                    const urls = Array.from(selectedImages).map(n=> images.find(i=>i.name===n)?.url).filter(Boolean);
                    const res = await fetch('/api/admin/image-link-check',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ urls })});
                    if (!res.ok) return alert('링크 검사 실패');
                    const data = await res.json();
                    const broken = (data.checks||[]).filter((c:any)=> !c.ok);
                    if (broken.length===0) alert('모든 링크가 정상입니다.');
                    else alert(`깨진 링크 ${broken.length}개 발견`);
                  }}
                  className="px-3 py-1 bg-amber-600 text-white text-sm rounded hover:bg-amber-700"
                >
                  🔗 링크 검사
                </button>
                </div>
              </div>
            </div>
          )}

          {/* 이미지 그리드 */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filteredImages.length > 0 && selectedImages.size === filteredImages.length}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">전체 선택</span>
                  </label>
                  <span className="text-sm text-gray-600">
                    {filteredImages.length}개 표시 (총 {totalCount}개)
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <span className="text-gray-600">이미지 로딩 중...</span>
                  </div>
                </div>
              ) : filteredImages.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">🖼️</div>
                  <p className="text-lg mb-2">이미지가 없습니다</p>
                  <p className="text-sm">검색 조건을 변경해보세요</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {filteredImages.map((image) => (
                    <div 
                      key={image.name} 
                      className={`relative group border-2 rounded-lg overflow-hidden hover:shadow-md transition-all cursor-pointer ${
                        selectedImages.has(image.name) 
                          ? 'border-blue-500 ring-2 ring-blue-200' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleImageSelection(image.name)}
                    >
                      {/* 선택 표시 */}
                      {selectedImages.has(image.name) && (
                        <div className="absolute top-2 left-2 z-10">
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        </div>
                      )}
                      
                      {/* 이미지 */}
                      <div className="aspect-square bg-gray-100">
                        <img
                          src={image.url}
                          alt={image.alt_text || image.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                          }}
                        />
                      </div>
                      
                      {/* 이미지 정보 */}
                      <div className="p-3">
                        <div className="text-xs text-gray-600 mb-2 truncate" title={image.name}>
                          {image.name}
                        </div>
                        
                        {/* 메타데이터 미리보기 */}
                        {image.alt_text && (
                          <div className="text-xs text-gray-500 mb-1 truncate" title={image.alt_text}>
                            ALT: {image.alt_text}
                          </div>
                        )}
                        
                        {image.keywords && image.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {image.keywords.slice(0, 2).map((keyword, idx) => (
                              <span key={idx} className="px-1 py-0.5 bg-gray-200 text-gray-700 text-xs rounded">
                                {keyword}
                              </span>
                            ))}
                            {image.keywords.length > 2 && (
                              <span className="text-xs text-gray-500">+{image.keywords.length - 2}</span>
                            )}
                          </div>
                        )}
                        
                        {/* 사용 현황 및 파일 정보 */}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex flex-col">
                            <span>{image.usage_count || 0}회 사용</span>
                            {image.file_size && (
                              <span>{(image.file_size / 1024).toFixed(1)}KB</span>
                            )}
                            {image.width && image.height && (
                              <span>{image.width}×{image.height}</span>
                            )}
                          </div>
                          <div className="flex flex-col items-end">
                            {image.is_featured && (
                              <span className="px-1 py-0.5 bg-yellow-200 text-yellow-800 rounded text-xs mb-1">
                                ⭐ 대표
                              </span>
                            )}
                            {image.optimized_versions && (
                              <span className="px-1 py-0.5 bg-green-200 text-green-800 rounded text-xs">
                                📱 최적화됨
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* 퀵 액션 버튼들 */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col space-y-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImageForZoom(image);
                          }}
                          className="p-1 bg-white rounded shadow-sm hover:bg-gray-50"
                          title="확대"
                        >
                          🔍
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(image);
                          }}
                          className="p-1 bg-white rounded shadow-sm hover:bg-gray-50"
                          title="편집"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(image.url);
                            alert('URL이 클립보드에 복사되었습니다.');
                          }}
                          className="p-1 bg-white rounded shadow-sm hover:bg-gray-50"
                          title="URL 복사"
                        >
                          📋
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const link = document.createElement('a');
                            link.href = image.url;
                            link.download = image.name;
                            link.click();
                          }}
                          className="p-1 bg-white rounded shadow-sm hover:bg-gray-50"
                          title="다운로드"
                        >
                          💾
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* 무한 스크롤 로딩 인디케이터 */}
              {isLoadingMore && (
                <div className="col-span-full flex justify-center items-center py-8">
                  <div className="flex items-center space-x-2 text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <span>더 많은 이미지를 불러오는 중...</span>
                  </div>
                </div>
              )}
              
              {/* 더 이상 로드할 이미지가 없을 때 */}
              {!hasMoreImages && images.length > 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  <p>모든 이미지를 불러왔습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 편집 모달 */}
      {editingImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">이미지 메타데이터 편집</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    if (!editingImage) return;
                    const image = images.find(img => img.name === editingImage);
                    if (!image) return;
                    
                    if (!confirm('모든 메타데이터를 AI로 생성하시겠습니까?\n\nALT 텍스트, 키워드, 제목, 설명이 모두 생성됩니다.')) return;
                    
                    try {
                      console.log('🤖 전체 AI 메타데이터 생성 시작:', image.url);
                      
                      // 모든 AI 요청을 병렬로 실행
                      const [altResponse, keywordResponse, titleResponse, descResponse] = await Promise.allSettled([
                        fetch('/api/analyze-image-prompt', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            imageUrl: image.url,
                            title: '이미지 분석',
                            excerpt: 'AI 메타데이터 자동 생성'
                          })
                        }),
                        fetch('/api/admin/image-ai-analyzer', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            imageUrl: image.url,
                            imageId: null
                          })
                        }),
                        fetch('/api/analyze-image-prompt', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            imageUrl: image.url,
                            title: '이미지 제목',
                            excerpt: '이미지 제목 생성'
                          })
                        }),
                        fetch('/api/analyze-image-prompt', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            imageUrl: image.url,
                            title: '이미지 설명',
                            excerpt: '이미지 설명 생성'
                          })
                        })
                      ]);
                      
                      // 결과 처리
                      let altText = '';
                      let keywords = '';
                      let title = '';
                      let description = '';
                      
                      if (altResponse.status === 'fulfilled' && altResponse.value.ok) {
                        const data = await altResponse.value.json();
                        altText = (data.prompt || '')
                          .replace(/^\*\*Prompt:\*\*\s*/i, '')
                          .replace(/^\*\*이미지 분석\*\*\s*/i, '')
                          .replace(/^\*\*.*?\*\*\s*/i, '')
                          .replace(/^이미지 분석\s*/i, '')
                          .replace(/^분석\s*/i, '')
                          .replace(/^이미지는\s*/i, '')
                          .replace(/^이\s*이미지는\s*/i, '')
                          .trim();
                      }
                      
                      if (keywordResponse.status === 'fulfilled' && keywordResponse.value.ok) {
                        const data = await keywordResponse.value.json();
                        console.log('🔍 키워드 API 응답:', data);
                        // seoOptimizedTags에서 키워드 추출
                        const tagNames = data.seoOptimizedTags?.map(tag => tag.name) || data.tags || [];
                        keywords = tagNames.join(', ');
                        console.log('🏷️ 추출된 키워드:', keywords);
                      } else {
                        console.log('❌ 키워드 API 실패:', keywordResponse);
                      }
                      
                      if (titleResponse.status === 'fulfilled' && titleResponse.value.ok) {
                        const data = await titleResponse.value.json();
                        const cleanPrompt = (data.prompt || '')
                          .replace(/^\*\*Prompt:\*\*\s*/i, '')
                          .replace(/^\*\*이미지 제목\*\*:\s*/i, '')
                          .replace(/^\*\*제목\*\*:\s*/i, '')
                          .replace(/^\*\*.*?\*\*\s*/i, '')
                          .replace(/\*\*설명\*\*:.*$/i, '') // 설명 부분 제거
                          .replace(/^이미지 제목\s*:\s*/i, '')
                          .replace(/^제목\s*:\s*/i, '')
                          .replace(/^이미지는\s*/i, '')
                          .trim();
                        title = cleanPrompt.split(',')[0]?.trim() || 'AI 생성 제목';
                      }
                      
                      if (descResponse.status === 'fulfilled' && descResponse.value.ok) {
                        const data = await descResponse.value.json();
                        description = (data.prompt || '')
                          .replace(/^\*\*Prompt:\*\*\s*/i, '')
                          .replace(/^\*\*이미지 설명\*\*\s*/i, '')
                          .replace(/^\*\*설명\*\*\s*/i, '')
                          .replace(/^\*\*.*?\*\*\s*/i, '')
                          .replace(/^이미지 설명\s*/i, '')
                          .replace(/^설명\s*/i, '')
                          .replace(/^이 이미지는\s*/i, '') // "이 이미지는" 제거
                          .replace(/^이미지는\s*/i, '')
                          .replace(/^이\s*이미지는\s*/i, '')
                          .trim();
                      }
                      
                      // 폼 업데이트
                      setEditForm({
                        ...editForm,
                        alt_text: altText,
                        keywords: keywords,
                        title: title,
                        description: description
                      });
                      
                      console.log('✅ 전체 AI 메타데이터 생성 완료');
                      alert('모든 메타데이터가 AI로 생성되었습니다!');
                      
                    } catch (error) {
                      console.error('❌ 전체 AI 생성 오류:', error);
                      alert(`AI 메타데이터 생성 중 오류가 발생했습니다.\n오류: ${error.message}`);
                    }
                  }}
                  className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                  title="모든 메타데이터를 AI로 한 번에 생성"
                >
                  🤖 전체 AI 생성
                </button>
                <button
                  onClick={cancelEdit}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-4 max-h-[60vh] overflow-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ALT 텍스트</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editForm.alt_text}
                    onChange={(e) => setEditForm({ ...editForm, alt_text: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="이미지 설명을 입력하세요"
                  />
                  <button
                    onClick={async () => {
                      if (!editingImage) return;
                      const image = images.find(img => img.name === editingImage);
                      if (!image) return;
                      
                      try {
                        console.log('🤖 AI ALT 텍스트 생성 시작:', image.url);
                        const response = await fetch('/api/analyze-image-prompt', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            imageUrl: image.url,
                            title: editForm.title || '이미지',
                            excerpt: editForm.description || '이미지 설명'
                          })
                        });
                        
                        console.log('📡 API 응답 상태:', response.status);
                        
                        if (response.ok) {
                          const data = await response.json();
                          console.log('✅ AI 응답 데이터:', data);
                          // "Prompt:" 접두사 제거
                          const cleanAltText = (data.prompt || '')
                            .replace(/^\*\*Prompt:\*\*\s*/i, '')
                            .replace(/^\*\*이미지 분석\*\*\s*/i, '')
                            .replace(/^\*\*.*?\*\*\s*/i, '')
                            .replace(/^이미지 분석\s*/i, '')
                            .replace(/^분석\s*/i, '')
                            .replace(/^이미지는\s*/i, '')
                            .replace(/^이\s*이미지는\s*/i, '')
                            .trim();
                          setEditForm({ ...editForm, alt_text: cleanAltText });
                        } else {
                          const errorData = await response.json();
                          console.error('❌ API 오류 응답:', errorData);
                          alert(`AI ALT 텍스트 생성에 실패했습니다.\n오류: ${errorData.error || errorData.message || '알 수 없는 오류'}`);
                        }
                      } catch (error) {
                        console.error('❌ AI 분석 오류:', error);
                        alert(`AI 분석 중 오류가 발생했습니다.\n오류: ${error.message}`);
                      }
                    }}
                    className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                    title="AI로 ALT 텍스트 생성"
                  >
                    🤖 AI
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">키워드</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editForm.keywords}
                    onChange={(e) => setEditForm({ ...editForm, keywords: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="키워드를 쉼표로 구분하여 입력하세요"
                  />
                  <button
                    onClick={async () => {
                      if (!editingImage) return;
                      const image = images.find(img => img.name === editingImage);
                      if (!image) return;
                      
                      try {
                        console.log('🤖 AI 키워드 생성 시작:', image.url);
                        const response = await fetch('/api/admin/image-ai-analyzer', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            imageUrl: image.url,
                            imageId: null // UUID가 아닌 파일명이므로 null로 전달
                          })
                        });
                        
                        console.log('📡 API 응답 상태:', response.status);
                        
                        if (response.ok) {
                          const data = await response.json();
                          console.log('✅ AI 응답 데이터:', data);
                          // seoOptimizedTags에서 키워드 추출
                          const tagNames = data.seoOptimizedTags?.map(tag => tag.name) || data.tags || [];
                          const keywords = tagNames.join(', ');
                          
                          setEditForm({ ...editForm, keywords });
                        } else {
                          const errorData = await response.json();
                          console.error('❌ API 오류 응답:', errorData);
                          alert(`AI 키워드 생성에 실패했습니다.\n오류: ${errorData.error || errorData.message || '알 수 없는 오류'}`);
                        }
                      } catch (error) {
                        console.error('❌ AI 분석 오류:', error);
                        alert(`AI 분석 중 오류가 발생했습니다.\n오류: ${error.message}`);
                      }
                    }}
                    className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                    title="AI로 키워드 생성"
                  >
                    🤖 AI
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="이미지 제목을 입력하세요"
                  />
                  <button
                    onClick={async () => {
                      if (!editingImage) return;
                      const image = images.find(img => img.name === editingImage);
                      if (!image) return;
                      
                      try {
                        console.log('🤖 AI 제목 생성 시작:', image.url);
                        const response = await fetch('/api/analyze-image-prompt', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            imageUrl: image.url,
                            title: '이미지 제목',
                            excerpt: '이미지 제목 생성'
                          })
                        });
                        
                        console.log('📡 API 응답 상태:', response.status);
                        
                        if (response.ok) {
                          const data = await response.json();
                          console.log('✅ AI 응답 데이터:', data);
                          // 접두사 제거하고 깔끔한 제목 추출
                          const cleanPrompt = (data.prompt || '')
                            .replace(/^\*\*Prompt:\*\*\s*/i, '')
                            .replace(/^\*\*이미지 제목\*\*:\s*/i, '')
                            .replace(/^\*\*제목\*\*:\s*/i, '')
                            .replace(/\*\*설명\*\*:.*$/i, '') // 설명 부분 제거
                            .trim();
                          const title = cleanPrompt.split(',')[0]?.trim() || 'AI 생성 제목';
                          setEditForm({ ...editForm, title });
                        } else {
                          const errorData = await response.json();
                          console.error('❌ API 오류 응답:', errorData);
                          alert(`AI 제목 생성에 실패했습니다.\n오류: ${errorData.error || errorData.message || '알 수 없는 오류'}`);
                        }
                      } catch (error) {
                        console.error('❌ AI 분석 오류:', error);
                        alert(`AI 분석 중 오류가 발생했습니다.\n오류: ${error.message}`);
                      }
                    }}
                    className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                    title="AI로 제목 생성"
                  >
                    🤖 AI
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">설명</label>
                <div className="flex gap-2">
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="이미지에 대한 자세한 설명을 입력하세요"
                  />
                  <button
                    onClick={async () => {
                      if (!editingImage) return;
                      const image = images.find(img => img.name === editingImage);
                      if (!image) return;
                      
                      try {
                        console.log('🤖 AI 설명 생성 시작:', image.url);
                        const response = await fetch('/api/analyze-image-prompt', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            imageUrl: image.url,
                            title: editForm.title || '이미지',
                            excerpt: '이미지 설명 생성'
                          })
                        });
                        
                        console.log('📡 API 응답 상태:', response.status);
                        
                        if (response.ok) {
                          const data = await response.json();
                          console.log('✅ AI 응답 데이터:', data);
                          // "Prompt:" 접두사 제거
                          const cleanDescription = (data.prompt || '')
                            .replace(/^\*\*Prompt:\*\*\s*/i, '')
                            .replace(/^\*\*이미지 설명\*\*\s*/i, '')
                            .replace(/^\*\*설명\*\*\s*/i, '')
                            .replace(/^\*\*.*?\*\*\s*/i, '')
                            .replace(/^이미지 설명\s*/i, '')
                            .replace(/^설명\s*/i, '')
                            .replace(/^이 이미지는\s*/i, '') // "이 이미지는" 제거
                            .replace(/^이미지는\s*/i, '')
                            .replace(/^이\s*이미지는\s*/i, '')
                            .trim();
                          setEditForm({ ...editForm, description: cleanDescription });
                        } else {
                          const errorData = await response.json();
                          console.error('❌ API 오류 응답:', errorData);
                          alert(`AI 설명 생성에 실패했습니다.\n오류: ${errorData.error || errorData.message || '알 수 없는 오류'}`);
                        }
                      } catch (error) {
                        console.error('❌ AI 분석 오류:', error);
                        alert(`AI 분석 중 오류가 발생했습니다.\n오류: ${error.message}`);
                      }
                    }}
                    className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                    title="AI로 설명 생성"
                  >
                    🤖 AI
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">카테고리 선택</option>
                  <option value="golf">골프</option>
                  <option value="equipment">장비</option>
                  <option value="course">코스</option>
                  <option value="event">이벤트</option>
                  <option value="other">기타</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={cancelEdit}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                취소
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 일괄 편집 모달 */}
      {showBulkEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">일괄 편집 ({selectedImages.size}개)</h3>
              <button onClick={() => setShowBulkEdit(false)} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-auto space-y-4">
              <div className="text-sm text-gray-600">입력한 값만 적용됩니다. 비워두면 해당 항목은 변경하지 않습니다.</div>
              <div className="flex items-center gap-2">
                <label className="w-28 text-sm text-gray-700">ALT 텍스트</label>
                <input
                  type="text"
                  value={bulkEditForm.alt_text}
                  onChange={(e) => setBulkEditForm({ ...bulkEditForm, alt_text: e.target.value })}
                  className="flex-1 px-3 py-2 border rounded"
                  placeholder="추가 또는 교체할 ALT"
                />
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={bulkEditForm.replaceAlt} onChange={(e)=>setBulkEditForm({ ...bulkEditForm, replaceAlt: e.target.checked })} /> ALT 완전 교체
              </label>
              <div className="flex items-center gap-2">
                <label className="w-28 text-sm text-gray-700">키워드</label>
                <input
                  type="text"
                  value={bulkEditForm.keywords}
                  onChange={(e) => setBulkEditForm({ ...bulkEditForm, keywords: e.target.value })}
                  className="flex-1 px-3 py-2 border rounded"
                  placeholder="쉼표로 구분하여 추가 또는 제거"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={bulkEditForm.appendKeywords} onChange={(e)=>setBulkEditForm({ ...bulkEditForm, appendKeywords: e.target.checked, removeKeywordsOnly: false })} /> 기존 키워드에 추가 (해제 시 교체)
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={bulkEditForm.removeKeywordsOnly} onChange={(e)=>setBulkEditForm({ ...bulkEditForm, removeKeywordsOnly: e.target.checked })} /> 입력한 키워드만 제거 (추가/교체 비활성)
                </label>
              </div>
              <div className="flex items-center gap-2">
                <label className="w-28 text-sm text-gray-700">카테고리</label>
                <select
                  value={bulkEditForm.category}
                  onChange={(e)=>setBulkEditForm({ ...bulkEditForm, category: e.target.value })}
                  className="flex-1 px-3 py-2 border rounded"
                >
                  <option value="">변경 안 함</option>
                  <option value="golf">골프</option>
                  <option value="equipment">장비</option>
                  <option value="course">코스</option>
                  <option value="event">이벤트</option>
                  <option value="other">기타</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button onClick={() => setShowBulkEdit(false)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">취소</button>
              <button disabled={isBulkWorking} onClick={handleBulkEdit} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50">
                {isBulkWorking ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 일괄 삭제 확인 모달 */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-4 border-b font-semibold">일괄 삭제 확인</div>
            <div className="p-4 text-sm text-gray-700">
              선택한 {selectedImages.size}개 이미지를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button onClick={()=>setShowBulkDeleteConfirm(false)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">취소</button>
              <button disabled={isBulkWorking} onClick={handleBulkDelete} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50">{isBulkWorking ? '삭제 중...' : '삭제'}</button>
            </div>
          </div>
        </div>
      )}

      {/* 카테고리 관리 모달 */}
      {categoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">카테고리 관리</h3>
              <button onClick={()=>setCategoryModalOpen(false)} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
            </div>
            <div className="p-4 space-y-3 max-h-[60vh] overflow-auto">
              <div className="flex gap-2">
                <input placeholder="이름" className="flex-1 px-2 py-1 border rounded" value={editingCategory?.name||''} onChange={(e)=>setEditingCategory({ ...(editingCategory||{}), name:e.target.value })} />
                <input placeholder="슬러그(선택)" className="flex-1 px-2 py-1 border rounded" value={editingCategory?.slug||''} onChange={(e)=>setEditingCategory({ ...(editingCategory||{}), slug:e.target.value })} />
                <button onClick={async()=>{
                  const body = { id: editingCategory?.id, name: editingCategory?.name, slug: editingCategory?.slug };
                  if (!body.name) return alert('이름을 입력하세요.');
                  const res = await fetch('/api/admin/image-categories', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
                  if (res.ok) { const r = await res.json(); setEditingCategory(null); const list = await (await fetch('/api/admin/image-categories')).json(); setCategories(list.categories||[]); }
                }} className="px-3 py-1 bg-indigo-500 text-white rounded">저장</button>
              </div>
              <div className="divide-y">
                {categories.map((c)=> (
                  <div key={c.id} className="py-2 flex items-center gap-2">
                    <div className="flex-1">
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-gray-500">{c.slug}</div>
                    </div>
                    <button onClick={()=>setEditingCategory(c)} className="px-2 py-1 text-sm border rounded">편집</button>
                    <button onClick={async()=>{ if (!confirm('삭제하시겠습니까?')) return; await fetch(`/api/admin/image-categories?id=${c.id}`, { method:'DELETE' }); const list = await (await fetch('/api/admin/image-categories')).json(); setCategories(list.categories||[]); }} className="px-2 py-1 text-sm border rounded text-red-600">삭제</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 태그 관리 모달 */}
      {tagModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">태그 관리</h3>
              <button onClick={()=>setTagModalOpen(false)} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
            </div>
            <div className="p-4 space-y-3 max-h-[60vh] overflow-auto">
              <div className="flex gap-2">
                <input placeholder="이름" className="flex-1 px-2 py-1 border rounded" value={editingTag?.name||''} onChange={(e)=>setEditingTag({ ...(editingTag||{}), name:e.target.value })} />
                <input placeholder="슬러그(선택)" className="flex-1 px-2 py-1 border rounded" value={editingTag?.slug||''} onChange={(e)=>setEditingTag({ ...(editingTag||{}), slug:e.target.value })} />
                <button onClick={async()=>{
                  const body = { id: editingTag?.id, name: editingTag?.name, slug: editingTag?.slug };
                  if (!body.name) return alert('이름을 입력하세요.');
                  const res = await fetch('/api/admin/image-tags', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
                  if (res.ok) { const r = await res.json(); setEditingTag(null); const list = await (await fetch('/api/admin/image-tags')).json(); setTags(list.tags||[]); }
                }} className="px-3 py-1 bg-violet-500 text-white rounded">저장</button>
              </div>
              <div className="divide-y">
                {tags.map((t)=> (
                  <div key={t.id} className="py-2 flex items-center gap-2">
                    <div className="flex-1">
                      <div className="font-medium">{t.name}</div>
                      <div className="text-xs text-gray-500">{t.slug}</div>
                    </div>
                    <button onClick={()=>setEditingTag(t)} className="px-2 py-1 text-sm border rounded">편집</button>
                    <button onClick={async()=>{ if (!confirm('삭제하시겠습니까?')) return; await fetch(`/api/admin/image-tags?id=${t.id}`, { method:'DELETE' }); const list = await (await fetch('/api/admin/image-tags')).json(); setTags(list.tags||[]); }} className="px-2 py-1 text-sm border rounded text-red-600">삭제</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 이미지 확대 모달 */}
      {selectedImageForZoom && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-800">이미지 확대 보기</h3>
              <button
                onClick={() => setSelectedImageForZoom(null)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-auto">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* 이미지 영역 */}
                <div className="flex-1">
                  <div className="bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={selectedImageForZoom.url}
                      alt={selectedImageForZoom.alt_text || selectedImageForZoom.name}
                      className="w-full h-auto max-h-[60vh] object-contain"
                    />
                  </div>
                  
                  {/* 이미지 정보 */}
                  <div className="mt-4 space-y-2">
                    <div className="text-sm text-gray-600">
                      <strong>파일명:</strong> {selectedImageForZoom.name}
                    </div>
                    {selectedImageForZoom.alt_text && (
                      <div className="text-sm text-gray-600">
                        <strong>ALT:</strong> {selectedImageForZoom.alt_text}
                      </div>
                    )}
                    {selectedImageForZoom.keywords && selectedImageForZoom.keywords.length > 0 && (
                      <div className="text-sm text-gray-600">
                        <strong>키워드:</strong> {selectedImageForZoom.keywords.join(', ')}
                      </div>
                    )}
                    <div className="text-sm text-gray-600">
                      <strong>사용 횟수:</strong> {selectedImageForZoom.usage_count || 0}회
                    </div>
                  </div>
                </div>
                
                {/* 액션 버튼들 */}
                <div className="w-full lg:w-64 space-y-3">
                  <div className="text-sm font-medium text-gray-700 mb-3">빠른 작업</div>
                  
                  <button
                    onClick={() => {
                      setSelectedImageForZoom(null);
                      startEditing(selectedImageForZoom);
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md"
                  >
                    <span>✏️</span>
                    <span>메타데이터 편집</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedImageForZoom.url);
                      alert('URL이 클립보드에 복사되었습니다.');
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-md"
                  >
                    <span>📋</span>
                    <span>URL 복사</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = selectedImageForZoom.url;
                      link.download = selectedImageForZoom.name;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors shadow-md"
                  >
                    <span>💾</span>
                    <span>다운로드</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      if (confirm('이 이미지를 삭제하시겠습니까?')) {
                        // 삭제 로직 구현
                        alert('삭제 기능은 추후 구현됩니다.');
                      }
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-md"
                  >
                    <span>🗑️</span>
                    <span>삭제</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = selectedImageForZoom.url;
                      link.download = selectedImageForZoom.name;
                      link.click();
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <span>💾</span>
                    <span>다운로드</span>
                  </button>
                  
                  <button
                    onClick={async () => {
                      if (!confirm('이 이미지를 삭제하시겠습니까?')) return;
                      // 삭제 로직 구현 필요
                      alert('삭제 기능은 추후 구현됩니다.');
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <span>🗑️</span>
                    <span>삭제</span>
                  </button>
                  
                  <button
                    onClick={async () => {
                      if (!confirm('AI로 메타데이터를 재생성하시겠습니까?')) return;
                      // AI 분석 로직 구현 필요
                      alert('AI 분석 기능은 추후 구현됩니다.');
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    <span>🤖</span>
                    <span>AI 태그 재생성</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
