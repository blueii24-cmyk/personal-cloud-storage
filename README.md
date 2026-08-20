# Personal Cloud Storage App

A self-hosted, Google Drive-inspired personal cloud storage app.
Original UI/branding — not a clone.

**Status:** Phase 1 — architecture and folder structure only. No backend, database,
or frontend code exists yet. Nothing is runnable yet.

## Stack (planned)

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Database:** SQLite for local dev → PostgreSQL later (same ORM either way)
- **File storage:** local filesystem for local dev → S3-compatible object storage later
- **Auth:** hashed passwords (Argon2/bcrypt) + secure sessions

## Why the storage provider is abstracted

The server never talks to the filesystem (or S3) directly from business logic.
Instead, everything goes through a `StorageProvider` interface
(`server/src/storage/`) with methods like `save`, `read`, `delete`, `move`,
`exists`, and `getStream`. `LocalStorageProvider` implements this against your
laptop's disk today; `S3StorageProvider` will implement the exact same
interface against S3/R2 later. Swapping providers is a one-line environment
variable change (`STORAGE_PROVIDER=local` → `STORAGE_PROVIDER=s3`) — no
rewrites elsewhere in the app.

The database is the source of truth for the *logical* file/folder hierarchy
(names, parent folders, ownership, timestamps). The storage provider only
ever deals with raw bytes referenced by an opaque `storage_key` — it has no
idea about folders, sharing, or who owns what.

## Folder structure

```
project/
├── client/                  React + Vite frontend
│   └── src/
│       ├── components/      Reusable UI pieces
│       ├── pages/           Top-level views (Drive, Trash, Shared, etc.)
│       ├── hooks/            Custom React hooks
│       ├── services/         API client calls to the backend
│       └── utils/            Frontend helper functions
│
├── server/                  Express backend
│   └── src/
│       ├── controllers/      Request handlers
│       ├── routes/           Express route definitions
│       ├── services/         Business logic (independent of Express)
│       ├── middleware/       Auth, validation, error handling
│       ├── storage/          StorageProvider interface + implementations
│       ├── database/         DB connection + migrations
│       ├── models/           Data access layer
│       └── utils/            Backend helper functions
│
├── storage/                 Local dev file storage (gitignored contents)
│   └── users/                One subfolder per user, created at runtime
│
├── .env.example              Template for required environment variables
├── .gitignore
└── README.md
```

## Request flow (how every file operation works)

```
Browser → API route → Auth/validation middleware → Controller
        → Service (business logic) → Database (metadata)
                                    → StorageProvider (actual bytes)
```

The frontend never touches the filesystem or the database directly — it only
ever calls the REST API.

## Phase 2 — backend + database

**Status:** Express server with one health-check route, plus a Prisma
schema defining `users`, `files`, and `shares`. No auth, no file
endpoints yet — that's Phases 3–5.

### A structural note: `server/prisma/` vs `server/src/database/`

Prisma's own CLI (migrations, `prisma studio`, etc.) expects
`schema.prisma` at a fixed location — conventionally a top-level
`prisma/` folder next to `package.json`. So:

- `server/prisma/schema.prisma` — the schema itself, owned by Prisma's
  tooling. Migration files will also land here once we run one.
- `server/src/database/client.js` — a thin wrapper the *rest of the app*
  imports from. Business logic never imports `@prisma/client` directly;
  it imports this file. If we ever swapped ORMs, this is the only file
  that would need to change.

### Why Prisma

It gives us a real schema file, migration history, and a type-safe query
API, and switching the `provider` from `"sqlite"` to `"postgresql"` in
`schema.prisma` is the entire cost of moving databases later — no
rewritten queries.

### Set up and run the backend

1. **Install Node.js 20.6 or later** (needed for `node --watch` and
   `node --env-file`, which let us skip extra dependencies like
   `nodemon` and `dotenv`). Check with `node -v`.

2. **Create your real `.env` file** at the project root (not inside
   `server/`):
   ```
   cp .env.example .env
   ```
   You can leave `SESSION_SECRET` blank for now — it isn't used until
   Phase 3.

3. **Install server dependencies:**
   ```
   cd server
   npm install express cors @prisma/client
   npm install --save-dev prisma
   ```
   (Installing without pinned versions in `package.json` means you get
   whatever's current when you run this, rather than versions I might
   get wrong from memory.)

