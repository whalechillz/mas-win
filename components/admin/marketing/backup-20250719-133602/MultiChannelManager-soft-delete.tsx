// MultiChannelManager.tsx의 loadContents 함수 수정
const loadContents = async () => {
  try {
    let query = supabase
      .from('content_ideas')
      .select('*')
      .neq('status', 'deleted')  // 'deleted' 상태 제외
      .order('created_at', { ascending: false });

    if (selectedPlatform !== 'all') {
      query = query.eq('platform', selectedPlatform);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    setContents(data || []);
  } catch (error) {
    console.error('Error loading contents:', error);
    alert('데이터 로드 실패: ' + error.message);
  } finally {
    setLoading(false);
  }
};

// deleteContent 함수를 소프트 삭제로 변경
const deleteContent = async (content) => {
  if (!confirm(`"${content.title}"을(를) 삭제하시겠습니까?`)) {
    return;
  }

  try {
    // 실제 삭제 대신 상태를 'deleted'로 변경
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