# Atomic Test Implementation Tasks

**One file = One task = One commit**

Użyj tego dokumentu do śledzenia postępów plik po pliku.
Każdy checkbox = jeden plik testowy do zaimplementowania.

---

## 📊 Progress Overview

```
Total Tasks:     52 plików testowych
Completed:       18/52 (35%)
In Progress:     0/52
Remaining:       34/52
```

**Current Milestone:** MILESTONE 2 - UI & Hooks (10/11 completed)

---

## ✅ Previous Tests (Completed Before Milestone 1)

- [x] `tests/unit/utils.test.ts` - 6 testów (cn() function)
- [x] `tests/unit/button.test.tsx` - 7 testów (Button component)

---

## 🎯 MILESTONE 1: Fundamenty (KRYTYCZNY) ✅ COMPLETE!

**Target:** 6 plików testowych (TASK 1-6) | ~120 testów | 2-3 dni
**Actual:** 6 plików | 167 testów | 100% coverage

### ✅ Completed (6/6) 🎉

- [x] **TASK 1:** `tests/unit/utils/cursor.test.ts`
  - **Tests:** 24
  - **Coverage:** 100% (encodeCursor, decodeCursor, isValidCursor)
  - **Commit:** ✅ Ready to commit
  - **Note:** Fixed bug in cursor.ts (split → lastIndexOf)

- [x] **TASK 2:** `tests/unit/auth/validation.test.ts`
  - **Tests:** 32
  - **Coverage:** 100% (validateEmail, validatePassword, validateAuthForm, hasErrors, normalizeEmail)
  - **Commit:** ✅ Ready to commit

- [x] **TASK 3:** `tests/unit/schemas/common.test.ts`
  - **Tests:** 10
  - **Coverage:** 100% (UuidSchema, validateUuid)
  - **Commit:** ✅ Ready to commit

- [x] **TASK 4:** `tests/unit/schemas/recipe.test.ts`
  - **Tests:** 38
  - **Coverage:** 100% (RecipeSchemaZ, GenerateRecipeCommandSchema, GenerateRecipeResponseSchema, SaveRecipeCommandSchema, normalizeTags)
  - **Commit:** ✅ Ready to commit

- [x] **TASK 5:** `tests/unit/schemas/profile.test.ts`
  - **Tests:** 21
  - **Coverage:** 100% (CreateProfileCommandSchema, UpdateProfileCommandSchema, diet types, string arrays)
  - **Commit:** ✅ Ready to commit

- [x] **TASK 6:** `tests/unit/mappers/profile.test.ts`
  - **Tests:** 35
  - **Coverage:** 100% (profileDtoToFormValues, emptyProfileFormValues, formValuesToCreateCommand, formValuesToUpdateCommand, normalizeStringArray, hasAtLeastOneField, isFormDirty)
  - **Commit:** ✅ Ready to commit

### 🚧 In Progress (0/6)

*No tasks in progress*

### ⏭️ To Do (0/6) ✅ ALL COMPLETE!

*All Milestone 1 tasks completed!*

---

## 🎯 MILESTONE 2: UI & Hooks (WYSOKI)

**Target:** 11 plików testowych | ~65 testów | 2-3 dni

### ✅ Completed (10/11)

- [x] **TASK 7:** `tests/unit/components/ui/input.test.tsx`
  - **Tests:** 9
  - **Coverage:** 100% (Input component with various types and attributes)
  - **Commit:** ✅ Ready to commit

- [x] **TASK 8:** `tests/unit/components/ui/label.test.tsx`
  - **Tests:** 5
  - **Coverage:** 100% (Label component with htmlFor and children)
  - **Commit:** ✅ Ready to commit

- [x] **TASK 9:** `tests/unit/components/ui/card.test.tsx`
  - **Tests:** 22
  - **Coverage:** 100% (All Card components: Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter)
  - **Commit:** ✅ Ready to commit

- [x] **TASK 10:** `tests/unit/components/ui/badge.test.tsx`
  - **Tests:** 12
  - **Coverage:** 100% (Badge component with variants: default, secondary, destructive, outline; asChild prop)
  - **Commit:** ✅ Ready to commit

- [x] **TASK 11:** `tests/unit/components/ui/select.test.tsx`
  - **Tests:** 9
  - **Coverage:** 90% (Select, SelectTrigger, SelectValue with sizes and disabled state)
  - **Commit:** ✅ Ready to commit

- [x] **TASK 12:** `tests/unit/components/ui/textarea.test.tsx`
  - **Tests:** 9
  - **Coverage:** 100% (Textarea component with value, onChange, disabled, rows, maxLength, aria-invalid)
  - **Commit:** ✅ Ready to commit

- [x] **TASK 13:** `tests/unit/components/ui/skeleton.test.tsx`
  - **Tests:** 5
  - **Coverage:** 100% (Skeleton component with div element, data-slot, className, aria attributes)
  - **Commit:** ✅ Ready to commit

