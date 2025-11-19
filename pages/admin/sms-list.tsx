import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminNav from '../../components/admin/AdminNav';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

interface SMSMessage {
  id: number;
  message_type: string;
  message_text: string;
  short_link?: string;
  image_url?: string;
  recipient_numbers: string[];
  status: string;
  created_at: string;
  sent_at?: string;
  sent_count?: number;
  success_count?: number;
  fail_count?: number;
  calendar_id?: string; // 허브 콘텐츠 ID
  note?: string; // 메모
  solapi_group_id?: string; // 솔라피 그룹 ID
}

export default function SMSListAdmin() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<SMSMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'sent'>('all');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [syncingIds, setSyncingIds] = useState<number[]>([]);
  const allChecked = messages.length > 0 && selectedIds.length === messages.length;

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/admin/login');
      return;
    }
    fetchMessages();
  }, [session, status, router, filter]);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/channels/sms/list?status=${filter}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('SMS 목록 조회 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (messageId: number) => {
    router.push(`/admin/sms?id=${messageId}`);
  };

  const handleDelete = async (messageId: number) => {
    if (!confirm('정말로 삭제하시겠습니까?')) return;
    
    try {
      const response = await fetch(`/api/channels/sms/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: messageId })
      });
      
      if (response.ok) {
        alert('삭제되었습니다.');
        fetchMessages();
      } else {
        alert('삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleToggleAll = () => {
    if (allChecked) setSelectedIds([]);
    else setSelectedIds(messages.map(m => m.id));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return alert('선택된 항목이 없습니다.');
    if (!confirm(`선택한 ${selectedIds.length}건을 삭제(보관)하시겠습니까?`)) return;
    try {
      const resp = await fetch('/api/channels/sms/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      });
      const json = await resp.json();
      if (!resp.ok || !json.success) throw new Error(json.message || '삭제 실패');
      alert(json.message || '삭제되었습니다.');
      setSelectedIds([]);
      fetchMessages();
    } catch (e:any) {
      console.error('일괄 삭제 오류:', e);
      alert(`일괄 삭제 중 오류: ${e.message}`);
    }
  };

  const handleSyncSolapi = async (messageId: number, groupId: string) => {
    if (!groupId) {
      alert('솔라피 그룹 ID가 없습니다.');
      return;
    }

    // 디버깅: 현재 메시지 정보 확인
    const currentMessage = messages.find(m => m.id === messageId);
    console.log('🔄 동기화 시작:', {
      messageId,
      groupId,
      messageRecipients: currentMessage?.recipient_numbers?.length || 0,
      messageStatus: currentMessage?.status,
      messageSolapiGroupId: currentMessage?.solapi_group_id
    });

    if (!confirm(`솔라피에서 최신 발송 상태를 동기화하시겠습니까?\n\n메시지 ID: ${messageId}\n그룹 ID: ${groupId}\n수신자: ${currentMessage?.recipient_numbers?.length || 0}명`)) {
      return;
    }

    setSyncingIds(prev => [...prev, messageId]);
    
    try {
      const response = await fetch('/api/admin/sync-solapi-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          groupId
        })
      });

      const result = await response.json();

      if (result.success) {
        const { successCount, failCount, sendingCount, status, totalCount, recipientCount, mismatch } = result.data;
        
        // 수신자 수와 솔라피 결과 비교
        if (mismatch) {
          console.warn(`⚠️ 수신자 수 불일치: DB=${recipientCount}명, 솔라피=${totalCount}건`);
        }
        
        let alertMessage = `솔라피 동기화 완료!\n\n` +
          `메시지 ID: ${messageId}\n` +
          `그룹 ID: ${groupId}\n` +
          `상태: ${status === 'sent' ? '발송됨' : status === 'partial' ? '부분 성공' : '실패'}\n` +
          `총 발송: ${totalCount}건\n` +
          `성공: ${successCount}건\n` +
          `실패: ${failCount}건\n` +
          (sendingCount > 0 ? `발송중: ${sendingCount}건\n` : '');
        
        if (mismatch) {
          alertMessage += `\n⚠️ 주의: 수신자 수와 불일치 (DB: ${recipientCount}명, 솔라피: ${totalCount}건)\n` +
            `다른 메시지의 그룹 ID를 조회했을 수 있습니다.`;
        }
        
        alert(alertMessage);
        // 목록 새로고침
        fetchMessages();
      } else {
        throw new Error(result.message || '동기화 실패');
      }
    } catch (error: any) {
      console.error('솔라피 동기화 오류:', error);
      alert('솔라피 동기화 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setSyncingIds(prev => prev.filter(id => id !== messageId));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">초안</span>;
      case 'sent':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">발송됨</span>;
      case 'failed':
        return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">실패</span>;
      default:
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">{status}</span>;
    }
  };

  const getMessageTypeBadge = (messageType: string) => {
    switch (messageType) {
      case 'SMS':
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">SMS</span>;
      case 'LMS':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">LMS</span>;
      case 'MMS':
        return <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">MMS</span>;
      default:
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">{messageType}</span>;
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <Head>
        <title>SMS/MMS 관리 - 관리자</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">SMS/MMS 관리</h1>
                <p className="mt-2 text-gray-600">저장된 SMS/MMS 메시지를 관리하세요</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                onClick={() => router.push('/admin/sms')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                새 메시지 작성
              </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-red-50 text-red-700 rounded-lg border border-red-200 hover:bg-red-100 disabled:opacity-50"
                  disabled={selectedIds.length === 0}
                >
                  선택 삭제
                </button>
              </div>
            </div>
          </div>

          {/* 필터 */}
          <div className="mb-6">
            <div className="flex space-x-4">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg ${
                  filter === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                전체 ({messages.length})
              </button>
              <button
                onClick={() => setFilter('draft')}
                className={`px-4 py-2 rounded-lg ${
                  filter === 'draft' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                초안
              </button>
              <button
                onClick={() => setFilter('sent')}
                className={`px-4 py-2 rounded-lg ${
                  filter === 'sent' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                발송됨
              </button>
            </div>
          </div>

          {/* 메시지 목록 */}
          <div className="bg-white shadow rounded-lg">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📱</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">저장된 메시지가 없습니다</h3>
                <p className="text-gray-500 mb-4">새로운 SMS/MMS 메시지를 작성해보세요.</p>
                <button
                  onClick={() => router.push('/admin/sms')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  새 메시지 작성
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 w-12">
                        <input type="checkbox" checked={allChecked} onChange={handleToggleAll} />
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                        ID
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                        상태
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                        타입
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                        수신자
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                        발송일
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                        솔라피 그룹 ID
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                        발송 결과
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                        메시지
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                        메모
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {messages.map((message) => (
                      <tr key={message.id} className="hover:bg-gray-50">
                        {/* 체크박스 */}
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(message.id)}
                            onChange={() => handleToggleSelect(message.id)}
                          />
                        </td>
                        
                        {/* ID */}
                        <td className="px-3 py-2">
                          <span className="text-xs font-mono text-gray-600 font-semibold">
                            #{message.id}
                          </span>
                        </td>
                        
                        {/* 상태 */}
                        <td className="px-3 py-2">
                          {getStatusBadge(message.status)}
                        </td>
                        
                        {/* 타입 */}
                        <td className="px-3 py-2">
                          {getMessageTypeBadge(message.message_type)}
                        </td>
                        
                        {/* 수신자 */}
                        <td className="px-3 py-2">
                          <span className="text-sm font-semibold text-gray-900">
                            {message.recipient_numbers?.length || 0}명
                          </span>
                        </td>
                        
                        {/* 발송일 (간소화) */}
                        <td className="px-3 py-2 text-xs text-gray-500">
                          {message.sent_at 
                            ? (() => {
                                const sentDate = new Date(message.sent_at);
                                const now = new Date();
                                const diffDays = Math.floor((now.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24));
                                if (diffDays === 0) return '오늘';
                                if (diffDays === 1) return '어제';
                                if (diffDays < 7) return `${diffDays}일 전`;
                                return `${sentDate.getMonth() + 1}/${sentDate.getDate()}`;
                              })()
                            : '-'
                          }
                        </td>
                        
                        {/* 솔라피 그룹 ID (간소화) */}
                        <td className="px-3 py-2">
                          {message.solapi_group_id ? (
                            <div className="flex flex-col gap-0.5">
                              <span 
                                className="text-xs font-mono text-blue-600 cursor-pointer hover:text-blue-800 hover:underline truncate"
                                title={`솔라피 그룹 ID: ${message.solapi_group_id}\n클릭하여 솔라피 콘솔에서 확인`}
                                onClick={() => {
                                  window.open(`https://console.solapi.com/message-log?criteria=groupId&value=${message.solapi_group_id}&cond=eq`, '_blank');
                                }}
                              >
                                {message.solapi_group_id.length > 15 
                                  ? `${message.solapi_group_id.substring(0, 15)}...`
                                  : message.solapi_group_id
                                }
                              </span>
                              {message.status !== 'draft' && (
                                <button
                                  onClick={() => handleSyncSolapi(message.id, message.solapi_group_id!)}
                                  disabled={syncingIds.includes(message.id)}
                                  className="text-xs text-green-600 hover:text-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="솔라피에서 최신 발송 상태 동기화"
                                >
                                  {syncingIds.includes(message.id) ? '동기화 중...' : '🔄'}
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        
                        {/* 발송 결과 (간소화) */}
                        <td className="px-3 py-2">
                          {message.status !== 'draft' ? (
                            <div className="text-xs space-y-0.5">
                              <div className="flex items-center gap-1">
                                <span className="text-green-600">✅</span>
                                <span>{message.success_count || 0}</span>
                                <span className="text-red-600 ml-1">❌</span>
                                <span>{message.fail_count || 0}</span>
                              </div>
                              {message.sent_count && (
                                <div className="text-gray-500">
                                  📊 {message.sent_count}건
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        
                        {/* 메시지 (축약) */}
                        <td className="px-3 py-2">
                          <div className="max-w-[200px]">
                            <p 
                              className="text-xs text-gray-900 truncate" 
                              title={message.message_text}
                            >
                              {message.message_text}
                            </p>
                            <p className="text-xs text-gray-400">
                              {message.message_text.length}자
                            </p>
                          </div>
                        </td>
                        
                        {/* 메모 (축약) */}
                        <td className="px-3 py-2">
                          {message.note ? (
                            <p 
                              className="text-xs text-gray-700 truncate max-w-[200px]" 
                              title={message.note}
                            >
                              {message.note}
                            </p>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        
                        {/* 작업 */}
                        <td className="px-3 py-2">
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleEdit(message.id)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                              title="편집"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(message.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                              title="삭제"
                            >
                              🗑️
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
    </>
  );
}
