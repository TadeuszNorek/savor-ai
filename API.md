# SavorAI API Documentation

## Overview

SavorAI provides a RESTful API for managing recipes, user profiles, and application events. All endpoints require authentication via Supabase JWT tokens (except auth endpoints).

**Base URL:** `http://localhost:4321/api` (development)

**Authentication:** Bearer token in `Authorization` header
```
Authorization: Bearer {supabase_jwt_token}
```

## Table of Contents

- [Events](#events)
  - [POST /api/events](#post-apievents) - Log application event
- [Recipes](#recipes)
  - [POST /api/recipes/generate](#post-apirecipesgenerate) - Generate recipe with AI
  - [POST /api/recipes](#post-apirecipes) - Save recipe to collection
  - [GET /api/recipes](#get-apirecipes) - List saved recipes
  - [GET /api/recipes/:id](#get-apirecipesid) - Get recipe details
  - [DELETE /api/recipes/:id](#delete-apirecipesid) - Delete recipe
- [Profile](#profile)
  - [POST /api/profile](#post-apiprofile) - Create user profile
  - [GET /api/profile](#get-apiprofile) - Get user profile
  - [PUT /api/profile](#put-apiprofile) - Update user profile

---

## Events

### POST /api/events

Log an application event for analytics purposes.

**Primary use case:** Client-side logging of `session_start` events. Other event types (`ai_prompt_sent`, `ai_recipe_generated`, `recipe_saved`, `profile_edited`) are typically logged automatically by server-side endpoints.

#### Request

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "type": "session_start",
  "payload": {
    "user_agent": "Mozilla/5.0...",
    "platform": "web"
  }
}
```

**Fields:**
- `type` (required): Event type enum
  - `session_start` - User starts new session
  - `profile_edited` - User updates profile
  - `ai_prompt_sent` - AI recipe generation requested
  - `ai_recipe_generated` - AI recipe successfully generated
  - `recipe_saved` - Recipe saved to collection
- `payload` (optional): Additional event data (max 8 KB when serialized)

#### Response

**Success (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "type": "session_start",
  "payload": {
    "user_agent": "Mozilla/5.0...",
    "platform": "web"
  },
  "occurred_at": "2025-01-16T10:00:00.000Z"
}
```

**Error (400 Bad Request):**
```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "type": "Invalid enum value. Expected 'session_start' | 'profile_edited' | ...",
    "payload": "Payload size must not exceed 8192 bytes when serialized"
  },
  "request_id": "req_abc123"
}
```

**Error (401 Unauthorized):**
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid authorization header",
  "request_id": "req_abc123"
}
```

#### Example

```bash
curl -X POST http://localhost:4321/api/events \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "type": "session_start",
    "payload": {
      "platform": "web",
      "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    }
  }'
```

---

## Recipes

### POST /api/recipes/generate

Generate a recipe using AI based on user prompt and profile preferences.

**Rate Limit:** 10 generations per hour per user

#### Request

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "prompt": "Make me a quick pasta dish for dinner"
}
```

**Fields:**
- `prompt` (required): User's recipe request (string, max 2000 characters)

#### Response

**Success (200 OK):**
```json
{
  "recipe": {
    "title": "Quick Garlic Pasta",
    "summary": "A simple 15-minute pasta dish with garlic and olive oil",
    "prep_time_minutes": 5,
    "cook_time_minutes": 10,
    "servings": 2,
    "difficulty": "easy",
    "cuisine": "Italian",
    "ingredients": [
      "200g spaghetti",
      "4 cloves garlic, minced",
      "3 tbsp olive oil",
      "Salt and pepper to taste"
    ],
    "instructions": [
      "Boil pasta according to package directions",
      "Heat olive oil and sauté garlic until fragrant",
      "Toss cooked pasta with garlic oil",
      "Season with salt and pepper"
    ],
    "tags": ["quick", "easy", "italian", "vegetarian"],
    "dietary_info": {
      "vegetarian": true,
      "vegan": true,
      "gluten_free": false
    }
  },
  "generation_id": "gen_abc123",
  "generated_at": "2025-01-16T10:00:00.000Z"
}
```

**Error (429 Too Many Requests):**
```json
{
  "error": "Too Many Requests",
  "message": "Generation limit exceeded. Please try again later.",
  "details": {
    "retry_after": 3600
  },
  "request_id": "req_abc123"
}
```

**Error (413 Payload Too Large):**
```json
{
  "error": "Payload Too Large",
  "message": "Generated recipe is too large. Please try a simpler prompt.",
  "request_id": "req_abc123"
}
```

**Error (503 Service Unavailable):**
```json
{
  "error": "Service Unavailable",
  "message": "AI service timed out. Please try again.",
  "request_id": "req_abc123"
}
```

#### Example

```bash
curl -X POST http://localhost:4321/api/recipes/generate \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Make me a vegan dessert with chocolate"
  }'
```

---

### POST /api/recipes

Save a recipe to user's collection. Validates recipe structure, checks size limit (~200 KB), normalizes tags, and verifies against disliked ingredients.

**Note:** This endpoint is typically used after generating a recipe with `/api/recipes/generate`, but can also be used to manually save recipes from other sources.

#### Request

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "recipe": {
    "title": "Quick Garlic Pasta",
    "summary": "A simple 15-minute pasta dish with garlic and olive oil",
    "prep_time_minutes": 5,
    "cook_time_minutes": 10,
    "servings": 2,
    "difficulty": "easy",
    "cuisine": "Italian",
    "ingredients": [
      "200g spaghetti",
      "4 cloves garlic, minced",
      "3 tbsp olive oil",
      "Salt and pepper to taste"
    ],
    "instructions": [
      "Boil pasta according to package directions",
      "Heat olive oil and sauté garlic until fragrant",
      "Toss cooked pasta with garlic oil",
      "Season with salt and pepper"
    ],
    "tags": ["quick", "easy", "italian"],
    "dietary_info": {
      "vegetarian": true,
      "vegan": true,
      "gluten_free": false
    },
    "nutrition": {
      "calories": 350,
      "protein_g": 12,
      "carbs_g": 45,
      "fat_g": 15
    }
  },
  "tags": ["Quick", "EASY", "pasta", "italian", "italian"]
}
```

**Fields:**
- `recipe` (required): Complete recipe object following RecipeSchema
  - `title` (required): Recipe name (1-200 characters)
  - `summary` (optional): Brief description (max 500 characters)
  - `description` (optional): Detailed description (max 2000 characters)
  - `prep_time_minutes` (required): Preparation time (0-1440)
  - `cook_time_minutes` (required): Cooking time (0-1440)
  - `servings` (required): Number of servings (1-100)
  - `difficulty` (required): "easy" | "medium" | "hard"
  - `cuisine` (optional): Cuisine type (max 50 characters)
  - `ingredients` (required): Array of ingredients (1-100 items, each 1-500 chars)
  - `instructions` (required): Array of steps (1-50 items, each 1-2000 chars)
  - `tags` (optional): Array of tags (max 20, each 1-50 chars)
  - `dietary_info` (optional): Dietary flags (vegetarian, vegan, gluten_free, etc.)
  - `nutrition` (optional): Nutritional information (calories, protein_g, carbs_g, fat_g)
- `tags` (optional): Additional tags (max 20, normalized to lowercase, deduplicated)

**Validation:**
- Recipe size must not exceed 200 KB (204800 bytes) when serialized
- Tags are normalized: trimmed, converted to lowercase, deduplicated
- Recipe must not contain ingredients from user's disliked ingredients list

#### Response

**Success (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Quick Garlic Pasta",
  "summary": "A simple 15-minute pasta dish with garlic and olive oil",
  "tags": ["easy", "italian", "pasta", "quick"],
  "created_at": "2025-01-16T10:00:00.000Z",
  "updated_at": "2025-01-16T10:00:00.000Z"
}
```

**Headers:**
- `Location: /api/recipes/{id}` - URL to fetch full recipe details
- `X-Request-ID: {request_id}` - Unique request identifier

**Error (400 Bad Request - Validation):**
```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "recipe.title": "Required",
    "recipe.ingredients": "Array must contain at least 1 element(s)",
    "tags.0": "Tag too long (max 50 characters)"
  },
  "request_id": "req_abc123"
}
```

**Error (400 Bad Request - Disliked Ingredients):**
```json
{
  "error": "Bad Request",
  "message": "Recipe contains disliked ingredients",
  "details": {
    "message": "Recipe contains disliked ingredients: peanuts, shellfish"
  },
  "request_id": "req_abc123"
}
```

**Error (401 Unauthorized):**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token",
  "request_id": "req_abc123"
}
```

**Error (413 Payload Too Large):**
```json
{
  "error": "Payload Too Large",
  "message": "Recipe exceeds maximum size limit",
  "details": {
    "max_size_bytes": 204800
  },
  "request_id": "req_abc123"
}
```

**Error (500 Internal Server Error):**
```json
{
  "error": "Internal Server Error",
  "message": "Failed to save recipe",
  "request_id": "req_abc123"
}
```

#### Example

```bash
# Save a complete recipe
curl -X POST http://localhost:4321/api/recipes \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "recipe": {
      "title": "Quick Garlic Pasta",
      "summary": "A simple 15-minute pasta dish",
      "prep_time_minutes": 5,
      "cook_time_minutes": 10,
      "servings": 2,
      "difficulty": "easy",
      "cuisine": "Italian",
      "ingredients": [
        "200g spaghetti",
        "4 cloves garlic, minced",
        "3 tbsp olive oil",
        "Salt and pepper to taste"
      ],
      "instructions": [
        "Boil pasta according to package directions",
        "Heat olive oil and sauté garlic until fragrant",
        "Toss cooked pasta with garlic oil",
        "Season with salt and pepper"
      ],
      "dietary_info": {
        "vegetarian": true,
        "vegan": true
      }
    },
    "tags": ["Quick", "EASY", "pasta"]
  }'

# Response includes Location header:
# Location: /api/recipes/550e8400-e29b-41d4-a716-446655440000
```

**Notes:**
- Tags in the request body are normalized (e.g., ["Quick", "EASY", "pasta"] → ["easy", "pasta", "quick"])
- Duplicate tags are automatically removed
- The endpoint logs a `recipe_saved` event for analytics (best-effort, non-blocking)
- Recipe validation includes checking against user's disliked ingredients from their profile

---

### GET /api/recipes

List user's saved recipes with search, filtering, and pagination.

#### Request

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `search` (optional): Full-text search query (searches title, summary, ingredients)
- `tags` (optional): Comma-separated tags for OR filtering (e.g., `quick,italian`)
- `sort` (optional): Sort order - `recent` (default) or `oldest`
- `limit` (optional): Results per page (1-100, default: 20)
- `cursor` (optional): Pagination cursor (base64 encoded)
- `offset` (optional): Offset pagination (alternative to cursor)

#### Response

**Success (200 OK):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Quick Garlic Pasta",
      "summary": "A simple 15-minute pasta dish",
      "tags": ["quick", "easy", "italian"],
      "created_at": "2025-01-16T10:00:00.000Z"
    }
  ],
  "pagination": {
    "limit": 20,
    "next_cursor": "eyJjcmVhdGVkX2F0IjoiMjAyNS0wMS0xNlQxMDowMDowMC4wMDBaIiwiaWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAifQ==",
    "has_more": true,
    "total_count": 42
  }
}
```

**Empty Result (200 OK):**
```json
{
  "data": [],
  "pagination": {
    "limit": 20,
    "next_cursor": null,
    "has_more": false,
    "total_count": 0
  },
  "message": "No recipes found. Start by generating your first recipe!"
}
```

#### Example

```bash
# Search for pasta recipes
curl -X GET "http://localhost:4321/api/recipes?search=pasta&limit=10" \
  -H "Authorization: Bearer eyJhbGc..."

# Filter by tags
curl -X GET "http://localhost:4321/api/recipes?tags=quick,easy&sort=recent" \
  -H "Authorization: Bearer eyJhbGc..."
```

---

### GET /api/recipes/:id

Get full recipe details by ID.

#### Request

**Headers:**
```
Authorization: Bearer {token}
```

**Parameters:**
- `id` (path): Recipe UUID

#### Response

**Success (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Quick Garlic Pasta",
  "summary": "A simple 15-minute pasta dish",
  "tags": ["quick", "easy", "italian"],
  "recipe": {
    "title": "Quick Garlic Pasta",
    "prep_time_minutes": 5,
    "cook_time_minutes": 10,
    "servings": 2,
    "difficulty": "easy",
    "ingredients": ["..."],
    "instructions": ["..."]
  },
  "created_at": "2025-01-16T10:00:00.000Z",
  "updated_at": "2025-01-16T10:00:00.000Z"
}
```

**Error (404 Not Found):**
```json
{
  "error": "Not Found",
  "message": "Recipe not found",
  "request_id": "req_abc123"
}
```

#### Example

```bash
curl -X GET http://localhost:4321/api/recipes/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer eyJhbGc..."
```

---

### DELETE /api/recipes/:id

Delete a recipe from user's collection (hard delete).

#### Request

**Headers:**
```
Authorization: Bearer {token}
```

**Parameters:**
- `id` (path): Recipe UUID

#### Response

**Success (204 No Content):**
```
(empty body)
```

**Error (404 Not Found):**
```json
{
  "error": "Not Found",
  "message": "Recipe not found",
  "request_id": "req_abc123"
}
```

#### Example

```bash
curl -X DELETE http://localhost:4321/api/recipes/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer eyJhbGc..."
```

---

## Profile

### POST /api/profile

Create initial dietary preferences profile for authenticated user.

**Note:** Each user can only have one profile (1:1 relationship). Use PUT to update existing profile.

#### Request

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "diet_type": "vegetarian",
  "disliked_ingredients": ["mushrooms", "olives"],
  "preferred_cuisines": ["italian", "mediterranean"]
}
```

**Fields (all optional):**
- `diet_type` (optional): One of: `vegan`, `vegetarian`, `pescatarian`, `keto`, `paleo`, `gluten_free`, `dairy_free`, `low_carb`, `mediterranean`, `omnivore`
- `disliked_ingredients` (optional): Array of ingredients to avoid (max 100 items, each 1-50 chars)
  - Automatically normalized: lowercase, trimmed, deduplicated
- `preferred_cuisines` (optional): Array of preferred cuisines (max 100 items, each 1-50 chars)
  - Automatically normalized: lowercase, trimmed, deduplicated

#### Response

**Success (201 Created):**
```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "diet_type": "vegetarian",
  "disliked_ingredients": ["mushrooms", "olives"],
  "preferred_cuisines": ["italian", "mediterranean"],
  "created_at": "2025-01-16T10:00:00.000Z",
  "updated_at": "2025-01-16T10:00:00.000Z"
}
```

**Error (409 Conflict):**
```json
{
  "error": "Conflict",
  "message": "Profile already exists; use PUT /api/profile to update",
  "request_id": "req_abc123"
}
```

**Error (400 Bad Request):**
```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "diet_type": "Invalid enum value",
    "disliked_ingredients.0": "Item cannot exceed 50 characters"
  },
  "request_id": "req_abc123"
}
```

#### Example

```bash
curl -X POST http://localhost:4321/api/profile \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "diet_type": "vegetarian",
    "disliked_ingredients": ["mushrooms", "olives"],
    "preferred_cuisines": ["italian", "mediterranean"]
  }'
```

**Notes:**
- Profile is used to personalize AI recipe generation
- Disliked ingredients are validated when saving recipes (via `insert_recipe_safe` RPC)
- Arrays are automatically normalized (e.g., ["Italian", "MEXICAN"] → ["italian", "mexican"])
- Logs `profile_edited` event with `action: "created"`

---

### GET /api/profile

Retrieve dietary preferences profile for authenticated user.

#### Request

**Headers:**
```
Authorization: Bearer {token}
```

#### Response

**Success (200 OK):**
```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "diet_type": "vegetarian",
  "disliked_ingredients": ["mushrooms", "olives"],
  "preferred_cuisines": ["italian", "mediterranean"],
  "created_at": "2025-01-16T10:00:00.000Z",
  "updated_at": "2025-01-16T10:00:00.000Z"
}
```

**Headers:**
- `Cache-Control: no-store` - Personalized content, no caching

**Error (404 Not Found):**
```json
{
  "error": "Not Found",
  "message": "Profile not found; use POST /api/profile to create",
  "request_id": "req_abc123"
}
```

#### Example

```bash
curl -X GET http://localhost:4321/api/profile \
  -H "Authorization: Bearer eyJhbGc..."
```

**Notes:**
- Returns 404 if profile doesn't exist (user must create it first with POST)
- No event logging for GET operations

---

### PUT /api/profile

Update dietary preferences profile for authenticated user.

#### Request

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "diet_type": "vegan",
  "disliked_ingredients": ["mushrooms", "olives", "eggs", "dairy"]
}
```

**Fields (at least one required):**
- `diet_type` (optional): Diet type enum, or `null` to clear the field
- `disliked_ingredients` (optional): Replaces entire array (not merged)
- `preferred_cuisines` (optional): Replaces entire array (not merged)

**Validation:**
- At least one field must be provided
- Arrays replace existing values entirely (not merged)
- Set `diet_type: null` to explicitly clear the value

#### Response

**Success (200 OK):**
```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "diet_type": "vegan",
  "disliked_ingredients": ["mushrooms", "olives", "eggs", "dairy"],
  "preferred_cuisines": ["italian", "mediterranean"],
  "created_at": "2025-01-16T10:00:00.000Z",
  "updated_at": "2025-01-16T10:30:00.000Z"
}
```

**Headers:**
- `Cache-Control: no-store` - Personalized content, no caching

**Error (400 Bad Request - No Fields):**
```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "_root": "At least one field must be provided for update"
  },
  "request_id": "req_abc123"
}
```

**Error (404 Not Found):**
```json
{
  "error": "Not Found",
  "message": "Profile not found; use POST /api/profile to create",
  "request_id": "req_abc123"
}
```

#### Example

```bash
# Update diet type and disliked ingredients
curl -X PUT http://localhost:4321/api/profile \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "diet_type": "vegan",
    "disliked_ingredients": ["mushrooms", "olives", "eggs", "dairy"]
  }'

# Clear diet type
curl -X PUT http://localhost:4321/api/profile \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{"diet_type": null}'
```

**Notes:**
- Partial updates supported (only send fields you want to change)
- Arrays are **replaced entirely**, not merged (e.g., updating `disliked_ingredients` replaces the whole array)
- `updated_at` timestamp is automatically updated
- Logs `profile_edited` event with `action: "updated"` and list of `changed_fields`

---

## Error Response Format

All error responses follow this standard format:

```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "details": {
    "field": "Validation error details"
  },
  "request_id": "req_abc123"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `204` - No Content (successful deletion)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `404` - Not Found
- `413` - Payload Too Large
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error
- `503` - Service Unavailable (AI service issues)

---

## Rate Limits

- **Recipe Generation:** 10 requests per hour per user
- **Other Endpoints:** No rate limits in MVP (may be added in future)

---

## Authentication

All API endpoints (except public health checks) require authentication via Supabase JWT tokens.

**Getting a Token:**
1. Register/Login via Supabase Auth endpoints
2. Use the returned `access_token` in all API requests

**Token Format:**
```
Authorization: Bearer {access_token}
```

**Token Expiry:**
Tokens expire after the configured period (default: 1 hour). Refresh tokens using Supabase client.

---

## Testing

For detailed testing examples and scenarios, see:
- [Events Testing Guide](.ai/endpoints/log-event-testing-guide.md)
- [Generate Recipe Testing Guide](.ai/endpoints/generate-recipe-testing-guide.md)
- [Save Recipe Testing Guide](.ai/endpoints/save-recipe-testing-guide.md)
- [List Recipes Testing Guide](.ai/endpoints/list-recipes-testing-guide.md)
- [Get Recipe Testing Guide](.ai/endpoints/get-recipe-testing-guide.md)
- [Delete Recipe Testing Guide](.ai/endpoints/delete-recipe-testing-guide.md)

---

## Changelog

### 2025-01-17
- ✅ Added `POST /api/profile` - Create user dietary profile
- ✅ Added `GET /api/profile` - Get user profile
- ✅ Added `PUT /api/profile` - Update user profile

### 2025-01-16
- ✅ Added `POST /api/events` - Event logging endpoint
- ✅ Added `POST /api/recipes/generate` - AI recipe generation
- ✅ Added `POST /api/recipes` - Save recipe to collection
- ✅ Added `GET /api/recipes` - List recipes with search/filter
- ✅ Added `GET /api/recipes/:id` - Get recipe details
- ✅ Added `DELETE /api/recipes/:id` - Delete recipe
