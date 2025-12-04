import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  scheduled_at?: string;
  sent_count?: number;
  success_count?: number;
  fail_count?: number;
  calendar_id?: string; // 허브 콘텐츠 ID
  note?: string; // 메모
  solapi_group_id?: string; // 솔라피 그룹 ID
  group_statuses?: Array<{ // ⭐ DB에서 로드한 그룹별 상세 정보
    groupId: string;
    successCount: number;
    failCount: number;
    totalCount: number;
    sendingCount: number;
    lastSyncedAt: string;
  }>;
}

interface GroupStatus {
  groupId: string;
  success: boolean;
  totalCount?: number;
  successCount?: number;
  failCount?: number;
  sendingCount?: number;
  error?: string;
}

export default function SMSListAdmin() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<SMSMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'sent'>('all');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [syncingIds, setSyncingIds] = useState<number[]>([]);
  const [sentAtSort, setSentAtSort] = useState<'desc' | 'asc'>('desc');
  const [scheduledAtSort, setScheduledAtSort] = useState<'asc' | 'desc' | null>(null);
  const [groupStatuses, setGroupStatuses] = useState<Record<number, GroupStatus[]>>({});
  const [loadingGroupStatuses, setLoadingGroupStatuses] = useState<Record<number, boolean>>({});
  const [selectedGroups, setSelectedGroups] = useState<Record<number, string[]>>({});
  const allChecked = messages.length > 0 && selectedIds.length === messages.length;
  
  // 최신 groupStatuses 참조를 위한 ref (클로저 문제 해결)
  const groupStatusesRef = useRef<Record<number, GroupStatus[]>>({});
  
  // groupStatuses가 변경될 때마다 ref 업데이트
  useEffect(() => {
    groupStatusesRef.current = groupStatuses;
  }, [groupStatuses]);

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
        
        // ⭐ DB에서 로드한 group_statuses를 state에 초기화 (우선 표시)
        setGroupStatuses(prev => {
          const updated = { ...prev };
          (data.messages || []).forEach((msg: SMSMessage) => {
            if (msg.group_statuses && msg.group_statuses.length > 0) {
              // DB의 group_statuses를 GroupStatus 형식으로 변환
              updated[msg.id] = msg.group_statuses.map(gs => ({
                groupId: gs.groupId,
                success: true, // DB에 저장된 것은 성공적으로 조회된 것
                successCount: gs.successCount || 0,
                failCount: gs.failCount || 0,
                totalCount: gs.totalCount || 0,
                sendingCount: gs.sendingCount || 0
              }));
            }
          });
          return updated;
        });
        
        // 발송된 메시지들의 그룹 상태 자동 로드 (백그라운드 업데이트)
        const sentMessages = (data.messages || []).filter((m: SMSMessage) => 
          m.status !== 'draft' && m.solapi_group_id
        );
        
        // DB에 저장된 그룹 상태가 최신인지 확인 (lastSyncedAt 기준, 5분 이내면 최신으로 간주)
        const now = new Date();
        const messagesToLoad = sentMessages.filter((msg: SMSMessage) => {
          if (!msg.solapi_group_id) return false;
          
          // DB에 그룹 상태가 있고 최신이면 스킵
          const dbStatuses = msg.group_statuses || [];
          if (dbStatuses.length > 0) {
            const allRecent = dbStatuses.every(gs => {
              if (!gs.lastSyncedAt) return false;
              const syncedAt = new Date(gs.lastSyncedAt);
              const diffMinutes = (now.getTime() - syncedAt.getTime()) / (1000 * 60);
              return diffMinutes < 5; // 5분 이내면 최신
            });
            if (allRecent) return false; // 모두 최신이면 스킵
          }
          
          // 최신 그룹 상태 참조 (ref 사용)
          const existingStatuses = groupStatusesRef.current[msg.id] || [];
          const groupIdArray = msg.solapi_group_id.split(',').map(g => g.trim()).filter(Boolean);
          
          // 모든 그룹 ID에 대한 상태가 있는지 확인
          const allStatusesLoaded = groupIdArray.every(groupId => 
            existingStatuses.some(gs => gs.groupId === groupId && gs.success)
          );
          
          return !allStatusesLoaded; // 로드되지 않은 그룹이 있으면 포함
        });
        
        // 배치 처리: 로드되지 않은 그룹 ID만 수집
        const allGroupIds: string[] = [];
        const messageGroupMap: Record<string, number> = {}; // groupId -> messageId 매핑
        
        messagesToLoad.forEach((msg: SMSMessage) => {
          if (msg.solapi_group_id) {
            const groupIdArray = msg.solapi_group_id.split(',').map(g => g.trim()).filter(Boolean);
            // 최신 그룹 상태 참조 (ref 사용)
            const existingStatuses = groupStatusesRef.current[msg.id] || [];
            
            groupIdArray.forEach(groupId => {
              // 이미 로드된 그룹은 제외
              if (!existingStatuses.some(gs => gs.groupId === groupId && gs.success)) {
                allGroupIds.push(groupId);
                messageGroupMap[groupId] = msg.id;
              }
            });
          }
        });
        
        // 중복 제거
        const uniqueGroupIds = Array.from(new Set(allGroupIds));
        
        // 백그라운드에서 최신 정보 업데이트 (UI 블로킹 없음)
        if (uniqueGroupIds.length > 0) {
          // setTimeout으로 UI 블로킹 방지
          setTimeout(() => {
            fetch('/api/admin/get-group-status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ groupIds: uniqueGroupIds })
            })
            .then(response => response.json())
            .then(statusData => {
              if (statusData.success && statusData.groupStatuses) {
                // 메시지별로 그룹 상태 분류
                const statusesByMessage: Record<number, GroupStatus[]> = {};
                
                statusData.groupStatuses.forEach((status: GroupStatus) => {
                  const messageId = messageGroupMap[status.groupId];
                  if (messageId) {
                    if (!statusesByMessage[messageId]) {
                      statusesByMessage[messageId] = [];
                    }
                    statusesByMessage[messageId].push(status);
                  }
                });
                
                // 상태 업데이트 (병합) - DB 값은 이미 표시되고 있으므로 업데이트만
                setGroupStatuses(prev => {
                  const updated = { ...prev };
                  Object.keys(statusesByMessage).forEach(msgId => {
                    const messageId = parseInt(msgId);
                    const existing = prev[messageId] || [];
                    const newStatuses = statusesByMessage[messageId] || [];
                    
                    // 기존 상태와 새 상태를 병합
                    const merged = [...existing];
                    newStatuses.forEach((newStatus: GroupStatus) => {
                      const existingIndex = merged.findIndex(gs => gs.groupId === newStatus.groupId);
                      if (existingIndex >= 0) {
                        merged[existingIndex] = newStatus; // 업데이트
                      } else {
                        merged.push(newStatus); // 추가
                      }
                    });
                    
                    updated[messageId] = merged;
                  });
                  return updated;
                });
              }
            })
            .catch(error => {
              console.error('그룹 상태 일괄 조회 오류:', error);
              // 실패해도 DB 값은 이미 표시되고 있으므로 문제없음
            });
          }, 100); // 100ms 지연으로 UI 블로킹 방지
        }
      }
    } catch (error) {
      console.error('SMS 목록 조회 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 그룹 ID별 발송 결과 조회 (중복 호출 방지)
  const loadGroupStatuses = async (messageId: number, groupIds: string) => {
    if (!groupIds) return;
    
    // 이미 로딩 중이면 스킵 (중복 호출 방지)
    if (loadingGroupStatuses[messageId]) {
      console.log(`⏭️ 메시지 ${messageId}의 그룹 상태는 이미 로딩 중입니다.`);
      return;
    }
    
    setLoadingGroupStatuses(prev => ({ ...prev, [messageId]: true }));
    
    try {
      const groupIdArray = groupIds.split(',').map(g => g.trim()).filter(Boolean);
      const response = await fetch('/api/admin/get-group-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupIds: groupIdArray })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.groupStatuses) {
          // 상태 업데이트 시 이전 상태와 병합 (덮어쓰기 방지)
          setGroupStatuses(prev => {
            const existing = prev[messageId] || [];
            const newStatuses = data.groupStatuses || [];
            
            // 기존 상태와 새 상태를 병합 (groupId 기준)
            const merged = [...existing];
            newStatuses.forEach((newStatus: GroupStatus) => {
              const existingIndex = merged.findIndex(gs => gs.groupId === newStatus.groupId);
              if (existingIndex >= 0) {
                merged[existingIndex] = newStatus; // 업데이트
              } else {
                merged.push(newStatus); // 추가
              }
            });
            
            return { ...prev, [messageId]: merged };
          });
        }
      }
    } catch (error) {
      console.error('그룹 상태 조회 오류:', error);
    } finally {
      setLoadingGroupStatuses(prev => ({ ...prev, [messageId]: false }));
    }
  };

  // 발송 결과 표시 컴포넌트 (DB 값 우선 표시)
  const renderSendResult = (message: SMSMessage) => {
    const groupStatusList = groupStatuses[message.id] || [];
    const groupIdArray = message.solapi_group_id?.split(',').map(g => g.trim()).filter(Boolean) || [];
    
    // 그룹별 상세가 모두 로드되었는지 확인
    const allGroupsLoaded = groupIdArray.length > 0 && 
      groupIdArray.every(groupId => 
        groupStatusList.some(gs => gs.groupId === groupId && gs.success)
      );
    
    // 그룹별 상세가 모두 로드되었으면 그룹별 합계 사용 (더 정확함)
    if (allGroupsLoaded && groupStatusList.length > 0) {
      const totalGroupSuccess = groupStatusList.reduce((sum, gs) => sum + (gs.successCount || 0), 0);
      const totalGroupFail = groupStatusList.reduce((sum, gs) => sum + (gs.failCount || 0), 0);
      const totalGroupCount = groupStatusList.reduce((sum, gs) => sum + (gs.totalCount || 0), 0);
      
      return (
        <div className="text-xs">
          <span className="text-green-600 font-medium">성공 {totalGroupSuccess}</span>
          <span className="text-gray-400 mx-1">/</span>
          <span className="text-red-600 font-medium">실패 {totalGroupFail}</span>
          {totalGroupCount > 0 && (
            <>
              <span className="text-gray-400 mx-1">/</span>
              <span className="text-gray-500">총 {totalGroupCount}건</span>
            </>
          )}
        </div>
      );
    }
    
    // 그룹별 상세가 아직 로드되지 않았으면 DB 값 사용 (항상 표시됨)
    return (
      <div className="text-xs">
        <span className="text-green-600 font-medium">성공 {message.success_count || 0}</span>
        <span className="text-gray-400 mx-1">/</span>
        <span className="text-red-600 font-medium">실패 {message.fail_count || 0}</span>
        {message.sent_count && (
          <>
            <span className="text-gray-400 mx-1">/</span>
            <span className="text-gray-500">총 {message.sent_count}건</span>
          </>
        )}
      </div>
    );
  };

  // 그룹 선택 토글
  const handleToggleGroup = (messageId: number, groupId: string) => {
    setSelectedGroups(prev => {
      const current = prev[messageId] || [];
      if (current.includes(groupId)) {
        return { ...prev, [messageId]: current.filter(g => g !== groupId) };
      } else {
        return { ...prev, [messageId]: [...current, groupId] };
      }
    });
  };

  // 실패한 청크를 새 메시지로 분리
  const handleSplitFailedChunks = async (messageId: number) => {
    const selected = selectedGroups[messageId] || [];
    if (selected.length === 0) {
      alert('분리할 그룹을 선택해주세요.');
      return;
    }

    if (!confirm(`선택한 ${selected.length}개 그룹의 실패한 수신자로 새 메시지를 생성하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/split-failed-chunks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          groupIds: selected
        })
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ 새 메시지가 생성되었습니다!\n\n` +
          `메시지 ID: ${result.newMessageId}\n` +
          `수신자: ${result.recipientCount}명\n\n` +
          `SMS 편집 페이지에서 확인하세요.`);
        
        // 선택 초기화
        setSelectedGroups(prev => ({ ...prev, [messageId]: [] }));
        
        // 목록 새로고침
        fetchMessages();
        
        // 새 메시지 편집 페이지로 이동
        if (result.newMessageId) {
          router.push(`/admin/sms?id=${result.newMessageId}`);
        }
      } else {
        throw new Error(result.message || '분리 실패');
      }
    } catch (error: any) {
      console.error('실패 청크 분리 오류:', error);
      alert('실패 청크 분리 중 오류가 발생했습니다: ' + error.message);
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

  // 모든 그룹 ID를 순차적으로 동기화하는 함수
  const handleSyncAllGroups = async (messageId: number, groupIds: string) => {
    if (!groupIds) {
      alert('솔라피 그룹 ID가 없습니다.');
      return;
    }
    
    const groupIdArray = groupIds.split(',').map(g => g.trim()).filter(Boolean);
    
    if (groupIdArray.length === 0) {
      alert('솔라피 그룹 ID가 없습니다.');
      return;
    }
    
    const currentMessage = messages.find(m => m.id === messageId);
    
    if (!confirm(`모든 그룹(${groupIdArray.length}개)의 상태를 동기화하시겠습니까?\n\n메시지 ID: ${messageId}\n수신자: ${currentMessage?.recipient_numbers?.length || 0}명`)) {
      return;
    }
    
    setSyncingIds(prev => [...prev, messageId]);
    
    try {
      let totalSuccess = 0;
      let totalFail = 0;
      let totalSending = 0;
      let totalCount = 0;
      
      // 모든 그룹 ID를 순차적으로 동기화
      // ⚠️ 주의: 여러 그룹이 있을 때 각 그룹의 totalCount를 합산하면 중복 집계가 발생할 수 있습니다.
      //          실제 수신자 수를 기준으로 집계하거나, 그룹별로 고유한 수신자만 집계해야 합니다.
      const uniquePhones = new Set<string>();
      const phoneStatusMap = new Map<string, { success: boolean; fail: boolean; sending: boolean }>();
      
      for (let i = 0; i < groupIdArray.length; i++) {
        const groupId = groupIdArray[i];
        console.log(`🔄 그룹 ${i + 1}/${groupIdArray.length} 동기화 중: ${groupId}`);
        
        const response = await fetch('/api/admin/sync-solapi-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageId,
            groupId
          })
        });
        
        const result = await response.json();
        
        if (result.success && result.data) {
          // ⭐ 그룹별 totalCount를 합산하지 않고, 실제 수신자 수를 기준으로 집계
          //    첫 번째 그룹의 totalCount만 사용하거나, 수신자 수를 직접 사용
          if (i === 0) {
            // 첫 번째 그룹의 totalCount를 기준으로 사용
            totalCount = result.data.totalCount || 0;
          }
          // 성공/실패/발송중은 합산 (같은 수신자라도 여러 그룹에서 다른 상태일 수 있음)
          totalSuccess += result.data.successCount || 0;
          totalFail += result.data.failCount || 0;
          totalSending += result.data.sendingCount || 0;
        }
      }
      
      // ⭐ 실제 수신자 수를 기준으로 totalCount 재계산 (중복 제거)
      //    여러 그룹이 있어도 실제 수신자는 한 번만 집계
      if (currentMessage?.recipient_numbers?.length) {
        const actualRecipientCount = currentMessage.recipient_numbers.length;
        // totalCount가 수신자 수의 2배 이상이면 수신자 수로 재설정
        if (totalCount > actualRecipientCount * 1.5) {
          console.warn(`⚠️ totalCount(${totalCount})가 수신자 수(${actualRecipientCount})의 1.5배를 초과합니다. 수신자 수로 재설정합니다.`);
          totalCount = actualRecipientCount;
        }
      }
      
      alert(`✅ 전체 동기화 완료!\n\n` +
        `메시지 ID: ${messageId}\n` +
        `총 그룹 수: ${groupIdArray.length}개\n` +
        `총 발송: ${totalCount}건\n` +
        `성공: ${totalSuccess}건\n` +
        `실패: ${totalFail}건\n` +
        (totalSending > 0 ? `발송중: ${totalSending}건\n` : ''));
      
      fetchMessages();
    } catch (error) {
      console.error('전체 동기화 오류:', error);
      alert('동기화 중 오류가 발생했습니다.');
    } finally {
      setSyncingIds(prev => prev.filter(id => id !== messageId));
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
      case 'partial':
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">부분 발송</span>;
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

  // 발송일 포맷팅 함수
  const formatSentDate = (sentAt?: string) => {
    if (!sentAt) return '-';
    try {
      const date = new Date(sentAt);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hour = date.getHours();
      const minute = String(date.getMinutes()).padStart(2, '0');
      const ampm = hour < 12 ? 'AM' : 'PM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      
      return `${year}. ${month}. ${day}. ${ampm} ${displayHour}:${minute}`;
    } catch {
      return '-';
    }
  };

  // 한국 시간대 상수 (UTC+9)
  const KST_OFFSET_MS = 9 * 60 * 60 * 1000; // 9시간을 밀리초로

  const formatScheduledDate = (value?: string) => {
    if (!value) return '-';
    try {
      // UTC 문자열을 한국 시간(KST, UTC+9)으로 명시적으로 변환
      const utcDate = new Date(value);
      if (Number.isNaN(utcDate.getTime())) return '-';
      // UTC에 9시간을 더해서 한국 시간으로 변환
      const kstDate = new Date(utcDate.getTime() + KST_OFFSET_MS);
      const month = String(kstDate.getMonth() + 1).padStart(2, '0');
      const day = String(kstDate.getDate()).padStart(2, '0');
      const hours = String(kstDate.getHours()).padStart(2, '0');
      const minutes = String(kstDate.getMinutes()).padStart(2, '0');
      const seconds = String(kstDate.getSeconds()).padStart(2, '0');
      return `${month}/${day} ${hours}:${minutes}:${seconds}`;
    } catch {
      return '-';
    }
  };

  const getRelativeScheduleLabel = (value?: string) => {
    if (!value) return '';
    try {
      // UTC 문자열을 파싱 (UTC 밀리초)
      const utcDate = new Date(value);
      if (Number.isNaN(utcDate.getTime())) return '';
      // UTC 기준으로 시간 차이 계산 (둘 다 UTC이므로 정확함)
      const diffMs = utcDate.getTime() - Date.now();
      const suffix = diffMs >= 0 ? '후' : '전';
      const absSec = Math.round(Math.abs(diffMs) / 1000);
      if (absSec < 60) return `(${absSec}초 ${suffix})`;
      const absMin = Math.round(absSec / 60);
      if (absMin < 60) return `(${absMin}분 ${suffix})`;
      const absHour = Math.round(absMin / 60);
      if (absHour < 24) return `(${absHour}시간 ${suffix})`;
      const absDay = Math.round(absHour / 24);
      if (absDay < 7) return `(${absDay}일 ${suffix})`;
      const absWeek = Math.round(absDay / 7);
      return `(${absWeek}주 ${suffix})`;
    } catch {
      return '';
    }
  };

  const sortedMessages = useMemo(() => {
    if (!messages) return [];
    return [...messages].sort((a, b) => {
      // 예약일 정렬이 활성화된 경우
      if (scheduledAtSort) {
        const aScheduled = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
        const bScheduled = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
        if (aScheduled !== bScheduled) {
          return scheduledAtSort === 'desc' ? bScheduled - aScheduled : aScheduled - bScheduled;
        }
      }
      // 발송일 정렬
      const aDate = new Date(a.sent_at || a.created_at).getTime();
      const bDate = new Date(b.sent_at || b.created_at).getTime();
      return sentAtSort === 'desc' ? bDate - aDate : aDate - bDate;
    });
  }, [messages, sentAtSort, scheduledAtSort]);

  const toggleSentAtSort = () => {
    setSentAtSort((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    setScheduledAtSort(null); // 예약일 정렬 해제
  };

  const toggleScheduledAtSort = () => {
    setScheduledAtSort((prev) => {
      if (prev === null) return 'desc';
      if (prev === 'desc') return 'asc';
      return null;
    });
    setSentAtSort('desc'); // 발송일 정렬 기본값으로
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
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-16 whitespace-nowrap">
                        ID
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20 whitespace-nowrap">
                        상태
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                        타입
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20 whitespace-nowrap">
                        수신자
                      </th>
                      <th
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24 cursor-pointer select-none whitespace-nowrap"
                        onClick={toggleSentAtSort}
                      >
                        발송일 {sentAtSort === 'desc' ? '▼' : '▲'}
                      </th>
                      <th
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28 cursor-pointer select-none whitespace-nowrap"
                        onClick={toggleScheduledAtSort}
                      >
                        예약일 {scheduledAtSort === 'desc' ? '▼' : scheduledAtSort === 'asc' ? '▲' : ''}
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
                    {sortedMessages.map((message) => (
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
                        <td className="px-3 py-2 text-right whitespace-nowrap">
                          <span className="text-xs font-mono text-gray-600">
                            {message.id}
                          </span>
                        </td>
                        
                        {/* 상태 */}
                        <td className="px-3 py-2 whitespace-nowrap">
                          {getStatusBadge(message.status)}
                        </td>
                        
                        {/* 타입 */}
                        <td className="px-3 py-2">
                          {getMessageTypeBadge(message.message_type)}
                        </td>
                        
                        {/* 수신자 */}
                        <td className="px-3 py-2 text-right whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900">
                            {message.recipient_numbers?.length || 0}명
                          </span>
                        </td>
                        
                        {/* 발송일 */}
                        <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">
                          {formatSentDate(message.sent_at)}
                        </td>

                        {/* 예약일 */}
                        <td className="px-3 py-2 text-xs whitespace-nowrap" data-testid="scheduled-time">
                          {message.scheduled_at ? (
                            <div
                              className={`font-semibold ${
                                new Date(message.scheduled_at).getTime() > Date.now()
                                  ? 'text-blue-600'
                                  : 'text-gray-600'
                              }`}
                            >
                              {formatScheduledDate(message.scheduled_at)}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        
                        {/* 솔라피 그룹 ID (여러 개 지원) + 그룹별 발송 결과 */}
                        <td className="px-3 py-2 whitespace-nowrap">
                          {message.solapi_group_id ? (
                            <div className="flex flex-col gap-1">
                              {message.solapi_group_id.includes(',') ? (
                                // 여러 그룹 ID가 있는 경우
                                <>
                                  {message.solapi_group_id.split(',').map((groupId, idx) => {
                                    const trimmedGroupId = groupId.trim();
                                    const groupStatus = groupStatuses[message.id]?.find(gs => gs.groupId === trimmedGroupId);
                                    const isSelected = (selectedGroups[message.id] || []).includes(trimmedGroupId);
                                    const isLoading = loadingGroupStatuses[message.id];
                                    
                                    return (
                                      <div key={idx} className="flex items-center gap-1">
                                        {/* 체크박스 */}
                                        {message.status !== 'draft' && (
                                          <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleToggleGroup(message.id, trimmedGroupId)}
                                            className="w-3 h-3 text-blue-600 rounded focus:ring-blue-500"
                                            title="실패 청크 분리용 선택"
                                          />
                                        )}
                                        
                                        {/* 그룹 ID */}
                                        <span 
                                          className="text-xs font-mono text-blue-600 cursor-pointer hover:text-blue-800 hover:underline truncate max-w-[100px]"
                                          title={`솔라피 그룹 ID ${idx + 1}: ${trimmedGroupId}\n클릭하여 솔라피 콘솔에서 확인`}
                                          onClick={() => {
                                            window.open(`https://console.solapi.com/message-log?criteria=groupId&value=${trimmedGroupId}&cond=eq`, '_blank');
                                          }}
                                        >
                                          {idx + 1}. {trimmedGroupId.length > 10 
                                            ? `${trimmedGroupId.substring(0, 10)}...`
                                            : trimmedGroupId
                                          }
                                        </span>
                                        
                                        {/* 그룹별 발송 결과 */}
                                        {groupStatus && groupStatus.success ? (
                                          <div className="text-xs ml-1">
                                            <span className="text-green-600">{groupStatus.successCount || 0}</span>
                                            <span className="text-gray-400 mx-0.5">/</span>
                                            <span className="text-red-600">{groupStatus.failCount || 0}</span>
                                            <span className="text-gray-400 mx-0.5">/</span>
                                            <span className="text-gray-500">{groupStatus.totalCount || 0}</span>
                                          </div>
                                        ) : isLoading ? (
                                          <span className="text-xs text-gray-400 ml-1">로딩...</span>
                                        ) : (
                                          <span className="text-xs text-gray-400 ml-1">-</span>
                                        )}
                                        
                                        {/* 동기화 버튼 */}
                                        {message.status !== 'draft' && (
                                          <button
                                            onClick={() => {
                                              handleSyncSolapi(message.id, trimmedGroupId);
                                              // 동기화 후 그룹 상태 다시 로드 (중복 방지)
                                              if (!loadingGroupStatuses[message.id]) {
                                                setTimeout(() => {
                                                  loadGroupStatuses(message.id, message.solapi_group_id!);
                                                }, 1000);
                                              }
                                            }}
                                            disabled={syncingIds.includes(message.id)}
                                            className="text-xs text-green-600 hover:text-green-800 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                            title={`그룹 ${idx + 1} 동기화`}
                                          >
                                            {syncingIds.includes(message.id) ? '동기화 중...' : '🔄'}
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                  
                                  {/* 전체 동기화 및 실패 청크 분리 버튼 */}
                                  {message.status !== 'draft' && (
                                    <div className="flex flex-col gap-1 mt-1">
                                      <button
                                        onClick={() => {
                                          handleSyncAllGroups(message.id, message.solapi_group_id!);
                                          // 동기화 후 그룹 상태 다시 로드 (중복 방지)
                                          if (!loadingGroupStatuses[message.id]) {
                                            setTimeout(() => {
                                              loadGroupStatuses(message.id, message.solapi_group_id!);
                                            }, 2000);
                                          }
                                        }}
                                        disabled={syncingIds.includes(message.id)}
                                        className="text-xs text-purple-600 hover:text-purple-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="모든 그룹 동기화"
                                      >
                                        {syncingIds.includes(message.id) ? '전체 동기화 중...' : '🔄 전체'}
                                      </button>
                                      
                                      {(selectedGroups[message.id] || []).length > 0 && (
                                        <button
                                          onClick={() => handleSplitFailedChunks(message.id)}
                                          className="text-xs text-orange-600 hover:text-orange-800 bg-orange-50 px-2 py-1 rounded"
                                          title="선택한 그룹의 실패 청크를 새 메시지로 분리"
                                        >
                                          📤 실패 청크 분리 ({selectedGroups[message.id].length}개)
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </>
                              ) : (
                                // 단일 그룹 ID인 경우 (기존 로직)
                                <div className="flex items-center gap-2">
                                  <span 
                                    className="text-xs font-mono text-blue-600 cursor-pointer hover:text-blue-800 hover:underline truncate max-w-[120px]"
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
                                      onClick={() => {
                                        handleSyncSolapi(message.id, message.solapi_group_id!);
                                        // 동기화 후 그룹 상태 다시 로드 (중복 방지)
                                        if (!loadingGroupStatuses[message.id]) {
                                          setTimeout(() => {
                                            loadGroupStatuses(message.id, message.solapi_group_id!);
                                          }, 1000);
                                        }
                                      }}
                                      disabled={syncingIds.includes(message.id)}
                                      className="text-xs text-green-600 hover:text-green-800 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                      title="솔라피에서 최신 발송 상태 동기화"
                                    >
                                      {syncingIds.includes(message.id) ? '동기화 중...' : '🔄'}
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        
                        {/* 발송 결과 (전체 집계 또는 그룹별 합산) */}
                        <td className="px-3 py-2 whitespace-nowrap">
                          {message.status !== 'draft' ? renderSendResult(message) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        
                        {/* 메시지 (축약, 문자수 제거) */}
                        <td className="px-3 py-2">
                          <div className="max-w-[200px]">
                            <p 
                              className="text-xs text-gray-900 truncate whitespace-nowrap" 
                              title={message.message_text}
                            >
                              {message.message_text}
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
