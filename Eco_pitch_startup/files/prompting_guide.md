# Agent Prompting Guide — SkillXchange
> How to talk to an AI coding agent (Cursor, Claude, Copilot, etc.) to build this project step by step without chaos.

---

## The Golden Rule
> **One prompt = one task. Never ask for two things at once.**
> If a prompt has "and also" in it, split it into two prompts.

---

## Phase 0: Project Bootstrap

### Step 0.1 — Project Setup
```
Context: Starting a new project called SkillXchange.
Task: Set up a Flask project with the following structure:

backend/
  app.py
  config.py
  extensions.py     (SQLAlchemy, JWT init)
  .env.example

Requirements:
- Flask
- Flask-JWT-Extended
- SQLAlchemy
- Flask-Migrate
- psycopg2-binary
- bcrypt
- python-dotenv

Rules:
- Use Application Factory pattern (create_app() in app.py)
- Config reads from .env file
- Output: code only, no explanation
```

### Step 0.2 — Base DB Config
```
Context: Flask app is set up with Application Factory.
Task: Configure PostgreSQL connection in config.py and extensions.py.

Stack: Flask + SQLAlchemy + psycopg2
.env variables needed:
  DATABASE_URL=postgresql://user:pass@localhost/skillxchange
  JWT_SECRET_KEY=your_secret_here

Rules:
- Use existing create_app() structure
- Do not create any models yet
- Output: code only
```

---

## Phase 1: Auth Module

### Step 1.1 — User Model
```
Context: SkillXchange backend. Flask + SQLAlchemy + PostgreSQL.
Reference schema: [paste User schema from spec.md]

Task: Create the User SQLAlchemy model in backend/auth/models.py

Rules:
- Match schema exactly — field names, types, defaults
- Use UUID for primary key (use sqlalchemy.dialects.postgresql.UUID)
- Do not create any routes or other models
- Output: code only
```

### Step 1.2 — Auth Utilities
```
Context: User model exists at backend/auth/models.py
Task: Create backend/auth/utils.py with these 3 functions:
  1. hash_password(plain_text) → returns bcrypt hash
  2. verify_password(plain_text, hashed) → returns True/False
  3. generate_token(user_id, email) → returns JWT string (7 day expiry)

Stack: bcrypt, Flask-JWT-Extended
Rules:
- No routes, no models
- Clean, single-responsibility functions
- Output: code only
```

### Step 1.3 — Register Endpoint
```
Context: SkillXchange. User model and auth utils are ready.
Reference: module_auth.md → POST /api/auth/register spec

Task: Implement POST /api/auth/register in backend/auth/routes.py

Rules:
- Validate: name, email, password required; password min 8 chars
- Check email uniqueness → 409 if duplicate
- Hash password before saving
- Set credits = 50 on creation
- Return token in response
- Use standard response format: {"success": true, "data": {...}}
- Output: code only
```

### Step 1.4 — Login Endpoint
```
Context: Register endpoint works. Same file: backend/auth/routes.py
Reference: module_auth.md → POST /api/auth/login spec

Task: Add POST /api/auth/login to the existing auth Blueprint

Rules:
- Add to existing routes.py, do not rewrite the file
- Verify email exists → 404 if not
- Verify password → 401 if wrong
- Return JWT on success
- Output: code only
```

### Step 1.5 — Me Endpoint
```
Context: Login works. Adding one more endpoint.
Reference: module_auth.md → GET /api/auth/me spec

Task: Add GET /api/auth/me to backend/auth/routes.py
Requires: @jwt_required() decorator

Rules:
- Extract user_id from JWT using get_jwt_identity()
- Return user data (no password field)
- Output: code only
```

### Step 1.6 — Register Blueprint
```
Context: Auth routes are ready in backend/auth/routes.py
Task: Register the auth Blueprint in backend/app.py

Rules:
- Import and register with url_prefix="/api/auth"
- Do not touch any other part of app.py
- Output: only the modified app.py
```

### ✅ Checkpoint: Test Auth Before Continuing
```
Test these manually with Postman or curl before moving to Profile module:
  POST /api/auth/register  → should return token + credits: 50
  POST /api/auth/login     → should return token
  GET  /api/auth/me        → with Bearer token → should return user data
  POST /api/auth/register  → duplicate email → should return 409
```

---

## Phase 2: Profile Module

### Step 2.1 — Profile Endpoints
```
Context: SkillXchange. Auth module is complete and tested.
Reference: module_profile.md

Task: Create backend/users/routes.py with these endpoints:
  1. GET /api/users/:id   (public profile)
  2. PUT /api/users/:id   (update own profile, JWT required)

Rules:
- Reuse User model from backend/auth/models.py (import, do not redefine)
- Never return email or password in public profile
- PUT: verify token user_id == param id → else 403
- Partial update: only update fields present in request body
- Output: code only
```

