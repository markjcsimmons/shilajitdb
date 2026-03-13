# Set up Supabase as your database (local + live app)

Use **one Supabase database** for both local development and your live app. Every time you add or edit products (locally or on the live site), the data is stored in Supabase. No extra sync—one database, two places pointing at it.

---

## 1. Create a Supabase project

1. Go to **[supabase.com](https://supabase.com)** and sign in.
2. Click **New project**.
3. Pick an **Organization** (or create one).
4. Set:
   - **Name** (e.g. `shilajitdb`)
   - **Database password** (save it somewhere safe)
   - **Region** (closest to you or your users)
5. Click **Create new project** and wait until it’s ready.

---

## 2. Get the connection string

1. In the Supabase dashboard, open your project.
2. Go to **Project Settings** (gear icon in the left sidebar).
3. Click **Database** in the left menu.
4. Under **Connection string**, choose **URI**.
5. Copy the **Session pooler** URI (port **5432**, not 6543).
   - It looks like:  
     `postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres`
6. Replace `[YOUR-PASSWORD]` in that string with your **Database password** from step 1.
7. Add at the end: **`?sslmode=require`**  
   Example:  
   `postgresql://postgres.xxxxx:YourPassword@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require`

That’s your **DATABASE_URL**.

---

## 3. Push the schema to Supabase

From your project folder in the terminal:

```bash
cd /Users/mark/Desktop/CURSOR/ShilajitDB
```

Then run (paste your real URL in place of `YOUR_SUPABASE_URI`):

```bash
DATABASE_URL="YOUR_SUPABASE_URI" npx prisma db push
```

Example:

```bash
DATABASE_URL="postgresql://postgres.abcdefgh:MySecretPass@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require" npx prisma db push
```

This creates all tables (Product, Brand, etc.) in Supabase. You only need to do it once (or again if you add new fields later).

---

## 4. Use Supabase when running locally

1. Open (or create) your `.env` file in the project root:
   - In Cursor: **Cmd+O** → go to the project folder → open `.env`  
   - Or create from example:  
     `cp .env.example .env`
2. Set **DATABASE_URL** in `.env` to the same Supabase URI from step 2:

   ```
   DATABASE_URL="postgresql://postgres.PROJECT_REF:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres?sslmode=require"
   ```

3. Save `.env`.
4. Restart the dev server if it’s running:
   ```bash
   npm run dev
   ```

From now on, when you add or edit products in the admin at `http://localhost:3000/admin`, the data is saved to Supabase.

---

## 5. Use the same database when the app is live (e.g. Vercel)

1. In **Vercel** → your project → **Settings** → **Environment Variables**.
2. Add (or edit) **DATABASE_URL** and set it to the **same** Supabase URI as in `.env`.
3. Redeploy the app so the new variable is used.

Now both local and production use the same Supabase database. Changes from either place show up everywhere.

---

## Quick check

- **Supabase:** Dashboard → **Table Editor** → open **Product** (and **Brand**). After you add a product locally or on the live site, you should see it here.
- **Local:** Add a product at `http://localhost:3000/admin/products/new` and confirm it appears in Supabase Table Editor.
- **Live:** After setting `DATABASE_URL` on Vercel and redeploying, add a product on the live site and confirm it appears in the same Supabase tables.

---

## Optional: connection limits (if you see timeouts)

If you get connection errors during heavy use, add to the end of your URI:

`&connection_limit=5&pool_timeout=30`

Example:

```
DATABASE_URL="postgresql://postgres.xxx:pass@aws-0-region.pooler.supabase.com:5432/postgres?sslmode=require&connection_limit=5&pool_timeout=30"
```

Use the same in `.env` and in Vercel.
