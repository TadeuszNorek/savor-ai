# E2E Tests - Atomic Tasks

**One spec file = One task = One commit**

> ⚠️ **UWAGA:** Testy E2E implementujemy **PO** zakończeniu testów jednostkowych.
>
> Najpierw: UNIT_TESTS_TASKS.md → Potem: E2E_TESTS_TASKS.md (ten dokument)

---

## 📊 Progress Overview

```
Total Tasks:     12 plików .spec.ts
Completed:       1/12 (8%)
In Progress:     0/12
Remaining:       11/12
```

**Current Phase:** Setup (nie rozpoczęte)
**Framework:** Playwright (Chromium only)
**Pattern:** Page Object Model

---

## 🔧 SETUP PHASE: Przygotowanie (Przed testami)

**Estimated time:** 1 dzień

### ✅ Completed (0/4)

*No setup tasks completed*

### 🚧 In Progress (0/4)

*No setup tasks in progress*

### ⏭️ To Do (4/4)

- [ ] **SETUP-1:** `e2e/pages/base.page.ts`
  - **Purpose:** Base Page Object Model class
  - **Priority:** KRYTYCZNY
  - **Features:**
    - Common navigation methods
    - Wait helpers
    - Error handling
    - Screenshot utilities
  - **Commit:** `test(e2e): add base Page Object Model`

- [ ] **SETUP-2:** `e2e/helpers/auth.helpers.ts`
  - **Purpose:** Authentication utilities
  - **Priority:** KRYTYCZNY
  - **Features:**
    - `loginAsUser(page, credentials)`
    - `createTestUser()`
    - `logoutUser(page)`
    - `getAuthToken()`
  - **Commit:** `test(e2e): add auth helper utilities`

- [ ] **SETUP-3:** `e2e/helpers/cleanup.helpers.ts`
  - **Purpose:** Data cleanup utilities
  - **Priority:** WYSOKI
  - **Features:**
    - `deleteTestRecipes(userId)`
    - `deleteTestUser(userId)`
    - `resetTestData()`
  - **Commit:** `test(e2e): add cleanup helper utilities`

- [ ] **SETUP-4:** `e2e/fixtures/test-users.ts`
  - **Purpose:** Test user credentials
  - **Priority:** WYSOKI
  - **Features:**
    - Test user accounts
    - User roles/states
    - Credential management
  - **Commit:** `test(e2e): add test user fixtures`

---

## 🎯 JOURNEY 1: Authentication (KRYTYCZNY)

**Estimated tests:** 30 | **Estimated time:** 2-3 dni

### ✅ Completed (0/3)

*No auth tests completed*

### ⏭️ To Do (3/3)

- [ ] **E2E-1:** `e2e/specs/auth/login.spec.ts`
  - **Feature:** Login & Logout flow
  - **Estimated tests:** 10-12
  - **Priority:** KRYTYCZNY
  - **Prerequisites:** SETUP-1, SETUP-2, SETUP-4
  - **Page Objects:**
    - `LoginPage` ✅ (already exists)
    - `AppPage` (need to create)
  - **Test Cases:**
    - Login with valid credentials
    - Login with invalid email
    - Login with invalid password
    - Login with non-existent account
    - Email field validation
    - Password show/hide toggle
    - Session persistence after refresh
    - Logout functionality
    - Redirect to login after logout
    - Forgot password link visible
    - Loading state during submission
    - Form disabled during submission
  - **Commit:** `test(e2e): add login and logout tests (12 tests)`

- [ ] **E2E-2:** `e2e/specs/auth/signup.spec.ts`
  - **Feature:** Sign up flow
  - **Estimated tests:** 8-10
  - **Priority:** KRYTYCZNY
  - **Prerequisites:** SETUP-1, SETUP-2, SETUP-3
  - **Page Objects:**
    - `SignupPage` (need to create)
    - `AppPage`
  - **Test Cases:**
    - Sign up with valid data
    - Invalid email format error
    - Weak password error (<8 chars)
    - Existing email error
    - Email uniqueness validation
    - Redirect to app after signup
    - Session created after signup
    - Loading state during submission
    - Form disabled during submission
    - Switch to login form
  - **Commit:** `test(e2e): add signup flow tests (10 tests)`

