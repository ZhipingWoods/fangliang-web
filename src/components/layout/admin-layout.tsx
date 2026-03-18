'use client'

import { useAuthStore } from '@/stores/auth'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'

export function AdminLayout({ children }: { children: ReactNode }) {
  const { role, isLoading } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && role !== 'admin' && pathname.startsWith('/admin')) {
      router.push('/')
    }
  }, [role, isLoading, router, pathname])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (role !== 'admin' && pathname.startsWith('/admin')) {
    return null
  }

  return <>{children}</>
}