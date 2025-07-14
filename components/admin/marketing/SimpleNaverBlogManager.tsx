import React, { useState, useEffect } from 'react';

// 실제 네이버 블로그 운영에 최적화된 관리 도구
export const SimpleNaverBlogManager = ({ supabase }) => {
  const [contents, setContents] = useState([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  
  // 새 글감 입력
  const [newContent, setNewContent] = useState({
    title: '',
    topic: '',
    keywords: ''
  });

  useEffect(() => {
    loadContents();
  }, []);

  const loadContents = async () => {
    try {
      const { data, error } = await supabase
        .from('weekly_publish_plan')
        .select('*')
        .order('created_date', { ascending: false });

      if (!error && data) {
        setContents(data);
      }
    } catch (err) {
      console.error('데이터 로드 오류:', err);
    }
  };

  // 새 글감 저장
  const saveNewContent = async () => {
    try {
      // 1. 마스터 콘텐츠 저장
      const { data: master, error: masterError } = await supabase
        .from('naver_content_master')
        .insert({
          title: newContent.title,
          topic: newContent.topic,
          keywords: newContent.keywords.split(',').map(k => k.trim())
        })
        .select()
        .single();

      if (!masterError && master) {
        // 2. 3개 계정에 대한 발행 계획 생성
        const accounts = ['mas9golf', 'massgoogolf', 'massgoogolfkorea'];
        const publishPlans = accounts.map((account, index) => ({
          master_id: master.id,
          account: account,
          title: newContent.title, // 나중에 변형
          publish_date: null, // 나중에 설정
          status: 'planned'
        }));

        await supabase
          .from('naver_posts')
          .insert(publishPlans);

        alert('새 글감이 추가되었습니다!');
        setShowNewModal(false);
        loadContents();
        setNewContent({ title: '', topic: '', keywords: '' });
      }
    } catch (err) {
      console.error('저장 오류:', err);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  // 발행 상태 업데이트
  const updatePublishStatus = async (masterId, account, status, url = null) => {
    try {
      const updateData = {
        status: status,
        publish_date: status === 'published' ? new Date() : null
      };
      
      if (url) {
        updateData.naver_url = url;
      }

      await supabase
        .from('naver_posts')
        .update(updateData)
        .eq('master_id', masterId)
        .eq('account', account);

      loadContents();
    } catch (err) {
      console.error('상태 업데이트 오류:', err);
    }
  };

  // 조회수 업데이트
  const updateViewCount = async (masterId, account, viewCount) => {
    try {
      await supabase
        .from('naver_posts')
        .update({ 
          view_count: parseInt(viewCount),
          last_check: new Date()
        })
        .eq('master_id', masterId)
        .eq('account', account);

      loadContents();
    } catch (err) {
      console.error('조회수 업데이트 오류:', err);
    }
  };

  // 계정별 색상
  const getAccountColor = (account) => {
    const colors = {
      'mas9golf': 'green',
      'massgoogolf': 'blue',
      'massgoogolfkorea': 'purple'
    };
    return colors[account] || 'gray';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">네이버 블로그 통합 관리</h2>
          <p className="text-gray-600 mt-1">3개 계정 동시 관리 · 2시간 간격 발행</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          + 새 글감 추가
        </button>
      </div>

      {/* 발행 가이드 */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">📌 발행 프로세스</h3>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>1. <span className="text-green-600 font-medium">mas9golf (조)</span> - 첫 발행</li>
          <li>2. <span className="text-blue-600 font-medium">massgoogolf (미)</span> - 2시간 후</li>
          <li>3. <span className="text-purple-600 font-medium">massgoogolfkorea (싸)</span> - 4시간 후</li>
        </ol>
      </div>

      {/* 콘텐츠 리스트 */}
      <div className="space-y-4">
        {contents.map((content) => (
          <div key={content.id} className="bg-white rounded-lg shadow-sm border p-6">
            {/* 글감 정보 */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold">{content.base_title}</h3>
              <p className="text-gray-600 text-sm mt-1">{content.topic}</p>
            </div>

            {/* 3개 계정 발행 상태 */}
            <div className="grid grid-cols-3 gap-4">
              {/* mas9golf */}
              <div className="border rounded-lg p-4 border-green-200 bg-green-50">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-green-700">mas9golf (조)</h4>
                  <span className={`px-2 py-1 text-xs rounded ${
                    content.mas9golf_status === 'published' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {content.mas9golf_status === 'published' ? '발행완료' : '대기중'}
                  </span>
                </div>
                
                {content.mas9golf_status === 'published' ? (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-600">
                      {content.mas9golf_date && new Date(content.mas9golf_date).toLocaleString('ko-KR')}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">조회수:</span>
                      <input
                        type="number"
                        value={content.mas9golf_views || 0}
                        onChange={(e) => updateViewCount(content.id, 'mas9golf', e.target.value)}
                        className="w-20 px-2 py-1 text-sm border rounded"
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      const url = prompt('네이버 URL을 입력하세요:');
                      if (url) updatePublishStatus(content.id, 'mas9golf', 'published', url);
                    }}
                    className="w-full mt-2 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    발행 완료
                  </button>
                )}
              </div>

              {/* massgoogolf */}
              <div className="border rounded-lg p-4 border-blue-200 bg-blue-50">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-blue-700">massgoogolf (미)</h4>
                  <span className={`px-2 py-1 text-xs rounded ${
                    content.massgoogolf_status === 'published' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {content.massgoogolf_status === 'published' ? '발행완료' : '대기중'}
                  </span>
                </div>
                
                {content.massgoogolf_status === 'published' ? (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-600">
                      {content.massgoogolf_date && new Date(content.massgoogolf_date).toLocaleString('ko-KR')}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">조회수:</span>
                      <input
                        type="number"
                        value={content.massgoogolf_views || 0}
                        onChange={(e) => updateViewCount(content.id, 'massgoogolf', e.target.value)}
                        className="w-20 px-2 py-1 text-sm border rounded"
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      const url = prompt('네이버 URL을 입력하세요:');
                      if (url) updatePublishStatus(content.id, 'massgoogolf', 'published', url);
                    }}
                    className="w-full mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    disabled={content.mas9golf_status !== 'published'}
                  >
                    발행 완료
                  </button>
                )}
              </div>

              {/* massgoogolfkorea */}
              <div className="border rounded-lg p-4 border-purple-200 bg-purple-50">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-purple-700">massgoogolfkorea (싸)</h4>
                  <span className={`px-2 py-1 text-xs rounded ${
                    content.massgoogolfkorea_status === 'published' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {content.massgoogolfkorea_status === 'published' ? '발행완료' : '대기중'}
                  </span>
                </div>
                
                {content.massgoogolfkorea_status === 'published' ? (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-600">
                      {content.massgoogolfkorea_date && new Date(content.massgoogolfkorea_date).toLocaleString('ko-KR')}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">조회수:</span>
                      <input
                        type="number"
                        value={content.massgoogolfkorea_views || 0}
                        onChange={(e) => updateViewCount(content.id, 'massgoogolfkorea', e.target.value)}
                        className="w-20 px-2 py-1 text-sm border rounded"
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      const url = prompt('네이버 URL을 입력하세요:');
                      if (url) updatePublishStatus(content.id, 'massgoogolfkorea', 'published', url);
                    }}
                    className="w-full mt-2 px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                    disabled={content.massgoogolf_status !== 'published'}
                  >
                    발행 완료
                  </button>
                )}
              </div>
            </div>

            {/* 전체 통계 */}
            <div className="mt-4 pt-4 border-t flex justify-between items-center">
              <div className="text-sm text-gray-600">
                총 조회수: <span className="font-semibold text-gray-900">
                  {(content.mas9golf_views || 0) + (content.massgoogolf_views || 0) + (content.massgoogolfkorea_views || 0)}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                발행 상태: {
                  [content.mas9golf_status, content.massgoogolf_status, content.massgoogolfkorea_status]
                    .filter(s => s === 'published').length
                } / 3
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 새 글감 모달 */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <h3 className="text-xl font-semibold mb-4">새 글감 추가</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">기본 제목</label>
                <input
                  type="text"
                  value={newContent.title}
                  onChange={(e) => setNewContent({...newContent, title: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="시니어 골퍼를 위한 드라이버 선택 가이드"
                />
                <p className="text-xs text-gray-500 mt-1">각 계정별로 제목을 변형해서 사용하세요</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">주제/글감</label>
                <input
                  type="text"
                  value={newContent.topic}
                  onChange={(e) => setNewContent({...newContent, topic: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="박영구 후기"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">키워드</label>
                <input
                  type="text"
                  value={newContent.keywords}
                  onChange={(e) => setNewContent({...newContent, keywords: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="시니어골프, 드라이버추천, MASGOLF"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowNewModal(false);
                  setNewContent({ title: '', topic: '', keywords: '' });
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={saveNewContent}
                disabled={!newContent.title || !newContent.topic}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};