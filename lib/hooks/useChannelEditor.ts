import { useState, useCallback } from 'react';

export interface ChannelFormData {
  title: string;
  content: string;
  imageUrl: string;
  shortLink: string;
  status: 'draft' | 'scheduled' | 'sent' | 'published';
  scheduledAt?: string;
  // 채널별 특화 필드
  messageType?: string; // SMS: 'SMS'|'SMS300'|'LMS'|'MMS', 카카오: 'alimtalk'|'friendtalk'
  templateId?: string; // 카카오 알림톡 템플릿 ID
  buttonText?: string; // 카카오 버튼 텍스트
  buttonLink?: string; // 카카오 버튼 링크
  recipientNumbers?: string[]; // SMS 수신자 번호
  recipientUuids?: string[]; // 카카오 수신자 UUID
  metaTitle?: string; // 네이버 블로그 메타 제목
  metaDescription?: string; // 네이버 블로그 메타 설명
  metaKeywords?: string; // 네이버 블로그 메타 키워드
  slug?: string; // 네이버 블로그 슬러그
}

export interface ChannelPost {
  id: number;
  calendarId?: number;
  blogPostId?: number;
  formData: ChannelFormData;
  createdAt: string;
  updatedAt: string;
}

export const useChannelEditor = (
  channelType: 'sms' | 'kakao' | 'naver',
  calendarId?: string,
  initialData?: any,
  hubId?: string,
  channelKey?: string
) => {
  const [formData, setFormData] = useState<ChannelFormData>({
    title: initialData?.title || '',
    content: initialData?.messageText || initialData?.content || '',
    imageUrl: initialData?.imageUrl || '',
    shortLink: initialData?.shortLink || '',
    status: 'draft',
    messageType: channelType === 'sms' ? 'MMS' : undefined,
    ...initialData,
    // templateType을 명시적으로 포함 (카카오 채널용)
    templateType: initialData?.templateType || 'BASIC_TEXT'
  } as any);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 폼 데이터 업데이트
  const updateFormData = useCallback((updates: Partial<ChannelFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  // 블로그 소스에서 데이터 가져오기
  const loadFromBlog = useCallback(async (blogPostId: number, targetMessageType?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 공통소스 변환 API 사용
      const response = await fetch('/api/channels/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blogPostId,
          channelType,
          targetMessageType
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // 변환된 내용을 formData에 적용
          const optimizedContent = data.data.optimizedContent;
          updateFormData({
            title: optimizedContent.messageText || '',
            content: optimizedContent.messageText || '',
            messageType: optimizedContent.messageType || 'SMS'
          });
          return blogPostId;
        } else {
          throw new Error(data.message || '블로그 소스 가져오기 실패');
        }
      } else {
        throw new Error('블로그 소스 가져오기 중 오류가 발생했습니다.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [channelType]);

  // 초안 저장
  const saveDraft = useCallback(async (calendarId?: number, blogPostId?: number, channelPostId?: number) => {
    setIsLoading(true);
    setError(null);

    try {
      // 채널별 데이터 매핑
      let requestData;
      if (channelType === 'sms') {
        requestData = {
          channelPostId, // SMS도 업데이트 지원 (필요시)
          calendarId,
          blogPostId,
          hub_content_id: hubId,
          channelKey,
          messageType: formData.messageType || 'SMS',
          messageText: formData.content || formData.title || '',
          shortLink: formData.shortLink,
          imageUrl: formData.imageUrl,
          recipientNumbers: formData.recipientNumbers || [],
          status: formData.status || 'draft'
        };
      } else if (channelType === 'kakao') {
        requestData = {
          channelPostId, // 기존 메시지 ID (있으면 업데이트, 없으면 생성)
          title: formData.title || '',
          content: formData.content || '',
          messageType: formData.messageType || 'FRIENDTALK',
          templateType: (formData as any).templateType || 'BASIC_TEXT',
          imageUrl: formData.imageUrl || '',
          shortLink: formData.shortLink || '',
          buttonLink: formData.buttonLink || formData.shortLink || null, // 기본값 제거
          buttonText: formData.buttonText || null, // 기본값 제거
          emoji: (formData as any).emoji || '',
          status: formData.status || 'draft',
          calendarId,
          blogPostId,
          hub_content_id: hubId,
          channelKey,
          selectedRecipients: (formData as any).selectedRecipients || []
        };
      } else {
        requestData = {
          channelPostId, // 다른 채널도 업데이트 지원 (필요시)
          ...formData,
          calendarId,
          blogPostId,
          hub_content_id: hubId,
          channelKey
        };
      }

      const response = await fetch(`/api/channels/${channelType}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return {
            success: true,
            channelPostId: data.channelPostId || data.data?.id,
            data: data.data
          };
        } else {
          throw new Error(data.message || '저장 실패');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '저장 중 오류가 발생했습니다.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [formData, channelType]);

  // 기존 포스트 로드
  const loadPost = useCallback(async (channelPostId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/channels/${channelType}/${channelPostId}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFormData(prev => ({
            ...prev,
            ...data.post.formData
          }));
          return data.post;
        } else {
          throw new Error(data.message || '포스트 로드 실패');
        }
      } else if (response.status === 404) {
        // 404 오류 시 더 명확한 메시지
        throw new Error(`메시지 ID ${channelPostId}를 찾을 수 없습니다. 목록에서 확인해주세요.`);
      } else {
        throw new Error(`포스트 로드 중 오류가 발생했습니다. (${response.status})`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [channelType]);

  // 포스트 업데이트
  const updatePost = useCallback(async (channelPostId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/channels/${channelType}/${channelPostId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return data.post;
        } else {
          throw new Error(data.message || '업데이트 실패');
        }
      } else {
        throw new Error('업데이트 중 오류가 발생했습니다.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [formData, channelType]);

  // 포스트 삭제
  const deletePost = useCallback(async (channelPostId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/channels/${channelType}/${channelPostId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return true;
        } else {
          throw new Error(data.message || '삭제 실패');
        }
      } else {
        throw new Error('삭제 중 오류가 발생했습니다.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [channelType]);

  // 실제 발송 (SMS/카카오)
  const sendMessage = useCallback(async (channelPostId?: number) => {
    setIsLoading(true);
    setError(null);

    try {
      // channelPostId가 없으면 먼저 저장
      let finalChannelPostId = channelPostId;
      if (!finalChannelPostId) {
        const saved = await saveDraft();
        if (typeof saved === 'number') {
          finalChannelPostId = saved;
        } else if (saved && typeof saved === 'object' && 'channelPostId' in saved) {
          finalChannelPostId = (saved as any).channelPostId;
        } else {
          throw new Error('메시지를 저장할 수 없습니다.');
        }
      }

      if (!finalChannelPostId) {
        throw new Error('channelPostId가 필요합니다.');
      }

      const response = await fetch(`/api/channels/${channelType}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelPostId: finalChannelPostId,
          title: formData.title,
          content: formData.content,
          messageType: formData.messageType,
          templateType: (formData as any).templateType,
          buttonText: formData.buttonText,
          buttonLink: formData.buttonLink,
          imageUrl: formData.imageUrl,
          selectedRecipients: (formData as any).selectedRecipients || [],
          friendGroupId: (formData as any).friendGroupId || undefined
        })
      });

      const data = await response.json();
      
      // 성공 카운트 확인 (실제 발송 성공 여부 판단)
      const successCount = data.result?.successCount || 0;
      const failCount = data.result?.failCount || 0;
      
      // 부분 성공 처리 (207 Multi-Status 또는 successCount > 0)
      if (response.status === 207 || (response.ok && (data.success || successCount > 0))) {
        // 부분 성공 또는 전체 성공
        const status = failCount > 0 && successCount > 0 ? 'partial' : (successCount > 0 ? 'sent' : 'failed');
        updateFormData({ status: status as any });
        return {
          success: data.success || successCount > 0,
          ...data.result
        };
      } else if (response.ok && !data.success && successCount === 0) {
        // 전체 실패 (successCount가 0인 경우만)
        throw new Error(data.message || '발송 실패');
      } else {
        // HTTP 오류
        throw new Error(data.message || '발송 중 오류가 발생했습니다.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [formData, channelType, updateFormData]);

  // 폼 초기화
  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      content: '',
      imageUrl: '',
      shortLink: '',
      status: 'draft'
    });
    setError(null);
  }, []);

  return {
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
  };
};

