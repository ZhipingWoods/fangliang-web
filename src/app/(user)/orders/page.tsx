'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order, OrderItem } from '@/types'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Package, Eye, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

const statusMap = {
  pending: { label: '待确认', color: 'bg-yellow-500' },
  confirmed: { label: '已确认', color: 'bg-blue-500' },
  shipped: { label: '已发货', color: 'bg-purple-500' },
  completed: { label: '已完成', color: 'bg-green-500' },
  cancelled: { label: '已取消', color: 'bg-gray-500' },
}

export default function OrdersPage() {
  const supabase = createClient()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*, product:products(*)),
          address:addresses(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data) {
        setOrders(data)
      }

      setLoading(false)
    }

    fetchOrders()
  }, [supabase])

  const handleDelete = async (orderId: string) => {
    if (!confirm('确定要删除这个订单吗？')) return

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId)

    if (error) {
      toast.error('删除失败')
    } else {
      toast.success('订单已删除')
      setOrders(orders.filter(o => o.id !== orderId))
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">我的订单</h1>
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
      <h1 className="text-2xl font-bold mb-6">我的订单</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">暂无订单</p>
          <Link href="/">
            <Button className="mt-4">去购物</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  订单号: {order.id.slice(0, 8)}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={statusMap[order.status].color}>
                    {statusMap[order.status].label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        {item.product?.images?.[0] && (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="h-12 w-12 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="font-medium">{item.product?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.color && `${item.color} `}
                            {item.size && `${item.size} `}
                            × {item.quantity}
                          </p>
                        </div>
                      </div>
                      <p className="font-medium">¥{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <div>
                    <span className="text-muted-foreground">合计: </span>
                    <span className="text-xl font-bold">¥{order.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/orders/${order.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        详情
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(order.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      删除
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}