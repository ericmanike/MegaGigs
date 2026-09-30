# MegaGigs / OKGigs - Project Documentation

## 1. Project Overview
MegaGigs (internally tracked as OKGigs) is a Next.js full-stack web application designed to facilitate the purchase of digital telecommunication services and educational products. The platform allows users to purchase data bundles, airtime, educational result checkers (WAEC/WASSCE, BECE), and register for AFA.

A core feature of the application is the **Agent System**, which allows users to create their own digital "Data Shop". Agents can resell data bundles at a markup to generate profit, leveraging the platform's API integrations and wallet system.

## 2. Key Features
- **Data Bundle Purchasing:** Buy MTN, Telecel, and AirtelTigo data bundles instantly.
- **Educational Result Checkers:** Integrated modules for purchasing WAEC and BECE result checker PINs.
- **Agent Reseller Program:** Users can upgrade to "Agent" status for free, giving them a customized shop to resell bundles. Agents set their own custom pricing to make a profit margin on base prices.
- **Wallet System:** Users have a built-in digital wallet (`walletBalance`) that can be topped up to make faster, seamless purchases.
- **Transaction History:** A unified ledger showing all credits (wallet top-ups) and debits (bundle purchases, result checkers).
- **Payment Gateway:** Fully integrated with **Paystack** for secure Momo and card transactions.
- **Third-Party Providers:** The backend seamlessly interacts with external data providers like **Dakazina** and **Spendless** to fulfill orders automatically.

## 3. Technology Stack
- **Framework:** Next.js 16 (React 19)
- **Styling:** Tailwind CSS v4, styled-components, clsx, tailwind-merge
- **Authentication:** NextAuth.js
- **Database:** MongoDB (via Mongoose)
- **Icons:** Lucide-React, React Icons
- **Rate Limiting:** Upstash Redis & Upstash Ratelimit
- **Email:** Resend
- **Language:** TypeScript

## 4. Core Architecture & Folder Structure
- `/app`: The Next.js App Router directory containing all frontend pages and API routes.
  - `/app/api`: All backend endpoints.
    - `/api/topupWallet`: Handles wallet top-up logic and creates transaction logs.
    - `/api/agent/purchase`: Handles backend execution of orders placed through an Agent's shop.
    - `/api/registerAgent`: Handles user role conversion to an agent.
  - `/app/dashboard`: Protected user dashboard area containing `transactions`, `orders`, `upgrade`, and `result-checkers`.
  - `/app/buy`: Public/User flow for buying data bundles directly.
- `/models`: Mongoose database schemas (`User.ts`, `Transaction.ts`, `Order.ts`, `Bundle.ts`, `AgentStore.ts`, `SystemLog.ts`, etc.).
- `/components`: Reusable UI components (e.g., `BecomeAgent.tsx`, `Card.tsx`).
- `/lib`: Helper functions and configurations (e.g., `mongoose.ts` for DB connection, `auth.ts` for NextAuth configs, `utils.ts`).

## 5. Third-Party Integrations
### Payment
- **Paystack:** Used via the `inline.js` script on the client side for handling instant payments via Mobile Money (Momo) or card.

### Telecommunication Data Providers
The application has a configurable provider system (stored in the DB `Setting` model) to switch between multiple upstream APIs for data bundle fulfillment:
1. **Dakazina** (`dakazina`)
2. **Spendless** (`spendless`)
3. **Datamart** (`datamart`)
4. **Data Bundles Hub** (`databundleshub`)

When a purchase is made, the backend automatically maps the requested network (MTN, Telecel, AirtelTigo) to the respective provider's expected network ID/key format and fires the request.

## 6. Key Workflows
### A. The Agent System
1. A user clicks "Create Your Data Shop" on the dashboard.
2. The `/api/registerAgent` endpoint updates the user's role to `agent`.
3. The agent is granted access to the `/dashboard/store` route where they can curate bundles and set custom prices (`customPrice`).
4. When a buyer purchases from an agent's shop, the system deducts the `customPrice` from the buyer/agent wallet, fulfills the order, and updates the agent's `totalProfit`.

### B. Wallet & Transactions System
1. Users top up their wallet via Paystack.
2. The `/api/topupWallet` endpoint verifies the payment and increases the user's `walletBalance`.
3. The system logs a `Transaction` document with `transactionType: 'credit'` and `type: 'topup'`.
4. When a user buys a bundle using their wallet, the balance decreases, and a `Transaction` document is saved with `transactionType: 'debit'` and `type: 'purchase'`.
5. The `/dashboard/transactions` page aggregates these records to show a clean financial history of Total Credits and Total Debits.

## 7. Development & Setup

### Requirements
- Node.js (v20+)
- MongoDB connection string

### Running Locally
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. The server will be running on `http://localhost:3000`.

### Essential Environment Variables
To run the application properly, the following environment variables need to be configured in `.env.local`:
- `MONGODB_URI` - Connection string for MongoDB.
- `NEXTAUTH_SECRET` - NextAuth encryption key.
- `NEXTAUTH_URL` - Base URL of the application.
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` - Paystack public key for frontend checkout.
- `PAYSTACK_SECRET_KEY` - Paystack secret key for backend verification.
- `DAKAZI_API_KEY` - Upstream provider API key.
- `SPENDLESS_API_KEY` - Upstream provider API key.
- `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN` - For rate limiting.
