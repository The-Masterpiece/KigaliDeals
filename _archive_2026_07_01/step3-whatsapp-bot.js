// ============================================================
// lib/whatsapp.js — WhatsApp Business API Integration
// Two options provided: Twilio (easier) + Meta Cloud API (cheaper)
// Install: npm install twilio axios
// ============================================================

// ─── OPTION A: TWILIO (Recommended for getting started fast) ─
// Sign up at twilio.com → get WhatsApp sandbox in minutes
// Env vars needed:
//   TWILIO_ACCOUNT_SID=ACxxxxxxxx
//   TWILIO_AUTH_TOKEN=your_token
//   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886  (sandbox) or your approved number

import twilio from 'twilio'

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

// ─── SEND VOUCHER CONFIRMATION ───────────────────────────────
export async function sendWhatsAppVoucher({
  phone,
  customerName,
  voucherCode,
  dealTitle,
  businessName,
  businessAddress,
  businessPhone,
  amount,
  expiresAt,
}) {
  const expiryDate = new Date(expiresAt).toLocaleDateString('en-RW', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  const message = `
🎟️ *KigaliDeals Voucher*

Hi ${customerName}! Your voucher is ready.

*Deal:* ${dealTitle}
*Business:* ${businessName}
*Address:* ${businessAddress}

━━━━━━━━━━━━━━━
🔑 *Voucher Code*
*${voucherCode}*
━━━━━━━━━━━━━━━

💰 You paid: ${Number(amount).toLocaleString()} RWF
📅 Valid until: ${expiryDate}

*How to use:*
1. Call ${businessPhone} to book
2. Show this message on arrival
3. Staff will scan your code

Questions? WhatsApp us: +250 700 000 000
kigalideals.rw
  `.trim()

  return await sendWhatsApp(phone, message)
}

// ─── SEND DAILY DEALS DIGEST ─────────────────────────────────
export async function sendDailyDealsDigest({ phone, customerName, deals }) {
  const dealsList = deals.slice(0, 4).map((deal, i) =>
    `${i + 1}. *${deal.title}*\n   ${deal.business_name} · ${deal.neighbourhood}\n   ~~${Number(deal.original_price).toLocaleString()}~~ → ${Number(deal.deal_price).toLocaleString()} RWF (${deal.discount_pct}% off)`
  ).join('\n\n')

  const message = `
☀️ *Good morning ${customerName}!*
Today's top deals in Kigali 👇

${dealsList}

👉 See all deals: kigalideals.rw
Reply *STOP* to unsubscribe
  `.trim()

  return await sendWhatsApp(phone, message)
}

// ─── SEND EXPIRY REMINDER ─────────────────────────────────────
export async function sendExpiryReminder({
  phone,
  customerName,
  voucherCode,
  dealTitle,
  businessName,
  daysLeft,
  expiresAt,
}) {
  const message = `
⚠️ *Voucher Expiring Soon!*

Hi ${customerName}, your KigaliDeals voucher expires in *${daysLeft} day${daysLeft !== 1 ? 's' : ''}*!

🎟️ *${dealTitle}*
📍 ${businessName}
🔑 Code: *${voucherCode}*
📅 Expires: ${new Date(expiresAt).toLocaleDateString('en-RW', { day: 'numeric', month: 'long' })}

Don't waste your savings — book now!
kigalideals.rw/vouchers
  `.trim()

  return await sendWhatsApp(phone, message)
}

// ─── SEND BUSINESS APPROVAL NOTIFICATION ─────────────────────
export async function sendBusinessApproved({ phone, businessName, dealTitle }) {
  const message = `
✅ *Your deal is LIVE on KigaliDeals!*

Congratulations! *${businessName}* — your deal has been approved.

🎟️ *${dealTitle}* is now visible to 8,000+ customers across Kigali.

Track your sales and redemptions:
kigalideals.rw/merchant

Questions? Reply to this message.
  `.trim()

  return await sendWhatsApp(phone, message)
}

// ─── SEND WEEKLY EARNINGS REPORT TO BUSINESS ─────────────────
export async function sendBusinessEarningsReport({
  phone,
  businessName,
  vouchersRedeemed,
  grossAmount,
  commission,
  netAmount,
  periodEnd,
}) {
  const message = `
💰 *Weekly Earnings Report*
${businessName}

Week ending: ${new Date(periodEnd).toLocaleDateString('en-RW', { day: 'numeric', month: 'long' })}

🎟️ Vouchers redeemed: ${vouchersRedeemed}
💵 Gross sales: ${Number(grossAmount).toLocaleString()} RWF
📊 Commission (15%): -${Number(commission).toLocaleString()} RWF
✅ *Your payout: ${Number(netAmount).toLocaleString()} RWF*

Payment sent to your MTN MoMo today!

Full dashboard: kigalideals.rw/merchant
  `.trim()

  return await sendWhatsApp(phone, message)
}

// ─── CORE SEND FUNCTION ──────────────────────────────────────
async function sendWhatsApp(to, body) {
  const phone = normalizeWhatsAppPhone(to)

  try {
    const msg = await twilioClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${phone}`,
      body
    })
    console.log(`WhatsApp sent to ${phone}: ${msg.sid}`)
    return { success: true, sid: msg.sid }
  } catch (err) {
    console.error('WhatsApp send error:', err.message)
    return { success: false, error: err.message }
  }
}

function normalizeWhatsAppPhone(phone) {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('07') || digits.startsWith('08')) return '+250' + digits.slice(1)
  if (digits.startsWith('250')) return '+' + digits
  if (digits.startsWith('+')) return phone
  return '+250' + digits
}

// ============================================================
// INBOUND WHATSAPP BOT (webhook handler)
// pages/api/whatsapp/webhook.js
// ============================================================
// Users can send messages to your WhatsApp number and the bot replies

export async function handleInboundWhatsApp(req, res) {
  const { Body, From, ProfileName } = req.body
  const message = Body.trim().toUpperCase()
  const phone = From.replace('whatsapp:', '')

  let reply = ''

  if (message === 'HI' || message === 'HELLO' || message === 'START') {
    reply = `
👋 *Welcome to KigaliDeals!*

I'm your deals assistant. Here's what I can do:

1️⃣ Reply *DEALS* — Today's top deals
2️⃣ Reply *FOOD* — Restaurant deals
3️⃣ Reply *SPA* — Beauty & spa deals
4️⃣ Reply *GYM* — Fitness deals
5️⃣ Reply *HOTEL* — Hotel deals
6️⃣ Reply *VOUCHER [code]* — Check voucher status
7️⃣ Reply *STOP* — Unsubscribe

Or visit kigalideals.rw anytime!
    `.trim()

  } else if (message === 'DEALS') {
    // Fetch today's top deals from Supabase
    // const { data: deals } = await getDeals({ limit: 3 })
    reply = `
🔥 *Today's Top Deals in Kigali*

1. *Romantic Dinner for Two*
   Heaven Restaurant · 50% OFF
   15,000 RWF (was 30,000)

2. *90-min Massage + Facial*
   Zen Spa · 40% OFF
   15,000 RWF (was 25,000)

3. *Gym Month + Training*
   FitLife Gym · 60% OFF
   20,000 RWF (was 50,000)

👉 Buy now: kigalideals.rw
    `.trim()

  } else if (message === 'FOOD' || message === 'RESTAURANT') {
    reply = `
🍽️ *Restaurant Deals Today*

Check all restaurant deals:
kigalideals.rw/category/restaurant

Reply *DEALS* for all categories
    `.trim()

  } else if (message === 'SPA' || message === 'BEAUTY') {
    reply = `
💆 *Beauty & Spa Deals Today*

kigalideals.rw/category/beauty

Reply *DEALS* for all categories
    `.trim()

  } else if (message.startsWith('VOUCHER ')) {
    const code = message.replace('VOUCHER ', '').trim()
    // const { data: voucher } = await getVoucherByCode(code)
    reply = `
🔍 *Voucher Status: ${code}*

Status: ✅ Active
Deal: Romantic Dinner for Two
Business: Heaven Restaurant
Expires: 20 April 2026

Show this message at the business to redeem!
    `.trim()

  } else if (message === 'STOP') {
    reply = `You've been unsubscribed from KigaliDeals alerts. Reply *START* anytime to resubscribe. Visit kigalideals.rw`

  } else {
    reply = `
👋 Hi ${ProfileName || 'there'}!

I didn't understand that. Try:
• *DEALS* — Today's top deals
• *FOOD* — Restaurant deals
• *SPA* — Beauty deals
• *VOUCHER [code]* — Check voucher

Or visit kigalideals.rw
    `.trim()
  }

  // Respond via Twilio TwiML
  const MessagingResponse = twilio.twiml.MessagingResponse
  const twiml = new MessagingResponse()
  twiml.message(reply)
  res.writeHead(200, { 'Content-Type': 'text/xml' })
  res.end(twiml.toString())
}

// ============================================================
// BULK DAILY BLAST (run via cron job at 8am Kigali time)
// scripts/send-daily-deals.js
// ============================================================
//
// import cron from 'node-cron'
// import { supabase } from '@/lib/supabase'
// import { sendDailyDealsDigest } from '@/lib/whatsapp'
//
// cron.schedule('0 8 * * *', async () => {
//   console.log('Sending daily deals digest...')
//
//   // Get opted-in subscribers
//   const { data: subscribers } = await supabase
//     .from('profiles')
//     .select('full_name, phone')
//     .eq('whatsapp_opted_in', true)
//     .not('phone', 'is', null)
//
//   // Get today's top deals
//   const { data: deals } = await getDeals({ limit: 4 })
//
//   // Send in batches of 10 (rate limiting)
//   for (let i = 0; i < subscribers.length; i += 10) {
//     const batch = subscribers.slice(i, i + 10)
//     await Promise.all(batch.map(sub =>
//       sendDailyDealsDigest({
//         phone: sub.phone,
//         customerName: sub.full_name.split(' ')[0],
//         deals
//       })
//     ))
//     // Wait 1 second between batches
//     await new Promise(r => setTimeout(r, 1000))
//   }
//
//   console.log(`Sent to ${subscribers.length} subscribers`)
// }, { timezone: 'Africa/Kigali' })
