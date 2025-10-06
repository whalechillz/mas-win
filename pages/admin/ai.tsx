import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AdminAIRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/ai-dashboard');
  }, [router]);
  return null;
}


