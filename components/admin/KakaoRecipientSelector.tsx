import React, { useState, useEffect, useCallback } from 'react';

interface KakaoRecipientSelectorProps {
  onRecipientsChange: (recipients: string[], stats: any) => void;
  smsMessageIds?: number[];
}

export const KakaoRecipientSelector: React.FC<KakaoRecipientSelectorProps> = ({
  onRecipientsChange,
  smsMessageIds = [232, 273, 227, 231],
}) => {
  const [loading, setLoading] = useState(false);
  const [excludeSmsRecipients, setExcludeSmsRecipients] = useState(true);
  const [excludeSurveyParticipants, setExcludeSurveyParticipants] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipients = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        excludeSmsRecipients: String(excludeSmsRecipients),
        excludeSurveyParticipants: String(excludeSurveyParticipants),
        smsMessageIds: smsMessageIds.join(','),
      });

      const response = await fetch(`/api/kakao/recipients?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success && data.data) {
        // API 응답 구조에 맞게 수정
        const recipientList = data.data.recipients || [];
        const phoneNumbers = recipientList.map((r: any) => {
          // phone 필드가 있으면 사용, 없으면 전체 객체에서 phone 추출
          return r.phone || (typeof r === 'string' ? r : null);
        }).filter((phone: string | null) => phone !== null);
        
        setRecipients(phoneNumbers);
        setStats(data.data.stats || null);
        onRecipientsChange(phoneNumbers, data.data.stats || null);
      } else {
        const errorMessage = data.message || '수신자 목록을 불러올 수 없습니다.';
        setError(errorMessage);
        console.error('API 응답 오류:', data);
        // 에러 발생 시에도 빈 배열로 설정
        setRecipients([]);
        setStats(null);
      }
    } catch (err: any) {
      const errorMessage = err.message || '오류가 발생했습니다.';
      setError(errorMessage);
      console.error('수신자 조회 오류:', err);
      // 에러 발생 시에도 로딩 상태 해제
      setRecipients([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [excludeSmsRecipients, excludeSurveyParticipants, smsMessageIds, onRecipientsChange]);

  useEffect(() => {
    fetchRecipients();
  }, [fetchRecipients]);

  const validateRecipients = async () => {
    if (recipients.length === 0) {
      alert('수신자가 없습니다.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/kakao/validate-recipients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumbers: recipients,
          smsMessageIds,
        }),
      });

      const data = await response.json();
      if (data.success) {
        const { valid, invalid, warnings, summary } = data.data;
        
        let message = `검증 완료!\n\n`;
        message += `✅ 유효한 수신자: ${valid}명\n`;
        message += `❌ 무효한 수신자: ${invalid}명\n`;
        message += `⚠️ 경고: ${warnings}명\n\n`;

        if (summary.warningRecipients.length > 0) {
          message += `경고 사항:\n`;
          summary.warningRecipients.forEach((w: any) => {
            message += `- ${w.phone}: ${w.warnings.join(', ')}\n`;
          });
        }

        alert(message);
      } else {
        alert(data.message || '검증에 실패했습니다.');
      }
    } catch (err: any) {
      alert(err.message || '검증 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        수신자 선택 및 필터링
      </h3>

      {/* 필터 옵션 */}
      <div className="space-y-3 mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={excludeSmsRecipients}
            onChange={(e) => setExcludeSmsRecipients(e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">
            SMS 수신자 제외 (메시지 ID: {smsMessageIds.join(', ')})
          </span>
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={excludeSurveyParticipants}
            onChange={(e) => setExcludeSurveyParticipants(e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">
            설문 참여자 제외
          </span>
        </label>
      </div>

      {/* 통계 정보 */}
      {stats && (
        <div className="mb-4 p-3 bg-white rounded border border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">전체 고객:</span>
              <span className="ml-2 font-semibold">{stats.totalCustomers.toLocaleString()}명</span>
            </div>
            <div>
              <span className="text-gray-600">SMS 수신자:</span>
              <span className="ml-2 font-semibold text-orange-600">{stats.smsRecipients.toLocaleString()}명</span>
            </div>
            <div>
              <span className="text-gray-600">설문 참여자:</span>
              <span className="ml-2 font-semibold text-blue-600">{stats.surveyParticipants.toLocaleString()}명</span>
            </div>
            <div>
              <span className="text-gray-600">발송 가능:</span>
              <span className="ml-2 font-semibold text-green-600">{stats.eligibleRecipients.toLocaleString()}명</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200">
            <span className="text-gray-600 text-sm">제외된 고객:</span>
            <span className="ml-2 font-semibold text-red-600">{stats.excludedCount.toLocaleString()}명</span>
          </div>
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex gap-2">
        <button
          onClick={fetchRecipients}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          {loading ? '로딩 중...' : '수신자 목록 새로고침'}
        </button>
        <button
          onClick={validateRecipients}
          disabled={loading || recipients.length === 0}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
        >
          중복 수신 검증
        </button>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
          {error}
        </div>
      )}

      {/* 수신자 수 표시 */}
      {recipients.length > 0 && !loading && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-sm">
          <span className="text-green-800 font-semibold">
            ✅ {recipients.length.toLocaleString()}명의 수신자가 선택되었습니다.
          </span>
        </div>
      )}
    </div>
  );
};

