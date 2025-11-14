# REST API Plan - SavorAI MVP

## 1. Resources

The API is organized around the following main resources, each corresponding to database tables:

- **Profile** (`profiles` table) - User dietary preferences and restrictions
- **Recipe** (`recipes` table) - Generated and saved recipes in JSON format
- **Event** (`events` table) - Analytics events for KPI tracking
- **Auth** (`auth.users` table) - Managed by Supabase Auth

## 2. Endpoints

### 2.1 Authentication (Supabase Auth)

Authentication is handled by Supabase Auth SDK. The following endpoints are provided by Supabase:

#### Register User
- **Method**: POST
- **URL**: `/auth/v1/signup`
- **Description**: Register a new user with email and password
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```
- **Response** (201 Created):
```json
{
  "access_token": "jwt_token_here",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "refresh_token_here",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2025-01-15T10:00:00Z"
  }
}
```
- **Error** (400 Bad Request):
```json
{
  "error": "User already registered"
}
```

#### Login
- **Method**: POST
- **URL**: `/auth/v1/token?grant_type=password`
- **Description**: Authenticate user and receive JWT token
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```
- **Response** (200 OK): Same as registration response
- **Error** (400 Bad Request):
```json
{
  "error": "Invalid login credentials"
}
```

#### Logout
- **Method**: POST
- **URL**: `/auth/v1/logout`
- **Description**: Invalidate current session
- **Headers**: `Authorization: Bearer {token}`
- **Response** (204 No Content)

---

### 2.2 Profile Resource

#### Get User Profile
- **Method**: GET
- **URL**: `/api/profile`
- **Description**: Retrieve the authenticated user's dietary profile
- **Headers**: `Authorization: Bearer {token}`
- **Response** (200 OK):
```json
{
  "user_id": "uuid",
  "diet_type": "vegetarian",
  "disliked_ingredients": ["mushrooms", "olives"],
  "preferred_cuisines": ["italian", "mediterranean"],
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-15T10:00:00Z"
}
```
- **Error** (404 Not Found):
```json
{
  "error": "Profile not found",
  "message": "Please create your profile first"
}
```
- **Error** (401 Unauthorized):
```json
{
  "error": "Unauthorized",
  "message": "Valid authentication token required"
}
```

#### Create User Profile
- **Method**: POST
- **URL**: `/api/profile`
- **Description**: Create initial profile for authenticated user
- **Headers**: `Authorization: Bearer {token}`
- **Request Body**:
```json
{
  "diet_type": "vegetarian",
  "disliked_ingredients": ["mushrooms", "olives"],
  "preferred_cuisines": ["italian", "mediterranean"]
}
```
- **Response** (201 Created):
```json
{
  "user_id": "uuid",
  "diet_type": "vegetarian",
  "disliked_ingredients": ["mushrooms", "olives"],
  "preferred_cuisines": ["italian", "mediterranean"],
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-15T10:00:00Z"
}
```
- **Error** (400 Bad Request):
```json
{
  "error": "Validation failed",
  "details": {
    "diet_type": "Must be one of: vegan, vegetarian, pescatarian, keto, paleo, gluten_free, dairy_free, low_carb, mediterranean, omnivore"
  }
}
```
- **Error** (409 Conflict):
```json
{
  "error": "Profile already exists",
  "message": "Use PUT /api/profile to update existing profile"
}
```

#### Update User Profile
- **Method**: PUT
- **URL**: `/api/profile`
- **Description**: Update authenticated user's profile; logs `profile_edited` event
- **Headers**: `Authorization: Bearer {token}`
- **Request Body** (all fields optional):
```json
{
  "diet_type": "vegan",
  "disliked_ingredients": ["mushrooms", "olives", "anchovies"],
  "preferred_cuisines": ["italian"]
}
```
- **Response** (200 OK):
```json
{
  "user_id": "uuid",
  "diet_type": "vegan",
  "disliked_ingredients": ["mushrooms", "olives", "anchovies"],
  "preferred_cuisines": ["italian"],
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-16T14:30:00Z"
}
```
- **Error** (400 Bad Request):
```json
{
  "error": "Validation failed",
  "details": {
    "diet_type": "Invalid diet type"
  }
}
```
- **Error** (404 Not Found):
```json
{
  "error": "Profile not found",
  "message": "Please create profile first using POST /api/profile"
}
```

---

### 2.3 Recipe Resource