- [x] **TASK 14:** `tests/unit/components/ui/tabs.test.tsx`
  - **Tests:** 14
  - **Coverage:** 100% (Tabs, TabsList, TabsTrigger, TabsContent with data-slot, className, disabled, composition)
  - **Commit:** ✅ Ready to commit

- [x] **TASK 15:** `tests/unit/components/ui/tooltip.test.tsx`
  - **Tests:** 6
  - **Coverage:** 95% (TooltipTrigger, TooltipContent with data-slot, className, composition)
  - **Commit:** ✅ Ready to commit
  - **Note:** Added ResizeObserver mock to setup.ts for Radix UI support

### ⏭️ UI Components (0/11 remaining) ✅ ALL UI COMPONENTS COMPLETE!

### ✅ Custom Hooks (1/2)

- [x] **TASK 16:** `tests/unit/hooks/useUrlFilters.test.ts`
  - **Tests:** 20
  - **Coverage:** 100% (parseFiltersFromUrl, filtersToSearchParams, useUrlFilters with initialization, setFilters, popstate)
  - **Commit:** ✅ Ready to commit

- [ ] **TASK 17:** `tests/unit/hooks/useScrollRestoration.test.ts`
  - **Source:** `src/lib/hooks/useScrollRestoration.ts`
  - **Estimated tests:** 8-10
  - **Coverage target:** 90%
  - **Commit message:** `test: add useScrollRestoration hook tests (9 tests)`

---

## 🎯 MILESTONE 3: Auth (KRYTYCZNY)

**Target:** 5 plików testowych | ~45 testów | 1-2 dni

### ⏭️ Auth Components (3/5)

- [ ] **TASK 18:** `tests/unit/components/auth/EmailInput.test.tsx`
  - **Source:** `src/components/auth/EmailInput.tsx`
  - **Estimated tests:** 8-10
  - **Coverage target:** 90%
  - **Commit message:** `test: add EmailInput component tests (9 tests)`

- [ ] **TASK 19:** `tests/unit/components/auth/PasswordInput.test.tsx`
  - **Source:** `src/components/auth/PasswordInput.tsx`
  - **Estimated tests:** 8-10
  - **Coverage target:** 90%
  - **Commit message:** `test: add PasswordInput component tests (9 tests)`

- [ ] **TASK 20:** `tests/unit/components/auth/AuthForm.test.tsx`
  - **Source:** `src/components/auth/AuthForm.tsx`
  - **Estimated tests:** 12-15
  - **Coverage target:** 85%
  - **Commit message:** `test: add AuthForm component tests (13 tests)`

### ⏭️ Auth Logic (2/5)

- [ ] **TASK 21:** `tests/unit/auth/api.test.ts`
  - **Source:** `src/lib/auth/api.ts`
  - **Estimated tests:** 10-12
  - **Coverage target:** 85%
  - **Commit message:** `test: add auth API tests (11 tests)`

- [ ] **TASK 22:** `tests/unit/auth/useAuth.test.ts`
  - **Source:** `src/lib/auth/useAuth.ts`
  - **Estimated tests:** 8-10
  - **Coverage target:** 85%
  - **Commit message:** `test: add useAuth hook tests (9 tests)`

---

## 🎯 MILESTONE 4: API & Components (ŚREDNI)

**Target:** 18 plików testowych | ~120 testów | 1-1.5 tygodnia

### ⏭️ API Clients (3/18)

- [ ] **TASK 23:** `tests/unit/api/http.test.ts`
  - **Source:** `src/lib/api/http.ts`
  - **Estimated tests:** 15-18
  - **Coverage target:** 85%
  - **Commit message:** `test: add HTTP client tests (16 tests)`

- [ ] **TASK 24:** `tests/unit/api/recipes.test.ts`
  - **Source:** `src/lib/api/recipes.ts`
  - **Estimated tests:** 15-18
  - **Coverage target:** 85%
  - **Commit message:** `test: add Recipes API tests (17 tests)`

- [ ] **TASK 25:** `tests/unit/api/profile.test.ts`
  - **Source:** `src/lib/api/profile.ts`
  - **Estimated tests:** 12-15
  - **Coverage target:** 85%
  - **Commit message:** `test: add Profile API tests (13 tests)`

### ⏭️ Recipe Components (6/18)

- [ ] **TASK 26:** `tests/unit/components/app/RecipeCard.test.tsx`
  - **Source:** `src/components/app/RecipeCard.tsx`
  - **Estimated tests:** 8-10
  - **Coverage target:** 80%
  - **Commit message:** `test: add RecipeCard component tests (9 tests)`

