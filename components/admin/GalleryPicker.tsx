import React, { useEffect, useMemo, useState } from 'react';

type ImageItem = { name: string; url: string };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, options?: { alt?: string; title?: string }) => void;
  onSelectMultiple?: (urls: string[], options?: { alt?: string; title?: string }) => void;
  featuredUrl?: string;
  keepOpenAfterSelect?: boolean; // 선택 후 모달 유지 여부
};

const GalleryPicker: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  onSelectMultiple,
  featuredUrl,
  keepOpenAfterSelect = true // 기본값: 선택 후 모달 유지
}) => {
  const [allImages, setAllImages] = useState<ImageItem[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'webp' | 'medium' | 'thumb'>('all');
  const [altText, setAltText] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentFeatured, setCurrentFeatured] = useState<string | undefined>(featuredUrl);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [bulkForm, setBulkForm] = useState({ alt: '', keywords: '', replaceAlt: false, appendKeywords: true, removeKeywordsOnly: false });
  const pageSize = 24;

  // 이미지 로드 함수
  const fetchImages = async (resetPage = false) => {
    try {
      setIsLoading(true);
      const currentPage = resetPage ? 1 : page;
      const offset = (currentPage - 1) * pageSize;
      const res = await fetch(`/api/admin/all-images?limit=${pageSize}&offset=${offset}`);
      const data = await res.json();
      if (res.ok) {
        setAllImages(data.images || []);
        setTotal(data.total || 0);
        if (resetPage) setPage(1);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchImages();
  }, [isOpen, page]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (allImages || [])
      .filter((img) => {
        const n = (img.name || '').toLowerCase();
        const u = (img.url || '').toLowerCase();
        if (filter === 'webp') return /\.webp$/i.test(n) || /\.webp$/i.test(u);
        if (filter === 'medium') return /_medium\./i.test(n) || /_medium\./i.test(u);
        if (filter === 'thumb') return /_thumb\./i.test(n) || /_thumb\.webp$/i.test(n) || /_thumb\./i.test(u) || /_thumb\.webp$/i.test(u);
        return true;
      })
      .filter((img) => !q || img.name.toLowerCase().includes(q) || img.url.toLowerCase().includes(q));
  }, [allImages, query, filter]);

  useEffect(() => {
    setCurrentFeatured(featuredUrl);
  }, [featuredUrl]);

  const isFeatured = (img: ImageItem) => {
    if (!currentFeatured) return false;
    const normalizeUrl = (u: string) => u.replace(/^http:\/\//, 'https://');
    const getFile = (u: string) => {
      try { return new URL(u).pathname.split('/').pop() || u; } catch { return u; }
    };
    const stripVariant = (name: string) => {
      // remove known variants like _thumb, _thumb.webp, _medium before extension
      const lower = name.toLowerCase();
      const match = lower.match(/^(.*?)(?:_(thumb|medium))(\.[a-z0-9]+)$/i);
      if (match) return match[1] + match[3];
      return name;
    };
    const aUrl = normalizeUrl(currentFeatured);
    const bUrl = normalizeUrl(img.url);
    if (aUrl === bUrl) return true;
    const aFile = stripVariant(getFile(aUrl));
    const bFile = stripVariant(getFile(bUrl));
    if (aFile === bFile) return true;
    // also compare basename without extension
    const base = (n: string) => n.replace(/\.[^.]+$/, '');
    return base(aFile) === base(bFile);
  };

  const toggleSelect = (name: string) => {
    setSelected(prev => {
      const s = new Set(prev);
      if (s.has(name)) s.delete(name); else s.add(name);
      return s;
    });
  };

  // 단일 이미지 선택 처리
  const handleSingleSelect = (img: ImageItem) => {
    onSelect(img.url, { alt: altText || img.name });
    if (!keepOpenAfterSelect) {
      onClose();
    }
  };

  // 다중 이미지 선택 처리
  const handleMultipleSelect = () => {
    const names = Array.from(selected);
    if (names.length === 0) return;
    
    const selectedImages = names.map(name => {
      const img = allImages.find(i => i.name === name);
      return img?.url;
    }).filter(Boolean) as string[];

    if (onSelectMultiple) {
      onSelectMultiple(selectedImages, { alt: altText });
    } else {
      // 단일 선택 함수를 여러 번 호출
      selectedImages.forEach(url => {
        onSelect(url, { alt: altText });
      });
    }
    
    setSelected(new Set());
    if (!keepOpenAfterSelect) {
      onClose();
    }
  };

  const handleBulkEdit = async () => {
    const names = Array.from(selected);
    if (names.length === 0) return setShowBulkEdit(false);
    const keywordList = bulkForm.keywords.split(',').map(k=>k.trim()).filter(Boolean);
    for (const name of names) {
      // find by name
      const img = allImages.find(i=>i.name===name);
      const currentAlt = '';
      const updatedAlt = bulkForm.replaceAlt ? bulkForm.alt : (bulkForm.alt ? ((currentAlt? currentAlt+' ' : '') + bulkForm.alt) : currentAlt);
      // keywords: client-only best-effort
      await fetch('/api/admin/image-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageName: name,
          alt_text: updatedAlt,
          keywords: bulkForm.removeKeywordsOnly ? [] : keywordList,
        })
      });
    }
    setShowBulkEdit(false);
    setBulkForm({ alt: '', keywords: '', replaceAlt: false, appendKeywords: true, removeKeywordsOnly: false });
    setSelected(new Set());
    alert('일괄 편집을 완료했습니다.');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">🖼️ 갤러리에서 이미지 선택</h3>
          <div className="flex items-center gap-2">
            <button 
              type="button" 
              onClick={() => fetchImages(true)} 
              className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-1"
              disabled={isLoading}
            >
              {isLoading ? '⏳' : '🔄'} 새로고침
            </button>
            <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
          </div>
        </div>
        <div className="p-3 border-b flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-sm">
            <button type="button" className={`px-2 py-1 rounded ${filter==='all'?'bg-blue-500 text-white':'bg-gray-100'}`} onClick={()=>setFilter('all')}>전체</button>
            <button type="button" className={`px-2 py-1 rounded ${filter==='webp'?'bg-blue-500 text-white':'bg-gray-100'}`} onClick={()=>setFilter('webp')}>WebP</button>
            <button type="button" className={`px-2 py-1 rounded ${filter==='medium'?'bg-blue-500 text-white':'bg-gray-100'}`} onClick={()=>setFilter('medium')}>Medium</button>
            <button type="button" className={`px-2 py-1 rounded ${filter==='thumb'?'bg-blue-500 text-white':'bg-gray-100'}`} onClick={()=>setFilter('thumb')}>Thumb</button>
          </div>
          <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="검색(파일명/확장)" className="px-2 py-1 border rounded text-sm flex-1 min-w-[220px]" />
          <input value={altText} onChange={(e)=>setAltText(e.target.value)} placeholder="ALT" className="px-2 py-1 border rounded text-sm min-w-[160px]" />
          {/* 추천 태그 */}
          <div className="hidden md:flex items-center gap-1 text-xs text-gray-600">
            {['golf','driver','club','green','fairway','masgolf'].map(t => (
              <button key={t} type="button" className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200" onClick={()=>setQuery(t)}>{t}</button>
            ))}
          </div>
        </div>
        {/* 선택 액션 바 */}
        {selected.size > 0 && (
          <div className="px-4 py-3 border-b bg-blue-50 text-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-blue-700 font-medium">✅ {selected.size}개 선택됨</span>
              <span className="text-gray-600 text-xs">체크박스로 여러 이미지를 선택하세요</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                type="button" 
                className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 flex items-center gap-1" 
                onClick={handleMultipleSelect}
              >
                ➕ 선택한 이미지들 삽입
              </button>
              <button 
                type="button" 
                className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600" 
                onClick={()=>setShowBulkEdit(true)}
              >
                📝 일괄 편집
              </button>
              <button 
                type="button" 
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300" 
                onClick={()=>setSelected(new Set())}
              >
                선택 해제
              </button>
            </div>
          </div>
        )}
        <div className="p-4 overflow-auto" style={{ maxHeight: '70vh' }}>
          {isLoading ? (
            <div className="text-center text-gray-600">로딩 중...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((img) => (
                <div
                  key={img.name}
                  data-featured={isFeatured(img) ? 'true' : 'false'}
                  className={`border rounded-lg overflow-hidden text-left group relative ${
                    isFeatured(img)
                      ? 'outline outline-2 outline-yellow-500 outline-offset-2 after:content-[""] after:absolute after:inset-0 after:rounded-lg after:ring-2 after:ring-amber-500 after:pointer-events-none after:z-10'
                      : ''
                  }`}
                >
                  {isFeatured(img) && (
                    <span className="absolute top-1 left-1 z-10 px-1.5 py-0.5 text-[11px] font-semibold rounded bg-yellow-500 text-white shadow">대표</span>
                  )}
                  {/* 선택 체크박스 */}
                  <label className="absolute top-2 left-2 z-10 bg-white/90 rounded px-1 py-0.5 shadow">
                    <input type="checkbox" checked={selected.has(img.name)} onChange={()=>toggleSelect(img.name)} />
                  </label>
                  <button type="button" className="w-full" onClick={() => handleSingleSelect(img)}>
                    <img src={img.url} alt={img.name} className="w-full h-44 object-contain bg-gray-50" />
                    {isFeatured(img) && (
                      <div className="pointer-events-none absolute inset-0 rounded-lg border-2 border-amber-500 shadow-[0_0_0_2px_rgba(255,193,7,0.6)_inset]"></div>
                    )}
                    <div className="p-2 text-xs text-gray-700 truncate flex items-center justify-between">
                      <span className="truncate mr-2">{img.name}</span>
                      {/* 버전 배지 */}
                      {/(_thumb\.|_thumb\.webp$)/i.test(img.name) ? (
                        <span className="px-1 py-0.5 bg-gray-200 text-gray-700 rounded">thumb</span>
                      ) : /_medium\./i.test(img.name) ? (
                        <span className="px-1 py-0.5 bg-indigo-200 text-indigo-800 rounded">medium</span>
                      ) : /\.webp$/i.test(img.name) ? (
                        <span className="px-1 py-0.5 bg-green-200 text-green-800 rounded">webp</span>
                      ) : (
                        <span className="px-1 py-0.5 bg-blue-200 text-blue-800 rounded">original</span>
                      )}
                    </div>
                  </button>
                  {/* 퀵액션 (호버 시 노출) */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button type="button" title="빠른 삽입" className="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
                      onClick={(e)=>{ e.stopPropagation(); handleSingleSelect(img); }}>
                      ➕ 삽입
                    </button>
                    <button type="button" title="대표 이미지로 설정" className="px-3 py-1 text-xs rounded bg-yellow-500 text-white hover:bg-yellow-600"
                      onClick={(e)=>{ e.stopPropagation(); setCurrentFeatured(img.url); if (typeof window!== 'undefined') { window.dispatchEvent(new CustomEvent('tiptap:set-featured-image',{ detail:{ url: img.url } })); } }}>
                      ⭐ 대표
                    </button>
                    <button type="button" title="이미지 확대 보기" className="px-3 py-1 text-xs rounded bg-white text-gray-800 hover:bg-gray-100"
                      onClick={(e)=>{ e.stopPropagation(); setPreviewUrl(img.url); }}>
                      🔍 확대
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between p-3 border-t text-sm text-gray-600 bg-gray-50">
          <div className="flex items-center gap-4">
            <span className="font-medium">📊 총 {total}개 이미지</span>
            <span className="text-gray-500">페이지 {page}</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              type="button" 
              className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50" 
              onClick={()=>setPage(Math.max(1, page-1))}
              disabled={page <= 1}
            >
              ← 이전
            </button>
            <span className="px-3 py-1 bg-white border rounded">{page}</span>
            <button 
              type="button" 
              className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50" 
              onClick={()=>setPage(page+1)}
              disabled={page * pageSize >= total}
            >
              다음 →
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button 
              type="button" 
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300" 
              onClick={() => fetchImages(true)}
              disabled={isLoading}
            >
              {isLoading ? '⏳' : '🔄'} 새로고침
            </button>
            <button type="button" className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600" onClick={onClose}>
              ✕ 닫기
            </button>
          </div>
        </div>
        {/* 미리보기 모달 */}
        {previewUrl && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[80] p-4" onClick={()=>setPreviewUrl(null)}>
            <img src={previewUrl} alt="preview" className="max-w-[95vw] max-h-[90vh] object-contain bg-white rounded" />
          </div>
        )}

        {/* 일괄 편집 모달 */}
        {showBulkEdit && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90] p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-xl">
              <div className="p-4 border-b font-semibold">일괄 편집 ({selected.size}개)</div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <label className="w-28 text-sm text-gray-700">ALT</label>
                  <input value={bulkForm.alt} onChange={(e)=>setBulkForm({...bulkForm, alt:e.target.value})} className="flex-1 px-2 py-1 border rounded" placeholder="추가 또는 교체할 ALT" />
                </div>
                <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={bulkForm.replaceAlt} onChange={(e)=>setBulkForm({...bulkForm, replaceAlt:e.target.checked})}/> ALT 완전 교체</label>
                <div className="flex items-center gap-2">
                  <label className="w-28 text-sm text-gray-700">키워드</label>
                  <input value={bulkForm.keywords} onChange={(e)=>setBulkForm({...bulkForm, keywords:e.target.value})} className="flex-1 px-2 py-1 border rounded" placeholder="쉼표로 구분" />
                </div>
                <div className="flex flex-col gap-2 text-sm">
                  <label className="inline-flex items-center gap-2"><input type="checkbox" checked={bulkForm.appendKeywords} onChange={(e)=>setBulkForm({...bulkForm, appendKeywords:e.target.checked, removeKeywordsOnly:false})}/> 기존 키워드에 추가 (해제 시 교체)</label>
                  <label className="inline-flex items-center gap-2"><input type="checkbox" checked={bulkForm.removeKeywordsOnly} onChange={(e)=>setBulkForm({...bulkForm, removeKeywordsOnly:e.target.checked})}/> 입력한 키워드만 제거</label>
                </div>
              </div>
              <div className="p-4 border-t flex justify-end gap-2">
                <button type="button" className="px-3 py-1 border rounded" onClick={()=>setShowBulkEdit(false)}>취소</button>
                <button type="button" className="px-3 py-1 bg-blue-500 text-white rounded" onClick={handleBulkEdit}>저장</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GalleryPicker;