#### Generate Recipe with AI
- **Method**: POST
- **URL**: `/api/recipes/generate`
- **Description**: Generate a single recipe using AI based on prompt and user profile; logs `ai_prompt_sent` and `ai_recipe_generated` events; implements 1x retry on failure
- **Headers**: `Authorization: Bearer {token}`
- **Query Parameters**: None
- **Request Body**:
```json
{
  "prompt": "Quick Mediterranean dinner for 2 people under 30 minutes"
}
```
- **Response** (200 OK):
```json
{
  "recipe": {
    "title": "Mediterranean Shrimp Pasta",
    "summary": "A light and flavorful pasta dish with shrimp, cherry tomatoes, and fresh herbs",
    "prep_time_minutes": 10,
    "cook_time_minutes": 15,
    "servings": 2,
    "difficulty": "easy",
    "cuisine": "mediterranean",
    "ingredients": [
      "200g linguine pasta",
      "250g large shrimp, peeled and deveined",
      "200g cherry tomatoes, halved",
      "3 cloves garlic, minced",
      "2 tbsp olive oil",
      "Fresh basil leaves",
      "Salt and pepper to taste"
    ],
    "instructions": [
      "Bring a large pot of salted water to boil. Cook pasta according to package directions.",
      "While pasta cooks, heat olive oil in a large skillet over medium-high heat.",
      "Add garlic and cook for 30 seconds until fragrant.",
      "Add shrimp and cook 2-3 minutes per side until pink.",
      "Add cherry tomatoes and cook until they begin to burst, about 3 minutes.",
      "Drain pasta and add to the skillet. Toss to combine.",
      "Season with salt and pepper. Garnish with fresh basil."
    ],
    "tags": ["quick", "seafood", "mediterranean", "pasta"],
    "dietary_info": {
      "vegetarian": false,
      "vegan": false,
      "gluten_free": false,
      "dairy_free": true
    }
  },
  "generation_id": "uuid",
  "generated_at": "2025-01-16T15:00:00Z"
}
```
- **Error** (400 Bad Request):
```json
{
  "error": "Validation failed",
  "message": "Prompt exceeds maximum length of 2000 characters"
}
```
- **Error** (413 Payload Too Large):
```json
{
  "error": "Recipe too large",
  "message": "Generated recipe exceeds 200KB limit"
}
```
- **Error** (429 Too Many Requests):
```json
{
  "error": "Rate limit exceeded",
  "message": "Maximum 10 generations per hour",
  "retry_after": 3600
}
```
- **Error** (500 Internal Server Error):
```json
{
  "error": "AI generation failed",
  "message": "Failed to generate recipe after retry. Please try again later.",
  "details": "AI service unavailable"
}
```
- **Error** (503 Service Unavailable):
```json
{
  "error": "Service temporarily unavailable",
  "message": "AI service is experiencing issues. Please try again in a few minutes."
}
```