- [ ] **TASK 27:** `tests/unit/components/app/RecipeList.test.tsx`
  - **Source:** `src/components/app/RecipeList.tsx`
  - **Estimated tests:** 10-12
  - **Coverage target:** 80%
  - **Commit message:** `test: add RecipeList component tests (11 tests)`

- [ ] **TASK 28:** `tests/unit/components/app/RecipePreview.test.tsx`
  - **Source:** `src/components/app/RecipePreview.tsx`
  - **Estimated tests:** 6-8
  - **Coverage target:** 80%
  - **Commit message:** `test: add RecipePreview component tests (7 tests)`

- [ ] **TASK 29:** `tests/unit/components/app/SearchBar.test.tsx`
  - **Source:** `src/components/app/SearchBar.tsx`
  - **Estimated tests:** 8-10
  - **Coverage target:** 85%
  - **Commit message:** `test: add SearchBar component tests (9 tests)`

- [ ] **TASK 30:** `tests/unit/components/app/SortSelect.test.tsx`
  - **Source:** `src/components/app/SortSelect.tsx`
  - **Estimated tests:** 6-8
  - **Coverage target:** 85%
  - **Commit message:** `test: add SortSelect component tests (7 tests)`

- [ ] **TASK 31:** `tests/unit/components/app/TagFilterChips.test.tsx`
  - **Source:** `src/components/app/TagFilterChips.tsx`
  - **Estimated tests:** 7-9
  - **Coverage target:** 80%
  - **Commit message:** `test: add TagFilterChips component tests (8 tests)`

### ⏭️ Profile Components (3/18)

- [ ] **TASK 32:** `tests/unit/components/profile/TagsInput.test.tsx`
  - **Source:** `src/components/profile/TagsInput.tsx`
  - **Estimated tests:** 10-12
  - **Coverage target:** 85%
  - **Commit message:** `test: add TagsInput component tests (11 tests)`

- [ ] **TASK 33:** `tests/unit/components/profile/DietTypeSelect.test.tsx`
  - **Source:** `src/components/profile/DietTypeSelect.tsx`
  - **Estimated tests:** 5-7
  - **Coverage target:** 85%
  - **Commit message:** `test: add DietTypeSelect component tests (6 tests)`

- [ ] **TASK 34:** `tests/unit/components/ProfileForm.test.tsx`
  - **Source:** `src/components/ProfileForm.tsx`
  - **Estimated tests:** 12-15
  - **Coverage target:** 80%
  - **Commit message:** `test: add ProfileForm component tests (13 tests)`

### ⏭️ Other App Components (6/18)

- [ ] **TASK 35:** `tests/unit/components/app/GeneratorPanel.test.tsx`
  - **Source:** `src/components/app/GeneratorPanel.tsx`
  - **Estimated tests:** 8-10
  - **Coverage target:** 80%
  - **Commit message:** `test: add GeneratorPanel component tests (9 tests)`

- [ ] **TASK 36:** `tests/unit/components/app/GenerateButton.test.tsx`
  - **Source:** `src/components/app/GenerateButton.tsx`
  - **Estimated tests:** 5-7
  - **Coverage target:** 85%
  - **Commit message:** `test: add GenerateButton component tests (6 tests)`

- [ ] **TASK 37:** `tests/unit/components/app/SaveButton.test.tsx`
  - **Source:** `src/components/app/SaveButton.tsx`
  - **Estimated tests:** 5-7
  - **Coverage target:** 85%
  - **Commit message:** `test: add SaveButton component tests (6 tests)`

- [ ] **TASK 38:** `tests/unit/components/app/DeleteButton.test.tsx`
  - **Source:** `src/components/app/DeleteButton.tsx`
  - **Estimated tests:** 5-7
  - **Coverage target:** 85%
  - **Commit message:** `test: add DeleteButton component tests (6 tests)`

- [ ] **TASK 39:** `tests/unit/components/app/EmptyState.test.tsx`
  - **Source:** `src/components/app/EmptyState.tsx`
  - **Estimated tests:** 4-5
  - **Coverage target:** 90%
  - **Commit message:** `test: add EmptyState component tests (4 tests)`

- [ ] **TASK 40:** `tests/unit/components/app/ErrorPanel.test.tsx`
  - **Source:** `src/components/app/ErrorPanel.tsx`
  - **Estimated tests:** 5-6
  - **Coverage target:** 85%
  - **Commit message:** `test: add ErrorPanel component tests (5 tests)`

---

## 🎯 MILESTONE 5: Services & AI (NISKI)

**Target:** 8 plików testowych | ~130 testów | 1 tydzień

### ⏭️ Services (3/8)

- [ ] **TASK 41:** `tests/unit/services/recipes.service.test.ts`
  - **Source:** `src/lib/services/recipes.service.ts`
  - **Estimated tests:** 15-18
  - **Coverage target:** 80%
  - **Commit message:** `test: add recipes service tests (16 tests)`