- [ ] **E2E-3:** `e2e/specs/auth/password-reset.spec.ts`
  - **Feature:** Password reset flow
  - **Estimated tests:** 6-8
  - **Priority:** WYSOKI
  - **Prerequisites:** SETUP-1, SETUP-2
  - **Page Objects:**
    - `ForgotPasswordPage` (need to create)
    - `ResetPasswordPage` (need to create)
  - **Test Cases:**
    - Request password reset
    - Success message after request
    - Invalid email error
    - Reset password with valid token
    - Expired token error
    - Login after successful reset
    - Cancel reset and return to login
    - Password strength validation
  - **Commit:** `test(e2e): add password reset flow tests (8 tests)`

---

## 🎯 JOURNEY 2: Recipe Generation (KRYTYCZNY)

**Estimated tests:** 12 | **Estimated time:** 1-2 dni

### ⏭️ To Do (1/1)

- [ ] **E2E-4:** `e2e/specs/recipes/recipe-generation.spec.ts`
  - **Feature:** AI-powered recipe generation
  - **Estimated tests:** 10-12
  - **Priority:** KRYTYCZNY
  - **Prerequisites:** E2E-1 (auth), User with profile
  - **Page Objects:**
    - `AppPage` (GeneratorPanel)
    - `RecipePreviewPage` (need to create)
  - **Test Cases:**
    - Generate recipe with basic input
    - Generate with all preferences
    - Generated recipe displays correctly
    - Generate button loading state
    - Generate button disabled while loading
    - Regenerate recipe
    - Generation error handling
    - Cancel generation (if applicable)
    - All required fields present
    - Respect diet preferences
    - Respect cuisine preferences
    - Respect user allergies
  - **Commit:** `test(e2e): add recipe generation tests (12 tests)`

---

## 🎯 JOURNEY 3: Recipe CRUD (WYSOKI)

**Estimated tests:** 28 | **Estimated time:** 3-4 dni

### ⏭️ To Do (3/3)

- [ ] **E2E-5:** `e2e/specs/recipes/save-recipe.spec.ts`
  - **Feature:** Save generated recipe
  - **Estimated tests:** 6-8
  - **Priority:** KRYTYCZNY
  - **Prerequisites:** E2E-4 (generation)
  - **Page Objects:**
    - `AppPage`
    - `RecipeListPage` (need to create)
  - **Test Cases:**
    - Save generated recipe
    - Save button loading state
    - Saved recipe in list
    - Success message after save
    - Save error handling
    - Prevent duplicate save
    - Saved recipe has correct data
    - Redirect/update after save
  - **Commit:** `test(e2e): add save recipe tests (8 tests)`

- [ ] **E2E-6:** `e2e/specs/recipes/recipe-list.spec.ts`
  - **Feature:** View recipe list and details
  - **Estimated tests:** 10-12
  - **Priority:** WYSOKI
  - **Prerequisites:** E2E-5 (save)
  - **Page Objects:**
    - `RecipeListPage`
    - `RecipeDetailPage` (need to create)
  - **Test Cases:**
    - View list of saved recipes
    - Recipe cards display correctly
    - Click recipe to view details
    - Recipe detail shows all data
    - Navigate back to list
    - Empty state when no recipes
    - Loading skeleton while loading
    - Correct default sorting
    - Recipe tags display
    - Pagination controls display
    - Load more recipes
    - Recipe count displays
  - **Commit:** `test(e2e): add recipe list and view tests (12 tests)`

