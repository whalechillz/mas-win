import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase-admin';
import bcrypt from 'bcryptjs';
import { requireAuth } from '../../../lib/api-auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // ✅ 인증 체크 추가 (관리자만 접근 가능)
  try {
    await requireAuth(req, res, { requireAdmin: true });
  } catch (error) {
    return; // requireAuth에서 이미 응답을 보냄
  }

  if (!supabaseAdmin) {
    return res.status(500).json({
      success: false,
      message: 'Supabase 클라이언트 초기화 실패'
    });
  }

  try {
    // GET - 사용자 목록 조회
    if (req.method === 'GET') {
      const { data: users, error } = await supabaseAdmin
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('사용자 로드 오류:', error);
        return res.status(500).json({
          success: false,
          message: '사용자 데이터 로드 실패',
          error: error.message
        });
      }

      return res.status(200).json({
        success: true,
        users: users || []
      });
    }

    // POST - 사용자 생성
    if (req.method === 'POST') {
      const { name, phone, role, password, permissions } = req.body;

      if (!name || !phone || !role || !password) {
        return res.status(400).json({
          success: false,
          message: '이름, 전화번호, 역할, 비밀번호는 필수입니다.'
        });
      }

      // 전화번호 중복 확인
      const { data: existingUser } = await supabaseAdmin
        .from('admin_users')
        .select('id')
        .eq('phone', phone.replace(/[^0-9]/g, ''))
        .single();

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '이미 등록된 전화번호입니다.'
        });
      }

      // 비밀번호 해시 생성
      const passwordHash = await bcrypt.hash(password, 10);

      // permissions 기본값 설정 (editor인 경우)
      const defaultPermissions = role === 'admin' 
        ? { categories: ['hub', 'gallery', 'customer', 'daily-content', 'system', 'products', 'finance'] }
        : (permissions || { categories: [] });

      const { data: newUser, error: createError } = await supabaseAdmin
        .from('admin_users')
        .insert({
          name,
          phone: phone.replace(/[^0-9]/g, ''),
          role,
          password_hash: passwordHash,
          is_active: true,
          permissions: defaultPermissions
        })
        .select()
        .single();

      if (createError) {
        console.error('사용자 생성 오류:', createError);
        return res.status(500).json({
          success: false,
          message: '사용자 생성 실패',
          error: createError.message
        });
      }

      return res.status(200).json({
        success: true,
        user: newUser
      });
    }

    // PUT - 사용자 수정
    if (req.method === 'PUT') {
      const { id, name, phone, role, password, is_active, permissions } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: '사용자 ID는 필수입니다.'
        });
      }

      // 필수 필드 검증
      if (name !== undefined && (!name || name.trim() === '')) {
        return res.status(400).json({
          success: false,
          message: '이름은 필수이며 비어있을 수 없습니다.'
        });
      }

      if (phone !== undefined && (!phone || phone.trim() === '')) {
        return res.status(400).json({
          success: false,
          message: '전화번호는 필수이며 비어있을 수 없습니다.'
        });
      }

      if (role !== undefined && role !== 'admin' && role !== 'editor') {
        return res.status(400).json({
          success: false,
          message: '역할은 admin 또는 editor여야 합니다.'
        });
      }

      const updateData: any = {};
      if (name !== undefined) updateData.name = name.trim();
      if (phone !== undefined) updateData.phone = phone.replace(/[^0-9]/g, '');
      if (role !== undefined) {
        updateData.role = role;
        // admin으로 변경 시 모든 권한 부여, editor로 변경 시 permissions 유지
        if (role === 'admin') {
          updateData.permissions = { categories: ['hub', 'gallery', 'customer', 'daily-content', 'system', 'products', 'finance'] };
        }
      }
      if (typeof is_active === 'boolean') updateData.is_active = is_active;
      if (password && password.trim() !== '') {
        updateData.password_hash = await bcrypt.hash(password, 10);
      }
      // permissions 업데이트 (role이 admin이 아닌 경우에만)
      if (permissions !== undefined && updateData.role !== 'admin') {
        updateData.permissions = permissions;
      }

      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('admin_users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('사용자 수정 오류:', updateError);
        return res.status(500).json({
          success: false,
          message: '사용자 수정 실패',
          error: updateError.message
        });
      }

      return res.status(200).json({
        success: true,
        user: updatedUser
      });
    }

    // DELETE - 사용자 삭제
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({
          success: false,
          message: '사용자 ID는 필수입니다.'
        });
      }

      const { error: deleteError } = await supabaseAdmin
        .from('admin_users')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('사용자 삭제 오류:', deleteError);
        return res.status(500).json({
          success: false,
          message: '사용자 삭제 실패',
          error: deleteError.message
        });
      }

      return res.status(200).json({
        success: true,
        message: '사용자가 삭제되었습니다.'
      });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error: any) {
    console.error('API 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류',
      error: error.message
    });
  }
}

