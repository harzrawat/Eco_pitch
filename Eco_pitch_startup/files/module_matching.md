# Module: Matching System
> Reference spec.md for stack, schema, and response format before proceeding.
> Auth, Profile, and Skill Listing modules must be complete before building this.

---

## Scope
Allow a learner to request a match with a teacher for a specific skill.
Allow the teacher to accept or reject.
Schedule a session once matched.
**Do NOT handle credit deduction or payment here — that's the Credits and Payments modules.**

---

## Endpoints to Build

### POST /api/matches
**Purpose:** Learner sends a match request to a teacher for a specific skill.
**Auth:** Required.

**Request Body:**
```json
{
  "skillId": "uuid",
  "sessionType": "credit"
}
```

**Rules:**
- `learnerId` = token user_id (do not accept in body)
- `teacherId` = inferred from `skill.user_id`
- `sessionType` must be `"credit"` or `"paid"`
- If `sessionType = "credit"`, the skill must have `creditsPerSession` set
- If `sessionType = "paid"`, the skill must have `pricePerSession` set
- A user **cannot** match with themselves → 400
- Free user: max **3 pending or accepted matches** at a time → 403 with message
- Duplicate match request (same learner + skill + status pending) → 409 Conflict

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "matchId": "uuid",
    "teacherId": "uuid",
    "learnerId": "uuid",
    "skillId": "uuid",
    "sessionType": "credit",
    "status": "pending",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

---

### GET /api/matches/me
**Purpose:** Get all matches for the logged-in user (as teacher or learner).
**Auth:** Required.

**Query Params:** `?role=teacher` or `?role=learner` (optional, defaults to both)
`?status=pending` (optional filter)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "matchId": "uuid",
      "status": "pending",
      "sessionType": "credit",
      "skill": {
        "skillId": "uuid",
        "title": "Python Basics",
        "creditsPerSession": 10
      },
      "teacher": {
        "userId": "uuid",
        "name": "Riya Shah",
        "avatarUrl": "https://..."
      },
      "learner": {
        "userId": "uuid",
        "name": "Arjun Mehta",
        "avatarUrl": "https://..."
      },
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 3
}
```

---

### PUT /api/matches/:id/respond
**Purpose:** Teacher accepts or rejects a match request.
**Auth:** Required. Only the teacher of the match.

**Request Body:**
```json
{
  "action": "accepted"
}
```
`action` must be `"accepted"` or `"rejected"`.

**Rules:**
- Only the teacher (match.teacher_id == token user_id) can respond → else 403
- Can only respond to `status = "pending"` matches → 400 if already responded
- If `accepted`: update match status and auto-create a `Session` record with `status = "scheduled"`
- If `rejected`: update match status to `"rejected"`, no session created

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "matchId": "uuid",
    "status": "accepted",
    "session": {
      "sessionId": "uuid",
      "status": "scheduled",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  }
}
```

---

## Auto-Created Session Record (on match acceptance)
When a match is accepted, create a `Session` row:
```
Session(
  id           = new UUID,
  match_id     = match.id,
  teacher_id   = match.teacher_id,
  learner_id   = match.learner_id,
  skill_id     = match.skill_id,
  session_type = match.session_type,
  credits_used = skill.credits_per_session  (if type = credit, else NULL),
  amount_paid  = skill.price_per_session    (if type = paid, else NULL),
  platform_fee = amount_paid * 0.15         (if paid, else NULL),
  status       = "scheduled"
)
```
> Do NOT deduct credits here. Credit deduction happens in the Credits module on session completion.

---

## File Structure to Create
```
backend/
└── matching/
    ├── __init__.py
    ├── routes.py       # Blueprint: 3 endpoints
    ├── models.py       # Match and Session SQLAlchemy models
    └── schemas.py      # Serializers
```

> Import `Skill` from `skills/models.py`, `User` from `auth/models.py`.

---

## Business Rules Summary
| Rule                                    | Enforcement     |
|-----------------------------------------|-----------------|
| No self-matching                        | Backend check   |
| Free users: max 3 active matches        | Backend check   |
| Only teacher can accept/reject          | JWT + DB check  |
| Only pending matches can be responded to| Status check    |
| Session auto-created on acceptance      | Backend logic   |

---

## Error Codes to Handle
| Scenario                        | HTTP Code |
|---------------------------------|-----------|
| Self-match attempt              | 400       |
| Free user match limit exceeded  | 403       |
| Duplicate match request         | 409       |
| Match not found                 | 404       |
| Not the teacher                 | 403       |
| Already responded               | 400       |
| Invalid action value            | 400       |

---

## What NOT to Build in This Module
- ❌ Credit deduction (Credits module)
- ❌ Payment processing (Payments module)
- ❌ Messaging between users (Phase 2)
- ❌ Session rating/review (Phase 2)
- ❌ Recommendation algorithm (Phase 2)
