# UMGORA — Exclusive Membership Club

A full-stack, premium single-page web application for the UMGORA exclusive membership club.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Vanilla CSS (custom design system) |
| Database | Supabase (PostgreSQL) |
| Payments | Stripe Checkout (Test Mode) |

---

## Setup Instructions

### 1. Install Dependencies

```bash
npm install --cache .npm-cache
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

**Required variables:**

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API (secret!) |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | See step 4 below |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` for dev |

### 3. Set Up Database

Run the SQL in `supabase-schema.sql` in your Supabase SQL Editor:

1. Go to Supabase Dashboard → SQL Editor
2. Paste the contents of `supabase-schema.sql`
3. Click **Run**

### 4. Set Up Stripe Webhook (for local dev)

Install Stripe CLI: https://stripe.com/docs/stripe-cli

```bash
# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhook
```

Copy the webhook signing secret printed by the CLI (starts with `whsec_`) and add to `.env.local`.

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Pages

| Route | Description |
|---|---|
| `/` | Landing page — hero, CTA, features |
| `/login` | Login portal for admin access |
| `/dashboard` | User dashboard with Digital VIP Card |
| `/payment/success` | Post-payment success page |
| `/admin` | Admin dashboard (requires admin login) |

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/checkout` | POST | Creates Stripe Checkout session |
| `/api/webhook` | POST | Stripe webhook handler (saves member to DB) |
| `/api/admin` | POST | Admin login → sets HTTP-only cookie |
| `/api/admin` | GET | Fetches all members (admin only) |
| `/api/admin` | DELETE | Admin logout |
| `/api/member` | GET | Lookup member by Stripe session ID |

---

## Admin Access

Navigate to `/login` and use:
- **Email:** `admin@umgora.com`
- **Password:** `Umgora202*6*00`

---

## Testing Payments

Use Stripe test card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

---

## Deployment (Vercel)

1. Push to GitHub
2. Import in Vercel
3. Add all env variables in Vercel dashboard
4. Set `NEXT_PUBLIC_APP_URL` to your production URL
5. In Stripe Dashboard, add a webhook endpoint: `https://yourdomain.com/api/webhook`
   - Events to listen for: `checkout.session.completed`
