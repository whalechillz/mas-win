import { useEffect, useState } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';

// Supabase 설정을 환경 변수나 config에서 가져오기
const supabaseUrl = 'https://yyytjudftvpmcnppaymw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5eXRqdWRmdHZwbWNucHBheW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NDcxMTksImV4cCI6MjA2NzAyMzExOX0.TxT-vnDjFip_CCL7Ag8mR7G59dMdQAKfPLY1S3TJqRE';

const supabase = createClient(supabaseUrl, supabaseKey);

export default function AdminPage() {
  const [bookings, setBookings] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalContacts: 0,
    todayTotal: 0,
    weekTotal: 0
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([loadBookings(), loadContacts()]);
    updateStats();
    setLoading(false);
  };

  const loadBookings = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) {
      setBookings(data || []);
    }
  };

  const loadContacts = async () => {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) {
      setContacts(data || []);
    }
  };

  const updateStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const todayBookings = bookings.filter(b => b.created_at.startsWith(today)).length;
    const todayContacts = contacts.filter(c => c.created_at.startsWith(today)).length;
    
    const weekBookings = bookings.filter(b => b.created_at >= weekAgo).length;
    const weekContacts = contacts.filter(c => c.created_at >= weekAgo).length;
    
    setStats({
      totalBookings: bookings.length,
      totalContacts: contacts.length,
      todayTotal: todayBookings + todayContacts,
      weekTotal: weekBookings + weekContacts
    });
  };

  const deleteBooking = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);
    
    if (!error) {
      await loadBookings();
      updateStats();
    }
  };

  const deleteContact = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);
    
    if (!error) {
      await loadContacts();
      updateStats();
    }
  };

  const toggleContacted = async (id, contacted) => {
    const { error } = await supabase
      .from('contacts')
      .update({ contacted })
      .eq('id', id);
    
    if (!error) {
      await loadContacts();
    }
  };

  const exportToCSV = (type) => {
    const data = type === 'bookings' ? bookings : contacts;
    const headers = type === 'bookings' 
      ? ['이름', '연락처', '희망날짜', '희망시간', '관심클럽', '신청시간']
      : ['이름', '연락처', '통화가능시간', '신청시간', '연락여부'];
    
    let csv = '\uFEFF' + headers.join(',') + '\n';
    
    data.forEach(item => {
      if (type === 'bookings') {
        csv += `${item.name},${item.phone},${item.date},${item.time},${item.club || ''},${item.created_at}\n`;
      } else {
        csv += `${item.name},${item.phone},${item.call_times || ''},${item.created_at},${item.contacted ? 'O' : 'X'}\n`;
      }
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `masgolf_${type}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    return `${formatDate(dateStr)} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl mb-4"></i>
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>MASGOLF 관리자</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Head>
      
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">MASGOLF 관리자 페이지</h1>
          <div className="text-sm text-gray-600">
            <i className="fas fa-database mr-2"></i>Supabase 연동
          </div>
        </div>
        
        {/* 통계 섹션 */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold mb-2">총 시타 예약</h3>
            <p className="text-3xl font-bold text-blue-500">{stats.totalBookings}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold mb-2">총 문의</h3>
            <p className="text-3xl font-bold text-purple-500">{stats.totalContacts}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold mb-2">오늘 신청</h3>
            <p className="text-3xl font-bold text-green-500">{stats.todayTotal}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold mb-2">이번 주 신청</h3>
            <p className="text-3xl font-bold text-orange-500">{stats.weekTotal}</p>
          </div>
        </div>
        
        {/* 시타 예약 섹션 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center justify-between">
            <span><i className="fas fa-calendar-check text-blue-500 mr-2"></i>시타 예약</span>
            <div>
              <button onClick={loadBookings} className="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600 mr-2">
                <i className="fas fa-sync mr-2"></i>새로고침
              </button>
              <button onClick={() => exportToCSV('bookings')} className="bg-green-500 text-white px-4 py-2 rounded text-sm hover:bg-green-600">
                <i className="fas fa-download mr-2"></i>CSV 다운로드
              </button>
            </div>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border p-2 text-left">번호</th>
                  <th className="border p-2 text-left">이름</th>
                  <th className="border p-2 text-left">연락처</th>
                  <th className="border p-2 text-left">희망 날짜</th>
                  <th className="border p-2 text-left">희망 시간</th>
                  <th className="border p-2 text-left">관심 클럽</th>
                  <th className="border p-2 text-left">신청 시간</th>
                  <th className="border p-2 text-left">액션</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr><td colSpan={8} className="border p-4 text-center text-gray-500">예약이 없습니다.</td></tr>
                ) : (
                  bookings.map((booking, index) => (
                    <tr key={booking.id}>
                      <td className="border p-2">{index + 1}</td>
                      <td className="border p-2">{booking.name}</td>
                      <td className="border p-2">{booking.phone}</td>
                      <td className="border p-2">{formatDate(booking.date)}</td>
                      <td className="border p-2">{booking.time}</td>
                      <td className="border p-2">{booking.club || '-'}</td>
                      <td className="border p-2">{formatDateTime(booking.created_at)}</td>
                      <td className="border p-2">
                        <button onClick={() => deleteBooking(booking.id)} className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 문의 섹션 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center justify-between">
            <span><i className="fas fa-comment text-purple-500 mr-2"></i>문의 내역</span>
            <div>
              <button onClick={loadContacts} className="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600 mr-2">
                <i className="fas fa-sync mr-2"></i>새로고침
              </button>
              <button onClick={() => exportToCSV('contacts')} className="bg-green-500 text-white px-4 py-2 rounded text-sm hover:bg-green-600">
                <i className="fas fa-download mr-2"></i>CSV 다운로드
              </button>
            </div>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border p-2 text-left">번호</th>
                  <th className="border p-2 text-left">이름</th>
                  <th className="border p-2 text-left">연락처</th>
                  <th className="border p-2 text-left">통화 가능 시간</th>
                  <th className="border p-2 text-left">신청 시간</th>
                  <th className="border p-2 text-left">연락 여부</th>
                  <th className="border p-2 text-left">액션</th>
                </tr>
              </thead>
              <tbody>
                {contacts.length === 0 ? (
                  <tr><td colSpan={7} className="border p-4 text-center text-gray-500">문의가 없습니다.</td></tr>
                ) : (
                  contacts.map((contact, index) => (
                    <tr key={contact.id} className={contact.contacted ? 'bg-gray-50' : ''}>
                      <td className="border p-2">{index + 1}</td>
                      <td className="border p-2">{contact.name}</td>
                      <td className="border p-2">{contact.phone}</td>
                      <td className="border p-2">{contact.call_times || '-'}</td>
                      <td className="border p-2">{formatDateTime(contact.created_at)}</td>
                      <td className="border p-2">
                        <input type="checkbox" checked={contact.contacted || false} 
                               onChange={(e) => toggleContacted(contact.id, e.target.checked)} />
                      </td>
                      <td className="border p-2">
                        <button onClick={() => deleteContact(contact.id)} className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}