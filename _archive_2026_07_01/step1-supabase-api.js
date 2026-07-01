// ============================================================
// lib/supabase.js — Supabase client + all API functions
// Install: npm install @supabase/supabase-js
// ============================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================================
// AUTH
// ============================================================

export async function signUp({ email, password, fullName, phone }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone }
    }
  })
  return { data, error }
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

export async function signOut() {
  return await supabase.auth.signOut()
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()
  return { data, error }
}

// ============================================================
// DEALS
// ============================================================

export async function getDeals({ category = null, limit = 20, offset = 0 } = {}) {
  const { data, error } = await supabase
    .rpc('get_active_deals', {
      p_category: category,
      p_limit: limit,
      p_offset: offset
    })
  return { data, error }
}

export async function getDealBySlug(slug) {
  const { data, error } = await supabase
    .from('deals')
    .select(`
      *,
      businesses (
        id, name, slug, description, address, neighbourhood,
        phone, email, website, logo_url, banner_url,
        rating, review_count, category
      )
    `)
    .eq('slug', slug)
    .eq('status', 'active')
    .single()
  return { data, error }
}

export async function getFeaturedDeals() {
  const { data, error } = await supabase
    .from('deals')
    .select(`*, businesses(name, neighbourhood, rating)`)
    .eq('status', 'active')
    .eq('is_featured', true)
    .gt('expires_at', new Date().toISOString())
    .order('sold_count', { ascending: false })
    .limit(6)
  return { data, error }
}

export async function getFlashDeals() {
  const { data, error } = await supabase
    .from('deals')
    .select(`*, businesses(name, neighbourhood)`)
    .eq('status', 'active')
    .eq('is_flash', true)
    .gt('flash_ends_at', new Date().toISOString())
    .order('flash_ends_at', { ascending: true })
    .limit(4)
  return { data, error }
}

export async function searchDeals(query) {
  const { data, error } = await supabase
    .from('deals')
    .select(`*, businesses(name, neighbourhood)`)
    .eq('status', 'active')
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .gt('expires_at', new Date().toISOString())
    .limit(10)
  return { data, error }
}

export async function getDealsByCategory(category) {
  const { data, error } = await supabase
    .from('deals')
    .select(`*, businesses(name, neighbourhood, rating)`)
    .eq('status', 'active')
    .eq('category', category)
    .gt('expires_at', new Date().toISOString())
    .order('is_featured', { ascending: false })
    .order('sold_count', { ascending: false })
  return { data, error }
}

export async function getCategoryStats() {
  const { data, error } = await supabase
    .from('deals')
    .select('category')
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())

  if (error) return { data: null, error }

  const counts = data.reduce((acc, { category }) => {
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {})

  return { data: counts, error: null }
}

// ============================================================
// BUSINESSES
// ============================================================

export async function createBusiness(businessData, ownerId) {
  const slug = businessData.name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    + '-' + Date.now().toString(36)

  const { data, error } = await supabase
    .from('businesses')
    .insert({
      ...businessData,
      owner_id: ownerId,
      slug,
      status: 'pending'
    })
    .select()
    .single()
  return { data, error }
}

export async function getMyBusiness(ownerId) {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', ownerId)
    .single()
  return { data, error }
}

export async function updateBusiness(businessId, updates) {
  const { data, error } = await supabase
    .from('businesses')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', businessId)
    .select()
    .single()
  return { data, error }
}

export async function createDeal(dealData, businessId) {
  const slug = dealData.title.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    + '-' + Date.now().toString(36)

  const { data, error } = await supabase
    .from('deals')
    .insert({
      ...dealData,
      business_id: businessId,
      slug,
      status: 'pending'
    })
    .select()
    .single()
  return { data, error }
}

export async function getBusinessDeals(businessId) {
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
  return { data, error }
}

// ============================================================
// VOUCHERS
// ============================================================

export async function purchaseVoucher({ dealId, userId, quantity, paymentMethod, paymentRef }) {
  const { data, error } = await supabase
    .rpc('purchase_voucher', {
      p_deal_id: dealId,
      p_user_id: userId,
      p_quantity: quantity,
      p_payment_method: paymentMethod,
      p_payment_ref: paymentRef
    })
  return { data, error }
}