- [ ] **TASK 42:** `tests/unit/services/profiles.service.test.ts`
  - **Source:** `src/lib/services/profiles.service.ts`
  - **Estimated tests:** 12-15
  - **Coverage target:** 80%
  - **Commit message:** `test: add profiles service tests (13 tests)`

- [ ] **TASK 43:** `tests/unit/services/events.service.test.ts`
  - **Source:** `src/lib/services/events.service.ts`
  - **Estimated tests:** 8-10
  - **Coverage target:** 75%
  - **Commit message:** `test: add events service tests (9 tests)`

### ⏭️ AI Utilities (2/8)

- [ ] **TASK 44:** `tests/unit/services/ai/utils/recipe-prompt-builder.test.ts`
  - **Source:** `src/lib/services/ai/utils/recipe-prompt-builder.ts`
  - **Estimated tests:** 12-15
  - **Coverage target:** 85%
  - **Commit message:** `test: add recipe prompt builder tests (13 tests)`

- [ ] **TASK 45:** `tests/unit/services/ai/utils/recipe-response-parser.test.ts`
  - **Source:** `src/lib/services/ai/utils/recipe-response-parser.ts`
  - **Estimated tests:** 15-18
  - **Coverage target:** 85%
  - **Commit message:** `test: add recipe response parser tests (16 tests)`

### ⏭️ AI Providers (3/8)

- [ ] **TASK 46:** `tests/unit/services/ai/providers/mock.provider.test.ts`
  - **Source:** `src/lib/services/ai/providers/mock.provider.ts`
  - **Estimated tests:** 8-10
  - **Coverage target:** 90%
  - **Commit message:** `test: add mock AI provider tests (9 tests)`

- [ ] **TASK 47:** `tests/unit/services/ai/providers/google.provider.test.ts`
  - **Source:** `src/lib/services/ai/providers/google.provider.ts`
  - **Estimated tests:** 15-18
  - **Coverage target:** 75%
  - **Commit message:** `test: add Google AI provider tests (16 tests)`

- [ ] **TASK 48:** `tests/unit/services/ai/providers/openrouter.provider.test.ts`
  - **Source:** `src/lib/services/ai/providers/openrouter.provider.ts`
  - **Estimated tests:** 15-18
  - **Coverage target:** 75%
  - **Commit message:** `test: add OpenRouter provider tests (16 tests)`

### ⏭️ AI Service (1/8)

- [ ] **TASK 49:** `tests/unit/services/ai/ai.service.test.ts`
  - **Source:** `src/lib/services/ai/ai.service.ts`
  - **Estimated tests:** 20-25
  - **Coverage target:** 80%
  - **Commit message:** `test: add AI service orchestration tests (22 tests)`

---

## 🎯 INTEGRATION TESTS

**Target:** 2 pliki dodatkowe

- [x] **TASK 50:** `tests/integration/api.test.ts` ✅
  - **Estimated tests:** 3
  - **Status:** Already completed

- [ ] **TASK 51:** `tests/integration/recipe-flow.test.ts`
  - **Estimated tests:** 10-12
  - **Coverage target:** N/A (integration)
  - **Commit message:** `test: add recipe flow integration tests (11 tests)`

---

## 🎯 E2E TESTS

**Target:** 1 plik już istnieje

- [x] **TASK 52:** `e2e/example.spec.ts` ✅
  - **Estimated tests:** 5
  - **Status:** Already completed

---

## 📋 Quick Reference

### Priorytety KRYTYCZNY + WYSOKI (Milestones 1-3)

```bash
# 22 tasks total dla priorytetów wysokich
TASK 1-6   → Milestone 1 (Fundamenty)
TASK 7-17  → Milestone 2 (UI & Hooks)
TASK 18-22 → Milestone 3 (Auth)
```

### Workflow dla każdego taska:

```bash
# 1. Zaznacz task jako "in progress"
# 2. Stwórz plik testowy
# 3. Napisz testy
# 4. Uruchom: npm run test:watch
# 5. Sprawdź coverage: npm run test:coverage
# 6. Commit z zaproponowanym message
# 7. Zaznacz task jako "completed" ✅
# 8. Przejdź do następnego taska
```

### Tracking Progress

Aktualizuj `Progress Overview` na górze po każdym zadaniu:
```
Completed:    3/52 (6%)   ← increment po każdym tasku
In Progress:  1/52        ← zawsze max 1
```

---

## 📊 Coverage Checkpoints

Po każdym Milestone sprawdź coverage:

```bash
npm run test:coverage
```

**Milestones coverage targets:**
- Milestone 1: >90% core utilities
- Milestone 2: >85% UI components
- Milestone 3: >85% auth
- Milestone 4: >80% app components
- Milestone 5: >75% services/AI

---

*Last updated: 2025-10-25*
*Next task: TASK 1 - cursor.test.ts*
