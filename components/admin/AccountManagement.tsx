import { useState, useEffect } from 'react';

interface AdminUser {
  id: string;
  name: string;
  phone: string;
  username?: string;
  role: 'admin' | 'editor';
  is_active: boolean;
  created_at: string;
  last_login?: string;
  permissions?: {
    categories?: string[];
    menus?: Record<string, boolean>;
  };
}

interface AccountManagementProps {
  session: any;
}

export default function AccountManagement({ session }: AccountManagementProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: 'editor' as 'admin' | 'editor',
    password: '',
    is_active: true,
    permissions: {
      categories: [] as string[]
    }
  });

  // 카테고리 목록
  const categories = [
    { id: 'hub', name: '허브 시스템', icon: '🎯' },
    { id: 'gallery', name: '갤러리 관리', icon: '🖼️' },
    { id: 'customer', name: '고객 관리', icon: '👥' },
    { id: 'daily-content', name: '데일리 콘텐츠', icon: '📱' },
    { id: 'system', name: '시스템', icon: '⚙️' },
    { id: 'products', name: '제품 관리', icon: '📦' },
    { id: 'finance', name: '재무', icon: '💰' },
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      
      if (data.success) {
        // permissions 안전하게 파싱
        const users = (data.users || []).map((user: any) => {
          if (user.permissions) {
            // JSONB 문자열인 경우 파싱
            if (typeof user.permissions === 'string') {
              try {
                user.permissions = JSON.parse(user.permissions);
              } catch (e) {
                console.warn('permissions 파싱 실패:', e);
                user.permissions = { categories: [] };
              }
            }
            // categories가 배열인지 확인
            if (!Array.isArray(user.permissions.categories)) {
              user.permissions.categories = [];
            }
          } else {
            user.permissions = { categories: [] };
          }
          return user;
        });
        
        setUsers(users);
      } else {
        setError('사용자를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('사용자 로드 오류:', err);
      setError('사용자를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.phone || !formData.password) {
      alert('이름, 전화번호, 비밀번호는 필수입니다.');
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          permissions: formData.role === 'admin' 
            ? { categories: categories.map(c => c.id) }
            : formData.permissions
        }),
      });
      const data = await response.json();
      
      if (data.success) {
        loadUsers();
        setShowCreateModal(false);
        setFormData({ 
          name: '', 
          phone: '', 
          role: 'editor', 
          password: '', 
          is_active: true,
          permissions: { categories: [] }
        });
        alert('사용자가 생성되었습니다.');
      } else {
        alert(data.message || '사용자 생성에 실패했습니다.');
      }
    } catch (err) {
      console.error('사용자 생성 오류:', err);
      alert('사용자 생성 중 오류가 발생했습니다.');
    }
  };

  const handleUpdate = async () => {
    if (!editingUser) return;
    if (!formData.name || !formData.phone) {
      alert('이름과 전화번호는 필수입니다.');
      return;
    }

    try {
      const updateData: any = {
        id: editingUser.id,
        name: formData.name,
        phone: formData.phone,
        role: formData.role,
        is_active: formData.is_active,
        permissions: formData.role === 'admin' 
          ? { categories: categories.map(c => c.id) }
          : formData.permissions
      };
      
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
        loadUsers();
        setShowEditModal(false);
        setEditingUser(null);
        setFormData({ 
          name: '', 
          phone: '', 
          role: 'editor', 
          password: '', 
          is_active: true,
          permissions: { categories: [] }
        });
        alert('사용자 정보가 수정되었습니다.');
      } else {
        alert(data.message || '사용자 수정에 실패했습니다.');
      }
    } catch (err) {
      console.error('사용자 수정 오류:', err);
      alert('사용자 수정 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`정말 "${name}" 사용자를 삭제하시겠습니까?`)) return;

    try {
      const response = await fetch(`/api/admin/users?id=${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      
      if (data.success) {
        loadUsers();
        alert('사용자가 삭제되었습니다.');
      } else {
        alert(data.message || '사용자 삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error('사용자 삭제 오류:', err);
      alert('사용자 삭제 중 오류가 발생했습니다.');
    }
  };

  const openCreateModal = () => {
    // 명시적으로 빈 값으로 초기화 (브라우저 자동완성 방지)
    setFormData({ 
      name: '', 
      phone: '', 
      role: 'editor', 
      password: '', 
      is_active: true,
      permissions: { categories: [] }
    });
    setShowCreateModal(true);
    // 모달이 열린 후 input 필드 강제 초기화
    setTimeout(() => {
      const nameInput = document.querySelector('[data-create-name-input]') as HTMLInputElement;
      const phoneInput = document.querySelector('[data-create-phone-input]') as HTMLInputElement;
      const passwordInput = document.querySelector('[data-create-password-input]') as HTMLInputElement;
      if (nameInput) nameInput.value = '';
      if (phoneInput) phoneInput.value = '';
      if (passwordInput) passwordInput.value = '';
    }, 0);
  };

  const openEditModal = (user: AdminUser) => {
    setEditingUser(user);
    
    // permissions 안전하게 파싱
    let userPermissions = { categories: [] as string[] };
    if (user.permissions) {
      // JSONB 문자열인 경우 파싱
      if (typeof user.permissions === 'string') {
        try {
          userPermissions = JSON.parse(user.permissions);
        } catch (e) {
          console.warn('permissions 파싱 실패:', e);
          userPermissions = { categories: [] };
        }
      } else if (typeof user.permissions === 'object') {
        userPermissions = user.permissions;
      }
    }
    
    // categories가 배열인지 확인
    if (!Array.isArray(userPermissions.categories)) {
      userPermissions.categories = [];
    }
    
    setFormData({
      name: user.name,
      phone: user.phone,
      role: user.role,
      password: '',
      is_active: user.is_active,
      permissions: userPermissions
    });
    setShowEditModal(true);
  };

  const handleCategoryToggle = (categoryId: string) => {
    if (formData.role === 'admin') {
      // admin은 모든 권한이 자동으로 부여되므로 변경 불가
      return;
    }
    
    // permissions가 없거나 categories가 배열이 아닌 경우 초기화
    if (!formData.permissions || !Array.isArray(formData.permissions.categories)) {
      setFormData({
        ...formData,
        permissions: {
          categories: []
        }
      });
      return;
    }
    
    const currentCategories = formData.permissions.categories || [];
    const newCategories = currentCategories.includes(categoryId)
      ? currentCategories.filter(id => id !== categoryId)
      : [...currentCategories, categoryId];
    
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        categories: newCategories
      }
    });
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { label: '총관리자', color: 'bg-red-100 text-red-800' },
      editor: { label: '편집자', color: 'bg-blue-100 text-blue-800' }
    };
    
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.editor;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
      }`}>
        {isActive ? '활성' : '비활성'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* 팀 관리 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">팀 관리</h2>
            <button
              onClick={openCreateModal}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              + 사용자 추가
            </button>
          </div>
          
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">로딩 중...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      이름
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      전화번호
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      역할
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      생성일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      최종 로그인
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(user.is_active)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.last_login ? formatDate(user.last_login) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openEditModal(user)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(user.id, user.name)}
                          className="text-red-600 hover:text-red-900"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="p-6 text-center text-sm text-gray-500">
                  등록된 사용자가 없습니다.
                </div>
              )}
            </div>
          )}
      </div>

      {/* 사용자 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">사용자 추가</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">이름 *</label>
                  <input
                    type="text"
                    data-create-name-input
                    autoComplete="off"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">전화번호 *</label>
                  <input
                    type="tel"
                    data-create-phone-input
                    autoComplete="off"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="010-1234-5678"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">역할 *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'editor' })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="editor">편집자</option>
                    <option value="admin">총관리자</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">비밀번호 *</label>
                  <input
                    type="password"
                    data-create-password-input
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                {formData.role === 'editor' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📋 접근 권한 설정
                    </label>
                    <div className="border border-gray-300 rounded-md p-3 space-y-2 bg-gray-50">
                      {categories.map((category) => (
                        <label
                          key={category.id}
                          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={formData.permissions.categories.includes(category.id)}
                            onChange={() => handleCategoryToggle(category.id)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">
                            {category.icon} {category.name}
                          </span>
                        </label>
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      선택한 카테고리의 모든 메뉴에 접근할 수 있습니다.
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ 
                      name: '', 
                      phone: '', 
                      role: 'editor', 
                      password: '', 
                      is_active: true,
                      permissions: { categories: [] }
                    });
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  취소
                </button>
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  생성
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 사용자 수정 모달 */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">사용자 수정</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">이름 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">전화번호 *</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">역할 *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'editor' })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="editor">편집자</option>
                    <option value="admin">총관리자</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">비밀번호 (변경 시에만 입력)</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="변경하지 않으려면 비워두세요"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">활성 상태</span>
                  </label>
                </div>
                {formData.role === 'editor' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📋 접근 권한 설정
                    </label>
                    <div className="border border-gray-300 rounded-md p-3 space-y-2 bg-gray-50">
                      {categories.map((category) => (
                        <label
                          key={category.id}
                          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={formData.permissions.categories.includes(category.id)}
                            onChange={() => handleCategoryToggle(category.id)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">
                            {category.icon} {category.name}
                          </span>
                        </label>
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      선택한 카테고리의 모든 메뉴에 접근할 수 있습니다.
                    </p>
                  </div>
                )}
                {formData.role === 'admin' && (
                  <div className="border border-blue-200 rounded-md p-3 bg-blue-50">
                    <p className="text-sm text-blue-800">
                      💡 총관리자는 모든 카테고리에 접근할 수 있습니다.
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                    setFormData({ 
                      name: '', 
                      phone: '', 
                      role: 'editor', 
                      password: '', 
                      is_active: true,
                      permissions: { categories: [] }
                    });
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  취소
                </button>
                <button
                  onClick={handleUpdate}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  수정
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
