import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminNav from '../../components/admin/AdminNav';
import { TitleScorer } from '../../components/shared/TitleScorer';
import { ShortLinkGenerator } from '../../components/shared/ShortLinkGenerator';
import { AIImagePicker } from '../../components/shared/AIImagePicker';
import { MessageOptimizer } from '../../components/shared/MessageOptimizer';
import { CustomerSelector } from '../../components/admin/CustomerSelector';
import { useChannelEditor } from '../../lib/hooks/useChannelEditor';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

export default function SMSAdmin() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id, edit, calendarId, blogPostId, hub, mode } = router.query;

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
  const [psychologyMessages, setPsychologyMessages] = useState([]);
  const [showPsychologyModal, setShowPsychologyModal] = useState(false);
  const [mobilePreviewText, setMobilePreviewText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageId, setImageId] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);

  // 메시지 타입 초기값 설정 (useChannelEditor에서 이미 설정됨)
  useEffect(() => {
    console.log('SMS 에디터 - 현재 messageType:', formData.messageType);
    // SMS300이 설정되어 있으면 LMS로 변경
    if (formData.messageType === 'SMS300') {
      updateFormData({ messageType: 'LMS' });
    }
  }, [formData.messageType, updateFormData]);

  // 이미지 업로드 함수
  const handleImageUpload = async (file) => {
    try {
      setIsUploadingImage(true);
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/solapi/upload-image', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        setImageId(result.imageId);
        setSelectedImage(file);
        // formData에 imageId 저장
        updateFormData({ imageUrl: result.imageId });
        alert('이미지가 업로드되었습니다.');
      } else {
        alert('이미지 업로드에 실패했습니다: ' + result.message);
      }
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      alert('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // 이미지 제거 함수
  const handleImageRemove = () => {
    setSelectedImage(null);
    setImageId('');
    // formData에서도 imageUrl 제거
    updateFormData({ imageUrl: '' });
  };

  // 모바일 미리보기 텍스트 추출 및 업데이트
  useEffect(() => {
    console.log('=== 모바일 미리보기 텍스트 useEffect 트리거 ===');
    console.log('formData.content:', formData.content);
    console.log('formData.shortLink:', formData.shortLink);
    console.log('formData.imageUrl:', formData.imageUrl);
    
    const extractMobilePreviewText = () => {
      let previewText = formData.content || '';
      
      // 짧은 링크가 있으면 추가
      if (formData.shortLink) {
        previewText += `\n\n링크: ${formData.shortLink}`;
      }
      
      // 이미지가 있으면 이미지 표시 텍스트 추가
      if (formData.imageUrl) {
        previewText += '\n\n[이미지 첨부]';
      }
      
      return previewText.trim();
    };
    
    const newPreviewText = extractMobilePreviewText();
    console.log('이전 mobilePreviewText:', mobilePreviewText);
    console.log('새로운 mobilePreviewText:', newPreviewText);
    
    // 항상 업데이트 (React가 내부적으로 변경사항을 감지)
    console.log('모바일 미리보기 텍스트 업데이트');
    setMobilePreviewText(newPreviewText);
  }, [formData.content, formData.shortLink, formData.imageUrl]);

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

  // 편집 모드 처리 - 두 가지 URL 패턴 모두 지원
  useEffect(() => {
    if (mode === 'edit' && edit) {
      // 허브 시스템에서 온 경우: ?edit=26&mode=edit
      console.log('편집 모드로 SMS 로드 (허브 시스템):', edit);
      loadPost(parseInt(edit as string));
    } else if (id) {
      // SMS 관리에서 온 경우: ?id=26
      console.log('SMS 관리에서 로드:', id);
      loadPost(parseInt(id as string));
    }
  }, [mode, edit, id, loadPost]);

  // 페이지 로드 시 데이터 로드 (편집 모드가 아닌 경우만)
  useEffect(() => {
    if (id && mode !== 'edit' && !edit) {
      // SMS 관리에서 직접 접근한 경우만
      loadPost(parseInt(id as string));
    } else if (blogPostId) {
      loadFromBlog(parseInt(blogPostId as string));
    }
  }, [id, blogPostId, mode, edit, loadPost, loadFromBlog]);

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
      // 디버깅: URL 파라미터 확인
      console.log('🔍 SMS 저장 디버깅:', {
        hub: hub,
        id: id,
        channelKey: router.query.channelKey,
        allQuery: router.query,
        formData: formData
      });

      // SMS 데이터 직접 저장 (useChannelEditor 대신 직접 API 호출)
      const smsData = {
        message: formData.content || formData.title || '',
        type: formData.messageType || 'SMS300',
        status: 'draft',
        calendar_id: hub || null, // hub_content_id → calendar_id로 수정
        id: id || null // PUT 요청 시 id를 body에 포함
      };

      console.log('📝 SMS 저장 데이터:', smsData);

      // 기존 SMS ID가 있는지 확인하여 POST/PUT 결정
      const method = id ? 'PUT' : 'POST';
      const url = '/api/admin/sms'; // URL은 항상 동일
      
      console.log('📝 SMS 요청 정보:', { method, url, id });

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smsData)
      });

      const result = await response.json();
      console.log('📝 SMS 저장 결과:', result);

      if (result.success) {
        // 허브 연동이 있는 경우 상태 동기화
        if (hub && result.smsId) {
          // 동적 채널 키 확인 (URL에서 channelKey 파라미터 추출)
          const channelKey = router.query.channelKey || 'sms';
          console.log('🔄 허브 상태 동기화 시작:', { hub, channelKey, smsId: result.smsId });
          
          try {
            const syncResponse = await fetch('/api/admin/sync-channel-status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                hubContentId: hub,
                channel: channelKey, // 동적 채널 키 사용
                channelContentId: result.smsId,
                status: '수정중'
              })
            });

            const syncResult = await syncResponse.json();
            console.log('🔄 허브 상태 동기화 결과:', syncResult);
            
            if (syncResponse.ok) {
              console.log('✅ 허브 상태 동기화 완료');
              alert('초안이 저장되고 허브 상태가 동기화되었습니다!');
            } else {
              console.error('❌ 허브 상태 동기화 실패:', syncResult);
              alert('초안은 저장되었지만 허브 상태 동기화에 실패했습니다.');
            }
          } catch (syncError) {
            console.error('❌ 허브 상태 동기화 오류:', syncError);
            alert('초안은 저장되었지만 허브 상태 동기화 중 오류가 발생했습니다.');
          }
        } else {
          alert('초안이 저장되었습니다.');
        }
      } else {
        throw new Error(result.message || '저장 실패');
      }
    } catch (error) {
      console.error('❌ SMS 저장 오류:', error);
      alert('저장 중 오류가 발생했습니다: ' + error.message);
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
      
      // SMS 발송 후 허브 상태를 "발행됨"으로 업데이트
      if (hub) {
        try {
          const syncResponse = await fetch('/api/admin/sync-channel-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              hubContentId: hub,
              channel: 'sms',
              channelContentId: channelPostId,
              status: '발행됨'
            })
          });
          
          if (syncResponse.ok) {
            console.log('✅ SMS 발송 후 허브 상태 업데이트 완료');
          } else {
            console.error('❌ SMS 발송 후 허브 상태 업데이트 실패');
          }
        } catch (syncError) {
          console.error('❌ SMS 발송 후 허브 상태 동기화 오류:', syncError);
        }
      }
      
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
                {hub && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">🎯</span>
                      <span className="text-sm font-medium text-blue-800">허브 콘텐츠 연동</span>
                      <span className="text-xs text-blue-600">(ID: {hub})</span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      초안 저장 시 자동으로 허브 상태가 동기화됩니다.
                    </p>
                  </div>
                )}
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
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { type: 'SMS', limit: '90자' },
                    { type: 'LMS', limit: '2000자' },
                    { type: 'MMS', limit: '2000자' }
                  ].map(({ type, limit }) => (
                    <button
                      key={type}
                      onClick={() => {
                        console.log('메시지 타입 변경:', type);
                        updateFormData({ messageType: type });
                        // MMS가 아닌 경우 이미지 제거
                        if (type !== 'MMS') {
                          handleImageRemove();
                        }
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

              {/* 이미지 업로드 (MMS만) */}
              {formData.messageType === 'MMS' && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">이미지 첨부 (MMS)</h3>
                  
                  {!selectedImage ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageUpload(file);
                          }
                        }}
                        className="hidden"
                        id="image-upload"
                        disabled={isUploadingImage}
                      />
                      <label
                        htmlFor="image-upload"
                        className={`cursor-pointer ${isUploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="text-gray-400 mb-2">
                          {isUploadingImage ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                          ) : (
                            <svg className="mx-auto h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {isUploadingImage ? '업로드 중...' : '이미지를 선택하거나 드래그하세요'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF (최대 5MB)</p>
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative">
                        <img 
                          src={URL.createObjectURL(selectedImage)} 
                          alt="미리보기" 
                          className="w-full max-w-xs mx-auto rounded-lg shadow-sm"
                        />
                        <button
                          onClick={handleImageRemove}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">
                          <strong>파일명:</strong> {selectedImage.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          <strong>크기:</strong> {(selectedImage.size / 1024 / 1024).toFixed(2)}MB
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          <strong>이미지 ID:</strong> {imageId}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      💡 <strong>MMS 안내:</strong> 이미지가 포함된 메시지입니다. 이미지를 업로드해주세요.
                    </p>
                  </div>
                </div>
              )}

              {/* 메시지 타입별 안내 */}
              {formData.messageType === 'SMS' && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm text-blue-800">
                    💡 <strong>SMS:</strong> 90자 이하의 단문 메시지입니다.
                  </p>
                </div>
              )}

              {formData.messageType === 'LMS' && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <p className="text-sm text-green-800">
                    💡 <strong>LMS:</strong> 2000자 이하의 장문 메시지입니다.
                  </p>
                </div>
              )}

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
                        <button
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/ai/psychology-messages', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  text: formData.content,
                                  channelType: 'sms',
                                  messageType: formData.messageType,
                                  targetLength: formData.messageType === 'SMS' ? 90 : 
                                               formData.messageType === 'SMS300' ? 300 : 
                                               formData.messageType === 'LMS' ? 2000 : 2000
                                })
                              });
                              
                              if (response.ok) {
                                const data = await response.json();
                                setPsychologyMessages(data.messages);
                                setShowPsychologyModal(true);
                              }
                            } catch (error) {
                              console.error('심리학 기반 메시지 생성 오류:', error);
                              alert('심리학 기반 메시지 생성에 실패했습니다.');
                            }
                          }}
                          className="px-3 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
                        >
                          🧠 심리학 추천
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
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">수신자 번호</h3>
                  <button
                    onClick={() => setShowCustomerSelector(true)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    👥 고객 DB에서 선택
                  </button>
                </div>
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
                    content={mobilePreviewText || formData.content}
                    channelType="sms"
                    onScoreChange={(score) => {
                      console.log('=== MessageOptimizer onScoreChange 콜백 ===');
                      console.log('이전 contentScore:', contentScore);
                      console.log('새로운 score.total:', score.total);
                      if (contentScore !== score.total) {
                        console.log('contentScore 변경됨:', contentScore, '→', score.total);
                        setContentScore(score.total);
                      } else {
                        console.log('contentScore 동일함, 업데이트 스킵');
                      }
                    }}
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

      {/* 심리학 기반 메시지 추천 모달 */}
      {/* 고객 선택 모달 */}
      {showCustomerSelector && (
        <CustomerSelector
          onSelect={(customers) => {
            const newNumbers = [
              ...(formData.recipientNumbers || []),
              ...customers.map(c => c.phone).filter(p => !formData.recipientNumbers?.includes(p))
            ];
            updateFormData({ recipientNumbers: newNumbers });
            setShowCustomerSelector(false);
          }}
          onClose={() => setShowCustomerSelector(false)}
          selectedPhones={formData.recipientNumbers || []}
        />
      )}

      {showPsychologyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">🧠 심리학 기반 메시지 추천</h2>
              <button
                onClick={() => setShowPsychologyModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800 text-sm">
                💡 <strong>로버트 치알디니의 6가지 영향력 원칙</strong>과 <strong>뇌과학 기반 후킹 기법</strong>을 적용하여 3가지 심리학 기반 메시지를 생성했습니다.
              </p>
            </div>

            <div className="grid gap-6">
              {psychologyMessages.map((message, index) => (
                <div key={message.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {index + 1}. {message.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">{message.description}</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {message.tags.map((tag, tagIndex) => (
                          <span key={tagIndex} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {message.score.total}점
                      </div>
                      <div className="text-sm text-gray-500">
                        {message.characterCount}/{message.targetLength}자
                      </div>
                    </div>
                  </div>

                  {/* 상세 점수 */}
                  <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <div className="text-gray-600">타겟 매칭</div>
                      <div className="font-semibold text-blue-600">{message.score.audienceMatch}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">심리 효과</div>
                      <div className="font-semibold text-green-600">{message.score.psychEffect}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">브랜드 적합성</div>
                      <div className="font-semibold text-purple-600">{message.score.brandFit}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">전환 잠재력</div>
                      <div className="font-semibold text-orange-600">{message.score.conversionPotential}</div>
                    </div>
                  </div>

                  {/* 메시지 내용 */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <div className="text-sm text-gray-800 whitespace-pre-wrap">
                      {message.message}
                    </div>
                  </div>

                  {/* 선택 버튼 */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        updateFormData({ content: message.message });
                        setShowPsychologyModal(false);
                        alert(`${message.title} 메시지가 적용되었습니다!`);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      이 메시지 선택
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(message.message);
                        alert('메시지가 클립보드에 복사되었습니다!');
                      }}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
                    >
                      복사
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowPsychologyModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
