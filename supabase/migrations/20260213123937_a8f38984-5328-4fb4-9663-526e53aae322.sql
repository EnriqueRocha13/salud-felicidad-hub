
-- Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- User roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Shortcut for admin check
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  email text,
  phone text,
  gps_lat double precision,
  gps_lon double precision,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Products table
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  image_url text,
  model_3d_url text,
  is_medical_article boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Product bundles (conjuntos)
CREATE TABLE public.product_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.product_bundles ENABLE ROW LEVEL SECURITY;

-- Bundle-product relationship
CREATE TABLE public.bundle_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id uuid REFERENCES public.product_bundles(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(bundle_id, product_id)
);
ALTER TABLE public.bundle_products ENABLE ROW LEVEL SECURITY;

-- Orders table
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  total_price numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  gps_lat double precision,
  gps_lon double precision,
  payment_method text,
  payment_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Order items
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 1,
  price_at_order numeric(10,2) NOT NULL DEFAULT 0,
  product_name text NOT NULL
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Chat messages (simple: each user has a conversation with admin)
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Admin notification emails
CREATE TABLE public.admin_notification_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_notification_emails ENABLE ROW LEVEL SECURITY;

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Trigger for auto-creating profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bundles_updated_at BEFORE UPDATE ON public.product_bundles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== RLS POLICIES ==========

-- user_roles: only admins can read, nobody can self-assign
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.is_admin());

-- products: public read, admin write
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (active = true);
CREATE POLICY "Admins can view all products" ON public.products FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE TO authenticated USING (public.is_admin());

-- product_bundles: public read, admin write
CREATE POLICY "Anyone can view bundles" ON public.product_bundles FOR SELECT USING (true);
CREATE POLICY "Admins can insert bundles" ON public.product_bundles FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update bundles" ON public.product_bundles FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete bundles" ON public.product_bundles FOR DELETE TO authenticated USING (public.is_admin());

-- bundle_products: public read, admin write
CREATE POLICY "Anyone can view bundle products" ON public.bundle_products FOR SELECT USING (true);
CREATE POLICY "Admins can manage bundle products" ON public.bundle_products FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- orders
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE TO authenticated USING (public.is_admin());

-- order_items
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Admins can view all order items" ON public.order_items FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Users can insert order items" ON public.order_items FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

-- chat_messages
CREATE POLICY "Users can view own chat" ON public.chat_messages FOR SELECT TO authenticated USING (auth.uid() = user_id OR auth.uid() = sender_id);
CREATE POLICY "Admins can view all chats" ON public.chat_messages FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Users can send messages in own chat" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Admins can send messages" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update messages" ON public.chat_messages FOR UPDATE TO authenticated USING (public.is_admin());

-- admin_notification_emails
CREATE POLICY "Admins can manage notification emails" ON public.admin_notification_emails FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('product-models', 'product-models', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('article-images', 'article-images', true);

-- Storage policies
CREATE POLICY "Public can view product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Admins can upload product images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images' AND public.is_admin());
CREATE POLICY "Admins can update product images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images' AND public.is_admin());
CREATE POLICY "Admins can delete product images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "Public can view product models" ON storage.objects FOR SELECT USING (bucket_id = 'product-models');
CREATE POLICY "Admins can upload product models" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-models' AND public.is_admin());
CREATE POLICY "Admins can delete product models" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-models' AND public.is_admin());

CREATE POLICY "Public can view article images" ON storage.objects FOR SELECT USING (bucket_id = 'article-images');
CREATE POLICY "Admins can upload article images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'article-images' AND public.is_admin());
CREATE POLICY "Admins can delete article images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'article-images' AND public.is_admin());