#### Save Recipe
- **Method**: POST
- **URL**: `/api/recipes`
- **Description**: Save generated recipe to user's collection; validates against disliked ingredients; logs `recipe_saved` event; uses `insert_recipe_safe` RPC function
- **Headers**: `Authorization: Bearer {token}`
- **Request Body**:
```json
{
  "recipe": {
    "title": "Mediterranean Shrimp Pasta",
    "summary": "A light and flavorful pasta dish...",
    "prep_time_minutes": 10,
    "cook_time_minutes": 15,
    "servings": 2,
    "difficulty": "easy",
    "cuisine": "mediterranean",
    "ingredients": ["200g linguine pasta", "250g large shrimp..."],
    "instructions": ["Bring a large pot...", "While pasta cooks..."],
    "tags": ["quick", "seafood", "mediterranean", "pasta"],
    "dietary_info": {
      "vegetarian": false,
      "vegan": false,
      "gluten_free": false,
      "dairy_free": true
    }
  },
  "tags": ["quick", "seafood", "favorite"]
}
```
- **Response** (201 Created):
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "Mediterranean Shrimp Pasta",
  "summary": "A light and flavorful pasta dish...",
  "tags": ["quick", "seafood", "favorite"],
  "created_at": "2025-01-16T15:05:00Z",
  "updated_at": "2025-01-16T15:05:00Z"
}
```
- **Error** (400 Bad Request) - Invalid JSON Schema:
```json
{
  "error": "Validation failed",
  "message": "Recipe does not conform to schema_v1",
  "details": {
    "field": "ingredients",
    "issue": "Required field missing"
  }
}
```
- **Error** (400 Bad Request) - Disliked Ingredient:
```json
{
  "error": "Recipe contains disliked ingredient",
  "message": "Recipe contains disliked ingredient: mushrooms",
  "blocked_ingredients": ["mushrooms"]
}
```
- **Error** (413 Payload Too Large):
```json
{
  "error": "Recipe too large",
  "message": "Recipe size exceeds 200KB limit"
}
```

#### List Recipes
- **Method**: GET
- **URL**: `/api/recipes`
- **Description**: List user's saved recipes with pagination, search, and filtering
- **Headers**: `Authorization: Bearer {token}`
- **Query Parameters**:
  - `search` (string, optional): Full-text search across title, summary, and ingredients
  - `tags` (string, optional): Comma-separated tags for OR filtering (e.g., `tags=seafood,pasta`)
  - `sort` (string, optional): Sort order - `recent` (default), `oldest`
  - `limit` (integer, optional): Results per page (default: 20, max: 100)
  - `cursor` (string, optional): Cursor for keyset pagination (base64 encoded `created_at:id`)
  - `offset` (integer, optional): Offset for simple pagination (alternative to cursor)
- **Example**: `/api/recipes?search=pasta&tags=quick,italian&limit=20&sort=recent`
- **Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid1",
      "title": "Mediterranean Shrimp Pasta",
      "summary": "A light and flavorful pasta dish...",
      "tags": ["quick", "seafood", "mediterranean"],
      "created_at": "2025-01-16T15:05:00Z"
    },
    {
      "id": "uuid2",
      "title": "Italian Carbonara",
      "summary": "Classic Roman pasta with eggs and pancetta",
      "tags": ["italian", "pasta", "classic"],
      "created_at": "2025-01-15T12:30:00Z"
    }
  ],
  "pagination": {
    "limit": 20,
    "next_cursor": "MjAyNS0wMS0xNVQxMjozMDowMFo6dXVpZDI=",
    "has_more": true,
    "total_count": 45
  }
}
```
- **Response** (200 OK) - Empty state:
```json
{
  "data": [],
  "pagination": {
    "limit": 20,
    "next_cursor": null,
    "has_more": false,
    "total_count": 0
  },
  "message": "No recipes found. Generate your first recipe to get started!"
}
```
- **Error** (400 Bad Request):
```json
{
  "error": "Invalid query parameters",
  "details": {
    "limit": "Must be between 1 and 100"
  }
}
```

#### Get Recipe Details
- **Method**: GET
- **URL**: `/api/recipes/:id`
- **Description**: Retrieve full details of a specific recipe including complete JSON
- **Headers**: `Authorization: Bearer {token}`
- **Response** (200 OK):
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "Mediterranean Shrimp Pasta",
  "summary": "A light and flavorful pasta dish with shrimp, cherry tomatoes, and fresh herbs",
  "tags": ["quick", "seafood", "mediterranean"],
  "recipe": {
    "title": "Mediterranean Shrimp Pasta",
    "summary": "A light and flavorful pasta dish...",
    "prep_time_minutes": 10,
    "cook_time_minutes": 15,
    "servings": 2,
    "difficulty": "easy",
    "cuisine": "mediterranean",
    "ingredients": ["200g linguine pasta", "250g large shrimp..."],
    "instructions": ["Bring a large pot...", "While pasta cooks..."],
    "tags": ["quick", "seafood", "mediterranean", "pasta"],
    "dietary_info": {
      "vegetarian": false,
      "vegan": false,
      "gluten_free": false,
      "dairy_free": true
    }
  },
  "created_at": "2025-01-16T15:05:00Z",
  "updated_at": "2025-01-16T15:05:00Z"
}
```
- **Error** (404 Not Found):
```json
{
  "error": "Recipe not found",
  "message": "Recipe with id 'uuid' does not exist or you don't have access"
}
```
- **Error** (401 Unauthorized):
```json
{
  "error": "Unauthorized",
  "message": "Valid authentication token required"
}
```

#### Delete Recipe
- **Method**: DELETE
- **URL**: `/api/recipes/:id`
- **Description**: Permanently delete a recipe from user's collection (hard delete)
- **Headers**: `Authorization: Bearer {token}`
- **Response** (204 No Content)
- **Error** (404 Not Found):
```json
{
  "error": "Recipe not found",
  "message": "Recipe with id 'uuid' does not exist or you don't have access"
}
```
- **Error** (401 Unauthorized):
```json
{
  "error": "Unauthorized",
  "message": "Valid authentication token required"
}
```

---

### 2.4 Events Resource

#### Log Event
- **Method**: POST
- **URL**: `/api/events`
- **Description**: Log a user event for analytics (primarily for `session_start`; other events are logged automatically server-side)
- **Headers**: `Authorization: Bearer {token}`
- **Request Body**:
```json
{
  "type": "session_start",
  "payload": {
    "user_agent": "Mozilla/5.0...",
    "platform": "web"
  }
}
```
- **Response** (201 Created):
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "type": "session_start",
  "payload": {
    "user_agent": "Mozilla/5.0...",
    "platform": "web"
  },
  "occurred_at": "2025-01-16T10:00:00Z"
}
```
- **Error** (400 Bad Request):
```json
{
  "error": "Validation failed",
  "details": {
    "type": "Must be one of: session_start, profile_edited, ai_prompt_sent, ai_recipe_generated, recipe_saved"
  }
}
```