- [ ] **E2E-7:** `e2e/specs/recipes/delete-recipe.spec.ts`
  - **Feature:** Delete recipe
  - **Estimated tests:** 6-8
  - **Priority:** WYSOKI
  - **Prerequisites:** E2E-5 (save)
  - **Page Objects:**
    - `RecipeListPage`
    - Confirmation dialog
  - **Test Cases:**
    - Delete recipe from list
    - Confirmation dialog shows
    - Cancel delete action
    - Confirm delete action
    - Recipe removed from list
    - Success message after delete
    - Delete button loading state
    - Delete error handling
  - **Commit:** `test(e2e): add delete recipe tests (8 tests)`

---

## 🎯 JOURNEY 4: Search & Filter (WYSOKI/ŚREDNI)

**Estimated tests:** 28 | **Estimated time:** 3-4 dni

### ⏭️ To Do (3/3)

- [ ] **E2E-8:** `e2e/specs/search/search.spec.ts`
  - **Feature:** Search recipes
  - **Estimated tests:** 8-10
  - **Priority:** WYSOKI
  - **Prerequisites:** E2E-5 (saved recipes)
  - **Page Objects:**
    - `AppPage` (SearchBar)
    - `RecipeListPage`
  - **Test Cases:**
    - Search recipes by name
    - Real-time search results
    - Case-insensitive search
    - Clear search
    - Empty search shows all
    - No results empty state
    - Search persists in URL
    - Back/forward navigation
    - Search with pagination
    - Clear button in search input
  - **Commit:** `test(e2e): add recipe search tests (10 tests)`

- [ ] **E2E-9:** `e2e/specs/search/filter.spec.ts`
  - **Feature:** Filter recipes by tags
  - **Estimated tests:** 8-10
  - **Priority:** ŚREDNI
  - **Prerequisites:** E2E-5 (saved recipes)
  - **Page Objects:**
    - `AppPage` (TagFilterChips)
    - `RecipeListPage`
  - **Test Cases:**
    - Filter by cuisine tags
    - Filter by multiple tags
    - Filtered results display
    - Remove filter tag
    - Clear all filters
    - Filters persist in URL
    - Filters with search
    - Filters with sorting
    - No results empty state
    - Filter chips display
  - **Commit:** `test(e2e): add recipe filter tests (10 tests)`

- [ ] **E2E-10:** `e2e/specs/search/sort.spec.ts`
  - **Feature:** Sort recipes
  - **Estimated tests:** 6-8
  - **Priority:** ŚREDNI
  - **Prerequisites:** E2E-5 (saved recipes)
  - **Page Objects:**
    - `AppPage` (SortSelect)
    - `RecipeListPage`
  - **Test Cases:**
    - Sort by newest
    - Sort by oldest
    - Sort by name A-Z
    - Sort by name Z-A
    - Sort persists in URL
    - Sort with search
    - Sort with filters
    - Default sort is newest
  - **Commit:** `test(e2e): add recipe sort tests (8 tests)`

---

## 🎯 JOURNEY 5: Profile Management (WYSOKI)

**Estimated tests:** 15 | **Estimated time:** 2 dni

### ⏭️ To Do (1/1)

- [ ] **E2E-11:** `e2e/specs/profile/profile-management.spec.ts`
  - **Feature:** Create and update user profile
  - **Estimated tests:** 12-15
  - **Priority:** WYSOKI
  - **Prerequisites:** E2E-1 (auth)
  - **Page Objects:**
    - `ProfilePage` (need to create)
    - `ProfileFormPage`
  - **Test Cases:**
    - Create new profile
    - Select diet type
    - Add disliked ingredients
    - Add preferred cuisines
    - Remove ingredients/cuisines
    - Save profile
    - Success message after save
    - Profile persists after refresh
    - Update existing profile
    - Clear diet type
    - At least one field required
    - Loading state during save
    - Form disabled during save
    - Save error handling
    - Navigate away without saving
  - **Commit:** `test(e2e): add profile management tests (15 tests)`

---

