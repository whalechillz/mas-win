import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// GalleryPicker는 동적 로드
const GalleryPicker = dynamic(() => import('../../admin/GalleryPicker'), { ssr: false });

interface BookingSettingsProps {
  supabase: any;
  onUpdate: () => void;
}

interface BookingSettings {
  id: string;
  disable_same_day_booking: boolean;
  disable_weekend_booking: boolean;
  min_advance_hours: number;
  max_advance_days?: number;
  max_weekly_slots?: number;
  auto_block_excess_slots?: boolean;
  show_call_message?: boolean;
  call_message_text?: string;
  enable_slack_notification?: boolean;
  enable_staff_notification?: boolean;
  notify_on_received_slack?: boolean;
  notify_on_received_staff_sms?: boolean;
  notify_on_received_customer_sms?: boolean;
  notify_on_confirmed_slack?: boolean;
  notify_on_confirmed_staff_sms?: boolean;
  notify_on_confirmed_customer_sms?: boolean;
  staff_phone_numbers?: string[];
  mms_logo_id?: string;
  mms_logo_color?: string;
  mms_logo_size?: string;
  booking_logo_id?: string;
  booking_logo_size?: string;
  enable_booking_logo?: boolean;
  updated_at?: string;
}

interface BookingLocation {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  is_active: boolean;
}

interface BookingHour {
  id: string;
  location_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export default function BookingSettings({ supabase, onUpdate }: BookingSettingsProps) {
  const [settings, setSettings] = useState<BookingSettings | null>(null);
  const [locations, setLocations] = useState<BookingLocation[]>([]);
  const [operatingHours, setOperatingHours] = useState<Record<string, BookingHour[]>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingVirtual, setGeneratingVirtual] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'locations' | 'hours'>('settings');
  const [showLogoGallery, setShowLogoGallery] = useState(false);
  const [selectedLogoUrl, setSelectedLogoUrl] = useState<string | null>(null);
  const [selectedLogoId, setSelectedLogoId] = useState<string | null>(null);
  const [selectedBookingLogoUrl, setSelectedBookingLogoUrl] = useState<string | null>(null);

  const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 예약 설정 조회 (API를 통해 조회하여 일관성 유지)
      const response = await fetch('/api/bookings/settings');
      if (response.ok) {
        const settingsData = await response.json();
        setSettings(settingsData);
        
        // 예약 문자용 로고 정보 로드
        if (settingsData.booking_logo_id) {
          const { data: bookingLogoData } = await supabase
            .from('image_metadata')
            .select('id, image_url')
            .eq('id', settingsData.booking_logo_id)
            .single();
          
          if (bookingLogoData) {
            setSelectedBookingLogoUrl(bookingLogoData.image_url);
          }
        }
      } else {
        // API 실패 시 Supabase 직접 조회
        const { data: settingsData, error } = await supabase
          .from('booking_settings')
          .select('*')
          .eq('id', '00000000-0000-0000-0000-000000000001')
          .single();

        if (settingsData && !error) {
          setSettings(settingsData);
        } else {
          // 기본값 설정
          setSettings({
            id: '00000000-0000-0000-0000-000000000001',
            disable_same_day_booking: false,
            disable_weekend_booking: false,
            min_advance_hours: 24,
            max_advance_days: 14,
            max_weekly_slots: 10,
            auto_block_excess_slots: true,
            show_call_message: true,
            call_message_text: '원하시는 시간에 예약이 어려우신가요? 전화로 문의해주세요.'
          });
        }
      }

      // 예약장소 조회
      const { data: locationsData, error: locationsError } = await supabase
        .from('booking_locations')
        .select('*')
        .order('created_at', { ascending: true });

      if (locationsError) {
        console.error('예약장소 조회 오류:', locationsError);
      }

