import { useState, useCallback } from 'react';
import type { User } from '@/lib/supabase';

export type UserMode = 'existing' | 'new';

interface UseUserSelectionProps {
  availableUsers?: User[];
  onUserModeChange?: (mode: UserMode) => void;
  onUserSelect?: (user: User | null) => void;
}

export interface UseUserSelectionReturn {
  userMode: UserMode;
  selectedUser: User | null;
  setUserMode: (mode: UserMode) => void;
  setSelectedUser: (user: User | null) => void;
  handleUserModeChange: (mode: UserMode) => void;
  handleUserSelect: (userId: string) => void;
  resetSelection: () => void;
}

export function useUserSelection({
  availableUsers = [],
  onUserModeChange,
  onUserSelect,
}: UseUserSelectionProps = {}): UseUserSelectionReturn {
  const [userMode, setUserMode] = useState<UserMode>('existing');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleUserModeChange = useCallback((mode: UserMode) => {
    setUserMode(mode);
    setSelectedUser(null);
    onUserModeChange?.(mode);
    onUserSelect?.(null);
  }, [onUserModeChange, onUserSelect]);

  const handleUserSelect = useCallback((userId: string) => {
    const user = availableUsers.find(u => u.user_id === userId) || null;
    setSelectedUser(user);
    onUserSelect?.(user);
  }, [availableUsers, onUserSelect]);

  const resetSelection = useCallback(() => {
    setUserMode('existing');
    setSelectedUser(null);
    onUserSelect?.(null);
  }, [onUserSelect]);

  return {
    userMode,
    selectedUser,
    setUserMode,
    setSelectedUser,
    handleUserModeChange,
    handleUserSelect,
    resetSelection,
  };
}