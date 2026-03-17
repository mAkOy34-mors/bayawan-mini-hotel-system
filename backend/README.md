# Cebu Grand Hotel — Django Backend

REST API powering the CGH guest portal frontend.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│          (Vite · React · Bootstrap · Tailwind)           │
└────────────────────────┬─────────────────────────────────┘
                         │  HTTPS  /api/v1/*
                         ▼
┌──────────────────────────────────────────────────────────┐
│               Django + Django REST Framework             │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │  users   │  │  guests  │  │  rooms   │  │bookings │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│         ┌──────────┐                                     │
│         │ payments │   core/ (auth · exceptions · ...)   │
│         └──────────┘                                     │
└────────┬─────────────────────────────┬───────────────────┘
         │                             │
         ▼                             ▼
┌─────────────────┐       ┌────────────────────────────────┐
│  Supabase Auth  │       │  Supabase PostgreSQL (DB)      │
│  (sign-up/in,   │       │  (tables: users, bookings,     │
│   OTP, JWT)     │       │   rooms, payments, profiles)   │
└─────────────────┘       └────────────────────────────────┘
```

### Auth Flow

```
Browser                   Django                  Supabase
  │                          │                        │
  │── POST /users/login ────▶│                        │
  │                          │── signInWithPassword ─▶│
  │                          │◀─ { session.jwt } ─────│
  │                          │  decode & verify JWT   │
  │                          │  upsert Django User    │
  │◀─ { token, user } ───────│                        │
  │                          │                        │
  │── GET /bookings/... ────▶│                        │
  │   Authorization: Bearer  │                        │
  │                          │  SupabaseJWTAuth:      │
  │                          │  PyJWT.decode(token)   │
  │                          │  lookup Django user    │
  │◀─ [ ... bookings ... ] ──│                        │
```

---

## Project Layout

```
cebu_grand_hotel_backend/
│
├── manage.py
├── requirements.txt
├── .env.example                  ← copy to .env and fill in
│
├── config/
│   ├── settings.py               ← all Django config
│   ├── urls.py                   ← root URL router
│   └── wsgi.py
│
├── core/
│   ├── authentication.py         ← SupabaseJWTAuthentication
│   ├── exceptions.py             ← global DRF exception handler
│   ├── pagination.py
│   ├── middleware/
│   │   └── request_logger.py
│   └── utils/
│       └── supabase_client.py    ← supabase-py SDK wrapper
│
└── apps/
    ├── users/     → register · login · verify-otp · resend-otp
    ├── guests/    → my-profile · complete-profile
    ├── rooms/     → available (with date conflict check)
    ├── bookings/  → create · my-bookings
    └── payments/  → my-payments
```

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/users/register` | ✗ | Create Supabase user |
| POST | `/api/v1/users/login` | ✗ | Sign in, returns JWT |
| POST | `/api/v1/users/verify-otp` | ✗ | Confirm email OTP |
| POST | `/api/v1/users/resend-otp` | ✗ | Resend confirmation email |
| GET | `/api/v1/guests/my-profile` | ✓ | Fetch own guest profile |
| POST | `/api/v1/guests/complete-profile` | ✓ | Create guest profile |
| PUT | `/api/v1/guests/complete-profile` | ✓ | Update guest profile |
| DELETE | `/api/v1/guests/my-profile` | ✓ | Delete guest profile |
| GET | `/api/v1/rooms/available` | ✓ | Available rooms (optional `?checkIn=&checkOut=`) |
| POST | `/api/v1/bookings` | ✓ | Create booking |
| GET | `/api/v1/bookings/my-bookings` | ✓ | List own bookings |
| GET | `/api/v1/payments/my-payments` | ✓ | List own payments |
| GET | `/api/v1/schema/swagger/` | ✗ | Swagger UI |
| GET | `/api/v1/schema/redoc/` | ✗ | ReDoc UI |

---

## Quick Start

### 1. Clone & create virtualenv

```bash
cd cebu_grand_hotel_backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — fill in all Supabase values
```

Get values from your Supabase dashboard:
- **SUPABASE_URL** → Settings → API → Project URL
- **SUPABASE_ANON_KEY** → Settings → API → anon public
- **SUPABASE_SERVICE_ROLE_KEY** → Settings → API → service_role
- **SUPABASE_JWT_SECRET** → Settings → API → JWT Settings → JWT Secret
- **SUPABASE_DB_*** → Settings → Database → Connection string

### 3. Run migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 4. Start dev server

```bash
python manage.py runserver
```

API is now live at `http://localhost:8000/api/v1/`

---

## Supabase Setup Checklist

### Database

Django will create its own tables via migrations. No manual SQL needed.

### Auth Settings

In your Supabase dashboard:

1. **Enable email/password** sign-in (Authentication → Providers → Email)
2. **Enable email confirmations** (so OTP flow works)
3. Set **Site URL** to your frontend URL (e.g. `http://localhost:5173`)
4. Add redirect URLs if needed

### CORS (if using Supabase Edge Functions later)

No extra Supabase CORS setup needed — Django handles CORS via `django-cors-headers`.

---

## Frontend `api.js` → Backend Mapping

| Frontend call | Django endpoint |
|---------------|----------------|
| `loginUser(email, password)` | `POST /api/v1/users/login` |
| `registerUser(payload)` | `POST /api/v1/users/register` |
| `verifyOtp(email, otp)` | `POST /api/v1/users/verify-otp` |
| `resendOtp(email)` | `POST /api/v1/users/resend-otp` |
| `fetchRecentBookings(token)` | `GET /api/v1/bookings/my-bookings` |
| `fetchAvailableRooms(token, in, out)` | `GET /api/v1/rooms/available?checkIn=&checkOut=` |
| `createBooking(token, payload)` | `POST /api/v1/bookings` |
| `fetchPayments(token)` | `GET /api/v1/payments/my-payments` |
| `fetchProfile(token)` | `GET /api/v1/guests/my-profile` |
| `saveProfile(token, profile)` | `POST/PUT /api/v1/guests/complete-profile` |
| `deleteProfile(token)` | `DELETE /api/v1/guests/my-profile` |

Set `API_BASE=http://localhost:8000/api/v1` in your frontend `constants/config.js`.

---

## Production Deployment

### Recommended: Railway / Render / Fly.io

1. Set all env vars in your platform's dashboard
2. Use the **Transaction Pooler** Supabase DB connection (port 6543) for pooled connections
3. Add `gunicorn` start command:

```
gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2
```

4. Run migrations on deploy:

```
python manage.py migrate --no-input
python manage.py collectstatic --no-input
```

### Docker (optional)

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
```

---

## Security Notes

- `SUPABASE_SERVICE_ROLE_KEY` is **only used server-side** — never returned to clients
- JWTs are verified using `SUPABASE_JWT_SECRET` (HS256) on every request
- Django users are created lazily (no separate registration DB step needed)
- All endpoints except auth routes require a valid Bearer token