#### Export Events (Admin/Analytics)
- **Method**: POST (Supabase RPC)
- **URL**: `supabase.rpc('export_events_ndjson', { p_from_date, p_to_date })`
- **Description**: Export events in NDJSON format for KPI analysis; requires `service_role` authentication
- **Authentication**: Service role key only (not exposed via public API)
- **Parameters**:
```typescript
{
  p_from_date?: string, // ISO timestamp, optional
  p_to_date?: string    // ISO timestamp, optional
}
```
- **Response** (200 OK):
```
{"id":"uuid1","user_id":"uuid","type":"session_start","payload":null,"occurred_at":"2025-01-16T10:00:00Z"}
{"id":"uuid2","user_id":"uuid","type":"profile_edited","payload":{"fields":["diet_type"]},"occurred_at":"2025-01-16T10:05:00Z"}
{"id":"uuid3","user_id":"uuid","type":"ai_prompt_sent","payload":{"prompt":"Quick dinner"},"occurred_at":"2025-01-16T10:10:00Z"}
```
- **Error** (403 Forbidden):
```json
{
  "error": "Access denied",
  "message": "service_role required"
}
```

---

## 3. Authentication and Authorization

### Authentication Mechanism

**Supabase JWT-based Authentication**
- All API endpoints (except Supabase Auth endpoints) require authentication via JWT tokens
- Tokens are obtained through Supabase Auth endpoints (`/auth/v1/signup`, `/auth/v1/token`)
- Tokens must be included in the `Authorization` header: `Bearer {token}`
- Token expiration: 3600 seconds (1 hour)
- Refresh tokens are provided for session renewal

### Authorization and Row-Level Security (RLS)

**Database-Level Authorization**
- All application tables (`profiles`, `recipes`, `events`) have Row-Level Security (RLS) enabled
- RLS policies enforce that users can only access their own data based on `auth.uid()`
- Policies are defined at the database level (see database schema documentation)

**Profile Table Policies**:
- SELECT: Users can view only their own profile (`auth.uid() = user_id`)
- INSERT: Users can create only their own profile
- UPDATE: Users can update only their own profile
- DELETE: Users can delete only their own profile

**Recipe Table Policies**:
- SELECT: Users can view only their own recipes (`auth.uid() = user_id`)
- INSERT: Users can add recipes only to their own collection
- DELETE: Users can delete only their own recipes
- UPDATE: Not allowed (recipes are read-only after save in MVP)

**Events Table Policies**:
- INSERT: Users can log only their own events (`auth.uid() = user_id`)
- SELECT/UPDATE/DELETE: Not allowed for regular users; access restricted to `service_role` for analytics

### API-Level Authorization

**Endpoint Protection**:
- API validates JWT token on every request
- Extracts `user_id` from token and uses Supabase client with RLS enforcement
- Invalid or expired tokens return `401 Unauthorized`
- Attempts to access other users' data are blocked by RLS (returns empty results or `404 Not Found`)

### Rate Limiting

**AI Generation Endpoint**:
- Limit: 10 requests per hour per user
- Exceeded limit returns `429 Too Many Requests` with `Retry-After` header
- Implementation: Can use Supabase Edge Functions rate limiting or API gateway

**Other Endpoints**:
- Standard rate limiting: 100 requests per minute per user
- Adjustable based on infrastructure capacity

---

## 4. Validation and Business Logic

### 4.1 Input Validation

#### Profile Validation

**Field: `diet_type`**
- Type: String (optional, nullable)
- Allowed values: `vegan`, `vegetarian`, `pescatarian`, `keto`, `paleo`, `gluten_free`, `dairy_free`, `low_carb`, `mediterranean`, `omnivore`
- Database constraint: `CHECK (diet_type IN (...))`
- API validation: Returns `400 Bad Request` with details if invalid

