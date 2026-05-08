# SkillXchange — Central Spec Document
> Every agent prompt MUST reference this file. Do not deviate from naming, schema, or stack defined here.

---

## 1. Product Summary
A peer-to-peer local skill exchange platform where users teach skills to earn credits and spend credits to learn skills. Optionally, paid sessions are also supported with platform commission.

---

## 2. Tech Stack (LOCKED — Do Not Change)
| Layer       | Technology                        |
|-------------|-----------------------------------|
| Backend     | Python / Flask                    |
| ORM         | SQLAlchemy                        |
| Database    | PostgreSQL                        |
| Auth        | JWT (via Flask-JWT-Extended)      |
| Frontend    | React (Vite) + Tailwind CSS       |
| API Style   | RESTful JSON                      |
| File Upload | Local storage (MVP), S3 later     |

---

## 3. Database Schema (Source of Truth)

```sql
-- Users
User(
  id          UUID PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,          -- hashed (bcrypt)
  bio         TEXT,
  avatar_url  VARCHAR(300),
  college     VARCHAR(150),
  city        VARCHAR(100),
  credits     INTEGER DEFAULT 50,             -- starting credits
  is_premium  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT NOW()
)

-- Skills (what a user CAN teach)
Skill(
  id          UUID PRIMARY KEY,
  user_id     UUID REFERENCES User(id),
  title       VARCHAR(100) NOT NULL,
  description TEXT,
  category    VARCHAR(50),                    -- e.g. "Tech", "Music", "Design"
  mode        VARCHAR(20),                    -- "online" | "offline" | "both"
  credits_per_session  INTEGER,              -- NULL if paid only
  price_per_session    NUMERIC(8,2),         -- NULL if credit only
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT NOW()
)

-- Skill Requests (what a user WANTS to learn)
SkillRequest(
  id          UUID PRIMARY KEY,
  user_id     UUID REFERENCES User(id),
  title       VARCHAR(100) NOT NULL,
  description TEXT,
  category    VARCHAR(50),
  created_at  TIMESTAMP DEFAULT NOW()
)

-- Matches
Match(
  id           UUID PRIMARY KEY,
  teacher_id   UUID REFERENCES User(id),
  learner_id   UUID REFERENCES User(id),
  skill_id     UUID REFERENCES Skill(id),
  status       VARCHAR(20) DEFAULT 'pending', -- pending | accepted | rejected | completed
  session_type VARCHAR(20),                   -- "credit" | "paid"
  created_at   TIMESTAMP DEFAULT NOW()
)

-- Sessions
Session(
  id             UUID PRIMARY KEY,
  match_id       UUID REFERENCES Match(id),
  teacher_id     UUID REFERENCES User(id),
  learner_id     UUID REFERENCES User(id),
  skill_id       UUID REFERENCES Skill(id),
  session_type   VARCHAR(20),                 -- "credit" | "paid"
  credits_used   INTEGER,                     -- NULL if paid
  amount_paid    NUMERIC(8,2),               -- NULL if credit
  platform_fee   NUMERIC(8,2),               -- 15% of amount_paid
  status         VARCHAR(20) DEFAULT 'scheduled', -- scheduled | completed | cancelled
  scheduled_at   TIMESTAMP,
  completed_at   TIMESTAMP
)

-- Credit Transactions
CreditTransaction(
  id          UUID PRIMARY KEY,
  user_id     UUID REFERENCES User(id),
  delta       INTEGER NOT NULL,               -- positive = earned, negative = spent
  reason      VARCHAR(100),                   -- e.g. "session_taught", "session_taken", "purchase"
  ref_id      UUID,                           -- session_id or payment_id
  created_at  TIMESTAMP DEFAULT NOW()
)

-- Payments
Payment(
  id              UUID PRIMARY KEY,
  payer_id        UUID REFERENCES User(id),
  payee_id        UUID REFERENCES User(id),   -- teacher
  session_id      UUID REFERENCES Session(id),
  gross_amount    NUMERIC(8,2),
  platform_fee    NUMERIC(8,2),
  net_amount      NUMERIC(8,2),
  payment_status  VARCHAR(20) DEFAULT 'pending', -- pending | success | failed
  gateway_ref     VARCHAR(200),               -- Razorpay order ID
  created_at      TIMESTAMP DEFAULT NOW()
)
```

---

## 4. API Route Map

| Module         | Method | Endpoint                        | Auth Required |
|----------------|--------|---------------------------------|---------------|
| Auth           | POST   | /api/auth/register              | No            |
| Auth           | POST   | /api/auth/login                 | No            |
| Auth           | POST   | /api/auth/logout                | Yes           |
| Auth           | GET    | /api/auth/me                    | Yes           |
| Profile        | GET    | /api/users/:id                  | No            |
| Profile        | PUT    | /api/users/:id                  | Yes (owner)   |
| Profile        | GET    | /api/users/:id/skills           | No            |
| Skills         | POST   | /api/skills                     | Yes           |
| Skills         | GET    | /api/skills                     | No            |
| Skills         | GET    | /api/skills/:id                 | No            |
| Skills         | PUT    | /api/skills/:id                 | Yes (owner)   |
| Skills         | DELETE | /api/skills/:id                 | Yes (owner)   |
| Skill Requests | POST   | /api/skill-requests             | Yes           |
| Skill Requests | GET    | /api/skill-requests             | No            |
| Matching       | POST   | /api/matches                    | Yes           |
| Matching       | GET    | /api/matches/me                 | Yes           |
| Matching       | PUT    | /api/matches/:id/respond        | Yes           |
| Sessions       | POST   | /api/sessions                   | Yes           |
| Sessions       | PUT    | /api/sessions/:id/complete      | Yes           |
| Sessions       | GET    | /api/sessions/me                | Yes           |
| Credits        | GET    | /api/credits/balance            | Yes           |
| Credits        | GET    | /api/credits/history            | Yes           |
| Credits        | POST   | /api/credits/purchase           | Yes           |
| Payments       | POST   | /api/payments/initiate          | Yes           |
| Payments       | POST   | /api/payments/verify            | Yes           |

---

## 5. Business Rules
- New user starts with **50 free credits**
- Platform takes **15% commission** on all paid sessions
- Credit sessions: credits transfer from learner → teacher on completion
- A user cannot match with themselves
- Free users: max 3 active matches at once
- Premium users: unlimited matches + priority in search results

---

## 6. Naming Conventions
- Files: `snake_case.py`
- DB tables: `snake_case` (plural)
- API responses: `camelCase` JSON keys
- React components: `PascalCase`
- CSS classes: Tailwind utility only

---

## 7. Standard API Response Format
```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": "Human-readable message" }

// List
{ "success": true, "data": [ ... ], "total": 42, "page": 1 }
```

---

## 8. MVP Feature Scope (Build First)
- [x] Auth (register, login, JWT)
- [x] User profile (view, edit)
- [x] Skill CRUD
- [x] Skill request CRUD
- [x] Basic matching
- [x] Session scheduling & completion
- [x] Credit transfer on session complete
- [ ] Payments (Phase 2)
- [ ] Premium subscription (Phase 2)
- [ ] Featured listings (Phase 2)
- [ ] Institutional tie-ups (Phase 3)
