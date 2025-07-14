import React, { useState } from 'react';
import { MessageSquare, FileText, Camera, Youtube, Mail, Check } from 'lucide-react';

export const ChannelSelectionSettings = ({ onChannelChange }) => {
  const [selectedChannels, setSelectedChannels] = useState({
    blog: true,
    kakao: true,
    sms: false,
    instagram: false,
    youtube: false,
    email: false
  });

  const channels = [
    {
      id: 'blog',
      name: '네이버 블로그',
      icon: FileText,
      color: 'green',
      contentCount: { template: 3, ai: '3-5' },
      description: 'SEO 최적화 긴 글'
    },
    {
      id: 'kakao',
      name: '카카오톡',
      icon: MessageSquare,
      color: 'yellow',
      contentCount: { template: 4, ai: '4-6' },
      description: '짧은 마케팅 메시지'
    },
    {
      id: 'sms',
      name: 'SMS/LMS',
      icon: Mail,
      color: 'blue',
      contentCount: { template: 2, ai: '2-4' },
      description: '문자 메시지'
    },
    {
      id: 'instagram',
      name: '인스타그램',
      icon: Camera,
      color: 'pink',
      contentCount: { template: 3, ai: '3-5' },
      description: '이미지 중심 포스트'
    },
    {
      id: 'youtube',
      name: '유튜브',
      icon: Youtube,
      color: 'red',
      contentCount: { template: 1, ai: '1-2' },
      description: '영상 기획안'
    }
  ];

  const handleChannelToggle = (channelId) => {
    const newSelection = {
      ...selectedChannels,
      [channelId]: !selectedChannels[channelId]
    };
    setSelectedChannels(newSelection);
    onChannelChange?.(newSelection);
  };

  const getSelectedCount = () => {
    return Object.values(selectedChannels).filter(v => v).length;
  };

  const getTotalContentCount = (useAI = false) => {
    let total = 0;
    channels.forEach(channel => {
      if (selectedChannels[channel.id]) {
        if (useAI) {
          // AI는 평균값 사용
          const range = channel.contentCount.ai.split('-');
          total += parseInt(range[1]);
        } else {
          total += channel.contentCount.template;
        }
      }
    });
    return total;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">📢 채널 선택</h2>
        <p className="text-sm text-gray-600">
          콘텐츠를 생성할 채널을 선택하세요 ({getSelectedCount()}개 선택됨)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {channels.map(channel => {
          const Icon = channel.icon;
          const isSelected = selectedChannels[channel.id];
          
          return (
            <div
              key={channel.id}
              onClick={() => handleChannelToggle(channel.id)}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                isSelected
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-${channel.color}-100`}>
                    <Icon className={`w-5 h-5 text-${channel.color}-600`} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{channel.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {channel.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      템플릿: {channel.contentCount.template}개 / 
                      AI: {channel.contentCount.ai}개
                    </p>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  isSelected 
                    ? 'bg-purple-500 border-purple-500' 
                    : 'border-gray-300'
                }`}>
                  {isSelected && <Check className="w-4 h-4 text-white" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium mb-3">예상 생성 개수</h3>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-700">
              {getTotalContentCount(false)}개
            </p>
            <p className="text-sm text-gray-500">템플릿 모드</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">
              ~{getTotalContentCount(true)}개
            </p>
            <p className="text-sm text-gray-500">AI 모드</p>
          </div>
        </div>
      </div>

      {getSelectedCount() === 0 && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-700">
            ⚠️ 최소 1개 이상의 채널을 선택해주세요
          </p>
        </div>
      )}
    </div>
  );
};
