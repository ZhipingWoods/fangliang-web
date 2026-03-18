import { UserLayout } from '@/components/layout/user-layout'

export default function UserRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <UserLayout>{children}</UserLayout>
}