import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminNav from '../../components/admin/AdminNav';
import { TitleScorer } from '../../components/shared/TitleScorer';
import { ShortLinkGenerator } from '../../components/shared/ShortLinkGenerator';
import { AIImagePicker } from '../../components/shared/AIImagePicker';
import { MessageOptimizer } from '../../components/shared/MessageOptimizer';
import { useChannelEditor } from '../../lib/hooks/useChannelEditor';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

export default function SMSAdmin() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id, calendarId, blogPostId } = router.query;

  const {
    formData,
    updateFormData,
    isLoading,
    error,
    loadFromBlog,
    saveDraft,
    loadPost,
    updatePost,
    deletePost,
    sendMessage,
    resetForm
  } = useChannelEditor('sms');

  const [showPreview, setShowPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [blogPosts, setBlogPosts] = useState([]);
  const [selectedBlogId, setSelectedBlogId] = useState('');
  const [contentScore, setContentScore] = useState(0);

  // 메시지 타입 초기값 설정 (useChannelEditor에서 이미 설정됨)
  useEffect(() => {
    console.log('SMS 에디터 - 현재 messageType:', formData.messageType);
  }, [formData.messageType]);

  // 블로그 포스트 목록 로드
  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        const response = await fetch('/api/admin/blog');
        if (response.ok) {
          const data = await response.json();
          setBlogPosts(data.posts || []);
        }
      } catch (error) {
        console.error('블로그 포스트 로드 실패:', error);
      }
    };
    fetchBlogPosts();
  }, []);

  // 페이지 로드 시 데이터 로드
  useEffect(() => {
    if (id) {
      loadPost(parseInt(id as string));
    } else if (blogPostId) {
      loadFromBlog(parseInt(blogPostId as string));
    }
  }, [id, blogPostId, loadPost, loadFromBlog]);

  // 인증 확인
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    router.push('/admin/login');
    return null;
  }

  // 문자 길이 계산
  const getMessageLength = () => {
    let length = formData.content.length;
    if (formData.shortLink) {
      length += formData.shortLink.length + 8; // "링크: " + URL
    }
    return length;
  };

  // 메시지 타입별 최대 길이
  const getMaxLength = () => {
    const messageType = formData.messageType || 'SMS';
    console.log('getMaxLength - messageType:', messageType);
    switch (messageType) {
      case 'SMS': return 90;
      case 'SMS300': return 300;
      case 'LMS': return 2000;
      case 'MMS': return 2000;
      default: return 90;
    }
  };

  // 문자 길이 상태 (실시간 업데이트)
  const messageLength = getMessageLength();
  const maxLength = getMaxLength();

  // 문자 길이 상태
  const getLengthStatus = () => {
    const percentage = (messageLength / maxLength) * 100;
    
    if (percentage > 100) return { color: 'text-red-600', bg: 'bg-red-500' };
    if (percentage > 80) return { color: 'text-yellow-600', bg: 'bg-yellow-500' };
    return { color: 'text-green-600', bg: 'bg-green-500' };
  };

  // 초안 저장
  const handleSaveDraft = async () => {
    try {
      await saveDraft(
        calendarId ? parseInt(calendarId as string) : undefined,
        blogPostId ? parseInt(blogPostId as string) : undefined
      );
      alert('초안이 저장되었습니다.');
    } catch (error) {
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  // 실제 발송
  const handleSend = async () => {
    if (!formData.recipientNumbers?.length) {
      alert('수신자 번호를 입력해주세요.');
      return;
    }

    if (getMessageLength() > getMaxLength()) {
      alert(`메시지가 ${getMaxLength()}자를 초과합니다.`);
      return;
    }

    if (!confirm('정말로 SMS를 발송하시겠습니까?')) {
      return;
    }

    setIsSending(true);
    try {
      const channelPostId = id ? parseInt(id as string) : await saveDraft(
        calendarId ? parseInt(calendarId as string) : undefined,
        blogPostId ? parseInt(blogPostId as string) : undefined
      );

      await sendMessage(channelPostId);
      alert('SMS가 성공적으로 발송되었습니다.');
      router.push('/admin/sms');
    } catch (error) {
      alert('발송 중 오류가 발생했습니다.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Head>
        <title>SMS/MMS 에디터 - MASGOLF</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 헤더 */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">SMS/MMS 에디터</h1>
                <p className="mt-2 text-gray-600">문자 메시지를 작성하고 발송하세요</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSaveDraft}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
                >
                  {isLoading ? '저장 중...' : '초안 저장'}
                </button>
                <button
                  onClick={handleSend}
                  disabled={isLoading || isSending || !formData.content.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {isSending ? '발송 중...' : 'SMS 발송'}
                </button>
              </div>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* 블로그 소스에서 가져오기 */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              📝 블로그 소스에서 가져오기
            </h3>
            <p className="text-blue-700 mb-3">
              기존 블로그 포스트를 선택한 메시지 타입에 최적화된 형태로 변환합니다.
            </p>
            <div className="bg-blue-100 p-3 rounded-lg mb-3">
              <p className="text-sm text-blue-800">
                💡 <strong>사용법:</strong> 먼저 메시지 타입을 선택한 후 블로그를 가져오면 해당 타입에 맞게 자동 최적화됩니다.
              </p>
            </div>
            <div className="flex gap-4 items-center">
              <select
                value={selectedBlogId}
                onChange={(e) => setSelectedBlogId(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">블로그 포스트를 선택하세요</option>
                {blogPosts.map((post) => (
                  <option key={post.id} value={post.id}>
                    {post.title} ({post.status === 'published' ? '발행됨' : '초안'})
                  </option>
                ))}
              </select>
              <button
                onClick={async () => {
                  if (selectedBlogId) {
                    try {
                      // 현재 선택된 메시지 타입을 전달하여 해당 타입에 맞게 최적화
                      await loadFromBlog(parseInt(selectedBlogId), formData.messageType);
                      alert(`블로그 내용이 ${formData.messageType || 'SMS'}에 최적화되어 로드되었습니다!`);
                    } catch (error) {
                      console.error('블로그 로드 실패:', error);
                      alert('블로그 내용 로드에 실패했습니다.');
                    }
                  }
                }}
                disabled={!selectedBlogId || isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? '로딩 중...' : '가져오기'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 왼쪽: 편집 영역 */}
            <div className="space-y-6">
              {/* 메시지 타입 선택 */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">메시지 타입</h3>
                  <span className="text-sm text-blue-600 font-medium">
                    현재: {formData.messageType || 'SMS'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { type: 'SMS', limit: '90자' },
                    { type: 'SMS300', limit: '300자' },
                    { type: 'LMS', limit: '2000자' },
                    { type: 'MMS', limit: '2000자' }
                  ].map(({ type, limit }) => (
                    <button
                      key={type}
                      onClick={() => {
                        console.log('메시지 타입 변경:', type);
                        updateFormData({ messageType: type });
                      }}
                      className={`p-3 border rounded-lg text-center ${
                        formData.messageType === type
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="font-medium">{type}</div>
                      <div className="text-sm text-gray-500">{limit}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 메시지 내용 */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">메시지 내용</h3>
                  <div className="flex items-center gap-3">
                    <div className={`text-sm ${getLengthStatus().color}`}>
                      {messageLength}/{maxLength}자
                      <span className="ml-2 text-xs text-gray-500">
                        ({formData.messageType || 'SMS'})
                      </span>
                    </div>
                    {formData.content && formData.content.length > 90 && (
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/ai/compress-text', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  text: formData.content,
                                  targetLength: formData.messageType === 'SMS' ? 90 : 
                                               formData.messageType === 'SMS300' ? 300 : 
                                               formData.messageType === 'LMS' ? 2000 : 2000,
                                  preserveKeywords: true
                                })
                              });
                              
                              if (response.ok) {
                                const data = await response.json();
                                updateFormData({ content: data.compressedText });
                                alert('AI가 메시지를 압축했습니다!');
                              }
                            } catch (error) {
                              console.error('AI 압축 오류:', error);
                              alert('AI 압축에 실패했습니다.');
                            }
                          }}
                          className="px-3 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600"
                        >
                          AI 압축
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/ai/improve-text', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  text: formData.content,
                                  channelType: 'sms',
                                  messageType: formData.messageType
                                })
                              });
                              
                              if (response.ok) {
                                const data = await response.json();
                                updateFormData({ content: data.improvedText });
                                alert('AI가 메시지를 개선했습니다!');
                              }
                            } catch (error) {
                              console.error('AI 개선 오류:', error);
                              alert('AI 개선에 실패했습니다.');
                            }
                          }}
                          className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          AI 개선
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <textarea
                  value={formData.content}
                  onChange={(e) => updateFormData({ content: e.target.value })}
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="메시지 내용을 입력하세요..."
                  maxLength={getMaxLength()}
                />
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getLengthStatus().bg}`}
                      style={{ width: `${Math.min((getMessageLength() / getMaxLength()) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* 수신자 번호 */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">수신자 번호</h3>
                <div className="space-y-2">
                  {(formData.recipientNumbers || []).map((number, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="tel"
                        value={number}
                        onChange={(e) => {
                          const newNumbers = [...(formData.recipientNumbers || [])];
                          newNumbers[index] = e.target.value;
                          updateFormData({ recipientNumbers: newNumbers });
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="010-1234-5678"
                      />
                      <button
                        onClick={() => {
                          const newNumbers = (formData.recipientNumbers || []).filter((_, i) => i !== index);
                          updateFormData({ recipientNumbers: newNumbers });
                        }}
                        className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newNumbers = [...(formData.recipientNumbers || []), ''];
                      updateFormData({ recipientNumbers: newNumbers });
                    }}
                    className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-md text-gray-500 hover:border-gray-400"
                  >
                    + 번호 추가
                  </button>
                </div>
              </div>

              {/* 짧은 링크 생성 */}
              {formData.content && (
                <ShortLinkGenerator
                  originalUrl={`https://win.masgolf.co.kr${router.asPath}`}
                  onLinkGenerated={(shortLink) => updateFormData({ shortLink })}
                />
              )}

              {/* 이미지 선택 (MMS) */}
              {formData.messageType === 'MMS' && (
                <AIImagePicker
                  selectedImage={formData.imageUrl}
                  onImageSelect={(imageUrl) => updateFormData({ imageUrl })}
                  channelType="sms"
                />
              )}

            </div>

            {/* 오른쪽: 미리보기 및 도구 */}
            <div className="space-y-6">
              {/* 메시지 내용 최적화 점수 */}
              {formData.content && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800">SMS/MMS 최적화 점수</h3>
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        contentScore >= 80 ? 'bg-green-500' : 
                        contentScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}>
                        {contentScore}
                      </div>
                      <span className={`text-sm font-medium ${
                        contentScore >= 80 ? 'text-green-600' : 
                        contentScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {contentScore >= 80 ? '우수' : contentScore >= 60 ? '양호' : '개선 필요'}
                      </span>
                    </div>
                  </div>
                  <MessageOptimizer
                    content={formData.content}
                    channelType="sms"
                    onScoreChange={(score) => setContentScore(score.total)}
                    showDetails={true}
                  />
                </div>
              )}

              {/* 모바일 미리보기 */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">모바일 미리보기</h3>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {showPreview ? '숨기기' : '미리보기'}
                  </button>
                </div>
                
                {showPreview && (
                  <div className="bg-gray-900 rounded-lg p-4">
                    <div className="bg-white rounded-lg p-4 max-w-xs mx-auto">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          M
                        </div>
                        <div>
                          <div className="font-medium text-sm">마쓰구골프</div>
                          <div className="text-xs text-gray-500">031-215-3990</div>
                        </div>
                      </div>
                      <div className="bg-gray-100 rounded-lg p-3 mb-2">
                        <div className="text-sm text-gray-800 whitespace-pre-wrap">
                          {formData.content}
                          {formData.shortLink && `\n\n링크: ${formData.shortLink}`}
                        </div>
                        {formData.imageUrl && (
                          <img
                            src={formData.imageUrl}
                            alt="MMS 이미지"
                            className="mt-2 w-full h-32 object-cover rounded"
                          />
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date().toLocaleString('ko-KR')}
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
