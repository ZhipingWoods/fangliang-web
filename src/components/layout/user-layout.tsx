'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'
import { signOut } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { ShoppingBag, User, LogOut, Package, MapPin } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export function UserNav() {
  const { user, role } = useAuthStore()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  if (!user) {
    return (
      <Link href="/login">
        <Button variant="ghost">登录</Button>
      </Link>
    )
  }

  const initials = user.email?.charAt(0).toUpperCase() || 'U'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuItem>
          <Link href="/orders" className="flex items-center w-full">
            <Package className="mr-2 h-4 w-4" />
            我的订单
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Link href="/addresses" className="flex items-center w-full">
            <MapPin className="mr-2 h-4 w-4" />
            收货地址
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Link href="/profile" className="flex items-center w-full">
            <User className="mr-2 h-4 w-4" />
            个人资料
          </Link>
        </DropdownMenuItem>
        {role === 'admin' && (
          <DropdownMenuItem>
            <Link href="/admin" className="flex items-center w-full">
              <ShoppingBag className="mr-2 h-4 w-4" />
              商户中心
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          退出登录
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuthStore()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <ShoppingBag className="h-6 w-6" />
                <span className="text-xl font-bold">方良商城</span>
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                <Link
                  href="/"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname === '/' ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  首页
                </Link>
                {user && (
                  <Link
                    href="/orders"
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      pathname.startsWith('/orders') ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    我的订单
                  </Link>
                )}
                {user && (
                  <Link
                    href="/addresses"
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      pathname.startsWith('/addresses') ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    收货地址
                  </Link>
                )}
              </nav>
            </div>
            <UserNav />
          </div>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2024 方良商城. All rights reserved.
        </div>
      </footer>
    </div>
  )
}