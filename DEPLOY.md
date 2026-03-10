# Deploy to a live URL (Vercel)

Code is pushed to **https://github.com/markjcsimmons/shilajitdb**. Deploy from GitHub so you get a stable URL and avoid localhost/port issues.

## 1. Vercel (recommended for Next.js)

1. Go to **[vercel.com](https://vercel.com)** and sign in (GitHub is fine).
2. **Add New Project** → **Import** the repo `markjcsimmons/shilajitdb`.
3. Leave **Framework Preset** as Next.js and **Root Directory** as `.`.
4. **Environment Variables** — add these (same as `.env`, but **do not commit** `.env`):

   | Name | Value | Notes |
   |------|--------|--------|
   | `DATABASE_URL` | Your Supabase **Session pooler** URI | Use the pooler URL (IPv4-friendly). From Supabase: Connect → Session pooler → URI, add `?sslmode=require` |
   | `ADMIN_PASSWORD` | Your admin password | Used for `/admin` login |
   | `NEXT_PUBLIC_SITE_URL` | `https://your-app.vercel.app` | Set after first deploy, then redeploy |

   Optional (see `.env.example`): `NEXT_PUBLIC_REPORT_EMAIL`, `DSLD_API_BASE_URL`, `DSLD_API_KEY`, etc.

5. Click **Deploy**. Vercel will run `npm install` (which runs `prisma generate`) and `next build`.
6. After deploy, copy the URL (e.g. `https://shilajitdb-xxx.vercel.app`). Set `NEXT_PUBLIC_SITE_URL` to that URL in Vercel → Project → Settings → Environment Variables, then redeploy so links and metadata use the correct domain.

## 2. Database migrations on the hosted DB

Your Supabase database already has the schema. If you add new migrations later:

- **Option A:** Run migrations from your machine before or after deploy:
  ```bash
  DATABASE_URL="your-production-pooler-uri" npx prisma migrate deploy
  ```
- **Option B:** Use a deploy hook or Vercel build command that runs `prisma migrate deploy` (requires `DATABASE_URL` in Vercel env).

## 3. Admin and jobs

- **Admin:** Open `https://your-app.vercel.app/admin` and sign in with `ADMIN_PASSWORD`.
- **Background jobs** (Enrich, Link health, Discovery) started from the app run on Vercel’s serverless. For heavy or scheduled runs, consider a cron service (e.g. Vercel Cron or GitHub Actions) that hits your API or runs the scripts elsewhere.

You’re done. Use the Vercel URL instead of localhost to avoid port and IPv4 issues.
