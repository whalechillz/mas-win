'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface RealtimeRefreshProps {
  onRefresh: () => void;
  interval?: number; // 초 단위
}

export default function RealtimeRefresh({ onRefresh, interval = 30 }: RealtimeRefreshProps) {
  const [timeLeft, setTimeLeft] = useState(interval);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  useEffect(() => {
    if (!isAutoRefresh) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onRefresh();
          return interval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAutoRefresh, interval, onRefresh]);

  const handleManualRefresh = () => {
    onRefresh();
    setTimeLeft(interval);
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleManualRefresh}
        className="flex items-center space-x-1 px-3 py-1 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        <span>새로고침</span>
      </button>
      
      <label className="flex items-center space-x-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={isAutoRefresh}
          onChange={(e) => setIsAutoRefresh(e.target.checked)}
          className="rounded"
        />
        <span>자동 새로고침 ({timeLeft}초)</span>
      </label>
    </div>
  );
}
