import React, { useState, useMemo } from 'react';
import { formatPhoneNumber } from '../../../lib/formatters';

interface Contact {
  id: string;
  name: string;
  phone: string;
  call_times?: string;
  contacted?: boolean;
  created_at: string;
  notes?: string;  // memo -> notes로 변경
  campaign_source?: string;
  quiz_result_id?: string;
  // 이미 contacts 테이블에 있는 필드들
  swing_style?: string;
  priority?: string;
  current_distance?: string;
  recommended_flex?: string;
  expected_distance?: string;
  recommended_club?: string; // 추가 예정
}

interface ContactManagementProps {
  contacts: Contact[];
  supabase: any;
  onUpdate: () => void;
}

// 검색 아이콘으로 변경
const Search = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const MessageSquare = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const Phone = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const Clock = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Tag = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const Info = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Download = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

export function ContactManagement({ contacts, supabase, onUpdate }: ContactManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMemo, setEditMemo] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [detailsPosition, setDetailsPosition] = useState<{ [key: string]: 'top' | 'bottom' }>({});

  // 스크롤바 스타일
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #F3E8FF;
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #D8B4FE;
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #C084FC;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // 디버깅을 위한 로그 추가
  React.useEffect(() => {
    console.log('ContactManagement: 받은 contacts 데이터:', contacts);
    console.log('Contacts 배열 길이:', contacts ? contacts.length : 0);
    if (contacts && contacts.length > 0) {
      console.log('첫 번째 contact:', contacts[0]);
    }
  }, [contacts]);

  // 필터링된 문의 목록
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      // 검색어 필터 - 대소문자 구분 없이, 전화번호는 숫자만 비교
      if (searchTerm && searchTerm.trim() !== '') {
        const searchLower = searchTerm.toLowerCase().trim();
        const phoneDigits = contact.phone ? contact.phone.replace(/\D/g, '') : '';
        const searchDigits = searchTerm.replace(/\D/g, '');
        
        const nameMatch = contact.name ? contact.name.toLowerCase().includes(searchLower) : false;
        const phoneMatch = searchDigits.length > 0 ? phoneDigits.includes(searchDigits) : false;
        
        if (!nameMatch && !phoneMatch) {
          return false;
        }
      }

      // 상태 필터
      if (statusFilter === 'contacted' && !contact.contacted) return false;
      if (statusFilter === 'pending' && contact.contacted) return false;

      // 통화 시간 필터
      if (timeFilter !== 'all' && contact.call_times !== timeFilter) {
        return false;
      }

      return true;
    });
  }, [contacts, searchTerm, statusFilter, timeFilter]);

  // 상태 업데이트
  const updateContactStatus = async (id: string, contacted: boolean) => {
    const { error } = await supabase
      .from('contacts')
      .update({ contacted })
      .eq('id', id);

    if (!error) {
      onUpdate();
    }
  };

  // 메모 저장
  const saveMemo = async (id: string) => {
    const { error } = await supabase
      .from('contacts')
      .update({ notes: editMemo })  // memo -> notes
      .eq('id', id);

    if (!error) {
      setEditingId(null);
      setEditMemo('');
      onUpdate();
    }
  };

  // 일괄 작업
  const handleBulkAction = async (action: string) => {
    if (selectedContacts.length === 0) return;

    switch (action) {
      case 'contacted':
        for (const id of selectedContacts) {
          await updateContactStatus(id, true);
        }
        setSelectedContacts([]);
        break;
      case 'pending':
        for (const id of selectedContacts) {
          await updateContactStatus(id, false);
        }
        setSelectedContacts([]);
        break;
      case 'delete':
        if (confirm('선택한 문의를 삭제하시겠습니까?')) {
          const { error } = await supabase
            .from('contacts')
            .delete()
            .in('id', selectedContacts);
          
          if (!error) {
            setSelectedContacts([]);
            onUpdate();
          }
        }
        break;
    }
  };

  // 엑셀 다운로드
  const downloadExcel = () => {
    const csvContent = [
      ['고객명', '연락처', '통화가능시간', '스윙스타일', '클럽선택 우선순위', '현재거리', '추천플렉스', '예상거리', '추천클럽', '상태', '메모', '캠페인', '등록일'],
      ...filteredContacts.map(contact => [
        contact.name,
        contact.phone,
        contact.call_times || '시간무관',
        contact.swing_style || '-',
        contact.priority || '-',
        contact.current_distance ? contact.current_distance + 'm' : '-',
        contact.recommended_flex || '-',
        contact.expected_distance ? contact.expected_distance + 'm' : '-',
        contact.recommended_club || '-',
        contact.contacted ? '연락완료' : '대기중',
        contact.notes || '',  // memo -> notes
        contact.campaign_source || '-',
        new Date(contact.created_at).toLocaleString('ko-KR')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `문의목록_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  // 통화 시간대별 통계
  const callTimeStats = useMemo(() => {
    const stats = {
      '오전': contacts.filter(c => c.call_times === '오전').length,
      '오후': contacts.filter(c => c.call_times === '오후').length,
      '저녁': contacts.filter(c => c.call_times === '저녁').length,
      '시간무관': contacts.filter(c => !c.call_times || c.call_times === '시간무관').length,
    };
    return stats;
  }, [contacts]);

  // 스윙 스타일별 통계 추가
  const swingStyleStats = useMemo(() => {
    const stats = {
      '안정형': contacts.filter(c => c.swing_style === '안정형').length,
      '파워형': contacts.filter(c => c.swing_style === '파워형').length,
      '복합형': contacts.filter(c => c.swing_style === '복합형').length,
    };
    return stats;
  }, [contacts]);

  // 데이터가 없을 때 표시할 빈 상태
  if (!contacts || contacts.length === 0) {
    return (
      <div className="space-y-6">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-500">전체 문의</p>
            <p className="text-2xl font-bold text-gray-900">0</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-500">연락 대기</p>
            <p className="text-2xl font-bold text-yellow-600">0</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-500">연락 완료</p>
            <p className="text-2xl font-bold text-green-600">0</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-500">응답률</p>
            <p className="text-2xl font-bold text-blue-600">0%</p>
          </div>
        </div>

        {/* 빈 상태 메시지 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">문의 데이터가 없습니다</h3>
            <p className="text-gray-500 mb-4">
              아직 고객 문의가 없거나 데이터베이스 연결에 문제가 있을 수 있습니다.
            </p>
            <button
              onClick={() => {
                console.log('Contacts 데이터 상태:', contacts);
                console.log('Supabase 연결 상태:', supabase);
                onUpdate();
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              데이터 새로고침
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">전체 문의</p>
          <p className="text-2xl font-bold text-gray-900">{contacts.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">연락 대기</p>
          <p className="text-2xl font-bold text-yellow-600">
            {contacts.filter(c => !c.contacted).length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">연락 완료</p>
          <p className="text-2xl font-bold text-green-600">
            {contacts.filter(c => c.contacted).length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">응답률</p>
          <p className="text-2xl font-bold text-blue-600">
            {contacts.length > 0 
              ? Math.round((contacts.filter(c => c.contacted).length / contacts.length) * 100)
              : 0}%
          </p>
        </div>
      </div>

      {/* 통화 시간대 분석 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">통화 가능 시간대 분석</h3>
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(callTimeStats).map(([time, count]) => (
            <div key={time} className="text-center">
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-purple-600 bg-purple-200">
                      {time}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-purple-600">
                      {count}명
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-purple-200">
                  <div 
                    style={{ width: `${contacts.length > 0 ? (count / contacts.length * 100) : 0}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* 검색 - Search 아이콘으로 변경 */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="고객명 또는 연락처로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 상태 필터 */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">모든 상태</option>
            <option value="pending">대기중</option>
            <option value="contacted">연락완료</option>
          </select>

          {/* 통화시간 필터 */}
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">모든 시간대</option>
            <option value="오전">오전</option>
            <option value="오후">오후</option>
            <option value="저녁">저녁</option>
            <option value="시간무관">시간무관</option>
          </select>

          {/* 액션 버튼 */}
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Tag className="w-4 h-4" />
            상담 노트
          </button>

          <button
            onClick={downloadExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            엑셀 다운로드
          </button>
        </div>

        {/* 상담 노트 */}
        {showNotes && (
          <div className="mb-6 p-4 bg-purple-50 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-2">상담 노트</h4>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="오늘의 상담 내용, 주의사항 등을 기록하세요..."
              className="w-full p-3 border border-purple-200 rounded-lg resize-none"
              rows={4}
            />
            <button
              onClick={() => {
                localStorage.setItem('contact_notes', notes);
                alert('노트가 저장되었습니다.');
              }}
              className="mt-2 px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
            >
              노트 저장
            </button>
          </div>
        )}

        {/* 일괄 작업 */}
        {selectedContacts.length > 0 && (
          <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-lg mb-4">
            <span className="text-sm font-medium text-purple-900">
              {selectedContacts.length}개 선택됨
            </span>
            <button
              onClick={() => handleBulkAction('contacted')}
              className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              연락완료 처리
            </button>
            <button
              onClick={() => handleBulkAction('pending')}
              className="text-sm px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              대기중으로 변경
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="text-sm px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              삭제
            </button>
          </div>
        )}

        {/* 문의 테이블 */}
        <div className="overflow-x-auto pb-32"> {/* 하단 여백 추가 */}
          <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
          <th className="px-4 py-3 text-left">
          <input
          type="checkbox"
          checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
          onChange={(e) => {
          if (e.target.checked) {
          setSelectedContacts(filteredContacts.map(c => c.id));
          } else {
          setSelectedContacts([]);
          }
          }}
          />
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">고객명</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">연락처</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">통화가능시간</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">퀴즈결과</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">캠페인</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">메모</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">등록일</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">액션</th>
          </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
          {filteredContacts.map((contact) => (
          <tr key={contact.id} className="hover:bg-gray-50">
          <td className="px-4 py-3">
          <input
          type="checkbox"
          checked={selectedContacts.includes(contact.id)}
          onChange={(e) => {
          if (e.target.checked) {
          setSelectedContacts([...selectedContacts, contact.id]);
          } else {
          setSelectedContacts(selectedContacts.filter(id => id !== contact.id));
          }
          }}
          />
          </td>
          <td className="px-4 py-3 font-medium text-gray-900">{contact.name}</td>
          <td className="px-4 py-3">
          <a
          href={`tel:${contact.phone}`}
          className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
          >
          <Phone className="w-4 h-4" />
          {formatPhoneNumber(contact.phone)}
          </a>
          </td>
          <td className="px-4 py-3">
          <div className="flex items-center gap-1">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          contact.call_times === '오전' ? 'bg-blue-100 text-blue-800' :
          contact.call_times === '오후' ? 'bg-green-100 text-green-800' :
          contact.call_times === '저녁' ? 'bg-purple-100 text-purple-800' :
          'bg-gray-100 text-gray-800'
          }`}>
          {contact.call_times || '시간무관'}
          </span>
          </div>
          </td>
          <td className="px-4 py-3 relative">
          {(contact.swing_style || contact.priority || contact.current_distance) ? (
          <div className="space-y-1">
          {contact.swing_style && (
            <div className="flex items-center gap-1">
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                {contact.swing_style}
              </span>
              </div>
              )}
            {contact.priority && (
                <div className="flex items-center gap-1">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {contact.priority}
              </span>
          </div>
          )}
          {contact.current_distance && (
          <div className="flex items-center gap-1">
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                {contact.current_distance}m
            </span>
            </div>
            )}
              {contact.recommended_flex && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                    {contact.recommended_flex}
                </span>
              </div>
          )}
          <button
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            
            // 화면 하단 여백이 250px 미만이면 위쪽에 표시
            setDetailsPosition({
              ...detailsPosition,
              [contact.id]: spaceBelow < 250 ? 'top' : 'bottom'
            });
            setShowDetails(showDetails === contact.id ? null : contact.id);
          }}
              className="text-xs text-purple-600 hover:text-purple-700 mt-1"
              >
              <Info className="w-3 h-3 inline mr-1" />
                상세보기
                </button>
              </div>
          ) : (
          <span className="text-sm text-gray-400">-</span>
          )}
            {showDetails === contact.id && (
              <div 
                className="absolute z-50 p-4 bg-white border-2 border-purple-200 rounded-xl shadow-2xl overflow-hidden" 
                style={{
                  ...(detailsPosition[contact.id] === 'top' ? {
                    bottom: '100%',
                    marginBottom: '8px',
                    maxHeight: `${Math.min(400, window.innerHeight - 100)}px`, // 화면 크기에 따라 동적 높이
                  } : {
                    top: '100%',
                    marginTop: '8px',
                    maxHeight: `${Math.min(400, window.innerHeight - window.pageYOffset - 100)}px`, // 화면 하단 여백 고려
                  }),
                  width: '400px',
                }}
                onClick={() => setShowDetails(null)}
              >
                <div 
                  className="h-full overflow-y-auto custom-scrollbar"
                  style={{
                    maxHeight: 'inherit',
                    paddingRight: '8px',
                    // Firefox 용 스크롤바 스타일
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#D8B4FE #F3E8FF'
                  }}
                >
                  <div className="space-y-4 pb-2">
                    <h4 className="font-bold text-lg text-gray-900 border-b-2 border-purple-200 pb-3 sticky top-0 bg-white">퀘즈 분석 결과</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-purple-50 p-3 rounded-lg hover:bg-purple-100 transition-colors">
                        <span className="text-sm font-semibold text-purple-700 block mb-1">스윙 스타일</span>
                        <span className="text-base text-gray-900 font-medium">{contact.swing_style || '-'}</span>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg hover:bg-blue-100 transition-colors">
                        <span className="text-sm font-semibold text-blue-700 block mb-1">클럽 선택 우선순위</span>
                        <span className="text-base text-gray-900 font-medium">{contact.priority || '-'}</span>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg hover:bg-green-100 transition-colors">
                        <span className="text-sm font-semibold text-green-700 block mb-1">현재 비거리</span>
                        <span className="text-base text-gray-900 font-medium">{contact.current_distance ? contact.current_distance + 'm' : '-'}</span>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-lg hover:bg-yellow-100 transition-colors">
                        <span className="text-sm font-semibold text-yellow-700 block mb-1">추천 플렉스</span>
                        <span className="text-base text-gray-900 font-medium">{contact.recommended_flex || '-'}</span>
                      </div>
                      <div className="bg-indigo-50 p-3 rounded-lg hover:bg-indigo-100 transition-colors">
                        <span className="text-sm font-semibold text-indigo-700 block mb-1">예상 비거리</span>
                        <span className="text-base text-gray-900 font-medium">{contact.expected_distance ? contact.expected_distance + 'm' : '-'}</span>
                      </div>
                      <div className="bg-pink-50 p-3 rounded-lg hover:bg-pink-100 transition-colors">
                        <span className="text-sm font-semibold text-pink-700 block mb-1">추천 클럽</span>
                        <span className="text-base text-gray-900 font-medium">{contact.recommended_club || '-'}</span>
                      </div>
                    </div>
                    <div className="pt-3 mt-3 border-t border-gray-200 text-center sticky bottom-0 bg-white">
                      <p className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer">클릭하여 닫기</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </td>
          <td className="px-4 py-3">
          <button
              onClick={() => updateContactStatus(contact.id, !contact.contacted)}
              className={`px-3 py-1 text-xs font-semibold rounded-full ${
              contact.contacted 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
            }`}
          >
          {contact.contacted ? '연락완료' : '대기중'}
          </button>
          </td>
          <td className="px-4 py-3">
          <span className="text-sm text-gray-600">
              {contact.campaign_source || '-'}
              </span>
              </td>
                <td className="px-4 py-3">
                    {editingId === contact.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editMemo}
                            onChange={(e) => setEditMemo(e.target.value)}
                            className="px-2 py-1 text-sm border border-gray-300 rounded"
                            autoFocus
                          />
                          <button
                            onClick={() => saveMemo(contact.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            ✓
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(contact.id);
                            setEditMemo(contact.notes || '');  // memo -> notes
                          }}
                          className="text-sm text-gray-600 hover:text-gray-900"
                        >
                          {contact.notes || '메모 추가'}  {/* memo -> notes */}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(contact.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`tel:${contact.phone}`}
                        className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        <Phone className="w-3 h-3" />
                        전화
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

          {/* 필터링된 결과가 없을 때 */}
          {filteredContacts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              검색 결과가 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
