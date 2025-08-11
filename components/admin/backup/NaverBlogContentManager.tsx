import React, { useState, useEffect } from 'react';

// 네이버 블로그 실제 관리를 위한 향상된 컴포넌트
export const NaverBlogContentManager = ({ supabase }) => {
  const [activeTab, setActiveTab] = useState('published'); // published, draft, all
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  
  // 새 포스트/편집용 상태
  const [formData, setFormData] = useState({
    account: 'mas9golf',
    author: 'J',
    publishDate: new Date().toISOString().split('T')[0],
    title: '',
    topic: '',
    url: '',
    viewCount: 0,
    keywords: ''
  });

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('naver_blog_contents')
        .select('*')
        .order('publish_date', { ascending: false });

      if (!error && data) {
        setPosts(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setFormData({
      account: post.account || 'mas9golf',
      author: post.author || 'J',
      publishDate: post.publish_date || new Date().toISOString().split('T')[0],
      title: post.title || '',
      topic: post.topic || '',
      url: post.naver_url || '',
      viewCount: post.view_count || 0,
      keywords: post.keywords?.join(', ') || ''
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const saveData = {
        account: formData.account,
        author: formData.author,
        publish_date: formData.publishDate,
        title: formData.title,
        topic: formData.topic,
        naver_url: formData.url,
        view_count: parseInt(formData.viewCount) || 0,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
        last_updated: new Date()
      };

      if (editingPost) {
        // 수정
        const { error } = await supabase
          .from('naver_blog_contents')
          .update(saveData)
          .eq('id', editingPost.id);

        if (!error) {
          alert('수정되었습니다!');
        }
      } else {
        // 신규
        const { error } = await supabase
          .from('naver_blog_contents')
          .insert(saveData);

        if (!error) {
          alert('추가되었습니다!');
        }
      }

      setShowModal(false);
      loadPosts();
      resetForm();
    } catch (err) {
      console.error('저장 오류:', err);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const resetForm = () => {
    setFormData({
      account: 'mas9golf',
      author: 'J',
      publishDate: new Date().toISOString().split('T')[0],
      title: '',
      topic: '',
      url: '',
      viewCount: 0,
      keywords: ''
    });
    setEditingPost(null);
  };

  const updateViewCount = async (postId, newCount) => {
    try {
      const { error } = await supabase
        .from('naver_blog_contents')
        .update({ 
          view_count: parseInt(newCount),
          last_view_check: new Date()
        })
        .eq('id', postId);

      if (!error) {
        loadPosts();
      }
    } catch (err) {
      console.error('조회수 업데이트 오류:', err);
    }
  };

  // 계정별 색상
  const getAccountColor = (account) => {
    const colors = {
      'mas9golf': 'bg-green-100 text-green-800',
      'massgoogolf': 'bg-blue-100 text-blue-800',
      'massgoogolfkorea': 'bg-purple-100 text-purple-800'
    };
    return colors[account] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">네이버 블로그 콘텐츠 관리</h2>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          + 새 포스트 추가
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold">{posts.length}</div>
          <div className="text-sm text-gray-600">총 포스트</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold">
            {posts.reduce((sum, p) => sum + (p.view_count || 0), 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">총 조회수</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold">
            {posts.filter(p => p.account === 'mas9golf').length}
          </div>
          <div className="text-sm text-gray-600">mas9golf (조)</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold">
            {posts.filter(p => p.account === 'massgoogolf').length}
          </div>
          <div className="text-sm text-gray-600">massgoogolf (미)</div>
        </div>
      </div>

      {/* 포스트 리스트 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">계정/작성자</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">게시일</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">제목</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">주제</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">조회수</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {posts.map((post) => (
              <tr key={post.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div>
                    <span className={`inline-flex px-2 py-1 text-xs rounded ${getAccountColor(post.account)}`}>
                      {post.account}
                    </span>
                    <span className="ml-2 text-sm text-gray-600">{post.author}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  {new Date(post.publish_date).toLocaleDateString('ko-KR')}
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-gray-900">{post.title}</div>
                  {post.naver_url && (
                    <a
                      href={post.naver_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      블로그 보기 →
                    </a>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{post.topic}</td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="number"
                    value={post.view_count || 0}
                    onChange={(e) => updateViewCount(post.id, e.target.value)}
                    className="w-20 px-2 py-1 text-center border rounded"
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleEdit(post)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    편집
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 추가/편집 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <h3 className="text-xl font-semibold mb-4">
              {editingPost ? '포스트 편집' : '새 포스트 추가'}
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">계정</label>
                  <select
                    value={formData.account}
                    onChange={(e) => setFormData({...formData, account: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="mas9golf">mas9golf (조)</option>
                    <option value="massgoogolf">massgoogolf (미)</option>
                    <option value="massgoogolfkorea">massgoogolfkorea (싸)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">작성자</label>
                  <select
                    value={formData.author}
                    onChange={(e) => setFormData({...formData, author: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="J">J (제이)</option>
                    <option value="S">S (스테피)</option>
                    <option value="미">미</option>
                    <option value="조">조</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">게시일</label>
                  <input
                    type="date"
                    value={formData.publishDate}
                    onChange={(e) => setFormData({...formData, publishDate: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">제목</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="[사용자 리뷰] 드라이버는 진화한다..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">주제/글감</label>
                <input
                  type="text"
                  value={formData.topic}
                  onChange={(e) => setFormData({...formData, topic: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="박영구 후기"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">네이버 URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="https://blog.naver.com/mas9golf/..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">조회수</label>
                  <input
                    type="number"
                    value={formData.viewCount}
                    onChange={(e) => setFormData({...formData, viewCount: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">키워드 (쉼표 구분)</label>
                  <input
                    type="text"
                    value={formData.keywords}
                    onChange={(e) => setFormData({...formData, keywords: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="시니어골프, 드라이버추천"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingPost ? '수정' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};