### Step 2.2 — Register Profile Blueprint
```
Context: Profile routes are ready.
Task: Register users Blueprint in backend/app.py with url_prefix="/api/users"

Rules:
- Add import and register line only
- Do not modify anything else in app.py
- Output: only the changed lines with context
```

---

## Phase 3: Skill Listing Module

### Step 3.1 — Skill and SkillRequest Models
```
Context: SkillXchange. Auth module complete.
Reference schema: [paste Skill and SkillRequest from spec.md]

Task: Create backend/skills/models.py with Skill and SkillRequest models

Rules:
- Match schema exactly
- Use UUID primary keys
- Foreign key to User.id for both models
- Output: code only
```

### Step 3.2 — Skill CRUD Endpoints
```
Context: Skill model is ready.
Reference: module_skill_listing.md → Part A (Skills)

Task: Create backend/skills/routes.py with:
  POST   /api/skills       (create, JWT required)
  GET    /api/skills       (list, public, with filters)
  GET    /api/skills/:id   (detail, public)
  PUT    /api/skills/:id   (update, JWT + owner check)
  DELETE /api/skills/:id   (soft-delete, JWT + owner check)

Rules:
- category must be one of: Tech, Music, Design, Language, Fitness, Academic, Other
- mode must be: online, offline, both
- GET list: support ?category, ?mode, ?q, ?page, ?limit query params
- Soft delete: set is_active=False, do not hard delete
- Output: code only
```

### Step 3.3 — Skill Request Endpoints
```
Context: Skill CRUD works. Adding skill requests.
Reference: module_skill_listing.md → Part B (Skill Requests)

Task: Add to existing backend/skills/routes.py:
  POST /api/skill-requests  (JWT required)
  GET  /api/skill-requests  (public, with filters)

Rules:
- Append to existing file, do not rewrite
- Output: code only
```

### Step 3.4 — User Skills Endpoint
```
Context: Skills module is complete.
Reference: module_profile.md → GET /api/users/:id/skills

Task: Add GET /api/users/:id/skills to backend/users/routes.py

Rules:
- Append to existing users routes, do not rewrite
- Return only is_active=True skills
- Return empty list if no skills (not 404)
- Output: code only
```

---

## Phase 4: Matching Module

### Step 4.1 — Match and Session Models
```
Context: SkillXchange. Skills module complete.
Reference schema: [paste Match and Session from spec.md]

Task: Create backend/matching/models.py with Match and Session models

Rules:
- UUID primary keys
- Foreign keys: Match → User, Skill; Session → Match, User, Skill
- Output: code only
```

### Step 4.2 — Create Match Endpoint
```
Context: Match model is ready.
Reference: module_matching.md → POST /api/matches

Task: Create backend/matching/routes.py
Implement: POST /api/matches only

Rules:
- learnerId from JWT, teacherId from skill.user_id
- Validate: no self-match, session_type valid, skill supports that type
- Free user check: if not is_premium, max 3 pending/accepted matches → 403
- Duplicate check → 409
- Output: code only
```

### Step 4.3 — Get My Matches Endpoint
```
Context: POST /api/matches works.
Reference: module_matching.md → GET /api/matches/me

Task: Add GET /api/matches/me to backend/matching/routes.py

Rules:
- Append to existing file
- Filter by role (teacher/learner) and status via query params
- Include nested skill, teacher, learner objects in response
- Output: code only
```

### Step 4.4 — Respond to Match Endpoint
```
Context: Match listing works.
Reference: module_matching.md → PUT /api/matches/:id/respond

Task: Add PUT /api/matches/:id/respond to backend/matching/routes.py

Rules:
- Append to existing file
- Only teacher can respond
- Only pending matches can be responded to
- On "accepted": auto-create Session record (see module_matching.md for Session fields)
- Do NOT deduct credits here
- Output: code only
```

---

## Phase 5: Credits Module

### Step 5.1 — CreditTransaction Model
```
Context: SkillXchange. Matching module complete.
Reference schema: [paste CreditTransaction from spec.md]

Task: Create backend/credits/models.py with CreditTransaction model

Rules:
- UUID primary key
- delta is INTEGER (positive = earned, negative = spent)
- reason is VARCHAR(100)
- Output: code only
```

### Step 5.2 — Credit Utilities
```
Context: CreditTransaction model is ready.
Task: Create backend/credits/utils.py with:
  1. log_transaction(user_id, delta, reason, ref_id=None)
  2. transfer_credits(session_id) — transfers credits on session completion

Reference logic: module_credits.md → POST /api/credits/transfer section

Rules:
- transfer_credits: check learner has enough credits → raise ValueError if not
- Both functions should commit to DB
- Output: code only
```

### Step 5.3 — Session Complete Endpoint
```
Context: Credit utils are ready.
Reference: module_credits.md → PUT /api/sessions/:id/complete

Task: Add PUT /api/sessions/:id/complete to backend/matching/routes.py

Rules:
- Append to existing matching routes file
- Either teacher or learner can mark complete
- Call transfer_credits() only if session_type == "credit"
- Update session.status = "completed", set completed_at
- Update match.status = "completed"
- Output: code only
```

