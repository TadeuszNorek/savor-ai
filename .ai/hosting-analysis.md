# Analiza opcji hostingu i rekomendacje (SavorAI)

## 1. Analiza Głównego Frameworka

- Framework i model: Astro 5 + React 19 z adapterem `@astrojs/node` (tryb standalone, SSR w długotrwałym procesie Node). Aplikacja uruchamiana jako serwer HTTP (port 3000/3001), bez cold‑startów funkcji.
- Implikacje: Najprościej hostować jako kontener/VM lub na platformie wspierającej stały proces Node. Migracja do serverless/edge wymaga zmiany adaptera (Vercel/Netlify/Cloudflare) i weryfikacji zależności pod środowisko bez pełnego Node API.
- Backend: Supabase (DB/Auth/Storage) jako usługa zarządzana – brak potrzeby hostowania bazy/aplikacji API; kluczowe jest bezpieczne przekazanie zmiennych środowiskowych i separacja środowisk.
- Narzędzia: Node 22.14.0, Vite, Vitest/Playwright – bez wpływu na runtime, ale determinują pipeline build/test.

## 2. Rekomendowane Usługi Hostingowe (adaptery oficjalnie wspierane przez Astro)

- Vercel (adapter `@astrojs/vercel`)
  - SSR w Functions/Edge, świetna DX, automatyczne Preview dla PR.
- Netlify (adapter `@astrojs/netlify`)
  - SSR w Functions/Edge, dobre “Deploy Previews”, prosty setup envów.
- Cloudflare Pages/Workers (adapter `@astrojs/cloudflare`)
  - SSR na edge (Workers), bardzo korzystny koszt przy małym ruchu, globalny edge.

## 3. Alternatywne Platformy (bez zmiany adaptera, konteneryzacja)

- Google Cloud Run
  - Uruchamianie kontenerów, scale‑to‑zero, płatność „za użycie”, pełny runtime Node – zgodny 1:1 z lokalnym SSR.
- Fly.io
  - Lekki PaaS dla kontenerów/VM blisko użytkownika, szybkie rollouty/rollbacki, niski próg kosztowy.

## 4. Krytyka Rozwiązań (a–d)

- Vercel
  - a) Złożoność: niska (git‑push). Wymaga zmiany adaptera i weryfikacji kodu pod serverless/edge.
  - b) Kompatybilność: bardzo dobra z Astro; uwaga na biblioteki wymagające pełnego `node:*` (np. `fs`).
  - c) Multi‑env: bardzo dobre (Preview/Branch/Prod, sekrety per env, PR builds).
  - d) Plany: darmowy z limitami buildów i funkcji; koszty funkcji/edge rosną ze zużyciem (ważne przy komercjalizacji).

- Netlify
  - a) Złożoność: niska; podobnie jak Vercel, wymaga adaptera.
  - b) Kompatybilność: dobra; sporadyczne różnice zachowania Functions vs lokalny SSR.
  - c) Multi‑env: świetne (Deploy Previews, context‑based env vars).
  - d) Plany: free z limitami; płatne rozsądne, ale bursty funkcji mogą podnieść koszty.

- Cloudflare Pages/Workers
  - a) Złożoność: niska/średnia – adapter + dostosowanie do środowiska edge (brak pełnego Node API).
  - b) Kompatybilność: bardzo dobra dla „edge‑safe” kodu; weryfikacja bibliotek wymagana.
  - c) Multi‑env: bardzo dobre (Vars/Secrets per env, preview deployments).
  - d) Plany: bardzo niskie koszty na start; limity CPU/request, ograniczenia darmowego planu dla komercji do analizy.

- Google Cloud Run
  - a) Złożoność: średnia – kontener (Dockerfile), konfiguracja usługi i CI/CD; w zamian pełna kontrola.
  - b) Kompatybilność: pełny Node, bez zmiany adaptera – zgodność z lokalnym uruchomieniem.
  - c) Multi‑env: dojrzałe (oddzielne serwisy/rewizje, Cloud Build/Secrets Manager/IAM).
  - d) Plany: darmowe pule + scale‑to‑zero – tanio na start; koszty rosną przewidywalnie z ruchem.

- Fly.io
  - a) Złożoność: średnia – kontener + `fly.toml`; proste wdrożenia i auto‑scaling w wielu regionach.
  - b) Kompatybilność: pełny Node, brak zmian w adapterze; dobre dla SSR.
  - c) Multi‑env: osobne aplikacje/org‑i, sekrety per env; łatwa separacja staging/preview.
  - d) Plany: niskie koszty „hobby” i przy małym ruchu; zwrócić uwagę na egress/bursty przy wzroście.

## 5. Oceny Platform

