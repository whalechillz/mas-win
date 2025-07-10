import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { serialize } from 'cookie';
// bcrypt 없이 평문 비밀번호 사용 (개발용)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요.' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 사용자 찾기
    const { data: member, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (error || !member) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 잘못되었습니다.' });
    }

    // 비밀번호 확인 (임시로 평문 비교, 나중에 bcrypt 사용)
    if (member.password !== password) {
      // 로그인 실패 기록
      await supabase
        .from('login_history')
        .insert({
          team_member_id: member.id,
          ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
          user_agent: req.headers['user-agent'],
          success: false
        });

      return res.status(401).json({ error: '이메일 또는 비밀번호가 잘못되었습니다.' });
    }

    // 로그인 성공
    // 마지막 로그인 시간 업데이트
    await supabase
      .from('team_members')
      .update({ last_login: new Date().toISOString() })
      .eq('id', member.id);

    // 로그인 히스토리 기록
    await supabase
      .from('login_history')
      .insert({
        team_member_id: member.id,
        ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        user_agent: req.headers['user-agent'],
        success: true
      });

    // 세션 쿠키 설정
    const cookie = serialize('team-member-auth', JSON.stringify({
      id: member.id,
      email: member.email,
      name: member.name,
      role: member.role
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: '/'
    });

    res.setHeader('Set-Cookie', cookie);

    return res.status(200).json({
      success: true,
      member: {
        id: member.id,
        email: member.email,
        name: member.name,
        role: member.role,
        must_change_password: member.must_change_password
      }
    });

  } catch (error) {
    console.error('로그인 오류:', error);
    return res.status(500).json({ error: '로그인 처리 중 오류가 발생했습니다.' });
  }
}