      if (locationsData) {
        console.log('조회된 예약장소:', locationsData);
        setLocations(locationsData);

        // 운영시간 조회 (장소가 있을 때만)
        if (locationsData.length > 0) {
          const locationIds = locationsData.map(loc => loc.id);
          const { data: hoursData, error: hoursError } = await supabase
            .from('booking_hours')
            .select('*')
            .in('location_id', locationIds)
            .order('location_id', { ascending: true })
            .order('day_of_week', { ascending: true });

          if (hoursError) {
            console.error('운영시간 조회 오류:', hoursError);
          }

          if (hoursData) {
            console.log('조회된 운영시간:', hoursData);
            const hoursByLocation: Record<string, BookingHour[]> = {};
            hoursData.forEach((hour: BookingHour) => {
              if (!hoursByLocation[hour.location_id]) {
                hoursByLocation[hour.location_id] = [];
              }
              hoursByLocation[hour.location_id].push(hour);
            });
            setOperatingHours(hoursByLocation);
          } else {
            setOperatingHours({});
          }
        } else {
          setOperatingHours({});
        }
      } else {
        setLocations([]);
        setOperatingHours({});
      }
    } catch (error) {
      console.error('데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const response = await fetch('/api/bookings/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          disable_same_day_booking: settings.disable_same_day_booking,
          disable_weekend_booking: settings.disable_weekend_booking,
          min_advance_hours: settings.min_advance_hours,
          max_advance_days: settings.max_advance_days,
          max_weekly_slots: settings.max_weekly_slots,
          auto_block_excess_slots: settings.auto_block_excess_slots,
          show_call_message: settings.show_call_message,
          call_message_text: settings.call_message_text,
          enable_slack_notification: settings.enable_slack_notification,
          enable_staff_notification: settings.enable_staff_notification,
          notify_on_received_slack: settings.notify_on_received_slack,
          notify_on_received_staff_sms: settings.notify_on_received_staff_sms,
          notify_on_received_customer_sms: settings.notify_on_received_customer_sms,
          notify_on_confirmed_slack: settings.notify_on_confirmed_slack,
          notify_on_confirmed_staff_sms: settings.notify_on_confirmed_staff_sms,
          notify_on_confirmed_customer_sms: settings.notify_on_confirmed_customer_sms,
          staff_phone_numbers: settings.staff_phone_numbers,
          mms_logo_id: settings.mms_logo_id,
          mms_logo_color: settings.mms_logo_color,
          mms_logo_size: settings.mms_logo_size,
          booking_logo_id: settings.booking_logo_id,
          booking_logo_size: settings.booking_logo_size,
          enable_booking_logo: settings.enable_booking_logo,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '설정 저장에 실패했습니다.');
      }

      const savedSettings = await response.json();
      
      // API 응답으로 상태 즉시 업데이트
      setSettings(savedSettings);
      
      alert('설정이 저장되었습니다.');
      
      // 데이터 동기화 확인 (선택적)
      setTimeout(() => {
        loadData();
      }, 500);
    } catch (error: any) {
      console.error('설정 저장 오류:', error);
      alert(`설정 저장 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateVirtualBlocks = async () => {
    if (!settings?.max_weekly_slots) {
      alert('주당 최대 슬롯 수를 먼저 설정해주세요.');
      return;
    }

    // 현재 주의 시작일 계산 (일요일)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - dayOfWeek); // 일요일로 이동
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    setGeneratingVirtual(true);
    try {
      const response = await fetch('/api/bookings/generate-virtual-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          week_start_date: weekStartStr,
          max_slots: settings.max_weekly_slots
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '가상 예약 생성에 실패했습니다.');
      }

      const result = await response.json();
      
      if (result.success) {
        alert(`${result.message}\n\n생성된 가상 예약: ${result.created_count}개\n실제 예약: ${result.actual_bookings}개\n총 사용: ${result.total_used}개 / 최대: ${result.max_slots}개`);
        onUpdate(); // 캘린더 새로고침
      } else {
        alert(result.message || '가상 예약 생성에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('가상 예약 생성 오류:', error);
      alert(`가상 예약 생성 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setGeneratingVirtual(false);
    }
  };

  const handleLocationSave = async (location: BookingLocation) => {
    // 필수 필드 검증
    if (!location.name || location.name.trim() === '') {
      alert('장소명을 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      if (location.id && location.id !== '') {
        // 수정
        const { error } = await supabase
          .from('booking_locations')
          .update({
            name: location.name,
            address: location.address || null,
            phone: location.phone || null,
            is_active: location.is_active,
          })
          .eq('id', location.id);

        if (error) throw error;
      } else {
        // 추가
        const { data: newLocation, error } = await supabase
          .from('booking_locations')
          .insert({
            name: location.name,
            address: location.address || null,
            phone: location.phone || null,
            is_active: location.is_active,
          })
          .select()
          .single();

        if (error) throw error;

        // 새로 생성된 장소의 ID로 업데이트
        if (newLocation) {
          const updated = [...locations];
          const index = updated.findIndex(loc => 
            (loc.id === location.id) || 
            (!loc.id && loc.name === location.name && !loc.address && !loc.phone)
          );
          if (index !== -1) {
            updated[index].id = newLocation.id;
            setLocations(updated);
          }
        }
      }

      alert('장소가 저장되었습니다.');
      loadData();
    } catch (error: any) {
      console.error('장소 저장 오류:', error);
      alert(`장소 저장 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setSaving(false);
    }
  };

  const createDefaultLocation = async () => {
    try {
      // 기본 장소 생성
      const { data: newLocation, error: locationError } = await supabase
        .from('booking_locations')
        .insert({
          name: 'Massgoo Studio',
          address: '경기도 수원시 영통구 법조로149번길 200',
          phone: '031-215-0013',
          is_active: true
        })
        .select()
        .single();

      if (locationError) throw locationError;

      if (newLocation) {
        // 기본 운영시간 생성 (월~금: 11-12시, 13-14시, 15-16시)
        const defaultHours = [];
        for (let day = 1; day <= 5; day++) { // 월~금
          defaultHours.push(
            { location_id: newLocation.id, day_of_week: day, start_time: '11:00', end_time: '12:00', is_available: true },
            { location_id: newLocation.id, day_of_week: day, start_time: '13:00', end_time: '14:00', is_available: true },
            { location_id: newLocation.id, day_of_week: day, start_time: '15:00', end_time: '16:00', is_available: true }
          );
        }

        const { error: hoursError } = await supabase
          .from('booking_hours')
          .insert(defaultHours);

        if (hoursError) {
          console.error('기본 운영시간 생성 오류:', hoursError);
          throw hoursError;
        }

        // 생성된 운영시간 다시 조회 (ID 포함)
        const { data: createdHours, error: fetchHoursError } = await supabase
          .from('booking_hours')
          .select('*')
          .eq('location_id', newLocation.id)
          .order('day_of_week', { ascending: true })
          .order('start_time', { ascending: true });

        if (fetchHoursError) {
          console.error('운영시간 조회 오류:', fetchHoursError);
        }

        // 새로 생성된 장소를 상태에 즉시 추가
        setLocations(prev => [...prev, newLocation]);

        // 새로 생성된 운영시간을 상태에 즉시 추가
        if (createdHours && createdHours.length > 0) {
          const hoursByLocation: Record<string, BookingHour[]> = {};
          createdHours.forEach((hour: BookingHour) => {
            if (!hoursByLocation[hour.location_id]) {
              hoursByLocation[hour.location_id] = [];
            }
            hoursByLocation[hour.location_id].push(hour);
          });
          setOperatingHours(prev => ({ ...prev, ...hoursByLocation }));
        }

        // onUpdate 콜백 호출 (부모 컴포넌트에 알림)
        if (onUpdate) {
          onUpdate();
        }
      }
    } catch (error) {
      console.error('기본 장소 생성 오류:', error);
      alert(`기본 장소 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  const handleHoursSave = async (locationId: string) => {
    // location_id 검증
    if (!locationId || locationId === '' || locationId.trim() === '') {
      alert('장소를 먼저 저장해주세요.');
      return;
    }

    setSaving(true);
    try {
      // 기존 운영시간 삭제
      const { error: deleteError } = await supabase
        .from('booking_hours')
        .delete()
        .eq('location_id', locationId);

      if (deleteError) throw deleteError;

      // 현재 운영시간 가져오기 (여러 타임슬롯 지원)
      const hours = operatingHours[locationId] || [];
      
      // 모든 타임슬롯 저장 (is_available 필터링 제거, 모든 타임슬롯이 활성화된 것으로 간주)
      const hoursToInsert = hours.map(hour => ({
        location_id: locationId,
        day_of_week: hour.day_of_week,
        start_time: hour.start_time,
        end_time: hour.end_time,
        is_available: true,
      }));

      if (hoursToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('booking_hours')
          .insert(hoursToInsert);

        if (insertError) throw insertError;
      }

      alert('운영시간이 저장되었습니다.');
      loadData();
    } catch (error: any) {
      console.error('운영시간 저장 오류:', error);
      alert(`운영시간 저장 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 탭 메뉴 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'settings'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            예약 설정
          </button>
          <button
            onClick={() => setActiveTab('locations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'locations'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            예약장소 관리
          </button>
          <button
            onClick={() => setActiveTab('hours')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'hours'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            운영시간 관리
          </button>
        </nav>
      </div>

      {/* 예약 설정 탭 */}
      {activeTab === 'settings' && settings && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-6">예약 제한 설정</h2>
          
          <div className="space-y-6">
            {/* 당일 예약 제한 */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  당일 예약 불가
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  체크 시 당일 예약을 불가능하게 합니다.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.disable_same_day_booking}
                  onChange={(e) => setSettings({
                    ...settings,
                    disable_same_day_booking: e.target.checked
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>

            {/* 주말 예약 제한 */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  주말 예약 불가
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  체크 시 토요일, 일요일 예약을 불가능하게 합니다.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.disable_weekend_booking}
                  onChange={(e) => setSettings({
                    ...settings,
                    disable_weekend_booking: e.target.checked
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>

            {/* 최소 사전 예약 시간 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                최소 사전 예약 시간 (시간)
              </label>
              <input
                type="number"
                min="0"
                max="168"
                value={settings.min_advance_hours}
                onChange={(e) => setSettings({
                  ...settings,
                  min_advance_hours: parseInt(e.target.value) || 24
                })}
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                예약 가능한 최소 시간 전에 예약해야 합니다. (예: 24 = 24시간 전)
              </p>
            </div>

            {/* 예약 가능 기간 제한 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                예약 가능 기간 (일)
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={settings.max_advance_days || 14}
                onChange={(e) => setSettings({
                  ...settings,
                  max_advance_days: parseInt(e.target.value) || 14
                })}
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                오늘부터 몇 일 이내만 예약 가능하게 합니다. (예: 14 = 14일 이내)
              </p>
            </div>

            {/* 주당 최대 슬롯 수 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                주당 최대 슬롯 수
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={settings.max_weekly_slots || 10}
                  onChange={(e) => setSettings({
                    ...settings,
                    max_weekly_slots: parseInt(e.target.value) || 10
                  })}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleGenerateVirtualBlocks}
                  disabled={generatingVirtual || !settings.max_weekly_slots}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {generatingVirtual ? '생성 중...' : '가상 예약 생성'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                한 주에 최대 몇 개의 슬롯만 예약 가능하게 할지 설정합니다. (예: 10 = 주당 10개)
                <br />
                <span className="text-blue-600 font-medium">"가상 예약 생성" 버튼을 클릭하면</span> 현재 주의 초과 슬롯을 가상 예약으로 차단합니다.
              </p>
            </div>

            {/* "전화 주세요" 메시지 표시 */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  "전화 주세요" 메시지 표시
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  예약이 불가능할 때 전화 문의 메시지를 표시합니다.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.show_call_message !== false}
                  onChange={(e) => setSettings({
                    ...settings,
                    show_call_message: e.target.checked
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>

            {/* 메시지 내용 - 고정 메시지 사용 */}
            {settings.show_call_message !== false && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>표시 메시지:</strong>
                </p>
                <p className="text-sm text-gray-800 font-medium">
                  "원하시는 시간에 예약이 어려우신가요?"
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  메시지 내용은 고정되어 있습니다.
                </p>
              </div>
            )}

            {/* 알림 설정 섹션 */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">알림 설정</h3>
              
              <div className="space-y-6">
                {/* 예약 신청 시 알림 */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">예약 신청 시 알림</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          슬랙 알림
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          예약 신청 시 슬랙 채널로 알림을 보냅니다.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notify_on_received_slack !== false}
                          onChange={(e) => setSettings({
                            ...settings,
                            notify_on_received_slack: e.target.checked
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          관리자 SMS
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          예약 신청 시 관리자에게 SMS를 보냅니다.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notify_on_received_staff_sms !== false}
                          onChange={(e) => setSettings({
                            ...settings,
                            notify_on_received_staff_sms: e.target.checked
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          고객 SMS
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          예약 신청 시 고객에게 접수 확인 SMS를 보냅니다.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notify_on_received_customer_sms !== false}
                          onChange={(e) => setSettings({
                            ...settings,
                            notify_on_received_customer_sms: e.target.checked
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 예약 확정 시 알림 */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">예약 확정 시 알림</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          슬랙 알림
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          예약 확정 시 슬랙 채널로 알림을 보냅니다.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notify_on_confirmed_slack !== false}
                          onChange={(e) => setSettings({
                            ...settings,
                            notify_on_confirmed_slack: e.target.checked
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          관리자 SMS
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          예약 확정 시 관리자에게 SMS를 보냅니다.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notify_on_confirmed_staff_sms !== false}
                          onChange={(e) => setSettings({
                            ...settings,
                            notify_on_confirmed_staff_sms: e.target.checked
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          고객 SMS
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          예약 확정 시 고객에게 확정 확인 SMS를 보냅니다.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notify_on_confirmed_customer_sms !== false}
                          onChange={(e) => setSettings({
                            ...settings,
                            notify_on_confirmed_customer_sms: e.target.checked
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 예약 문자 로고 설정 */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">예약 문자 로고 설정</h3>
              
              <div className="space-y-4 mb-6">
                {/* 로고 삽입 사용 토글 */}
                <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          로고 삽입 사용
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          예약 확정 메시지에 로고를 포함합니다. OFF 시 로고 없이 발송됩니다.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.enable_booking_logo !== false}
                          onChange={(e) => setSettings({
                            ...settings,
                            enable_booking_logo: e.target.checked
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      </label>
                </div>

                {/* 예약 문자용 로고 선택 (로고 삽입이 ON일 때만 표시) */}
                {settings.enable_booking_logo !== false && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        예약 확정 메시지 로고 (작은 가로형)
                      </label>
                      <p className="text-xs text-gray-500 mb-3">
                        예약 확정 시 고객에게 발송되는 MMS 메시지에 첨부될 작은 가로형 로고를 선택하세요.
                        <span className="text-red-600 font-medium"> 로고가 설정되어 있으면 반드시 포함됩니다.</span>
                      </p>
                      
                      <div className="flex items-center gap-4">
                        {settings.booking_logo_id ? (
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            {selectedBookingLogoUrl && (
                              <img 
                                src={selectedBookingLogoUrl} 
                                alt="선택된 로고" 
                                className="h-12 w-auto object-contain"
                              />
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-700">로고 선택됨</p>
                              <p className="text-xs text-gray-500">ID: {settings.booking_logo_id}</p>
                            </div>
                            <button
                              onClick={() => {
                                setSettings({
                                  ...settings,
                                  booking_logo_id: undefined,
                                  booking_logo_size: undefined
                                });
                                setSelectedBookingLogoUrl(null);
                              }}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              제거
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              // 로고 갤러리 열기 (로고만 필터링)
                              setShowLogoGallery(true);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                          >
                            로고 선택
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 예약 문자용 로고 크기 설정 */}
                    {settings.booking_logo_id && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          로고 크기
                        </label>
                        <select
                          value={settings.booking_logo_size || 'small-landscape'}
                          onChange={(e) => setSettings({
                            ...settings,
                            booking_logo_size: e.target.value
                          })}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                        >
                          <option value="small-landscape">작은 가로형 (600x200px) - 권장</option>
                          <option value="small">작게 (400x400px)</option>
                          <option value="medium">보통 (800x800px)</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          예약 문자에는 작은 가로형 로고를 권장합니다.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* 스탭진 전화번호 관리 */}
            {settings.enable_staff_notification !== false && (
              <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      스탭진 전화번호
                    </label>
                    <div className="space-y-2">
                      {(settings.staff_phone_numbers || []).map((phone, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={phone}
                            onChange={(e) => {
                              const newPhones = [...(settings.staff_phone_numbers || [])];
                              newPhones[index] = e.target.value;
                              setSettings({
                                ...settings,
                                staff_phone_numbers: newPhones
                              });
                            }}
                            placeholder="010-XXXX-XXXX"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          />
                          <button
                            onClick={() => {
                              const newPhones = (settings.staff_phone_numbers || []).filter((_, i) => i !== index);
                              setSettings({
                                ...settings,
                                staff_phone_numbers: newPhones
                              });
                            }}
                            className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                          >
                            삭제
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          setSettings({
                            ...settings,
                            staff_phone_numbers: [...(settings.staff_phone_numbers || []), '']
                          });
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
                      >
                        + 전화번호 추가
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      예약 완료 시 이 번호들로 SMS가 발송됩니다. (010-XXXX-XXXX 형식)
                    </p>
              </div>
            )}
          </div>

            {/* 저장 버튼 */}
            <div className="pt-4 border-t">
              <button
                onClick={handleSettingsSave}
                disabled={saving}
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {saving ? '저장 중...' : '설정 저장'}
              </button>
          </div>
        </div>
      )}

      {/* 예약장소 관리 탭 */}
      {activeTab === 'locations' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">예약장소 관리</h2>
            <button
              onClick={() => {
                const newLocation: BookingLocation = {
                  id: '', // 빈 문자열로 시작, 저장 후 UUID로 업데이트됨
                  name: '',
                  address: '',
                  phone: '',
                  is_active: true
                };
                setLocations([...locations, newLocation]);
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              + 장소 추가
            </button>
          </div>

          {locations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">예약장소가 없습니다.</p>
              <p className="text-sm mb-6">기본 장소와 운영시간을 자동으로 생성하시겠습니까?</p>
              <button
                onClick={async () => {
                  await createDefaultLocation();
                  alert('기본 장소와 운영시간이 생성되었습니다.');
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                기본 장소 및 운영시간 생성
              </button>
              <p className="text-xs text-gray-400 mt-4">
                생성되는 기본 장소: Massgoo Studio<br />
                기본 운영시간: 월~금 11-12시, 13-14시, 15-16시
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {locations.map((location, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      장소명 *
                    </label>
                    <input
                      type="text"
                      value={location.name}
                      onChange={(e) => {
                        const updated = [...locations];
                        updated[index].name = e.target.value;
                        setLocations(updated);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="예: Massgoo Studio"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      전화번호
                    </label>
                    <input
                      type="text"
                      value={location.phone || ''}
                      onChange={(e) => {
                        const updated = [...locations];
                        updated[index].phone = e.target.value;
                        setLocations(updated);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="예: 031-215-0013"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    주소
                  </label>
                  <input
                    type="text"
                    value={location.address || ''}
                    onChange={(e) => {
                      const updated = [...locations];
                      updated[index].address = e.target.value;
                      setLocations(updated);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="예: 경기도 수원시 영통구 법조로149번길 200"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={location.is_active}
                      onChange={(e) => {
                        const updated = [...locations];
                        updated[index].is_active = e.target.checked;
                        setLocations(updated);
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">활성화</span>
                  </label>
                  <button
                    onClick={() => handleLocationSave(location)}
                    disabled={!location.name || location.name.trim() === '' || saving}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    저장
                  </button>
                </div>
              </div>
            ))}
            </div>
          )}
        </div>
      )}

      {/* 운영시간 관리 탭 */}
      {activeTab === 'hours' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-6">운영시간 관리</h2>

          {locations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">예약장소가 없습니다.</p>
              <p className="text-sm mb-6">기본 장소와 운영시간을 자동으로 생성하시겠습니까?</p>
              <button
                onClick={async () => {
                  await createDefaultLocation();
                  alert('기본 장소와 운영시간이 생성되었습니다.');
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                기본 장소 및 운영시간 생성
              </button>
            </div>
          ) : locations.filter(loc => loc.is_active).length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">활성화된 예약장소가 없습니다.</p>
              <p className="text-sm mb-4">"예약장소 관리" 탭에서 장소를 활성화해주세요.</p>
              <div className="mt-6 space-y-4">
                <p className="text-sm font-medium text-gray-700">비활성화된 장소:</p>
                {locations.filter(loc => !loc.is_active).map((location) => (
                  <div key={location.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-700">{location.name}</p>
                        {location.address && (
                          <p className="text-sm text-gray-500 mt-1">{location.address}</p>
                        )}
                      </div>
                      <span className="px-3 py-1 text-xs bg-gray-200 text-gray-600 rounded">비활성화</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            locations.filter(loc => loc.is_active).map((location) => {
            const locationHours = operatingHours[location.id] || [];
            
            // 요일별로 타임슬롯 그룹화
            const hoursByDay: Record<number, BookingHour[]> = {};
            for (let day = 0; day < 7; day++) {
              hoursByDay[day] = locationHours.filter(h => h.day_of_week === day);
              // 타임슬롯이 없으면 빈 배열로 시작
              if (hoursByDay[day].length === 0) {
                hoursByDay[day] = [];
              }
            }

            return (
              <div key={location.id} className="mb-8 border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">{location.name}</h3>
                <div className="space-y-4">
                  {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                    <div key={day} className="border-b pb-4 last:border-b-0">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-20 text-sm font-medium text-gray-700">
                          {dayNames[day]}
                        </div>
                        <button
                          onClick={() => {
                            const newSlot: BookingHour = {
                              id: '',
                              location_id: location.id,
                              day_of_week: day,
                              start_time: '11:00',
                              end_time: '12:00',
                              is_available: true
                            };
                            const updated = {
                              ...operatingHours,
                              [location.id]: [...(operatingHours[location.id] || []), newSlot]
                            };
                            setOperatingHours(updated);
                          }}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          + 타임슬롯 추가
                        </button>
                      </div>
                      <div className="space-y-2 ml-24">
                        {hoursByDay[day].map((hour, slotIndex) => {
                          const allHours = operatingHours[location.id] || [];
                          const hourIndex = allHours.findIndex(h => 
                            h.day_of_week === day && 
                            h.start_time === hour.start_time &&
                            h.end_time === hour.end_time
                          );
                          
                          return (
                            <div key={slotIndex} className="flex items-center gap-2">
                              <input
                                type="time"
                                value={hour.start_time}
                                onChange={(e) => {
                                  const updated = [...allHours];
                                  if (hourIndex >= 0) {
                                    updated[hourIndex].start_time = e.target.value;
                                  }
                                  setOperatingHours({
                                    ...operatingHours,
                                    [location.id]: updated
                                  });
                                }}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                              <span className="text-gray-500">~</span>
                              <input
                                type="time"
                                value={hour.end_time}
                                onChange={(e) => {
                                  const updated = [...allHours];
                                  if (hourIndex >= 0) {
                                    updated[hourIndex].end_time = e.target.value;
                                  }
                                  setOperatingHours({
                                    ...operatingHours,
                                    [location.id]: updated
                                  });
                                }}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                              <button
                                onClick={() => {
                                  const updated = allHours.filter((_, idx) => idx !== hourIndex);
                                  setOperatingHours({
                                    ...operatingHours,
                                    [location.id]: updated
                                  });
                                }}
                                className="px-2 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                              >
                                삭제
                              </button>
                            </div>
                          );
                        })}
                        {hoursByDay[day].length === 0 && (
                          <p className="text-sm text-gray-400">타임슬롯이 없습니다. 추가 버튼을 클릭하세요.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <button
                    onClick={() => {
                      if (!location.id || location.id === '') {
                        alert('장소를 먼저 저장해주세요.');
                        return;
                      }
                      handleHoursSave(location.id);
                    }}
                    disabled={saving || !location.id || location.id === ''}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {saving ? '저장 중...' : '운영시간 저장'}
                  </button>
                </div>
              </div>
            );
          })
          )}
        </div>
      )}

      {/* 로고 갤러리 모달 */}
      <GalleryPicker
        isOpen={showLogoGallery}
        onClose={() => setShowLogoGallery(false)}
        onSelect={async (imageUrl, options) => {
          // ⭐ 추가: 이미지 형식 확인 (PNG/SVG 경고)
          const isJpeg = imageUrl.toLowerCase().endsWith('.jpg') || 
                        imageUrl.toLowerCase().endsWith('.jpeg');
          const isPng = imageUrl.toLowerCase().endsWith('.png');
          const isSvg = imageUrl.toLowerCase().endsWith('.svg');

          if (isPng || isSvg) {
            const proceed = confirm(
              '⚠️ 선택한 이미지가 JPEG 형식이 아닙니다.\n\n' +
              'Solapi MMS는 JPEG 형식만 지원합니다.\n' +
              'PNG/SVG 이미지를 선택하면 메시지 발송이 실패할 수 있습니다.\n\n' +
              'JPEG 형식의 로고를 선택하시겠습니까?'
            );
            if (!proceed) {
              return; // 선택 취소
            }
          }

          // image_metadata에서 로고 ID 찾기
          const { data: logoData } = await supabase
            .from('image_metadata')
            .select('id, image_url')
            .eq('image_url', imageUrl)
            .single();

          if (logoData) {
            // ⭐ 추가: 메타데이터에서 실제 파일 형식 확인
            const { data: logoMetadata } = await supabase
              .from('image_metadata')
              .select('is_logo, image_url')
              .eq('id', logoData.id)
              .single();

            // ⭐ 추가: image_url에서도 형식 재확인
            const metadataIsJpeg = logoMetadata?.image_url?.toLowerCase().endsWith('.jpg') ||
                                  logoMetadata?.image_url?.toLowerCase().endsWith('.jpeg');

            if (!metadataIsJpeg && (logoMetadata?.image_url?.toLowerCase().endsWith('.png') || 
                                   logoMetadata?.image_url?.toLowerCase().endsWith('.svg'))) {
              alert(
                '⚠️ 경고: 선택한 로고가 PNG/SVG 형식입니다.\n\n' +
                '예약 문자 발송 시 메시지가 실패할 수 있습니다.\n' +
                'JPEG 형식의 로고를 사용하는 것을 권장합니다.'
              );
            }

            if (logoMetadata?.is_logo || imageUrl.includes('originals/logos')) {
              // 예약 문자용 로고 설정
              setSettings({
                ...settings!,
                booking_logo_id: logoData.id,
                booking_logo_size: 'small-landscape',
                // 로고 삽입도 자동으로 활성화
                enable_booking_logo: true
              });
              setSelectedBookingLogoUrl(imageUrl);
            }
          }
          setShowLogoGallery(false);
        }}
        autoFilterFolder="originals/logos"
      />
    </div>
  );
}

