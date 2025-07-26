import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { apiClient } from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  refreshUser: (userData?: any) => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: (user: User, token: string) => {
        set({ 
          user, 
          token, 
          isAuthenticated: true,
          isLoading: false 
        });
      },

      logout: () => {
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false,
          isLoading: false 
        });
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ 
            user: { ...currentUser, ...userData } 
          });
        }
      },

      refreshUser: async (userData?: any) => {
        try {
          if (userData) {
            // If userData is provided, update the store directly
            const currentUser = get().user;
            if (currentUser) {
              set({ 
                user: { ...currentUser, ...userData } 
              });
            } else {
              set({ user: userData });
            }
          } else {
            // If no userData provided, fetch fresh data from API
            const currentToken = get().token;
            if (currentToken) {
              const response = await apiClient.getCurrentUser();
              if (response.success && response.data) {
                set({ 
                  user: response.data,
                  isAuthenticated: true 
                });
              }
            }
          }
        } catch (error) {
          console.error('Failed to refresh user:', error);
          // Don't logout on refresh failure, just log the error
          // The user might be offline or there might be a temporary network issue
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

// Helper hook for easier access to user data
export const useUser = () => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  
  return { user, isAuthenticated, refreshUser };
};

// Helper hook for auth actions
export const useAuth = () => {
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const updateUser = useAuthStore((state) => state.updateUser);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const setLoading = useAuthStore((state) => state.setLoading);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  return { 
    login, 
    logout, 
    updateUser, 
    refreshUser, 
    setLoading, 
    isLoading, 
    isAuthenticated 
  };
};
