'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Product, Category } from '@/types'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Search, Edit, Trash2, Package, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminProductsPage() {
  const supabase = createClient()
  const router = useRouter()
  const { role } = useAuthStore()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    category_id: '',
    images: '',
    colors: '',
    sizes: '',
    is_active: true,
  })

  useEffect(() => {
    if (role !== 'admin') {
      router.push('/')
      return
    }

    const fetchData = async () => {
      const [productsResult, categoriesResult] = await Promise.all([
        supabase.from('products').select('*, category:categories(*)').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('name'),
      ])

      if (productsResult.data) setProducts(productsResult.data)
      if (categoriesResult.data) setCategories(categoriesResult.data)

      setLoading(false)
    }

    fetchData()
  }, [supabase, role, router])

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSubmit = async () => {
    try {
      const data = {
        name: formData.name,
        description: formData.description || null,
        price: formData.price,
        stock: formData.stock,
        category_id: formData.category_id || null,
        images: formData.images ? formData.images.split(',').map(s => s.trim()).filter(Boolean) : [],
        colors: formData.colors ? formData.colors.split(',').map(s => s.trim()).filter(Boolean) : [],
        sizes: formData.sizes ? formData.sizes.split(',').map(s => s.trim()).filter(Boolean) : [],
        is_active: formData.is_active,
      }

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(data)
          .eq('id', editingProduct.id)

        if (error) throw error
        toast.success('商品已更新')
      } else {
        const { error } = await supabase
          .from('products')
          .insert(data)

        if (error) throw error
        toast.success('商品已添加')
      }

      // Refresh
      const { data: productsData } = await supabase
        .from('products')
        .select('*, category:categories(*)')
        .order('created_at', { ascending: false })

      if (productsData) setProducts(productsData)
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      toast.error('操作失败')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个商品吗？')) return

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('删除失败')
    } else {
      toast.success('商品已删除')
      setProducts(products.filter(p => p.id !== id))
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      stock: 0,
      category_id: '',
      images: '',
      colors: '',
      sizes: '',
      is_active: true,
    })
    setEditingProduct(null)
  }

  const openEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      category_id: product.category_id || '',
      images: product.images?.join(', ') || '',
      colors: product.colors?.join(', ') || '',
      sizes: product.sizes?.join(', ') || '',
      is_active: product.is_active,
    })
    setIsDialogOpen(true)
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8">加载中...</div>
  }

  if (role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r bg-gray-50 p-4">
        <Link href="/admin" className="flex items-center gap-2 mb-6">
          <Package className="h-6 w-6" />
          <span className="text-xl font-bold">商户中心</span>
        </Link>
        <nav className="space-y-2">
          <Link href="/admin">
            <Button variant="ghost" className="w-full justify-start">数据统计</Button>
          </Link>
          <Link href="/admin/products">
            <Button variant="default" className="w-full justify-start">商品管理</Button>
          </Link>
          <Link href="/admin/orders">
            <Button variant="ghost" className="w-full justify-start">订单管理</Button>
          </Link>
          <Link href="/admin/users">
            <Button variant="ghost" className="w-full justify-start">用户管理</Button>
          </Link>
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">商品管理</h1>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                添加商品
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingProduct ? '编辑商品' : '添加商品'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>商品名称</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>分类</Label>
                    <Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v || '' })}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择分类" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>描述</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>价格</Label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>库存</Label>
                    <Input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>图片URL (逗号分隔)</Label>
                  <Input
                    value={formData.images}
                    onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                    placeholder="https://..., https://..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>颜色 (逗号分隔)</Label>
                    <Input
                      value={formData.colors}
                      onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                      placeholder="红色, 蓝色, 绿色"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>尺码 (逗号分隔)</Label>
                    <Input
                      value={formData.sizes}
                      onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                      placeholder="S, M, L, XL"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <Label htmlFor="is_active">上架销售</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
                <Button onClick={handleSubmit}>保存</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索商品..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map(product => (
            <Card key={product.id}>
              <div className="aspect-square relative bg-gray-100">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                {!product.is_active && (
                  <Badge className="absolute top-2 right-2 bg-gray-500">已下架</Badge>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium truncate">{product.name}</h3>
                <p className="text-sm text-muted-foreground">{product.category?.name}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-bold">¥{product.price.toFixed(2)}</span>
                  <span className="text-sm text-muted-foreground">库存: {product.stock}</span>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(product)}>
                    <Edit className="mr-1 h-4 w-4" />
                    编辑
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(product.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}