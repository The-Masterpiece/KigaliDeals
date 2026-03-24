// ============================================================
// lib/momo.js — MTN Mobile Money Payment Integration
// Docs: https://momodeveloper.mtn.com
// Install: npm install axios uuid
// ============================================================

import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'

// ─── CONFIG ─────────────────────────────────────────────────
// Set these in your .env.local file:
//   MOMO_SUBSCRIPTION_KEY=your_collections_subscription_key
//   MOMO_API_USER=your_api_user_uuid  (from sandbox provisioning)
//   MOMO_API_KEY=your_api_key
//   MOMO_ENVIRONMENT=sandbox OR production
//   MOMO_CURRENCY=RWF
//   MOMO_CALLBACK_URL=https://yourdomain.rw/api/momo/callback

const MOMO_BASE = process.env.MOMO_ENVIRONMENT === 'production'
  ? 'https://proxy.momoapi.mtn.com'
  : 'https://sandbox.momodeveloper.mtn.com'

const COLLECTIONS_URL = `${MOMO_BASE}/collection`
const DISBURSEMENTS_URL = `${MOMO_BASE}/disbursement`

// ─── GET ACCESS TOKEN ────────────────────────────────────────
async function getAccessToken(type = 'collection') {
  const baseUrl = type === 'collection' ? COLLECTIONS_URL : DISBURSEMENTS_URL
  const subscriptionKey = process.env.MOMO_SUBSCRIPTION_KEY

  const credentials = Buffer.from(
    `${process.env.MOMO_API_USER}:${process.env.MOMO_API_KEY}`
  ).toString('base64')

  const { data } = await axios.post(
    `${baseUrl}/token/`,
    {},
    {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Ocp-Apim-Subscription-Key': subscriptionKey,
      }
    }
  )
  return data.access_token
}

// ─── REQUEST TO PAY (Customer → KigaliDeals) ────────────────
export async function requestToPay({
  amount,          // number in RWF
  phoneNumber,     // e.g. "250780000000" (no spaces, with country code)
  externalId,      // your order/voucher ID
  payerMessage,    // shown to customer in MoMo prompt
  payeeNote,       // internal note
}) {
  const referenceId = uuidv4()
  const token = await getAccessToken('collection')

  // Normalize phone: ensure 250XXXXXXXXX format
  const phone = normalizePhone(phoneNumber)

  try {
    await axios.post(
      `${COLLECTIONS_URL}/v1_0/requesttopay`,
      {
        amount: String(Math.round(amount)),
        currency: process.env.MOMO_CURRENCY || 'RWF',
        externalId,
        payer: {
          partyIdType: 'MSISDN',
          partyId: phone
        },
        payerMessage: payerMessage || `KigaliDeals purchase`,
        payeeNote: payeeNote || `Order ${externalId}`
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Reference-Id': referenceId,
          'X-Target-Environment': process.env.MOMO_ENVIRONMENT || 'sandbox',
          'X-Callback-Url': process.env.MOMO_CALLBACK_URL,
          'Ocp-Apim-Subscription-Key': process.env.MOMO_SUBSCRIPTION_KEY,
          'Content-Type': 'application/json'
        }
      }
    )
    return { success: true, referenceId }
  } catch (err) {
    console.error('MoMo requestToPay error:', err.response?.data || err.message)
    return { success: false, error: err.response?.data || err.message }
  }
}

