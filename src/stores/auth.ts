'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, UserRole } from '@/types'

interface AuthState {
  user: User | null
  role: UserRole | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setRole: (role: UserRole | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      isLoading: true,
      setUser: (user) => set({ user }),
      setRole: (role) => set({ role }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null, role: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ role: state.role }),
    }
  )
)