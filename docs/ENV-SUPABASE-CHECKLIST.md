# Fix: ".env doesn't save" or data not going to Supabase

## A. If you mean the .env file itself doesn't save

1. **Use the real .env, not .env.example**  
   The app only reads **`.env`** in the project root. Editing **`.env.example`** does nothing until you copy it to `.env`.

2. **Create or overwrite .env from the terminal** (so you know it's the right file):
   ```bash
   cd /Users/mark/Desktop/CURSOR/ShilajitDB
   cp .env.example .env
   ```
   Then open **`.env`** in Cursor (Cmd+O → select `.env` in the project root).

3. **Save after editing**  
   After pasting your DATABASE_URL, press **Cmd+S** (or File → Save). The dot in the filename can make some editors treat it as a hidden file; it still must be saved.

4. **Check the path**  
   The file must be exactly:
   `/Users/mark/Desktop/CURSOR/ShilajitDB/.env`
   not inside `app/` or any subfolder.

---

## B. If you mean products don't show up in Supabase (app "doesn't save" to DB)

1. **Replace [YOUR-PASSWORD] in the URL**  
   In the Session pooler string you copied, replace `[YOUR-PASSWORD]` with your **actual** Supabase database password (from when you created the project). No brackets.  
   If the password has special characters (e.g. `#`, `@`, `%`), they must be URL-encoded (e.g. `#` → `%23`, `@` → `%40`).

2. **Add ?sslmode=require**  
   The end of DATABASE_URL must be:
   `...postgres?sslmode=require`
   (or `...postgres?sslmode=require&connection_limit=5` if you added that).

3. **Put the whole thing in quotes in .env**  
   One line, no line breaks inside the string:
   ```
   DATABASE_URL="postgresql://postgres.jndzlvucfgwfknqnocxf:YourPassword@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"
   ```

4. **Push the schema to Supabase once**  
   If you never ran this, Supabase has no tables, so inserts will fail. In terminal:
   ```bash
   cd /Users/mark/Desktop/CURSOR/ShilajitDB
   npx prisma db push
   ```
   (Your .env is loaded automatically; no need to paste the URL again.)

5. **Restart the dev server**  
   After changing .env, stop the server (Ctrl+C) and run:
   ```bash
   npm run dev
   ```
   Next.js only reads .env at startup.

6. **Verify which DB is used**  
   In terminal (same folder):
   ```bash
   node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@') : 'NOT SET');"
   ```
   You should see a string containing `pooler.supabase.com` and `****` where the password is. If you see `localhost` or "NOT SET", the app is not using your Supabase URL.

---

## Quick test

1. Open `.env` and set DATABASE_URL to your full Supabase Session pooler URI (password + `?sslmode=require`).
2. Save the file (Cmd+S).
3. Run: `npx prisma db push`
4. Run: `npm run dev`
5. Go to http://localhost:3000/admin → add or edit a product and save.
6. In Supabase Dashboard → Table Editor → open **Product**. The new or updated row should appear there.

If it still doesn’t save, check the terminal where `npm run dev` is running for a Prisma error (e.g. authentication failed = wrong password in DATABASE_URL).