- Google Cloud Run — 9/10
  - Bez zmiany adaptera, konteneryzacja minimalizuje migracje; bardzo dobra ścieżka skalowania komercyjnego; nieco wyższy próg startu (Docker/IAM).
- Vercel — 8/10
  - Topowa DX i pre‑view; wymaga adaptera i edge/serverless‑safe zależności; potencjalny vendor lock‑in i koszty funkcji przy wzroście.
- Fly.io — 8/10
  - Tanie, elastyczne, globalne; pełny Node; mniejszy „enterprise” ekosystem niż hyperscalers; uwaga na egress.
- Netlify — 7.5/10
  - Prosty start, dobre pre‑view; podobne uwagi jak Vercel dot. serverless i kosztów funkcji przy skali.
- Cloudflare Pages/Workers — 7/10
  - Bardzo tanie i szybkie na edge; wymagania „edge‑safe” i limity CPU/request mogą ograniczać bardziej złożone SSR.

---

Rekomendacja: dla minimalizacji przyszłych migracji i kontroli kosztów – konteneryzacja i wdrożenie na Google Cloud Run (lub Fly.io, jeśli preferujesz prostotę i niski koszt startowy). Jeśli priorytetem jest DX i szybkie podglądy PR – Vercel/Netlify z adapterem Astro, z założeniem możliwych refaktorów przy wzroście i świadomości modelu kosztowego funkcji/edge.

---
---

# INSTRUKCJA DEPLOYMENT NA VERCEL (Quick Start)

**Data:** 2025-11-13
**Cel:** Prosty, szybki deployment dla demonstracji aplikacji (bez skomplikowanych procesów, feature flags)
**Założenie:** Kod jest kompatybilny z Vercel serverless (zweryfikowano - brak Node.js-specific APIs w runtime)

---

## KROK 1: Przygotowanie Kodu (5 min)

### 1.1 Instalacja Adaptera
```bash
npm install @astrojs/vercel
```

### 1.2 Modyfikacja `astro.config.mjs`

**PRZED:**
```javascript
import node from "@astrojs/node";

adapter: node({
  mode: "standalone",
}),
```

**PO:**
```javascript
import vercel from "@astrojs/vercel/serverless";

adapter: vercel(),
```

### 1.3 Commit i Push
```bash
git add .
git commit -m "Configure Vercel adapter for deployment"
git push origin feat/release-prep
```

---

## KROK 2: Założenie Konta Vercel (2 min)

1. Przejdź na: https://vercel.com
2. Kliknij **"Sign Up"**
3. Wybierz **"Continue with GitHub"** (rekomendowane dla automatycznego CI/CD)
4. Autoryzuj Vercel w GitHub

---

## KROK 3: Import Projektu (3 min)

### 3.1 Dodaj Nowy Projekt
1. W Vercel Dashboard kliknij **"Add New..." → "Project"**
2. Vercel wyświetli listę repozytoriów z GitHub

### 3.2 Import Repository
1. Znajdź **"savor-ai"** na liście
2. Kliknij **"Import"**

### 3.3 Konfiguracja Build
Vercel automatycznie wykryje Astro. Zweryfikuj ustawienia:

```
Framework Preset: Astro (auto-detected)
Build Command: npm run build
Output Directory: dist
Install Command: npm install
Node Version: 18.x lub wyższy
Root Directory: ./
```

**⚠️ WAŻNE:** NIE klikaj jeszcze "Deploy" - najpierw skonfiguruj zmienne środowiskowe!

---

## KROK 4: Zmienne Środowiskowe (5 min)

### 4.1 Lokalizacja
Na stronie konfiguracji projektu przewiń do sekcji **"Environment Variables"**

### 4.2 Lista Zmiennych do Dodania

Przepisz **wszystkie** zmienne z lokalnego pliku `.env`:

**Supabase (WYMAGANE):**
```
SUPABASE_URL=https://twoj-projekt.supabase.co
SUPABASE_KEY=twoj_anon_key
PUBLIC_SUPABASE_URL=https://twoj-projekt.supabase.co
PUBLIC_SUPABASE_KEY=twoj_anon_key
SUPABASE_SERVICE_ROLE_KEY=twoj_service_role_key
```

**AI Provider (WYMAGANE):**
```
AI_PROVIDER=google
# lub: AI_PROVIDER=openrouter
# lub: AI_PROVIDER=mock (dla testów)
```

**Google AI Studio (jeśli AI_PROVIDER=google):**
```
GOOGLE_API_KEY=twoj_google_api_key
AI_MODEL=gemini-1.5-flash
```

**OpenRouter (jeśli AI_PROVIDER=openrouter):**
```
OPENROUTER_API_KEY=twoj_openrouter_api_key
AI_MODEL=deepseek/deepseek-r1-0528:free
```

