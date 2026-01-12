import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { supabaseAdmin, checkSupabaseConfig } from '../../../lib/supabase-admin'

// Supabase 설정 확인
checkSupabaseConfig()

// authOptions를 export하여 getServerSession에서 사용 가능하도록 함
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        login: { label: '아이디 또는 전화번호', type: 'text' },
        password: { label: '비밀번호', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.login || !credentials?.password) {
          return null
        }

        const { login, password } = credentials
        
        // 전화번호 형식 체크 (11자리, 하이픈 제거)
        const cleanPhone = login.replace(/[^0-9]/g, '')
        const isPhone = /^010\d{8}$/.test(cleanPhone)
        
        console.log('로그인 시도:', { login, cleanPhone, isPhone, password })
        
        // Supabase 클라이언트 확인
        if (!supabaseAdmin) {
          console.error('❌ Supabase 클라이언트가 초기화되지 않았습니다.')
          console.error('   환경 변수 확인: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
          return null // throw 대신 null 반환하여 NextAuth가 적절히 처리하도록
        }

        let user
        if (isPhone) {
          // 전화번호로 로그인
          const { data, error } = await supabaseAdmin
            .from('admin_users')
            .select('*')
            .eq('phone', cleanPhone)
            .eq('is_active', true)
            .single()
          
          console.log('전화번호 로그인 결과:', { data, error })
          
          if (error || !data) {
            console.log('전화번호 로그인 실패:', error)
            return null
          }
          user = data
        } else {
          // 아이디로 로그인 (username 또는 name으로 검색)
          // username이 null인 경우 name으로도 검색
          const { data: userByUsername, error: usernameError } = await supabaseAdmin
            .from('admin_users')
            .select('*')
            .eq('username', login)
            .eq('is_active', true)
            .single()
          
          if (usernameError || !userByUsername) {
            // username으로 찾지 못하면 name으로 검색
            const { data: userByName, error: nameError } = await supabaseAdmin
              .from('admin_users')
              .select('*')
              .eq('name', login)
              .eq('is_active', true)
              .single()
            
            console.log('아이디/이름 로그인 결과:', { userByUsername, userByName, usernameError, nameError })
            
            if (nameError || !userByName) {
              console.log('아이디/이름 로그인 실패:', nameError)
              return null
            }
            user = userByName
          } else {
            user = userByUsername
          }
        }
        
        console.log('사용자 정보:', { id: user.id, name: user.name, phone: user.phone, role: user.role })
        
        // 비밀번호 검증 (간단한 문자열 비교로 임시 테스트)
        const isValidPassword = await bcrypt.compare(password, user.password_hash)
        console.log('비밀번호 검증 결과:', isValidPassword)
        
        // 임시: 비밀번호가 뒷8자리와 일치하는지 확인
        const expectedPassword = user.phone.slice(-8)
        const isSimplePassword = password === expectedPassword
        
        console.log('비밀번호 검증:', { 
          password, 
          expectedPassword, 
          isSimplePassword,
          isValidPassword 
        })
        
        if (user && (isValidPassword || isSimplePassword)) {
          // 마지막 로그인 시간 업데이트
          try {
            await supabaseAdmin
              .from('admin_users')
              .update({ last_login: new Date().toISOString() })
              .eq('id', user.id)
          } catch (updateError) {
            console.log('로그인 시간 업데이트 실패:', updateError)
          }
          
          console.log('로그인 성공:', user.name, user.role)
          
          // permissions 정보 가져오기 (admin인 경우 모든 권한 부여)
          let userPermissions = user.permissions || { categories: [] };
          if (user.role === 'admin') {
            userPermissions = { 
              categories: ['hub', 'gallery', 'customer', 'daily-content', 'system', 'products', 'finance'] 
            };
          }
          
          return {
            id: user.id,
            name: user.name,
            email: user.phone, // NextAuth는 email 필드를 요구하므로 전화번호를 email에 저장
            role: user.role,
            phone: user.phone,
            permissions: userPermissions
          }
        }
        
        console.log('비밀번호 검증 실패')
        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // 로그인 시 또는 세션 업데이트 시
      if (user) {
        token.id = user.id
        token.role = user.role
        token.phone = (user as any).phone || user.email  // user.email에는 전화번호가 들어있음
        token.name = user.name
        token.permissions = (user as any).permissions || { categories: [] }
      }
      
      // 세션 업데이트 트리거 시 DB에서 최신 정보 가져오기
      if (trigger === 'update' && token.id) {
        try {
          const { data: userData, error } = await supabaseAdmin
            .from('admin_users')
            .select('name, phone, role, permissions')
            .eq('id', token.id)
            .single();
          
          if (userData && !error) {
            token.name = userData.name;
            token.phone = userData.phone;
            token.role = userData.role;
            // permissions 업데이트 (admin인 경우 모든 권한 부여)
            if (userData.role === 'admin') {
              token.permissions = { 
                categories: ['hub', 'gallery', 'customer', 'daily-content', 'system', 'products', 'finance'] 
              };
            } else {
              token.permissions = userData.permissions || { categories: [] };
            }
            console.log('세션 갱신: DB에서 최신 정보 가져옴', { 
              name: userData.name, 
              phone: userData.phone, 
              role: userData.role,
              permissions: token.permissions
            });
          } else {
            console.log('세션 갱신 중 DB 조회 실패:', error);
          }
        } catch (error) {
          console.log('세션 갱신 중 DB 조회 오류:', error);
        }
      }
      
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = (token.id as string) || token.sub
        session.user.role = token.role
        session.user.phone = token.phone
        // name을 명시적으로 설정 (token.name이 있으면 우선 사용)
        session.user.name = (token.name as string) || session.user.name || ''
        // email 필드에도 전화번호가 들어가 있으므로 표시용으로 사용
        if (!session.user.email && token.phone) {
          session.user.email = token.phone
        }
        // permissions 정보 추가
        ;(session.user as any).permissions = token.permissions || { categories: [] }
      }
      return session
    }
  },
  pages: {
    signIn: '/admin/login'
    // error 페이지는 로그인 페이지에서 직접 처리 (리다이렉트 루프 방지)
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30일
    updateAge: 24 * 60 * 60, // 24시간마다 업데이트
  },
  secret: process.env.NEXTAUTH_SECRET || 'masgolf-admin-secret-key-2024',
  debug: process.env.NODE_ENV === 'development',
  // NextAuth URL 명시적 설정 (리다이렉트 루프 방지)
  url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  // 로컬 개발 환경에서 쿠키 설정
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax', // Chrome Beta 호환성을 위해 'lax' 유지
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // 도메인 설정을 선택적으로 적용 (Chrome 버전 호환성)
        // 개발 환경에서는 undefined로 두어 localhost에서도 작동하도록 함
        // Playwright 브라우저 호환성을 위해 명시적으로 undefined 설정
        domain: process.env.NODE_ENV === 'production' 
          ? (process.env.NEXTAUTH_COOKIE_DOMAIN || '.masgolf.co.kr')
          : undefined, // localhost에서는 도메인 없이 설정 (Playwright 호환)
        maxAge: 30 * 24 * 60 * 60, // 30일
      },
    },
    // callbackUrl 제거 - Credentials 방식에서는 불필요
    // OAuth 로그인 시에만 필요하며, 현재는 Credentials만 사용
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' 
          ? (process.env.NEXTAUTH_COOKIE_DOMAIN || '.masgolf.co.kr')
          : undefined, // localhost에서는 도메인 없이 설정 (Playwright 호환)
        maxAge: 30 * 24 * 60 * 60, // 30일
      },
    },
  }
}

export default NextAuth(authOptions)