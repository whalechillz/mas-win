import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminNav from '../../components/admin/AdminNav';
import { TitleScorer } from '../../components/shared/TitleScorer';
import { ShortLinkGenerator } from '../../components/shared/ShortLinkGenerator';
import { AIImagePicker } from '../../components/shared/AIImagePicker';
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
    switch (formData.messageType) {
      case 'SMS': return 90;
      case 'LMS': return 2000;
      case 'MMS': return 2000;
      default: return 90;
    }
  };

  // 문자 길이 상태
  const getLengthStatus = () => {
    const length = getMessageLength();
    const maxLength = getMaxLength();
    const percentage = (length / maxLength) * 100;
    
    if (percentage > 100) return { color: 'text-red-600', bg: 'bg-red-500' };
    if (percentage > 80) return { color: 'text-yellow-600', bg: 'bg-yellow-500' };
    return { color: 'text-green-600', bg: 'bg-green-500' };
  };

  // 초안 저장
  const handleSaveDraft = async () => {
    try {
      await saveDraft(
        calendarId ? calendarId as string : undefined,
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
        calendarId ? calendarId as string : undefined,
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 왼쪽: 편집 영역 */}
            <div className="space-y-6">
              {/* 메시지 타입 선택 */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">메시지 타입</h3>
                <div className="grid grid-cols-3 gap-3">
                  {['SMS', 'LMS', 'MMS'].map((type) => (
                    <button
                      key={type}
                      onClick={() => updateFormData({ messageType: type })}
                      className={`p-3 border rounded-lg text-center ${
                        formData.messageType === type
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="font-medium">{type}</div>
                      <div className="text-sm text-gray-500">
                        {type === 'SMS' ? '90자' : '2000자'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 메시지 내용 */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">메시지 내용</h3>
                  <div className={`text-sm ${getLengthStatus().color}`}>
                    {getMessageLength()}/{getMaxLength()}자
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

              {/* 제목 점수 (메시지 내용 기반) */}
              {formData.content && (
                <TitleScorer
                  title={formData.content.substring(0, 50)}
                  persona="local_customers"
                  contentType="sms"
                  targetProduct="all"
                  brandWeight="medium"
                  conversionGoal="phone_consultation"
                  showRecommendations={false}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