**Opcjonalne:**
```
AI_TIMEOUT_MS=30000
```

### 4.3 Procedura Dodawania
Dla każdej zmiennej:
1. **Key:** nazwa zmiennej (np. `SUPABASE_URL`)
2. **Value:** wartość ze swojego `.env`
3. **Environments:** zostaw wszystkie zaznaczone (Production, Preview, Development)
4. Kliknij **"Add"**

---

## KROK 5: Deploy (2 min)

1. Po dodaniu wszystkich zmiennych kliknij **"Deploy"**
2. Vercel rozpocznie build - na żywo zobaczysz logi
3. Czas buildu: ~2-3 minuty (pierwszy build najdłuższy)
4. Po zakończeniu zobaczysz: **"Congratulations!"** 🎉

---

## KROK 6: Weryfikacja Działania (1 min)

1. Vercel wyświetli URL aplikacji: `https://savor-ai-xxxx.vercel.app`
2. Kliknij **"Visit"** lub otwórz w przeglądarce
3. **Testy funkcjonalne:**
   - [ ] Strona główna się ładuje
   - [ ] Logowanie działa
   - [ ] Rejestracja działa
   - [ ] Generowanie przepisu działa
   - [ ] Zapisywanie przepisu działa
   - [ ] Lista przepisów się wyświetla

---

## KROK 7: Własna Domena (OPCJONALNIE)

Jeśli chcesz użyć własnej domeny:

1. W Vercel Dashboard → Twój projekt → **"Settings" → "Domains"**
2. Kliknij **"Add"** i wpisz swoją domenę
3. Skonfiguruj DNS według instrukcji Vercel:
   - Typ A: wskazuje na IP Vercel
   - Lub CNAME: wskazuje na `cname.vercel-dns.com`
4. Poczekaj na propagację DNS (zwykle 15 min - 24h)

---

## AUTOMATYZACJA (Działa od Razu!)

### Continuous Deployment
- **Git Push → Auto Deploy:** Każdy push na GitHub automatycznie triggeruje build i deployment
- **Preview Deployments:** Każdy Pull Request dostaje unikalny URL
  ```
  https://savor-ai-git-branch-name-xxxx.vercel.app
  ```
- **Production:** Merge do `master` → deployment na główny URL

### Rollback
- Vercel przechowuje wszystkie deploymenty
- Można wrócić do poprzedniej wersji jednym kliknięciem

---

## ZARZĄDZANIE PO DEPLOYMENCIE

### Aktualizacja Zmiennych Środowiskowych
1. Vercel Dashboard → Projekt → **"Settings" → "Environment Variables"**
2. Znajdź zmienną i kliknij **"Edit"**
3. Zapisz zmianę
4. **WAŻNE:** Idź do **"Deployments"** → kliknij ostatni deployment → **"Redeploy"**

### Podgląd Logów
1. Vercel Dashboard → Projekt → **"Deployments"**
2. Kliknij na deployment
3. Zakładka **"Functions"** → wybierz funkcję API (np. `/api/recipes/generate`)
4. Zobacz logi w czasie rzeczywistym

### Monitoring Błędów
1. Vercel automatycznie loguje wszystkie `console.error()` i `console.log()`
2. W zakładce **"Logs"** możesz filtrować po:
   - Function name (endpoint)
   - Timestamp
   - Error level

### Rollback do Poprzedniej Wersji
1. **"Deployments"** → znajdź działającą wersję
2. Kliknij **"⋮" (menu)** → **"Promote to Production"**
3. Deployment natychmiast zostanie przywrócony

---

## TROUBLESHOOTING

### ❌ Build Failed
**Objawy:** Czerwony status w Vercel, komunikat "Build failed"

**Rozwiązanie:**
1. Sprawdź logi buildu w Vercel (kliknij na failed deployment)
2. Zweryfikuj lokalnie: `npm run build` (musi działać!)
3. Sprawdź Node version w Vercel Settings → General → Node.js Version (ustaw ≥18.x)
4. Sprawdź czy `package.json` ma poprawne dependencje

### ❌ Strona się ładuje, ale API nie działa (500/502)
**Objawy:** Frontend działa, ale requesty do `/api/*` zwracają błędy

**Rozwiązanie:**
1. Sprawdź **Functions logs** w Vercel dla konkretnego endpointu
2. Zweryfikuj czy **wszystkie** zmienne środowiskowe są ustawione:
   - `SUPABASE_URL`, `SUPABASE_KEY`, `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_KEY`
   - `AI_PROVIDER`, odpowiedni API key (`GOOGLE_API_KEY` lub `OPENROUTER_API_KEY`)
3. Sprawdź czy zmienne `PUBLIC_*` są widoczne w przeglądarce (DevTools → Console → `import.meta.env`)