**Field: `disliked_ingredients`**
- Type: Array of strings
- Validation: Each element normalized to lowercase
- Normalization: Automatic via database trigger (`normalize_profile_arrays`)
- API validation: Array length should be reasonable (e.g., max 50 items)

**Field: `preferred_cuisines`**
- Type: Array of strings
- Validation: Each element normalized to lowercase
- Normalization: Automatic via database trigger
- API validation: Array length should be reasonable (e.g., max 20 items)

#### Recipe Validation

**Field: `recipe` (JSONB)**
- Type: JSONB object
- Schema: Must conform to `schema_v1` (defined in PRD)
- Required fields: `title`, `ingredients`, `instructions`
- Size limit: < 200KB (204800 bytes)
- Database constraint: `CHECK (octet_length(recipe::text) < 204800)`
- API validation:
  - JSON schema validation before save
  - Returns `400 Bad Request` if schema validation fails
  - Returns `413 Payload Too Large` if size limit exceeded

**Field: `tags`**
- Type: Array of strings
- Normalization: Automatic lowercase
- Validation: Each tag length should be reasonable (e.g., max 30 chars per tag, max 10 tags)

#### AI Generation Validation

**Field: `prompt`**
- Type: String
- Max length: 2000 characters
- API validation: Returns `400 Bad Request` if exceeded
- UI validation: Character counter and inline warning

### 4.2 Business Logic Implementation

#### 1. Profile Management

**Create Profile (POST /api/profile)**
- Extract `user_id` from authenticated token
- Validate input fields against constraints
- Normalize arrays (lowercase) via database trigger
- Insert record into `profiles` table
- Log `profile_edited` event (type: `profile_created`)
- Return created profile

**Update Profile (PUT /api/profile)**
- Extract `user_id` from authenticated token
- Validate input fields
- Update only provided fields (partial update allowed)
- Database trigger automatically updates `updated_at` timestamp
- Database trigger normalizes arrays
- Log `profile_edited` event with changed fields in payload
- Return updated profile

#### 2. AI Recipe Generation

**Generate Recipe (POST /api/recipes/generate)**
1. Extract `user_id` from authenticated token
2. Validate prompt length (max 2000 chars)
3. Check rate limit (max 10/hour per user) - return `429` if exceeded
4. Fetch user profile from `profiles` table
5. Construct AI prompt including:
   - User's prompt text
   - Profile preferences: `diet_type`, `disliked_ingredients`, `preferred_cuisines`
   - Schema requirements (schema_v1)
6. Log `ai_prompt_sent` event with prompt text
7. Call AI service (Gemini via Google AI Studio or OpenRouter)
8. On AI failure: Retry once (1x retry)
9. On second failure: Return `500 Internal Server Error` with clear message
10. Parse AI response JSON
11. Validate JSON against schema_v1
12. If validation fails: Return `400 Bad Request` with validation details
13. Check recipe size (< 200KB)
14. If too large: Return `413 Payload Too Large`
15. Log `ai_recipe_generated` event with generation metadata
16. Return recipe JSON with `generation_id` and timestamp

**AI Prompt Construction Example**:
```
Generate a single recipe in JSON format based on the following requirements:

User Request: {user_prompt}

Dietary Preferences:
- Diet Type: {diet_type}
- Avoid these ingredients: {disliked_ingredients}
- Preferred cuisines: {preferred_cuisines}

Output must be valid JSON conforming to this schema:
{schema_v1}

Ensure the recipe does not contain any ingredients from the "Avoid" list.
```

#### 3. Recipe Save with "Avoid" Validation

**Save Recipe (POST /api/recipes)**
1. Extract `user_id` from authenticated token
2. Validate recipe JSON against schema_v1
3. Check recipe size (< 200KB)
4. Call Supabase RPC function `insert_recipe_safe(p_recipe, p_tags)`
5. RPC function logic:
   - Fetch user's `disliked_ingredients` from `profiles`
   - Extract ingredients from recipe JSON
   - Normalize all ingredients to lowercase
   - Check each recipe ingredient contains any disliked ingredient (case-insensitive, substring match)
   - If match found: Raise exception with blocked ingredient name
   - If no match: Insert recipe into `recipes` table
   - Database trigger automatically:
     - Extracts `title`, `summary`, `ingredients_text` from recipe JSONB
     - Generates `search_tsv` for full-text search
     - Normalizes `tags` to lowercase
   - Log `recipe_saved` event
   - Return recipe `id`