// ─── CHECK PAYMENT STATUS ────────────────────────────────────
export async function getPaymentStatus(referenceId) {
  const token = await getAccessToken('collection')

  try {
    const { data } = await axios.get(
      `${COLLECTIONS_URL}/v1_0/requesttopay/${referenceId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Target-Environment': process.env.MOMO_ENVIRONMENT || 'sandbox',
          'Ocp-Apim-Subscription-Key': process.env.MOMO_SUBSCRIPTION_KEY,
        }
      }
    )
    // Status: PENDING | SUCCESSFUL | FAILED
    return { success: true, status: data.status, data }
  } catch (err) {
    return { success: false, error: err.response?.data || err.message }
  }
}

// ─── TRANSFER TO BUSINESS (KigaliDeals → Business) ──────────
export async function transferToBusiness({
  amount,
  phoneNumber,
  businessId,
  payoutId,
  note,
}) {
  const referenceId = uuidv4()
  const token = await getAccessToken('disbursement')
  const phone = normalizePhone(phoneNumber)

  try {
    await axios.post(
      `${DISBURSEMENTS_URL}/v1_0/transfer`,
      {
        amount: String(Math.round(amount)),
        currency: process.env.MOMO_CURRENCY || 'RWF',
        externalId: payoutId,
        payee: {
          partyIdType: 'MSISDN',
          partyId: phone
        },
        payerMessage: `KigaliDeals payout for business ${businessId}`,
        payeeNote: note || `Weekly payout`
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Reference-Id': referenceId,
          'X-Target-Environment': process.env.MOMO_ENVIRONMENT || 'sandbox',
          'Ocp-Apim-Subscription-Key': process.env.MOMO_SUBSCRIPTION_KEY,
          'Content-Type': 'application/json'
        }
      }
    )
    return { success: true, referenceId }
  } catch (err) {
    console.error('MoMo transfer error:', err.response?.data || err.message)
    return { success: false, error: err.response?.data || err.message }
  }
}

// ─── POLL UNTIL COMPLETE (for background jobs) ──────────────
export async function pollPaymentUntilComplete(referenceId, maxAttempts = 12, intervalMs = 5000) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, intervalMs))
    const { status, data } = await getPaymentStatus(referenceId)

    if (status === 'SUCCESSFUL') return { success: true, data }
    if (status === 'FAILED') return { success: false, error: 'Payment failed', data }
  }
  return { success: false, error: 'Payment timed out' }
}

// ─── HELPERS ─────────────────────────────────────────────────
function normalizePhone(phone) {
  const digits = phone.replace(/\D/g, '')
  // Rwanda: 07X → 2507X
  if (digits.startsWith('07') || digits.startsWith('08')) {
    return '250' + digits.slice(1)
  }
  if (digits.startsWith('250')) return digits
  return '250' + digits
}

// ============================================================
// NEXT.JS API ROUTES
// ============================================================
// pages/api/payments/initiate.js
// ─────────────────────────────
// import { requestToPay } from '@/lib/momo'
// import { purchaseVoucher } from '@/lib/supabase'
// import { getUser } from '@/lib/supabase'
//
// export default async function handler(req, res) {
//   if (req.method !== 'POST') return res.status(405).end()
//
//   const { dealId, quantity, phoneNumber } = req.body
//   const user = await getUser() // get from session
//
//   // 1. Initiate MoMo payment
//   const { success, referenceId, error } = await requestToPay({
//     amount: req.body.totalAmount,
//     phoneNumber,
//     externalId: dealId,
//     payerMessage: `KigaliDeals: ${req.body.dealTitle}`,
//   })
//
//   if (!success) return res.status(400).json({ error })
//
//   // 2. Record pending payment in DB
//   await supabase.from('payments').insert({
//     user_id: user.id,
//     amount: req.body.totalAmount,
//     method: 'momo',
//     provider_ref: referenceId,
//     status: 'pending',
//     metadata: { dealId, quantity, phoneNumber }
//   })
//
//   res.json({ success: true, referenceId })
// }

// pages/api/momo/callback.js
// ──────────────────────────
// export default async function handler(req, res) {
//   // MoMo calls this URL when payment completes
//   const { referenceId, status, financialTransactionId } = req.body
//
//   if (status === 'SUCCESSFUL') {
//     // Find pending payment
//     const { data: payment } = await supabase
//       .from('payments')
//       .select('*')
//       .eq('provider_ref', referenceId)
//       .single()
//
//     if (payment) {
//       // Complete the voucher purchase
//       const result = await purchaseVoucher({
//         dealId: payment.metadata.dealId,
//         userId: payment.user_id,
//         quantity: payment.metadata.quantity,
//         paymentMethod: 'momo',
//         paymentRef: financialTransactionId
//       })
//
//       // Update payment status
//       await supabase.from('payments')
//         .update({ status: 'completed', provider_status: 'SUCCESSFUL' })
//         .eq('id', payment.id)
//
//       // Send WhatsApp confirmation (see step3)
//       if (result.data?.success) {
//         await sendWhatsAppVoucher({
//           phone: payment.metadata.phoneNumber,
//           voucherCode: result.data.voucher_code,
//           dealTitle: payment.metadata.dealTitle,
//           expiresAt: result.data.expires_at
//         })
//       }
//     }
//   }
//
//   res.status(200).end()
// }

export default {
  requestToPay,
  getPaymentStatus,
  transferToBusiness,
  pollPaymentUntilComplete,
  normalizePhone
}
