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
  kakao_group_id?: string; // 카카오 파트너센터 메시지 ID
}

export default function KakaoChannelList() {
  const [kakaoChannels, setKakaoChannels] = useState<KakaoChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'draft' | 'sent' | 'scheduled'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'sent_at' | 'created_at'>('sent_at');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [bulkSyncLoading, setBulkSyncLoading] = useState(false);

  // 카카오 채널 목록 조회
  const fetchKakaoChannels = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('status', filter);
      }
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      
      const response = await fetch(`/api/admin/kakao?${params.toString()}`);
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
  }, [filter, sortBy, sortOrder]);

  // 일괄 동기화 (CSV/JSON 파일 업로드)
  const handleBulkSync = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv,.json';
    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setBulkSyncLoading(true);
      try {
        const text = await file.text();
        let messages: any[] = [];

        if (file.name.endsWith('.json')) {
          messages = JSON.parse(text);
        } else if (file.name.endsWith('.csv')) {
          // CSV 파싱 (간단한 구현)
          const lines = text.split('\n');
          const headers = lines[0].split(',').map(h => h.trim());
          messages = lines.slice(1).filter(line => line.trim()).map(line => {
            const values = line.split(',').map(v => v.trim());
            const obj: any = {};
            headers.forEach((header, i) => {
              obj[header] = values[i] || '';
            });
            return obj;
          });
        }

        const response = await fetch('/api/kakao/bulk-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages })
        });

        const data = await response.json();

        if (data.success) {
          alert(`일괄 동기화 완료!\n성공: ${data.results.success}개\n실패: ${data.results.failed}개`);
          fetchKakaoChannels();
        } else {
          alert(`동기화 실패: ${data.message}`);
        }
      } catch (error: any) {
        alert(`오류 발생: ${error.message}`);
      } finally {
        setBulkSyncLoading(false);
      }
    };
    fileInput.click();
  };

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
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">카카오 채널 관리</h1>
            <p className="mt-2 text-gray-600">카카오톡 메시지를 관리하고 허브 시스템과 연동합니다.</p>
          </div>
          <div className="flex gap-3">
            {selectedIds.length > 0 && (
              <button
                onClick={async () => {
                  if (!confirm(`선택한 ${selectedIds.length}개의 메시지를 삭제하시겠습니까?`)) {
                    return;
                  }
                  try {
                    const deletePromises = selectedIds.map(id =>
                      fetch(`/api/admin/kakao?id=${id}`, { method: 'DELETE' })
                    );
                    await Promise.all(deletePromises);
                    alert('삭제되었습니다.');
                    setSelectedIds([]);
                    fetchKakaoChannels();
                  } catch (error) {
                    console.error('삭제 오류:', error);
                    alert('삭제 중 오류가 발생했습니다.');
                  }
                }}
                className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md shadow-sm text-red-700 bg-white hover:bg-red-50"
              >
                선택 삭제 ({selectedIds.length})
              </button>
            )}
            <button
              onClick={handleBulkSync}
              disabled={bulkSyncLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {bulkSyncLoading ? '동기화 중...' : '📥 일괄 동기화'}
            </button>
            <a
              href="/admin/kakao"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              + 새 메시지 작성
            </a>
          </div>
        </div>

        {/* 필터 탭 */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'all', label: '전체', count: kakaoChannels.length },
              { key: 'draft', label: '초안', count: kakaoChannels.filter(c => c.status === 'draft').length },
              { key: 'sent', label: '발송됨', count: kakaoChannels.filter(c => c.status === 'sent').length },
              { key: 'scheduled', label: '예약됨', count: kakaoChannels.filter(c => c.status === 'scheduled').length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${filter === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
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
                      <input
                        type="checkbox"
                        checked={selectedIds.length === kakaoChannels.length && kakaoChannels.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(kakaoChannels.map(c => c.id));
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
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
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => {
                        if (sortBy === 'sent_at') {
                          setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                        } else {
                          setSortBy('sent_at');
                          setSortOrder('desc');
                        }
                      }}
                    >
                      발송일 {sortBy === 'sent_at' && (sortOrder === 'desc' ? '↓' : '↑')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      생성일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      카카오 메시지 ID
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
                  {kakaoChannels
                    .filter(channel => filter === 'all' || channel.status === filter)
                    .map((channel) => (
                    <tr key={channel.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(channel.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds([...selectedIds, channel.id]);
                            } else {
                              setSelectedIds(selectedIds.filter(id => id !== channel.id));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {channel.id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {channel.title || '(제목 없음 - 기본 텍스트형)'}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {channel.content ? (channel.content.length > 50 ? `${channel.content.substring(0, 50)}...` : channel.content) : '-'}
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
                          ? new Date(channel.sent_at).toLocaleString('ko-KR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '-'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(channel.created_at).toLocaleString('ko-KR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(channel as any).kakao_group_id ? (
                          <div className="flex items-center space-x-2">
                            <span 
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200 transition-colors"
                              title={`카카오 메시지 ID: ${(channel as any).kakao_group_id}`}
                              onClick={() => {
                                window.open(`https://business.kakao.com/_vSVuV/messages/${(channel as any).kakao_group_id}`, '_blank');
                              }}
                            >
                              {(channel as any).kakao_group_id}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            미연동
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {channel.calendar_id ? (
                          <div className="flex items-center space-x-2">
                            <span 
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 cursor-pointer hover:bg-green-200 transition-colors"
                              title={`허브 ID: ${channel.calendar_id}`}
                              onClick={() => {
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
                          <button
                            onClick={() => {
                              // 상세 보기 모달 또는 페이지로 이동
                              const content = `제목: ${channel.title || '(제목 없음)'}\n\n내용:\n${channel.content}\n\n타입: ${getMessageTypeText(channel.message_type)}\n상태: ${getStatusText(channel.status)}\n버튼 링크: ${channel.button_link || '-'}\n버튼 텍스트: ${channel.button_text || '-'}\n카카오 메시지 ID: ${(channel as any).kakao_group_id || '-'}`;
                              alert(content);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            보기
                          </button>
                          <button
                            onClick={() => {
                              // 편집 페이지로 이동
                              window.location.href = `/admin/kakao?id=${channel.id}`;
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            편집
                          </button>
                          {!(channel as any).kakao_group_id && (
                            <button
                              onClick={async () => {
                                const kakaoMessageId = prompt('카카오 파트너센터 메시지 ID를 입력하세요:\n(예: 16147105)');
                                if (!kakaoMessageId) return;

                                try {
                                  const response = await fetch('/api/kakao/manual-sync', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      kakaoMessageId,
                                      channelKakaoId: channel.id,
                                      title: channel.title,
                                      content: channel.content,
                                      status: channel.status,
                                      sentAt: channel.sent_at,
                                      sentCount: channel.sent_count,
                                      successCount: channel.success_count,
                                      failCount: channel.fail_count,
                                      buttonText: channel.button_text,
                                      buttonLink: channel.button_link,
                                    })
                                  });

                                  const data = await response.json();
                                  
                                  if (data.success) {
                                    alert('카카오 파트너센터 메시지와 동기화되었습니다.');
                                    fetchKakaoChannels();
                                  } else {
                                    alert(`동기화 실패: ${data.message}`);
                                  }
                                } catch (error) {
                                  console.error('동기화 오류:', error);
                                  alert('동기화 중 오류가 발생했습니다.');
                                }
                              }}
                              className="text-green-600 hover:text-green-900"
                              title="카카오 파트너센터 메시지와 동기화"
                            >
                              동기화
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              if (!confirm(`정말로 "${channel.title || '이 메시지'}"를 삭제하시겠습니까?`)) {
                                return;
                              }
                              
                              try {
                                const response = await fetch(`/api/admin/kakao?id=${channel.id}`, {
                                  method: 'DELETE'
                                });
                                
                                const data = await response.json();
                                
                                if (data.success) {
                                  alert('삭제되었습니다.');
                                  fetchKakaoChannels();
                                } else {
                                  alert(`삭제 실패: ${data.message}`);
                                }
                              } catch (error) {
                                console.error('삭제 오류:', error);
                                alert('삭제 중 오류가 발생했습니다.');
                              }
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
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
