import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'cookie';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 쿠키에서 인증 정보 확인
  const cookies = parse(req.headers.cookie || '');
  const authCookie = cookies['team-member-auth'];
  
  if (!authCookie) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }

  const authData = JSON.parse(authCookie);
  const { currentPassword, newPassword, confirmPassword } = req.body;

  // 유효성 검사
  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: '모든 필드를 입력해주세요.' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: '새 비밀번호가 일치하지 않습니다.' });
  }

  if (newPassword.length < 4) {
    return res.status(400).json({ error: '비밀번호는 최소 4자 이상이어야 합니다.' });
  }

  if (currentPassword === newPassword) {
    return res.status(400).json({ error: '새 비밀번호는 현재 비밀번호와 달라야 합니다.' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 현재 비밀번호 확인
    const { data: member, error } = await supabase
      .from('team_members')
      .select('password')
      .eq('id', authData.id)
      .single();

    if (error || !member) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    // 현재 비밀번호 검증
    if (member.password !== currentPassword) {
      return res.status(401).json({ error: '현재 비밀번호가 일치하지 않습니다.' });
    }

    // 새 비밀번호로 업데이트
    const { error: updateError } = await supabase
      .from('team_members')
      .update({
        password: newPassword,
        password_changed_at: new Date().toISOString(),
        must_change_password: false
      })
      .eq('id', authData.id);

    if (updateError) {
      throw updateError;
    }

    return res.status(200).json({
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다.'
    });

  } catch (error) {
    console.error('비밀번호 변경 오류:', error);
    return res.status(500).json({ error: '비밀번호 변경 중 오류가 발생했습니다.' });
  }
}