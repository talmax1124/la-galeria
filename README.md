# La Galería

A one-event web app where guests scan a QR code, enter their name, and upload as many photos & videos as they want. Everything lands in a shared bucket. Two outputs: a **live gallery page** anyone can browse, and a **downloadable zip** the host can grab when the event is over.

- Frontend → Cloudflare Pages
- API → Cloudflare Workers
- Storage → Cloudflare R2 (10 GB free)
- Metadata → Cloudflare D1 (SQLite)

## Folder layout

```
La Galeria/
├── api/        # Cloudflare Worker (TypeScript)
├── web/        # Vite + React frontend
└── README.md   # this file
```

## One-time setup

### 1. Install Node.js and Wrangler

```bash
# macOS via Homebrew
brew install node

# Wrangler comes via npx; no global install needed
```

### 2. Cloudflare account

1. Sign up at https://dash.cloudflare.com (free).
2. **Add a payment method** under *Billing → Payment methods*. R2 requires a card on file even though usage stays well under the 10 GB free tier.

### 3. Log in Wrangler

```bash
cd api
npx wrangler login
```

A browser tab opens; approve.

### 4. Create the R2 bucket

```bash
cd api
npx wrangler r2 bucket create la-galeria
```

### 5. Create R2 API token

In the Cloudflare dashboard:

1. Go to **R2 → Manage R2 API Tokens** (https://dash.cloudflare.com/?to=/:account/r2/api-tokens)
2. Click **Create API Token**
3. Permissions: **Object Read & Write**
4. Specify bucket: **la-galeria**
5. Copy:
   - **Access Key ID**
   - **Secret Access Key**
   - **Account ID** (shown at the top of the R2 page)

### 6. Create the D1 database

```bash
cd api
npx wrangler d1 create la-galeria
```

It prints a block like:

```toml
[[d1_databases]]
binding = "DB"
database_name = "la-galeria"
database_id = "abc123..."
```

Copy the `database_id` value into `api/wrangler.toml` where it says `REPLACE_WITH_D1_DATABASE_ID`.

### 7. Apply the migration

```bash
# Locally first (for dev)
cd api
npx wrangler d1 migrations apply la-galeria --local

# And remotely (for production)
npx wrangler d1 migrations apply la-galeria --remote
```

### 8. Set secrets for production

```bash
cd api
npx wrangler secret put ADMIN_KEY            # invent a strong random string
npx wrangler secret put R2_ACCOUNT_ID
npx wrangler secret put R2_ACCESS_KEY_ID
npx wrangler secret put R2_SECRET_ACCESS_KEY
```

### 9. Set the same values locally

```bash
cd api
cp .dev.vars.example .dev.vars
# Edit .dev.vars with the real values
```

## Running locally

Two terminals:

```bash
# terminal 1 — API worker on :8787
cd api
npm install
npm run dev
```

```bash
# terminal 2 — frontend on :5173
cd web
npm install
npm run dev
```

Then open:

- Upload page → http://localhost:5173/
- Live gallery → http://localhost:5173/gallery
- Host page → http://localhost:5173/admin (enter the `ADMIN_KEY` from `.dev.vars`, e.g. `dev-key`)

Vite proxies `/api/*` to the local Worker, so everything works from one tab.

## Testing on your phone (same Wi-Fi)

Vite is configured with `host: true`. When you run `npm run dev` in `web/`, it prints a `Network:` URL like `http://192.168.1.42:5173`. Open that on the phone. The QR code on the `/admin` page already uses `window.location.origin`, so the download-QR feature will encode the right URL automatically.

## Deploying

### Deploy the API

```bash
cd api
npx wrangler deploy
```

Note the deployed URL — something like `https://la-galeria-api.<your-subdomain>.workers.dev`.

### Deploy the frontend

```bash
cd web
npm run build
npx wrangler pages deploy dist --project-name la-galeria
```

### Wire frontend → API

The frontend uses same-origin `/api/*` paths, so the simplest setup is to put a **Pages Function** rewrite or a **Worker route** in front of both. Two options:

**Option A (simplest): Workers route**

Add a custom domain to the Worker for `/api/*` so both the Pages site and the Worker share a hostname.

**Option B: Pages Functions proxy**

Create `web/functions/api/[[path]].ts`:

```ts
export const onRequest: PagesFunction = async (ctx) => {
  const url = new URL(ctx.request.url);
  url.host = 'la-galeria-api.<your-subdomain>.workers.dev';
  return fetch(new Request(url.toString(), ctx.request));
};
```

Either way, set `ALLOWED_ORIGIN` in `wrangler.toml` to your Pages URL before re-deploying.

## Day-of-event checklist

1. Open `/admin`, enter the admin key.
2. Click **Download QR (PNG)** and print it.
3. Place the printed QR at the event.
4. Watch the gallery fill up at `/gallery` 🍾.
5. Once the event is over, hit **Download all as ZIP** from `/admin`.

## Out of scope (intentionally) for v1

- Multi-event support — one bucket, one event.
- Guest editing/deletion of their own uploads (host can delete from `/admin`).
- Comments, reactions, captions, moderation queue.
- Single-PUT uploads only (R2's 5 GB cap per object — phone videos virtually never hit this).
