# Module: Auth
> Reference spec.md for stack, schema, and response format before proceeding.

---

## Scope
Handle user registration, login, JWT token issuance, and current-user fetch.
**Do NOT build profile editing, skill listing, or any other module here.**

---

## Endpoints to Build

### POST /api/auth/register
**Purpose:** Create a new user account.

**Request Body:**
```json
{
  "name": "Riya Shah",
  "email": "riya@example.com",
  "password": "securepassword123",
  "college": "SVNIT Surat",
  "city": "Surat"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "name": "Riya Shah",
    "email": "riya@example.com",
    "credits": 50,
    "token": "jwt_token_here"
  }
}
```

**Validations:**
- Email must be unique → 409 Conflict if duplicate
- Password min length: 8 characters
- Name, email, password are required fields
- Hash password with bcrypt before storing

---

### POST /api/auth/login
**Purpose:** Authenticate existing user, return JWT.

**Request Body:**
```json
{
  "email": "riya@example.com",
  "password": "securepassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "name": "Riya Shah",
    "token": "jwt_token_here"
  }
}
```

**Validations:**
- Email not found → 404
- Wrong password → 401 Unauthorized
- Both fields required

---

### GET /api/auth/me
**Purpose:** Return currently logged-in user's data from JWT.
**Auth:** Bearer token required.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "name": "Riya Shah",
    "email": "riya@example.com",
    "college": "SVNIT Surat",
    "city": "Surat",
    "credits": 50,
    "isPremium": false,
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

---

### POST /api/auth/logout
**Purpose:** Invalidate token (client-side deletion; optionally blocklist).
**Auth:** Bearer token required.

**Response (200):**
```json
{ "success": true, "data": { "message": "Logged out successfully" } }
```

---

## File Structure to Create
```
backend/
└── auth/
    ├── __init__.py
    ├── routes.py       # Flask Blueprint: all 4 endpoints
    ├── models.py       # SQLAlchemy User model (from spec.md schema)
    ├── schemas.py      # Marshmallow or manual validation
    └── utils.py        # hash_password(), verify_password(), generate_token()
```

---

## Dependencies Required
```
flask
flask-jwt-extended
bcrypt
sqlalchemy
psycopg2-binary
```

---

## Business Rules
- Every new user receives **50 credits** automatically on registration
- JWT expiry: 7 days
- Do not return password hash in any response
- Token must carry: `user_id`, `email` in payload

---

## Error Codes to Handle
| Scenario              | HTTP Code |
|-----------------------|-----------|
| Missing required field | 400      |
| Email already exists  | 409       |
| Wrong credentials     | 401       |
| Invalid/expired token | 401       |
| Server error          | 500       |

---

## What NOT to Build in This Module
- ❌ Profile update
- ❌ Avatar upload
- ❌ Password reset / OTP (Phase 2)
- ❌ OAuth / Google login (Phase 2)
- ❌ Any skill or matching logic