6. On validation failure: Return `400 Bad Request` with blocked ingredient details
7. On success: Return created recipe summary (201 Created)

**"Avoid" Validation Example**:
```
User's disliked_ingredients: ["mushrooms", "olives"]
Recipe ingredients: ["200g button mushrooms", "100g pasta", "50g parmesan"]

Validation:
- "button mushrooms" contains "mushrooms" → BLOCKED
- Return error: "Recipe contains disliked ingredient: mushrooms"
```

#### 4. Recipe Search and Filtering

**List Recipes (GET /api/recipes)**
1. Extract `user_id` from authenticated token
2. Build query with RLS enforcement (`user_id = auth.uid()`)
3. Apply full-text search if `search` parameter provided:
   - Use `search_tsv` GIN index for performance
   - Match against normalized search terms
4. Apply tag filtering if `tags` parameter provided:
   - Use OR logic: recipe must have at least one of the specified tags
   - Use `tags` GIN index for performance
5. Apply sorting:
   - Default: `created_at DESC` (recently added)
   - Alternative: `created_at ASC` (oldest first)
6. Apply pagination:
   - Keyset pagination (recommended): Use cursor based on `(created_at, id)`
   - Simple pagination: Use `limit` and `offset`
7. Return paginated results with metadata

**Search Query Example**:
```sql
SELECT id, title, summary, tags, created_at
FROM recipes
WHERE user_id = auth.uid()
  AND (
    search_tsv @@ to_tsquery('simple', normalize_text(:search))
  )
  AND (
    :tags IS NULL OR tags && :tags  -- OR logic for tags
  )
ORDER BY created_at DESC, id DESC
LIMIT :limit
```

#### 5. Event Logging

**Automatic Event Logging**:
- `session_start`: Logged by client on app initialization via POST /api/events
- `profile_edited`: Logged automatically server-side on profile UPDATE
- `ai_prompt_sent`: Logged automatically during recipe generation (before AI call)
- `ai_recipe_generated`: Logged automatically during recipe generation (after successful AI response)
- `recipe_saved`: Logged automatically by `insert_recipe_safe` RPC function

**Event Payload Examples**:
```json
// session_start
{
  "user_agent": "Mozilla/5.0...",
  "platform": "web"
}

// profile_edited
{
  "fields_changed": ["diet_type", "disliked_ingredients"]
}

// ai_prompt_sent
{
  "prompt": "Quick Mediterranean dinner",
  "prompt_length": 27
}

// ai_recipe_generated
{
  "generation_id": "uuid",
  "recipe_title": "Mediterranean Shrimp Pasta",
  "ai_provider": "gemini",
  "generation_time_ms": 3420,
  "retry_count": 0
}

// recipe_saved
{
  "recipe_id": "uuid",
  "tags_count": 3
}
```

#### 6. KPI Calculation

**KPI-1: Profile Completion Rate**
- Target: ≥90% of active users have at least one profile field filled
- Calculation:
  ```sql
  SELECT
    COUNT(DISTINCT p.user_id) * 100.0 / COUNT(DISTINCT e.user_id) as completion_rate
  FROM events e
  LEFT JOIN profiles p ON e.user_id = p.user_id
    AND (p.diet_type IS NOT NULL
      OR array_length(p.disliked_ingredients, 1) > 0
      OR array_length(p.preferred_cuisines, 1) > 0)
  WHERE e.type = 'session_start'
    AND e.occurred_at >= NOW() - INTERVAL '7 days'
  ```

**KPI-2: Generation Activity Rate**
- Target: ≥75% of weekly active users generated at least one recipe
- Calculation:
  ```sql
  WITH weekly_active_users AS (
    SELECT DISTINCT user_id
    FROM events
    WHERE type = 'session_start'
      AND occurred_at >= NOW() - INTERVAL '7 days'
  ),
  users_with_generations AS (
    SELECT DISTINCT user_id
    FROM events
    WHERE type = 'ai_recipe_generated'
      AND occurred_at >= NOW() - INTERVAL '7 days'
  )
  SELECT
    COUNT(g.user_id) * 100.0 / COUNT(w.user_id) as generation_rate
  FROM weekly_active_users w
  LEFT JOIN users_with_generations g ON w.user_id = g.user_id
  ```

---

## 5. Error Handling and Status Codes

### Standard HTTP Status Codes

