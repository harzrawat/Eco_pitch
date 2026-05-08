# Module: User Profile
> Reference spec.md for stack, schema, and response format before proceeding.
> Auth module must be complete before building this.

---

## Scope
View any user's public profile, and allow a logged-in user to update their own profile.
**Do NOT build skill listing, matching, or credits here.**

---

## Endpoints to Build

### GET /api/users/:id
**Purpose:** Fetch public profile of any user by their UUID.
**Auth:** Not required.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "name": "Riya Shah",
    "bio": "I love coding and music.",
    "avatarUrl": "https://...",
    "college": "SVNIT Surat",
    "city": "Surat",
    "credits": 50,
    "isPremium": false,
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

**Rules:**
- Never return `email` or `password` in public profile
- Return 404 if user not found

---

### PUT /api/users/:id
**Purpose:** Update logged-in user's own profile.
**Auth:** Bearer token required. Only the owner can update their profile.

**Request Body (all fields optional):**
```json
{
  "name": "Riya Shah",
  "bio": "Updated bio here",
  "college": "SVNIT Surat",
  "city": "Surat",
  "avatarUrl": "https://..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "name": "Riya Shah",
    "bio": "Updated bio here",
    "college": "SVNIT Surat",
    "city": "Surat",
    "avatarUrl": "https://...",
    "updatedAt": "2025-01-02T00:00:00Z"
  }
}
```

**Rules:**
- Token user_id must match the :id param → else 403 Forbidden
- Do not allow updating `email`, `password`, `credits`, or `isPremium` via this endpoint
- Only update fields that are present in the request body (partial update)

---

### GET /api/users/:id/skills
**Purpose:** Fetch all active skills listed by a specific user.
**Auth:** Not required.

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "skillId": "uuid",
      "title": "Python Basics",
      "description": "Learn Python from scratch in 2 sessions",
      "category": "Tech",
      "mode": "online",
      "creditsPerSession": 10,
      "pricePerSession": null
    }
  ],
  "total": 1
}
```

**Rules:**
- Return only `is_active = true` skills
- Return empty array (not 404) if user has no skills

---

## File Structure to Create
```
backend/
└── users/
    ├── __init__.py
    ├── routes.py       # Flask Blueprint: 3 endpoints
    └── schemas.py      # Serialization — strip sensitive fields
```

> Reuse the `User` model from `auth/models.py`.
> Reuse the `Skill` model from `skills/models.py` (import it; don't redefine).

---

## Business Rules
- Public profiles are visible to all (no auth needed)
- Users cannot edit another user's profile
- `credits` and `isPremium` are read-only from this module — they are managed by the Credits module

---

## Error Codes to Handle
| Scenario              | HTTP Code |
|-----------------------|-----------|
| User not found        | 404       |
| Editing another user  | 403       |
| Invalid token         | 401       |
| Server error          | 500       |

---

## What NOT to Build in This Module
- ❌ Avatar file upload (serve URL only for MVP)
- ❌ Password change endpoint
- ❌ Credit balance update
- ❌ Skill creation (that's skills module)
- ❌ User search/discovery (matching module handles that)