### ❌ Błędy Supabase Auth
**Objawy:** "Invalid JWT", "Unauthorized", problemy z logowaniem

**Rozwiązanie:**
1. W Supabase Dashboard → **Settings → API** sprawdź:
   - URL i klucze są poprawne
   - W sekcji **"Site URL"** dodaj domeny Vercel:
     ```
     https://savor-ai-xxxx.vercel.app
     https://savor-ai-git-*.vercel.app  (dla preview)
     ```
   - W sekcji **"Redirect URLs"** dodaj te same domeny
2. Sprawdź czy cookies są ustawiane (DevTools → Application → Cookies)

### ❌ AI Generation Timeout (503)
**Objawy:** "AI service timed out", 503 po ~30s

**Rozwiązanie:**
1. Vercel Functions mają limit 10s (Hobby plan) lub 60s (Pro plan)
2. Sprawdź czy `AI_TIMEOUT_MS` jest ustawiony odpowiednio
3. W przypadku Google AI Studio - użyj szybszego modelu (np. `gemini-1.5-flash`)
4. Rozważ upgrade planu Vercel dla dłuższych timeoutów

### ❌ Environment Variables nie działają
**Objawy:** `undefined` w kodzie, gdzie powinny być zmienne

**Rozwiązanie:**
1. Sprawdź czy zmienne są ustawione dla **wszystkich środowisk** (Production, Preview, Development)
2. Po zmianie zmiennych **MUSISZ** zrobić redeploy (nie wystarczy tylko zapisać)
3. Zmienne `PUBLIC_*` są dostępne w przeglądarce, pozostałe tylko server-side
4. W Vercel Settings → Environment Variables sprawdź czy nie ma literówek w nazwach

---

## WERYFIKACJA KOMPATYBILNOŚCI KODU (Wykonano: 2025-11-13)

### ✅ Sprawdzone Komponenty
- **API Routes:** Brak Node.js-specific APIs (fs, path w runtime) ✅
- **Dependencies:** uuid, zod, @supabase/supabase-js - wszystkie kompatybilne z serverless ✅
- **Environment Variables:** Używa `import.meta.env` zamiast `process.env` ✅
- **Request/Response:** Standard Web APIs ✅

### ⚠️ Potencjalne Zagrożenia (Monitorować)
- AI timeouts przy wolnych odpowiedziach (limit 10s/60s w zależności od planu)
- Rozmiar payloadu generowanych przepisów (Vercel limit: 4.5MB response)

---

## CHECKLIST DEPLOYMENT

Przed kliknięciem "Deploy":
- [ ] Zainstalowany `@astrojs/vercel`
- [ ] Zmieniony adapter w `astro.config.mjs`
- [ ] Zcommitowane i zpushowane zmiany
- [ ] Założone konto Vercel (połączone z GitHub)
- [ ] Zaimportowany projekt
- [ ] Dodane **WSZYSTKIE** zmienne środowiskowe (Supabase + AI Provider)
- [ ] Node version ≥18.x w Vercel settings

Po deploymencie:
- [ ] Strona główna ładuje się poprawnie
- [ ] Logowanie/rejestracja działa
- [ ] Generowanie przepisu działa
- [ ] Zapisywanie przepisu działa
- [ ] Logi w Vercel nie pokazują błędów
- [ ] W Supabase Dashboard dodane domeny Vercel (Site URL + Redirect URLs)

---

## KOSZTY I LIMITY (Plan Hobby/Free)

**Limity darmowego planu Vercel:**
- **Bandwidth:** 100 GB/miesiąc
- **Function executions:** 100 GB-Hours/miesiąc
- **Function duration:** 10s timeout (maxDuration)
- **Build time:** 100 hours/miesiąc
- **Deployments:** Unlimited
- **Team members:** 1 (tylko Ty)

**Oszacowanie dla demonstracji/kursu:**
- ~100 użytkowników/miesiąc × ~10 requestów = 1000 requestów
- Średni czas funkcji: ~500ms
- **Zużycie:** ~0.14 GB-Hours (0.14% limitu)

**Wniosek:** Darmowy plan w zupełności wystarczy dla celu demonstracyjnego.

---

## NASTĘPNE KROKI PO WDROŻENIU

1. **Monitoring:** Regularnie sprawdzaj logi w Vercel (zwłaszcza po pierwszych użyciach)
2. **Supabase:** Monitoruj użycie bazy w Supabase Dashboard
3. **AI API:** Śledź zużycie kredytów w Google AI Studio / OpenRouter
4. **Feedback:** Zbieraj feedback od prowadzących kursu
5. **Dokumentacja:** Zapisz URL aplikacji + dane logowania dla prowadzących

---

**KONIEC INSTRUKCJI**
