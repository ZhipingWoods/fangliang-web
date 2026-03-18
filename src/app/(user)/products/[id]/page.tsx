'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Product, Address } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Minus, Plus, ShoppingCart, Check, MapPin, Package } from 'lucide-react'
import { toast } from 'sonner'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [isOrdering, setIsOrdering] = useState(false)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [newAddress, setNewAddress] = useState({
    recipient_name: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    detail_address: '',
  })

  useEffect(() => {
    const fetchProduct = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('id', params.id)
        .single()

      if (data) {
        setProduct(data)
        if (data.colors?.length) setSelectedColor(data.colors[0])
        if (data.sizes?.length) setSelectedSize(data.sizes[0])
      }

      setLoading(false)
    }

    fetchProduct()
  }, [supabase, params.id])

  useEffect(() => {
    const fetchAddresses = async () => {
      const { data } = await supabase
        .from('addresses')
        .select('*')
        .order('is_default', { ascending: false })

      if (data) {
        setAddresses(data)
        const defaultAddress = data.find(a => a.is_default)
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id)
        }
      }
    }

    fetchAddresses()
  }, [supabase])

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 99)) {
      setQuantity(newQuantity)
    }
  }

  const handleCreateOrder = async () => {
    if (!product) return

    if (!selectedAddressId && !newAddress.recipient_name) {
      toast.error('请填写收货地址')
      return
    }

    setIsOrdering(true)

    try {
      let addressId = selectedAddressId

      // Create new address if needed
      if (!addressId && newAddress.recipient_name) {
        const { data: address, error: addressError } = await supabase
          .from('addresses')
          .insert({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            ...newAddress,
            is_default: addresses.length === 0,
          })
          .select()
          .single()

        if (addressError) throw addressError
        addressId = address.id
      }

      if (!addressId) {
        toast.error('请选择收货地址')
        setIsOrdering(false)
        return
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          address_id: addressId,
          total_amount: product.price * quantity,
          status: 'pending',
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Create order item
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: product.id,
          quantity,
          price: product.price,
          color: selectedColor,
          size: selectedSize,
        })

      if (itemError) throw itemError

      toast.success('订单创建成功')
      router.push('/orders')
    } catch (error) {
      console.error('Error creating order:', error)
      toast.error('创建订单失败')
    } finally {
      setIsOrdering(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="h-[500px] w-full" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">商品不存在</p>
      </div>
    )
  }

  const totalPrice = product.price * quantity

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
            {product.images && product.images[selectedImage] ? (
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <ShoppingCart className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border-2 ${
                    selectedImage === i ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            {product.category && (
              <p className="text-muted-foreground">{product.category.name}</p>
            )}
          </div>

          <div className="text-3xl font-bold text-primary">
            ¥{product.price.toFixed(2)}
          </div>

          {product.description && (
            <p className="text-muted-foreground">{product.description}</p>
          )}

          <div className="text-sm text-muted-foreground">
            库存: {product.stock} 件
          </div>

          {/* Color Selection */}
          {product.colors && product.colors.length > 0 && (
            <div className="space-y-2">
              <Label>颜色</Label>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <Button
                    key={color}
                    variant={selectedColor === color ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedColor(color)}
                  >
                    {color}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selection */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="space-y-2">
              <Label>尺码</Label>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <Button
                    key={size}
                    variant={selectedSize === size ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="space-y-2">
            <Label>数量</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value)
                  if (val >= 1 && val <= product.stock) {
                    setQuantity(val)
                  }
                }}
                className="w-20 text-center"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= product.stock}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center mb-4">
              <span className="text-muted-foreground">合计:</span>
              <span className="text-2xl font-bold">¥{totalPrice.toFixed(2)}</span>
            </div>
            <Button
              className="w-full"
              size="lg"
              onClick={() => setIsOrdering(true)}
              disabled={product.stock === 0}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              {product.stock === 0 ? '缺货' : '立即购买'}
            </Button>
          </div>
        </div>
      </div>

      {/* Order Dialog */}
      <Dialog open={isOrdering} onOpenChange={setIsOrdering}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>确认订单</DialogTitle>
            <DialogDescription>
              请确认您的订单信息
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium">{product.name}</p>
              <p className="text-sm text-muted-foreground">
                {selectedColor && `颜色: ${selectedColor}`}
                {selectedColor && selectedSize && ' | '}
                {selectedSize && `尺码: ${selectedSize}`}
              </p>
              <p className="text-sm">
                数量: {quantity} × ¥{product.price.toFixed(2)} = ¥{totalPrice.toFixed(2)}
              </p>
            </div>

            <div className="space-y-2">
              <Label>收货地址</Label>
              {addresses.length > 0 ? (
                <Select value={selectedAddressId} onValueChange={(v) => setSelectedAddressId(v || '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择收货地址" />
                  </SelectTrigger>
                  <SelectContent>
                    {addresses.map((addr) => (
                      <SelectItem key={addr.id} value={addr.id}>
                        {addr.recipient_name} - {addr.province}{addr.city}{addr.district} {addr.detail_address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">暂无收货地址，请添加</p>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedAddressId('new')}
                className="mt-2"
              >
                <MapPin className="mr-2 h-4 w-4" />
                添加新地址
              </Button>
            </div>

            {(selectedAddressId === 'new' || addresses.length === 0) && (
              <div className="space-y-3 p-4 border rounded-lg">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>收货人</Label>
                    <Input
                      placeholder="姓名"
                      value={newAddress.recipient_name}
                      onChange={(e) => setNewAddress({ ...newAddress, recipient_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>电话</Label>
                    <Input
                      placeholder="手机号"
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label>省份</Label>
                    <Input
                      placeholder="省"
                      value={newAddress.province}
                      onChange={(e) => setNewAddress({ ...newAddress, province: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>城市</Label>
                    <Input
                      placeholder="市"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>区县</Label>
                    <Input
                      placeholder="区"
                      value={newAddress.district}
                      onChange={(e) => setNewAddress({ ...newAddress, district: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>详细地址</Label>
                  <Input
                    placeholder="街道、楼栋、门牌号"
                    value={newAddress.detail_address}
                    onChange={(e) => setNewAddress({ ...newAddress, detail_address: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOrdering(false)}>
              取消
            </Button>
            <Button onClick={handleCreateOrder}>
              确认下单
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}