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
          
          return {
            id: user.id,
            name: user.name,
            email: user.phone,
            role: user.role
          }
        }
        
        console.log('비밀번호 검증 실패')
        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.phone = user.email
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub
        session.user.role = token.role
        session.user.phone = token.phone
      }
      return session
    }
  },
  pages: {
    signIn: '/admin/login'
    // error 페이지는 로그인 페이지에서 직접 처리
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30일
    updateAge: 24 * 60 * 60, // 24시간마다 업데이트
  },
  secret: process.env.NEXTAUTH_SECRET || 'masgolf-admin-secret-key-2024',
  debug: process.env.NODE_ENV === 'development',
  // 로컬 개발 환경에서 쿠키 설정
  // NextAuth v4에서는 url 속성 대신 NEXTAUTH_URL 환경 변수를 사용합니다
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax', // Chrome Beta 호환성을 위해 'lax' 유지
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // 프로덕션에서 도메인 설정 (www와 non-www 모두 지원)
        domain: process.env.NODE_ENV === 'production' 
          ? '.masgolf.co.kr'  // 점(.)으로 시작하여 서브도메인 포함
          : undefined,
        // Chrome Beta 호환성을 위한 maxAge 설정
        maxAge: 30 * 24 * 60 * 60, // 30일
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' 
          ? '.masgolf.co.kr'
          : undefined,
        maxAge: 30 * 24 * 60 * 60, // 30일
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' 
          ? '.masgolf.co.kr'
          : undefined,
        maxAge: 30 * 24 * 60 * 60, // 30일
      },
    },
  }
}

export default NextAuth(authOptions)