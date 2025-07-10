import React, { useState } from 'react';

interface Platform {
  id: string;
  name: string;
  type: string;
  url: string;
  is_active: boolean;
}

interface PlatformManagerProps {
  platforms: Platform[];
  supabase: any;
  onUpdate: () => void;
}

export const PlatformManager: React.FC<PlatformManagerProps> = ({
  platforms,
  supabase,
  onUpdate
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Platform | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlatform, setNewPlatform] = useState({
    name: '',
    type: 'website',
    url: '',
    is_active: true
  });

  const platformTypes = [
    { value: 'website', label: '웹사이트' },
    { value: 'naver', label: '네이버 블로그' },
    { value: 'google_ads', label: '구글 광고' },
    { value: 'naver_ads', label: '네이버 광고' },
    { value: 'instagram', label: '인스타그램' },
    { value: 'facebook', label: '페이스북' },
    { value: 'youtube', label: '유튜브' },
    { value: 'shorts', label: '쇼츠' }
  ];

  const handleEdit = (platform: Platform) => {
    setEditingId(platform.id);
    setEditForm({ ...platform });
  };

  const handleSave = async () => {
    if (!editForm) return;

    const { error } = await supabase
      .from('blog_platforms')
      .update({
        name: editForm.name,
        url: editForm.url,
        is_active: editForm.is_active
      })
      .eq('id', editForm.id);

    if (!error) {
      setEditingId(null);
      setEditForm(null);
      onUpdate();
    }
  };

  const handleAdd = async () => {
    const { error } = await supabase
      .from('blog_platforms')
      .insert([newPlatform]);

    if (!error) {
      setShowAddForm(false);
      setNewPlatform({
        name: '',
        type: 'website',
        url: '',
        is_active: true
      });
      onUpdate();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 플랫폼을 삭제하시겠습니까?')) return;

    const { error } = await supabase
      .from('blog_platforms')
      .delete()
      .eq('id', id);

    if (!error) {
      onUpdate();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">플랫폼 관리</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          새 플랫폼
        </button>
      </div>

      {/* 플랫폼 추가 폼 */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-4">새 플랫폼 추가</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">플랫폼 이름</label>
              <input
                type="text"
                value={newPlatform.name}
                onChange={(e) => setNewPlatform({ ...newPlatform, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="예: 네이버 블로그 - 메인"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">플랫폼 유형</label>
              <select
                value={newPlatform.type}
                onChange={(e) => setNewPlatform({ ...newPlatform, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                {platformTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
              <input
                type="url"
                value={newPlatform.url}
                onChange={(e) => setNewPlatform({ ...newPlatform, url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="https://blog.naver.com/example"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              추가
            </button>
          </div>
        </div>
      )}

      {/* 플랫폼 목록 */}
      <div className="space-y-2">
        {platforms.map(platform => (
          <div
            key={platform.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {editingId === platform.id ? (
              <>
                <div className="flex-1 grid grid-cols-3 gap-4">
                  <input
                    type="text"
                    value={editForm?.name || ''}
                    onChange={(e) => setEditForm({ ...editForm!, name: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="url"
                    value={editForm?.url || ''}
                    onChange={(e) => setEditForm({ ...editForm!, url: e.target.value })}
                    className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={handleSave}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setEditForm(null);
                    }}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {platform.type === 'website' ? '🌐' :
                       platform.type === 'naver' ? 'N' :
                       platform.type === 'google_ads' ? 'G' :
                       platform.type === 'instagram' ? '📷' :
                       platform.type === 'facebook' ? 'f' :
                       platform.type === 'youtube' ? '▶️' : '📱'}
                    </span>
                    <div>
                      <h4 className="font-medium text-gray-900">{platform.name}</h4>
                      <p className="text-sm text-gray-500">{platform.url || '(URL 없음)'}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(platform)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(platform.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <div className={`w-3 h-3 rounded-full ${platform.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};