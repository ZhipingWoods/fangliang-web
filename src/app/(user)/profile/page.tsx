'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { User, Mail, Phone, Save } from 'lucide-react'
import { toast } from 'sonner'

export default function ProfilePage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
  })

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile(data)
        setFormData({
          full_name: data.full_name || '',
          phone: data.phone || '',
        })
      }

      setLoading(false)
    }

    fetchProfile()
  }, [supabase])

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setSaving(true)

    const { error } = await supabase
      .from('profiles')
      .update(formData)
      .eq('id', user.id)

    if (error) {
      toast.error('保存失败')
    } else {
      toast.success('保存成功')
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">个人资料</h1>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
          <CardDescription>修改您的个人信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <Input id="email" value={profile?.id ? '' : ''} disabled className="bg-gray-50" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">姓名</Label>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="请输入姓名"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">手机号</Label>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="请输入手机号"
              />
            </div>
          </div>

          <Button className="w-full" onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? '保存中...' : '保存'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}