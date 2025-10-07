-- EZCR Multi-Tenant Database Schema
-- Version: 1.0.0
-- Date: 2025-01-06
-- ========================================
-- EXTENSIONS
-- ========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- ========================================
-- TENANTS
-- ========================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(50) UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- ========================================
-- PRODUCTS
-- ========================================
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  slug VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  sku VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  short_description TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  specifications JSONB DEFAULT '{}',
  meta_title VARCHAR(255),
  meta_description TEXT,
  inventory_count INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  coming_soon BOOLEAN DEFAULT false,
  coming_soon_date DATE,
  coming_soon_price_visible BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, sku),
  UNIQUE(tenant_id, slug)
);
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text VARCHAR(255),
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  price_modifier DECIMAL(10,2) DEFAULT 0,
  inventory_count INTEGER DEFAULT 0,
  specifications JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, sku)
);
-- ========================================
-- WAITLIST
-- ========================================
CREATE TABLE product_waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  prepayment_amount DECIMAL(10,2) DEFAULT 0,
  prepayment_percentage DECIMAL(5,2),
  prepayment_stripe_payment_intent_id VARCHAR(255),
  notification_email BOOLEAN DEFAULT true,
  notification_sms BOOLEAN DEFAULT false,
  notification_in_app BOOLEAN DEFAULT true,
  notified_at TIMESTAMPTZ,
  conversion_window_hours INTEGER DEFAULT 48,
  expires_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_waitlist_product ON product_waitlist(tenant_id, product_id);
CREATE INDEX idx_waitlist_status ON product_waitlist(status);
CREATE INDEX idx_waitlist_priority ON product_waitlist(tenant_id, product_id, prepayment_amount DESC, created_at ASC);
-- ========================================
-- ORDERS
-- ========================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  status VARCHAR(50) DEFAULT 'pending',
  payment_status VARCHAR(50) DEFAULT 'pending',
  stripe_payment_intent_id VARCHAR(255),
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  shipping_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  shipping_address JSONB NOT NULL,
  billing_address JSONB NOT NULL,
  shipping_method VARCHAR(100),
  tracking_number VARCHAR(255),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  product_name VARCHAR(255) NOT NULL,
  product_sku VARCHAR(50) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  configuration JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- ========================================
-- CART
-- ========================================
CREATE TABLE shopping_cart (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id VARCHAR(255),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  configuration JSONB DEFAULT '{}',
  reserved_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_cart_session ON shopping_cart(tenant_id, session_id);
CREATE INDEX idx_cart_user ON shopping_cart(tenant_id, user_id);
-- ========================================
-- USERS & PROFILES
-- ========================================
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  role VARCHAR(50) DEFAULT 'customer',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- ========================================
-- CONFIGURATIONS (Saved Ramp Configs)
-- ========================================
CREATE TABLE product_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id VARCHAR(255),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(255),
  configuration JSONB NOT NULL,
  calculated_price DECIMAL(10,2),
  is_saved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_config_user ON product_configurations(tenant_id, user_id);
CREATE INDEX idx_config_session ON product_configurations(tenant_id, session_id);
-- ========================================
-- ANALYTICS
-- ========================================
CREATE TABLE page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id VARCHAR(255),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  page_path VARCHAR(500) NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE conversion_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id VARCHAR(255),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- ========================================
-- FUNCTIONS
-- ========================================
-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number(tenant_prefix VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
  date_str VARCHAR;
  sequence_num INTEGER;
  order_num VARCHAR;
BEGIN
  date_str := TO_CHAR(NOW(), 'YYYYMMDD');
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM orders
  WHERE order_number LIKE tenant_prefix || '-' || date_str || '-%';
  order_num := tenant_prefix || '-' || date_str || '-' || LPAD(sequence_num::TEXT, 5, '0');
  RETURN order_num;
END;
$$ LANGUAGE plpgsql;
-- Function to calculate waitlist position
CREATE OR REPLACE FUNCTION get_waitlist_position(waitlist_id UUID)
RETURNS INTEGER AS $$
DECLARE
  position INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO position
  FROM product_waitlist w1
  INNER JOIN product_waitlist w2 ON w1.product_id = w2.product_id AND w1.tenant_id = w2.tenant_id
  WHERE w2.id = waitlist_id
    AND w1.status = 'active'
    AND (
      w1.prepayment_amount > w2.prepayment_amount
      OR (w1.prepayment_amount = w2.prepayment_amount AND w1.created_at < w2.created_at)
    );
  RETURN position;
END;
$$ LANGUAGE plpgsql;
-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================
-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_events ENABLE ROW LEVEL SECURITY;
-- Public read access to tenants (for subdomain lookup)
CREATE POLICY "Public can view active tenants" ON tenants
  FOR SELECT USING (is_active = true);
-- Products: Public read, admin write
CREATE POLICY "Public can view active products" ON products
  FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated users can view all products" ON products
  FOR SELECT TO authenticated USING (true);
-- Product images: Public read
CREATE POLICY "Public can view product images" ON product_images
  FOR SELECT USING (true);
-- Product variants: Public read
CREATE POLICY "Public can view product variants" ON product_variants
  FOR SELECT USING (is_active = true);
-- Waitlist: Users can insert their own, view their own
CREATE POLICY "Users can join waitlist" ON product_waitlist
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can view their waitlist entries" ON product_waitlist
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can update their waitlist entries" ON product_waitlist
  FOR UPDATE USING (auth.uid() = user_id);
-- Orders: Users can view their own
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
-- Order items: Users can view their own
CREATE POLICY "Users can view their order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
    )
  );
-- Cart: Users can manage their own cart
CREATE POLICY "Users can view their cart" ON shopping_cart
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can manage their cart" ON shopping_cart
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);
-- User profiles
CREATE POLICY "Users can view their profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);
-- Configurations
CREATE POLICY "Users can view their configurations" ON product_configurations
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can manage their configurations" ON product_configurations
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);
-- ========================================
-- TRIGGERS
-- ========================================
-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON product_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shopping_cart_updated_at BEFORE UPDATE ON shopping_cart
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_configurations_updated_at BEFORE UPDATE ON product_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================
CREATE INDEX idx_products_tenant ON products(tenant_id, is_active);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_slug ON products(tenant_id, slug);
CREATE INDEX idx_products_coming_soon ON products(tenant_id, coming_soon) WHERE coming_soon = true;
CREATE INDEX idx_orders_tenant ON orders(tenant_id, created_at DESC);
CREATE INDEX idx_orders_user ON orders(user_id, created_at DESC);
CREATE INDEX idx_orders_status ON orders(tenant_id, status);
CREATE INDEX idx_page_views_tenant ON page_views(tenant_id, created_at DESC);
CREATE INDEX idx_conversion_events_tenant ON conversion_events(tenant_id, event_type, created_at DESC);
