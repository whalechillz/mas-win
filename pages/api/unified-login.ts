import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  try {
    // 1. 이메일로 사용자 조회
    const { data: member, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (error || !member) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 잘못되었습니다.' });
    }

    // 2. 임시로 비밀번호 체크 (실제로는 user_auth 테이블 사용)
    // 초기 비밀번호 1234 체크
    const isValidPassword = password === '1234' || 
      (email === 'taksoo.kim@gmail.com' && password === process.env.ADMIN_PASS);

    if (!isValidPassword) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 잘못되었습니다.' });
    }

    // 3. JWT 토큰 생성
    const token = jwt.sign(
      { 
        id: member.id,
        email: member.email,
        name: member.name,
        role: member.role
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    // 4. 응답
    res.status(200).json({
      success: true,
      token,
      user: {
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        avatar_url: member.avatar_url
      },
      isTempPassword: password === '1234'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '로그인 처리 중 오류가 발생했습니다.' });
  }
}