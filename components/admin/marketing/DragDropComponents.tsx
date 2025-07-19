'use client';

import React, { useState, useCallback } from 'react';
import { motion, Reorder } from 'framer-motion';
import { Grip, X } from 'lucide-react';

interface DraggableItem {
  id: string;
  content: React.ReactNode;
}

interface DraggableListProps {
  items: DraggableItem[];
  onReorder: (items: DraggableItem[]) => void;
  onRemove?: (id: string) => void;
  className?: string;
}

export const DraggableList: React.FC<DraggableListProps> = ({
  items,
  onReorder,
  onRemove,
  className = ''
}) => {
  return (
    <Reorder.Group
      axis="y"
      values={items}
      onReorder={onReorder}
      className={`space-y-2 ${className}`}
    >
      {items.map((item) => (
        <Reorder.Item
          key={item.id}
          value={item}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center p-4">
            <Grip className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3 cursor-grab active:cursor-grabbing" />
            <div className="flex-1">{item.content}</div>
            {onRemove && (
              <button
                onClick={() => onRemove(item.id)}
                className="ml-3 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
};

// 드래그 가능한 카드 컴포넌트
interface DraggableCardProps {
  id: string;
  children: React.ReactNode;
  onDragEnd?: (id: string, x: number, y: number) => void;
  initialX?: number;
  initialY?: number;
}

export const DraggableCard: React.FC<DraggableCardProps> = ({
  id,
  children,
  onDragEnd,
  initialX = 0,
  initialY = 0
}) => {
  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ x: initialX, y: initialY }}
      onDragEnd={(event, info) => {
        if (onDragEnd) {
          onDragEnd(id, info.point.x, info.point.y);
        }
      }}
      whileDrag={{ scale: 1.05, zIndex: 1000 }}
      className="cursor-move"
    >
      {children}
    </motion.div>
  );
};

// 드롭존 컴포넌트
interface DropZoneProps {
  onDrop: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onDrop,
  accept = '*',
  multiple = true,
  children,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        onDrop(multiple ? files : [files[0]]);
      }
    },
    [onDrop, multiple]
  );

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-lg p-6 transition-all
        ${isDragging 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
          : 'border-gray-300 dark:border-gray-600'
        }
        ${className}
      `}
    >
      {children}
      {isDragging && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-500/10 rounded-lg">
          <p className="text-lg font-medium text-blue-600 dark:text-blue-400">
            드롭하여 업로드
          </p>
        </div>
      )}
    </div>
  );
};

// 칸반 보드 스타일 드래그앤드롭
interface KanbanColumn {
  id: string;
  title: string;
  items: DraggableItem[];
}

interface KanbanBoardProps {
  columns: KanbanColumn[];
  onItemMove: (itemId: string, fromColumn: string, toColumn: string) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ columns, onItemMove }) => {
  const [draggedItem, setDraggedItem] = useState<{ id: string; column: string } | null>(null);

  const handleDragStart = (itemId: string, columnId: string) => {
    setDraggedItem({ id: itemId, column: columnId });
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (draggedItem && draggedItem.column !== columnId) {
      onItemMove(draggedItem.id, draggedItem.column, columnId);
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto">
      {columns.map((column) => (
        <div
          key={column.id}
          className="flex-shrink-0 w-80 bg-gray-100 dark:bg-gray-800 rounded-lg p-4"
          onDragOver={(e) => handleDragOver(e, column.id)}
        >
          <h3 className="font-semibold mb-4 text-gray-900 dark:text-gray-100">
            {column.title}
          </h3>
          <div className="space-y-2">
            {column.items.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(item.id, column.id)}
                onDragEnd={handleDragEnd}
                className="bg-white dark:bg-gray-700 p-3 rounded cursor-move hover:shadow-md transition-shadow"
              >
                {item.content}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};