**Success Codes**:
- `200 OK` - Successful GET, PUT requests
- `201 Created` - Successful POST requests (resource created)
- `204 No Content` - Successful DELETE requests

**Client Error Codes**:
- `400 Bad Request` - Validation error, malformed request, business logic violation
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Authenticated but not authorized (e.g., service_role required)
- `404 Not Found` - Resource doesn't exist or user doesn't have access (RLS)
- `409 Conflict` - Resource already exists (e.g., profile already created)
- `413 Payload Too Large` - Request body exceeds size limits
- `429 Too Many Requests` - Rate limit exceeded

**Server Error Codes**:
- `500 Internal Server Error` - Unexpected server error, AI service failure after retry
- `503 Service Unavailable` - AI service temporarily unavailable

### Error Response Format

All error responses follow a consistent JSON format:

```json
{
  "error": "Short error identifier",
  "message": "Human-readable error description",
  "details": {
    "field": "Additional context (optional)"
  },
  "request_id": "uuid (for debugging)"
}
```

### Retry Logic

**AI Generation Retry**:
- Implement 1x automatic retry on AI service failure
- Retry after exponential backoff: 2 seconds
- Log both attempts in `ai_prompt_sent` event payload
- After failed retry: Return `500 Internal Server Error` with clear message
- Include retry count in `ai_recipe_generated` event payload

**Client-Side Retry Guidance**:
- For `429 Too Many Requests`: Respect `Retry-After` header
- For `500/503` errors: Suggest user retry after a few minutes
- For `400` validation errors: Display specific field errors for user correction

---

## 6. API Versioning

**Current Version**: v1 (implicit)
- No version prefix in URLs for MVP (e.g., `/api/recipes` not `/api/v1/recipes`)
- Future versioning strategy: Add `/v2/` prefix when breaking changes are introduced
- Maintain backward compatibility where possible

---

## 7. Performance Considerations

### Database Query Optimization

**Indexes Used**:
- `profiles`: Automatic index on `user_id` (PRIMARY KEY)
- `recipes`:
  - `idx_recipes_user_created` on `(user_id, created_at DESC, id)` for keyset pagination
  - `idx_recipes_tags` (GIN) for tag filtering
  - `idx_recipes_search_tsv` (GIN) for full-text search
- `events`:
  - `idx_events_user_occurred` on `(user_id, occurred_at DESC)`
  - `idx_events_type_occurred` on `(type, occurred_at DESC)`

**Query Patterns**:
- Use keyset pagination for recipe lists (more efficient than OFFSET)
- Leverage GIN indexes for array and full-text search operations
- RLS policies automatically scoped to `user_id` for efficient filtering

### Caching Strategy

**Client-Side Caching**:
- Cache user profile data in memory/localStorage (invalidate on update)
- Cache recipe list with stale-while-revalidate pattern
- No caching for AI generation endpoint (always fresh)

**Server-Side Caching** (future optimization):
- Cache user profiles with short TTL (5 minutes)
- No caching for recipe mutations

### Rate Limiting

**Implementation Options**:
1. Supabase Edge Functions with built-in rate limiting
2. API Gateway (e.g., Kong, API Gateway on DigitalOcean)
3. Custom middleware with Redis for distributed rate limiting

**Limits**:
- AI generation: 10 requests/hour per user
- Other endpoints: 100 requests/minute per user
- Adjust based on infrastructure capacity and cost constraints

---

## 8. Security Considerations

### Input Sanitization

**JSON Input**:
- Validate all JSON against expected schemas
- Reject malformed JSON with `400 Bad Request`
- Limit JSON depth and size

**Text Input**:
- Sanitize all text inputs to prevent XSS
- Trim whitespace
- Normalize Unicode characters

### SQL Injection Prevention

- All database queries use parameterized queries via Supabase client
- Never concatenate user input into SQL strings
- RLS policies provide additional protection

### Authentication Token Security

- JWT tokens transmitted only via HTTPS
- Tokens stored securely in httpOnly cookies (recommended) or secure localStorage
- Short expiration time (1 hour) with refresh token rotation
- Invalidate tokens on logout

### Rate Limiting and DDoS Protection

- Implement rate limiting on all endpoints
- Special protection for expensive operations (AI generation)
- Consider CDN/WAF for additional DDoS protection (e.g., Cloudflare)

### Data Privacy

- User data isolated via RLS policies
- No cross-user data access
- Events table accessible only to service_role for analytics
- Consider GDPR compliance for data export/deletion

---

## 9. API Documentation and Testing

