import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import CredentialsProvider from 'next-auth/providers/credentials';

const TOKEN_EXPIRATION = 60 * 60 * 8;

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          const { data: admin, error } = await supabase
            .from('admins')
            .select('*')
            .eq('username', credentials.username)
            .single();

          if (error || !admin) {
            return null;
          }

          const isValidPassword = await bcrypt.compare(
            credentials.password,
            admin.password_hash
          );

          if (!isValidPassword) {
            return null;
          }

          return {
            id: admin.id,
            name: admin.name,
            username: admin.username,
            tenant_id: admin.tenant_id,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt' as const,
    maxAge: TOKEN_EXPIRATION,
  },
  jwt: {
    maxAge: TOKEN_EXPIRATION,
  },
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user }: any) {
      if (user) {
        token.tenant_id = user.tenant_id;
        token.username = user.username;
        token.iat = Math.floor(Date.now() / 1000);
        token.exp = Math.floor(Date.now() / 1000) + TOKEN_EXPIRATION;
      }
      return token;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: any) {
      if (session.user) {
        session.user.tenant_id = token.tenant_id;
        session.user.username = token.username;
      }
      return session;
    },
  },
  pages: {
    signIn: '/admin/login',
  },
};
