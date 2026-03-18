'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Address } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { MapPin, Plus, Trash2, Edit } from 'lucide-react'
import { toast } from 'sonner'

export default function AddressesPage() {
  const supabase = createClient()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [formData, setFormData] = useState({
    recipient_name: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    detail_address: '',
  })

  useEffect(() => {
    const fetchAddresses = async () => {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (data) {
        setAddresses(data)
      }

      setLoading(false)
    }

    fetchAddresses()
  }, [supabase])

  const handleSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      if (editingAddress) {
        // Update
        const { error } = await supabase
          .from('addresses')
          .update(formData)
          .eq('id', editingAddress.id)

        if (error) throw error
        toast.success('地址已更新')
      } else {
        // Create
        const { error } = await supabase
          .from('addresses')
          .insert({
            ...formData,
            user_id: user.id,
            is_default: addresses.length === 0,
          })

        if (error) throw error
        toast.success('地址已添加')
      }

      // Refresh addresses
      const { data } = await supabase
        .from('addresses')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (data) setAddresses(data)
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      toast.error('操作失败')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个地址吗？')) return

    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('删除失败')
    } else {
      toast.success('地址已删除')
      setAddresses(addresses.filter(a => a.id !== id))
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      // Remove default from all
      await supabase
        .from('addresses')
        .update({ is_default: false })

      // Set new default
      await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', id)

      // Refresh
      const { data } = await supabase
        .from('addresses')
        .select('*')
        .order('is_default', { ascending: false })

      if (data) setAddresses(data)
      toast.success('已设为默认地址')
    } catch (error) {
      toast.error('设置失败')
    }
  }

  const resetForm = () => {
    setFormData({
      recipient_name: '',
      phone: '',
      province: '',
      city: '',
      district: '',
      detail_address: '',
    })
    setEditingAddress(null)
  }

  const openEdit = (address: Address) => {
    setEditingAddress(address)
    setFormData({
      recipient_name: address.recipient_name,
      phone: address.phone,
      province: address.province,
      city: address.city,
      district: address.district,
      detail_address: address.detail_address,
    })
    setIsDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">收货地址</h1>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">收货地址</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              添加地址
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAddress ? '编辑地址' : '添加新地址'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>收货人</Label>
                  <Input
                    value={formData.recipient_name}
                    onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                    placeholder="姓名"
                  />
                </div>
                <div className="space-y-2">
                  <Label>手机号</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="手机号码"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>省份</Label>
                  <Input
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    placeholder="省"
                  />
                </div>
                <div className="space-y-2">
                  <Label>城市</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="市"
                  />
                </div>
                <div className="space-y-2">
                  <Label>区县</Label>
                  <Input
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder="区"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>详细地址</Label>
                <Input
                  value={formData.detail_address}
                  onChange={(e) => setFormData({ ...formData, detail_address: e.target.value })}
                  placeholder="街道、楼栋、门牌号"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
              <Button onClick={handleSubmit}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">暂无收货地址</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <Card key={address.id} className={address.is_default ? 'border-primary' : ''}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    {address.is_default && (
                      <Badge>默认</Badge>
                    )}
                    <p className="font-medium">{address.recipient_name}</p>
                    <p className="text-sm">{address.phone}</p>
                    <p className="text-sm text-muted-foreground">
                      {address.province}{address.city}{address.district}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {address.detail_address}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(address)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(address.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {!address.is_default && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => handleSetDefault(address.id)}
                  >
                    设为默认
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}