export async function getMyVouchers(userId) {
  const { data, error } = await supabase
    .from('vouchers')
    .select(`
      *,
      deals (
        title, emoji, category, original_price, deal_price,
        businesses (name, neighbourhood, phone, address)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function getVoucherByCode(code) {
  const { data, error } = await supabase
    .from('vouchers')
    .select(`
      *,
      deals (title, businesses(name, address, phone)),
      profiles (full_name, phone)
    `)
    .eq('code', code)
    .single()
  return { data, error }
}

// For businesses to redeem a voucher
export async function redeemVoucher(code, businessId) {
  // First verify the voucher belongs to one of this business's deals
  const { data: voucher, error: fetchError } = await supabase
    .from('vouchers')
    .select(`*, deals(business_id)`)
    .eq('code', code)
    .eq('status', 'active')
    .single()

  if (fetchError || !voucher) {
    return { data: null, error: { message: 'Voucher not found or already used' } }
  }

  if (voucher.deals.business_id !== businessId) {
    return { data: null, error: { message: 'This voucher is not for your business' } }
  }

  if (new Date(voucher.expires_at) < new Date()) {
    return { data: null, error: { message: 'Voucher has expired' } }
  }

  const { data, error } = await supabase
    .from('vouchers')
    .update({ status: 'redeemed', redeemed_at: new Date().toISOString() })
    .eq('id', voucher.id)
    .select()
    .single()

  return { data, error }
}

// ============================================================
// REVIEWS
// ============================================================

export async function getDealReviews(dealId) {
  const { data, error } = await supabase
    .from('reviews')
    .select(`*, profiles(full_name, avatar_url)`)
    .eq('deal_id', dealId)
    .order('created_at', { ascending: false })
    .limit(20)
  return { data, error }
}

export async function createReview({ dealId, userId, voucherId, rating, body }) {
  const { data, error } = await supabase
    .from('reviews')
    .insert({ deal_id: dealId, user_id: userId, voucher_id: voucherId, rating, body })
    .select()
    .single()

  if (!error) {
    // Update business rating average
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('deal_id', dealId)

    if (reviews) {
      const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      await supabase.from('deals').select('business_id').eq('id', dealId).single()
        .then(({ data: deal }) => {
          if (deal) {
            supabase.from('businesses')
              .update({ rating: avg.toFixed(2), review_count: reviews.length })
              .eq('id', deal.business_id)
          }
        })
    }
  }

  return { data, error }
}

// ============================================================
// ADMIN (server-side only — use service role key)
// ============================================================

export async function adminApproveDeal(dealId) {
  const { data, error } = await supabase
    .from('deals')
    .update({ status: 'active' })
    .eq('id', dealId)
    .select()
    .single()
  return { data, error }
}

export async function adminApproveBusiness(businessId) {
  const { data, error } = await supabase
    .from('businesses')
    .update({ status: 'active' })
    .eq('id', businessId)
    .select()
    .single()
  return { data, error }
}

export async function adminGetDashboardStats() {
  const [deals, businesses, users, vouchers] = await Promise.all([
    supabase.from('deals').select('id, status, sold_count, deal_price', { count: 'exact' }),
    supabase.from('businesses').select('id, status', { count: 'exact' }),
    supabase.from('profiles').select('id', { count: 'exact' }),
    supabase.from('vouchers').select('total_price, status, created_at')
  ])

  const totalRevenue = (vouchers.data || [])
    .filter(v => v.status !== 'refunded')
    .reduce((s, v) => s + parseFloat(v.total_price), 0)

  const commission = totalRevenue * 0.15

  return {
    totalDeals: deals.count || 0,
    activeDeals: (deals.data || []).filter(d => d.status === 'active').length,
    totalBusinesses: businesses.count || 0,
    activeBusinesses: (businesses.data || []).filter(b => b.status === 'active').length,
    totalUsers: users.count || 0,
    totalRevenue,
    commission,
    totalVouchers: (vouchers.data || []).length
  }
}
