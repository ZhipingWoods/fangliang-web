-- Database Schema for E-commerce Platform
-- Run this SQL in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom types
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'shipped', 'completed', 'cancelled');

-- Profiles table (extends Supabase Auth users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  role user_role DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Addresses table
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  province TEXT NOT NULL,
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  detail_address TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER DEFAULT 0,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  images JSONB DEFAULT '[]',
  colors JSONB DEFAULT '[]',
  sizes JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  status order_status DEFAULT 'pending',
  total_amount DECIMAL(10, 2) NOT NULL,
  order_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  color TEXT,
  size TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Addresses policies
CREATE POLICY "Users can view own addresses" ON addresses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addresses" ON addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses" ON addresses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses" ON addresses
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all addresses" ON addresses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Categories policies (public read)
CREATE POLICY "Anyone can view categories" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Products policies (public read for active products)
CREATE POLICY "Anyone can view active products" ON products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage products" ON products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Orders policies
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders" ON orders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own orders" ON orders
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all orders" ON orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Order items policies
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert own order items" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid())
  );

CREATE POLICY "Admins can view all order items" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default categories
INSERT INTO categories (name, slug) VALUES
  ('服装', 'clothing'),
  ('电子产品', 'electronics'),
  ('食品', 'food'),
  ('家居', 'home'),
  ('运动', 'sports')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample products (for testing)
INSERT INTO products (name, description, price, stock, category_id, images, colors, sizes) VALUES
  ('纯棉T恤', '舒适透气的纯棉面料，适合日常穿着', 99.00, 100, (SELECT id FROM categories WHERE slug = 'clothing'), '["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400"]', '["白色", "黑色", "灰色"]', '["S", "M", "L", "XL"]'),
  ('运动鞋', '轻便舒适，适合跑步和日常运动', 299.00, 50, (SELECT id FROM categories WHERE slug = 'sports'), '["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400"]', '["白色", "黑色", "红色"]', '["38", "39", "40", "41", "42", "43"]'),
  ('无线耳机', '高��质音质，降噪功能', 599.00, 30, (SELECT id FROM categories WHERE slug = 'electronics'), '["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"]', '["黑色", "白色"]', '[]'),
  ('智能手表', '多功能智能手表，支持健康监测', 899.00, 20, (SELECT id FROM categories WHERE slug = 'electronics'), '["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"]', '["黑色", "银色", "金色"]', '[]'),
  ('休闲裤', '柔软舒适，适合各种场合', 159.00, 80, (SELECT id FROM categories WHERE slug = 'clothing'), '["https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400"]', '["黑色", "深蓝", "卡其"]', '["S", "M", "L", "XL", "XXL"]')
ON CONFLICT DO NOTHING;