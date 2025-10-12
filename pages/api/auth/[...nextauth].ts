import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default NextAuth({
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
        
        let user
        if (isPhone) {
          // 전화번호로 로그인
          const { data, error } = await supabase
            .from('admin_users')
            .select('*')
            .eq('phone', cleanPhone)
            .eq('is_active', true)
            .single()
          
          if (error || !data) {
            console.log('전화번호 로그인 실패:', error)
            return null
          }
          user = data
        } else {
          // 아이디로 로그인
          const { data, error } = await supabase
            .from('admin_users')
            .select('*')
            .eq('username', login)
            .eq('is_active', true)
            .single()
          
          if (error || !data) {
            console.log('아이디 로그인 실패:', error)
            return null
          }
          user = data
        }
        
        // 비밀번호 검증
        if (user && await bcrypt.compare(password, user.password_hash)) {
          // 마지막 로그인 시간 업데이트
          await supabase
            .from('admin_users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', user.id)
          
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
    signIn: '/admin/login',
    error: '/admin/login'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30일
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development'
})

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
        
        let user
        if (isPhone) {
          // 전화번호로 로그인
          const { data, error } = await supabase
            .from('admin_users')
            .select('*')
            .eq('phone', cleanPhone)
            .eq('is_active', true)
            .single()
          
          if (error || !data) {
            return null
          }
          user = data
        } else {
          // 아이디로 로그인
          const { data, error } = await supabase
            .from('admin_users')
            .select('*')
            .eq('username', login)
            .eq('is_active', true)
            .single()
          
          if (error || !data) {
            return null
          }
          user = data
        }
        
        // 비밀번호 검증
        if (user && await bcrypt.compare(password, user.password_hash)) {
          // 마지막 로그인 시간 업데이트
          await supabase
            .from('admin_users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', user.id)
          
          return {
            id: user.id,
            name: user.name,
            email: user.phone,
            role: user.role
          }
        }
        
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
    signIn: '/admin/login',
    error: '/admin/login'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30일
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development'
}
