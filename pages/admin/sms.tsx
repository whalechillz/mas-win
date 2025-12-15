import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

  const [isSending, setIsSending] = useState(false);
  const [blogPosts, setBlogPosts] = useState([]);
  const [selectedBlogId, setSelectedBlogId] = useState('');
  const [contentScore, setContentScore] = useState(0);
  const [psychologyMessages, setPsychologyMessages] = useState([]);
  const [showPsychologyModal, setShowPsychologyModal] = useState(false);
  const [mobilePreviewText, setMobilePreviewText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageId, setImageId] = useState('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);
  const [note, setNote] = useState<string>(''); // 메모 상태
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [hasScheduledTime, setHasScheduledTime] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [savedSmsId, setSavedSmsId] = useState<number | null>(null); // 저장된 SMS ID
  // 길이 프리셋/사용자 지정
  const [targetLength, setTargetLength] = useState<number | ''>('');
  const [lengthOptions, setLengthOptions] = useState({
    optimizeLineBreaks: true,
    psychologyTone: true,
    emphasizeCTA: true
  });
  // 자동 분할 옵션
  const [autoSplit, setAutoSplit] = useState(false);
  const [splitSize, setSplitSize] = useState(100);
  // 수동 분할용 분할 크기 (수신자 번호 섹션에서 사용)
  const [manualSplitSize, setManualSplitSize] = useState(100);
  // 호칭 선택 (개인화용)
  const [honorific, setHonorific] = useState<string>('고객님');
  
  // 메시지에 이름 변수가 있는지 확인
  const hasNameVariable = useMemo(() => {
    const content = formData.content || '';
    return content.includes('{name}') || 
           content.includes('{고객명}') || 
           content.includes('{{name}}');
  }, [formData.content]);

  const currentSmsNumericId = useMemo(() => {
    if (mode === 'edit' && edit) {
      const parsed = parseInt(edit as string, 10);
      return Number.isNaN(parsed) ? null : parsed;
    }
    if (id) {
      const parsed = parseInt(id as string, 10);
      return Number.isNaN(parsed) ? null : parsed;
    }
    // 저장된 ID가 있으면 사용
    return savedSmsId;
  }, [mode, edit, id, savedSmsId]);

  const fetchLatestPreview = useCallback(async (smsId: number) => {
    try {
      // 먼저 image_metadata에서 찾기
      const response = await fetch(`/api/admin/mms-images?messageId=${smsId}&limit=1`);
      if (response.ok) {
        const data = await response.json();
        const previewUrl = data?.images?.[0]?.url;
        if (previewUrl) {
          setImagePreviewUrl(previewUrl);
          return;
        }
      }
      
      // image_metadata에서 못 찾은 경우, formData.imageUrl이 Solapi imageId인지 확인
      if (formData.imageUrl && formData.imageUrl.startsWith('ST01FZ')) {
        const previewResponse = await fetch(`/api/solapi/get-image-preview?imageId=${formData.imageUrl}&messageId=${smsId}`);
        if (previewResponse.ok) {
          const previewData = await previewResponse.json();
          if (previewData.success && previewData.imageUrl) {
            setImagePreviewUrl(previewData.imageUrl);
            return;
          }
        }
      }
    } catch (err) {
      console.error('MMS 이미지 프리뷰 조회 오류:', err);
    }
  }, [formData.imageUrl]);

  // 한국 시간대 상수 (UTC+9)
  const KST_OFFSET_MS = 9 * 60 * 60 * 1000; // 9시간을 밀리초로

  const isHttpUrl = (value?: string | null) => {
    if (!value || typeof value !== 'string') return false;
    return /^https?:\/\//i.test(value.trim());
  };

  // Date 객체를 datetime-local 입력 형식으로 변환 (로컬 시간 기준)
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // UTC ISO 문자열을 datetime-local 입력 형식으로 변환 (한국 시간 기준)
  const convertUTCToLocalInput = (iso?: string | null) => {
    if (!iso) return '';
    const utcDate = new Date(iso);
    if (Number.isNaN(utcDate.getTime())) return '';
    // UTC에 9시간을 더해서 한국 시간(KST)으로 변환
    const kstDate = new Date(utcDate.getTime() + KST_OFFSET_MS);
    return formatDateForInput(kstDate);
  };

  // datetime-local 입력값을 UTC ISO 문자열로 변환 (한국 시간 기준으로 명시적 처리)
  const convertLocalInputToUTC = (value?: string) => {
    if (!value) return null;
    // datetime-local 형식: "2025-11-20T08:30"
    // 한국 시간대(UTC+9)를 명시적으로 지정: "2025-11-20T08:30:00+09:00"
    const kstString = `${value}:00+09:00`;
    const kstDate = new Date(kstString);
    if (Number.isNaN(kstDate.getTime())) return null;
    // toISOString()이 자동으로 UTC로 변환 (9시간 빼짐)
    return kstDate.toISOString();
  };

  const formatScheduleDisplay = (value?: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getDefaultScheduleValue = () => {
    const defaultDate = new Date();
    defaultDate.setHours(defaultDate.getHours() + 1, 0, 0, 0);
    return formatDateForInput(defaultDate);
  };

  const applyLengthPreset = (len: number) => {
    setTargetLength(len);
    handleApplyTarget(len);
  };

  const handleApplyTarget = (len?: number) => {
    const base = len ?? (typeof targetLength === 'number' ? targetLength : 0);
    if (!base || base < 20) return;
    const lower = Math.max(10, base - 20);
    const upper = Math.max(15, base - 5);
    const optimized = compressToRange(formData.content || '', lower, upper, lengthOptions);
    updateFormData({ content: optimized });
  };

  const adjustByPercent = (percent: number) => {
    const current = typeof targetLength === 'number' && targetLength > 0 ? targetLength : getMessageLength();
    const next = Math.max(30, Math.round(current * (1 + percent)));
    setTargetLength(next);
    handleApplyTarget(next);
  };

  const compressToRange = (
    text: string,
    lower: number,
    upper: number,
    options: { optimizeLineBreaks: boolean; psychologyTone: boolean; emphasizeCTA: boolean }
  ) => {
    if (!text) return text;
    let t = text
      .replace(/[\t ]+/g, ' ')
      .replace(/\s+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // 줄바꿈 최적화: 문장 단위로 2~4단락 구성
    if (options.optimizeLineBreaks) {
      const sentences = t.split(/(?<=[.!?…\u3002\uFF01\uFF1F])\s+/);
      if (sentences.length > 1) {
        const mid = Math.ceil(sentences.length / 2);
        const para1 = sentences.slice(0, mid).join(' ');
        const para2 = sentences.slice(mid).join(' ');
        t = [para1, para2].filter(Boolean).join('\n\n');
      }
    }

    const cutSmart = (s: string, max: number) => {
      if (s.length <= max) return s;
      // 문장 경계 또는 공백 기준으로 절단
      const hard = s.slice(0, max);
      const lastPunct = Math.max(hard.lastIndexOf('。'), hard.lastIndexOf('.'), hard.lastIndexOf('!'), hard.lastIndexOf('?'));
      const lastSpace = hard.lastIndexOf(' ');
      const idx = Math.max(lastPunct, lastSpace, Math.min(max - 1, hard.length - 1));
      return hard.slice(0, Math.max(0, idx)).trimEnd() + '…';
    };

    if (t.length > upper) {
      // 문장 단위로 누적하여 upper에 가깝게
      const parts = t.split(/(\n\n|(?<=[.!?…\u3002\uFF01\uFF1F])\s+)/);
      let acc = '';
      for (const p of parts) {
        if ((acc + p).length <= upper) acc += p;
        else break;
      }
      if (!acc) acc = cutSmart(t, upper);
      t = acc.trim();
    }

    // CTA 강조(옵션): 너무 짧지 않다면 마지막 줄에 한 줄 CTA 유지
    if (options.emphasizeCTA) {
      const hasCTA = /(문의|예약|상담|지금|바로)/.test(t);
      if (!hasCTA && t.length <= upper - 8) {
        t = `${t}\n\n지금 확인해보세요.`;
      }
    }

    // 심리학 톤(옵션): 과도한 기호 제약
    if (options.psychologyTone) {
      t = t.replace(/[~]{2,}/g, '~').replace(/!{3,}/g, '!!');
    }

    // 하한보다 길면 유지, 너무 짧으면 그대로 반환(인위적 증가는 하지 않음)
    return t;
  };
  
  // 세그먼트 필터 상태
  const [segmentFilter, setSegmentFilter] = useState({
    purchased: '', // 'true' = 구매자만, 'false' = 비구매자만, '' = 전체
    purchaseYears: '', // '0-1', '1-3', '3-5', '5+', '' = 전체 (구매자용)
    contactYears: '', // '0-1', '1-3', '3-5', '5+', '' = 전체 (비구매자용)
    contactDays: '', // '7','14','30','90' 등 최근 연락 일수(선택)
    vipLevel: '' // 'bronze', 'silver', 'gold', 'platinum', '' = 전체
  });
  const [segmentLoading, setSegmentLoading] = useState(false);

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
      if (currentSmsNumericId) {
        formData.append('messageId', String(currentSmsNumericId));
      }

      const response = await fetch('/api/solapi/upload-image', {
        method: 'POST',
        body: formData
      });

      // Content-Type 확인
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ 이미지 업로드 API가 JSON이 아닌 응답을 반환했습니다:', {
          status: response.status,
          statusText: response.statusText,
          contentType,
          preview: text.substring(0, 200)
        });
        throw new Error(`이미지 업로드 오류: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        setImageId(result.imageId);
        setSelectedImage(file);
        // ⭐ Solapi imageId를 우선적으로 저장 (MMS 발송용 - 솔라피는 imageId만 인식)
        const imageUrlToSave = result.imageId || result.supabaseUrl;
        if (result.supabaseUrl) {
          setImagePreviewUrl(result.supabaseUrl);
        }
        // formData에 Solapi imageId 저장 (DB에 저장될 값)
        updateFormData({ imageUrl: imageUrlToSave });
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

  // 이미지 압축 함수 (Canvas API 사용 - 클라이언트 측)
  const compressImageForMMS = async (imageUrl: string, maxSizeKB: number = 200): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context를 가져올 수 없습니다.'));
          return;
        }
        
        // MMS 권장 크기: 640x480 (비율 유지)
        const maxWidth = 640;
        const maxHeight = 480;
        
        let width = img.width;
        let height = img.height;
        
        // 비율 유지하면서 리사이즈
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // 이미지 그리기
        ctx.drawImage(img, 0, 0, width, height);
        
        // JPEG로 변환 (품질 조정)
        let quality = 0.85;
        const maxSizeBytes = maxSizeKB * 1024;
        
        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('이미지 압축에 실패했습니다.'));
                return;
              }
              
              // 크기 체크
              if (blob.size <= maxSizeBytes) {
                resolve(blob);
              } else if (quality > 0.5) {
                // 품질을 낮춰서 다시 시도
                quality -= 0.1;
                tryCompress();
              } else {
                // 최소 품질로도 안되면 크기를 더 줄임
                const newWidth = Math.floor(width * 0.9);
                const newHeight = Math.floor(height * 0.9);
                canvas.width = newWidth;
                canvas.height = newHeight;
                ctx.drawImage(img, 0, 0, newWidth, newHeight);
                quality = 0.6;
                tryCompress();
              }
            },
            'image/jpeg',
            quality
          );
        };
        
        tryCompress();
      };
      
      img.onerror = () => {
        reject(new Error('이미지를 로드할 수 없습니다.'));
      };
      
      img.src = imageUrl;
    });
  };

  const handleGalleryImageSelect = async (selectedUrl: string) => {
    if (!selectedUrl) {
      handleImageRemove();
      return;
    }

    try {
      setIsUploadingImage(true);
      
      // ⭐ 클라이언트 측에서 이미지 압축
      console.log('🔄 이미지 압축 시작:', selectedUrl);
      const compressedBlob = await compressImageForMMS(selectedUrl, 200);
      console.log('✅ 이미지 압축 완료:', {
        compressedSize: `${(compressedBlob.size / 1024).toFixed(2)}KB`
      });
      
      // 압축된 이미지를 FormData로 변환
      const formData = new FormData();
      formData.append('file', compressedBlob, 'compressed-image.jpg');
      if (currentSmsNumericId) {
        formData.append('messageId', String(currentSmsNumericId));
      }
      
      // ⭐ 압축된 이미지를 직접 업로드 (reupload-image 대신 upload-image 사용)
      const response = await fetch('/api/solapi/upload-image', {
        method: 'POST',
        body: formData
      });

      // Content-Type 확인
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ 이미지 업로드 API가 JSON이 아닌 응답을 반환했습니다:', {
          status: response.status,
          statusText: response.statusText,
          contentType,
          preview: text.substring(0, 200)
        });
        throw new Error(`이미지 업로드 오류: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || '이미지 업로드 중 오류가 발생했습니다.');
      }

      setSelectedImage(null);
      setImageId(result.imageId);
      // ⭐ Supabase URL을 우선적으로 저장
      const imageUrlToSave = result.supabaseUrl || result.imageId;
      setImagePreviewUrl(result.supabaseUrl);
      
      // ⭐ 수정: messageType을 유지하면서 imageUrl만 업데이트
      updateFormData({ 
        imageUrl: imageUrlToSave,
        messageType: formData.messageType // ⭐ 메시지 타입 유지
      });
      
      // ⭐ 추가: channel_sms 테이블 즉시 업데이트 (messageType 포함)
      if (currentSmsNumericId && imageUrlToSave) {
        try {
          const saveResponse = await fetch(`/api/admin/sms`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: currentSmsNumericId,
              imageUrl: imageUrlToSave,
              type: formData.messageType // ⭐ 메시지 타입도 함께 저장
            })
          });
          
          if (!saveResponse.ok) {
            console.warn('⚠️ DB 저장 실패 (무시하고 계속 진행)');
          }
        } catch (error) {
          console.error('DB 저장 오류:', error);
        }
      }
      
      alert('이미지가 준비되었습니다.');
    } catch (error: any) {
      console.error('갤러리 이미지 재업로드 오류:', error);
      alert(`이미지 처리 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // 이미지 제거 함수
  const handleImageRemove = () => {
    setSelectedImage(null);
    setImageId('');
    setImagePreviewUrl('');
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
          // Content-Type 확인
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            setBlogPosts(data.posts || []);
          } else {
            console.error('❌ 블로그 API가 JSON이 아닌 응답을 반환했습니다.');
          }
        }
      } catch (error) {
        console.error('블로그 포스트 로드 실패:', error);
      }
    };
    fetchBlogPosts();
  }, []);

  // SMS 데이터 로드 (note 포함)
  useEffect(() => {
    const loadSMSData = async (smsId: number) => {
      try {
        const response = await fetch(`/api/admin/sms?id=${smsId}`);
        
        // Content-Type 확인
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('❌ API가 JSON이 아닌 응답을 반환했습니다:', {
            status: response.status,
            statusText: response.statusText,
            contentType,
            preview: text.substring(0, 200)
          });
          throw new Error(`API 오류: ${response.status} ${response.statusText}`);
        }
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.smsContent) {
            const sms = result.smsContent;
            // savedSmsId 설정
            if (sms.id) {
              setSavedSmsId(sms.id);
            }
            // formData 업데이트
            updateFormData({
              content: sms.message_text || '',
              messageType: sms.message_type || 'SMS300',
              imageUrl: sms.image_url || '',
              shortLink: sms.short_link || '',
              recipientNumbers: sms.recipient_numbers || [],
              status: sms.status || 'draft'
            });
            if (sms.image_url) {
              if (isHttpUrl(sms.image_url)) {
                // HTTP URL이면 바로 설정
                setImagePreviewUrl(sms.image_url);
              } else if (sms.image_url.startsWith('ST01FZ')) {
                // Solapi imageId인 경우 get-image-preview API 사용
                try {
                  const previewResponse = await fetch(`/api/solapi/get-image-preview?imageId=${sms.image_url}&messageId=${sms.id}`);
                  if (previewResponse.ok) {
                    const previewData = await previewResponse.json();
                    if (previewData.success && previewData.imageUrl) {
                      setImagePreviewUrl(previewData.imageUrl);
                      console.log('✅ Solapi imageId 프리뷰 로드 성공');
                    } else {
                      console.warn('⚠️ Solapi imageId 프리뷰 조회 실패:', previewData.message);
                    }
                  } else {
                    console.warn('⚠️ get-image-preview API 오류:', previewResponse.status);
                  }
                } catch (error) {
                  console.error('❌ Solapi 이미지 프리뷰 조회 오류:', error);
                }
              } else if (sms.id) {
                // 기존 로직: image_metadata에서 찾기
                fetchLatestPreview(sms.id);
              }
            } else if (sms.id) {
              fetchLatestPreview(sms.id);
            }
            // note 로드
            if (sms.note) {
              setNote(sms.note);
            } else {
              setNote('');
            }
            
            // honorific 로드
            if (sms.honorific) {
              setHonorific(sms.honorific);
            } else {
              setHonorific('고객님'); // 기본값
            }

            if (sms.scheduled_at) {
              setScheduledAt(convertUTCToLocalInput(sms.scheduled_at));
              setIsScheduled(true);
              setHasScheduledTime(true);
            } else {
              setScheduledAt('');
              setIsScheduled(false);
              setHasScheduledTime(false);
            }
          } else {
            console.error('❌ SMS 데이터 로드 실패:', result);
          }
        } else {
          // 에러 응답 처리
          if (response.status === 404) {
            // 404 오류 시 목록으로 이동
            alert(`메시지 ID ${smsId}를 찾을 수 없습니다.\n목록으로 이동합니다.`);
            router.push('/admin/sms-list');
            return;
          }
          const errorText = await response.text();
          console.error('❌ SMS 조회 API 오류:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText.substring(0, 200)
          });
          alert(`메시지를 불러올 수 없습니다: ${response.status} ${response.statusText}\n목록으로 이동합니다.`);
          router.push('/admin/sms-list');
        }
      } catch (error: any) {
        console.error('SMS 데이터 로드 오류:', error);
        // 사용자에게 친화적인 에러 메시지 표시
        alert(`메시지를 불러올 수 없습니다: ${error.message}\n목록으로 이동합니다.`);
        router.push('/admin/sms-list');
        if (error.message && error.message.includes('JSON')) {
          alert('서버 오류가 발생했습니다. 페이지를 새로고침해주세요.');
        }
      }
    };

    if (mode === 'edit' && edit) {
      // 허브 시스템에서 온 경우: ?edit=26&mode=edit
      console.log('편집 모드로 SMS 로드 (허브 시스템):', edit);
      const numericId = parseInt(edit as string);
      loadSMSData(numericId);
      loadPost(parseInt(edit as string));
    } else if (id && mode !== 'edit' && !edit) {
      // SMS 관리에서 온 경우: ?id=26
      console.log('SMS 관리에서 로드:', id);
      const numericId = parseInt(id as string);
      loadSMSData(numericId);
      loadPost(parseInt(id as string));
    } else if (blogPostId) {
      // 블로그에서 가져오기
      loadFromBlog(parseInt(blogPostId as string));
    }
  }, [mode, edit, id, blogPostId, loadPost, loadFromBlog, updateFormData, fetchLatestPreview]);

  useEffect(() => {
    // formData.imageUrl이 HTTP URL이면 imagePreviewUrl 설정
    if (isHttpUrl(formData.imageUrl)) {
      setImagePreviewUrl(formData.imageUrl);
    } else if (formData.imageUrl && formData.imageUrl.startsWith('ST01FZ')) {
      // Solapi imageId인 경우 get-image-preview API 사용
      const loadSolapiPreview = async () => {
        try {
          const previewResponse = await fetch(`/api/solapi/get-image-preview?imageId=${formData.imageUrl}${currentSmsNumericId ? `&messageId=${currentSmsNumericId}` : ''}`);
          if (previewResponse.ok) {
            const previewData = await previewResponse.json();
            if (previewData.success && previewData.imageUrl) {
              setImagePreviewUrl(previewData.imageUrl);
            }
          }
        } catch (error) {
          console.error('Solapi 이미지 프리뷰 조회 오류:', error);
        }
      };
      loadSolapiPreview();
    } else if (!formData.imageUrl && imagePreviewUrl) {
      // imageUrl이 없어지면 imagePreviewUrl도 초기화
      setImagePreviewUrl('');
    }
  }, [formData.imageUrl, currentSmsNumericId]);

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
  const mobileImagePreview = imagePreviewUrl || (isHttpUrl(formData.imageUrl) ? formData.imageUrl : '');

  // 문자 길이 상태
  const getLengthStatus = () => {
    const percentage = (messageLength / maxLength) * 100;
    
    if (percentage > 100) return { color: 'text-red-600', bg: 'bg-red-500' };
    if (percentage > 80) return { color: 'text-yellow-600', bg: 'bg-yellow-500' };
    return { color: 'text-green-600', bg: 'bg-green-500' };
  };

  const buildSmsPayload = (overrides: Record<string, any> = {}) => {
    const currentStatus = formData.status || 'draft';
    const baseRecipients =
      overrides.recipientNumbers !== undefined
        ? overrides.recipientNumbers
        : formData.recipientNumbers || [];
    const sanitizedRecipients = Array.isArray(baseRecipients)
      ? (baseRecipients as string[]).filter((num) => num && num.trim().length > 0)
      : [];
    const scheduledOverride = overrides.hasOwnProperty('scheduledAt')
      ? overrides.scheduledAt
      : isScheduled && scheduledAt
        ? convertLocalInputToUTC(scheduledAt)
        : null;

    const payload: any = {
      id: overrides.hasOwnProperty('id')
        ? overrides.id
        : currentSmsNumericId !== null
          ? currentSmsNumericId
          : undefined,
      message: overrides.message ?? (formData.content || formData.title || ''),
      type: overrides.type ?? (formData.messageType || 'SMS300'),
      status: overrides.status ?? currentStatus,
      calendar_id: overrides.calendar_id ?? (hub || null),
      recipientNumbers: sanitizedRecipients,
      imageUrl: overrides.imageUrl ?? (formData.imageUrl || null),
      shortLink: overrides.shortLink ?? (formData.shortLink || null),
      note: overrides.note ?? (note || null),
      scheduledAt: scheduledOverride,
      honorific: overrides.honorific ?? honorific
    };

    if (payload.id === undefined || payload.id === null) {
      delete payload.id;
    }

    return payload;
  };

  const handleToggleSchedule = (checked: boolean) => {
    setIsScheduled(checked);
    if (checked) {
      setScheduledAt((prev) => prev || getDefaultScheduleValue());
      setHasScheduledTime(false);
    } else {
      setScheduledAt('');
      setHasScheduledTime(false);
    }
  };

  const handleSaveScheduledTime = async () => {
    if (!isScheduled) {
      alert('예약 발송을 먼저 활성화해주세요.');
      return;
    }
    if (!scheduledAt) {
      alert('예약 시간을 선택해주세요.');
      return;
    }

    // ⭐ 메시지 ID가 없으면 먼저 저장
    let channelPostId = currentSmsNumericId;
    if (!channelPostId) {
      try {
        channelPostId = await saveDraft(
          calendarId ? parseInt(calendarId as string) : undefined,
          blogPostId ? parseInt(blogPostId as string) : undefined
        );
        setSavedSmsId(channelPostId);
      } catch (error: any) {
        alert('메시지를 먼저 저장해주세요: ' + error.message);
        return;
      }
    }

    // 한국 시간 기준으로 직접 비교 (간단하고 명확)
    const scheduledKST = new Date(scheduledAt); // datetime-local은 한국 시간으로 입력됨
    const nowKST = new Date(); // 현재도 한국 시간

    // 과거 시간 체크 (한국 시간 기준)
    if (scheduledKST <= nowKST) {
      alert('예약 시간은 현재 시간보다 미래여야 합니다.');
      return;
    }

    // 최소 예약 시간 체크 (5분) - 한국 시간 기준
    const minScheduledTime = new Date(nowKST.getTime() + 5 * 60 * 1000); // 5분 후
    if (scheduledKST < minScheduledTime) {
      const minutesUntil = Math.ceil((scheduledKST.getTime() - nowKST.getTime()) / (60 * 1000));
      if (!confirm(`예약 시간이 ${minutesUntil}분 후입니다. 최소 5분 후로 설정하는 것을 권장합니다.\n\n계속하시겠습니까?`)) {
        return;
      }
    }

    // DB 저장 시에만 UTC로 변환
    const scheduledUtc = convertLocalInputToUTC(scheduledAt);
    if (!scheduledUtc) {
      alert('유효한 예약 시간을 선택해주세요.');
      return;
    }

    setSavingSchedule(true);
    try {
      // ⭐ 메시지 내용도 함께 저장
      const payload = buildSmsPayload({
        id: channelPostId,
        scheduledAt: scheduledUtc
      });
      const response = await fetch('/api/admin/sms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || '예약 시간을 저장하지 못했습니다.');
      }
      setSavedSmsId(channelPostId);
      setHasScheduledTime(true);
      alert(`예약 시간과 메시지가 저장되었습니다.\n\n예약 시간: ${formatScheduleDisplay(scheduledAt)}\n\n예약 시간이 되면 자동으로 발송됩니다.`);
    } catch (error: any) {
      console.error('예약 시간 저장 오류:', error);
      alert(error.message || '예약 시간을 저장하지 못했습니다.');
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleCancelScheduled = async () => {
    const hasServerSchedule = currentSmsNumericId && hasScheduledTime;
    if (!isScheduled && !hasServerSchedule) {
      return;
    }

    if (hasServerSchedule && !confirm('예약 설정을 취소하시겠습니까?')) {
      return;
    }

    if (!hasServerSchedule) {
      setIsScheduled(false);
      setScheduledAt('');
      setHasScheduledTime(false);
      return;
    }

    setSavingSchedule(true);
    try {
      const payload = buildSmsPayload({
        id: currentSmsNumericId ?? undefined,
        scheduledAt: null
      });
      const response = await fetch('/api/admin/sms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || '예약을 취소하지 못했습니다.');
      }
      setIsScheduled(false);
      setScheduledAt('');
      setHasScheduledTime(false);
      alert('예약이 취소되었습니다.');
    } catch (error: any) {
      console.error('예약 취소 오류:', error);
      alert(error.message || '예약을 취소하지 못했습니다.');
    } finally {
      setSavingSchedule(false);
    }
  };

  // 배열을 청크로 나누는 헬퍼 함수
  const chunkArray = <T,>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
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
        formData: formData,
        autoSplit,
        splitSize
      });

      // SMS 데이터 직접 저장 (useChannelEditor 대신 직접 API 호출)
      const currentStatus = formData.status || 'draft';
      const recipientNumbers = formData.recipientNumbers || [];

      // 자동 분할 처리
      if (autoSplit && !id && !currentSmsNumericId && recipientNumbers.length > splitSize) {
        // 새 메시지이고 자동 분할이 활성화되어 있고 수신자가 분할 크기보다 많을 때
        const chunks = chunkArray(recipientNumbers, splitSize);
        const totalChunks = chunks.length;
        
        console.log(`📦 자동 분할 저장: ${recipientNumbers.length}명 → ${totalChunks}개 메시지로 분할`);

        const createdIds: number[] = [];

        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const chunkNote = note 
            ? `${note} [${i + 1}차/${totalChunks}차]`
            : `[${i + 1}차/${totalChunks}차]`;

          const smsData = buildSmsPayload({
            recipientNumbers: chunk,
            note: chunkNote
          });

          const response = await fetch('/api/admin/sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(smsData)
          });

          const result = await response.json();
          
          if (result.success) {
            const newSmsId = result.smsId || result.smsContent?.id;
            if (newSmsId) {
              createdIds.push(newSmsId);
            }
          } else {
            throw new Error(`분할 메시지 ${i + 1} 저장 실패: ${result.message}`);
          }
        }

        if (createdIds.length > 0) {
          alert(`✅ ${totalChunks}개의 메시지로 자동 분할 저장되었습니다.\n\n생성된 메시지 ID: ${createdIds.join(', ')}`);
          router.push('/admin/sms-list');
          return;
        }
      }

      // 일반 저장 (자동 분할이 아니거나 기존 메시지 수정)
      const smsData = buildSmsPayload();

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
        // 저장된 ID 업데이트
        const newSmsId = result.smsId || result.smsContent?.id;
        if (newSmsId) {
          setSavedSmsId(newSmsId);
          // URL도 업데이트 (새 메시지인 경우)
          if (!id && !currentSmsNumericId) {
            router.replace(`/admin/sms?id=${newSmsId}`, undefined, { shallow: true });
          }
        }
        
        // 허브 연동이 있는 경우 상태 동기화
        if (hub && newSmsId) {
          // 동적 채널 키 확인 (URL에서 channelKey 파라미터 추출)
          const channelKey = router.query.channelKey || 'sms';
          console.log('🔄 허브 상태 동기화 시작:', { hub, channelKey, smsId: newSmsId });
          
          try {
            const syncResponse = await fetch('/api/admin/sync-channel-status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                hubContentId: hub,
                channel: channelKey, // 동적 채널 키 사용
                channelContentId: newSmsId,
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
        
        // 저장 후 목록으로 이동
        router.push('/admin/sms-list');
      } else {
        throw new Error(result.message || '저장 실패');
      }
    } catch (error) {
      console.error('❌ SMS 저장 오류:', error);
      alert('저장 중 오류가 발생했습니다: ' + error.message);
    }
  };

  // 수동 분할 핸들러
  const handleManualSplit = async () => {
    const recipientNumbers = formData.recipientNumbers || [];
    
    if (recipientNumbers.length === 0) {
      alert('수신자 번호가 없습니다.');
      return;
    }

    if (!manualSplitSize || manualSplitSize <= 0) {
      alert('분할 크기를 입력해주세요.');
      return;
    }

    if (manualSplitSize > recipientNumbers.length) {
      alert(`분할 크기(${manualSplitSize}명)가 수신자 수(${recipientNumbers.length}명)보다 큽니다.`);
      return;
    }

    const totalChunks = Math.ceil(recipientNumbers.length / manualSplitSize);
    
    if (!confirm(`${recipientNumbers.length}명을 ${manualSplitSize}명씩 분할하여 ${totalChunks}개의 메시지를 생성하시겠습니까?`)) {
      return;
    }

    try {
      // 청크로 분할
      const chunks = chunkArray(recipientNumbers, manualSplitSize);

      // 현재 메모에서 기본 메모 추출 (예: "구매자 1514명중 3차")
      const baseNote = note || '';
      // "(1번 분할)", "(2번 분할)" 등의 패턴이 이미 있으면 제거
      const cleanNote = baseNote.replace(/\s*\(\d+번\s*분할\)\s*$/, '').trim();

      const createdIds: number[] = [];

      // 1. 원본 메시지 업데이트 (첫 번째 청크)
      const firstChunk = chunks[0];
      const firstNote = cleanNote ? `${cleanNote} (1번 분할)` : '(1번 분할)';

      if (currentSmsNumericId) {
        // 기존 메시지가 있으면 업데이트
        const smsData = buildSmsPayload({
          recipientNumbers: firstChunk,
          note: firstNote
        });

        const response = await fetch('/api/admin/sms', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...smsData, id: currentSmsNumericId })
        });

        const result = await response.json();
        if (result.success) {
          createdIds.push(currentSmsNumericId);
          console.log(`✅ 원본 메시지 업데이트 완료: ID ${currentSmsNumericId}`);
        } else {
          throw new Error(result.message || '원본 메시지 업데이트 실패');
        }
      } else {
        // 새 메시지면 첫 번째 청크로 저장
        const smsData = buildSmsPayload({
          recipientNumbers: firstChunk,
          note: firstNote
        });

        const response = await fetch('/api/admin/sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(smsData)
        });

        const result = await response.json();
        if (result.success) {
          const newId = result.smsId || result.smsContent?.id;
          if (newId) {
            createdIds.push(newId);
            setSavedSmsId(newId);
            console.log(`✅ 첫 번째 메시지 생성 완료: ID ${newId}`);
          } else {
            throw new Error('첫 번째 메시지 ID를 받지 못했습니다.');
          }
        } else {
          throw new Error(result.message || '첫 번째 메시지 생성 실패');
        }
      }

      // 2. 나머지 청크들을 새 메시지로 생성
      for (let i = 1; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkNote = cleanNote ? `${cleanNote} (${i + 1}번 분할)` : `(${i + 1}번 분할)`;

        const smsData = buildSmsPayload({
          recipientNumbers: chunk,
          note: chunkNote
        });

        const response = await fetch('/api/admin/sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(smsData)
        });

        const result = await response.json();
        if (result.success) {
          const newId = result.smsId || result.smsContent?.id;
          if (newId) {
            createdIds.push(newId);
            console.log(`✅ ${i + 1}번째 메시지 생성 완료: ID ${newId}`);
          } else {
            console.error(`❌ ${i + 1}번째 메시지 ID를 받지 못했습니다.`);
          }
        } else {
          console.error(`❌ ${i + 1}번째 메시지 생성 실패:`, result.message);
        }
      }

      alert(`✅ 분할 완료!\n\n` +
        `총 ${totalChunks}개의 메시지가 생성되었습니다.\n` +
        `생성된 메시지 ID: ${createdIds.join(', ')}\n\n` +
        `SMS 리스트에서 확인하세요.`);

      // 현재 페이지를 첫 번째 메시지로 이동
      if (createdIds.length > 0) {
        router.push(`/admin/sms?id=${createdIds[0]}`);
      }

    } catch (error: any) {
      console.error('❌ 분할 오류:', error);
      alert(`분할 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  // 새로 저장 (이미 보낸 메시지를 새 메시지로 복사)
  const handleSaveAsNew = async () => {
    try {
      // 예약 시간을 초기화하여 새 메시지 생성
      const smsData = buildSmsPayload({
        scheduledAt: null, // 예약 시간 초기화
        status: 'draft'     // 상태를 draft로 강제
      });
      // id 제거하여 새 메시지로 생성
      delete smsData.id;
      
      const response = await fetch('/api/admin/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smsData)
      });
      
      const result = await response.json();
      if (result.success) {
        const newId = result.smsId || result.smsContent?.id;
        if (newId) {
          // 예약 시간 상태도 초기화
          setIsScheduled(false);
          setScheduledAt('');
          setHasScheduledTime(false);
          
          // 새 메시지로 이동
          router.push(`/admin/sms?id=${newId}`);
          alert('새 메시지로 저장되었습니다.');
        } else {
          throw new Error('새 메시지 ID를 받지 못했습니다.');
        }
      } else {
        throw new Error(result.message || '새로 저장 실패');
      }
    } catch (error: any) {
      console.error('❌ 새로 저장 오류:', error);
      alert('새로 저장 중 오류가 발생했습니다: ' + error.message);
    }
  };

  // 목록으로 이동
  const handleClose = () => {
    // 저장된 메시지면 바로 목록으로
    if (currentSmsNumericId) {
      router.push('/admin/sms-list');
      return;
    }
    
    // 새 메시지이고 내용이 있으면 확인
    if (formData.content.trim() || formData.recipientNumbers?.length) {
      if (confirm('작성 중인 내용이 있습니다. 정말 나가시겠습니까?')) {
        router.push('/admin/sms-list');
      }
    } else {
      router.push('/admin/sms-list');
    }
  };

  // 저장 버튼 텍스트 동적 변경
  const getSaveButtonText = () => {
    if (currentSmsNumericId) {
      if (formData.status === 'sent') {
        return '수정 저장';
      }
      return '저장';
    }
    return '저장';
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

    // ⭐ 예약 시간이 저장되어 있으면 예약 발송 안내
    if (hasScheduledTime && isScheduled && scheduledAt) {
      const scheduledKST = new Date(scheduledAt);
      const nowKST = new Date();
      
      if (scheduledKST > nowKST) {
        alert(`이 메시지는 예약 발송으로 설정되어 있습니다.\n\n예약 시간: ${formatScheduleDisplay(scheduledAt)}\n\n즉시 발송하려면 먼저 예약을 취소해주세요.`);
        return;
      }
    }

    if (!confirm('정말로 SMS를 발송하시겠습니까?')) {
      return;
    }

    setIsSending(true);
    try {
      // 스탭 테스트 번호 확인
      const testNumbers = ['010-6669-9000', '010-5704-0013'];
      const recipientNumbers = formData.recipientNumbers || [];
      const testNumberCount = recipientNumbers.filter(num => 
        testNumbers.some(testNum => num.includes(testNum.replace(/-/g, '')) || num === testNum)
      ).length;
      
      // 메모에 스탭 테스트 포함 정보 추가
      let finalNote = note || '';
      if (testNumberCount > 0) {
        if (finalNote && !finalNote.includes('[스탭 테스트 포함:')) {
          finalNote = `${finalNote} [스탭 테스트 포함: ${testNumberCount}건]`;
        } else if (!finalNote) {
          finalNote = `[스탭 테스트 포함: ${testNumberCount}건]`;
        }
        // formData에 메모 업데이트 (saveDraft에서 사용)
        setNote(finalNote);
      }
      
      const channelPostId = id ? parseInt(id as string) : await saveDraft(
        calendarId ? parseInt(calendarId as string) : undefined,
        blogPostId ? parseInt(blogPostId as string) : undefined
      );
      
      // ⭐ 기존 메시지인 경우 이미지와 메모 업데이트
      if (id) {
        try {
          const currentStatus = formData.status || 'draft';
          const payload = buildSmsPayload({
            id: currentSmsNumericId ?? undefined,
            note: finalNote,
            status: currentStatus,
            imageUrl: formData.imageUrl || undefined // ⭐ 이미지도 함께 업데이트
          });
          await fetch('/api/admin/sms', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          console.log('✅ 기존 메시지 업데이트 완료 (이미지 포함):', {
            id: currentSmsNumericId,
            imageUrl: formData.imageUrl ? '있음' : '없음'
          });
        } catch (updateError) {
          console.error('메시지 업데이트 오류:', updateError);
        }
      }

      // ⭐ 호칭을 포함하여 발송
      // sendMessage는 formData를 직접 참조하므로, API를 직접 호출하여 honorific을 확실히 전달
      const sendResponse = await fetch('/api/channels/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelPostId,
          messageType: formData.messageType || 'MMS',
          messageText: formData.content,
          content: formData.content,
          imageUrl: formData.imageUrl || null,
          shortLink: formData.shortLink || null,
          recipientNumbers: formData.recipientNumbers || [],
          honorific: honorific // ⭐ 호칭 전달
        })
      });

      const sendResult = await sendResponse.json();
      
      // sendMessage와 동일한 결과 형식으로 변환
      const result = sendResult.result || {
        groupIds: sendResult.result?.groupIds || [],
        sentCount: sendResult.result?.sentCount || 0,
        successCount: sendResult.result?.successCount || 0,
        failCount: sendResult.result?.failCount || 0
      };
      
      // 부분 성공 처리 (result가 없거나 successCount가 0인 경우만 에러)
      if (result) {
        const successCount = result.successCount || 0;
        const failCount = result.failCount || 0;
        const totalCount = result.sentCount || 0;
        
        if (successCount > 0) {
          // 성공이 있는 경우 (전체 성공 또는 부분 성공)
          if (failCount > 0) {
            // 부분 성공
            const message = `부분 성공: ${successCount}건 발송 성공, ${failCount}건 실패\n\n총 ${totalCount}명 중 ${successCount}명에게 메시지가 전송되었습니다.`;
            if (result.chunkErrors && result.chunkErrors.length > 0) {
              alert(`${message}\n\n실패한 청크: ${result.chunkErrors.length}개`);
            } else {
              alert(message);
            }
          } else {
            // 전체 성공
            alert(`SMS가 성공적으로 발송되었습니다.\n\n총 ${successCount}건 발송 완료`);
          }
          
          // ⭐ 발송 성공 후 기존 메시지인 경우 데이터 다시 로드 (이미지 포함)
          if (id && currentSmsNumericId) {
            try {
              console.log('🔄 발송 후 메시지 데이터 다시 로드 중...');
              const reloadResponse = await fetch(`/api/admin/sms?id=${currentSmsNumericId}`);
              if (reloadResponse.ok) {
                const reloadResult = await reloadResponse.json();
                if (reloadResult.success && reloadResult.smsContent) {
                  const sms = reloadResult.smsContent;
                  
                  // formData 업데이트 (이미지 포함)
                  updateFormData({
                    imageUrl: sms.image_url || formData.imageUrl,
                    status: sms.status || formData.status
                  });
                  
                  // 이미지 프리뷰 업데이트
                  if (sms.image_url) {
                    if (isHttpUrl(sms.image_url)) {
                      setImagePreviewUrl(sms.image_url);
                      console.log('✅ 이미지 프리뷰 업데이트 (HTTP URL)');
                    } else {
                      // Solapi imageId인 경우 fetchLatestPreview 호출
                      await fetchLatestPreview(currentSmsNumericId);
                      console.log('✅ 이미지 프리뷰 업데이트 (Solapi imageId)');
                    }
                  }
                  
                  console.log('✅ 발송 후 메시지 데이터 다시 로드 완료');
                }
              }
            } catch (reloadError) {
              console.error('메시지 다시 로드 오류:', reloadError);
            }
          }
        } else if (failCount > 0) {
          // 전체 실패 (successCount가 0이고 failCount > 0)
          throw new Error(`발송 실패: 모든 메시지 발송에 실패했습니다.`);
        } else {
          // 카운트 정보가 없는 경우 (동기화 필요)
          alert(`발송 요청이 완료되었습니다.\n\n발송 결과는 SMS 리스트에서 확인하거나 동기화 버튼을 눌러주세요.`);
        }
      } else {
        // result가 없는 경우 (동기화 필요)
        alert(`발송 요청이 완료되었습니다.\n\n발송 결과는 SMS 리스트에서 확인하거나 동기화 버튼을 눌러주세요.`);
      }
      
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
      
      router.push('/admin/sms');
    } catch (error: any) {
      const errorMessage = error.message || '발송 중 오류가 발생했습니다.';
      alert(errorMessage);
      console.error('SMS 발송 오류:', error);
    } finally {
      setIsSending(false);
    }
  };

  // 스탭진 테스트 발송 함수
  const handleTestSend = async () => {
    const testNumbers = [
      '010-6669-9000',
      '010-5704-0013'
    ];

    if (!formData.content?.trim()) {
      alert('메시지 내용을 입력해주세요.');
      return;
    }

    if (!confirm(`스탭진 테스트 발송을 진행하시겠습니까?\n\n테스트 번호: ${testNumbers.join(', ')}\n\n기존 메시지는 변경되지 않으며, 테스트 메시지가 새로 생성됩니다.`)) {
      return;
    }

    setIsSending(true);
    try {
      // 1. 테스트 전용 새 메시지 생성 (기존 메시지 내용 복사, 테스트 번호만 사용)
      const testMessageResponse = await fetch('/api/admin/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: formData.content,
          type: formData.messageType || 'MMS',
          status: 'draft', // 먼저 draft로 생성
          calendar_id: hub || null,
          recipientNumbers: testNumbers, // 테스트 번호만
          imageUrl: formData.imageUrl || null,
          shortLink: formData.shortLink || null,
          note: `[스탭진 테스트] ${note || '테스트 발송'} [스탭 테스트 포함: ${testNumbers.length}건]`
        })
      });

      const testMessageResult = await testMessageResponse.json();
      
      if (!testMessageResult.success) {
        throw new Error(testMessageResult.message || '테스트 메시지 생성 실패');
      }

      const testMessageId = testMessageResult.smsContent?.id || testMessageResult.smsId;
      
      // 2. 테스트 메시지 정보를 DB에서 가져오기
      const messageInfoResponse = await fetch(`/api/channels/sms/${testMessageId}`);
      const messageInfo = await messageInfoResponse.json();
      
      if (!messageInfo.success || !messageInfo.post) {
        throw new Error('테스트 메시지 정보를 가져올 수 없습니다.');
      }

      // 3. 테스트 메시지의 수신자 번호를 명시적으로 전달하여 발송
      const sendResponse = await fetch('/api/channels/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelPostId: testMessageId,
          messageType: messageInfo.post.formData.messageType || formData.messageType || 'MMS',
          messageText: messageInfo.post.formData.content || formData.content,
          content: messageInfo.post.formData.content || formData.content,
          imageUrl: messageInfo.post.formData.imageUrl || formData.imageUrl || null,
          shortLink: messageInfo.post.formData.shortLink || formData.shortLink || null,
          recipientNumbers: messageInfo.post.formData.recipientNumbers || testNumbers, // DB에서 가져온 테스트 번호만 사용
          honorific: honorific // ⭐ 호칭 전달
        })
      });

      const sendResult = await sendResponse.json();
      
      if (sendResult.success) {
        // successCount가 0이면 실제 발송된 메시지 수(sentCount)를 사용
        const successCount = sendResult.result?.successCount || 
                            sendResult.result?.sentCount || 
                            (sendResult.result?.groupIds?.length ? testNumbers.length : 0);
        const failCount = sendResult.result?.failCount || 0;
        
        alert(`스탭진 테스트 발송 완료!\n\n${successCount}건 발송 성공${failCount > 0 ? `, ${failCount}건 실패` : ''}\n\n테스트 메시지 ID: ${testMessageId}\nSMS 리스트에서 확인할 수 있습니다.`);
      } else {
        throw new Error(sendResult.message || '테스트 발송 실패');
      }
    } catch (error: any) {
      alert('테스트 발송 중 오류가 발생했습니다: ' + error.message);
      console.error('테스트 발송 오류:', error);
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
                      저장 시 자동으로 허브 상태가 동기화됩니다.
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  목록으로
                </button>
                <button
                  onClick={handleSaveDraft}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
                >
                  {isLoading ? '저장 중...' : getSaveButtonText()}
                </button>
                {currentSmsNumericId && formData.status === 'sent' && (
                  <button
                    onClick={handleSaveAsNew}
                    disabled={isLoading}
                    className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 disabled:opacity-50"
                  >
                    {isLoading ? '저장 중...' : '새로 저장'}
                  </button>
                )}
                <button
                  onClick={handleSend}
                  disabled={
                    isLoading || 
                    isSending || 
                    !formData.content.trim() || 
                    (hasScheduledTime && isScheduled) // ⭐ 예약 시간이 저장되어 있으면 비활성화
                  }
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {isSending ? '발송 중...' : hasScheduledTime && isScheduled ? '예약 발송됨' : 'SMS 발송'}
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
                  {/* 호칭 선택 버튼 */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-700 whitespace-nowrap">호칭:</label>
                    <div className="flex gap-1">
                      {['선생님', '고객님', '님'].map((h) => (
                        <button
                          key={h}
                          onClick={() => setHonorific(h)}
                          disabled={!hasNameVariable}
                          className={`px-3 py-1 text-xs rounded transition-colors ${
                            !hasNameVariable
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : honorific === h 
                                ? 'bg-blue-600 text-white font-medium' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                          title={!hasNameVariable ? '메시지에 {name} 변수를 추가해주세요' : ''}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>
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
                <p className="mt-2 text-xs text-right">
                  {hasNameVariable ? (
                    <span className="text-gray-500">
                      호칭은 버튼에서 선택하고 메시지에는 {'{name}'}만 입력해주세요. 예: {'{name}'}, 안녕하세요!
                    </span>
                  ) : (
                    <span className="text-yellow-600 font-medium">
                      ⚠️ 메시지에 {'{name}'} 변수를 추가하면 호칭 버튼을 사용할 수 있습니다.
                    </span>
                  )}
                </p>
                <textarea
                  value={formData.content}
                  onChange={(e) => updateFormData({ content: e.target.value })}
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="메시지 내용을 입력하세요..."
                  maxLength={getMaxLength()}
                />
              {/* 길이 프리셋 / 사용자 지정 */}
              <div className="mt-3 p-3 bg-gray-50 border rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-700">목표 길이 선택</div>
                  <div className="text-sm text-gray-500">현재 {getMessageLength()}자 / 최대 {getMaxLength()}자</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[100, 200, 300, 500, 1000, 2000].map((n) => (
                    <button
                      key={n}
                      onClick={() => applyLengthPreset(n)}
                      className={`px-2 py-1 text-xs rounded border ${targetLength === n ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-gray-100'}`}
                    >
                      {n}자
                    </button>
                  ))}
                  <div className="flex items-center gap-2 ml-auto">
                    <input
                      type="number"
                      value={typeof targetLength === 'number' ? targetLength : ''}
                      onChange={(e) => setTargetLength(e.target.value ? parseInt(e.target.value, 10) : '')}
                      className="w-24 px-2 py-1 text-sm border rounded"
                      placeholder="직접입력"
                      min={20}
                    />
                    <button
                      onClick={() => handleApplyTarget()}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      적용
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button onClick={() => adjustByPercent(-0.1)} className="px-2 py-1 text-xs border rounded hover:bg-gray-100">조금 더 짧게 (-10%)</button>
                  <button onClick={() => adjustByPercent(0.1)} className="px-2 py-1 text-xs border rounded hover:bg-gray-100">조금 더 길게 (+10%)</button>
                  <label className="ml-3 text-xs text-gray-700 flex items-center gap-1">
                    <input type="checkbox" checked={lengthOptions.optimizeLineBreaks} onChange={(e) => setLengthOptions({ ...lengthOptions, optimizeLineBreaks: e.target.checked })} /> 줄바꿈 최적화
                  </label>
                  <label className="text-xs text-gray-700 flex items-center gap-1">
                    <input type="checkbox" checked={lengthOptions.psychologyTone} onChange={(e) => setLengthOptions({ ...lengthOptions, psychologyTone: e.target.checked })} /> 심리학 톤
                  </label>
                  <label className="text-xs text-gray-700 flex items-center gap-1">
                    <input type="checkbox" checked={lengthOptions.emphasizeCTA} onChange={(e) => setLengthOptions({ ...lengthOptions, emphasizeCTA: e.target.checked })} /> CTA 강조
                  </label>
                </div>
              </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getLengthStatus().bg}`}
                      style={{ width: `${Math.min((getMessageLength() / getMaxLength()) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* 세그먼트 선택 */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-gray-800 mb-3">🎯 고객 세그먼트 선택</h3>
                <div className="space-y-3">
                  {/* 구매자/비구매자 선택 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">구매 여부</label>
                    <select
                      value={segmentFilter.purchased}
                      onChange={(e) => setSegmentFilter({ ...segmentFilter, purchased: e.target.value, purchaseYears: '' })}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="">전체</option>
                      <option value="true">구매자만</option>
                      <option value="false">비구매자만</option>
                    </select>
                  </div>
                  
                  {/* 구매 경과 기간 (구매자 선택 시에만 표시) */}
                  {segmentFilter.purchased === 'true' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">마지막 구매 경과 기간</label>
                      <select
                        value={segmentFilter.purchaseYears}
                        onChange={(e) => setSegmentFilter({ ...segmentFilter, purchaseYears: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      >
                        <option value="">전체 구매자</option>
                        <option value="0-1">1년 미만</option>
                        <option value="1-3">1-3년</option>
                        <option value="3-5">3-5년</option>
                        <option value="5+">5년 이상</option>
                      </select>
                    </div>
                  )}
                  
                  {/* 최근 연락/저장 내역 기간 (비구매자 선택 시에만 표시) */}
                  {segmentFilter.purchased === 'false' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">최근 연락/저장 내역 기간</label>
                      <select
                        value={segmentFilter.contactYears || ''}
                        onChange={(e) => setSegmentFilter({ ...segmentFilter, contactYears: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      >
                        <option value="">전체 비구매자</option>
                        <option value="0-1">1년 미만</option>
                        <option value="1-3">1-3년</option>
                        <option value="3-5">3-5년</option>
                        <option value="5+">5년 이상</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        💡 최근 연락일(last_contact_date) 또는 최초 문의일(first_inquiry_date) 기준
                      </p>
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">최근 연락(일)</label>
                        <select
                          value={segmentFilter.contactDays || ''}
                          onChange={(e) => setSegmentFilter({ ...segmentFilter, contactDays: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md text-sm"
                        >
                          <option value="">전체</option>
                          <option value="7">7일 이내</option>
                          <option value="14">14일 이내</option>
                          <option value="30">30일 이내</option>
                          <option value="90">90일 이내</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">예: 30일 이내에 전화/문의가 있었던 비구매자 타겟팅</p>
                      </div>
                    </div>
                  )}
                  
                  {/* VIP 레벨 (선택 사항) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">VIP 레벨</label>
                    <select
                      value={segmentFilter.vipLevel}
                      onChange={(e) => setSegmentFilter({ ...segmentFilter, vipLevel: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="">전체</option>
                      <option value="bronze">Bronze</option>
                      <option value="silver">Silver</option>
                      <option value="gold">Gold</option>
                      <option value="platinum">Platinum</option>
                    </select>
                  </div>
                  
                  {/* 세그먼트 적용 버튼 (자동 페이징 수집) */}
                  <button
                    onClick={async () => {
                      setSegmentLoading(true);
                      try {
                        const params = new URLSearchParams({ page: '1', pageSize: '1000' });
                        if (segmentFilter.purchased) params.set('purchased', segmentFilter.purchased);
                        if (segmentFilter.purchaseYears) params.set('purchaseYears', segmentFilter.purchaseYears);
                        if (segmentFilter.contactYears) params.set('contactYears', segmentFilter.contactYears);
                        if (segmentFilter.contactDays) params.set('contactDays', segmentFilter.contactDays);
                        if (segmentFilter.vipLevel) params.set('vipLevel', segmentFilter.vipLevel);
                        params.set('optout', 'false'); // 수신거부 제외
                        // 전체 페이지 순회 수집
                        let allPhones: string[] = [];
                        let pageNum = 1;
                        let hasMore = true;
                        let totalCount = 0;
                        while (hasMore) {
                          params.set('page', String(pageNum));
                          const res = await fetch(`/api/admin/customers?${params.toString()}`);
                          const json = await res.json();
                          if (!json.success) break;
                          totalCount = json.count || totalCount;
                          const phones = (json.data || []).map((c: any) => {
                            const phone: string = c.phone;
                            if (phone?.length === 11) return `${phone.slice(0,3)}-${phone.slice(3,7)}-${phone.slice(7)}`;
                            if (phone?.length === 10) return `${phone.slice(0,3)}-${phone.slice(3,6)}-${phone.slice(6)}`;
                            return phone;
                          });
                          allPhones = allPhones.concat(phones);
                          const totalPages = Math.ceil((json.count || 0) / 1000);
                          hasMore = pageNum < totalPages;
                          pageNum += 1;
                        }
                        const uniquePhones = Array.from(new Set(allPhones));
                        updateFormData({ recipientNumbers: uniquePhones });
                        alert(`세그먼트 수집 완료: ${uniquePhones.length}명 / 전체 ${(totalCount || uniquePhones.length).toLocaleString()}명`);
                      } catch (error) {
                        console.error('세그먼트 로드 오류:', error);
                        alert('세그먼트 고객을 불러오는 중 오류가 발생했습니다.');
                      } finally {
                        setSegmentLoading(false);
                      }
                    }}
                    disabled={segmentLoading}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                  >
                    {segmentLoading ? '로딩 중...' : '✅ 세그먼트 적용하여 수신자 자동 선택'}
                  </button>
                  {/* 발송 이력 버튼 */}
                  <button
                    onClick={async () => {
                      try {
                        const contentId = String((formData as any)?.id || (router.query as any)?.id || (router.query as any)?.edit || '');
                        if (!contentId) return alert('허브콘텐츠 ID를 찾을 수 없습니다.');
                        const r = await fetch(`/api/admin/sms/history?contentId=${contentId}&page=1&pageSize=100`);
                        const j = await r.json();
                        if (!j.success) return alert('발송 이력 조회 실패');
                        alert(`이력: 총 ${j.count}건 (성공 ${j.sent}, 실패 ${j.failed})`);
                      } catch (e) {
                        console.error('이력 조회 오류:', e);
                        alert('발송 이력 조회 중 오류가 발생했습니다.');
                      }
                    }}
                    className="w-full mt-2 px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                  >
                    발송 이력 보기
                  </button>
                </div>
              </div>

              {/* 수신자 번호 */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">수신자 번호</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      현재 <span className="font-bold text-blue-600">{formData.recipientNumbers?.length || 0}명</span> 선택됨
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        // 스탭진 테스트 번호 추가
                        const testNumbers = [
                          '010-6669-9000',
                          '010-5704-0013'
                          // 필요시 더 추가 가능
                        ];
                        const existingNumbers = formData.recipientNumbers || [];
                        // 중복 제거하면서 추가
                        const uniqueNumbers = [...existingNumbers];
                        testNumbers.forEach((testNumber) => {
                          if (!uniqueNumbers.includes(testNumber)) {
                            uniqueNumbers.push(testNumber);
                          }
                        });
                        updateFormData({ recipientNumbers: uniqueNumbers });
                        alert(`스탭진 테스트 번호 ${testNumbers.length}개가 추가되었습니다.\n\n추가된 번호:\n${testNumbers.join('\n')}`);
                      }}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      🧪 스탭진 추가
                    </button>
                    <button
                      onClick={handleTestSend}
                      disabled={isSending}
                      className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 disabled:opacity-50"
                    >
                      {isSending ? '테스트 발송 중...' : '🚀 스탭진 테스트 발송'}
                    </button>
                    <button
                      onClick={() => setShowCustomerSelector(true)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      👥 고객 DB에서 선택
                    </button>
                  </div>
                </div>
                
                {/* 수동 분할 기능 */}
                {formData.recipientNumbers && formData.recipientNumbers.length > 0 && (
                  <div className="mb-4 p-3 bg-gray-50 border border-gray-300 rounded-md">
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                        분할 크기:
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={formData.recipientNumbers.length}
                        value={manualSplitSize}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 100;
                          setManualSplitSize(Math.min(Math.max(1, value), formData.recipientNumbers.length));
                        }}
                        className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="100"
                      />
                      <span className="text-sm text-gray-600">명씩</span>
                      <button
                        onClick={handleManualSplit}
                        disabled={!manualSplitSize || manualSplitSize <= 0 || manualSplitSize > formData.recipientNumbers.length}
                        className="ml-auto px-4 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        📦 분할
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      💡 {formData.recipientNumbers.length}명을 {manualSplitSize}명씩 분할하면 <strong>{Math.ceil(formData.recipientNumbers.length / manualSplitSize)}개</strong>의 메시지가 생성됩니다.
                      {note && (
                        <span className="block mt-1">
                          메모: "{note}" → "{note.replace(/\s*\(\d+번\s*분할\)\s*$/, '').trim()} (1번 분할)", "(2번 분할)" 등으로 자동 생성됩니다.
                        </span>
                      )}
                    </p>
                  </div>
                )}
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

              {/* 짧은 링크 생성 */}
              {formData.content && (
                <ShortLinkGenerator
                  originalUrl={`https://win.masgolf.co.kr${router.asPath}`}
                  onLinkGenerated={(shortLink) => updateFormData({ shortLink })}
                />
              )}

              {/* 이미지 선택 및 모바일 미리보기 (MMS) */}
              {formData.messageType === 'MMS' && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
                  {/* 이미지 선택 */}
                  <div className="space-y-2">
                    <AIImagePicker
                      selectedImage={imagePreviewUrl || (isHttpUrl(formData.imageUrl) ? formData.imageUrl : '')}
                      onImageSelect={handleGalleryImageSelect}
                      channelType="sms"
                    />
                    {formData.imageUrl && (
                      <div className="flex items-center gap-2">
                        {formData.imageUrl.startsWith('ST01FZ') ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-700 border border-blue-300" title="Solapi Storage에 저장된 이미지">
                            📦 Solapi
                          </span>
                        ) : formData.imageUrl.includes('supabase.co') ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-700 border border-green-300" title="Supabase Storage에 저장된 이미지">
                            ☁️ Supabase
                          </span>
                        ) : null}
                        <span className="text-xs text-gray-500">
                          {formData.imageUrl.startsWith('ST01FZ') 
                            ? 'Solapi Storage에 저장된 이미지입니다.'
                            : formData.imageUrl.includes('supabase.co')
                            ? 'Supabase Storage에 저장된 이미지입니다.'
                            : '이미지가 선택되었습니다.'
                          }
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* 모바일 미리보기 (실시간 표시) */}
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="font-semibold text-gray-800 mb-4">모바일 미리보기</h3>
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
                            {formData.content || '새 SMS 메시지를 입력하세요'}
                            {formData.shortLink && `\n\n링크: ${formData.shortLink}`}
                          </div>
                          {mobileImagePreview && (
                            <div className="relative mt-2">
                              <img
                                src={mobileImagePreview}
                                alt="MMS 이미지"
                                className="w-full h-auto max-h-64 object-contain rounded"
                              />
                              {formData.imageUrl && (
                                <div className="absolute top-2 right-2">
                                  {formData.imageUrl.startsWith('ST01FZ') ? (
                                    <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-blue-100 text-blue-700 border border-blue-300">
                                      Solapi
                                    </span>
                                  ) : formData.imageUrl.includes('supabase.co') ? (
                                    <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-green-100 text-green-700 border border-green-300">
                                      Supabase
                                    </span>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date().toLocaleString('ko-KR')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 예약 발송 (보낸 메시지는 비활성화) */}
              {formData.status !== 'sent' && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">예약 발송</h3>
                    <p className="text-xs text-gray-500">원하는 날짜와 시간에 자동으로 발송합니다.</p>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={isScheduled}
                      onChange={(e) => handleToggleSchedule(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    예약 사용
                  </label>
                </div>

                {isScheduled ? (
                  <div className="space-y-3">
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      min={formatDateForInput(new Date())}
                      onChange={(e) => {
                        setScheduledAt(e.target.value);
                        setHasScheduledTime(false);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500">
                      {hasScheduledTime && scheduledAt
                        ? `저장된 시간: ${formatScheduleDisplay(scheduledAt)}`
                        : '예약 시간을 저장하면 리스트에서도 확인할 수 있습니다.'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={handleSaveScheduledTime}
                        disabled={savingSchedule || !currentSmsNumericId}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {savingSchedule ? '저장 중...' : currentSmsNumericId ? '예약 시간 저장' : '메시지 저장 후 설정 가능'}
                      </button>
                      {hasScheduledTime && (
                        <button
                          onClick={handleCancelScheduled}
                          disabled={savingSchedule}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                        >
                          예약 취소
                        </button>
                      )}
                    </div>
                    {!currentSmsNumericId && (
                      <p className="text-xs text-yellow-600">
                        예약을 저장하려면 먼저 상단의 &quot;저장&quot; 버튼으로 메시지를 저장해주세요.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">예약 발송을 사용하려면 체크박스를 활성화하세요.</p>
                )}
              </div>
              )}

              {/* 메모 입력 */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">메모</h3>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="메시지에 대한 메모나 코멘트를 입력하세요..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  💡 메모는 메시지 관리 시 참고용으로 사용됩니다.
                </p>
              </div>

              {/* 자동 분할 옵션 (새 메시지일 때만 표시) */}
              {!id && !currentSmsNumericId && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-800">자동 분할 저장</h3>
                      <p className="text-xs text-gray-500">수신자가 많을 때 자동으로 여러 메시지로 나눠서 저장합니다.</p>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={autoSplit}
                        onChange={(e) => setAutoSplit(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      자동 분할 사용
                    </label>
                  </div>

                  {autoSplit && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          분할 크기
                        </label>
                        <select
                          value={splitSize}
                          onChange={(e) => setSplitSize(parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {[100, 200, 400, 500].map((size) => (
                            <option key={size} value={size}>
                              {size}명씩
                            </option>
                          ))}
                        </select>
                      </div>
                      {formData.recipientNumbers && formData.recipientNumbers.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded p-3">
                          <p className="text-xs text-blue-800">
                            📊 현재 수신자: <strong>{formData.recipientNumbers.length}명</strong>
                            {formData.recipientNumbers.length > splitSize && (
                              <>
                                <br />
                                💡 저장 시 <strong>{Math.ceil(formData.recipientNumbers.length / splitSize)}개</strong>의 메시지로 자동 분할됩니다.
                              </>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}


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
