import { useState, useCallback } from 'react';

export interface ChannelFormData {
  title: string;
  content: string;
  imageUrl: string;
  shortLink: string;
  status: 'draft' | 'scheduled' | 'sent' | 'published';
  scheduledAt?: string;
  // 채널별 특화 필드
  messageType?: string; // SMS: 'SMS'|'LMS'|'MMS', 카카오: 'alimtalk'|'friendtalk'
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

export const useChannelEditor = (channelType: 'sms' | 'kakao' | 'naver') => {
  const [formData, setFormData] = useState<ChannelFormData>({
    title: '',
    content: '',
    imageUrl: '',
    shortLink: '',
    status: 'draft',
    messageType: channelType === 'sms' ? 'SMS' : undefined
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 폼 데이터 업데이트
  const updateFormData = useCallback((updates: Partial<ChannelFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  // 블로그 소스에서 데이터 가져오기
  const loadFromBlog = useCallback(async (blogPostId: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 공통소스 변환 API 사용
      const response = await fetch('/api/channels/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blogPostId,
          channelType
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // 변환된 내용을 formData에 적용
          const optimizedContent = data.data.optimizedContent;
          setFormData({
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
  const saveDraft = useCallback(async (calendarId?: number, blogPostId?: number) => {
    setIsLoading(true);
    setError(null);

    try {
      // 채널별 데이터 매핑
      let requestData;
      if (channelType === 'sms') {
        requestData = {
          calendarId,
          blogPostId,
          messageType: formData.messageType || 'SMS',
          messageText: formData.content || formData.title || '',
          shortLink: formData.shortLink,
          imageUrl: formData.imageUrl,
          recipientNumbers: formData.recipientNumbers || [],
          status: formData.status || 'draft'
        };
      } else {
        requestData = {
          ...formData,
          calendarId,
          blogPostId
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
          return data.channelPostId;
        } else {
          throw new Error(data.message || '저장 실패');
        }
      } else {
        throw new Error('저장 중 오류가 발생했습니다.');
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
          setFormData(data.post.formData);
          return data.post;
        } else {
          throw new Error(data.message || '포스트 로드 실패');
        }
      } else {
        throw new Error('포스트 로드 중 오류가 발생했습니다.');
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
  const sendMessage = useCallback(async (channelPostId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/channels/${channelType}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelPostId,
          ...formData
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // 발송 성공 시 상태 업데이트
          updateFormData({ status: 'sent' });
          return data.result;
        } else {
          throw new Error(data.message || '발송 실패');
        }
      } else {
        throw new Error('발송 중 오류가 발생했습니다.');
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

