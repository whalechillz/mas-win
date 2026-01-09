import React, { useState, useRef, useEffect } from 'react';

interface DualRangeSliderProps {
  min: number;
  max: number;
  values: [number, number];
  onChange: (values: [number, number]) => void;
  marks?: number[];
  step?: number;
  disabled?: boolean;
  className?: string;
}

export default function DualRangeSlider({
  min,
  max,
  values,
  onChange,
  marks = [],
  step = 1,
  disabled = false,
  className = '',
}: DualRangeSliderProps) {
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const getPercentage = (value: number) => {
    return ((value - min) / (max - min)) * 100;
  };

  const handleMouseDown = (type: 'min' | 'max') => {
    if (disabled) return;
    setIsDragging(type);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const newValue = Math.max(min, Math.min(max, Math.round((percentage / 100) * (max - min) + min)));

    if (isDragging === 'min') {
      const newMin = Math.max(min, Math.min(newValue, values[1] - step));
      onChange([newMin, values[1]]);
    } else {
      const newMax = Math.min(max, Math.max(newValue, values[0] + step));
      onChange([values[0], newMax]);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, values]);

  const minPercentage = getPercentage(values[0]);
  const maxPercentage = getPercentage(values[1]);

  return (
    <div className={`relative ${className}`}>
      {/* 슬라이드 트랙 */}
      <div
        ref={sliderRef}
        className="relative h-2 bg-gray-200 rounded-full cursor-pointer"
        onMouseDown={(e) => {
          if (disabled) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const percentage = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
          const newValue = Math.round((percentage / 100) * (max - min) + min);
          
          const distanceToMin = Math.abs(newValue - values[0]);
          const distanceToMax = Math.abs(newValue - values[1]);
          
          if (distanceToMin < distanceToMax) {
            const newMin = Math.max(min, Math.min(newValue, values[1] - step));
            onChange([newMin, values[1]]);
          } else {
            const newMax = Math.min(max, Math.max(newValue, values[0] + step));
            onChange([values[0], newMax]);
          }
        }}
      >
        {/* 활성 범위 */}
        <div
          className="absolute h-2 bg-blue-500 rounded-full"
          style={{
            left: `${minPercentage}%`,
            width: `${maxPercentage - minPercentage}%`,
          }}
        />

        {/* 최소값 핸들 */}
        <div
          className={`absolute w-4 h-4 bg-blue-600 rounded-full cursor-grab active:cursor-grabbing transform -translate-x-1/2 -translate-y-1/2 ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          style={{ left: `${minPercentage}%`, top: '50%' }}
          onMouseDown={(e) => {
            e.stopPropagation();
            handleMouseDown('min');
          }}
        />

        {/* 최대값 핸들 */}
        <div
          className={`absolute w-4 h-4 bg-blue-600 rounded-full cursor-grab active:cursor-grabbing transform -translate-x-1/2 -translate-y-1/2 ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          style={{ left: `${maxPercentage}%`, top: '50%' }}
          onMouseDown={(e) => {
            e.stopPropagation();
            handleMouseDown('max');
          }}
        />
      </div>

        {/* 마크 표시 */}
        {marks.length > 0 && (
        <div className="relative mt-2">
            {marks.map((mark, index) => {
            const percentage = getPercentage(mark);
              return (
                <div
                  key={index}
                className="absolute transform -translate-x-1/2"
                style={{ left: `${percentage}%` }}
              >
                <div className="w-0.5 h-2 bg-gray-400" />
                <div className="text-xs text-gray-500 mt-1 whitespace-nowrap">
                  {mark}
                </div>
              </div>
              );
            })}
          </div>
        )}
    </div>
  );
}