### Step 5.4 — Credit Balance and History Endpoints
```
Context: Session completion works.
Reference: module_credits.md → GET /api/credits/balance and GET /api/credits/history

Task: Create backend/credits/routes.py with:
  GET /api/credits/balance  (JWT required)
  GET /api/credits/history  (JWT required, paginated)

Rules:
- Sort history by created_at DESC
- Output: code only
```

---

## Phase 6: Payments Module (Phase 2 — Do After MVP)

### Step 6.1 — Payment Model
```
Context: SkillXchange MVP is complete and tested.
Reference schema: [paste Payment from spec.md]

Task: Create backend/payments/models.py with Payment model

Rules:
- UUID primary key
- Match schema exactly including platform_fee field
- Output: code only
```

### Step 6.2 — Initiate Payment
```
Context: Payment model is ready. Razorpay is installed (pip install razorpay).
Reference: module_payments.md → POST /api/payments/initiate

Task: Create backend/payments/routes.py
Implement: POST /api/payments/initiate only

Rules:
- Read RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET from environment (.env)
- Amount in paise (multiply ₹ by 100 for Razorpay)
- Create pending Payment record
- Return Razorpay order ID + key_id to frontend
- Output: code only
```

### Step 6.3 — Payment Verify and Webhook
```
Context: Payment initiation works.
Reference: module_payments.md → POST /api/payments/verify and POST /api/payments/webhook

Task: Add both endpoints to backend/payments/routes.py

Rules:
- Append to existing file
- Verify HMAC-SHA256 signature for both endpoints
- On success: update Payment.status = "success"
- Webhook must return 200 quickly (do not do heavy processing synchronously)
- Output: code only
```

---

## Prompt Templates (Copy-Paste Ready)

### Template A — New Endpoint
```
Context: SkillXchange backend. [module name] module.
Existing files: [list relevant files]
Reference: [module_name.md] → [endpoint name] section

Task: Implement [METHOD] /api/[route]

Stack: Flask + SQLAlchemy + PostgreSQL + JWT
Rules:
- [specific rule 1]
- [specific rule 2]
- Do not modify any other files
- Use standard response format: {"success": bool, "data": {...}}
- Output: code only, no explanation
```

### Template B — Add to Existing File
```
Context: SkillXchange. [file path] already exists with [describe what's there].
Task: Add [feature] to [file path]. Do not modify existing code.

[paste relevant spec section]

Rules:
- Append only — do not rewrite existing functions
- Output: only the new code to add (with a comment showing where to insert)
```

### Template C — Bug Fix
```
Context: SkillXchange. [module name] module.
Problem: [describe exact bug — include error message if any]
File: [file path]
Function: [function name]

Task: Fix only this bug. Do not change any other logic.
Output: only the corrected function, no explanation.
```

### Template D — DB Migration
```
Context: SkillXchange. Using Flask-Migrate.
Task: Generate migration for [describe schema change].

Current model: [paste model]
Change needed: [describe change]

Output: the Alembic migration script only.
```

---

## Build Order (Do Not Skip Steps)

```
Phase 0: Project bootstrap
  0.1 Flask app setup
  0.2 DB config

Phase 1: Auth ✅ TEST before continuing
  1.1 User model
  1.2 Auth utils
  1.3 Register endpoint
  1.4 Login endpoint
  1.5 Me endpoint
  1.6 Register blueprint

Phase 2: Profile ✅ TEST before continuing
  2.1 Profile endpoints
  2.2 Register blueprint

Phase 3: Skills ✅ TEST before continuing
  3.1 Skill + SkillRequest models
  3.2 Skill CRUD
  3.3 Skill request endpoints
  3.4 User skills endpoint

Phase 4: Matching ✅ TEST before continuing
  4.1 Match + Session models
  4.2 Create match
  4.3 Get my matches
  4.4 Respond to match

Phase 5: Credits ✅ TEST before continuing
  5.1 CreditTransaction model
  5.2 Credit utils
  5.3 Session complete
  5.4 Balance + history

Phase 6: Payments (after MVP is stable)
  6.1 Payment model
  6.2 Initiate payment
  6.3 Verify + webhook
```

---

## What to Say When the Agent Goes Off-Track

**Agent added extra fields or features you didn't ask for:**
```
Revert to the previous version of [function/file]. 
Remove [specific addition]. Do not add anything beyond what I asked.
```

**Agent changed existing working code while adding new code:**
```
You modified [function name] which was already working. 
Restore it exactly as it was. Only add [new feature] without touching existing code.
```

**Agent used a different tech or library:**
```
Replace [library used] with [correct library from spec.md]. 
Reason: stack is locked per spec.md. Do not introduce new dependencies.
```

**Agent produced broken code you can't debug:**
```
The previous code has errors. Start fresh for this function only.
Here is the exact spec: [paste relevant section from module md file]
Output: only this function, nothing else.
```
