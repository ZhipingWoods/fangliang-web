'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Product, Category } from '@/types'
import Link from 'next/link'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, ShoppingCart } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function HomePage() {
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [priceRange, setPriceRange] = useState<string>('all')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (categoriesData) {
        setCategories(categoriesData)
      }

      // Fetch products
      let query = supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory)
      }

      const { data: productsData } = await query

      if (productsData) {
        let filteredProducts = productsData

        // Search filter
        if (searchQuery) {
          filteredProducts = filteredProducts.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
        }

        // Price range filter
        if (priceRange !== 'all') {
          const [min, max] = priceRange.split('-').map(Number)
          filteredProducts = filteredProducts.filter(p => {
            if (max) {
              return p.price >= min && p.price <= max
            }
            return p.price >= min
          })
        }

        setProducts(filteredProducts)
      }

      setLoading(false)
    }

    fetchData()
  }, [supabase, selectedCategory, priceRange])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Search is handled in useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索商品..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" variant="secondary">
            搜索
          </Button>
        </form>

        <div className="flex flex-wrap gap-4">
          <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v || 'all')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="全部分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分类</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priceRange} onValueChange={(v) => setPriceRange(v || 'all')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="价格区间" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">不限价格</SelectItem>
              <SelectItem value="0-100">0-100元</SelectItem>
              <SelectItem value="100-300">100-300元</SelectItem>
              <SelectItem value="300-500">300-500元</SelectItem>
              <SelectItem value="500-100000">500元以上</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-48 w-full rounded-t-lg" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">暂无商品</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link key={product.id} href={`/products/${product.id}`}>
              <Card className="overflow-hidden transition-all hover:shadow-lg">
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                  {product.images && product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium truncate">{product.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {product.category?.name}
                  </p>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <span className="text-lg font-bold text-primary">
                    ¥{product.price.toFixed(2)}
                  </span>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}