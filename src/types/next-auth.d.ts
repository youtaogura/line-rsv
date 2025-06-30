declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      username: string;
      tenant_id: string;
    };
  }

  interface User {
    id: string;
    name: string;
    username: string;
    tenant_id: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    tenant_id: string;
    username: string;
  }
}
