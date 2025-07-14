import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react';

// 휴지통 관리자
export const TrashManager = ({ supabase }) => {
  const [deletedContents, setDeletedContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);

  // 삭제된 콘텐츠 로드
  useEffect(() => {
    loadDeletedContents();
  }, []);

  const loadDeletedContents = async () => {
    try {
      const { data, error } = await supabase
        .from('content_ideas')
        .select('*')
        .eq('status', 'deleted')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setDeletedContents(data || []);
    } catch (error) {
      console.error('Error loading deleted contents:', error);
    } finally {
      setLoading(false);
    }
  };

  // 복구
  const restoreContent = async (content) => {
    if (!confirm(`"${content.title}"을(를) 복구하시겠습니까?`)) return;

    try {
      const { error } = await supabase
        .from('content_ideas')
        .update({ status: 'idea' })  // 아이디어 상태로 복구
        .eq('id', content.id);

      if (error) throw error;
      
      alert('복구되었습니다.');
      await loadDeletedContents();
    } catch (error) {
      console.error('Error restoring:', error);
      alert(`복구 실패: ${error.message}`);
    }
  };

  // 완전 삭제
  const permanentDelete = async (content) => {
    if (!confirm(`"${content.title}"을(를) 완전히 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다!`)) {
      return;
    }

    try {
      // 1. 참조 확인
      const { data: refs, error: refCheckError } = await supabase
        .from('naver_publishing')
        .select('id')
        .eq('content_idea_id', content.id);

      if (refCheckError) throw refCheckError;

      if (refs && refs.length > 0) {
        if (!confirm(`네이버 발행 기록 ${refs.length}개가 함께 삭제됩니다. 계속하시겠습니까?`)) {
          return;
        }

        // 참조 데이터 먼저 삭제
        const { error: refDelError } = await supabase
          .from('naver_publishing')
          .delete()
          .eq('content_idea_id', content.id);

        if (refDelError) throw refDelError;
      }

      // 2. 본 데이터 삭제
      const { error } = await supabase
        .from('content_ideas')
        .delete()
        .eq('id', content.id);

      if (error) throw error;

      alert('완전히 삭제되었습니다.');
      await loadDeletedContents();
    } catch (error) {
      console.error('Error permanent delete:', error);
      alert(`완전 삭제 실패: ${error.message}`);
    }
  };

  // 일괄 복구
  const bulkRestore = async () => {
    if (selectedItems.length === 0) {
      alert('복구할 항목을 선택해주세요.');
      return;
    }

    if (!confirm(`선택한 ${selectedItems.length}개 항목을 복구하시겠습니까?`)) return;

    try {
      const { error } = await supabase
        .from('content_ideas')
        .update({ status: 'idea' })
        .in('id', selectedItems);

      if (error) throw error;

      alert(`${selectedItems.length}개 항목이 복구되었습니다.`);
      setSelectedItems([]);
      await loadDeletedContents();
    } catch (error) {
      console.error('Error bulk restore:', error);
      alert(`일괄 복구 실패: ${error.message}`);
    }
  };

  // 휴지통 비우기
  const emptyTrash = async () => {
    if (!confirm('휴지통을 비우시겠습니까?\n\n⚠️ 모든 삭제된 항목이 완전히 제거됩니다!')) {
      return;
    }

    try {
      // 참조 데이터 먼저 삭제
      const { error: refError } = await supabase
        .from('naver_publishing')
        .delete()
        .in('content_idea_id', deletedContents.map(c => c.id));

      // 본 데이터 삭제
      const { error } = await supabase
        .from('content_ideas')
        .delete()
        .eq('status', 'deleted');

      if (error) throw error;

      alert('휴지통이 비워졌습니다.');
      await loadDeletedContents();
    } catch (error) {
      console.error('Error emptying trash:', error);
      alert(`휴지통 비우기 실패: ${error.message}`);
    }
  };

  if (loading) return <div className="p-6">로딩중...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trash2 className="w-6 h-6" />
            휴지통
          </h2>
          <p className="text-gray-600">삭제된 콘텐츠를 복구하거나 완전히 삭제할 수 있습니다.</p>
        </div>
        <div className="flex gap-2">
          {selectedItems.length > 0 && (
            <button
              onClick={bulkRestore}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              선택 항목 복구 ({selectedItems.length})
            </button>
          )}
          {deletedContents.length > 0 && (
            <button
              onClick={emptyTrash}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              휴지통 비우기
            </button>
          )}
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600">총 삭제 항목</div>
          <div className="text-2xl font-bold text-gray-900">{deletedContents.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600">30일 이상</div>
          <div className="text-2xl font-bold text-orange-600">
            {deletedContents.filter(c => 
              new Date(c.updated_at) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            ).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600">참조 있음</div>
          <div className="text-2xl font-bold text-red-600">-</div>
        </div>
      </div>

      {/* 휴지통 내용 */}
      {deletedContents.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <Trash2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">휴지통이 비어있습니다.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b bg-gray-50">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={selectedItems.length === deletedContents.length}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedItems(deletedContents.map(c => c.id));
                  } else {
                    setSelectedItems([]);
                  }
                }}
              />
              전체 선택
            </label>
          </div>
          <div className="divide-y">
            {deletedContents.map(content => {
              const deletedDays = Math.floor(
                (Date.now() - new Date(content.updated_at).getTime()) / (1000 * 60 * 60 * 24)
              );
              
              return (
                <div key={content.id} className="p-4 hover:bg-gray-50 flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(content.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems([...selectedItems, content.id]);
                      } else {
                        setSelectedItems(selectedItems.filter(id => id !== content.id));
                      }
                    }}
                  />
                  
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{content.title}</div>
                    <div className="text-sm text-gray-500">
                      {content.platform} • {content.assignee} • {deletedDays}일 전 삭제
                    </div>
                    {content.tags && (
                      <div className="flex gap-1 mt-1">
                        {content.tags.split(',').map((tag, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => restoreContent(content)}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center gap-1"
                    >
                      <RotateCcw className="w-4 h-4" />
                      복구
                    </button>
                    <button
                      onClick={() => permanentDelete(content)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      완전 삭제
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 안내 메시지 */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <p className="text-sm text-yellow-800">
          💡 <strong>팁:</strong> 30일 이상 된 항목은 자동으로 삭제되지 않습니다. 
          필요시 수동으로 완전 삭제하거나 '휴지통 비우기'를 사용하세요.
        </p>
      </div>
    </div>
  );
};