export interface AdminSession {
  user: {
    id: string;
    name?: string | null;
    username: string;
    tenant_id: string;
  };
}

export interface AdminUser {
  id: string;
  name?: string | null;
  username: string;
  tenant_id: string;
}