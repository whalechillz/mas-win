import React, { useState, useEffect } from 'react';
import { Calendar, User, Eye, Link, Tag } from 'lucide-react';

// 초간단 네이버 블로그 매니저
export const SimpleBlogManager = ({ supabase }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // 간단한 입력 폼
  const [newPost, setNewPost] = useState({
    topic: '',
    angle: 'review', // review, tip, comparison
    assignee: 'J',
    status: 'idea'
  });

  // 데이터 로드
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('simple_blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // 글 추가
  const addPost = async () => {
    try {
      // 하나의 주제로 3개의 다른 앵글 생성
      const angles = {
        review: `[실제 후기] ${newPost.topic}`,
        tip: `[전문가 팁] ${newPost.topic}`,
        comparison: `[비교 분석] ${newPost.topic}`
      };

      const postsToAdd = [
        {
          topic: newPost.topic,
          angle: 'review',
          title: angles.review,
          account: 'mas9golf',
          assignee: newPost.assignee,
          status: 'idea',
          publish_time: '09:00'
        },
        {
          topic: newPost.topic,
          angle: 'tip',
          title: angles.tip,
          account: 'massgoogolf',
          assignee: newPost.assignee,
          status: 'idea',
          publish_time: '14:00'
        },
        {
          topic: newPost.topic,
          angle: 'comparison',
          title: angles.comparison,
          account: 'massgoogolfkorea',
          assignee: newPost.assignee,
          status: 'idea',
          publish_time: '19:00'
        }
      ];

      const { error } = await supabase
        .from('simple_blog_posts')
        .insert(postsToAdd);

      if (error) throw error;

      await loadPosts();
      setShowAddForm(false);
      setNewPost({ topic: '', angle: 'review', assignee: 'J', status: 'idea' });
    } catch (error) {
      console.error('Error adding posts:', error);
      alert('추가 실패: ' + error.message);
    }
  };

  // 상태 업데이트
  const updateStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('simple_blog_posts')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      await loadPosts();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // URL 업데이트
  const updateUrl = async (id, url) => {
    try {
      const { error } = await supabase
        .from('simple_blog_posts')
        .update({ 
          naver_url: url,
          published_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      await loadPosts();
    } catch (error) {
      console.error('Error updating URL:', error);
    }
  };

  // 조회수 업데이트
  const updateViews = async (id, views) => {
    try {
      const { error } = await supabase
        .from('simple_blog_posts')
        .update({ view_count: views })
        .eq('id', id);

      if (error) throw error;
      await loadPosts();
    } catch (error) {
      console.error('Error updating views:', error);
    }
  };

  // 주제별 그룹핑
  const groupedPosts = posts.reduce((acc, post) => {
    if (!acc[post.topic]) {
      acc[post.topic] = [];
    }
    acc[post.topic].push(post);
    return acc;
  }, {});

  if (loading) return <div className="p-6">로딩중...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">네이버 블로그 관리</h2>
          <p className="text-gray-600">1개 주제 → 3개 다른 앵글로 발행</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + 새 주제 추가
        </button>
      </div>

      {/* 핵심 전략 안내 */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">✅ 올바른 전략</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• 같은 주제를 <strong>다른 관점</strong>으로 작성 (후기/팁/비교)</p>
          <p>• 각 계정별 고유한 톤앤매너 유지</p>
          <p>• 시간차 발행 (오전/오후/저녁)</p>
        </div>
      </div>

      {/* 새 주제 추가 폼 */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">새 주제 추가</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">주제</label>
                <input
                  type="text"
                  value={newPost.topic}
                  onChange={(e) => setNewPost({...newPost, topic: e.target.value})}
                  placeholder="예: 시니어 골퍼를 위한 MASGOLF 드라이버"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">담당자</label>
                <select
                  value={newPost.assignee}
                  onChange={(e) => setNewPost({...newPost, assignee: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="J">J</option>
                  <option value="S">S</option>
                  <option value="미">미</option>
                  <option value="조">조</option>
                </select>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg text-sm">
                <p className="font-medium mb-1">자동 생성될 3개 글:</p>
                <p>• [실제 후기] {newPost.topic || '...'}</p>
                <p>• [전문가 팁] {newPost.topic || '...'}</p>
                <p>• [비교 분석] {newPost.topic || '...'}</p>
              </div>
            </div>
            
            <div className="mt-6 flex gap-2">
              <button
                onClick={addPost}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                추가
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 주제별 글 목록 */}
      <div className="space-y-6">
        {Object.entries(groupedPosts).map(([topic, topicPosts]) => (
          <div key={topic} className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="font-semibold text-lg">{topic}</h3>
              <div className="mt-1 text-sm text-gray-600">
                담당: {topicPosts[0]?.assignee} | 
                총 조회수: {topicPosts.reduce((sum, p) => sum + (p.view_count || 0), 0)}
              </div>
            </div>
            
            <div className="divide-y">
              {topicPosts.map((post) => (
                <div key={post.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 text-xs rounded ${
                          post.account === 'mas9golf' ? 'bg-green-100 text-green-700' :
                          post.account === 'massgoogolf' ? 'bg-blue-100 text-blue-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {post.account}
                        </span>
                        <span className="text-sm text-gray-500">{post.publish_time}</span>
                      </div>
                      
                      <h4 className="font-medium mb-2">{post.title}</h4>
                      
                      {/* 상태별 액션 */}
                      <div className="flex items-center gap-4">
                        <select
                          value={post.status}
                          onChange={(e) => updateStatus(post.id, e.target.value)}
                          className={`px-3 py-1 text-sm border rounded ${
                            post.status === 'idea' ? 'bg-gray-50' :
                            post.status === 'writing' ? 'bg-yellow-50' :
                            post.status === 'ready' ? 'bg-blue-50' :
                            'bg-green-50'
                          }`}
                        >
                          <option value="idea">아이디어</option>
                          <option value="writing">작성중</option>
                          <option value="ready">발행준비</option>
                          <option value="published">발행완료</option>
                        </select>
                        
                        {post.status === 'ready' && (
                          <input
                            type="text"
                            placeholder="네이버 URL 입력"
                            className="px-3 py-1 text-sm border rounded flex-1"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && e.target.value) {
                                updateUrl(post.id, e.target.value);
                                e.target.value = '';
                              }
                            }}
                          />
                        )}
                        
                        {post.naver_url && (
                          <>
                            <a 
                              href={post.naver_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Link className="w-4 h-4" />
                            </a>
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4 text-gray-400" />
                              <input
                                type="number"
                                value={post.view_count || 0}
                                onChange={(e) => updateViews(post.id, parseInt(e.target.value) || 0)}
                                className="w-20 px-2 py-1 text-sm border rounded"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};