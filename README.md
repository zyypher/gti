# 🗂️ Gulbahar Tobacco International — Admin Dashboard

![Banner](./images/banner-gti-dashboard.png)
<!-- Place your screenshot at /docs/banner-gti-dashboard.png or /public/banner-gti-dashboard.png -->

An enterprise admin dashboard for **Gulbahar Tobacco International (GTI)** to manage product catalogs and operations.

The platform supports **brands**, **products**, **non‑product pages**, **PDF ingestion & merging**, **order generation**, **notifications**, **settings**, **users**, **clients**, and granular **permissions** — all built on **Next.js 14**, **Prisma**, and **PostgreSQL**, with **AWS S3** for file storage and **pdf-lib** for advanced PDF workflows.

---

## ✨ Key Features

- **Catalog Management**
  - Create/update **Brands**, **Products**, and **Non‑Product Pages** (e.g., corporate info, ads).
  - Rich text editing with **React Quill** and media handling via **S3**.
- **PDF Pipeline**
  - Upload multiple PDFs; validate, reorder, and **merge** with scenario presets (catalog, ad‑pack, corporate binder, etc.).
  - Generate **print‑ready PDFs** and archive them securely to S3.
  - Inline previews with **react-pdf**.
- **Orders & Exports**
  - Generate downloadable packages (PDF bundles), track counts and status.
- **Dashboards**
  - KPI cards and **Recharts** visualizations for Users, Brands, Products, Orders, and Generated PDFs.
- **Users & Clients**
  - Role‑based access, OTP flows (via **input-otp**), and client segregation.
- **Notifications**
  - In‑app toasts and **Web Push** support.
- **Performance & UX**
  - **Next.js App Router**, **PWA** ready, **Tailwind** + **Radix UI** components, dark mode via **next‑themes**.
- **Security & Email**
  - JWT‑based auth with `jsonwebtoken/jose`.
  - Optional transactional email via **SendGrid**.

---

## 🛠️ Tech Stack

**Frontend**
- Next.js **14.2** (App Router), React 18, Tailwind CSS, Radix UI (via @radix‑ui), Lucide Icons, next‑themes, next‑pwa

**Backend**
- Next.js Route Handlers / API Routes, Prisma ORM, PostgreSQL (recommended), JWT auth

**Storage / Files**
- AWS S3 (`@aws-sdk/client-s3`, `@aws-sdk/lib-storage`), `pdf-lib`, `react-pdf`

**UI / DX**
- React Hook Form + Zod/Yup resolvers, React Quill editor, TanStack Table, Sonner/Hot‑Toast, Recharts

**Utilities**
- Date‑fns, Axios, SortableJS, Embla Carousel

---

## 📸 Modules (from the UI)

- **Dashboard** — KPIs (Users, Brands, Products, Corporate Info, Ads, Generated PDFs, Orders) + charts
- **Catalog**
  - **Brands** — CRUD, logo/media uploads
  - **Products** — CRUD, specs, assets, pricing
  - **Non Product Pages** — corporate pages, ads, legal, etc.
  - **Generated PDFs** — history, download, archive
  - **Orders** — PDF orders & exports
  - **Notifications** — in‑app & push
- **Configuration**
  - **Settings** — app/client/env toggles
  - **Users** — roles, invitations, OTP
  - **Clients** — multi‑tenant setup (optional)

---

## 🚀 Getting Started

```bash
# 1) Install deps
pnpm install   # or: npm install / yarn

# 2) Prepare .env (see "Environment Variables")
cp .env.example .env

# 3) Generate Prisma Client & run migrations/seed (PostgreSQL recommended)
pnpm prisma generate
pnpm prisma migrate dev
pnpm prisma db seed    # uses prisma/seed.js

# 4) Dev server
pnpm dev    # -> http://localhost:3000

# 5) Production build
pnpm build && pnpm start
```

> **Node**: v18+ or v20+ recommended.

---

## 🔐 Environment Variables

Create a `.env` file (see `.env.example`). Common variables:

```ini
# Database (PostgreSQL)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public"

# Web app
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# JSON Web Tokens
JWT_SECRET="generate-a-strong-random-string"

# AWS S3
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_S3_BUCKET="gti-uploads"
AWS_S3_REGION="ap-south-1"

# Email (optional)
SENDGRID_API_KEY=""
EMAIL_FROM="noreply@gti.example"

# PWA (optional)
NEXT_PUBLIC_ENABLE_PWA="true"
```

> If you deploy to **Vercel**, set the same variables in **Project → Settings → Environment Variables**.

---

## 🧩 PDF Workflows (Overview)

- Upload **multiple PDFs** for a brand or product line.
- Define **merge scenarios** (Catalog, Corporate Kit, Ads Pack, etc.).
- Reorder pages using **SortableJS**, add covers/inserts, and generate a final merged file.
- Preview via **react-pdf**, then persist to **S3** and expose a **download URL**.
- All operations are tracked under **Generated PDFs** and **Orders**.

---

## 🧱 Project Scripts (from `package.json`)

```jsonc
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "postinstall": "prisma generate && npx update-browserslist-db@latest",
    "start": "next start",
    "lint": "next lint"
  }
}
```

---

## 📦 Recommended Folder Hints

```
/app                # Next.js App Router (routes, layouts, API handlers)
/components         # Reusable UI (tables, forms, dialogs, charts)
/lib                # utils, auth, s3 helpers, pdf utils
/prisma             # schema.prisma, seed.ts/js
/public             # static assets (icons, logos), you can place banner here too
/docs               # project docs + banner image (recommended)
```

---

## 🖼️ Banner

Add a screenshot to **`/docs/banner-gti-dashboard.png`** (or `/public/banner-gti-dashboard.png`) and it will appear at the top of this README.

```md
![Banner](./docs/banner-gti-dashboard.png)
```

> Tip: Keep it ~1600×400 (or similar letterbox) for a clean GitHub preview.

---

## 🧪 Notes & Tips

- Use **Prisma** + **PostgreSQL** locally via Docker (`postgres:15`) for the smoothest experience.
- For large PDFs, enable **multipart uploads** to S3 (`@aws-sdk/lib-storage`).
- **JWT** secrets must be strong; rotate if leaked.
- Configure **CORS** if calling APIs from separate domains.
- Prefer **presigned URLs** for client‑side PDF uploads/downloads.

---

## 📄 License / Ownership

This is an internal GTI project. All rights reserved © Gulbahar Tobacco International and contributing partners.
Distribution or commercial use is restricted without explicit permission.
