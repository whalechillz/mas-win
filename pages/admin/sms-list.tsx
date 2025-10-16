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
}

export default function SMSListAdmin() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<SMSMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'sent'>('all');

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
              <button
                onClick={() => router.push('/admin/sms')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                새 메시지 작성
              </button>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        메시지
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        타입
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        수신자
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        생성일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        발송일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        발송 결과
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {messages.map((message) => (
                      <tr key={message.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {message.message_text}
                            </p>
                            <p className="text-xs text-gray-500">
                              {message.message_text.length}자
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getMessageTypeBadge(message.message_type)}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(message.status)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900">
                            {message.recipient_numbers?.length || 0}명
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(message.created_at).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {message.sent_at 
                            ? new Date(message.sent_at).toLocaleDateString('ko-KR')
                            : '-'
                          }
                        </td>
                        <td className="px-6 py-4">
                          {message.status === 'sent' && (
                            <div className="text-xs">
                              <div className="text-green-600">
                                성공: {message.success_count || 0}
                              </div>
                              <div className="text-red-600">
                                실패: {message.fail_count || 0}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(message.id)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              편집
                            </button>
                            <button
                              onClick={() => handleDelete(message.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
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
    </>
  );
}
