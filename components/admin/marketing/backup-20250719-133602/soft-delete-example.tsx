// MultiChannelManager.tsx 수정 - 삭제 버튼 부분만

// 기존 삭제 코드를 소프트 삭제로 변경
<button
  onClick={() => deleteContent(content)}
  className="text-red-600 hover:text-red-800"
>
  <Trash2 className="w-4 h-4" />
</button>

// deleteContent 함수 수정
const deleteContent = async (content) => {
  if (!confirm(`"${content.title}"을(를) 삭제하시겠습니까?`)) {
    return;
  }

  try {
    // 실제 삭제 대신 상태 변경 (소프트 삭제)
    const { error } = await supabase
      .from('content_ideas')
      .update({ status: 'deleted' })
      .eq('id', content.id);

    if (error) {
      console.error('Delete error:', error);
      alert(`삭제 실패: ${error.message}`);
      return;
    }

    alert('삭제되었습니다.');
    await loadContents();
  } catch (error) {
    console.error('Error deleting:', error);
    alert(`삭제 중 오류 발생: ${error.message}`);
  }
};

// loadContents 함수에서 deleted 상태 제외
const loadContents = async () => {
  try {
    let query = supabase
      .from('content_ideas')
      .select('*')
      .neq('status', 'deleted')  // deleted 상태 제외
      .order('created_at', { ascending: false });

    if (selectedPlatform !== 'all') {
      query = query.eq('platform', selectedPlatform);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    setContents(data || []);
  } catch (error) {
    console.error('Error loading contents:', error);
  } finally {
    setLoading(false);
  }
};