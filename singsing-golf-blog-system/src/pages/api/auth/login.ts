import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// 새로운 사용자 데이터 (실제로는 데이터베이스에서 관리)
const ADMIN_USERS = [
  {
    id: '1',
    username: 'admin',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // 'password'
    name: '시스템 관리자',
    email: 'admin@masgolf.co.kr',
    role: 'admin',
    permissions: ['read', 'write', 'delete', 'admin'],
    lastLogin: new Date()
  }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    // 입력 검증
    if (!username || !password) {
      return res.status(400).json({ 
        message: '사용자명과 비밀번호를 입력해주세요' 
      });
    }

    // 사용자 찾기
    const user = ADMIN_USERS.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ 
        message: '잘못된 사용자명 또는 비밀번호입니다' 
      });
    }

    // 비밀번호 검증
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        message: '잘못된 사용자명 또는 비밀번호입니다' 
      });
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username,
        role: user.role,
        permissions: user.permissions 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '15m' } // 15분
    );

    // 리프레시 토큰 생성
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
      { expiresIn: '7d' } // 7일
    );

    // 사용자 정보 업데이트 (마지막 로그인 시간)
    user.lastLogin = new Date();

    // 응답 데이터
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      lastLogin: user.lastLogin
    };

    // 쿠키 설정 (보안 강화)
    res.setHeader('Set-Cookie', [
      `refresh_token=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`,
      `auth_token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${15 * 60}`
    ]);

    res.status(200).json({
      success: true,
      message: '로그인 성공',
      token,
      refreshToken,
      user: userData
    });

  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({ 
      message: '서버 오류가 발생했습니다' 
    });
  }
}
