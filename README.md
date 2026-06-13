# Spammer Listings

A community-driven platform where authenticated users can report phone spammers to protect others. Built with Next.js 16, MongoDB, and NextAuth.js.

## Features

- **Public Homepage** — Hero section, live stats, "How It Works" section. Signed-in users are redirected to /listings.
- **Authentication** — Email/password signup and sign-in with bcrypt hashing. "Forgot password?" flow with email reset link via Nodemailer.
- **Spammer Listings** — Real-time search (debounced 200ms), filter by organization/confirmations/sort, paginated results (10/page). Floating "Report" button.
- **Report Spammer** — Form with phone (required), name, org, description (500 char limit), Cloudinary image uploads (max 5).
- **Spammer Detail** — Full info, lightbox gallery for screenshots, "Confirm this Report" toggle (one per user), admin approve/reject buttons.
- **Admin Dashboard** — Stats cards (pending/approved/rejected/users), tabbed listing by status, approve/reject actions.
- **Theme Support** — Light/dark mode toggle (next-themes, system default).
- **Responsive** — Mobile-first layout with collapsible navigation.

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| Next.js 16 | Framework (App Router, Turbopack) |
| MongoDB Atlas | Database (Mongoose 9) |
| NextAuth.js v5 | Authentication (credentials provider, JWT) |
| bcryptjs | Password hashing |
| Cloudinary | Image upload widget (client-side unsigned) |
| Nodemailer | Password reset emails (SMTP) |
| Tailwind CSS v4 | Styling |
| shadcn/ui | UI components (Button, Input, Badge, Avatar, DropdownMenu) |
| next-themes | Dark/light mode |
| lucide-react | Icons |
| react-hot-toast | Toast notifications |

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Homepage
│   ├── layout.tsx                  # Root layout
│   ├── globals.css                 # Styles & CSS variables
│   ├── auth/
│   │   ├── signin/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   ├── listings/
│   │   ├── page.tsx                # Browse + search
│   │   ├── new/page.tsx            # Report form
│   │   └── [id]/page.tsx           # Detail view
│   ├── admin/page.tsx              # Admin dashboard
│   └── api/
│       ├── auth/
│       │   ├── [...nextauth]/route.ts
│       │   ├── signup/route.ts
│       │   ├── forgot-password/route.ts
│       │   └── reset-password/route.ts
│       ├── spammers/
│       │   ├── route.ts
│       │   ├── search/route.ts
│       │   └── [id]/route.ts
│       └── admin/
│           ├── stats/route.ts
│           └── spammers/route.ts
├── components/
│   ├── navbar.tsx
│   ├── theme-provider.tsx
│   ├── session-provider.tsx
│   └── ui/ (button, input, label, badge, avatar, dropdown-menu)
├── lib/
│   ├── auth.ts        # NextAuth config
│   ├── db.ts          # Mongoose connection
│   ├── mail.ts        # Nodemailer transporter
│   ├── utils.ts       # cn() helper
│   └── models/ (user, spammer, passwordReset)
└── types/
    └── next-auth.d.ts
```

## Getting Started

### Prerequisites

- Node.js 20.9+
- MongoDB Atlas cluster (or local MongoDB)
- Cloudinary account (for image uploads)
- Gmail account with App Password enabled (for password reset emails)

### Environment Variables

Create a `.env.local` file in the root directory:

```env
MONGODB_URI=               # mongodb+srv://...
NEXTAUTH_SECRET=           # openssl rand -base64 32
NEXTAUTH_URL=              # http://localhost:3000
CLOUDINARY_CLOUD_NAME=     # from Cloudinary dashboard
CLOUDINARY_API_KEY=        # from Cloudinary dashboard
CLOUDINARY_API_SECRET=     # from Cloudinary dashboard
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=  # same as above
SMTP_HOST=                 # smtp.gmail.com
SMTP_PORT=                 # 587
SMTP_SECURE=               # false
SMTP_USER=                 # your-email@gmail.com
SMTP_PASS=                 # Gmail App Password
```

### Cloudinary Setup

1. Create a Cloudinary account
2. Enable unsigned uploads
3. Create an upload preset named `spammer_listings`

### Installation

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (Turbopack) |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/signup` | No | Create account |
| POST | `/api/auth/forgot-password` | No | Send reset email |
| POST | `/api/auth/reset-password` | No | Reset password |
| GET | `/api/spammers/search?q=` | No | Live search |
| GET | `/api/spammers?page=&org=&minConfirmed=&sort=` | No | Paginated listings |
| POST | `/api/spammers` | Yes | Create report |
| GET | `/api/spammers/[id]` | No | Report detail |
| PATCH | `/api/spammers/[id]` | Yes | Confirm/status change |
| GET | `/api/admin/stats` | Admin | Dashboard stats |
| GET | `/api/admin/spammers?status=` | Admin | Reports by status |

## License

MIT