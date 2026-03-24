-- ============================================================
-- KIGALIDEALS — COMPLETE DATABASE SCHEMA
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  phone text,
  avatar_url text,
  whatsapp_opted_in boolean default true,
  email_opted_in boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile when user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- BUSINESSES
-- ============================================================
create table public.businesses (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  slug text unique not null,
  category text not null check (category in (
    'restaurant', 'beauty', 'hotel', 'fitness', 'shopping', 'activities', 'auto'
  )),
  description text,
  address text,
  neighbourhood text,
  phone text,
  email text,
  website text,
  logo_url text,
  banner_url text,
  plan text default 'free' check (plan in ('free', 'pro', 'premium')),
  plan_expires_at timestamptz,
  momo_number text,
  rdb_number text,
  status text default 'pending' check (status in ('pending', 'active', 'paused', 'rejected')),
  rating numeric(3,2) default 0,
  review_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- DEALS
-- ============================================================
create table public.deals (
  id uuid default uuid_generate_v4() primary key,
  business_id uuid references public.businesses(id) on delete cascade not null,
  title text not null,
  slug text unique not null,
  description text,
  what_included text[], -- array of included items
  fine_print text,
  category text not null,
  emoji text default '🎟️',
  original_price numeric(12,2) not null,
  deal_price numeric(12,2) not null,
  discount_pct int generated always as (
    round((1 - deal_price / original_price) * 100)::int
  ) stored,
  max_vouchers int not null default 100,
  sold_count int default 0,
  status text default 'pending' check (status in ('pending', 'active', 'paused', 'sold_out', 'expired')),
  is_featured boolean default false,
  is_flash boolean default false,
  flash_ends_at timestamptz,
  expires_at timestamptz not null,
  voucher_valid_days int default 90,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- VOUCHERS
-- ============================================================
create table public.vouchers (
  id uuid default uuid_generate_v4() primary key,
  code text unique not null default upper(substring(replace(uuid_generate_v4()::text, '-', ''), 1, 12)),
  deal_id uuid references public.deals(id) on delete restrict not null,
  user_id uuid references public.profiles(id) on delete restrict not null,
  quantity int default 1,
  unit_price numeric(12,2) not null,
  total_price numeric(12,2) not null,
  payment_method text check (payment_method in ('momo', 'airtel', 'card')),
  payment_ref text,
  status text default 'active' check (status in ('active', 'redeemed', 'expired', 'refunded')),
  redeemed_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- ============================================================
-- PAYMENTS
-- ============================================================
create table public.payments (
  id uuid default uuid_generate_v4() primary key,
  voucher_id uuid references public.vouchers(id) on delete restrict,
  user_id uuid references public.profiles(id),
  amount numeric(12,2) not null,
  currency text default 'RWF',
  method text not null,
  provider_ref text,
  provider_status text,
  status text default 'pending' check (status in ('pending', 'completed', 'failed', 'refunded')),
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- PAYOUTS (to businesses)
-- ============================================================
create table public.payouts (
  id uuid default uuid_generate_v4() primary key,
  business_id uuid references public.businesses(id) on delete restrict,
  period_start date not null,
  period_end date not null,
  vouchers_count int default 0,
  gross_amount numeric(12,2) default 0,
  commission_rate numeric(5,4) default 0.15,
  commission_amount numeric(12,2) default 0,
  net_amount numeric(12,2) default 0,
  status text default 'pending' check (status in ('pending', 'processing', 'paid', 'failed')),
  paid_at timestamptz,
  momo_ref text,
  created_at timestamptz default now()
);

-- ============================================================
-- REVIEWS
-- ============================================================
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  deal_id uuid references public.deals(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  voucher_id uuid references public.vouchers(id),
  rating int not null check (rating between 1 and 5),
  body text,
  created_at timestamptz default now(),
  unique(voucher_id)
);

-- ============================================================
-- CATEGORIES
-- ============================================================
create table public.categories (
  slug text primary key,
  name text not null,
  emoji text not null,
  sort_order int default 0
);

insert into public.categories values
  ('restaurant', 'Restaurants', '🍽️', 1),
  ('beauty', 'Beauty & Spa', '💆', 2),
  ('hotel', 'Hotels', '🏨', 3),
  ('shopping', 'Shopping', '🛍️', 4),
  ('fitness', 'Fitness', '🏋️', 5),
  ('activities', 'Activities', '🎭', 6),
  ('auto', 'Auto & Travel', '🚗', 7);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.deals enable row level security;
alter table public.vouchers enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;

-- Profiles: users can read all, edit own
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- Businesses: public read active, owner can edit own
create policy "businesses_select" on public.businesses for select using (status = 'active' or owner_id = auth.uid());
create policy "businesses_insert" on public.businesses for insert with check (owner_id = auth.uid());
create policy "businesses_update" on public.businesses for update using (owner_id = auth.uid());

-- Deals: public read active, business owner manages own
create policy "deals_select" on public.deals for select using (status in ('active', 'sold_out') or exists (
  select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()
));
create policy "deals_insert" on public.deals for insert with check (exists (
  select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()
));
create policy "deals_update" on public.deals for update using (exists (
  select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()
));

-- Vouchers: users see own vouchers
create policy "vouchers_select" on public.vouchers for select using (user_id = auth.uid());
create policy "vouchers_insert" on public.vouchers for insert with check (user_id = auth.uid());

-- Payments: users see own
create policy "payments_select" on public.payments for select using (user_id = auth.uid());

-- Reviews: public read, authenticated insert
create policy "reviews_select" on public.reviews for select using (true);
create policy "reviews_insert" on public.reviews for insert with check (auth.uid() = user_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Get deals with business info (for homepage)
create or replace function get_active_deals(
  p_category text default null,
  p_limit int default 20,
  p_offset int default 0
)
returns table (
  id uuid, title text, slug text, emoji text, description text,
  original_price numeric, deal_price numeric, discount_pct int,
  sold_count int, max_vouchers int, is_featured boolean, is_flash boolean,
  expires_at timestamptz, business_name text, neighbourhood text,
  category text, rating numeric, review_count int
)
language sql security definer as $$
  select
    d.id, d.title, d.slug, d.emoji, d.description,
    d.original_price, d.deal_price, d.discount_pct,
    d.sold_count, d.max_vouchers, d.is_featured, d.is_flash,
    d.expires_at, b.name as business_name, b.neighbourhood,
    d.category, b.rating, b.review_count
  from public.deals d
  join public.businesses b on b.id = d.business_id
  where d.status = 'active'
    and (p_category is null or d.category = p_category)
    and d.expires_at > now()
  order by d.is_featured desc, d.sold_count desc
  limit p_limit offset p_offset;
$$;

-- Purchase a voucher (atomic)
create or replace function purchase_voucher(
  p_deal_id uuid,
  p_user_id uuid,
  p_quantity int,
  p_payment_method text,
  p_payment_ref text
)
returns jsonb
language plpgsql security definer as $$
declare
  v_deal public.deals;
  v_voucher public.vouchers;
  v_total numeric;
begin
  -- Lock and fetch deal
  select * into v_deal from public.deals where id = p_deal_id for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Deal not found');
  end if;

  if v_deal.status != 'active' then
    return jsonb_build_object('success', false, 'error', 'Deal is not active');
  end if;

  if (v_deal.sold_count + p_quantity) > v_deal.max_vouchers then
    return jsonb_build_object('success', false, 'error', 'Not enough vouchers available');
  end if;

  v_total := v_deal.deal_price * p_quantity;

  -- Create voucher
  insert into public.vouchers (
    deal_id, user_id, quantity, unit_price, total_price,
    payment_method, payment_ref, expires_at
  ) values (
    p_deal_id, p_user_id, p_quantity, v_deal.deal_price, v_total,
    p_payment_method, p_payment_ref,
    now() + (v_deal.voucher_valid_days || ' days')::interval
  ) returning * into v_voucher;

  -- Update sold count
  update public.deals
  set sold_count = sold_count + p_quantity,
      status = case when (sold_count + p_quantity) >= max_vouchers then 'sold_out' else status end
  where id = p_deal_id;

  return jsonb_build_object(
    'success', true,
    'voucher_id', v_voucher.id,
    'voucher_code', v_voucher.code,
    'total_price', v_total,
    'expires_at', v_voucher.expires_at
  );
end;
$$;

-- ============================================================
-- INDEXES (performance)
-- ============================================================
create index idx_deals_status on public.deals(status);
create index idx_deals_category on public.deals(category);
create index idx_deals_featured on public.deals(is_featured) where is_featured = true;
create index idx_deals_expires on public.deals(expires_at);
create index idx_vouchers_user on public.vouchers(user_id);
create index idx_vouchers_code on public.vouchers(code);
create index idx_businesses_slug on public.businesses(slug);
create index idx_reviews_deal on public.reviews(deal_id);
