'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Order, Address } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, MapPin, Package, Calendar } from 'lucide-react'
import Link from 'next/link'

const statusMap = {
  pending: { label: '待确认', color: 'bg-yellow-500' },
  confirmed: { label: '已确认', color: 'bg-blue-500' },
  shipped: { label: '已发货', color: 'bg-purple-500' },
  completed: { label: '已完成', color: 'bg-green-500' },
  cancelled: { label: '已取消', color: 'bg-gray-500' },
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [order, setOrder] = useState<Order | null>(null)
  const [address, setAddress] = useState<Address | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrder = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*, product:products(*))
        `)
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single()

      if (data) {
        setOrder(data)

        if (data.address_id) {
          const { data: addrData } = await supabase
            .from('addresses')
            .select('*')
            .eq('id', data.address_id)
            .single()

          if (addrData) {
            setAddress(addrData)
          }
        }
      }

      setLoading(false)
    }

    fetchOrder()
  }, [supabase, params.id])

  const handleCancel = async () => {
    if (!confirm('确定要取消这个订单吗？')) return

    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', params.id)

    if (!error) {
      setOrder({ ...order!, status: 'cancelled' })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">订单不存在</p>
        <Link href="/orders">
          <Button className="mt-4">返回订单列表</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        返回
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>订单详情</CardTitle>
                <Badge className={statusMap[order.status].color}>
                  {statusMap[order.status].label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      {item.product?.images?.[0] && (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="h-20 w-20 object-cover rounded"
                        />
                      )}
                      <div>
                        <p className="font-medium">{item.product?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.color && `${item.color} `}
                          {item.size && `${item.size} `}
                        </p>
                        <p className="text-sm">
                          ¥{item.price.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-lg">¥{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t flex justify-between items-center">
                <span className="text-lg">订单总价</span>
                <span className="text-2xl font-bold">¥{order.total_amount.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                收货地址
              </CardTitle>
            </CardHeader>
            <CardContent>
              {address ? (
                <div className="space-y-1">
                  <p className="font-medium">{address.recipient_name}</p>
                  <p className="text-sm">{address.phone}</p>
                  <p className="text-sm text-muted-foreground">
                    {address.province}{address.city}{address.district}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {address.detail_address}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">无收货地址</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                订单信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">订单号</span>
                <span className="text-sm">{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">下单时间</span>
                <span className="text-sm">{new Date(order.created_at).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">订单日期</span>
                <span className="text-sm">{order.order_date}</span>
              </div>
            </CardContent>
          </Card>

          {order.status === 'pending' && (
            <Button variant="destructive" className="w-full" onClick={handleCancel}>
              取消订单
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}