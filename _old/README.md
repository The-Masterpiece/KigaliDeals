# KigaliDeals

A thousand deals on a thousand hills. Rwanda's first Groupon-style marketplace.

## Stack

- **Next.js 14** (Pages Router) on Vercel
- **Supabase** for database, auth, storage
- **Claude API** for AI agents
- **MTN MoMo** for payments (coming in Phase 3)
- **Twilio WhatsApp** for voucher delivery (coming in Phase 3)

## Quick setup

### 1. Environment variables

Copy `.env.example` to `.env.local` and fill in your real values.

Required to start:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `CRON_SECRET` (any random long string you make up)

### 2. Database setup

Go to Supabase Dashboard > SQL Editor and run the migration in
`supabase/migrations/20260422000001_agent_foundation.sql`.

### 3. Deploy to Vercel

Push to GitHub, import the repo in Vercel, add all the env vars from `.env.example`,
deploy. Vercel Cron will automatically run the agent dispatcher every minute.

### 4. Test the setup

After deploy, visit:

- `https://your-domain.vercel.app/` — homepage should load
- `https://your-domain.vercel.app/api/health` — should return `{"status": "ok"}`

Then insert a test task in Supabase SQL Editor:

    insert into public.agent_tasks (agent, action, payload)
    values ('merchant', 'test', '{"hello": "world"}'::jsonb);

Within 1-2 minutes, the task status should become `failed` with the error
"no handler registered for agent 'merchant'". That's the expected behavior —
it proves the dispatcher works. We'll add the real merchant agent in Phase 4.

## Build plan

- **Phase 1** — Foundation (Days 1-3) — ✅ You're here
- **Phase 2** — Port pages (Days 4-7) — Deal detail, business signup, user account, admin
- **Phase 3** — Payments + WhatsApp (Days 8-14) — MoMo integration, voucher delivery
- **Phase 4** — AI agents (Days 15-21) — Merchant, Content, Support, Growth, Analyst, Trust