4. **Create the database** from the schema:
   ```
   npm run prisma:migrate
   ```
   It'll ask for a migration name — `init` is fine. This creates
   `server/prisma/dev.db` and a `server/prisma/migrations/` folder
   (which *should* be committed to git — it's your schema history).

5. **Start the server:**
   ```
   npm run dev
   ```
   You should see `Server running on http://localhost:3000`.

6. **Test it** — open `http://localhost:3000/api/health` in a browser,
   or:
   ```
   curl http://localhost:3000/api/health
   ```
   Expect `{"status":"ok","timestamp":"..."}`.

7. **(Optional) Browse the database visually:**
   ```
   npm run prisma:studio
   ```

### Accessing from your phone (same Wi-Fi)

The server listens on `0.0.0.0`, so once it's running, find your
laptop's LAN IP (`ipconfig` on Windows, `ifconfig` or `ipconfig getifaddr en0`
on Mac) and visit `http://<that-IP>:3000/api/health` from your phone.
This only works on the same network and is not exposed to the internet —
we'll cover safer remote-access options in a later phase.

## Phase 3 — authentication

**Status:** registration, login, logout, and "who am I" endpoints, using
hashed passwords and an httpOnly cookie as the session token. Still no
file endpoints — that's Phase 4/5.

### How auth works here

