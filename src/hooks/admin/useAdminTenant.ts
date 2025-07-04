import {
  adminTenantsApi,
  type AdminTenant,
} from '@/lib/api';
import { useCallback, useState } from 'react';

export const useAdminTenant = () => {
  const [tenant, setTenant] = useState<AdminTenant | null>(null);

  const fetchTenant = useCallback(async () => {
    try {
      const response = await adminTenantsApi.getTenant();
      if (response.success) {
        setTenant(response.data || null);
      } else {
        console.error('Error fetching tenant data:', response.error);
      }
    } catch (error) {
      console.error('Fetch tenant error:', error);
    }
  }, []);

  return {
    tenant,
    fetchTenant,
  };
};