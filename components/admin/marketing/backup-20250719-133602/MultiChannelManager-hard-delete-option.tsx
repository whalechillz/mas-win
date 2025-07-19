// 하드 삭제(실제 삭제)를 원하는 경우 - MultiChannelManager.tsx 수정

const deleteContent = async (content) => {
  if (!confirm(`"${content.title}"을(를) 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다!`)) {
    return;
  }

  try {
    // 방법 1: 참조 데이터 먼저 삭제 후 본 데이터 삭제
    // 1단계: naver_publishing에서 참조 삭제
    const { error: refError } = await supabase
      .from('naver_publishing')
      .delete()
      .eq('content_idea_id', content.id);

    if (refError) {
      console.error('Reference delete error:', refError);
      // 참조가 없을 수도 있으므로 계속 진행
    }

    // 2단계: content_ideas 삭제
    const { error } = await supabase
      .from('content_ideas')
      .delete()
      .eq('id', content.id);

    if (error) {
      console.error('Delete error:', error);
      alert(`삭제 실패: ${error.message}`);
      return;
    }

    alert('완전히 삭제되었습니다.');
    await loadContents();
  } catch (error) {
    console.error('Error deleting:', error);
    alert(`삭제 중 오류 발생: ${error.message}`);
  }
};

// 또는 소프트 삭제와 하드 삭제를 모두 제공
const handleDelete = async (content, hardDelete = false) => {
  const message = hardDelete 
    ? `"${content.title}"을(를) 완전히 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다!`
    : `"${content.title}"을(를) 삭제하시겠습니까?`;

  if (!confirm(message)) return;

  if (hardDelete) {
    // 하드 삭제 로직
    // ...
  } else {
    // 소프트 삭제 로직 (현재 방식)
    const { error } = await supabase
      .from('content_ideas')
      .update({ status: 'deleted' })
      .eq('id', content.id);
    // ...
  }
};