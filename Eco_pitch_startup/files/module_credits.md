# Module: Credit System
> Reference spec.md for stack, schema, and response format before proceeding.
> Auth and Matching modules must be complete before building this.

---

## Scope
Manage credit balance, credit transfers when a session completes, credit purchase with money, and full transaction history.
**Do NOT build payment gateway integration here — that's the Payments module.**

---

## How Credits Work
```
New user signup     → +50 credits (handled in Auth module)
Session completed   → learner loses X credits, teacher gains X credits
Credit purchase     → user pays ₹ → gains credits (initiation here, webhook in Payments)
```

---

## Endpoints to Build

### GET /api/credits/balance
**Purpose:** Get current credit balance of logged-in user.
**Auth:** Required.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "credits": 80
  }
}
```

---

### GET /api/credits/history
**Purpose:** Full credit transaction history for logged-in user.
**Auth:** Required.

**Query Params:** `?page=1&limit=20`

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "transactionId": "uuid",
      "delta": -10,
      "reason": "session_taken",
      "refId": "session_uuid",
      "createdAt": "2025-01-01T00:00:00Z"
    },
    {
      "transactionId": "uuid",
      "delta": 15,
      "reason": "session_taught",
      "refId": "session_uuid",
      "createdAt": "2025-01-01T00:00:00Z"
    },
    {
      "transactionId": "uuid",
      "delta": 50,
      "reason": "signup_bonus",
      "refId": null,
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 3,
  "page": 1
}
```

**Rules:**
- Return transactions for the logged-in user only
- Sort by `created_at DESC`

---

### POST /api/credits/purchase
**Purpose:** User buys credits with money.
**Auth:** Required.

**Request Body:**
```json
{
  "creditAmount": 100
}
```

**Pricing Logic:**
```
100 credits = ₹50
200 credits = ₹90 (10% discount)
500 credits = ₹200 (20% discount)
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "creditAmount": 100,
    "amountCharged": 50.00,
    "currency": "INR",
    "paymentOrderId": "razorpay_order_id_here",
    "message": "Complete payment to receive credits"
  }
}
```

**Rules:**
- Do NOT add credits yet — only create a pending payment order
- Credits are added only after payment is verified (Payments module handles webhook)
- Valid `creditAmount` values: `100`, `200`, `500` only → else 400

---

### POST /api/credits/transfer (INTERNAL — not a public API)
**Purpose:** Transfer credits between users when a session is completed.
**Called by:** Session completion endpoint (Matching module).
**Auth:** Internal call only (no external access).

**Logic:**
```python
def transfer_credits(session_id):
    session = Session.query.get(session_id)

    # Validate
    if session.session_type != "credit":
        return  # no transfer for paid sessions
    if session.status != "completed":
        raise Error("Session not completed")

    learner = User.query.get(session.learner_id)
    teacher = User.query.get(session.teacher_id)
    amount  = session.credits_used

    # Check balance
    if learner.credits < amount:
        raise Error("Insufficient credits")

    # Deduct from learner
    learner.credits -= amount
    log_transaction(user_id=learner.id, delta=-amount, reason="session_taken", ref_id=session_id)

    # Add to teacher
    teacher.credits += amount
    log_transaction(user_id=teacher.id, delta=+amount, reason="session_taught", ref_id=session_id)

    db.session.commit()
```

---

### PUT /api/sessions/:id/complete
**Purpose:** Mark a session as completed and trigger credit transfer (if credit session).
**Auth:** Required. Either teacher or learner can mark complete.

**Request Body:**
```json
{}
```

**Rules:**
- Session must be in `status = "scheduled"` → else 400
- Only teacher or learner of the session can complete → else 403
- Update `session.status = "completed"`, set `completed_at = now()`
- If `session_type = "credit"`: call `transfer_credits(session_id)`
- If `session_type = "paid"`: no credit action (payment already processed)
- Update `match.status = "completed"`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "status": "completed",
    "completedAt": "2025-01-02T00:00:00Z",
    "creditsTransferred": 10
  }
}
```

---

### GET /api/sessions/me
**Purpose:** Get all sessions for the logged-in user.
**Auth:** Required.

**Query Params:** `?role=teacher&status=completed&page=1&limit=10`

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "sessionId": "uuid",
      "sessionType": "credit",
      "creditsUsed": 10,
      "amountPaid": null,
      "status": "completed",
      "scheduledAt": null,
      "completedAt": "2025-01-02T00:00:00Z",
      "skill": { "skillId": "uuid", "title": "Python Basics" },
      "teacher": { "userId": "uuid", "name": "Riya Shah" },
      "learner": { "userId": "uuid", "name": "Arjun Mehta" }
    }
  ],
  "total": 5,
  "page": 1
}
```

---

## File Structure to Create
```
backend/
└── credits/
    ├── __init__.py
    ├── routes.py       # Blueprint: balance, history, purchase, session complete
    ├── models.py       # CreditTransaction SQLAlchemy model
    └── utils.py        # transfer_credits(), log_transaction()
```

> Reuse `User` from `auth/models.py`.
> Reuse `Session` from `matching/models.py`.

---

## Credit Reason Codes (use exactly these strings)
| Reason             | When                          |
|--------------------|-------------------------------|
| `signup_bonus`     | New user registration         |
| `session_taught`   | Teacher completes session     |
| `session_taken`    | Learner completes session     |
| `credit_purchase`  | User buys credits             |
| `admin_adjustment` | Manual override (admin only)  |

---

## Error Codes to Handle
| Scenario                     | HTTP Code |
|------------------------------|-----------|
| Invalid credit amount        | 400       |
| Insufficient credits         | 402       |
| Session not found            | 404       |
| Not authorized for session   | 403       |
| Session already completed    | 400       |

---

## What NOT to Build in This Module
- ❌ Razorpay/payment gateway integration (Payments module)
- ❌ Premium subscription billing (Phase 2)
- ❌ Refund logic (Phase 2)
- ❌ Admin credit adjustment UI (Phase 3)