## 🎯 JOURNEY 6: Navigation & UI (ŚREDNI)

**Estimated tests:** 10 | **Estimated time:** 1 dzień

### ✅ Completed (1/2)

- [x] **E2E-12:** `e2e/example.spec.ts` ✅
  - **Feature:** Basic smoke tests
  - **Tests:** 5
  - **Status:** Already completed

### ⏭️ To Do (1/2)

- [ ] **E2E-13:** `e2e/specs/navigation.spec.ts`
  - **Feature:** Navigation and UI elements
  - **Estimated tests:** 8-10
  - **Priority:** ŚREDNI
  - **Prerequisites:** E2E-1 (auth)
  - **Page Objects:**
    - `HeaderPage` (need to create)
    - `UserMenuPage` (need to create)
  - **Test Cases:**
    - Navigate to Profile page
    - Navigate to App page
    - Access User Menu
    - User Menu shows email
    - Header visible on all pages
    - Dark mode toggle works
    - Dark mode persists
    - Mobile menu works
    - Logout from User Menu
    - Logo navigates to home
  - **Commit:** `test(e2e): add navigation and UI tests (10 tests)`

---

## 📋 Page Object Models Checklist

### ✅ Completed (1/10)
- [x] `e2e/pages/login.page.ts` ✅

### ⏭️ To Create (9/10)

**Priority 1 - KRYTYCZNY:**
- [ ] `e2e/pages/base.page.ts` - Base POM class
- [ ] `e2e/pages/app.page.ts` - Main app page
- [ ] `e2e/pages/signup.page.ts` - Signup form

**Priority 2 - WYSOKI:**
- [ ] `e2e/pages/recipe-detail.page.ts` - Recipe details
- [ ] `e2e/pages/profile.page.ts` - Profile management
- [ ] `e2e/pages/forgot-password.page.ts` - Password reset request
- [ ] `e2e/pages/reset-password.page.ts` - Password reset form

**Priority 3 - ŚREDNI:**
- [ ] `e2e/pages/components/header.page.ts` - Header component
- [ ] `e2e/pages/components/user-menu.page.ts` - User menu

---

## 🔧 Helpers & Fixtures Checklist

### ✅ Completed (1/5)
- [x] `e2e/fixtures/test-data.ts` ✅

### ⏭️ To Create (4/5)

- [ ] `e2e/helpers/auth.helpers.ts` - Auth utilities
- [ ] `e2e/helpers/cleanup.helpers.ts` - Data cleanup
- [ ] `e2e/helpers/recipe.helpers.ts` - Recipe utilities
- [ ] `e2e/fixtures/test-users.ts` - User credentials

---

## 📊 Summary by Priority

### KRYTYCZNY (Must Have)
```
SETUP-1, SETUP-2                      (setup)
E2E-1:  login.spec.ts                 (12 tests)
E2E-2:  signup.spec.ts                (10 tests)
E2E-4:  recipe-generation.spec.ts     (12 tests)
E2E-5:  save-recipe.spec.ts           (8 tests)
───────────────────────────────────────────────
Total:                                42 tests
Estimated time:                       4-5 dni
```

### WYSOKI (Should Have)
```
SETUP-3, SETUP-4                      (setup)
E2E-3:  password-reset.spec.ts        (8 tests)
E2E-6:  recipe-list.spec.ts           (12 tests)
E2E-7:  delete-recipe.spec.ts         (8 tests)
E2E-8:  search.spec.ts                (10 tests)
E2E-11: profile-management.spec.ts    (15 tests)
───────────────────────────────────────────────
Total:                                53 tests
Estimated time:                       5-6 dni
```

### ŚREDNI (Nice to Have)
```
E2E-9:  filter.spec.ts                (10 tests)
E2E-10: sort.spec.ts                  (8 tests)
E2E-13: navigation.spec.ts            (10 tests)
───────────────────────────────────────────────
Total:                                28 tests
Estimated time:                       2-3 dni
```

