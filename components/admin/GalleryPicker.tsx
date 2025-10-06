import React, { useEffect, useMemo, useState } from 'react';

type ImageItem = { name: string; url: string };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, options?: { alt?: string; title?: string }) => void;
  featuredUrl?: string;
};

const GalleryPicker: React.FC<Props> = ({ isOpen, onClose, onSelect, featuredUrl }) => {
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

  useEffect(() => {
    if (!isOpen) return;
    const fetchImages = async () => {
      try {
        setIsLoading(true);
        const offset = (page - 1) * pageSize;
        const res = await fetch(`/api/admin/all-images?limit=${pageSize}&offset=${offset}`);
        const data = await res.json();
        if (res.ok) {
          setAllImages(data.images || []);
          setTotal(data.total || 0);
        }
      } finally {
        setIsLoading(false);
      }
    };
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

  const toggleSelect = (name: string) => {
    setSelected(prev => {
      const s = new Set(prev);
      if (s.has(name)) s.delete(name); else s.add(name);
      return s;
    });
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
          <h3 className="text-lg font-semibold text-gray-800">이미지 선택하여 본문에 삽입</h3>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
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
          <div className="px-4 py-2 border-b bg-blue-50 text-sm flex items-center justify-between">
            <span className="text-blue-700">{selected.size}개 선택됨</span>
            <div className="flex items-center gap-2">
              <button type="button" className="px-2 py-1 rounded bg-blue-500 text-white" onClick={()=>setShowBulkEdit(true)}>📝 일괄 편집</button>
              <button type="button" className="px-2 py-1 rounded bg-gray-200" onClick={()=>setSelected(new Set())}>선택 해제</button>
            </div>
          </div>
        )}
        <div className="p-4 overflow-auto" style={{ maxHeight: '64vh' }}>
          {isLoading ? (
            <div className="text-center text-gray-600">로딩 중...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {filtered.map((img) => (
                <div key={img.name} className={`border rounded-lg overflow-hidden text-left group relative ${currentFeatured===img.url ? 'ring-2 ring-yellow-400' : ''}`}>
                  {/* 선택 체크박스 */}
                  <label className="absolute top-2 left-2 z-10 bg-white/80 rounded px-1 py-0.5">
                    <input type="checkbox" checked={selected.has(img.name)} onChange={()=>toggleSelect(img.name)} />
                  </label>
                  <button type="button" className="w-full" onClick={() => onSelect(img.url, { alt: altText || img.name })}>
                    <img src={img.url} alt={img.name} className="w-full h-32 object-contain bg-gray-50" />
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
                  {/* 퀵액션 */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button type="button" title="삽입" className="px-2 py-1 text-xs rounded bg-blue-500 text-white hover:bg-blue-600"
                      onClick={(e)=>{ e.stopPropagation(); onSelect(img.url, { alt: altText || img.name }); }}>
                      ➕ 삽입
                    </button>
                    <button type="button" title="대표로" className="px-2 py-1 text-xs rounded bg-yellow-500 text-white hover:bg-yellow-600"
                      onClick={(e)=>{ e.stopPropagation(); setCurrentFeatured(img.url); if (typeof window!== 'undefined') { window.dispatchEvent(new CustomEvent('tiptap:set-featured-image',{ detail:{ url: img.url } })); } }}>
                      ⭐ 대표
                    </button>
                    <button type="button" title="복사" className="px-2 py-1 text-xs rounded bg-gray-600 text-white hover:bg-gray-700"
                      onClick={(e)=>{ e.stopPropagation(); navigator.clipboard.writeText(img.url); }}>
                      📋 복사
                    </button>
                    <button type="button" title="확대" className="px-2 py-1 text-xs rounded bg-white text-gray-800 hover:bg-gray-100"
                      onClick={(e)=>{ e.stopPropagation(); setPreviewUrl(img.url); }}>
                      🔍 확대
                    </button>
                    <button type="button" title="정보" className="px-2 py-1 text-xs rounded bg-white text-gray-800 hover:bg-gray-100"
                      onClick={(e)=>{ e.stopPropagation(); alert(`이름: ${img.name}\nURL: ${img.url}`); }}>
                      ℹ️ 정보
                    </button>
                    <button type="button" title="메타 편집" className="px-2 py-1 text-xs rounded bg-purple-500 text-white hover:bg-purple-600"
                      onClick={async (e)=>{ e.stopPropagation();
                        const newAlt = prompt('ALT 텍스트 입력(비우면 변경 없음)', altText || '');
                        const newKeywords = prompt('키워드 입력(쉼표로 구분, 비우면 변경 없음)', '');
                        try {
                          await fetch('/api/admin/image-metadata', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageName: img.name, alt_text: newAlt || undefined, keywords: newKeywords ? newKeywords.split(',').map(s=>s.trim()).filter(Boolean) : undefined }) });
                          alert('저장되었습니다.');
                        } catch { alert('저장에 실패했습니다.'); }
                      }}>
                      ✎ 편집
                    </button>
                    <button type="button" title="삭제" className="px-2 py-1 text-xs rounded bg-red-500 text-white hover:bg-red-600"
                      onClick={async (e)=>{ e.stopPropagation(); if (!confirm('이미지를 삭제하시겠습니까? 사용중인 곳이 있으면 깨질 수 있습니다.')) return; try { const res = await fetch('/api/admin/delete-image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageName: img.name }) }); if (res.ok) { setAllImages(prev=>prev.filter(i=>i.name!==img.name)); alert('삭제되었습니다.'); } else { alert('삭제 실패'); } } catch { alert('삭제 실패'); } }}>
                      🗑 삭제
                    </button>
                    <button type="button" title="새 탭" className="px-2 py-1 text-xs rounded bg-white text-gray-800 hover:bg-gray-100"
                      onClick={(e)=>{ e.stopPropagation(); window.open(img.url, '_blank'); }}>
                      🔗 링크
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between p-3 border-t text-sm text-gray-600">
          <div>총 {total}개</div>
          <div className="flex items-center gap-2">
            <button type="button" className="px-2 py-1 border rounded" onClick={()=>setPage(Math.max(1, page-1))}>이전</button>
            <span>{page}</span>
            <button type="button" className="px-2 py-1 border rounded" onClick={()=>setPage(page+1)}>다음</button>
          </div>
          <button type="button" className="px-3 py-1 bg-blue-500 text-white rounded" onClick={onClose}>닫기</button>
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


