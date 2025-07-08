import React, { useState, useEffect } from 'react';
import { Campaign } from '../../../lib/campaign-types';

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (campaign: Partial<Campaign>) => void;
  campaign?: Campaign;
  supabase: any;
}

export function CampaignModal({ isOpen, onClose, onSave, campaign, supabase }: CampaignModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    status: 'draft' as 'active' | 'ended' | 'planned' | 'draft',
    start_date: '',
    end_date: '',
    landing_page_url: '',
    landing_page_file: '',
    op_manual_url: '',
    google_ads_url: '',
    phone_number: '080-028-8888',
    event_date: '',
    remaining_slots: 30,
    discount_rate: 50,
    target_audience: '',
    views: 0,
    bookings: 0,
    inquiries: 0,
    conversion_rate: 0,
    roi: 0,
    cost_per_acquisition: 0
  });

  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name,
        status: campaign.status,
        start_date: campaign.period.start,
        end_date: campaign.period.end,
        landing_page_url: campaign.assets.landingPageUrl || '',
        landing_page_file: campaign.assets.landingPage || '',
        op_manual_url: campaign.assets.opManual || '',
        google_ads_url: campaign.assets.googleAds || '',
        phone_number: campaign.settings.phoneNumber,
        event_date: campaign.settings.eventDate,
        remaining_slots: campaign.settings.remainingSlots,
        discount_rate: campaign.settings.discountRate,
        target_audience: campaign.settings.targetAudience,
        views: campaign.metrics.views,
        bookings: campaign.metrics.bookings,
        inquiries: campaign.metrics.inquiries,
        conversion_rate: campaign.metrics.conversionRate,
        roi: campaign.metrics.roi || 0,
        cost_per_acquisition: campaign.metrics.costPerAcquisition || 0
      });
    }
  }, [campaign]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (campaign) {
        // 기존 캠페인 수정
        const { error } = await supabase
          .from('campaigns')
          .update(formData)
          .eq('id', campaign.id);
        
        if (error) throw error;
      } else {
        // 새 캠페인 생성
        const newId = new Date().toISOString().slice(0, 7); // YYYY-MM 형식
        const { error } = await supabase
          .from('campaigns')
          .insert({
            id: newId,
            ...formData
          });
        
        if (error) throw error;
      }
      
      onSave(formData);
      onClose();
    } catch (error) {
      console.error('캠페인 저장 오류:', error);
      alert('캠페인 저장 중 오류가 발생했습니다.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">
          {campaign ? '캠페인 수정' : '새 캠페인 만들기'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">기본 정보</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                캠페인명
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  시작일
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  종료일
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                상태
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="draft">초안</option>
                <option value="planned">예정</option>
                <option value="active">진행중</option>
                <option value="ended">종료</option>
              </select>
            </div>
          </div>
          
          {/* 캠페인 설정 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">캠페인 설정</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  할인율 (%)
                </label>
                <input
                  type="number"
                  value={formData.discount_rate}
                  onChange={(e) => setFormData({...formData, discount_rate: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  min="0"
                  max="100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  남은 자리
                </label>
                <input
                  type="number"
                  value={formData.remaining_slots}
                  onChange={(e) => setFormData({...formData, remaining_slots: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  min="0"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                타겟 고객
              </label>
              <input
                type="text"
                value={formData.target_audience}
                onChange={(e) => setFormData({...formData, target_audience: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="예: 골프 입문자 및 실력 향상 희망자"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이벤트 날짜
              </label>
              <input
                type="text"
                value={formData.event_date}
                onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="예: 7월 31일"
              />
            </div>
          </div>
          
          {/* 자산 URL */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">캠페인 자산</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                랜딩페이지 URL
              </label>
              <input
                type="text"
                value={formData.landing_page_url}
                onChange={(e) => setFormData({...formData, landing_page_url: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="/funnel-2025-07"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                운영 매뉴얼 URL
              </label>
              <input
                type="text"
                value={formData.op_manual_url}
                onChange={(e) => setFormData({...formData, op_manual_url: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="/docs/op-manuals/2025-07/"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Google Ads 폴더
              </label>
              <input
                type="text"
                value={formData.google_ads_url}
                onChange={(e) => setFormData({...formData, google_ads_url: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="/google_ads/2025.07.캠페인명/"
              />
            </div>
          </div>
          
          {/* 액션 버튼 */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              {campaign ? '수정하기' : '생성하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