---

## 📊 Total E2E Coverage

```
═══════════════════════════════════════════════════════
                    E2E TESTS SUMMARY
═══════════════════════════════════════════════════════

Total Files:         13 spec files (+ 1 already done)
Total Tests:         ~128 tests (+ 5 already done)
Total Time:          1.5-2 weeks
Page Objects:        10 files
Helpers/Fixtures:    5 files
Coverage:            All critical user journeys ✅

───────────────────────────────────────────────────────
Current Progress:    1/13 files (8%)
Current Tests:       5/128 tests (4%)
Status:              ⏭️ Start after Unit Tests
═══════════════════════════════════════════════════════
```

---

## 🚀 Implementation Order

### **Phase 1: Setup** (1 dzień)
```
□ SETUP-1: base.page.ts
□ SETUP-2: auth.helpers.ts
□ SETUP-3: cleanup.helpers.ts
□ SETUP-4: test-users.ts
```

### **Phase 2: Auth** (2-3 dni)
```
□ E2E-1: login.spec.ts
□ E2E-2: signup.spec.ts
□ E2E-3: password-reset.spec.ts
```

### **Phase 3: Core Features** (4-5 dni)
```
□ E2E-4: recipe-generation.spec.ts
□ E2E-5: save-recipe.spec.ts
□ E2E-6: recipe-list.spec.ts
□ E2E-7: delete-recipe.spec.ts
```

### **Phase 4: Search & Profile** (3-4 dni)
```
□ E2E-8: search.spec.ts
□ E2E-11: profile-management.spec.ts
□ E2E-9: filter.spec.ts (optional)
```

### **Phase 5: Polish** (1-2 dni)
```
□ E2E-10: sort.spec.ts
□ E2E-13: navigation.spec.ts
```

---

## 🔄 Workflow dla każdego E2E taska

```bash
# 1. Sprawdź prerequisites (czy poprzednie testy done)
# 2. Stwórz potrzebne Page Objects
# 3. Stwórz plik .spec.ts
# 4. Napisz wszystkie test cases
# 5. Uruchom: npm run test:e2e
# 6. Debuguj: npm run test:e2e:debug
# 7. Commit z zaproponowanym message
# 8. Aktualizuj Progress Overview
# 9. Przejdź do następnego taska
```

---

## 📝 Commit Convention

```bash
# Setup
test(e2e): add [setup-component]

# Specs
test(e2e): add [feature] tests ([n] tests)

# Page Objects
test(e2e): add [PageName] page object model

# Examples:
test(e2e): add base Page Object Model
test(e2e): add auth helper utilities
test(e2e): add login and logout tests (12 tests)
test(e2e): add AppPage page object model
```

---

## ⚠️ Important Notes

1. **Test Isolation**
   - Each test is independent
   - Use cleanup helpers after tests
   - Don't rely on test execution order

2. **Authentication**
   - Use `auth.helpers.ts` for login
   - Store session state where possible
   - Cleanup sessions after tests

3. **Data Management**
   - Use unique identifiers for test data
   - Cleanup test data after tests
   - Use fixtures for consistent data

4. **Flaky Tests Prevention**
   - Use Playwright auto-wait
   - Avoid hard timeouts
   - Use proper locators (getByRole, getByLabel)

---

## 🔗 Related Documents

- `UNIT_TESTS_TASKS.md` - Unit test tasks (DO THIS FIRST) ⚠️
- `TESTING_STRATEGY.md` - Overall testing strategy
- `tests/CHECKLIST.md` - Detailed checklist
- `TESTING.md` - Quick start guide
- `tests/README.md` - Testing documentation
- `playwright.config.ts` - Playwright configuration

---

**⚠️ REMEMBER: Complete UNIT_TESTS_TASKS.md first!**

**Next E2E Task:** SETUP-1 (base.page.ts)

*Last updated: 2025-10-25*
