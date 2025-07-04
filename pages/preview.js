import { useRouter } from 'next/router';

export default function PreviewPage() {
  const router = useRouter();
  const { file } = router.query;

  if (!file) {
    return <div>파일을 선택해주세요.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{
        backgroundColor: '#002147',
        color: 'white',
        padding: '15px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{ margin: 0 }}>미리보기: {file}</h2>
        <button
          onClick={() => router.push('/versions')}
          style={{
            padding: '8px 16px',
            backgroundColor: 'white',
            color: '#002147',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          목록으로
        </button>
      </div>
      <iframe
        src={`/versions/${file}`}
        style={{
          width: '100%',
          height: '100%',
          border: 'none'
        }}
      />
    </div>
  );
}