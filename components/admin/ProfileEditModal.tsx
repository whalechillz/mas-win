import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { X } from 'lucide-react';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ProfileEditModal({ isOpen, onClose, onUpdate }: ProfileEditModalProps) {
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 세션을 기다리는 로직 추가
  useEffect(() => {
    if (isOpen) {
      // 세션이 로딩 중이면 기다림
      if (status === 'loading') {
        setError('세션 정보를 불러오는 중...');
        return;
      }
      
      // 세션이 있으면 즉시 formData 설정
      if (session?.user) {
        setFormData({
          name: (session.user as any)?.name || '',
          phone: (session.user as any)?.phone || (session.user as any)?.email || '',
          password: ''
        });
        setError('');
        return;
      }
      
      // 세션이 없으면 세션 API를 직접 호출하여 기다리기
      const waitForSession = async () => {
        let attempts = 0;
        const maxAttempts = 10; // 최대 5초 대기 (500ms * 10)
        
        while (attempts < maxAttempts) {
          try {
            const res = await fetch('/api/auth/session');
            const sessionData = await res.json();
            
            if (sessionData?.user) {
              setFormData({
                name: sessionData.user.name || '',
                phone: sessionData.user.phone || sessionData.user.email || '',
                password: ''
              });
              setError('');
              return;
            }
          } catch (e) {
            // 무시하고 계속 시도
          }
          
          await new Promise(resolve => setTimeout(resolve, 500));
          attempts++;
        }
        
        // 세션을 찾지 못했지만 전화번호라도 있으면 사용
        if (session?.user?.phone || session?.user?.email) {
          setFormData({
            name: (session.user as any)?.name || '',
            phone: (session.user as any)?.phone || (session.user as any)?.email || '',
            password: ''
          });
          setError('이름 정보를 불러올 수 없습니다. 수동으로 입력해주세요.');
        } else {
          // 전화번호도 없으면 에러 표시
          setError('세션 정보를 불러올 수 없습니다. 페이지를 새로고침해주세요.');
          setFormData({
            name: '',
            phone: '',
            password: ''
          });
        }
      };
      
      // 세션이 없으면 기다리기 시작
      waitForSession();
    }
  }, [isOpen, session, status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const currentUser = session?.user;
    if (!currentUser) {
      setError('사용자 정보를 불러올 수 없습니다.');
      setIsLoading(false);
      return;
    }

    const userId = (currentUser as any)?.id;
    if (!userId) {
      setError('사용자 ID를 찾을 수 없습니다.');
      setIsLoading(false);
      return;
    }

    if (!formData.name || formData.name.trim() === '') {
      setError('이름은 필수입니다.');
      setIsLoading(false);
      return;
    }

    try {
      const updateData: any = {
        id: userId,
        name: formData.name.trim(),
      };
      
      if (formData.phone) {
        updateData.phone = formData.phone.replace(/[^0-9]/g, '');
      }
      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('프로필이 수정되었습니다. 페이지를 새로고침합니다.');
        onUpdate();
        onClose();
        window.location.reload();
      } else {
        setError(data.message || '프로필 수정에 실패했습니다.');
      }
    } catch (err) {
      console.error('프로필 수정 오류:', err);
      setError('프로필 수정 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">개인정보 수정</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="010-1234-5678"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 (변경 시에만 입력)</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="변경하지 않으려면 비워두세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-400"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

