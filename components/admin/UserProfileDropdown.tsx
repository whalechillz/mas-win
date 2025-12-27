import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';

interface UserProfileDropdownProps {
  onLogout: () => void;
  onEditProfile: () => void;
}

export default function UserProfileDropdown({ onLogout, onEditProfile }: UserProfileDropdownProps) {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 세션이 없어도 기본 UI는 표시 (로딩 중이거나 세션이 없을 때)
  const userName = (session?.user as any)?.name || '관리자';
  const userRole = (session?.user as any)?.role === 'admin' ? '총관리자' : '편집자';
  
  // 세션이 없을 때는 로딩 표시
  if (status === 'loading') {
    return (
      <div className="flex items-center space-x-2 px-3 py-2">
        <div className="w-8 h-8 rounded-full bg-gray-300 animate-pulse"></div>
        <div className="text-left hidden sm:block">
          <div className="text-sm font-medium text-gray-400">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium">
            {userName.charAt(0)}
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-sm font-medium text-gray-700">{userName}</div>
            <div className="text-xs text-gray-500">{userRole}</div>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-50 border border-gray-200">
          <div className="py-1">
            {/* 사용자 정보 */}
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="text-sm font-medium text-gray-900">{userName}</div>
              <div className="text-xs text-gray-500 mt-1">
                {(session?.user as any)?.phone || session?.user?.email || '-'}
              </div>
              <div className="text-xs text-gray-500 mt-1">{userRole}</div>
            </div>

            {/* 개인정보 수정 */}
            <button
              onClick={() => {
                setIsOpen(false);
                if (session?.user || status === 'authenticated') {
                  onEditProfile();
                } else {
                  alert('세션 정보를 불러올 수 없습니다. 페이지를 새로고침해주세요.');
                }
              }}
              disabled={status === 'loading'}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Settings className="w-4 h-4 mr-3 text-gray-400" />
              개인정보 수정
            </button>

            {/* 로그아웃 */}
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3" />
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

