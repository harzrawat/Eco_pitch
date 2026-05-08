# Module: Skill Listing
> Reference spec.md for stack, schema, and response format before proceeding.
> Auth module must be complete before building this.

---

## Scope
Full CRUD for skills a user wants to teach. Also includes skill requests (what users want to learn).
**Do NOT build matching, sessions, or credit logic here.**

---

## Part A: Skills (What Users Teach)

### POST /api/skills
**Purpose:** Create a new skill listing.
**Auth:** Required.

**Request Body:**
```json
{
  "title": "Python Basics",
  "description": "Learn Python from scratch in 2 sessions",
  "category": "Tech",
  "mode": "online",
  "creditsPerSession": 10,
  "pricePerSession": null
}
```

**Rules:**
- `userId` comes from JWT — do not accept it in body
- At least one of `creditsPerSession` or `pricePerSession` must be provided
- `category` must be one of: `Tech`, `Music`, `Design`, `Language`, `Fitness`, `Academic`, `Other`
- `mode` must be: `online`, `offline`, or `both`
- `title` max 100 chars, `description` max 500 chars

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "skillId": "uuid",
    "userId": "uuid",
    "title": "Python Basics",
    "description": "...",
    "category": "Tech",
    "mode": "online",
    "creditsPerSession": 10,
    "pricePerSession": null,
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

---

### GET /api/skills
**Purpose:** Browse all active skills. Supports filtering.
**Auth:** Not required.

**Query Params:**
```
?category=Tech
?mode=online
?city=Surat
?q=python           (search in title/description)
?page=1&limit=10
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "skillId": "uuid",
      "title": "Python Basics",
      "category": "Tech",
      "mode": "online",
      "creditsPerSession": 10,
      "pricePerSession": null,
      "teacher": {
        "userId": "uuid",
        "name": "Riya Shah",
        "city": "Surat",
        "avatarUrl": "https://..."
      }
    }
  ],
  "total": 24,
  "page": 1
}
```

**Rules:**
- Only return `is_active = true` skills
- Default: `limit=10`, `page=1`
- Sort by `created_at DESC` by default
- Premium users appear first in results (is_premium = true)

---

### GET /api/skills/:id
**Purpose:** Fetch full details of one skill.
**Auth:** Not required.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "skillId": "uuid",
    "title": "Python Basics",
    "description": "Full description here",
    "category": "Tech",
    "mode": "online",
    "creditsPerSession": 10,
    "pricePerSession": null,
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00Z",
    "teacher": {
      "userId": "uuid",
      "name": "Riya Shah",
      "bio": "...",
      "college": "SVNIT",
      "city": "Surat",
      "avatarUrl": "https://..."
    }
  }
}
```

---

### PUT /api/skills/:id
**Purpose:** Update an existing skill listing.
**Auth:** Required. Only the owner can update.

**Request Body (partial update, all optional):**
```json
{
  "title": "Updated Title",
  "description": "...",
  "creditsPerSession": 15,
  "isActive": false
}
```

**Rules:**
- Verify token user_id matches skill.user_id → else 403
- Partial update: only modify provided fields

---

### DELETE /api/skills/:id
**Purpose:** Soft-delete a skill (set `is_active = false`).
**Auth:** Required. Only the owner.

**Response (200):**
```json
{ "success": true, "data": { "message": "Skill removed successfully" } }
```

**Rules:**
- Do NOT hard delete — set `is_active = false`
- Check owner → 403 if mismatch

---

## Part B: Skill Requests (What Users Want to Learn)

### POST /api/skill-requests
**Purpose:** Post a request for a skill you want to learn.
**Auth:** Required.

**Request Body:**
```json
{
  "title": "Want to learn Guitar",
  "description": "Beginner level, acoustic preferred",
  "category": "Music"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "requestId": "uuid",
    "userId": "uuid",
    "title": "Want to learn Guitar",
    "description": "...",
    "category": "Music",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

---

### GET /api/skill-requests
**Purpose:** Browse all skill requests.
**Auth:** Not required.

**Query Params:** `?category=Music&q=guitar&page=1&limit=10`

**Response (200):** Similar list format to GET /api/skills.

---

## File Structure to Create
```
backend/
└── skills/
    ├── __init__.py
    ├── routes.py       # Blueprint for /api/skills and /api/skill-requests
    ├── models.py       # Skill and SkillRequest SQLAlchemy models
    └── schemas.py      # Serializers for Skill and SkillRequest
```

---

## Error Codes to Handle
| Scenario                     | HTTP Code |
|------------------------------|-----------|
| Missing required fields      | 400       |
| Invalid category/mode value  | 400       |
| Skill not found              | 404       |
| Editing another user's skill | 403       |
| Unauthorized                 | 401       |

---

## What NOT to Build in This Module
- ❌ Matching logic (separate module)
- ❌ Session creation
- ❌ Credit deduction
- ❌ Recommendation engine
- ❌ Featured / boosted listings (Phase 2)
