import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminNav from '../../components/admin/AdminNav';

interface KakaoChannel {
  id: string;
  title: string;
  content: string;
  message_type: string;
  template_id?: string;
  button_text?: string;
  button_link?: string;
  recipient_uuids: string[];
  status: string;
  sent_count: number;
  success_count: number;
  fail_count: number;
  sent_at?: string;
  created_at: string;
  calendar_id?: string; // 허브 콘텐츠 ID
}

export default function KakaoChannelList() {
  const [kakaoChannels, setKakaoChannels] = useState<KakaoChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 카카오 채널 목록 조회
  const fetchKakaoChannels = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/kakao');
      const data = await response.json();

      if (data.success) {
        setKakaoChannels(data.data || []);
      } else {
        setError(data.message || '카카오 채널을 불러올 수 없습니다.');
      }
    } catch (err) {
      setError('카카오 채널 조회 중 오류가 발생했습니다.');
      console.error('❌ 카카오 채널 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKakaoChannels();
  }, []);

  // 상태별 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 상태별 텍스트
  const getStatusText = (status: string) => {
    switch (status) {
      case 'sent':
        return '📤 발송됨';
      case 'draft':
        return '📝 초안';
      case 'scheduled':
        return '⏰ 예약됨';
      case 'failed':
        return '❌ 실패';
      default:
        return status;
    }
  };

  // 메시지 타입별 텍스트
  const getMessageTypeText = (messageType: string) => {
    switch (messageType) {
      case 'ALIMTALK':
        return '알림톡';
      case 'FRIENDTALK':
        return '친구톡';
      default:
        return messageType;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>카카오 채널 관리 - 마쓰구골프</title>
        </Head>
        <AdminNav />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-500">카카오 채널을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>카카오 채널 관리 - 마쓰구골프</title>
      </Head>
      <AdminNav />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">카카오 채널 관리</h1>
          <p className="mt-2 text-gray-600">카카오톡 메시지를 관리하고 허브 시스템과 연동합니다.</p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400">❌</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">오류 발생</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* 카카오 채널 목록 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">카카오 채널 목록</h2>
            <p className="mt-1 text-sm text-gray-500">총 {kakaoChannels.length}개의 메시지</p>
          </div>

          {kakaoChannels.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">카카오 채널 메시지가 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      제목
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      타입
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      발송 결과
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      발송일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      허브 연동 ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {kakaoChannels.map((channel) => (
                    <tr key={channel.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {channel.title}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {channel.content.substring(0, 50)}...
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {getMessageTypeText(channel.message_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(channel.status)}`}>
                          {getStatusText(channel.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {channel.status === 'sent' ? (
                          <div className="flex flex-col">
                            <span className="text-green-600">성공: {channel.success_count}</span>
                            {channel.fail_count > 0 && (
                              <span className="text-red-600">실패: {channel.fail_count}</span>
                            )}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {channel.sent_at 
                          ? new Date(channel.sent_at).toLocaleDateString('ko-KR')
                          : '-'
                        }
                      </td>
                      <td className="px-6 py-4">
                        {channel.calendar_id ? (
                          <div className="flex items-center space-x-2">
                            <span 
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 cursor-pointer hover:bg-green-200 transition-colors"
                              title={`허브 ID: ${channel.calendar_id}`}
                              onClick={() => {
                                // 허브 콘텐츠로 이동
                                window.open(`/admin/content-calendar-hub`, '_blank');
                              }}
                            >
                              {channel.calendar_id.substring(0, 8)}...
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            미연결
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            보기
                          </button>
                          <button className="text-indigo-600 hover:text-indigo-900">
                            편집
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
