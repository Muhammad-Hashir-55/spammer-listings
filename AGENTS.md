<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Spammer Listings — Project Context

A full-stack Next.js 16 community-driven platform for reporting phone spammers.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Database**: MongoDB Atlas (Mongoose 9, singleton connection pattern)
- **Auth**: NextAuth.js v5 (credentials provider, bcryptjs, JWT strategy)
- **Image Upload**: Cloudinary Upload Widget (client-side unsigned preset)
- **Email**: Nodemailer (SMTP via Gmail App Passwords)
- **Styling**: Tailwind CSS v4 + shadcn/ui-style components
- **Theme**: next-themes (light/dark toggle, system default)
- **Icons**: lucide-react
- **Toasts**: react-hot-toast
- **Validation**: Zod (available for extended use)

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Public homepage (redirects signed-in users to /listings)
│   ├── layout.tsx            # Root layout — ThemeProvider, SessionProvider, Navbar, Toaster
│   ├── globals.css           # Tailwind + CSS variables for light/dark
│   ├── auth/
│   │   ├── signin/page.tsx   # Credentials sign-in with "Forgot password?" link
│   │   ├── signup/page.tsx   # Registration (name, email, phone, password)
│   │   ├── forgot-password/  # Email form → sends reset link
│   │   └── reset-password/   # Token in URL → new password form
│   ├── listings/
│   │   ├── page.tsx          # Protected — real-time search, filters, pagination, FAB
│   │   ├── new/page.tsx      # Report form with Cloudinary upload, char counter
│   │   └── [id]/page.tsx     # Detail page: confirm toggle, lightbox gallery, admin actions
│   ├── admin/page.tsx        # Admin dashboard — tabs (pending/approved/rejected), stats
│   └── api/
│       ├── auth/
│       │   ├── [...nextauth]/  # NextAuth handler
│       │   ├── signup/         # POST — create user with bcrypt
│       │   ├── forgot-password/ # POST — generate token, send email
│       │   └── reset-password/  # POST — validate token, update password
│       ├── spammers/
│       │   ├── route.ts         # GET (paginated with filters) / POST (create)
│       │   ├── search/route.ts  # GET — real-time search (regex)
│       │   └── [id]/route.ts    # GET + PATCH (confirm toggle / admin status)
│       └── admin/
│           ├── stats/route.ts   # GET — dashboard stats (admin only)
│           └── spammers/route.ts # GET — listing by status (admin only)
├── components/
│   ├── navbar.tsx           # Sticky nav with avatar dropdown, theme toggle, mobile menu
│   ├── theme-provider.tsx   # next-themes provider wrapper
│   ├── session-provider.tsx # next-auth SessionProvider wrapper
│   └── ui/                  # Button, Input, Label, Badge, Avatar, DropdownMenu
├── lib/
│   ├── auth.ts              # NextAuth configuration
│   ├── db.ts                # Mongoose singleton connection
│   ├── utils.ts             # cn() helper (clsx + tailwind-merge)
│   ├── mail.ts              # Nodemailer transporter + email templates
│   └── models/
│       ├── user.ts          # User schema (name, email, phone, password, role)
│       ├── spammer.ts       # Spammer schema (phone, name, org, screenshots, confirmedBy, status)
│       └── passwordReset.ts # Token schema (email, token, expiresAt, used)
└── types/
    └── next-auth.d.ts       # Type augmentation for NextAuth session/JWT
```

## Key Routes

| Route | Auth | Description |
|-------|------|-------------|
| `/` | No | Homepage (redirects logged-in users → /listings) |
| `/auth/signin` | No | Sign in |
| `/auth/signup` | No | Sign up |
| `/auth/forgot-password` | No | Request password reset |
| `/auth/reset-password?token=` | No | Complete password reset |
| `/listings` | Yes | Browse spammers with search & filters |
| `/listings/new` | Yes | Submit new spammer report |
| `/listings/[id]` | Yes | Spammer details & confirm/actions |
| `/admin` | Admin | Manage pending/approved/rejected reports |

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/signup` | No | Register user |
| POST | `/api/auth/forgot-password` | No | Request reset email |
| POST | `/api/auth/reset-password` | No | Reset password |
| GET | `/api/spammers/search?q=` | No | Live search (approved + user's pending) |
| GET | `/api/spammers?page=&org=&minConfirmed=&sort=` | No | Paginated listings |
| POST | `/api/spammers` | Yes | Create report (status: pending) |
| GET | `/api/spammers/[id]` | No | Report detail |
| PATCH | `/api/spammers/[id]` | Yes | Confirm toggle or status change (admin) |
| GET | `/api/admin/stats` | Admin | Dashboard stats |
| GET | `/api/admin/spammers?status=` | Admin | Reports by status |

## Database Notes

- New reports default to `status: "pending"` — visible only to the reporter until approved
- Approved reports visible to everyone
- `GET /api/spammers` returns approved reports + the current user's own pending ones
- `confirmedBy` is a toggle — clicking again removes the confirmation
- Phone numbers are the primary identifier, but each submission is a separate document

## Environment Variables

```
MONGODB_URI=             # MongoDB Atlas connection string
NEXTAUTH_SECRET=         # openssl rand -base64 32
NEXTAUTH_URL=            # http://localhost:3000
CLOUDINARY_CLOUD_NAME=   # Cloudinary cloud name
CLOUDINARY_API_KEY=      # Cloudinary API key
CLOUDINARY_API_SECRET=   # Cloudinary API secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=  # Same as above (client-side)
SMTP_HOST=               # smtp.gmail.com
SMTP_PORT=               # 587
SMTP_SECURE=             # false
SMTP_USER=               # your-email@gmail.com
SMTP_PASS=               # Gmail App Password
```

## Build Commands

```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint