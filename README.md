# SkillSwap — Peer Skill-Exchange & Tutoring Platform

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-Vite-blue.svg)](https://vitejs.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-ISC-purple.svg)]()

video link-https://drive.google.com/drive/folders/1lPRkCn-SZ2_dTnLNwtnoV7Ho4fHAV_KU?usp=drive_link

> A full-stack MERN platform empowering college students and peers to either **swap skills** directly (*"I teach you React, you teach me Guitar"*) or **teach for money** (*₹50–₹5,000/hr*) if they do not want to learn anything new.

---

## 1. Problem Statement
College students frequently want to learn technical and creative skills (programming, instruments, languages, design, academics) from their peers, but face two main barriers:
1. Traditional tutoring platforms only support monetary transactions and charge hefty commissions.
2. Barter/swap networks fail when one party only wants to teach for income, or when skill interests don't align bidirectionally.

**SkillSwap** solves this with a dual-mode peer economy:
- **Mutual Swaps**: Automated matching connects students who want what the other teaches.
- **Paid Tutoring**: Students can list skills with hourly rates (₹) and students can book them with an escrow-protected payment model.
- **Tutor-Only Participation**: Users with **no wanted skills** can participate purely as paid tutors.

---

## 2. Key Features
- **Categorized Skills Catalog & Alias Normalization**: Over 70 canonical skills across 7 categories (Programming, Design, Music, Languages, Academics, Creative, Life Skills). Server normalizes abbreviations (e.g., `js` → `javascript`, `reactjs` → `react`, `py` → `python`).
- **Deterministic 4-Tier Matching Engine**:
  - `mutual-swap`: Bidirectional exchange overlap.
  - `paid-tutor`: Other user teaches what I want for money (with transparent rates).
  - `potential-student`: Other user wants what I teach for money (students who might pay me).
  - `one-way-swap`: Exactly one swap direction has an overlap.
- **Server-Side Pricing & Security**: Client-supplied rates or prices are never trusted. The server computes price: `round(ratePerHour * durationMinutes / 60)`.
- **Escrow-Protected Session Lifecycle**:
  - `pending` → `accepted` (scheduled with confirmed slot & meeting link) → `completed`.
  - For paid sessions: `unpaid` → `held` (in escrow upon booking payment) → `released` (upon completed session) or `refunded` (upon cancellation).
- **Earnings & Escrow Wallet**: Track total released earnings, funds pending in escrow, and total student expenditure with a full transaction ledger.
- **Interactive Single-Page Application**: Responsive React UI built with Vite, tabbed match discovery, request scheduling modals, and 1-click Demo account login.

---

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| **Backend** | Node.js, Express.js, MongoDB (Mongoose), JSON Web Tokens (JWT), bcryptjs, cors, dotenv, express-validator |
| **Frontend** | React 19 (Vite), React Router v7, Lucide React icons, Native Responsive CSS Design System |
| **Testing** | Jest unit test suite for the pure matching engine + integration lifecycle verification |
| **Database** | MongoDB with Mongoose schemas and compound indexes |

---

## 4. Repository Structure

```
skillswap/
├── server/
│   ├── config/
│   │   └── db.js                 # Mongoose connection utility
│   ├── controllers/
│   │   ├── authController.js     # Register, login, getMe
│   │   ├── userController.js     # Update profile, public profile
│   │   ├── matchesController.js  # Scored compatibility queries
│   │   ├── requestsController.js # Swap & Paid lifecycle + escrow
│   │   └── walletController.js   # Earnings & transaction ledger
│   ├── data/
│   │   └── skills.js             # 70+ canonical skills & alias mapping
│   ├── middleware/
│   │   ├── auth.js               # JWT bearer verification
│   │   └── errorHandler.js       # Centralized error handler
│   ├── models/
│   │   ├── User.js               # User schema with offered/wanted/earnings
│   │   └── SessionRequest.js     # Swap & paid request schema + payment states
│   ├── routes/
│   │   ├── auth.js               # /api/auth
│   │   ├── users.js              # /api/users
│   │   ├── skills.js             # /api/skills
│   │   ├── matches.js            # /api/matches
│   │   ├── requests.js           # /api/requests
│   │   └── wallet.js             # /api/wallet
│   ├── utils/
│   │   ├── matching.js           # Pure matching algorithm & scoring
│   │   └── normalize.js          # Skill string & alias normalizer
│   ├── __tests__/
│   │   └── matching.test.js      # 13 Jest unit tests for matching engine
│   ├── scripts/
│   │   └── test-flows.js         # End-to-end integration lifecycle test
│   ├── seed.js                   # 14 demo users & sessions seed script
│   ├── server.js                 # Express application entry
│   ├── package.json
│   └── .env.example
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx        # Navigation header & user status
│   │   │   ├── ProtectedRoute.jsx# Auth route guard
│   │   │   └── RequestModal.jsx  # Booking modal for swap & paid
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Global user auth state
│   │   ├── pages/
│   │   │   ├── Login.jsx         # Sign in with Quick Demo button
│   │   │   ├── Register.jsx      # Account creation
│   │   │   ├── Matches.jsx       # Category tabs & match discovery
│   │   │   ├── RequestsDashboard.jsx # Incoming & outgoing sessions
│   │   │   ├── Wallet.jsx        # Earnings, escrow & ledger
│   │   │   ├── Profile.jsx       # Edit skills, modes, rates & bio
│   │   │   └── PublicProfile.jsx # Public profile view (/u/:id)
│   │   ├── api.js                # Fetch wrapper with JWT headers
│   │   ├── App.jsx               # Router configuration
│   │   ├── index.css             # Glassmorphism & responsive CSS system
│   │   └── main.jsx
│   ├── vite.config.js
│   ├── package.json
│   └── .env.example
├── .gitignore
└── README.md
```

---

## 5. Matching Algorithm & Worked Example

The matching algorithm is implemented as a pure function in [`server/utils/matching.js`](file:///d:/Study%20Material/MERN%20Project/server/utils/matching.js).

### Eligibility Definitions
- `swapEligible(skill)`: `mode === 'swap' || mode === 'both'`
- `paidEligible(skill)`: `mode === 'paid' || mode === 'both'`
- `theyTeachMeSwap = other.offered(swapEligible) ∩ me.wanted`
- `iTeachThemSwap = me.offered(swapEligible) ∩ other.wanted`
- `theyTeachMePaid = other.offered(paidEligible) ∩ me.wanted` (with other's rates)
- `iTeachThemPaid = me.offered(paidEligible) ∩ other.wanted` (with my rates)

### Match Categories & Scoring
| Category | Condition | Formula |
|---|---|---|
| **mutual-swap** | Both `theyTeachMeSwap` and `iTeachThemSwap` non-empty | `60 + 10 * (overlapCount)` |
| **paid-tutor** | `theyTeachMePaid` non-empty | `30 + 5 * (theyTeachMePaid.length)` |
| **potential-student** | `iTeachThemPaid` non-empty | `20 + 5 * (iTeachThemPaid.length)` |
| **one-way-swap** | Exactly one swap direction non-empty | `10 * (overlapCount)` |

A candidate's rank is their highest category score. Candidates with existing pending or accepted sessions for the same skills are automatically excluded to prevent duplicate bookings.

### Rating Ranking Bonus
To highlight verified, high-quality peers and mentors, candidates who have accumulated at least 3 reviews receive a merit bonus added directly to their top match score:
$$\text{Score Bonus} = \text{round}(2 \times \text{ratingAverage}) \quad (\text{applied when } \text{ratingCount} \ge 3)$$
*Example:* Dr. Sameer has a **4.7 ★** rating across 3 completed sessions. His match top score receives a **+9 point bonus**, boosting his visibility in the search ranking.

### Worked Example:
Suppose **Alex** has:
- `offered`: `[{ skill: 'react', mode: 'both', hourlyRate: 400 }]`
- `wanted`: `['guitar', 'python']`

1. **Rohan**: Offers `guitar` (`mode: 'swap'`), wants `react`.
   - `theyTeachMeSwap` = `['guitar']`
   - `iTeachThemSwap` = `['react']`
   - **Result**: `mutual-swap` (Score = 60 + 10*(1+1) = **80**).
2. **Dr. Sameer**: Offers `python` (`mode: 'paid'`, `hourlyRate: 600`), wants `[]` (Tutor-Only!).
   - `theyTeachMePaid` = `[{ skill: 'python', rate: 600 }]`
   - `iTeachThemSwap` = `[]`
   - **Result**: `paid-tutor` (Score = 30 + 5*1 = **35**).
3. **Karan**: Offers `cooking` (`mode: 'swap'`), wants `react`.
   - `iTeachThemPaid` = `[{ skill: 'react', rate: 400 }]`
   - **Result**: `potential-student` (Score = 20 + 5*1 = **25**).

---

## 6. Payment Flow & Escrow State Machine

```
                   [ Request Created ]
                           │
                           ▼ (Receiver accepts slot & meeting link)
                     [ Accepted ]
                           │
                           ▼ (Learner pays: POST /api/requests/:id/pay)
                      [ Held ]  ──(Simulated Escrow: funds held safely)
                     /        \
(Learner/Initiator  /          \ (Either party marks session completed)
 cancels before    /            \
 scheduled time)  /              \
                 ▼                ▼
           [ Refunded ]     [ Released ]
                           (Teacher earnings += price;
                            Both sessionsCompleted++)
```

### Simulated Provider & Razorpay Swap-in Architecture
The current payment flow simulates an escrow gateway by generating a secure pseudo-transaction reference (`sim_pay_<timestamp>_<hash>`) and locking the funds until delivery.

To switch to a live **Razorpay Test-Mode Gateway**:
1. Install `razorpay` in `server`: `npm install razorpay`.
2. In `POST /api/requests/:id/pay`: Call `razorpay.orders.create({ amount: request.price * 100, currency: "INR" })` and send the `order_id` to the client.
3. In client: Open the Razorpay Standard Checkout modal with the returned `order_id`.
4. Webhook / Verification endpoint: Verify HMAC SHA256 signature `razorpay_signature` using `process.env.RAZORPAY_KEY_SECRET`. Upon confirmation, set `paymentStatus = 'held'`.
5. On completion: Trigger Razorpay Route / Payout API to transfer the funds to the tutor's bank account.

---

## 7. REST API Reference

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `POST` | `/api/auth/register` | No | Register new user with name, email, password |
| `POST` | `/api/auth/login` | No | Login and receive 7-day JWT token |
| `GET` | `/api/auth/me` | Yes | Get currently authenticated user profile |
| `GET` | `/api/skills` | No | Get canonical skills catalog & alias dictionary |
| `PUT` | `/api/users/me` | Yes | Update profile, offered skills with rates, wanted skills |
| `GET` | `/api/users/:id` | Yes | View public user profile and sessions count |
| `GET` | `/api/matches?category=` | Yes | Get sorted compatibility matches (`all`, `mutual-swap`, `paid-tutor`, `potential-student`) |
| `POST` | `/api/requests` | Yes | Create swap or paid session request (1-3 proposed slots) |
| `GET` | `/api/requests?box=` | Yes | Get session requests (`incoming` or `outgoing`) |
| `PATCH`| `/api/requests/:id/accept` | Yes | Receiver accepts request, picks slot, and provides meeting link |
| `PATCH`| `/api/requests/:id/reject` | Yes | Receiver rejects pending request |
| `PATCH`| `/api/requests/:id/cancel` | Yes | Initiator cancels pending request; or learner refunds held payment |
| `PATCH`| `/api/requests/:id/complete`| Yes | Marks session complete; releases payment to tutor |
| `POST` | `/api/requests/:id/pay` | Yes | Learner pays for accepted session; moves funds to `held` |
| `POST` | `/api/requests/:id/review` | Yes | Submit 1–5 star rating and optional comment for a completed session |
| `GET` | `/api/users/:id/reviews` | Yes | Get paginated peer reviews for a user with optional skill filter |
| `GET` | `/api/wallet` | Yes | Get released earnings, pending escrow, spent total, and ledger |

---

## 8. Data Models (Mongoose)

### User Model
- `name`: String (required, max 100)
- `email`: String (required, unique, lowercase)
- `password`: String (bcrypt hashed, never selected by default)
- `bio`: String (max 300)
- `availability`: String
- `offered`: Array of:
  - `skill`: Normalized string key
  - `mode`: `"swap"` | `"paid"` | `"both"`
  - `hourlyRate`: Number (INR, ₹50–₹5,000 for paid/both, null for swap)
- `wanted`: Array of normalized skill string keys (*May be empty for tutor-only accounts*)
- `sessionsCompleted`: Number (default 0)
- `earnings`: `{ totalReleased: Number (default 0) }`
- `ratingAverage`: Number (default 0, recalculated on every new review)
- `ratingCount`: Number (default 0)

### Review Model
- `session`: Ref `SessionRequest` (required)
- `reviewer`: Ref `User` (required)
- `reviewee`: Ref `User` (required)
- `skill`: String (skill taught during the session)
- `rating`: Number (integer 1–5, required)
- `comment`: String (max 300, optional)
- `countsTowardRating`: Boolean (default true; for paid sessions, only learner reviews of tutor count toward tutor rating)
- `timestamps`: `createdAt`, `updatedAt`
- Compound Unique Index: `(session, reviewer)` — prevents duplicate reviews per user per session.

### SessionRequest Model
- `type`: `"swap"` | `"paid"`
- `initiatedBy`: Ref `User`, `receiver`: Ref `User`
- **SWAP Fields**: `skillTeachByInitiator`, `skillTeachByReceiver`
- **PAID Fields**: `teacher`, `learner`, `skill`, `durationMinutes` (30 | 60 | 90), `ratePerHourSnapshot`, `price` (computed server-side), `paymentStatus` (`unpaid` | `held` | `released` | `refunded`), `paymentRef`
- `message`: String (max 300)
- `proposedSlots`: Array of 1–3 future Date objects
- `status`: `"pending"` | `"accepted"` | `"rejected"` | `"cancelled"` | `"completed"`
- `scheduledAt`: Date, `meetingLink`: String

---

## 9. Local Setup & Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB running locally on port 27017 or a MongoDB Atlas connection string

### 1. Server Setup
```bash
cd server
npm install
cp .env.example .env
# Edit .env if you are using MongoDB Atlas or custom port
npm run seed     # Seeds 14 demo users and live session data
npm test         # Runs unit test suite for matching engine
npm run dev      # Starts server on http://localhost:5000
```

### 2. Client Setup
```bash
cd ../client
npm install
cp .env.example .env
npm run dev      # Starts Vite dev server on http://localhost:5173
```

---

## 10. Demo Credentials
The seed script (`npm run seed`) populates 14 realistic peer profiles designed to demonstrate all matching scenarios:

| Role | Email | Password | What You Can Test |
|---|---|---|---|
| **Primary Demo** | `demo@skillswap.com` | `Demo@1234` | Sees **every** match tab (Mutual swaps, Paid tutors, Students for you, One-way) + live escrow session + completed session |
| **Mutual Partner** | `rohan.guitar@skillswap.com` | `Demo@1234` | Acoustic guitarist looking for React (Perfect mutual swap partner) |
| **Paid Tutor Only** | `sameer.tutor@skillswap.com` | `Demo@1234` | PhD ML/Python expert with **empty wanted list** teaching for ₹600/hr |
| **Student** | `karan.student@skillswap.com` | `Demo@1234` | Sophomore student looking for React tutoring |

---

## 11. Deployment Guide

### A. Database (MongoDB Atlas)
1. Create a free M0 cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Under **Network Access**, whitelist all IPs (`0.0.0.0/0`).
3. Under **Database Access**, create a user and copy the connection string:
   `mongodb+srv://<user>:<password>@cluster0.mongodb.net/skillswap?retryWrites=true&w=majority`

### B. Backend (Render / Railway)
1. Create a new Web Service pointing to the `/server` folder.
2. Build Command: `npm install`
3. Start Command: `npm start`
4. Set Environment Variables:
   - `PORT`: `5000`
   - `MONGO_URI`: `<Your MongoDB Atlas connection URI>`
   - `JWT_SECRET`: `<A strong random secret>`
   - `CLIENT_URL`: `https://your-skillswap-client.vercel.app`

### C. Frontend (Vercel)
1. Import repository on [netlify.com]
2. Set Root Directory to `client`.
3. Set Framework Preset to `Vite`.
4. Environment Variables:
   - `VITE_API_URL`: `https://your-skillswap-server.onrender.com/api`
5. Deploy!

---

## 12. Future Enhancements
- **Peer Ratings & Reviews**: Post-session star ratings and verified testimonials on public tutor profiles.
- **Production Payment Gateway**: Direct integration with Razorpay Route or Stripe Connect for automated tutor bank payouts.
- **In-App Notifications**: WebSockets / Server-Sent Events (SSE) for instant booking alerts.
- **Calendar Synchronization**: Google Calendar / Outlook `.ics` export for scheduled sessions.
- **In-Platform Direct Messaging**: Pre-session chat for exchanging preparatory materials.
