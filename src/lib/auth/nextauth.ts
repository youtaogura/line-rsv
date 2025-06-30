import CredentialsProvider from 'next-auth/providers/credentials';
import { supabase } from '@/lib/supabase';
import {
  AUTH_CONFIG,
  type JwtCallbackParams,
  type SessionCallbackParams,
} from './config';

type AuthUser = {
  id: string;
  name?: string | null;
  username: string;
  tenant_id: string;
};

async function getAdminUser(
  username: string,
  password: string
): Promise<AuthUser | null> {
  try {
    // NOTE: この実装は簡易的なものです。
    // 本番環境では適切なパスワードハッシュ化を実装してください。
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, username, name, tenant_id')
      .eq('username', username)
      .eq('password', password) // 実際にはハッシュ化されたパスワードとの比較
      .single();

    if (error) {
      console.log('Admin user query error:', error);
      return null;
    }

    if (!data) {
      console.log('Admin user not found');
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      username: data.username,
      tenant_id: data.tenant_id,
    };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

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

        const user = await getAdminUser(
          credentials.username,
          credentials.password
        );
        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: JwtCallbackParams) {
      if (user) {
        token.username = user.username;
        token.name = user.name;
        token.tenant_id = user.tenant_id;
      }
      return token;
    },
    async session({ session, token }: SessionCallbackParams) {
      if (token) {
        session.user = {
          id: token.sub,
          name: token.name,
          username: token.username,
          tenant_id: token.tenant_id,
        };
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: AUTH_CONFIG.JWT_MAX_AGE_HOURS * 60 * 60,
  },
  pages: {
    signIn: AUTH_CONFIG.SIGN_IN_PATH,
  },
};
