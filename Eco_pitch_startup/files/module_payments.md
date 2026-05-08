# Module: Payments
> Reference spec.md for stack, schema, and response format before proceeding.
> All other modules must be complete before building this. This is Phase 2.

---

## Scope
Handle real-money transactions for paid sessions and credit purchases via Razorpay.
Split payments between platform (15% fee) and teacher.
**Do NOT change credit logic here — credit_purchase webhook calls the Credits module.**

---

## Payment Flow Overview

```
PAID SESSION FLOW:
Learner initiates match (sessionType: "paid")
  → Match accepted by teacher
  → Learner calls POST /api/payments/initiate
  → Backend creates Razorpay order
  → Frontend opens Razorpay checkout
  → User pays
  → Razorpay sends webhook → POST /api/payments/webhook
  → Backend verifies signature
  → Updates Payment record to "success"
  → Session proceeds normally

CREDIT PURCHASE FLOW:
User calls POST /api/credits/purchase
  → Backend creates Razorpay order
  → Frontend opens Razorpay checkout
  → User pays
  → Razorpay webhook hits POST /api/payments/webhook
  → Backend adds credits to user account
```

---

## Endpoints to Build

### POST /api/payments/initiate
**Purpose:** Create a Razorpay order for a paid session.
**Auth:** Required. Only the learner of the session.

**Request Body:**
```json
{
  "sessionId": "uuid"
}
```

**Backend Logic:**
```
1. Fetch session from DB
2. Verify session.learner_id == token user_id → else 403
3. Verify session.session_type == "paid" → else 400
4. Verify session.status == "scheduled" → else 400
5. Verify no existing successful payment for this session → else 409
6. Calculate:
   gross_amount  = session.amount_paid
   platform_fee  = gross_amount * 0.15
   net_amount    = gross_amount - platform_fee
7. Create Razorpay order via API
8. Insert Payment record (status = "pending")
9. Return order details to frontend
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "paymentId": "uuid",
    "razorpayOrderId": "order_XXXXXXXXXXXXXXX",
    "amount": 200.00,
    "currency": "INR",
    "keyId": "rzp_test_XXXXXXXXXX"
  }
}
```

---

### POST /api/payments/verify
**Purpose:** Frontend calls this after Razorpay checkout completes (client-side verification fallback).
**Auth:** Required.

**Request Body:**
```json
{
  "razorpayOrderId": "order_XXXXX",
  "razorpayPaymentId": "pay_XXXXX",
  "razorpaySignature": "signature_hash"
}
```

**Backend Logic:**
```
1. Verify HMAC-SHA256 signature:
   expected = HMAC(key=razorpay_secret, msg="{orderId}|{paymentId}")
   if expected != razorpaySignature → 400 Invalid signature
2. Update Payment.payment_status = "success"
3. Update Payment.gateway_ref = razorpayPaymentId
4. If payment is for a session → session proceeds (already scheduled)
5. If payment is for credit purchase → add credits to user
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Payment verified successfully",
    "paymentId": "uuid"
  }
}
```

---

### POST /api/payments/webhook (Razorpay Server Webhook)
**Purpose:** Razorpay calls this endpoint automatically after payment events.
**Auth:** Validate Razorpay webhook signature (X-Razorpay-Signature header).

**Events to Handle:**
```
payment.captured  → mark payment success, trigger session/credit update
payment.failed    → mark payment failed
```

**Backend Logic:**
```python
@app.route("/api/payments/webhook", methods=["POST"])
def razorpay_webhook():
    # 1. Verify webhook signature
    signature = request.headers.get("X-Razorpay-Signature")
    body = request.get_data()
    verify_webhook_signature(body, signature, RAZORPAY_WEBHOOK_SECRET)

    # 2. Parse event
    event = request.json.get("event")
    payload = request.json.get("payload")

    if event == "payment.captured":
        handle_payment_success(payload)
    elif event == "payment.failed":
        handle_payment_failure(payload)

    return {"status": "ok"}, 200
```

---

### GET /api/payments/history
**Purpose:** Get payment history for the logged-in user.
**Auth:** Required.

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "paymentId": "uuid",
      "grossAmount": 200.00,
      "platformFee": 30.00,
      "netAmount": 170.00,
      "paymentStatus": "success",
      "createdAt": "2025-01-01T00:00:00Z",
      "session": { "sessionId": "uuid", "skill": "Python Basics" }
    }
  ]
}
```

---

## Razorpay Setup
```python
# Install
pip install razorpay

# Config (store in .env, never hardcode)
RAZORPAY_KEY_ID     = "rzp_test_XXXXXXXXXX"
RAZORPAY_KEY_SECRET = "your_secret_here"
RAZORPAY_WEBHOOK_SECRET = "your_webhook_secret"

# Initialize client
import razorpay
client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# Create order
order = client.order.create({
    "amount": int(gross_amount * 100),   # Razorpay uses paise (₹1 = 100 paise)
    "currency": "INR",
    "receipt": str(payment_id),
    "payment_capture": 1
})
```

---

## File Structure to Create
```
backend/
└── payments/
    ├── __init__.py
    ├── routes.py       # Blueprint: initiate, verify, webhook, history
    ├── models.py       # Payment SQLAlchemy model
    └── utils.py        # verify_signature(), handle_payment_success(), handle_payment_failure()
```

---

## Environment Variables Required
```env
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXX
RAZORPAY_KEY_SECRET=your_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

---

## Security Rules
- NEVER log or expose `RAZORPAY_KEY_SECRET`
- Always verify webhook signature before processing
- Use HTTPS only in production for webhook endpoint
- Idempotency: check if payment already processed before acting again

---

## Error Codes to Handle
| Scenario                   | HTTP Code |
|----------------------------|-----------|
| Session not found          | 404       |
| Not the learner            | 403       |
| Wrong session type         | 400       |
| Duplicate payment          | 409       |
| Invalid signature          | 400       |
| Razorpay API error         | 502       |

---

## What NOT to Build in This Module
- ❌ Subscription billing (Phase 2 separate task)
- ❌ Refunds via Razorpay (Phase 3)
- ❌ Payouts to teachers (Phase 3 — manual for now)
- ❌ UPI, wallet, or card storage