- **Passwords:** hashed with bcrypt (via `bcryptjs`, a pure-JS
  implementation — no native build step, which avoids the compiler-tool
  headaches bcrypt's native version can cause on Windows). Plaintext
  passwords are never stored or logged.
- **Sessions:** rather than a server-side session store, login issues a
  signed JWT and sends it back as an **httpOnly** cookie. `httpOnly`
  means client-side JavaScript can't read it (blocks token theft via
  XSS); `sameSite: "lax"` blocks most CSRF; `secure` is only enforced
  once `NODE_ENV=production` (it requires HTTPS, which local dev
  doesn't have). The browser sends the cookie automatically on every
  request — the frontend never has to manually attach a token.
- **`requireAuth` middleware** (`server/src/middleware/auth.js`) reads
  and verifies that cookie and sets `req.userId`. Any future route that
  needs a logged-in user just adds `requireAuth` before its handler —
  see `GET /api/auth/me` for the pattern.
- **Login errors are intentionally vague** ("Invalid email or
  password") whether the email doesn't exist or the password is wrong,
  so the endpoint can't be used to check which emails are registered.
  Registration errors *are* specific ("Email already in use" /
  "Username already in use") since that's not a meaningful leak.

### New endpoints

```
POST /api/auth/register   { email, username, password } → 201 { user }
POST /api/auth/login      { email, password }            → 200 { user }
POST /api/auth/logout                                     → 204
GET  /api/auth/me         (requires login cookie)          → 200 { user }
```

### Install the new dependencies

```
cd server
npm install bcryptjs jsonwebtoken cookie-parser
```

### Set your session secret

In your root `.env`, set `SESSION_SECRET` to a real random value:
```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Paste the output in as `SESSION_SECRET=...`.

### Test it (no frontend yet, so use curl)

```
# Register — -c saves the cookie the server sends back
curl -c cookies.txt -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","username":"you","password":"testpassword123"}'

# Check who's logged in — -b sends the saved cookie back
curl -b cookies.txt http://localhost:3000/api/auth/me

# Log out
curl -b cookies.txt -X POST http://localhost:3000/api/auth/logout

# Confirm you're logged out (should now 401)
curl -b cookies.txt http://localhost:3000/api/auth/me

# Log back in
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"testpassword123"}'
```

Restart the server (`npm run dev` should already be running with
`--watch`, so it'll pick up the new files automatically) if anything
seems stale.

## Phase 4 — the storage provider

**Status:** `StorageProvider` (the contract) and `LocalStorageProvider`
(the filesystem implementation) exist and are tested standalone. Nothing
in the HTTP API uses them yet — that's Phase 5.

### The interface

`server/src/storage/StorageProvider.js` defines the contract every
provider must implement: `save`, `createReadStream`, `delete`, `exists`,
`move`, and `getUrl`. `LocalStorageProvider` implements it against your
disk; a future `S3StorageProvider` will implement the same methods
against object storage. Everything else in the app imports the
provider from `server/src/storage/index.js` — a small factory that
reads `STORAGE_PROVIDER` from `.env` and hands back the right instance.
Nothing else ever imports `LocalStorageProvider` directly.

### Keys, not paths

Callers never pass a filesystem path — they pass an opaque **key**,
the same mental model S3 uses (e.g. `users/<userId>/files/<uuid>.pdf`).
`LocalStorageProvider` resolves that key against its base folder and
**rejects anything that resolves outside it** — this is the path
traversal protection the project brief calls out: a key like
`../../etc/passwd` is refused before it ever touches `fs`, no matter
who constructed it.

### A structural deviation from the brief, explained

The original layout sketch showed a physical `/trash` folder per user.
I skipped that: the `File` table already has a `deletedAt` column
(Phase 2), and the architecture rule from the brief itself says the
database is the source of truth for logical state — trash is exactly
that, a logical state, not a physical location. So "deleting" a file
will mean setting `deletedAt` in the database; the bytes stay exactly
where they are in storage. This also means restoring from trash is a
single database update, not a file move.

### Test it (standalone, no HTTP yet)

```
cd server
npm run test:storage
```

You should see six numbered checks pass, including a path-traversal
key being correctly rejected. Look inside `storage/users/test-user/files/`
afterward — it'll be empty again, since the script cleans up after
itself (saves, moves, then deletes).

## Phase 5 — upload, download, delete

**Status:** the storage provider and database are wired together for
real. You can upload files, list them, fetch metadata, download them,
and soft-delete them, all through authenticated HTTP endpoints.

### New endpoints

```
GET    /api/files?parentFolderId=...   list files/folders (root if omitted)
POST   /api/files/upload               multipart upload, field name "files" (supports multiple)
GET    /api/files/:id                  metadata for one file
GET    /api/files/:id/download         streams the actual bytes
DELETE /api/files/:id                  soft delete (sets deletedAt — doesn't touch storage)
```

All of these require the login cookie from Phase 3 — a request without
one gets a 401.

Full folder management (creating folders, renaming, moving, breadcrumbs)
is Phase 6 — `parentFolderId` works today only if you manually create a
folder row via `npm run prisma:studio` and flip `isFolder` to true.

### How upload avoids buffering huge files in memory

`multer` is configured with `diskStorage`, so an incoming upload streams
straight to a temp file rather than sitting in a memory `Buffer`.
`fileService.saveUploadedFile` then streams *that* temp file into the
storage provider and deletes it. Yes, that's two writes instead of one —
a slightly simpler design at the cost of some extra disk I/O, which is a
fine trade for a personal-use app. If this ever becomes a bottleneck, the
temp-file step can be replaced with piping the upload stream directly
into `storage.save()`.

### How the display name and storage key stay separate

The file's `name` in the database (what you see in the UI) is the
sanitized original filename. The storage key on disk is always a random
UUID, generated in `utils/storageKey.js` — completely disconnected from
whatever the file was actually called. That's a second, independent
layer of path-traversal protection on top of the one already in
`LocalStorageProvider`.

### Test it

```
# Upload a file (swap in a real path)
curl -b cookies.txt -X POST http://localhost:3000/api/files/upload \
  -F "files=@/path/to/some/file.txt"

# List your root-level files
curl -b cookies.txt http://localhost:3000/api/files

# Grab the "id" from that response, then:
curl -b cookies.txt http://localhost:3000/api/files/<id>

# Download it back
curl -b cookies.txt http://localhost:3000/api/files/<id>/download -o downloaded.txt
diff /path/to/some/file.txt downloaded.txt   # should show no differences

# Soft-delete it
curl -b cookies.txt -X DELETE http://localhost:3000/api/files/<id>

# List again — it should be gone from the list, but the bytes are
# still sitting in storage/users/<userId>/files/ — that's expected
# until Phase 9 adds permanent deletion.
curl -b cookies.txt http://localhost:3000/api/files
```

### Install the new dependency

```
cd server
npm install multer
```

## Next steps

Phase 6: real folder hierarchy — creating folders, entering them,
breadcrumbs, renaming, and moving files/folders (with protection
against moving a folder into itself).
