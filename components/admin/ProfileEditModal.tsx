import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { X } from 'lucide-react';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ProfileEditModal({ isOpen, onClose, onUpdate }: ProfileEditModalProps) {
  const { data: session, status, update: updateSession } = useSession();
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
      // 모달이 열릴 때 세션 데이터로 formData 초기화
      const initializeFormData = async () => {
        // 세션이 로딩 중이면 최대 3초 대기
        if (status === 'loading') {
          let attempts = 0;
          while (attempts < 6 && status === 'loading') {
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
          }
        }
        
        // 세션이 있으면 formData 설정
        if (session?.user) {
          // name을 여러 경로에서 확인
          const sessionName = (session.user as any)?.name || '';
          const sessionPhone = (session.user as any)?.phone || (session.user as any)?.email || '';
          
          // 사용자가 이미 입력한 값이 있으면 보존, 없으면 세션 데이터로 채움
          setFormData(prev => ({
            name: prev.name || sessionName,
            phone: prev.phone || sessionPhone,
            password: prev.password || ''
          }));
          
          if (sessionName) {
            setError('');
          } else {
            // 세션 API를 직접 호출하여 이름 가져오기 시도
            try {
              const res = await fetch('/api/auth/session');
              const sessionData = await res.json();
              if (sessionData?.user?.name) {
                setFormData(prev => ({
                  name: prev.name || sessionData.user.name,
                  phone: prev.phone || sessionPhone,
                  password: prev.password || ''
                }));
                setError('');
                return;
              }
            } catch (e) {
              // 무시
            }
            setError('이름 정보를 불러올 수 없습니다. 수동으로 입력해주세요.');
          }
          return;
        }
        
        // 세션이 없으면 세션 API 직접 호출
        if (!session?.user) {
          let attempts = 0;
          const maxAttempts = 10; // 최대 5초 대기
          
          while (attempts < maxAttempts) {
            try {
              const res = await fetch('/api/auth/session');
              const sessionData = await res.json();
              
              if (sessionData?.user) {
                const sessionName = sessionData.user.name || '';
                const sessionPhone = sessionData.user.phone || sessionData.user.email || '';
                
                setFormData(prev => ({
                  name: prev.name || sessionName,
                  phone: prev.phone || sessionPhone,
                  password: prev.password || ''
                }));
                
                if (sessionName) {
                  setError('');
                } else {
                  setError('이름 정보를 불러올 수 없습니다. 수동으로 입력해주세요.');
                }
                return;
              }
            } catch (e) {
              // 무시하고 계속 시도
            }
            
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
          }
          
          // 세션을 찾지 못했으면 에러 표시 (하지만 formData는 초기화하지 않음)
          setError('세션 정보를 불러올 수 없습니다. 수동으로 입력해주세요.');
        }
      };
      
      initializeFormData();
    } else {
      // 모달이 닫힐 때 formData 초기화
      setFormData({ name: '', phone: '', password: '' });
      setError('');
    }
  }, [isOpen, session, status]); // session과 status도 dependency에 추가하여 세션이 로드되면 업데이트

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
        // NextAuth 세션 갱신 (JWT 콜백에서 DB에서 최신 정보 가져옴)
        try {
          await updateSession();
          console.log('세션 갱신 완료');
        } catch (sessionError) {
          console.log('세션 갱신 실패 (무시):', sessionError);
        }
        
        alert('프로필이 수정되었습니다.');
        onUpdate();
        onClose();
        // 약간의 지연 후 새로고침 (세션 갱신 대기)
        setTimeout(() => {
          window.location.reload();
        }, 300);
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