### OpenAPI/Swagger Documentation

- Generate OpenAPI 3.0 specification from this plan
- Host interactive documentation (e.g., Swagger UI) for developer access
- Include request/response examples for all endpoints

### Testing Strategy

**Unit Tests**:
- Validate all business logic functions
- Test schema validation
- Test "Avoid" ingredient blocking logic

**Integration Tests**:
- Test all API endpoints with authentication
- Test RLS policies enforcement
- Test rate limiting behavior

**End-to-End Tests**:
- Test complete user flows (registration → profile → generation → save → search)
- Test error scenarios (AI failures, validation errors)

---

## 10. Monitoring and Observability

### Metrics to Track

**Performance Metrics**:
- API response times (p50, p95, p99)
- AI generation latency
- Database query performance

**Business Metrics**:
- Daily/weekly active users (from `session_start` events)
- Recipe generation rate
- Recipe save rate
- Profile completion rate (KPI-1)
- Generation activity rate (KPI-2)

**Error Metrics**:
- Error rates by endpoint and status code
- AI generation failure rate
- Validation error frequency

### Logging

**Structured Logging**:
- Log all API requests with: timestamp, user_id, endpoint, method, status_code, duration
- Log all errors with: error_type, stack_trace, request_id
- Log AI interactions: prompt, response status, retry count

**Log Levels**:
- ERROR: AI failures, unexpected errors, authorization violations
- WARN: Rate limit hits, validation failures
- INFO: Successful operations, user events
- DEBUG: Detailed request/response data (non-production)

---

## 11. Deployment and Infrastructure

### Hosting Architecture

**Frontend (Astro + React)**:
- Deployed as static site with API routes
- Hosting: DigitalOcean App Platform or Docker container
- CDN: DigitalOcean Spaces or Cloudflare

**Backend (Supabase)**:
- Managed Supabase instance (cloud or self-hosted)
- PostgreSQL database with RLS
- Supabase Auth for authentication
- Supabase Realtime (optional for future features)

**AI Service**:
- Option 1: Google AI Studio API (Gemini) with free tier
- Option 2: OpenRouter.ai for multi-model access

### Environment Configuration

**Environment Variables**:
```
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx (server-only)

# AI Service
AI_PROVIDER=gemini | openrouter
GOOGLE_AI_STUDIO_KEY=xxx (if using Gemini)
OPENROUTER_API_KEY=xxx (if using OpenRouter)

# Application
NODE_ENV=production | development
API_BASE_URL=https://api.savorai.com
RATE_LIMIT_ENABLED=true
```

### CI/CD Pipeline

**GitHub Actions Workflow**:
1. Run linting and type checking
2. Run unit and integration tests
3. Build Docker image
4. Push to DigitalOcean Container Registry
5. Deploy to DigitalOcean App Platform
6. Run smoke tests against deployed instance

---

## 12. Future Enhancements (Post-MVP)

The following features are out of scope for MVP but documented for future roadmap:

1. **Interactive Chat**: Multi-turn conversation for recipe refinement
2. **Recipe Editing**: Allow users to modify saved recipes
3. **Recipe Sharing**: Public/shared recipe collections
4. **Multimedia**: Image upload and storage
5. **Import**: Recipe import from URLs and files
6. **Auto-tagging**: AI-powered tag suggestions
7. **Allergen Validation**: Comprehensive allergen database integration
8. **Batch Generation**: Generate multiple recipe variations
9. **Meal Planning**: Weekly meal plan generation
10. **Social Features**: Comments, ratings, favorites

---

## Appendix A: Recipe JSON Schema (schema_v1)

```typescript
interface Recipe {
  title: string;
  summary?: string;
  description?: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  cuisine?: string;
  ingredients: string[];
  instructions: string[];
  tags?: string[];
  dietary_info?: {
    vegetarian?: boolean;
    vegan?: boolean;
    gluten_free?: boolean;
    dairy_free?: boolean;
    nut_free?: boolean;
    [key: string]: boolean | undefined;
  };
  nutrition?: {
    calories?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
    [key: string]: number | undefined;
  };
}
```

**Validation Rules**:
- `title`: Required, non-empty string, max 200 characters
- `ingredients`: Required array, min 1 item, max 50 items
- `instructions`: Required array, min 1 item, max 30 items
- `prep_time_minutes`, `cook_time_minutes`: Positive integers
- `servings`: Positive integer, typically 1-20
- `difficulty`: Enum value only
- Total JSON size: < 200KB
